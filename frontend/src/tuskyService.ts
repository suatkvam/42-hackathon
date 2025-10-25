// Tusky API Service for managing vaults and NFTs
// Note: Tusky's public API might not be fully available yet.
// The API key might be for internal use only through their web app.

const TUSKY_API_URL = import.meta.env.VITE_TUSKY_API_URL || "https://api.tusky.io";
const TUSKY_API_KEY = import.meta.env.VITE_TUSKY_API_KEY;
const TUSKY_VAULT_ID = import.meta.env.VITE_TUSKY_VAULT_ID;

// Debug: Log configuration
console.log("Tusky Config:", {
  apiUrl: TUSKY_API_URL,
  hasApiKey: !!TUSKY_API_KEY,
  vaultId: TUSKY_VAULT_ID,
});

export interface TuskyAsset {
  id: string;
  name: string;
  contentType: string;
  size: number;
  blobId?: string;
  url: string;
  createdAt: string;
}

export interface UploadResponse {
  asset: TuskyAsset;
  message: string;
}

export interface VaultAssetsResponse {
  assets: TuskyAsset[];
  total: number;
}

/**
 * Get headers for Tusky API requests
 */
function getHeaders(): HeadersInit {
  return {
    "Authorization": `Bearer ${TUSKY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Upload an image to Tusky vault
 * @param file - The image file to upload
 * @param vaultId - Optional vault ID (defaults to env variable)
 */
export async function uploadImageToTusky(
  file: File,
  vaultId: string = TUSKY_VAULT_ID
): Promise<TuskyAsset> {
  try {
    console.log("Uploading image to Tusky vault:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${TUSKY_API_URL}/v1/vaults/${vaultId}/assets`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TUSKY_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tusky upload error:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data: UploadResponse = await response.json();
    console.log("Successfully uploaded to Tusky:", data);
    
    return data.asset;
  } catch (error) {
    console.error("Error uploading to Tusky:", error);
    throw error;
  }
}

/**
 * Get all assets from a vault
 * @param vaultId - Optional vault ID (defaults to env variable)
 */
export async function getVaultAssets(
  vaultId: string = TUSKY_VAULT_ID
): Promise<TuskyAsset[]> {
  try {
    const url = `${TUSKY_API_URL}/v1/vaults/${vaultId}/assets`;
    console.log("Fetching assets from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`Failed to fetch assets: ${response.status} - ${errorText}`);
    }

    const data: VaultAssetsResponse = await response.json();
    console.log("Assets fetched:", data);
    return data.assets;
  } catch (error) {
    console.error("Error fetching vault assets:", error);
    throw error;
  }
}

/**
 * Get a specific asset from vault
 * @param assetId - The asset ID
 * @param vaultId - Optional vault ID (defaults to env variable)
 */
export async function getAsset(
  assetId: string,
  vaultId: string = TUSKY_VAULT_ID
): Promise<TuskyAsset> {
  try {
    const response = await fetch(
      `${TUSKY_API_URL}/v1/vaults/${vaultId}/assets/${assetId}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching asset:", error);
    throw error;
  }
}

/**
 * Delete an asset from vault
 * @param assetId - The asset ID to delete
 * @param vaultId - Optional vault ID (defaults to env variable)
 */
export async function deleteAsset(
  assetId: string,
  vaultId: string = TUSKY_VAULT_ID
): Promise<void> {
  try {
    const response = await fetch(
      `${TUSKY_API_URL}/v1/vaults/${vaultId}/assets/${assetId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete asset: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting asset:", error);
    throw error;
  }
}

/**
 * Mint an NFT from a Tusky asset
 * Note: This is a placeholder for when Tusky NFT minting becomes available
 * @param assetId - The asset ID to mint as NFT
 * @param metadata - NFT metadata (name, description, etc.)
 */
export async function mintNFTFromAsset(
  assetId: string,
  metadata: {
    name: string;
    description?: string;
    attributes?: Record<string, any>;
  },
  vaultId: string = TUSKY_VAULT_ID
): Promise<any> {
  // TODO: Update this when Tusky NFT minting API is available
  // According to docs, NFT minting is "coming soon"
  console.warn("NFT minting is coming soon to Tusky");
  
  try {
    const response = await fetch(
      `${TUSKY_API_URL}/v1/vaults/${vaultId}/assets/${assetId}/mint`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mint NFT: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}

/**
 * Get random assets from vault (for avatar selection)
 * @param count - Number of random assets to fetch
 * @param vaultId - Optional vault ID (defaults to env variable)
 */
export async function getRandomAssets(
  count: number = 6,
  vaultId: string = TUSKY_VAULT_ID
): Promise<TuskyAsset[]> {
  try {
    const assets = await getVaultAssets(vaultId);
    
    // Shuffle and return random assets
    const shuffled = [...assets].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    console.error("Error getting random assets:", error);
    return [];
  }
}

/**
 * Get asset URL for display
 * @param asset - The Tusky asset
 */
export function getAssetUrl(asset: TuskyAsset): string {
  return asset.url || asset.blobId || "";
}

/**
 * Validate Tusky configuration
 */
export function validateTuskyConfig(): boolean {
  if (!TUSKY_API_KEY) {
    console.error("VITE_TUSKY_API_KEY is not configured");
    return false;
  }
  if (!TUSKY_VAULT_ID) {
    console.error("VITE_TUSKY_VAULT_ID is not configured");
    return false;
  }
  return true;
}
