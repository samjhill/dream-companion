from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import boto3
import os
from datetime import datetime, timedelta
from functools import wraps
from .auth import require_cognito_auth, get_cognito_user_info

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
        # First check Cognito authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        # Get user info from Cognito token
        user_info = get_cognito_user_info()
        if not user_info:
            return jsonify({"error": "Invalid authentication token"}), 401

        # Get user phone number from Cognito user info or request args
        phone_number = user_info.get('phone_number') or request.view_args.get('phone_number')
        if not phone_number:
            return jsonify({"error": "Phone number required"}), 400

        # Clean phone number (remove + if present)
        phone_number = phone_number.replace('+', '')

        # Check if user has premium access
        if not is_premium_user(phone_number):
            return jsonify({
                "error": "Premium subscription required",
                "message": "This feature requires a premium subscription. Please upgrade to access advanced dream analysis.",
                "upgrade_url": "https://clarasdreamguide.com/app/premium"
            }), 403

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

def check_premium_access(phone_number: str) -> dict:
    """Check premium access and return detailed status information"""
    try:
        table = get_premium_table()
        response = table.get_item(Key={'phone_number': phone_number})

        if 'Item' not in response:
            return {
                'has_premium': False,
                'subscription_type': None,
                'subscription_end': None,
                'days_remaining': 0,
                'features': ['basic_dream_storage', 'basic_interpretations']
            }

        user_data = response['Item']
        subscription_end = datetime.fromisoformat(user_data['subscription_end'])
        current_time = datetime.utcnow()

        has_premium = current_time < subscription_end
        days_remaining = (subscription_end - current_time).days if has_premium else 0

        return {
            'has_premium': has_premium,
            'subscription_type': user_data.get('subscription_type', 'premium'),
            'subscription_end': user_data['subscription_end'],
            'days_remaining': days_remaining,
            'features': user_data.get('features', [
                'basic_dream_storage',
                'basic_interpretations',
                'advanced_dream_analysis',
                'psychological_patterns',
                'dream_archetypes',
                'historical_trends',
                'personalized_reports'
            ]) if has_premium else ['basic_dream_storage', 'basic_interpretations']
        }
    except Exception as e:
        print(f"Error checking premium access: {e}")
        return {
            'has_premium': False,
            'subscription_type': None,
            'subscription_end': None,
            'days_remaining': 0,
            'features': ['basic_dream_storage', 'basic_interpretations']
        }

@premium_bp.route('/subscription/status/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_subscription_status(phone_number):
    """Get the current subscription status for a user"""
    try:
        premium_status = check_premium_access(phone_number)

        return jsonify({
            'is_premium': premium_status['has_premium'],
            'subscription_type': premium_status['subscription_type'],
            'subscription_end': premium_status['subscription_end'],
            'days_remaining': premium_status['days_remaining'],
            'features': premium_status['features']
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
