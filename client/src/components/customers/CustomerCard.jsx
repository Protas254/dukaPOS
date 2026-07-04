import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Pencil, Trash2, Eye, Gift, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const tierColors = {
  bronze:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  silver:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  gold:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

export default function CustomerCard({ customer, onView, onEdit, onDelete, index = 0 }) {
  const tier = customer.tier || 'bronze';
  const points = customer.loyalty_points || 0;
  const spending = customer.total_spending || 0;
  const txCount = customer.total_transactions || 0;
  const isEven = index % 2 === 0;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b last:border-0 transition-colors cursor-pointer"
      style={{ backgroundColor: isEven ? '#ffffff' : '#d1fae5' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#a7f3d0'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isEven ? '#ffffff' : '#d1fae5'}
      onClick={onView}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>

      {/* Name & contact */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{customer.name}</p>
        <p className="text-xs text-muted-foreground">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
      </div>

      {/* Tier badge */}
      <Badge className={cn("text-[10px] flex-shrink-0 hidden sm:inline-flex", tierColors[tier])}>
        {tierIcons[tier]} {tier}
      </Badge>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs text-right flex-shrink-0">
        <div>
          <p className="font-semibold text-foreground">KES {spending.toLocaleString()}</p>
          <p className="text-muted-foreground">spent</p>
        </div>
        <div>
          <p className="font-semibold">{points.toLocaleString()}</p>
          <p className="text-muted-foreground">pts</p>
        </div>
        <div>
          <p className="font-semibold">{txCount}</p>
          <p className="text-muted-foreground">visits</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}