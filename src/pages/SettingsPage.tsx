import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  KeyRound,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Lock,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.tsx';
import { checkServerHealthApi } from '../services/apiClient.ts';

const DEFAULT_POOL = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://relay.snort.social',
  'wss://offchain.pub',
];

export const SettingsPage: React.FC = () => {
  const {
    customRelays,
    setCustomRelays,
    isDemoMode,
    setIsDemoMode,
    clearRecords,
    refreshRelays,
    geminiConfigured,
    aiEngineStatus,
  } = useSecurity();

  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    geminiConfigured: boolean;
    defaultRelays: string[];
  } | null>(null);

  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Analysis preferences (stored in localStorage)
  const [deepUrlScan, setDeepUrlScan] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('sentinel_pref_deep_url');
      return v !== null ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });

  const [autoParseJson, setAutoParseJson] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('sentinel_pref_auto_json');
      return v !== null ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await checkServerHealthApi();
      setHealthStatus(data);
    } catch {
      setHealthStatus({
        status: 'offline',
        geminiConfigured: false,
        defaultRelays: DEFAULT_POOL,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleToggleDeepUrl = (val: boolean) => {
    setDeepUrlScan(val);
    try { localStorage.setItem('sentinel_pref_deep_url', JSON.stringify(val)); } catch {}
  };

  const handleToggleAutoJson = (val: boolean) => {
    setAutoParseJson(val);
    try { localStorage.setItem('sentinel_pref_auto_json', JSON.stringify(val)); } catch {}
  };

  const handleResetRelays = () => {
    setCustomRelays(DEFAULT_POOL);
    refreshRelays();
    setSaveFeedback('Relay network pool reset to default public relays.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 cyber-grid">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
            Sentinel Configuration & Settings
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            System Control
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Verify backend AI connectivity, inspect relay pool capacity, and configure autonomous evaluation policies.
        </p>
      </div>

      {saveFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 1. REQUIRED SYSTEM CONFIGURATION STATUS (SECTION 11) */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">System Telemetry & Engine Status</h3>
              <p className="text-xs text-slate-400">
                Server-side configuration and active security adapters
              </p>
            </div>
          </div>
          <button
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Check Health
          </button>
        </div>

        {/* Status Display: Gemini API Configured / Not Configured, Nostr Relays X configured */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[11px] block">GEMINI API</span>
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  geminiConfigured ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-amber-400'
                }`}
              />
              <span className={geminiConfigured ? 'text-emerald-300 text-sm' : 'text-amber-300 text-sm'}>
                {geminiConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans mt-1">
              {geminiConfigured
                ? 'Gemini 2.5 Flash active on backend proxy. Key is strictly isolated.'
                : 'Using built-in Sentinel Heuristic Engine fallback.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="text-slate-500 text-[11px] block">NOSTR RELAYS</span>
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-white text-sm">
                {customRelays.length} configured
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans mt-1">
              Active WebSocket mesh targets for querying and advisory publication.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          The Gemini API key is managed securely on the backend via <code className="text-cyan-300 font-mono">GEMINI_API_KEY</code> environment variable and is never sent to the client browser or exposed in client logs.
        </p>
      </div>

      {/* 2. ANALYSIS PREFERENCES */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Analysis Preferences</h3>
            <p className="text-xs text-slate-400 font-sans">
              Behavioral scanning sensitivity and input parsing rules
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Deep URL & Domain Inspection</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Evaluates URL shorteners, punycode lookalike domains, and high-risk generic TLDs.
              </p>
            </div>
            <button
              onClick={() => handleToggleDeepUrl(!deepUrlScan)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                deepUrlScan ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  deepUrlScan ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Intelligent Nostr JSON Auto-Parsing</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically extracts metadata (kind, author, tags) when raw JSON is detected.
              </p>
            </div>
            <button
              onClick={() => handleToggleAutoJson(!autoParseJson)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                autoParseJson ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  autoParseJson ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRIVACY & KEY POLICY */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <Lock className="w-5 h-5" />
          <h3 className="text-sm font-semibold text-white">Privacy & Zero-Knowledge Key Model</h3>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 space-y-2 font-sans">
          <p>
            • <strong>No Private Key Collection:</strong> NostrSentinel AI never accepts, requests, or stores user secret keys (<code className="font-mono text-emerald-300">nsec</code>) on any server or database.
          </p>
          <p>
            • <strong>Client-Side Signing Isolation:</strong> Security advisories are cryptographically finalized inside your browser runtime using standard NIP-07 web extensions (Alby, nos2x) or single-use ephemeral scout keypairs.
          </p>
          <p>
            • <strong>Minimal Data Transmission:</strong> Only evaluated note content and public event IDs are processed for threat identification.
          </p>
        </div>
      </div>

      {/* 4. APPLICATION & PROTOCOL SPECIFICATIONS */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Application Specifications</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">VERSION</span>
            <span>1.0.0 (Release)</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">AI REASONING</span>
            <span>Gemini 2.5 Flash</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">PROTOCOL SPECS</span>
            <span>NIP-01, 07, 19</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">ENCRYPTION</span>
            <span>Local secp256k1</span>
          </div>
        </div>
      </div>

      {/* 5. DEMO MODE & EVALUATION BENCHMARKS (SECTION 13 & 14) */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Hackathon Demo Mode</h3>
              <p className="text-xs text-slate-400">
                Operate with local benchmark scenarios for rapid evaluation and presentation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isDemoMode ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                isDemoMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 font-mono space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-semibold">
              {isDemoMode ? 'DEMO MODE ACTIVE' : 'DEMO MODE INACTIVE (LIVE PRODUCTION)'}
            </span>
          </div>
          <p className="text-[11px] text-amber-300/80 font-sans">
            In Demo Mode, analyzed benchmark records are clearly flagged with an explicit <code className="text-amber-200 font-mono px-1 py-0.5 rounded bg-black/40">DEMO DATA</code> badge, ensuring judges and analysts can easily distinguish real relay traffic from pre-seeded threat examples.
          </p>
        </div>
      </div>

      {/* 6. STORAGE & SESSION CONTROLS */}
      <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Session Storage & Maintenance</h3>
            <p className="text-xs text-slate-400">
              Clear threat intelligence cache or reset relay mesh configuration
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetRelays}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-slate-700 flex items-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Relays to Default 6 Relays</span>
          </button>

          <button
            onClick={() => {
              clearRecords();
              setSaveFeedback('Session threat intelligence ledger cleared.');
              setTimeout(() => setSaveFeedback(null), 3000);
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-xs font-mono text-rose-300 border border-rose-900/60 flex items-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Session Intelligence Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
