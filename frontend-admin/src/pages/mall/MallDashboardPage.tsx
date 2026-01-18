import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  total_products: number;
  active_products: number;
  low_stock: number;
}

const MallDashboardPage = () => {
  const { assignedMalls } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DASHBOARD STATS
  ========================= */

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/accounts/mall/dashboard/stats/");
        setStats(res.data.data.stats);
      } catch (error) {
        console.error("Failed to load mall dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /* =========================
     LOADING STATE
  ========================= */

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-paymall-primary" />
      </div>
    );
  }

  const mallName = assignedMalls[0]?.name || "Your Mall";

  return (
    <AdminLayout
      title="Mall Dashboard"
      subtitle={`Managing: ${mallName}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Products"
          value={stats.total_products}
          icon={Package}
        />

        <StatsCard
          title="Active Products"
          value={stats.active_products}
          icon={TrendingUp}
        />

        <StatsCard
          title="Low Stock"
          value={stats.low_stock}
          icon={ShoppingCart}
          className={
            stats.low_stock > 0
              ? "border-l-4 border-amber-500"
              : ""
          }
        />
      </div>
    </AdminLayout>
  );
};

export default MallDashboardPage;
