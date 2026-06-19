import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CHANNELS = [
  {
    id: 'receipters',
    label: 'Receipters',
    icon: '📊',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    activeColor: 'border-violet-400 bg-violet-50',
    description: 'Send to consumer analytics platform',
    inputLabel: 'Customer email or Receipters ID',
    placeholder: 'customer@email.com',
    inputType: 'email',
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: '💬',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    activeColor: 'border-blue-400 bg-blue-50',
    description: 'Text receipt to customer',
    inputLabel: 'Phone number',
    placeholder: '0712 345 678',
    inputType: 'tel',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '📱',
    color: 'bg-green-100 text-green-700 border-green-200',
    activeColor: 'border-green-400 bg-green-50',
    description: 'Send via WhatsApp message',
    inputLabel: 'WhatsApp number',
    placeholder: '0712 345 678',
    inputType: 'tel',
  },
  {
    id: 'email',
    label: 'Email',
    icon: '✉️',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    activeColor: 'border-amber-400 bg-amber-50',
    description: 'Send receipt to inbox',
    inputLabel: 'Email address',
    placeholder: 'customer@email.com',
    inputType: 'email',
  },
];

export default function ReceiptDelivery({ defaultPhone, defaultEmail, onChange }) {
  // expanded: which channel is open
  const [expanded, setExpanded] = useState(null);
  // selected channels with their contact value
  const [selections, setSelections] = useState({});
  // draft inputs per channel
  const [drafts, setDrafts] = useState({
    receipters: defaultEmail || '',
    sms: defaultPhone || '',
    whatsapp: defaultPhone || '',
    email: defaultEmail || '',
  });

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const confirm = (id) => {
    const val = drafts[id]?.trim();
    if (!val) return;
    const next = { ...selections, [id]: val };
    setSelections(next);
    setExpanded(null);
    onChange?.(next);
  };

  const remove = (id, e) => {
    e.stopPropagation();
    const next = { ...selections };
    delete next[id];
    setSelections(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Send Receipt Via</p>
      <div className="space-y-1.5">
        {CHANNELS.map(ch => {
          const isSelected = !!selections[ch.id];
          const isOpen = expanded === ch.id;
          return (
            <div
              key={ch.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                isSelected ? ch.activeColor : "border-border",
                isOpen && "ring-1 ring-primary/30"
              )}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => toggle(ch.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-black/5 transition-colors"
              >
                <span className="text-xl leading-none">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ch.label}</p>
                  {isSelected
                    ? <p className="text-xs text-primary font-medium truncate">{selections[ch.id]}</p>
                    : <p className="text-xs text-muted-foreground">{ch.description}</p>
                  }
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isSelected && (
                    <span
                      onClick={(e) => remove(ch.id, e)}
                      className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-destructive transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {/* Expanded input */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t bg-white/50 dark:bg-white/5">
                  <label className="text-xs text-muted-foreground mt-2 block">{ch.inputLabel}</label>
                  <div className="flex gap-2">
                    <Input
                      type={ch.inputType}
                      value={drafts[ch.id] || ''}
                      onChange={e => setDrafts(d => ({ ...d, [ch.id]: e.target.value }))}
                      placeholder={ch.placeholder}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && confirm(ch.id)}
                    />
                    <Button size="sm" onClick={() => confirm(ch.id)} className="h-8 px-3 text-xs">
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(selections).length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Receipt will be sent to {Object.keys(selections).length} channel{Object.keys(selections).length > 1 ? 's' : ''} after payment
        </p>
      )}
    </div>
  );
}