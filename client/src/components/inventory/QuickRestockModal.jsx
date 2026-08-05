import React, { useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/api/apiClient';

export default function QuickRestockModal({
  restockProduct,
  setRestockProduct,
  restockQty,
  setRestockQty,
  queryClient
}) {
  const [restocking, setRestocking] = useState(false);
  const { toast } = useToast();

  const handleQuickRestock = async () => {
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty < 0) return;
    setRestocking(true);
    await api.entities.Product.update(restockProduct.id, { stock_quantity: qty });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast({ title: `Stock updated for ${restockProduct.name}` });
    setRestocking(false);
    setRestockProduct(null);
    setRestockQty('');
  };

  return (
    <Dialog open={!!restockProduct} onOpenChange={(open) => { if (!open) { setRestockProduct(null); setRestockQty(''); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" /> Quick Restock
          </DialogTitle>
        </DialogHeader>
        {restockProduct && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="font-medium text-sm">{restockProduct.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current stock: <span className="font-semibold text-amber-700">{restockProduct.stock_quantity}</span> {restockProduct.unit} · Threshold: {restockProduct.low_stock_threshold || 10}
              </p>
            </div>
            <div>
              <Label className="text-xs">New Stock Quantity ({restockProduct.unit})</Label>
              <Input
                type="number"
                min="0"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { setRestockProduct(null); setRestockQty(''); }}>Cancel</Button>
          <Button onClick={handleQuickRestock} disabled={restocking || restockQty === ''}>
            {restocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
