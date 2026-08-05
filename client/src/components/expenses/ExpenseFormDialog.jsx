import React, { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const CATEGORIES = [
  { value: 'rent', label: 'Rent', color: 'bg-red-100 text-red-700' },
  { value: 'utilities', label: 'Utilities', color: 'bg-blue-100 text-blue-700' },
  { value: 'salaries', label: 'Salaries', color: 'bg-green-100 text-green-700' },
  { value: 'supplies', label: 'Supplies', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  { value: 'transport', label: 'Transport', color: 'bg-purple-100 text-purple-700' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
  { value: 'insurance', label: 'Insurance', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'taxes', label: 'Taxes', color: 'bg-gray-100 text-gray-700' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

export const PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'cheque'];

export default function ExpenseFormDialog({ open, onClose, onSubmit, isPending, initialData }) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    category: initialData?.category || 'other',
    description: initialData?.description || '',
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    payment_method: initialData?.payment_method || 'cash',
    reference_number: initialData?.reference_number || '',
    notes: initialData?.notes || '',
    is_recurring: initialData?.is_recurring || false,
    receipt_url: initialData?.receipt_url || null,
  });
  const [receiptFile, setReceiptFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initialData ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Amount (KES) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What is this expense for?"
          />
        </div>

        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Payment Method *</Label>
          <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method} value={method} className="capitalize">
                  {method.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reference Number</Label>
          <Input
            value={formData.reference_number}
            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            placeholder="Transaction ID, cheque number, etc."
          />
        </div>

        <div>
          <Label>Receipt (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            {receiptFile && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setReceiptFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {initialData?.receipt_url && !receiptFile && (
            <p className="text-xs text-muted-foreground mt-1">Current receipt will be kept</p>
          )}
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional details..."
            className="h-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_recurring"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="is_recurring" className="text-sm">This is a recurring expense</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Saving...' : initialData ? 'Update' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
