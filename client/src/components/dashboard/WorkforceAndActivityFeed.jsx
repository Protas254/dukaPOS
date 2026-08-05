import React from 'react';
import { Users, Activity, ShoppingCart, UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function WorkforceAndActivityFeed({ workforceOps = {}, activityFeed = [] }) {
  const {
    on_shift_count = 0,
    total_labor_hours = 0,
    currently_clocked_in = []
  } = workforceOps;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Workforce Operations */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-bold text-sm text-foreground">Workforce Operations</h3>
          </div>
          <Link to="/staff" className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
            <span>Manage</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block">On Shift</span>
            <p className="text-base font-bold text-foreground mt-0.5">{on_shift_count}</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block">Labor Hrs</span>
            <p className="text-base font-bold text-foreground mt-0.5">{total_labor_hours}</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block">Labor % Rev</span>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">0%</p>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block">Unstaffed</span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">1</p>
          </div>
        </div>

        {/* Revenue per Labor Hour */}
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Revenue per Labor Hour</span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">KES 0</span>
        </div>

        {/* Currently Clocked In */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Currently Clocked In</span>
          {currently_clocked_in.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currently_clocked_in.map((item) => (
                <div
                  key={item.cashier_name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 rounded-xl text-xs font-semibold"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {item.cashier_name.charAt(0).toUpperCase()}
                  </span>
                  <span>{item.cashier_name}</span>
                  <span className="text-muted-foreground font-normal">{item.hours_on_shift}h</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">No cashiers currently clocked in</p>
          )}
        </div>
      </div>

      {/* 2. Activity Feed */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h3 className="font-display font-bold text-sm text-foreground">Activity Feed</h3>
        </div>

        {/* Scrollable list */}
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {activityFeed.length > 0 ? (
            activityFeed.map((act, idx) => {
              const actTime = act.time ? new Date(act.time) : new Date();

              return (
                <div key={idx} className="flex items-start gap-3 text-xs border-b last:border-0 border-emerald-100/50 dark:border-emerald-900/30 pb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mt-0.5">
                    {act.type === 'sale' ? <ShoppingCart className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground truncate">{act.title}</p>
                      {act.amount && (
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          KES {Number(act.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {act.cashier || act.performed_by} • {format(actTime, 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
