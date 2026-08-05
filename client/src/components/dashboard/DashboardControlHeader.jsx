import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardControlHeader({
  activeRange,
  onRangeChange,
  branches = [],
  selectedBranch,
  onBranchChange,
  criticalStockCount = 0,
  rangeLabel
}) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  
  // Capitalize first name or full name cleanly
  const rawName = user?.first_name || user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Gordon';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'YTD', value: 'ytd' },
  ];

  return (
    <div className="space-y-3 py-1">
      {/* Top Greeting & Time Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mt-0.5">
          {format(now, 'EEEE, MMMM d, yyyy')} • {format(now, 'h:mm:ss a')}
        </p>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Time Range Pills */}
        <div className="inline-flex items-center p-1 bg-blue-100/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
          {ranges.map((r) => {
            const isActive = activeRange === r.value;
            return (
              <button
                key={r.value}
                onClick={() => onRangeChange(r.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-blue-800 dark:text-blue-200 hover:bg-blue-200/50 dark:hover:bg-blue-900/30'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Branch Selector */}
        <div className="relative">
          <Select value={selectedBranch || 'all'} onValueChange={onBranchChange}>
            <SelectTrigger className="h-9 px-3 bg-white dark:bg-card border-blue-200 dark:border-blue-800 text-xs font-semibold text-emerald-900 dark:text-emerald-100 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id || b.name} value={String(b.id || b.name)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Label Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-100/40 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold text-blue-800 dark:text-blue-300">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{rangeLabel || format(now, 'MMM d')}</span>
        </div>

        {/* Critical Stock Badge Button */}
        {criticalStockCount > 0 && (
          <Link to="/inventory" className="ml-auto sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>{criticalStockCount} Critical stock items</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
