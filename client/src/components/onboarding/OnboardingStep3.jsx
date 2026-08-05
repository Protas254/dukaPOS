import React from 'react';
import { ShoppingBag, Briefcase, X, Plus } from 'lucide-react';
import { GOODS_SUGGESTIONS, SERVICES_SUGGESTIONS, POS_TYPES, Field, Select, NavButtons } from './onboarding-shared';

export default function Step3Details({ data, set, step, onBack, onNext }) {
  const bt = data.businessType;
  const suggestedGoods    = GOODS_SUGGESTIONS[bt]    || GOODS_SUGGESTIONS.other;
  const suggestedServices = SERVICES_SUGGESTIONS[bt] || SERVICES_SUGGESTIONS.other;

  const toggleItem = (list, setKey, item) => {
    const current = data[setKey];
    if (current.includes(item)) {
      set(setKey, current.filter(i => i !== item));
    } else {
      set(setKey, [...current, item]);
    }
  };

  const addCustom = () => {
    const val = data.addOwnInput.trim();
    if (!val) return;
    const key = data.addOwnType === 'good' ? 'selectedGoods' : 'selectedServices';
    if (!data[key].includes(val)) set(key, [...data[key], val]);
    set('addOwnInput', '');
  };

  const removeItem = (key, item) =>
    set(key, data[key].filter(i => i !== item));

  const totalSelected = data.selectedGoods.length + data.selectedServices.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-5">Tell us a bit more about your business.</h2>

      {/* ── Goods & Services ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800">Goods & Services</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select what your business offers. Suggestions are based on your chosen business type.
        </p>

        {!bt ? (
          <p className="text-xs text-emerald-600 font-medium">
            Pick a business type or POS type first to see relevant suggestions.
          </p>
        ) : (
          <>
            {/* Suggested Goods */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag className="w-3 h-3 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suggested Goods / Products</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedGoods.map(g => {
                  const on = data.selectedGoods.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleItem(data.selectedGoods, 'selectedGoods', g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested Services */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Suggested Services</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedServices.map(s => {
                  const on = data.selectedServices.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleItem(data.selectedServices, 'selectedServices', s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        on
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add your own */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Add your own</p>
              <div className="flex items-center gap-2">
                {/* Toggle Good / Service */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => set('addOwnType', 'good')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${
                      data.addOwnType === 'good'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" /> Good
                  </button>
                  <button
                    onClick={() => set('addOwnType', 'service')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-l border-slate-200 ${
                      data.addOwnType === 'service'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3 h-3" /> Service
                  </button>
                </div>
                <input
                  value={data.addOwnInput}
                  onChange={e => set('addOwnInput', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="e.g. Fresh Juice"
                  className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <button
                  onClick={addCustom}
                  className="flex items-center gap-1.5 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Selected pills */}
            {totalSelected > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Selected ({totalSelected})</p>
                <div className="flex flex-wrap gap-2">
                  {data.selectedGoods.map(g => (
                    <span
                      key={g}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      {g}
                      <button onClick={() => removeItem('selectedGoods', g)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {data.selectedServices.map(s => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700"
                    >
                      <Briefcase className="w-3 h-3" />
                      {s}
                      <button onClick={() => removeItem('selectedServices', s)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── POS Configuration ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-800">POS Configuration</p>
        </div>

        <Field label="POS Type">
          <Select value={data.posType} onChange={e => set('posType', e.target.value)}>
            <option value="">Select a POS type</option>
            {POS_TYPES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        {!data.posType && (
          <p className="text-xs text-emerald-600 font-medium mt-2">
            Pick a POS type above to see the relevant settings checklist.
          </p>
        )}
      </div>

      <NavButtons step={step} onBack={onBack} onNext={onNext} />
    </div>
  );
}
