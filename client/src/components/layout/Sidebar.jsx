import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  {
    icon: LayoutDashboard, label: 'Dashboard', path: '/',
    children: [
      { icon: Building, label: 'Branches', path: '/branches', roles: ['admin'] },
    ]
  },
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
  // Cashier-visible standalone items
  { icon: Clock, label: 'My Shifts', path: '/my-shifts', roles: ['user'] },
  { icon: ReceiptIcon, label: 'Transactions', path: '/transactions', roles: ['user'] },
  { icon: ShieldCheck, label: 'eTIMS', path: '/etims', roles: ['admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
];

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({ '/': true });
  const { user } = useAuth();

  const userRole = user?.role || 'user';

  const toggleGroup = (path) => {
    setOpenGroups(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isGroupActive = (path, children) =>
    location.pathname === path || children.some(c => location.pathname === c.path);

  // Helper: check if an item/child is visible for the current role
  const isRoleAllowed = (item) => {
    if (!item.roles) return true;
    if (item.roles.includes(userRole)) return true;
    if (userRole === 'cashier' && item.roles.includes('user')) return true;
    return false;
  };

  // Filter nav items by role. Cashiers should see items marked for 'user'.
  const visibleItems = navItems.filter(isRoleAllowed);

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
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
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
        {visibleItems.map(({ icon: Icon, label, path, children }) => {
          const isActive = location.pathname === path;

          if (children) {
            const groupOpen = openGroups[path] ?? isGroupActive(path, children);
            const childActive = isGroupActive(path, children);

            return (
              <div key={path}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (path === '/') navigate('/');
                      toggleGroup(path);
                    }}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group relative shadow-sm text-left",
                      childActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                        : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", childActive && "text-sidebar-primary-foreground")} />
                    {!collapsed && <span className="text-sm font-semibold truncate flex-1">{label}</span>}
                    {!collapsed && (
                      <ChevronRight
                        className={cn("w-4 h-4 transition-transform ml-auto", groupOpen && "rotate-90")}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(path);
                        }}
                      />
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {label}
                      </div>
                    )}
                  </button>
                </div>

                {groupOpen && !collapsed && (
                  <div className="mt-1.5 ml-4 space-y-1.5 border-l-2 border-sidebar-border pl-3">
                    {children.filter(isRoleAllowed).map(child => (
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
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                  : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
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

        {/* ── Boxed Sub-Panel Card for RECEIPTERS TECHNOLOGIES LTD ── */}
        {userRole === 'admin' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 space-y-2">
            {!collapsed && (
              <p className="text-[11px] font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider px-1">
                RECEIPTERS TECHNOLOGIES LTD
              </p>
            )}
            <div className="space-y-1.5">
              <Link
                to="/admin/receipters-engine"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                  location.pathname === '/admin/receipters-engine'
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-900/40"
                )}
              >
                <Cpu className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Receipters Engine</span>}
              </Link>

              <Link
                to="/admin/receipters-vault"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150",
                  location.pathname === '/admin/receipters-vault'
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-900/40"
                )}
              >
                <FolderLock className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Receipters Vault Hub</span>}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 space-y-1 border-t border-sidebar-border pt-2">
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