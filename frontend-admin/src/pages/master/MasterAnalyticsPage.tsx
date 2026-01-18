import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import api from "@/lib/axios";
import {
  Building2,
  Package,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

/* =====================
   TYPES
===================== */

interface Mall {
  id: string;
  name: string;
}

interface AnalyticsData {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  inventory_value: number;
}

/* =====================
   PAGE
===================== */

const MasterAnalyticsPage = () => {
  const { toast } = useToast();

  const [malls, setMalls] = useState<Mall[]>([]);
  const [selectedMall, setSelectedMall] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  /* =====================
     FETCH MALLS
  ===================== */

  const fetchMalls = async () => {
    try {
      const res = await api.get("/admin/malls/");
      setMalls(res.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load malls",
        variant: "destructive",
      });
    }
  };

  /* =====================
     FETCH ANALYTICS
  ===================== */

  const fetchAnalytics = async (mallId?: string) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/analytics/", {
        params: mallId && mallId !== "all" ? { mall: mallId } : {},
      });

      setAnalytics(res.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     INITIAL LOAD
  ===================== */

  useEffect(() => {
    fetchMalls();
    fetchAnalytics();
  }, []);

  /* =====================
     MALL FILTER CHANGE
  ===================== */

  useEffect(() => {
    fetchAnalytics(selectedMall);
  }, [selectedMall]);

  /* =====================
     LOADING STATE
  ===================== */

  if (!analytics) {
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
      title="Analytics"
      subtitle="Platform-wide insights and inventory overview"
      actions={
        <Select value={selectedMall} onValueChange={setSelectedMall}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Malls" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Malls</SelectItem>
            {malls.map((mall) => (
              <SelectItem key={mall.id} value={mall.id}>
                {mall.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-paymall-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Products"
              value={analytics.total_products}
              icon={Package}
            />

            <StatsCard
              title="Active Products"
              value={analytics.active_products}
              icon={TrendingUp}
            />

            <StatsCard
              title="Low Stock Items"
              value={analytics.low_stock_products}
              icon={ShoppingCart}
              className={
                analytics.low_stock_products > 0
                  ? "border-l-4 border-amber-500"
                  : ""
              }
            />

            <StatsCard
              title="Inventory Value"
              value={`₹${analytics.inventory_value.toLocaleString()}`}
              icon={Building2}
            />
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Analytics Charts
            </h3>
            <div className="text-center py-12 text-gray-500">
              <p>Advanced analytics and trend charts will appear here.</p>
              <p className="text-sm mt-2">
                Sales, inventory turnover, and growth insights.
              </p>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default MasterAnalyticsPage;
