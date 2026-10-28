import React from 'react';
import { Package, Printer, Pencil, Trash2, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import { cn } from '@/lib/utils';

export default function InventoryTable({
  filtered,
  paginatedProducts,
  selectedIds,
  setSelectedIds,
  toggleSelectAll,
  toggleSelect,
  openEdit,
  setDeleteConfirm,
  setRestockProduct,
  setRestockQty,
  setBarcodePrintOpen,
  showProducts,
  setShowProducts,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  startIndex,
  endIndex
}) {
  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Products ({filtered.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => setShowProducts(!showProducts)}
        >
          {showProducts ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Hide
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Show
            </>
          )}
        </Button>
      </div>
      {showProducts && (
      <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-input cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Barcode</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Margin</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map(product => {
              const threshold = product.low_stock_threshold || 10;
              const isLow = product.stock_quantity <= threshold;
              const isOutOfStock = product.stock_quantity <= 0;
              const isCritical = product.stock_quantity <= Math.floor(threshold * 0.5);
              return (
                <tr key={product.id} className={cn(
                  "border-b transition-colors",
                  selectedIds.has(product.id) ? "bg-primary/5" :
                  isOutOfStock ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/20" :
                  isCritical ? "bg-red-50/60 dark:bg-red-900/10 hover:bg-red-100/60 dark:hover:bg-red-900/20" :
                  isLow ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20" :
                  "hover:bg-muted/30"
                )}>
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-input cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {product.sku ? (
                      <div className="flex items-center gap-2">
                        <div className="bg-white border rounded p-1.5 shadow-sm">
                          <BarcodeDisplay value={product.sku} width={1.2} height={32} fontSize={8} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                          title="Print label"
                          onClick={() => { setSelectedIds(new Set([product.id])); setBarcodePrintOpen(true); }}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-muted-foreground/60 italic hover:text-primary transition-colors"
                        onClick={() => openEdit(product)}
                      >
                        No SKU — click edit
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {product.category?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    KES {product.price?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {product.cost_price > 0 && product.price > 0 ? (
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        ((product.price - product.cost_price) / product.price * 100) >= 30
                          ? "bg-emerald-100 text-emerald-700"
                          : ((product.price - product.cost_price) / product.price * 100) >= 15
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {((product.price - product.cost_price) / product.price * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <div>
                        <span className={cn(
                          "font-semibold",
                          isOutOfStock ? "text-red-600" :
                          isCritical ? "text-red-600" :
                          isLow ? "text-red-600 dark:text-red-400" : "text-emerald-600"
                        )}>
                          {product.stock_quantity}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{product.unit}</span>
                      </div>
                      {isLow && (
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          isOutOfStock ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          isCritical ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                        )}>
                          {isOutOfStock ? 'Out of stock' : isCritical ? 'Critical' : `Low ≤ ${threshold}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <Badge variant={product.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                      {product.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isLow && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                          onClick={() => { setRestockProduct(product); setRestockQty(String(product.stock_quantity)); }}
                        >
                          <Package className="w-3 h-3" /> Restock
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(product)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No products found</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
