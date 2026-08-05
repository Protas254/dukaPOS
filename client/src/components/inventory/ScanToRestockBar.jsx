import React from 'react';
import { Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function ScanToRestockBar({
  scanRestockMode,
  setScanRestockMode,
  scanRestockQuery,
  setScanRestockQuery,
  scanRestockRef,
  products,
  setRestockProduct,
  setRestockQty
}) {
  const { toast } = useToast();

  if (!scanRestockMode) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
      <Barcode className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
      <Input
        ref={scanRestockRef}
        value={scanRestockQuery}
        onChange={e => setScanRestockQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && scanRestockQuery.trim()) {
            const q = scanRestockQuery.trim().toLowerCase();
            const match = products.find(p => p.sku?.toLowerCase() === q)
              || products.find(p => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
            if (match) {
              setRestockProduct(match);
              setRestockQty(String(match.stock_quantity));
              setScanRestockQuery('');
              setScanRestockMode(false);
            } else {
              toast({ title: 'Product not found', description: `No match for "${scanRestockQuery}"`, variant: 'destructive' });
            }
          }
          if (e.key === 'Escape') { setScanRestockMode(false); setScanRestockQuery(''); }
        }}
        placeholder="Scan barcode or type SKU/name → Enter to open restock..."
        className="flex-1 h-8 text-sm border-amber-300 focus:border-amber-500 bg-white"
        autoFocus
      />
      <Button size="sm" variant="ghost" className="h-8 text-xs text-amber-700" onClick={() => { setScanRestockMode(false); setScanRestockQuery(''); }}>
        Cancel
      </Button>
    </div>
  );
}
