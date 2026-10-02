import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  SearchCode,
  FileWarning,
  Radio,
  Sliders,
  Menu,
  X,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.tsx';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { relays, nostrNetworkStatus, aiEngineStatus, securityMonitorStatus, isDemoMode, setIsDemoMode } = useSecurity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/', icon: Shield },
    { label: 'Console', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Analyze', path: '/analyze', icon: SearchCode },
    { label: 'Threats', path: '/threats', icon: FileWarning },
    { label: 'Relays', path: '/relays', icon: Radio },
    { label: 'Settings', path: '/settings', icon: Sliders },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const connectedRelays = relays.filter(r => r.status === 'CONNECTED').length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-xl">
      {/* Demo Mode banner if active */}
      {isDemoMode && (
        <div className="bg-[#1f1709] border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">DEMO DATA MODE ACTIVE:</span>
            <span className="text-amber-200/80 hidden sm:inline">Operating in localized evaluation mode with benchmark scenarios</span>
          </div>
          <button
            onClick={() => setIsDemoMode(false)}
            className="text-amber-300 hover:text-white underline text-[11px] font-medium"
          >
            Exit Demo Mode
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#0e131f] border border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
            <Shield className="w-4.5 h-4.5 text-cyan-400" />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#07090e] ${
                nostrNetworkStatus === 'Connected'
                  ? 'bg-emerald-400'
                  : nostrNetworkStatus === 'Degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight font-sans">
                Nostrsentinel
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 rounded">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-mono hidden sm:block">
              Decentralized Threat Intelligence
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                  active
                    ? 'text-cyan-300 bg-[#0e1726] border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* System telemetry pills */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* AI Engine status */}
          <div
            onClick={() => handleNav('/settings')}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0f1a] border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-slate-700 transition"
            title={`AI Engine: ${aiEngineStatus}`}
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-500">AI:</span>
            <span className={aiEngineStatus === 'Ready' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {aiEngineStatus === 'Ready' ? 'READY' : 'CONFIG REQ'}
            </span>
          </div>

          {/* Nostr network status */}
          <div
            onClick={() => handleNav('/relays')}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0f1a] border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-cyan-500/40 transition"
            title={`Nostr Relay Mesh: ${connectedRelays}/${relays.length} Connected (${nostrNetworkStatus})`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                nostrNetworkStatus === 'Connected'
                  ? 'bg-emerald-400'
                  : nostrNetworkStatus === 'Degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-500">RELAYS:</span>
            <span className={nostrNetworkStatus === 'Connected' ? 'text-emerald-400' : nostrNetworkStatus === 'Degraded' ? 'text-amber-400' : 'text-rose-400'}>
              {connectedRelays}/{relays.length}
            </span>
          </div>

          {/* Quick CTA to analyze */}
          <button
            onClick={() => handleNav('/analyze')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-mono rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition ml-1"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Analyze Threat
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => handleNav('/analyze')}
            className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500 text-slate-950 font-semibold font-mono"
          >
            Scan
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#07090e] px-4 py-3 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono transition ${
                  active
                    ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
