import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt, 
  BarChart3, Settings, LogOut, Store, ChevronLeft, ChevronRight, Users, Clock, ShieldCheck, BookOpen, UserCog
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'POS Terminal', path: '/pos' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: Receipt, label: 'Transactions', path: '/transactions' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Users, label: 'Customers', path: '/customers' },
  {
    icon: UserCog, label: 'Team Management', path: '/staff',
    children: [
      { icon: Users, label: 'Employees', path: '/employees' },
      { icon: Clock, label: 'My Shifts', path: '/my-shifts' },
    ]
  },
  { icon: ShieldCheck, label: 'eTIMS', path: '/etims' },
  { icon: BookOpen, label: 'Onboarding', path: '/onboarding' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [staffOpen, setStaffOpen] = useState(location.pathname === '/staff');

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-40 transition-all duration-300 flex flex-col",
      collapsed ? "w-[84px]" : "w-[270px]"
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

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-2.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path, children }) => {
          const isActive = location.pathname === path;

          if (children) {
            return (
              <div key={path}>
                {/* Parent toggle button */}
                <button
                  onClick={() => setStaffOpen(o => !o)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group relative shadow-sm",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                      : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
                  {!collapsed && <span className="text-sm font-semibold truncate flex-1 text-left">{label}</span>}
                  {!collapsed && (
                    <ChevronRight className={cn("w-4 h-4 transition-transform", staffOpen && "rotate-90")} />
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {label}
                    </div>
                  )}
                </button>

                {/* Children */}
                {staffOpen && !collapsed && (
                  <div className="mt-1.5 ml-4 space-y-1.5 border-l-2 border-sidebar-border pl-3">
                    {children.map(child => (
                      <Link
                        key={child.label}
                        to={child.path}
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
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group relative shadow-sm",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-md"
                  : "bg-sidebar-background text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:border-sidebar-accent"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{label}</span>
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
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/50 hover:bg-destructive/20 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}