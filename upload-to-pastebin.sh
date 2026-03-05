#!/bin/bash

echo "📤 Uploading files to pastebin service..."

# Choose service: 1=Gist, 2=rpa.st, 3=gbin.me
SERVICE=2

case $SERVICE in
    1)
        # GitHub Gist
        echo "Using GitHub Gist..."
        cd ~/primestone-investment
        
        # Combine all files into one for gist
        echo "=== PRIMESTONE INVESTMENT COMPLETE CODE ===" > /tmp/complete-code.txt
        echo "Generated: $(date)" >> /tmp/complete-code.txt
        echo "" >> /tmp/complete-code.txt
        
        for file in $(find backend frontend database -type f -name "*.js" -o -name "*.json" -o -name "*.sql" -o -name "*.sh" -o -name ".env"); do
            echo "=========================================" >> /tmp/complete-code.txt
            echo "FILE: $file" >> /tmp/complete-code.txt
            echo "=========================================" >> /tmp/complete-code.txt
            cat "$file" >> /tmp/complete-code.txt
            echo "" >> /tmp/complete-code.txt
        done
        
        # Upload to gist (requires gh installed)
        if command -v gh &> /dev/null; then
            gh gist create /tmp/complete-code.txt --public --desc "PrimeStone Investment Complete Code"
        else
            echo "GitHub CLI not installed. Install with: pkg install gh"
        fi
        ;;
        
    2)
        # rpa.st (rpaste)
        echo "Uploading to rpa.st..."
        cd ~/primestone-investment
        
        # Create combined file
        {
            echo "# PrimeStone Investment Platform - Complete Code"
            echo "# Generated: $(date)"
            echo ""
            
            for file in $(find backend frontend database -type f -name "*.js" -o -name "*.json" -o -name "*.sql" -o -name "*.sh" -o -name ".env" | sort); do
                echo "#" 
                echo "# FILE: $file"
                echo "#" 
                echo "\`\`\`"
                cat "$file"
                echo "\`\`\`"
                echo ""
            done
        } > /tmp/complete-for-paste.txt
        
        # Upload
        echo "Uploading... (this may take a moment)"
        RESPONSE=$(curl -s -F "file=@/tmp/complete-for-paste.txt" https://rpa.st/api/upload)
        
        # Extract raw URL
        RAW_URL=$(echo "$RESPONSE" | grep -o 'https://rpa.st/raw/[^"]*')
        VIEW_URL=$(echo "$RESPONSE" | grep -o 'https://rpa.st/[^"]*')
        
        echo ""
        echo "✅ UPLOAD COMPLETE!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 View URL:  $VIEW_URL"
        echo "🔗 RAW URL:   $RAW_URL"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Give the RAW URL to the AI assistant"
        ;;
        
    3)
        # gbin.me
        echo "Uploading to gbin.me..."
        cd ~/primestone-investment
        
        # Create combined file
        cat $(find backend frontend database -type f -name "*.js" -o -name "*.json" -o -name "*.sql" -o -name "*.sh") > /tmp/all-code.txt
        
        # Upload
        RESPONSE=$(curl -s -F "f=@/tmp/all-code.txt" gbin.me)
        PASTE_ID=$(echo "$RESPONSE" | grep -o '[a-f0-9]\{8,\}' | head -1)
        
        echo ""
        echo "✅ UPLOAD COMPLETE!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "RAW URL: https://gbin.me/raw/$PASTE_ID"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
esac
