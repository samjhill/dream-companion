from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import stripe
import os
import boto3
from datetime import datetime, timedelta
from functools import wraps
from .auth import require_cognito_auth, get_cognito_user_info

stripe_bp = Blueprint('stripe_bp', __name__)

def load_stripe_secrets():
    """Load Stripe configuration from AWS Secrets Manager"""
    try:
        secrets_arn = os.getenv('STRIPE_SECRETS_ARN')
        if not secrets_arn:
            print("ERROR: STRIPE_SECRETS_ARN environment variable not set")
            return False

        # Create Secrets Manager client
        secrets_client = boto3.client('secretsmanager', region_name='us-east-1')

        # Get the secret
        response = secrets_client.get_secret_value(SecretId=secrets_arn)
        secret_string = response['SecretString']

        # Parse the secret (assuming it's JSON)
        import json
        secrets = json.loads(secret_string)

        # Set Stripe configuration
        stripe.api_key = secrets.get('STRIPE_SECRET_KEY')

        # Configure Stripe for test mode if using test keys
        if stripe.api_key and stripe.api_key.startswith('sk_test_'):
            print("🧪 Stripe configured for TEST/SANDBOX mode")
        elif stripe.api_key and stripe.api_key.startswith('sk_live_'):
            print("🚀 Stripe configured for LIVE/PRODUCTION mode")
        else:
            print("⚠️  Warning: Unknown Stripe key format")

        global STRIPE_WEBHOOK_SECRET, SUBSCRIPTION_PRICES

        STRIPE_WEBHOOK_SECRET = secrets.get('STRIPE_WEBHOOK_SECRET')
        SUBSCRIPTION_PRICES = {
            'monthly': secrets.get('STRIPE_MONTHLY_PRICE_ID'),
            'quarterly': secrets.get('STRIPE_QUARTERLY_PRICE_ID'),
            'yearly': secrets.get('STRIPE_YEARLY_PRICE_ID')
        }

        print("✅ Stripe secrets loaded successfully from Secrets Manager")
        return True

    except Exception as e:
        print(f"ERROR: Failed to load Stripe secrets: {str(e)}")
        return False

# Initialize Stripe configuration
if not load_stripe_secrets():
    # Fallback to environment variables for local development
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    # Configure Stripe for test mode if using test keys
    if stripe.api_key and stripe.api_key.startswith('sk_test_'):
        print("🧪 Stripe configured for TEST/SANDBOX mode (env vars)")
    elif stripe.api_key and stripe.api_key.startswith('sk_live_'):
        print("🚀 Stripe configured for LIVE/PRODUCTION mode (env vars)")
    else:
        print("⚠️  Warning: Unknown Stripe key format (env vars)")

    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
    SUBSCRIPTION_PRICES = {
        'monthly': os.getenv('STRIPE_MONTHLY_PRICE_ID'),
        'quarterly': os.getenv('STRIPE_QUARTERLY_PRICE_ID'),
        'yearly': os.getenv('STRIPE_YEARLY_PRICE_ID')
    }

# Use the new Cognito authentication decorator
require_auth = require_cognito_auth

@stripe_bp.route('/create-checkout-session', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_auth
def create_checkout_session():
    """Create a Stripe Checkout session for subscription"""
    try:
        # Check if Stripe is properly configured
        if not stripe.api_key:
            print("ERROR: Stripe API key is not configured")
            return jsonify({"error": "Stripe is not properly configured"}), 500

        data = request.get_json()
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({"error": "No data received"}), 400

        plan_type = data.get('plan_type')  # 'monthly', 'quarterly', 'yearly'
        phone_number = data.get('phone_number')
        success_url = data.get('success_url', 'https://clarasdreamguide.com/app/premium?success=true')
        cancel_url = data.get('cancel_url', 'https://clarasdreamguide.com/app/premium?canceled=true')

        print(f"Creating checkout session for plan: {plan_type}, phone: {phone_number}")

        if not plan_type or not phone_number:
            print(f"ERROR: Missing required fields - plan_type: {plan_type}, phone_number: {phone_number}")
            return jsonify({"error": "Missing plan_type or phone_number"}), 400

        if plan_type not in SUBSCRIPTION_PRICES:
            print(f"ERROR: Invalid plan type: {plan_type}. Available plans: {list(SUBSCRIPTION_PRICES.keys())}")
            return jsonify({"error": f"Invalid plan type: {plan_type}"}), 400

        price_id = SUBSCRIPTION_PRICES[plan_type]
        if not price_id:
            print(f"ERROR: Price ID not found for plan type: {plan_type}")
            return jsonify({"error": f"Price ID not configured for plan type: {plan_type}"}), 500

        print(f"Using price ID: {price_id}")

        # Create Stripe Checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=phone_number,  # Store phone number for webhook
            metadata={
                'phone_number': phone_number,
                'plan_type': plan_type
            },
            subscription_data={
                'metadata': {
                    'phone_number': phone_number,
                    'plan_type': plan_type
                }
            }
        )

        print(f"Successfully created checkout session: {checkout_session.id}")

        return jsonify({
            'session_id': checkout_session.id,
            'checkout_url': checkout_session.url
        }), 200

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        return jsonify({"error": f"Stripe error: {str(e)}"}), 400
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"Failed to create checkout session: {str(e)}"}), 500

@stripe_bp.route('/create-portal-session', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_auth
def create_portal_session():
    """Create a Stripe Customer Portal session for subscription management"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        return_url = data.get('return_url', 'https://clarasdreamguide.com/app/premium')

        if not phone_number:
            return jsonify({"error": "Missing phone_number"}), 400

        # Find customer by phone number in metadata
        customers = stripe.Customer.list(limit=100)
        customer = None

        for cust in customers.data:
            if cust.metadata.get('phone_number') == phone_number:
                customer = cust
                break

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer.id,
            return_url=return_url
        )

        return jsonify({
            'portal_url': portal_session.url
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to create portal session: {str(e)}"}), 500

@stripe_bp.route('/webhook', methods=['POST'])
@cross_origin(supports_credentials=True)
def stripe_webhook():
    """Handle Stripe webhooks for subscription events"""
    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')

        if not sig_header:
            return jsonify({"error": "Missing signature"}), 400

        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            return jsonify({"error": "Invalid payload"}), 400
        except stripe.error.SignatureVerificationError as e:
            return jsonify({"error": "Invalid signature"}), 400

        # Handle the event
        if event['type'] == 'checkout.session.completed':
            handle_checkout_completed(event['data']['object'])
        elif event['type'] == 'customer.subscription.created':
            handle_subscription_created(event['data']['object'])
        elif event['type'] == 'customer.subscription.updated':
            handle_subscription_updated(event['data']['object'])
        elif event['type'] == 'customer.subscription.deleted':
            handle_subscription_deleted(event['data']['object'])
        elif event['type'] == 'invoice.payment_succeeded':
            handle_payment_succeeded(event['data']['object'])
        elif event['type'] == 'invoice.payment_failed':
            handle_payment_failed(event['data']['object'])

        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"error": f"Webhook error: {str(e)}"}), 500

def handle_checkout_completed(session):
    """Handle successful checkout completion"""
    phone_number = session.metadata.get('phone_number')
    plan_type = session.metadata.get('plan_type')

    print(f"Checkout completed for {phone_number} with plan {plan_type}")
    # You can add additional logic here, like sending welcome emails

def handle_subscription_created(subscription):
    """Handle new subscription creation"""
    phone_number = subscription.metadata.get('phone_number')
    plan_type = subscription.metadata.get('plan_type')

    print(f"Subscription created for {phone_number} with plan {plan_type}")

    # Update premium status in DynamoDB
    try:
        from .premium import get_premium_table
        from datetime import datetime, timedelta

        table = get_premium_table()

        # Calculate subscription end date based on plan type
        if plan_type == 'monthly':
            duration_days = 30
        elif plan_type == 'quarterly':
            duration_days = 90
        elif plan_type == 'yearly':
            duration_days = 365
        else:
            duration_days = 30  # Default to monthly

        subscription_end = datetime.utcnow() + timedelta(days=duration_days)

        table.put_item(Item={
            'phone_number': phone_number,
            'subscription_type': plan_type,
            'subscription_start': datetime.utcnow().isoformat(),
            'subscription_end': subscription_end.isoformat(),
            'stripe_subscription_id': subscription.id,
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

        print(f"Premium status updated for {phone_number}")
    except Exception as e:
        print(f"Error updating premium status: {e}")

def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    phone_number = subscription.metadata.get('phone_number')
    status = subscription.status

    print(f"Subscription updated for {phone_number}: {status}")
    # Update subscription status in your database

def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    phone_number = subscription.metadata.get('phone_number')

    print(f"Subscription deleted for {phone_number}")

    # Remove premium status from DynamoDB
    try:
        from .premium import get_premium_table

        table = get_premium_table()
        table.delete_item(Key={'phone_number': phone_number})

        print(f"Premium status removed for {phone_number}")
    except Exception as e:
        print(f"Error removing premium status: {e}")

def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    subscription_id = invoice.subscription
    subscription = stripe.Subscription.retrieve(subscription_id)
    phone_number = subscription.metadata.get('phone_number')

    print(f"Payment succeeded for {phone_number}")

    # Extend premium access in DynamoDB
    try:
        from .premium import get_premium_table
        from datetime import datetime, timedelta

        table = get_premium_table()
        plan_type = subscription.metadata.get('plan_type', 'monthly')

        # Calculate new subscription end date
        if plan_type == 'monthly':
            duration_days = 30
        elif plan_type == 'quarterly':
            duration_days = 90
        elif plan_type == 'yearly':
            duration_days = 365
        else:
            duration_days = 30

        subscription_end = datetime.utcnow() + timedelta(days=duration_days)

        table.put_item(Item={
            'phone_number': phone_number,
            'subscription_type': plan_type,
            'subscription_start': datetime.utcnow().isoformat(),
            'subscription_end': subscription_end.isoformat(),
            'stripe_subscription_id': subscription.id,
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

        print(f"Premium access extended for {phone_number}")
    except Exception as e:
        print(f"Error extending premium access: {e}")

def handle_payment_failed(invoice):
    """Handle failed payment"""
    subscription_id = invoice.subscription
    subscription = stripe.Subscription.retrieve(subscription_id)
    phone_number = subscription.metadata.get('phone_number')

    print(f"Payment failed for {phone_number}")
    # Handle failed payment (send email, mark for review, etc.)

@stripe_bp.route('/subscription-status/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_auth
def get_stripe_subscription_status(phone_number):
    """Get subscription status from Stripe"""
    try:
        # Find customer by phone number
        customers = stripe.Customer.list(limit=100)
        customer = None

        for cust in customers.data:
            if cust.metadata.get('phone_number') == phone_number:
                customer = cust
                break

        if not customer:
            return jsonify({
                'has_subscription': False,
                'subscription': None
            }), 200

        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer.id,
            status='active'
        )

        if not subscriptions.data:
            return jsonify({
                'has_subscription': False,
                'subscription': None
            }), 200

        subscription = subscriptions.data[0]

        return jsonify({
            'has_subscription': True,
            'subscription': {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_end': subscription.current_period_end,
                'plan_type': subscription.metadata.get('plan_type'),
                'cancel_at_period_end': subscription.cancel_at_period_end
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get subscription status: {str(e)}"}), 500
