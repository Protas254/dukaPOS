import React from 'react';
import { User, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function POSTopBar({ currentUser, onLogout, onClearCart, cartLength }) {
  const { toast } = useToast();

  const handleLogout = () => {
    if (window.confirm('Log out of POS? This will end your current session.')) {
      onLogout();
    }
  };

  return (
    <header className="h-16 border-b bg-gradient-to-r from-card to-card/90 shadow-sm flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{currentUser?.full_name || currentUser?.email || 'Cashier'}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser?.role || 'Staff'}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border mx-2" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {cartLength > 0 && (
          <Button
            variant="outline"
            onClick={onClearCart}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            Clear Cart
          </Button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Log Out</span>
        </button>
      </div>
    </header>
  );
}