import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Target, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';

export default function GoalSummaryDialog({ open, onClose, todayRevenue, goal, todaySales }) {
  if (!open) return null;

  const pct = goal > 0 ? Math.min(100, Math.round((todayRevenue / goal) * 100)) : 0;
  const achieved = pct >= 100;
  const almost = pct >= 70 && pct < 100;
  const remaining = Math.max(0, goal - todayRevenue);
  const over = Math.max(0, todayRevenue - goal);

  const status = achieved ? 'met' : almost ? 'almost' : 'not_met';

  const statusConfig = {
    met: {
      label: 'Goal Met! 🎉',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
    },
    almost: {
      label: 'Almost There',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: TrendingUp,
      iconColor: 'text-amber-600',
    },
    not_met: {
      label: 'Goal Not Met',
      color: 'text-destructive',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: TrendingDown,
      iconColor: 'text-destructive',
    },
  }[status];

  const Icon = statusConfig.icon;

  // Payment method breakdown
  const paymentBreakdown = todaySales.reduce((acc, s) => {
    const method = s.payment_method || 'other';
    acc[method] = (acc[method] || 0) + (s.total_amount || 0);
    return acc;
  }, {});

  const avgSale = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  // Bar dimensions for progress
  const barColor = achieved ? 'bg-emerald-500' : almost ? 'bg-amber-400' : 'bg-destructive';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Daily Goal Summary
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
              <Icon className={`w-5 h-5 ${statusConfig.iconColor}`} />
            </div>
            <div>
              <p className={`font-display font-bold text-base ${statusConfig.color}`}>{statusConfig.label}</p>
              <p className="text-xs text-muted-foreground">
                {achieved
                  ? `You exceeded the goal by KES ${Math.round(over).toLocaleString()}`
                  : almost
                  ? `Just KES ${Math.round(remaining).toLocaleString()} more to hit your target`
                  : `KES ${Math.round(remaining).toLocaleString()} short of today's goal`
                }
              </p>
            </div>
            <span className={`ml-auto text-2xl font-display font-bold ${statusConfig.color}`}>{pct}%</span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>KES 0</span>
              <span>Goal: KES {goal.toLocaleString()}</span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="font-semibold text-foreground">KES {Math.round(todayRevenue).toLocaleString()} earned</span>
              {!achieved && <span className="text-muted-foreground">KES {Math.round(remaining).toLocaleString()} remaining</span>}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <ShoppingCart className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-display font-bold">{todaySales.length}</p>
              <p className="text-[10px] text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-display font-bold">KES {Math.round(avgSale).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Avg. Sale</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-display font-bold">KES {goal.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Target</p>
            </div>
          </div>

          {/* Payment breakdown */}
          {Object.keys(paymentBreakdown).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment Breakdown</p>
              <div className="space-y-2">
                {Object.entries(paymentBreakdown).map(([method, amount]) => {
                  const methodPct = todayRevenue > 0 ? Math.round((amount / todayRevenue) * 100) : 0;
                  return (
                    <div key={method} className="flex items-center gap-2">
                      <span className="text-xs w-20 capitalize font-medium">{method === 'mpesa' ? 'M-Pesa' : method}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${methodPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-24 text-right">KES {Math.round(amount).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tip for not met */}
          {status === 'not_met' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>You need <strong className="text-foreground">KES {Math.round(remaining).toLocaleString()}</strong> more and approximately <strong className="text-foreground">{avgSale > 0 ? Math.ceil(remaining / avgSale) : '—'} more transactions</strong> at your current average sale to hit today's goal.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}