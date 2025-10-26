// Walrus API Configuration
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const WALRUS_API_VERSION = "v1";

// Backend proxy for Walrus CLI uploads
const WALRUS_BACKEND = import.meta.env.VITE_WALRUS_BACKEND || "http://localhost:3001";

// Development mode - bypass Walrus when developing locally
const DEV_MODE = import.meta.env.DEV || false;

/**
 * Get image URL from Walrus blob_id
 */
export function getWalrusImageUrl(blobId: string): string {
  if (!blobId || blobId.trim() === "") {
    return "";  // Return empty silently
  }
  return `${WALRUS_AGGREGATOR}/${WALRUS_API_VERSION}/${blobId}`;
}

/**
 * Upload image to Walrus storage
 * Returns the blob_id that can be stored on-chain
 */
export async function uploadImageToWalrus(file: File): Promise<string> {
  // Development mode: return mock blob ID for images
  if (DEV_MODE) {
    console.log("[DEV MODE] Skipping image upload, using mock blob ID");
    return `mock_image_${Date.now()}`;
  }

  try {
    console.log("Uploading file to Walrus via backend:", file.name, file.size);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${WALRUS_BACKEND}/api/walrus/upload-image`, {
      method: "POST",
      body: formData,
    });

    console.log("Walrus response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walrus error response:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Walrus response data:", data);
    
    if (data.blobId) {
      console.log("Successfully uploaded, blob ID:", data.blobId);
      return data.blobId;
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
  avatar_url?: string;      // Cloudinary or external URL for avatar image
  links: Array<{ label: string; url: string }>;
}

/**
 * Upload profile JSON data to Walrus
 * Returns the blob_id for the profile content
 */
export async function uploadProfileToWalrus(profileData: ProfileContent): Promise<string> {
  // Development mode: return mock blob ID and store data locally
  if (DEV_MODE) {
    console.log("[DEV MODE] Skipping Walrus upload, using mock blob ID");
    console.log("Profile data:", profileData);
    // Generate mock blob ID
    const mockBlobId = `mock_blob_${Date.now()}`;
    // Store the profile data in localStorage
    localStorage.setItem(`walrus_mock_${mockBlobId}`, JSON.stringify(profileData));
    console.log("[DEV MODE] Stored mock profile data for", mockBlobId);
    return mockBlobId;
  }

  try {
    console.log("Uploading profile data to Walrus via backend:", profileData);

    const response = await fetch(`${WALRUS_BACKEND}/api/walrus/upload-json`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    console.log("Walrus profile upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walrus error response:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Walrus profile response data:", data);
    
    if (data.blobId) {
      console.log("Successfully uploaded profile, blob ID:", data.blobId);
      return data.blobId;
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
  // Development mode: retrieve mock data from localStorage
  if (DEV_MODE && blobId.startsWith("mock_blob_")) {
    console.log("[DEV MODE] Fetching mock blob from localStorage:", blobId);
    const storedData = localStorage.getItem(`walrus_mock_${blobId}`);
    if (storedData) {
      const profileData = JSON.parse(storedData);
      console.log("[DEV MODE] Retrieved mock profile data:", profileData);
      return profileData;
    } else {
      console.warn("[DEV MODE] No mock data found for", blobId);
      throw new Error("Mock blob ID not found in localStorage");
    }
  }

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
