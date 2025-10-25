import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { Transaction } from "@mysten/sui/transactions";
import { QRCodeSVG } from "qrcode.react";
import CreateProfileSimple from "./CreateProfileSimple";
import { getWalrusImageUrl } from "./walrusService";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { getTheme, getThemeNames, type Theme } from "./themes";

export default function ProfileDashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileObjectId, setProfileObjectId] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Kaydedilmiş temayı yükle
    const savedTheme = localStorage.getItem("suitree_theme");
    return getTheme(savedTheme || "default");
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [changingUsername, setChangingUsername] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!account) {
      navigate("/");
    }
  }, [account, navigate]);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      if (!account?.address) return;

      setLoadingProfile(true);
      try {
        const objects = await suiClient.getOwnedObjects({
          owner: account.address,
          options: { showType: true, showContent: true },
        });

        const profileObjects = objects.data.filter((obj: any) => {
          const type = obj.data?.type;
          return type?.includes("::linktree::LinkTreeProfile") && type?.startsWith(PACKAGE_ID);
        });

        const profileObj = profileObjects.length > 0 ? profileObjects[profileObjects.length - 1] : null;

        if (profileObj && profileObj.data?.content?.fields) {
          const fields = profileObj.data.content.fields;
          const themeName = fields.theme || "default";
          setProfileObjectId(profileObj.data.objectId);
          setUserProfile({
            username: fields.username,
            name: fields.name,
            bio: fields.bio,
            avatar: fields.blob_id || fields.avatar_cid,
            links: fields.links || [],
            theme: themeName,
            username_change_count: fields.username_change_count || 0,
          });
          // Kullanıcının temasını uygula ve kaydet
          setCurrentTheme(getTheme(themeName));
          localStorage.setItem("suitree_theme", themeName);
        } else {
          setShowCreateProfile(true);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [account, suiClient]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileObjectId) return;

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
  };

  const getProfileUrl = () => {
    return `${window.location.origin}/${userProfile?.username || 'profile'}`;
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(getProfileUrl());
    alert("Profile URL copied!");
  };

  const handleThemeChange = async (themeName: string) => {
    if (!profileObjectId || !userProfile) return;

    setSavingTheme(true);
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
      arguments: [
        tx.object(profileObjectId),
        tx.pure.string(userProfile.name),
        tx.pure.string(userProfile.bio),
        tx.pure.string(userProfile.avatar || ""),
        tx.pure.string(themeName),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          const newTheme = getTheme(themeName);
          setCurrentTheme(newTheme);
          setUserProfile({ ...userProfile, theme: themeName });
          // Temayı localStorage'a kaydet
          localStorage.setItem("suitree_theme", themeName);
          setShowThemeModal(false);
          setSavingTheme(false);
        },
        onError: (error) => {
          console.error("Failed to update theme:", error);
          alert("Failed to update theme: " + error.message);
          setSavingTheme(false);
        },
      }
    );
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileObjectId || !newUsername) return;

    // Reserved usernames check
    const reservedUsernames = [
      "dashboard", "admin", "root", "system", "api", "www", "app",
      "support", "help", "settings", "profile", "login", "register",
      "signup", "signin", "logout", "home", "about", "contact",
      "terms", "privacy", "legal"
    ];

    if (reservedUsernames.includes(newUsername.toLowerCase())) {
      alert("This username is reserved. Please choose another username.");
      return;
    }

    setChangingUsername(true);
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    
    // Payment required after first change
    const changeCount = userProfile?.username_change_count || 0;
    
    if (changeCount > 0) {
      const confirmPayment = window.confirm(
        `Changing username requires 1 SUI payment. (Change #${changeCount + 1})\n\nContinue?`
      );
      
      if (!confirmPayment) {
        setChangingUsername(false);
        return;
      }
    } else {
      alert("First username change is free! Subsequent changes will cost 1 SUI.");
    }

    // İlk değişiklik için None, sonraki değişiklikler için payment coin gönder
    // Şimdilik None gönderiyoruz (bedava değişiklik)
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::change_username`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(profileObjectId),
        tx.pure.string(newUsername),
        tx.pure.option('0x2::coin::Coin<0x2::sui::SUI>', null), // None for free change
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          alert("Username changed successfully!");
          setShowChangeUsername(false);
          setNewUsername("");
          setTimeout(() => window.location.reload(), 500);
        },
        onError: (error) => {
          console.error("Failed to change username:", error);
          if (error.message.includes("EUsernameAlreadyTaken")) {
            alert("This username is already taken. Please choose another one.");
          } else if (error.message.includes("EReservedUsername")) {
            alert("This username is reserved. Please choose another one.");
          } else {
            alert("Error changing username: " + error.message);
          }
          setChangingUsername(false);
        },
      }
    );
  };

  const handleDeleteAccount = async () => {
    if (!profileObjectId) return;

    const confirmDelete = window.prompt(
      'Are you sure you want to delete your account?\n\nThis action cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmDelete !== "DELETE") {
      return;
    }

    setDeletingAccount(true);
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::delete_profile`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(profileObjectId),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          alert("Your account has been deleted.");
          navigate("/");
        },
        onError: (error) => {
          console.error("Failed to delete account:", error);
          alert("Error deleting account: " + error.message);
          setDeletingAccount(false);
        },
      }
    );
  };

  if (loadingProfile) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#f7fafc"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🌳</div>
          <p style={{ color: "#666", fontSize: "16px" }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: currentTheme.gradient,
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Sidebar */}
      <aside style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "240px",
        backgroundColor: currentTheme.colors.card,
        borderRight: `1px solid ${currentTheme.colors.border}`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          marginBottom: "30px",
          color: currentTheme.colors.text,
          cursor: "pointer"
        }} onClick={() => navigate("/")}>
          🌳 SuiTree
        </div>

        <NavItem icon="🏠" label="My Linktree" active theme={currentTheme} />
        <NavItem icon="🎨" label="Appearance" onClick={() => setShowThemeModal(true)} theme={currentTheme} />
        <NavItem icon="👤" label="Change Username" onClick={() => setShowChangeUsername(true)} theme={currentTheme} />
        <NavItem icon="📊" label="Analytics" onClick={() => alert("Coming soon")} theme={currentTheme} />
        <NavItem icon="🗑️" label="Delete Account" onClick={() => setShowDeleteAccount(true)} theme={currentTheme} />
        
        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${currentTheme.colors.border}` }}>
          <NavItem 
            icon="🚪" 
            label="Back to Home" 
            onClick={() => navigate("/")} 
            theme={currentTheme}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: "240px", padding: "40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "30px"
          }}>
            <div>
              <h1 style={{ 
                fontSize: "28px", 
                fontWeight: "bold", 
                color: currentTheme.colors.text === "#1a202c" ? currentTheme.colors.text : currentTheme.colors.card, 
                margin: 0, 
                textShadow: currentTheme.colors.text === "#1a202c" ? "none" : "2px 2px 4px rgba(0,0,0,0.3)"
              }}>
                My Links
              </h1>
              <p style={{ 
                color: currentTheme.colors.text === "#1a202c" ? currentTheme.colors.textSecondary : "rgba(255,255,255,0.9)", 
                fontSize: "14px", 
                marginTop: "5px" 
              }}>
                {userProfile?.username ? `linktree.sui/${userProfile.username}` : "Create your profile"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button onClick={() => setShowShareModal(true)} variant="secondary">
                📋 Share
              </Button>
              <Button onClick={() => window.open(`/${userProfile?.username}`, '_blank')}>
                👁️ Preview
              </Button>
            </div>
          </div>

          {/* Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }}>
            {/* Left Column - Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Profile Card */}
              <Card>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    overflow: "hidden"
                  }}>
                    {userProfile?.avatar ? (
                      <img 
                        src={getWalrusImageUrl(userProfile.avatar)} 
                        alt="Avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : "👤"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a202c", margin: 0 }}>
                      @{userProfile?.username || "username"}
                    </h2>
                    <p style={{ color: "#718096", fontSize: "14px", marginTop: "5px" }}>
                      {userProfile?.bio || "Add bio"}
                    </p>
                  </div>
                  <Button variant="secondary" size="small">
                    ✏️ Edit
                  </Button>
                </div>
              </Card>

              {/* Add Link Button */}
              <Button 
                onClick={() => setShowAddLink(!showAddLink)} 
                variant="primary"
                style={{ width: "100%" }}
              >
                ➕ Add Link
              </Button>

              {/* Add Link Form */}
              {showAddLink && (
                <Card>
                  <form onSubmit={handleAddLink} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Add New Link</h3>
                    <input
                      type="text"
                      placeholder="Label (e.g., GitHub, Twitter)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      required
                      style={inputStyle}
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      required
                      style={inputStyle}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button type="button" variant="secondary" onClick={() => setShowAddLink(false)} disabled={addingLink}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingLink}>
                        {addingLink ? "Adding..." : "Add Link"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Links List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {userProfile?.links && userProfile.links.length > 0 ? (
                  userProfile.links.map((link: any, index: number) => (
                    <LinkCard 
                      key={index}
                      label={link.key || `Link ${index + 1}`}
                      url={link.value || "#"}
                    />
                  ))
                ) : (
                  <Card>
                    <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>
                      <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔗</div>
                      <p>No links yet. Add your first link!</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div>
              <Card style={{ position: "sticky", top: "20px" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#718096", 
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}>
                    <span>Preview</span>
                    <span style={{
                      backgroundColor: "#f7fafc",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}>
                      📱
                    </span>
                  </div>
                </div>

                {/* Phone Mock */}
                <div style={{
                  backgroundColor: "#1a202c",
                  borderRadius: "30px",
                  padding: "20px 15px",
                  minHeight: "600px",
                  position: "relative",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                }}>
                  <div style={{
                    backgroundColor: "#f7fafc",
                    borderRadius: "20px",
                    padding: "40px 20px",
                    minHeight: "560px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px"
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#e2e8f0",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      overflow: "hidden"
                    }}>
                      {userProfile?.avatar ? (
                        <img 
                          src={getWalrusImageUrl(userProfile.avatar)} 
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : "👤"}
                    </div>

                    {/* Name */}
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                        @{userProfile?.username || "username"}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#718096", marginTop: "5px" }}>
                        {userProfile?.bio || "Your bio here"}
                      </p>
                    </div>

                    {/* Preview Links */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                      {userProfile?.links && userProfile.links.length > 0 ? (
                        userProfile.links.slice(0, 3).map((link: any, index: number) => (
                          <div key={index} style={{
                            padding: "12px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                          }}>
                            {link.key || `Link ${index + 1}`}
                          </div>
                        ))
                      ) : (
                        <div style={{
                          padding: "12px",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: "#cbd5e0"
                        }}>
                          Your links will appear here
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                      <small style={{ fontSize: "12px", color: "#a0aec0" }}>
                        Powered by SuiTree 🌳
                      </small>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Create Profile Modal */}
      {showCreateProfile && !userProfile && (
        <CreateProfileSimple
          onClose={() => setShowCreateProfile(false)}
          onSuccess={() => {
            setShowCreateProfile(false);
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}

      {/* Theme Modal */}
      {showThemeModal && (
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
          onClick={() => !savingTheme && setShowThemeModal(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "15px",
              padding: "30px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0 }}>
              🎨 Tema Seç
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "20px" }}>
              Dashboard'unuzu kişisleştirin
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "15px" }}>
              {getThemeNames().map((themeName) => {
                const theme = getTheme(themeName);
                const isSelected = userProfile?.theme === themeName;
                return (
                  <div
                    key={themeName}
                    onClick={() => !savingTheme && handleThemeChange(themeName)}
                    style={{
                      padding: "15px",
                      borderRadius: "12px",
                      border: isSelected ? `3px solid ${currentTheme.colors.primary}` : `2px solid ${currentTheme.colors.border}`,
                      cursor: savingTheme ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: savingTheme ? 0.6 : 1,
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!savingTheme && !isSelected) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        backgroundColor: currentTheme.colors.primary,
                        color: "white",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}>
                        ✓
                      </div>
                    )}
                    <div
                      style={{
                        background: theme.gradient,
                        height: "80px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                      }}
                    />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: currentTheme.colors.text }}>
                        {theme.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowThemeModal(false)}
                disabled={savingTheme}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: `1px solid ${currentTheme.colors.border}`,
                  backgroundColor: currentTheme.colors.card,
                  color: currentTheme.colors.text,
                  cursor: savingTheme ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Username Modal */}
      {showChangeUsername && (
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
          onClick={() => setShowChangeUsername(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "15px",
              padding: "30px",
              width: "100%",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0 }}>
              👤 Change Username
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "20px", fontSize: "14px" }}>
              Current: <strong>@{userProfile?.username}</strong>
            </p>
            <p style={{ color: currentTheme.colors.warning, marginBottom: "20px", fontSize: "13px", backgroundColor: "#fff3cd", padding: "10px", borderRadius: "8px" }}>
              ⚠️ First change is free, subsequent changes cost <strong>1 SUI</strong> each.
            </p>

            <form onSubmit={handleChangeUsername}>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                placeholder="New username"
                required
                disabled={changingUsername}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${currentTheme.colors.border}`,
                  fontSize: "14px",
                  boxSizing: "border-box",
                  marginBottom: "20px",
                }}
              />

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowChangeUsername(false)}
                  disabled={changingUsername}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.card,
                    color: currentTheme.colors.text,
                    cursor: changingUsername ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingUsername || !newUsername}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: changingUsername ? "#ccc" : currentTheme.colors.primary,
                    color: "white",
                    cursor: changingUsername || !newUsername ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {changingUsername ? "Changing..." : "Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
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
          onClick={() => setShowDeleteAccount(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "15px",
              padding: "30px",
              width: "100%",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: currentTheme.colors.danger, marginTop: 0 }}>
              🗑️ Delete Account
            </h2>
            <p style={{ color: currentTheme.colors.text, marginBottom: "20px", fontSize: "14px" }}>
              This action cannot be undone. Your profile and all links will be permanently deleted.
            </p>
            <p style={{ color: currentTheme.colors.danger, marginBottom: "20px", fontSize: "13px", backgroundColor: "#fee", padding: "10px", borderRadius: "8px" }}>
              ⚠️ <strong>WARNING:</strong> This action cannot be undone!
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteAccount(false)}
                disabled={deletingAccount}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: `1px solid ${currentTheme.colors.border}`,
                  backgroundColor: currentTheme.colors.card,
                  color: currentTheme.colors.text,
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: deletingAccount ? "#ccc" : currentTheme.colors.danger,
                  color: "white",
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {deletingAccount ? "Deleting..." : "Permanently Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with QR Code */}
      {showShareModal && userProfile && (
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
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "500px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, marginBottom: "10px" }}>
              📋 Share Profile
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "30px", fontSize: "14px" }}>
              Scan the QR code or copy the link
            </p>

            {/* QR Code */}
            <div style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "16px",
              display: "inline-block",
              marginBottom: "30px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <QRCodeSVG
                value={getProfileUrl()}
                size={256}
                level="H"
                includeMargin
                fgColor={currentTheme.colors.primary}
              />
            </div>

            {/* Username */}
            <div style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: currentTheme.colors.text,
              marginBottom: "10px"
            }}>
              @{userProfile.username}
            </div>

            {/* URL */}
            <div style={{
              backgroundColor: currentTheme.colors.cardHover,
              padding: "12px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px"
            }}>
              <code style={{
                fontSize: "14px",
                color: currentTheme.colors.textSecondary,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {getProfileUrl()}
              </code>
              <button
                onClick={copyProfileUrl}
                style={{
                  padding: "8px 16px",
                  backgroundColor: currentTheme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  flexShrink: 0,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.primary}
              >
                📋 Copy
              </button>
            </div>

            {/* Social Share Buttons */}
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <SocialShareButton
                icon="🐦"
                label="Twitter"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my SuiTree profile!&url=${encodeURIComponent(getProfileUrl())}`, '_blank')}
                theme={currentTheme}
              />
              <SocialShareButton
                icon="📧"
                label="Email"
                onClick={() => window.location.href = `mailto:?subject=My SuiTree Profile&body=Check out my profile: ${getProfileUrl()}`}
                theme={currentTheme}
              />
              <SocialShareButton
                icon="📱"
                label="WhatsApp"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check out my SuiTree profile: ' + getProfileUrl())}`, '_blank')}
                theme={currentTheme}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                padding: "12px 32px",
                backgroundColor: currentTheme.colors.cardHover,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`,
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.colors.cardHover}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function NavItem({ icon, label, active, onClick, theme }: { icon: string; label: string; active?: boolean; onClick?: () => void; theme: Theme }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        backgroundColor: active ? theme.colors.cardHover : "transparent",
        color: active ? theme.colors.text : theme.colors.textSecondary,
        fontWeight: active ? "600" : "400",
        fontSize: "14px",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = theme.colors.cardHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      ...style
    }}>
      {children}
    </div>
  );
}

function Button({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "medium",
  type = "button",
  disabled = false,
  style 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary";
  size?: "small" | "medium";
  type?: "button" | "submit";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const baseStyle: React.CSSProperties = {
    padding: size === "small" ? "8px 16px" : "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontSize: size === "small" ? "13px" : "14px",
    fontWeight: "600",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
    ...style
  };

  const variantStyle: React.CSSProperties = variant === "primary"
    ? { backgroundColor: "#8b5cf6", color: "white" }
    : { backgroundColor: "#f7fafc", color: "#1a202c", border: "1px solid #e2e8f0" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyle }}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === "primary") {
            e.currentTarget.style.backgroundColor = "#7c3aed";
          } else {
            e.currentTarget.style.backgroundColor = "#edf2f7";
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === "primary") {
            e.currentTarget.style.backgroundColor = "#8b5cf6";
          } else {
            e.currentTarget.style.backgroundColor = "#f7fafc";
          }
        }
      }}
    >
      {children}
    </button>
  );
}

function LinkCard({ label, url }: { label: string; url: string }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ fontSize: "24px" }}>🔗</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "#1a202c" }}>
            {label}
          </h4>
          <p style={{ fontSize: "13px", color: "#718096", margin: "2px 0 0" }}>
            {url}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <IconButton icon="✏️" onClick={() => alert("Edit coming soon!")} />
          <IconButton icon="📊" onClick={() => alert("Analytics coming soon!")} />
          <IconButton icon="🗑️" onClick={() => alert("Delete coming soon!")} danger />
        </div>
      </div>
    </Card>
  );
}

function IconButton({ icon, onClick, danger }: { icon: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
        cursor: "pointer",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? "#fee" : "#f7fafc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "white";
      }}
    >
      {icon}
    </button>
  );
}

function SocialShareButton({ icon, label, onClick, theme }: { icon: string; label: string; onClick: () => void; theme: Theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 20px",
        backgroundColor: theme.colors.cardHover,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s",
        flexDirection: "column"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.border;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.cardHover;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span style={{ fontSize: "24px" }}>{icon}</span>
      <span style={{ fontSize: "12px" }}>{label}</span>
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s"
};
