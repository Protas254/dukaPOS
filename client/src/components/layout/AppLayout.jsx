import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-30">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Drawer Sidebar */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        collapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"
      )}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b bg-card sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Receipters Logo" className="w-6 h-6 object-contain" />
            <span className="font-display font-bold text-lg">Receipters</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}