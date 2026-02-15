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
  core: 'normal' | 'critical' | 'warning';
}

export interface AnalyticsData {
  conversionRate: number;
  equilibriumRate: number;
  drift: number;
  hotspotDelta: number;
  history: {
    timestamp: number;
    conversion: number;
    equilibrium: number;
    drift: number;
    hotspot: number;
  }[];
}

interface DashboardState {
  sensors: Sensor[];
  anomalies: Anomaly[];
  twinState: TwinState;
  analytics: AnalyticsData;
  setSensors: (sensors: Sensor[]) => void;
  addAnomaly: (anomaly: Anomaly) => void;
  setTwinState: (state: TwinState) => void;
  updateAnalytics: (data: Partial<AnalyticsData>) => void;
  clearAnomalies: () => void;
}

// --- Store ---

export const useDashboardStore = create<DashboardState>((set) => ({
  sensors: [],
  anomalies: [],
  twinState: { core: 'normal' },
  analytics: {
    conversionRate: 0,
    equilibriumRate: 0,
    drift: 0,
    hotspotDelta: 0,
    history: [],
  },
  setSensors: (sensors) => set({ sensors }),
  addAnomaly: (anomaly) => set((state) => ({ anomalies: [anomaly, ...state.anomalies].slice(0, 50) })),
  setTwinState: (twinState) => set({ twinState }),
  updateAnalytics: (data) =>
    set((state) => ({
      analytics: {
        ...state.analytics,
        ...data,
        history: data.history ? data.history : state.analytics.history,
      },
    })),
  clearAnomalies: () => set({ anomalies: [] }),
}));
