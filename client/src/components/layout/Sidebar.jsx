import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt as ReceiptIcon, 
  BarChart3, Settings, LogOut, Store, ChevronLeft, ChevronRight, Users, Clock, ShieldCheck, BookOpen, UserCog, Layers, FileWarning,
  TrendingUp, Percent, Calendar, DollarSign, Building, FileText, Cpu, FolderLock
} from 'lucide-react';
import ReceiptersLogo from '@/components/ReceiptersLogo';
import { api } from '@/api/apiClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

// roles: which roles can see this item. Omit = everyone can see it.
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'POS Terminal', path: '/pos' },
  {
    icon: Layers, label: 'Business Operations', path: '/operations', roles: ['admin'],
    children: [
      { icon: Package, label: 'Inventory', path: '/inventory' },
      { icon: ReceiptIcon, label: 'Transactions', path: '/transactions' },
      { icon: BarChart3, label: 'Reports', path: '/reports' },
      { icon: FileText, label: 'Advanced Reports', path: '/advanced-reports' },
      { icon: TrendingUp, label: 'Cash Flow', path: '/cash-flow' },
      { icon: ReceiptIcon, label: 'Expenses', path: '/expenses' },
      { icon: Percent, label: 'Promotions', path: '/promotions' },
    ]
  },
  {
    icon: Building, label: 'Suppliers & Orders', path: '/suppliers-group', roles: ['admin'],
    children: [
      { icon: Building, label: 'Suppliers', path: '/suppliers' },
      { icon: Package, label: 'Purchase Orders', path: '/purchase-orders' },
    ]
  },
  { icon: Users, label: 'Customers', path: '/customers' },
  {
    icon: UserCog, label: 'Team Management', path: '/staff', roles: ['admin'],
    children: [
      { icon: Users, label: 'Employees', path: '/employees' },
      { icon: Clock, label: 'My Shifts', path: '/my-shifts' },
      { icon: Calendar, label: 'Scheduling', path: '/employee-scheduling' },
      { icon: FileWarning, label: 'Shift Audits', path: '/shift-audits' },
      { icon: BarChart3, label: 'Performance', path: '/staff-performance' },
    ]
  },
  { isHeader: true, label: 'RECEIPTERS TECHNOLOGIES LTD', roles: ['admin'] },
  { icon: Cpu, label: 'Receipters Engine', path: '/admin/receipters-engine', roles: ['admin'], isReceipters: true },
  { icon: FolderLock, label: 'Receipters Vault Hub', path: '/admin/receipters-vault', roles: ['admin'], isReceipters: true },
  // Cashier-visible standalone items that are hidden from the admin group
  { icon: Clock, label: 'My Shifts', path: '/my-shifts', roles: ['user'] },
  { icon: ReceiptIcon, label: 'Transactions', path: '/transactions', roles: ['user'] },
  { icon: ShieldCheck, label: 'eTIMS', path: '/etims', roles: ['admin'] },
  { icon: BookOpen, label: 'Onboarding', path: '/onboarding' },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
];

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const { user } = useAuth();

  const userRole = user?.role || 'user';

  const toggleGroup = (path) => {
    setOpenGroups(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isGroupActive = (children) =>
    children.some(c => location.pathname === c.path);

  // Filter nav items by role
  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true; // No restriction = everyone
    return item.roles.includes(userRole);
  });

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col shadow-xl lg:shadow-none",
      collapsed ? "w-[84px]" : "w-[300px] sm:w-[320px]"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-base leading-tight truncate">SoftPOS</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Kenya</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              userRole === 'admin'
                ? "bg-amber-500/20 text-amber-300"
                : "bg-blue-500/20 text-blue-300"
            )}>
              {userRole === 'admin' ? '★ Admin' : '● Cashier'}
            </div>
            <span className="text-xs text-sidebar-foreground/60 truncate">{user?.full_name}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-2.5 overflow-y-auto">
        {visibleItems.map(({ icon: Icon, label, path, children, isHeader, isReceipters }) => {
          if (isHeader) {
            if (collapsed) return null;
            return <div key={label} className="px-4 pt-4 pb-1 text-[12px] font-bold text-blue-900 uppercase tracking-wider">{label}</div>;
          }
          const isActive = location.pathname === path;

          if (children) {
            const groupOpen = openGroups[path] ?? isGroupActive(children);
            const childActive = isGroupActive(children);

            return (
              <div key={path}>
                <button
                  onClick={() => toggleGroup(path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group relative shadow-sm",
                    childActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                      : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", childActive && "text-sidebar-primary-foreground")} />
                  {!collapsed && <span className="text-sm font-semibold truncate flex-1 text-left">{label}</span>}
                  {!collapsed && (
                    <ChevronRight className={cn("w-4 h-4 transition-transform", groupOpen && "rotate-90")} />
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {label}
                    </div>
                  )}
                </button>

                {groupOpen && !collapsed && (
                  <div className="mt-1.5 ml-4 space-y-1.5 border-l-2 border-sidebar-border pl-3">
                    {children.map(child => (
                      <Link
                        key={child.label}
                        to={child.path}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          location.pathname === child.path
                            ? "bg-sidebar-primary/20 text-sidebar-primary font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={path + label}
              to={path}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group relative shadow-sm",
                isReceipters ? (
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md font-medium"
                    : "bg-blue-50/80 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200"
                ) : (
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                    : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
                ),
                isReceipters && "text-[13px] px-3 py-2.5"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && !isReceipters && "text-sidebar-primary-foreground", isReceipters && !isActive && "text-blue-600")} />
              {!collapsed && (
                <span className="font-semibold truncate">{label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 space-y-1">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
        <button
          onClick={() => api.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/50 hover:bg-destructive/20 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}