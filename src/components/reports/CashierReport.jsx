import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays, startOfDay, format } from 'date-fns';
import { User, TrendingUp, ShoppingCart, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-muted/50 rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold font-display">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CashierReport({ periodSales }) {
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 1000),
  });

  // Build per-cashier stats from periodSales
  const cashierStats = useMemo(() => {
    const map = {};
    periodSales.forEach(sale => {
      const name = sale.cashier_name || 'Unknown';
      if (!map[name]) {
        map[name] = {
          name,
          transactions: 0,
          revenue: 0,
          discount: 0,
          cashCount: 0,
          mpesaCount: 0,
          cardCount: 0,
          // day-by-day for trend
          byDay: {},
        };
      }
      const c = map[name];
      c.transactions += 1;
      c.revenue += sale.total_amount || 0;
      c.discount += sale.discount_amount || 0;
      if (sale.payment_method === 'cash') c.cashCount += 1;
      if (sale.payment_method === 'mpesa') c.mpesaCount += 1;
      if (sale.payment_method === 'card') c.cardCount += 1;

      const day = format(new Date(sale.created_date), 'MMM d');
      c.byDay[day] = (c.byDay[day] || 0) + (sale.total_amount || 0);
    });

    return Object.values(map)
      .map(c => ({
        ...c,
        avgTicket: c.transactions > 0 ? Math.round(c.revenue / c.transactions) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  // Chart data: cashier names vs revenue
  const chartData = cashierStats.map(c => ({
    name: c.name.split(' ')[0], // first name to keep chart compact
    revenue: Math.round(c.revenue),
    transactions: c.transactions,
    avgTicket: c.avgTicket,
  }));

  if (cashierStats.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-10 text-center text-muted-foreground text-sm">
        No sales data found for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-card rounded-2xl border p-5">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Revenue by Cashier
        </h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v, name) => {
                  if (name === 'revenue') return [`KES ${v.toLocaleString()}`, 'Revenue'];
                  if (name === 'avgTicket') return [`KES ${v.toLocaleString()}`, 'Avg Ticket'];
                  return [v, name];
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cashier cards */}
      {cashierStats.map((c, i) => (
        <div key={c.name} className="bg-card rounded-2xl border p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-sm">{i + 1}</span>
              </div>
              <div>
                <p className="font-display font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.transactions} transactions in period</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-bold text-primary">KES {Math.round(c.revenue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">total revenue</p>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Transactions" value={c.transactions} />
            <MetricCard label="Total Sales" value={`KES ${Math.round(c.revenue).toLocaleString()}`} />
            <MetricCard label="Avg Ticket Size" value={`KES ${c.avgTicket.toLocaleString()}`} />
            <MetricCard label="Discounts Given" value={`KES ${Math.round(c.discount).toLocaleString()}`} />
          </div>

          {/* Payment split */}
          <div className="flex flex-wrap gap-2 text-xs">
            {c.cashCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                Cash: {c.cashCount}
              </span>
            )}
            {c.mpesaCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                M-Pesa: {c.mpesaCount}
              </span>
            )}
            {c.cardCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                Card: {c.cardCount}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Summary table */}
      <div className="bg-card rounded-2xl border p-5">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Comparative Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3 font-medium text-muted-foreground">Cashier</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Transactions</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Total Sales</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right">Avg Ticket</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right hidden md:table-cell">Discounts</th>
                <th className="py-2 px-3 font-medium text-muted-foreground text-right hidden md:table-cell">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalRev = cashierStats.reduce((s, c) => s + c.revenue, 0);
                return cashierStats.map((c, i) => (
                  <tr key={c.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                        {c.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">{c.transactions}</td>
                    <td className="py-3 px-3 text-right font-semibold">KES {Math.round(c.revenue).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">KES {c.avgTicket.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right hidden md:table-cell text-muted-foreground">KES {Math.round(c.discount).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {totalRev > 0 ? ((c.revenue / totalRev) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}