import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

export default function Cart({ items, onUpdateQuantity, onRemoveItem, onClearCart, discount, onDiscountChange, taxRate, onCheckout }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / (100 + taxRate));
  const total = subtotal - discountAmount;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <ShoppingBag className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-xs font-medium">Cart empty</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold">{items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearCart} className="h-6 text-xs px-2">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{item.name}</p>
                <p className="text-[9px] text-muted-foreground">
                  {item.quantity} × {item.price.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => item.quantity === 1 ? onRemoveItem(item.id) : onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-5 h-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs font-bold text-primary whitespace-nowrap w-16 text-right">
                {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Totals & Checkout */}
      <div className="border-t px-3 py-3 space-y-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Discount</label>
          <div className="flex-1 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">KES</span>
            <Input
              type="number"
              min="0"
              value={discount || ''}
              onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="pl-8 pr-2 h-7 text-xs font-semibold text-right rounded border"
              placeholder="0"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">KES {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[10px] text-green-600">
              <span>Discount</span>
              <span className="font-medium">-KES {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">VAT ({taxRate}%)</span>
            <span className="font-medium">KES {Math.round(taxAmount).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-between items-center pt-1 border-t">
          <span className="text-xs font-bold">Total</span>
          <span className="text-lg font-display font-bold text-primary">KES {total.toLocaleString()}</span>
        </div>
        {items.length > 0 && onCheckout && (
          <Button
            onClick={onCheckout}
            className="w-full h-8 rounded-md text-sm font-bold bg-primary hover:bg-primary/90 mt-2"
          >
            Charge KES {total.toLocaleString()}
          </Button>
        )}
      </div>
    </div>
  );
}