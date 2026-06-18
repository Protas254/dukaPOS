import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, Smartphone, CreditCard, CheckCircle, Loader2, User, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'bg-green-600' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
];

export default function CheckoutDialog({ open, onClose, total, onComplete, isProcessing }) {
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    enabled: open,
  });

  // Auto-find customer by phone
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const found = customers.find(c => 
        c.phone?.replace(/\s/g, '') === customerPhone.replace(/\s/g, '')
      );
      setSelectedCustomer(found || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [customerPhone, customers]);

  const customerName = selectedCustomer?.name || '';
  const loyaltyPoints = selectedCustomer?.loyalty_points || 0;
  const tier = selectedCustomer?.tier || 'bronze';

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - displayTotal;

  const canComplete = () => {
    if (method === 'cash') return cashAmount >= displayTotal;
    if (method === 'mpesa') return mpesaRef.trim().length > 0;
    return true;
  };

  const handleComplete = () => {
    onComplete({
      payment_method: method,
      cash_received: method === 'cash' ? cashAmount : undefined,
      change_given: method === 'cash' ? Math.max(0, change) : undefined,
      mpesa_reference: method === 'mpesa' ? mpesaRef : undefined,
      customer_phone: customerPhone || undefined,
      customer_name: customerName || undefined,
      customer_id: selectedCustomer?.id || undefined,
    });
  };

  const displayTotal = Math.round(total);

  const quickCashAmounts = [
    Math.ceil(displayTotal / 100) * 100,
    Math.ceil(displayTotal / 500) * 500,
    Math.ceil(displayTotal / 1000) * 1000,
    displayTotal
  ].filter((v, i, a) => a.indexOf(v) === i && v >= displayTotal).slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-display text-xl">Checkout</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Total & Points */}
          <div className="text-center py-4 bg-gradient-to-br from-muted to-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount Due</p>
            <p className="text-3xl font-display font-bold text-primary mt-1">
              KES {displayTotal.toLocaleString()}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Earn {Math.floor(displayTotal / 100)} pts
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                  method === pm.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", pm.color)}>
                  <pm.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Method-specific fields */}
          {method === 'cash' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Cash Received</Label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="text-lg font-semibold text-right mt-1"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {quickCashAmounts.map(amt => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived(String(amt))}
                    className="text-xs"
                  >
                    KES {amt.toLocaleString()}
                  </Button>
                ))}
              </div>
              {cashAmount >= displayTotal && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Change</p>
                  <p className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-300">
                    KES {Math.max(0, change).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {method === 'mpesa' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">M-Pesa Transaction Code</Label>
                <Input
                  value={mpesaRef}
                  onChange={e => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. SHK7YJ89GH"
                  className="mt-1 font-mono uppercase"
                  autoFocus
                />
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="bg-muted rounded-xl p-4 text-center text-sm text-muted-foreground">
              Process card payment on terminal, then confirm below.
            </div>
          )}

          <Separator />

          {/* Customer info - only show if not already entered for M-Pesa */}
          {method !== 'mpesa' && (
            <div className="space-y-2">
              <Label className="text-xs">Customer Phone (for loyalty points)</Label>
              <Input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="0712 345 678"
                className="mt-1"
              />
              {selectedCustomer && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-primary" />
                    <div>
                      <span className="text-xs font-semibold block">{selectedCustomer.name}</span>
                      <span className="text-[10px] text-muted-foreground">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5",
                    tier === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md' : 
                    tier === 'platinum' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-md' : 
                    tier === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-sm' :
                    'bg-muted'
                  )}>
                    {tier.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background rounded-md p-2 border">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-1">
                      <Gift className="w-2.5 h-2.5" />
                      <span>Current</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{loyaltyPoints.toLocaleString()}</p>
                  </div>
                  <div className="bg-background rounded-md p-2 border border-primary/30">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-1">
                      <Gift className="w-2.5 h-2.5 text-primary" />
                      <span>After</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{(loyaltyPoints + Math.floor(displayTotal / 100)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Complete */}
          <Button
            onClick={handleComplete}
            disabled={!canComplete() || isProcessing}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Sale — KES {displayTotal.toLocaleString()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}