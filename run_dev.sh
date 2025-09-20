#!/bin/bash

# ATC System Development Server Startup Script

echo "🚀 Starting ATC System Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Flask backend
echo "📡 Starting Flask backend on http://localhost:5000"
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start React frontend
echo "⚛️  Starting React frontend on http://localhost:5173"
cd ../main
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers are running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait

