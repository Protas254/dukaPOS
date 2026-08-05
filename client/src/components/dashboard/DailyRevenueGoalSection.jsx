import React, { useState } from 'react';
import { Target, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function DailyRevenueGoalSection({ todayRevenue = 0, todaySales = [] }) {
  const [goalAmount, setGoalAmount] = useState(50000);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(50000);

  const pct = Math.min(100, Math.round((todayRevenue / (goalAmount || 1)) * 100));
  const remaining = Math.max(0, goalAmount - todayRevenue);

  const isMet = pct >= 100;
  const isAlmost = pct >= 70 && pct < 100;

  const handleSaveGoal = () => {
    const val = parseFloat(tempGoal);
    if (val > 0) setGoalAmount(val);
    setIsEditOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Daily Revenue Goal Box */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-sm text-foreground">Daily Revenue Goal</h3>
          </div>
          <button
            onClick={() => {
              setTempGoal(goalAmount);
              setIsEditOpen(true);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="flex items-center justify-between p-2.5 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>Behind target - focus on sales!</span>
          </div>
          <span className="font-bold">{pct}%</span>
        </div>

        {/* 3-Segment Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
          <div className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 ${
            !isAlmost && !isMet
              ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
              : 'bg-muted/40 text-muted-foreground border-transparent'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Not Met</span>
          </div>

          <div className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 ${
            isAlmost
              ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              : 'bg-muted/40 text-muted-foreground border-transparent'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Almost</span>
          </div>

          <div className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 ${
            isMet
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-muted/40 text-muted-foreground border-transparent'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Goal Met</span>
          </div>
        </div>

        {/* Big % Display & Target Label */}
        <div className="flex items-baseline justify-between pt-1">
          <p className="text-3xl font-display font-bold text-red-600 dark:text-red-400">{pct}%</p>
          <p className="text-xs font-semibold text-muted-foreground">Goal: KES {goalAmount.toLocaleString()}</p>
        </div>

        {/* 3 Summary Stat Sub-Boxes */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block">Today</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
              KES {todayRevenue.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block">Remaining</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
              KES {remaining.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-muted-foreground block">Status</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 block mt-0.5">
              Low
            </span>
          </div>
        </div>
      </div>

      {/* Right Sales Container */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[220px]">
        {todaySales.length > 0 ? (
          <div className="w-full text-center space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Today's Sales Active</p>
            <p className="text-2xl font-bold font-display">{todaySales.length} Transactions</p>
            <p className="text-xs text-muted-foreground">Total Revenue: KES {todayRevenue.toLocaleString()}</p>
          </div>
        ) : (
          <div className="text-center text-sm font-medium text-muted-foreground">
            No sales data for today yet
          </div>
        )}
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Daily Revenue Goal</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Goal Target (KES)</label>
            <Input
              type="number"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal}>Save Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
