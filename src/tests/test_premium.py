"""
Tests for the premium functionality in the Dream Companion App.
"""

import json
import pytest
from unittest.mock import patch, Mock
from moto import mock_aws
import boto3
from datetime import datetime, timedelta


@mock_aws
class TestPremiumFunctions:
    """Test premium utility functions."""
    
    def test_is_premium_user_active_subscription(self, app):
        """Test is_premium_user with active subscription."""
        from app.premium import is_premium_user, get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add active subscription
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_end': future_date
        })
        
        with patch('app.premium.get_premium_table', return_value=table):
            result = is_premium_user('+1234567890')
            assert result is True

    def test_is_premium_user_expired_subscription(self, app):
        """Test is_premium_user with expired subscription."""
        from app.premium import is_premium_user, get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add expired subscription
        past_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_end': past_date
        })
        
        with patch('app.premium.get_premium_table', return_value=table):
            result = is_premium_user('+1234567890')
            assert result is False

    def test_is_premium_user_no_subscription(self, app):
        """Test is_premium_user with no subscription."""
        from app.premium import is_premium_user, get_premium_table
        
        # Create empty DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table):
            result = is_premium_user('+1234567890')
            assert result is False

    def test_check_premium_access_active(self, app):
        """Test check_premium_access with active subscription."""
        from app.premium import check_premium_access, get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add active subscription
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_type': 'premium',
            'subscription_end': future_date,
            'features': ['advanced_analysis', 'archetypes']
        })
        
        with patch('app.premium.get_premium_table', return_value=table):
            result = check_premium_access('+1234567890')
            
            assert result['has_premium'] is True
            assert result['subscription_type'] == 'premium'
            assert result['days_remaining'] > 0
            assert 'advanced_analysis' in result['features']

    def test_check_premium_access_no_subscription(self, app):
        """Test check_premium_access with no subscription."""
        from app.premium import check_premium_access, get_premium_table
        
        # Create empty DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table):
            result = check_premium_access('+1234567890')
            
            assert result['has_premium'] is False
            assert result['subscription_type'] is None
            assert result['days_remaining'] == 0
            assert 'basic_dream_storage' in result['features']
            assert 'advanced_analysis' not in result['features']


@mock_aws
class TestPremiumEndpoints:
    """Test premium API endpoints."""
    
    def test_get_subscription_status_active(self, client):
        """Test getting subscription status for active user."""
        from app.premium import get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add active subscription
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_type': 'premium',
            'subscription_end': future_date,
            'features': ['advanced_analysis', 'archetypes']
        })
        
        with patch('app.premium.get_premium_table', return_value=table):
            response = client.get('/api/premium/subscription/status/+1234567890')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['is_premium'] is True
            assert data['subscription_type'] == 'premium'
            assert data['days_remaining'] > 0
            assert 'advanced_analysis' in data['features']

    def test_get_subscription_status_no_subscription(self, client):
        """Test getting subscription status for user with no subscription."""
        from app.premium import get_premium_table
        
        # Create empty DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table):
            response = client.get('/api/premium/subscription/status/+1234567890')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['is_premium'] is False
            assert data['subscription_type'] is None
            assert data['days_remaining'] == 0
            assert 'basic_dream_storage' in data['features']

    def test_create_subscription_success(self, client):
        """Test creating a new subscription."""
        from app.premium import get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table):
            subscription_data = {
                'phone_number': '1234567890',
                'subscription_type': 'premium',
                'duration_months': 1
            }
            
            response = client.post('/api/premium/subscription/create',
                                 json=subscription_data,
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'message' in data
            assert 'subscription_end' in data
            assert 'Subscription created successfully' in data['message']

    def test_create_subscription_missing_phone(self, client):
        """Test creating subscription without phone number."""
        subscription_data = {
            'subscription_type': 'premium',
            'duration_months': 1
        }
        
        response = client.post('/api/premium/subscription/create',
                             json=subscription_data,
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Phone number required' in data['error']

    def test_cancel_subscription_success(self, client):
        """Test cancelling a subscription."""
        from app.premium import get_premium_table
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add subscription to cancel
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_type': 'premium',
            'subscription_end': future_date
        })
        
        with patch('app.premium.get_premium_table', return_value=table):
            response = client.post('/api/premium/subscription/cancel/+1234567890')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'message' in data
            assert 'Subscription cancelled successfully' in data['message']

    def test_require_premium_decorator_with_premium(self, client):
        """Test require_premium decorator with premium user."""
        from app.premium import get_premium_table, require_premium
        
        # Create DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Add active subscription
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        table.put_item(Item={
            'phone_number': '1234567890',
            'subscription_end': future_date
        })
        
        with patch('app.premium.get_premium_table', return_value=table), \
             patch('app.premium.get_cognito_user_info') as mock_user_info:
            mock_user_info.return_value = {
                'sub': 'mock-user-id',
                'phone_number': '1234567890',
                'email': 'test@example.com'
            }
            
            # Create a test route with require_premium decorator
            from flask import Flask
            test_app = Flask(__name__)
            
            @test_app.route('/test-premium/<phone_number>')
            @require_premium
            def test_route(phone_number):
                return {'message': 'Access granted'}
            
            test_client = test_app.test_client()
            
            response = test_client.get('/test-premium/+1234567890',
                                     headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['message'] == 'Access granted'

    def test_require_premium_decorator_without_premium(self, client):
        """Test require_premium decorator without premium user."""
        from app.premium import get_premium_table, require_premium
        
        # Create empty DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table), \
             patch('app.premium.get_cognito_user_info') as mock_user_info:
            mock_user_info.return_value = {
                'sub': 'mock-user-id',
                'phone_number': '1234567890',
                'email': 'test@example.com'
            }
            
            # Create a test route with require_premium decorator
            from flask import Flask
            test_app = Flask(__name__)
            
            @test_app.route('/test-premium/<phone_number>')
            @require_premium
            def test_route(phone_number):
                return {'message': 'Access granted'}
            
            test_client = test_app.test_client()
            
            response = test_client.get('/test-premium/+1234567890',
                                     headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 403
            data = json.loads(response.data)
            assert 'error' in data
            assert 'Premium subscription required' in data['error']
            assert 'upgrade_url' in data

    def test_require_premium_decorator_missing_auth(self, client):
        """Test require_premium decorator without authorization header."""
        from app.premium import require_premium
        
        # Create a test route with require_premium decorator
        from flask import Flask
        test_app = Flask(__name__)
        
        @test_app.route('/test-premium/<phone_number>')
        @require_premium
        def test_route(phone_number):
            return {'message': 'Access granted'}
        
        test_client = test_app.test_client()
        
        response = test_client.get('/test-premium/+1234567890')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization header' in data['error'].lower()
