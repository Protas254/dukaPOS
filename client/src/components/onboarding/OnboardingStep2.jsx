import React from 'react';
import { Check } from 'lucide-react';
import { BUSINESS_TYPES, NavButtons } from './onboarding-shared';

export default function Step2BusinessType({ data, set, step, onBack, onNext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-5">What best describes your business?</h2>

      {/* 3-column card grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {BUSINESS_TYPES.map(t => {
          const isSelected = data.businessType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => set('businessType', t.id)}
              className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 transition-all text-left relative ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <t.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${
                  isSelected ? 'text-emerald-700' : 'text-slate-800'
                }`}>{t.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <NavButtons step={step} onBack={onBack} onNext={onNext} nextDisabled={!data.businessType} />
    </div>
  );
}
