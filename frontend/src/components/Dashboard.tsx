import React, { useState, useRef, useEffect, useCallback } from 'react';
import '@google/model-viewer';
import mqtt from 'mqtt';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Bot,
  Box,
  Brain,
  ChevronRight,
  Cpu,
  Droplets,
  Gauge,
  Info,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Thermometer,
  Wifi
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type ViewMode = 'main' | 'chatbot' | 'esp';

interface HotspotData {
  name: string;
  position: string;
  normal: string;
  label: string;
  description: string;
}

const HOTSPOTS: HotspotData[] = [
  {
    name: 'hotspot-core',
    position: '0 1 0',
    normal: '0 1 0',
    label: 'Reactor Core',
    description: 'Primary fusion chamber operating at 98% efficiency. Thermal shielding active.'
  },
  {
    name: 'hotspot-valve',
    position: '0.5 0.5 0.5',
    normal: '1 0 0',
    label: 'Flow Valve A',
    description: 'Regulates coolant distribution. Currently open at 45% capacity.'
  },
  {
    name: 'hotspot-turbine',
    position: '-0.5 0.2 -0.5',
    normal: '0 0 1',
    label: 'Turbine Array',
    description: 'Generates 1.2GW of power. Vibration levels nominal.'
  }
];

/* -------------------------------------------------------------------------- */
/*                               MAIN DASHBOARD                               */
/* -------------------------------------------------------------------------- */

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('main');

  return (
    <div className="flex h-screen w-screen bg-[#050505] relative overflow-hidden text-slate-200 font-sans selection:bg-primary/30">
      {/* Background FX */}
      <div className="fixed inset-0 bg-grid-pattern bg-[length:40px_40px] pointer-events-none z-0 opacity-20"></div>
      <div className="scanline"></div>

      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <Header activeView={activeView} />
        
        <div className="flex-1 relative overflow-hidden">
          {activeView === 'main' && <Main3DView />}
          {activeView === 'chatbot' && <ChatbotView />}
          {activeView === 'esp' && <EspView />}
        </div>
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

const Sidebar: React.FC<{ activeView: ViewMode; onViewChange: (v: ViewMode) => void }> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'main', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { id: 'chatbot', icon: <MessageSquare size={20} />, label: 'AI Assistant' },
    { id: 'esp', icon: <Wifi size={20} />, label: 'ESP Telemetry' },
  ] as const;

  return (
    <aside className="w-16 md:w-20 border-r border-white/5 bg-slate-900/50 backdrop-blur-md flex flex-col items-center py-6 gap-6 z-20">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/40 flex items-center justify-center text-primary mb-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
        <Cpu size={24} />
      </div>

      <nav className="flex flex-col gap-2 w-full px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 group relative ${
              activeView === item.id
                ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 border border-white/10 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest font-mono shadow-xl translate-x-2 group-hover:translate-x-0">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px]">
          <div className="w-full h-full rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-[10px] font-bold">
            AD
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header: React.FC<{ activeView: ViewMode }> = ({ activeView }) => {
  const titles = {
    main: 'Main Reactor Overview',
    chatbot: 'Tactical AI Assistant',
    esp: 'ESP-32 Telemetry Stream'
  };

  return (
    <header className="h-16 border-b border-white/5 bg-slate-900/30 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.5)]"></span>
          {titles[activeView]}
        </h1>
        <div className="h-4 w-px bg-white/10"></div>
        <div className="text-[10px] font-mono text-slate-500">SYS_V4.2.1</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 gap-2">
          <Search size={14} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Search commands..." 
            className="bg-transparent border-none outline-none text-[10px] font-mono text-slate-300 w-48 placeholder:text-slate-600"
          />
          <kbd className="text-[9px] font-mono text-slate-600 border border-white/5 px-1 rounded">CTRL+K</kbd>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="text-success">● ONLINE</span>
          <span>14ms</span>
        </div>
      </div>
    </header>
  );
};

const Main3DView: React.FC = () => {
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const modelViewerRef = useRef<HTMLElement>(null);

  const handleHotspotClick = (hs: HotspotData) => {
    const isSelected = selectedHotspot === hs.name;
    setSelectedHotspot(isSelected ? null : hs.name);

    if (!isSelected && modelViewerRef.current) {
      // Zoom and rotate to the hotspot
      const viewer = modelViewerRef.current as any;
      
      // Calculate a target orbit based on the hotspot position
      // This is a simple approximation; for perfect framing, you might need specific orbit values per hotspot
      // Here we maintain the current theta/phi but zoom in (reduce radius)
      
      // We can use the hotspot position as the target
      viewer.cameraTarget = hs.position;
      
      // And zoom in by setting a closer radius (e.g., '2m')
      // You might want to store specific orbit values in HOTSPOTS if this generic zoom isn't perfect
      viewer.cameraOrbit = '0deg 75deg 2m'; 
    } else if (isSelected && modelViewerRef.current) {
      // Reset view when deselecting
      const viewer = modelViewerRef.current as any;
      viewer.cameraTarget = 'auto';
      viewer.cameraOrbit = 'auto';
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Merged Data Overlay - Left */}
      <div className="absolute top-6 left-6 w-64 flex flex-col gap-4 pointer-events-none z-10">
        <DataCard title="Core Status" value="NOMINAL" accent="text-success" icon={<Activity size={16} />}>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Metric label="Temp" value="342°C" />
            <Metric label="Press" value="12.4 MPa" />
          </div>
        </DataCard>
        <DataCard title="Flow Rate" value="98%" accent="text-primary" icon={<Gauge size={16} />}>
          <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary w-[98%] shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
          </div>
        </DataCard>
      </div>

      {/* Merged Data Overlay - Right */}
      <div className="absolute top-6 right-6 w-72 flex flex-col gap-4 pointer-events-none z-10">
         <DataCard title="System Logs" value="LIVE" accent="text-warning" icon={<Terminal size={16} />}>
            <div className="font-mono text-[9px] text-slate-400 space-y-1 mt-2">
              <div className="flex gap-2"><span className="text-slate-600">14:02:11</span> <span>&gt; Sequence start</span></div>
              <div className="flex gap-2"><span className="text-slate-600">14:02:15</span> <span className="text-success">OK: Valve check</span></div>
              <div className="flex gap-2"><span className="text-slate-600">14:02:22</span> <span className="text-warning">WARN: Pressure var</span></div>
            </div>
         </DataCard>
      </div>

      {/* 3D Model Viewer */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900/20 to-black/80">
        <model-viewer
          ref={modelViewerRef}
          src="/models/reactorwithsensorsfinal.glb"
          poster="/models/Gemini_Generated_Image_ob961lob961lob96.png"
          alt="Limpet Reactor"
          camera-controls
          auto-rotate={!selectedHotspot}
          interaction-prompt="auto"
          shadow-intensity="1"
          exposure="0.6"
          loading="eager"
          style={{ width: '100%', height: '100%', '--poster-color': 'transparent', opacity: opacity, transition: 'opacity 0.3s ease' } as React.CSSProperties}
        >
          {HOTSPOTS.map((hs) => (
            <button
              key={hs.name}
              slot={hs.name}
              data-position={hs.position}
              data-normal={hs.normal}
              className={`group w-6 h-6 rounded-full border-2 border-primary bg-primary/20 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-125 hover:bg-primary hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] flex items-center justify-center ${
                selectedHotspot === hs.name ? 'scale-125 bg-primary shadow-[0_0_20px_rgba(0,240,255,0.8)]' : ''
              }`}
              onClick={() => handleHotspotClick(hs)}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              
              {/* Tooltip */}
              <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 w-48 bg-slate-900/90 border border-primary/30 p-3 rounded-lg backdrop-blur-md transition-all duration-300 pointer-events-none opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 ${selectedHotspot === hs.name ? 'opacity-100 translate-x-0' : ''}`}>
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{hs.label}</div>
                <div className="text-[10px] text-slate-300 leading-relaxed">{hs.description}</div>
              </div>
            </button>
          ))}
        </model-viewer>
      </div>
      
      {/* Bottom Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full z-10">
        <ControlButton icon={<Layers size={16} />} label="Layers" />
        <ControlButton icon={<Box size={16} />} label="Explode" />
        <ControlButton icon={<Activity size={16} />} label="Analyze" active />
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <div className="flex items-center gap-2 px-3">
          <span className="text-[9px] font-bold uppercase text-slate-400">Opacity</span>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1" 
            value={opacity} 
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <ControlButton icon={<Info size={16} />} label="Info" />
      </div>
    </div>
  );
};

const ChatbotView: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Tactical AI Assistant Online. How can I help you with the reactor diagnostics?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Neural link disrupted.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 max-w-4xl mx-auto">
      <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col glass-blur shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-black' : 'bg-white/10 text-primary'}`}>
                {msg.role === 'user' ? <Settings size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary/10 border border-primary/20 text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-primary">
                <Bot size={16} />
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex gap-4 items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus-within:border-primary/50 transition-colors">
            <Terminal size={18} className="text-slate-500" />
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Enter directive..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-slate-600"
            />
            <button onClick={handleSend} disabled={isLoading} className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors disabled:opacity-50">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          HISTORY BUFFER CONFIG                             */
/* -------------------------------------------------------------------------- */

const MAX_HISTORY = 60; // seconds of rolling data

interface SensorSample {
  t: number; // seconds since first reading
  flow: number;
  temperature: number;
  pressure: number;
  ph: number;
  anomaly: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               ESP TELEMETRY                                */
/* -------------------------------------------------------------------------- */

const EspView: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [anomaly, setAnomaly] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const firstTs = useRef<number | null>(null);

  const [sensors, setSensors] = useState({
    flow:        { label: 'Flow Rate',   value: '---', unit: 'L/min', icon: <Droplets size={20} /> },
    temperature: { label: 'Temperature', value: '---', unit: '°C',    icon: <Thermometer size={20} /> },
    pressure:    { label: 'Pressure',    value: '---', unit: 'bar',   icon: <Gauge size={20} /> },
    ph:          { label: 'pH Level',    value: '---', unit: 'pH',    icon: <Activity size={20} /> },
  });

  const [history, setHistory] = useState<SensorSample[]>([]);

  const handleMessage = useCallback((_topic: string, message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      const ts = data.timestamp ?? 0;
      if (firstTs.current === null) firstTs.current = ts;
      const relT = Math.round((ts - (firstTs.current ?? ts)) / 1000);

      const flow = Number(data.flow_l_min ?? 0);
      const temperature = Number(data.temperature_c ?? 0);
      const pressure = Number(data.pressure_bar ?? 0);
      const ph = Number(data.ph ?? 0);
      const isAnomaly = !!data.anomaly;

      setSensors({
        flow:        { label: 'Flow Rate',   value: String(data.flow_l_min    ?? '---'), unit: 'L/min', icon: <Droplets size={20} /> },
        temperature: { label: 'Temperature', value: String(data.temperature_c ?? '---'), unit: '°C',    icon: <Thermometer size={20} /> },
        pressure:    { label: 'Pressure',    value: String(data.pressure_bar   ?? '---'), unit: 'bar',   icon: <Gauge size={20} /> },
        ph:          { label: 'pH Level',    value: String(data.ph             ?? '---'), unit: 'pH',    icon: <Activity size={20} /> },
      });
      setAnomaly(isAnomaly);
      setLastTimestamp(ts);
      setTotalSamples(prev => prev + 1);
      if (isAnomaly) setAnomalyCount(prev => prev + 1);

      setHistory(prev => {
        const next = [...prev, { t: relT, flow, temperature, pressure, ph, anomaly: isAnomaly }];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    } catch {
      console.error('[MQTT] Failed to parse message');
    }
  }, []);

  useEffect(() => {
    const brokerUrl = 'wss://7ebd6f06ccae49478ac407523133bf18.s1.eu.hivemq.cloud:8884/mqtt';
    const client = mqtt.connect(brokerUrl, {
      username: 'ESP32_BOOTCAMP',
      password: '0192837465nN',
      protocol: 'wss',
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });
    clientRef.current = client;

    client.on('connect', () => {
      setConnected(true);
      client.subscribe('factory/reactor1/sensors');
    });
    client.on('message', handleMessage);
    client.on('close', () => setConnected(false));
    client.on('reconnect', () => console.log('[MQTT] Reconnecting…'));

    return () => { client.end(true); clientRef.current = null; };
  }, [handleMessage]);

  const anomalyRate = totalSamples > 0 ? ((anomalyCount / totalSamples) * 100).toFixed(1) : '0.0';
  const normalRate = totalSamples > 0 ? (((totalSamples - anomalyCount) / totalSamples) * 100).toFixed(1) : '0.0';

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 max-w-7xl mx-auto gap-4 sm:gap-5 overflow-y-auto custom-scrollbar">
      {/* ── Connection status bar ────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Wifi size={16} className={connected ? 'text-green-400' : 'text-red-400'} />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            MQTT {connected ? <span className="text-green-400">CONNECTED</span> : <span className="text-red-400">DISCONNECTED</span>}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastTimestamp !== null && (
            <span className="text-[10px] font-mono text-slate-500">
              uptime: {(lastTimestamp / 1000).toFixed(0)}s
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-500">
            samples: {totalSamples}
          </span>
        </div>
      </div>

      {/* ── Anomaly alert banner ─────────────────────────────────────── */}
      {anomaly && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 animate-pulse">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div>
            <span className="text-sm font-bold text-red-300 uppercase tracking-widest">Anomaly Detected</span>
            <p className="text-[10px] text-red-400/80 mt-0.5">Sensor readings exceed normal thresholds. Check system immediately.</p>
          </div>
        </div>
      )}

      {/* ── 4 Sensor Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(sensors).map(([key, sensor]) => {
          const numVal = parseFloat(sensor.value);
          const hasValue = !isNaN(numVal);
          const barWidth = hasValue ? Math.min(100, Math.max(5, (numVal / getMaxForSensor(key)) * 100)) : 0;

          return (
            <div
              key={key}
              className={`bg-slate-900/40 border rounded-xl p-5 backdrop-blur-md transition-all duration-300 ${
                anomaly && isAnomalous(key, numVal)
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-white/10 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3 text-slate-400">
                {sensor.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{sensor.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono text-white font-bold tabular-nums">{sensor.value}</span>
                <span className="text-sm text-slate-500 font-mono">{sensor.unit}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    anomaly && isAnomalous(key, numVal) ? 'bg-red-500' : 'bg-primary/50'
                  }`}
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sensor Time-Series Graphs ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SensorChart
          title="Flow Rate"
          unit="L/min"
          dataKey="flow"
          color="#00f0ff"
          history={history}
          normalMin={0}
          normalMax={10}
          description="Water flow through the main reactor pipe. Values > 10 L/min indicate a surge or sensor fault."
        />
        <SensorChart
          title="Temperature"
          unit="°C"
          dataKey="temperature"
          color="#f59e0b"
          history={history}
          normalMin={15}
          normalMax={35}
          description="Coolant temperature from the DS18B20 probe. Safe operating range is 15–35 °C."
        />
        <SensorChart
          title="Pressure"
          unit="bar"
          dataKey="pressure"
          color="#8b5cf6"
          history={history}
          normalMin={0}
          normalMax={10}
          description="System pressure computed from flow and temperature. Spikes beyond 10 bar may indicate blockage."
        />
        <SensorChart
          title="pH Level"
          unit="pH"
          dataKey="ph"
          color="#10b981"
          history={history}
          normalMin={6}
          normalMax={9}
          description="Water acidity/alkalinity. Normal water is pH 6–9. Outliers signal chemical imbalance."
        />
      </div>

      {/* ── ML Model Diagnostics ─────────────────────────────────────── */}
      <div className="bg-slate-900/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={20} className="text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Isolation Forest — Anomaly Detection Model</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-5 max-w-3xl">
          The on-device threshold detector flags anomalies in real-time. Below is a summary of the trained Isolation Forest model performance on the 5,000-sample synthetic dataset. The model learns the "shape" of normal data and isolates outliers that deviate from the learned distribution.
        </p>

        {/* Model KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <ModelKPI label="Accuracy" value="97.5%" description="Overall correct predictions" good />
          <ModelKPI label="Precision" value="87.6%" description="True positives / all flagged" good />
          <ModelKPI label="Recall" value="87.6%" description="Detected / all actual anomalies" good />
          <ModelKPI label="F1-Score" value="0.876" description="Harmonic mean of P & R" good />
          <ModelKPI label="ROC-AUC" value="0.993" description="Ranking quality (1 = perfect)" good />
          <ModelKPI label="PR-AUC" value="0.951" description="Performance on imbalanced data" good />
        </div>

        {/* Live session stats + anomaly timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Session stats */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              {anomaly
                ? <ShieldAlert size={18} className="text-red-400" />
                : <ShieldCheck size={18} className="text-green-400" />
              }
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Live Session</span>
            </div>
            <div className="space-y-2">
              <StatRow label="Total Samples" value={String(totalSamples)} />
              <StatRow label="Anomalies Detected" value={String(anomalyCount)} alert={anomalyCount > 0} />
              <StatRow label="Anomaly Rate" value={`${anomalyRate}%`} alert={Number(anomalyRate) > 15} />
              <StatRow label="Normal Rate" value={`${normalRate}%`} />
              <StatRow label="Current Status" value={anomaly ? 'ANOMALY' : 'NORMAL'} alert={anomaly} />
            </div>
          </div>

          {/* Anomaly timeline chart */}
          <div className="lg:col-span-2 bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Anomaly Timeline</span>
              <span className="text-[9px] text-slate-500 ml-auto">Red regions = anomaly detected</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => `${v}s`} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => v === 1 ? 'ANO' : 'OK'} width={30} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                  formatter={(value) => [Number(value) === 1 ? 'ANOMALY' : 'Normal', 'Status']}
                  labelFormatter={(l) => `t = ${l}s`}
                />
                <Area type="stepAfter" dataKey={(d: SensorSample) => d.anomaly ? 1 : 0} stroke="#ef4444" fill="url(#anomGrad)" strokeWidth={1.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model description */}
        <div className="mt-4 bg-black/20 border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-400 leading-relaxed">
            <div>
              <span className="text-primary font-bold">1. Data Collection</span>
              <p className="mt-1">The ESP32 reads flow, temperature, pressure, and pH every second and publishes JSON to an MQTT broker over TLS. The frontend subscribes via WebSocket.</p>
            </div>
            <div>
              <span className="text-purple-400 font-bold">2. Isolation Forest</span>
              <p className="mt-1">Trained on 5,000 synthetic samples (90% normal, 10% anomalies). The model isolates outliers by measuring how few random splits are needed to separate a data point — anomalies are easier to isolate.</p>
            </div>
            <div>
              <span className="text-green-400 font-bold">3. Real-Time Scoring</span>
              <p className="mt-1">Each incoming reading is classified as normal or anomalous. Threshold rules on the ESP32 provide instant on-device detection; the ML model provides a second, more nuanced opinion for the backend.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Disconnected state ───────────────────────────────────────── */}
      {!connected && totalSamples === 0 && (
        <div className="bg-slate-900/40 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
            <Wifi size={32} className="text-slate-600" />
            <div className="absolute inset-0 border-t border-primary/50 rounded-full animate-spin-slow opacity-50"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Connecting to MQTT Broker</h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
              Establishing secure WebSocket connection to HiveMQ Cloud. Real-time telemetry will appear automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          SENSOR CHART COMPONENT                            */
/* -------------------------------------------------------------------------- */

const SensorChart: React.FC<{
  title: string;
  unit: string;
  dataKey: string;
  color: string;
  history: SensorSample[];
  normalMin: number;
  normalMax: number;
  description: string;
}> = ({ title, unit, dataKey, color, history, normalMin, normalMax, description }) => (
  <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 backdrop-blur-md">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{title}</span>
      <span className="text-[9px] font-mono text-slate-500">{unit} — last {history.length}s</span>
    </div>
    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{description}</p>
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => `${v}s`} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={35} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
          labelFormatter={(l) => `t = ${l}s`}
        />
        <ReferenceLine y={normalMin} stroke="#facc15" strokeDasharray="4 4" strokeWidth={1} label={{ value: `min ${normalMin}`, fill: '#facc1580', fontSize: 8, position: 'left' }} />
        <ReferenceLine y={normalMax} stroke="#facc15" strokeDasharray="4 4" strokeWidth={1} label={{ value: `max ${normalMax}`, fill: '#facc1580', fontSize: 8, position: 'left' }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                         MODEL KPI + STAT HELPERS                           */
/* -------------------------------------------------------------------------- */

const ModelKPI: React.FC<{ label: string; value: string; description: string; good?: boolean }> = ({ label, value, description, good }) => (
  <div className="bg-black/30 border border-white/5 rounded-lg p-3 text-center">
    <div className={`text-xl font-mono font-bold ${good ? 'text-green-400' : 'text-red-400'}`}>{value}</div>
    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-1">{label}</div>
    <div className="text-[8px] text-slate-500 mt-0.5">{description}</div>
  </div>
);

const StatRow: React.FC<{ label: string; value: string; alert?: boolean }> = ({ label, value, alert }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className={`text-[10px] font-mono font-bold ${alert ? 'text-red-400' : 'text-slate-200'}`}>{value}</span>
  </div>
);

/* --- EspView helpers --- */
function getMaxForSensor(key: string): number {
  switch (key) {
    case 'flow':        return 15;
    case 'temperature': return 50;
    case 'pressure':    return 12;
    case 'ph':          return 14;
    default:            return 100;
  }
}

function isAnomalous(key: string, val: number): boolean {
  if (isNaN(val)) return false;
  switch (key) {
    case 'flow':        return val > 10;
    case 'temperature': return val < 15 || val > 35;
    case 'pressure':    return val < 0 || val > 10;
    case 'ph':          return val < 6 || val > 9;
    default:            return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const DataCard: React.FC<{ title: string; value: string; accent: string; icon: React.ReactNode; children?: React.ReactNode }> = ({ title, value, accent, icon, children }) => (
  <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl backdrop-blur-md shadow-lg animate-in slide-in-from-left-4 fade-in duration-500">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className={`text-[10px] font-bold ${accent} px-2 py-0.5 bg-white/5 rounded`}>{value}</div>
    </div>
    {children}
  </div>
);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/5 rounded p-2">
    <div className="text-[9px] text-slate-500 uppercase">{label}</div>
    <div className="text-sm font-mono text-slate-200">{value}</div>
  </div>
);

const ControlButton: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${active ? 'bg-primary text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
    {icon}
    <span>{label}</span>
  </button>
);
