import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api/axios";

type AuthContextType = {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: number, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* 🔁 RESTORE SESSION */
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      const res = await api.get("accounts/me/");
      setUser(res.data);
    } catch {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    } finally {
      setLoading(false);
    }
  };

  /* 🔐 LOGIN */
  const login = async (email: string, password: string) => {
    const res = await api.post("accounts/login/", { email, password });

    await SecureStore.setItemAsync("accessToken", res.data.access);
    await SecureStore.setItemAsync("refreshToken", res.data.refresh);
    setUser(res.data.user);
  };

  /* 🧾 REGISTER */
  const register = async (username: number, email: string, password: string, password2: string) => {
    const res = await api.post("accounts/register/", { username, email, password, password2 });

    await SecureStore.setItemAsync("accessToken", res.data.access);
    await SecureStore.setItemAsync("refreshToken", res.data.refresh);
    setUser(res.data.user);
  };

  /* 🚪 LOGOUT (SILENT) */
  const logout = async () => {
    const refresh = await SecureStore.getItemAsync("refreshToken");
    if (refresh) {
      try {
        await api.post("accounts/logout/", { refresh });
      } catch {}
    }

    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
