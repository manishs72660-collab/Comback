import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";
import { AUTH_EVENT } from "../api/axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Shared so React StrictMode's double mount does not fire two refresh calls.
let bootstrap = null;

const loadUser = async () => {
  try {
    const { data } = await authApi.me();
    return data.user;
  } catch {
    try {
      await authApi.refresh(); // access token may just have expired
      const { data } = await authApi.me();
      return data.user;
    } catch {
      return null;
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bootstrap = bootstrap || loadUser().finally(() => (bootstrap = null));
    bootstrap.then((u) => {
      if (!active) return;
      setUser(u);
      setLoading(false);
    });

    const onLoggedOut = () => setUser(null);
    window.addEventListener(AUTH_EVENT, onLoggedOut);
    return () => {
      active = false;
      window.removeEventListener(AUTH_EVENT, onLoggedOut);
    };
  }, []);

  const login = useCallback(async (body) => {
    const { data } = await authApi.login(body);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (body) => {
    const { data } = await authApi.register(body);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // cookies are cleared client-side state anyway
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
