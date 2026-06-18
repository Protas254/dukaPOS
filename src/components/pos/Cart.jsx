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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <p className="text-lg font-bold mb-2 text-foreground">Your cart is empty</p>
        <p className="text-sm text-center max-w-[200px]">Click products to add them here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-lg block text-foreground">Current Sale</span>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive text-xs h-9 font-medium">
          <Trash2 className="w-3 h-3 mr-1" /> Clear All
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-3 py-4">
          {items.map(item => (
            <div key={item.id} className="group flex flex-col gap-2 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate mb-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    KES {item.price.toLocaleString()} per unit
                  </p>
                </div>
                <p className="text-base font-bold text-primary whitespace-nowrap">
                  KES {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => item.quantity === 1 ? onRemoveItem(item.id) : onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-base font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × KES {item.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Totals & Checkout */}
      <div className="border-t px-6 py-5 space-y-4 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Discount</label>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
            <Input
              type="number"
              min="0"
              value={discount || ''}
              onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="pl-12 h-10 text-base font-semibold text-right rounded-lg border-2 focus:border-primary"
              placeholder="0"
            />
          </div>
        </div>
        <Separator className="opacity-50" />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">KES {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="font-semibold">-KES {discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({taxRate}%)</span>
            <span className="font-semibold">KES {Math.round(taxAmount).toLocaleString()}</span>
          </div>
        </div>
        <Separator className="opacity-50" />
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-display font-bold text-primary">KES {total.toLocaleString()}</span>
        </div>
        {items.length > 0 && onCheckout && (
          <Button
            onClick={onCheckout}
            className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 mt-4"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Charge KES {total.toLocaleString()}
          </Button>
        )}
      </div>
    </div>
  );
}