import { useCallback, useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import Workspace from "./pages/Workspace";
import { request } from "./utils/api";
import { clearAllOfflineData, getLastAuthenticatedOfflineProfile, saveTrustedOfflineProfile } from "./utils/offlineStore";

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      let profile;
      try {
        try {
          profile = await request("/auth/me", {}, false);
        } catch (error) {
          if (error.status === undefined) throw error;
          try {
            await request("/auth/refresh", { method: "POST" }, false);
            profile = await request("/auth/me", {}, false);
          } catch (authError) {
            if (authError.status !== undefined) {
              await clearAllOfflineData().catch((storageError) => console.error("Unable to clear cached data after authentication failed:", storageError));
            }
            throw authError;
          }
        }
        await saveTrustedOfflineProfile(profile.user).catch((error) => console.error("Unable to save the offline account profile:", error));
        if (active) setUser(profile.user);
      } catch (error) {
        if (error.status === undefined) {
          try {
            const cachedUser = await getLastAuthenticatedOfflineProfile();
            if (active && cachedUser) setUser(cachedUser);
            else if (active) setUser(null);
          } catch (storageError) {
            console.error("Unable to restore the offline account profile:", storageError);
            if (active) setUser(null);
          }
        } else {
          if (active) setUser(null);
        }
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
  const acceptAuthenticatedUser = useCallback((authenticatedUser) => {
    setUser(authenticatedUser);
    saveTrustedOfflineProfile(authenticatedUser).catch((error) => console.error("Unable to save the offline account profile:", error));
  }, []);

  if (checkingSession) {
    return <div className="loading-screen"><span className="loading-wordmark">come back to yourself</span><div className="loader" /></div>;
  }
  if (user) return <Workspace key={user.id || user._id} initialUser={user} onLogout={logout} />;
  if (authMode) return <AuthPage initialMode={authMode} onBack={() => setAuthMode(null)} onAuth={acceptAuthenticatedUser} />;
  return <LandingPage onAuth={setAuthMode} />;
}
