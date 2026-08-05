import React from 'react';
import { CURRENCIES, Field, Select, Input, NavButtons } from './onboarding-shared';

export default function Step8Currency({ data, set, step, onBack, onNext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-5">Currency & Tax Settings</h2>
      <div className="space-y-4">
        <Field label="Currency">
          <Select value={data.currency} onChange={e => set('currency', e.target.value)}>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag}  {c.code} — {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default VAT / Tax Rate (%)">
          <Input
            type="number" min="0" max="100" step="0.5"
            value={data.taxRate}
            onChange={e => set('taxRate', e.target.value)}
          />
        </Field>
      </div>
      <NavButtons step={step} onBack={onBack} onNext={onNext} />
    </div>
  );
}
