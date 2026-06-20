import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Receipt, Eye, Calendar, RotateCcw, SlidersHorizontal, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReceiptView from '@/components/pos/ReceiptView';
import ReturnDialog from '@/components/pos/ReturnDialog';
import { Link } from 'react-router-dom';

const PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque', 'split'];

const SEARCH_PLACEHOLDERS = {
  all: 'Search receipt #, customer, cashier, product, M-Pesa ref...',
  receipt: 'Search by receipt number...',
  customer: 'Search by customer name...',
  cashier: 'Search by cashier name...',
  product: 'Search by product name...',
  mpesa: 'Search by M-Pesa reference...',
};

const paymentMethodLabel = (method) => {
  const labels = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Card', bank_transfer: 'Bank Transfer', cheque: 'Cheque', split: 'Split' };
  return labels[method] || method;
};

const paymentMethodColor = (method) => {
  const colors = {
    cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    mpesa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    bank_transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    cheque: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    split: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return colors[method] || '';
};

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSale, setSelectedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSale, setReturnSale] = useState(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 500),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => base44.entities.BusinessSettings.list(),
  });

  const cashiers = useMemo(() => [...new Set(sales.map(s => s.cashier_name).filter(Boolean))].sort(), [sales]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales.filter(s => {
      // Text search scoped to selected field
      if (q) {
        let textMatch = false;
        if (searchField === 'receipt' || searchField === 'all') textMatch = textMatch || s.receipt_number?.toLowerCase().includes(q);
        if (searchField === 'customer' || searchField === 'all') textMatch = textMatch || s.customer_name?.toLowerCase().includes(q);
        if (searchField === 'cashier' || searchField === 'all') textMatch = textMatch || s.cashier_name?.toLowerCase().includes(q);
        if (searchField === 'mpesa' || searchField === 'all') textMatch = textMatch || s.mpesa_reference?.toLowerCase().includes(q);
        if (searchField === 'product' || searchField === 'all') textMatch = textMatch || s.items?.some(item => item.product_name?.toLowerCase().includes(q));
        if (!textMatch) return false;
      }

      // Payment method
      if (paymentFilter !== 'all' && s.payment_method !== paymentFilter) return false;

      // Cashier
      if (cashierFilter !== 'all' && s.cashier_name !== cashierFilter) return false;

      // Date range
      const saleDate = new Date(s.created_date);
      if (dateFrom && saleDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (saleDate > toDate) return false;
      }

      // Amount range
      if (minAmount && (s.total_amount || 0) < parseFloat(minAmount)) return false;
      if (maxAmount && (s.total_amount || 0) > parseFloat(maxAmount)) return false;

      return true;
    });
  }, [sales, search, paymentFilter, cashierFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const totalRevenue = filtered.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const hasActiveFilters = paymentFilter !== 'all' || cashierFilter !== 'all' || dateFrom || dateTo || minAmount || maxAmount;

  const clearFilters = () => {
    setPaymentFilter('all');
    setCashierFilter('all');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} receipt{filtered.length !== 1 ? 's' : ''} · Total KES {totalRevenue.toLocaleString()}
          </p>
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          className="gap-2 relative"
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {[paymentFilter !== 'all', cashierFilter !== 'all', dateFrom, dateTo, minAmount, maxAmount].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Search bar with category dropdown */}
      <div className="flex gap-2">
        <Select value={searchField} onValueChange={(v) => { setSearchField(v); setSearch(''); }}>
          <SelectTrigger className="w-[160px] rounded-xl flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="receipt">Receipt #</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="cashier">Cashier</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="mpesa">M-Pesa Ref</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[searchField]}
            className="pl-10 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="bg-muted/40 border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{paymentMethodLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cashier */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cashier</label>
              <Select value={cashierFilter} onValueChange={setCashierFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All Cashiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {cashiers.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-lg" />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-lg" />
            </div>

            {/* Min Amount */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Min Amount (KES)</label>
              <Input type="number" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="rounded-lg" />
            </div>

            {/* Max Amount */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Max Amount (KES)</label>
              <Input type="number" placeholder="Any" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="rounded-lg" />
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {paymentFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPaymentFilter('all')}>
              {paymentMethodLabel(paymentFilter)} <X className="w-3 h-3" />
            </Badge>
          )}
          {cashierFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCashierFilter('all')}>
              {cashierFilter} <X className="w-3 h-3" />
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              <Calendar className="w-3 h-3" /> {dateFrom || '...'} → {dateTo || '...'} <X className="w-3 h-3" />
            </Badge>
          )}
          {(minAmount || maxAmount) && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => { setMinAmount(''); setMaxAmount(''); }}>
              KES {minAmount || '0'} – {maxAmount || '∞'} <X className="w-3 h-3" />
            </Badge>
          )}
          <button className="text-xs text-muted-foreground hover:text-foreground underline" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map(sale => (
            <div
              key={sale.id}
              className="bg-card rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => { setSelectedSale(sale); setReceiptOpen(true); }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold font-mono">{sale.receipt_number}</p>
                      <Badge variant="secondary" className={`text-[10px] ${paymentMethodColor(sale.payment_method)}`}>
                        {paymentMethodLabel(sale.payment_method)}
                      </Badge>
                      {sale.status === 'refunded' && (
                        <Badge variant="destructive" className="text-[10px]">Refunded</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(sale.created_date), 'MMM d, yyyy • h:mm a')}
                      </span>
                      <span>{sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''}</span>
                      {sale.cashier_name && <span>· {sale.cashier_name}</span>}
                      {sale.customer_name && <span>· {sale.customer_name}</span>}
                    </div>
                    {/* Product names preview */}
                    {sale.items?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate max-w-sm">
                        {sale.items.map(i => i.product_name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-base font-display font-bold">KES {sale.total_amount?.toLocaleString()}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    {sale.status === 'completed' && (
                      <button
                        onClick={e => { e.stopPropagation(); setReturnSale(sale); setReturnOpen(true); }}
                        className="ml-1 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Process Return"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ReceiptView
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={selectedSale}
        businessSettings={settings[0]}
      />

      <ReturnDialog
        open={returnOpen}
        onClose={() => { setReturnOpen(false); setReturnSale(null); }}
        sale={returnSale}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Link to="/inventory">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous: Inventory
          </Button>
        </Link>
        <Link to="/reports">
          <Button className="gap-2">
            Next: Reports
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}