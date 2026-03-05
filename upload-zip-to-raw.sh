#!/bin/bash

echo "📤 Uploading ZIP file to get raw URL..."
echo ""

# Your ZIP file URL from Google Drive
ZIP_URL="https://drive.google.com/file/d/1nDthyBfFa-cH1UMqcd9D3R_5Agy2WRL3/view?usp=drivesdk"

# First, download the ZIP file from Google Drive
echo "1️⃣ Downloading ZIP from Google Drive..."
cd ~

# Extract file ID from URL
FILE_ID="1nDthyBfFa-cH1UMqcd9D3R_5Agy2WRL3"

# Download using gdown (install if needed)
if ! command -v gdown &> /dev/null; then
    echo "Installing gdown..."
    pip install gdown
fi

echo "Downloading file ID: $FILE_ID"
gdown "https://drive.google.com/uc?id=$FILE_ID" -O primestone-backup.zip

if [ $? -ne 0 ]; then
    echo "❌ Download failed. Trying alternative method..."
    
    # Alternative: Use curl with cookie handling
    curl -L -b /tmp/cookies.txt \
         "https://drive.google.com/uc?export=download&id=$FILE_ID" \
         > primestone-backup.zip
fi

# Check if download succeeded
if [ ! -f primestone-backup.zip ]; then
    echo "❌ Failed to download ZIP file"
    exit 1
fi

echo "✅ ZIP downloaded successfully"
echo ""

# Option 1: Upload entire ZIP to raw service
echo "2️⃣ Uploading ZIP to raw service..."

# Method A: Use file.io (files expire after 1 download or 7 days)
echo "📤 Uploading to file.io..."
curl -F "file=@primestone-backup.zip" https://file.io > upload-response.json
FILE_IO_LINK=$(cat upload-response.json | grep -o '"link":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$FILE_IO_LINK" ]; then
    echo "✅ file.io upload successful!"
    echo "📋 Download link: $FILE_IO_LINK"
    echo ""
    echo "⚠️  Note: file.io links expire after first download"
fi

# Method B: Use transfer.sh (if still available)
echo "📤 Uploading to transfer.sh..."
curl --upload-file primestone-backup.zip https://transfer.sh/primestone-backup.zip > transfer-link.txt
TRANSFER_LINK=$(cat transfer-link.txt)

if [ ! -z "$TRANSFER_LINK" ]; then
    echo "✅ transfer.sh upload successful!"
    echo "📋 Download link: $TRANSFER_LINK"
    echo "⚠️  Note: Links expire after 14 days"
fi

# Method C: Create a text file with all contents (BEST FOR AI)
echo ""
echo "3️⃣ Creating complete text file with all code (BEST FOR AI)..."

# Create a single text file with all contents
cd ~
unzip -q primestone-backup.zip -d primestone-extracted
cd primestone-extracted

{
    echo "========================================================"
    echo "PRIMESTONE INVESTMENT - COMPLETE CODE FOR AI ASSISTANT"
    echo "Generated: $(date)"
    echo "========================================================"
    echo ""
    
    # Find all files and add them
    find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.sql" -o -name "*.sh" -o -name ".env" -o -name "*.css" \) | sort | while read file; do
        echo "========================================================"
        echo "FILE: $file"
        echo "========================================================"
        echo ""
        cat "$file"
        echo ""
        echo ""
    done
} > /storage/emulated/0/Download/primestone-complete-code.txt

echo "✅ Complete code file created!"
echo "📁 Location: /storage/emulated/0/Download/primestone-complete-code.txt"
echo "📊 Size: $(du -h /storage/emulated/0/Download/primestone-complete-code.txt | cut -f1)"
echo ""

# Upload this text file to a pastebin service for raw access
echo "4️⃣ Uploading text file to pastebin for raw URL..."

# Upload to rpa.st
echo "📤 Uploading to rpa.st..."
curl -s -F "file=@/storage/emulated/0/Download/primestone-complete-code.txt" https://rpa.st/api/upload > rpa-response.json

RAW_URL=$(cat rpa-response.json | grep -o 'https://rpa.st/raw/[^"]*')
VIEW_URL=$(cat rpa-response.json | grep -o 'https://rpa.st/[^"]*')

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                       ✅ FINAL RESULT                              ║"
echo "╠═══════════════════════════════════════════════════════════════════╣"
echo "║                                                                   ║"
echo "║  📋 RAW URL (Give this to AI assistant):                         ║"
echo "║  $RAW_URL  ║"
echo "║                                                                   ║"
echo "║  👁️  View URL (Optional):                                        ║"
echo "║  $VIEW_URL          ║"
echo "║                                                                   ║"
echo "║  💾 Local copy: /storage/emulated/0/Download/primestone-complete-code.txt ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "The AI assistant can access the RAW URL directly and see all your code!"

# Clean up
cd ~
rm -rf primestone-extracted primestone-backup.zip upload-response.json transfer-link.txt rpa-response.json
