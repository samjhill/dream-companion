#!/bin/bash

# Dream Companion App - Deployment Script
# This script deploys your app using AWS SAM

echo "🚀 Dream Companion App - Deployment"
echo "===================================="

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
echo "✅ Building application..."

# Build the application
sam build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful! Deploying..."

# Deploy (no parameters needed since we're using Secrets Manager)
sam deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📝 Your Stripe secrets are loaded from AWS Secrets Manager"
    echo "🔗 Check the STRIPE_SETUP.md file for detailed instructions"
else
    echo "❌ Deployment failed!"
    exit 1
fi
