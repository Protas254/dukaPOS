import React from 'react';
import { Flame, Clock, Target } from 'lucide-react';

export default function SalesHeatmapAndGoals({ salesHeatmap = [], kpis = {} }) {
  const { today_revenue = 0 } = kpis;

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dailyGoalTarget = 50000;
  const weeklyGoalTarget = 300000;
  const monthlyGoalTarget = 1200000;

  const dailyPct = Math.min(100, Math.round((today_revenue / dailyGoalTarget) * 100));
  const weeklyPct = Math.min(100, Math.round((today_revenue / weeklyGoalTarget) * 100));
  const monthlyPct = Math.min(100, Math.round((today_revenue / monthlyGoalTarget) * 100));

  const getHeatmapColor = (intensity) => {
    switch (intensity) {
      case 1:
        return 'bg-blue-200 dark:bg-blue-800';
      case 2:
        return 'bg-blue-400 dark:bg-blue-600';
      case 3:
        return 'bg-blue-600 dark:bg-blue-400';
      default:
        return 'bg-blue-50 dark:bg-blue-950/40';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Hourly Sales Heatmap */}
      <div className="lg:col-span-2 bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-display font-bold text-sm text-foreground">Hourly Sales Heatmap</h3>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">Busiest hours in dark</span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px] space-y-1.5">
            {/* Hours Header */}
            <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-1 text-[10px] text-muted-foreground text-center font-semibold">
              <span />
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {/* Days Rows */}
            {daysList.map((dayName, idx) => {
              const rowObj = salesHeatmap[idx] || { hours: [] };
              const hoursArr = rowObj.hours || [];

              return (
                <div key={dayName} className="grid grid-cols-[40px_repeat(24,1fr)] gap-1 items-center">
                  <span className="text-xs font-bold text-muted-foreground">{dayName}</span>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const cell = hoursArr[h] || { intensity: 0 };
                    return (
                      <div
                        key={h}
                        title={`Hour ${h}: ${cell.count || 0} sales`}
                        className={`h-5 rounded-md transition-colors ${getHeatmapColor(cell.intensity)}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-muted-foreground pt-1">
          <span>Low</span>
          <span className="w-2.5 h-2.5 rounded bg-blue-50 dark:bg-blue-950/40" />
          <span className="w-2.5 h-2.5 rounded bg-blue-200 dark:bg-blue-800" />
          <span className="w-2.5 h-2.5 rounded bg-blue-400 dark:bg-blue-600" />
          <span className="w-2.5 h-2.5 rounded bg-blue-600 dark:bg-blue-400" />
          <span>High</span>
        </div>
      </div>

      {/* 2. Goals & Streaks */}
      <div className="bg-white dark:bg-card border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="font-display font-bold text-sm text-foreground">Goals & Streaks</h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>0 days</span>
          </div>
        </div>

        {/* 3 Circular Progress Indicators */}
        <div className="grid grid-cols-3 gap-2 py-4">
          {/* Daily */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-14 h-14 rounded-full border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">{dailyPct}%</span>
            </div>
            <div className="text-center space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Daily</span>
              <span className="text-[10px] font-medium text-muted-foreground block">
                KES {today_revenue.toLocaleString()} / {dailyGoalTarget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Weekly */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-14 h-14 rounded-full border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">{weeklyPct}%</span>
            </div>
            <div className="text-center space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Weekly</span>
              <span className="text-[10px] font-medium text-muted-foreground block">
                KES {today_revenue.toLocaleString()} / {weeklyGoalTarget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Monthly */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-14 h-14 rounded-full border-4 border-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{monthlyPct}%</span>
            </div>
            <div className="text-center space-y-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Monthly</span>
              <span className="text-[10px] font-medium text-muted-foreground block">
                KES {today_revenue.toLocaleString()} / {monthlyGoalTarget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
