import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceiptView({ open, onClose, sale, businessSettings }) {
  if (!sale) return null;

  const biz = businessSettings || {};
  const taxableAmt = (sale.total_amount || 0) - (sale.tax_total || 0);

  const etimsStatusLabel = {
    submitted: { text: '✓ Submitted to KRA', cls: 'text-emerald-600' },
    failed: { text: '✗ Submission Failed', cls: 'text-destructive' },
    not_submitted: { text: '⏳ Pending Submission', cls: 'text-amber-600' },
  };
  const etimsLabel = etimsStatusLabel[sale.etims_status || 'not_submitted'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Success indicator */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-display font-bold text-lg">Payment Successful!</h2>
          </div>

          {/* Receipt */}
          <div className="border rounded-xl p-4 space-y-2 bg-muted/30 font-mono text-xs" id="receipt-content">

            {/* Business Header */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed">
              <p className="font-bold text-sm uppercase tracking-wide">{biz.business_name || 'SoftPOS Store'}</p>
              {biz.business_address && <p>{biz.business_address}</p>}
              {biz.business_phone && <p>Tel: {biz.business_phone}</p>}
              {biz.business_email && <p>{biz.business_email}</p>}
              {biz.kra_pin && <p className="font-bold">KRA PIN: {biz.kra_pin}</p>}
              <p className="font-bold text-sm pt-1">*** TAX INVOICE ***</p>
            </div>

            {/* Invoice meta */}
            <div className="space-y-0.5 py-1 border-b border-dashed">
              <div className="flex justify-between">
                <span>Invoice No.:</span>
                <span className="font-bold">{sale.receipt_number}</span>
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
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-1 border-b border-dashed">
              {/* Column headers */}
              <div className="grid grid-cols-12 text-[10px] font-bold mb-1 text-muted-foreground">
                <span className="col-span-5">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Excl.</span>
                <span className="col-span-1 text-right">Tax</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {sale.items?.map((item, i) => {
                const exclVat = Math.round((item.total || 0) - (item.tax_amount || 0));
                return (
                  <div key={i} className="mb-1.5">
                    <p className="font-medium leading-tight">{item.product_name}</p>
                    <div className="grid grid-cols-12 text-[10px] text-muted-foreground">
                      <span className="col-span-5">@{item.unit_price?.toLocaleString()}</span>
                      <span className="col-span-2 text-right">{item.quantity}</span>
                      <span className="col-span-2 text-right">{exclVat.toLocaleString()}</span>
                      <span className="col-span-1 text-right">{Math.round(item.tax_amount || 0).toLocaleString()}</span>
                      <span className="col-span-2 text-right font-medium text-foreground">{item.total?.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VAT Summary */}
            <div className="space-y-0.5 py-1 border-b border-dashed">
              <div className="flex justify-between">
                <span>Taxable Amt (B-16%):</span>
                <span>KES {Math.round(taxableAmt).toLocaleString()}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span>-KES {sale.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT 16%:</span>
                <span>KES {Math.round(sale.tax_total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed mt-1">
                <span>TOTAL (KES):</span>
                <span>{sale.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-0.5 py-1 border-b border-dashed">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-medium">
                  {sale.payment_method === 'mpesa' ? 'M-PESA' : sale.payment_method}
                </span>
              </div>
              {sale.cash_received > 0 && (
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

            {/* eTIMS / CUIN */}
            <div className="space-y-0.5 py-1 border-b border-dashed text-center">
              <p className="font-bold">KRA eTIMS</p>
              {sale.cuin && (
                <div className="flex justify-between">
                  <span>CUIN:</span>
                  <span className="font-bold">{sale.cuin}</span>
                </div>
              )}
              <p className={etimsLabel.cls + ' text-[10px]'}>{etimsLabel.text}</p>
              <p className="text-muted-foreground text-[10px]">Verify: etims.kra.go.ke</p>
            </div>

            {/* Footer */}
            <p className="text-center text-muted-foreground pt-1">
              {biz.receipt_footer || 'Thank you for shopping with us!'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <Button onClick={() => window.print()} className="flex-1">
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}