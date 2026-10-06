import React from 'react';
import {
  ArrowLeftRight,
  Cpu,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sliders,
} from 'lucide-react';
import {
  BridgeConfig,
  DeviceOrientation,
  LoadType,
  PhaseMode,
  QuickDevicePreset,
  SimulationParams,
  TelemetryMetrics,
} from '../types/simulation';

interface ControlPanelsGridProps {
  params: SimulationParams;
  metrics: TelemetryMetrics;
  isRunning: boolean;
  onToggleRun: () => void;
  onStepAngle: (delta: number) => void;
  onResetAngle: () => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  onChangePhase: (phase: PhaseMode) => void;
  onChangeBridgeConfig: (config: BridgeConfig) => void;
  onChangeDevicePreset: (preset: QuickDevicePreset) => void;
  onSetAllOrientations: (orientation: DeviceOrientation) => void;
  onToggleSwitchOrientation: (index: number) => void;
  onToggleSwitchType: (index: number) => void;
  onChangeAlpha: (alpha: number) => void;
  onToggleFreewheeling: () => void;
  onChangeLoadType: (loadType: LoadType) => void;
  onChangeR: (R: number) => void;
  onChangeL: (L: number) => void;
  onChangeE: (E: number) => void;
  onChangeVrms: (Vrms: number) => void;
  onChangeFrequency: (freq: number) => void;
  lightMode: boolean;
}

export const ControlPanelsGrid: React.FC<ControlPanelsGridProps> = ({
  params,
  metrics,
  isRunning,
  onToggleRun,
  onStepAngle,
  onResetAngle,
  speedMultiplier,
  onChangeSpeed,
  onChangePhase,
  onChangeBridgeConfig,
  onChangeDevicePreset,
  onSetAllOrientations,
  onToggleSwitchOrientation,
  onToggleSwitchType,
  onChangeAlpha,
  onToggleFreewheeling,
  onChangeLoadType,
  onChangeR,
  onChangeL,
  onChangeE,
  onChangeVrms,
  onChangeFrequency,
  lightMode,
}) => {
  const allReversed = params.switches.every((s) => s.orientation === 'reverse');
  const hasThyristors = params.switches.some((s) => s.type === 'T');

  const cardClass = lightMode
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#0F172A]/90 border-[#1E293B] text-slate-100';

  return (
    <div className="space-y-4">
      {/* ================= C. SIMULATION TRANSPORT BAR ================= */}
      <div
        className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-4 ${cardClass}`}
      >
        {/* Left: Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleRun}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              isRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Real-Time</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onStepAngle(-5)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Step Back</span>
          </button>

          <button
            type="button"
            onClick={() => onStepAngle(5)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap"
          >
            <span>Step Forward</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetAngle}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Center: Quick Circuit & Polarity Status Summary */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Output Polarity:</span>
          <strong
            className={
              metrics.Vdc >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }
          >
            {metrics.polarityLabel}
          </strong>
          <span aria-hidden="true">·</span>
          <span>Conduction γ:</span>
          <strong className="text-sky-400">{metrics.conductionAngle}°</strong>
          <span aria-hidden="true">·</span>
          <span>Extinction β:</span>
          <strong className="text-amber-400">{metrics.extinctionAngle}°</strong>
        </div>

        {/* Right: Speed Multiplier Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            Speed Multiplier:
          </span>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={speedMultiplier}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-24 accent-emerald-400 bg-slate-800 rounded-lg"
            aria-label="Simulation Speed Multiplier"
          />
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            {[0.1, 0.2, 0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                  Math.abs(speedMultiplier - spd) < 0.05
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= D. 3-COLUMN CONTROL PANELS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COLUMN 1: CONVERTER TOPOLOGY & DIODE ORIENTATION PANEL */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold">1. Converter Topology & Polarity</h3>
              </div>
              <span className="text-xs font-mono text-sky-400">
                {params.phase} · {params.bridgeConfig === 'full-bridge' ? 'Full-Bridge' : 'Half-Wave'}
              </span>
            </div>

            {/* Phase Selector */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Phase System Selector
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangePhase('1P')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    params.phase === '1P'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Single-Phase (1Φ)
                </button>
                <button
                  type="button"
                  onClick={() => onChangePhase('3P')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    params.phase === '3P'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Three-Phase (3Φ)
                </button>
              </div>
            </div>

            {/* Bridge Configuration: Full-Wave Bridge vs Half-Wave */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Wave Configuration (Half-Wave vs Full-Wave)
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangeBridgeConfig('full-bridge')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    params.bridgeConfig === 'full-bridge'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full-Wave (Bridge)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeBridgeConfig('half-wave')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    params.bridgeConfig === 'half-wave'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Half-Wave Rectifier
                </button>
              </div>
            </div>

            {/* Quick Semiconductor Device Setup */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Rectifier Type (DBR Diode vs Thyristor Controlled)
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
                {(
                  [
                    { id: 'all-diodes', label: 'DBR (All Diodes)' },
                    { id: 'all-thyristors', label: 'Thyristor (SCR)' },
                    { id: 'semi-conv', label: 'Semi-Conv' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeDevicePreset(item.id)}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      params.devicePreset === item.id
                        ? 'bg-sky-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diode / Switch Orientation (Polarity) Control */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  Diode / Switch Orientation
                </span>
                <span className="font-mono text-amber-400">
                  {allReversed ? 'Reversed (-DC)' : 'Forward (+DC)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSetAllOrientations('forward')}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    !allReversed
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ▲ Forward (+Vo)
                </button>
                <button
                  type="button"
                  onClick={() => onSetAllOrientations('reverse')}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    allReversed
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ▼ Reversed (-Vo)
                </button>
              </div>
            </div>
          </div>

          {/* Individual Switch Orientation Matrix */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Per-Diode Flip:</span>
            <div className="flex flex-wrap gap-1">
              {params.switches.map((sw, idx) => (
                <button
                  key={sw.id}
                  type="button"
                  onClick={() => onToggleSwitchOrientation(idx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onToggleSwitchType(idx);
                  }}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                    sw.orientation === 'reverse'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-sky-300 hover:border-slate-700'
                  }`}
                  title="Click to flip orientation (Forward/Reverse)"
                >
                  {sw.type}
                  {sw.index}
                  {sw.orientation === 'reverse' ? '▼' : '▲'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: FIRING ANGLE α & FREEWHEELING DIODE PANEL */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">2. Firing Angle α & Commutation</h3>
              </div>
              <span className="text-xs font-mono text-amber-400 font-semibold">
                α = {hasThyristors ? `${params.alpha}°` : '0° (Diode)'}
              </span>
            </div>

            {/* Firing Angle α Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">
                  Gate Trigger Delay Angle (α)
                </span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {params.alpha}°
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={180}
                step={1}
                value={params.alpha}
                onChange={(e) => onChangeAlpha(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg"
                aria-label="Firing Angle Alpha"
              />

              {!hasThyristors && (
                <p className="mt-1 text-[11px] text-amber-300/90">
                  Note: Adjusting α automatically enables Thyristor gate control or click "All Thyristors".
                </p>
              )}

              {/* Quick Alpha Presets */}
              <div className="mt-3 grid grid-cols-7 gap-1">
                {[0, 30, 45, 60, 90, 120, 150].map((ang) => (
                  <button
                    key={ang}
                    type="button"
                    onClick={() => onChangeAlpha(ang)}
                    className={`py-1 rounded border text-xs font-mono transition-colors ${
                      params.alpha === ang
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ang}°
                  </button>
                ))}
              </div>
            </div>

            {/* Freewheeling Diode Toggle */}
            <div className="pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Freewheeling Diode (D_FW)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Clamps load voltage reversal & circulates inductive current
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleFreewheeling}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors whitespace-nowrap ${
                    params.freewheeling
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {params.freewheeling ? 'Connected' : 'Disconnected'}
                </button>
              </div>
            </div>
          </div>

          {/* Commutation Readouts */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Extinction β: <strong className="text-slate-200">{metrics.extinctionAngle}°</strong>
            </span>
            <span>·</span>
            <span>
              Conduction γ: <strong className="text-emerald-400">{metrics.conductionAngle}°</strong>
            </span>
          </div>
        </div>

        {/* COLUMN 3: LOAD & SOURCE PARAMETERS PANEL */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${cardClass}`}>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">3. Load & Source Parameters</h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onChangeFrequency(params.frequency === 50 ? 60 : 50)}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-400 hover:border-slate-700"
                >
                  {params.frequency} Hz
                </button>
              </div>
            </div>

            {/* Load Type Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
              {(
                [
                  { id: 'R', label: 'R Load' },
                  { id: 'RL', label: 'RL Load' },
                  { id: 'RLE', label: 'RLE Load' },
                ] as const
              ).map((lt) => (
                <button
                  key={lt.id}
                  type="button"
                  onClick={() => onChangeLoadType(lt.id)}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    params.loadType === lt.id
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>

            {/* Resistance R Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Load Resistance (R)</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {params.R} Ω
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={params.R}
                onChange={(e) => onChangeR(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 rounded-lg"
                aria-label="Load Resistance R"
              />
            </div>

            {/* Inductance L Slider */}
            <div className={params.loadType === 'R' ? 'opacity-40 pointer-events-none' : ''}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Load Inductance (L)</span>
                <span className="font-mono font-semibold text-amber-400">
                  {params.loadType === 'R' ? '0 mH' : `${params.L} mH`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={params.L}
                onChange={(e) => onChangeL(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg"
                aria-label="Load Inductance L"
              />
            </div>

            {/* Source RMS Voltage Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Source RMS Voltage (V_rms)</span>
                <span className="font-mono font-semibold text-sky-400">
                  {params.Vrms} V
                </span>
              </div>
              <input
                type="range"
                min={24}
                max={400}
                step={2}
                value={params.Vrms}
                onChange={(e) => onChangeVrms(Number(e.target.value))}
                className="w-full accent-sky-400 bg-slate-800 rounded-lg"
                aria-label="Source RMS Voltage"
              />
            </div>

            {/* Back-EMF E Slider (Visible when RLE is selected) */}
            {params.loadType === 'RLE' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">DC Back-EMF Voltage (E)</span>
                  <span className="font-mono font-semibold text-purple-400">
                    {params.E} V
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={200}
                  step={2}
                  value={params.E}
                  onChange={(e) => onChangeE(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 rounded-lg"
                  aria-label="Back EMF Voltage E"
                />
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Peak V_m: <strong className="text-sky-400">{(Math.SQRT2 * params.Vrms).toFixed(1)} V</strong>
            </span>
            <span>·</span>
            <span>
              τ = L/R:{' '}
              <strong className="text-amber-400">
                {params.loadType === 'R' ? '0.0' : (params.L / params.R).toFixed(1)} ms
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
