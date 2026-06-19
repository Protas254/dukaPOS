import React, { useState } from 'react';
import { Tag, Gift, Percent, X, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const REDEMPTION_TIERS = [
  { points: 500,  value: 100  },
  { points: 1000, value: 250  },
  { points: 2000, value: 500  },
  { points: 5000, value: 1500 },
];

// ─── Manual Discount Tab ──────────────────────────────────────────────────────
function ManualDiscount({ subtotal, manualDiscount, onChange }) {
  const [mode, setMode] = useState('amount'); // 'amount' | 'percent'
  const [raw, setRaw] = useState('');

  const apply = () => {
    const n = parseFloat(raw);
    if (!n || n <= 0) return;
    const amt = mode === 'percent' ? Math.round((n / 100) * subtotal) : Math.round(n);
    onChange(Math.min(amt, subtotal));
    setRaw('');
  };

  const quickPcts = [5, 10, 15, 20];

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border text-xs font-medium">
        <button
          className={cn("flex-1 py-1.5 transition-colors", mode === 'amount' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}
          onClick={() => setMode('amount')}
        >
          KES Amount
        </button>
        <button
          className={cn("flex-1 py-1.5 transition-colors", mode === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}
          onClick={() => setMode('percent')}
        >
          % Percent
        </button>
      </div>

      {mode === 'percent' && (
        <div className="flex flex-wrap gap-1.5">
          {quickPcts.map(p => (
            <button
              key={p}
              onClick={() => { const amt = Math.round((p / 100) * subtotal); onChange(amt); setRaw(''); }}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-all",
                manualDiscount === Math.round((p / 100) * subtotal)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:border-primary/40"
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {mode === 'amount' ? 'KES' : '%'}
          </span>
          <Input
            type="number"
            min="0"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
            placeholder="0"
            className="pl-10 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={apply} className="h-9 px-4">Apply</Button>
      </div>

      {manualDiscount > 0 && (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
              KES {manualDiscount.toLocaleString()} discount applied
            </span>
          </div>
          <button onClick={() => onChange(0)} className="text-green-600 hover:text-green-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Loyalty Redemption Tab ───────────────────────────────────────────────────
function LoyaltyTab({ availablePoints, selectedRedemption, onSelect }) {
  const affordable = REDEMPTION_TIERS.filter(t => availablePoints >= t.points);
  const nextTier = REDEMPTION_TIERS.find(t => availablePoints < t.points);

  if (affordable.length === 0) {
    return (
      <div className="text-center py-4 space-y-1">
        <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Not enough points</p>
        {nextTier && (
          <p className="text-xs text-muted-foreground">
            {(nextTier.points - availablePoints).toLocaleString()} more pts for KES {nextTier.value} off
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Available: <span className="font-bold text-primary">{availablePoints.toLocaleString()} pts</span>
      </p>
      {affordable.map(tier => {
        const active = selectedRedemption?.points === tier.points;
        return (
          <button
            key={tier.points}
            type="button"
            onClick={() => onSelect(active ? null : tier)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
              active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">KES {tier.value.toLocaleString()} off</p>
                <p className="text-xs text-muted-foreground">{tier.points.toLocaleString()} points</p>
              </div>
            </div>
            {active
              ? <Check className="w-5 h-5 text-primary" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        );
      })}
      {selectedRedemption && (
        <button
          onClick={() => onSelect(null)}
          className="w-full text-xs text-muted-foreground hover:text-destructive py-1 underline underline-offset-2"
        >
          Remove redemption
        </button>
      )}
    </div>
  );
}

// ─── Main DiscountPanel ───────────────────────────────────────────────────────
export default function DiscountPanel({
  subtotal,
  manualDiscount,
  onManualDiscountChange,
  customer,
  selectedRedemption,
  onRedemptionSelect,
}) {
  const [tab, setTab] = useState('discount');
  const loyaltyPoints = customer?.loyalty_points || 0;
  const hasLoyalty = !!customer;
  const totalSavings = manualDiscount + (selectedRedemption?.value || 0);

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b bg-muted/30">
        <button
          onClick={() => setTab('discount')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
            tab === 'discount' ? "bg-background border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Tag className="w-3.5 h-3.5" />
          Discount
          {manualDiscount > 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
        </button>
        <button
          onClick={() => setTab('loyalty')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
            tab === 'loyalty' ? "bg-background border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
            !hasLoyalty && "opacity-50 cursor-not-allowed"
          )}
          disabled={!hasLoyalty}
        >
          <Gift className="w-3.5 h-3.5" />
          Loyalty {hasLoyalty && <span className="text-[10px] text-muted-foreground ml-0.5">({loyaltyPoints.toLocaleString()} pts)</span>}
          {selectedRedemption && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
        </button>
      </div>

      <div className="p-3">
        {tab === 'discount' && (
          <ManualDiscount
            subtotal={subtotal}
            manualDiscount={manualDiscount}
            onChange={onManualDiscountChange}
          />
        )}
        {tab === 'loyalty' && (
          hasLoyalty
            ? <LoyaltyTab
                availablePoints={loyaltyPoints}
                selectedRedemption={selectedRedemption}
                onSelect={onRedemptionSelect}
              />
            : <p className="text-xs text-muted-foreground text-center py-3">Enter customer phone to enable loyalty</p>
        )}
      </div>

      {/* Summary bar */}
      {totalSavings > 0 && (
        <div className="border-t bg-green-50 dark:bg-green-900/20 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Total savings</span>
          </div>
          <span className="text-sm font-bold text-green-700 dark:text-green-300">
            KES {totalSavings.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}