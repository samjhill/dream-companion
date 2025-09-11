"""
Integration tests for the Dream Companion App API.
These tests verify that different parts of the system work together correctly.
"""

import json
import pytest
from unittest.mock import patch, Mock
from moto import mock_aws
import boto3


@mock_aws
class TestAPIIntegration:
    """Test API integration scenarios."""
    
    def test_dream_workflow_integration(self, client, mock_auth_session):
        """Test the complete dream workflow from creation to retrieval."""
        # Setup S3 client and bucket
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_client.create_bucket(Bucket='test-dream-bucket')
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=s3_client):
            # 1. Create a dream (simulate by putting data in S3)
            dream_data = {
                'id': 'test-dream-1',
                'dreamContent': 'I%20was%20flying%20over%20a%20beautiful%20landscape',
                'response': ['This dream suggests freedom and liberation'],
                'summary': 'Flying dream about freedom'
            }
            
            s3_client.put_object(
                Bucket='test-dream-bucket',
                Key='1234567890/test-dream-1',
                Body=json.dumps(dream_data)
            )
            
            # 2. List dreams
            response = client.get('/api/dreams/1234567890', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            dreams_list = json.loads(response.data)
            assert len(dreams_list['dreams']) == 1
            assert dreams_list['total'] == 1
            
            # 3. Get specific dream
            response = client.get('/api/dreams/1234567890/test-dream-1', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            dream_detail = json.loads(response.data)
            assert dream_detail['id'] == 'test-dream-1'
            assert dream_detail['dream_content'] == 'I was flying over a beautiful landscape'
            assert dream_detail['response'] == 'This dream suggests freedom and liberation'

    def test_themes_workflow_integration(self, client, mock_auth_session):
        """Test the themes workflow integration."""
        # Setup S3 client and bucket
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_client.create_bucket(Bucket='test-dream-bucket')
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=s3_client):
            # 1. Create themes data
            themes_data = "Flying dreams\nWater dreams\nNightmare themes"
            s3_client.put_object(
                Bucket='test-dream-bucket',
                Key='1234567890/themes.txt',
                Body=themes_data
            )
            
            # 2. Retrieve themes
            response = client.get('/api/themes/1234567890', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            assert response.data.decode('utf-8') == themes_data

    def test_premium_workflow_integration(self, client):
        """Test the premium subscription workflow integration."""
        # Setup DynamoDB table
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.create_table(
            TableName='dream-companion-premium-users',
            KeySchema=[{'AttributeName': 'phone_number', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'phone_number', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        
        with patch('app.premium.get_premium_table', return_value=table):
            # 1. Check initial premium status
            response = client.get('/api/premium/subscription/status/+1234567890')
            assert response.status_code == 200
            status = json.loads(response.data)
            assert status['is_premium'] is False
            
            # 2. Create premium subscription
            subscription_data = {
                'phone_number': '1234567890',
                'subscription_type': 'premium',
                'duration_months': 1
            }
            
            response = client.post('/api/premium/subscription/create',
                                 json=subscription_data,
                                 content_type='application/json')
            assert response.status_code == 200
            
            # 3. Check premium status after subscription
            response = client.get('/api/premium/subscription/status/+1234567890')
            assert response.status_code == 200
            status = json.loads(response.data)
            assert status['is_premium'] is True
            
            # 4. Cancel subscription
            response = client.post('/api/premium/subscription/cancel/+1234567890')
            assert response.status_code == 200
            
            # 5. Check premium status after cancellation
            response = client.get('/api/premium/subscription/status/+1234567890')
            assert response.status_code == 200
            status = json.loads(response.data)
            assert status['is_premium'] is False

    def test_authentication_flow_integration(self, client, mock_auth_session):
        """Test authentication flow across different endpoints."""
        # Test endpoints that require authentication
        protected_endpoints = [
            '/api/themes/1234567890',
            '/api/dreams/1234567890',
            '/api/dreams/1234567890/test-dream-1'
        ]
        
        for endpoint in protected_endpoints:
            # Test without auth header
            response = client.get(endpoint)
            assert response.status_code == 401
            
            # Test with invalid auth header
            response = client.get(endpoint, headers={'Authorization': 'Invalid token'})
            assert response.status_code == 401
            
            # Test with valid auth header (should not return 401)
            response = client.get(endpoint, headers={'Authorization': 'Bearer valid-token'})
            assert response.status_code != 401

    def test_cors_headers_integration(self, client, mock_auth_session):
        """Test CORS headers are properly set across all endpoints."""
        endpoints = [
            '/api/',
            '/api/themes/1234567890',
            '/api/dreams/1234567890',
            '/api/premium/subscription/status/+1234567890'
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint, headers={
                'Authorization': 'Bearer valid-token',
                'Origin': 'https://clarasdreamguide.com'
            })
            
            # Check CORS headers are present
            assert 'Access-Control-Allow-Origin' in response.headers
            assert 'Access-Control-Allow-Credentials' in response.headers
            
            # Check specific values
            assert response.headers['Access-Control-Allow-Origin'] == 'https://clarasdreamguide.com'
            assert response.headers['Access-Control-Allow-Credentials'] == 'true'

    def test_error_handling_integration(self, client, mock_auth_session):
        """Test error handling across the API."""
        # Setup S3 client and bucket for 404 test
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_client.create_bucket(Bucket='test-dream-bucket')
        
        # Test 404 errors
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=s3_client):
            response = client.get('/api/dreams/1234567890/nonexistent', 
                                headers={'Authorization': 'Bearer valid-token'})
            assert response.status_code == 404
        
        # Test 400 errors
        response = client.post('/api/premium/subscription/create',
                             json={},  # Missing required fields
                             content_type='application/json')
        assert response.status_code == 400
        
        # Test 500 errors (when S3 is not configured)
        with patch('app.routes.S3_BUCKET_NAME', None):
            response = client.get('/api/dreams/1234567890', 
                                headers={'Authorization': 'Bearer valid-token'})
            assert response.status_code == 500

    @patch('app.stripe_integration.stripe.api_key', 'sk_test_mock')
    def test_stripe_integration_flow(self, client, mock_auth_session):
        """Test Stripe integration flow."""
        with patch('app.stripe_integration.stripe.checkout.Session.create') as mock_checkout:
            mock_checkout.return_value = Mock(
                id='cs_test_123',
                url='https://checkout.stripe.com/test'
            )
            
            # Test checkout session creation
            checkout_data = {
                'plan_type': 'monthly',
                'phone_number': '+1234567890'
            }
            
            response = client.post('/api/stripe/create-checkout-session',
                                 json=checkout_data,
                                 headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'session_id' in data
            assert 'checkout_url' in data

    def test_health_check_integration(self, client):
        """Test health check endpoint integration."""
        response = client.get('/api/', headers={'Origin': 'https://clarasdreamguide.com'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'OK'
        
        # Verify CORS headers are set
        assert 'Access-Control-Allow-Origin' in response.headers

    def test_options_request_integration(self, client):
        """Test OPTIONS request handling for CORS preflight."""
        response = client.options('/api/any/path', headers={
            'Origin': 'https://clarasdreamguide.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        })
        
        assert response.status_code == 200
        # OPTIONS requests may return empty body, just check status
        
        # Verify CORS headers are set
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Access-Control-Allow-Methods' in response.headers
        assert 'Access-Control-Allow-Headers' in response.headers

    def test_pagination_integration(self, client, mock_auth_session):
        """Test pagination integration across the API."""
        # Setup S3 client and bucket with multiple dreams
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_client.create_bucket(Bucket='test-dream-bucket')
        
        # Create multiple dream objects
        for i in range(15):
            dream_data = {
                'id': f'dream-{i}',
                'dreamContent': f'Dream content {i}',
                'response': [f'Response {i}'],
                'summary': f'Summary {i}'
            }
            
            s3_client.put_object(
                Bucket='test-dream-bucket',
                Key=f'1234567890/dream-{i}',
                Body=json.dumps(dream_data)
            )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=s3_client):
            # Test first page
            response = client.get('/api/dreams/1234567890?limit=10&offset=0', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data['dreams']) == 10
            assert data['total'] == 15
            assert data['hasMore'] is True
            
            # Test second page
            response = client.get('/api/dreams/1234567890?limit=10&offset=10', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data['dreams']) == 5
            assert data['total'] == 15
            assert data['hasMore'] is False
