import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import {
  BarChart3,
  Binary,
  ChevronRight,
  Cpu,
  Eye,
  Layers,
  Send,
  ShieldCheck,
  Terminal,
  Zap
} from 'lucide-react';

interface Props {
  onEnter: () => void;
}

export const LandingPage: React.FC<Props> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="relative min-h-screen">
      <Header onEnter={onEnter} />

      <main className="relative z-10">
        <Hero onEnter={onEnter} />
        <ReactorShowcase />
        <Capabilities />

        <Protocol />
        <TerminalCTA />
      </main>

      <Footer />
    </div>
  );
};

const Header: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <nav className="fixed top-8 w-full z-40 bg-bg-dark/80 backdrop-blur-md border-b border-border-dim">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary flex items-center justify-center technical-border">
            <Cpu className="text-primary w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tighter text-white block leading-none">FORGE</span>
            <span className="text-[10px] text-primary/60 tracking-[0.2em] font-mono">DIGITAL TWIN V4.0</span>
          </div>
        </div>

        <button
          onClick={onEnter}
          className="px-6 py-2 bg-primary/10 border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all duration-300 technical-border shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          System Access
        </button>
      </div>
    </nav>
  );
};

const Hero: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <section className="pt-48 pb-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Real-time Telemetry Active
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
            <span className="text-white">THE FUTURE OF</span>
            <br />
            <span className="text-primary text-glow italic">INDUSTRIAL INTEL.</span>
          </h1>

          <p className="text-white/60 max-w-lg mb-10 leading-relaxed font-sans">
            Deploy hyper-accurate digital representations of your physical assets. Forge integrates sensory data with predictive neural
            networks to preempt catastrophic failures before they manifest.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Initialize Twin <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-12 flex gap-8">
            <Stat label="Live Nodes" value="1,429" />
            <Stat label="Prediction Accuracy" value="99.8%" />
            <Stat label="Latency" value="0.4ms" />
          </div>
        </div>

        <div className="relative flex justify-center items-center h-[500px]">
          <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10 w-full h-full">
            <model-viewer
              src="/models/untitled.glb"
              poster="/models/Gemini_Generated_Image_ob961lob961lob96.png"
              alt="Forge Core Reactor"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              exposure="0.8"
              loading="eager"
              style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as React.CSSProperties}
            >
              <div slot="progress-bar"></div>
            </model-viewer>
          </div>

        </div>
      </div>
    </section>
  );
};

const ReactorShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showDescription = inView && modelReady;

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div ref={containerRef} className={`relative fade-in-up ${inView ? 'is-visible' : ''}`}>
          <div className="absolute -inset-6 bg-primary/10 blur-3xl opacity-30"></div>
          <div className="relative bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden glass-blur">
            <model-viewer
              src="/models/untitled.glb"
              poster="/models/Gemini_Generated_Image_ob961lob961lob96.png"
              alt="Limpet reactor assembly"
              camera-controls
              auto-rotate
              interaction-prompt="auto"
              shadow-intensity="1"
              exposure="0.85"
              loading="eager"
              onLoad={() => setModelReady(true)}
              style={{ width: '100%', height: '520px', '--poster-color': 'transparent' } as React.CSSProperties}
            >
              <div slot="progress-bar"></div>
            </model-viewer>
          </div>
          <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60">
            Reactor Twin: Untitled Core
          </div>
        </div>

        <div className={`fade-in-up ${showDescription ? 'is-visible' : ''}`} style={{ transitionDelay: '200ms' }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60 mb-4">Project Overview</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white leading-tight mb-6">
            Limpet Reactor Digital Twin
          </h2>
          <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
            A high-fidelity simulation stack that fuses live telemetry, predictive control, and safety envelopes into a single operational
            surface. The twin provides continuous visibility into thermal stability, flow efficiency, and structural health.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-white/70">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Purpose</div>
              Accelerate analysis, rehearse operational scenarios, and reduce downtime with real-time insight.
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-primary font-bold text-xs uppercase tracking-widest mb-2">Benefits</div>
              Predict anomalies earlier, validate interventions, and coordinate teams around a shared visual context.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-2xl font-bold text-white leading-none">{value}</div>
    <div className="text-[10px] text-primary/60 uppercase tracking-widest mt-1 font-mono">{label}</div>
  </div>
);

const Capabilities: React.FC = () => {
  const items = [
    {
      icon: <Layers size={24} />,
      title: 'Spatial Twins',
      desc: 'Precise 1:1 photogrammetric reconstruction of industrial facilities.'
    },
    {
      icon: <Zap size={24} />,
      title: 'Real-time Telemetry',
      desc: 'Millisecond-latency data streaming from IoT edge sensors.'
    },
    {
      icon: <Binary size={24} />,
      title: 'Neural Forecasting',
      desc: 'Predict maintenance requirements up to 72 hours in advance.'
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Protocol Security',
      desc: 'Post-quantum encrypted data channels for mission-critical operations.'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Live Simulation',
      desc: "Run 'what-if' scenarios against the digital twin without plant impact."
    },
    {
      icon: <Eye size={24} />,
      title: 'Visual Ops',
      desc: 'Augmented reality overlays for complex hardware maintenance.'
    }
  ];

  return (
    <section className="py-24 px-4 bg-surface-dark/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tighter uppercase flex items-center gap-4">
            <span className="w-8 h-px bg-primary"></span>
            System Capabilities
          </h2>
          <p className="text-white/40 text-sm mt-2 ml-12">Comprehensive suite for industrial autonomy.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group p-8 bg-bg-dark border border-white/5 hover:border-primary/50 transition-all technical-border relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                <item.icon.type size={80} />
              </div>

              <div className="text-primary mb-6 group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed font-sans">{item.desc}</p>

              <div className="mt-8 flex items-center gap-2 text-[10px] text-primary/40 group-hover:text-primary transition-colors font-mono">
                <span>VIEW MODULE_0{idx + 1}</span>
                <span className="w-4 h-px bg-primary/20 group-hover:bg-primary/50"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Protocol: React.FC = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-8">Active Operations</h2>
            <div className="border border-border-dim bg-surface-dark overflow-hidden technical-border">
              <div className="bg-white/5 border-b border-border-dim p-4 flex items-center justify-between text-[10px] font-bold text-primary tracking-widest uppercase">
                <span>Terminal Log Stream</span>
                <span>ID: FORGE-882-QX</span>
              </div>
              <div className="p-6 font-mono text-[11px] leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                <LogLine timestamp="12:04:12" status="OK" msg="Initializing core thermal sensors..." />
                <LogLine timestamp="12:04:13" status="OK" msg="Establishing handshakes with Node_01 through Node_48." />
                <LogLine timestamp="12:04:15" status="WARN" msg="Sub-optimal pressure detected in Line C-4. Auto-compensating." color="text-warning" />
                <LogLine timestamp="12:04:18" status="OK" msg="Neural model V4.2 loaded into memory buffer." />
                <LogLine timestamp="12:04:22" status="CRIT" msg="Predictive anomaly detected at Turbine Unit 7. Confidence: 82%." color="text-alert" />
                <LogLine timestamp="12:04:25" status="OK" msg="Dispatching maintenance droid MD-8 for visual inspection." />
                <LogLine timestamp="12:04:30" status="OK" msg="Syncing digital twin database (PostgreSQL 15 Cluster)." />
                <LogLine timestamp="12:04:35" status="INFO" msg="User admin@forge.io authorized session." />
                <LogLine timestamp="12:04:40" status="OK" msg="Thermal equilibrium reached at 328°C." />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-8">Directives</h2>
            <div className="space-y-4">
              <Directive status="Active" title="Thermal Regulation" progress={85} />
              <Directive status="Pending" title="Asset Resync" progress={12} />
              <Directive status="Warning" title="Pressure Balance" progress={44} color="border-warning" text="text-warning" />
              <Directive status="Active" title="Neural Training" progress={98} />
            </div>

            <div className="mt-8 p-6 bg-primary/5 border border-primary/20 technical-border">
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Internal Comms</div>
              <p className="text-xs text-white/60 font-sans italic leading-relaxed">
                "Note: The upcoming maintenance cycle for Sector 4 is scheduled for 03:00 UTC. Ensure twin mirrors are in read-only mode."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LogLine = ({
  timestamp,
  status,
  msg,
  color = 'text-white/70'
}: {
  timestamp: string;
  status: string;
  msg: string;
  color?: string;
}) => (
  <div className="mb-2 flex gap-4 border-l border-white/5 pl-4 hover:bg-white/5 transition-colors">
    <span className="text-white/30 shrink-0">[{timestamp}]</span>
    <span className={`font-bold shrink-0 w-12 ${status === 'OK' ? 'text-success' : status === 'CRIT' ? 'text-alert' : 'text-primary'}`}>
      {status}
    </span>
    <span className={color}>{msg}</span>
  </div>
);

const Directive = ({
  status,
  title,
  progress,
  color = 'border-border-dim',
  text = 'text-white'
}: {
  status: string;
  title: string;
  progress: number;
  color?: string;
  text?: string;
}) => (
  <div className={`p-4 bg-surface-dark border ${color} technical-border`}>
    <div className="flex justify-between items-center mb-2">
      <span className={`text-[10px] font-bold uppercase tracking-widest ${text}`}>{title}</span>
      <span className="text-[10px] text-white/30 uppercase">{status}</span>
    </div>
    <div className="h-1 bg-white/5 w-full">
      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
    </div>
    <div className="flex justify-between mt-1">
      <span className="text-[9px] text-white/40">COMPLETION</span>
      <span className="text-[9px] text-primary">{progress}%</span>
    </div>
  </div>
);

const TerminalCTA: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'user' | 'bot'; text: string }[]>([
    { type: 'bot', text: 'SYSTEM_INITIALIZED. WAITING FOR DIRECTIVE...' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setHistory((prev) => [...prev, { type: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { type: 'bot', text: data.answer || 'NO DATA RETURNED.' }]);
    } catch {
      setHistory((prev) => [...prev, { type: 'bot', text: 'ERROR: NEURAL LINK INTERRUPTED.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black border border-primary/30 rounded-lg overflow-hidden technical-border shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Forge Terminal Access</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-alert/50"></div>
              <div className="w-2 h-2 rounded-full bg-warning/50"></div>
              <div className="w-2 h-2 rounded-full bg-success/50"></div>
            </div>
          </div>

          <div ref={scrollRef} className="h-[300px] p-6 overflow-y-auto font-mono text-xs space-y-4 custom-scrollbar bg-[rgba(0,0,0,0.8)]">
            {history.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'text-white/60' : 'text-primary'}`}>
                <span className="shrink-0 font-bold">{msg.type === 'user' ? '>' : '#'}</span>
                <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 text-primary animate-pulse">
                <span className="shrink-0 font-bold">#</span>
                <span>PROCESSING_REQUEST...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-primary/20 p-4 bg-white/5 flex items-center gap-4">
            <Cpu size={18} className="text-primary opacity-50" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query system status or issue directive..."
              className="flex-1 bg-transparent border-none outline-none text-primary placeholder:text-primary/20 text-xs font-mono"
            />
            <button type="submit" className="p-2 hover:bg-primary/10 rounded transition-colors group">
              <Send size={16} className="text-primary group-hover:scale-110 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-[0.3em]">Secure Quantum Tunnel Established // AES-256 E2EE</p>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-dark border-t border-border-dim pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center">
                <span className="text-primary font-bold text-xs">F</span>
              </div>
              <span className="font-bold tracking-tighter text-white">FORGE</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-sans mb-6">
              The leading industrial twin orchestration engine. Building the digital backbone for tomorrow's infrastructure.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.633 7.997c.014.2.014.4.014.6 0 6.1-4.646 13.129-13.129 13.129-2.607 0-5.032-.765-7.07-2.077.37.043.741.057 1.125.057 2.153 0 4.132-.722 5.714-1.947-2.017-.04-3.717-1.367-4.301-3.191.287.043.56.072.86.072.4 0 .8-.058 1.174-.158-2.107-.425-3.689-2.276-3.689-4.507v-.057c.613.344 1.332.563 2.091.59-1.247-.835-2.062-2.265-2.062-3.875 0-.86.227-1.647.628-2.332 2.276 2.793 5.686 4.62 9.526 4.82-.07-.345-.11-.69-.11-1.05 0-2.51 2.037-4.547 4.547-4.547 1.303 0 2.48.548 3.305 1.433 1.033-.2 2.007-.58 2.882-1.104-.34 1.058-1.058 1.948-1.99 2.511.923-.114 1.805-.354 2.62-.718-.616.922-1.39 1.732-2.275 2.384z" /></svg>} />
              <SocialIcon icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.452 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.356V9h3.414v1.561h.047c.477-.9 1.637-1.85 3.368-1.85 3.602 0 4.27 2.37 4.27 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM6.768 20.452H3.905V9h2.863v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.727v20.545C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.222 0h.003z" /></svg>} />
              <SocialIcon icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.95c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.17a11.12 11.12 0 015.79 0c2.21-1.48 3.18-1.17 3.18-1.17.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.07 0 4.4-2.69 5.36-5.25 5.64.41.36.77 1.08.77 2.18v3.23c0 .31.21.67.8.56A10.53 10.53 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" /></svg>} />
            </div>
          </div>

          <FooterCol title="Platform" links={['Dashboard', 'Asset Explorer', 'Neural Models', 'API Gateway']} />
          <FooterCol title="Company" links={['Our Vision', 'Engineering', 'Case Studies', 'Contact']} />
          <FooterCol title="Legal" links={['Privacy Policy', 'Protocol Terms', 'SLA Agreement', 'Security']} />
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-white/20 uppercase tracking-widest">© 2024 FORGE SYSTEMS INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-8 text-[10px] text-white/40 font-mono uppercase">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Network Up
            </span>
            <span>Ver: 4.2.1-stable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6">{title}</h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link}>
          <a href="#" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
            {link}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40">↗</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:border-primary hover:text-primary transition-all">
    {icon}
  </a>
);
