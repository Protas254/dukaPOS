import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Printer, Hourglass, Star } from 'lucide-react';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ReceiptModal({ receipt, open, onClose }) {
  const receiptRef = useRef(null);

  if (!receipt) return null;

  // The receipt object might be a VaultDocument (receipt_data inside) or a Sale object directly.
  // We normalize it here.
  const data = receipt.receipt_data || receipt;
  const reference = receipt.reference_number || receipt.receipt_number || data.receipt_number || receipt.title || 'UNKNOWN';
  const amount = data.total_amount || receipt.amount || 0;
  const date = data.created_date || receipt.created_at || data.created_at || new Date().toISOString();
  const cashier = receipt.stored_by_name || data.cashier_name || 'System';

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("Generating receipt PDF...");
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80; // thermal receipt width standard 80mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, Math.max(imgHeight, 100)]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt-${reference}.pdf`);
      toast.success(`Receipt ${reference} downloaded!`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
      toast.error("Could not download receipt. Please try again.");
    }
  };

  const handlePrint = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("Preparing receipt for print...");
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Receipt - ${reference}</title>
              <style>
                body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #fff; }
                img { max-width: 80mm; width: 100%; height: auto; }
                @media print {
                  body { padding: 0; }
                  img { max-width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print(); setTimeout(() => window.close(), 500);" />
            </body>
          </html>
        `);
        printWin.document.close();
      }
    } catch (err) {
      console.error("Print failed:", err);
      toast.error("Could not send receipt to printer.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-slate-100 p-0 overflow-hidden flex flex-col h-[90vh] sm:h-[85vh]">
        <DialogHeader className="px-5 py-4 bg-white border-b border-slate-200">
          <DialogTitle className="text-slate-900 text-[15px] font-bold">
            {reference}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Receipt Tape */}
          <div ref={receiptRef} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm font-mono text-[13px] leading-tight text-slate-800">
            <div className="text-center space-y-1.5 mb-5">
              <p className="font-bold text-[15px] uppercase">QUICKMART SUPERMARKET</p>
              <p className="font-bold">*** TAX INVOICE ***</p>
            </div>
            
            <div className="border-b border-dashed border-slate-300 pb-3 mb-3 space-y-1.5">
              <div className="flex justify-between">
                <span>Invoice No.:</span>
                <span className="font-bold">{reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(date).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', '')}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{cashier.toLowerCase()}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between font-bold text-[11px] mb-2 text-slate-600">
                <span className="w-1/2">Description</span>
                <span className="w-1/6 text-right">Qty</span>
                <span className="w-[18%] text-right">Excl.Tax</span>
                <span className="w-1/5 text-right">Total</span>
              </div>
              {data.items?.map((item, idx) => {
                const exclTax = Math.round((item.total || 0) - (item.tax_amount || 0));
                return (
                  <div key={idx} className="mb-2">
                    <p className="truncate font-medium">{item.product_name}</p>
                    <div className="flex justify-between text-slate-500 text-[12px] mt-0.5">
                      <span className="w-1/2">@{item.unit_price}</span>
                      <span className="w-1/6 text-right">{item.quantity}</span>
                      <span className="w-[18%] text-right">{exclTax}</span>
                      <span className="w-1/5 text-right font-bold text-slate-800">{item.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-b border-dashed border-slate-300 pb-3 mb-3 space-y-1.5">
              <div className="flex justify-between">
                <span>Taxable Amt (B-16%):</span>
                <span>KES {Math.round((amount || 0) - (data.tax_total || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT 16%:</span>
                <span>KES {Math.round(data.tax_total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[15px] pt-2 mt-2 border-t border-dashed border-slate-300">
                <span>TOTAL (KES):</span>
                <span>{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 pb-3 mb-3 space-y-1.5">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase">{data.payment_method || 'CASH'}</span>
              </div>
              {(data.cash_received > 0) && (
                <div className="flex justify-between">
                  <span>Cash Received:</span>
                  <span>KES {data.cash_received.toLocaleString()}</span>
                </div>
              )}
              {(data.change_given !== undefined && data.change_given !== null) && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>KES {data.change_given.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-slate-300 pb-4 mb-4 text-center space-y-1.5">
              <p className="font-bold">KRA eTIMS</p>
              <p className="text-orange-500 font-medium flex items-center justify-center gap-1.5">
                <Hourglass className="w-4 h-4" /> Pending Submission
              </p>
              <p className="text-slate-500 text-[12px]">Verify: etims.kra.go.ke</p>
            </div>

            <div className="flex justify-center pb-4">
              <BarcodeDisplay value={reference} width={1.2} height={45} fontSize={11} />
            </div>

            <p className="text-center text-slate-500 text-[12px]">Thank you for shopping with us!</p>
          </div>

          {/* Rating Card */}
          <div className="bg-[#f5f8ff] border border-blue-100 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <Star className="w-4 h-4 fill-blue-600 text-blue-600" /> Rate Your Experience
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-7 h-7 text-slate-200 stroke-1" />)}
            </div>
            <Input placeholder="Your name (optional)" className="bg-white border-slate-200" />
            <textarea placeholder="Tell us what you think about your purchase..." className="w-full bg-white border border-slate-200 rounded-md p-3 text-sm h-24 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">Submit Feedback</Button>
          </div>
          
          <div className="text-center text-xs font-semibold text-slate-400 pb-2">
            Powered by Receipters Technologies Limited
          </div>
        </div>
        
        {/* Footer Buttons */}
        <div className="p-4 bg-white flex gap-3 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)] z-10">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 h-11 rounded-lg" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
