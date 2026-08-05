import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PAYMENT_COLORS = {
  cash: '#10b981',
  mpesa: '#059669',
  card: '#3b82f6',
  split: '#f59e0b',
  bank_transfer: '#8b5cf6'
};

export default function RevenueAndPaymentCharts({ weeklyRevenue = [], paymentBreakdown = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Revenue - Last 7 Days Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-foreground">Revenue - Last 7 Days</h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRevenue} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                formatter={(val) => [`KES ${val.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#047857" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Payment Methods Today */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <h3 className="font-display font-bold text-sm text-foreground">Payment Methods Today</h3>
        {paymentBreakdown.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `KES ${val.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-1.5 pt-1">
              {paymentBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[item.name] || '#6b7280' }} />
                    <span className="capitalize">{item.name === 'mpesa' ? 'M-Pesa' : item.name}</span>
                  </div>
                  <span className="text-muted-foreground">KES {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm font-medium text-muted-foreground">
            No sales today yet
          </div>
        )}
      </div>
    </div>
  );
}
