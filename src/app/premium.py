from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
import boto3
import os
import json
from datetime import datetime, timedelta
from functools import wraps

premium_bp = Blueprint('premium_bp', __name__)

# Initialize DynamoDB client for premium user management
dynamodb = boto3.resource('dynamodb')
premium_table_name = os.getenv('PREMIUM_TABLE_NAME', 'dream-companion-premium-users')

def get_premium_table():
    """Get or create the premium users table"""
    try:
        table = dynamodb.Table(premium_table_name)
        table.load()
        return table
    except:
        # Create table if it doesn't exist
        table = dynamodb.create_table(
            TableName=premium_table_name,
            KeySchema=[
                {
                    'AttributeName': 'phone_number',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'phone_number',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
        return table

def require_premium(f):
    """Decorator to require premium subscription for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401
        
        # Get user phone number from request
        phone_number = request.view_args.get('phone_number')
        if not phone_number:
            return jsonify({"error": "Phone number required"}), 400
        
        # Check if user has premium access
        if not is_premium_user(phone_number):
            return jsonify({"error": "Premium subscription required"}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def is_premium_user(phone_number: str) -> bool:
    """Check if a user has an active premium subscription"""
    try:
        table = get_premium_table()
        response = table.get_item(Key={'phone_number': phone_number})
        
        if 'Item' not in response:
            return False
        
        user_data = response['Item']
        subscription_end = datetime.fromisoformat(user_data['subscription_end'])
        
        return datetime.utcnow() < subscription_end
    except Exception as e:
        print(f"Error checking premium status: {e}")
        return False

@premium_bp.route('/subscription/status/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_subscription_status(phone_number):
    """Get the current subscription status for a user"""
    try:
        table = get_premium_table()
        response = table.get_item(Key={'phone_number': phone_number})
        
        if 'Item' not in response:
            return jsonify({
                'is_premium': False,
                'subscription_type': None,
                'subscription_end': None,
                'features': ['basic_dream_storage', 'basic_interpretations']
            }), 200
        
        user_data = response['Item']
        is_premium = datetime.utcnow() < datetime.fromisoformat(user_data['subscription_end'])
        
        return jsonify({
            'is_premium': is_premium,
            'subscription_type': user_data.get('subscription_type', 'premium'),
            'subscription_end': user_data['subscription_end'],
            'features': user_data.get('features', [
                'basic_dream_storage', 
                'basic_interpretations',
                'advanced_dream_analysis',
                'psychological_patterns',
                'dream_archetypes',
                'historical_trends',
                'personalized_reports'
            ])
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get subscription status: {str(e)}"}), 500

@premium_bp.route('/subscription/create', methods=['POST'])
@cross_origin(supports_credentials=True)
def create_subscription():
    """Create a new premium subscription"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        subscription_type = data.get('subscription_type', 'premium')
        duration_months = data.get('duration_months', 1)
        
        if not phone_number:
            return jsonify({"error": "Phone number required"}), 400
        
        # Calculate subscription end date
        subscription_end = datetime.utcnow() + timedelta(days=30 * duration_months)
        
        table = get_premium_table()
        table.put_item(Item={
            'phone_number': phone_number,
            'subscription_type': subscription_type,
            'subscription_start': datetime.utcnow().isoformat(),
            'subscription_end': subscription_end.isoformat(),
            'duration_months': duration_months,
            'features': [
                'basic_dream_storage', 
                'basic_interpretations',
                'advanced_dream_analysis',
                'psychological_patterns',
                'dream_archetypes',
                'historical_trends',
                'personalized_reports'
            ]
        })
        
        return jsonify({
            "message": "Subscription created successfully",
            "subscription_end": subscription_end.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to create subscription: {str(e)}"}), 500

@premium_bp.route('/subscription/cancel/<phone_number>', methods=['POST'])
@cross_origin(supports_credentials=True)
def cancel_subscription(phone_number):
    """Cancel a premium subscription"""
    try:
        table = get_premium_table()
        table.delete_item(Key={'phone_number': phone_number})
        
        return jsonify({"message": "Subscription cancelled successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to cancel subscription: {str(e)}"}), 500
