import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

export default function Cart({ items, onUpdateQuantity, onRemoveItem, onClearCart, discount, onDiscountChange, taxRate }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / (100 + taxRate));
  const total = subtotal - discountAmount;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Tap products to add them</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-sm">
            Cart ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive hover:text-destructive text-xs h-7">
          <Trash2 className="w-3 h-3 mr-1" /> Clear
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 py-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  KES {item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => item.quantity === 1 ? onRemoveItem(item.id) : onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-semibold w-20 text-right">
                KES {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Totals */}
      <div className="border-t px-4 py-3 space-y-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Discount (KES)</label>
          <Input
            type="number"
            min="0"
            value={discount || ''}
            onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="h-7 text-xs text-right"
            placeholder="0"
          />
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-destructive">
              <span>Discount</span>
              <span>-KES {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT ({taxRate}% incl.)</span>
            <span>KES {Math.round(taxAmount).toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-display font-bold pt-1">
            <span>Total</span>
            <span className="text-primary">KES {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}