import { type AppRole } from "@/context/AuthContext";

export interface SidebarItem {
  label: string;
  path: string;
  roles: AppRole[];
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    roles: ["MASTER_ADMIN", "MALL_ADMIN"],
  },
  {
    label: "Products",
    path: "/admin/products",
    roles: ["MALL_ADMIN"],
  },
  {
    label: "Product Approval",
    path: "/admin/approvals",
    roles: ["MASTER_ADMIN"],
  },
  {
    label: "Categories",
    path: "/admin/categories",
    roles: ["MASTER_ADMIN"],
  },
  {
    label: "Orders",
    path: "/admin/orders",
    roles: ["MASTER_ADMIN", "MALL_ADMIN"],
  },
  {
    label: "Low Stock Alerts",
    path: "/admin/low-stock",
    roles: ["MALL_ADMIN"],
  },
];
