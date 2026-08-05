import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle, Receipt } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

export default function SalesSummaryCards({ 
  todayRevenue, 
  todayExpenseTotal, 
  netProfit, 
  todaySalesCount, 
  revenueTrend, 
  revenueTrendUp,
  avgTransaction,
  lowStockProductsCount 
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Today's Revenue"
        value={`KES ${todayRevenue.toLocaleString()}`}
        icon={DollarSign}
        trend={revenueTrend}
        trendUp={revenueTrendUp}
      />
      <StatCard
        title="Today's Expenses"
        value={`KES ${todayExpenseTotal.toLocaleString()}`}
        icon={Receipt}
        trend={`${Math.round((todayExpenseTotal / (todayRevenue || 1)) * 100)}% of revenue`}
        trendUp={false}
      />
      <StatCard
        title="Net Profit"
        value={`KES ${netProfit.toLocaleString()}`}
        icon={TrendingUp}
        trend={netProfit >= 0 ? 'Positive' : 'Negative'}
        trendUp={netProfit >= 0}
      />
      <StatCard
        title="Transactions"
        value={todaySalesCount}
        subtitle="today"
        icon={ShoppingCart}
      />
      <StatCard
        title="Avg. Transaction"
        value={`KES ${avgTransaction.toLocaleString()}`}
        icon={TrendingUp}
      />
      <StatCard
        title="Low Stock Items"
        value={lowStockProductsCount}
        subtitle={lowStockProductsCount > 0 ? 'Need restocking' : 'All good'}
        icon={lowStockProductsCount > 0 ? AlertTriangle : Package}
      />
    </div>
  );
}
