# 🎨 NFT Avatar System

## Overview
Each user, during registration, chooses **one out of three randomly generated unique avatars**.  
The selected avatar becomes **exclusive** to that user — **no one else can select the same one** — just like a true NFT system.

---

## 📋 Features

### ✅ Completed

1. **16 Unique Avatar Collection**
   - Real image files (JPEG/PNG/SVG)
   - Stored in `frontend/public/avatars/`
   - Tracked by ID system (1–16)

2. **Random Avatar Selection**
   - During registration, each user is shown 3 random available avatars
   - Already assigned avatars are automatically filtered out
   - The first avatar is pre-selected by default

3. **On-Chain Uniqueness**
   - `ProfileRegistry` includes a `assigned_avatars` VecMap
   - Avatar ID → Owner Address mapping on-chain
   - Prevents duplicates (`EAvatarAlreadyAssigned`)

4. **Avatar Persistence**
   - When a profile is deleted, its avatar is released
   - Released avatars can be reassigned to new users
   - Avatar ID stored as `nft_avatar_id` in the profile struct

5. **Real Image Files**
   - Supports JPEG, JPG, PNG, and SVG formats
   - Naming: `nft-1.jpeg`, `nft-2.jpeg`, etc.
   - Publicly hosted via the `public` directory

---

## 🗂️ File Structure

### Backend (Move)
move_backend/sources/move_backend.move
├─ LinkTreeProfile struct (added nft_avatar_id field)
├─ ProfileRegistry struct (assigned_avatars dynamic field)
├─ create_profile_v3() - Create profile with NFT avatar
├─ delete_profile() - Release avatar on deletion
├─ init_avatar_registry() - Initialize avatar registry
├─ is_avatar_assigned() - Check avatar availability
├─ assign_avatar() - Assign avatar to a user
├─ unassign_avatar() - Release avatar
└─ get_assigned_avatar_ids() - Get list of assigned avatars

shell
Kodu kopyala

### Frontend (React)
frontend/src/
├─ avatarNftService.ts - Avatar management service
│ ├─ NFT_AVATARS - List of 16 avatar paths
│ ├─ generateAvatarSvg() - Generate SVG dynamically
│ ├─ getRandomAvatarsForUser() - Pick random available avatars
│ ├─ getAvatarById() - Retrieve avatar by ID
│ ├─ avatarIdToString() - Format for storage
│ └─ parseAvatarId() - Parse avatar ID
│
├─ CreateProfile.tsx - Registration form
│ ├─ NFT avatar selection UI
│ ├─ Displays 3 avatar cards
│ ├─ fetchAvailableAvatars() - Fetch assigned avatars from blockchain
│ └─ Calls create_profile_v3()
│
└─ ProfileDashboard.tsx - Profile view
├─ NFT avatar display
├─ Priority: NFT > Cloudinary > Walrus > Default
└─ parseAvatarId() ensures backward compatibility

yaml
Kodu kopyala

---

## 🎯 User Flow

### 1. New User Registration
User clicks "Create Profile"

The system fetches assigned avatars from the blockchain

From 16 avatars, already-assigned ones are filtered out

3 random available avatars are presented

User chooses one avatar (real image file)

create_profile_v3() executes:

Checks username uniqueness

Validates avatar availability (is_avatar_assigned)

Creates profile (saves nft_avatar_id)

Assigns avatar (assign_avatar)

Registers entry in ProfileRegistry

shell
Kodu kopyala

### 2. Avatar Display
While loading the profile, nft_avatar_id is retrieved

Display priority order:

NFT Avatar (if nft_avatar_id > 0)

Cloudinary URL (if avatarUrl exists)

Walrus Blob (if avatar exists)

Default emoji (👤)

The real image (JPEG/PNG/SVG) is rendered

shell
Kodu kopyala

### 3. Profile Deletion
delete_profile() is called

Username removed from registry

Avatar unassigned (unassign_avatar)

Profile object deleted

Avatar returns to the available pool

yaml
Kodu kopyala

---

## 🔧 Technical Details

### Move Contract
```move
// Profile Struct
public struct LinkTreeProfile has key, store {
    id: UID,
    owner: address,
    username: String,
    content_blob_id: String,
    theme: String,
    username_change_count: u64,
    nft_avatar_id: u64  // Avatar ID (1–16)
}

// Registry
public struct ProfileRegistry has key, store {
    id: UID
    // Dynamic field: b"assigned_avatars" -> VecMap<u64, address>
}

// Error Codes
const EAvatarAlreadyAssigned: u64 = 3;
Avatar Service
typescript
Kodu kopyala
// 16 Real Avatar Files
export const NFT_AVATARS = [
  '/avatars/nft-1.jpeg',
  '/avatars/nft-2.jpeg',
  // ... up to 16
];

// Random avatar selection
export function getRandomAvatarsForUser(
  assignedAvatarIds: number[]
): Array<{id: number, path: string, imageUrl: string}> {
  const available = allAvatars.filter(a => !assignedAvatarIds.includes(a.id));
  return shuffled.slice(0, 3);
}
📊 Avatar Collection
16 real image files (JPEG/PNG/SVG)

ID	Filename	Format	Path
1	nft-1.jpeg	JPEG	/avatars/nft-1.jpeg
2	nft-2.jpeg	JPEG	/avatars/nft-2.jpeg
3	nft-3.jpeg	JPEG	/avatars/nft-3.jpeg
4	nft-4.jpeg	JPEG	/avatars/nft-4.jpeg
5	nft-5.jpeg	JPEG	/avatars/nft-5.jpeg
6	nft-6.jpeg	JPEG	/avatars/nft-6.jpeg
7	nft-7.jpeg	JPEG	/avatars/nft-7.jpeg
8	nft-8.jpeg	JPEG	/avatars/nft-8.jpeg
9	nft-9.jpeg	JPEG	/avatars/nft-9.jpeg
10	nft-10.jpeg	JPEG	/avatars/nft-10.jpeg
11	nft-11.jpeg	JPEG	/avatars/nft-11.jpeg
12	nft-12.jpeg	JPEG	/avatars/nft-12.jpeg
13	nft-13.jpeg	JPEG	/avatars/nft-13.jpeg
14	nft-14.jpeg	JPEG	/avatars/nft-14.jpeg
15	nft-15.jpeg	JPEG	/avatars/nft-15.jpeg
16	nft-16.jpeg	JPEG	/avatars/nft-16.jpeg

Upload Instructions
Prepare 16 images (JPEG, PNG, or SVG)

Name them as nft-1.jpeg, nft-2.jpeg, ..., nft-16.jpeg

Place them inside frontend/public/avatars/

If you use different formats, update the NFT_AVATARS array in avatarNftService.ts

Detailed instructions: frontend/public/avatars/README.md

🚀 Deployment
Backend Deployment
bash
Kodu kopyala
cd move_backend
sui client publish --gas-budget 100000000

# Create Registry
sui client call \
  --package <PACKAGE_ID> \
  --module linktree \
  --function create_registry \
  --gas-budget 10000000

# Initialize Avatar Registry
sui client call \
  --package <PACKAGE_ID> \
  --module linktree \
  --function init_avatar_registry \
  --args <REGISTRY_ID> \
  --gas-budget 10000000
Frontend Setup
bash
Kodu kopyala
cd frontend

# 1. Upload 16 avatar images
# Place them in: frontend/public/avatars/
# Naming: nft-1.jpeg, nft-2.jpeg, ... nft-16.jpeg

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
🎨 UI Details
Registration Screen
Title: "🎁 Choose Your FREE NFT Avatar"

Subtitle: "Pick one of these 3 unique avatars — it will be yours forever!"

Avatar Cards: 80x80px circular, animated borders

Selected Avatar: 4px solid #c96d37 border + shadow effect

Avatar ID: Displayed below (#1, #2, #3)

Dashboard
Avatar Display: 80x80px circular

Priority System: NFT > Cloudinary > Walrus > Default

Fallback: 👤 emoji

🔒 Security
Guaranteed Uniqueness: Verified on-chain

No Duplicates: assert!(!is_avatar_assigned())

Ownership Check: assert!(owner == sender)

Atomic Transactions: Assign/unassign within a single transaction

📝 Future Improvements
 Avatar trading feature

 Rarity system (Common, Rare, Legendary)

 Transferable avatars between users

 Avatar marketplace

 Custom avatar uploads (premium feature)

 Animated avatars (GIF or SVG animation support)

🐛 Known Limitations
16 Avatar Limit: Currently 16 avatars; adding more requires backend & frontend updates

No Trading Yet: Avatars are non-transferable unless profile is deleted

Static Files: Avatars stored in public/ require rebuild for updates

No Edit Preview: Avatar cannot be changed in edit mode

🎉 Conclusion
This system provides users with unique, permanent, NFT-like avatars.
Each user owns an exclusive on-chain avatar, guaranteed by blockchain logic — a fun, secure, and decentralized identity experience!

