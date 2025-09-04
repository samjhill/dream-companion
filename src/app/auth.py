from flask import Blueprint, request, jsonify
import boto3
import jwt
import json
import os
from functools import wraps
from datetime import datetime, timedelta
import requests

auth_bp = Blueprint('auth_bp', __name__)

# AWS Cognito configuration
COGNITO_REGION = 'us-east-1'
COGNITO_USER_POOL_ID = 'us-east-1_A7pHyJ90V'
COGNITO_APP_CLIENT_ID = '4ae3obdbcsojg3cn1aq7njf229'

# Cache for JWKs (JSON Web Key Set)
_jwks_cache = None
_jwks_cache_expiry = None

def get_cognito_public_keys():
    """Get the public keys from AWS Cognito for JWT verification"""
    global _jwks_cache, _jwks_cache_expiry
    
    # Check if cache is still valid (cache for 1 hour)
    if _jwks_cache and _jwks_cache_expiry and datetime.utcnow() < _jwks_cache_expiry:
        return _jwks_cache
    
    try:
        # Fetch the JWKS from Cognito
        jwks_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json'
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        
        jwks = response.json()
        _jwks_cache = jwks
        _jwks_cache_expiry = datetime.utcnow() + timedelta(hours=1)
        
        return jwks
    except Exception as e:
        print(f"Error fetching Cognito JWKS: {e}")
        return None

def get_public_key(token):
    """Get the public key for the given JWT token"""
    jwks = get_cognito_public_keys()
    if not jwks:
        return None
    
    try:
        # Decode the JWT header to get the key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # Find the matching key
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        
        return None
    except Exception as e:
        print(f"Error getting public key: {e}")
        return None

def verify_cognito_token(token):
    """Verify and decode a Cognito JWT token"""
    try:
        # Get the public key
        public_key = get_public_key(token)
        if not public_key:
            return None
        
        # Verify and decode the token
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}'
        )
        
        return decoded_token
    except jwt.ExpiredSignatureError:
        print("JWT token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        print(f"Error verifying JWT token: {e}")
        return None

def require_cognito_auth(f):
    """Decorator to require valid Cognito authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401
        
        token = auth_header.split(' ')[1]
        if not token:
            return jsonify({"error": "Invalid token format"}), 401
        
        # Verify the Cognito token
        decoded_token = verify_cognito_token(token)
        if not decoded_token:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Add user info to the request context
        request.cognito_user = decoded_token
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_cognito_user_info():
    """Get user information from the current Cognito token"""
    if not hasattr(request, 'cognito_user'):
        return None
    
    user_info = request.cognito_user
    return {
        'username': user_info.get('username'),
        'sub': user_info.get('sub'),
        'email': user_info.get('email'),
        'phone_number': user_info.get('phone_number'),
        'cognito_groups': user_info.get('cognito:groups', []),
        'token_use': user_info.get('token_use'),
        'client_id': user_info.get('client_id')
    }

@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """Verify a Cognito JWT token and return user info"""
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({"error": "Token required"}), 400
        
        token = data['token']
        decoded_token = verify_cognito_token(token)
        
        if not decoded_token:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        user_info = {
            'username': decoded_token.get('username'),
            'sub': decoded_token.get('sub'),
            'email': decoded_token.get('email'),
            'phone_number': decoded_token.get('phone_number'),
            'cognito_groups': decoded_token.get('cognito:groups', []),
            'valid': True
        }
        
        return jsonify(user_info), 200
        
    except Exception as e:
        return jsonify({"error": f"Token verification failed: {str(e)}"}), 500

@auth_bp.route('/user-info', methods=['GET'])
@require_cognito_auth
def get_user_info():
    """Get current user information from the JWT token"""
    try:
        user_info = get_cognito_user_info()
        if not user_info:
            return jsonify({"error": "No user information available"}), 401
        
        return jsonify(user_info), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get user info: {str(e)}"}), 500
