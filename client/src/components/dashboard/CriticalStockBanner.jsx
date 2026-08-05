import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function CriticalStockBanner({ lowStockItems = [] }) {
  if (!lowStockItems || lowStockItems.length === 0) return null;

  const criticalCount = lowStockItems.filter(
    (item) => item.stock_quantity <= Math.floor((item.low_stock_threshold || 10) * 0.5)
  ).length;

  const lowCount = lowStockItems.length - criticalCount;

  return (
    <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-red-900 dark:text-red-200">
              Critical Stock Alert
            </h3>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 font-medium">
              {criticalCount} critical • {lowCount} low — restock soon to avoid stockouts
            </p>
          </div>
        </div>

        <Link
          to="/inventory"
          className="text-xs font-bold text-blue-800 dark:text-blue-300 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Manage Inventory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lowStockItems.map((item) => {
          const threshold = item.low_stock_threshold || 10;
          const left = item.stock_quantity;
          const pct = Math.min(100, Math.round((left / (threshold || 1)) * 100));
          const isCritical = left <= Math.floor(threshold * 0.5);

          return (
            <div
              key={item.id || item.name}
              className="bg-white dark:bg-card border border-red-200 dark:border-red-900/40 rounded-xl p-3.5 space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Threshold: {threshold} {item.unit || 'piece'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold px-2 py-0.5 ${
                    isCritical
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {left} left
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium text-right">
                  {pct}% of threshold remaining
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
