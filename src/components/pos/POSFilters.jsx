import React from 'react';
import { Search, Tag, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function POSFilters({ 
  search, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange, 
  categories,
  onClearCart,
  cartLength 
}) {
  return (
    <div className="p-4 border-b bg-card/80 backdrop-blur-sm space-y-3 sticky top-0 z-10">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="pl-10 h-12 rounded-xl border-2 focus:border-primary/60 transition-colors bg-background"
          />
        </div>
        {cartLength > 0 && (
          <Button
            variant="outline"
            onClick={onClearCart}
            className="h-12 px-4 border-2 hover:border-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-2 font-medium">Clear</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {categories.map(cat => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={cn(
              "cursor-pointer whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedCategory === cat.id 
                ? "shadow-md shadow-primary/20 scale-105" 
                : "hover:bg-primary/10 hover:text-primary hover:scale-105"
            )}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}