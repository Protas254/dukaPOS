import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Filter, DollarSign, Trash2, Edit2, Upload, Receipt, X, Table as TableIcon, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  { value: 'rent', label: 'Rent', color: 'bg-red-100 text-red-700' },
  { value: 'utilities', label: 'Utilities', color: 'bg-blue-100 text-blue-700' },
  { value: 'salaries', label: 'Salaries', color: 'bg-green-100 text-green-700' },
  { value: 'supplies', label: 'Supplies', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  { value: 'transport', label: 'Transport', color: 'bg-purple-100 text-purple-700' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
  { value: 'insurance', label: 'Insurance', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'taxes', label: 'Taxes', color: 'bg-gray-100 text-gray-700' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

const PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque'];

export default function Expenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 100),
  });

  const filteredExpenses = expenses.filter(exp => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
                         exp.description?.toLowerCase().includes(searchLower) ||
                         exp.reference_number?.toLowerCase().includes(searchLower) ||
                         exp.added_by_name?.toLowerCase().includes(searchLower) ||
                         exp.payment_method?.toLowerCase().includes(searchLower) ||
                         exp.category?.toLowerCase().includes(searchLower);
    
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    
    let matchesDateFrom = true;
    let matchesDateTo = true;
    
    if (dateFrom) {
      matchesDateFrom = new Date(exp.date) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDateTo = new Date(exp.date) <= new Date(dateTo);
    }
    
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'date') {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    } else if (sortField === 'amount') {
      aVal = aVal || 0;
      bVal = bVal || 0;
    } else {
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalExpenses = sortedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const createExpense = useMutation({
    mutationFn: async (expenseData) => {
      let receiptUrl = null;
      if (receiptFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: receiptFile });
        receiptUrl = file_url;
      }

      return base44.entities.Expense.create({
        ...expenseData,
        receipt_url: receiptUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense added successfully' });
      setIsAddDialogOpen(false);
      setReceiptFile(null);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, data }) => {
      let receiptUrl = data.receipt_url;
      if (receiptFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: receiptFile });
        receiptUrl = file_url;
      }

      return base44.entities.Expense.update(id, { ...data, receipt_url: receiptUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense updated successfully' });
      setEditingExpense(null);
      setReceiptFile(null);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Deleted', description: 'Expense deleted successfully' });
    },
  });

  const handleSubmit = (formData) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data: formData });
    } else {
      createExpense.mutate(formData);
    }
  };

  const categoryColors = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage business expenses
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <ExpenseFormDialog
            open={isAddDialogOpen}
            onClose={() => {
              setIsAddDialogOpen(false);
              setReceiptFile(null);
            }}
            onSubmit={handleSubmit}
            isPending={createExpense.isPending}
          />
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by description, reference, or added by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="w-[150px]"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2 border rounded-lg p-1 bg-card">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-3"
          >
            <TableIcon className="w-4 h-4 mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-3"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Cards
          </Button>
        </div>
      </div>
      {(dateFrom || dateTo || searchTerm) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {dateFrom && <Badge variant="outline">From: {dateFrom}</Badge>}
          {dateTo && <Badge variant="outline">To: {dateTo}</Badge>}
          {searchTerm && <Badge variant="outline">Search: "{searchTerm}"</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setSearchTerm('');
            }}
            className="h-6 px-2 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      {/* Expenses List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading expenses...</div>
      ) : sortedExpenses.length > 0 ? (
        viewMode === 'table' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('date')}>
                        <div className="flex items-center">Date<SortIcon field="date" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('description')}>
                        <div className="flex items-center">Description<SortIcon field="description" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('category')}>
                        <div className="flex items-center">Category<SortIcon field="category" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('payment_method')}>
                        <div className="flex items-center">Payment<SortIcon field="payment_method" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('reference_number')}>
                        <div className="flex items-center">Reference<SortIcon field="reference_number" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('added_by_name')}>
                        <div className="flex items-center">Added By<SortIcon field="added_by_name" /></div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer hover:bg-muted/70" onClick={() => handleSort('amount')}>
                        <div className="flex items-center justify-end">Amount<SortIcon field="amount" /></div>
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-muted/30">
                        <TableCell>
                          {expense.receipt_url && (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(expense.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate">{expense.description || 'Expense'}</div>
                          {expense.notes && (
                            <div className="text-xs text-muted-foreground truncate">{expense.notes}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[expense.category] || 'bg-slate-100 text-slate-700'}>
                            {expense.category}
                          </Badge>
                          {expense.is_recurring && (
                            <Badge variant="outline" className="ml-1 text-[10px]">Recurring</Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {expense.payment_method.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {expense.reference_number || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {expense.added_by_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          KES {expense.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingExpense(expense)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <ExpenseFormDialog
                                open={!!editingExpense}
                                onClose={() => {
                                  setEditingExpense(null);
                                  setReceiptFile(null);
                                }}
                                onSubmit={handleSubmit}
                                isPending={updateExpense.isPending}
                                initialData={editingExpense}
                              />
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this expense?')) {
                                  deleteExpense.mutate(expense.id);
                                }
                              }}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {expense.receipt_url && (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{expense.description || 'Expense'}</p>
                          <Badge className={categoryColors[expense.category] || 'bg-slate-100 text-slate-700'}>
                            {expense.category}
                          </Badge>
                          {expense.is_recurring && (
                            <Badge variant="outline" className="text-[10px]">Recurring</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span className="capitalize">{expense.payment_method.replace('_', ' ')}</span>
                          {expense.reference_number && (
                            <>
                              <span>•</span>
                              <span>Ref: {expense.reference_number}</span>
                            </>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{expense.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">KES {expense.amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Added by {expense.added_by_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingExpense(expense)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <ExpenseFormDialog
                          open={!!editingExpense}
                          onClose={() => {
                            setEditingExpense(null);
                            setReceiptFile(null);
                          }}
                          onSubmit={handleSubmit}
                          isPending={updateExpense.isPending}
                          initialData={editingExpense}
                        />
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this expense?')) {
                            deleteExpense.mutate(expense.id);
                          }
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No expenses found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first expense to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExpenseFormDialog({ open, onClose, onSubmit, isPending, initialData }) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    category: initialData?.category || 'other',
    description: initialData?.description || '',
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    payment_method: initialData?.payment_method || 'cash',
    reference_number: initialData?.reference_number || '',
    notes: initialData?.notes || '',
    is_recurring: initialData?.is_recurring || false,
    receipt_url: initialData?.receipt_url || null,
  });
  const [receiptFile, setReceiptFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initialData ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Amount (KES) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What is this expense for?"
          />
        </div>

        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Payment Method *</Label>
          <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method} value={method} className="capitalize">
                  {method.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reference Number</Label>
          <Input
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            placeholder="Transaction ID, cheque number, etc."
          />
        </div>

        <div>
          <Label>Receipt (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            {receiptFile && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setReceiptFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {initialData?.receipt_url && !receiptFile && (
            <p className="text-xs text-muted-foreground mt-1">Current receipt will be kept</p>
          )}
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional details..."
            className="h-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_recurring"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="is_recurring" className="text-sm">This is a recurring expense</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : initialData ? 'Update' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}