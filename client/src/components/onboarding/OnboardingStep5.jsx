import React from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { Field, Input, NavButtons } from './onboarding-shared';

export default function Step5Branches({ data, set, step, onBack, onNext }) {
  const addBranch = () => {
    set('branches', [...data.branches, { name: '', address: '', phone: '', email: '', manager: '' }]);
  };

  const updateBranch = (i, key, val) => {
    const updated = [...data.branches];
    updated[i] = { ...updated[i], [key]: val };
    set('branches', updated);
  };

  const removeBranch = (i) => {
    set('branches', data.branches.filter((_, idx) => idx !== i));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Add your first branch or location.</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your first branch or location. You can{' '}
          <span className="text-emerald-600 font-medium">add more later</span> from the Branches page.
        </p>
      </div>

      {/* Branch list */}
      {data.branches.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-400 mb-4">No branches added yet.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {data.branches.map((b, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Branch {i + 1}</span>
                <button
                  onClick={() => removeBranch(i)}
                  className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Branch Name" required>
                  <Input
                    placeholder="e.g. Nairobi CBD Branch"
                    value={b.name}
                    onChange={e => updateBranch(i, 'name', e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    placeholder="e.g. Moi Avenue, Ground Floor"
                    value={b.address}
                    onChange={e => updateBranch(i, 'address', e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <Input
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={b.phone}
                      onChange={e => updateBranch(i, 'phone', e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      placeholder="branch@business.co.ke"
                      value={b.email}
                      onChange={e => updateBranch(i, 'email', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Branch Manager">
                  <Input
                    placeholder="e.g. Jane Wanjiku"
                    value={b.manager}
                    onChange={e => updateBranch(i, 'manager', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Branch button */}
      <button
        onClick={addBranch}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm"
      >
        <MapPin className="w-4 h-4" />
        Add a Branch
      </button>

      {data.branches.length === 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Prefer to do this later?{' '}
          <button onClick={onNext} className="text-emerald-600 hover:underline font-medium">Click Continue to proceed.</button>
        </p>
      )}

      <NavButtons step={step} onBack={onBack} onNext={onNext} />
    </div>
  );
}
