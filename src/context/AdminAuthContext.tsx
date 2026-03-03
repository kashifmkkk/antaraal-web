import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchJson, apiUrl } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AdminLoginResponse = {
  token: string;
  admin: AdminUser;
};

type AdminAuthContextValue = {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const ADMIN_TOKEN_KEY = "skyway_admin_token";

type Props = {
  children: ReactNode;
};

export const AdminAuthProvider = ({ children }: Props) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const resolveSession = useCallback(async () => {
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchJson<AdminUser>("/api/admin/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdmin(data);
    } catch (error) {
      console.error("Failed to load admin session", error);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    resolveSession();
  }, [resolveSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetchJson<AdminLoginResponse>("/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
    setToken(response.token);
    setAdmin(response.admin);
  }, []);

  const logout = useCallback(async () => {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await fetch(apiUrl("/api/admin/auth/logout"), {
        method: "POST",
        headers,
      });
    } catch (error) {
      console.warn("Admin logout request failed", error);
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setToken(null);
      setAdmin(null);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      login,
      logout,
    }),
    [admin, token, loading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
