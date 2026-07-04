import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const REFUND_REASONS = [
  'Defective / damaged',
  'Wrong item received',
  'Customer changed mind',
  'Expired product',
  'Duplicate purchase',
  'Other',
];

export default function ReturnDialog({ open, onClose, sale }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const returnItems = (sale?.items || []).filter(i => (returnQtys[i.product_id] || 0) > 0);
  const refundTotal = returnItems.reduce((sum, i) => {
    const qty = returnQtys[i.product_id] || 0;
    return sum + (i.unit_price * qty);
  }, 0);

  const setQty = (productId, maxQty, delta) => {
    setReturnQtys(prev => {
      const current = prev[productId] || 0;
      const next = Math.min(maxQty, Math.max(0, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const returnMutation = useMutation({
    mutationFn: async () => {
      const finalReason = reason === 'Other' ? customReason : reason;

      // 1. Mark sale as refunded
      await api.entities.Sale.update(sale.id, {
        status: 'refunded',
        notes: `Return: ${finalReason}`,
      });

      // 2. Restore stock for each returned item
      await Promise.all(
        returnItems.map(async (item) => {
          const qty = returnQtys[item.product_id] || 0;
          if (!qty || !item.product_id) return;
          try {
            const product = await api.entities.Product.get(item.product_id);
            await api.entities.Product.update(item.product_id, {
              stock_quantity: (product.stock_quantity || 0) + qty,
            });
          } catch (_) { /* product may have been deleted */ }
        })
      );

      // 3. Email confirmation to customer if email is available
      let customerEmail = null;
      if (sale.customer_id) {
        try {
          const customer = await api.entities.Customer.get(sale.customer_id);
          customerEmail = customer?.email || null;
        } catch (_) { /* customer may have been deleted */ }
      }

      if (customerEmail) {
        const itemLines = returnItems.map(i =>
          `  - ${i.product_name} × ${returnQtys[i.product_id]} — KES ${(i.unit_price * returnQtys[i.product_id]).toLocaleString()}`
        ).join('\n');

        await api.integrations.Core.SendEmail({
          to: customerEmail,
          subject: `Refund Confirmation – Receipt ${sale.receipt_number}`,
          body: `Dear ${sale.customer_name || 'Customer'},\n\nYour return/refund has been successfully processed.\n\nReceipt: ${sale.receipt_number}\nReason: ${finalReason}\n\nReturned Items:\n${itemLines}\n\nRefund Total: KES ${Math.round(refundTotal).toLocaleString()}\n\nThe refund amount will be processed through your original payment method. If you have any questions, please contact us.\n\nThank you,\nThe Store Team`,
        });
      }

      return { emailSent: !!customerEmail };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Return processed',
        description: `Refund of KES ${Math.round(refundTotal).toLocaleString()} recorded and inventory updated.${result.emailSent ? ' Confirmation email sent to customer.' : ''}`,
      });
      handleClose();
    },
    onError: (err) => {
      toast({ title: 'Return failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleClose = () => {
    setReturnQtys({});
    setReason('');
    setCustomReason('');
    onClose();
  };

  const canSubmit = returnItems.length > 0 && (reason && reason !== 'Other' || (reason === 'Other' && customReason.trim()));

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[95vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 flex-shrink-0 border-b">
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-destructive" />
            Process Return
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{sale.receipt_number}</p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Items */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Items to Return</Label>
            {sale.items?.map((item) => {
              const qty = returnQtys[item.product_id] || 0;
              return (
                <div key={item.product_id} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  qty > 0 ? "border-destructive/40 bg-destructive/5" : "border-border"
                )}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      KES {item.unit_price?.toLocaleString()} × {item.quantity} sold
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQty(item.product_id, item.quantity, -1)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={cn("w-6 text-center text-sm font-bold", qty > 0 && "text-destructive")}>{qty}</span>
                    <button
                      onClick={() => setQty(item.product_id, item.quantity, +1)}
                      disabled={qty >= item.quantity}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refund total preview */}
          {returnItems.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm font-medium">Estimated Refund</span>
              <span className="text-lg font-display font-bold text-destructive">
                KES {Math.round(refundTotal).toLocaleString()}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Refund Reason</Label>
            <div className="flex flex-wrap gap-1.5">
              {REFUND_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                    reason === r
                      ? "bg-destructive text-white border-destructive"
                      : "border-border hover:border-destructive/50 hover:bg-destructive/5"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {reason === 'Other' && (
              <Textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Describe the return reason..."
                className="h-20 text-sm"
                autoFocus
              />
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>This will mark the sale as <strong>Refunded</strong> and restore returned items back to inventory. This action cannot be undone.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => returnMutation.mutate()}
            disabled={!canSubmit || returnMutation.isPending}
            className="flex-1 rounded-xl"
          >
            {returnMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><RotateCcw className="w-4 h-4 mr-2" /> Process Return</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}