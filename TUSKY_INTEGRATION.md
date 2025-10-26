# 🦊 Tusky Vault Integration

This project enables users to **securely store images** in a vault using the **Tusky decentralized storage platform**, with the future option to **convert them into NFTs**.

---

## 🚀 Features

✅ **Image Upload:** Upload images directly to the Tusky vault  
✅ **Vault Management:** View, list, and delete all stored assets  
✅ **Secure Storage:** End-to-end encrypted, decentralized storage (Walrus Protocol)  
🔜 **NFT Minting:** Convert assets into NFTs on the Sui blockchain (Tusky “coming soon”)  
🔜 **Token Gated Access:** Token-based access to private vaults (coming in 2025)

---

## 📦 Setup

### 1️⃣ Install Dependencies
```bash
cd frontend
npm install
2️⃣ Set Environment Variables
Create a .env file and add the following information:

bash
Kodu kopyala
VITE_TUSKY_API_KEY=your_api_key_here
VITE_TUSKY_VAULT_ID=your_vault_id_here
VITE_TUSKY_API_URL=https://api.tusky.io
You can also copy from .env.example.

3️⃣ Start the Development Server
bash
Kodu kopyala
npm run dev
🔑 Obtaining API Key and Vault ID
Go to Tusky App

Log in with your Sui wallet or Google/Twitch account

Create a new vault or use an existing one

Create a new API key from Settings > API Keys

Get your Vault ID from the URL:

bash
Kodu kopyala
https://app.tusky.io/vaults/YOUR_VAULT_ID/assets
📂 File Structure
bash
Kodu kopyala
frontend/
├── src/
│   ├── tuskyService.ts      # Tusky API service functions
│   ├── VaultManager.tsx     # Vault management component
│   ├── walrusService.ts     # Walrus storage service
│   └── App.tsx              # Main application routing
├── .env                     # Environment variables (not committed)
└── .env.example             # Environment variables template
🔧 API Functions
tuskyService.ts

Function	Description
uploadImageToTusky(file)	Upload an image
getVaultAssets()	Retrieve all assets
getAsset(assetId)	Retrieve a specific asset
deleteAsset(assetId)	Delete an asset
mintNFTFromAsset(assetId, metadata)	Mint an NFT (coming soon)
getRandomAssets(count)	Get random assets (for avatars)

🎨 Usage
Accessing Vault Manager
Visit:

bash
Kodu kopyala
http://localhost:5173/vault
Image Upload
Click "Upload Image"

Select an image from your computer

The image will automatically upload to your Tusky vault

NFT Creation (Coming Soon)
Click on an asset

Click "Make NFT"

Enter name and description

Click "Create NFT"

🔐 Security
API keys are stored securely in .env (not pushed to Git)

All vault data is end-to-end encrypted

Uses the Walrus decentralized storage protocol

Built on Sui blockchain infrastructure

📚 Resources
Tusky Docs

Tusky App

Walrus Protocol

Sui Blockchain

🐛 Known Issues & Workarounds
🧊 Walrus Testnet Down (Profile Upload Error)
Issue: Uploads fail when Walrus Testnet is unavailable.
Workarounds:

Use Default Avatars (✅ Recommended) – 4 default SVG avatars are available

Manual Upload (CLI) –

bash
Kodu kopyala
cargo install walrus-cli
walrus store image.png
Then paste the blob_id into the profile form

Wait for Testnet Restoration – Upload button will resume automatically

🧩 Tusky Public API Unavailable (404 Error)
Issue: Tusky’s public API is not yet live (/v1/vaults/{id}/assets returns 404).
Solutions:

A) Use Tusky Web App directly → https://app.tusky.io/vaults/YOUR_VAULT_ID/assets

B) Wait for Tusky TypeScript SDK → npm install @tusky/sdk (coming soon)

C) Check API Docs for scope & endpoint updates

D) Use a local proxy if CORS issues occur:

ts
Kodu kopyala
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/tusky': {
        target: 'https://api.tusky.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tusky/, '')
      }
    }
  }
});
🪙 NFT Minting & Token Gated Access
NFT Minting: Ready in code, pending Tusky API activation

Token Gated Access: Planned release in 2025

🚀 Quick Start (Despite Walrus/Tusky Issues)
✅ Profile creation with default avatars works
✅ Code is ready for full integration
🚧 Use Tusky Web App for vault management until APIs are live

Once APIs are restored:

Image uploads → Active

Vault management → Functional

NFT minting → Available

🤝 Contributing
Verify API endpoints against official Tusky docs

Update mintNFTFromAsset() once NFT minting API is live

Replace manual API calls with the Tusky SDK when released

📝 License
This project was developed as part of the 42 Hackathon.
All rights reserved © 2025.

