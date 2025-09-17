from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import boto3
import os
import json
import uuid
from datetime import datetime
from functools import wraps
from .auth import require_cognito_auth, get_cognito_user_info

feedback_bp = Blueprint('feedback_bp', __name__)

# Initialize DynamoDB client for feedback management
dynamodb = boto3.resource('dynamodb')
feedback_table_name = os.getenv('FEEDBACK_TABLE_NAME', 'dream-companion-feedback')

def get_feedback_table():
    """Get or create the feedback table"""
    try:
        table = dynamodb.Table(feedback_table_name)
        table.load()
        return table
    except:
        # Create table if it doesn't exist
        table = dynamodb.create_table(
            TableName=feedback_table_name,
            KeySchema=[
                {
                    'AttributeName': 'feedback_id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'feedback_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'created_at',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'user-feedback-index',
                    'KeySchema': [
                        {
                            'AttributeName': 'user_id',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'created_at',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    },
                    'BillingMode': 'PAY_PER_REQUEST'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
        return table

def validate_user_access(user_id):
    """Validate that the user_id matches the authenticated user's phone number"""
    user_info = get_cognito_user_info()
    if not user_info:
        return False
    
    # Get the phone number from the token and remove the + prefix
    phone_number = user_info.get('phone_number', '')
    if phone_number.startswith('+'):
        phone_number = phone_number[1:]
    
    # Compare with the user_id from the URL
    return phone_number == user_id

@feedback_bp.route('/submit', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
def submit_feedback():
    """Submit user feedback"""
    try:
        # Get user info from Cognito token
        user_info = get_cognito_user_info()
        if not user_info:
            return jsonify({"error": "Invalid authentication token"}), 401

        # Get phone number from user info
        phone_number = user_info.get('phone_number', '')
        if phone_number.startswith('+'):
            phone_number = phone_number[1:]

        data = request.get_json()
        rating = data.get('rating')  # 'thumbs_up' or 'thumbs_down'
        comment = data.get('comment', '')  # Optional text feedback
        feedback_type = data.get('type', 'general')  # Type of feedback (general, feature, bug, etc.)

        # Validate required fields
        if not rating or rating not in ['thumbs_up', 'thumbs_down']:
            return jsonify({"error": "Rating is required and must be 'thumbs_up' or 'thumbs_down'"}), 400

        # Create feedback entry
        feedback_id = str(uuid.uuid4())
        feedback_entry = {
            'feedback_id': feedback_id,
            'user_id': phone_number,
            'rating': rating,
            'comment': comment,
            'type': feedback_type,
            'created_at': datetime.utcnow().isoformat(),
            'user_agent': request.headers.get('User-Agent', ''),
            'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', ''))
        }

        # Save to DynamoDB
        table = get_feedback_table()
        table.put_item(Item=feedback_entry)

        return jsonify({
            "success": True,
            "message": "Thank you for your feedback!",
            "feedback_id": feedback_id
        }), 200

    except Exception as e:
        print(f"Error in submit_feedback: {str(e)}")
        return jsonify({"error": f"Failed to submit feedback: {str(e)}"}), 500

@feedback_bp.route('/user/<user_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
def get_user_feedback(user_id):
    """Get feedback history for a user (admin only or own feedback)"""
    try:
        # Validate that the user can only access their own data
        if not validate_user_access(user_id):
            return jsonify({"error": "Access denied: You can only access your own feedback"}), 403

        table = get_feedback_table()
        
        # Query feedback for this user
        response = table.query(
            IndexName='user-feedback-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={
                ':user_id': user_id
            },
            ScanIndexForward=False  # Sort by created_at descending (newest first)
        )

        feedback_items = response.get('Items', [])
        
        # Remove sensitive information before returning
        for item in feedback_items:
            item.pop('ip_address', None)
            item.pop('user_agent', None)

        return jsonify({
            "feedback": feedback_items,
            "total": len(feedback_items)
        }), 200

    except Exception as e:
        print(f"Error in get_user_feedback: {str(e)}")
        return jsonify({"error": f"Failed to get user feedback: {str(e)}"}), 500

@feedback_bp.route('/stats', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
def get_feedback_stats():
    """Get feedback statistics (admin only)"""
    try:
        # This could be enhanced with admin role checking
        table = get_feedback_table()
        
        # Scan all feedback items
        response = table.scan()
        feedback_items = response.get('Items', [])
        
        # Calculate statistics
        total_feedback = len(feedback_items)
        thumbs_up = len([f for f in feedback_items if f.get('rating') == 'thumbs_up'])
        thumbs_down = len([f for f in feedback_items if f.get('rating') == 'thumbs_down'])
        
        # Group by type
        type_counts = {}
        for item in feedback_items:
            feedback_type = item.get('type', 'general')
            type_counts[feedback_type] = type_counts.get(feedback_type, 0) + 1
        
        # Group by date (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_feedback = len([
            f for f in feedback_items 
            if datetime.fromisoformat(f.get('created_at', '1970-01-01')) > thirty_days_ago
        ])

        return jsonify({
            "total_feedback": total_feedback,
            "thumbs_up": thumbs_up,
            "thumbs_down": thumbs_down,
            "satisfaction_rate": (thumbs_up / total_feedback * 100) if total_feedback > 0 else 0,
            "type_breakdown": type_counts,
            "recent_feedback_30_days": recent_feedback
        }), 200

    except Exception as e:
        print(f"Error in get_feedback_stats: {str(e)}")
        return jsonify({"error": f"Failed to get feedback stats: {str(e)}"}), 500
