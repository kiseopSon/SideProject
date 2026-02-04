#!/bin/bash

echo "========================================"
echo "Starting Cosmetics Ingredient Analyzer"
echo "========================================"
echo ""

# Start backend server (background)
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8500 &
BACKEND_PID=$!

# Start frontend server (background)
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Servers started!"
echo "Backend: http://localhost:8500 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:9005 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup on exit
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 대기
wait
