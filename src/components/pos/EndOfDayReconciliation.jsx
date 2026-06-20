import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle, AlertTriangle, Printer, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import ShiftAuditDialog from '@/components/shifts/ShiftAuditDialog';
import { toast } from 'sonner';

export default function EndOfDayReconciliation({ open, onClose, sales = [], shift }) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_date).toDateString() === today);

  const expectedCash = useMemo(() => todaySales
    .filter(s => s.payment_method === 'cash')
    .reduce((sum, s) => sum + (s.total_amount || 0), 0), [todaySales]);

  const mpesaTotal = useMemo(() => todaySales
    .filter(s => s.payment_method === 'mpesa')
    .reduce((sum, s) => sum + (s.total_amount || 0), 0), [todaySales]);

  const cardTotal = useMemo(() => todaySales
    .filter(s => s.payment_method === 'card')
    .reduce((sum, s) => sum + (s.total_amount || 0), 0), [todaySales]);

  const totalRevenue = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const actual = parseFloat(actualCash) || 0;
  const variance = actual - expectedCash;
  const isBalanced = Math.abs(variance) < 1;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>End of Day Report</title>
      <style>body{font-family:monospace;padding:20px;max-width:400px}h2{text-align:center}table{width:100%}td{padding:4px 0}td:last-child{text-align:right;font-weight:bold}.total{border-top:2px solid #000;font-size:1.1em}.variance{color:${isBalanced?'green':'red'}}</style>
      </head><body>
      <h2>End of Day Report</h2>
      <p style="text-align:center">${new Date().toLocaleString()}</p>
      <p style="text-align:center">${shift?.cashier_name || 'Cashier'}</p>
      <hr/>
      <table>
        <tr><td>Total Transactions</td><td>${todaySales.length}</td></tr>
        <tr><td>Total Revenue</td><td>KES ${totalRevenue.toLocaleString()}</td></tr>
        <tr><td>Cash Sales</td><td>KES ${expectedCash.toLocaleString()}</td></tr>
        <tr><td>M-Pesa Sales</td><td>KES ${mpesaTotal.toLocaleString()}</td></tr>
        <tr><td>Card Sales</td><td>KES ${cardTotal.toLocaleString()}</td></tr>
        <tr class="total"><td>Expected Cash</td><td>KES ${expectedCash.toLocaleString()}</td></tr>
        <tr><td>Actual Cash</td><td>KES ${actual.toLocaleString()}</td></tr>
        <tr class="variance"><td>Variance</td><td>${variance >= 0 ? '+' : ''}KES ${variance.toLocaleString()}</td></tr>
      </table>
      ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ''}
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleAuditSubmit = async (auditData) => {
    try {
      await base44.entities.ShiftAudit.create(auditData);
      toast.success('Discrepancy recorded successfully');
    } catch (error) {
      toast.error('Failed to record discrepancy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" /> End of Day Reconciliation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold font-display">{todaySales.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold font-display text-primary">KES {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
              <p className="text-xs text-emerald-700">Cash Sales</p>
              <p className="font-bold text-emerald-700">KES {expectedCash.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <p className="text-xs text-green-700">M-Pesa</p>
              <p className="font-bold text-green-700">KES {mpesaTotal.toLocaleString()}</p>
            </div>
            {cardTotal > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 col-span-2">
                <p className="text-xs text-blue-700">Card Sales</p>
                <p className="font-bold text-blue-700">KES {cardTotal.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Cash count */}
          <div>
            <Label className="text-xs">Actual Cash in Drawer (KES)</Label>
            <Input
              type="number"
              value={actualCash}
              onChange={e => setActualCash(e.target.value)}
              placeholder={`Expected: KES ${expectedCash.toLocaleString()}`}
              className="mt-1 text-lg font-semibold"
              autoFocus
            />
          </div>

          {actualCash !== '' && (
            <div className={cn(
              "p-3 rounded-xl border-2 text-center",
              isBalanced ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-400 bg-red-50 dark:bg-red-900/20"
            )}>
              {isBalanced ? <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" />}
              <p className={cn("text-sm font-semibold", isBalanced ? "text-emerald-700" : "text-red-700")}>
                {isBalanced ? 'Cash Balanced ✓' : `Variance: ${variance >= 0 ? '+' : ''}KES ${Math.round(variance).toLocaleString()}`}
              </p>
              {!isBalanced && (
                <p className="text-xs text-muted-foreground mt-1">{variance > 0 ? 'Cash over' : 'Cash short'}</p>
              )}
            </div>
          )}

          {actualCash !== '' && !isBalanced && (
            <Button
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
              onClick={() => setAuditOpen(true)}
            >
              <FileWarning className="w-4 h-4" />
              Record Discrepancy
            </Button>
          )}

          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any discrepancy explanation..." className="mt-1 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </DialogFooter>
      </DialogContent>
      <ShiftAuditDialog
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        shift={shift}
        expectedCash={expectedCash}
        actualCash={actual}
        variance={variance}
        onSubmit={handleAuditSubmit}
      />
    </Dialog>
  );
}