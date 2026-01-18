import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "@/api/axios";
import { useCart } from "@/context/CartContext";
import { postLoginRedirect } from "@/lib/postLoginRedirect";

type AuthContextType = {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (
    phone_number: number,
    email: string,
    password: string,
    password2: string
  ) => Promise<any>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { mergeGuestCartIntoServer, fetchCart } = useCart();

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        setUser(null);
        return;
      }

      const me: any = await api.get("accounts/me/", { _silentAuth: true });
      setUser(me?.data ?? me);
    } catch {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    try {
      const me: any = await api.get("accounts/me/", { _silentAuth: true });
      setUser(me?.data ?? me);
    } catch { }
  };

  const login = async (email: string, password: string) => {
    const res: any = await api.post("accounts/login/", { email, password });

    await SecureStore.setItemAsync("accessToken", res.data.access);
    await SecureStore.setItemAsync("refreshToken", res.data.refresh);

    setUser(res.data.user);

    // ✅ Only merge if user came from Cart checkout intent
    try {
      const redirect = await postLoginRedirect.get();

      if (redirect?.type === "CART_CHECKOUT") {
        await mergeGuestCartIntoServer();
      }
    } catch { }

    return res.data.user;
  };

  const register = async (
    phone_number: number,
    email: string,
    password: string,
    password2: string
  ) => {
    const res: any = await api.post("accounts/signup/customer/", {
      phone_number,
      email,
      password,
      password2,
    });

    await SecureStore.setItemAsync("accessToken", res.data.access);
    await SecureStore.setItemAsync("refreshToken", res.data.refresh);

    setUser(res.data.user);

    // ✅ Only merge if coming from Cart checkout intent
    try {
      const redirect = await postLoginRedirect.get();

      if (redirect?.type === "CART_CHECKOUT") {
        await mergeGuestCartIntoServer();
        await fetchCart();
      }
    } catch { }

    return res.data.user;
  };

  const logout = async () => {
    const refresh = await SecureStore.getItemAsync("refreshToken");

    if (refresh) {
      try {
        await api.post("accounts/logout/", { refresh });
      } catch { }
    }

    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");

    setUser(null);

    // ✅ cart now becomes guest (CartContext will handle itself)
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
