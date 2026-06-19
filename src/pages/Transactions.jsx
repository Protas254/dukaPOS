import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Receipt, Eye, Calendar, RotateCcw, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReceiptView from '@/components/pos/ReceiptView';
import ReturnDialog from '@/components/pos/ReturnDialog';
import { Link } from 'react-router-dom';

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSale, setReturnSale] = useState(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 200),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => base44.entities.BusinessSettings.list(),
  });

  const cashiers = [...new Set(sales.map(s => s.cashier_name).filter(Boolean))].sort();

  let filtered = sales.filter(s =>
    s.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mpesa_reference?.toLowerCase().includes(search.toLowerCase())
  );
  if (paymentFilter !== 'all') {
    filtered = filtered.filter(s => s.payment_method === paymentFilter);
  }
  if (cashierFilter !== 'all') {
    filtered = filtered.filter(s => s.cashier_name === cashierFilter);
  }

  const totalRevenue = filtered.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const paymentMethodLabel = (method) => {
    const labels = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Card', split: 'Split' };
    return labels[method] || method;
  };

  const paymentMethodColor = (method) => {
    const colors = {
      cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      mpesa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      split: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return colors[method] || '';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Transactions</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {filtered.length} transactions • Total KES {totalRevenue.toLocaleString()}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by receipt #, customer, or M-Pesa ref..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cashierFilter} onValueChange={setCashierFilter}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Cashier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cashiers</SelectItem>
            {cashiers.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.map(sale => (
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono">{sale.receipt_number}</p>
                    <Badge variant="secondary" className={`text-[10px] ${paymentMethodColor(sale.payment_method)}`}>
                      {paymentMethodLabel(sale.payment_method)}
                    </Badge>
                    {sale.status === 'refunded' && (
                      <Badge variant="destructive" className="text-[10px]">Refunded</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(sale.created_date), 'MMM d, yyyy • h:mm a')}
                    </span>
                    <span>{sale.items?.length || 0} items</span>
                    {sale.cashier_name && <span>• {sale.cashier_name}</span>}
                  </div>
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
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No transactions found</p>
          </div>
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

      {/* Navigation Buttons */}
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