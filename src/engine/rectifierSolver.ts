import {
  FormulaCardData,
  HarmonicBin,
  SimulationParams,
  SimulationResult,
  SwitchElement,
  TelemetryMetrics,
  WaveformPoint,
} from '../types/simulation';

const DEG_TO_RAD = Math.PI / 180;

function formatSwitchTag(sw: SwitchElement): string {
  const base = `${sw.type}${sw.index}`;
  return sw.orientation === 'reverse' ? `${base}R` : base;
}

/**
 * Solves the differential equation L * di/dt + R * i + E = v_applied
 * using 4th-Order Runge-Kutta (RK4) over angle step dTheta (in radians),
 * where omega * dt = dTheta => L * omega * di/dTheta + R * i + E = v(theta)
 */
function rk4StepCurrent(
  iCurr: number,
  vApplied: number,
  R: number,
  L_henries: number,
  E: number,
  omega: number,
  dThetaRad: number
): number {
  const X_L = omega * L_henries;
  if (X_L < 1e-5) {
    return (vApplied - E) / Math.max(R, 0.1);
  }
  const f = (iVal: number) => (vApplied - E - R * iVal) / X_L;
  const k1 = f(iCurr);
  const k2 = f(iCurr + 0.5 * dThetaRad * k1);
  const k3 = f(iCurr + 0.5 * dThetaRad * k2);
  const k4 = f(iCurr + dThetaRad * k3);
  return iCurr + (dThetaRad / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

export function solveRectifier(params: SimulationParams): SimulationResult {
  const {
    phase,
    bridgeConfig,
    switches,
    alpha,
    freewheeling,
    loadType,
    R,
    Vrms,
    frequency,
  } = params;

  const L_mH = loadType === 'R' ? 0 : params.L;
  const L_H = L_mH / 1000;
  const E_val = loadType === 'RLE' ? params.E : 0;
  const omega = 2 * Math.PI * frequency;
  const Vm = Math.SQRT2 * Vrms;

  // Simulate 4 cycles with 0.5 deg step so RL transients settle into periodic steady-state
  const totalCycles = L_mH > 0 ? 4 : 2;
  const stepDeg = 0.5;
  const stepsPerCycle = Math.round(360 / stepDeg);
  const totalSteps = totalCycles * stepsPerCycle;
  const dThetaRad = stepDeg * DEG_TO_RAD;

  const rawPoints: WaveformPoint[] = [];

  if (phase === '1P' && bridgeConfig === 'half-wave') {
    // 1-Phase Half-Wave Rectifier (Single Switch S1: Diode D1 or Thyristor T1 + optional D_FW)
    const sw1 = switches[0] || { id: 'S1', index: 1, type: 'D', orientation: 'forward' };
    const isForward = sw1.orientation === 'forward';
    const effAlpha = sw1.type === 'D' ? 0 : alpha;

    let io = 0;
    let isConductingSource = false;

    for (let step = 0; step <= totalSteps; step++) {
      const totalAngle = step * stepDeg;
      const cycleAngle = ((totalAngle % 360) + 360) % 360;
      const rad = cycleAngle * DEG_TO_RAD;
      const vs = Vm * Math.sin(rad);

      let vo = 0;
      let is = 0;
      let activeDevices: string[] = ['OFF'];
      let loopMode: WaveformPoint['loopMode'] = 'off';
      let polarity: 1 | -1 | 0 = 0;

      if (isForward) {
        const canTrigger =
          cycleAngle >= effAlpha &&
          cycleAngle < 180 &&
          vs > E_val;

        if (canTrigger) {
          isConductingSource = true;
        }

        if (isConductingSource && freewheeling && vs < 0 && io > 1e-4) {
          isConductingSource = false;
        }

        if (isConductingSource) {
          const nextIo = rk4StepCurrent(io, vs, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4 || canTrigger) {
            io = Math.max(0, nextIo);
            vo = vs;
            is = io;
            activeDevices = [formatSwitchTag(sw1)];
            loopMode = 'pos-pair';
            polarity = io > 1e-4 ? 1 : 0;
          } else {
            io = 0;
            isConductingSource = false;
            vo = E_val;
            is = 0;
          }
        } else if (freewheeling && io > 1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = 1;
          } else {
            io = 0;
            vo = E_val;
            is = 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
          is = 0;
        }
      } else {
        // Reversed diode/thyristor: conducts negative current (io <= 0) during negative half-cycle (180..360)
        const negHalfAngle = cycleAngle - 180;
        const canTriggerNeg =
          cycleAngle >= 180 &&
          negHalfAngle >= effAlpha &&
          vs < E_val;

        if (canTriggerNeg) {
          isConductingSource = true;
        }

        if (isConductingSource && freewheeling && vs > 0 && io < -1e-4) {
          isConductingSource = false;
        }

        if (isConductingSource) {
          const nextIo = rk4StepCurrent(io, vs, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4 || canTriggerNeg) {
            io = Math.min(0, nextIo);
            vo = vs;
            is = io;
            activeDevices = [formatSwitchTag(sw1)];
            loopMode = 'neg-pair';
            polarity = io < -1e-4 ? -1 : 0;
          } else {
            io = 0;
            isConductingSource = false;
            vo = E_val;
            is = 0;
          }
        } else if (freewheeling && io < -1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = -1;
          } else {
            io = 0;
            vo = E_val;
            is = 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
          is = 0;
        }
      }

      if (step >= (totalCycles - 1) * stepsPerCycle) {
        const finalAngle = Math.round((step - (totalCycles - 1) * stepsPerCycle) * stepDeg * 10) / 10;
        if (Number.isInteger(finalAngle)) {
          rawPoints.push({
            angle: finalAngle,
            timeMs: (finalAngle / 360) * (1000 / frequency),
            vs,
            vo,
            io,
            is,
            activeDevices,
            conductingLabel: activeDevices.join(' '),
            loopMode,
            polarity,
          });
        }
      }
    }
  } else if (phase === '1P' && bridgeConfig === 'full-bridge') {
    // 1-Phase Full-Bridge Rectifier (1Φ DBR or 1Φ Thyristor Controlled Bridge)
    const s1 = switches[0] || { id: 'S1', index: 1, type: 'D', orientation: 'forward' };
    const s2 = switches[1] || { id: 'S2', index: 2, type: 'D', orientation: 'forward' };
    const s3 = switches[2] || { id: 'S3', index: 3, type: 'D', orientation: 'forward' };
    const s4 = switches[3] || { id: 'S4', index: 4, type: 'D', orientation: 'forward' };

    const pair1Forward = s1.orientation === 'forward' && s2.orientation === 'forward';
    const pair1Reverse = s1.orientation === 'reverse' && s2.orientation === 'reverse';
    const pair1Alpha = s1.type === 'T' || s2.type === 'T' ? alpha : 0;

    const pair2Forward = s3.orientation === 'forward' && s4.orientation === 'forward';
    const pair2Reverse = s3.orientation === 'reverse' && s4.orientation === 'reverse';
    const pair2Alpha = s3.type === 'T' || s4.type === 'T' ? alpha : 0;

    const isSemiConvForward =
      pair1Forward &&
      pair2Forward &&
      ((s1.type === 'T' && s4.type === 'D') || (s1.type === 'D' && s4.type === 'T') ||
       (s3.type === 'T' && s2.type === 'D') || (s3.type === 'D' && s2.type === 'T'));

    let io = 0;
    let activeBranch: 'none' | 'pair1-pos' | 'pair2-pos' | 'pair1-neg' | 'pair2-neg' | 'fw-pos' | 'fw-neg' = 'none';

    for (let step = 0; step <= totalSteps; step++) {
      const totalAngle = step * stepDeg;
      const cycleAngle = ((totalAngle % 360) + 360) % 360;
      const rad = cycleAngle * DEG_TO_RAD;
      const vs = Vm * Math.sin(rad);

      const triggerPair1Pos =
        pair1Forward && cycleAngle >= pair1Alpha && cycleAngle < 180 && vs > E_val;
      const triggerPair2Neg =
        pair2Reverse && cycleAngle >= pair2Alpha && cycleAngle < 180 && -vs < E_val;

      const negAngle = cycleAngle - 180;
      const triggerPair2Pos =
        pair2Forward && cycleAngle >= 180 && negAngle >= pair2Alpha && -vs > E_val;
      const triggerPair1Neg =
        pair1Reverse && cycleAngle >= 180 && negAngle >= pair1Alpha && vs < E_val;

      if (triggerPair1Pos && (activeBranch === 'none' || activeBranch === 'pair2-pos' || activeBranch === 'fw-pos')) {
        activeBranch = 'pair1-pos';
      } else if (triggerPair2Pos && (activeBranch === 'none' || activeBranch === 'pair1-pos' || activeBranch === 'fw-pos')) {
        activeBranch = 'pair2-pos';
      } else if (triggerPair2Neg && (activeBranch === 'none' || activeBranch === 'pair1-neg' || activeBranch === 'fw-neg')) {
        activeBranch = 'pair2-neg';
      } else if (triggerPair1Neg && (activeBranch === 'none' || activeBranch === 'pair2-neg' || activeBranch === 'fw-neg')) {
        activeBranch = 'pair1-neg';
      }

      if ((freewheeling || isSemiConvForward) && io > 1e-4) {
        if (activeBranch === 'pair1-pos' && vs < 0) {
          activeBranch = 'fw-pos';
        } else if (activeBranch === 'pair2-pos' && -vs < 0) {
          activeBranch = 'fw-pos';
        }
      }
      if (freewheeling && io < -1e-4) {
        if (activeBranch === 'pair2-neg' && -vs > 0) {
          activeBranch = 'fw-neg';
        } else if (activeBranch === 'pair1-neg' && vs > 0) {
          activeBranch = 'fw-neg';
        }
      }

      let vo = 0;
      let is = 0;
      let activeDevices: string[] = ['OFF'];
      let loopMode: WaveformPoint['loopMode'] = 'off';
      let polarity: 1 | -1 | 0 = 0;

      if (activeBranch === 'pair1-pos') {
        const nextIo = rk4StepCurrent(io, vs, R, L_H, E_val, omega, dThetaRad);
        if (nextIo > 1e-4 || triggerPair1Pos) {
          io = Math.max(0, nextIo);
          vo = vs;
          is = io;
          activeDevices = [formatSwitchTag(s1), formatSwitchTag(s2)];
          loopMode = 'pos-pair';
          polarity = io > 1e-4 ? 1 : 0;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else if (activeBranch === 'pair2-pos') {
        const nextIo = rk4StepCurrent(io, -vs, R, L_H, E_val, omega, dThetaRad);
        if (nextIo > 1e-4 || triggerPair2Pos) {
          io = Math.max(0, nextIo);
          vo = -vs;
          is = -io;
          activeDevices = [formatSwitchTag(s3), formatSwitchTag(s4)];
          loopMode = 'neg-pair';
          polarity = io > 1e-4 ? 1 : 0;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else if (activeBranch === 'fw-pos') {
        const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
        if (nextIo > 1e-4) {
          io = nextIo;
          vo = 0;
          is = 0;
          if (freewheeling) {
            activeDevices = ['DFW'];
          } else {
            activeDevices = vs < 0
              ? [formatSwitchTag(s1), formatSwitchTag(s4)]
              : [formatSwitchTag(s3), formatSwitchTag(s2)];
          }
          loopMode = 'freewheel';
          polarity = 1;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else if (activeBranch === 'pair2-neg') {
        const nextIo = rk4StepCurrent(io, -vs, R, L_H, E_val, omega, dThetaRad);
        if (nextIo < -1e-4 || triggerPair2Neg) {
          io = Math.min(0, nextIo);
          vo = -vs;
          is = io;
          activeDevices = [formatSwitchTag(s3), formatSwitchTag(s4)];
          loopMode = 'neg-pair';
          polarity = io < -1e-4 ? -1 : 0;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else if (activeBranch === 'pair1-neg') {
        const nextIo = rk4StepCurrent(io, vs, R, L_H, E_val, omega, dThetaRad);
        if (nextIo < -1e-4 || triggerPair1Neg) {
          io = Math.min(0, nextIo);
          vo = vs;
          is = -io;
          activeDevices = [formatSwitchTag(s1), formatSwitchTag(s2)];
          loopMode = 'pos-pair';
          polarity = io < -1e-4 ? -1 : 0;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else if (activeBranch === 'fw-neg') {
        const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
        if (nextIo < -1e-4) {
          io = nextIo;
          vo = 0;
          is = 0;
          activeDevices = ['DFW'];
          loopMode = 'freewheel';
          polarity = -1;
        } else {
          io = 0;
          activeBranch = 'none';
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else {
        io = 0;
        vo = loadType === 'RLE' ? E_val : 0;
        is = 0;
      }

      if (step >= (totalCycles - 1) * stepsPerCycle) {
        const finalAngle = Math.round((step - (totalCycles - 1) * stepsPerCycle) * stepDeg * 10) / 10;
        if (Number.isInteger(finalAngle)) {
          rawPoints.push({
            angle: finalAngle,
            timeMs: (finalAngle / 360) * (1000 / frequency),
            vs,
            vo,
            io,
            is,
            activeDevices,
            conductingLabel: activeDevices.join(' '),
            loopMode,
            polarity,
          });
        }
      }
    }
  } else if (phase === '3P' && bridgeConfig === 'half-wave') {
    // 3-Phase Half-Wave Rectifier (3-Pulse Midpoint: D1/D2/D3 or T1/T2/T3 with Neutral Return)
    // Natural commutation points are 30°, 150°, 270°
    const isMajorityReverse =
      switches.filter((s) => s.orientation === 'reverse').length > switches.length / 2;
    const hasThyristors = switches.some((s) => s.type === 'T');
    const effAlpha = hasThyristors ? Math.min(alpha, 150) : 0;

    let io = 0;
    let activePhaseIdx: 0 | 1 | 2 | -1 = -1; // 0: Phase A (S1), 1: Phase B (S2), 2: Phase C (S3)
    let isFreewheelingNow = false;

    for (let step = 0; step <= totalSteps; step++) {
      const totalAngle = step * stepDeg;
      const cycleAngle = ((totalAngle % 360) + 360) % 360;
      const rad = cycleAngle * DEG_TO_RAD;

      const va = Vm * Math.sin(rad);
      const vb = Vm * Math.sin(rad - (2 * Math.PI) / 3);
      const vc = Vm * Math.sin(rad - (4 * Math.PI) / 3);
      const phaseVoltages = [va, vb, vc];

      if (!isMajorityReverse) {
        // Forward 3-Pulse Half-Wave:
        // Phase A (S1) natural commutation window starts at 30° + effAlpha
        // Phase B (S2) starts at 150° + effAlpha
        // Phase C (S3) starts at 270° + effAlpha
        const relAngle = ((cycleAngle - (30 + effAlpha)) % 360 + 360) % 360;
        let candidatePhase: 0 | 1 | 2 = 0;
        if (relAngle < 120) candidatePhase = 0;
        else if (relAngle < 240) candidatePhase = 1;
        else candidatePhase = 2;

        const vCand = phaseVoltages[candidatePhase];
        if (vCand > E_val) {
          activePhaseIdx = candidatePhase;
          isFreewheelingNow = false;
        }

        let vApplied = activePhaseIdx >= 0 ? phaseVoltages[activePhaseIdx] : 0;
        if (freewheeling && vApplied < 0 && io > 1e-4) {
          isFreewheelingNow = true;
          vApplied = 0;
        }

        let vo = 0;
        let is = 0;
        let activeDevices: string[] = ['OFF'];
        let loopMode: WaveformPoint['loopMode'] = 'off';
        let polarity: 1 | -1 | 0 = 0;

        if (activePhaseIdx >= 0 && !isFreewheelingNow) {
          const nextIo = rk4StepCurrent(io, vApplied, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4) {
            io = nextIo;
            vo = vApplied;
            is = activePhaseIdx === 0 ? io : 0;
            const sw = switches[activePhaseIdx] || {
              id: `S${activePhaseIdx + 1}`,
              index: activePhaseIdx + 1,
              type: hasThyristors ? 'T' : 'D',
              orientation: 'forward',
            };
            activeDevices = [formatSwitchTag(sw)];
            loopMode = '3p-active';
            polarity = 1;
          } else {
            io = 0;
            activePhaseIdx = -1;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else if (isFreewheelingNow && io > 1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = 1;
          } else {
            io = 0;
            isFreewheelingNow = false;
            activePhaseIdx = -1;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
        }

        if (step >= (totalCycles - 1) * stepsPerCycle) {
          const finalAngle = Math.round((step - (totalCycles - 1) * stepsPerCycle) * stepDeg * 10) / 10;
          if (Number.isInteger(finalAngle)) {
            rawPoints.push({
              angle: finalAngle,
              timeMs: (finalAngle / 360) * (1000 / frequency),
              vs: va,
              vsB: vb,
              vsC: vc,
              vo,
              io,
              is,
              activeDevices,
              conductingLabel: activeDevices.join(' '),
              loopMode,
              polarity,
            });
          }
        }
      } else {
        // Reversed 3-Pulse Half-Wave (-DC envelope: natural commutation at 210°, 330°, 90°)
        const relAngle = ((cycleAngle - (210 + effAlpha)) % 360 + 360) % 360;
        let candidatePhase: 0 | 1 | 2 = 0;
        if (relAngle < 120) candidatePhase = 0; // Phase A negative peak
        else if (relAngle < 240) candidatePhase = 1; // Phase B negative peak
        else candidatePhase = 2; // Phase C negative peak

        const vCand = phaseVoltages[candidatePhase];
        if (vCand < E_val) {
          activePhaseIdx = candidatePhase;
          isFreewheelingNow = false;
        }

        let vApplied = activePhaseIdx >= 0 ? phaseVoltages[activePhaseIdx] : 0;
        if (freewheeling && vApplied > 0 && io < -1e-4) {
          isFreewheelingNow = true;
          vApplied = 0;
        }

        let vo = 0;
        let is = 0;
        let activeDevices: string[] = ['OFF'];
        let loopMode: WaveformPoint['loopMode'] = 'off';
        let polarity: 1 | -1 | 0 = 0;

        if (activePhaseIdx >= 0 && !isFreewheelingNow) {
          const nextIo = rk4StepCurrent(io, vApplied, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4) {
            io = nextIo;
            vo = vApplied;
            is = activePhaseIdx === 0 ? io : 0;
            const sw = switches[activePhaseIdx] || {
              id: `S${activePhaseIdx + 1}`,
              index: activePhaseIdx + 1,
              type: hasThyristors ? 'T' : 'D',
              orientation: 'reverse',
            };
            activeDevices = [formatSwitchTag(sw)];
            loopMode = '3p-active';
            polarity = -1;
          } else {
            io = 0;
            activePhaseIdx = -1;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else if (isFreewheelingNow && io < -1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = -1;
          } else {
            io = 0;
            isFreewheelingNow = false;
            activePhaseIdx = -1;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
        }

        if (step >= (totalCycles - 1) * stepsPerCycle) {
          const finalAngle = Math.round((step - (totalCycles - 1) * stepsPerCycle) * stepDeg * 10) / 10;
          if (Number.isInteger(finalAngle)) {
            rawPoints.push({
              angle: finalAngle,
              timeMs: (finalAngle / 360) * (1000 / frequency),
              vs: va,
              vsB: vb,
              vsC: vc,
              vo,
              io,
              is,
              activeDevices,
              conductingLabel: activeDevices.join(' '),
              loopMode,
              polarity,
            });
          }
        }
      }
    }
  } else {
    // 3-Phase Full-Bridge (6-Pulse DBR or 6-Pulse Thyristor Controlled Graetz Bridge)
    // Standard 6-pulse commutation sequence every 60° starting at ωt = 30° + α:
    // Sector 0 (30°..90° + α):   Top A (S1), Bot B (S6) -> v_ab = va - vb
    // Sector 1 (90°..150° + α):  Top A (S1), Bot C (S2) -> v_ac = va - vc
    // Sector 2 (150°..210° + α): Top B (S3), Bot C (S2) -> v_bc = vb - vc
    // Sector 3 (210°..270° + α): Top B (S3), Bot A (S4) -> v_ba = vb - va
    // Sector 4 (270°..330° + α): Top C (S5), Bot A (S4) -> v_ca = vc - va
    // Sector 5 (330°..390° + α): Top C (S5), Bot B (S6) -> v_cb = vc - vb
    const isMajorityReverse =
      switches.filter((s) => s.orientation === 'reverse').length > switches.length / 2;
    const hasThyristors = switches.some((s) => s.type === 'T');
    const effAlpha = hasThyristors ? Math.min(alpha, 150) : 0;

    let io = 0;
    let activeSector = 0;
    let isConductingBridge = false;
    let isFreewheelingNow = false;

    const sectorPairs: Array<{
      topSwIdx: number; // 0-indexed into switches array [S1..S6]
      botSwIdx: number;
      topPhase: 'A' | 'B' | 'C';
      botPhase: 'A' | 'B' | 'C';
    }> = [
      { topSwIdx: 0, botSwIdx: 5, topPhase: 'A', botPhase: 'B' }, // S1, S6
      { topSwIdx: 0, botSwIdx: 1, topPhase: 'A', botPhase: 'C' }, // S1, S2
      { topSwIdx: 2, botSwIdx: 1, topPhase: 'B', botPhase: 'C' }, // S3, S2
      { topSwIdx: 2, botSwIdx: 3, topPhase: 'B', botPhase: 'A' }, // S3, S4
      { topSwIdx: 4, botSwIdx: 3, topPhase: 'C', botPhase: 'A' }, // S5, S4
      { topSwIdx: 4, botSwIdx: 5, topPhase: 'C', botPhase: 'B' }, // S5, S6
    ];

    for (let step = 0; step <= totalSteps; step++) {
      const totalAngle = step * stepDeg;
      const cycleAngle = ((totalAngle % 360) + 360) % 360;
      const rad = cycleAngle * DEG_TO_RAD;

      const va = Vm * Math.sin(rad);
      const vb = Vm * Math.sin(rad - (2 * Math.PI) / 3);
      const vc = Vm * Math.sin(rad - (4 * Math.PI) / 3);
      const vMap = { A: va, B: vb, C: vc };

      const relAngle = ((cycleAngle - (30 + effAlpha)) % 360 + 360) % 360;
      const candidateSector = Math.min(5, Math.floor(relAngle / 60));
      const candPair = sectorPairs[candidateSector];
      const rawLineCand = vMap[candPair.topPhase] - vMap[candPair.botPhase];
      const vCand = isMajorityReverse ? -rawLineCand : rawLineCand;

      if ((!isMajorityReverse && vCand > E_val) || (isMajorityReverse && vCand < E_val)) {
        activeSector = candidateSector;
        isConductingBridge = true;
        isFreewheelingNow = false;
      }

      const activePair = sectorPairs[activeSector];
      const rawLineActive = vMap[activePair.topPhase] - vMap[activePair.botPhase];
      let vTarget = isMajorityReverse ? -rawLineActive : rawLineActive;

      if (
        freewheeling &&
        isConductingBridge &&
        ((!isMajorityReverse && vTarget < 0 && io > 1e-4) ||
          (isMajorityReverse && vTarget > 0 && io < -1e-4))
      ) {
        isFreewheelingNow = true;
        isConductingBridge = false;
        vTarget = 0;
      }

      let vo = 0;
      let is = 0;
      let activeDevices: string[] = ['OFF'];
      let loopMode: WaveformPoint['loopMode'] = 'off';
      let polarity: 1 | -1 | 0 = 0;

      const topSw = switches[activePair.topSwIdx] || {
        id: `S${activePair.topSwIdx + 1}`,
        index: activePair.topSwIdx + 1,
        type: hasThyristors ? 'T' : 'D',
        orientation: isMajorityReverse ? 'reverse' : 'forward',
      };
      const botSw = switches[activePair.botSwIdx] || {
        id: `S${activePair.botSwIdx + 1}`,
        index: activePair.botSwIdx + 1,
        type: hasThyristors ? 'T' : 'D',
        orientation: isMajorityReverse ? 'reverse' : 'forward',
      };

      const aPhaseFactor =
        activePair.topPhase === 'A' ? 1 : activePair.botPhase === 'A' ? -1 : 0;

      if (!isMajorityReverse) {
        if (isConductingBridge) {
          const nextIo = rk4StepCurrent(io, vTarget, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4) {
            io = nextIo;
            vo = vTarget;
            is = aPhaseFactor * io;
            activeDevices = [formatSwitchTag(topSw), formatSwitchTag(botSw)];
            loopMode = '3p-active';
            polarity = 1;
          } else {
            io = 0;
            isConductingBridge = false;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else if (isFreewheelingNow && io > 1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo > 1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = 1;
          } else {
            io = 0;
            isFreewheelingNow = false;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
        }
      } else {
        if (isConductingBridge) {
          const nextIo = rk4StepCurrent(io, vTarget, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4) {
            io = nextIo;
            vo = vTarget;
            is = -aPhaseFactor * io;
            activeDevices = [formatSwitchTag(topSw), formatSwitchTag(botSw)];
            loopMode = '3p-active';
            polarity = -1;
          } else {
            io = 0;
            isConductingBridge = false;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else if (isFreewheelingNow && io < -1e-4) {
          const nextIo = rk4StepCurrent(io, 0, R, L_H, E_val, omega, dThetaRad);
          if (nextIo < -1e-4) {
            io = nextIo;
            vo = 0;
            is = 0;
            activeDevices = ['DFW'];
            loopMode = 'freewheel';
            polarity = -1;
          } else {
            io = 0;
            isFreewheelingNow = false;
            vo = loadType === 'RLE' ? E_val : 0;
          }
        } else {
          io = 0;
          vo = loadType === 'RLE' ? E_val : 0;
        }
      }

      if (step >= (totalCycles - 1) * stepsPerCycle) {
        const finalAngle = Math.round((step - (totalCycles - 1) * stepsPerCycle) * stepDeg * 10) / 10;
        if (Number.isInteger(finalAngle)) {
          rawPoints.push({
            angle: finalAngle,
            timeMs: (finalAngle / 360) * (1000 / frequency),
            vs: va,
            vsB: vb,
            vsC: vc,
            vo,
            io,
            is,
            activeDevices,
            conductingLabel: activeDevices.join(' '),
            loopMode,
            polarity,
          });
        }
      }
    }
  }

  // Compute Telemetry Metrics over the 360-degree steady-state cycle
  const cyclePoints = rawPoints.slice(0, 360);
  const N = cyclePoints.length || 360;

  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumP = 0;
  let conductingCount = 0;
  let lastConductingAngle = 0;

  for (const pt of cyclePoints) {
    sumVo += pt.vo;
    sumVoSq += pt.vo * pt.vo;
    sumIo += pt.io;
    sumIoSq += pt.io * pt.io;
    sumIsSq += pt.is * pt.is;
    sumP += pt.vo * pt.io;
    if (Math.abs(pt.io) > 1e-3) {
      conductingCount++;
      lastConductingAngle = pt.angle;
    }
  }

  const Vdc = sumVo / N;
  const VrmsOut = Math.sqrt(sumVoSq / N);
  const Idc = sumIo / N;
  const IrmsOut = Math.sqrt(sumIoSq / N);
  const IrmsSource = Math.sqrt(sumIsSq / N);
  const Pload = sumP / N;
  const phaseFactor = phase === '3P' ? 3 : 1;
  const Sin = phaseFactor * Vrms * IrmsSource;

  // Compute Fourier Harmonics (Orders 1..25)
  const harmonics: HarmonicBin[] = [];
  let fundIsAmp = 0;
  let fundIsPhase = 0;
  let fundVoAmp = 0;

  for (let n = 1; n <= 25; n++) {
    let aIs = 0;
    let bIs = 0;
    let aVo = 0;
    let bVo = 0;

    for (const pt of cyclePoints) {
      const nRad = n * pt.angle * DEG_TO_RAD;
      const cosVal = Math.cos(nRad);
      const sinVal = Math.sin(nRad);
      aIs += pt.is * cosVal;
      bIs += pt.is * sinVal;
      aVo += pt.vo * cosVal;
      bVo += pt.vo * sinVal;
    }

    aIs = (2 / N) * aIs;
    bIs = (2 / N) * bIs;
    aVo = (2 / N) * aVo;
    bVo = (2 / N) * bVo;

    const isPeak = Math.sqrt(aIs * aIs + bIs * bIs);
    const isRmsHarm = isPeak / Math.SQRT2;
    const voPeak = Math.sqrt(aVo * aVo + bVo * bVo);
    const voRmsHarm = voPeak / Math.SQRT2;

    if (n === 1) {
      fundIsAmp = isRmsHarm;
      fundIsPhase = Math.atan2(aIs, bIs);
      fundVoAmp = Math.max(voRmsHarm, Math.abs(Vdc), 1);
    }

    harmonics.push({
      order: n,
      frequency: n * frequency,
      isMagnitude: isRmsHarm,
      isPercent: fundIsAmp > 1e-3 ? (isRmsHarm / fundIsAmp) * 100 : 0,
      voMagnitude: voRmsHarm,
      voPercent: fundVoAmp > 1e-3 ? (voRmsHarm / fundVoAmp) * 100 : 0,
    });
  }

  let sumHarmSq = 0;
  for (let i = 1; i < harmonics.length; i++) {
    sumHarmSq += harmonics[i].isMagnitude * harmonics[i].isMagnitude;
  }

  const thdCurrent =
    fundIsAmp > 1e-3 ? Math.min(250, (Math.sqrt(sumHarmSq) / fundIsAmp) * 100) : 0;

  const displacementPF = fundIsAmp > 1e-3 ? Math.abs(Math.cos(fundIsPhase)) : 0;
  const powerFactor = Sin > 1e-2 ? Math.min(1, Math.abs(Pload) / Sin) : 0;
  const formFactor = Math.abs(Vdc) > 1e-2 ? VrmsOut / Math.abs(Vdc) : 0;
  const rippleFactor =
    formFactor > 1 ? Math.sqrt(formFactor * formFactor - 1) : 0;

  const conductionMode: TelemetryMetrics['conductionMode'] =
    conductingCount === 0
      ? 'BLOCKED'
      : conductingCount >= 355
        ? 'CCM'
        : 'DCM';

  const polarityLabel: TelemetryMetrics['polarityLabel'] =
    Vdc > 0.5
      ? 'POSITIVE (+DC)'
      : Vdc < -0.5
        ? 'NEGATIVE (-DC)'
        : 'BIPOLAR / BLOCKED';

  const formula = buildFormulaCardData(params, Vdc, Vm, conductionMode);

  const metrics: TelemetryMetrics = {
    Vdc,
    VrmsOut,
    Idc,
    IrmsOut,
    IrmsSource,
    Pload,
    Sin,
    powerFactor,
    displacementPF,
    rippleFactor,
    formFactor,
    thdCurrent,
    conductionMode,
    extinctionAngle: lastConductingAngle,
    conductionAngle: conductingCount,
    idealVdc: formula.idealVdc,
    polarityLabel,
  };

  return {
    points: rawPoints,
    harmonics,
    metrics,
    formula,
  };
}

function buildFormulaCardData(
  params: SimulationParams,
  simulatedVdc: number,
  Vm: number,
  conductionMode: 'CCM' | 'DCM' | 'BLOCKED'
): FormulaCardData {
  const { phase, bridgeConfig, switches, alpha, freewheeling } = params;
  const hasThyristors = switches.some((s) => s.type === 'T');
  const effAlphaRad = (hasThyristors ? alpha : 0) * DEG_TO_RAD;
  const reverseCount = switches.filter((s) => s.orientation === 'reverse').length;
  const isAllReversed = reverseCount === switches.length;
  const signPrefix = isAllReversed ? '-' : '';
  const signMult = isAllReversed ? -1 : 1;

  if (phase === '1P' && bridgeConfig === 'half-wave') {
    const idealVdc = hasThyristors
      ? signMult * ((Vm / (2 * Math.PI)) * (1 + Math.cos(effAlphaRad)))
      : signMult * (Vm / Math.PI);
    return {
      title: `1-Phase Half-Wave ${hasThyristors ? 'Thyristor Controlled Rectifier (SCR)' : 'Uncontrolled Diode Rectifier'} (${isAllReversed ? 'Reversed Polarity -DC' : 'Forward Polarity +DC'})`,
      subtitle: freewheeling
        ? 'With Freewheeling Diode (D_FW Clamped Negative Excursion)'
        : hasThyristors
          ? 'Phase-Controlled SCR Half-Wave Topology'
          : 'Uncontrolled Single-Diode Half-Wave Topology',
      description: isAllReversed
        ? 'Because the semiconductor switch orientation is reversed, conduction occurs exclusively during the negative AC half-cycle (180° to 360°), delivering a negative DC average voltage across the load.'
        : 'Conducts during the positive half-cycle from firing angle α until current extinction angle β. Adding a freewheeling diode prevents load voltage reversal with inductive loads.',
      latexFormula: hasThyristors
        ? `V_{dc} = ${signPrefix}\\frac{V_m}{2\\pi}(1 + \\cos\\alpha)`
        : `V_{dc} = ${signPrefix}\\frac{V_m}{\\pi} \\approx ${(signMult * 0.3183 * Vm).toFixed(1)}\\text{ V}`,
      secondaryFormula: `V_{rms} = \\frac{V_m}{2}\\sqrt{\\frac{\\pi - \\alpha}{\\pi} + \\frac{\\sin(2\\alpha)}{2\\pi}}`,
      idealVdc,
      simulatedVdc,
      notes: [
        `Peak Source Voltage Vm = ${Vm.toFixed(1)} V`,
        `Conduction Regime: ${conductionMode}`,
        `Switch Polarity: ${isAllReversed ? 'Reversed (Cathode to Source)' : 'Forward (Anode to Source)'}`,
      ],
    };
  }

  if (phase === '1P' && bridgeConfig === 'full-bridge') {
    const isSemi =
      freewheeling ||
      (switches.some((s) => s.type === 'T') && switches.some((s) => s.type === 'D'));

    const idealVdc = !hasThyristors
      ? signMult * ((2 * Vm) / Math.PI)
      : isSemi
        ? signMult * ((Vm / Math.PI) * (1 + Math.cos(effAlphaRad)))
        : signMult * (((2 * Vm) / Math.PI) * Math.cos(effAlphaRad));

    return {
      title: `1-Phase Full-Wave ${
        !hasThyristors
          ? 'Diode Bridge Rectifier (1Φ DBR)'
          : isSemi
            ? 'Semi-Controlled Thyristor-Diode Bridge'
            : 'Thyristor Controlled Bridge Rectifier (1Φ TCR)'
      } — Analytical Equation`,
      subtitle:
        reverseCount > 0 && !isAllReversed
          ? 'Custom Asymmetric Diode/Thyristor Polarity Configuration'
          : isAllReversed
            ? 'Inverted Bridge Orientation (Negative Output Rail)'
            : !hasThyristors
              ? 'Uncontrolled 4-Diode Graetz Bridge (DBR)'
              : 'Phase-Controlled 4-SCR Full-Wave Bridge',
      description: !hasThyristors
        ? 'Uncontrolled 1-Phase Diode Bridge Rectifier (DBR): Diagonal pairs (D1, D2) and (D3, D4) conduct on alternate half-cycles with natural commutation at 0° and 180°.'
        : isSemi
          ? 'Freewheeling action clamps the instantaneous load voltage v_o(t) to 0 V during source zero-crossings, preventing negative voltage spikes and improving input power factor.'
          : conductionMode === 'CCM'
            ? 'In Continuous Conduction Mode (CCM), load inductance maintains current flow throughout the entire cycle, allowing 2-quadrant operation with negative instantaneous v_o(t) excursions prior to commutation.'
            : 'In Discontinuous Conduction Mode (DCM), load current decays to zero before the next diagonal thyristor pair is triggered.',
      latexFormula: !hasThyristors
        ? `V_{dc(\\text{DBR})} = ${signPrefix}\\frac{2V_m}{\\pi} \\approx ${idealVdc.toFixed(1)}\\text{ V}`
        : isSemi
          ? `V_{dc} = ${signPrefix}\\frac{V_m}{\\pi}(1 + \\cos\\alpha)`
          : `V_{dc(\\text{CCM})} = ${signPrefix}\\frac{2V_m}{\\pi}\\cos\\alpha`,
      secondaryFormula: `L\\frac{di_o}{dt} + R i_o + E = |v_s(\\omega t)|`,
      idealVdc,
      simulatedVdc,
      notes: [
        `Peak Source Vm = ${Vm.toFixed(1)} V`,
        `Active Firing Delay α = ${hasThyristors ? alpha : 0}°`,
        `Bridge Polarity: ${isAllReversed ? 'Reversed (-DC)' : reverseCount > 0 ? 'Mixed Custom' : 'Standard Forward (+DC)'}`,
      ],
    };
  }

  // 3-Phase Half-Wave (3-Pulse)
  if (bridgeConfig === 'half-wave') {
    const idealVdc =
      signMult * (((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(effAlphaRad));
    return {
      title: `3-Phase Half-Wave (3-Pulse) ${
        hasThyristors
          ? 'Thyristor Controlled Rectifier (M3C)'
          : 'Uncontrolled Diode Rectifier (M3U)'
      } — Analytical Equation`,
      subtitle: isAllReversed
        ? 'Reversed Common-Anode (-DC Envelope with Neutral Return)'
        : 'Common-Cathode 3-Pulse Star Topology with Neutral Return',
      description:
        'Each phase device (D1..D3 or T1..T3) conducts for 120° per cycle beginning at the natural commutation intersection ωt = 30° plus firing delay angle α, returning current via the star neutral wire (N).',
      latexFormula: hasThyristors
        ? `V_{dc} = ${signPrefix}\\frac{3\\sqrt{3}V_m}{2\\pi}\\cos\\alpha`
        : `V_{dc} = ${signPrefix}\\frac{3\\sqrt{3}V_m}{2\\pi} \\approx ${idealVdc.toFixed(1)}\\text{ V}`,
      secondaryFormula: `V_{L-L(\\text{rms})} = \\sqrt{3} V_{\\phi(\\text{rms})} = ${(Math.sqrt(3) * params.Vrms).toFixed(1)}\\text{ V}`,
      idealVdc,
      simulatedVdc,
      notes: [
        `Phase Peak Vm = ${Vm.toFixed(1)} V`,
        `Pulse Number p = 3 (Ripple = ${3 * params.frequency} Hz)`,
        `Conduction Mode: ${conductionMode}`,
      ],
    };
  }

  // 3-Phase Full-Wave Bridge (6-Pulse DBR / 6-Pulse Thyristor Bridge)
  const idealVdc =
    signMult * (((3 * Math.sqrt(3) * Vm) / Math.PI) * Math.cos(effAlphaRad));
  return {
    title: `3-Phase Full-Wave (6-Pulse) ${
      hasThyristors
        ? 'Thyristor Controlled Bridge Rectifier (B6C)'
        : 'Diode Bridge Rectifier (3Φ DBR / B6U)'
    } — Analytical Equation`,
    subtitle: isAllReversed
      ? 'Reversed 6-Pulse Bridge (-DC Output)'
      : hasThyristors
        ? 'Industrial 6-Pulse Phase-Controlled SCR Graetz Bridge'
        : 'Industrial 6-Pulse Uncontrolled Diode Bridge Rectifier (3Φ DBR)',
    description:
      'Six-pulse commutation switches every 60° between the top group (1, 3, 5) and bottom group (4, 6, 2), delivering low-ripple DC power from the 3-phase line-to-line voltages.',
    latexFormula: hasThyristors
      ? `V_{dc} = ${signPrefix}\\frac{3\\sqrt{3}V_m}{\\pi}\\cos\\alpha`
      : `V_{dc(\\text{3\\Phi DBR})} = ${signPrefix}\\frac{3\\sqrt{3}V_m}{\\pi} \\approx ${idealVdc.toFixed(1)}\\text{ V}`,
    secondaryFormula: `f_{\\text{ripple}} = 6 f_s = ${6 * params.frequency}\\text{ Hz}`,
    idealVdc,
    simulatedVdc,
    notes: [
      `Line-to-Line Peak = ${(Math.sqrt(3) * Vm).toFixed(1)} V`,
      `Pulse Number p = 6`,
      `Conduction Mode: ${conductionMode}`,
    ],
  };
}
