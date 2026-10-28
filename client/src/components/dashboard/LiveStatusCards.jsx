import React from 'react';
import { Wifi, Users, Smartphone, Ban } from 'lucide-react';

export default function LiveStatusCards({ liveStatus = {} }) {
  const {
    live_sales_count = 0,
    live_sales_revenue = 0,
    active_shifts_count = 0,
    active_cashiers = [],
    pending_mpesa_count = 0,
    void_count = 0,
    refund_count = 0
  } = liveStatus;

  const cashiersText = active_cashiers.length > 0 ? active_cashiers.join(', ') : 'No active cashiers';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Live Sales (1h) */}
      <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 relative">
          <Wifi className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-card" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Live Sales (1h)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{live_sales_count}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">KES {live_sales_revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* 2. Active Shifts */}
      <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Shifts</span>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{active_shifts_count}</p>
          <p className="text-xs text-slate-700 dark:text-slate-200 truncate font-semibold" title={cashiersText}>{cashiersText}</p>
        </div>
      </div>

      {/* 3. Pending M-Pesa */}
      <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pending M-Pesa</span>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{pending_mpesa_count}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {pending_mpesa_count === 0 ? 'All settled' : `${pending_mpesa_count} pending`}
          </p>
        </div>
      </div>

      {/* 4. Voids / Refunds */}
      <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
          <Ban className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Voids / Refunds</span>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{void_count + refund_count}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{void_count} void • {refund_count} refund</p>
        </div>
      </div>
    </div>
  );
}
