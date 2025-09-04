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
s3_client = boto3.client('s3')

@routes_bp.route('/', methods=['GET'])
def api_health_check():
    """Health check endpoint for the API"""
    print("Received health check request")
    return jsonify({"status": "OK"}), 200

@routes_bp.route('/<path:proxy>', methods=['OPTIONS'])
def handle_options(proxy):
    """Handle OPTIONS requests for CORS preflight"""
    response = jsonify({"status": "OK"})
    return add_cors_headers(response), 200

@routes_bp.route('/themes/<phone_number>', methods=['GET'])
@require_auth
@cross_origin(supports_credentials=True)
def get_themes(phone_number):
    """Retrieve themes for a specific phone number"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

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
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/'
        )

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

            return jsonify({
                'dreams': [{'key': dream['key']} for dream in paginated_dreams],
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
        key = f'{phone_number}/{dream_id}'
        response = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key=key
        )

        dream_content = json.loads(response['Body'].read().decode('utf-8'))

        to_return = {
            **dream_content,
            "response": " ".join(dream_content["response"]),
            "dream_content": urllib.parse.unquote_plus(dream_content["dreamContent"])
        }
        return jsonify(to_return), 200

    except s3_client.exceptions.NoSuchKey:
        return jsonify({"error": "Dream not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid dream data format"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dream: {str(e)}"}), 500

