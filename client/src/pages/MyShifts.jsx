import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, startOfDay, subDays } from 'date-fns';
import { DollarSign, ShoppingCart, TrendingUp, Clock, Calendar, Award, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShiftPerformanceSummary from '@/components/shifts/ShiftPerformanceSummary';

export default function MyShifts() {
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.entities.Sale.list('-created_date', 500),
  });

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { api.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const cashierName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Cashier';
  const mySales = useMemo(() => sales.filter(s => s.cashier_name === cashierName), [sales, cashierName]);

  const today = startOfDay(new Date());
  const todaySales = mySales.filter(s => new Date(s.created_date) >= today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const yesterday = startOfDay(subDays(new Date(), 1));
  const yesterdaySales = mySales.filter(s => { const d = new Date(s.created_date); return d >= yesterday && d < today; });
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const revenueTrend = yesterdayRevenue > 0 ? `${((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0)}%` : 'N/A';
  const weekAgo = subDays(today, 7);
  const weekSales = mySales.filter(s => new Date(s.created_date) >= weekAgo);
  const weekRevenue = weekSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const paymentBreakdown = useMemo(() => {
    const breakdown = { cash: 0, mpesa: 0, card: 0, split: 0 };
    todaySales.forEach(s => { breakdown[s.payment_method] = (breakdown[s.payment_method] || 0) + (s.total_amount || 0); });
    return Object.entries(breakdown).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [todaySales]);

  const dailyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const daySales = mySales.filter(s => { const d = new Date(s.created_date); return d >= dayStart && d < dayEnd; });
    return { date: format(date, 'EEE, MMM d'), revenue: daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0), transactions: daySales.length };
  }), [mySales, today]);

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Receipt Number', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method', 'Customer', 'Points Earned'];
    const rows = mySales.map(sale => {
      const date = new Date(sale.created_date);
      return [format(date, 'yyyy-MM-dd'), format(date, 'HH:mm:ss'), sale.receipt_number, sale.items?.length || 0, sale.subtotal || 0, sale.tax_total || 0, sale.discount_amount || 0, sale.total_amount || 0, sale.payment_method, sale.customer_name || '', sale.points_earned || 0];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `shift_summary_${cashierName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-muted-foreground">Loading your shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">My Shifts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {cashierName}</p>
        </div>
        <button onClick={exportToCSV} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm">
          <Download className="w-4 h-4" /> Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={`KES ${todayRevenue.toLocaleString()}`} icon={DollarSign} trend={revenueTrend} trendUp={todayRevenue >= yesterdayRevenue} />
        <StatCard title="Transactions" value={todaySales.length} subtitle="today" icon={ShoppingCart} />
        <StatCard title="Avg. Sale" value={`KES ${todaySales.length > 0 ? Math.round(todayRevenue / todaySales.length).toLocaleString() : 0}`} icon={TrendingUp} />
        <StatCard title="This Week" value={`KES ${weekRevenue.toLocaleString()}`} subtitle="last 7 days" icon={Calendar} />
      </div>

      <Card><CardContent className="p-5">
        <h3 className="font-display font-semibold text-sm mb-4">Today's Payment Methods</h3>
        {paymentBreakdown.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentBreakdown.map(({ name, value }) => (
              <div key={name} className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground capitalize mb-1">{name === 'mpesa' ? 'M-Pesa' : name}</p>
                <p className="text-lg font-bold text-primary">KES {value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground text-center py-4">No sales today yet</p>}
      </CardContent></Card>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Last 7 Days</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <Card><CardContent className="p-5">
            <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Today's Transactions</h3>
            {todaySales.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {todaySales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div><p className="text-sm font-semibold">{sale.receipt_number}</p><p className="text-xs text-muted-foreground">{format(new Date(sale.created_date), 'h:mm a')} · {sale.items?.length || 0} items</p></div>
                    <div className="text-right"><p className="text-sm font-bold">KES {sale.total_amount?.toLocaleString()}</p><Badge variant="secondary" className="text-[10px] capitalize">{sale.payment_method === 'mpesa' ? 'M-Pesa' : sale.payment_method}</Badge></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No sales today yet</p>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="week" className="mt-4">
          <Card><CardContent className="p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Daily Performance - Last 7 Days</h3>
            <div className="space-y-3">
              {dailyData.map((day, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-sm font-semibold">{day.date}</p><p className="text-xs text-muted-foreground">{day.transactions} transactions</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">KES {day.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Avg: {day.transactions > 0 ? `KES ${Math.round(day.revenue / day.transactions).toLocaleString()}` : '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Card><CardContent className="p-5">
            <h3 className="font-display font-semibold text-sm mb-4">All Recent Transactions</h3>
            {mySales.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {mySales.slice(0, 10).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-semibold">{sale.receipt_number}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(sale.created_date), 'MMM d, h:mm a')} · {sale.items?.length || 0} items</p>
                      {sale.customer_name && <p className="text-xs text-primary mt-1">Customer: {sale.customer_name}</p>}
                    </div>
                    <div className="text-right"><p className="text-sm font-bold">KES {sale.total_amount?.toLocaleString()}</p><Badge variant="secondary" className="text-[10px] capitalize">{sale.payment_method === 'mpesa' ? 'M-Pesa' : sale.payment_method}</Badge></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Card><CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4"><Award className="w-4 h-4 text-primary" /><h3 className="font-display font-semibold text-sm">Performance Summary</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground mb-1">Total Sales</p><p className="text-xl font-bold">{mySales.length}</p></div>
          <div className="text-center p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground mb-1">Total Revenue</p><p className="text-xl font-bold text-primary">KES {mySales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString()}</p></div>
          <div className="text-center p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground mb-1">Average Sale</p><p className="text-xl font-bold">KES {mySales.length > 0 ? Math.round(mySales.reduce((sum, s) => sum + (s.total_amount || 0), 0) / mySales.length).toLocaleString() : 0}</p></div>
          <div className="text-center p-4 bg-muted/50 rounded-xl"><p className="text-xs text-muted-foreground mb-1">Customer Sales</p><p className="text-xl font-bold">{mySales.filter(s => s.customer_id).length}</p></div>
        </div>
      </CardContent></Card>

      <ShiftPerformanceSummary mySales={mySales} todaySales={todaySales} weekSales={weekSales} dailyData={dailyData} cashierName={cashierName} />

      <div className="flex justify-between pt-4 border-t">
        <Link to="/employees"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Employees</Button></Link>
        <Link to="/etims"><Button className="gap-2">Next: eTIMS <ArrowRight className="w-4 h-4" /></Button></Link>
      </div>
    </div>
  );
}