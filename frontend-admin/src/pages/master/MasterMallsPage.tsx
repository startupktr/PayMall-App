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
import { Plus, Edit, Trash2, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/* =====================
   TYPES
===================== */

interface Mall {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

/* =====================
   PAGE
===================== */

const MasterMallsPage = () => {
  const { toast } = useToast();

  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMall, setEditingMall] = useState<Mall | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    contact_email: "",
    contact_phone: "",
    is_active: true,
  });

  /* =====================
     FETCH MALLS
  ===================== */

  const fetchMalls = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/malls/");
      setMalls(res.data.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch malls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMalls();
  }, []);

  /* =====================
     FORM HELPERS
  ===================== */

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      contact_email: "",
      contact_phone: "",
      is_active: true,
    });
    setEditingMall(null);
  };

  const openDialog = (mall?: Mall) => {
    if (mall) {
      setEditingMall(mall);
      setFormData({
        name: mall.name,
        address: mall.address || "",
        city: mall.city || "",
        state: mall.state || "",
        contact_email: mall.contact_email || "",
        contact_phone: mall.contact_phone || "",
        is_active: mall.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  /* =====================
     SUBMIT (CREATE / UPDATE)
  ===================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingMall) {
        await api.put(`/admin/malls/${editingMall.id}/`, formData);
        toast({ title: "Success", description: "Mall updated successfully" });
      } else {
        await api.post("/admin/malls/", formData);
        toast({ title: "Success", description: "Mall created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMalls();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save mall",
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
    if (!confirm("Are you sure you want to delete this mall?")) return;

    try {
      await api.delete(`/admin/malls/${id}/`);
      toast({ title: "Success", description: "Mall deleted successfully" });
      fetchMalls();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete mall",
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
      header: "Mall Name",
      render: (mall: Mall) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-paymall-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-paymall-primary" />
          </div>
          <div>
            <p className="font-medium">{mall.name}</p>
            <p className="text-sm text-gray-500">
              {mall.city || "-"}, {mall.state || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (mall: Mall) => (
        <div>
          <p className="text-sm">{mall.contact_email || "-"}</p>
          <p className="text-sm text-gray-500">{mall.contact_phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (mall: Mall) => (
        <Badge variant={mall.is_active ? "default" : "secondary"}>
          {mall.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (mall: Mall) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openDialog(mall)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => handleDelete(mall.id)}
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
      title="Malls Management"
      subtitle="Onboard and manage all malls"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-paymall-primary hover:bg-paymall-secondary"
              onClick={() => openDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Mall
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMall ? "Edit Mall" : "Add New Mall"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Mall Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                  />
                </div>
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
                  className="bg-paymall-primary"
                  disabled={formLoading}
                >
                  {formLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingMall ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={malls}
        loading={false}
        emptyMessage="No malls found. Add your first mall to get started."
      />
    </AdminLayout>
  );
};

export default MasterMallsPage;
