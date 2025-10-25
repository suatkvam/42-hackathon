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
      setError("Tusky API anahtarı veya Vault ID yapılandırılmamış");
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
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      
      // Check if it's a 404 error (API not available)
      if (errorMessage.includes("404")) {
        setError(
          "⚠️ Tusky API'sine erişilemiyor (404). Tusky'nin public API'si henüz tam olarak hazır olmayabilir. " +
          "Lütfen https://app.tusky.io adresinden doğrudan vault'unuza erişin ve asset'lerinizi oradan yönetin."
        );
      } else {
        setError(`Asset'ler yüklenemedi: ${errorMessage}`);
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
      setError("Lütfen sadece resim dosyası yükleyin");
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
      setError(`Yükleme başarısız: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Bu asset'i silmek istediğinizden emin misiniz?")) return;

    try {
      setError(null);
      await deleteAsset(assetId);
      setAssets(assets.filter(a => a.id !== assetId));
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(null);
      }
    } catch (err) {
      setError(`Silme başarısız: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    }
  };

  const handleMintNFT = async () => {
    if (!selectedAsset) return;
    
    if (!nftMetadata.name.trim()) {
      setError("Lütfen NFT için bir isim girin");
      return;
    }

    try {
      setError(null);
      await mintNFTFromAsset(selectedAsset.id, nftMetadata);
      alert("NFT başarıyla mint edildi!");
      setSelectedAsset(null);
      setNftMetadata({ name: "", description: "" });
    } catch (err) {
      // NFT minting is "coming soon" according to Tusky docs
      setError(`NFT minting henüz mevcut değil: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    }
  };

  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Tusky Vault Yönetimi</Heading>
          <Flex gap="2">
            <Button onClick={loadAssets} disabled={loading}>
              {loading ? "Yükleniyor..." : "Yenile"}
            </Button>
            <Box>
              <label style={{ cursor: "pointer" }}>
                <Button disabled={uploading}>
                  {uploading ? "Yükleniyor..." : "Resim Yükle"}
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
                    Tusky App'ı Aç
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
                    NFT Yap
                  </Button>
                  <Button
                    size="1"
                    variant="soft"
                    color="red"
                    onClick={() => handleDeleteAsset(asset.id)}
                  >
                    Sil
                  </Button>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>

        {assets.length === 0 && !loading && (
          <Card>
            <Flex justify="center" align="center" p="8">
              <Text color="gray">Vault'ta henüz asset yok. Resim yükleyerek başlayın!</Text>
            </Flex>
          </Card>
        )}

        {/* NFT Minting Modal */}
        {selectedAsset && (
          <Card style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, minWidth: "400px" }}>
            <Flex direction="column" gap="4" p="4">
              <Heading size="4">NFT Oluştur</Heading>
              
              <Box>
                <img
                  src={getAssetUrl(selectedAsset)}
                  alt={selectedAsset.name}
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </Box>

              <Flex direction="column" gap="2">
                <label>
                  <Text size="2" weight="bold">NFT İsmi *</Text>
                  <TextField.Root
                    value={nftMetadata.name}
                    onChange={(e) => setNftMetadata({ ...nftMetadata, name: e.target.value })}
                    placeholder="NFT için bir isim girin"
                  />
                </label>

                <label>
                  <Text size="2" weight="bold">Açıklama</Text>
                  <TextField.Root
                    value={nftMetadata.description}
                    onChange={(e) => setNftMetadata({ ...nftMetadata, description: e.target.value })}
                    placeholder="NFT açıklaması (opsiyonel)"
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
                  İptal
                </Button>
                <Button onClick={handleMintNFT}>
                  NFT Oluştur
                </Button>
              </Flex>

              <Text size="1" color="gray">
                Not: NFT minting özelliği Tusky'de "coming soon" olarak işaretlenmiş
              </Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
}
