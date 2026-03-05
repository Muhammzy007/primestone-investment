#!/bin/bash

# =============================================================
# SIMPLE GITHUB GIST CREATOR
# Just creates a gist with ALL your existing files
# =============================================================

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║        PrimeStone Investment - GitHub Gist Creator               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    pkg install gh -y
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Please authenticate with GitHub:"
    gh auth login
fi

cd ~/primestone-investment

echo "📦 Creating public gist with ALL your files..."
echo ""

# Create gist with ALL existing files
gh gist create --public -d "PrimeStone Investment Complete Codebase" \
    backend/package.json \
    backend/.env \
    backend/server.js \
    backend/config/database.js \
    backend/middleware/auth.js \
    backend/routes/investmentRoutes.js \
    backend/routes/paymentRoutes.js \
    backend/routes/withdrawalRoutes.js \
    backend/routes/adminRoutes.js \
    backend/services/blockchainVerificationService.js \
    backend/services/yieldService.js \
    database/schema.sql \
    frontend/package.json \
    frontend/tailwind.config.js \
    frontend/src/index.js \
    frontend/src/App.js \
    frontend/src/context/AuthContext.js \
    frontend/src/context/ThemeContext.js \
    frontend/src/components/ProtectedRoute.js \
    frontend/src/components/layout/Navbar.js \
    frontend/src/components/layout/Footer.js \
    frontend/src/pages/Home.js \
    frontend/src/index.css \
    backup-and-transfer.sh \
    simple-backup.sh \
    complete-backup.sh \
    backup-my-project.sh \
    upload-zip-to-raw.sh

echo ""
echo "✅ DONE! The gist URL will appear above."
echo "Copy that URL and the new assistant can see EVERYTHING!"
