import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AUDIT_TYPES = [
  { value: 'cash_discrepancy', label: 'Cash Discrepancy', icon: '💰' },
  { value: 'manual_adjustment', label: 'Manual Adjustment', icon: '✏️' },
  { value: 'refund_override', label: 'Refund Override', icon: '↩️' },
  { value: 'discount_override', label: 'Discount Override', icon: '🏷️' },
  { value: 'void_transaction', label: 'Void Transaction', icon: '❌' },
];

const CATEGORIES = [
  { value: 'cash_shortage', label: 'Cash Shortage' },
  { value: 'cash_overage', label: 'Cash Overage' },
  { value: 'manager_approved', label: 'Manager Approved' },
  { value: 'system_error', label: 'System Error' },
  { value: 'customer_issue', label: 'Customer Issue' },
  { value: 'other', label: 'Other' },
];

export default function ShiftAuditDialog({ open, onClose, shift, shiftData, onSubmit, expectedCash, actualCash, variance }) {
  const shiftDataToUse = shift || shiftData;
  const [auditType, setAuditType] = useState('cash_discrepancy');
  const [category, setCategory] = useState('cash_shortage');
  const [amount, setAmount] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Auto-populate cash discrepancy data when opened from reconciliation
  React.useEffect(() => {
    if (open && expectedCash !== undefined && actualCash !== undefined) {
      setExpectedAmount(String(expectedCash));
      setActualAmount(String(actualCash));
      setAmount(String(Math.abs(variance || 0)));
      setCategory(variance >= 0 ? 'cash_overage' : 'cash_shortage');
    }
  }, [open, expectedCash, actualCash, variance]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      return;
    }

    const auditData = {
      shift_id: shift?.id || shiftData?.id,
      cashier_id: shift?.cashier_id || shiftData?.cashier_id,
      cashier_name: shift?.cashier_name || shiftData?.cashier_name,
      audit_type: auditType,
      category: category,
      amount: amount ? parseFloat(amount) : 0,
      expected_amount: expectedAmount ? parseFloat(expectedAmount) : null,
      actual_amount: actualAmount ? parseFloat(actualAmount) : null,
      reason: reason.trim(),
      notes: notes.trim(),
      requires_approval: requiresApproval,
      approval_status: requiresApproval ? 'pending' : 'approved',
      created_at: new Date().toISOString(),
    };

    if (onSubmit) {
      onSubmit(auditData);
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAuditType('cash_discrepancy');
    setCategory('cash_shortage');
    setAmount('');
    setExpectedAmount('');
    setActualAmount('');
    setReason('');
    setNotes('');
    setRequiresApproval(true);
  };

  const selectedType = AUDIT_TYPES.find(t => t.value === auditType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">Record Shift Audit</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {shift?.cashier_name || shiftData?.cashier_name}'s Shift
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Audit Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Audit Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAuditType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    auditType === type.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Fields */}
          {auditType === 'cash_discrepancy' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Expected Amount (KES)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Actual Amount (KES)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {(expectedAmount && actualAmount) && (
                <div className="col-span-2">
                  <Card className={
                    parseFloat(actualAmount) - parseFloat(expectedAmount) >= 0
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20'
                  }>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {parseFloat(actualAmount) - parseFloat(expectedAmount) >= 0 ? 'Overage' : 'Shortage'}
                        </span>
                        <span className={`text-sm font-bold ${
                          parseFloat(actualAmount) - parseFloat(expectedAmount) >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}>
                          KES {Math.abs(parseFloat(actualAmount) - parseFloat(expectedAmount)).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Amount (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this discrepancy or adjustment occurred..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Additional Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context or details..."
              className="min-h-[60px]"
            />
          </div>

          {/* Approval Toggle */}
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <Label htmlFor="requiresApproval" className="text-sm cursor-pointer">
              Requires manager approval before shift can close
            </Label>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="p-3 flex gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Audit Trail Information</p>
                <p>This audit record will be permanently stored and linked to this shift. 
                  {requiresApproval && ' A manager must approve before the shift can be closed.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Submit Audit Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}