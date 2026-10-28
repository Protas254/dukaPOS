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

export default function ProductGrid({ products, onAddToCart, searchQuery, onToggleFavorite, isFavorite }) {
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
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {filtered.map(product => {
        const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10);
        const isCriticalStock = product.stock_quantity <= Math.floor((product.low_stock_threshold || 10) * 0.5);
        const isOutOfStock = product.stock_quantity <= 0;
        
        return (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            onContextMenu={(e) => { e.preventDefault(); onToggleFavorite?.(product.id); }}
            disabled={isOutOfStock}
            className={cn(
              "bg-card border rounded-md p-1 text-left transition-all hover:shadow-sm active:scale-[0.99] group relative overflow-hidden",
              isOutOfStock && "opacity-50 cursor-not-allowed border-muted",
              isCriticalStock && "border-destructive/60 bg-red-50/20",
              isLowStock && !isCriticalStock && "border-red-400/60 bg-red-50/10",
              !isLowStock && !isOutOfStock && "hover:border-primary/30"
            )}
          >
            {/* Favourite star */}
            {isFavorite?.(product.id) && (
              <div className="absolute top-0.5 left-0.5 z-10">
                <span className="text-[8px]">⭐</span>
              </div>
            )}
            {/* Tiny Stock Dot */}
            {!isOutOfStock && (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full z-10"
                style={{
                  backgroundColor: isLowStock ? '#ef4444' : '#10b981'
                }}
              />
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-20 rounded-md">
                <span className="text-[8px] font-bold text-destructive">
                  X
                </span>
              </div>
            )}
            
            {/* Category emoji */}
            <div className={cn(
              "w-5 h-5 rounded-sm flex items-center justify-center text-base mb-0.5",
              isLowStock ? "bg-red-50 dark:bg-red-900/30" : "bg-muted/30"
            )}>
              {categoryEmojis[product.category] || '📦'}
            </div>
            
            <p className="text-[9px] font-medium truncate leading-tight">{product.name}</p>
            <p className="text-[10px] font-bold text-primary mt-0.5">
              {product.price?.toLocaleString()}
            </p>
          </button>
        );
      })}
    </div>
  );
}