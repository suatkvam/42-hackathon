import React from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function App() {
  const account = useCurrentAccount();

  // Örnek profil bilgisi (ileride zincirden okuyacağız)
  const profile = {
    name: "Shanon Cary",
    bio: "Hard times, hard techno",
    avatar: "https://i.pravatar.cc/150?img=3",
    links: [
      { label: "Boilerroom set", url: "https://example.com/boiler" },
      { label: "DJ Set up", url: "https://example.com/dj" },
      { label: "Book me for a concert", url: "https://example.com/book" },
      { label: "Serato Concert", url: "https://example.com/serato" },
    ],
    socials: [
      { icon: "🐦", url: "https://twitter.com" },
      { icon: "📸", url: "https://instagram.com" },
      { icon: "🎧", url: "https://spotify.com" },
    ],
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #c96d37, #1f1f1f)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Poppins, sans-serif",
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
        <img
          src={profile.avatar}
          alt="avatar"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            marginBottom: "15px",
          }}
        />
        <h2>{profile.name}</h2>
        <p style={{ opacity: 0.7, marginBottom: "25px" }}>{profile.bio}</p>

        {/* Wallet bağlantısı */}
        <div style={{ marginBottom: "20px" }}>
          <ConnectButton />
          {account && (
            <p style={{ fontSize: "12px", marginTop: "5px", opacity: 0.6 }}>
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </p>
          )}
        </div>

        {/* Link butonları */}
        {profile.links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
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
            {link.label}
          </a>
        ))}

        {/* Sosyal medya ikonları */}
        <div style={{ marginTop: "25px", fontSize: "24px" }}>
          {profile.socials.map((s, idx) => (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              style={{
                margin: "0 10px",
                color: "white",
                textDecoration: "none",
                transition: "opacity 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
