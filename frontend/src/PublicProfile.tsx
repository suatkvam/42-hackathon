import React, { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useParams, useNavigate } from "react-router-dom";
import { getWalrusImageUrl } from "./walrusService";
import { PACKAGE_ID, REGISTRY_ID } from "./constants";
import { getTheme, type Theme } from "./themes";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Kullanıcı profili yüklenmeden önce, kaydedilmiş temayı kullan
    const savedTheme = localStorage.getItem("suitree_theme");
    return getTheme(savedTheme || "default");
  });

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
            arguments: [
              REGISTRY_ID,
              username,
            ],
          },
          sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        });

        console.log("Transaction result:", tx);

        // Parse the returned profile ID
        if (tx.results && tx.results[0]?.returnValues) {
          const profileId = tx.results[0].returnValues[0][0];
          
          // Fetch the profile object
          const profileObj = await suiClient.getObject({
            id: profileId,
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
            // Profil sahibinin temasını uygula ama kaydetme
            setCurrentTheme(getTheme(themeName));
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: currentTheme.gradient,
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
        <button
          onClick={() => navigate("/profile")}
          style={{
            padding: "10px 25px",
            backgroundColor: "white",
            color: currentTheme.colors.primary,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.color = currentTheme.colors.primary;
          }}
        >
          My Profile
        </button>
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
          {loading ? (
            <div style={{ padding: "40px" }}>
              <p>Loading @{username}...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "40px" }}>
              <p style={{ fontSize: "48px", marginBottom: "20px" }}>😕</p>
              <h2>{error}</h2>
              <p style={{ opacity: 0.7, marginTop: "20px" }}>
                This user doesn't exist or hasn't created a profile yet.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  backgroundColor: "white",
                  color: currentTheme.colors.primary,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Go Home
              </button>
            </div>
          ) : profile ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
                <img
                  src={
                    profile.avatar?.startsWith("http")
                      ? profile.avatar
                      : getWalrusImageUrl(profile.avatar)
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
              <p style={{ opacity: 0.5, fontSize: "14px", marginTop: "-10px" }}>
                @{username}
              </p>
              <p style={{ opacity: 0.7, marginBottom: "25px" }}>{profile.bio}</p>
              <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "15px" }}>
                ✓ Verified on Sui Blockchain
              </div>

              {/* Links */}
              {profile.links && profile.links.length > 0 && profile.links.map((link: any, idx: number) => (
                <a
                  key={idx}
                  href={link.url || link.value?.[1]}
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.color = "#000";
                  }}
                >
                  {link.label || link.value?.[0]}
                </a>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
