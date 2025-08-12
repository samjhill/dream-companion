#!/usr/bin/env python3
"""
Test script for Stripe integration
Run this to test if your Stripe configuration is working
"""

import os
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_stripe_config():
    """Test if Stripe is properly configured"""
    print("Testing Stripe configuration...")
    
    # Check environment variables
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
    stripe_webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    monthly_price_id = os.getenv('STRIPE_MONTHLY_PRICE_ID')
    quarterly_price_id = os.getenv('STRIPE_QUARTERLY_PRICE_ID')
    yearly_price_id = os.getenv('STRIPE_YEARLY_PRICE_ID')
    
    print(f"STRIPE_SECRET_KEY: {'✓ Set' if stripe_secret_key else '✗ Missing'}")
    print(f"STRIPE_WEBHOOK_SECRET: {'✓ Set' if stripe_webhook_secret else '✗ Missing'}")
    print(f"STRIPE_MONTHLY_PRICE_ID: {'✓ Set' if monthly_price_id else '✗ Missing'}")
    print(f"STRIPE_QUARTERLY_PRICE_ID: {'✓ Set' if quarterly_price_id else '✗ Missing'}")
    print(f"STRIPE_YEARLY_PRICE_ID: {'✓ Set' if yearly_price_id else '✗ Missing'}")
    
    if not stripe_secret_key:
        print("\nERROR: STRIPE_SECRET_KEY is not set!")
        return False
    
    # Test Stripe API connection
    try:
        stripe.api_key = stripe_secret_key
        account = stripe.Account.retrieve()
        print(f"\n✓ Stripe connection successful!")
        print(f"  Account ID: {account.id}")
        print(f"  Account name: {account.business_profile.name if account.business_profile else 'N/A'}")
        return True
    except stripe.error.AuthenticationError:
        print("\n✗ Stripe authentication failed - check your secret key")
        return False
    except Exception as e:
        print(f"\n✗ Stripe connection error: {str(e)}")
        return False

def test_price_ids():
    """Test if the configured price IDs are valid"""
    print("\nTesting price IDs...")
    
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe_secret_key:
        print("Cannot test price IDs without Stripe secret key")
        return
    
    stripe.api_key = stripe_secret_key
    
    price_ids = {
        'monthly': os.getenv('STRIPE_MONTHLY_PRICE_ID'),
        'quarterly': os.getenv('STRIPE_QUARTERLY_PRICE_ID'),
        'yearly': os.getenv('STRIPE_YEARLY_PRICE_ID')
    }
    
    for plan_type, price_id in price_ids.items():
        if not price_id:
            print(f"  {plan_type}: ✗ No price ID configured")
            continue
            
        try:
            price = stripe.Price.retrieve(price_id)
            print(f"  {plan_type}: ✓ {price_id} - {price.unit_amount/100:.2f} {price.currency.upper()}")
        except stripe.error.InvalidRequestError:
            print(f"  {plan_type}: ✗ Invalid price ID: {price_id}")
        except Exception as e:
            print(f"  {plan_type}: ✗ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 50)
    print("Stripe Integration Test")
    print("=" * 50)
    
    success = test_stripe_config()
    
    if success:
        test_price_ids()
    
    print("\n" + "=" * 50)
    if success:
        print("✓ All tests passed! Your Stripe configuration looks good.")
    else:
        print("✗ Some tests failed. Please check your configuration.")
    print("=" * 50)
