import React, { useState, useRef } from 'react';
import '@google/model-viewer';
import {
  Activity,
  Bot,
  Box,
  ChevronRight,
  Cpu,
  Gauge,
  Info,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Terminal,
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

const EspView: React.FC = () => {
  // Placeholder variables for ESP sensor subscriptions
  // Hook logic will be implemented here later
  const [sensors] = useState({
    sens1: { id: 'sens1', label: 'ESP Sensor 1', value: '---', unit: 'V' },
    sens2: { id: 'sens2', label: 'ESP Sensor 2', value: '---', unit: 'A' },
    sens3: { id: 'sens3', label: 'ESP Sensor 3', value: '---', unit: 'W' }
  });

  return (
    <div className="w-full h-full flex flex-col p-6 max-w-4xl mx-auto gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(sensors).map((sensor) => (
          <div key={sensor.id} className="bg-slate-900/40 border border-white/10 p-6 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 text-slate-400">
              <Activity size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{sensor.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono text-white font-bold">{sensor.value}</span>
              <span className="text-sm text-slate-500 font-mono">{sensor.unit}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-primary/50 w-0 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
          <Wifi size={32} className="text-slate-600" />
          <div className="absolute inset-0 border-t border-primary/50 rounded-full animate-spin-slow opacity-50"></div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Waiting for ESP-32 Handshake</h2>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            Telemetry stream inactive. Connect your ESP device to the WebSocket bridge to begin real-time data ingestion.
          </p>
        </div>
      </div>
    </div>
  );
};

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
