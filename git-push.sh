#!/bin/bash

cd ~/primestone-investment

echo "📂 Current directory: $(pwd)"
echo ""
echo "📊 Changed files:"
git status -s
echo ""

read -p "✅ Commit message: " msg

if [ -z "$msg" ]; then
    msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo ""
echo "📤 Adding files..."
git add .

echo "📝 Committing: $msg"
git commit -m "$msg"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Update complete!"
