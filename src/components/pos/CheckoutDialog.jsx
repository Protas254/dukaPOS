import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Banknote, Smartphone, CreditCard, CheckCircle, Loader2, User, Gift, Building2, FileText, Split, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DiscountPanel from './DiscountPanel';

const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash',          subtitle: 'Physical notes/coins', icon: Banknote,   activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', iconBg: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'mpesa',         label: 'M-Pesa',        subtitle: 'Mobile money',         icon: Smartphone, activeColor: 'border-green-600 bg-green-50 dark:bg-green-900/20',     iconBg: 'bg-green-600',   textColor: 'text-green-700 dark:text-green-300'   },
  { id: 'card',          label: 'Card',          subtitle: 'Credit / debit',       icon: CreditCard, activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',       iconBg: 'bg-blue-500',    textColor: 'text-blue-700 dark:text-blue-300'     },
  { id: 'bank_transfer', label: 'Bank Transfer', subtitle: 'Wire / EFT',           icon: Building2,  activeColor: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-500',  textColor: 'text-indigo-700 dark:text-indigo-300' },
  { id: 'cheque',        label: 'Cheque',        subtitle: 'Paper cheque',         icon: FileText,   activeColor: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-500',  textColor: 'text-orange-700 dark:text-orange-300' },
  { id: 'split',         label: 'Split',         subtitle: 'Multiple methods',     icon: Split,      activeColor: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-500',  textColor: 'text-purple-700 dark:text-purple-300' },
];

const SPLIT_METHODS = [
  { id: 'cash',          label: 'Cash',          icon: Banknote  },
  { id: 'mpesa',         label: 'M-Pesa',        icon: Smartphone },
  { id: 'card',          label: 'Card',          icon: CreditCard },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2  },
];

function SplitPaymentRow({ entry, index, onUpdate, onRemove, remaining }) {
  return (
    <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-2">
      <select
        value={entry.method}
        onChange={e => onUpdate(index, 'method', e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {SPLIT_METHODS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      <Input
        type="number"
        value={entry.amount}
        onChange={e => onUpdate(index, 'amount', e.target.value)}
        placeholder="Amount"
        className="h-8 text-xs flex-1"
      />
      {(entry.method === 'mpesa' || entry.method === 'bank_transfer') && (
        <Input
          value={entry.reference}
          onChange={e => onUpdate(index, 'reference', e.target.value)}
          placeholder="Ref #"
          className="h-8 text-xs flex-1 font-mono uppercase"
        />
      )}
      <button onClick={() => onRemove(index)} className="text-destructive hover:text-destructive/80 p-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CheckoutDialog({ open, onClose, total, onComplete, isProcessing, preselectedCustomer }) {
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [splitEntries, setSplitEntries] = useState([
    { method: 'cash', amount: '', reference: '' },
    { method: 'mpesa', amount: '', reference: '' },
  ]);
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

  useEffect(() => {
    setSelectedRedemption(null);
  }, [selectedCustomer?.id]);

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

  useEffect(() => {
    if (!open) {
      setCashReceived(''); setMpesaRef(''); setBankRef(''); setChequeNumber('');
      setCustomerPhone(''); setSelectedCustomer(null); setSelectedRedemption(null);
      setManualDiscount(0);
      setReceiptFields({ receipters_id: '', sms: '', whatsapp: '', email: '' });
      setMethod('cash');
      setSplitEntries([{ method: 'cash', amount: '', reference: '' }, { method: 'mpesa', amount: '', reference: '' }]);
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

  const splitTotal = splitEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const splitRemaining = finalTotal - splitTotal;

  const quickCashAmounts = [
    Math.ceil(finalTotal / 100) * 100,
    Math.ceil(finalTotal / 500) * 500,
    Math.ceil(finalTotal / 1000) * 1000,
    finalTotal,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= finalTotal).slice(0, 4);

  const canComplete = () => {
    if (method === 'mpesa') return mpesaRef.trim().length > 0;
    if (method === 'bank_transfer') return bankRef.trim().length > 0;
    if (method === 'cheque') return chequeNumber.trim().length > 0;
    if (method === 'split') {
      return splitEntries.length >= 2 &&
        Math.abs(splitRemaining) < 1 &&
        splitEntries.every(e => parseFloat(e.amount) > 0);
    }
    return true;
  };

  const updateSplitEntry = (index, field, value) => {
    setSplitEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const addSplitEntry = () => {
    setSplitEntries(prev => [...prev, { method: 'cash', amount: '', reference: '' }]);
  };

  const removeSplitEntry = (index) => {
    setSplitEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    const effectiveCash = method === 'cash' ? (cashAmount || finalTotal) : undefined;
    onComplete({
      payment_method:  method,
      cash_received:   method === 'cash'  ? effectiveCash : undefined,
      change_given:    method === 'cash'  ? Math.max(0, (effectiveCash - finalTotal)) : undefined,
      mpesa_reference: method === 'mpesa' ? mpesaRef : undefined,
      bank_reference:  method === 'bank_transfer' ? bankRef : undefined,
      cheque_number:   method === 'cheque' ? chequeNumber : undefined,
      split_payments:  method === 'split' ? splitEntries.map(e => ({
        method: e.method,
        amount: parseFloat(e.amount) || 0,
        reference: e.reference || undefined,
      })) : undefined,
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
              <p className="text-sm text-muted-foreground line-through mt-1">KES {Math.round(total).toLocaleString()}</p>
            )}
            <p className="text-3xl font-display font-bold text-primary mt-1">KES {finalTotal.toLocaleString()}</p>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                Saving KES {totalSavings.toLocaleString()}
                {redemptionValue > 0 && ` (incl. ${pointsRedeemed.toLocaleString()} pts)`}
              </p>
            )}
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Earn {Math.floor(finalTotal / 100)} pts on this sale</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(pm => {
                const isSelected = method === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left w-full",
                      isSelected
                        ? cn("shadow-md", pm.activeColor)
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm", pm.iconBg)}>
                      <pm.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight", isSelected ? pm.textColor : 'text-foreground')}>{pm.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{pm.subtitle}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className={cn("w-4 h-4 ml-auto flex-shrink-0", pm.textColor)} />
                    )}
                  </button>
                );
              })}
            </div>
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
              <Label className="text-xs">M-Pesa Transaction Code *</Label>
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center text-sm text-blue-700 dark:text-blue-300">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-70" />
              Process card payment on your terminal, then confirm below.
            </div>
          )}

          {method === 'bank_transfer' && (
            <div>
              <Label className="text-xs">Bank Transfer Reference / Transaction ID *</Label>
              <Input
                value={bankRef}
                onChange={e => setBankRef(e.target.value.toUpperCase())}
                placeholder="e.g. TXN20240619001"
                className="mt-1 font-mono uppercase"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-1">Enter the bank reference number from the customer's transfer confirmation.</p>
            </div>
          )}

          {method === 'cheque' && (
            <div>
              <Label className="text-xs">Cheque Number *</Label>
              <Input
                value={chequeNumber}
                onChange={e => setChequeNumber(e.target.value)}
                placeholder="e.g. 000123"
                className="mt-1 font-mono"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-1">Record the cheque number printed on the face of the cheque.</p>
            </div>
          )}

          {method === 'split' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Split Payment Breakdown</Label>
                <div className={cn("text-xs font-semibold", Math.abs(splitRemaining) < 1 ? 'text-emerald-600' : 'text-destructive')}>
                  {Math.abs(splitRemaining) < 1 ? '✓ Balanced' : `KES ${Math.round(splitRemaining).toLocaleString()} remaining`}
                </div>
              </div>
              {splitEntries.map((entry, i) => (
                <SplitPaymentRow
                  key={i}
                  entry={entry}
                  index={i}
                  onUpdate={updateSplitEntry}
                  onRemove={removeSplitEntry}
                  remaining={splitRemaining}
                />
              ))}
              <button
                onClick={addSplitEntry}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add another method
              </button>
              <div className="bg-muted/50 rounded-lg px-3 py-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Total entered</span>
                <span className="font-semibold">KES {Math.round(splitTotal).toLocaleString()} / {finalTotal.toLocaleString()}</span>
              </div>
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
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">✉️ Email</Label>
                <Input type="email" value={receiptFields.email} onChange={e => setReceiptFields(f => ({ ...f, email: e.target.value }))} placeholder="customer@email.com" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">💬 SMS</Label>
                <Input type="tel" value={receiptFields.sms} onChange={e => setReceiptFields(f => ({ ...f, sms: e.target.value }))} placeholder="0712 345 678" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">📱 WhatsApp</Label>
                <Input type="tel" value={receiptFields.whatsapp} onChange={e => setReceiptFields(f => ({ ...f, whatsapp: e.target.value }))} placeholder="0712 345 678" className="h-8 text-xs" />
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