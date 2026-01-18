import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DataTable } from "@/components/DataTable";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* =====================
   TYPES
===================== */

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  marked_price: number;
  discount_percentage: number;
  stock_quantity: number;
  is_available: boolean;
  image: string | null;
  category_name: string | null;
  mall_name: string | null;
}

interface Mall {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

/* =====================
   PAGE
===================== */

const MasterProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [mall, setMall] = useState("all");
  const [category, setCategory] = useState("all");

  /* =====================
     FETCH FILTERS
  ===================== */

  const fetchFilters = async () => {
    const [mallsRes, categoriesRes] = await Promise.all([
      api.get("/admin/malls/"),
      api.get("/admin/categories/"),
    ]);

    setMalls(mallsRes.data.data);
    setCategories(categoriesRes.data.data);
  };

  /* =====================
     FETCH PRODUCTS
  ===================== */

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/products/", {
        params: {
          search: search || undefined,
          mall: mall !== "all" ? mall : undefined,
          category: category !== "all" ? category : undefined,
        },
      });

      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, mall, category]);

  /* =====================
     TABLE COLUMNS
  ===================== */

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {p.image ? (
              <img src={p.image} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-gray-500">Barcode: {p.barcode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mall",
      header: "Mall",
      render: (p: Product) => (
        <span className="text-sm">{p.mall_name || "-"}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p: Product) => (
        <Badge variant="outline">{p.category_name || "Uncategorized"}</Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (p: Product) => (
        <div>
          <p className="font-medium">₹{p.price}</p>
          {p.discount_percentage > 0 && (
            <p className="text-sm text-gray-400 line-through">
              ₹{p.marked_price}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (p: Product) =>
        p.discount_percentage > 0 ? (
          <Badge className="bg-green-100 text-green-800">
            {p.discount_percentage}% OFF
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (p: Product) => (
        <span
          className={p.stock_quantity < 10 ? "text-red-500 font-medium" : ""}
        >
          {p.stock_quantity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: Product) => (
        <Badge variant={p.is_available ? "default" : "secondary"}>
          {p.is_available ? "Available" : "Unavailable"}
        </Badge>
      ),
    },
  ];

  /* =====================
     LOADING
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
    <AdminLayout title="All Products" subtitle="View products across all malls">
      <div className="bg-white rounded-xl shadow-soft p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Select value={mall} onValueChange={setMall}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Malls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Malls</SelectItem>
                {malls.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={false}
        emptyMessage="No products found matching your criteria."
      />
    </AdminLayout>
  );
};

export default MasterProductsPage;
