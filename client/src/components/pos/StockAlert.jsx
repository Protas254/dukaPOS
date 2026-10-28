import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StockAlert({ cart, products }) {
  const alerts = [];

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const stockRemaining = (product.stock_quantity || 0) - item.quantity;
    
    if (stockRemaining < 0) {
      alerts.push({
        type: 'error',
        message: `${item.name}: Only ${product.stock_quantity} in stock`,
        item: item.id
      });
    } else if (stockRemaining <= product.low_stock_threshold) {
      alerts.push({
        type: 'warning',
        message: `${item.name}: Low stock warning (${stockRemaining} left)`,
        item: item.id
      });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1.5 p-2.5 bg-red-50/80 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900/50">
      {alerts.map((alert, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
          {alert.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}