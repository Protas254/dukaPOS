import React from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import { CATEGORIES, UNITS } from './constants';

export default function ProductModal({
  dialogOpen,
  setDialogOpen,
  editingProduct,
  form,
  setForm,
  saveMutation,
  setSelectedIds,
  setBarcodePrintOpen
}) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs">Product Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">SKU / Barcode</Label>
            <div className="flex gap-2 mt-1">
              <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs px-2"
                onClick={() => {
                  const prefix = form.name ? form.name.slice(0, 3).toUpperCase().replace(/\s/g, '') : 'SKU';
                  const rand = Math.floor(Math.random() * 900000 + 100000);
                  setForm(f => ({ ...f, sku: `${prefix}${rand}` }));
                }}
              >
                Auto-generate
              </Button>
            </div>
          </div>
          {form.sku && (
            <div className="col-span-2 flex items-center gap-4 p-3 bg-muted/40 rounded-lg border">
              <div className="bg-white border rounded-lg p-2 shadow-sm flex-shrink-0">
                <BarcodeDisplay value={form.sku} width={1.6} height={50} fontSize={10} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Barcode Preview</p>
                <p className="text-sm font-mono font-medium truncate">{form.sku}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Print this label for shelf tagging</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-xs"
                onClick={() => {
                  if (editingProduct) {
                    setSelectedIds(new Set([editingProduct.id]));
                    setBarcodePrintOpen(true);
                  }
                }}
                disabled={!editingProduct}
              >
                <Printer className="w-3.5 h-3.5" /> Print Label
              </Button>
            </div>
          )}
          <div>
            <Label className="text-xs">Category *</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Selling Price (KES) *</Label>
            <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Cost Price (KES)</Label>
            <Input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Stock Quantity</Label>
            <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Low Stock Alert</Label>
            <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => (
                  <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">VAT Rate (%)</Label>
            <Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 16 })} className="mt-1" />
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <Label className="text-xs">Active (available for sale)</Label>
            <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.price || saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
