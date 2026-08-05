import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, ShoppingCart, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardHeader({ greeting, firstName, now, criticalStockCount }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {greeting}, <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5 font-medium">
          {format(now, 'EEEE, MMMM d, yyyy')} · {format(now, 'h:mm:ss aa')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {criticalStockCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">{criticalStockCount} critical stock items</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 bg-background text-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors border"
          >
            <FileText className="w-4 h-4" />
            Features
          </Link>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="w-4 h-4" />
            Open POS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
