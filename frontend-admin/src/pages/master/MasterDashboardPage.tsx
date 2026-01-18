import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import api from "@/lib/axios";
import {
  Building2,
  Package,
  Tags,
  Users,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from "lucide-react";

/* =====================
   TYPES
===================== */

interface DashboardStats {
  totalMalls: number;
  totalProducts: number;
  totalCategories: number;
  totalMallAdmins: number;
  activeProducts: number;
  lowStockProducts: number;
}

/* =====================
   PAGE
===================== */

const MasterDashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalMalls: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalMallAdmins: 0,
    activeProducts: 0,
    lowStockProducts: 0,
  });

  const [loading, setLoading] = useState(true);

  /* =====================
     FETCH DASHBOARD STATS
  ===================== */

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts/admin/dashboard/stats/");
      const data = res.data.data;

      setStats({
        totalMalls: data.total_malls,
        totalProducts: data.total_products,
        totalCategories: data.total_categories,
        totalMallAdmins: data.total_mall_admins,
        activeProducts: data.active_products,
        lowStockProducts: data.low_stock_products,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /* =====================
     LOADING STATE
  ===================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-paymall-primary" />
      </div>
    );
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <AdminLayout
      title="Master Dashboard"
      subtitle="Overview of all malls and products"
    >
      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Malls"
          value={stats.totalMalls}
          icon={Building2}
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
        />
        <StatsCard
          title="Categories"
          value={stats.totalCategories}
          icon={Tags}
        />
        <StatsCard
          title="Mall Admins"
          value={stats.totalMallAdmins}
          icon={Users}
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts}
          icon={TrendingUp}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          icon={ShoppingCart}
          className={
            stats.lowStockProducts > 0
              ? "border-l-4 border-amber-500"
              : ""
          }
        />
      </div>

      {/* ===== CONTENT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-gray-500 text-center py-8">
            No recent activity
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/admin/master/malls")}
              className="p-4 bg-paymall-primary/10 rounded-lg text-left hover:bg-paymall-primary/20 transition"
            >
              <Building2 className="h-6 w-6 text-paymall-primary mb-2" />
              <p className="font-medium">Add New Mall</p>
              <p className="text-xs text-gray-500">Onboard a new mall</p>
            </button>

            <button
              onClick={() => navigate("/admin/master/categories")}
              className="p-4 bg-paymall-primary/10 rounded-lg text-left hover:bg-paymall-primary/20 transition"
            >
              <Tags className="h-6 w-6 text-paymall-primary mb-2" />
              <p className="font-medium">Add Category</p>
              <p className="text-xs text-gray-500">Create global category</p>
            </button>

            <button
              onClick={() => navigate("/admin/master/mall-admins")}
              className="p-4 bg-paymall-primary/10 rounded-lg text-left hover:bg-paymall-primary/20 transition"
            >
              <Users className="h-6 w-6 text-paymall-primary mb-2" />
              <p className="font-medium">Assign Admin</p>
              <p className="text-xs text-gray-500">Add mall admin</p>
            </button>

            <button
              onClick={() => navigate("/admin/master/products")}
              className="p-4 bg-paymall-primary/10 rounded-lg text-left hover:bg-paymall-primary/20 transition"
            >
              <Package className="h-6 w-6 text-paymall-primary mb-2" />
              <p className="font-medium">View Products</p>
              <p className="text-xs text-gray-500">Browse all products</p>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MasterDashboardPage;
