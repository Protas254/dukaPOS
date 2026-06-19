import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, ShoppingCart } from 'lucide-react';

export default function CashierComparisonChart({ periodSales }) {
  // Build comparison data per cashier
  const cashierData = React.useMemo(() => {
    const map = {};
    periodSales.forEach(sale => {
      const name = sale.cashier_name || 'Unknown';
      if (!map[name]) {
        map[name] = {
          name: name.split(' ')[0], // Use first name for compact display
          fullName: name,
          revenue: 0,
          transactions: 0,
        };
      }
      map[name].revenue += sale.total_amount || 0;
      map[name].transactions += 1;
    });

    return Object.values(map)
      .map(c => ({
        ...c,
        revenue: Math.round(c.revenue),
        avgTicket: c.transactions > 0 ? Math.round(c.revenue / c.transactions) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  if (cashierData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-10 text-center text-muted-foreground text-sm">
        No sales data found for the selected period.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">Sales vs Transactions by Cashier</h3>
          <p className="text-xs text-muted-foreground">Comparing revenue and transaction counts</p>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashierData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
              interval={0}
              angle={-10}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }} 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `KES ${value/1000}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{ 
                background: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }}
              formatter={(value, name) => {
                if (name === 'Revenue') return [`KES ${value.toLocaleString()}`, 'Revenue'];
                if (name === 'Transactions') return [value, 'Transactions'];
                if (name === 'Avg Ticket') return [`KES ${value.toLocaleString()}`, 'Avg Ticket'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              name="Revenue" 
              fill="hsl(var(--primary))" 
              radius={[6, 6, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="transactions" 
              name="Transactions" 
              fill="hsl(var(--accent))" 
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
        {cashierData.slice(0, 4).map((c, i) => (
          <div key={c.fullName} className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{c.name}</p>
            <p className="text-sm font-bold text-primary">KES {c.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{c.transactions} sales</p>
          </div>
        ))}
      </div>
    </div>
  );
}