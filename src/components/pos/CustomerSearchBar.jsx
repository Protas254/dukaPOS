import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, User, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const tierBadge = {
  bronze:   'bg-orange-100 text-orange-700',
  silver:   'bg-gray-200 text-gray-700',
  gold:     'bg-yellow-100 text-yellow-700',
  platinum: 'bg-blue-100 text-blue-700',
};

export default function CustomerSearchBar({ selectedCustomer, onSelectCustomer }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const filtered = query.trim().length >= 1
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.replace(/\s/g, '').includes(query.replace(/\s/g, ''))
      ).slice(0, 6)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      {selectedCustomer ? (
        /* Selected state */
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/5 border border-primary/30 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{selectedCustomer.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedCustomer.phone} · {selectedCustomer.loyalty_points?.toLocaleString() || 0} pts</p>
          </div>
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', tierBadge[selectedCustomer.tier || 'bronze'])}>
            {(selectedCustomer.tier || 'bronze').toUpperCase()}
          </span>
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search customer by name or phone..."
            className="w-full pl-6 pr-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-background h-7"
          />
        </div>
      )}

      {/* Dropdown */}
      {open && filtered.length > 0 && !selectedCustomer && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl overflow-hidden">
          {filtered.map(c => (
            <button
              key={c.id}
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', tierBadge[c.tier || 'bronze'])}>
                  {(c.tier || 'bronze').toUpperCase()}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.loyalty_points?.toLocaleString() || 0} pts</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim().length >= 2 && filtered.length === 0 && !selectedCustomer && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl px-3 py-2">
          <p className="text-xs text-muted-foreground">No customer found for "{query}"</p>
        </div>
      )}
    </div>
  );
}