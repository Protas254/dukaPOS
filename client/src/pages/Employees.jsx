import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, intervalToDuration, subDays, startOfDay } from 'date-fns';
import {
  Users, Clock, DollarSign, ShoppingCart, TrendingUp, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, Search, Award, Calendar, Download, Star, Pencil, Check, X, Plus,
  Eye, EyeOff, Mail, Send, UserPlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Link, useNavigate } from 'react-router-dom';

const ROLE_CONFIG = {
  admin: { label: 'Administrator', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  supervisor: { label: 'Supervisor', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  clerk: { label: 'Clerk', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
  general_staff: { label: 'General Staff', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  staff: { label: 'General Staff', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  cashier: { label: 'Cashier', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  manager: { label: 'Store Manager', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
};

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

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [editingRoleMember, setEditingRoleMember] = useState(null);
  const [newRole, setNewRole] = useState('cashier');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAddCashierOpen, setIsAddCashierOpen] = useState(false);

  const [cashierForm, setCashierForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
    branch_id: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [addMode, setAddMode] = useState('create');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'cashier', name: '' });
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: registeredCashiers = [] } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => api.cashiers.getAll(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.getAll(),
  });

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => api.entities.Sale.list('-created_date', 500) });
  const { data: shifts = [] } = useQuery({ queryKey: ['shifts'], queryFn: () => api.entities.Shift.list('-started_at', 200) });
  const { data: manualRatings = [] } = useQuery({ queryKey: ['employee-ratings'], queryFn: () => api.entities.EmployeeRating.list() });

  const addCashierMutation = useMutation({
    mutationFn: (data) => api.cashiers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setIsAddCashierOpen(false);
      setCashierForm({ name: '', email: '', password: '', confirmPassword: '', role: 'cashier', branch_id: '' });
      setShowPwd(false); setShowConfirmPwd(false);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => api.cashiers.invite(data),
    onSuccess: () => { setInviteSent(true); },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ cashierId, role }) => api.cashiers.update(cashierId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setEditingRoleMember(null);
    },
  });

  const handleAddCashierSubmit = (e) => {
    e.preventDefault();
    if (!cashierForm.email || !cashierForm.password) return;
    if (cashierForm.password !== cashierForm.confirmPassword) return;
    addCashierMutation.mutate(cashierForm);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteForm.email) return;
    inviteMutation.mutate(inviteForm);
  };

  const handleModalClose = (open) => {
    setIsAddCashierOpen(open);
    if (!open) {
      setAddMode('create'); setInviteSent(false);
      setInviteForm({ email: '', role: 'cashier', name: '' });
      setCashierForm({ name: '', email: '', password: '', confirmPassword: '', role: 'cashier', branch_id: '' });
      setShowPwd(false); setShowConfirmPwd(false);
    }
  };

  const saveRatingMutation = useMutation({
    mutationFn: async ({ name, rating, notes }) => {
      const existing = manualRatings.find(r => r.cashier_name === name);
      if (existing) return api.entities.EmployeeRating.update(existing.id, { rating, notes });
      return api.entities.EmployeeRating.create({ cashier_name: name, rating, notes });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employee-ratings'] }); setEditingRating(null); },
  });

  const today = startOfDay(new Date());

  const employees = useMemo(() => {
    const map = {};

    registeredCashiers.forEach(c => {
      const name = c.full_name || c.username;
      map[name] = { 
        name, 
        cashierId: c.id, 
        email: c.email, 
        role: c.role, 
        shifts: [], 
        totalRevenue: 0, 
        totalTransactions: 0, 
        activeShift: null 
      };
    });

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
  }, [registeredCashiers, shifts, sales]);

  const employeesWithToday = useMemo(() => employees.map(emp => {
    const todaySales = sales.filter(s => s.cashier_name === emp.name && new Date(s.created_date) >= today);
    const todayRevenue = todaySales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    const last7Sales = sales.filter(s => s.cashier_name === emp.name && new Date(s.created_date) >= subDays(today, 7));
    const last7Revenue = last7Sales.reduce((s, sale) => s + (sale.total_amount || 0), 0);
    return { ...emp, todaySales, todayRevenue, last7Revenue, last7Count: last7Sales.length };
  }), [employees, sales, today]);

  const filtered = useMemo(() => {
    if (!search) return employeesWithToday;
    return employeesWithToday.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
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
    const a = document.createElement('a'); a.href = url; a.download = `employee_performance_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Staff performance & shift history</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => setIsAddCashierOpen(true)} className="gap-2 bg-primary text-white">
            <UserPlus className="w-4 h-4" /> Add Team Member
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="pl-10" />
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
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold border ${ROLE_CONFIG[emp.role]?.cls || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                        >
                          {ROLE_CONFIG[emp.role]?.label || (emp.role ? emp.role.replace('_', ' ') : 'Cashier')}
                        </Badge>
                        {emp.activeShift && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">● ON SHIFT</Badge>}
                        {emp.name === currentUser?.full_name && <Badge variant="outline" className="text-[10px]">You</Badge>}
                        {rating === 5 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">⭐ Top Performer</Badge>}
                      </div>
                      {editingRoleMember === emp.name ? (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            className="h-7 text-xs px-2 bg-background border rounded-md"
                          >
                            <option value="admin">Administrator (Admin)</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="clerk">Clerk</option>
                            <option value="general_staff">General Staff</option>
                            <option value="cashier">Cashier</option>
                            <option value="manager">Store Manager</option>
                          </select>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-[11px]"
                            disabled={updateRoleMutation.isPending}
                            onClick={() => updateRoleMutation.mutate({ cashierId: emp.cashierId, role: newRole })}
                          >
                            {updateRoleMutation.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setEditingRoleMember(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : emp.cashierId ? (
                        <div className="mt-0.5">
                          <button
                            type="button"
                            onClick={() => { setEditingRoleMember(emp.name); setNewRole(emp.role || 'cashier'); }}
                            className="text-[10px] text-muted-foreground hover:text-primary underline"
                          >
                            Edit role ({ROLE_CONFIG[emp.role]?.label || emp.role || 'Cashier'})
                          </button>
                        </div>
                      ) : null}
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
                    <div className="space-y-2">
                      {emp.shifts.map(shift => (
                        <div key={shift.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
                          <div>
                            <p className="font-semibold">{format(new Date(shift.started_at), 'MMM d, yyyy h:mm a')} {shift.ended_at ? `– ${format(new Date(shift.ended_at), 'h:mm a')}` : '(Active)'}</p>
                            <p className="text-muted-foreground">{shift.transactions} transactions · Starting cash: KES {shift.starting_cash || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">KES {Math.round(shift.revenue).toLocaleString()}</p>
                            <Badge className={`${STATUS_COLORS[shift.status] || ''} text-[10px]`}>{shift.status}</Badge>
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

      <div className="flex justify-between pt-4 border-t">
        <Link to="/customers"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Previous: Customers</Button></Link>
        <Link to="/my-shifts"><Button className="gap-2">Next: My Shifts <ArrowRight className="w-4 h-4" /></Button></Link>
      </div>

      {/* Add Cashier Modal */}
      <Dialog open={isAddCashierOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold">Add Team Member / Administrator</DialogTitle>
            <DialogDescription className="text-xs">
              Create an account directly or send an email invitation for any role including admins, supervisors, clerks and staff.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setAddMode('create')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                addMode === 'create' ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Create Account
            </button>
            <button
              type="button"
              onClick={() => { setAddMode('invite'); setInviteSent(false); }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                addMode === 'invite' ? 'bg-primary text-white' : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Invite via Email
            </button>
          </div>

          {/* ── Create Account Form ── */}
          {addMode === 'create' && (
            <form onSubmit={handleAddCashierSubmit} className="space-y-4 py-1">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Gordon Odera"
                  value={cashierForm.name}
                  onChange={e => setCashierForm({ ...cashierForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Email Address *</label>
                <Input
                  required type="email"
                  placeholder="gordon@dukasmart.com"
                  value={cashierForm.email}
                  onChange={e => setCashierForm({ ...cashierForm, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Password / PIN *</label>
                  <div className="relative">
                    <Input
                      required
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={cashierForm.password}
                      onChange={e => setCashierForm({ ...cashierForm, password: e.target.value })}
                      className="pr-9"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPwd ? 'Hide' : 'Show'}>
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Role / Designation *</label>
                  <select
                    value={cashierForm.role}
                    onChange={e => setCashierForm({ ...cashierForm, role: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md font-medium"
                  >
                    <option value="admin">Administrator (Admin) — Full System Control & Settings</option>
                    <option value="supervisor">Supervisor — Shift Supervision & Approvals</option>
                    <option value="clerk">Clerk — Inventory, Stock & Receiving</option>
                    <option value="general_staff">General Staff — Store Operations</option>
                    <option value="cashier">Cashier — POS Terminal & Register</option>
                    <option value="manager">Store Manager — Store Operations</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Confirm Password *</label>
                <div className="relative">
                  <Input
                    required
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={cashierForm.confirmPassword}
                    onChange={e => setCashierForm({ ...cashierForm, confirmPassword: e.target.value })}
                    className="pr-9"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPwd ? 'Hide' : 'Show'}>
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {cashierForm.confirmPassword && cashierForm.password !== cashierForm.confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set a temporary password. The cashier can reset it via{' '}
                <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Forgot Password</a>.
              </p>
              {branches.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Assigned Branch</label>
                  <select
                    value={cashierForm.branch_id}
                    onChange={e => setCashierForm({ ...cashierForm, branch_id: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md"
                  >
                    <option value="">All / Primary Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}
              {addCashierMutation.isError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                  {addCashierMutation.error?.message || 'Failed to create cashier.'}
                </p>
              )}
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => handleModalClose(false)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={addCashierMutation.isPending || (cashierForm.confirmPassword && cashierForm.password !== cashierForm.confirmPassword)}
                  className="bg-primary text-white"
                >
                  {addCashierMutation.isPending ? 'Saving...' : 'Add Team Member'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* ── Invite via Email Form ── */}
          {addMode === 'invite' && (
            inviteSent ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-semibold text-sm">Invite Sent!</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  An invite email has been sent to <strong>{inviteForm.email}</strong>. They have 48 hours to create their account.
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { setInviteSent(false); setInviteForm({ email: '', role: 'cashier', name: '' }); }}>
                  Send Another Invite
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4 py-1">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Full Name (optional)</label>
                  <Input
                    placeholder="e.g. Jane Wanjiku"
                    value={inviteForm.name}
                    onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Email Address *</label>
                  <Input
                    required type="email"
                    placeholder="jane@gmail.com"
                    value={inviteForm.email}
                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Role / Designation *</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md font-medium"
                  >
                    <option value="admin">Administrator (Admin) — Full System Control & Settings</option>
                    <option value="supervisor">Supervisor — Shift Supervision & Approvals</option>
                    <option value="clerk">Clerk — Inventory, Stock & Receiving</option>
                    <option value="general_staff">General Staff — Store Operations</option>
                    <option value="cashier">Cashier — POS Terminal & Register</option>
                    <option value="manager">Store Manager — Store Operations</option>
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                  📧 An invite email with a secure link will be sent. The recipient clicks it to create their password and activate their role. The link expires in 48 hours.
                </p>
                {inviteMutation.isError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                    {inviteMutation.error?.message || 'Failed to send invite.'}
                  </p>
                )}
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => handleModalClose(false)}>Cancel</Button>
                  <Button type="submit" disabled={inviteMutation.isPending} className="bg-primary text-white gap-1.5">
                    <Mail className="w-4 h-4" />
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}