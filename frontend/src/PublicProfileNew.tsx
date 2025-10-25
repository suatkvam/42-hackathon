import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useParams, useNavigate } from "react-router-dom";
import { getWalrusImageUrl } from "./walrusService";
import { PACKAGE_ID, REGISTRY_ID } from "./constants";
import { getTheme, type Theme } from "./themes";

export default function PublicProfileNew() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>(getTheme("default"));

  useEffect(() => {
    async function loadProfileByUsername() {
      if (!username) {
        setError("Username not provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        console.log("Looking up username:", username);

        // Call the Move function to get profile ID by username
        const tx = await suiClient.devInspectTransactionBlock({
          transactionBlock: {
            kind: "moveCall",
            target: `${PACKAGE_ID}::linktree::get_profile_id_by_username`,
            arguments: [REGISTRY_ID, username],
          } as any,
          sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        });

        console.log("Transaction result:", tx);

        // Parse the returned profile ID
        if (tx.results && tx.results[0]?.returnValues) {
          const profileId = tx.results[0].returnValues[0][0];
          
          // Fetch the profile object
          const profileObj = await suiClient.getObject({
            id: profileId as any,
            options: {
              showContent: true,
            },
          });

          if (profileObj.data?.content && 'fields' in profileObj.data.content) {
            const fields = profileObj.data.content.fields as any;
            const avatarId = fields.blob_id || fields.avatar_cid;
            const themeName = fields.theme || "default";

            setProfile({
              name: fields.name,
              bio: fields.bio,
              avatar: avatarId,
              links: fields.links || [],
              theme: themeName,
              owner: fields.owner,
            });
            setTheme(getTheme(themeName));
          } else {
            setError("Profile not found");
          }
        } else {
          setError(`User @${username} not found`);
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(`User @${username} not found`);
      } finally {
        setLoading(false);
      }
    }

    loadProfileByUsername();
  }, [username, suiClient]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: theme.gradient,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🌳</div>
          <p style={{ fontSize: "18px" }}>Loading @{username}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: theme.gradient,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px"
      }}>
        <div style={{ 
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "20px",
          padding: "60px 40px",
          maxWidth: "500px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>😕</div>
          <h2 style={{ fontSize: "28px", color: "#1a202c", margin: "0 0 15px" }}>
            {error}
          </h2>
          <p style={{ color: "#718096", fontSize: "16px", marginBottom: "30px" }}>
            This user doesn't exist or hasn't created a profile yet.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 32px",
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.gradient,
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Header Badge */}
      <div 
        onClick={() => navigate("/")}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          padding: "8px 16px",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "20px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "14px",
          fontWeight: "600",
          color: "#1a202c",
          zIndex: 1000,
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
      >
        🌳 SuiTree
      </div>

      {/* Profile Card */}
      <div style={{
        marginTop: "60px",
        width: "100%",
        maxWidth: "680px",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        {/* Avatar & Info */}
        <div style={{
          textAlign: "center",
          padding: "40px 20px 30px",
          animation: "fadeIn 0.6s ease-out"
        }}>
          {/* Avatar */}
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            margin: "0 auto 20px",
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "4px solid rgba(255,255,255,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px"
          }}>
            {profile?.avatar ? (
              <img
                src={profile.avatar.startsWith("data:") ? profile.avatar : getWalrusImageUrl(profile.avatar)}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = "👤";
                }}
              />
            ) : "👤"}
          </div>

          {/* Username */}
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: "bold",
            color: "white",
            margin: "0 0 10px",
            textShadow: "2px 2px 8px rgba(0,0,0,0.3)"
          }}>
            @{username}
          </h1>

          {/* Name */}
          {profile?.name && profile.name !== username && (
            <p style={{
              fontSize: "clamp(16px, 3vw, 20px)",
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 15px",
              fontWeight: "500"
            }}>
              {profile.name}
            </p>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p style={{
              fontSize: "clamp(14px, 2.5vw, 16px)",
              color: "rgba(255,255,255,0.85)",
              margin: "0",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: "1.6"
            }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "0 20px"
        }}>
          {profile?.links && profile.links.length > 0 ? (
            profile.links.map((link: any, index: number) => (
              <a
                key={index}
                href={link.value}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "20px 24px",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: "#1a202c",
                  fontWeight: "600",
                  fontSize: "16px",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                  border: "2px solid transparent",
                  animation: `slideUp 0.4s ease-out ${index * 0.1}s backwards`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = theme.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {link.key || `Link ${index + 1}`}
              </a>
            ))
          ) : (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "rgba(255,255,255,0.7)"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔗</div>
              <p style={{ fontSize: "16px", margin: 0 }}>
                No links yet
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          padding: "40px 20px 20px",
          color: "rgba(255,255,255,0.7)",
          fontSize: "14px"
        }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 28px",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              color: "white",
              border: "2px solid rgba(255,255,255,0.3)",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
              transition: "all 0.2s",
              marginBottom: "20px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            🌳 Create Your Own SuiTree
          </button>
          <p style={{ margin: "10px 0 0" }}>
            Powered by <strong>Sui Network</strong> & <strong>Walrus</strong>
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
