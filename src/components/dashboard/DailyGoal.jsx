import React, { useState } from 'react';
import { Target, Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GOAL_KEY = 'softpos_daily_revenue_goal';

function getGoal() {
  const val = localStorage.getItem(GOAL_KEY);
  return val ? parseInt(val, 10) : 0;
}

function saveGoal(val) {
  localStorage.setItem(GOAL_KEY, String(val));
}

export default function DailyGoal({ todayRevenue }) {
  const [goal, setGoal] = useState(getGoal);
  const [editing, setEditing] = useState(goal === 0);
  const [inputVal, setInputVal] = useState(goal === 0 ? '' : String(goal));

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

  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-primary' : pct >= 40 ? 'bg-amber-500' : 'bg-destructive';
  const statusColor = pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-primary' : pct >= 40 ? 'text-amber-600' : 'text-destructive';

  return (
    <div className={`bg-card rounded-2xl border p-5 ${achieved ? 'ring-2 ring-emerald-400/40' : ''}`}>
      <div className="flex items-center justify-between mb-3">
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
        <div className="space-y-3">
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
          <div className="grid grid-cols-3 gap-2 pt-1">
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
                {achieved ? 'Hit!' : pct >= 70 ? 'Close' : pct >= 40 ? 'Mid' : 'Low'}
              </div>
            </div>
          </div>

          {/* Motivational message */}
          <p className={`text-xs font-medium text-center py-1.5 px-3 rounded-lg ${
            achieved ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
            pct >= 70 ? 'bg-primary/5 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {achieved
              ? `🎉 Goal achieved! You're KES ${Math.round(over).toLocaleString()} above target.`
              : pct >= 70
              ? `Almost there! KES ${Math.round(remaining).toLocaleString()} more to hit your goal.`
              : pct >= 40
              ? `Halfway through — KES ${Math.round(remaining).toLocaleString()} remaining.`
              : `KES ${Math.round(remaining).toLocaleString()} needed to reach today's target.`
            }
          </p>
        </div>
      )}
    </div>
  );
}