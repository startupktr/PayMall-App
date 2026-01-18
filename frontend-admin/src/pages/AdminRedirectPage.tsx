import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRedirectPage = () => {
  const {
    user,
    loading,
    isMasterAdmin,
    isMallAdmin,
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // ❌ Not logged in
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }

    // ✅ Role-based redirect
    if (isMasterAdmin) {
      navigate("/admin/master/dashboard", { replace: true });
      return;
    }

    if (isMallAdmin) {
      navigate("/admin/mall/dashboard", { replace: true });
      return;
    }

    // ⏳ Logged in but no role assigned yet
    navigate("/admin/pending", { replace: true });
  }, [loading, user, isMasterAdmin, isMallAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-paymall-primary mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default AdminRedirectPage;
