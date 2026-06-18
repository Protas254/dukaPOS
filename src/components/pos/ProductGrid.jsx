import React from 'react';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

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
      {filtered.map(product => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          disabled={product.stock_quantity <= 0}
          className={cn(
            "bg-card border rounded-xl p-3 text-left transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.97] group relative",
            product.stock_quantity <= 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Category emoji */}
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl mb-2">
            {categoryEmojis[product.category] || '📦'}
          </div>
          
          <p className="text-sm font-medium truncate">{product.name}</p>
          <p className="text-lg font-display font-bold text-primary mt-0.5">
            KES {product.price?.toLocaleString()}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground capitalize">
              {product.category?.replace('_', ' ')}
            </span>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
              product.stock_quantity <= (product.low_stock_threshold || 10)
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}>
              {product.stock_quantity} in stock
            </span>
          </div>

          {/* Add animation */}
          <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
      ))}
    </div>
  );
}