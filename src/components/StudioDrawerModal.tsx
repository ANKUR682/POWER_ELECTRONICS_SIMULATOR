import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, X } from 'lucide-react';
import {
  FormulaCardData,
  PresetScenario,
  SimulationParams,
  TelemetryMetrics,
} from '../types/simulation';

export type ActiveModalType = 'derivations' | 'presets' | 'theory' | null;

export const LAB_PRESETS: PresetScenario[] = [
  {
    id: '1p-half-wave-diode',
    name: '1. 1Φ Half-Wave Uncontrolled Diode Rectifier',
    category: '1-Phase Half-Wave',
    description:
      'Single-phase half-wave uncontrolled diode (D1) rectifier conducting during the positive AC half-cycle (0° to 180°).',
    params: {
      phase: '1P',
      bridgeConfig: 'half-wave',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 35,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '1p-half-wave-thyristor',
    name: '2. 1Φ Half-Wave Thyristor Controlled Rectifier (α = 45°)',
    category: '1-Phase Half-Wave',
    description:
      'Single-phase half-wave phase-controlled SCR (T1) rectifier triggered at gate firing angle α = 45°.',
    params: {
      phase: '1P',
      bridgeConfig: 'half-wave',
      devicePreset: 'all-thyristors',
      alpha: 45,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 35,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '1p-full-wave-dbr',
    name: '3. 1Φ Full-Wave Diode Bridge Rectifier (1Φ DBR)',
    category: '1-Phase Full-Wave Bridge',
    description:
      'Uncontrolled 4-diode Graetz bridge rectifier (D1–D4) rectifying both positive and negative AC half-cycles (V_dc = 2Vm/π).',
    params: {
      phase: '1P',
      bridgeConfig: 'full-bridge',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 45,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '1p-full-wave-thyristor',
    name: '4. 1Φ Full-Wave Thyristor Controlled Bridge Rectifier (α = 45°)',
    category: '1-Phase Full-Wave Bridge',
    description:
      'Fully-controlled 4-thyristor bridge rectifier (T1–T4) feeding an inductive RL load (R=20Ω, L=45mH) at firing delay α = 45°.',
    params: {
      phase: '1P',
      bridgeConfig: 'full-bridge',
      devicePreset: 'all-thyristors',
      alpha: 45,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 45,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '3p-half-wave-diode',
    name: '5. 3Φ Half-Wave Uncontrolled Diode Rectifier (3-Pulse)',
    category: '3-Phase Half-Wave (3-Pulse)',
    description:
      'Three-phase 3-pulse midpoint diode rectifier (D1, D2, D3) with star neutral return wire, commutating naturally every 120° at ωt = 30°, 150°, 270°.',
    params: {
      phase: '3P',
      bridgeConfig: 'half-wave',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 18,
      L: 40,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '3p-half-wave-thyristor',
    name: '6. 3Φ Half-Wave Thyristor Controlled Rectifier (α = 30°)',
    category: '3-Phase Half-Wave (3-Pulse)',
    description:
      'Three-phase 3-pulse phase-controlled thyristor rectifier (T1, T2, T3) with neutral return wire and firing delay α = 30°.',
    params: {
      phase: '3P',
      bridgeConfig: 'half-wave',
      devicePreset: 'all-thyristors',
      alpha: 30,
      freewheeling: false,
      loadType: 'RL',
      R: 18,
      L: 40,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '3p-full-wave-dbr',
    name: '7. 3Φ Full-Wave Diode Bridge Rectifier (3Φ 6-Pulse DBR)',
    category: '3-Phase Full-Wave Bridge (6-Pulse)',
    description:
      'Industrial 3-phase 6-pulse uncontrolled Diode Bridge Rectifier (D1–D6) delivering low-ripple DC output (V_dc = 3√3 Vm / π).',
    params: {
      phase: '3P',
      bridgeConfig: 'full-bridge',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 15,
      L: 55,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '3p-full-wave-thyristor',
    name: '8. 3Φ Full-Wave Thyristor Controlled Bridge Rectifier (α = 30°)',
    category: '3-Phase Full-Wave Bridge (6-Pulse)',
    description:
      'Industrial 3-phase 6-pulse fully-controlled SCR Graetz bridge (T1–T6) with synchronized 60° gate firing at α = 30°.',
    params: {
      phase: '3P',
      bridgeConfig: 'full-bridge',
      devicePreset: 'all-thyristors',
      alpha: 30,
      freewheeling: false,
      loadType: 'RL',
      R: 15,
      L: 65,
      Vrms: 230,
      globalOrientation: 'forward',
    },
  },
  {
    id: '1p-half-wave-reversed',
    name: '9. 1Φ Half-Wave Reversed Diode Polarity (-DC Output)',
    category: 'Reversed Diode Orientation',
    description:
      'Inverted diode orientation (Cathode to AC source). Blocks positive cycle and conducts during negative half-cycle (180° to 360°).',
    params: {
      phase: '1P',
      bridgeConfig: 'half-wave',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 35,
      Vrms: 230,
      globalOrientation: 'reverse',
    },
  },
  {
    id: '1p-full-bridge-reversed',
    name: '10. 1Φ Full-Wave DBR — Reversed Diodes (-DC Bus)',
    category: 'Reversed Diode Orientation',
    description:
      'All four bridge diodes inverted. Full-wave rectifies both half-cycles onto a negative DC bus (V_dc = -2Vm/π).',
    params: {
      phase: '1P',
      bridgeConfig: 'full-bridge',
      devicePreset: 'all-diodes',
      alpha: 0,
      freewheeling: false,
      loadType: 'RL',
      R: 20,
      L: 45,
      Vrms: 230,
      globalOrientation: 'reverse',
    },
  },
];

interface StudioDrawerModalProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  params: SimulationParams;
  metrics: TelemetryMetrics;
  formula: FormulaCardData;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const StudioDrawerModal: React.FC<StudioDrawerModalProps> = ({
  activeModal,
  onClose,
  params,
  metrics,
  formula,
  onSelectPreset,
}) => {
  if (!activeModal) return null;

  const Vm = Math.SQRT2 * params.Vrms;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[86vh] rounded-xl bg-[#0F172A] border border-slate-800 text-slate-100 flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold">
              {activeModal === 'derivations' &&
                'Waveform Analysis & Mathematical Derivations'}
              {activeModal === 'presets' &&
                'Power Electronics Lab Presets & Topologies'}
              {activeModal === 'theory' &&
                'Rectifier Theory: Half-Wave vs Full-Bridge & Diode Polarity'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {activeModal === 'derivations' && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-sky-400">
                  Active Configuration Summary
                </div>
                <div className="text-base font-semibold">{formula.title}</div>
                <p className="text-xs text-slate-400">{formula.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-slate-400">1. Instantaneous AC Input Source</div>
                  <div className="text-sky-300 text-sm">
                    v_s(ωt) = √2 · {params.Vrms} · sin(ωt) = {Vm.toFixed(1)} · sin(ωt) V
                  </div>
                  <div className="text-slate-400 pt-2">
                    2. Governing Load Differential Equation
                  </div>
                  <div className="text-amber-300 text-sm">
                    L (di_o / dt) + R · i_o + E = v_o(t)
                  </div>
                  <div className="text-slate-400 pt-1">
                    Solved via 4th-Order Runge-Kutta (RK4) with Δ(ωt) = 0.5°:
                  </div>
                  <div className="text-emerald-300">
                    R = {params.R} Ω, L = {params.loadType === 'R' ? 0 : params.L} mH, E ={' '}
                    {params.loadType === 'RLE' ? params.E : 0} V
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-slate-400">3. Analytical DC Average Integral</div>
                  <div className="text-sky-300 text-sm">{formula.latexFormula}</div>
                  <div className="text-slate-400 pt-2">
                    4. Numerical Integration vs Ideal Formula
                  </div>
                  <div className="flex justify-between">
                    <span>Ideal Continuous V_dc:</span>
                    <strong className="text-slate-200">{formula.idealVdc.toFixed(2)} V</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>RK4 Simulated V_dc:</span>
                    <strong className="text-emerald-400">
                      {metrics.Vdc.toFixed(2)} V
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Simulated RMS Output V_rms:</span>
                    <strong className="text-sky-400">
                      {metrics.VrmsOut.toFixed(2)} V
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Conduction Interval γ:</span>
                    <strong className="text-amber-400">
                      {metrics.conductionAngle}° (β = {metrics.extinctionAngle}°)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModal === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LAB_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-sky-400">
                      <span>{preset.category}</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Load Circuit Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeModal === 'theory' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Half-Wave (Half-Bridge) vs. Full-Bridge Rectifier Topologies
                </h3>
                <p className="leading-relaxed">
                  In a <strong>Half-Wave Rectifier</strong>, a single semiconductor switch is placed in series with the AC source and load. Only one half-cycle of the AC waveform is utilized, resulting in a pulse frequency equal to the source frequency (<code className="text-sky-300">f_ripple = f_s</code>) and a maximum ideal DC output of <code className="text-sky-300">V_dc = V_m / π ≈ 0.318 V_m</code>. In a <strong>Full-Bridge Rectifier</strong>, four switches arranged in a Graetz bridge conduct in diagonal pairs (<code className="text-emerald-300">S1+S2</code> on positive cycles and <code className="text-emerald-300">S3+S4</code> on negative cycles), doubling the average output voltage to <code className="text-sky-300">V_dc = 2V_m / π ≈ 0.636 V_m</code> and doubling the ripple frequency to <code className="text-sky-300">2f_s</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Effect of Reversing Diode / Thyristor Orientation (Polarity Inversion)
                </h3>
                <p className="leading-relaxed">
                  Flipping a diode or thyristor orientation (<code className="text-amber-300">FWD ▲ → REV ▼</code>) swaps its anode and cathode terminals:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>
                    <strong>Half-Wave Reversed Diode:</strong> Blocks the positive half-cycle (0°–180°) and conducts exclusively during the negative half-cycle (180°–360°), producing a negative output voltage <code className="text-rose-300">v_o(t) ≤ 0</code> and negative load current <code className="text-rose-300">i_o(t) ≤ 0</code>.
                  </li>
                  <li>
                    <strong>Full-Bridge All Diodes Reversed:</strong> Both half-cycles are rectified onto the negative rail, yielding a full-wave negative DC bus (<code className="text-rose-300">V_dc = -(2V_m/π) cos α</code>).
                  </li>
                  <li>
                    <strong>Single Diode Reversed in a Bridge Leg:</strong> If one diode in a diagonal pair is reversed while its partner remains forward, that diagonal path blocks conduction in both directions, converting the bridge into an asymmetric half-wave circuit.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Continuous (CCM) vs. Discontinuous Conduction Mode (DCM)
                </h3>
                <p className="leading-relaxed">
                  With an inductive load (<code className="text-amber-300">L &gt; 0</code>), energy stored in the magnetic field (<code className="text-amber-300">½ L i_o²</code>) forces current to continue flowing even after the AC source voltage crosses zero. If the inductance is large enough that <code className="text-emerald-300">i_o(t) &gt; 0</code> throughout the entire 360° cycle, the converter operates in <strong>CCM</strong>. Otherwise, when current decays to zero at extinction angle <code className="text-amber-300">β</code> before the next switch fires, the circuit enters <strong>DCM</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
