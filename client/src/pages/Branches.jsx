import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { 
  Building, Plus, Search, MapPin, User, Phone, Clock, TrendingUp, 
  BarChart3, Award, DollarSign, Layers, ChevronDown, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Branches() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding branch
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    manager: '',
    phone: '',
    working_hours: '08:00 - 20:00',
    status: 'active',
    monthly_rent: 0,
    debt: 0
  });

  // Fetch real Branches API
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.branches.getAll(),
  });

  // Fetch real Sales to compute dynamic transactions & revenue per branch/tenant
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.entities.Sale.list('-created_date', 1000),
  });

  // Fetch real Staff to compute staff count
  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => api.cashiers.getAll(),
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: (newBranch) => api.branches.create(newBranch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        code: '',
        location: '',
        manager: '',
        phone: '',
        working_hours: '08:00 - 20:00',
        status: 'active',
        monthly_rent: 0,
        debt: 0
      });
    },
  });

  const handleCreateBranch = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    createBranchMutation.mutate({
      ...formData,
      monthly_rent: parseFloat(formData.monthly_rent) || 0,
      debt: parseFloat(formData.debt) || 0
    });
  };

  // Total sales revenue for tenant
  const totalTenantRevenue = useMemo(() => {
    return sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  }, [sales]);

  // Map branches with dynamic revenue, transactions, staff count
  const enrichedBranches = useMemo(() => {
    if (!branches.length) return [];

    return branches.map((b, idx) => {
      // For demonstration / real allocation, distribute sales or attach if sale has branch_id
      // If sale doesn't specify branch, top branch gets main sales or proportional
      const branchSales = sales.filter(s => s.branch_id === b.id || s.branch_code === b.code);
      // Fallback: if single main branch, assign all sales to it
      const txCount = branchSales.length || (idx === 0 ? sales.length : 0);
      const rev = branchSales.reduce((s, item) => s + (item.total_amount || 0), 0) || (idx === 0 ? totalTenantRevenue : 0);

      const staffCount = cashiers.filter(c => c.branch_id === b.id || c.branch_code === b.code).length || Math.ceil(cashiers.length / (branches.length || 1));
      const rent = b.monthly_rent || 0;
      const debt = b.debt || 0;
      const netPosition = rev - rent - debt;

      return {
        ...b,
        transactions: txCount,
        revenue: rev,
        staffCount: staffCount,
        netPosition: netPosition,
        revenueShare: totalTenantRevenue > 0 ? (rev / totalTenantRevenue) * 100 : 0
      };
    });
  }, [branches, sales, cashiers, totalTenantRevenue]);

  // Filtered branches by search query & select
  const filteredBranches = useMemo(() => {
    let result = enrichedBranches;
    if (selectedBranchId !== 'all') {
      result = result.filter(b => String(b.id) === String(selectedBranchId));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b => 
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q) ||
        b.manager?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedBranches, selectedBranchId, search]);

  // Identify top performer
  const topPerformer = useMemo(() => {
    if (!enrichedBranches.length) return null;
    return [...enrichedBranches].sort((a, b) => b.revenue - a.revenue)[0];
  }, [enrichedBranches]);

  // Financial status comparison chart data
  const chartData = useMemo(() => {
    return enrichedBranches.map(b => ({
      code: b.code || b.name,
      Revenue: b.revenue,
      Net: b.netPosition,
      Rent: b.monthly_rent,
      Debt: b.debt
    }));
  }, [enrichedBranches]);

  // Totals calculation
  const totals = useMemo(() => {
    const totalTx = enrichedBranches.reduce((s, b) => s + b.transactions, 0);
    const totalRev = enrichedBranches.reduce((s, b) => s + b.revenue, 0);
    const totalRent = enrichedBranches.reduce((s, b) => s + b.monthly_rent, 0);
    const totalDebt = enrichedBranches.reduce((s, b) => s + b.debt, 0);
    const totalNet = enrichedBranches.reduce((s, b) => s + b.netPosition, 0);
    const totalStaff = enrichedBranches.reduce((s, b) => s + b.staffCount, 0);
    return { totalTx, totalRev, totalRent, totalDebt, totalNet, totalStaff };
  }, [enrichedBranches]);

  const selectedBranchObj = enrichedBranches.find(b => String(b.id) === String(selectedBranchId));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2.5">
            <Building className="w-7 h-7 text-primary" /> Branches
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {enrichedBranches.length} branches across your business
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 self-start sm:self-auto bg-primary hover:bg-primary/90 text-white font-semibold">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      {/* Search & Select Branch Dropdown */}
      <div className="relative max-w-md">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-input rounded-xl text-left shadow-sm hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {selectedBranchObj 
                ? `${selectedBranchObj.name} (${selectedBranchObj.code})`
                : 'Search & select a branch to view details...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-2 space-y-1 max-h-72 overflow-y-auto">
            <div className="p-2">
              <Input
                placeholder="Search by name, code, location, manager..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <button
              onClick={() => {
                setSelectedBranchId('all');
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                selectedBranchId === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <span>All Branches</span>
              {selectedBranchId === 'all' && <Check className="w-3.5 h-3.5" />}
            </button>
            {enrichedBranches.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranchId(b.id);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between ${
                  String(selectedBranchId) === String(b.id) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                }`}
              >
                <div>
                  <div className="font-semibold text-foreground">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground">{b.code} · {b.location}</div>
                </div>
                {String(selectedBranchId) === String(b.id) && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map(branch => {
          const isMaintenance = branch.status === 'maintenance';
          const isClosed = branch.status === 'closed';

          return (
            <Card key={branch.id} className="overflow-hidden border border-border/80 hover:border-primary/30 transition-all shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-foreground">{branch.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono font-semibold">{branch.code}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                      <span className="truncate">{branch.location || 'Nairobi, Kenya'}</span>
                    </p>
                  </div>
                  <Badge 
                    className={`text-[10px] capitalize px-2 py-0.5 ${
                      isMaintenance 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' 
                        : isClosed 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                    }`}
                  >
                    {branch.status || 'active'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Manager:</span>
                    <span className="font-medium text-foreground">{branch.manager || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone:</span>
                    <span className="font-medium text-foreground">{branch.phone || '0700000000'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Hours:</span>
                    <span className="font-medium text-foreground">{branch.working_hours || '08:00 - 20:00'}</span>
                  </div>
                </div>

                {/* Card Metrics Footer */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-center">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">TRANSACTIONS</p>
                    <p className="font-display font-bold text-sm text-foreground">{branch.transactions}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">REVENUE</p>
                    <p className="font-display font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      KES {Math.round(branch.revenue).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Branch Comparison Section */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Branch Comparison
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Side-by-side performance across all {enrichedBranches.length} branches
              </CardDescription>
            </div>

            {topPerformer && (
              <Badge className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 gap-1.5 py-1 px-3 self-start sm:self-auto text-xs">
                <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 
                <span>Top performer: <strong>{topPerformer.name}</strong> · KES {Math.round(topPerformer.revenue).toLocaleString()} revenue</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Financial Status Comparison Chart */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              FINANCIAL STATUS COMPARISON
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `KES ${val.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => `KES ${Number(value).toLocaleString()}`} 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rent" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Debt" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Manager</th>
                  <th className="p-3 text-right">Transactions</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">Revenue Share</th>
                  <th className="p-3 text-right">Monthly Rent</th>
                  <th className="p-3 text-right">Debt</th>
                  <th className="p-3 text-right">Net Position</th>
                  <th className="p-3 text-center">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrichedBranches.map(b => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>{b.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({b.code})</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        b.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'maintenance' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {b.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{b.manager || '—'}</td>
                    <td className="p-3 text-right font-medium">{b.transactions}</td>
                    <td className="p-3 text-right font-bold text-foreground">KES {Math.round(b.revenue).toLocaleString()}</td>
                    <td className="p-3 text-right text-muted-foreground">{Math.round(b.revenueShare)}%</td>
                    <td className="p-3 text-right text-muted-foreground">KES {b.monthly_rent.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-600 font-medium">KES {b.debt.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">KES {Math.round(b.netPosition).toLocaleString()}</td>
                    <td className="p-3 text-center text-muted-foreground">{b.staffCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/80 font-bold border-t border-border">
                <tr>
                  <td className="p-3">Totals</td>
                  <td className="p-3">—</td>
                  <td className="p-3">—</td>
                  <td className="p-3 text-right">{totals.totalTx}</td>
                  <td className="p-3 text-right text-foreground">KES {Math.round(totals.totalRev).toLocaleString()}</td>
                  <td className="p-3 text-right">100%</td>
                  <td className="p-3 text-right">KES {totals.totalRent.toLocaleString()}</td>
                  <td className="p-3 text-right text-red-600">KES {totals.totalDebt.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-600">KES {Math.round(totals.totalNet).toLocaleString()}</td>
                  <td className="p-3 text-center">{totals.totalStaff}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Branch Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold">Add New Branch</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new operational branch for your business.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBranch} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Branch Name *</label>
                <Input
                  required
                  placeholder="e.g. Eldoret Main"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Branch Code *</label>
                <Input
                  required
                  placeholder="e.g. ELD-05"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Address / Location</label>
              <Input
                placeholder="e.g. Rupa Mall, Uganda Road, Eldoret"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Manager Name</label>
                <Input
                  placeholder="e.g. David Kamau"
                  value={formData.manager}
                  onChange={e => setFormData({ ...formData, manager: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Phone Number</label>
                <Input
                  placeholder="e.g. 0712345678"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Working Hours</label>
                <Input
                  placeholder="08:00 - 20:00"
                  value={formData.working_hours}
                  onChange={e => setFormData({ ...formData, working_hours: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Monthly Rent (KES)</label>
                <Input
                  type="number"
                  placeholder="30000"
                  value={formData.monthly_rent}
                  onChange={e => setFormData({ ...formData, monthly_rent: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBranchMutation.isPending} className="bg-primary text-white">
                {createBranchMutation.isPending ? 'Adding...' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
