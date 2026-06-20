import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Receipt, Eye, Calendar, RotateCcw, SlidersHorizontal, X, ArrowLeft, ArrowRight, FileText, Clock, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import ReceiptView from '@/components/pos/ReceiptView';
import ReturnDialog from '@/components/pos/ReturnDialog';
import ReceiptPDFDialog from '@/components/transactions/ReceiptPDFDialog';
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
  const [showHistory, setShowHistory] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSale, setSelectedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSale, setReturnSale] = useState(null);
  const [pdfSale, setPdfSale] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filtered.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transaction History ({filtered.length})</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? (
              <><ChevronUp className="w-4 h-4" /> Hide</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Show</>
            )}
          </Button>
        </div>
        {showHistory && (
        <>
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
          paginatedSales.map(sale => {
            const daysSinceSale = differenceInDays(new Date(), new Date(sale.created_date));
            const daysLeft = 30 - daysSinceSale;
            const canReturn = sale.status === 'completed' && daysLeft > 0;
            const returnExpired = sale.status === 'completed' && daysLeft <= 0;

            return (
              <div
                key={sale.id}
                className="bg-card rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => { setSelectedSale(sale); setReceiptOpen(true); }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                        {sale.status === 'refunded' && <Badge variant="destructive" className="text-[10px]">Refunded</Badge>}
                        {sale.status === 'voided' && <Badge variant="secondary" className="text-[10px]">Voided</Badge>}
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
                      {sale.items?.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate max-w-sm">
                          {sale.items.map(i => i.product_name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <p className="text-base font-display font-bold">KES {sale.total_amount?.toLocaleString()}</p>

                    {/* PDF button */}
                    <button
                      onClick={e => { e.stopPropagation(); setPdfSale(sale); setPdfOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                      title="View / Download PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Return/Refund button */}
                    {canReturn && (
                      <button
                        onClick={e => { e.stopPropagation(); setReturnSale(sale); setReturnOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Return/Refund
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-destructive/10 text-[10px] font-bold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {daysLeft}d left
                        </span>
                      </button>
                    )}
                    {returnExpired && (
                      <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium cursor-not-allowed">
                        <Clock className="w-3.5 h-3.5" />
                        Return expired
                      </span>
                    )}
                    {sale.status === 'refunded' && (
                      <span className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                        Already refunded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        </>
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

      <ReceiptPDFDialog
        open={pdfOpen}
        onClose={() => { setPdfOpen(false); setPdfSale(null); }}
        sale={pdfSale}
        businessSettings={settings[0]}
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