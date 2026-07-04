import React from 'react';
import { Users, TrendingUp, Gift, ShoppingBag } from 'lucide-react';

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-base font-display font-bold truncate leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function CustomerSummaryDashboard({ customers }) {
  const totalSpending = customers.reduce((s, c) => s + (c.total_spending || 0), 0);
  const totalPoints   = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0);
  const totalTx       = customers.reduce((s, c) => s + (c.total_transactions || 0), 0);
  const activeCount   = customers.filter(c => c.is_active !== false).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat icon={Users} label="Active Customers" value={activeCount.toLocaleString()} sub={`${customers.length} total`} />
      <Stat icon={TrendingUp} label="Total Revenue" value={`KES ${totalSpending.toLocaleString()}`} sub={totalTx > 0 ? `avg KES ${Math.round(totalSpending / totalTx).toLocaleString()} / visit` : undefined} />
      <Stat icon={Gift} label="Points in Circulation" value={totalPoints.toLocaleString()} sub="across all customers" />
      <Stat icon={ShoppingBag} label="Total Transactions" value={totalTx.toLocaleString()} sub={activeCount > 0 ? `avg ${(totalTx / activeCount).toFixed(1)} / customer` : undefined} />
    </div>
  );
}