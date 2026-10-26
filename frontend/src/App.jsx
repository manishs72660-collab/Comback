import { useCallback, useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import Workspace from "./pages/Workspace";
import { request } from "./utils/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        let profile;
        try {
          profile = await request("/auth/me", {}, false);
        } catch {
          await request("/auth/refresh", { method: "POST" }, false);
          profile = await request("/auth/me", {}, false);
        }
        if (active) setUser(profile.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthMode(null);
  }, []);

  if (checkingSession) {
    return <div className="loading-screen"><span className="loading-wordmark">come back to yourself</span><div className="loader" /></div>;
  }
  if (user) return <Workspace key={user.id || user._id} initialUser={user} onLogout={logout} />;
  if (authMode) return <AuthPage initialMode={authMode} onBack={() => setAuthMode(null)} onAuth={setUser} />;
  return <LandingPage onAuth={setAuthMode} />;
}
