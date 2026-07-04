import React, { useRef, useState } from 'react';
import { Search, Tag, Trash2, Barcode, Zap } from 'lucide-react';
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
  cartLength,
  products,
  onAddToCart,
}) {
  const [scanMode, setScanMode] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && scanMode && search.trim()) {
      // Exact SKU match first, then partial
      const exact = products?.find(p => p.sku?.toLowerCase() === search.trim().toLowerCase());
      const match = exact || products?.find(p =>
        p.sku?.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.name?.toLowerCase().includes(search.trim().toLowerCase())
      );
      if (match && match.stock_quantity > 0) {
        onAddToCart(match);
        onSearchChange('');
        setScanFlash(true);
        setTimeout(() => setScanFlash(false), 400);
      }
    }
  };

  const toggleScanMode = () => {
    setScanMode(prev => !prev);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="p-4 border-b bg-card/80 backdrop-blur-sm space-y-3 sticky top-0 z-10">
      <div className="flex gap-2">
        {/* Search / Barcode input */}
        <div className={cn(
          "relative flex-1 transition-all duration-200",
          scanFlash && "scale-[1.01]"
        )}>
          {scanMode
            ? <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          }
          <Input
            ref={inputRef}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={scanMode ? "Scan barcode or type SKU, press Enter..." : "Search by name, SKU or barcode..."}
            className={cn(
              "pl-10 h-12 rounded-xl border-2 transition-colors bg-background",
              scanMode
                ? "border-primary/60 focus:border-primary ring-1 ring-primary/20"
                : "focus:border-primary/60"
            )}
          />
          {scanMode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge className="bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20 px-1.5 py-0.5">
                <Zap className="w-2.5 h-2.5 mr-0.5" />SCAN
              </Badge>
            </div>
          )}
        </div>

        {/* Scan mode toggle */}
        <Button
          variant={scanMode ? 'default' : 'outline'}
          onClick={toggleScanMode}
          className={cn(
            "h-12 px-3 border-2 shrink-0",
            scanMode && "shadow-md shadow-primary/20"
          )}
          title={scanMode ? "Disable scan mode" : "Enable barcode scan mode"}
        >
          <Barcode className="w-5 h-5" />
          <span className="hidden sm:inline ml-1.5 text-sm font-medium">{scanMode ? 'Scanning' : 'Scan'}</span>
        </Button>

        {cartLength > 0 && (
          <Button
            variant="outline"
            onClick={onClearCart}
            className="h-12 px-3 border-2 hover:border-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-2 font-medium">Clear</span>
          </Button>
        )}
      </div>

      {/* Scan mode hint */}
      {scanMode && (
        <p className="text-xs text-primary/70 font-medium flex items-center gap-1.5 px-1">
          <Zap className="w-3 h-3" />
          Scan mode active — scan a barcode or type a SKU and press Enter to instantly add to cart
        </p>
      )}

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