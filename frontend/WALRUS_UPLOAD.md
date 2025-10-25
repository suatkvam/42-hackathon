# Walrus Image Upload Guide

## Problem
The Walrus HTTP API (`https://publisher.walrus-testnet.walrus.space/v1/store`) is currently returning 404 errors, which means the web-based upload is not working.

## Solution: Use Walrus CLI

### Step 1: Install Walrus CLI
```bash
# Follow Walrus documentation to install the CLI
# https://docs.walrus.site/
```

### Step 2: Configure Walrus
```bash
# Setup Walrus config for testnet
walrus --wallet <your-wallet> --network testnet
```

### Step 3: Upload Image
```bash
# Upload your image file
walrus store /path/to/your/image.png

# This will return a blob_id like:
# fd_QCXP__jt5V4QvWJMAZ_v1f6nlYs7jw8_Gjt5SqTU
```

### Step 4: Use Blob ID in App
1. Copy the `blob_id` from the CLI output
2. Paste it in the "Or enter Walrus blob ID manually" field in the Create Profile form
3. The image will be loaded from: `https://aggregator.walrus-testnet.walrus.space/v1/{blob_id}`

## Alternative: Direct Image URLs
If you don't want to use Walrus CLI, you can:
1. Upload your image to any image hosting service (Imgur, etc.)
2. Get the direct image URL
3. Use that URL directly (requires code modification)

## Temporary Workaround
For testing purposes, you can use these pre-uploaded test blob IDs:
- (Add your pre-uploaded blob IDs here after uploading via CLI)

## Fix HTTP API Upload
To fix the web-based upload, we need to:
1. Verify the correct Walrus HTTP API endpoint
2. Check if Walrus testnet HTTP API is available
3. Update the `walrusService.ts` file with correct endpoint and format
4. Or switch to using a backend proxy that uses Walrus CLI

## Code Changes Needed
The issue is in `frontend/src/walrusService.ts`:
- Current endpoint: `https://publisher.walrus-testnet.walrus.space/v1/store`
- This endpoint returns 404
- Need to find the correct HTTP API documentation or use CLI-based solution
