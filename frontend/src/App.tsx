import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ProfilePage from "./ProfilePage";
import ProfileDashboard from "./ProfileDashboard";
import PublicProfileNew from "./PublicProfileNew";
import VaultManager from "./VaultManager";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ProfileDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vault" element={<VaultManager />} />
        <Route path="/:username" element={<PublicProfileNew />} />
      </Routes>
    </BrowserRouter>
  );
}
