"""
Pytest configuration and fixtures for the Dream Companion App tests.
"""

import os
import sys
import pytest
from unittest.mock import Mock, patch
from flask import Flask
import boto3
from moto import mock_aws

# Add the src directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment variables
os.environ['FLASK_ENV'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
os.environ['STRIPE_SECRET_KEY'] = 'sk_test_mock_key'
os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_mock_secret'
os.environ['STRIPE_MONTHLY_PRICE_ID'] = 'price_mock_monthly'
os.environ['STRIPE_QUARTERLY_PRICE_ID'] = 'price_mock_quarterly'
os.environ['STRIPE_YEARLY_PRICE_ID'] = 'price_mock_yearly'

@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    from app import create_app
    
    app = create_app({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
        'JWT_SECRET_KEY': 'test-secret-key',
        'JWT_ACCESS_TOKEN_EXPIRES': False,
    })
    
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test CLI runner for the Flask application."""
    return app.test_cli_runner()

@pytest.fixture
def mock_auth_session():
    """Mock AWS Cognito authentication session."""
    with patch('app.auth.verify_cognito_token') as mock_verify:
        mock_verify.return_value = {
            'sub': 'mock-user-id',
            'phone_number': '+1234567890',
            'email': 'test@example.com'
        }
        yield mock_verify

@pytest.fixture
def mock_user_phone():
    """Mock user phone number."""
    with patch('app.helpers.user.getUserPhoneNumber') as mock_phone:
        mock_phone.return_value = '+1234567890'
        yield mock_phone

@pytest.fixture
def mock_stripe():
    """Mock Stripe API calls."""
    with patch('stripe.Price.retrieve') as mock_price, \
         patch('stripe.Customer.create') as mock_customer, \
         patch('stripe.Subscription.create') as mock_subscription, \
         patch('stripe.checkout.Session.create') as mock_checkout, \
         patch('stripe.Customer.list') as mock_customer_list, \
         patch('stripe.billing_portal.Session.create') as mock_billing_portal, \
         patch('stripe.Subscription.list') as mock_subscription_list:
        
        mock_price.return_value = Mock(
            id='price_mock',
            unit_amount=999,
            currency='usd'
        )
        
        mock_customer.return_value = Mock(
            id='cus_mock',
            email='test@example.com'
        )
        
        mock_subscription.return_value = Mock(
            id='sub_mock',
            status='active',
            current_period_end=1234567890
        )
        
        mock_checkout.return_value = Mock(
            id='cs_mock',
            url='https://checkout.stripe.com/test'
        )
        
        mock_customer_list.return_value = Mock(data=[])
        mock_subscription_list.return_value = Mock(data=[])
        
        mock_billing_portal.return_value = Mock(
            id='bps_mock',
            url='https://billing.stripe.com/test'
        )
        
        yield {
            'price': mock_price,
            'customer': mock_customer,
            'subscription': mock_subscription,
            'checkout': Mock(Session=Mock(create=mock_checkout)),
            'Customer': Mock(list=mock_customer_list),
            'billing_portal': Mock(Session=Mock(create=mock_billing_portal)),
            'Subscription': Mock(list=mock_subscription_list)
        }

@pytest.fixture
def mock_s3_client():
    """Mock S3 client for testing."""
    # Create a simple mock S3 client that doesn't rely on moto
    mock_client = Mock()
    
    # Mock the exceptions - create a proper exception class
    class NoSuchKey(Exception):
        pass
    
    mock_client.exceptions.NoSuchKey = NoSuchKey
    
    # Mock the get_object method
    def mock_get_object(Bucket, Key):
        # Simulate different responses based on the key
        if Key == '1234567890/themes.txt':
            return {
                'Body': Mock(read=Mock(return_value=b'Flying dreams\nWater dreams\nNightmare themes'))
            }
        elif 'dream1' in Key or 'test-dream-1' in Key:
            return {
                'Body': Mock(read=Mock(return_value=b'{"id": "dream1", "dreamContent": "I was flying over a beautiful landscape", "response": ["This dream suggests freedom and liberation"], "summary": "Flying dream about freedom"}'))
            }
        elif 'invalid-dream' in Key:
            return {
                'Body': Mock(read=Mock(return_value=b'invalid json data'))
            }
        else:
            # For other keys, raise NoSuchKey exception
            raise mock_client.exceptions.NoSuchKey()
    
    mock_client.get_object = Mock(side_effect=mock_get_object)
    
    # Mock the list_objects_v2 method
    def mock_list_objects_v2(Bucket, Prefix, MaxKeys=1000, ContinuationToken=None):
        # Return different results based on the prefix
        if '1234567890' in Prefix:
            # Return a list of dream objects - return 15 for pagination tests, 2 for others
            objects = []
            # Check if this is a pagination test by looking at the limit parameter
            if MaxKeys == 1000:  # Default limit, return 2 dreams
                dream_count = 2
            else:
                dream_count = 15  # For pagination tests
            
            for i in range(dream_count):
                objects.append({
                    'Key': f'1234567890/dream{i}.json',
                    'LastModified': '2024-01-01T00:00:00Z',
                    'Size': 100
                })
            return {
                'Contents': objects,
                'IsTruncated': False
            }
        else:
            return {'Contents': [], 'IsTruncated': False}
    
    mock_client.list_objects_v2 = Mock(side_effect=mock_list_objects_v2)
    
    # Mock the put_object method (for setup)
    mock_client.put_object = Mock()
    
    return mock_client

@pytest.fixture
def mock_secrets_manager():
    """Mock AWS Secrets Manager for testing."""
    with mock_aws():
        secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
        secrets_client.create_secret(
            Name='dream-companion-stripe-secrets',
            SecretString='{"STRIPE_SECRET_KEY": "sk_test_mock", "STRIPE_WEBHOOK_SECRET": "whsec_mock"}'
        )
        yield secrets_client

@pytest.fixture
def sample_dream_data():
    """Sample dream data for testing."""
    return {
        'id': 'test-dream-1',
        'createdAt': '2024-01-01T00:00:00Z',
        'dream_content': 'I was flying over a beautiful landscape...',
        'response': 'This dream suggests freedom and liberation...',
        'summary': 'Flying dream\n\n- Freedom\n- Liberation\n- Adventure'
    }

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'phone_number': '+1234567890',
        'user_id': 'test-user-123',
        'email': 'test@example.com',
        'has_premium': False
    }

@pytest.fixture
def mock_premium_status():
    """Mock premium status for testing."""
    return {
        'has_premium': True,
        'subscription_end': '2024-12-31T23:59:59Z',
        'features': ['advanced_analysis', 'archetype_analysis', 'pattern_recognition']
    }

# Test data factories
@pytest.fixture
def dream_factory():
    """Factory for creating test dream data."""
    def _create_dream(**kwargs):
        default_data = {
            'id': 'test-dream-1',
            'createdAt': '2024-01-01T00:00:00Z',
            'dream_content': 'Test dream content',
            'response': 'Test dream response',
            'summary': 'Test dream summary'
        }
        default_data.update(kwargs)
        return default_data
    return _create_dream

@pytest.fixture
def user_factory():
    """Factory for creating test user data."""
    def _create_user(**kwargs):
        default_data = {
            'phone_number': '+1234567890',
            'user_id': 'test-user-123',
            'email': 'test@example.com',
            'has_premium': False
        }
        default_data.update(kwargs)
        return default_data
    return _create_user
