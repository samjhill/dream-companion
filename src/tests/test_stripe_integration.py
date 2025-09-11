"""
Tests for the Stripe integration in the Dream Companion App.
"""

import json
import pytest
from unittest.mock import patch, Mock
import stripe


class TestStripeConfiguration:
    """Test Stripe configuration loading."""
    
    def test_load_stripe_secrets_from_environment(self, app):
        """Test loading Stripe secrets from environment variables."""
        with patch.dict('os.environ', {
            'STRIPE_SECRET_KEY': 'sk_test_mock_key',
            'STRIPE_WEBHOOK_SECRET': 'whsec_mock_secret',
            'STRIPE_MONTHLY_PRICE_ID': 'price_mock_monthly',
            'STRIPE_QUARTERLY_PRICE_ID': 'price_mock_quarterly',
            'STRIPE_YEARLY_PRICE_ID': 'price_mock_yearly'
        }):
            from app.stripe_integration import load_stripe_secrets
            result = load_stripe_secrets()
            assert result is True

    def test_load_stripe_secrets_from_secrets_manager(self, app):
        """Test loading Stripe secrets from AWS Secrets Manager."""
        mock_secrets = {
            'STRIPE_SECRET_KEY': 'sk_test_mock_key',
            'STRIPE_WEBHOOK_SECRET': 'whsec_mock_secret',
            'STRIPE_MONTHLY_PRICE_ID': 'price_mock_monthly',
            'STRIPE_QUARTERLY_PRICE_ID': 'price_mock_quarterly',
            'STRIPE_YEARLY_PRICE_ID': 'price_mock_yearly'
        }
        
        with patch.dict('os.environ', {'STRIPE_SECRETS_ARN': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:stripe-secrets'}):
            with patch('boto3.client') as mock_boto_client:
                mock_secrets_client = Mock()
                mock_secrets_client.get_secret_value.return_value = {
                    'SecretString': json.dumps(mock_secrets)
                }
                mock_boto_client.return_value = mock_secrets_client
                
                from app.stripe_integration import load_stripe_secrets
                result = load_stripe_secrets()
                assert result is True

    def test_load_stripe_secrets_fallback_to_env(self, app):
        """Test fallback to environment variables when Secrets Manager fails."""
        with patch.dict('os.environ', {
            'STRIPE_SECRETS_ARN': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:stripe-secrets',
            'STRIPE_SECRET_KEY': 'sk_test_mock_key',
            'STRIPE_WEBHOOK_SECRET': 'whsec_mock_secret',
            'STRIPE_MONTHLY_PRICE_ID': 'price_mock_monthly',
            'STRIPE_QUARTERLY_PRICE_ID': 'price_mock_quarterly',
            'STRIPE_YEARLY_PRICE_ID': 'price_mock_yearly'
        }):
            with patch('boto3.client') as mock_boto_client:
                mock_secrets_client = Mock()
                mock_secrets_client.get_secret_value.side_effect = Exception("Secrets Manager error")
                mock_boto_client.return_value = mock_secrets_client
                
                from app.stripe_integration import load_stripe_secrets
                result = load_stripe_secrets()
                assert result is False  # Should fallback to env vars


class TestStripeEndpoints:
    """Test Stripe API endpoints."""
    
    def test_create_checkout_session_success(self, client, mock_stripe, mock_auth_session):
        """Test successful checkout session creation."""
        mock_stripe['checkout'].Session.create.return_value = Mock(
            id='cs_test_123',
            url='https://checkout.stripe.com/test'
        )
        
        checkout_data = {
            'plan_type': 'monthly',
            'phone_number': '+1234567890',
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel'
        }
        
        response = client.post('/api/stripe/create-checkout-session',
                             json=checkout_data,
                             headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'session_id' in data
        assert 'checkout_url' in data
        assert data['session_id'] == 'cs_test_123'

    def test_create_checkout_session_missing_data(self, client, mock_auth_session):
        """Test checkout session creation with missing data."""
        checkout_data = {
            'plan_type': 'monthly'
            # Missing phone_number
        }

        response = client.post('/api/stripe/create-checkout-session',
                             json=checkout_data,
                             headers={'Authorization': 'Bearer valid-token'})

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Missing plan_type or phone_number' in data['error']

    def test_create_checkout_session_invalid_plan(self, client, mock_auth_session):
        """Test checkout session creation with invalid plan type."""
        checkout_data = {
            'plan_type': 'invalid_plan',
            'phone_number': '+1234567890'
        }

        response = client.post('/api/stripe/create-checkout-session',
                             json=checkout_data,
                             headers={'Authorization': 'Bearer valid-token'})

        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid plan type' in data['error']

    def test_create_checkout_session_stripe_error(self, client, mock_stripe, mock_auth_session):
        """Test checkout session creation with Stripe error."""
        mock_stripe['checkout'].Session.create.side_effect = stripe.error.StripeError("Stripe API error")
        
        checkout_data = {
            'plan_type': 'monthly',
            'phone_number': '+1234567890'
        }
        
        response = client.post('/api/stripe/create-checkout-session',
                             json=checkout_data,
                             headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Stripe error' in data['error']

    def test_create_portal_session_success(self, client, mock_stripe, mock_auth_session):
        """Test successful portal session creation."""
        mock_customer = Mock()
        mock_customer.id = 'cus_test_123'
        mock_customer.metadata = {'phone_number': '+1234567890'}
        
        mock_stripe['Customer'].list.return_value = Mock(data=[mock_customer])
        mock_stripe['billing_portal'].Session.create.return_value = Mock(
            url='https://billing.stripe.com/test'
        )
        
        portal_data = {
            'phone_number': '+1234567890',
            'return_url': 'https://example.com/return'
        }
        
        response = client.post('/api/stripe/create-portal-session',
                             json=portal_data,
                             headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'portal_url' in data
        assert data['portal_url'] == 'https://billing.stripe.com/test'

    def test_create_portal_session_customer_not_found(self, client, mock_stripe, mock_auth_session):
        """Test portal session creation when customer is not found."""
        mock_stripe['Customer'].list.return_value = Mock(data=[])
        
        portal_data = {
            'phone_number': '+1234567890'
        }
        
        response = client.post('/api/stripe/create-portal-session',
                             json=portal_data,
                             headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Customer not found' in data['error']

    def test_get_stripe_subscription_status_success(self, client, mock_stripe, mock_auth_session):
        """Test getting Stripe subscription status successfully."""
        mock_customer = Mock()
        mock_customer.id = 'cus_test_123'
        mock_customer.metadata = {'phone_number': '+1234567890'}
        
        mock_subscription = Mock()
        mock_subscription.id = 'sub_test_123'
        mock_subscription.status = 'active'
        mock_subscription.current_period_end = 1234567890
        mock_subscription.metadata = {'plan_type': 'monthly'}
        mock_subscription.cancel_at_period_end = False
        
        mock_stripe['Customer'].list.return_value = Mock(data=[mock_customer])
        mock_stripe['Subscription'].list.return_value = Mock(data=[mock_subscription])
        
        response = client.get('/api/stripe/subscription-status/+1234567890',
                            headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['has_subscription'] is True
        assert data['subscription']['id'] == 'sub_test_123'
        assert data['subscription']['status'] == 'active'

    def test_get_stripe_subscription_status_no_customer(self, client, mock_stripe, mock_auth_session):
        """Test getting subscription status when customer doesn't exist."""
        mock_stripe['Customer'].list.return_value = Mock(data=[])
        
        response = client.get('/api/stripe/subscription-status/+1234567890',
                            headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['has_subscription'] is False
        assert data['subscription'] is None

    def test_get_stripe_subscription_status_no_subscription(self, client, mock_stripe, mock_auth_session):
        """Test getting subscription status when customer has no active subscription."""
        mock_customer = Mock()
        mock_customer.id = 'cus_test_123'
        mock_customer.metadata = {'phone_number': '+1234567890'}
        
        mock_stripe['Customer'].list.return_value = Mock(data=[mock_customer])
        mock_stripe['Subscription'].list.return_value = Mock(data=[])
        
        response = client.get('/api/stripe/subscription-status/+1234567890',
                            headers={'Authorization': 'Bearer valid-token'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['has_subscription'] is False
        assert data['subscription'] is None


class TestStripeWebhooks:
    """Test Stripe webhook handling."""
    
    def test_webhook_missing_signature(self, client):
        """Test webhook with missing signature."""
        response = client.post('/api/stripe/webhook',
                             data=json.dumps({'type': 'test.event'}),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Missing signature' in data['error']

    def test_webhook_invalid_signature(self, client):
        """Test webhook with invalid signature."""
        response = client.post('/api/stripe/webhook',
                             data=json.dumps({'type': 'test.event'}),
                             headers={'Stripe-Signature': 'invalid_signature'},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid signature' in data['error']

    def test_webhook_checkout_completed(self, client, mock_stripe):
        """Test webhook handling for checkout.session.completed event."""
        event_data = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'metadata': {
                        'phone_number': '+1234567890',
                        'plan_type': 'monthly'
                    }
                }
            }
        }
        
        with patch('app.stripe_integration.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = event_data
            
            response = client.post('/api/stripe/webhook',
                                 data=json.dumps(event_data),
                                 headers={'Stripe-Signature': 'valid_signature'},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'success'

    def test_webhook_subscription_created(self, client, mock_stripe):
        """Test webhook handling for customer.subscription.created event."""
        event_data = {
            'type': 'customer.subscription.created',
            'data': {
                'object': {
                    'id': 'sub_test_123',
                    'metadata': {
                        'phone_number': '+1234567890',
                        'plan_type': 'monthly'
                    }
                }
            }
        }
        
        with patch('app.stripe_integration.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = event_data
            
            with patch('app.premium.get_premium_table') as mock_table:
                mock_table.return_value = Mock()
                
                response = client.post('/api/stripe/webhook',
                                     data=json.dumps(event_data),
                                     headers={'Stripe-Signature': 'valid_signature'},
                                     content_type='application/json')
                
                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['status'] == 'success'

    def test_webhook_subscription_deleted(self, client, mock_stripe):
        """Test webhook handling for customer.subscription.deleted event."""
        event_data = {
            'type': 'customer.subscription.deleted',
            'data': {
                'object': {
                    'metadata': {
                        'phone_number': '+1234567890'
                    }
                }
            }
        }
        
        with patch('app.stripe_integration.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = event_data
            
            with patch('app.premium.get_premium_table') as mock_table:
                mock_table.return_value = Mock()
                
                response = client.post('/api/stripe/webhook',
                                     data=json.dumps(event_data),
                                     headers={'Stripe-Signature': 'valid_signature'},
                                     content_type='application/json')
                
                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['status'] == 'success'


class TestStripeAuthentication:
    """Test Stripe endpoint authentication."""
    
    def test_require_auth_missing_header(self, client):
        """Test that protected Stripe endpoints require authorization header."""
        response = client.post('/api/stripe/create-checkout-session',
                             json={'plan_type': 'monthly', 'phone_number': '+1234567890'})
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization header' in data['error'].lower()

    def test_require_auth_invalid_header(self, client):
        """Test that protected Stripe endpoints reject invalid authorization header."""
        response = client.post('/api/stripe/create-checkout-session',
                             json={'plan_type': 'monthly', 'phone_number': '+1234567890'},
                             headers={'Authorization': 'Invalid token'})
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'authorization header' in data['error'].lower()

    def test_webhook_no_auth_required(self, client):
        """Test that webhook endpoint doesn't require authentication."""
        with patch('app.stripe_integration.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = {'type': 'test.event', 'data': {'object': {}}}
            
            response = client.post('/api/stripe/webhook',
                                 data=json.dumps({'type': 'test.event'}),
                                 headers={'Stripe-Signature': 'valid_signature'},
                                 content_type='application/json')
            
            # Should not return 401, but may return other errors
            assert response.status_code != 401
