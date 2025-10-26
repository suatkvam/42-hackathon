import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getTheme, getThemeNames, type Theme } from "./themes";
import { FaLink, FaLock, FaPalette, FaBriefcase, FaTree } from "react-icons/fa";

export default function LandingPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: disconnect } = useDisconnectWallet();
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("suitree_theme");
    return getTheme(savedTheme || "default");
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <FaLink />,
      title: "One Link, Infinite Possibilities",
      description: "Share all your important links in one place"
    },
    {
      icon: <FaLock />,
      title: "Blockchain Secured",
      description: "Your data is stored on Sui blockchain"
    },
    {
      icon: <FaPalette />,
      title: "Customizable",
      description: "Personalize with themes and avatars"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

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
        fontFamily: "'Space Grotesk', sans-serif",
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
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FaTree /> 42Tree
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
              <FaPalette style={{ display: "inline", marginRight: "8px" }} /> Themes
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
              <FaTree style={{ display: "inline", marginRight: "8px" }} /> Dashboard
            </button>
          )}
          {account ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{
                padding: "10px 20px",
                backgroundColor: "white",
                color: "#333",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaBriefcase style={{ display: "inline", marginRight: "8px" }} /> Wallet: {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </div>
              <button
                onClick={() => disconnect()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "rgba(255, 59, 48, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.9)"}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <ConnectButton />
          )}
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
            and own your data with 42Tree - powered by Sui Network and Walrus Storage.
          </p>

          {/* Features Slider */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto 50px",
              overflow: "hidden",
            }}
          >
            <div
              ref={sliderRef}
              style={{
                display: "flex",
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: "transform 0.5s ease-in-out",
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    minWidth: "100%",
                    padding: "0 10px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      padding: "50px 40px",
                      borderRadius: "20px",
                      backdropFilter: "blur(10px)",
                      textAlign: "center",
                      minHeight: "300px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <div style={{ fontSize: "80px", marginBottom: "20px", color: "white" }}>{feature.icon}</div>
                    <h3 style={{ 
                      color: "white", 
                      marginBottom: "15px", 
                      fontSize: "28px",
                      fontWeight: "bold"
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{ 
                      color: "rgba(255, 255, 255, 0.8)", 
                      fontSize: "18px", 
                      margin: 0,
                      lineHeight: "1.6"
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Dots */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: currentSlide === index ? "30px" : "12px",
                    height: "12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: currentSlide === index 
                      ? "white" 
                      : "rgba(255, 255, 255, 0.4)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
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
