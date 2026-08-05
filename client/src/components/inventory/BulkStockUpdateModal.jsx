import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/api/apiClient';

export default function BulkStockUpdateModal({
  bulkStockOpen,
  setBulkStockOpen,
  filtered,
  selectedIds,
  setSelectedIds,
  bulkStockValues,
  setBulkStockValues,
  queryClient
}) {
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { toast } = useToast();

  const handleBulkStockSave = async () => {
    setBulkUpdating(true);
    let count = 0;
    for (const [id, qty] of Object.entries(bulkStockValues)) {
      const parsed = parseInt(qty);
      if (!isNaN(parsed)) {
        await api.entities.Product.update(id, { stock_quantity: parsed });
        count++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setBulkStockOpen(false);
    setSelectedIds(new Set());
    setBulkUpdating(false);
    toast({ title: `Stock updated for ${count} product(s)` });
  };

  return (
    <Dialog open={bulkStockOpen} onOpenChange={setBulkStockOpen}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Update Stock Levels</DialogTitle>
          <p className="text-sm text-muted-foreground">{Object.keys(bulkStockValues).length} products selected</p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {filtered.filter(p => selectedIds.has(p.id)).map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">Current: {p.stock_quantity} {p.unit}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Input
                  type="number"
                  min="0"
                  value={bulkStockValues[p.id] ?? ''}
                  onChange={e => setBulkStockValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-24 h-8 text-sm text-right"
                  placeholder="Qty"
                />
                <span className="text-xs text-muted-foreground w-8">{p.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => setBulkStockOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkStockSave} disabled={bulkUpdating}>
            {bulkUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" /> }
            Save All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
