import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ProductsAndTransactionsGrid({ topProducts = [], recentSales = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top Products Today */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-foreground">Top Products Today</h3>
          <Link to="/inventory" className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
            View all
          </Link>
        </div>

        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.quantity} sold</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  KES {p.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm font-medium text-muted-foreground">
            No sales today yet
          </div>
        )}
      </div>

      {/* 2. Recent Transactions */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-foreground">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
            View all
          </Link>
        </div>

        {recentSales.length > 0 ? (
          <div className="space-y-3">
            {recentSales.map((sale) => {
              const saleDate = sale.created_date ? new Date(sale.created_date) : new Date();
              const pm = (sale.payment_method || 'cash').toLowerCase();
              const pmLabel = pm === 'mpesa' ? 'M-Pesa' : pm === 'card' ? 'Card' : 'Cash';
              const badgeStyle = pm === 'card'
                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                : pm === 'mpesa'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';

              return (
                <div key={sale.id || sale.receipt_number} className="flex items-center justify-between py-1 border-b last:border-0 border-emerald-100/50 dark:border-emerald-900/30">
                  <div>
                    <p className="text-sm font-bold text-foreground">{sale.receipt_number}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {format(saleDate, 'MMM d, h:mm a')} • {sale.items_count || 1} items
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      KES {Number(sale.total_amount || 0).toLocaleString()}
                    </p>
                    <Badge variant="outline" className={`text-[10px] font-bold ${badgeStyle}`}>
                      {pmLabel}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm font-medium text-muted-foreground">
            No transactions recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
