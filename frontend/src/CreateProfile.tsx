import React, { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { uploadImageToWalrus, getWalrusImageUrl, uploadProfileToWalrus, ProfileContent } from "./walrusService";
import { uploadImageToCloudinary, getOptimizedCloudinaryUrl } from "./cloudinaryService";
import { getTheme, getThemeNames } from "./themes";
import { getRandomAvatarsForUser, avatarIdToString, parseAvatarId } from "./avatarNftService";

interface CreateProfileProps {
  onClose: () => void;
  onSuccess: () => void;
  isEditing?: boolean;
  profileObjectId?: string;
  existingProfile?: {
    username?: string;
    name: string;
    bio: string;
    avatar: string;
    theme: string;
  };
}

export default function CreateProfile({ onClose, onSuccess, isEditing = false, profileObjectId = "", existingProfile }: CreateProfileProps) {
  const [username, setUsername] = useState(existingProfile?.username || "");
  const [name, setName] = useState(existingProfile?.name || "");
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [avatarBlobId, setAvatarBlobId] = useState(existingProfile?.avatar || "");  // Walrus blob ID
  const [avatarUrl, setAvatarUrl] = useState("");  // Cloudinary URL
  const [uploadMethod, setUploadMethod] = useState<"walrus" | "cloudinary">("cloudinary");  // Upload method
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([]);  // Links array
  const [theme, setTheme] = useState(existingProfile?.theme || "default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(existingProfile?.avatar ? getWalrusImageUrl(existingProfile.avatar) : "");
  const [selectedNftAvatarId, setSelectedNftAvatarId] = useState<number | null>(null);
  const [nftAvatarOptions, setNftAvatarOptions] = useState<Array<{id: number, path: string, imageUrl: string}>>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Fetch assigned avatars and generate random options on mount (only for new profiles)
  React.useEffect(() => {
    if (!isEditing) {
      fetchAvailableAvatars();
    }
  }, [isEditing]);

  const fetchAvailableAvatars = async () => {
    setLoadingAvatars(true);
    try {
      // Fetch assigned avatar IDs from blockchain
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: {
          kind: 'moveCall',
          data: {
            packageObjectId: PACKAGE_ID,
            module: MODULE_NAME,
            function: 'get_assigned_avatar_ids',
            arguments: [REGISTRY_ID],
          },
        },
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      
      // Parse assigned avatar IDs (simplified - adjust based on actual response)
      const assignedIds: number[] = []; // TODO: Parse from result
      
      // Get 3 random unassigned avatars
      const randomAvatars = getRandomAvatarsForUser(assignedIds);
      setNftAvatarOptions(randomAvatars);
      
      // Pre-select first avatar
      if (randomAvatars.length > 0) {
        setSelectedNftAvatarId(randomAvatars[0].id);
        setPreviewUrl(randomAvatars[0].imageUrl);
        setAvatarBlobId(avatarIdToString(randomAvatars[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch avatar options:", err);
      // Fallback: generate random avatars without checking assignments
      const fallbackAvatars = getRandomAvatarsForUser([]);
      setNftAvatarOptions(fallbackAvatars);
      if (fallbackAvatars.length > 0) {
        setSelectedNftAvatarId(fallbackAvatars[0].id);
        setPreviewUrl(fallbackAvatars[0].imageUrl);
        setAvatarBlobId(avatarIdToString(fallbackAvatars[0].id));
      }
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      if (uploadMethod === "cloudinary") {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadImageToCloudinary(file);
        setAvatarUrl(cloudinaryUrl);
        setAvatarBlobId("");  // Clear Walrus blob ID
        setPreviewUrl(cloudinaryUrl);
        console.log("Uploaded to Cloudinary:", cloudinaryUrl);
      } else {
        // Upload to Walrus
        const uploadedBlobId = await uploadImageToWalrus(file);
        setAvatarBlobId(uploadedBlobId);
        setAvatarUrl("");  // Clear Cloudinary URL
        setPreviewUrl(getWalrusImageUrl(uploadedBlobId));
        console.log("Uploaded to Walrus:", uploadedBlobId);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      if (uploadMethod === "cloudinary") {
        setError("⚠️ Cloudinary upload failed. " + err.message);
      } else {
        setError("⚠️ Walrus testnet is temporarily unavailable. Alternative options: 1) Select default avatar, 2) Switch to Cloudinary, 3) Upload with Walrus CLI.");
      }
      // Keep local preview
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!REGISTRY_ID) {
      setError("Registry not configured. Please create a registry first.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Upload profile content to Walrus
      const profileContent: ProfileContent = {
        name,
        bio,
        avatar_blob_id: avatarBlobId,
        avatar_url: avatarUrl,  // Add Cloudinary URL
        links,
      };

      const contentBlobId = await uploadProfileToWalrus(profileContent);
      console.log("Profile content uploaded to Walrus:", contentBlobId);

      // Step 2: Store on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000); // 0.01 SUI

      if (isEditing && profileObjectId) {
        // Update existing profile
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
          arguments: [
            tx.object(profileObjectId),
            tx.pure.string(contentBlobId),
            tx.pure.string(theme),
          ],
        });
      } else {
        // Create new profile with NFT avatar
        if (!selectedNftAvatarId) {
          setError("Please select an avatar");
          setLoading(false);
          return;
        }
        
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::create_profile_v3`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.string(username),
            tx.pure.string(contentBlobId),
            tx.pure.string(theme),
            tx.pure.u64(selectedNftAvatarId),
          ],
        });
      }

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Profile created successfully:", result);
            onSuccess();
          },
          onError: (error) => {
            console.error("Error creating profile:", error);
            setError(error.message || "Failed to create profile");
            setLoading(false);
          },
        }
      );
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px", flexShrink: 0 }}>
          {isEditing ? "✏️ Update Profile" : "➕ Create Profile"}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ overflow: "auto", flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ overflow: "auto", flexGrow: 1, paddingRight: "5px" }}>
          {!isEditing && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="Enter unique username"
            />
          </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="Your display name"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                minHeight: "80px",
                boxSizing: "border-box",
              }}
              placeholder="Tell us about yourself"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Avatar Image *
            </label>
            
            {/* Avatar Preview */}
            {previewUrl && (
              <div style={{ marginBottom: "10px", textAlign: "center" }}>
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  onError={(e) => {
                    console.error("Failed to load image from:", previewUrl);
                    setError("Failed to fetch image from Walrus. Please check the blob ID or upload a new image.");
                    setPreviewUrl("");
                  }}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #c96d37",
                  }}
                />
              </div>
            )}

            {/* NFT Avatar Selection (Registration Only) */}
            {!isEditing && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                  🎁 Choose Your FREE NFT Avatar:
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                  Pick one of these 3 unique avatars - it will be yours forever!
                </div>
                {loadingAvatars ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    Loading avatars...
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "10px" }}>
                    {nftAvatarOptions.map((avatar) => (
                      <div
                        key={avatar.id}
                        onClick={() => {
                          setSelectedNftAvatarId(avatar.id);
                          setAvatarBlobId(avatarIdToString(avatar.id));
                          setAvatarUrl("");
                          setPreviewUrl(avatar.imageUrl);
                          setError("");
                        }}
                        style={{
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <img
                          src={avatar.imageUrl}
                          alt={`NFT Avatar ${avatar.id}`}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            border: selectedNftAvatarId === avatar.id ? "4px solid #c96d37" : "3px solid #ddd",
                            objectFit: "cover",
                            transition: "all 0.2s",
                            boxShadow: selectedNftAvatarId === avatar.id ? "0 4px 12px rgba(201, 109, 55, 0.4)" : "none",
                          }}
                        />
                        <div style={{ 
                          fontSize: "10px", 
                          color: selectedNftAvatarId === avatar.id ? "#c96d37" : "#999",
                          fontWeight: selectedNftAvatarId === avatar.id ? "bold" : "normal",
                          marginTop: "5px"
                        }}>
                          #{avatar.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* For editing: keep upload options */}
            {isEditing && (
              <>
                {/* Upload Method Selection */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                    Upload method:
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setUploadMethod("cloudinary")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: uploadMethod === "cloudinary" ? "#4299e1" : "#f0f0f0",
                        color: uploadMethod === "cloudinary" ? "white" : "#666",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      ☁️ Cloudinary
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod("walrus")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: uploadMethod === "walrus" ? "#4299e1" : "#f0f0f0",
                        color: uploadMethod === "walrus" ? "white" : "#666",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      🐘 Walrus
                    </button>
                  </div>
                </div>

                {/* Upload Button */}
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="avatar-upload"
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="avatar-upload"
                    style={{
                      display: "block",
                      padding: "10px",
                      backgroundColor: uploading ? "#ccc" : "#f0f0f0",
                      border: `2px dashed ${uploadMethod === "cloudinary" ? "#4299e1" : "#c96d37"}`,
                      borderRadius: "5px",
                      textAlign: "center",
                      cursor: uploading ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      color: uploadMethod === "cloudinary" ? "#4299e1" : "#c96d37",
                    }}
                  >
                    {uploading 
                      ? `Uploading to ${uploadMethod === "cloudinary" ? "Cloudinary" : "Walrus"}...` 
                      : `📤 Upload to ${uploadMethod === "cloudinary" ? "Cloudinary" : "Walrus"}`
                    }
                  </label>
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Theme
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
              {getThemeNames().map((themeName) => {
                const themeObj = getTheme(themeName);
                return (
                  <div
                    key={themeName}
                    onClick={() => setTheme(themeName)}
                    style={{
                      cursor: "pointer",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: theme === themeName ? "3px solid #c96d37" : "2px solid #ccc",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        background: themeObj.gradient,
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: "600",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {themeObj.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          </div>

          {error && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#ffebee",
                color: "#c62828",
                borderRadius: "5px",
                marginTop: "15px",
                marginBottom: "15px",
                flexShrink: 0,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ccc",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#ccc" : "#c96d37",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Profile" : "Create Profile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
