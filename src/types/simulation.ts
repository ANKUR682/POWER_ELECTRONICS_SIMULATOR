export type PhaseMode = '1P' | '3P';
export type BridgeConfig = 'full-bridge' | 'half-wave';
export type LoadType = 'R' | 'RL' | 'RLE';
export type DeviceType = 'D' | 'T';
export type DeviceOrientation = 'forward' | 'reverse';
export type QuickDevicePreset = 'all-diodes' | 'all-thyristors' | 'semi-conv' | 'custom';
export type ScopeTab = 'superimposed' | 'channels' | 'fft';

export interface SwitchElement {
  id: string; // 'S1' .. 'S6'
  index: number;
  type: DeviceType;
  orientation: DeviceOrientation;
}

export interface SimulationParams {
  phase: PhaseMode;
  bridgeConfig: BridgeConfig;
  devicePreset: QuickDevicePreset;
  switches: SwitchElement[];
  alpha: number; // Firing angle in degrees (0 - 180)
  freewheeling: boolean; // Freewheeling diode D_FW connected
  loadType: LoadType;
  R: number; // Resistance in Ohms (1 - 100)
  L: number; // Inductance in mH (0 - 200)
  E: number; // Back EMF in Volts (-100 - 200)
  Vrms: number; // Source Phase RMS Voltage in Volts (24 - 400)
  frequency: number; // 50 or 60 Hz
}

export interface WaveformPoint {
  angle: number; // degrees 0..360
  timeMs: number;
  vs: number; // Primary source voltage v_a(t)
  vsB?: number; // Phase B voltage (3P)
  vsC?: number; // Phase C voltage (3P)
  vo: number; // Output load voltage v_o(t)
  io: number; // Output load current i_o(t)
  is: number; // Primary source AC current i_s(t)
  activeDevices: string[]; // e.g., ['D1', 'D2'] or ['DFW'] or ['OFF']
  conductingLabel: string; // e.g., 'D1 D2' or 'T3 T4' or 'DFW' or 'OFF'
  loopMode: 'pos-pair' | 'neg-pair' | 'freewheel' | '3p-active' | 'off';
  polarity: 1 | -1 | 0; // +1 for positive load current, -1 for negative (reversed diodes), 0 for off
}

export interface HarmonicBin {
  order: number;
  frequency: number;
  isMagnitude: number; // % of fundamental or Amps
  isPercent: number;
  voMagnitude: number;
  voPercent: number;
}

export interface TelemetryMetrics {
  Vdc: number;
  VrmsOut: number;
  Idc: number;
  IrmsOut: number;
  IrmsSource: number;
  Pload: number;
  Sin: number;
  powerFactor: number;
  displacementPF: number; // cos(phi_1)
  rippleFactor: number;
  formFactor: number;
  thdCurrent: number; // %
  conductionMode: 'CCM' | 'DCM' | 'BLOCKED';
  extinctionAngle: number; // beta in degrees
  conductionAngle: number; // gamma in degrees
  idealVdc: number;
  polarityLabel: 'POSITIVE (+DC)' | 'NEGATIVE (-DC)' | 'BIPOLAR / BLOCKED';
}

export interface FormulaCardData {
  title: string;
  subtitle: string;
  description: string;
  latexFormula: string;
  secondaryFormula: string;
  idealVdc: number;
  simulatedVdc: number;
  notes: string[];
}

export interface SimulationResult {
  points: WaveformPoint[];
  harmonics: HarmonicBin[];
  metrics: TelemetryMetrics;
  formula: FormulaCardData;
}

export interface PresetScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  params: Partial<SimulationParams> & {
    globalOrientation?: DeviceOrientation;
  };
}
