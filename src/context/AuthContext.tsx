import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

export type AuthRole = "ADMIN" | "VENDOR" | "BUYER";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  vendorId?: number | null;
  isActive?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch session");
        const data: AuthUser = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Auth session fetch failed", error);
        setToken(null);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();

    return () => controller.abort();
  }, [token]);

  const setSession = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setSession,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
