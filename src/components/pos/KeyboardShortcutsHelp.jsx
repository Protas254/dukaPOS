import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['F1'], action: 'Pay with Cash' },
  { keys: ['F2'], action: 'Pay with M-Pesa' },
  { keys: ['F3'], action: 'Pay with Card' },
  { keys: ['F4'], action: 'Split Payment' },
  { keys: ['F5'], action: 'Open Checkout' },
  { keys: ['F6'], action: 'Hold Transaction' },
  { keys: ['F7'], action: 'Recall Held Transactions' },
  { keys: ['F8'], action: 'Price Check Mode' },
  { keys: ['F9'], action: 'End of Day Reconciliation' },
  { keys: ['Esc'], action: 'Clear Search / Close dialog' },
  { keys: ['Enter'], action: 'Add scanned item to cart' },
  { keys: ['Ctrl', '+'], action: 'Enable Scan Mode' },
  { keys: ['?'], action: 'Show this help' },
];

export default function KeyboardShortcutsHelp({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {SHORTCUTS.map(s => (
            <div key={s.action} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <span className="text-sm text-muted-foreground">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 text-xs font-mono bg-muted border rounded shadow-sm">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}