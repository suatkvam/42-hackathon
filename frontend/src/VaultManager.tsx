import React, { useState, useEffect } from "react";
import { Box, Button, Card, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes";
import {
  uploadImageToTusky,
  getVaultAssets,
  deleteAsset,
  mintNFTFromAsset,
  getAssetUrl,
  validateTuskyConfig,
  type TuskyAsset,
} from "./tuskyService";

export default function VaultManager() {
  const [assets, setAssets] = useState<TuskyAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<TuskyAsset | null>(null);
  const [nftMetadata, setNftMetadata] = useState({ name: "", description: "" });

  // Validate configuration on mount
  useEffect(() => {
    if (!validateTuskyConfig()) {
      setError("Tusky API key or Vault ID is not configured");
    } else {
      loadAssets();
    }
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAssets = await getVaultAssets();
      setAssets(fetchedAssets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      // Check if it's a 404 error (API not available)
      if (errorMessage.includes("404")) {
        setError(
          "⚠️ Cannot access Tusky API (404). Tusky's public API may not be fully ready yet. " +
          "Please access your vault directly from https://app.tusky.io and manage your assets there."
        );
      } else {
        setError(`Failed to load assets: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload only image files");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const asset = await uploadImageToTusky(file);
      setAssets([asset, ...assets]);
      
      // Reset file input
      event.target.value = "";
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      setError(null);
      await deleteAsset(assetId);
      setAssets(assets.filter(a => a.id !== assetId));
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(null);
      }
    } catch (err) {
      setError(`Delete failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleMintNFT = async () => {
    if (!selectedAsset) return;
    
    if (!nftMetadata.name.trim()) {
      setError("Please enter a name for the NFT");
      return;
    }

    try {
      setError(null);
      await mintNFTFromAsset(selectedAsset.id, nftMetadata);
      alert("NFT successfully minted!");
      setSelectedAsset(null);
      setNftMetadata({ name: "", description: "" });
    } catch (err) {
      // NFT minting is "coming soon" according to Tusky docs
      setError(`NFT minting is not available yet: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Tusky Vault Management</Heading>
          <Flex gap="2">
            <Button onClick={loadAssets} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Box>
              <label style={{ cursor: "pointer" }}>
                <Button disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </Box>
          </Flex>
        </Flex>

        {error && (
          <Card style={{ backgroundColor: "var(--red-3)", padding: "12px" }}>
            <Flex direction="column" gap="2">
              <Text color="red">{error}</Text>
              {error.includes("404") && (
                <Box>
                  <Button
                    variant="soft"
                    onClick={() => window.open(`https://app.tusky.io/vaults/${import.meta.env.VITE_TUSKY_VAULT_ID}/assets`, "_blank")}
                  >
                    Open Tusky App
                  </Button>
                </Box>
              )}
            </Flex>
          </Card>
        )}

        <Grid columns="4" gap="4">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <Flex direction="column" gap="2">
                <Box
                  style={{
                    width: "100%",
                    height: "150px",
                    overflow: "hidden",
                    borderRadius: "4px",
                    backgroundColor: "var(--gray-3)",
                  }}
                >
                  <img
                    src={getAssetUrl(asset)}
                    alt={asset.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Text size="2" weight="bold" truncate>
                  {asset.name}
                </Text>
                <Text size="1" color="gray">
                  {(asset.size / 1024).toFixed(2)} KB
                </Text>
                <Flex gap="2">
                  <Button
                    size="1"
                    variant="soft"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    Make NFT
                  </Button>
                  <Button
                    size="1"
                    variant="soft"
                    color="red"
                    onClick={() => handleDeleteAsset(asset.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>

        {assets.length === 0 && !loading && (
          <Card>
            <Flex justify="center" align="center" p="8">
              <Text color="gray">No assets in vault yet. Start by uploading images!</Text>
            </Flex>
          </Card>
        )}

        {/* NFT Minting Modal */}
        {selectedAsset && (
          <Card style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, minWidth: "400px" }}>
            <Flex direction="column" gap="4" p="4">
              <Heading size="4">Create NFT</Heading>
              
              <Box>
                <img
                  src={getAssetUrl(selectedAsset)}
                  alt={selectedAsset.name}
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </Box>

              <Flex direction="column" gap="2">
                <label>
                  <Text size="2" weight="bold">NFT Name *</Text>
                  <TextField.Root
                    value={nftMetadata.name}
                    onChange={(e) => setNftMetadata({ ...nftMetadata, name: e.target.value })}
                    placeholder="Enter a name for the NFT"
                  />
                </label>

                <label>
                  <Text size="2" weight="bold">Description</Text>
                  <TextField.Root
                    value={nftMetadata.description}
                    onChange={(e) => setNftMetadata({ ...nftMetadata, description: e.target.value })}
                    placeholder="NFT description (optional)"
                  />
                </label>
              </Flex>

              <Flex gap="2" justify="end">
                <Button
                  variant="soft"
                  onClick={() => {
                    setSelectedAsset(null);
                    setNftMetadata({ name: "", description: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleMintNFT}>
                  Create NFT
                </Button>
              </Flex>

              <Text size="1" color="gray">
                Note: NFT minting feature is marked as "coming soon" in Tusky
              </Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}
