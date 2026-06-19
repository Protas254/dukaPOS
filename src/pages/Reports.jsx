import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, TrendingUp, ShoppingCart, Users, Percent, User, Gift } from 'lucide-react';
import CashierReport from '@/components/reports/CashierReport';

const COLORS = ['hsl(174,62%,32%)', 'hsl(150,50%,45%)', 'hsl(210,60%,50%)', 'hsl(38,92%,55%)', 'hsl(0,72%,51%)'];

export default function Reports() {
  const [period, setPeriod] = useState('7days');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [reportTab, setReportTab] = useState('overview');

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === '7days') return subDays(now, 7);
    if (period === '30days') return subDays(now, 30);
    if (period === 'thisWeek') return startOfWeek(now, { weekStartsOn: 1 });
    if (period === 'thisMonth') return startOfMonth(now);
    return subDays(now, 7);
  }, [period]);

  const periodSales = sales.filter(s => {
    const saleDate = new Date(s.created_date);
    const matchesPeriod = saleDate >= periodStart;
    const matchesCashier = selectedCashier === 'all' || s.cashier_name === selectedCashier;
    return matchesPeriod && matchesCashier;
  });

  // Get unique cashiers from sales
  const cashiers = useMemo(() => {
    const unique = [...new Set(sales.map(s => s.cashier_name).filter(Boolean))];
    return unique.sort();
  }, [sales]);

  const totalRevenue = periodSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalTax = periodSales.reduce((sum, s) => sum + (s.tax_total || 0), 0);
  const totalDiscount = periodSales.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
  const avgTransaction = periodSales.length > 0 ? Math.round(totalRevenue / periodSales.length) : 0;

  const totalCOGS = periodSales.reduce((sum, sale) => {
    return sum + (sale.items || []).reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return itemSum + (product?.cost_price || 0) * item.quantity;
    }, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  const days = eachDayOfInterval({ start: periodStart, end: new Date() });
  const dailyData = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySales = periodSales.filter(s => {
      const d = new Date(s.created_date);
      return d >= dayStart && d < dayEnd;
    });
    return {
      date: format(day, 'MMM d'),
      revenue: daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      transactions: daySales.length,
      profit: daySales.reduce((sum, sale) => {
        const cost = (sale.items || []).reduce((c, item) => {
          const product = products.find(p => p.id === item.product_id);
          return c + (product?.cost_price || 0) * item.quantity;
        }, 0);
        return sum + (sale.total_amount || 0) - cost;
      }, 0)
    };
  });

  const paymentData = Object.entries(
    periodSales.reduce((acc, s) => {
      const method = s.payment_method === 'mpesa' ? 'M-Pesa' : (s.payment_method || 'other');
      acc[method] = (acc[method] || 0) + (s.total_amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const categoryData = {};
  periodSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      const cat = product?.category?.replace('_', ' ') || 'Other';
      categoryData[cat] = (categoryData[cat] || 0) + item.total;
    });
  });
  const categoryChartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  const productSalesMap = {};
  periodSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      if (!productSalesMap[item.product_name]) {
        productSalesMap[item.product_name] = { quantity: 0, revenue: 0 };
      }
      productSalesMap[item.product_name].quantity += item.quantity;
      productSalesMap[item.product_name].revenue += item.total;
    });
  });
  const topProductsList = Object.entries(productSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const hourSales = periodSales.filter(s => new Date(s.created_date).getHours() === h);
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      transactions: hourSales.length,
      revenue: hourSales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
    };
  });

  const totalPointsAwarded = periodSales.reduce((sum, s) => sum + (s.points_earned || 0), 0);
  const salesWithCustomers = periodSales.filter(s => s.customer_id).length;
  const customerRevenue = periodSales.reduce((sum, s) => s.customer_id ? sum + (s.total_amount || 0) : sum, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sales analytics & insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="bg-muted">
              <TabsTrigger value="7days" className="text-xs">7 Days</TabsTrigger>
              <TabsTrigger value="30days" className="text-xs">30 Days</TabsTrigger>
              <TabsTrigger value="thisWeek" className="text-xs">This Week</TabsTrigger>
              <TabsTrigger value="thisMonth" className="text-xs">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          {reportTab === 'overview' && (
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Cashiers</option>
              {cashiers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Report section tabs */}
      <Tabs value={reportTab} onValueChange={setReportTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cashiers">Cashier Performance</TabsTrigger>
        </TabsList>

        {/* ── Cashier Performance Tab ── */}
        <TabsContent value="cashiers" className="mt-6">
          <CashierReport periodSales={periodSales} />
        </TabsContent>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Transactions" value={periodSales.length} icon={ShoppingCart} />
            <StatCard title="Avg. Sale" value={`KES ${avgTransaction.toLocaleString()}`} icon={TrendingUp} />
            <StatCard title="Gross Profit" value={`KES ${grossProfit.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Profit Margin" value={`${profitMargin}%`} icon={Percent} />
          </div>

          {/* Revenue Trend */}
          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Revenue & Profit Trend</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(v) => `KES ${v.toLocaleString()}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border p-5">
              <h3 className="font-display font-semibold text-sm mb-4">Payment Methods</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `KES ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-5">
              <h3 className="font-display font-semibold text-sm mb-4">Sales by Category</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData.slice(0, 8)} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={v => `KES ${v.toLocaleString()}`} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hourly Distribution & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border p-5">
              <h3 className="font-display font-semibold text-sm mb-4">Peak Hours</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v, name) => name === 'revenue' ? `KES ${v.toLocaleString()}` : v} />
                    <Bar dataKey="transactions" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-5">
              <h3 className="font-display font-semibold text-sm mb-4">Top Selling Products</h3>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {topProductsList.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.quantity} units sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">KES {p.revenue.toLocaleString()}</span>
                  </div>
                ))}
                {topProductsList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No data for this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Period Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Total Revenue</p>
                <p className="font-display font-bold text-lg">KES {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Tax Collected</p>
                <p className="font-display font-bold text-lg">KES {totalTax.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Discounts Given</p>
                <p className="font-display font-bold text-lg">KES {totalDiscount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Net Revenue</p>
                <p className="font-display font-bold text-lg">KES {(totalRevenue - totalTax).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Loyalty Program Stats */}
          <div className="bg-card rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Loyalty Program Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Points Awarded</p>
                <p className="font-display font-bold text-lg">{totalPointsAwarded.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Customer Sales</p>
                <p className="font-display font-bold text-lg">{salesWithCustomers}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Customer Revenue</p>
                <p className="font-display font-bold text-lg">KES {customerRevenue.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">% Customer Sales</p>
                <p className="font-display font-bold text-lg">
                  {periodSales.length > 0 ? Math.round((salesWithCustomers / periodSales.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}