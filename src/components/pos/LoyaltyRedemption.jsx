import React from 'react';
import { Gift, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const REDEMPTION_TIERS = [
  { points: 500, value: 100 },
  { points: 1000, value: 250 },
  { points: 2000, value: 500 },
];

export default function LoyaltyRedemption({ availablePoints, selectedRedemption, onSelect }) {
  const affordable = REDEMPTION_TIERS.filter(t => availablePoints >= t.points);

  if (affordable.length === 0) {
    return (
      <div className="bg-muted/50 rounded-xl p-3 text-center text-xs text-muted-foreground">
        {(500 - availablePoints).toLocaleString()} more points needed to redeem a discount
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Redeem Loyalty Points</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {affordable.map(tier => {
          const active = selectedRedemption?.points === tier.points;
          return (
            <button
              key={tier.points}
              type="button"
              onClick={() => onSelect(active ? null : tier)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all text-left",
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-sm font-medium">KES {tier.value} off</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{tier.points.toLocaleString()} pts</span>
                {active && <Check className="w-4 h-4 text-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}