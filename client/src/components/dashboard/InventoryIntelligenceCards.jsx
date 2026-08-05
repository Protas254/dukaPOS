import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InventoryIntelligenceCards({ inventoryIntel = {}, lowStockItems = [] }) {
  const {
    stock_value_cost = 0,
    stock_value_retail = 0,
    dead_stock_count = 0,
    fast_movers_count = 0,
    stockout_risk_count = 0
  } = inventoryIntel;

  return (
    <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-display font-bold text-sm text-foreground">Inventory Intelligence</h3>
        </div>
        <Link to="/inventory" className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline">
          Manage
        </Link>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Stock Value (Cost) */}
        <div className="p-3.5 bg-muted/40 dark:bg-muted/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Stock Value (Cost)</span>
          <p className="text-lg font-display font-bold text-foreground">
            KES {stock_value_cost.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Retail: KES {stock_value_retail.toLocaleString()}
          </p>
          {lowStockItems.length > 0 && (
            <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Suggested Reorders</span>
              {lowStockItems.slice(0, 2).map((item) => (
                <p key={item.name} className="text-xs font-semibold text-foreground truncate">
                  {item.name}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Dead Stock */}
        <div className="p-3.5 bg-muted/40 dark:bg-muted/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Dead Stock</span>
          <p className="text-lg font-display font-bold text-foreground">{dead_stock_count}</p>
          <p className="text-xs text-muted-foreground font-medium">No sales in range</p>
        </div>

        {/* Card 3: Fast Movers */}
        <div className="p-3.5 bg-muted/40 dark:bg-muted/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Fast Movers</span>
          <p className="text-lg font-display font-bold text-foreground">{fast_movers_count}</p>
          <p className="text-xs text-muted-foreground font-medium">—</p>
        </div>

        {/* Card 4: Stockout Risk */}
        <div className="p-3.5 bg-muted/40 dark:bg-muted/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block">Stockout Risk</span>
          <p className="text-lg font-display font-bold text-foreground">{stockout_risk_count}</p>
          <p className="text-xs text-muted-foreground font-medium">
            {stockout_risk_count === 0 ? 'None' : `${stockout_risk_count} at risk`}
          </p>
        </div>
      </div>
    </div>
  );
}
