import React from 'react';
import { DollarSign, Receipt, TrendingUp, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinancialKpiRow({ kpis = {} }) {
  const {
    today_revenue = 0,
    yesterday_revenue = 0,
    today_expenses = 0,
    net_profit = 0,
    transactions_count = 0,
    avg_transaction = 0,
    low_stock_count = 0
  } = kpis;

  const revDiffPct = yesterday_revenue > 0
    ? (((today_revenue - yesterday_revenue) / yesterday_revenue) * 100).toFixed(0)
    : 'N/A';

  const expPctRev = today_revenue > 0
    ? Math.round((today_expenses / today_revenue) * 100)
    : 0;

  return (
    <div className="space-y-3.5">
      {/* 5 Main Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Today's Revenue */}
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Today's Revenue</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-2">
            KES {today_revenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <span>↑ {revDiffPct}%</span>
            <span className="text-muted-foreground font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Today's Expenses</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-2">
            KES {today_expenses.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <span>↓ {expPctRev}% of revenue</span>
            <span className="text-muted-foreground font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Net Profit</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-2">
            KES {net_profit.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <span>↑ {net_profit >= 0 ? 'Positive' : 'Negative'}</span>
            <span className="text-muted-foreground font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Transactions</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-2">
            {transactions_count}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">today</p>
        </div>

        {/* Avg. Transaction */}
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Avg. Transaction</span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-display font-bold text-foreground mt-2">
            KES {avg_transaction.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Low Stock Items Card */}
      <div className="w-full sm:w-64">
        <Link to="/inventory">
          <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3.5 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Low Stock Items</span>
              <p className="text-xl font-display font-bold text-foreground mt-0.5">{low_stock_count}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {low_stock_count > 0 ? 'Need restocking' : 'All good'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              {low_stock_count > 0 ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Package className="w-5 h-5 text-teal-600" />}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
