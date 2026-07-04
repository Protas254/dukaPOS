import React, { useState } from 'react';
import { Target, Pencil, Check, X, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GoalSummaryDialog from './GoalSummaryDialog';

const GOAL_KEY = 'softpos_daily_revenue_goal';

function getGoal() {
  const val = localStorage.getItem(GOAL_KEY);
  return val ? parseInt(val, 10) : 0;
}

function saveGoal(val) {
  localStorage.setItem(GOAL_KEY, String(val));
}

// Status button definitions
const STATUS_BUTTONS = [
  {
    key: 'not_met',
    label: 'Not Met',
    dot: 'bg-red-500',
    activeDot: 'bg-red-500',
    inactiveDot: 'bg-red-300',
    active: 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400 shadow-sm',
    inactive: 'bg-red-50 border-red-200 text-red-400 dark:bg-red-950/20 dark:border-red-900 dark:text-red-700',
  },
  {
    key: 'almost',
    label: 'Almost',
    dot: 'bg-amber-400',
    activeDot: 'bg-amber-400',
    inactiveDot: 'bg-amber-200',
    active: 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-400 shadow-sm',
    inactive: 'bg-amber-50 border-amber-200 text-amber-400 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-700',
  },
  {
    key: 'met',
    label: 'Goal Met',
    dot: 'bg-emerald-500',
    activeDot: 'bg-emerald-500',
    inactiveDot: 'bg-emerald-200',
    active: 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-400 shadow-sm',
    inactive: 'bg-emerald-50 border-emerald-200 text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-700',
  },
];

export default function DailyGoal({ todayRevenue, todaySales = [] }) {
  const [goal, setGoal] = useState(getGoal);
  const [editing, setEditing] = useState(goal === 0);
  const [inputVal, setInputVal] = useState(goal === 0 ? '' : String(goal));
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [manualStatus, setManualStatus] = useState(null); // 'not_met' | 'almost' | 'met' | null (auto)

  const handleSave = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(parsed);
      saveGoal(parsed);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setInputVal(String(goal));
    setEditing(false);
  };

  const pct = goal > 0 ? Math.min(100, Math.round((todayRevenue / goal) * 100)) : 0;
  const achieved = todayRevenue >= goal && goal > 0;
  const remaining = goal > 0 ? Math.max(0, goal - todayRevenue) : 0;
  const over = goal > 0 && todayRevenue > goal ? todayRevenue - goal : 0;

  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-destructive';
  const statusColor = pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-destructive';

  // Which button is currently active (manual override or auto)
  const activeKey = manualStatus || (pct >= 100 ? 'met' : pct >= 70 ? 'almost' : 'not_met');

  return (
    <>
      <div className={`bg-card rounded-2xl border p-5 ${achieved ? 'ring-2 ring-emerald-400/40' : ''}`}>
        <div className="flex flex-col gap-3 mb-4">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${achieved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-primary/10'}`}>
                <Target className={`w-4 h-4 ${achieved ? 'text-emerald-600' : 'text-primary'}`} />
              </div>
              <h3 className="font-display font-semibold text-sm">Daily Revenue Goal</h3>
            </div>
            {!editing && goal > 0 && (
              <button
                onClick={() => { setInputVal(String(goal)); setEditing(true); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Dynamic Status Indicator */}
          {goal > 0 && (
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              pct >= 100 
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                : pct >= 70 
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-500'
                }`} />
                <span className={`text-xs font-bold ${
                  pct >= 100 ? 'text-emerald-700 dark:text-emerald-400' : 
                  pct >= 70 ? 'text-amber-700 dark:text-amber-400' : 
                  'text-red-700 dark:text-red-400'
                }`}>
                  {pct >= 100 ? '🎉 Goal achieved! Great job today!' : 
                   pct >= 70 ? '💪 Almost there - keep pushing!' : 
                   '⚠️ Behind target - focus on sales!'}
                </span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${
                pct >= 100 ? 'text-emerald-700 dark:text-emerald-400' : 
                pct >= 70 ? 'text-amber-700 dark:text-amber-400' : 
                'text-red-700 dark:text-red-400'
              }`}>
                {pct >= 100 ? <Award className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {pct}%
              </div>
            </div>
          )}
          {/* 3 Color Status Buttons - click to manually change status */}
          <div className="flex gap-1.5">
            {STATUS_BUTTONS.map(btn => {
              const isActive = activeKey === btn.key;
              return (
                <button
                  key={btn.key}
                  onClick={() => {
                    if (isActive && btn.key === 'met') {
                      setSummaryOpen(true);
                    } else {
                      setManualStatus(btn.key);
                    }
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer hover:opacity-90
                    ${isActive ? btn.active : btn.inactive}
                  `}
                  title="Click to set this status manually"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? btn.activeDot : btn.inactiveDot}`} />
                  {btn.label}
                  {isActive && (
                    <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm cursor-pointer">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
            {manualStatus && (
              <button
                onClick={() => setManualStatus(null)}
                className="px-2 py-1.5 rounded-lg border border-muted-foreground/30 text-[10px] font-medium text-muted-foreground hover:bg-muted/50"
                title="Reset to automatic status"
              >
                Auto
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Set your target daily revenue (KES)</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleSave} className="gap-1"><Check className="w-3.5 h-3.5" /> Save</Button>
              {goal > 0 && <Button size="sm" variant="ghost" onClick={handleCancel}><X className="w-3.5 h-3.5" /></Button>}
            </div>
          </div>
        ) : goal === 0 ? (
          <p className="text-sm text-muted-foreground">No goal set. <button onClick={() => setEditing(true)} className="text-primary font-medium hover:underline">Set a target</button></p>
        ) : (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <span className={`text-2xl font-display font-bold ${statusColor}`}>{pct}%</span>
                <span className="text-xs text-muted-foreground">Goal: KES {goal.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>



            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-[10px] text-muted-foreground mb-0.5">Today</p>
                <p className="text-sm font-bold text-primary">KES {Math.round(todayRevenue).toLocaleString()}</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-[10px] text-muted-foreground mb-0.5">{achieved ? 'Over by' : 'Remaining'}</p>
                <p className={`text-sm font-bold ${achieved ? 'text-emerald-600' : 'text-amber-600'}`}>
                  KES {achieved ? Math.round(over).toLocaleString() : Math.round(remaining).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <p className="text-[10px] text-muted-foreground mb-0.5">Status</p>
                <div className={`flex items-center justify-center gap-0.5 text-sm font-bold ${statusColor}`}>
                  {achieved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {achieved ? 'Hit!' : pct >= 70 ? 'Close' : 'Low'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <GoalSummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        todayRevenue={todayRevenue}
        goal={goal}
        todaySales={todaySales}
      />
    </>
  );
}