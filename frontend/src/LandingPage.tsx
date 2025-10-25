import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #c96d37, #1f1f1f)",
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
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {account && (
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "10px 25px",
                backgroundColor: "white",
                color: "#c96d37",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#ff8b3d";
                e.currentTarget.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "#c96d37";
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
