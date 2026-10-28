import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Filter, Search, X, Calendar, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = ['sales', 'expense', 'loan', 'investment', 'transfer', 'other'];
const PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque'];

export default function CashFlow() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  const { data: cashflows = [], isLoading } = useQuery({
    queryKey: ['cashflow'],
    queryFn: () => api.entities.CashFlow.list('-date'),
  });

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => api.entities.Sale.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => api.entities.Expense.list() });

  const createCashflow = useMutation({
    mutationFn: (data) => api.entities.CashFlow.create({
      ...data,
      created_by: data.created_by || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashflow']);
      setDialogOpen(false);
      toast.success('Transaction recorded successfully');
    },
  });

  const filtered = useMemo(() => {
    return cashflows.filter(cf => {
      const q = search.toLowerCase();
      if (q && !cf.description?.toLowerCase().includes(q) && !cf.category?.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && cf.transaction_type !== typeFilter) return false;
      if (categoryFilter !== 'all' && cf.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && cf.payment_method !== paymentFilter) return false;
      return true;
    });
  }, [cashflows, search, typeFilter, categoryFilter, paymentFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCashflows = filtered.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const totalInflow = cashflows.filter(c => c.transaction_type === 'inflow').reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalOutflow = cashflows.filter(c => c.transaction_type === 'outflow').reduce((sum, c) => sum + (c.amount || 0), 0);
  const balance = totalInflow - totalOutflow;
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Cash Flow</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage your business cash movements
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Add Cash Flow Transaction</DialogTitle>
              <CardDescription>Record a new cash inflow or outflow</CardDescription>
            </DialogHeader>
            <CashFlowForm onSubmit={createCashflow.mutate} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Inflow</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Money coming in</CardDescription>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">KES {totalInflow.toLocaleString()}</p>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              {cashflows.filter(c => c.transaction_type === 'inflow').length} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Outflow</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Money going out</CardDescription>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">KES {totalOutflow.toLocaleString()}</p>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 mr-1" />
              {cashflows.filter(c => c.transaction_type === 'outflow').length} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Balance</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Net cash position</CardDescription>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KES {balance.toLocaleString()}</p>
            <div className={`flex items-center mt-1 text-xs ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {netCashFlow >= 0 ? 'Positive' : 'Negative'} cash flow
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Flow</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Inflow minus outflow</CardDescription>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netCashFlow >= 0 ? '+' : '-'} KES {Math.abs(netCashFlow).toLocaleString()}
            </p>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="pl-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
            {(typeFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-muted/40 border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Transaction Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="mt-1 rounded-lg">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="inflow">Inflow</SelectItem>
                    <SelectItem value="outflow">Outflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1 rounded-lg">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="mt-1 rounded-lg">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(typeFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setPaymentFilter('all'); }}>
                <X className="w-3 h-3" /> Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Transaction List */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Transactions ({filtered.length})</span>
          </div>
          <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            paginatedCashflows.map(cf => (
              <div key={cf.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      cf.transaction_type === 'inflow' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {cf.transaction_type === 'inflow' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{cf.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] capitalize">{cf.category}</Badge>
                        <span>•</span>
                        <span>{format(new Date(cf.date), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{(cf.payment_method || 'cash').replace('_', ' ')}</Badge>
                        {cf.reference_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{cf.reference_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${
                      cf.transaction_type === 'inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {cf.transaction_type === 'inflow' ? '+' : '-'} KES {cf.amount?.toLocaleString()}
                    </p>
                    {cf.created_by_name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">by {cf.created_by_name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function CashFlowForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    transaction_type: 'inflow',
    category: 'sales',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Transaction Type *</Label>
          <Select value={formData.transaction_type} onValueChange={(v) => setFormData(prev => ({ ...prev, transaction_type: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inflow">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>Inflow</span>
                </div>
              </SelectItem>
              <SelectItem value="outflow">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                  <span>Outflow</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Amount (KES) *</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label>Description *</Label>
        <Input
          placeholder="Enter transaction description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label>Payment Method *</Label>
          <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => (
                <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Reference Number</Label>
        <Input
          placeholder="Transaction ID, cheque number, etc."
          value={formData.reference_number}
          onChange={e => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Input
          placeholder="Additional notes (optional)"
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="mt-1"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!formData.amount || !formData.description}>
          Add Transaction
        </Button>
      </DialogFooter>
    </form>
  );
}