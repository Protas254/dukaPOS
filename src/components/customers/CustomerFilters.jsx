import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TIERS = ['all', 'bronze', 'silver', 'gold', 'platinum'];
const SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'spending', label: 'Top Spenders' },
  { value: 'points', label: 'Most Points' },
  { value: 'visits', label: 'Most Visits' },
  { value: 'name', label: 'Name A–Z' },
];

const tierColors = {
  all: 'bg-secondary text-secondary-foreground',
  bronze: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  silver: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const tierIcons = { all: '👥', bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

export default function CustomerFilters({ search, onSearch, tier, onTier, sort, onSort }) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="pl-10"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Tier filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => onTier(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                tier === t
                  ? `${tierColors[t]} border-transparent shadow-sm`
                  : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {tierIcons[t]} {t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}