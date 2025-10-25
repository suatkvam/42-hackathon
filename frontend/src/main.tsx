import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfileView from "./ProfileView";

// 🧩 dApp Kit provider'larını import et
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css"; // stil dosyası
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🧠 Sui testnet config
const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io:443" },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/view" element={<ProfileView />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
