import React, { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { uploadImageToWalrus, getWalrusImageUrl } from "./walrusService";

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
  const [blobId, setBlobId] = useState(existingProfile?.avatar || "");
  const [theme, setTheme] = useState(existingProfile?.theme || "default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(existingProfile?.avatar ? getWalrusImageUrl(existingProfile.avatar) : "");

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

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

      // Upload to Walrus
      const uploadedBlobId = await uploadImageToWalrus(file);
      setBlobId(uploadedBlobId);
      
      // Update preview to Walrus URL
      setPreviewUrl(getWalrusImageUrl(uploadedBlobId));
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload image to Walrus");
      setPreviewUrl("");
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
      const tx = new Transaction();
      
      // Set gas budget explicitly to avoid "could not automatically determine a budget" error
      tx.setGasBudget(10000000); // 0.01 SUI

      if (isEditing && profileObjectId) {
        // Update existing profile
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
          arguments: [
            tx.object(profileObjectId),
            tx.pure.string(name),
            tx.pure.string(bio),
            tx.pure.string(blobId),
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
            tx.pure.string(name),
            tx.pure.string(bio),
            tx.pure.string(blobId),
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
                  border: "2px dashed #c96d37",
                  borderRadius: "5px",
                  textAlign: "center",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  color: "#c96d37",
                }}
              >
                {uploading ? "Uploading to Walrus..." : "📤 Upload Image"}
              </label>
            </div>

            {/* Manual Blob ID Input */}
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
              Or enter Walrus blob ID manually:
            </div>
            <input
              type="text"
              value={blobId}
              onChange={(e) => {
                setBlobId(e.target.value);
                if (e.target.value) {
                  setPreviewUrl(getWalrusImageUrl(e.target.value));
                }
              }}
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                fontSize: "12px",
              }}
              placeholder="Paste blob ID here"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            >
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="orange">Orange</option>
            </select>
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
