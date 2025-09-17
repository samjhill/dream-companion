import json
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from functools import wraps
import boto3
import os
import urllib.parse
from datetime import datetime
from dotenv import load_dotenv
from .auth import require_cognito_auth, get_cognito_user_info

load_dotenv()

routes_bp = Blueprint('routes_bp', __name__)

# Constants
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
FRONTEND_ORIGIN = 'https://clarasdreamguide.com'

# Use the new Cognito authentication decorator
require_auth = require_cognito_auth

def add_cors_headers(response):
    """Add CORS headers to response"""
    response.headers.add('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Initialize S3 client
def get_s3_client():
    """Get S3 client - can be mocked for testing"""
    return boto3.client('s3')

@routes_bp.route('/', methods=['GET'])
@cross_origin(supports_credentials=True)
def api_health_check():
    """Health check endpoint for the API"""
    print("Received health check request")
    return jsonify({"status": "OK"}), 200

@routes_bp.route('/debug/test', methods=['GET'])
@cross_origin(supports_credentials=True)
def debug_test():
    """Debug test endpoint"""
    print("DEBUG: Test endpoint called")
    return jsonify({"debug": "Test endpoint working", "timestamp": "2025-09-16T12:00:00Z"}), 200

@routes_bp.route('/share-art', methods=['POST'])
@require_auth
@cross_origin(supports_credentials=True)
def share_dream_art():
    """Share dream art via SMS"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ['fromPhone', 'toPhone', 'message', 'imageData']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        from_phone = data['fromPhone']
        to_phone = data['toPhone']
        message = data['message']
        image_data = data['imageData']
        art_config = data.get('artConfig', {})
        dream_count = data.get('dreamCount', 0)
        
        # Validate phone numbers
        if not to_phone or len(to_phone.replace('+', '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '')) < 10:
            return jsonify({"error": "Invalid recipient phone number"}), 400
        
        # Format phone number for SMS
        clean_phone = to_phone.replace('+', '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
        if len(clean_phone) == 10:
            formatted_phone = f"+1{clean_phone}"
        elif len(clean_phone) == 11 and clean_phone.startswith('1'):
            formatted_phone = f"+{clean_phone}"
        else:
            formatted_phone = f"+{clean_phone}"
        
        # Create a unique art ID for the shared piece
        import uuid
        art_id = str(uuid.uuid4())
        
        # Store the art data in S3 for sharing
        if S3_BUCKET_NAME:
            s3_client = get_s3_client()
            
            # Create art metadata
            art_metadata = {
                'artId': art_id,
                'fromPhone': from_phone,
                'toPhone': formatted_phone,
                'message': message,
                'artConfig': art_config,
                'dreamCount': dream_count,
                'createdAt': datetime.now().isoformat(),
                'imageData': image_data
            }
            
            # Store in S3
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=f'shared-art/{art_id}.json',
                Body=json.dumps(art_metadata),
                ContentType='application/json'
            )
            
            # Create shareable link
            share_link = f"https://clarasdreamguide.com/shared-art/{art_id}"
            
            # Create SMS message with link
            sms_message = f"{message}\n\n{share_link}\n\n🎭 Generated from {dream_count} dream{'s' if dream_count != 1 else ''} • Style: {art_config.get('style', 'unique')}"
            
            # Send SMS (you'll need to implement SMS sending here)
            # For now, we'll just return success
            # In production, you'd integrate with Twilio, AWS SNS, or similar
            
            return jsonify({
                "success": True,
                "message": "Art shared successfully",
                "artId": art_id,
                "shareLink": share_link,
                "smsMessage": sms_message
            }), 200
        else:
            return jsonify({"error": "S3 bucket not configured"}), 500
            
    except Exception as e:
        print(f"Error sharing art: {str(e)}")
        return jsonify({"error": f"Failed to share art: {str(e)}"}), 500

@routes_bp.route('/<path:proxy>', methods=['OPTIONS'])
@cross_origin(supports_credentials=True)
def handle_options(proxy):
    """Handle OPTIONS requests for CORS preflight"""
    response = jsonify({"status": "OK"})
    return response, 200

@routes_bp.route('/themes/<phone_number>', methods=['GET'])
@require_auth
@cross_origin(supports_credentials=True)
def get_themes(phone_number):
    """Retrieve themes for a specific phone number"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        s3_client = get_s3_client()
        response = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key=f'{phone_number}/themes.txt'
        )

        return response['Body'].read(), 200
    except s3_client.exceptions.NoSuchKey:
        return jsonify({"error": "Themes not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve themes: {str(e)}"}), 500

@routes_bp.route('/dreams/<phone_number>', methods=['GET'])
@require_auth
@cross_origin(supports_credentials=True)
def get_dreams(phone_number):
    """Retrieve paginated list of dreams for a specific phone number"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        # Get pagination parameters
        limit = request.args.get('limit', default=10, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # List all objects in the user's S3 directory
        s3_client = get_s3_client()
        
        # Get dreams from new path structure (s3/user/dreams/)
        new_response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/dreams/'
        )
        
        # Get dreams from old path structure for backwards compatibility
        old_response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/'
        )
        
        # Debug logging to see what we found
        new_count = len(new_response.get('Contents', []))
        old_count = len(old_response.get('Contents', []))
        print(f"DEBUG: Found {new_count} objects in new path ({phone_number}/dreams/)")
        print(f"DEBUG: Found {old_count} objects in old path ({phone_number}/)")
        
        # Log some sample keys from each path
        if new_response.get('Contents'):
            print(f"DEBUG: Sample new path keys: {[obj['Key'] for obj in new_response['Contents'][:3]]}")
        if old_response.get('Contents'):
            print(f"DEBUG: Sample old path keys: {[obj['Key'] for obj in old_response['Contents'][:3]]}")
        
        # Combine dreams from both locations, avoiding duplicates
        all_contents = []
        seen_keys = set()
        
        # Add dreams from new path
        if 'Contents' in new_response:
            for obj in new_response['Contents']:
                key = obj['Key']
                if key not in seen_keys:
                    all_contents.append(obj)
                    seen_keys.add(key)
        
        # Add dreams from old path (only root-level dreams, not subdirectories)
        if 'Contents' in old_response:
            for obj in old_response['Contents']:
                key = obj['Key']
                # Only include root-level dreams (not in subdirectories) and not metadata/themes
                if (key not in seen_keys and 
                    not key.endswith('metadata.json') and 
                    not key.endswith('metadata') and 
                    not key.endswith('themes.txt') and
                    not key.startswith(f'{phone_number}/dreams/')):
                    all_contents.append(obj)
                    seen_keys.add(key)
        
        # Create a mock response object with combined contents
        response = {'Contents': all_contents}
        print(f"DEBUG: Combined total objects: {len(all_contents)}")
        print(f"DEBUG: Sample combined keys: {[obj['Key'] for obj in all_contents[:5]]}")

        if 'Contents' in response:
            # Filter out metadata and themes files, sort by S3 LastModified (newest first)
            # 
            # IMPORTANT: Due to a backfill script that modified all dreams recently, S3 LastModified 
            # timestamps reflect the backfill date, not the original creation dates. 
            # 
            # SOLUTION: A new backfill will be run to restore chronological order by updating
            # S3 LastModified timestamps to match the original creation dates from the dream content.
            # This approach is much more efficient than runtime fetching and avoids Lambda timeout issues.
            # 
            # Current approach uses S3 LastModified for sorting (efficient and reliable).
            # After the chronological backfill, dreams will be displayed in correct order.
            #
            dream_keys = []
            for obj in response['Contents']:
                key = obj['Key']
                if not key.endswith('metadata.json') and not key.endswith('metadata') and not key.endswith('themes.txt'):
                    dream_keys.append({
                        'key': key,
                        'lastModified': obj['LastModified']
                    })

            # Sort by S3 LastModified (newest first) - efficient and reliable
            dream_keys.sort(key=lambda x: x['lastModified'], reverse=True)
            print(f"DEBUG: Using S3 LastModified for sorting (backfill-aware, efficient approach)")

            # Apply pagination
            total_dreams = len(dream_keys)
            paginated_dreams = dream_keys[offset:offset + limit]

            dream_keys = [{'key': dream['key']} for dream in paginated_dreams]
            print(f"DEBUG: Returning {len(dream_keys)} dreams for user {phone_number}")
            print(f"DEBUG: Total dreams available: {total_dreams}")
            print(f"DEBUG: Pagination: offset={offset}, limit={limit}")
            
            # Show first few and last few dreams to see the range
            if len(paginated_dreams) > 0:
                print(f"DEBUG: First dream modified: {paginated_dreams[0]['lastModified']}")
                if len(paginated_dreams) > 1:
                    print(f"DEBUG: Last dream modified: {paginated_dreams[-1]['lastModified']}")
            
            for i, dream in enumerate(paginated_dreams):
                print(f"DEBUG: Dream {i+1}: {dream['key']} (modified: {dream['lastModified']})")
            
            return jsonify({
                'dreams': dream_keys,
                'total': total_dreams,
                'limit': limit,
                'offset': offset,
                'hasMore': offset + limit < total_dreams
            }), 200
        else:
            return jsonify({
                'dreams': [],
                'total': 0,
                'limit': limit,
                'offset': offset,
                'hasMore': False
            }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dreams: {str(e)}"}), 500

@routes_bp.route('/dreams/<phone_number>/<dream_id>', methods=['GET'])
@require_auth
@cross_origin(supports_credentials=True)
def get_dream(phone_number, dream_id):
    """Retrieve a specific dream by ID"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        # Retrieve the specific dream object from S3
        s3_client = get_s3_client()
        
        # Try new path structure first (s3/user/dreams/)
        key = f'{phone_number}/dreams/{dream_id}.json'
        try:
            response = s3_client.get_object(
                Bucket=S3_BUCKET_NAME,
                Key=key
            )
        except s3_client.exceptions.NoSuchKey:
            # Fallback to old path structure for backwards compatibility
            key = f'{phone_number}/{dream_id}.json'
            response = s3_client.get_object(
                Bucket=S3_BUCKET_NAME,
                Key=key
            )

        dream_content = json.loads(response['Body'].read().decode('utf-8'))
        
        # Debug logging to understand dream data structure
        print(f"DEBUG: Dream data keys: {list(dream_content.keys())}")
        print(f"DEBUG: Dream content sample: {str(dream_content)[:200]}...")
        
        # Debug specific fields we're looking for
        for field in ["dreamContent", "dream_content", "content", "text", "dream"]:
            if field in dream_content:
                value = dream_content[field]
                print(f"DEBUG: Found field '{field}': {str(value)[:100]}...")
            else:
                print(f"DEBUG: Field '{field}' not found")

        # Handle response field safely - check multiple possible field names
        response_text = ""
        analysis_fields = ["response", "analysis", "interpretation", "ai_response", "dream_analysis", "insights"]
        
        print(f"DEBUG: Checking analysis fields for dream {dream_id}:")
        for field in analysis_fields:
            if field in dream_content and dream_content[field]:
                print(f"DEBUG: Found analysis field '{field}': {str(dream_content[field])[:100]}...")
                if isinstance(dream_content[field], list):
                    response_text = " ".join(dream_content[field])
                else:
                    response_text = str(dream_content[field])
                break  # Use the first non-empty field found
            else:
                print(f"DEBUG: Analysis field '{field}' not found or empty")
        
        print(f"DEBUG: Final response_text: '{response_text[:100]}...'")
        
        # Handle createdAt field - it might be missing or have different names
        created_at = dream_content.get("createdAt") or dream_content.get("created_at") or dream_content.get("timestamp")
        if not created_at:
            # Fallback to current time if no creation date is found
            from datetime import datetime
            created_at = datetime.utcnow().isoformat()
        
        # Handle dream content field - it might have different names
        dream_content_text = (
            dream_content.get("dreamContent") or 
            dream_content.get("dream_content") or 
            dream_content.get("content") or 
            dream_content.get("text") or 
            dream_content.get("dream") or
            dream_content.get("raw_text") or  # Add raw_text field
            ""
        )
        
        # Try to decode URL encoding, but handle cases where it's not encoded
        try:
            decoded_content = urllib.parse.unquote_plus(dream_content_text)
        except Exception as e:
            print(f"DEBUG: URL decode failed: {e}, using original content")
            decoded_content = dream_content_text
        
        print(f"DEBUG: Original dream content: '{dream_content_text[:100]}...'")
        print(f"DEBUG: Decoded dream content: '{decoded_content[:100]}...'")
        
        to_return = {
            "id": dream_content.get("id", dream_id),
            "response": response_text,
            "dream_content": decoded_content,
            "summary": dream_content.get("summary", ""),
            "createdAt": created_at
        }
        
        print(f"DEBUG: Final response dream_content: '{to_return['dream_content'][:100]}...'")
        
        # Add debug information to the response for troubleshooting
        debug_info = {
            "debug_keys": list(dream_content.keys()),
            "debug_dream_content_fields": {
                "dreamContent": dream_content.get("dreamContent", "NOT_FOUND"),
                "dream_content": dream_content.get("dream_content", "NOT_FOUND"),
                "content": dream_content.get("content", "NOT_FOUND"),
                "text": dream_content.get("text", "NOT_FOUND"),
                "dream": dream_content.get("dream", "NOT_FOUND"),
                "raw_text": dream_content.get("raw_text", "NOT_FOUND")
            },
            "debug_summary_fields": {
                "response": dream_content.get("response", "NOT_FOUND"),
                "summary": dream_content.get("summary", "NOT_FOUND"),
                "analysis": dream_content.get("analysis", "NOT_FOUND"),
                "interpretation": dream_content.get("interpretation", "NOT_FOUND"),
                "title": dream_content.get("title", "NOT_FOUND"),
                "ai_response": dream_content.get("ai_response", "NOT_FOUND"),
                "dream_analysis": dream_content.get("dream_analysis", "NOT_FOUND"),
                "insights": dream_content.get("insights", "NOT_FOUND")
            },
            "debug_final_dream_content": to_return['dream_content'][:200] if to_return['dream_content'] else "EMPTY",
            "debug_final_response": to_return['response'][:200] if to_return['response'] else "EMPTY"
        }
        
        to_return["_debug"] = debug_info
        return jsonify(to_return), 200

    except s3_client.exceptions.NoSuchKey:
        return jsonify({"error": "Dream not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid dream data format"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dream: {str(e)}"}), 500

