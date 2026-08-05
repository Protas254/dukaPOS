import React from 'react';
import { BUSINESS_TYPES, Field, Input, Toggle, NavButtons } from './onboarding-shared';

export default function Step9eTIMS({ data, set, step, onBack, onNext, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-2">eTIMS & Tax Compliance</h2>
      <p className="text-xs text-slate-500 mb-6">
        eTIMS (Electronic Tax Invoice Management System) is required by the Kenya Revenue Authority (KRA) for VAT-registered businesses.
      </p>

      <div className="space-y-4">
        <Field label="KRA PIN">
          <Input
            placeholder="A001234567Z"
            value={data.kraPin}
            onChange={e => set('kraPin', e.target.value.toUpperCase())}
            className="font-mono tracking-widest"
          />
        </Field>

        <Toggle
          value={data.vatRegistered}
          onChange={v => set('vatRegistered', v)}
          label="VAT Registered Business"
          hint="Are you registered for VAT with KRA?"
        />

        <Toggle
          value={data.etimsEnabled}
          onChange={v => set('etimsEnabled', v)}
          label="Enable eTIMS Integration"
          hint="Automatically send invoices to KRA eTIMS portal."
        />

        {!data.etimsEnabled && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            💡 You can enable eTIMS later from <strong>Settings → eTIMS Compliance</strong>.
          </div>
        )}
      </div>

      {/* Summary card */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Setup Summary</p>
        {[
          ['Business',  data.businessName],
          ['Type',      BUSINESS_TYPES.find(t => t.id === data.businessType)?.label || '—'],
          ['Address',   data.businessAddress || '—'],
          ['Plan',      data.plan?.charAt(0).toUpperCase() + data.plan?.slice(1)],
          ['Currency',  data.currency],
          ['VAT Rate',  `${data.taxRate}%`],
          ['Branches',  data.branches.length || 0],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-slate-800">{v}</span>
          </div>
        ))}
      </div>

      <NavButtons
        step={step}
        onBack={onBack}
        onNext={onNext}
        nextLabel="Launch My Store 🚀"
        loading={loading}
      />
    </div>
  );
}
