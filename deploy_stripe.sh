#!/bin/bash

# Dream Companion App - Stripe Deployment Script
# This script helps deploy your app with Stripe integration

echo "🚀 Dream Companion App - Stripe Deployment"
echo "=========================================="

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo ""
echo "📋 Please provide your Stripe configuration:"
echo ""

# Prompt for Stripe parameters
read -p "Enter your Stripe Secret Key (starts with sk_): " STRIPE_SECRET_KEY
read -p "Enter your Stripe Webhook Secret (starts with whsec_): " STRIPE_WEBHOOK_SECRET
read -p "Enter your Monthly Price ID (starts with price_): " STRIPE_MONTHLY_PRICE_ID
read -p "Enter your Quarterly Price ID (starts with price_): " STRIPE_QUARTERLY_PRICE_ID
read -p "Enter your Yearly Price ID (starts with price_): " STRIPE_YEARLY_PRICE_ID

# Validate inputs
if [[ -z "$STRIPE_SECRET_KEY" || -z "$STRIPE_WEBHOOK_SECRET" || -z "$STRIPE_MONTHLY_PRICE_ID" || -z "$STRIPE_QUARTERLY_PRICE_ID" || -z "$STRIPE_YEARLY_PRICE_ID" ]]; then
    echo "❌ All Stripe parameters are required!"
    exit 1
fi

echo ""
echo "✅ All parameters provided. Building application..."

# Build the application
sam build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful! Deploying..."

# Deploy with parameters
sam deploy \
    --parameter-overrides \
        "StripeSecretKey=$STRIPE_SECRET_KEY" \
        "StripeWebhookSecret=$STRIPE_WEBHOOK_SECRET" \
        "StripeMonthlyPriceId=$STRIPE_MONTHLY_PRICE_ID" \
        "StripeQuarterlyPriceId=$STRIPE_QUARTERLY_PRICE_ID" \
        "StripeYearlyPriceId=$STRIPE_YEARLY_PRICE_ID"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Test your Stripe integration with the test script:"
    echo "   cd src && python test_stripe.py"
    echo "2. Update your webhook endpoint in Stripe Dashboard"
    echo "3. Test subscription creation"
    echo ""
    echo "🔗 Check the STRIPE_SETUP.md file for detailed instructions"
else
    echo "❌ Deployment failed!"
    exit 1
fi
