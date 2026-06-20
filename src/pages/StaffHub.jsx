import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, formatDuration, intervalToDuration, subDays, startOfDay } from 'date-fns';
import {
  Users, Clock, DollarSign, ShoppingCart, TrendingUp, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, Search, Award, Calendar, Download, Star, Pencil, Check, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import ShiftPerformanceSummary from '@/components/shifts/ShiftPerformanceSummary';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatBox({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-3 text-center border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-transparent'}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-display font-bold text-base ${highlight ? 'text-primary' : ''}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function computeRating(emp, allEmployees) {
  if (allEmployees.length === 0) return 0;
  const maxRevenue = Math.max(...allEmployees.map(e => e.totalRevenue), 1);
  const maxTx = Math.max(...allEmployees.map(e => e.totalTransactions), 1);
  const score = (emp.totalRevenue / maxRevenue) * 0.6 + (emp.totalTransactions / maxTx) * 0.4;
  return Math.max(1, Math.round(score * 5));
}

function StarRating({ rating, max = 5, onRate, size = 'sm' }) {
  const [hovered, setHovered] = useState(null);
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5';
  const active = hovered ?? rating;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} transition-colors ${i < active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} ${onRate ? 'cursor-pointer hover:text-amber-400' : ''}`}
          onMouseEnter={() => onRate && setHovered(i + 1)}
          onMouseLeave={() => onRate && setHovered(null)}
          onClick={() => onRate && onRate(i + 1)}
        />
      ))}
      {!onRate && <span className="text-xs text-muted-foreground ml-1">{rating}/{max}</span>}
    </div>
  );
}

const RATING_LABELS = { 5: 'Top Performer', 4: 'High Performer', 3: 'Good', 2: 'Average', 1: 'Needs Support' };
const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-muted text-muted-foreground',
};

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesTab({ sales, shifts, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [editingRating, setEditingRating] = useState(null);

  const { data: manualRatings = [] } = useQuery({
    queryKey: ['employee-ratings'],
    queryFn: () => base44.entities.EmployeeRating.list(),
  });

  const saveRatingMutation = useMutation({
    mutationFn: async ({ name, rating, notes }) => {
      const existing = manualRatings.find(r => r.cashier_name === name);
      if (existing) return base44.entities.EmployeeRating.update(existing.id, { rating, notes });
      return base44.entities.EmployeeRating.create({ cashier_name: name, rating, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-ratings'] });
      setEditingRating(null);
    },
  });

  const today = startOfDay(new Date());

  const employees = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const name = shift.cashier_name || 'Unknown';
      if (!map[name]) map[name] = { name, cashierId: shift.cashier_id, shifts: [], totalRevenue: 0, totalTransactions: 0, activeShift: null };
      const shiftSales = sales.filter(s => s.shift_id === shift.id);
      const revenue = shiftSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
      const duration = shift.ended_at
        ? intervalToDuration({ start: new Date(shift.started_at), end: new Date(shift.ended_at) })
        : intervalToDuration({ start: new Date(shift.started_at), end: new Date() });
      const shiftData = { ...shift, shiftSales, revenue, transactions: shiftSales.length, duration };
      map[name].shifts.push(shiftData);
      map[name].totalRevenue += revenue;
      map[name].totalTransactions += shiftSales.length;
      if (shift.status === 'active') map[name].activeShift = shiftData;
    });
    sales.forEach(sale => {
      const name = sale.cashier_name || 'Unknown';
      if (!map[name]) map[name] = { name, cashierId: sale.cashier_id, shifts: [], totalRevenue: 0, totalTransactions: 0, activeShift: null };
    });
    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [shifts, sales]);

  const employeesWithToday = useMemo(() => employees.map(emp => {
    const todaySales = sales.filter(s => s.cashier_name === emp.name && new Date(s.created_date) >= today);
    const todayRevenue = todaySales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    const last7Sales = sales.filter(s => s.cashier_name === emp.name && new Date(s.created_date) >= subDays(today, 7));
    const last7Revenue = last7Sales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    return { ...emp, todaySales, todayRevenue, last7Revenue, last7Count: last7Sales.length };
  }), [employees, sales, today]);

  const filtered = useMemo(() => {
    if (!search) return employeesWithToday;
    const q = search.toLowerCase();
    return employeesWithToday.filter(e => e.name.toLowerCase().includes(q));
  }, [employeesWithToday, search]);

  const totalEmployees = employees.length;
  const activeNow = employees.filter(e => e.activeShift).length;
  const totalRevenue = employees.reduce((s, e) => s + e.totalRevenue, 0);
  const totalTx = employees.reduce((s, e) => s + e.totalTransactions, 0);

  const exportCSV = () => {
    const headers = ['Employee', 'Total Revenue (KES)', 'Total Transactions', 'Today Revenue (KES)', 'Today Transactions', 'Last 7 Days Revenue (KES)', 'Total Shifts', 'Currently Active'];
    const rows = employeesWithToday.map(e => [e.name, Math.round(e.totalRevenue), e.totalTransactions, Math.round(e.todayRevenue), e.todaySales.length, Math.round(e.last7Revenue), e.shifts.length, e.activeShift ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `employee_performance_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Employees</p><p className="text-xl font-display font-bold">{totalEmployees}</p><p className="text-xs text-emerald-600 font-medium">{activeNow} on shift now</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">All-Time Revenue</p><p className="text-xl font-display font-bold">KES {totalRevenue.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total Transactions</p><p className="text-xl font-display font-bold">{totalTx.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Avg per Employee</p><p className="text-xl font-display font-bold">KES {totalEmployees > 0 ? Math.round(totalRevenue / totalEmployees).toLocaleString() : 0}</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="pl-10" />
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2 flex-shrink-0"><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No employees found.</p></div>}
        {filtered.map((emp, idx) => {
          const isExpanded = expandedEmployee === emp.name;
          const avgTicket = emp.totalTransactions > 0 ? Math.round(emp.totalRevenue / emp.totalTransactions) : 0;
          const rating = computeRating(emp, employeesWithToday);
          const manualRating = manualRatings.find(r => r.cashier_name === emp.name);
          const isEditingThis = editingRating?.name === emp.name;
          return (
            <Card key={emp.name} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><span className="font-bold text-primary text-sm">{idx + 1}</span></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold">{emp.name}</p>
                        {emp.activeShift && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">● ON SHIFT</Badge>}
                        {emp.name === currentUser?.full_name && <Badge variant="outline" className="text-[10px]">You</Badge>}
                        {rating === 5 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">⭐ Top Performer</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {isEditingThis ? (
                          <div className="flex flex-col gap-2 w-full mt-1">
                            <div className="flex items-center gap-2">
                              <StarRating rating={editingRating.rating} size="lg" onRate={r => setEditingRating(prev => ({ ...prev, rating: r }))} />
                              <span className="text-xs text-muted-foreground">{editingRating.rating}/5</span>
                            </div>
                            <Textarea placeholder="Add feedback notes (optional)..." value={editingRating.notes} onChange={e => setEditingRating(prev => ({ ...prev, notes: e.target.value }))} className="h-16 text-xs" />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveRatingMutation.mutate(editingRating)} disabled={saveRatingMutation.isPending}><Check className="w-3 h-3" /> Save</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingRating(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <StarRating rating={manualRating?.rating ?? 0} />
                            <span className="text-[10px] text-muted-foreground">{manualRating ? `Manual rating · ${RATING_LABELS[manualRating.rating] || ''}` : 'No rating yet'}</span>
                            <button className="text-[10px] text-primary hover:underline flex items-center gap-0.5" onClick={() => setEditingRating({ name: emp.name, rating: manualRating?.rating ?? 3, notes: manualRating?.notes ?? '' })}>
                              <Pencil className="w-2.5 h-2.5" /> {manualRating ? 'Edit' : 'Rate'}
                            </button>
                          </>
                        )}
                      </div>
                      {!isEditingThis && manualRating?.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5 max-w-xs truncate">"{manualRating.notes}"</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.shifts.length} shifts recorded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="text-right">
                      <p className="text-lg font-display font-bold text-primary">KES {Math.round(emp.totalRevenue).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">all-time revenue</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/employees/profile?name=${encodeURIComponent(emp.name)}`)}><Award className="w-3.5 h-3.5" /> View Profile</Button>
                    <button onClick={() => setExpandedEmployee(isExpanded ? null : emp.name)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-4">
                  <StatBox label="Today's Revenue" value={`KES ${Math.round(emp.todayRevenue).toLocaleString()}`} sub={`${emp.todaySales.length} sales`} highlight={emp.todayRevenue > 0} />
                  <StatBox label="This Week" value={`KES ${Math.round(emp.last7Revenue).toLocaleString()}`} sub={`${emp.last7Count} sales`} />
                  <StatBox label="Total Transactions" value={emp.totalTransactions} />
                  <StatBox label="Avg Ticket" value={`KES ${avgTicket.toLocaleString()}`} />
                </div>
                {emp.activeShift && (
                  <div className="mx-5 mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex flex-wrap items-center gap-3">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Shift started {format(new Date(emp.activeShift.started_at), 'h:mm a')} · {emp.activeShift.duration.hours || 0}h {emp.activeShift.duration.minutes || 0}m elapsed</span>
                    <span className="font-semibold">{emp.activeShift.transactions} sales · KES {Math.round(emp.activeShift.revenue).toLocaleString()} this shift</span>
                  </div>
                )}
                {isExpanded && emp.shifts.length > 0 && (
                  <div className="border-t px-5 py-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Shift History</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {emp.shifts.sort((a, b) => new Date(b.started_at) - new Date(a.started_at)).map(shift => (
                        <div key={shift.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{format(new Date(shift.started_at), 'EEE, MMM d yyyy')}</p>
                              <Badge className={`text-[9px] px-1.5 ${STATUS_COLORS[shift.status]}`}>{shift.status === 'active' ? '● LIVE' : 'Closed'}</Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {format(new Date(shift.started_at), 'h:mm a')}{shift.ended_at ? ` → ${format(new Date(shift.ended_at), 'h:mm a')}` : ' → Now'} · {shift.duration.hours || 0}h {shift.duration.minutes || 0}m
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">KES {Math.round(shift.revenue).toLocaleString()}</p>
                            <p className="text-muted-foreground">{shift.transactions} sales</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── My Shifts Tab ────────────────────────────────────────────────────────────

function MyShiftsTab({ sales, currentUser }) {
  const cashierName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Cashier';
  const today = startOfDay(new Date());

  const mySales = useMemo(() => sales.filter(s => s.cashier_name === cashierName), [sales, cashierName]);

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
    const link = document.createElement('a');
    link.href = url; link.download = `shift_summary_${cashierName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {cashierName}</p>
        <Button onClick={exportToCSV} size="sm" className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
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
            <h3 className="font-display font-semibold text-sm mb-4">Daily Performance — Last 7 Days</h3>
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffHub() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-started_at', 200),
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Staff Hub</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Employee management & shift performance</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2"><Users className="w-4 h-4" /> Employees</TabsTrigger>
          <TabsTrigger value="my-shifts" className="gap-2"><Clock className="w-4 h-4" /> My Shifts</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-6">
          <EmployeesTab sales={sales} shifts={shifts} currentUser={currentUser} />
        </TabsContent>
        <TabsContent value="my-shifts" className="mt-6">
          {!currentUser ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div><p className="text-muted-foreground">Loading...</p></div>
            </div>
          ) : (
            <MyShiftsTab sales={sales} currentUser={currentUser} />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4 border-t">
        <Link to="/customers"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Previous: Customers</Button></Link>
        <Link to="/etims"><Button className="gap-2">Next: eTIMS <ArrowRight className="w-4 h-4" /></Button></Link>
      </div>
    </div>
  );
}