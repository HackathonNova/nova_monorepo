import { create } from 'zustand';

// --- Types ---

export interface Sensor {
  id: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface Anomaly {
  zone: string;
  severity: number;
  timestamp: number;
}

export interface TwinState {
  core: 'normal' | 'critical';
}

interface DashboardState {
  sensors: Sensor[];
  anomalies: Anomaly[];
  twinState: TwinState;
  setSensors: (sensors: Sensor[]) => void;
  addAnomaly: (anomaly: Anomaly) => void;
  setTwinState: (state: TwinState) => void;
  clearAnomalies: () => void;
}

// --- Store ---

export const useDashboardStore = create<DashboardState>((set) => ({
  sensors: [],
  anomalies: [],
  twinState: { core: 'normal' },
  setSensors: (sensors) => set({ sensors }),
  addAnomaly: (anomaly) => set((state) => ({ anomalies: [anomaly, ...state.anomalies].slice(0, 50) })),
  setTwinState: (twinState) => set({ twinState }),
  clearAnomalies: () => set({ anomalies: [] }),
}));
