import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DataTable } from "@/components/DataTable";
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
import { Plus, Edit, Trash2, Tags, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/* =====================
   TYPES
===================== */

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

/* =====================
   PAGE
===================== */

const MasterCategoriesPage = () => {
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  /* =====================
     FETCH CATEGORIES
  ===================== */

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories/");
      setCategories(res.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* =====================
     FORM HELPERS
  ===================== */

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      is_active: true,
    });
    setEditingCategory(null);
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        image_url: category.image_url || "",
        is_active: category.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* =====================
     CREATE / UPDATE
  ===================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      ...formData,
      description: formData.description || null,
      image_url: formData.image_url || null,
    };

    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}/`, payload);
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        await api.post("/admin/categories/", payload);
        toast({ title: "Success", description: "Category created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save category",
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
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/admin/categories/${id}/`);
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  /* =====================
     TABLE COLUMNS
  ===================== */

  const columns = [
    {
      key: "name",
      header: "Category Name",
      render: (c: Category) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-paymall-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
            {c.image_url ? (
              <img src={c.image_url} className="h-full w-full object-cover" />
            ) : (
              <Tags className="h-5 w-5 text-paymall-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{c.name}</p>
            <p className="text-sm text-gray-500 line-clamp-1">
              {c.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: Category) => (
        <Badge variant={c.is_active ? "default" : "secondary"}>
          {c.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (c: Category) => (
        <span className="text-sm text-gray-500">
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (c: Category) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openDialog(c)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => handleDelete(c.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* =====================
     RENDER
  ===================== */

  return (
    <AdminLayout
      title="Categories Management"
      subtitle="Manage global product categories"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-paymall-primary hover:bg-paymall-secondary"
              onClick={() => openDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_active: v })
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-paymall-primary"
                >
                  {formLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="No categories found. Add your first category."
      />
    </AdminLayout>
  );
};

export default MasterCategoriesPage;
