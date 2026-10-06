import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Grid,
  Layers,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  HarmonicBin,
  ScopeTab,
  SimulationParams,
  TelemetryMetrics,
  WaveformPoint,
} from '../types/simulation';

interface OscilloscopePanelProps {
  params: SimulationParams;
  points: WaveformPoint[];
  harmonics: HarmonicBin[];
  metrics: TelemetryMetrics;
  cursorAngle: number;
  onChangeCursorAngle: (angle: number) => void;
  activeTab: ScopeTab;
  onChangeTab: (tab: ScopeTab) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  lightMode: boolean;
}

interface ConductionSegment {
  startAngle: number;
  endAngle: number;
  label: string;
  loopMode: WaveformPoint['loopMode'];
  polarity: 1 | -1 | 0;
}

export const OscilloscopePanel: React.FC<OscilloscopePanelProps> = ({
  params,
  points,
  harmonics,
  metrics,
  cursorAngle,
  onChangeCursorAngle,
  activeTab,
  onChangeTab,
  isFullScreen,
  onToggleFullScreen,
  lightMode,
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const [showVavg, setShowVavg] = useState(true);
  const [twoCycles, setTwoCycles] = useState(false);

  const displayPoints = useMemo(() => {
    if (!twoCycles) return points;
    const secondCycle = points.slice(1).map((pt) => ({
      ...pt,
      angle: pt.angle + 360,
      timeMs: pt.timeMs + 1000 / params.frequency,
    }));
    return [...points, ...secondCycle];
  }, [points, twoCycles, params.frequency]);

  const maxAngle = twoCycles ? 720 : 360;

  // Group active conduction intervals for the bottom timing bar
  const conductionSegments = useMemo<ConductionSegment[]>(() => {
    if (displayPoints.length === 0) return [];
    const segs: ConductionSegment[] = [];
    let current: ConductionSegment = {
      startAngle: displayPoints[0].angle,
      endAngle: displayPoints[0].angle,
      label: displayPoints[0].conductingLabel,
      loopMode: displayPoints[0].loopMode,
      polarity: displayPoints[0].polarity,
    };

    for (let i = 1; i < displayPoints.length; i++) {
      const pt = displayPoints[i];
      if (pt.conductingLabel === current.label) {
        current.endAngle = pt.angle;
      } else {
        segs.push(current);
        current = {
          startAngle: pt.angle,
          endAngle: pt.angle,
          label: pt.conductingLabel,
          loopMode: pt.loopMode,
          polarity: pt.polarity,
        };
      }
    }
    segs.push(current);
    return segs;
  }, [displayPoints]);

  const currentPoint =
    points[Math.min(points.length - 1, Math.max(0, Math.round(cursorAngle)))] || points[0];

  const vPeakScale = Math.max(Math.SQRT2 * params.Vrms * (params.phase === '3P' ? 1.85 : 1.15), 50);
  const iPeakScale = useMemo(() => {
    let maxI = 1;
    for (const p of points) {
      maxI = Math.max(maxI, Math.abs(p.io), Math.abs(p.is));
    }
    return maxI * 1.2;
  }, [points]);

  const buildPolyline = (
    extractor: (pt: WaveformPoint) => number,
    scaleMax: number,
    topY: number,
    height: number
  ) => {
    const midY = topY + height / 2;
    const halfH = height * 0.44;
    return displayPoints
      .map((pt) => {
        const x = 48 + (pt.angle / maxAngle) * 592;
        const val = extractor(pt);
        const y = midY - (val / scaleMax) * halfH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const handleSvgPointer = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 660;
    const clampedX = Math.max(48, Math.min(640, relX));
    const rawAngle = ((clampedX - 48) / 592) * maxAngle;
    onChangeCursorAngle(Math.round(rawAngle % 360));
  };

  const cursorX = 48 + (cursorAngle / maxAngle) * 592;

  return (
    <section
      className={`rounded-xl border transition-colors flex flex-col justify-between ${
        lightMode
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0F172A]/90 border-[#1E293B] text-slate-100'
      } ${isFullScreen ? 'fixed inset-4 z-50 p-6 shadow-2xl' : 'p-4'}`}
    >
      {/* Top Tab & View Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        {/* Mode Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onChangeTab('channels')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'channels'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Oscilloscope Channels</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('superimposed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'superimposed'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Superimposed</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('fft')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'fft'
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Harmonics (FFT)</span>
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setTwoCycles((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors whitespace-nowrap ${
              twoCycles
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {twoCycles ? '2 Cycles (720°)' : '1 Cycle (360°)'}
          </button>

          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
              showGrid
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVavg((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors whitespace-nowrap ${
              showVavg
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            V avg
          </button>

          <button
            type="button"
            onClick={onToggleFullScreen}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Oscilloscope'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Instantaneous Probe Readout Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs font-mono text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sky-400">
            vo(ωt): <strong>{currentPoint.vo.toFixed(1)} V</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400">
            io(ωt): <strong>{currentPoint.io.toFixed(2)} A</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-blue-400">
            vs(ωt): <strong>{currentPoint.vs.toFixed(1)} V</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-purple-400">
            is(ωt): <strong>{currentPoint.is.toFixed(2)} A</strong>
          </span>
        </div>
        <span className="text-slate-400">
          t = {currentPoint.timeMs.toFixed(2)} ms
        </span>
      </div>

      {/* Main Oscilloscope Viewport */}
      <div className="relative flex-1 min-h-[340px] bg-[#070B14] rounded-lg border border-slate-800/80 overflow-hidden">
        {activeTab === 'channels' && (
          <svg
            viewBox="0 0 660 340"
            className="w-full h-full cursor-crosshair select-none"
            onClick={handleSvgPointer}
            onMouseMove={(e) => {
              if (e.buttons === 1) handleSvgPointer(e);
            }}
          >
            {/* Background Grid */}
            {showGrid &&
              [0, 90, 180, 270, 360].map((deg) => {
                const gx = 48 + (deg / 360) * 592;
                return (
                  <g key={deg}>
                    <line
                      x1={gx}
                      y1={10}
                      x2={gx}
                      y2={295}
                      stroke="rgba(51, 65, 85, 0.45)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={gx}
                      y={334}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize={9}
                      fontFamily="JetBrains Mono"
                    >
                      {twoCycles ? `${deg * 2}°` : `${deg}°`}
                    </text>
                  </g>
                );
              })}

            {/* 4 Stacked Channels: CH1 vo(t), CH2 io(t), CH3 vs(t), CH4 is(t) */}
            {[
              {
                label: 'CH1: v_o(t)',
                unit: `${metrics.Vdc.toFixed(0)}V avg`,
                color: '#38BDF8',
                topY: 10,
                h: 68,
                pointsStr: buildPolyline((p) => p.vo, vPeakScale, 10, 68),
              },
              {
                label: 'CH2: i_o(t)',
                unit: `${metrics.Idc.toFixed(1)}A avg`,
                color: '#F59E0B',
                topY: 82,
                h: 68,
                pointsStr: buildPolyline((p) => p.io, iPeakScale, 82, 68),
              },
              {
                label: 'CH3: v_s(t)',
                unit: `${params.Vrms}V rms`,
                color: '#60A5FA',
                topY: 154,
                h: 68,
                pointsStr: buildPolyline((p) => p.vs, vPeakScale, 154, 68),
              },
              {
                label: 'CH4: i_s(t)',
                unit: `${metrics.IrmsSource.toFixed(1)}A rms`,
                color: '#A855F7',
                topY: 226,
                h: 68,
                pointsStr: buildPolyline((p) => p.is, iPeakScale, 226, 68),
              },
            ].map((ch) => {
              const midY = ch.topY + ch.h / 2;
              return (
                <g key={ch.label}>
                  {/* Channel Zero Axis */}
                  <line
                    x1={48}
                    y1={midY}
                    x2={640}
                    y2={midY}
                    stroke="rgba(71, 85, 105, 0.55)"
                    strokeWidth={1}
                  />
                  {/* Channel Border */}
                  <rect
                    x={48}
                    y={ch.topY}
                    width={592}
                    height={ch.h}
                    fill="none"
                    stroke="rgba(30, 41, 59, 0.8)"
                  />
                  {/* Left Label */}
                  <text
                    x={6}
                    y={midY - 3}
                    fill={ch.color}
                    fontSize={9}
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    {ch.label.split(':')[1]}
                  </text>
                  <text
                    x={6}
                    y={midY + 9}
                    fill="#64748B"
                    fontSize={8}
                    fontFamily="JetBrains Mono"
                  >
                    {ch.unit}
                  </text>

                  {/* 3-Phase Secondary Traces on CH3 */}
                  {ch.label.includes('v_s') && params.phase === '3P' && (
                    <>
                      <polyline
                        fill="none"
                        stroke="rgba(245, 158, 11, 0.45)"
                        strokeWidth={1.3}
                        points={buildPolyline((p) => p.vsB || 0, vPeakScale, ch.topY, ch.h)}
                      />
                      <polyline
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.45)"
                        strokeWidth={1.3}
                        points={buildPolyline((p) => p.vsC || 0, vPeakScale, ch.topY, ch.h)}
                      />
                    </>
                  )}

                  {/* V_avg Dashed Line on CH1 */}
                  {ch.label.includes('v_o') && showVavg && (
                    <line
                      x1={48}
                      y1={midY - (metrics.Vdc / vPeakScale) * (ch.h * 0.44)}
                      x2={640}
                      y2={midY - (metrics.Vdc / vPeakScale) * (ch.h * 0.44)}
                      stroke="#10B981"
                      strokeWidth={1.3}
                      strokeDasharray="5 4"
                    />
                  )}

                  {/* Waveform Trace */}
                  <polyline
                    fill="none"
                    stroke={ch.color}
                    strokeWidth={2.2}
                    strokeLinejoin="round"
                    points={ch.pointsStr}
                  />
                </g>
              );
            })}

            {/* Active Device Conduction Timing Bar (Bottom Strip y=300..320) */}
            <g transform="translate(0, 300)">
              <text
                x={6}
                y={13}
                fill="#94A3B8"
                fontSize={8.5}
                fontWeight="600"
                fontFamily="JetBrains Mono"
              >
                ACTIVE
              </text>
              {conductionSegments.map((seg, idx) => {
                const x1 = 48 + (seg.startAngle / maxAngle) * 592;
                const x2 = 48 + (seg.endAngle / maxAngle) * 592;
                const w = Math.max(2, x2 - x1);
                const isOff = seg.label === 'OFF';
                const isFw = seg.label === 'DFW';
                const fill = isOff
                  ? 'rgba(30, 41, 59, 0.7)'
                  : isFw
                    ? 'rgba(14, 165, 233, 0.28)'
                    : seg.polarity === -1
                      ? 'rgba(244, 63, 94, 0.28)'
                      : 'rgba(16, 185, 129, 0.25)';
                const stroke = isOff
                  ? '#334155'
                  : isFw
                    ? '#38BDF8'
                    : seg.polarity === -1
                      ? '#F43F5E'
                      : '#10B981';

                return (
                  <g key={`${seg.startAngle}-${idx}`}>
                    <rect
                      x={x1}
                      y={0}
                      width={w}
                      height={18}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={0.8}
                    />
                    {w > 28 && (
                      <text
                        x={x1 + w / 2}
                        y={12}
                        textAnchor="middle"
                        fill={isOff ? '#64748B' : '#F8FAFC'}
                        fontSize={8.5}
                        fontWeight="700"
                        fontFamily="JetBrains Mono"
                      >
                        {seg.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Real-Time Vertical Cursor Line */}
            <line
              x1={cursorX}
              y1={10}
              x2={cursorX}
              y2={318}
              stroke="#F43F5E"
              strokeWidth={1.6}
            />
            <circle cx={cursorX} cy={10} r={4} fill="#F43F5E" />
          </svg>
        )}

        {activeTab === 'superimposed' && (
          <svg
            viewBox="0 0 660 340"
            className="w-full h-full cursor-crosshair select-none"
            onClick={handleSvgPointer}
            onMouseMove={(e) => {
              if (e.buttons === 1) handleSvgPointer(e);
            }}
          >
            {/* Grid Lines */}
            {showGrid &&
              [0, 90, 180, 270, 360].map((deg) => {
                const gx = 48 + (deg / 360) * 592;
                return (
                  <g key={deg}>
                    <line
                      x1={gx}
                      y1={16}
                      x2={gx}
                      y2={290}
                      stroke="rgba(51, 65, 85, 0.45)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={gx}
                      y={332}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize={9}
                      fontFamily="JetBrains Mono"
                    >
                      {twoCycles ? `${deg * 2}°` : `${deg}°`}
                    </text>
                  </g>
                );
              })}

            {/* Zero Axis */}
            <line x1={48} y1={153} x2={640} y2={153} stroke="#475569" strokeWidth={1.2} />

            {/* Source Voltage vs(t) (Dashed Blue) */}
            <polyline
              fill="none"
              stroke="rgba(96, 165, 250, 0.55)"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              points={buildPolyline((p) => p.vs, vPeakScale, 16, 274)}
            />

            {/* V_avg Reference */}
            {showVavg && (
              <line
                x1={48}
                y1={153 - (metrics.Vdc / vPeakScale) * (274 * 0.44)}
                x2={640}
                y2={153 - (metrics.Vdc / vPeakScale) * (274 * 0.44)}
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )}

            {/* Load Voltage vo(t) (Solid Cyan) */}
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth={2.8}
              points={buildPolyline((p) => p.vo, vPeakScale, 16, 274)}
            />

            {/* Load Current io(t) (Solid Amber) */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth={2.4}
              points={buildPolyline((p) => p.io, iPeakScale, 16, 274)}
            />

            {/* Source Current is(t) (Purple) */}
            <polyline
              fill="none"
              stroke="#A855F7"
              strokeWidth={1.8}
              points={buildPolyline((p) => p.is, iPeakScale, 16, 274)}
            />

            {/* Active Conduction Strip */}
            <g transform="translate(0, 298)">
              {conductionSegments.map((seg, idx) => {
                const x1 = 48 + (seg.startAngle / maxAngle) * 592;
                const x2 = 48 + (seg.endAngle / maxAngle) * 592;
                const w = Math.max(2, x2 - x1);
                const isOff = seg.label === 'OFF';
                return (
                  <g key={`${seg.startAngle}-${idx}`}>
                    <rect
                      x={x1}
                      y={0}
                      width={w}
                      height={18}
                      fill={isOff ? 'rgba(30,41,59,0.7)' : 'rgba(16,185,129,0.25)'}
                      stroke={isOff ? '#334155' : '#10B981'}
                      strokeWidth={0.8}
                    />
                    {w > 28 && (
                      <text
                        x={x1 + w / 2}
                        y={12}
                        textAnchor="middle"
                        fill={isOff ? '#64748B' : '#F8FAFC'}
                        fontSize={8.5}
                        fontWeight="700"
                        fontFamily="JetBrains Mono"
                      >
                        {seg.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Cursor */}
            <line x1={cursorX} y1={16} x2={cursorX} y2={316} stroke="#F43F5E" strokeWidth={1.6} />
          </svg>
        )}

        {activeTab === 'fft' && (
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>
                Harmonic Spectrum (Orders n = 1 to 19) · Fundamental{' '}
                <strong className="text-sky-400 font-mono">{params.frequency} Hz</strong>
              </span>
              <span className="font-mono text-purple-300">
                Source Current THD_i = <strong>{metrics.thdCurrent.toFixed(1)}%</strong>
              </span>
            </div>

            <div className="flex-1 grid grid-cols-13 gap-2 items-end pt-6 pb-2 px-2 border-b border-slate-800">
              {harmonics.slice(0, 13).map((bin) => {
                const isHeight = Math.min(100, Math.max(3, bin.isPercent));
                const voHeight = Math.min(100, Math.max(3, bin.voPercent));
                return (
                  <div
                    key={bin.order}
                    className="flex flex-col items-center h-full justify-end group"
                  >
                    <div className="text-[10px] font-mono text-slate-400 mb-1 opacity-85">
                      {bin.isMagnitude.toFixed(1)}A
                    </div>
                    <div className="w-full h-44 flex items-end justify-center gap-1">
                      <div
                        style={{ height: `${isHeight}%` }}
                        className="w-2.5 bg-purple-500 rounded-t transition-all"
                        title={`n=${bin.order}: I_s = ${bin.isMagnitude.toFixed(2)} A (${bin.isPercent.toFixed(1)}%)`}
                      />
                      <div
                        style={{ height: `${voHeight}%` }}
                        className="w-2.5 bg-sky-400 rounded-t transition-all"
                        title={`n=${bin.order}: V_o = ${bin.voMagnitude.toFixed(1)} V`}
                      />
                    </div>
                    <span className="mt-1.5 text-[10px] font-mono text-slate-400">
                      h{bin.order}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block" />
                  Source Current Harmonics I_sn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" />
                  Load Voltage Harmonics V_on
                </span>
              </div>
              <span>Displacement cos(φ₁) = {metrics.displacementPF.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Angle ωt Tracker Scrubber Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>Angle ωt:</span>
          <strong className="text-sky-400 w-10 text-right">{cursorAngle.toFixed(0)}°</strong>
        </div>

        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={cursorAngle}
          onChange={(e) => onChangeCursorAngle(Number(e.target.value))}
          className="flex-1 accent-sky-400 bg-slate-800 rounded-lg"
          aria-label="Phase Angle Tracker"
        />

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
          {[0, 90, 180, 270, 360].map((ang) => (
            <button
              key={ang}
              type="button"
              onClick={() => onChangeCursorAngle(ang === 360 ? 0 : ang)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                Math.round(cursorAngle) === ang
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              {ang}°
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
