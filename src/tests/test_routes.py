"""
Tests for the Flask routes in the Dream Companion App.
"""

import json
import pytest
from unittest.mock import patch, Mock
from moto import mock_aws
import boto3


class TestHealthCheck:
    """Test the health check endpoint."""
    
    def test_health_check_success(self, client):
        """Test that health check returns OK status."""
        response = client.get('/api/')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'OK'

    def test_health_check_cors_headers(self, client):
        """Test that health check includes CORS headers."""
        response = client.get('/api/', headers={'Origin': 'https://clarasdreamguide.com'})
        
        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers


class TestOptionsHandler:
    """Test the OPTIONS request handler."""
    
    def test_options_request_success(self, client):
        """Test that OPTIONS requests return OK status."""
        response = client.options('/api/any/path')
        
        assert response.status_code == 200
        # OPTIONS requests may return empty body, just check status

    def test_options_request_cors_headers(self, client):
        """Test that OPTIONS requests include proper CORS headers."""
        response = client.options('/api/any/path', headers={
            'Origin': 'https://clarasdreamguide.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        })
        
        assert response.status_code == 200
        assert response.headers['Access-Control-Allow-Origin'] == 'https://clarasdreamguide.com'
        assert 'Content-Type' in response.headers['Access-Control-Allow-Headers']
        assert 'Authorization' in response.headers['Access-Control-Allow-Headers']


class TestAuthentication:
    """Test authentication requirements."""
    
    def test_require_auth_missing_header(self, client):
        """Test that protected routes require authorization header."""
        response = client.get('/api/themes/1234567890')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization header' in data['error'].lower()

    def test_require_auth_invalid_header(self, client):
        """Test that protected routes reject invalid authorization header."""
        response = client.get('/api/themes/1234567890', headers={'Authorization': 'Invalid token'})
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization header' in data['error'].lower()

    def test_require_auth_valid_header(self, client, mock_auth_session):
        """Test that protected routes accept valid authorization header."""
        with patch('app.routes.get_s3_client') as mock_s3:
            mock_s3.exceptions.NoSuchKey = Exception
            mock_s3.get_object.side_effect = mock_s3.exceptions.NoSuchKey()
            
            response = client.get('/api/themes/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            # Should not return 401, but may return other errors
            assert response.status_code != 401


@mock_aws
class TestThemesEndpoint:
    """Test the themes endpoint."""
    
    def test_get_themes_success(self, client, mock_s3_client, mock_auth_session):
        """Test successful retrieval of themes."""
        # Create test data in S3
        themes_data = "Flying dreams\nWater dreams\nNightmare themes"
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/themes.txt',
            Body=themes_data
        )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/themes/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            assert response.data.decode('utf-8') == themes_data

    def test_get_themes_not_found(self, client, mock_s3_client, mock_auth_session):
        """Test themes endpoint when themes file doesn't exist."""
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/themes/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 404
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not found' in data['error'].lower()

    def test_get_themes_s3_error(self, client, mock_auth_session):
        """Test themes endpoint when S3 bucket is not configured."""
        with patch('app.routes.S3_BUCKET_NAME', None):
            response = client.get('/api/themes/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not configured' in data['error'].lower()


@mock_aws
class TestDreamsEndpoint:
    """Test the dreams list endpoint."""
    
    def test_get_dreams_success(self, client, mock_s3_client, mock_auth_session):
        """Test successful retrieval of dreams list."""
        # Create test data in S3
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/dream1.json',
            Body=json.dumps({'id': 'dream1', 'content': 'Test dream 1'})
        )
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/dream2.json',
            Body=json.dumps({'id': 'dream2', 'content': 'Test dream 2'})
        )
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/metadata',
            Body='metadata content'
        )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/dreams/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'dreams' in data
            assert 'total' in data
            assert 'hasMore' in data
            assert len(data['dreams']) == 2
            assert data['total'] == 2

    def test_get_dreams_pagination(self, client, mock_s3_client, mock_auth_session):
        """Test dreams list pagination."""
        # Create multiple test dreams
        for i in range(15):
            mock_s3_client.put_object(
                Bucket='test-dream-bucket',
                Key=f'1234567890/dream{i}.json',
                Body=json.dumps({'id': f'dream{i}', 'content': f'Test dream {i}'})
            )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
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

    def test_get_dreams_empty(self, client, mock_s3_client, mock_auth_session):
        """Test dreams endpoint when no dreams exist."""
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/dreams/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['dreams'] == []
            assert data['total'] == 0
            assert data['hasMore'] is False

    def test_get_dreams_s3_error(self, client, mock_auth_session):
        """Test dreams endpoint when S3 bucket is not configured."""
        with patch('app.routes.S3_BUCKET_NAME', None):
            response = client.get('/api/dreams/1234567890', headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not configured' in data['error'].lower()


@mock_aws
class TestDreamDetailEndpoint:
    """Test the individual dream detail endpoint."""
    
    def test_get_dream_success(self, client, mock_s3_client, mock_auth_session):
        """Test successful retrieval of a specific dream."""
        dream_data = {
            'id': 'dream1',
            'dreamContent': 'I%20was%20flying%20over%20a%20beautiful%20landscape',
            'response': ['This dream suggests freedom and liberation'],
            'summary': 'Flying dream about freedom'
        }
        
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/dream1',
            Body=json.dumps(dream_data)
        )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/dreams/1234567890/dream1', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['id'] == 'dream1'
            assert data['dream_content'] == 'I was flying over a beautiful landscape'
            assert data['response'] == 'This dream suggests freedom and liberation'
            assert data['summary'] == 'Flying dream about freedom'

    def test_get_dream_not_found(self, client, mock_s3_client, mock_auth_session):
        """Test dream detail endpoint when dream doesn't exist."""
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/dreams/1234567890/nonexistent', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 404
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not found' in data['error'].lower()

    def test_get_dream_invalid_json(self, client, mock_s3_client, mock_auth_session):
        """Test dream detail endpoint with invalid JSON data."""
        mock_s3_client.put_object(
            Bucket='test-dream-bucket',
            Key='1234567890/invalid-dream',
            Body='invalid json data'
        )
        
        with patch('app.routes.S3_BUCKET_NAME', 'test-dream-bucket'), \
             patch('app.routes.get_s3_client', return_value=mock_s3_client):
            response = client.get('/api/dreams/1234567890/invalid-dream', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert 'format' in data['error'].lower()

    def test_get_dream_s3_error(self, client, mock_auth_session):
        """Test dream detail endpoint when S3 bucket is not configured."""
        with patch('app.routes.S3_BUCKET_NAME', None):
            response = client.get('/api/dreams/1234567890/dream1', 
                                headers={'Authorization': 'Bearer valid-token'})
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
            assert 'not configured' in data['error'].lower()


class TestCORSHeaders:
    """Test CORS headers are properly set."""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses."""
        response = client.get('/api/', headers={'Origin': 'https://clarasdreamguide.com'})
        
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Access-Control-Allow-Credentials' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == 'https://clarasdreamguide.com'

    def test_cors_origin_correct(self, client):
        """Test that CORS origin is set to the correct frontend URL."""
        response = client.get('/api/', headers={'Origin': 'https://clarasdreamguide.com'})
        
        assert response.headers['Access-Control-Allow-Origin'] == 'https://clarasdreamguide.com'
        assert response.headers['Access-Control-Allow-Credentials'] == 'true'

    def test_cors_preflight_headers(self, client):
        """Test that CORS preflight headers are present in OPTIONS requests."""
        response = client.options('/api/', headers={
            'Origin': 'https://clarasdreamguide.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        })
        
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Access-Control-Allow-Headers' in response.headers
        assert 'Access-Control-Allow-Methods' in response.headers
        assert 'Access-Control-Allow-Credentials' in response.headers
