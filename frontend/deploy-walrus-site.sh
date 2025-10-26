#!/bin/bash

# Walrus Sites Manual Deployment
# Bu script sitenizi Walrus'a yükler ve 42tree domain'i ile bağlar

set -e

echo "🔧 Building frontend..."
npm run build

echo "📦 Creating site archive..."
cd dist
tar -czf ../site.tar.gz *
cd ..

echo "☁️  Uploading to Walrus..."
BLOB_ID=$(walrus store --epochs 5 site.tar.gz | grep -oP '[a-zA-Z0-9_-]{40,}' | head -1)

if [ -z "$BLOB_ID" ]; then
    echo "❌ Failed to get blob ID"
    exit 1
fi

echo "✅ Site uploaded! Blob ID: $BLOB_ID"
echo "🌐 Site URL: https://aggregator.walrus-testnet.walrus.space/v1/$BLOB_ID"

echo ""
echo "📋 Next steps:"
echo "1. Go to https://testnet.suins.io/account/my-names/"
echo "2. Click on your 42tree domain"
echo "3. Add Walrus Sites record:"
echo "   Type: TXT"
echo "   Name: @"
echo "   Value: walrus-site-${BLOB_ID}"
echo ""
echo "4. Your site will be live at: https://42tree.walrus.site"
echo "   Or via portal: https://trwal.app/site/42tree.sui"

# Cleanup
rm site.tar.gz
