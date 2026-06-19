import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Banknote, Smartphone, CreditCard, CheckCircle, Loader2, User, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DiscountPanel from './DiscountPanel';

const paymentMethods = [
  { id: 'cash',  label: 'Cash',   icon: Banknote,     color: 'bg-emerald-500' },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone,   color: 'bg-green-600'   },
  { id: 'card',  label: 'Card',   icon: CreditCard,   color: 'bg-blue-500'    },
];

export default function CheckoutDialog({ open, onClose, total, onComplete, isProcessing, preselectedCustomer }) {
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [receiptFields, setReceiptFields] = useState({ receipters_id: '', sms: '', whatsapp: '', email: '' });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    enabled: open,
  });

  // Auto-find customer by phone & pre-fill receipt fields
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const found = customers.find(c =>
        c.phone?.replace(/\s/g, '') === customerPhone.replace(/\s/g, '')
      );
      setSelectedCustomer(found || null);
      setReceiptFields(f => ({ ...f, sms: customerPhone, whatsapp: customerPhone, email: found?.email || f.email }));
    } else {
      setSelectedCustomer(null);
    }
  }, [customerPhone, customers]);

  // Reset redemption when customer changes
  useEffect(() => {
    setSelectedRedemption(null);
  }, [selectedCustomer?.id]);

  // Pre-fill from POS customer search selection
  useEffect(() => {
    if (open && preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
      setCustomerPhone(preselectedCustomer.phone || '');
      setReceiptFields(f => ({
        ...f,
        sms: preselectedCustomer.phone || f.sms,
        whatsapp: preselectedCustomer.phone || f.whatsapp,
        email: preselectedCustomer.email || f.email,
      }));
    }
  }, [open, preselectedCustomer?.id]);

  // Reset on dialog close
  useEffect(() => {
    if (!open) {
      setCashReceived('');
      setMpesaRef('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      setSelectedRedemption(null);
      setManualDiscount(0);
      setReceiptFields({ receipters_id: '', sms: '', whatsapp: '', email: '' });
      setMethod('cash');
    }
  }, [open]);

  const tier = selectedCustomer?.tier || 'bronze';
  const tierColors = {
    gold:     'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white',
    platinum: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
    silver:   'bg-gradient-to-r from-gray-300 to-gray-400 text-white',
    bronze:   'bg-muted text-muted-foreground',
  };

  const redemptionValue = selectedRedemption?.value || 0;
  const pointsRedeemed  = selectedRedemption?.points || 0;
  const finalTotal      = Math.max(0, Math.round(total) - manualDiscount - redemptionValue);
  const cashAmount      = parseFloat(cashReceived) || 0;
  const change          = cashAmount - finalTotal;

  const quickCashAmounts = [
    Math.ceil(finalTotal / 100) * 100,
    Math.ceil(finalTotal / 500) * 500,
    Math.ceil(finalTotal / 1000) * 1000,
    finalTotal,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= finalTotal).slice(0, 4);

  const canComplete = () => {
    if (method === 'mpesa') return mpesaRef.trim().length > 0;
    return true;
  };

  const handleComplete = () => {
    const effectiveCash = method === 'cash' ? (cashAmount || finalTotal) : undefined;
    onComplete({
      payment_method:  method,
      cash_received:   method === 'cash'  ? effectiveCash : undefined,
      change_given:    method === 'cash'  ? Math.max(0, (effectiveCash - finalTotal)) : undefined,
      mpesa_reference: method === 'mpesa' ? mpesaRef : undefined,
      customer_phone:  customerPhone || undefined,
      customer_name:   selectedCustomer?.name || undefined,
      customer_id:     selectedCustomer?.id   || undefined,
      loyalty_discount: (manualDiscount + redemptionValue) || undefined,
      points_redeemed:  pointsRedeemed || undefined,
      receipt_delivery: (() => {
        const d = {};
        if (receiptFields.receipters_id.trim()) d.receipters = receiptFields.receipters_id.trim();
        if (receiptFields.sms.trim()) d.sms = receiptFields.sms.trim();
        if (receiptFields.whatsapp.trim()) d.whatsapp = receiptFields.whatsapp.trim();
        if (receiptFields.email.trim()) d.email = receiptFields.email.trim();
        return Object.keys(d).length ? d : undefined;
      })(),
    });
  };

  const totalSavings = manualDiscount + redemptionValue;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[95vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="font-display text-xl">Checkout</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4 mt-4">
          {/* Amount Due */}
          <div className="text-center py-4 bg-gradient-to-br from-muted to-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount Due</p>
            {totalSavings > 0 && (
              <p className="text-sm text-muted-foreground line-through mt-1">
                KES {Math.round(total).toLocaleString()}
              </p>
            )}
            <p className="text-3xl font-display font-bold text-primary mt-1">
              KES {finalTotal.toLocaleString()}
            </p>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                Saving KES {totalSavings.toLocaleString()}
                {redemptionValue > 0 && ` (incl. ${pointsRedeemed.toLocaleString()} pts)`}
              </p>
            )}
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                Earn {Math.floor(finalTotal / 100)} pts on this sale
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
                  "flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all",
                  method === pm.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white", pm.color)}>
                  <pm.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Method-specific fields */}
          {method === 'cash' && (
            <div className="space-y-2">
              <Label className="text-xs">Cash Received</Label>
              <Input
                type="number"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                placeholder="0"
                className="text-lg font-semibold text-right"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {quickCashAmounts.map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setCashReceived(String(amt))} className="text-xs">
                    KES {amt.toLocaleString()}
                  </Button>
                ))}
              </div>
              {cashAmount >= finalTotal && cashAmount > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600">Change</p>
                  <p className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-300">
                    KES {Math.max(0, change).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {method === 'mpesa' && (
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
          )}

          {method === 'card' && (
            <div className="bg-muted rounded-xl p-4 text-center text-sm text-muted-foreground">
              Process card payment on terminal, then confirm below.
            </div>
          )}

          <Separator />

          {/* Customer lookup */}
          <div className="space-y-2">
            <Label className="text-xs">Customer Phone (optional)</Label>
            <Input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="0712 345 678"
            />
            {selectedCustomer && (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedCustomer.loyalty_points?.toLocaleString()} pts</p>
                  </div>
                </div>
                <Badge className={cn("text-[9px] font-bold px-1.5 py-0.5", tierColors[tier])}>
                  {tier.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {/* Discount & Loyalty Panel */}
          <DiscountPanel
            subtotal={Math.round(total)}
            manualDiscount={manualDiscount}
            onManualDiscountChange={setManualDiscount}
            customer={selectedCustomer}
            selectedRedemption={selectedRedemption}
            onRedemptionSelect={setSelectedRedemption}
          />

          {/* Receipt Delivery */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Send Digital Receipt</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <img src="https://media.base44.com/images/public/6a33d6d4855f7ebee919df0e/4f90efa3d_MAINLOGO2.png" alt="Receipters" className="h-3.5 object-contain" />
                  ID
                </Label>
                <div className="flex h-8">
                  <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-input bg-muted text-xs font-mono text-muted-foreground select-none">RCPT-</span>
                  <Input
                    value={receiptFields.receipters_id.replace(/^RCPT-/i, '')}
                    onChange={e => setReceiptFields(f => ({ ...f, receipters_id: 'RCPT-' + e.target.value.replace(/^RCPT-/i, '') }))}
                    placeholder="XXXXXXXX"
                    className="h-8 text-xs rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <span>✉️</span> Email
                </Label>
                <Input
                  type="email"
                  value={receiptFields.email}
                  onChange={e => setReceiptFields(f => ({ ...f, email: e.target.value }))}
                  placeholder="customer@email.com"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <span>💬</span> SMS
                </Label>
                <Input
                  type="tel"
                  value={receiptFields.sms}
                  onChange={e => setReceiptFields(f => ({ ...f, sms: e.target.value }))}
                  placeholder="0712 345 678"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                  <span>📱</span> WhatsApp
                </Label>
                <Input
                  type="tel"
                  value={receiptFields.whatsapp}
                  onChange={e => setReceiptFields(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="0712 345 678"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Complete */}
          <Button
            onClick={handleComplete}
            disabled={!canComplete() || isProcessing}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><CheckCircle className="w-5 h-5 mr-2" /> Complete Sale — KES {finalTotal.toLocaleString()}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}