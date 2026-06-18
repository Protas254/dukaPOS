import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 border border-border/50 hover:shadow-lg transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            "text-xs font-semibold",
            trendUp ? "text-emerald-600" : "text-destructive"
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs yesterday</span>
        </div>
      )}
    </div>
  );
}