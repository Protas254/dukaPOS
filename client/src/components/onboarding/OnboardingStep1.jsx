import React from 'react';
import { USER_TYPES, SelectionCard, NavButtons } from './onboarding-shared';

export default function Step1UserType({ data, set, step, onBack, onNext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-4">
        Select the type of account that best describes you:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {USER_TYPES.map(t => (
          <SelectionCard
            key={t.id} id={t.id}
            selected={data.userType} onSelect={v => set('userType', v)}
            icon={t.icon} title={t.title} desc={t.desc}
          />
        ))}
      </div>
      <NavButtons step={step} onBack={onBack} onNext={onNext} nextDisabled={!data.userType} />
    </div>
  );
}
