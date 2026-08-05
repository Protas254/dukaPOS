import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

export default function CustomerFeedbackWidget({ customerFeedback = {} }) {
  const { total = 0, avg_rating = 0, positive_pct = 0 } = customerFeedback;

  return (
    <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Customer Checkout Feedback</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Real-time ratings from receipts</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-muted-foreground block">Avg Rating</span>
          <span className="text-sm font-bold text-foreground block mt-0.5">
            {total > 0 ? `${avg_rating} / 5` : '—'}
          </span>
        </div>

        <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-muted-foreground block">Positive</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {positive_pct}%
          </span>
        </div>

        <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-muted-foreground block">Reviews</span>
          <span className="text-sm font-bold text-foreground block mt-0.5">
            {total}
          </span>
        </div>
      </div>

      {/* Empty / Ratings Container */}
      <div className="py-6 text-center text-muted-foreground space-y-1">
        <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1" />
        <p className="text-xs font-semibold">No feedback yet</p>
        <p className="text-[11px] font-normal text-muted-foreground/80">Customer ratings will appear here in real-time</p>
      </div>
    </div>
  );
}
