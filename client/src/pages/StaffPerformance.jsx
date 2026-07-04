import React, { useState, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Clock, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Search,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function StaffPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.entities.Shift.list(),
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.entities.Sale.list(),
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['employee-ratings'],
    queryFn: () => api.entities.EmployeeRating.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['employee-schedules'],
    queryFn: () => api.entities.EmployeeSchedule.list(),
  });

  const staffPerformance = useMemo(() => {
    const cashierStats = {};

    shifts.forEach(shift => {
      if (!cashierStats[shift.cashier_name]) {
        cashierStats[shift.cashier_name] = {
          cashier_name: shift.cashier_name,
          cashier_id: shift.cashier_id,
          total_shifts: 0,
          total_hours: 0,
          total_sales: 0,
          total_transactions: 0,
          closed_shifts: 0,
          active_shifts: 0,
        };
      }

      cashierStats[shift.cashier_name].total_shifts += 1;

      if (shift.status === 'closed') {
        cashierStats[shift.cashier_name].closed_shifts += 1;
        if (shift.started_at && shift.ended_at) {
          const start = new Date(shift.started_at);
          const end = new Date(shift.ended_at);
          const hours = (end - start) / (1000 * 60 * 60);
          cashierStats[shift.cashier_name].total_hours += hours;
        }
      } else {
        cashierStats[shift.cashier_name].active_shifts += 1;
      }

      cashierStats[shift.cashier_name].total_transactions += shift.total_transactions || 0;
      cashierStats[shift.cashier_name].total_sales += shift.total_sales || 0;
    });

    sales.forEach(sale => {
      if (sale.cashier_name && cashierStats[sale.cashier_name]) {
        if (!cashierStats[sale.cashier_name].sales_list) {
          cashierStats[sale.cashier_name].sales_list = [];
        }
        cashierStats[sale.cashier_name].sales_list.push(sale);
      }
    });

    ratings.forEach(rating => {
      if (cashierStats[rating.cashier_name]) {
        if (!cashierStats[rating.cashier_name].ratings) {
          cashierStats[rating.cashier_name].ratings = [];
        }
        cashierStats[rating.cashier_name].ratings.push(rating.rating);
      }
    });

    const result = Object.values(cashierStats).map(cashier => {
      const avgRating = cashier.ratings && cashier.ratings.length > 0
        ? cashier.ratings.reduce((a, b) => a + b, 0) / cashier.ratings.length
        : 0;

      const avgTransactionValue = cashier.total_transactions > 0
        ? cashier.total_sales / cashier.total_transactions
        : 0;

      return {
        ...cashier,
        avg_rating: parseFloat(avgRating.toFixed(2)),
        avg_transaction_value: parseFloat(avgTransactionValue.toFixed(2)),
        sales_per_hour: cashier.total_hours > 0
          ? parseFloat((cashier.total_sales / cashier.total_hours).toFixed(2))
          : 0,
      };
    });

    return result.sort((a, b) => b.total_sales - a.total_sales);
  }, [shifts, sales, ratings]);

  const filteredStaff = staffPerformance.filter(staff =>
    staff.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topPerformers = [...staffPerformance].sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);

  const salesByCashierData = staffPerformance.map(staff => ({
    name: staff.cashier_name.split(' ')[0],
    sales: staff.total_sales,
    transactions: staff.total_transactions,
  }));

  const ratingDistributionData = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      if (distribution[rating.rating] !== undefined) {
        distribution[rating.rating] += 1;
      }
    });
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Stars`,
      count,
    }));
  }, [ratings]);

  const totalRevenue = staffPerformance.reduce((sum, s) => sum + s.total_sales, 0);
  const totalShifts = staffPerformance.reduce((sum, s) => sum + s.total_shifts, 0);
  const avgRating = staffPerformance.filter(s => s.avg_rating > 0).length > 0
    ? staffPerformance
        .filter(s => s.avg_rating > 0)
        .reduce((sum, s) => sum + s.avg_rating, 0) / 
        staffPerformance.filter(s => s.avg_rating > 0).length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading">Staff Performance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track cashier performance, sales, and ratings</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search cashier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all cashiers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShifts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffPerformance.length}</div>
            <p className="text-xs text-muted-foreground">Cashiers with shifts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)} / 5.0</div>
            <p className="text-xs text-muted-foreground">Average across staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales by Cashier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByCashierData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `KES ${value.toLocaleString()}`}
                />
                <Bar dataKey="sales" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, count }) => `${rating}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ratingDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.cashier_id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <span className="text-lg font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{performer.cashier_name}</p>
                    <p className="text-sm text-muted-foreground">
                      KES {performer.total_sales.toLocaleString()} • {performer.total_transactions} sales
                    </p>
                  </div>
                  {performer.avg_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{performer.avg_rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detailed Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Cashier</th>
                  <th className="text-right py-3 px-4 font-medium">Total Sales</th>
                  <th className="text-right py-3 px-4 font-medium">Transactions</th>
                  <th className="text-right py-3 px-4 font-medium">Avg Transaction</th>
                  <th className="text-right py-3 px-4 font-medium">Total Hours</th>
                  <th className="text-right py-3 px-4 font-medium">Sales/Hour</th>
                  <th className="text-center py-3 px-4 font-medium">Rating</th>
                  <th className="text-center py-3 px-4 font-medium">Shifts</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.cashier_id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {staff.cashier_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{staff.cashier_name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      KES {staff.total_sales.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {staff.total_transactions}
                    </td>
                    <td className="text-right py-3 px-4">
                      KES {staff.avg_transaction_value.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {staff.total_hours.toFixed(1)}h
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <span>KES {staff.sales_per_hour.toLocaleString()}</span>
                        {staff.sales_per_hour > 5000 && (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        )}
                        {staff.sales_per_hour < 2000 && staff.total_hours > 0 && (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {staff.avg_rating > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{staff.avg_rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No ratings</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={staff.active_shifts > 0 ? "default" : "secondary"}>
                        {staff.total_shifts} ({staff.active_shifts} active)
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}