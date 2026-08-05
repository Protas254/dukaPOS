import React, { useState } from 'react';
import { Sparkles, Send, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';

export default function AskYourBusinessWidget({ defaultSummary = '' }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(
    defaultSummary || "Hello — current POS summary: Revenue KES 0 from 0 transactions, 127 products, 15 customers, and total expenses KES 158,200. With no revenue, the net position is a loss of KES 158,200."
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.analytics.askBusiness(query);
      if (res && res.answer) {
        setAnswer(res.answer);
      }
    } catch (err) {
      console.error("Ask Business Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-emerald-100/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        <h3 className="font-display font-bold text-sm text-emerald-950 dark:text-emerald-100">
          Ask Your Business
        </h3>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleAsk} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Q hello"
            className="pl-9 h-10 bg-white dark:bg-card border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-foreground rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 px-5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Asking...' : 'Ask'}</span>
        </Button>
      </form>

      {/* AI Answer Box */}
      {answer && (
        <div className="p-3.5 bg-white/80 dark:bg-card/80 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs font-medium text-emerald-950 dark:text-emerald-100 leading-relaxed shadow-sm">
          {answer}
        </div>
      )}
    </div>
  );
}
