import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DataTable } from "@/components/DataTable";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  description?: string;
  image_url?: string;
  category?: { id: string; name: string };
  category_name: string | null;
}

interface Category {
  id: string;
  name: string;
}

/* =====================
   PAGE
===================== */

const MallProductsPage = () => {
  const { assignedMalls } = useAuth();
  const mallId = assignedMalls[0]?.id;

  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    description: "",
    price: "",
    marked_price: "",
    stock_quantity: "",
    category_id: "",
    image_url: "",
    is_available: true,
  });

  /* =====================
     FETCH DATA
  ===================== */

  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products/");
      setProducts(res.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await api.get("/admin/categories/");
    setCategories(res.data.data);
  };

  useEffect(() => {
    if (mallId) {
      fetchProducts();
      fetchCategories();
    }
  }, [mallId]);

  /* =====================
     CREATE / UPDATE
  ===================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        marked_price: Number(form.marked_price),
        stock_quantity: Number(form.stock_quantity),
        category_id: form.category_id || null,
      };

      if (editing) {
        await api.put(`/admin/mall/products/${editing.id}/`, payload);
        toast({ title: "Product updated" });
      } else {
        await api.post("/admin/mall/products/", payload);
        toast({ title: "Product created" });
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  /* =====================
     DELETE
  ===================== */

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    await api.delete(`/admin/mall/products/${id}/`);
    fetchProducts();
  };

  /* =====================
     DIALOG
  ===================== */

  const openDialog = (product?: Product) => {
    if (product) {
      setEditing(product);
      setForm({
        name: product.name,
        barcode: product.barcode,
        description: product.description || "",
        price: String(product.price),
        marked_price: String(product.marked_price),
        stock_quantity: String(product.stock_quantity),
        category_id: product.category?.id || "",
        image_url: product.image_url || "",
        is_available: product.is_available,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        barcode: "",
        description: "",
        price: "",
        marked_price: "",
        stock_quantity: "",
        category_id: "",
        image_url: "",
        is_available: true,
      });
    }

    setDialogOpen(true);
  };

  /* =====================
     TABLE COLUMNS
  ===================== */

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
            {p.image_url ? (
              <img src={p.image_url} className="h-full w-full object-cover rounded" />
            ) : (
              <Package className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-gray-500">{p.barcode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p: Product) => (
        <Badge variant="outline">{p.category_name || "None"}</Badge>
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
        <span className={p.stock_quantity < 10 ? "text-red-500" : ""}>
          {p.stock_quantity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: Product) => (
        <Badge variant={p.is_available ? "default" : "secondary"}>
          {p.is_available ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p: Product) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openDialog(p)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => handleDelete(p.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
    <AdminLayout
      title="Products"
      subtitle="Manage your mall inventory"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-paymall-primary hover:bg-paymall-secondary"
              onClick={() => openDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit" : "Add"} Product
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Barcode *</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Marked Price"
                  value={form.marked_price}
                  onChange={(e) =>
                    setForm({ ...form, marked_price: e.target.value })
                  }
                  required
                />
                <Input
                  type="number"
                  placeholder="Selling Price"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                />
              </div>

              <Input
                type="number"
                placeholder="Stock"
                value={form.stock_quantity}
                onChange={(e) =>
                  setForm({ ...form, stock_quantity: e.target.value })
                }
                required
              />

              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_available}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_available: v })
                  }
                />
                <Label>Available</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="bg-paymall-primary"
                  disabled={formLoading}
                >
                  {formLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={products}
        emptyMessage="No products yet"
      />
    </AdminLayout>
  );
};

export default MallProductsPage;
