import React from 'react';
import { cn } from '@/lib/utils';
import { Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

const categoryEmojis = {
  groceries: '🥬',
  beverages: '🥤',
  dairy: '🥛',
  bakery: '🍞',
  snacks: '🍿',
  household: '🏠',
  personal_care: '🧴',
  electronics: '🔌',
  stationery: '📝',
  other: '📦'
};

export default function ProductGrid({ products, onAddToCart, searchQuery }) {
  const filtered = products.filter(p =>
    p.is_active !== false &&
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">No products found</p>
        <p className="text-xs mt-1">Try a different search or add products in Inventory</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {filtered.map(product => {
        const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10);
        const isCriticalStock = product.stock_quantity <= Math.floor((product.low_stock_threshold || 10) * 0.5);
        const isOutOfStock = product.stock_quantity <= 0;
        
        return (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={cn(
              "bg-card border rounded-lg p-1.5 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] group relative overflow-hidden",
              isOutOfStock && "opacity-50 cursor-not-allowed border-muted",
              isCriticalStock && "border-destructive/50",
              isLowStock && !isCriticalStock && "border-amber-400/50",
              !isLowStock && !isOutOfStock && "hover:border-primary/30"
            )}
          >
            {/* Tiny Stock Dot */}
            {!isOutOfStock && (
              <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isCriticalStock && "bg-destructive animate-pulse",
                  isLowStock && !isCriticalStock && "bg-amber-500",
                  !isLowStock && "bg-emerald-500"
                )} />
              </div>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-20 rounded-lg">
                <span className="text-[9px] font-bold text-destructive">
                  OOS
                </span>
              </div>
            )}
            
            {/* Category emoji */}
            <div className={cn(
              "w-7 h-7 rounded flex items-center justify-center text-lg mb-1",
              isLowStock ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted/50"
            )}>
              {categoryEmojis[product.category] || '📦'}
            </div>
            
            <p className="text-[11px] font-medium truncate pr-4 leading-tight">{product.name}</p>
            <p className="text-xs font-display font-bold text-primary mt-0.5">
              KES {product.price?.toLocaleString()}
            </p>
          </button>
        );
      })}
    </div>
  );
}