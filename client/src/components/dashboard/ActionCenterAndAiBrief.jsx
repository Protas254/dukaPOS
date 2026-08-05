import React, { useState } from 'react';
import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ActionCenterAndAiBrief({ criticalStockCount = 0 }) {
  const [briefText, setBriefText] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBrief = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBriefText(
        "Store operations run smoothly. All active shifts are logged in. Restock 1 critical item soon to maintain 100% catalog availability."
      );
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Action Center */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-sm text-foreground">Action Center</h3>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">1 item</span>
        </div>

        {/* Item Row */}
        <div className="flex items-center justify-between p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{criticalStockCount > 0 ? `${criticalStockCount} items critically low` : 'No critical items'}</span>
          </div>
          <Link to="/purchase-orders">
            <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-red-600 border-red-200 hover:bg-red-100">
              Create purchase order <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. AI Daily Brief */}
      <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-sm text-foreground">AI Daily Brief</h3>
          </div>
          <Button
            size="sm"
            onClick={handleGenerateBrief}
            disabled={isGenerating}
            className="h-7 px-3 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          {briefText || "Click Generate for an AI summary of what matters right now."}
        </p>
      </div>
    </div>
  );
}
