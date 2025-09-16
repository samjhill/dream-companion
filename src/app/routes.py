import json
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from functools import wraps
import boto3
import os
import urllib.parse
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

        if 'Contents' in response:
            # Filter out metadata and themes files, sort by creation date (newest first)
            dream_keys = []
            for obj in response['Contents']:
                key = obj['Key']
                if not key.endswith('metadata.json') and not key.endswith('metadata') and not key.endswith('themes.txt'):
                    dream_keys.append({
                        'key': key,
                        'lastModified': obj['LastModified']
                    })

            # Sort by last modified date (newest first)
            dream_keys.sort(key=lambda x: x['lastModified'], reverse=True)

            # Apply pagination
            total_dreams = len(dream_keys)
            paginated_dreams = dream_keys[offset:offset + limit]

            dream_keys = [{'key': dream['key']} for dream in paginated_dreams]
            print(f"DEBUG: Returning {len(dream_keys)} dreams for user {phone_number}")
            for i, dream in enumerate(dream_keys):
                print(f"DEBUG: Dream {i+1}: {dream['key']}")
            
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

        # Handle response field safely - it might be a list or string
        response_text = ""
        if "response" in dream_content:
            if isinstance(dream_content["response"], list):
                response_text = " ".join(dream_content["response"])
            else:
                response_text = str(dream_content["response"])
        
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
            **dream_content,
            "response": response_text,
            "dream_content": decoded_content,
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
            "debug_final_dream_content": to_return['dream_content'][:200] if to_return['dream_content'] else "EMPTY"
        }
        
        to_return["_debug"] = debug_info
        return jsonify(to_return), 200

    except s3_client.exceptions.NoSuchKey:
        return jsonify({"error": "Dream not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid dream data format"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dream: {str(e)}"}), 500

