# Avatar Management Features

## Current Implementation

### ✅ Implemented Features
1. **Direct Image Upload**
   - Users can upload images directly from their device
   - Images are automatically uploaded to Walrus storage
   - Returns a unique `blob_id` that's stored on-chain
   - Max file size: 10MB
   - Supported formats: All image types

2. **Manual Blob ID Entry**
   - Users can paste an existing Walrus `blob_id`
   - Useful for pre-uploaded images
   - Real-time preview when blob_id is entered

3. **Image Preview**
   - Shows avatar preview before profile creation
   - Circular avatar display (100x100px)
   - Error fallback to placeholder image

4. **Walrus Integration**
   - API Key: `77c22355-d4e3-4263-9054-8bc3bebd4e3f`
   - Publisher endpoint: `https://publisher.walrus-testnet.walrus.space/v1`
   - Aggregator endpoint: `https://aggregator.walrus-testnet.walrus.space/v1`

## Files Modified/Created

- `frontend/src/walrusService.ts` - Walrus API integration service
- `frontend/src/CreateProfile.tsx` - Avatar upload UI
- `frontend/src/App.tsx` - Avatar display with Walrus URLs

## TODO: Future Features

### 🔮 Avatar Vault (Planned)
Create a collection of pre-uploaded avatar images that users can choose from.

**Implementation Steps:**
1. Upload 20-50 avatar images to Walrus
2. Store their `blob_id`s in a database or config file
3. Create an avatar picker UI component
4. Implement `fetchRandomAvatarsFromVault()` in `walrusService.ts`

**Code Location:**
```typescript
// In walrusService.ts - lines 55-77
export function getRandomAvatarBlobIds(): string[] {
  // TODO: Replace placeholder values with real blob_ids
  return ["blob_id_1", "blob_id_2", ...];
}
```

### 🎨 Avatar Picker UI (Planned)
Add a modal/gallery interface in the profile creation form.

**Features:**
- Grid display of 6-12 random avatars
- Click to select
- "More options" button to load different random avatars
- Combine with upload option

### 🌐 Web Scraping for Avatars (Planned)
Automatically fetch and upload avatar images from free avatar services.

**Potential Sources:**
- https://pravatar.cc/
- https://i.pravatar.cc/
- https://avatar.iran.liara.run/
- Unsplash API
- Custom avatar generation services

**Implementation:**
1. Fetch images from API
2. Upload to Walrus using `uploadImageToWalrus()`
3. Store blob_ids in vault
4. Refresh vault periodically

### 🔐 Security Considerations
- Rate limit API calls to Walrus
- Validate image content before upload
- Implement CORS properly for production
- Consider encrypting the API key in production
- Add user quotas for uploads

## Usage Examples

### Upload Image from Device
```typescript
const file = document.querySelector('input[type="file"]').files[0];
const blobId = await uploadImageToWalrus(file);
// Use blobId in profile creation
```

### Get Image URL
```typescript
const imageUrl = getWalrusImageUrl("your-blob-id-here");
// https://aggregator.walrus-testnet.walrus.space/v1/your-blob-id-here
```

### Display Avatar in Profile
```tsx
<img src={getWalrusImageUrl(profile.avatar)} alt="Avatar" />
```

## Notes

- **API Key Security**: Currently hardcoded for development. Move to environment variables for production.
- **Walrus Testnet**: Using testnet endpoints. Update to mainnet URLs when deploying to production.
- **Blob IDs**: Permanently stored on-chain in the LinkTreeProfile struct.
- **Image Persistence**: Images on Walrus are decentralized and permanent.

## Next Steps

1. ✅ Basic upload and display - **DONE**
2. ⏳ Create avatar vault with pre-uploaded images
3. ⏳ Build avatar picker UI component
4. ⏳ Implement web scraping for avatar collection
5. ⏳ Add avatar editing/cropping tools
6. ⏳ Support for animated avatars (GIF/WebP)
