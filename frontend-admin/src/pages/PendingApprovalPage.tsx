import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Home, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const {
    user,
    isMasterAdmin,
    isMallAdmin,
    signOut,
    refreshProfile,
  } = useAuth();

  const [checking, setChecking] = useState(false);

  /* =========================
     AUTO REDIRECT IF ROLE ASSIGNED
  ========================= */

  useEffect(() => {
    if (isMasterAdmin) {
      navigate("/admin/master/dashboard", { replace: true });
      return;
    }

    if (isMallAdmin) {
      navigate("/admin/mall/dashboard", { replace: true });
      return;
    }
  }, [isMasterAdmin, isMallAdmin, navigate]);

  /* =========================
     MANUAL CHECK
  ========================= */

  const handleCheckAgain = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    signOut(); // already redirects
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* ICON */}
        <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pending Approval
        </h1>

        {/* DESCRIPTION */}
        <p className="text-gray-600 mb-2">
          Your account has been created but is not yet approved.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Logged in as <span className="font-medium">{user?.email}</span>
        </p>

        {/* INFO BOX */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            Please contact the Master Admin to assign your role.  
            Once approved, you’ll be redirected automatically.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 mb-4">
          <Button
            onClick={handleCheckAgain}
            disabled={checking}
            className="bg-paymall-primary hover:bg-paymall-secondary"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`}
            />
            {checking ? "Checking..." : "Check Again"}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleLogout} className="flex-1">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Customer App
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApprovalPage;
