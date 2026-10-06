import React from 'react';
import { BookOpen } from 'lucide-react';
import { FormulaCardData, TelemetryMetrics } from '../types/simulation';

interface TelemetryAndFormulaSectionProps {
  metrics: TelemetryMetrics;
  formula: FormulaCardData;
  onOpenDerivations: () => void;
  lightMode: boolean;
}

export const TelemetryAndFormulaSection: React.FC<TelemetryAndFormulaSectionProps> = ({
  metrics,
  formula,
  onOpenDerivations,
  lightMode,
}) => {
  const cardBase = lightMode
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#0F172A]/90 border-[#1E293B] text-slate-100';

  return (
    <div className="space-y-4">
      {/* ================= E. TELEMETRY CARDS GRID (6 CARDS) ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Avg DC Voltage (V_dc) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Avg DC Voltage (V_dc)
          </div>
          <div className="my-2 flex items-baseline">
            <span
              className={`text-2xl font-mono font-bold tabular-nums ${
                metrics.Vdc < -0.5 ? 'text-rose-400' : 'text-sky-400'
              }`}
            >
              {metrics.Vdc.toFixed(1)}
            </span>
            <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
              V
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            V_rms = <span className="text-slate-200">{metrics.VrmsOut.toFixed(1)} V</span>
          </div>
        </div>

        {/* 2. Avg DC Current (I_dc) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Avg DC Current (I_dc)
          </div>
          <div className="my-2 flex items-baseline">
            <span
              className={`text-2xl font-mono font-bold tabular-nums ${
                metrics.Idc < -0.05 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {metrics.Idc.toFixed(2)}
            </span>
            <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
              A
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            I_rms = <span className="text-slate-200">{metrics.IrmsOut.toFixed(2)} A</span>
          </div>
        </div>

        {/* 3. Output Power (P_load) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Output Power (P_load)
          </div>
          <div className="my-2 flex items-baseline">
            <span className="text-2xl font-mono font-bold tabular-nums text-sky-400">
              {metrics.Pload.toFixed(1)}
            </span>
            <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
              W
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            S_in = <span className="text-slate-200">{metrics.Sin.toFixed(1)} VA</span>
          </div>
        </div>

        {/* 4. Power Factor (PF) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Power Factor (PF)
          </div>
          <div className="my-2 flex items-baseline">
            <span className="text-2xl font-mono font-bold tabular-nums text-purple-400">
              {metrics.powerFactor.toFixed(3)}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            cos(φ₁) = <span className="text-slate-200">{metrics.displacementPF.toFixed(3)}</span>
          </div>
        </div>

        {/* 5. Ripple Factor (RF) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Ripple Factor (RF)
          </div>
          <div className="my-2 flex items-baseline">
            <span className="text-2xl font-mono font-bold tabular-nums text-amber-400">
              {metrics.rippleFactor.toFixed(3)}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            FF = <span className="text-slate-200">{metrics.formFactor.toFixed(3)}</span>
          </div>
        </div>

        {/* 6. Source THD (THD_i) */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardBase}`}>
          <div className="text-xs text-slate-400 font-medium">
            Source THD (THD_i)
          </div>
          <div className="my-2 flex items-baseline">
            <span className="text-2xl font-mono font-bold tabular-nums text-rose-400">
              {metrics.thdCurrent.toFixed(1)}
            </span>
            <span className="text-xs uppercase font-mono text-slate-400 ml-1.5">
              %
            </span>
          </div>
          <div className="text-xs font-mono flex items-center gap-1.5">
            {metrics.conductionMode === 'CCM' ? (
              <span className="text-emerald-400 font-medium">● CCM Mode</span>
            ) : metrics.conductionMode === 'DCM' ? (
              <span className="text-amber-400 font-medium">▲ DCM Mode</span>
            ) : (
              <span className="text-rose-400 font-medium">✖ Blocked</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= F. THEORETICAL & ANALYTICAL FORMULA CARD ================= */}
      <div
        className={`rounded-xl border p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${cardBase}`}
      >
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-400">
            <span>{formula.subtitle}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenDerivations}
              className="inline-flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Full Derivation</span>
            </button>
          </div>

          <h3 className="text-base font-semibold tracking-tight">{formula.title}</h3>

          <p className="text-xs text-slate-400 leading-relaxed">{formula.description}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-400">
            {formula.notes.map((note, idx) => (
              <React.Fragment key={note}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span>{note}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Analytical Equation & Comparison Box */}
        <div className="w-full lg:w-auto shrink-0 rounded-lg bg-[#070B14] border border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1">
              Analytical DC Output Relation
            </div>
            <div className="text-sm sm:text-base font-mono font-semibold text-sky-300 tracking-wide">
              {formula.latexFormula}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              {formula.secondaryFormula}
            </div>
          </div>

          <div className="sm:border-l border-slate-800 sm:pl-5 space-y-1 font-mono">
            <div className="text-xs text-slate-400">
              Ideal CCM V_dc:{' '}
              <strong className="text-slate-200">{formula.idealVdc.toFixed(1)} V</strong>
            </div>
            <div className="text-xs text-slate-400">
              RK4 Solver V_dc:{' '}
              <strong className="text-emerald-400">{formula.simulatedVdc.toFixed(1)} V</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
