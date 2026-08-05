import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from './constants';

export default function InventoryFilters({
  search, setSearch,
  filterCategory, setFilterCategory,
  sortField, setSortField
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="pl-10 rounded-xl"
        />
      </div>
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-[160px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map(c => (
            <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortField} onValueChange={setSortField}>
        <SelectTrigger className="w-[140px] rounded-xl">
          <ArrowUpDown className="w-3 h-3 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="price">Price</SelectItem>
          <SelectItem value="stock">Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
