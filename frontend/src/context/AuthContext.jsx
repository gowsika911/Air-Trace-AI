import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, signup as apiSignup, fetchMe } from '../api.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'airtrace_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load (or token change), verify the token and fetch the user profile.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { user: profile } = await fetchMe(token);
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const { token: newToken, user: profile } = await apiLogin(email, password);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(profile);
    return profile;
  };

  const signup = async (name, email, password) => {
    const { token: newToken, user: profile } = await apiSignup(name, email, password);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
