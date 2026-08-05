import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PAYMENT_COLORS = {
  cash: 'hsl(174, 62%, 32%)',
  mpesa: 'hsl(150, 50%, 45%)',
  card: 'hsl(210, 60%, 50%)',
  split: 'hsl(38, 92%, 55%)'
};

export default function PaymentMethodsWidget({ paymentBreakdown }) {
  return (
    <div className="bg-card rounded-2xl border p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Payment Methods Today</h3>
      {paymentBreakdown.length > 0 ? (
        <>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#888'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {paymentBreakdown.map(entry => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAYMENT_COLORS[entry.name] }} />
                  <span className="capitalize font-medium">{entry.name === 'mpesa' ? 'M-Pesa' : entry.name}</span>
                </div>
                <span className="text-muted-foreground">KES {entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          No sales today yet
        </div>
      )}
    </div>
  );
}
