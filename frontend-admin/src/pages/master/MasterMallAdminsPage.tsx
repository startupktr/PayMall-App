import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DataTable } from "@/components/DataTable";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Trash2,
  Users,
  Building2,
  Loader2,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/* =====================
   TYPES
===================== */

interface MallAdmin {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  mall: {
    id: string;
    name: string;
  };
  created_at: string;
}

interface Mall {
  id: string;
  name: string;
}

interface StaffUser {
  id: string;
  email: string;
  full_name: string | null;
}

/* =====================
   PAGE
===================== */

const MasterMallAdminsPage = () => {
  const { toast } = useToast();

  const [mallAdmins, setMallAdmins] = useState<MallAdmin[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    user_id: "",
    mall_id: "",
  });

  /* =====================
     FETCH DATA
  ===================== */

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [adminsRes, mallsRes, usersRes] = await Promise.all([
        api.get("/admin/mall-admins/"),
        api.get("/admin/malls/"),
        api.get("/admin/users/pending-staff/"),
      ]);

      setMallAdmins(adminsRes.data.data);
      setMalls(mallsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load mall admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* =====================
     ASSIGN MALL ADMIN
  ===================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.post("/admin/mall-admins/", formData);

      toast({
        title: "Success",
        description: "Mall admin assigned successfully",
      });

      setIsDialogOpen(false);
      setFormData({ user_id: "", mall_id: "" });
      fetchAll();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to assign mall admin",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  /* =====================
     REMOVE MALL ADMIN
  ===================== */

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this mall admin assignment?")) return;

    try {
      await api.delete(`/admin/mall-admins/${id}/`);

      toast({
        title: "Success",
        description: "Mall admin removed successfully",
      });

      fetchAll();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove mall admin",
        variant: "destructive",
      });
    }
  };

  /* =====================
     TABLE COLUMNS
  ===================== */

  const columns = [
    {
      key: "user",
      header: "User",
      render: (admin: MallAdmin) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-paymall-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-paymall-primary" />
          </div>
          <div>
            <p className="font-medium">
              {admin.user.full_name || "—"}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {admin.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "mall",
      header: "Assigned Mall",
      render: (admin: MallAdmin) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>{admin.mall.name}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: () => <Badge>Mall Admin</Badge>,
    },
    {
      key: "created_at",
      header: "Assigned On",
      render: (admin: MallAdmin) => (
        <span className="text-sm text-gray-500">
          {new Date(admin.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (admin: MallAdmin) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500"
          onClick={() => handleDelete(admin.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
      title="Mall Admins"
      subtitle="Manage mall administrator assignments"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-paymall-primary hover:bg-paymall-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Assign Mall Admin
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Mall Admin</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>User *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, user_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mall *</Label>
                <Select
                  value={formData.mall_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, mall_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mall" />
                  </SelectTrigger>
                  <SelectContent>
                    {malls.map((mall) => (
                      <SelectItem key={mall.id} value={mall.id}>
                        {mall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={formLoading || !formData.user_id || !formData.mall_id}
                >
                  {formLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Assign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable
        columns={columns}
        data={mallAdmins}
        loading={false}
        emptyMessage="No mall admins assigned yet."
      />
    </AdminLayout>
  );
};

export default MasterMallAdminsPage;
