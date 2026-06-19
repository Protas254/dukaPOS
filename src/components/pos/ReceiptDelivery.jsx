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
    inputType: 'receipters', // custom type
  },
  {
    id: 'phone',
    label: 'SMS / WhatsApp',
    icon: '📱',
    color: 'bg-green-100 text-green-700 border-green-200',
    activeColor: 'border-green-400 bg-green-50',
    description: 'Send via SMS and/or WhatsApp',
    inputLabel: 'Phone number',
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
  const [expanded, setExpanded] = useState(null);
  const [selections, setSelections] = useState({});
  const [drafts, setDrafts] = useState({
    receipters_id: '',
    receipters_email: defaultEmail || '',
    phone: defaultPhone || '',
    email: defaultEmail || '',
  });
  // For phone channel: which sub-channels are ticked
  const [phoneModes, setPhoneModes] = useState({ sms: true, whatsapp: true });
  // For receipters: which input mode
  const [receiptersMode, setReceiptersMode] = useState('id'); // 'id' or 'email'

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const confirm = (id) => {
    if (id === 'receipters') {
      const val = receiptersMode === 'id' ? drafts.receipters_id?.trim() : drafts.receipters_email?.trim();
      if (!val) return;
      const next = { ...selections, receipters: { mode: receiptersMode, value: val } };
      setSelections(next);
      setExpanded(null);
      onChange?.(buildOutput(next, phoneModes));
    } else if (id === 'phone') {
      const val = drafts.phone?.trim();
      if (!val || (!phoneModes.sms && !phoneModes.whatsapp)) return;
      const next = { ...selections, phone: { value: val, ...phoneModes } };
      setSelections(next);
      setExpanded(null);
      onChange?.(buildOutput(next, phoneModes));
    } else {
      const val = drafts[id]?.trim();
      if (!val) return;
      const next = { ...selections, [id]: val };
      setSelections(next);
      setExpanded(null);
      onChange?.(buildOutput(next, phoneModes));
    }
  };

  const buildOutput = (sels, modes) => {
    const out = {};
    if (sels.receipters) out.receipters = sels.receipters.value;
    if (sels.phone) {
      if (sels.phone.sms) out.sms = sels.phone.value;
      if (sels.phone.whatsapp) out.whatsapp = sels.phone.value;
    }
    if (sels.email) out.email = sels.email;
    return out;
  };

  const remove = (id, e) => {
    e.stopPropagation();
    const next = { ...selections };
    delete next[id];
    setSelections(next);
    onChange?.(buildOutput(next, phoneModes));
  };

  const getSelectionLabel = (id) => {
    if (id === 'receipters' && selections.receipters) {
      return `${selections.receipters.mode === 'id' ? 'ID' : 'Email'}: ${selections.receipters.value}`;
    }
    if (id === 'phone' && selections.phone) {
      const modes = [selections.phone.sms && 'SMS', selections.phone.whatsapp && 'WhatsApp'].filter(Boolean).join(' + ');
      return `${modes}: ${selections.phone.value}`;
    }
    return selections[id] || '';
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
              <button
                type="button"
                onClick={() => toggle(ch.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-black/5 transition-colors"
              >
                <span className="text-xl leading-none">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ch.label}</p>
                  {isSelected
                    ? <p className="text-xs text-primary font-medium truncate">{getSelectionLabel(ch.id)}</p>
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
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Receipters expanded */}
              {isOpen && ch.id === 'receipters' && (
                <div className="px-3 pb-3 space-y-2 border-t bg-white/50 dark:bg-white/5">
                  {/* Mode toggle */}
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => setReceiptersMode('id')}
                      className={cn("flex-1 text-xs py-1 rounded-lg border font-medium transition-colors",
                        receiptersMode === 'id' ? "bg-violet-600 text-white border-violet-600" : "border-border hover:bg-muted")}
                    >
                      Receipters ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptersMode('email')}
                      className={cn("flex-1 text-xs py-1 rounded-lg border font-medium transition-colors",
                        receiptersMode === 'email' ? "bg-violet-600 text-white border-violet-600" : "border-border hover:bg-muted")}
                    >
                      Email
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type={receiptersMode === 'id' ? 'text' : 'email'}
                      value={receiptersMode === 'id' ? drafts.receipters_id : drafts.receipters_email}
                      onChange={e => setDrafts(d => ({ ...d, [receiptersMode === 'id' ? 'receipters_id' : 'receipters_email']: e.target.value }))}
                      placeholder={receiptersMode === 'id' ? 'RCPT-XXXXXXXX' : 'customer@email.com'}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && confirm('receipters')}
                    />
                    <Button size="sm" onClick={() => confirm('receipters')} className="h-8 px-3 text-xs">Add</Button>
                  </div>
                </div>
              )}

              {/* Phone (SMS / WhatsApp) expanded */}
              {isOpen && ch.id === 'phone' && (
                <div className="px-3 pb-3 space-y-2 border-t bg-white/50 dark:bg-white/5">
                  <label className="text-xs text-muted-foreground mt-2 block">Phone number</label>
                  <Input
                    type="tel"
                    value={drafts.phone}
                    onChange={e => setDrafts(d => ({ ...d, phone: e.target.value }))}
                    placeholder="0712 345 678"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && confirm('phone')}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoneModes(m => ({ ...m, sms: !m.sms }))}
                      className={cn("flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors flex items-center justify-center gap-1",
                        phoneModes.sms ? "bg-blue-600 text-white border-blue-600" : "border-border hover:bg-muted")}
                    >
                      💬 SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneModes(m => ({ ...m, whatsapp: !m.whatsapp }))}
                      className={cn("flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors flex items-center justify-center gap-1",
                        phoneModes.whatsapp ? "bg-green-600 text-white border-green-600" : "border-border hover:bg-muted")}
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                  <Button size="sm" onClick={() => confirm('phone')} className="w-full h-8 text-xs">Add</Button>
                </div>
              )}

              {/* Email expanded */}
              {isOpen && ch.id === 'email' && (
                <div className="px-3 pb-3 space-y-2 border-t bg-white/50 dark:bg-white/5">
                  <label className="text-xs text-muted-foreground mt-2 block">Email address</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={drafts.email}
                      onChange={e => setDrafts(d => ({ ...d, email: e.target.value }))}
                      placeholder="customer@email.com"
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && confirm('email')}
                    />
                    <Button size="sm" onClick={() => confirm('email')} className="h-8 px-3 text-xs">Add</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(selections).length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Receipt will be sent after payment
        </p>
      )}
    </div>
  );
}