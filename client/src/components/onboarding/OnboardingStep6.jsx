import React from 'react';
import { Check } from 'lucide-react';
import { PACKAGES, NavButtons } from './onboarding-shared';

export default function Step6BusinessPackage({ data, set, step, onBack, onNext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-5">Choose your business package</h2>
      <div className="space-y-3">
        {PACKAGES.map(p => (
          <button
            key={p.id}
            onClick={() => set('plan', p.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              data.plan === p.id
                ? `${p.color} bg-blue-50/30 shadow-sm`
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{p.name}</span>
                {p.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.badge}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 text-sm">{p.price}</span>
                {data.plan === p.id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {p.features.map(f => (
                <span key={f} className="text-xs text-slate-500 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" /> {f}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <NavButtons step={step} onBack={onBack} onNext={onNext} />
    </div>
  );
}
