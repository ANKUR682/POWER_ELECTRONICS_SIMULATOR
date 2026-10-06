import React from 'react';
import {
  ArrowLeftRight,
  Cpu,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  BridgeConfig,
  DeviceOrientation,
  PhaseMode,
  QuickDevicePreset,
  SimulationParams,
  SwitchElement,
  TelemetryMetrics,
  WaveformPoint,
} from '../types/simulation';

interface CircuitSchematicPanelProps {
  params: SimulationParams;
  currentPoint: WaveformPoint;
  metrics: TelemetryMetrics;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onToggleSwitchType: (index: number) => void;
  onToggleSwitchOrientation: (index: number) => void;
  onSetAllOrientations: (orientation: DeviceOrientation) => void;
  onSetBridgeConfig: (config: BridgeConfig) => void;
  onSelectCanonicalCircuit: (
    phase: PhaseMode,
    bridgeConfig: BridgeConfig,
    devicePreset: QuickDevicePreset
  ) => void;
  onToggleFreewheeling: () => void;
  lightMode: boolean;
}

export const CircuitSchematicPanel: React.FC<CircuitSchematicPanelProps> = ({
  params,
  currentPoint,
  metrics,
  isFullScreen,
  onToggleFullScreen,
  onToggleSwitchType,
  onToggleSwitchOrientation,
  onSetAllOrientations,
  onSelectCanonicalCircuit,
  onToggleFreewheeling,
  lightMode,
}) => {
  const { phase, bridgeConfig, switches, freewheeling, loadType, R, L, E, alpha } =
    params;
  const activeSet = new Set(currentPoint.activeDevices);
  const isConducting = Math.abs(currentPoint.io) > 1e-3;
  const allReversed = switches.every((s) => s.orientation === 'reverse');
  const anyReversed = switches.some((s) => s.orientation === 'reverse');
  const hasThyristors = switches.some((s) => s.type === 'T');
  const allDiodes = switches.every((s) => s.type === 'D');
  const allThyristors = switches.every((s) => s.type === 'T');

  const circuitTypeLabel = allDiodes
    ? bridgeConfig === 'full-bridge'
      ? 'DIODE BRIDGE RECTIFIER (DBR)'
      : 'UNCONTROLLED DIODE RECTIFIER'
    : allThyristors
      ? 'THYRISTOR CONTROLLED RECTIFIER (SCR)'
      : 'SEMI-CONTROLLED HYBRID RECTIFIER';

  const modeTitle = `${phase === '1P' ? '1-PHASE' : '3-PHASE'} ${
    bridgeConfig === 'full-bridge' ? 'FULL-WAVE' : 'HALF-WAVE'
  } — ${circuitTypeLabel}`;

  const renderDiodeOrThyristorSymbol = (
    sw: SwitchElement,
    cx: number,
    cy: number,
    direction: 'up' | 'right' | 'down' | 'left',
    isActive: boolean,
    compactBadge = false
  ) => {
    const dirMap: Record<string, Record<DeviceOrientation, number>> = {
      up: { forward: -90, reverse: 90 },
      right: { forward: 0, reverse: 180 },
      down: { forward: 90, reverse: -90 },
      left: { forward: 180, reverse: 0 },
    };
    const rotDeg = dirMap[direction][sw.orientation];

    const strokeColor = isActive
      ? sw.orientation === 'reverse'
        ? '#F43F5E'
        : '#10B981'
      : sw.orientation === 'reverse'
        ? '#F59E0B'
        : sw.type === 'T'
          ? '#38BDF8'
          : '#64748B';

    const fillColor = isActive
      ? sw.orientation === 'reverse'
        ? 'rgba(244, 63, 94, 0.35)'
        : 'rgba(16, 185, 129, 0.35)'
      : '#0F172A';

    const tagText = `${sw.type}${sw.index}${sw.orientation === 'reverse' ? 'R' : ''}`;
    const badgeOffsetX = compactBadge ? 18 : 23;
    const badgeOffsetY = compactBadge ? -18 : -20;

    return (
      <g key={sw.id} className="select-none">
        {isActive && (
          <circle
            cx={cx}
            cy={cy}
            r={compactBadge ? 20 : 24}
            fill={
              sw.orientation === 'reverse'
                ? 'rgba(244,63,94,0.16)'
                : 'rgba(16,185,129,0.16)'
            }
          />
        )}

        {/* Rotated Semiconductor Symbol */}
        <g transform={`translate(${cx}, ${cy}) rotate(${rotDeg})`}>
          <line x1={-20} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={2.4} />
          <line x1={10} y1={0} x2={20} y2={0} stroke={strokeColor} strokeWidth={2.4} />
          {/* Diode / SCR Anode-to-Cathode Triangle */}
          <polygon
            points="-10,-10 -10,10 10,0"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2.1}
            strokeLinejoin="round"
          />
          {/* Cathode Bar */}
          <line x1={10} y1={-11} x2={10} y2={11} stroke={strokeColor} strokeWidth={2.7} />
          {/* Thyristor Gate Lead + Pulse Indicator */}
          {sw.type === 'T' && (
            <>
              <polyline
                points="10,-4 17,-13 24,-13"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx={24} cy={-13} r={2.2} fill="#F59E0B" />
            </>
          )}
        </g>

        {/* Interactive Component Control Badge (Type D/T + Flip Orientation) */}
        <g transform={`translate(${cx + badgeOffsetX}, ${cy + badgeOffsetY})`}>
          <g
            onClick={() => onToggleSwitchType(sw.index - 1)}
            className="cursor-pointer hover:opacity-90"
          >
            <rect
              x={0}
              y={0}
              width={34}
              height={17}
              rx={4}
              fill={isActive ? '#064E3B' : '#1E293B'}
              stroke={isActive ? '#10B981' : sw.type === 'T' ? '#F59E0B' : '#334155'}
              strokeWidth={1.1}
            />
            <text
              x={17}
              y={11.5}
              textAnchor="middle"
              fill={isActive ? '#6EE7B7' : sw.type === 'T' ? '#FBBF24' : '#38BDF8'}
              fontSize={9.5}
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {tagText}
            </text>
          </g>

          <g
            onClick={() => onToggleSwitchOrientation(sw.index - 1)}
            className="cursor-pointer hover:opacity-90"
          >
            <rect
              x={0}
              y={19}
              width={34}
              height={15}
              rx={3.5}
              fill={sw.orientation === 'reverse' ? '#451A03' : '#0F172A'}
              stroke={sw.orientation === 'reverse' ? '#F59E0B' : '#334155'}
              strokeWidth={1}
            />
            <text
              x={17}
              y={29.5}
              textAnchor="middle"
              fill={sw.orientation === 'reverse' ? '#FBBF24' : '#94A3B8'}
              fontSize={8}
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {sw.orientation === 'reverse' ? 'REV ▾' : 'FWD ▴'}
            </text>
          </g>
        </g>
      </g>
    );
  };

  // Determine active 3-phase indices for schematic current loop animation
  const active3PTopIdx = currentPoint.activeDevices.some((d) => d.includes('1'))
    ? 0
    : currentPoint.activeDevices.some((d) =>
          d.includes(bridgeConfig === 'full-bridge' ? '3' : '2')
        )
      ? 1
      : currentPoint.activeDevices.some((d) =>
            d.includes(bridgeConfig === 'full-bridge' ? '5' : '3')
          )
        ? 2
        : -1;

  const active3PBotIdx =
    bridgeConfig === 'full-bridge'
      ? currentPoint.activeDevices.some((d) => d.includes('4'))
        ? 0
        : currentPoint.activeDevices.some((d) => d.includes('6'))
          ? 1
          : currentPoint.activeDevices.some((d) => d.includes('2'))
            ? 2
            : -1
      : -1;

  const CANONICAL_CIRCUITS: Array<{
    id: string;
    shortLabel: string;
    phase: PhaseMode;
    bridgeConfig: BridgeConfig;
    preset: QuickDevicePreset;
    isThyristor: boolean;
  }> = [
    {
      id: '1p-hw-d',
      shortLabel: '1Φ Half-Wave Diode',
      phase: '1P',
      bridgeConfig: 'half-wave',
      preset: 'all-diodes',
      isThyristor: false,
    },
    {
      id: '1p-hw-t',
      shortLabel: '1Φ Half-Wave Thyristor',
      phase: '1P',
      bridgeConfig: 'half-wave',
      preset: 'all-thyristors',
      isThyristor: true,
    },
    {
      id: '1p-fw-dbr',
      shortLabel: '1Φ Full-Wave DBR',
      phase: '1P',
      bridgeConfig: 'full-bridge',
      preset: 'all-diodes',
      isThyristor: false,
    },
    {
      id: '1p-fw-tcr',
      shortLabel: '1Φ Full-Wave Thyristor',
      phase: '1P',
      bridgeConfig: 'full-bridge',
      preset: 'all-thyristors',
      isThyristor: true,
    },
    {
      id: '3p-hw-d',
      shortLabel: '3Φ Half-Wave Diode',
      phase: '3P',
      bridgeConfig: 'half-wave',
      preset: 'all-diodes',
      isThyristor: false,
    },
    {
      id: '3p-hw-t',
      shortLabel: '3Φ Half-Wave Thyristor',
      phase: '3P',
      bridgeConfig: 'half-wave',
      preset: 'all-thyristors',
      isThyristor: true,
    },
    {
      id: '3p-fw-dbr',
      shortLabel: '3Φ Full-Wave DBR',
      phase: '3P',
      bridgeConfig: 'full-bridge',
      preset: 'all-diodes',
      isThyristor: false,
    },
    {
      id: '3p-fw-tcr',
      shortLabel: '3Φ Full-Wave Thyristor',
      phase: '3P',
      bridgeConfig: 'full-bridge',
      preset: 'all-thyristors',
      isThyristor: true,
    },
  ];

  return (
    <section
      className={`rounded-xl border transition-colors flex flex-col justify-between ${
        lightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0F172A]/90 border-[#1E293B] text-slate-100'
      } ${isFullScreen ? 'fixed inset-4 z-50 p-6 shadow-2xl' : 'p-4'}`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold tracking-tight">
              {modeTitle}
            </h2>
          </div>

          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>

          {/* Non-Hue-Only Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                metrics.conductionMode === 'CCM'
                  ? 'bg-emerald-400 ring-4 ring-emerald-500/20'
                  : metrics.conductionMode === 'DCM'
                    ? 'bg-amber-400 ring-4 ring-amber-500/20'
                    : 'bg-rose-500 ring-4 ring-rose-500/20'
              }`}
            />
            <span
              className={
                metrics.conductionMode === 'CCM'
                  ? 'text-emerald-400 font-medium'
                  : metrics.conductionMode === 'DCM'
                    ? 'text-amber-400 font-medium'
                    : 'text-rose-400 font-medium'
              }
            >
              {metrics.conductionMode === 'CCM'
                ? '● CCM (Continuous)'
                : metrics.conductionMode === 'DCM'
                  ? `▲ DCM (${isConducting ? currentPoint.conductingLabel : 'Open'})`
                  : '✖ BLOCKED'}
            </span>
          </div>
        </div>

        {/* Polarity & Fullscreen Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetAllOrientations(allReversed ? 'forward' : 'reverse')}
            title="Flip all diode/thyristor orientations (Anode <-> Cathode)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
              anyReversed
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>
              {allReversed
                ? 'Polarity: Reversed (-DC)'
                : anyReversed
                  ? 'Polarity: Custom'
                  : 'Polarity: Forward (+DC)'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleFullScreen}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Schematic'}
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 8-Circuit Direct Quick Selector Matrix (1Φ & 3Φ, Half-Wave & Full-Wave, DBR & Thyristor Controlled) */}
      <div className="py-2 border-b border-slate-800/70">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            Select Standard Rectifier Circuit (DBR vs Thyristor Controlled):
          </span>
          <span className="font-mono text-slate-400">
            ωt = <strong className="text-sky-400">{currentPoint.angle.toFixed(0)}°</strong> · Active:{' '}
            <strong className={isConducting ? 'text-emerald-400' : 'text-amber-400'}>
              {currentPoint.conductingLabel}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CANONICAL_CIRCUITS.map((c) => {
            const isSelected =
              phase === c.phase &&
              bridgeConfig === c.bridgeConfig &&
              ((c.isThyristor && allThyristors) || (!c.isThyristor && allDiodes));

            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  onSelectCanonicalCircuit(c.phase, c.bridgeConfig, c.preset)
                }
                className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all whitespace-nowrap truncate cursor-pointer ${
                  isSelected
                    ? c.isThyristor
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-xs'
                      : 'bg-sky-500 text-slate-950 border-sky-400 font-semibold shadow-xs'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {c.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Circuit Canvas */}
      <div className="relative flex-1 min-h-[340px] mt-2 flex items-center justify-center bg-[#070B14] rounded-lg border border-slate-800/80 overflow-hidden">
        <svg
          viewBox="0 0 680 360"
          className="w-full h-full max-h-[420px]"
          aria-label="Interactive Power Electronics Rectifier Schematic"
        >
          <defs>
            <pattern
              id="schematicGrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="rgba(30, 41, 59, 0.45)"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>

          <rect width="680" height="360" fill="url(#schematicGrid)" />

          {/* ================= 1. 1-PHASE FULL-WAVE (DBR & THYRISTOR BRIDGE) ================= */}
          {phase === '1P' && bridgeConfig === 'full-bridge' && (
            <g>
              {/* AC Source to Bridge Legs */}
              <polyline
                points="85,145 85,95 210,95 210,175"
                fill="none"
                stroke="#334155"
                strokeWidth={2.5}
              />
              <polyline
                points="85,215 85,285 330,285 330,195"
                fill="none"
                stroke="#334155"
                strokeWidth={2.5}
              />

              {/* Bridge Leg 1 (x=210) and Leg 2 (x=330) */}
              <line x1={210} y1={55} x2={210} y2={305} stroke="#334155" strokeWidth={2.5} />
              <line x1={330} y1={55} x2={330} y2={305} stroke="#334155" strokeWidth={2.5} />

              {/* Top DC Bus (+Vo) and Bottom DC Bus (-Vo) */}
              <line x1={210} y1={55} x2={560} y2={55} stroke="#334155" strokeWidth={2.5} />
              <line x1={210} y1={305} x2={560} y2={305} stroke="#334155" strokeWidth={2.5} />

              {/* Animated Active Current Loop Overlay */}
              {isConducting && currentPoint.loopMode === 'pos-pair' && (
                <path
                  d={
                    currentPoint.polarity === 1
                      ? 'M 85,180 L 85,95 L 210,95 L 210,55 L 560,55 L 560,305 L 330,305 L 330,285 L 85,285 Z'
                      : 'M 85,180 L 85,285 L 330,285 L 330,305 L 560,305 L 560,55 L 210,55 L 210,95 L 85,95 Z'
                  }
                  fill="none"
                  stroke={currentPoint.polarity === 1 ? '#10B981' : '#F43F5E'}
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {isConducting && currentPoint.loopMode === 'neg-pair' && (
                <path
                  d={
                    currentPoint.polarity === 1
                      ? 'M 85,180 L 85,285 L 330,285 L 330,55 L 560,55 L 560,305 L 210,305 L 210,95 L 85,95 Z'
                      : 'M 85,180 L 85,95 L 210,95 L 210,305 L 560,305 L 560,55 L 330,55 L 330,285 L 85,285 Z'
                  }
                  fill="none"
                  stroke={currentPoint.polarity === 1 ? '#10B981' : '#F43F5E'}
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {isConducting && currentPoint.loopMode === 'freewheel' && (
                <path
                  d={
                    freewheeling
                      ? 'M 445,305 L 445,55 L 560,55 L 560,305 Z'
                      : 'M 210,305 L 210,55 L 560,55 L 560,305 Z'
                  }
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {/* Phase A & Neutral Node Labels */}
              <circle cx={210} cy={175} r={4.5} fill="#38BDF8" />
              <text x={156} y={178} fill="#38BDF8" fontSize={10} fontFamily="JetBrains Mono">
                Line (A)
              </text>
              <circle cx={330} cy={195} r={4.5} fill="#94A3B8" />
              <text x={265} y={199} fill="#94A3B8" fontSize={10} fontFamily="JetBrains Mono">
                Neutral (N)
              </text>

              {/* Synchronized Gate Firing Unit when Thyristor Controlled */}
              {hasThyristors && (
                <g transform="translate(115, 16)">
                  <rect
                    x={0}
                    y={0}
                    width={185}
                    height={24}
                    rx={5}
                    fill="#1E1B4B"
                    stroke="#F59E0B"
                    strokeWidth={1.2}
                  />
                  <text
                    x={92}
                    y={15.5}
                    textAnchor="middle"
                    fill="#FBBF24"
                    fontSize={9.5}
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    SCR GATE PULSE GEN (α = {alpha}°)
                  </text>
                </g>
              )}

              {/* 4 Bridge Switches: S1, S4, S3, S2 */}
              {renderDiodeOrThyristorSymbol(
                switches[0],
                210,
                115,
                'up',
                activeSet.has(`${switches[0].type}1`) ||
                  activeSet.has(`${switches[0].type}1R`)
              )}
              {renderDiodeOrThyristorSymbol(
                switches[3],
                210,
                240,
                'up',
                activeSet.has(`${switches[3].type}4`) ||
                  activeSet.has(`${switches[3].type}4R`)
              )}
              {renderDiodeOrThyristorSymbol(
                switches[2],
                330,
                115,
                'up',
                activeSet.has(`${switches[2].type}3`) ||
                  activeSet.has(`${switches[2].type}3R`)
              )}
              {renderDiodeOrThyristorSymbol(
                switches[1],
                330,
                245,
                'up',
                activeSet.has(`${switches[1].type}2`) ||
                  activeSet.has(`${switches[1].type}2R`)
              )}
            </g>
          )}

          {/* ================= 2. 1-PHASE HALF-WAVE (DIODE & THYRISTOR CONTROLLED) ================= */}
          {phase === '1P' && bridgeConfig === 'half-wave' && (
            <g>
              {/* Top & Bottom Rails */}
              <line x1={85} y1={145} x2={85} y2={55} stroke="#334155" strokeWidth={2.5} />
              <line x1={85} y1={55} x2={560} y2={55} stroke="#334155" strokeWidth={2.5} />
              <line x1={85} y1={215} x2={85} y2={305} stroke="#334155" strokeWidth={2.5} />
              <line x1={85} y1={305} x2={560} y2={305} stroke="#334155" strokeWidth={2.5} />

              {/* Animated Current Loop */}
              {isConducting && currentPoint.loopMode !== 'freewheel' && (
                <path
                  d={
                    currentPoint.polarity === 1
                      ? 'M 85,180 L 85,55 L 560,55 L 560,305 L 85,305 Z'
                      : 'M 85,180 L 85,305 L 560,305 L 560,55 L 85,55 Z'
                  }
                  fill="none"
                  stroke={currentPoint.polarity === 1 ? '#10B981' : '#F43F5E'}
                  strokeWidth={3.4}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {isConducting && currentPoint.loopMode === 'freewheel' && (
                <path
                  d="M 445,305 L 445,55 L 560,55 L 560,305 Z"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {/* Single Series Switch S1 on Top Rail */}
              {renderDiodeOrThyristorSymbol(
                switches[0],
                265,
                55,
                'right',
                activeSet.has(`${switches[0].type}1`) ||
                  activeSet.has(`${switches[0].type}1R`)
              )}

              {/* Gate Trigger Unit Box for 1P Half-Wave Thyristor */}
              {switches[0]?.type === 'T' && (
                <g transform="translate(185, 110)">
                  <line
                    x1={80}
                    y1={0}
                    x2={80}
                    y2={-42}
                    stroke="#F59E0B"
                    strokeWidth={1.6}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={0}
                    y={0}
                    width={195}
                    height={36}
                    rx={6}
                    fill="#1E1B4B"
                    stroke="#F59E0B"
                    strokeWidth={1.3}
                  />
                  <text
                    x={97}
                    y={15}
                    textAnchor="middle"
                    fill="#FBBF24"
                    fontSize={10}
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    THYRISTOR GATE TRIGGER (T1)
                  </text>
                  <text
                    x={97}
                    y={28}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize={9.5}
                    fontFamily="JetBrains Mono"
                  >
                    Firing Delay α = {alpha}°
                  </text>
                </g>
              )}

              {/* Educational Callout on Half-Wave Operation */}
              <g transform="translate(175, 175)">
                <rect
                  x={0}
                  y={0}
                  width={220}
                  height={62}
                  rx={8}
                  fill="#0F172A"
                  stroke={switches[0].orientation === 'reverse' ? '#F59E0B' : '#1E293B'}
                  strokeWidth={1.2}
                />
                <text x={12} y={20} fill="#E2E8F0" fontSize={10.5} fontWeight="600">
                  {switches[0].type === 'T'
                    ? '1Φ Half-Wave Controlled SCR:'
                    : '1Φ Half-Wave Uncontrolled Diode:'}
                </text>
                <text
                  x={12}
                  y={38}
                  fill={switches[0].orientation === 'reverse' ? '#FBBF24' : '#38BDF8'}
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                >
                  {switches[0].orientation === 'reverse'
                    ? '◀ REVERSED (Conducts -Half Cycle)'
                    : '▶ FORWARD (Conducts +Half Cycle)'}
                </text>
                <text x={12} y={53} fill="#94A3B8" fontSize={9.5} fontFamily="JetBrains Mono">
                  {switches[0].type === 'T'
                    ? `Triggered at ωt = ${alpha}°`
                    : 'Natural conduction at ωt = 0°'}
                </text>
              </g>
            </g>
          )}

          {/* ================= 3. 3-PHASE HALF-WAVE (3-PULSE DIODE & THYRISTOR) ================= */}
          {phase === '3P' && bridgeConfig === 'half-wave' && (
            <g>
              {/* 3-Phase Y-Connected Source Box on Left */}
              <g transform="translate(26, 70)">
                <rect
                  x={0}
                  y={0}
                  width={92}
                  height={245}
                  rx={8}
                  fill="#0F172A"
                  stroke="#1E293B"
                  strokeWidth={1.5}
                />
                <text
                  x={46}
                  y={20}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={9.5}
                  fontWeight="700"
                  fontFamily="JetBrains Mono"
                >
                  3Φ Y-SOURCE
                </text>

                {/* Phase A, B, C Sources */}
                {[
                  { label: 'Va', y: 55, color: '#38BDF8' },
                  { label: 'Vb', y: 115, color: '#F59E0B' },
                  { label: 'Vc', y: 175, color: '#A855F7' },
                ].map((ph) => (
                  <g key={ph.label} transform={`translate(46, ${ph.y})`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={16}
                      fill="#070B14"
                      stroke={ph.color}
                      strokeWidth={1.8}
                    />
                    <path
                      d="M -8,0 Q -4,-7 0,0 T 8,0"
                      fill="none"
                      stroke={ph.color}
                      strokeWidth={1.6}
                    />
                    <text
                      x={-24}
                      y={4}
                      textAnchor="end"
                      fill={ph.color}
                      fontSize={10}
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      {ph.label}
                    </text>
                  </g>
                ))}

                {/* Star Neutral Return Terminal N */}
                <circle cx={46} cy={225} r={4} fill="#94A3B8" />
                <text
                  x={46}
                  y={240}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={9}
                  fontFamily="JetBrains Mono"
                >
                  Neutral (N)
                </text>
              </g>

              {/* 3 Phase Horizontal Feeds with Series Diodes/Thyristors D1/T1, D2/T2, D3/T3 */}
              {[125, 185, 245].map((yPos, idx) => (
                <g key={yPos}>
                  <line
                    x1={88}
                    y1={yPos}
                    x2={355}
                    y2={yPos}
                    stroke="#334155"
                    strokeWidth={2.4}
                  />
                  <circle cx={355} cy={yPos} r={4} fill="#38BDF8" />
                  {renderDiodeOrThyristorSymbol(
                    switches[idx] || {
                      id: `S${idx + 1}`,
                      index: idx + 1,
                      type: hasThyristors ? 'T' : 'D',
                      orientation: 'forward',
                    },
                    235,
                    yPos,
                    'right',
                    active3PTopIdx === idx,
                    true
                  )}
                </g>
              ))}

              {/* Common Cathode Collector Bus at x=355 up to Top DC Rail y=55 */}
              <polyline
                points="355,245 355,55 560,55"
                fill="none"
                stroke="#334155"
                strokeWidth={2.5}
              />

              {/* Neutral Return Wire from Star Point (72, 295) to Load Bottom (560, 305) */}
              <polyline
                points="72,295 72,305 560,305"
                fill="none"
                stroke="#475569"
                strokeWidth={2.5}
                strokeDasharray="6 3"
              />
              <text
                x={235}
                y={322}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize={9.5}
                fontFamily="JetBrains Mono"
              >
                Star Neutral Return Wire (N) — 3-Pulse Midpoint Loop
              </text>

              {/* Animated Active 3-Pulse Half-Wave Current Loop */}
              {isConducting && active3PTopIdx >= 0 && currentPoint.loopMode !== 'freewheel' && (
                <path
                  d={`M 88,${125 + active3PTopIdx * 60} L 355,${
                    125 + active3PTopIdx * 60
                  } L 355,55 L 560,55 L 560,305 L 72,305`}
                  fill="none"
                  stroke={currentPoint.polarity === 1 ? '#10B981' : '#F43F5E'}
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {isConducting && currentPoint.loopMode === 'freewheel' && (
                <path
                  d="M 445,305 L 445,55 L 560,55 L 560,305 Z"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {/* 3-Pulse Gate Control Unit Badge when Thyristors Active */}
              {hasThyristors && (
                <g transform="translate(155, 22)">
                  <rect
                    x={0}
                    y={0}
                    width={190}
                    height={24}
                    rx={5}
                    fill="#1E1B4B"
                    stroke="#F59E0B"
                    strokeWidth={1.2}
                  />
                  <text
                    x={95}
                    y={15.5}
                    textAnchor="middle"
                    fill="#FBBF24"
                    fontSize={9.5}
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    3Φ SCR GATE UNIT (α = {alpha}°)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= 4. 3-PHASE FULL-WAVE BRIDGE (6-PULSE DBR & THYRISTOR BRIDGE) ================= */}
          {phase === '3P' && bridgeConfig === 'full-bridge' && (
            <g>
              {/* 3-Phase Source Box on Left */}
              <g transform="translate(20, 88)">
                <rect
                  x={0}
                  y={0}
                  width={82}
                  height={184}
                  rx={8}
                  fill="#0F172A"
                  stroke="#1E293B"
                  strokeWidth={1.5}
                />
                <text
                  x={41}
                  y={18}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={9}
                  fontWeight="700"
                  fontFamily="JetBrains Mono"
                >
                  3Φ SOURCE
                </text>
                {[
                  { label: 'Va', y: 47, color: '#38BDF8' },
                  { label: 'Vb', y: 97, color: '#F59E0B' },
                  { label: 'Vc', y: 147, color: '#A855F7' },
                ].map((ph) => (
                  <g key={ph.label} transform={`translate(48, ${ph.y})`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={14}
                      fill="#070B14"
                      stroke={ph.color}
                      strokeWidth={1.8}
                    />
                    <path
                      d="M -7,0 Q -3.5,-6 0,0 T 7,0"
                      fill="none"
                      stroke={ph.color}
                      strokeWidth={1.5}
                    />
                    <text
                      x={-20}
                      y={4}
                      textAnchor="end"
                      fill={ph.color}
                      fontSize={9.5}
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      {ph.label}
                    </text>
                  </g>
                ))}
              </g>

              {/* 3 Phase Feed Lines to the 3 Bridge Legs (x=175, x=265, x=355) */}
              <line x1={82} y1={135} x2={175} y2={135} stroke="#38BDF8" strokeWidth={2.2} />
              <line x1={82} y1={185} x2={265} y2={185} stroke="#F59E0B" strokeWidth={2.2} />
              <line x1={82} y1={235} x2={355} y2={235} stroke="#A855F7" strokeWidth={2.2} />

              {/* Top & Bottom DC Bus Rails */}
              <line x1={175} y1={55} x2={560} y2={55} stroke="#334155" strokeWidth={2.5} />
              <line x1={175} y1={305} x2={560} y2={305} stroke="#334155" strokeWidth={2.5} />

              {/* 3 Vertical Bridge Legs: Leg A (x=175), Leg B (x=265), Leg C (x=355) */}
              {[175, 265, 355].map((lx, idx) => (
                <g key={lx}>
                  <line x1={lx} y1={55} x2={lx} y2={305} stroke="#334155" strokeWidth={2.2} />
                  <circle
                    cx={lx}
                    cy={135 + idx * 50}
                    r={4.5}
                    fill={idx === 0 ? '#38BDF8' : idx === 1 ? '#F59E0B' : '#A855F7'}
                  />
                </g>
              ))}

              {/* Animated 6-Pulse Full-Bridge Active Current Loop */}
              {isConducting &&
                active3PTopIdx >= 0 &&
                active3PBotIdx >= 0 &&
                currentPoint.loopMode !== 'freewheel' && (
                  <path
                    d={`M 82,${135 + active3PTopIdx * 50} L ${
                      175 + active3PTopIdx * 90
                    },${135 + active3PTopIdx * 50} L ${
                      175 + active3PTopIdx * 90
                    },55 L 560,55 L 560,305 L ${
                      175 + active3PBotIdx * 90
                    },305 L ${175 + active3PBotIdx * 90},${
                      135 + active3PBotIdx * 50
                    } L 82,${135 + active3PBotIdx * 50}`}
                    fill="none"
                    stroke={currentPoint.polarity === 1 ? '#10B981' : '#F43F5E'}
                    strokeWidth={3.2}
                    strokeDasharray="8 6"
                    className="animate-current-flow"
                  />
                )}

              {isConducting && currentPoint.loopMode === 'freewheel' && (
                <path
                  d="M 445,305 L 445,55 L 560,55 L 560,305 Z"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3.2}
                  strokeDasharray="8 6"
                  className="animate-current-flow"
                />
              )}

              {/* Top Group Switches (S1 on Leg A, S3 on Leg B, S5 on Leg C) */}
              {renderDiodeOrThyristorSymbol(
                switches[0],
                175,
                92,
                'up',
                active3PTopIdx === 0,
                true
              )}
              {renderDiodeOrThyristorSymbol(
                switches[2] || switches[1],
                265,
                92,
                'up',
                active3PTopIdx === 1,
                true
              )}
              {renderDiodeOrThyristorSymbol(
                switches[4] || switches[2],
                355,
                92,
                'up',
                active3PTopIdx === 2,
                true
              )}

              {/* Bottom Group Switches (S4 on Leg A, S6 on Leg B, S2 on Leg C) */}
              {switches.length >= 6 && (
                <>
                  {renderDiodeOrThyristorSymbol(
                    switches[3],
                    175,
                    268,
                    'up',
                    active3PBotIdx === 0,
                    true
                  )}
                  {renderDiodeOrThyristorSymbol(
                    switches[5],
                    265,
                    268,
                    'up',
                    active3PBotIdx === 1,
                    true
                  )}
                  {renderDiodeOrThyristorSymbol(
                    switches[1],
                    355,
                    268,
                    'up',
                    active3PBotIdx === 2,
                    true
                  )}
                </>
              )}

              {/* 6-Pulse Gate Trigger Header when Thyristors Active */}
              {hasThyristors && (
                <g transform="translate(155, 16)">
                  <rect
                    x={0}
                    y={0}
                    width={220}
                    height={24}
                    rx={5}
                    fill="#1E1B4B"
                    stroke="#F59E0B"
                    strokeWidth={1.2}
                  />
                  <text
                    x={110}
                    y={15.5}
                    textAnchor="middle"
                    fill="#FBBF24"
                    fontSize={9.5}
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    6-PULSE SCR GATE CONTROLLER (α = {alpha}°)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= 1-PHASE AC SOURCE SYMBOL (LEFT) ================= */}
          {phase === '1P' && (
            <g transform="translate(85, 180)">
              <circle
                cx={0}
                cy={0}
                r={32}
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth={2.2}
              />
              <path
                d="M -14,0 Q -7,-12 0,0 T 14,0"
                fill="none"
                stroke="#38BDF8"
                strokeWidth={2.2}
              />
              <text
                x={0}
                y={48}
                textAnchor="middle"
                fill="#38BDF8"
                fontSize={10.5}
                fontWeight="600"
                fontFamily="JetBrains Mono"
              >
                {params.Vrms}V RMS
              </text>
              <text
                x={0}
                y={62}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize={9.5}
                fontFamily="JetBrains Mono"
              >
                vs = {currentPoint.vs.toFixed(0)}V
              </text>
            </g>
          )}

          {/* ================= FREEWHEELING DIODE (D_FW) BRANCH ================= */}
          <g
            onClick={onToggleFreewheeling}
            className="cursor-pointer"
            opacity={freewheeling ? 1 : 0.35}
          >
            <line
              x1={445}
              y1={55}
              x2={445}
              y2={305}
              stroke={activeSet.has('DFW') ? '#38BDF8' : '#475569'}
              strokeWidth={2}
              strokeDasharray={freewheeling ? 'none' : '4 4'}
            />
            <g transform={`translate(445, 180) rotate(${allReversed ? 90 : -90})`}>
              <polygon
                points="-10,-10 -10,10 10,0"
                fill={activeSet.has('DFW') ? 'rgba(56,189,248,0.35)' : '#0F172A'}
                stroke={activeSet.has('DFW') ? '#38BDF8' : '#64748B'}
                strokeWidth={2}
              />
              <line
                x1={10}
                y1={-11}
                x2={10}
                y2={11}
                stroke={activeSet.has('DFW') ? '#38BDF8' : '#64748B'}
                strokeWidth={2.5}
              />
            </g>
            <rect
              x={402}
              y={142}
              width={36}
              height={18}
              rx={4}
              fill={freewheeling ? '#0C4A6E' : '#1E293B'}
              stroke={freewheeling ? '#38BDF8' : '#334155'}
            />
            <text
              x={420}
              y={154}
              textAnchor="middle"
              fill={freewheeling ? '#7DD3FC' : '#64748B'}
              fontSize={9.5}
              fontWeight="700"
              fontFamily="JetBrains Mono"
            >
              D_FW
            </text>
          </g>

          {/* ================= LOAD BRANCH (R / L / E) ON RIGHT ================= */}
          <g>
            <line x1={560} y1={55} x2={560} y2={95} stroke="#334155" strokeWidth={2.5} />

            {/* Resistor R */}
            <path
              d="M 560,95 L 550,102 L 570,112 L 550,122 L 570,132 L 550,142 L 560,150"
              fill="none"
              stroke="#10B981"
              strokeWidth={2.4}
              strokeLinejoin="round"
            />
            <text
              x={580}
              y={126}
              fill="#10B981"
              fontSize={10.5}
              fontWeight="600"
              fontFamily="JetBrains Mono"
            >
              R={R}Ω
            </text>

            {/* Inductor L */}
            {loadType !== 'R' ? (
              <>
                <path
                  d="M 560,150 L 560,165 C 574,165 574,178 560,178 C 574,178 574,191 560,191 C 574,191 574,204 560,204 L 560,220"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2.4}
                />
                <text
                  x={580}
                  y={192}
                  fill="#F59E0B"
                  fontSize={10.5}
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  L={L}mH
                </text>
              </>
            ) : (
              <line x1={560} y1={150} x2={560} y2={220} stroke="#334155" strokeWidth={2.5} />
            )}

            {/* Back-EMF Source E */}
            {loadType === 'RLE' ? (
              <>
                <line x1={560} y1={220} x2={560} y2={242} stroke="#334155" strokeWidth={2.5} />
                <line x1={546} y1={242} x2={574} y2={242} stroke="#A855F7" strokeWidth={2.8} />
                <line x1={552} y1={250} x2={568} y2={250} stroke="#A855F7" strokeWidth={2.8} />
                <line x1={560} y1={250} x2={560} y2={305} stroke="#334155" strokeWidth={2.5} />
                <text
                  x={580}
                  y={250}
                  fill="#C084FC"
                  fontSize={10.5}
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  E={E}V
                </text>
              </>
            ) : (
              <line x1={560} y1={220} x2={560} y2={305} stroke="#334155" strokeWidth={2.5} />
            )}

            {/* Dynamic Output Voltage & Current Node Badges */}
            <g transform="translate(465, 22)">
              <rect
                x={0}
                y={0}
                width={108}
                height={24}
                rx={6}
                fill="#0F172A"
                stroke={currentPoint.vo < -0.5 ? '#F43F5E' : '#0EA5E9'}
                strokeWidth={1.3}
              />
              <text
                x={54}
                y={15.5}
                textAnchor="middle"
                fill={currentPoint.vo < -0.5 ? '#FDA4AF' : '#38BDF8'}
                fontSize={10.5}
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                Vo = {currentPoint.vo.toFixed(1)} V
              </text>
            </g>

            <g transform="translate(465, 314)">
              <rect
                x={0}
                y={0}
                width={108}
                height={24}
                rx={6}
                fill="#0F172A"
                stroke="#F59E0B"
                strokeWidth={1.3}
              />
              <text
                x={54}
                y={15.5}
                textAnchor="middle"
                fill="#FBBF24"
                fontSize={10.5}
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                Io = {currentPoint.io.toFixed(2)} A
              </text>
            </g>

            {/* Polarity Markers on Load Rail */}
            <text
              x={542}
              y={74}
              fill={allReversed ? '#F43F5E' : '#10B981'}
              fontSize={14}
              fontWeight="700"
              fontFamily="JetBrains Mono"
            >
              {allReversed ? '−' : '+'}
            </text>
            <text
              x={542}
              y={296}
              fill={allReversed ? '#10B981' : '#F43F5E'}
              fontSize={14}
              fontWeight="700"
              fontFamily="JetBrains Mono"
            >
              {allReversed ? '+' : '−'}
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Interactive Device Quick-Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 mr-1">Individual Switches:</span>
          {switches.map((sw, idx) => (
            <div
              key={sw.id}
              className="inline-flex items-center rounded-md bg-slate-900 border border-slate-800 overflow-hidden font-mono"
            >
              <button
                type="button"
                onClick={() => onToggleSwitchType(idx)}
                className="px-2 py-1 text-sky-400 hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
                title="Toggle Diode (D) / Thyristor (T)"
              >
                {sw.type}
                {sw.index}
              </button>
              <button
                type="button"
                onClick={() => onToggleSwitchOrientation(idx)}
                className={`px-2 py-1 border-l border-slate-800 transition-colors cursor-pointer ${
                  sw.orientation === 'reverse'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Invert Diode Orientation (Forward / Reversed)"
              >
                {sw.orientation === 'reverse' ? '▼ REV' : '▲ FWD'}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSetAllOrientations('forward')}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors font-mono cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Polarity</span>
        </button>
      </div>
    </section>
  );
};
