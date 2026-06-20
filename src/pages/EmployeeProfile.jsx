import React, { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, intervalToDuration, subDays, startOfDay } from 'date-fns';
import {
  ArrowLeft, Star, Users, DollarSign, ShoppingCart, Clock,
  Calendar, TrendingUp, Award, BarChart2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
        />
      ))}
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

const RATING_LABELS = { 5: 'Top Performer', 4: 'High Performer', 3: 'Good', 2: 'Average', 1: 'Needs Support' };

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary', bg = 'bg-primary/10' }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-display font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const employeeName = params.get('name');

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-started_at', 200),
  });

  // Build all employees (for rating context)
  const allEmployees = useMemo(() => {
    const map = {};
    shifts.forEach(shift => {
      const name = shift.cashier_name || 'Unknown';
      if (!map[name]) map[name] = { name, totalRevenue: 0, totalTransactions: 0 };
      const shiftSales = sales.filter(s => s.shift_id === shift.id);
      map[name].totalRevenue += shiftSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
      map[name].totalTransactions += shiftSales.length;
    });
    return Object.values(map);
  }, [shifts, sales]);

  // Build this employee's full profile
  const emp = useMemo(() => {
    if (!employeeName) return null;

    const empShifts = shifts
      .filter(s => s.cashier_name === employeeName)
      .map(shift => {
        const shiftSales = sales.filter(s => s.shift_id === shift.id);
        const revenue = shiftSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
        const duration = shift.ended_at
          ? intervalToDuration({ start: new Date(shift.started_at), end: new Date(shift.ended_at) })
          : intervalToDuration({ start: new Date(shift.started_at), end: new Date() });
        return { ...shift, shiftSales, revenue, transactions: shiftSales.length, duration };
      })
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

    const empSales = sales.filter(s => s.cashier_name === employeeName);
    const totalRevenue = empSales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    const today = startOfDay(new Date());
    const todaySales = empSales.filter(s => new Date(s.created_date) >= today);
    const last7Sales = empSales.filter(s => new Date(s.created_date) >= subDays(today, 7));
    const activeShift = empShifts.find(s => s.status === 'active') || null;

    // Last 7 days daily revenue chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const daySales = empSales.filter(s => {
        const d = new Date(s.created_date);
        return d >= dayStart && d < dayEnd;
      });
      return {
        day: format(date, 'EEE'),
        revenue: daySales.reduce((s, sale) => s + (sale.total_amount || 0), 0),
        sales: daySales.length,
      };
    });

    // Payment method breakdown
    const paymentBreakdown = empSales.reduce((acc, s) => {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
      return acc;
    }, {});

    return {
      name: employeeName,
      totalRevenue,
      totalTransactions: empSales.length,
      shifts: empShifts,
      todaySales,
      last7Sales,
      activeShift,
      last7Days,
      paymentBreakdown,
      avgTicket: empSales.length > 0 ? Math.round(totalRevenue / empSales.length) : 0,
    };
  }, [shifts, sales, employeeName]);

  if (!employeeName || !emp) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Employee not found.</p>
        <Button className="mt-4" onClick={() => navigate('/employees')}>Back to Employees</Button>
      </div>
    );
  }

  const rating = computeRating(emp, allEmployees);
  const ratingLabel = RATING_LABELS[rating];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1100px]">
      {/* Back */}
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate('/employees')}>
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-card border rounded-2xl p-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-bold">{emp.name}</h1>
            {emp.activeShift && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                ● On Shift
              </Badge>
            )}
            {rating === 5 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                ⭐ Top Performer
              </Badge>
            )}
          </div>
          <StarRating rating={rating} />
          <p className="text-sm text-muted-foreground mt-1">{ratingLabel} · {emp.shifts.length} shifts worked</p>
        </div>
        {/* Active shift ticker */}
        {emp.activeShift && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 space-y-0.5">
            <p className="font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Current Shift</p>
            <p>Started {format(new Date(emp.activeShift.started_at), 'h:mm a')}</p>
            <p>{emp.activeShift.duration.hours || 0}h {emp.activeShift.duration.minutes || 0}m elapsed</p>
            <p>{emp.activeShift.transactions} sales · KES {Math.round(emp.activeShift.revenue).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Sales Processed" value={`KES ${Math.round(emp.totalRevenue).toLocaleString()}`} sub="all time" bg="bg-primary/10" color="text-primary" />
        <StatCard icon={ShoppingCart} label="Total Transactions" value={emp.totalTransactions.toLocaleString()} sub="all time" bg="bg-blue-100 dark:bg-blue-900/30" color="text-blue-600" />
        <StatCard icon={Calendar} label="Shifts Worked" value={emp.shifts.length} sub={`${emp.shifts.filter(s => s.status === 'closed').length} closed`} bg="bg-amber-100 dark:bg-amber-900/30" color="text-amber-600" />
        <StatCard icon={TrendingUp} label="Avg Ticket Size" value={`KES ${emp.avgTicket.toLocaleString()}`} sub="per transaction" bg="bg-emerald-100 dark:bg-emerald-900/30" color="text-emerald-600" />
      </div>

      {/* Today + This Week */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-display font-bold">KES {emp.todaySales.reduce((s, sale) => s + (sale.total_amount || 0), 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{emp.todaySales.length} sales</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last 7 Days</p>
            <p className="text-lg font-display font-bold">KES {emp.last7Sales.reduce((s, sale) => s + (sale.total_amount || 0), 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{emp.last7Sales.length} sales</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Revenue – Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emp.last7Days} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [`KES ${v.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Breakdown + Performance Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment breakdown */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display">Payment Methods Used</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(emp.paymentBreakdown).length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              Object.entries(emp.paymentBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([method, count]) => (
                  <div key={method} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 capitalize">{method === 'mpesa' ? 'M-Pesa' : method.replace('_', ' ')}</div>
                    <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / emp.totalTransactions) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Star rating breakdown */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display">Performance Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-5xl font-display font-bold">{rating}</span>
              <span className="text-xl text-muted-foreground">/5</span>
            </div>
            <StarRating rating={rating} />
            <Badge className={`text-xs mt-1 ${rating === 5 ? 'bg-amber-100 text-amber-700' : rating >= 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {ratingLabel}
            </Badge>
            <p className="text-[11px] text-muted-foreground text-center">Based on total revenue and transaction volume relative to peers</p>
          </CardContent>
        </Card>
      </div>

      {/* Shift History */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Shift History ({emp.shifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emp.shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No shifts recorded yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {emp.shifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{format(new Date(shift.started_at), 'EEE, MMM d yyyy')}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(shift.started_at), 'h:mm a')}
                      {shift.ended_at ? ` → ${format(new Date(shift.ended_at), 'h:mm a')}` : ' → Now'}
                      {' · '}{shift.duration.hours || 0}h {shift.duration.minutes || 0}m
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">KES {Math.round(shift.revenue).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{shift.transactions} sales</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}