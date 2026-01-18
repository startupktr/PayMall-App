import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Tags,
  Package,
  BarChart3,
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  masterOnly?: boolean;
  mallAdminOnly?: boolean;
}

const masterAdminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/master/dashboard' },
  { label: 'Malls', icon: Building2, path: '/admin/master/malls' },
  { label: 'Categories', icon: Tags, path: '/admin/master/categories' },
  { label: 'All Products', icon: Package, path: '/admin/master/products' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/master/analytics' },
  { label: 'Mall Admins', icon: Users, path: '/admin/master/mall-admins' },
];

const mallAdminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/mall/dashboard' },
  { label: 'Products', icon: Package, path: '/admin/mall/products' },
  { label: 'Categories', icon: Tags, path: '/admin/mall/categories' },
  { label: 'Bulk Upload', icon: Upload, path: '/admin/mall/bulk-upload' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/mall/analytics' },
];

export const AdminSidebar = () => {
  const { isMasterAdmin, isMallAdmin, signOut, user, assignedMalls } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isMasterAdmin ? masterAdminNavItems : mallAdminNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div
      className={cn(
        'h-screen bg-paymall-dark flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-paymall-primary rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">PayMall</h1>
              <p className="text-white/60 text-xs">
                {isMasterAdmin ? 'Master Admin' : 'Mall Admin'}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mall selector for mall admins */}
      {!collapsed && isMallAdmin && assignedMalls.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white/60 text-xs mb-1">Current Mall</p>
          <p className="text-white font-medium truncate">{assignedMalls[0]?.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-paymall-primary text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="mb-3 text-white/60 text-sm truncate">
            {user?.email}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};