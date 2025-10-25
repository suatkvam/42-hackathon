// Walrus API Configuration
// Note: Walrus testnet might be down or API might have changed
// Alternative endpoints to try:
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_API_VERSION = "v1";

/**
 * Get image URL from Walrus blob_id
 */
export function getWalrusImageUrl(blobId: string): string {
  if (!blobId || blobId.trim() === "") {
    console.warn("Empty blob ID provided");
    return "";
  }
  return `${WALRUS_AGGREGATOR}/${WALRUS_API_VERSION}/${blobId}`;
}

/**
 * Upload image to Walrus storage
 * Returns the blob_id that can be stored on-chain
 */
export async function uploadImageToWalrus(file: File): Promise<string> {
  try {
    console.log("Uploading file to Walrus:", file.name, file.size);

    const response = await fetch(`${WALRUS_PUBLISHER}/${WALRUS_API_VERSION}/store?epochs=5`, {
      method: "PUT",
      body: file,
    });

    console.log("Walrus response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walrus error response:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Walrus response data:", data);
    
    // Extract blob_id from response
    if (data.newlyCreated?.blobObject?.blobId) {
      console.log("Successfully uploaded, blob ID:", data.newlyCreated.blobObject.blobId);
      return data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified?.blobId) {
      console.log("File already exists, blob ID:", data.alreadyCertified.blobId);
      return data.alreadyCertified.blobId;
    }
    
    throw new Error("Unable to extract blob_id from response: " + JSON.stringify(data));
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

/**
 * Profile data structure stored in Walrus
 */
export interface ProfileContent {
  name: string;
  bio: string;
  avatar_blob_id: string;  // Walrus blob ID for avatar image
  links: Array<{ label: string; url: string }>;
}

/**
 * Upload profile JSON data to Walrus
 * Returns the blob_id for the profile content
 */
export async function uploadProfileToWalrus(profileData: ProfileContent): Promise<string> {
  try {
    console.log("Uploading profile data to Walrus:", profileData);

    // Convert profile data to JSON blob
    const jsonBlob = new Blob([JSON.stringify(profileData)], {
      type: "application/json",
    });

    const response = await fetch(`${WALRUS_PUBLISHER}/${WALRUS_API_VERSION}/store?epochs=5`, {
      method: "PUT",
      body: jsonBlob,
    });

    console.log("Walrus profile upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walrus error response:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Walrus profile response data:", data);
    
    // Extract blob_id from response
    if (data.newlyCreated?.blobObject?.blobId) {
      console.log("Successfully uploaded profile, blob ID:", data.newlyCreated.blobObject.blobId);
      return data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified?.blobId) {
      console.log("Profile already exists, blob ID:", data.alreadyCertified.blobId);
      return data.alreadyCertified.blobId;
    }
    
    throw new Error("Unable to extract blob_id from response: " + JSON.stringify(data));
  } catch (error) {
    console.error("Walrus profile upload error:", error);
    throw error;
  }
}

/**
 * Fetch profile JSON data from Walrus
 * Returns the profile content
 */
export async function fetchProfileFromWalrus(blobId: string): Promise<ProfileContent> {
  try {
    if (!blobId || blobId.trim() === "") {
      throw new Error("Empty blob ID provided");
    }

    console.log("Fetching profile from Walrus:", blobId);
    const url = `${WALRUS_AGGREGATOR}/${WALRUS_API_VERSION}/${blobId}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
    }

    const profileData: ProfileContent = await response.json();
    console.log("Fetched profile data:", profileData);
    
    return profileData;
  } catch (error) {
    console.error("Walrus profile fetch error:", error);
    throw error;
  }
}
