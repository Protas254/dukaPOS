import React from 'react';
import { Award } from 'lucide-react';

export default function TopCashierWidget({ topCashierToday }) {
  if (!topCashierToday) {
    return (
      <div className="bg-card rounded-2xl border p-5 flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No sales data for today yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl border-2 border-primary/20 p-5 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-sm">Top Performer Today</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
          {topCashierToday.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-display font-bold">{topCashierToday.name}</p>
          <p className="text-sm text-muted-foreground">
            {topCashierToday.transactions} transaction{topCashierToday.transactions !== 1 ? 's' : ''} today
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-xl font-display font-bold text-primary">
            KES {topCashierToday.revenue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
