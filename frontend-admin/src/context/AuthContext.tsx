import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

export type AppRole = "MASTER_ADMIN" | "MALL_ADMIN";

interface AssignedMall {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  roles: AppRole[];
  assignedMalls: AssignedMall[];
  isMasterAdmin: boolean;
  isMallAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, password2: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [assignedMalls, setAssignedMalls] = useState<AssignedMall[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/admin/login");

  const clearAuth = () => {
    setUser(null);
    setRoles([]);
    setAssignedMalls([]);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/accounts/admin/me/");
      const data = res.data.data;

      setUser({ id: data.id, email: data.email });
      setRoles(data.roles || []);
      setAssignedMalls(data.assigned_malls || []);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await api.post("/accounts/admin/login/", { email, password });
      await fetchProfile();
      return true;
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
      clearAuth();
      return false;
    }
  };

  const signUp = async (email: string, password: string, password2: string) => {
    try {
      await api.post("/accounts/signup/management/", { email, password, password2 });
      return true;
    } catch (err: any) {
      toast({
        title: "SignUp failed",
        description: err.response?.data?.message || "Unable to create account",
        variant: "destructive",
      });
      return false;
    }
  };

  const signOut = async () => {
    try {
      await api.post("/accounts/logout/");
    } finally {
      clearAuth();
      window.location.href = "/admin/login";
    }
  };

  /**
   * ✅ ONLY bootstrap profile if cookies exist
   */
  useEffect(() => {
    if (!isAuthPage) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthPage, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        roles,
        assignedMalls,
        isMasterAdmin: roles.includes("MASTER_ADMIN"),
        isMallAdmin: roles.includes("MALL_ADMIN"),
        signIn,
        signUp,
        signOut,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
