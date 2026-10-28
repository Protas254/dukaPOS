import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

import DashboardControlHeader from '@/components/dashboard/DashboardControlHeader';
import LiveStatusCards from '@/components/dashboard/LiveStatusCards';
import FinancialKpiRow from '@/components/dashboard/FinancialKpiRow';
import DailyRevenueGoalSection from '@/components/dashboard/DailyRevenueGoalSection';
import RevenueAndPaymentCharts from '@/components/dashboard/RevenueAndPaymentCharts';
import CustomerFeedbackWidget from '@/components/dashboard/CustomerFeedbackWidget';
import ProductsAndTransactionsGrid from '@/components/dashboard/ProductsAndTransactionsGrid';
import CriticalStockBanner from '@/components/dashboard/CriticalStockBanner';
import CashierPerformanceTable from '@/components/dashboard/CashierPerformanceTable';
import ActionCenterAndAiBrief from '@/components/dashboard/ActionCenterAndAiBrief';
import InventoryIntelligenceCards from '@/components/dashboard/InventoryIntelligenceCards';
import ProfitLossAndLoyaltyGrid from '@/components/dashboard/ProfitLossAndLoyaltyGrid';
import ComplianceHealthBanner from '@/components/dashboard/ComplianceHealthBanner';
import SalesHeatmapAndGoals from '@/components/dashboard/SalesHeatmapAndGoals';
import WorkforceAndActivityFeed from '@/components/dashboard/WorkforceAndActivityFeed';
import AskYourBusinessWidget from '@/components/dashboard/AskYourBusinessWidget';

export default function Dashboard() {
  const [activeRange, setActiveRange] = useState('today');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Comprehensive analytics query from real backend
  const { data: analyticsData = {}, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics', activeRange, selectedBranch],
    queryFn: () => api.analytics.get({ range: activeRange, branch_id: selectedBranch }),
    refetchInterval: 10000, // Real-time refresh every 10s
  });

  // Branches list query
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.getAll(),
  });

  const {
    range_label = '',
    live_status = {},
    kpis = {},
    weekly_revenue = [],
    payment_breakdown = [],
    customer_feedback = {},
    top_products_today = [],
    recent_sales = [],
    low_stock_items = [],
    cashier_performance = [],
    inventory_intelligence = {},
    profit_loss = {},
    customer_loyalty = {},
    compliance_health = {},
    sales_heatmap = [],
    workforce_operations = {},
    activity_feed = []
  } = analyticsData;

  const criticalStockCount = kpis.critical_stock_count || low_stock_items.length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 1. Header & Controls Bar */}
      <DashboardControlHeader
        activeRange={activeRange}
        onRangeChange={setActiveRange}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        criticalStockCount={criticalStockCount}
        rangeLabel={range_label}
      />

      {/* 2. Live Status Bar (1h Sales, Active Shifts, Pending M-Pesa, Voids/Refunds) */}
      <LiveStatusCards liveStatus={live_status} />

      {/* 3. Financial KPI Cards (Revenue, Expenses, Net Profit, Transactions, Avg Tx, Low Stock) */}
      <FinancialKpiRow kpis={kpis} />

      {/* 4. Daily Revenue Goal Section & Today Sales Container */}
      <DailyRevenueGoalSection
        todayRevenue={kpis.today_revenue || 0}
        todaySales={recent_sales}
      />

      {/* 5. Revenue - Last 7 Days & Payment Methods Today Charts */}
      <RevenueAndPaymentCharts
        weeklyRevenue={weekly_revenue}
        paymentBreakdown={payment_breakdown}
      />

      {/* 6. Customer Checkout Feedback Card */}
      <CustomerFeedbackWidget customerFeedback={customer_feedback} />

      {/* 7. Top Products Today & Recent Transactions */}
      <ProductsAndTransactionsGrid
        topProducts={top_products_today}
        recentSales={recent_sales}
      />

      {/* 8. Critical Stock Alert Banner */}
      <CriticalStockBanner lowStockItems={low_stock_items} />

      {/* 9. Cashier Performance Table */}
      <CashierPerformanceTable cashierPerformance={cashier_performance} />

      {/* 10. Action Center & AI Daily Brief */}
      <ActionCenterAndAiBrief criticalStockCount={criticalStockCount} />

      {/* 11. Inventory Intelligence Cards */}
      <InventoryIntelligenceCards
        inventoryIntel={inventory_intelligence}
        lowStockItems={low_stock_items}
      />

      {/* 12. Profit & Loss + Cash Flow & Customer Loyalty */}
      <ProfitLossAndLoyaltyGrid
        profitLoss={profit_loss}
        customerLoyalty={customer_loyalty}
      />

      {/* 13. Compliance Health Banner (eTIMS) */}
      <ComplianceHealthBanner complianceHealth={compliance_health} />

      {/* 14. Hourly Sales Heatmap & Goals & Streaks */}
      <SalesHeatmapAndGoals
        salesHeatmap={sales_heatmap}
        kpis={kpis}
      />

      {/* 15. Workforce Operations & Activity Feed */}
      <WorkforceAndActivityFeed
        workforceOps={workforce_operations}
        activityFeed={activity_feed}
      />

      {/* 16. Ask Your Business AI Assistant Widget */}
      <AskYourBusinessWidget />
    </div>
  );
}