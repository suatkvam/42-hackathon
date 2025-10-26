import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { Transaction } from "@mysten/sui/transactions";
import { QRCodeSVG } from "qrcode.react";
import CreateProfileSimple from "./CreateProfileSimple";
import { getWalrusImageUrl, fetchProfileFromWalrus, uploadProfileToWalrus, ProfileContent } from "./walrusService";
import { uploadImageToCloudinary } from "./cloudinaryService";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "./constants";
import { getTheme, getThemeNames, type Theme } from "./themes";
import { getAnalytics, isAnalyticsEnabled, type AnalyticsStats } from "./analyticsService";
import { parseAvatarId, getAvatarById } from "./avatarNftService";
import { FaHome, FaPalette, FaUser, FaChartBar, FaTrash, FaClipboard, FaEye, FaEdit, FaPlus, FaLink, FaMobile, FaDesktop, FaTabletAlt, FaClock, FaCalendar, FaDoorOpen, FaTree, FaGlobeAmericas, FaLightbulb, FaExclamationTriangle, FaTimes, FaTwitter, FaEnvelope, FaWhatsapp, FaQuestionCircle } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

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
    // Load saved theme
    const savedTheme = localStorage.getItem("suitree_theme");
    return getTheme(savedTheme || "default");
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [changingUsername, setChangingUsername] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");  // Walrus blob ID
  const [editAvatarUrl, setEditAvatarUrl] = useState("");  // Cloudinary URL
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showEditLink, setShowEditLink] = useState(false);
  const [editingLink, setEditingLink] = useState<{oldLabel: string; label: string; url: string} | null>(null);
  const [savingLink, setSavingLink] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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
          const contentBlobId = fields.content_blob_id;
          const themeName = fields.theme || "default";
          
          // Fetch profile content from Walrus
          try {
            const profileContent = await fetchProfileFromWalrus(contentBlobId);
            console.log("Fetched profile content from Walrus:", profileContent);
            
            setProfileObjectId(profileObj.data.objectId);
            console.log("[DEBUG] Profile content loaded:", {
              avatar_blob_id: profileContent.avatar_blob_id,
              avatar_url: profileContent.avatar_url,
            });
            setUserProfile({
              username: fields.username,
              name: profileContent.name,
              bio: profileContent.bio,
              avatar: profileContent.avatar_blob_id,
              avatarUrl: profileContent.avatar_url,  // Cloudinary URL
              nftAvatarId: fields.nft_avatar_id || 0,  // NFT Avatar ID
              links: profileContent.links.map(link => ({
                key: link.label,
                value: link.url,
              })),
              theme: themeName,
              username_change_count: fields.username_change_count || 0,
            });
            // Apply and save user's theme
            setCurrentTheme(getTheme(themeName));
            localStorage.setItem("suitree_theme", themeName);
          } catch (err) {
            console.error("Error fetching profile content from Walrus:", err);
            // Fallback to old structure (V2) if Walrus fetch fails
            console.log("Using V2 fallback structure");
            
            // Parse old VecMap structure for links
            let parsedLinks = [];
            if (fields.links?.fields?.contents) {
              parsedLinks = fields.links.fields.contents.map((item: any) => ({
                key: item.fields.key,
                value: item.fields.value,
              }));
            } else if (Array.isArray(fields.links)) {
              parsedLinks = fields.links;
            }
            
            setProfileObjectId(profileObj.data.objectId);
            setUserProfile({
              username: fields.username,
              name: fields.name || "User",
              bio: fields.bio || "",
              avatar: fields.blob_id || "",
              nftAvatarId: fields.nft_avatar_id || 0,  // NFT Avatar ID
              links: parsedLinks,
              theme: themeName,
              username_change_count: fields.username_change_count || 0,
            });
            setCurrentTheme(getTheme(themeName));
            localStorage.setItem("suitree_theme", themeName);
          }
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

  const handleDeleteLink = async (label: string) => {
    if (!profileObjectId || !userProfile) {
      alert("Error: Profile not loaded");
      return;
    }

    if (!confirm(`Are you sure you want to delete the link "${label}"?`)) {
      return;
    }

    setDeletingLink(label);
    
    try {
      // Update profile content in Walrus
      const updatedLinks = userProfile.links.filter((link: any) => link.key !== label);
      const profileContent: ProfileContent = {
        name: userProfile.name,
        bio: userProfile.bio,
        avatar_blob_id: userProfile.avatar,
        avatar_url: userProfile.avatarUrl,  // Preserve Cloudinary URL
        links: updatedLinks.map((link: any) => ({ label: link.key, url: link.value })),
      };

      const contentBlobId = await uploadProfileToWalrus(profileContent);

      // Update on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(contentBlobId),
          tx.pure.string(userProfile.theme || "default"),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Link deleted successfully!");
            setDeletingLink(null);
            setTimeout(() => window.location.reload(), 500);
          },
          onError: (error) => {
            console.error("Failed to delete link:", error);
            alert("Failed to delete link: " + error.message);
            setDeletingLink(null);
          },
        }
      );
    } catch (error: any) {
      console.error("Error deleting link:", error);
      alert("Error: " + (error.message || "Unknown error"));
      setDeletingLink(null);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileObjectId || !userProfile) {
      console.error("No profile object ID found");
      alert("Error: Profile not loaded");
      return;
    }

    setAddingLink(true);
    
    try {
      // Update profile content in Walrus
      const updatedLinks = [...userProfile.links, { key: newLinkLabel, value: newLinkUrl }];
      const profileContent: ProfileContent = {
        name: userProfile.name,
        bio: userProfile.bio,
        avatar_blob_id: userProfile.avatar,
        avatar_url: userProfile.avatarUrl,  // Preserve Cloudinary URL
        links: updatedLinks.map((link: any) => ({ label: link.key, url: link.value })),
      };

      const contentBlobId = await uploadProfileToWalrus(profileContent);

      // Update on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(contentBlobId),
          tx.pure.string(userProfile.theme || "default"),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Link added successfully:", result);
            alert("Link added successfully!");
            setShowAddLink(false);
            setNewLinkLabel("");
            setNewLinkUrl("");
            setAddingLink(false);
            setTimeout(() => window.location.reload(), 500);
          },
          onError: (error) => {
            console.error("Failed to add link:", error);
            alert("Failed to add link: " + (error.message || "Unknown error"));
            setAddingLink(false);
          },
        }
      );
    } catch (error: any) {
      console.error("Exception in handleAddLink:", error);
      alert("Error: " + (error.message || "Unknown error"));
      setAddingLink(false);
    }
  };

  const getProfileUrl = () => {
    return `${window.location.origin}/${userProfile?.username || 'profile'}`;
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(getProfileUrl());
    alert("Profile URL copied!");
  };

  const handleEditProfile = () => {
    setEditName(userProfile?.name || "");
    setEditBio(userProfile?.bio || "");
    setEditAvatar(userProfile?.avatar || "");
    setEditAvatarUrl(userProfile?.avatarUrl || "");
    // Set initial preview
    if (userProfile?.avatarUrl) {
      setAvatarPreview(userProfile.avatarUrl);
    } else if (userProfile?.avatar) {
      setAvatarPreview(getWalrusImageUrl(userProfile.avatar));
    } else {
      setAvatarPreview("");
    }
    setShowEditProfile(true);
  };

  const handleEditLink = (label: string, url: string) => {
    setEditingLink({ oldLabel: label, label, url });
    setShowEditLink(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileObjectId || !editingLink || !userProfile) return;

    setSavingLink(true);
    
    try {
      // Update profile content in Walrus
      const updatedLinks = userProfile.links.map((link: any) => 
        link.key === editingLink.oldLabel 
          ? { key: editingLink.label, value: editingLink.url }
          : link
      );
      const profileContent: ProfileContent = {
        name: userProfile.name,
        bio: userProfile.bio,
        avatar_blob_id: userProfile.avatar,
        avatar_url: userProfile.avatarUrl,  // Preserve Cloudinary URL
        links: updatedLinks.map((link: any) => ({ label: link.key, url: link.value })),
      };

      const contentBlobId = await uploadProfileToWalrus(profileContent);

      // Update on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(contentBlobId),
          tx.pure.string(userProfile.theme || "default"),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Link updated successfully!");
            setShowEditLink(false);
            setEditingLink(null);
            setSavingLink(false);
            setTimeout(() => window.location.reload(), 500);
          },
          onError: (error) => {
            console.error("Failed to update link:", error);
            alert("Failed to update link: " + error.message);
            setSavingLink(false);
          },
        }
      );
    } catch (error: any) {
      console.error("Error updating link:", error);
      alert("Error: " + (error.message || "Unknown error"));
      setSavingLink(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileObjectId || !userProfile) return;

    console.log("[DEBUG] Saving profile with:", {
      editName,
      editBio,
      editAvatar,
      editAvatarUrl,
    });

    setSavingProfile(true);
    
    try {
      // Update profile content in Walrus
      const profileContent: ProfileContent = {
        name: editName,
        bio: editBio,
        avatar_blob_id: editAvatar,
        avatar_url: editAvatarUrl,  // Include Cloudinary URL
        links: userProfile.links.map((link: any) => ({ label: link.key, url: link.value })),
      };
      
      console.log("[DEBUG] Profile content to save:", profileContent);

      const contentBlobId = await uploadProfileToWalrus(profileContent);

      // Update on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(contentBlobId),
          tx.pure.string(userProfile.theme || "default"),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert("Profile updated successfully!");
            setShowEditProfile(false);
            setSavingProfile(false);
            setTimeout(() => window.location.reload(), 500);
          },
          onError: (error) => {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile: " + error.message);
            setSavingProfile(false);
          },
        }
      );
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert("Error: " + (error.message || "Unknown error"));
      setSavingProfile(false);
    }
  };

  const handleThemeChange = async (themeName: string) => {
    if (!profileObjectId || !userProfile) return;

    setSavingTheme(true);
    
    try {
      // Get current content blob ID from blockchain (no need to re-upload content)
      const objects = await suiClient.getOwnedObjects({
        owner: account!.address,
        options: { showType: true, showContent: true },
      });

      const profileObjects = objects.data.filter((obj: any) => {
        const type = obj.data?.type;
        return type?.includes("::linktree::LinkTreeProfile") && type?.startsWith(PACKAGE_ID);
      });

      const profileObj = profileObjects.length > 0 ? profileObjects[profileObjects.length - 1] : null;
      if (!profileObj || !profileObj.data?.content?.fields) {
        throw new Error("Profile not found");
      }

      const contentBlobId = profileObj.data.content.fields.content_blob_id;

      // Update only theme on blockchain
      const tx = new Transaction();
      tx.setGasBudget(10000000);
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(contentBlobId),
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
    } catch (error: any) {
      console.error("Error updating theme:", error);
      alert("Error: " + (error.message || "Unknown error"));
      setSavingTheme(false);
    }
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
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::change_username`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.object(profileObjectId),
        tx.pure.string(newUsername),
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
          <div style={{ fontSize: "48px", marginBottom: "20px", display: "flex", justifyContent: "center", color: "#8b5cf6" }}><FaTree /></div>
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
      <style>{`
        input::placeholder,
        textarea::placeholder {
          color: ${currentTheme.colors.textSecondary};
          opacity: 0.6;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }} onClick={() => navigate("/")}>
          <FaTree /> 42Tree
        </div>

        <NavItem icon={<FaHome />} label="My Linktree" active theme={currentTheme} />
        <NavItem icon={<FaPalette />} label="Appearance" onClick={() => setShowThemeModal(true)} theme={currentTheme} />
        <NavItem icon={<FaUser />} label="Change Username" onClick={() => setShowChangeUsername(true)} theme={currentTheme} />
        <NavItem icon={<FaChartBar />} label="Analytics" onClick={async () => {
          if (!isAnalyticsEnabled()) {
            alert("Analytics is not configured. Please add Supabase credentials to .env file.");
            return;
          }
          setShowAnalytics(true);
          setLoadingAnalytics(true);
          const stats = await getAnalytics(profileObjectId);
          setAnalyticsData(stats);
          setLoadingAnalytics(false);
        }} theme={currentTheme} />
        <NavItem icon={<FaTrash />} label="Delete Account" onClick={() => setShowDeleteAccount(true)} theme={currentTheme} />
        
        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${currentTheme.colors.border}` }}>
          <NavItem 
            icon={<FaDoorOpen />}
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
                <FaClipboard style={{ display: "inline", marginRight: "6px" }} /> Share
              </Button>
              <Button onClick={() => window.open(`/${userProfile?.username}`, '_blank')}>
                <FaEye style={{ display: "inline", marginRight: "6px" }} /> Preview
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
                    backgroundColor: currentTheme.colors.cardHover,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    overflow: "hidden"
                  }}>
                    {(() => {
                      // Priority: NFT Avatar > Cloudinary URL > Walrus Blob > Default
                      let avatarSrc = "";
                      
                      // 1. Check NFT Avatar
                      if (userProfile?.nftAvatarId && userProfile.nftAvatarId > 0) {
                        const nftAvatar = getAvatarById(userProfile.nftAvatarId);
                        if (nftAvatar) {
                          avatarSrc = nftAvatar.imageUrl;
                        }
                      }
                      // 2. Check Cloudinary URL
                      else if (userProfile?.avatarUrl && userProfile.avatarUrl.trim() !== "") {
                        avatarSrc = userProfile.avatarUrl;
                      }
                      // 3. Check Walrus Blob
                      else if (userProfile?.avatar && userProfile.avatar.trim() !== "") {
                        // Check if it's an NFT avatar string
                        const nftId = parseAvatarId(userProfile.avatar);
                        if (nftId) {
                          const nftAvatar = getAvatarById(nftId);
                          avatarSrc = nftAvatar ? nftAvatar.imageUrl : "";
                        } else {
                          avatarSrc = getWalrusImageUrl(userProfile.avatar);
                        }
                      }
                      
                      return avatarSrc ? (
                        <img 
                          src={avatarSrc}
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.innerHTML = "👤";
                          }}
                        />
                      ) : "👤";
                    })()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", color: currentTheme.colors.text, margin: 0 }}>
                      @{userProfile?.username || "username"}
                    </h2>
                    <p style={{ color: currentTheme.colors.textSecondary, fontSize: "14px", marginTop: "5px" }}>
                      {userProfile?.bio || "Add bio"}
                    </p>
                  </div>
                  <Button variant="secondary" size="small" onClick={handleEditProfile}>
                    <FaEdit style={{ display: "inline", marginRight: "6px" }} /> Edit
                  </Button>
                </div>
              </Card>

              {/* Add Link Button */}
              <Button 
                onClick={() => setShowAddLink(!showAddLink)} 
                variant="primary"
                style={{ width: "100%" }}
              >
                <FaPlus style={{ display: "inline", marginRight: "6px" }} /> Add Link
              </Button>

              {/* Add Link Form */}
              {showAddLink && (
                <Card>
                  <form onSubmit={handleAddLink} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: currentTheme.colors.text }}>Add New Link</h3>
                    <input
                      type="text"
                      placeholder="Label (e.g., GitHub, Twitter)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      required
                      style={{
                        ...inputStyle,
                        backgroundColor: currentTheme.colors.cardHover,
                        color: currentTheme.colors.text,
                        border: `1px solid ${currentTheme.colors.border}`
                      }}
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      required
                      style={{
                        ...inputStyle,
                        backgroundColor: currentTheme.colors.cardHover,
                        color: currentTheme.colors.text,
                        border: `1px solid ${currentTheme.colors.border}`
                      }}
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
                      onEdit={() => handleEditLink(link.key, link.value)}
                      onDelete={() => handleDeleteLink(link.key)}
                      onAnalytics={async () => {
                        if (!isAnalyticsEnabled()) {
                          alert("Analytics not configured. Please add Supabase credentials to .env file.");
                          return;
                        }
                        setShowAnalytics(true);
                        setLoadingAnalytics(true);
                        const stats = await getAnalytics(profileObjectId);
                        setAnalyticsData(stats);
                        setLoadingAnalytics(false);
                      }}
                      deleting={deletingLink === link.key}
                      theme={currentTheme}
                    />
                  ))
                ) : (
                  <Card>
                    <div style={{ textAlign: "center", padding: "40px", color: currentTheme.colors.textSecondary }}>
                      <div style={{ fontSize: "48px", marginBottom: "10px" }}><FaLink /></div>
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
                    color: currentTheme.colors.textSecondary,
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
                      <FaMobile />
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
                      <p style={{ fontSize: "14px", color: "#2d3748", marginTop: "5px" }}>
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
                            color: "#2d3748",
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
                      <small style={{ fontSize: "12px", color: "#2d3748" }}>
                        Powered by 42Tree 🌳
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <FaPalette /> Choose Theme
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "20px" }}>
              Customize your dashboard
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
                Close
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "580px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "26px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaUser /> Change Username
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "20px", fontSize: "14px" }}>
              Current: <strong>@{userProfile?.username}</strong>
            </p>
            <p style={{ color: currentTheme.colors.textSecondary, marginBottom: "20px", fontSize: "13px", backgroundColor: "#f0f9ff", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaLightbulb style={{ flexShrink: 0 }} /> You can change your username anytime.
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
                    backgroundColor: currentTheme.colors.cardHover,
                    color: currentTheme.colors.text,
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "580px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "26px", fontWeight: "bold", color: currentTheme.colors.danger, marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaTrash /> Delete Account
            </h2>
            <p style={{ color: currentTheme.colors.text, marginBottom: "20px", fontSize: "14px" }}>
              This action cannot be undone. Your profile and all links will be permanently deleted.
            </p>
            <p style={{ color: currentTheme.colors.danger, marginBottom: "20px", fontSize: "13px", backgroundColor: "#fee", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaExclamationTriangle style={{ flexShrink: 0 }} /> <strong>WARNING:</strong> This action cannot be undone!
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

      {/* Analytics Modal */}
      {showAnalytics && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "20px",
            overflow: "auto",
          }}
          onClick={() => setShowAnalytics(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "15px",
              padding: "30px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: currentTheme.colors.text, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FaChartBar /> Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaTimes />
              </button>
            </div>

            {loadingAnalytics ? (
              <div style={{ textAlign: "center", padding: "40px", color: currentTheme.colors.textSecondary }}>
                <div style={{ fontSize: "48px", marginBottom: "20px", display: "flex", justifyContent: "center" }}><MdRefresh style={{ animation: "spin 1s linear infinite" }} /></div>
                <p>Loading analytics...</p>
              </div>
            ) : !analyticsData ? (
              <div style={{ textAlign: "center", padding: "40px", color: currentTheme.colors.textSecondary }}>
                <div style={{ fontSize: "48px", marginBottom: "20px", display: "flex", justifyContent: "center" }}><FaExclamationTriangle /></div>
                <p>Analytics not available</p>
                <p style={{ fontSize: "14px", marginTop: "10px" }}>Make sure Supabase is configured in .env file</p>
              </div>
            ) : analyticsData.totalClicks === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: currentTheme.colors.textSecondary }}>
                <div style={{ fontSize: "48px", marginBottom: "20px", display: "flex", justifyContent: "center" }}><FaChartBar /></div>
                <p>No clicks tracked yet</p>
                <p style={{ fontSize: "14px", marginTop: "10px" }}>Start sharing your profile to see analytics</p>
              </div>
            ) : (
              <div>
                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "30px" }}>
                  <div style={{
                    padding: "20px",
                    backgroundColor: currentTheme.colors.cardHover,
                    borderRadius: "12px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: currentTheme.colors.primary }}>
                      {analyticsData.totalClicks}
                    </div>
                    <div style={{ fontSize: "14px", color: currentTheme.colors.textSecondary, marginTop: "5px" }}>
                      Total Clicks
                    </div>
                  </div>
                  <div style={{
                    padding: "20px",
                    backgroundColor: currentTheme.colors.cardHover,
                    borderRadius: "12px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: currentTheme.colors.primary }}>
                      {analyticsData.topLinks.length}
                    </div>
                    <div style={{ fontSize: "14px", color: currentTheme.colors.textSecondary, marginTop: "5px" }}>
                      Active Links
                    </div>
                  </div>
                </div>

                {/* Top Links */}
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: currentTheme.colors.text, marginBottom: "15px" }}>
                    Top Links
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {analyticsData.topLinks.map((link, index) => (
                      <div
                        key={link.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "15px",
                          backgroundColor: currentTheme.colors.cardHover,
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: currentTheme.colors.textSecondary,
                            minWidth: "30px",
                          }}>
                            #{index + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "600", color: currentTheme.colors.text }}>
                              {link.label}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: currentTheme.colors.primary,
                        }}>
                          {link.clicks}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic Source */}
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: currentTheme.colors.text, marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaGlobeAmericas /> Traffic Sources
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(analyticsData.clicksByReferrer)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([source, clicks]) => {
                        const total = analyticsData.totalClicks;
                        const percentage = Math.round(((clicks as number) / total) * 100);
                        return (
                          <div
                            key={source}
                            style={{
                              padding: "12px",
                              backgroundColor: currentTheme.colors.cardHover,
                              borderRadius: "8px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: currentTheme.colors.text }}>
                                {source}
                              </div>
                              <div style={{ fontSize: "14px", fontWeight: "600", color: currentTheme.colors.primary }}>
                                {clicks} ({percentage}%)
                              </div>
                            </div>
                            <div style={{ 
                              height: "6px", 
                              backgroundColor: currentTheme.colors.border, 
                              borderRadius: "3px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${percentage}%`,
                                backgroundColor: currentTheme.colors.primary,
                                transition: "width 0.3s ease"
                              }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: currentTheme.colors.text, marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaMobile /> Devices
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                    {Object.entries(analyticsData.clicksByDevice).map(([device, count]) => {
                      const total = analyticsData.totalClicks;
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      const icons: Record<string, React.ReactNode> = {
                        mobile: <FaMobile />,
                        desktop: <FaDesktop />,
                        tablet: <FaTabletAlt />,
                        other: <FaQuestionCircle />
                      };
                      return (
                        <div
                          key={device}
                          style={{
                            padding: "15px",
                            backgroundColor: currentTheme.colors.cardHover,
                            borderRadius: "10px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "32px", marginBottom: "5px", display: "flex", justifyContent: "center", color: currentTheme.colors.primary }}>
                            {icons[device] || <FaQuestionCircle />}
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: currentTheme.colors.text, textTransform: "capitalize", marginBottom: "3px" }}>
                            {device}
                          </div>
                          <div style={{ fontSize: "18px", fontWeight: "bold", color: currentTheme.colors.primary }}>
                            {count} <span style={{ fontSize: "12px", color: currentTheme.colors.textSecondary }}>({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Peak Hours */}
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: currentTheme.colors.text, marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaClock /> Peak Hours (Most Active Times)
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Object.entries(analyticsData.clicksByHour)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([hour, clicks]) => {
                        const hourNum = parseInt(hour);
                        const hourLabel = `${hourNum.toString().padStart(2, '0')}:00 - ${((hourNum + 1) % 24).toString().padStart(2, '0')}:00`;
                        const maxClicks = Math.max(...Object.values(analyticsData.clicksByHour));
                        const percentage = (clicks as number / maxClicks) * 100;
                        return (
                          <div
                            key={hour}
                            style={{
                              padding: "10px",
                              backgroundColor: currentTheme.colors.cardHover,
                              borderRadius: "8px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <div style={{ fontSize: "13px", color: currentTheme.colors.text }}>
                                {hourLabel}
                              </div>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: currentTheme.colors.primary }}>
                                {clicks} clicks
                              </div>
                            </div>
                            <div style={{ 
                              height: "4px", 
                              backgroundColor: currentTheme.colors.border, 
                              borderRadius: "2px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${percentage}%`,
                                backgroundColor: currentTheme.colors.primary,
                              }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Clicks by Day */}
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: currentTheme.colors.text, marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaCalendar /> Recent Activity (Last 7 Days)
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(analyticsData.clicksByDay)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .slice(0, 7)
                      .map(([day, clicks]) => (
                        <div
                          key={day}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            backgroundColor: currentTheme.colors.cardHover,
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ fontSize: "14px", color: currentTheme.colors.text }}>
                            {day}
                          </div>
                          <div style={{ fontSize: "16px", fontWeight: "600", color: currentTheme.colors.primary }}>
                            {clicks} clicks
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {showEditLink && editingLink && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "20px",
          }}
          onClick={() => !savingLink && setShowEditLink(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "580px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "26px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaEdit /> Edit Link
            </h2>

            <form onSubmit={handleSaveLink}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "15px", color: currentTheme.colors.text }}>
                  Label
                </label>
                <input
                  type="text"
                  value={editingLink.label}
                  onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                  required
                  disabled={savingLink}
                  placeholder="e.g., GitHub, Twitter"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.cardHover,
                    color: currentTheme.colors.text,
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "15px", color: currentTheme.colors.text }}>
                  URL
                </label>
                <input
                  type="url"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  required
                  disabled={savingLink}
                  placeholder="https://..."
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.cardHover,
                    color: currentTheme.colors.text,
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLink(false);
                    setEditingLink(null);
                  }}
                  disabled={savingLink}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.card,
                    color: currentTheme.colors.text,
                    cursor: savingLink ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLink}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: savingLink ? "#ccc" : currentTheme.colors.primary,
                    color: "white",
                    cursor: savingLink ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {savingLink ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "20px",
          }}
          onClick={() => !savingProfile && setShowEditProfile(false)}
        >
          <div
            style={{
              backgroundColor: currentTheme.colors.card,
              borderRadius: "20px",
              padding: "40px",
              width: "100%",
              maxWidth: "580px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "26px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaEdit /> Edit Profile
            </h2>

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "15px", color: currentTheme.colors.text }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={savingProfile}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.cardHover,
                    color: currentTheme.colors.text,
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "15px", color: currentTheme.colors.text }}>
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  disabled={savingProfile}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.cardHover,
                    color: currentTheme.colors.text,
                    fontSize: "14px",
                    minHeight: "100px",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Avatar Upload Section */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "15px", color: currentTheme.colors.text }}>
                  Avatar
                </label>
                
                {/* Avatar Preview */}
                {avatarPreview && (
                  <div style={{ marginBottom: "15px", textAlign: "center" }}>
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `3px solid ${currentTheme.colors.primary}`,
                      }}
                      onError={() => setAvatarPreview("")}
                    />
                  </div>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (file.size > 10 * 1024 * 1024) {
                      alert("Image size must be less than 10MB");
                      return;
                    }
                    
                    setUploadingAvatar(true);
                    try {
                      const localUrl = URL.createObjectURL(file);
                      setAvatarPreview(localUrl);
                      
                      const cloudinaryUrl = await uploadImageToCloudinary(file);
                      setEditAvatarUrl(cloudinaryUrl);
                      setEditAvatar("");
                      setAvatarPreview(cloudinaryUrl);
                    } catch (err: any) {
                      alert("Upload failed: " + err.message);
                      setAvatarPreview("");
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                  disabled={uploadingAvatar || savingProfile}
                  id="avatar-upload-edit"
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="avatar-upload-edit"
                  style={{
                    display: "block",
                    padding: "14px",
                    backgroundColor: uploadingAvatar ? "#ccc" : currentTheme.colors.cardHover,
                    border: `2px dashed ${currentTheme.colors.primary}`,
                    borderRadius: "8px",
                    textAlign: "center",
                    cursor: uploadingAvatar || savingProfile ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: currentTheme.colors.text,
                  }}
                >
                  {uploadingAvatar ? "☁️ Uploading..." : "📤 Upload to Cloudinary"}
                </label>
                
                {/* Manual URL Input */}
                <div style={{ marginTop: "10px" }}>
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => {
                      setEditAvatarUrl(e.target.value);
                      setEditAvatar("");
                      setAvatarPreview(e.target.value);
                    }}
                    disabled={savingProfile}
                    placeholder="Or paste Cloudinary URL here"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: `1px solid ${currentTheme.colors.border}`,
                      backgroundColor: currentTheme.colors.cardHover,
                      color: currentTheme.colors.text,
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  disabled={savingProfile}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${currentTheme.colors.border}`,
                    backgroundColor: currentTheme.colors.card,
                    color: currentTheme.colors.text,
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: savingProfile ? "#ccc" : currentTheme.colors.primary,
                    color: "white",
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
              maxWidth: "550px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: currentTheme.colors.text, marginTop: 0, marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaClipboard /> Share Profile
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
                <FaClipboard style={{ display: "inline", marginRight: "6px" }} /> Copy
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
                icon={<FaTwitter />}
                label="Twitter"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my SuiTree profile!&url=${encodeURIComponent(getProfileUrl())}`, '_blank')}
                theme={currentTheme}
              />
              <SocialShareButton
                icon={<FaEnvelope />}
                label="Email"
                onClick={() => window.location.href = `mailto:?subject=My SuiTree Profile&body=Check out my profile: ${getProfileUrl()}`}
                theme={currentTheme}
              />
              <SocialShareButton
                icon={<FaWhatsapp />}
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
function NavItem({ icon, label, active, onClick, theme }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; theme: Theme }) {
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
      <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Card({ children, style, theme }: { children: React.ReactNode; style?: React.CSSProperties; theme?: Theme }) {
  const currentTheme = theme || getTheme(localStorage.getItem("suitree_theme") || "default");
  return (
    <div style={{
      backgroundColor: currentTheme.colors.card,
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

function LinkCard({ label, url, onEdit, onDelete, onAnalytics, deleting, theme }: { label: string; url: string; onEdit: () => void; onDelete: () => void; onAnalytics: () => void; deleting?: boolean; theme: Theme }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ fontSize: "24px", display: "flex", alignItems: "center", color: theme.colors.primary }}><FaLink /></div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: theme.colors.text }}>
            {label}
          </h4>
          <p style={{ fontSize: "13px", color: theme.colors.textSecondary, margin: "2px 0 0", wordBreak: "break-all" }}>
            {url}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <IconButton icon={<FaEdit />} onClick={onEdit} theme={theme} />
          <IconButton icon={<FaChartBar />} onClick={onAnalytics} theme={theme} />
          <IconButton 
            icon={deleting ? <FaClock /> : <FaTrash />}
            onClick={onDelete} 
            danger 
            disabled={deleting}
            theme={theme}
          />
        </div>
      </div>
    </Card>
  );
}

function IconButton({ icon, onClick, danger, disabled, theme }: { icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; theme: Theme }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.card,
        color: danger ? "#e53e3e" : theme.colors.text,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = danger ? "#fee" : theme.colors.cardHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = theme.colors.card;
        }
      }}
    >
      {icon}
    </button>
  );
}

function SocialShareButton({ icon, label, onClick, theme }: { icon: React.ReactNode; label: string; onClick: () => void; theme: Theme }) {
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
      <span style={{ fontSize: "24px", display: "flex", alignItems: "center" }}>{icon}</span>
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

// CSS for placeholder styling
const inputPlaceholderStyle = `
  input::placeholder, textarea::placeholder {
    opacity: 0.5;
  }
`;
