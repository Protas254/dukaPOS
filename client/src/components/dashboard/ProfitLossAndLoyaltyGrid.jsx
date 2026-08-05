import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, Award } from 'lucide-react';

const TIER_COLORS = ['#d97706', '#059669', '#2563eb', '#7c3aed'];

export default function ProfitLossAndLoyaltyGrid({ profitLoss = {}, customerLoyalty = {} }) {
  const {
    revenue = 0,
    cogs = 0,
    gross_profit = 0,
    operating_expenses = 0,
    net_profit = 0,
    gross_margin_pct = 0,
    net_cash_balance = 0,
    vat_collected = 0
  } = profitLoss;

  const {
    total_customers = 0,
    loyalty_members = 0,
    top_customers = []
  } = customerLoyalty;

  const tierData = [
    { name: 'Bronze', value: Math.max(1, Math.round(loyalty_members * 0.5)) },
    { name: 'Silver', value: Math.max(1, Math.round(loyalty_members * 0.3)) },
    { name: 'Gold', value: Math.max(1, Math.round(loyalty_members * 0.2)) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Profit & Loss + Cash Flow */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Profit & Loss + Cash Flow</span>
        </h3>

        {/* Top Badges */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-muted/40 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-muted-foreground block">Gross Margin</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">{gross_margin_pct}%</span>
          </div>

          <div className="p-2 bg-muted/40 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-muted-foreground block">Net Cash</span>
            <span className="text-xs font-bold text-foreground block mt-0.5">KES {net_cash_balance.toLocaleString()}</span>
          </div>

          <div className="p-2 bg-muted/40 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-muted-foreground block">VAT Collected</span>
            <span className="text-xs font-bold text-foreground block mt-0.5">KES {vat_collected.toLocaleString()}</span>
          </div>
        </div>

        {/* Financial Table */}
        <div className="space-y-1.5 text-xs pt-1">
          <div className="flex justify-between py-1.5 border-b border-muted">
            <span className="font-semibold text-muted-foreground">Revenue</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">KES {revenue.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-muted">
            <span className="font-semibold text-muted-foreground">COGS</span>
            <span className="font-semibold text-red-600 dark:text-red-400">KES {cogs.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-muted bg-muted/20 px-2 rounded-lg">
            <span className="font-bold text-foreground">Gross Profit</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">KES {gross_profit.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-muted">
            <span className="font-semibold text-muted-foreground">Operating Expenses</span>
            <span className="font-semibold text-red-600 dark:text-red-400">KES {operating_expenses.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 border-t-2 border-emerald-200 dark:border-emerald-800 px-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
            <span className="font-bold text-emerald-900 dark:text-emerald-100">Net Profit</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">KES {net_profit.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic text-center pt-1">No expenses in range.</p>
      </div>

      {/* 2. Customer & Loyalty */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Customer & Loyalty</span>
        </h3>

        {/* Top Metric Badges */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-2 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block truncate">Customers</span>
            <span className="text-xs font-bold text-foreground block mt-0.5">{total_customers}</span>
          </div>

          <div className="p-2 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block truncate">New</span>
            <span className="text-xs font-bold text-foreground block mt-0.5">0</span>
          </div>

          <div className="p-2 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block truncate">Returning</span>
            <span className="text-xs font-bold text-foreground block mt-0.5">0</span>
          </div>

          <div className="p-2 bg-muted/40 rounded-xl">
            <span className="text-[10px] font-semibold text-muted-foreground block truncate">Members</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">{loyalty_members}</span>
          </div>
        </div>

        {/* Donut Chart & Top Customers Grid */}
        <div className="grid grid-cols-2 gap-3 items-center pt-1">
          {/* Donut Chart */}
          <div className="h-[120px] w-full flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-muted-foreground block mb-1">Tier Distribution</span>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tierData.map((entry, idx) => (
                    <Cell key={entry.name} fill={TIER_COLORS[idx % TIER_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers List */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Top Customers</span>
            {top_customers.length > 0 ? (
              top_customers.slice(0, 4).map((cust) => (
                <div key={cust.id || cust.name} className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground truncate max-w-[90px]">{cust.name}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    KES {Number(cust.total_spent || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground font-medium">No customer sales recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
