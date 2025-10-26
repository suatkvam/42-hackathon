import React, { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { uploadImageToWalrus, getWalrusImageUrl, uploadProfileToWalrus, ProfileContent } from "./walrusService";
import { uploadImageToCloudinary, getOptimizedCloudinaryUrl } from "./cloudinaryService";
import { getTheme, getThemeNames } from "./themes";

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

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Default avatar options (placeholder blob IDs or data URLs)
  const defaultAvatars = [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%234299e1'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40' fill='white'%3E👤%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2348bb78'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40' fill='white'%3E🚀%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23ed8936'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40' fill='white'%3E🌟%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%239f7aea'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40' fill='white'%3E👾%3C/text%3E%3C/svg%3E",
  ];

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
        // Create new profile
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::create_profile_v2`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.string(username),
            tx.pure.string(contentBlobId),
            tx.pure.string(theme),
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

            {/* Default Avatar Selection */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                Select default avatar:
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
                {defaultAvatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`Default avatar ${index + 1}`}
                    onClick={() => {
                      setAvatarBlobId(avatar);
                      setAvatarUrl("");
                      setPreviewUrl(avatar);
                      setError("");
                    }}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      border: avatarBlobId === avatar ? "3px solid #c96d37" : "2px solid #ccc",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            </div>

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

            {/* Manual Input */}
            {uploadMethod === "cloudinary" && (
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                  Or enter Cloudinary URL manually:
                </div>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    setAvatarUrl(url);
                    setAvatarBlobId("");
                    setPreviewUrl(url);
                    setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: "12px",
                  }}
                  placeholder="https://res.cloudinary.com/..."
                />
              </div>
            )}

            {uploadMethod === "walrus" && (
              <div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                  Or enter Walrus blob ID manually:
                </div>
                {(error.includes("Walrus") || error.includes("CLI")) && (
                  <div style={{ 
                    fontSize: "11px", 
                    color: "#c96d37", 
                    backgroundColor: "#fff3e0", 
                    padding: "8px", 
                    borderRadius: "4px", 
                    marginBottom: "8px",
                    border: "1px solid #c96d37"
                  }}>
                    💡 <strong>Tips:</strong><br/>
                    1) Select default avatar above (easiest)<br/>
                    2) Switch to Cloudinary upload<br/>
                    3) Upload with Walrus CLI: <code style={{fontSize: "10px", backgroundColor: "#fff", padding: "2px 4px", borderRadius: "2px"}}>walrus store image.png</code>
                  </div>
                )}
                <input
                  type="text"
                  value={avatarBlobId}
                  onChange={(e) => {
                    const newBlobId = e.target.value.trim();
                    setAvatarBlobId(newBlobId);
                    setAvatarUrl("");
                    setError("");
                    if (newBlobId && !newBlobId.startsWith("data:")) {
                      const url = getWalrusImageUrl(newBlobId);
                      setPreviewUrl(url);
                    } else if (newBlobId.startsWith("data:")) {
                      setPreviewUrl(newBlobId);
                    } else {
                      setPreviewUrl("");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontSize: "12px",
                  }}
                  placeholder="Blob ID (or select default avatar above)"
                />
              </div>
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
