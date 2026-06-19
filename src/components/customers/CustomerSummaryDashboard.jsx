import React from 'react';
import { TrendingUp, Gift, ShoppingBag, Users } from 'lucide-react';

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-display font-bold truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
      <SummaryCard
        icon={Users}
        label="Active Customers"
        value={activeCount.toLocaleString()}
        sub={`${customers.length} total`}
        color="bg-primary"
      />
      <SummaryCard
        icon={TrendingUp}
        label="Total Revenue"
        value={`KES ${totalSpending.toLocaleString()}`}
        sub={totalTx > 0 ? `avg KES ${Math.round(totalSpending / totalTx).toLocaleString()} / visit` : 'No transactions'}
        color="bg-emerald-500"
      />
      <SummaryCard
        icon={Gift}
        label="Points in Circulation"
        value={totalPoints.toLocaleString()}
        sub="across all customers"
        color="bg-accent"
      />
      <SummaryCard
        icon={ShoppingBag}
        label="Total Transactions"
        value={totalTx.toLocaleString()}
        sub={activeCount > 0 ? `avg ${(totalTx / activeCount).toFixed(1)} / customer` : ''}
        color="bg-blue-500"
      />
    </div>
  );
}