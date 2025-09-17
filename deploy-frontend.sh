#!/bin/bash

# Dream Companion App Frontend Deployment Script
# This script builds the frontend for production

echo "🎨 Building Dream Companion frontend..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Built files are in frontend/dist/"
    echo "🚀 Ready for deployment to your hosting service"
else
    echo "❌ Frontend build failed!"
    exit 1
fi
