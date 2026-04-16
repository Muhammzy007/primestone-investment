#!/data/data/com.termux/files/usr/bin/bash
echo "🔄 Checking MariaDB status..."

# Check if process is running
if pgrep -f mariadbd > /dev/null; then
    echo "✅ MariaDB is running"
else
    echo "❌ MariaDB not running. Starting..."
    mariadbd-safe --datadir=/data/data/com.termux/files/usr/var/lib/mysql --user=u0_a320 &
    sleep 3
    if pgrep -f mariadbd > /dev/null; then
        echo "✅ MariaDB started successfully"
    else
        echo "❌ Failed to start MariaDB"
    fi
fi

# Test connection
if mariadb -u u0_a320 -p129486 -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
fi
