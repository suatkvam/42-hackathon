import React, { useState, useEffect } from "react";
import { useCurrentAccount, useDisconnectWallet, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { Transaction } from "@mysten/sui/transactions";
import CreateProfile from "./CreateProfile";
import { getWalrusImageUrl } from "./walrusService";
import { PACKAGE_ID, MODULE_NAME } from "./constants";

export default function ProfilePage() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const navigate = useNavigate();
  
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileObjectId, setProfileObjectId] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);

  // Redirect to landing if not connected
  useEffect(() => {
    if (!account) {
      navigate("/");
    }
  }, [account, navigate]);

  // Load user profile from blockchain
  useEffect(() => {
    async function loadProfile() {
      if (!account?.address) {
        setUserProfile(null);
        return;
      }

      setLoadingProfile(true);
      setProfileError("");
      try {
        console.log("Loading profile for address:", account.address);
        
        const objects = await suiClient.getOwnedObjects({
          owner: account.address,
          options: {
            showType: true,
            showContent: true,
          },
        });

        console.log("Total objects owned:", objects.data.length);

        // Find ALL LinkTreeProfile objects from CURRENT contract only
        const profileObjects = objects.data.filter((obj: any) => {
          const type = obj.data?.type;
          return type?.includes("::linktree::LinkTreeProfile") && 
                 type?.startsWith(PACKAGE_ID);
        });

        console.log("Total profiles found:", profileObjects.length);

        // Get the MOST RECENT profile (last created)
        const profileObj = profileObjects.length > 0 
          ? profileObjects[profileObjects.length - 1] 
          : null;

        if (profileObj && profileObj.data?.content?.fields) {
          const fields = profileObj.data.content.fields;
          console.log("✅ Profile found!", fields);
          
          // Support both old field name (avatar_cid) and new field name (blob_id)
          const avatarId = fields.blob_id || fields.avatar_cid;
          
          setProfileObjectId(profileObj.data.objectId);
          setUserProfile({
            username: fields.username,
            name: fields.name,
            bio: fields.bio,
            avatar: avatarId,
            links: fields.links || [],
            theme: fields.theme,
          });
        } else {
          console.log("❌ No profile found for address:", account.address);
          setProfileError("No profile found. Create one to get started!");
          setShowCreateProfile(true); // Auto-show create form if no profile
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [account, suiClient]);

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnect(false);
    navigate("/");
  };

  const handleDeleteProfile = () => {
    if (!confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      return;
    }

    setDeletingProfile(true);
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::delete_profile`,
      arguments: [tx.object(profileObjectId)],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          alert("Profile deleted successfully!");
          window.location.reload();
        },
        onError: (error) => {
          console.error("Failed to delete profile:", error);
          alert("Failed to delete profile: " + error.message);
          setDeletingProfile(false);
        },
      }
    );
  };

  // Demo profile (fallback)
  const demoProfile = {
    name: "Create Your Profile",
    bio: "Click 'Create Profile' to get started",
    avatar: "https://i.pravatar.cc/150?img=1",
    links: [],
  };

  const profile = userProfile || demoProfile;
  const isUserProfile = !!userProfile;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #c96d37, #1f1f1f)",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 1000,
        }}
      >
        <h1
          style={{ color: "white", margin: 0, fontSize: "24px", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          🌳 SuiTree
        </h1>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {/* Delete Profile button */}
          {userProfile && account && (
            <button
              onClick={handleDeleteProfile}
              disabled={deletingProfile}
              style={{
                padding: "10px 25px",
                backgroundColor: deletingProfile ? "#ccc" : "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: deletingProfile ? "not-allowed" : "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) => {
                if (!deletingProfile) e.currentTarget.style.backgroundColor = "#cc0000";
              }}
              onMouseOut={(e) => {
                if (!deletingProfile) e.currentTarget.style.backgroundColor = "#ff4444";
              }}
            >
              {deletingProfile ? "Deleting..." : "🗑️ Delete Profile"}
            </button>
          )}

          {/* Create/Edit Profile button */}
          {account && (
            <button
              onClick={() => setShowCreateProfile(true)}
              style={{
                padding: "10px 25px",
                backgroundColor: userProfile ? "#2196F3" : "white",
                color: userProfile ? "white" : "#c96d37",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = userProfile ? "#0b7dda" : "#ff8b3d";
                e.currentTarget.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = userProfile ? "#2196F3" : "white";
                e.currentTarget.style.color = userProfile ? "white" : "#c96d37";
              }}
            >
              {userProfile ? "✏️ Edit Profile" : "➕ Create Profile"}
            </button>
          )}

          {/* Wallet address dropdown */}
          {account && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDisconnect(!showDisconnect)}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "1px solid white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </button>
              {showDisconnect && (
                <button
                  onClick={handleDisconnect}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "5px",
                    padding: "10px 15px",
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    zIndex: 999,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#cc0000";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff4444";
                  }}
                >
                  Disconnect
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "80px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: "20px",
            padding: "40px",
            width: "350px",
            color: "white",
            textAlign: "center",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          }}
        >
          {loadingProfile ? (
            <div style={{ padding: "40px", color: "white", textAlign: "center" }}>
              <p>Loading profile...</p>
              <p style={{ fontSize: "12px", opacity: 0.7 }}>Address: {account?.address}</p>
            </div>
          ) : profileError && !userProfile ? (
            <div style={{ padding: "40px", color: "white", textAlign: "center" }}>
              <p>{profileError}</p>
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "10px" }}>Address: {account?.address}</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                <img
                  src={
                    isUserProfile 
                      ? (profile.avatar?.startsWith('http') 
                          ? profile.avatar
                          : getWalrusImageUrl(profile.avatar))
                      : profile.avatar
                  }
                  alt="avatar"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "https://i.pravatar.cc/150?img=1";
                  }}
                />
              </div>
              <h2>{profile.name}</h2>
              <p style={{ opacity: 0.7, marginBottom: "25px" }}>{profile.bio}</p>
              {isUserProfile && userProfile?.username && (
                <>
                  <div style={{ 
                    fontSize: "14px", 
                    opacity: 0.8, 
                    marginBottom: "10px",
                    padding: "8px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/${userProfile.username}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert("Profile link copied to clipboard!");
                  }}
                  >
                    🔗 {window.location.origin}/{userProfile.username}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "15px" }}>
                    ✓ Blockchain Profile
                  </div>
                </>
              )}

              {/* Add Link Button */}
              {isUserProfile && (
                <button
                  onClick={() => setShowAddLink(true)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "15px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    border: "2px dashed rgba(255,255,255,0.5)",
                    borderRadius: "10px",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                  }}
                >
                  ➕ Add Link
                </button>
              )}

              {/* Links */}
              {!loadingProfile && profile.links && profile.links.length > 0 && profile.links.map((link: any, idx: number) => (
                <a
                  key={idx}
                  href={link.url || (isUserProfile ? link.value?.[1] : link.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    margin: "10px 0",
                    padding: "12px",
                    backgroundColor: "white",
                    color: "#000",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ff8b3d")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  {link.label || (isUserProfile ? link.value?.[0] : link.label)}
                </a>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddLink && (
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
          onClick={() => setShowAddLink(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Link</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAddingLink(true);

                const tx = new Transaction();
                tx.setGasBudget(10000000);
                tx.moveCall({
                  target: `${PACKAGE_ID}::${MODULE_NAME}::add_link`,
                  arguments: [
                    tx.object(profileObjectId),
                    tx.pure.string(newLinkLabel),
                    tx.pure.string(newLinkUrl),
                  ],
                });

                signAndExecute(
                  { transaction: tx },
                  {
                    onSuccess: () => {
                      setShowAddLink(false);
                      setNewLinkLabel("");
                      setNewLinkUrl("");
                      setTimeout(() => window.location.reload(), 500);
                    },
                    onError: (error) => {
                      console.error("Failed to add link:", error);
                      alert("Failed to add link: " + error.message);
                      setAddingLink(false);
                    },
                  }
                );
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Label *
                </label>
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  required
                  placeholder="e.g., Twitter, GitHub, Website"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  URL *
                </label>
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  required
                  placeholder="https://example.com"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddLink(false)}
                  disabled={addingLink}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#ccc",
                    border: "none",
                    borderRadius: "5px",
                    cursor: addingLink ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLink}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: addingLink ? "#ccc" : "#c96d37",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: addingLink ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {addingLink ? "Adding..." : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Profile Modal */}
      {showCreateProfile && (
        <CreateProfile
          isEditing={!!userProfile}
          profileObjectId={profileObjectId}
          existingProfile={userProfile ? {
            username: userProfile.username,
            name: userProfile.name,
            bio: userProfile.bio,
            avatar: userProfile.avatar,
            theme: userProfile.theme,
          } : undefined}
          onClose={() => setShowCreateProfile(false)}
          onSuccess={() => {
            setShowCreateProfile(false);
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}
    </div>
  );
}
