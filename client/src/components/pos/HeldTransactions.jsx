import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PauseCircle, PlayCircle, Trash2, ShoppingBag } from 'lucide-react';

const STORAGE_KEY = 'pos_held_transactions';

export function saveHeldTransactions(held) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(held));
}

export function loadHeldTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function HeldTransactions({ open, onClose, onRecall, heldTransactions, onDelete }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-500" /> Held Transactions
          </DialogTitle>
        </DialogHeader>
        {heldTransactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No held transactions</p>
            <p className="text-xs mt-1">Hold a transaction to park it and start a new one</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {heldTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 border rounded-xl bg-card hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.label || `Cart #${t.id.slice(-4)}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.items.length} item{t.items.length !== 1 ? 's' : ''} · KES {t.total.toLocaleString()} · {new Date(t.savedAt).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{t.items.map(i => i.name).join(', ')}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" className="h-8 w-8" onClick={() => onRecall(t)}>
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}