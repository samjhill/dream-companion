#!/bin/bash

# Dream Companion App Deployment Script
# This script builds and deploys the backend without asking for confirmation

echo "🚀 Starting Dream Companion App deployment..."

# Build the SAM application
echo "📦 Building SAM application..."
sam build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy without confirmation
echo "🚀 Deploying to AWS..."
sam deploy 2>&1 | tee deploy_output.log

deploy_exit_code=${PIPESTATUS[0]}

if [ $deploy_exit_code -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 API Gateway URL: https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod"
elif grep -q "No changes to deploy" deploy_output.log; then
    echo "✅ Stack is already up to date - no changes needed!"
    echo "🌐 API Gateway URL: https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod"
else
    echo "❌ Deployment failed!"
    cat deploy_output.log
    exit 1
fi

# Clean up log file
rm -f deploy_output.log