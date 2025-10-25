import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTheme, getThemeNames, type Theme } from "./themes";

export default function LandingPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("suitree_theme");
    return getTheme(savedTheme || "default");
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleThemeChange = (themeName: string, theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("suitree_theme", themeName);
    setShowThemeMenu(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: currentTheme.gradient,
        fontFamily: "Poppins, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <h1 style={{ 
          color: "white", 
          margin: 0, 
          fontSize: "clamp(20px, 5vw, 28px)", 
          fontWeight: "bold" 
        }}>
          🌳 SuiTree
        </h1>
        <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Theme Selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
                backdropFilter: "blur(10px)",
              }}
            >
              🎨 Themes
            </button>
            {showThemeMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  zIndex: 1000,
                  minWidth: "200px",
                }}
              >
                {getThemeNames().map((themeName) => {
                  const theme = getTheme(themeName);
                  return (
                    <button
                      key={themeName}
                      onClick={() => handleThemeChange(themeName, theme)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "5px",
                        backgroundColor: currentTheme.name === theme.name ? theme.colors.primary : "transparent",
                        color: currentTheme.name === theme.name ? "white" : "#333",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (currentTheme.name !== theme.name) {
                          e.currentTarget.style.backgroundColor = "#f0f0f0";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTheme.name !== theme.name) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {theme.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {account && (
            <button
              onClick={() => navigate("/dashboard")}
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
              🌳 Dashboard
            </button>
          )}
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          <h1
            style={{
              color: "white",
              fontSize: "clamp(32px, 8vw, 56px)",
              fontWeight: "bold",
              marginBottom: "20px",
              lineHeight: "1.2",
            }}
          >
            Your Decentralized Link-in-Bio
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "clamp(16px, 3vw, 20px)",
              marginBottom: "40px",
              lineHeight: "1.6",
            }}
          >
            Create your profile on the blockchain. Share your links, build your presence,
            and own your data with SuiTree - powered by Sui Network and Walrus Storage.
          </p>

          {/* Features */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "50px",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "25px",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔗</div>
              <h3 style={{ color: "white", marginBottom: "10px", fontSize: "18px" }}>
                One Link, Infinite Possibilities
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", margin: 0 }}>
                Share all your important links in one place
              </p>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "25px",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
              <h3 style={{ color: "white", marginBottom: "10px", fontSize: "18px" }}>
                Blockchain Secured
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", margin: 0 }}>
                Your data is stored on Sui blockchain
              </p>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "25px",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎨</div>
              <h3 style={{ color: "white", marginBottom: "10px", fontSize: "18px" }}>
                Customizable
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", margin: 0 }}>
                Personalize with themes and avatars
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <ConnectButton />
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", margin: 0 }}>
              Connect your Sui wallet to get started
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "20px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "14px",
        }}
      >
        Built on <strong>Sui Network</strong> • Powered by <strong>Walrus Storage</strong>
      </footer>
    </div>
  );
}
