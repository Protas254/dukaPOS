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

const SEARCH_FIELDS = [
  { value: 'all',    label: 'All fields',      placeholder: 'Search by name, phone, email or loyalty number…' },
  { value: 'name',   label: 'Name',            placeholder: 'Search by customer name…' },
  { value: 'phone',  label: 'Phone',           placeholder: 'Search by phone number…' },
  { value: 'email',  label: 'Email',           placeholder: 'Search by email address…' },
  { value: 'points', label: 'Loyalty Number',  placeholder: 'Search by loyalty number (e.g. 500)…' },
];

export default function CustomerFilters({ search, onSearch, tier, onTier, sort, onSort, searchField, onSearchField }) {
  const currentField = SEARCH_FIELDS.find(f => f.value === searchField) || SEARCH_FIELDS[0];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex gap-2">
        <select
          value={searchField}
          onChange={(e) => onSearchField(e.target.value)}
          className="h-9 rounded-md border border-green-400 bg-green-50 text-green-800 px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 flex-shrink-0"
        >
          {SEARCH_FIELDS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={currentField.placeholder}
            className="pl-10 border-green-400 bg-green-50 placeholder:text-green-400 focus-visible:ring-green-500 text-green-900"
            type={searchField === 'points' ? 'number' : 'text'}
          />
        </div>
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