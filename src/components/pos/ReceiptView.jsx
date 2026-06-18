import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceiptView({ open, onClose, sale, businessSettings }) {
  if (!sale) return null;

  const biz = businessSettings || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Success header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-display font-bold text-lg">Payment Successful!</h2>
          </div>

          {/* Receipt */}
          <div className="border rounded-xl p-4 space-y-3 bg-muted/30 font-mono text-xs" id="receipt-content">
            {/* Business header */}
            <div className="text-center space-y-0.5">
              <p className="font-bold text-sm font-display">{biz.business_name || 'SoftPOS Store'}</p>
              {biz.business_address && <p>{biz.business_address}</p>}
              {biz.business_phone && <p>Tel: {biz.business_phone}</p>}
              {biz.kra_pin && <p>KRA PIN: {biz.kra_pin}</p>}
            </div>

            <Separator className="border-dashed" />

            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-semibold">{sale.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(sale.created_date), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            {sale.cashier_name && (
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashier_name}</span>
              </div>
            )}

            <Separator className="border-dashed" />

            {/* Items */}
            <div className="space-y-1.5">
              {sale.items?.map((item, i) => (
                <div key={i}>
                  <p className="font-medium">{item.product_name}</p>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{item.quantity} × KES {item.unit_price?.toLocaleString()}</span>
                    <span>KES {item.total?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KES {sale.subtotal?.toLocaleString()}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span>-KES {sale.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (incl.):</span>
                <span>KES {sale.tax_total?.toLocaleString()}</span>
              </div>
              <Separator className="border-dashed" />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span>KES {sale.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-medium">
                  {sale.payment_method === 'mpesa' ? 'M-PESA' : sale.payment_method}
                </span>
              </div>
              {sale.cash_received && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>KES {sale.cash_received?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>KES {sale.change_given?.toLocaleString()}</span>
                  </div>
                </>
              )}
              {sale.mpesa_reference && (
                <div className="flex justify-between">
                  <span>M-Pesa Ref:</span>
                  <span className="font-semibold">{sale.mpesa_reference}</span>
                </div>
              )}
            </div>

            <Separator className="border-dashed" />

            <p className="text-center text-muted-foreground">
              {biz.receipt_footer || 'Thank you for shopping with us!'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-1" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}