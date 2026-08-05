import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComplianceHealthBanner({ complianceHealth = {} }) {
  const {
    etims_submitted = 0,
    etims_failed = 0,
    cuin_coverage_pct = 0,
    branch_issues_count = 0
  } = complianceHealth;

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-display font-bold text-sm text-amber-950 dark:text-amber-100">
            Compliance Health
          </h3>
        </div>
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
          NEEDS ATTENTION
        </Badge>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-card border border-amber-200 dark:border-amber-900/40 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground block">eTIMS Submitted</span>
          <p className="text-base font-bold text-foreground mt-0.5">{etims_submitted} / {etims_submitted + etims_failed}</p>
          <span className="text-[10px] text-muted-foreground font-medium">0%</span>
        </div>

        <div className="p-3 bg-white dark:bg-card border border-amber-200 dark:border-amber-900/40 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground block">Failed</span>
          <p className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">{etims_failed}</p>
        </div>

        <div className="p-3 bg-white dark:bg-card border border-amber-200 dark:border-amber-900/40 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground block">CUIN Coverage</span>
          <p className="text-base font-bold text-foreground mt-0.5">{cuin_coverage_pct}%</p>
        </div>

        <div className="p-3 bg-white dark:bg-card border border-amber-200 dark:border-amber-900/40 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground block">Branch Issues</span>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{branch_issues_count}</p>
        </div>
      </div>
    </div>
  );
}
