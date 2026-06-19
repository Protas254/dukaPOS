import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  DollarSign, ShoppingCart, TrendingUp, Package, 
  AlertTriangle, ArrowRight, ArrowLeft, User, Award, Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfDay, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAYMENT_COLORS = {
  cash: 'hsl(174, 62%, 32%)',
  mpesa: 'hsl(150, 50%, 45%)',
  card: 'hsl(210, 60%, 50%)',
  split: 'hsl(38, 92%, 55%)'
};

export default function Dashboard() {
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const today = startOfDay(new Date());
  const todaySales = sales.filter(s => new Date(s.created_date) >= today);
  const yesterdaySales = sales.filter(s => {
    const d = new Date(s.created_date);
    return d >= subDays(today, 1) && d < today;
  });

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const revenueTrend = yesterdayRevenue > 0 
    ? `${((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0)}%` 
    : 'N/A';

  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10));
  const criticalStockProducts = products.filter(p => p.stock_quantity <= Math.floor((p.low_stock_threshold || 10) * 0.5));

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySales = sales.filter(s => {
      const d = new Date(s.created_date);
      return d >= dayStart && d < dayEnd;
    });
    return {
      day: format(date, 'EEE'),
      revenue: daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      transactions: daySales.length
    };
  });

  // Payment method breakdown
  const paymentBreakdown = Object.entries(
    todaySales.reduce((acc, s) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + (s.total_amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Top selling products today
  const productSales = {};
  todaySales.forEach(s => {
    s.items?.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity;
      productSales[item.product_name].revenue += item.total;
    });
  });
  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentSales = sales.slice(0, 5);

  // Cashier performance - all time
  const cashierStats = useMemo(() => {
    const byCashier = {};
    sales.forEach(sale => {
      const cashier = sale.cashier_name || 'Unknown';
      if (!byCashier[cashier]) {
        byCashier[cashier] = { 
          name: cashier, 
          transactions: 0, 
          revenue: 0,
          avgSale: 0,
          cashSales: 0,
          mpesaSales: 0,
          cardSales: 0
        };
      }
      byCashier[cashier].transactions += 1;
      byCashier[cashier].revenue += (sale.total_amount || 0);
      if (sale.payment_method === 'cash') byCashier[cashier].cashSales += 1;
      if (sale.payment_method === 'mpesa') byCashier[cashier].mpesaSales += 1;
      if (sale.payment_method === 'card') byCashier[cashier].cardSales += 1;
    });
    return Object.values(byCashier)
      .map(c => ({ ...c, avgSale: c.transactions > 0 ? Math.round(c.revenue / c.transactions) : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalStockProducts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">{criticalStockProducts.length} critical stock items</span>
            </div>
          )}
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="w-4 h-4" />
            Open POS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`KES ${todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={revenueTrend}
          trendUp={todayRevenue >= yesterdayRevenue}
        />
        <StatCard
          title="Transactions"
          value={todaySales.length}
          subtitle="today"
          icon={ShoppingCart}
        />
        <StatCard
          title="Avg. Transaction"
          value={`KES ${todaySales.length > 0 ? Math.round(todayRevenue / todaySales.length).toLocaleString() : 0}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          subtitle={lowStockProducts.length > 0 ? 'Need restocking' : 'All good'}
          icon={lowStockProducts.length > 0 ? AlertTriangle : Package}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Revenue - Last 7 Days</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
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
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-card rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">Top Products Today</h3>
            <Link to="/inventory" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.quantity} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">KES {p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No sales today yet</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{sale.receipt_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.created_date), 'MMM d, h:mm a')} • {sale.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {sale.total_amount?.toLocaleString()}</p>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {sale.payment_method === 'mpesa' ? 'M-Pesa' : sale.payment_method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className={`rounded-2xl border-2 p-5 ${criticalStockProducts.length > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700'}`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${criticalStockProducts.length > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <AlertTriangle className={`w-5 h-5 ${criticalStockProducts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h3 className={`font-display font-bold text-base ${criticalStockProducts.length > 0 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {criticalStockProducts.length > 0 ? '🚨 Critical Stock Alert' : '⚠️ Low Stock Alert'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {criticalStockProducts.length > 0 && <span className="text-red-600 font-semibold">{criticalStockProducts.length} critical</span>}
                  {criticalStockProducts.length > 0 && lowStockProducts.length - criticalStockProducts.length > 0 && <span className="text-muted-foreground"> · </span>}
                  {lowStockProducts.length - criticalStockProducts.length > 0 && <span className="text-amber-600 font-semibold">{lowStockProducts.length - criticalStockProducts.length} low</span>}
                  <span className="text-muted-foreground"> — restock soon to avoid stockouts</span>
                </p>
              </div>
            </div>
            <Link to="/inventory" className="shrink-0 text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">
              Manage Inventory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Critical items first, then warning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...criticalStockProducts, ...lowStockProducts.filter(p => !criticalStockProducts.find(c => c.id === p.id))].map(p => {
              const threshold = p.low_stock_threshold || 10;
              const isCritical = p.stock_quantity <= Math.floor(threshold * 0.5);
              const isOutOfStock = p.stock_quantity <= 0;
              const pct = isOutOfStock ? 0 : Math.min(100, Math.round((p.stock_quantity / threshold) * 100));
              const barColor = isOutOfStock ? 'bg-red-600' : isCritical ? 'bg-red-500' : 'bg-amber-400';
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border ${
                    isOutOfStock ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' :
                    isCritical ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    'bg-white dark:bg-card border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCritical || isOutOfStock ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-200'}`}>
                        {isOutOfStock && '🚫 '}{p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Threshold: {threshold} {p.unit || 'units'}</p>
                    </div>
                    <Badge
                      className={`ml-2 shrink-0 text-xs font-bold ${
                        isOutOfStock ? 'bg-red-600 text-white' :
                        isCritical ? 'bg-red-100 text-red-700 border border-red-300' :
                        'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                      variant="outline"
                    >
                      {isOutOfStock ? 'OUT' : `${p.stock_quantity} left`}
                    </Badge>
                  </div>
                  {/* Stock level bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct}% of threshold remaining</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cashier Performance */}
      <div className="bg-card rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">Cashier Performance</h3>
          </div>
          <Link to="/reports" className="text-xs text-primary font-medium hover:underline">View detailed report</Link>
        </div>
        {cashierStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cashier</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Transactions</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total Revenue</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg Sale</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden sm:table-cell">Payment Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {cashierStats.map((c, i) => (
                  <tr key={c.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-3 font-semibold">{c.transactions}</td>
                    <td className="text-right py-3 px-3 font-semibold">KES {c.revenue.toLocaleString()}</td>
                    <td className="text-right py-3 px-3">KES {c.avgSale.toLocaleString()}</td>
                    <td className="text-right py-3 px-3 hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.cashSales > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Cash: {c.cashSales}
                          </Badge>
                        )}
                        {c.mpesaSales > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            M-Pesa: {c.mpesaSales}
                          </Badge>
                        )}
                        {c.cardSales > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Card: {c.cardSales}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/onboarding">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: Onboarding
          </Button>
        </Link>
        <Link to="/pos">
          <Button className="gap-2">
            Next: POS
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}