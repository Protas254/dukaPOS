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
              "bg-card border rounded-xl p-3 text-left transition-all duration-200 hover:shadow-lg active:scale-[0.97] group relative overflow-hidden",
              isOutOfStock && "opacity-50 cursor-not-allowed border-muted",
              isCriticalStock && "border-2 border-destructive/50 shadow-destructive/20",
              isLowStock && !isCriticalStock && "border-2 border-amber-400/50",
              !isLowStock && !isOutOfStock && "hover:border-primary/30"
            )}
          >
            {/* Stock Status Badge */}
            {!isOutOfStock && (
              <div className={cn(
                "absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm z-10",
                isCriticalStock && "bg-destructive text-white animate-pulse",
                isLowStock && !isCriticalStock && "bg-amber-400 text-amber-900",
                !isLowStock && "bg-emerald-500 text-white"
              )}>
                {isCriticalStock && <AlertTriangle className="w-3 h-3" />}
                {!isCriticalStock && !isLowStock && <CheckCircle2 className="w-3 h-3" />}
                {product.stock_quantity} left
              </div>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-20 rounded-xl">
                <span className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
                  OUT OF STOCK
                </span>
              </div>
            )}
            
            {/* Category emoji */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-2 transition-all",
              isLowStock ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
            )}>
              {categoryEmojis[product.category] || '📦'}
            </div>
            
            <p className="text-sm font-medium truncate pr-2">{product.name}</p>
            <p className="text-lg font-display font-bold text-primary mt-0.5">
              KES {product.price?.toLocaleString()}
            </p>
            
            {/* Stock Progress Bar */}
            {!isOutOfStock && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Stock level</span>
                  <span className={cn(
                    "font-semibold",
                    isCriticalStock && "text-destructive",
                    isLowStock && !isCriticalStock && "text-amber-600",
                    !isLowStock && "text-emerald-600"
                  )}>
                    {Math.round((product.stock_quantity / Math.max(product.stock_quantity, (product.low_stock_threshold || 10) * 3)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isCriticalStock && "bg-destructive",
                    isLowStock && !isCriticalStock && "bg-amber-400",
                    !isLowStock && "bg-emerald-500"
                  )} style={{ width: `${Math.min(100, (product.stock_quantity / Math.max(product.stock_quantity, (product.low_stock_threshold || 10) * 3)) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[10px] text-muted-foreground capitalize">
                {product.category?.replace('_', ' ')}
              </span>
              {isLowStock && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Low stock
                </span>
              )}
            </div>

            {/* Add animation */}
            <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        );
      })}
    </div>
  );
}