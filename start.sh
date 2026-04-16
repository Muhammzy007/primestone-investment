#!/bin/bash

echo "🚀 Starting PrimeStone Investment Platform..."
echo "=============================================="

# Kill any existing node processes on port 3000
echo "🧹 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

sleep 2

# Check and start MariaDB
echo "📦 Checking database..."
if pgrep -f mariadbd > /dev/null; then
    echo "✅ Database already running"
else
    echo "🔄 Starting MariaDB..."
    mariadbd-safe --datadir=/data/data/com.termux/files/usr/var/lib/mysql --user=u0_a320 &
    sleep 5
    echo "✅ Database started"
fi

# Test database connection
if mysql -u u0_a320 -p129486 -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd ~/primestone-investment/backend
npm run dev &

echo "✅ Backend starting on port 3000"
echo "🌐 Website: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"
