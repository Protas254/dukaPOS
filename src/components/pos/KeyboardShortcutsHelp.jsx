import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    label: 'Payment',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50 border-emerald-200',
    kbdClass: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    shortcuts: [
      { keys: ['F1'], action: 'Open Checkout' },
      { keys: ['F2'], action: 'Pay with Cash' },
      { keys: ['F3'], action: 'Pay with M-Pesa' },
      { keys: ['F4'], action: 'Pay with Card' },
      { keys: ['F5'], action: 'Split Payment' },
    ],
  },
  {
    label: 'Cart & Transactions',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50 border-amber-200',
    kbdClass: 'bg-amber-100 border-amber-400 text-amber-800',
    shortcuts: [
      { keys: ['F6'], action: 'Hold Current Transaction' },
      { keys: ['F7'], action: 'Recall Held Transactions' },
      { keys: ['Enter'], action: 'Add scanned item to cart' },
      { keys: ['Esc'], action: 'Clear search / Close dialog' },
    ],
  },
  {
    label: 'Tools',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50 border-blue-200',
    kbdClass: 'bg-blue-100 border-blue-400 text-blue-800',
    shortcuts: [
      { keys: ['F8'], action: 'Price Check Mode' },
      { keys: ['F9'], action: 'End of Day Reconciliation' },
      { keys: ['Ctrl', '+'], action: 'Toggle Barcode Scan Mode' },
      { keys: ['?'], action: 'Show this shortcuts help' },
    ],
  },
];

export default function KeyboardShortcutsHelp({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/30">
          <DialogTitle className="font-display flex items-center gap-2 text-lg">
            <Keyboard className="w-5 h-5 text-primary" /> Keyboard Shortcuts
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Use these shortcuts to speed up your workflow</p>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.label} className={`rounded-xl border p-3 ${group.bgLight}`}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${group.color}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${group.textColor}`}>
                  {group.label}
                </span>
              </div>
              {/* Shortcuts */}
              <div className="space-y-2">
                {group.shortcuts.map(s => (
                  <div key={s.action} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground/80">{s.action}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {s.keys.map((k, i) => (
                        <React.Fragment key={k}>
                          {i > 0 && <span className="text-muted-foreground text-xs self-center">+</span>}
                          <kbd className={`px-2.5 py-1 text-xs font-mono font-bold border rounded-md shadow-sm ${group.kbdClass}`}>
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}