// Walrus API Configuration
const WALRUS_API_KEY = "77c22355-d4e3-4263-9054-8bc3bebd4e3f";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space/v1";
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space/v1";

/**
 * Get image URL from Walrus blob_id
 */
export function getWalrusImageUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/${blobId}`;
}

/**
 * Upload image to Walrus storage
 * Returns the blob_id that can be stored on-chain
 */
export async function uploadImageToWalrus(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${WALRUS_PUBLISHER}/store`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${WALRUS_API_KEY}`,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract blob_id from response
    if (data.newlyCreated?.blobObject?.blobId) {
      return data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified?.blobId) {
      return data.alreadyCertified.blobId;
    }
    
    throw new Error("Unable to extract blob_id from response");
  } catch (error) {
    console.error("Walrus upload error:", error);
    throw error;
  }
}

/**
 * Generate random avatar blob_ids (placeholder for future vault implementation)
 * TODO: Create a vault of pre-uploaded avatars and return random blob_ids
 * For now, returns some example placeholder IDs
 */
export function getRandomAvatarBlobIds(): string[] {
  // TODO: Replace with actual blob_ids from your avatar vault
  // These are placeholder values - you'll need to:
  // 1. Upload a collection of avatar images to Walrus
  // 2. Store their blob_ids
  // 3. Return them here randomly
  
  return [
    "placeholder-avatar-1",
    "placeholder-avatar-2", 
    "placeholder-avatar-3",
    "placeholder-avatar-4",
  ];
}

/**
 * Future feature: Fetch random avatars from vault
 */
export async function fetchRandomAvatarsFromVault(count: number = 6): Promise<string[]> {
  // TODO: Implement vault API endpoint that returns random avatar blob_ids
  // For now, return placeholder values
  return getRandomAvatarBlobIds().slice(0, count);
}
