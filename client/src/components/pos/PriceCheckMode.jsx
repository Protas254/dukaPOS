import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Tag, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PriceCheckMode({ open, onClose, products }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const match = query.trim()
    ? products.find(p => p.sku?.toLowerCase() === query.trim().toLowerCase())
      || products.find(p =>
          p.sku?.toLowerCase().includes(query.trim().toLowerCase()) ||
          p.name?.toLowerCase().includes(query.trim().toLowerCase())
        )
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setQuery(''); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" /> Price Check
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Scan barcode or type name / SKU..."
              className="pl-10"
            />
          </div>
          {match ? (
            <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 text-center space-y-2">
              <p className="font-semibold text-base">{match.name}</p>
              {match.sku && <p className="text-xs text-muted-foreground font-mono">{match.sku}</p>}
              <p className="text-4xl font-display font-bold text-primary mt-2">
                KES {match.price?.toLocaleString()}
              </p>
              <div className="flex justify-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize text-xs">{match.category?.replace('_', ' ')}</Badge>
                <Badge className={cn(
                  "text-xs",
                  match.stock_quantity <= 0 ? "bg-red-100 text-red-700" :
                  match.stock_quantity <= (match.low_stock_threshold || 10) ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {match.stock_quantity <= 0 ? 'Out of Stock' : `${match.stock_quantity} in stock`}
                </Badge>
              </div>
            </div>
          ) : query.trim() ? (
            <div className="p-4 rounded-xl border bg-muted/30 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No product found for "{query}"</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Scan or type to check price</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}