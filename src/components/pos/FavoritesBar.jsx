import React, { useState, useEffect } from 'react';
import { Star, StarOff, Pin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'pos_favorite_product_ids';

const categoryEmojis = {
  groceries: '🥬', beverages: '🥤', dairy: '🥛', bakery: '🍞',
  snacks: '🍿', household: '🏠', personal_care: '🧴', electronics: '🔌',
  stationery: '📝', other: '📦'
};

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  const toggleFavorite = (productId) => {
    setFavoriteIds(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (productId) => favoriteIds.includes(productId);

  return { favoriteIds, toggleFavorite, isFavorite };
}

export default function FavoritesBar({ allProducts, onAddToCart, favoriteIds, toggleFavorite }) {
  const favorites = allProducts.filter(p => favoriteIds.includes(p.id) && p.is_active !== false);

  if (favorites.length === 0) {
    return (
      <div className="h-10 border-b bg-amber-50/60 flex items-center gap-2 px-3 text-xs text-amber-700">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span>No favourites pinned yet — right-click any product to pin it here for one-tap access.</span>
      </div>
    );
  }

  return (
    <div className="h-10 border-b bg-amber-50/60 flex items-center gap-1.5 px-2 overflow-x-auto shrink-0">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      {favorites.map(product => {
        const isOut = product.stock_quantity <= 0;
        return (
          <div key={product.id} className="relative flex-shrink-0 group">
            <button
              onClick={() => !isOut && onAddToCart(product)}
              disabled={isOut}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all",
                isOut
                  ? "opacity-40 cursor-not-allowed bg-muted border-muted text-muted-foreground"
                  : "bg-white border-amber-300 hover:bg-amber-100 hover:border-amber-400 active:scale-95 text-foreground"
              )}
            >
              <span>{categoryEmojis[product.category] || '📦'}</span>
              <span className="max-w-[80px] truncate">{product.name}</span>
              <span className="text-primary font-bold ml-0.5">{product.price?.toLocaleString()}</span>
            </button>
            {/* Unpin button on hover */}
            <button
              onClick={() => toggleFavorite(product.id)}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-10"
              title="Unpin"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
        );
      })}
    </div>
  );
}