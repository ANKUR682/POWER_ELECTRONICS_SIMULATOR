/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Maximize, Minimize, Moon, Sun } from 'lucide-react';
import { CircuitSchematicPanel } from './components/CircuitSchematicPanel';
import { ControlPanelsGrid } from './components/ControlPanelsGrid';
import { OscilloscopePanel } from './components/OscilloscopePanel';
import {
  ActiveModalType,
  StudioDrawerModal,
} from './components/StudioDrawerModal';
import { TelemetryAndFormulaSection } from './components/TelemetryAndFormulaSection';
import { solveRectifier } from './engine/rectifierSolver';
import {
  BridgeConfig,
  DeviceOrientation,
  DeviceType,
  LoadType,
  PhaseMode,
  PresetScenario,
  QuickDevicePreset,
  ScopeTab,
  SimulationParams,
  SwitchElement,
} from './types/simulation';

function createSwitches(
  phase: PhaseMode,
  bridgeConfig: BridgeConfig,
  preset: QuickDevicePreset,
  orientation: DeviceOrientation = 'forward'
): SwitchElement[] {
  const count =
    phase === '1P'
      ? bridgeConfig === 'full-bridge'
        ? 4
        : 1
      : bridgeConfig === 'full-bridge'
        ? 6
        : 3;

  const list: SwitchElement[] = [];
  for (let i = 1; i <= count; i++) {
    let type: DeviceType = 'D';
    if (preset === 'all-thyristors') {
      type = 'T';
    } else if (preset === 'semi-conv') {
      // Top group Thyristors, bottom group Diodes
      if (phase === '1P') {
        type = i === 1 || i === 3 ? 'T' : 'D';
      } else {
        type = i % 2 === 1 ? 'T' : 'D';
      }
    }
    list.push({
      id: `S${i}`,
      index: i,
      type,
      orientation,
    });
  }
  return list;
}

export default function App() {
  const [params, setParams] = useState<SimulationParams>(() => ({
    phase: '1P',
    bridgeConfig: 'full-bridge',
    devicePreset: 'all-thyristors',
    switches: createSwitches('1P', 'full-bridge', 'all-thyristors', 'forward'),
    alpha: 45,
    freewheeling: false,
    loadType: 'RL',
    R: 20,
    L: 45,
    E: 48,
    Vrms: 230,
    frequency: 50,
  }));

  const [cursorAngle, setCursorAngle] = useState<number>(65);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.5);
  const [scopeTab, setScopeTab] = useState<ScopeTab>('channels');
  const [fullScreenPanel, setFullScreenPanel] = useState<'schematic' | 'scope' | null>(null);
  const [isStudioFullScreen, setIsStudioFullScreen] = useState<boolean>(false);
  const [lightMode, setLightMode] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

  // Solve physical differential equations & harmonic FFT whenever parameters change
  const simResult = useMemo(() => solveRectifier(params), [params]);

  // Real-time animation loop advancing ωt cursor
  useEffect(() => {
    if (!isRunning) return;
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      const dtSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      // Base speed: 90 deg per second at 1x
      const deltaDeg = dtSec * 95 * speedMultiplier;
      setCursorAngle((prev) => (prev + deltaDeg) % 360);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, speedMultiplier]);

  const currentPoint =
    simResult.points[
      Math.min(
        simResult.points.length - 1,
        Math.max(0, Math.round(cursorAngle))
      )
    ] || simResult.points[0];

  // Handlers
  const handlePhaseChange = (phase: PhaseMode) => {
    setParams((prev) => {
      const currentOrientation = prev.switches[0]?.orientation || 'forward';
      const preset = prev.devicePreset === 'custom' ? 'all-thyristors' : prev.devicePreset;
      return {
        ...prev,
        phase,
        devicePreset: preset,
        switches: createSwitches(phase, prev.bridgeConfig, preset, currentOrientation),
      };
    });
  };

  const handleBridgeConfigChange = (bridgeConfig: BridgeConfig) => {
    setParams((prev) => {
      const currentOrientation = prev.switches[0]?.orientation || 'forward';
      const preset = prev.devicePreset === 'custom' ? 'all-thyristors' : prev.devicePreset;
      return {
        ...prev,
        bridgeConfig,
        devicePreset: preset,
        switches: createSwitches(prev.phase, bridgeConfig, preset, currentOrientation),
      };
    });
  };

  const handleDevicePresetChange = (devicePreset: QuickDevicePreset) => {
    setParams((prev) => {
      const currentOrientation = prev.switches[0]?.orientation || 'forward';
      return {
        ...prev,
        devicePreset,
        switches: createSwitches(prev.phase, prev.bridgeConfig, devicePreset, currentOrientation),
      };
    });
  };

  const handleSelectCanonicalCircuit = (
    phase: PhaseMode,
    bridgeConfig: BridgeConfig,
    devicePreset: QuickDevicePreset
  ) => {
    setParams((prev) => {
      const currentOrientation = prev.switches[0]?.orientation || 'forward';
      const nextAlpha =
        devicePreset === 'all-thyristors' && prev.alpha === 0 ? 45 : prev.alpha;
      return {
        ...prev,
        phase,
        bridgeConfig,
        devicePreset,
        alpha: nextAlpha,
        switches: createSwitches(phase, bridgeConfig, devicePreset, currentOrientation),
      };
    });
  };

  const handleToggleSwitchType = (index: number) => {
    setParams((prev) => {
      const nextSwitches = prev.switches.map((sw, idx) =>
        idx === index
          ? { ...sw, type: (sw.type === 'D' ? 'T' : 'D') as DeviceType }
          : sw
      );
      return {
        ...prev,
        devicePreset: 'custom',
        switches: nextSwitches,
      };
    });
  };

  const handleToggleSwitchOrientation = (index: number) => {
    setParams((prev) => {
      const nextSwitches = prev.switches.map((sw, idx) =>
        idx === index
          ? {
              ...sw,
              orientation: (sw.orientation === 'forward'
                ? 'reverse'
                : 'forward') as DeviceOrientation,
            }
          : sw
      );
      return {
        ...prev,
        switches: nextSwitches,
      };
    });
  };

  const handleSetAllOrientations = (orientation: DeviceOrientation) => {
    setParams((prev) => ({
      ...prev,
      switches: prev.switches.map((sw) => ({ ...sw, orientation })),
    }));
  };

  const handleAlphaChange = (alpha: number) => {
    setParams((prev) => {
      const hasAnyThyristor = prev.switches.some((s) => s.type === 'T');
      // If user moves firing angle slider while all diodes are active, automatically switch to Thyristors so α takes effect immediately
      const updatedSwitches =
        !hasAnyThyristor && alpha > 0
          ? prev.switches.map((s) => ({ ...s, type: 'T' as DeviceType }))
          : prev.switches;

      return {
        ...prev,
        alpha,
        devicePreset: !hasAnyThyristor && alpha > 0 ? 'all-thyristors' : prev.devicePreset,
        switches: updatedSwitches,
      };
    });
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    setParams((prev) => {
      const nextPhase = preset.params.phase ?? prev.phase;
      const nextBridge = preset.params.bridgeConfig ?? prev.bridgeConfig;
      const nextDevicePreset = preset.params.devicePreset ?? prev.devicePreset;
      const nextOrientation = preset.params.globalOrientation ?? 'forward';
      return {
        ...prev,
        ...preset.params,
        phase: nextPhase,
        bridgeConfig: nextBridge,
        devicePreset: nextDevicePreset,
        switches: createSwitches(
          nextPhase,
          nextBridge,
          nextDevicePreset,
          nextOrientation
        ),
      };
    });
  };

  const toggleBrowserFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsStudioFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsStudioFullScreen(false);
    }
  };

  const allReversed = params.switches.every((s) => s.orientation === 'reverse');

  return (
    <div
      className={`min-h-screen transition-colors ${
        lightMode
          ? 'bg-slate-50 text-slate-900'
          : 'bg-[#0B0F19] text-slate-100'
      }`}
    >
      {/* ================= A. TOP NAVIGATION BAR (3-ZONE CONTRACT) ================= */}
      <header
        className={`flex items-center justify-between px-6 py-3.5 border-b transition-colors ${
          lightMode
            ? 'bg-white border-slate-200'
            : 'bg-[#0F172A]/95 border-[#1E293B]'
        }`}
      >
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-sky-400 whitespace-nowrap"
        >
          RectifierLab
        </a>

        {/* Zone 2: 4–5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() =>
              handleBridgeConfigChange(
                params.bridgeConfig === 'full-bridge' ? 'half-wave' : 'full-bridge'
              )
            }
            className="hover:text-sky-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
          >
            {params.bridgeConfig === 'full-bridge'
              ? 'Switch to Half-Wave Rectifier'
              : 'Switch to Full-Bridge Rectifier'}
          </button>

          <button
            type="button"
            onClick={() =>
              handleSetAllOrientations(allReversed ? 'forward' : 'reverse')
            }
            className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
          >
            {allReversed
              ? 'Diode Polarity: Reversed (-DC)'
              : 'Flip Diode Orientation'}
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('derivations')}
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
          >
            Waveform Analysis & Derivations
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('presets')}
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
          >
            Presets
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('theory')}
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
          >
            Theory
          </button>
        </nav>

        {/* Zone 3: 1–2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLightMode((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            {lightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark Studio</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleBrowserFullScreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            {isStudioFullScreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Exit Studio</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Full Screen Studio</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Studio Context Subtitle Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            Interactive Single-Phase & Three-Phase Diode/Thyristor Half-Wave and Full-Bridge Converter Simulation Studio
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>RK4 Differential Solver</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Diode Orientation & Commutation Analysis</span>
          </div>
        </div>

        {/* ================= B. MAIN WORKSPACE SPLIT VIEW (TOP HALF) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Left Side (50% Width): Interactive Circuit Schematic Panel */}
          <CircuitSchematicPanel
            params={params}
            currentPoint={currentPoint}
            metrics={simResult.metrics}
            isFullScreen={fullScreenPanel === 'schematic'}
            onToggleFullScreen={() =>
              setFullScreenPanel((prev) =>
                prev === 'schematic' ? null : 'schematic'
              )
            }
            onToggleSwitchType={handleToggleSwitchType}
            onToggleSwitchOrientation={handleToggleSwitchOrientation}
            onSetAllOrientations={handleSetAllOrientations}
            onSetBridgeConfig={handleBridgeConfigChange}
            onSelectCanonicalCircuit={handleSelectCanonicalCircuit}
            onToggleFreewheeling={() =>
              setParams((p) => ({ ...p, freewheeling: !p.freewheeling }))
            }
            lightMode={lightMode}
          />

          {/* Right Side (50% Width): Oscilloscope & Signal Analyzer Panel */}
          <OscilloscopePanel
            params={params}
            points={simResult.points}
            harmonics={simResult.harmonics}
            metrics={simResult.metrics}
            cursorAngle={cursorAngle}
            onChangeCursorAngle={(ang) => {
              setIsRunning(false);
              setCursorAngle(ang);
            }}
            activeTab={scopeTab}
            onChangeTab={setScopeTab}
            isFullScreen={fullScreenPanel === 'scope'}
            onToggleFullScreen={() =>
              setFullScreenPanel((prev) => (prev === 'scope' ? null : 'scope'))
            }
            lightMode={lightMode}
          />
        </div>

        {/* ================= C & D. TRANSPORT BAR & 3-COLUMN CONTROL PANELS ================= */}
        <ControlPanelsGrid
          params={params}
          metrics={simResult.metrics}
          isRunning={isRunning}
          onToggleRun={() => setIsRunning((r) => !r)}
          onStepAngle={(delta) => {
            setIsRunning(false);
            setCursorAngle((prev) => ((prev + delta) % 360 + 360) % 360);
          }}
          onResetAngle={() => {
            setIsRunning(false);
            setCursorAngle(0);
          }}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={setSpeedMultiplier}
          onChangePhase={handlePhaseChange}
          onChangeBridgeConfig={handleBridgeConfigChange}
          onChangeDevicePreset={handleDevicePresetChange}
          onSetAllOrientations={handleSetAllOrientations}
          onToggleSwitchOrientation={handleToggleSwitchOrientation}
          onToggleSwitchType={handleToggleSwitchType}
          onChangeAlpha={handleAlphaChange}
          onToggleFreewheeling={() =>
            setParams((p) => ({ ...p, freewheeling: !p.freewheeling }))
          }
          onChangeLoadType={(loadType: LoadType) =>
            setParams((p) => ({ ...p, loadType }))
          }
          onChangeR={(R: number) => setParams((p) => ({ ...p, R }))}
          onChangeL={(L: number) => setParams((p) => ({ ...p, L }))}
          onChangeE={(E: number) => setParams((p) => ({ ...p, E }))}
          onChangeVrms={(Vrms: number) => setParams((p) => ({ ...p, Vrms }))}
          onChangeFrequency={(frequency: number) =>
            setParams((p) => ({ ...p, frequency }))
          }
          lightMode={lightMode}
        />

        {/* ================= E & F. TELEMETRY CARDS & ANALYTICAL FORMULA CARD ================= */}
        <TelemetryAndFormulaSection
          metrics={simResult.metrics}
          formula={simResult.formula}
          onOpenDerivations={() => setActiveModal('derivations')}
          lightMode={lightMode}
        />
      </main>

      {/* Interactive Modals for Derivations, Presets, and Theory */}
      <StudioDrawerModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        params={params}
        metrics={simResult.metrics}
        formula={simResult.formula}
        onSelectPreset={handleApplyPreset}
      />
    </div>
  );
}
