import { useState } from "react";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { getTheme, getThemeNames } from "./themes";

interface Link {
  id: string;
  label: string;
  url: string;
}

interface CreateProfileSimpleProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProfileSimple({ onClose, onSuccess }: CreateProfileSimpleProps) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [theme, setTheme] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), label: "", url: "" }]);
  };

  const updateLink = (id: string, field: "label" | "url", value: string) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
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

    // Validate username (alphanumeric, underscore, dash only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and dashes");
      setLoading(false);
      return;
    }

    try {
      const tx = new Transaction();
      tx.setGasBudget(10000000);

      // Create profile with empty blob_id (avatar will be added later)
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_profile_v2`,
        arguments: [
          tx.object(REGISTRY_ID),
          tx.pure.string(username),
          tx.pure.string(name),
          tx.pure.string(bio),
          tx.pure.string(""), // Empty blob_id for now
          tx.pure.string(theme),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log("Profile created successfully:", result);
            
            // If there are links, add them
            if (links.length > 0 && result.digest) {
              // TODO: Add links in a separate transaction
              // For now, user can add links after profile creation
            }
            
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
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "15px",
          padding: "30px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
          ✨ Create Profile
        </h2>
        
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            overflow: "auto", 
            flexGrow: 1, 
            display: "flex", 
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {/* Username */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
              Username * <span style={{ fontSize: "12px", color: "#666" }}>(cannot be changed)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              pattern="[a-zA-Z0-9_-]+"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
              placeholder="example_user"
            />
            <small style={{ fontSize: "12px", color: "#666" }}>
              This will be your unique URL: /{username || "username"}
            </small>
          </div>

          {/* Display Name */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
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
                fontSize: "14px",
              }}
              placeholder="Your Full Name"
            />
          </div>

          {/* Bio */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
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
                fontSize: "14px",
                resize: "vertical",
              }}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Links */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Links 🔗
              </label>
              <button
                type="button"
                onClick={addLink}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4299e1",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                + Add Link
              </button>
            </div>

            {links.length === 0 && (
              <div style={{ 
                padding: "15px", 
                backgroundColor: "#f7fafc", 
                borderRadius: "5px",
                textAlign: "center",
                color: "#666",
                fontSize: "14px",
              }}>
                No links yet. Click "Add Link" to get started!
              </div>
            )}

            {links.map((link, index) => (
              <div 
                key={link.id} 
                style={{ 
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr auto",
                  gap: "8px",
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "#f7fafc",
                  borderRadius: "5px",
                }}
              >
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(link.id, "label", e.target.value)}
                  placeholder="Label"
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "13px",
                  }}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, "url", e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fc8181",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}

            {links.length > 0 && (
              <small style={{ fontSize: "12px", color: "#666", display: "block", marginTop: "5px" }}>
                💡 You can also add links after creating your profile
              </small>
            )}
          </div>

          {/* Theme */}
          <div>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", fontSize: "14px" }}>
              Tema Seçin 🎨
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "10px" }}>
              {getThemeNames().map((themeName) => {
                const themeObj = getTheme(themeName);
                return (
                  <div
                    key={themeName}
                    onClick={() => setTheme(themeName)}
                    style={{
                      cursor: "pointer",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: theme === themeName ? "3px solid #4299e1" : "2px solid #ccc",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        background: themeObj.gradient,
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "600",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                        padding: "5px",
                        textAlign: "center",
                      }}
                    >
                      {themeObj.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            padding: "12px",
            backgroundColor: "#e6fffa",
            border: "1px solid #81e6d9",
            borderRadius: "5px",
            fontSize: "13px",
            color: "#234e52",
          }}>
            <strong>ℹ️ Not:</strong> Avatar ve NFT özelliklerini daha sonra profil ayarlarından ekleyebilirsiniz.
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: "12px",
              backgroundColor: "#fff5f5",
              border: "1px solid #fc8181",
              borderRadius: "5px",
              color: "#c53030",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: loading ? "#ccc" : "#c96d37",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {loading ? "Oluşturuluyor..." : "Profil Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
