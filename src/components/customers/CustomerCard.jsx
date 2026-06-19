import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Gift, TrendingUp, ShoppingBag, Star, Pencil, Trash2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const tierColors = {
  bronze:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  silver:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  gold:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

export default function CustomerCard({ customer, onView, onEdit, onDelete }) {
  const [showHistory, setShowHistory] = useState(false);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['customer-sales-mini', customer.id],
    queryFn: () => base44.entities.Sale.filter({ customer_id: customer.id, status: 'completed' }),
    enabled: showHistory,
  });

  const sortedSales = [...sales].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  const tier = customer.tier || 'bronze';
  const points = customer.loyalty_points || 0;
  const spending = customer.total_spending || 0;
  const txCount = customer.total_transactions || 0;

  const nextTierSpend = tier === 'bronze' ? 5000 : tier === 'silver' ? 20000 : 50000;
  const progressPct = Math.min(100, (spending / nextTierSpend) * 100);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 space-y-3">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">{customer.name}</h3>
              <p className="text-xs text-muted-foreground">{customer.phone}</p>
              {customer.email && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{customer.email}</p>}
            </div>
          </div>
          <Badge className={cn("text-xs flex-shrink-0", tierColors[tier])}>
            {tierIcons[tier]} {tier}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-0.5">
              <TrendingUp className="w-3 h-3" /> Spent
            </div>
            <p className="text-xs font-bold text-primary">KES {spending.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-0.5">
              <Gift className="w-3 h-3" /> Points
            </div>
            <p className="text-xs font-bold">{points.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-0.5">
              <ShoppingBag className="w-3 h-3" /> Visits
            </div>
            <p className="text-xs font-bold">{txCount}</p>
          </div>
        </div>

        {/* Tier progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{tierIcons[tier]} {tier.toUpperCase()}</span>
            {tier !== 'platinum' && <span>KES {(nextTierSpend - spending).toLocaleString()} to next tier</span>}
            {tier === 'platinum' && <span>✓ Maximum tier</span>}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Available discounts (compact) */}
        {points >= 500 && (
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-2.5 py-1.5 text-xs text-green-700 dark:text-green-400">
            <Star className="w-3 h-3 flex-shrink-0" />
            <span>
              {points >= 2000 ? 'KES 500 discount available' : points >= 1000 ? 'KES 250 discount available' : 'KES 100 discount available'}
            </span>
          </div>
        )}
        {points < 500 && (
          <p className="text-[10px] text-muted-foreground">{500 - points} pts needed for first discount</p>
        )}

        {/* Purchase history toggle */}
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1 border-t mt-1 pt-2"
        >
          <span className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            Purchase History {txCount > 0 && `(${txCount})`}
          </span>
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Inline history */}
        {showHistory && (
          <div className="space-y-1.5 -mt-1">
            {isLoading ? (
              <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
            ) : sortedSales.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No purchases yet</p>
            ) : (
              sortedSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-2.5 py-1.5 text-xs">
                  <div>
                    <p className="font-mono font-semibold text-[10px]">{sale.receipt_number}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {format(new Date(sale.created_date), 'dd MMM yy')} · {sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">KES {(sale.total_amount || 0).toLocaleString()}</p>
                    {sale.points_earned > 0 && (
                      <p className="text-primary text-[10px]">+{sale.points_earned} pts</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {txCount > 5 && (
              <button
                onClick={onView}
                className="w-full text-center text-xs text-primary hover:underline pt-1"
              >
                View all {txCount} transactions →
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onView}>
            <User className="w-3 h-3 mr-1" /> View
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onEdit}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}