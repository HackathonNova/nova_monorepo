import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@google/model-viewer';
import { useDashboardStore } from '../store';
import type { Anomaly } from '../store';

const LOG_LEVELS = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  ALERT: 'ALERT',
  AI_SYS: 'AI_SYS',
  WARN: 'WARN'
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

interface Metric {
  label: string;
  value: string;
  unit: string;
  status?: 'OK' | 'HI' | 'LOW';
  progress: number;
}

const ranges: Record<string, { min: number; max: number }> = {
  temperature: { min: 350, max: 380 },
  pressure: { min: 2.0, max: 2.4 },
  ph: { min: 6.8, max: 7.2 },
  flowRate: { min: 120, max: 150 },
  vibration: { min: 0, max: 10 }
};

const isAnomaly = (value: unknown): value is Anomaly => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Anomaly;
  return typeof candidate.timestamp === 'number' && typeof candidate.zone === 'string' && typeof candidate.severity === 'number';
};

export const Dashboard: React.FC = () => {
  const sensors = useDashboardStore((state) => state.sensors);
  const anomalies = useDashboardStore((state) => state.anomalies);
  const twinState = useDashboardStore((state) => state.twinState);
  const setSensors = useDashboardStore((state) => state.setSensors);
  const setTwinState = useDashboardStore((state) => state.setTwinState);
  const addAnomaly = useDashboardStore((state) => state.addAnomaly);
  const [isConnected, setIsConnected] = useState(false);
  const [activeView, setActiveView] = useState<'monitoring' | 'insights'>('monitoring');
  const seenAnomalies = useRef<Set<number>>(new Set());

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws');

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'init' || data.type === 'sensor_update') {
          if (data.payload) setSensors(data.payload);
          if (data.twin_state) setTwinState(data.twin_state);
          if (Array.isArray(data.anomalies) && data.anomalies.length > 0) {
            data.anomalies.forEach((anomaly: unknown) => {
              if (!isAnomaly(anomaly)) return;
              if (!seenAnomalies.current.has(anomaly.timestamp)) {
                seenAnomalies.current.add(anomaly.timestamp);
                addAnomaly(anomaly);
                if (seenAnomalies.current.size > 100) {
                  const [first] = seenAnomalies.current;
                  seenAnomalies.current.delete(first);
                }
              }
            });
          }
        }
      };
    };

    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, [addAnomaly, setSensors, setTwinState]);

  const sensorMap = useMemo(() => {
    return new Map(sensors.map((sensor) => [sensor.id, sensor]));
  }, [sensors]);

  const buildMetric = useCallback((id: string, label: string, unit: string): Metric => {
    const sensor = sensorMap.get(id);
    if (!sensor) {
      return { label, value: '—', unit, progress: 0 };
    }
    const range = ranges[id] || { min: 0, max: 1 };
    const normalized = Math.min(1, Math.max(0, (sensor.value - range.min) / (range.max - range.min)));
    const status = sensor.status === 'critical' ? 'HI' : sensor.status === 'warning' ? 'LOW' : 'OK';
    return {
      label,
      value: sensor.value.toFixed(2),
      unit,
      status,
      progress: Math.round(normalized * 100)
    };
  }, [sensorMap]);

  const mainMetrics = useMemo(() => {
    return {
      core: [
        buildMetric('temperature', 'Temp', '°C'),
        buildMetric('pressure', 'Pressure', 'MPa')
      ],
      flow: [
        buildMetric('flowRate', 'Flow', 'm³/h'),
        buildMetric('ph', 'pH', '')
      ],
      logs: [
        buildMetric('vibration', 'Vibe', 'mm/s'),
        buildMetric('temperature', 'Core Δ', '°C')
      ]
    };
  }, [buildMetric]);

  return (
    <div className="flex h-screen w-screen bg-background relative overflow-hidden crt-overlay">
      <div className="fixed inset-0 bg-grid-pattern bg-[length:40px_40px] pointer-events-none z-0 opacity-40"></div>
      <div className="scanline"></div>

      <Sidebar activeView={activeView} onChange={setActiveView} />

      <main className="flex-1 flex flex-col p-2 gap-2 relative z-10 overflow-hidden">
        <Header isConnected={isConnected} />

        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          {activeView === 'monitoring' ? (
            <>
              <MainGrid
                coreStatus={twinState.core}
                coreMetrics={mainMetrics.core}
                flowMetrics={mainMetrics.flow}
                logMetrics={mainMetrics.logs}
              />
              <ConsoleLogs anomalies={anomalies} />
            </>
          ) : (
            <InsightsView />
          )}
        </div>
      </main>

      <FloatingAI />
    </div>
  );
};

const Sidebar: React.FC<{ activeView: 'monitoring' | 'insights'; onChange: (view: 'monitoring' | 'insights') => void }> = ({
  activeView,
  onChange
}) => {
  const navItems: { icon: string; label: string; view: 'monitoring' | 'insights' }[] = [
    { icon: 'monitoring', label: 'Monitoring', view: 'monitoring' },
    { icon: 'insights', label: 'Insights', view: 'insights' }
  ];

  return (
    <aside className="w-16 h-[calc(100vh-1rem)] m-2 bg-slate-900/40 border border-white/10 rounded-xl flex flex-col items-center py-6 gap-8 glass-blur z-20">
      <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(14,165,233,0.3)]">
        <span className="material-symbols-outlined text-[24px]">hub</span>
      </div>

      <nav className="flex flex-col gap-4 w-full px-2">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onChange(item.view)}
            className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all group relative ${
              activeView === item.view
                ? 'bg-primary/10 text-primary border border-primary/40'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] font-light">{item.icon}</span>
            {activeView === item.view && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>
            )}
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 border border-white/10 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest font-mono">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4 w-full px-2">
        <button className="w-full aspect-square rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-[22px] font-light">settings</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] cursor-pointer hover:scale-105 transition-transform">
          <img
            src="https://picsum.photos/100/100?random=1"
            alt="Profile"
            className="w-full h-full rounded-full object-cover grayscale"
          />
        </div>
      </div>
    </aside>
  );
};

const Header: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC';
  };

  return (
    <header className="h-14 bg-slate-900/40 border border-white/10 rounded-xl px-4 flex items-center justify-between glass-blur">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-primary">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'} animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.5)]`}></span>
          SCADA.NET_V4.2
        </div>
        <div className="w-[1px] h-4 bg-white/10"></div>
        <h1 className="text-white font-medium text-sm tracking-tight">Unit 04 Operations</h1>
      </div>

      <div className="flex-1 max-w-xl mx-8 relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">terminal</span>
        <input
          type="text"
          placeholder="Type command or search parameters..."
          className="w-full bg-black/40 border border-white/5 rounded-md pl-12 pr-12 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="bg-slate-800 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end leading-none font-mono">
          <span className="text-xs text-slate-200 tracking-wider">{formatTime(time)}</span>
          <span className="text-[9px] text-primary/70 uppercase font-bold mt-0.5 tracking-widest">
            {isConnected ? 'System Nominal' : 'System Offline'}
          </span>
        </div>
        <button className="relative p-1.5 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5 rounded">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

const InsightsView: React.FC = () => {
  const stats = [
    { label: 'ESP-01 TEMP', value: '—', unit: '°C' },
    { label: 'ESP-02 PRESS', value: '—', unit: 'kPa' },
    { label: 'ESP-03 FLOW', value: '—', unit: 'L/min' },
    { label: 'ESP-04 VIBE', value: '—', unit: 'mm/s' }
  ];
  const insights = [
    { title: 'Thermal Stability', value: 'Pending', status: 'Awaiting data' },
    { title: 'Pressure Drift', value: 'Pending', status: 'Awaiting data' },
    { title: 'Flow Efficiency', value: 'Pending', status: 'Awaiting data' },
    { title: 'Vibration Risk', value: 'Pending', status: 'Awaiting data' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-2 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 glass-blur">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{stat.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-mono text-white">{stat.value}</span>
              <span className="text-[11px] text-slate-500">{stat.unit}</span>
            </div>
            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary/40 w-1/3"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-2 overflow-hidden">
        <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 glass-blur flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Model Execution</div>
            <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/30 rounded-md hover:bg-primary/20 transition-colors">
              Run Model
            </button>
          </div>
          <div className="mt-4 flex-1 rounded-lg border border-white/5 bg-black/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-white/70 font-mono">Awaiting Model Integration</div>
              <div className="text-[10px] text-slate-500 mt-1">Upload dataset or stream ESP telemetry to start.</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 glass-blur flex flex-col gap-3">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Insights Queue</div>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
            {insights.map((item) => (
              <div key={item.title} className="border border-white/10 rounded-lg p-3 bg-black/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">{item.value}</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MainGrid: React.FC<{
  coreStatus: 'normal' | 'critical';
  coreMetrics: Metric[];
  flowMetrics: Metric[];
  logMetrics: Metric[];
}> = ({ coreStatus, coreMetrics, flowMetrics, logMetrics }) => {
  return (
    <div className="flex-[3] flex gap-2 overflow-hidden min-h-0">
      <Panel
        title="RCT-01 // CORE"
        status={coreStatus === 'critical' ? 'CRITICAL' : 'NORMAL'}
        icon="warning"
        accent={coreStatus === 'critical' ? 'danger' : 'primary'}
        image="https://picsum.photos/seed/reactor/800/1200"
        modelSrc="/models/untitled.glb"
        showOverlay={true}
        metrics={coreMetrics}
      />
      <Panel
        title="DIST-02 // FLOW"
        status="NORMAL"
        icon="water"
        accent="primary"
        image="https://picsum.photos/seed/pipes/800/1200"
        grayscale={true}
        metrics={flowMetrics}
      />
      <Panel
        title="STR-09 // LOGS"
        status="CAPACITY"
        icon="inventory_2"
        accent="warning"
        image="https://picsum.photos/seed/warehouse/800/1200"
        showGrid={true}
        metrics={logMetrics}
      />
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  status: string;
  icon: string;
  accent: 'primary' | 'warning' | 'danger';
  image: string;
  modelSrc?: string;
  metrics: Metric[];
  grayscale?: boolean;
  showOverlay?: boolean;
  showGrid?: boolean;
}> = ({ title, status, icon, accent, image, modelSrc, metrics, grayscale, showOverlay, showGrid }) => {
  const [modelError, setModelError] = useState(false);

  return (
    <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-xl flex flex-col overflow-hidden glass-blur group hover:border-white/20 transition-all duration-300">
      <div className="h-9 bg-black/40 border-b border-white/10 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-[16px] ${
              accent === 'danger' ? 'text-danger animate-pulse' : accent === 'warning' ? 'text-warning' : 'text-slate-400'
            }`}
          >
            {icon}
          </span>
          <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono uppercase">{title}</span>
        </div>
        <span
          className={`text-[9px] font-mono uppercase tracking-widest ${
            accent === 'danger' ? 'text-danger' : accent === 'warning' ? 'text-warning' : 'text-primary'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="flex-1 relative overflow-hidden bg-black/20">
        {modelSrc && !modelError ? (
          <model-viewer
            src={modelSrc}
            poster={image}
            alt={`3D Model of ${title}`}
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="0.7"
            loading="eager"
            style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as React.CSSProperties}
            onError={() => setModelError(true)}
          >
            {/* Fallback content within model-viewer if needed, though poster handles loading */}
            <div slot="progress-bar"></div>
          </model-viewer>
        ) : (
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover opacity-60 mix-blend-screen ${grayscale ? 'grayscale' : ''}`}
          />
        )}
        {showOverlay && <div className="absolute inset-0 bg-danger/10 animate-pulse pointer-events-none"></div>}
        {showGrid && <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none"></div>}
      </div>
      <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-2 gap-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 rounded p-2 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              {metric.status && (
                <span
                  className={`text-[8px] font-bold ${
                    metric.status === 'HI' ? 'text-danger' : metric.status === 'LOW' ? 'text-warning' : 'text-success'
                  }`}
                >
                  {metric.status}
                </span>
              )}
            </div>
            <div className="text-xl font-mono text-slate-100 flex items-baseline gap-0.5">
              {metric.value}
              <span className="text-[10px] text-slate-500">{metric.unit}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${metric.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConsoleLogs: React.FC<{ anomalies: { zone: string; severity: number; timestamp: number }[] }> = ({ anomalies }) => {
  const baseLogs = useMemo<LogEntry[]>(
    () => [
      {
        timestamp: '14:30:12.450',
        level: LOG_LEVELS.INFO,
        message: 'System initialization sequence complete. All modules active.'
      },
      {
        timestamp: '14:30:15.102',
        level: LOG_LEVELS.SUCCESS,
        message: 'Connection established with Node DIST-02. Latency: 4ms.'
      },
      {
        timestamp: '14:31:05.889',
        level: LOG_LEVELS.ALERT,
        message: 'Abnormal temperature rise detected in RCT-01 Core. Threshold exceeded by 12%.'
      },
      {
        timestamp: '14:31:06.001',
        level: LOG_LEVELS.AI_SYS,
        message: 'Predictive model updated. Risk level raised to category 4.'
      },
      {
        timestamp: '14:31:45.220',
        level: LOG_LEVELS.WARN,
        message: 'Storage STR-09 approaching capacity limit (80%).'
      }
    ],
    []
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const logs = useMemo(() => {
    const anomalyLogs = anomalies.map((anomaly) => ({
      timestamp: `T-${anomaly.timestamp}`,
      level: LOG_LEVELS.ALERT,
      message: `Anomaly detected in ${anomaly.zone.toUpperCase()} zone. Severity ${(anomaly.severity * 100).toFixed(0)}%.`
    }));
    return [...baseLogs, ...anomalyLogs].slice(-20);
  }, [anomalies, baseLogs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelStyles = (level: LogLevel) => {
    switch (level) {
      case LOG_LEVELS.INFO:
        return 'text-primary';
      case LOG_LEVELS.SUCCESS:
        return 'text-success';
      case LOG_LEVELS.ALERT:
        return 'text-danger';
      case LOG_LEVELS.AI_SYS:
        return 'text-accent';
      case LOG_LEVELS.WARN:
        return 'text-warning';
    }
  };

  return (
    <div className="h-44 bg-slate-900/40 border border-white/10 rounded-xl flex flex-col overflow-hidden glass-blur shrink-0">
      <div className="h-8 bg-black/40 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">System Logs</span>
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger/50"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-warning/50"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-success/50"></span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="material-symbols-outlined text-[14px]">history</span>
          History: 24h
        </div>
      </div>

      <div ref={containerRef} className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 custom-scrollbar">
        {logs.map((log, i) => (
          <div
            key={`${log.timestamp}-${i}`}
            className={`flex gap-4 py-0.5 border-b border-white/5 last:border-0 ${log.level === LOG_LEVELS.ALERT ? 'bg-danger/5' : ''}`}
          >
            <span className="text-slate-600 shrink-0 w-20">{log.timestamp}</span>
            <span className={`font-bold shrink-0 w-16 ${getLevelStyles(log.level)}`}>{log.level}</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
        <div className="flex gap-4 py-0.5 opacity-50">
          <span className="text-slate-600 shrink-0 w-20">14:32:05.---</span>
          <span className="text-slate-600 shrink-0 w-16">...</span>
          <span className="text-slate-400">
            Waiting for next sequence<span className="animate-pulse">_</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const FloatingAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-72 bg-slate-900/90 border border-primary/30 rounded-xl p-4 glass-blur shadow-2xl animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">AI Tactical Assistant</div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Critical thermal escalation detected in Unit 04. I recommend immediate coolant diversion from DIST-02 to prevent
                potential breach.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded text-[9px] font-bold uppercase tracking-wider transition-colors text-primary">
                  Details
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-bold uppercase tracking-wider transition-colors text-slate-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] border border-white/20 hover:scale-105 active:scale-95 transition-all group"
      >
        <span className="material-symbols-outlined text-[30px] group-hover:rotate-12 transition-transform">smart_toy</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger border-2 border-slate-900 rounded-full flex items-center justify-center text-[8px] font-bold">
          1
        </div>
      </button>
    </div>
  );
};
