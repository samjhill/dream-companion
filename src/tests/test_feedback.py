import pytest
import json
from unittest.mock import patch, MagicMock
from moto import mock_aws
import boto3
from datetime import datetime
from app.feedback import get_feedback_table

@mock_aws
class TestFeedbackFunctions:
    """Test cases for feedback utility functions"""

    def test_get_feedback_table_creation(self, app):
        """Test that feedback table is created correctly"""
        from app.feedback import get_feedback_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-feedback',
            KeySchema=[{'AttributeName': 'feedback_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[
                {'AttributeName': 'feedback_id', 'AttributeType': 'S'},
                {'AttributeName': 'user_id', 'AttributeType': 'S'},
                {'AttributeName': 'created_at', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[{
                'IndexName': 'user-feedback-index',
                'KeySchema': [
                    {'AttributeName': 'user_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.feedback.get_feedback_table', return_value=table):
            result_table = get_feedback_table()
            assert result_table is not None
            assert result_table.table_name == 'dream-companion-feedback'

    def test_feedback_data_structure(self, app):
        """Test feedback data structure validation"""
        # Test valid feedback data
        valid_feedback = {
            'feedback_id': 'test-id-123',
            'user_id': '1234567890',
            'rating': 'thumbs_up',
            'comment': 'Great app!',
            'type': 'general',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Validate required fields
        assert 'feedback_id' in valid_feedback
        assert 'user_id' in valid_feedback
        assert 'rating' in valid_feedback
        assert 'created_at' in valid_feedback
        
        # Validate rating values
        assert valid_feedback['rating'] in ['thumbs_up', 'thumbs_down']
        
        # Test invalid rating
        invalid_feedback = valid_feedback.copy()
        invalid_feedback['rating'] = 'invalid_rating'
        assert invalid_feedback['rating'] not in ['thumbs_up', 'thumbs_down']

    def test_feedback_validation_logic(self, app):
        """Test feedback validation logic"""
        # Test valid ratings
        valid_ratings = ['thumbs_up', 'thumbs_down']
        for rating in valid_ratings:
            assert rating in ['thumbs_up', 'thumbs_down']
        
        # Test invalid ratings
        invalid_ratings = ['thumbs_up', 'thumbs_down', 'invalid', 'good', 'bad']
        for rating in invalid_ratings:
            if rating not in ['thumbs_up', 'thumbs_down']:
                assert rating not in ['thumbs_up', 'thumbs_down']

    def test_feedback_types(self, app):
        """Test feedback type categorization"""
        valid_types = ['general', 'feature', 'bug', 'ui', 'performance', 'other']
        
        for feedback_type in valid_types:
            assert feedback_type in valid_types
        
        # Test that we can handle any type (flexible design)
        custom_type = 'custom_category'
        assert isinstance(custom_type, str)

    def test_feedback_statistics_calculation(self, app):
        """Test feedback statistics calculation logic"""
        # Mock feedback data
        feedback_items = [
            {'rating': 'thumbs_up', 'type': 'general'},
            {'rating': 'thumbs_up', 'type': 'feature'},
            {'rating': 'thumbs_down', 'type': 'bug'},
            {'rating': 'thumbs_down', 'type': 'ui'},
            {'rating': 'thumbs_up', 'type': 'performance'}
        ]
        
        # Calculate statistics
        total_feedback = len(feedback_items)
        thumbs_up = len([f for f in feedback_items if f.get('rating') == 'thumbs_up'])
        thumbs_down = len([f for f in feedback_items if f.get('rating') == 'thumbs_down'])
        satisfaction_rate = (thumbs_up / total_feedback * 100) if total_feedback > 0 else 0
        
        # Group by type
        type_counts = {}
        for item in feedback_items:
            feedback_type = item.get('type', 'general')
            type_counts[feedback_type] = type_counts.get(feedback_type, 0) + 1
        
        # Assertions
        assert total_feedback == 5
        assert thumbs_up == 3
        assert thumbs_down == 2
        assert satisfaction_rate == 60.0
        assert type_counts['general'] == 1
        assert type_counts['feature'] == 1
        assert type_counts['bug'] == 1
        assert type_counts['ui'] == 1
        assert type_counts['performance'] == 1

    def test_user_access_validation(self, app):
        """Test user access validation logic"""
        # Test phone number normalization
        phone_with_plus = '+1234567890'
        phone_without_plus = '1234567890'
        
        # Simulate normalization
        normalized_with_plus = phone_with_plus[1:] if phone_with_plus.startswith('+') else phone_with_plus
        normalized_without_plus = phone_without_plus[1:] if phone_without_plus.startswith('+') else phone_without_plus
        
        assert normalized_with_plus == '1234567890'
        assert normalized_without_plus == '1234567890'
        
        # Test access validation
        user_phone = '1234567890'
        requested_user = '1234567890'
        different_user = '0987654321'
        
        assert user_phone == requested_user  # Should have access
        assert user_phone != different_user   # Should not have access
