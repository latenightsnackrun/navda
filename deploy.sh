#!/bin/bash

# NAVDA Deployment Script
# This script helps prepare the project for deployment

echo "🚀 NAVDA Deployment Preparation"
echo "================================"

# Check if we're in the right directory
if [ ! -f "main/package.json" ] || [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Frontend preparation
echo "📦 Preparing frontend for Netlify deployment..."
cd main

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Backend preparation
echo "🐍 Preparing backend for Render deployment..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📥 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy frontend to Netlify:"
echo "   - Connect GitHub repository"
echo "   - Set base directory to 'main/'"
echo "   - Configure environment variables"
echo "3. Deploy backend to Render:"
echo "   - Connect GitHub repository"
echo "   - Set root directory to 'backend/'"
echo "   - Configure environment variables"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
