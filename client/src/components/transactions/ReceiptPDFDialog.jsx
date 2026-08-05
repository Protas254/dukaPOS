import React, { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Printer } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function ReceiptPDFDialog({ open, onClose, sale, businessSettings }) {
  const receiptRef = useRef(null);

  if (!sale) return null;
  const biz = businessSettings || {};
  const taxableAmt = (sale.total_amount || 0) - (sale.tax_total || 0);

  const etimsStatusLabel = {
    submitted: { text: '✓ Submitted to KRA', color: '#059669' },
    failed: { text: '✗ Submission Failed', color: '#dc2626' },
    not_submitted: { text: '⏳ Pending Submission', color: '#d97706' },
  };
  const etimsInfo = etimsStatusLabel[sale.etims_status || 'not_submitted'];

  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 220], orientation: 'portrait' });
    const W = 80;
    let y = 8;
    const lineH = 4.5;
    const smallH = 3.8;

    const center = (text, yPos, size = 8, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(text, W / 2, yPos, { align: 'center' });
    };
    const row = (left, right, yPos, size = 7.5, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(String(left), 4, yPos);
      doc.text(String(right), W - 4, yPos, { align: 'right' });
    };
    const dashedLine = (yPos) => {
      doc.setLineDashPattern([1, 1], 0);
      doc.setLineWidth(0.2);
      doc.line(4, yPos, W - 4, yPos);
      doc.setLineDashPattern([], 0);
    };

    // Header
    center(biz.business_name || 'Receipters Store', y, 10, true); y += lineH + 1;
    if (biz.business_address) { center(biz.business_address, y, 7); y += smallH; }
    if (biz.business_phone) { center(`Tel: ${biz.business_phone}`, y, 7); y += smallH; }
    if (biz.business_email) { center(biz.business_email, y, 7); y += smallH; }
    if (biz.kra_pin) { center(`KRA PIN: ${biz.kra_pin}`, y, 7, true); y += smallH; }
    center('*** TAX INVOICE ***', y, 8, true); y += lineH;
    dashedLine(y); y += 3;

    // Meta
    row('Invoice No.:', sale.receipt_number, y, 7.5, true); y += lineH;
    row('Date:', format(new Date(sale.created_date), 'dd/MM/yyyy HH:mm'), y); y += lineH;
    if (sale.cashier_name) { row('Cashier:', sale.cashier_name, y); y += lineH; }
    if (sale.customer_name) { row('Customer:', sale.customer_name, y); y += lineH; }
    dashedLine(y); y += 3;

    // Items header
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 4, y);
    doc.text('Qty', 38, y, { align: 'right' });
    doc.text('Excl.', 53, y, { align: 'right' });
    doc.text('Tax', 64, y, { align: 'right' });
    doc.text('Total', W - 4, y, { align: 'right' });
    y += 3;
    dashedLine(y); y += 2.5;

    // Items
    (sale.items || []).forEach(item => {
      const exclVat = Math.round((item.total || 0) - (item.tax_amount || 0));
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(item.product_name || '', 4, y);
      y += 3.5;
      doc.setFontSize(6.5);
      doc.text(`@${(item.unit_price || 0).toLocaleString()}`, 4, y);
      doc.text(String(item.quantity), 38, y, { align: 'right' });
      doc.text(exclVat.toLocaleString(), 53, y, { align: 'right' });
      doc.text(Math.round(item.tax_amount || 0).toLocaleString(), 64, y, { align: 'right' });
      doc.text((item.total || 0).toLocaleString(), W - 4, y, { align: 'right' });
      y += 4;
    });

    dashedLine(y); y += 3;

    // Totals
    row('Taxable Amt (B-16%):', `KES ${Math.round(taxableAmt).toLocaleString()}`, y); y += lineH;
    if (sale.discount_amount > 0) { row('Discount:', `-KES ${(sale.discount_amount || 0).toLocaleString()}`, y); y += lineH; }
    row('VAT 16%:', `KES ${Math.round(sale.tax_total || 0).toLocaleString()}`, y); y += lineH;
    dashedLine(y); y += 2.5;
    row('TOTAL (KES):', (sale.total_amount || 0).toLocaleString(), y, 9, true); y += lineH + 1;
    dashedLine(y); y += 3;

    // Payment
    row('Payment:', sale.payment_method === 'mpesa' ? 'M-PESA' : (sale.payment_method || '').toUpperCase(), y); y += lineH;
    if (sale.cash_received > 0) {
      row('Cash Received:', `KES ${(sale.cash_received || 0).toLocaleString()}`, y); y += lineH;
      row('Change:', `KES ${(sale.change_given || 0).toLocaleString()}`, y); y += lineH;
    }
    if (sale.mpesa_reference) { row('M-Pesa Ref:', sale.mpesa_reference, y); y += lineH; }
    dashedLine(y); y += 3;

    // eTIMS
    center('KRA eTIMS', y, 7.5, true); y += lineH;
    if (sale.cuin) { row('CUIN:', sale.cuin, y, 7.5, true); y += lineH; }
    doc.setTextColor(
      parseInt(etimsInfo.color.slice(1, 3), 16),
      parseInt(etimsInfo.color.slice(3, 5), 16),
      parseInt(etimsInfo.color.slice(5, 7), 16)
    );
    center(etimsInfo.text, y, 6.5); y += smallH;
    doc.setTextColor(0, 0, 0);
    center('Verify: etims.kra.go.ke', y, 6); y += lineH;
    dashedLine(y); y += 3;

    // Footer
    center(biz.receipt_footer || 'Thank you for shopping with us!', y, 7);

    // Resize height
    const finalHeight = y + 10;
    const doc2 = new jsPDF({ unit: 'mm', format: [80, finalHeight], orientation: 'portrait' });
    doc2.setFontSize(8);

    // Recreate on properly-sized doc
    const docFinal = new jsPDF({ unit: 'mm', format: [80, finalHeight], orientation: 'portrait' });
    docFinal.setFont('helvetica', 'normal');

    // Copy all pages from original
    const pdfData = doc.output('arraybuffer');
    doc.save(`receipt_${sale.receipt_number}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="font-display font-bold text-base">Receipt Preview</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={printReceipt}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={generatePDF}>
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="overflow-y-auto flex-1 p-4 bg-muted/30">
          <div
            ref={receiptRef}
            className="bg-white mx-auto border shadow-md rounded font-mono text-[11px] leading-relaxed p-5 max-w-[300px] print:shadow-none print:border-none"
            id="pdf-receipt-content"
          >
            {/* Business Header */}
            <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-gray-400">
              <p className="font-bold text-sm uppercase tracking-wide">{biz.business_name || 'Receipters Store'}</p>
              {biz.business_address && <p className="text-gray-600">{biz.business_address}</p>}
              {biz.business_phone && <p className="text-gray-600">Tel: {biz.business_phone}</p>}
              {biz.business_email && <p className="text-gray-600">{biz.business_email}</p>}
              {biz.kra_pin && <p className="font-bold">KRA PIN: {biz.kra_pin}</p>}
              <p className="font-bold text-sm pt-1">*** TAX INVOICE ***</p>
            </div>

            {/* Invoice Meta */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between"><span>Invoice No.:</span><span className="font-bold">{sale.receipt_number}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{format(new Date(sale.created_date), 'dd/MM/yyyy HH:mm')}</span></div>
              {sale.cashier_name && <div className="flex justify-between"><span>Cashier:</span><span>{sale.cashier_name}</span></div>}
              {sale.customer_name && <div className="flex justify-between"><span>Customer:</span><span>{sale.customer_name}</span></div>}
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="grid grid-cols-12 text-[9px] font-bold mb-1 text-gray-500">
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
                    <p className="font-medium">{item.product_name}</p>
                    <div className="grid grid-cols-12 text-[9px] text-gray-500">
                      <span className="col-span-5">@{item.unit_price?.toLocaleString()}</span>
                      <span className="col-span-2 text-right">{item.quantity}</span>
                      <span className="col-span-2 text-right">{exclVat.toLocaleString()}</span>
                      <span className="col-span-1 text-right">{Math.round(item.tax_amount || 0).toLocaleString()}</span>
                      <span className="col-span-2 text-right font-medium text-black">{item.total?.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VAT Summary */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between"><span>Taxable Amt (B-16%):</span><span>KES {Math.round(taxableAmt).toLocaleString()}</span></div>
              {sale.discount_amount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-KES {sale.discount_amount?.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span>VAT 16%:</span><span>KES {Math.round(sale.tax_total || 0).toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-400 mt-1">
                <span>TOTAL (KES):</span><span>{sale.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-medium uppercase">{sale.payment_method === 'mpesa' ? 'M-PESA' : sale.payment_method}</span>
              </div>
              {sale.cash_received > 0 && <>
                <div className="flex justify-between"><span>Cash Received:</span><span>KES {sale.cash_received?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Change:</span><span>KES {sale.change_given?.toLocaleString()}</span></div>
              </>}
              {sale.mpesa_reference && <div className="flex justify-between"><span>M-Pesa Ref:</span><span className="font-semibold">{sale.mpesa_reference}</span></div>}
            </div>

            {/* eTIMS */}
            <div className="py-2 border-b border-dashed border-gray-400 text-center space-y-0.5">
              <p className="font-bold">KRA eTIMS</p>
              {sale.cuin && <div className="flex justify-between"><span>CUIN:</span><span className="font-bold">{sale.cuin}</span></div>}
              <p className="text-[9px]" style={{ color: etimsInfo.color }}>{etimsInfo.text}</p>
              <p className="text-gray-400 text-[9px]">Verify: etims.kra.go.ke</p>
            </div>

            {/* Footer */}
            <p className="text-center text-gray-500 pt-2">{biz.receipt_footer || 'Thank you for shopping with us!'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-3 border-t flex-shrink-0 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1"><X className="w-4 h-4 mr-1" /> Close</Button>
          <Button onClick={generatePDF} className="flex-1 gap-1.5"><Download className="w-4 h-4" /> Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}