import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Lock,
  Radio,
  Eye,
  ArrowRight,
  AlertTriangle,
  Cpu,
  Terminal,
  Activity,
  CheckCircle2,
  FileWarning,
  Sliders,
  Database,
  Search,
  ExternalLink,
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge.tsx';
import { SAMPLE_SECURITY_SCENARIOS } from '../services/apiClient.ts';
import { runHeuristicAnalysis } from '../server/gemini.ts';
import { useSecurity } from '../context/SecurityContext.tsx';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { nostrNetworkStatus, aiEngineStatus, securityMonitorStatus, relays, stats } = useSecurity();
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);

  const currentScenario = SAMPLE_SECURITY_SCENARIOS[activeScenarioIdx];
  const simulatedAnalysis = runHeuristicAnalysis(currentScenario.content, {
    author: currentScenario.author,
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] cyber-grid pb-20 selection:bg-cyan-500 selection:text-black">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 cyber-radial-glow pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        {/* Protocol Security Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a121e] border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>DECENTRALIZED PROTOCOL DEFENSE • NOSTRSENTINEL AI</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] font-sans">
          Nostrsentinel <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">AI</span>
        </h1>

        {/* Suggested Tagline */}
        <p className="mt-4 text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto font-medium tracking-tight">
          AI-Powered Threat Intelligence for the Decentralized Web
        </p>

        {/* Supporting text */}
        <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Analyze suspicious Nostr content, identify security signals, monitor relay health, and turn decentralized activity into explainable threat intelligence.
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2.5 transition group font-mono text-sm"
          >
            <span>Open Security Console</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-medium text-slate-200 bg-[#0d131f] hover:bg-[#131b2c] border border-slate-700/80 hover:border-slate-500 flex items-center justify-center gap-2 transition font-mono text-sm"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Analyze a Threat</span>
          </button>
        </div>

        {/* REAL APPLICATION SECURITY STATUS SECTION */}
        <div className="mt-12 max-w-3xl mx-auto p-4 rounded-2xl bg-[#0a0e17]/95 border border-slate-800 text-left shadow-2xl">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Live System Telemetry (Actual Application State)
            </span>
            <span className="text-[10px] text-slate-500">Zero Mock Data</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. NOSTR NETWORK */}
            <div className="p-3.5 rounded-xl bg-[#0f1422] border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">NOSTR NETWORK</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    nostrNetworkStatus === 'Connected'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                      : nostrNetworkStatus === 'Degraded'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`text-sm font-semibold font-mono uppercase ${
                    nostrNetworkStatus === 'Connected'
                      ? 'text-emerald-300'
                      : nostrNetworkStatus === 'Degraded'
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  {nostrNetworkStatus}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {relays.filter(r => r.status === 'CONNECTED').length}/{relays.length} active sockets
              </span>
            </div>

            {/* 2. AI ENGINE */}
            <div className="p-3.5 rounded-xl bg-[#0f1422] border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">AI ENGINE</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    aiEngineStatus === 'Ready'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                      : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`text-sm font-semibold font-mono uppercase ${
                    aiEngineStatus === 'Ready' ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {aiEngineStatus === 'Ready' ? 'READY' : 'CONFIG REQ'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {aiEngineStatus === 'Ready' ? 'Gemini 2.5 Flash' : 'Sentinel Heuristic Engine'}
              </span>
            </div>

            {/* 3. SECURITY MONITOR */}
            <div className="p-3.5 rounded-xl bg-[#0f1422] border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">SECURITY MONITOR</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    securityMonitorStatus === 'Active'
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                      : 'bg-slate-500'
                  }`}
                />
                <span
                  className={`text-sm font-semibold font-mono uppercase ${
                    securityMonitorStatus === 'Active' ? 'text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  {securityMonitorStatus}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {stats.totalAnalyzed} events indexed in session
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT VISUALIZATION: Threat Signal -> AI Analysis -> Risk Score -> Categories -> Action */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-slate-800 bg-[#0a0e17]/95 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                Product Architecture Demonstration
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                End-to-End Threat Reasoning Pipeline
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Select an actual Nostr threat vector to trace:
            </span>
          </div>

          {/* Scenario tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_SECURITY_SCENARIOS.slice(0, 4).map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => setActiveScenarioIdx(idx)}
                className={`p-3 rounded-xl text-left border transition text-xs font-mono ${
                  activeScenarioIdx === idx
                    ? 'border-cyan-500/70 bg-[#101726] text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'border-slate-800 bg-[#0d121c]/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold truncate">{scenario.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {scenario.category}
                </div>
              </button>
            ))}
          </div>

          {/* Pipeline breakdown card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input & Observable Signals */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 uppercase font-semibold">1. Ingress Threat Signal</span>
                  <span>Kind 1 Note</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-[10px] text-slate-500 truncate">
                    Author: {currentScenario.author}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-200 text-xs">
                    {currentScenario.content}
                  </p>
                </div>
              </div>

              {/* Extracted Observable signals */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  2. Extracted Security Signals
                </span>
                <ul className="space-y-1.5">
                  {simulatedAnalysis.signals.map((sig, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 flex items-start gap-2 bg-[#0e1422] p-2.5 rounded-lg border border-slate-800/80 font-mono"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: AI Analysis & Classification */}
            <div className="lg:col-span-6 space-y-4 rounded-xl bg-[#0d131f] border border-slate-800/90 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    3. Risk Assessment
                  </span>
                  <RiskBadge
                    level={simulatedAnalysis.riskLevel}
                    score={simulatedAnalysis.riskScore}
                    size="md"
                  />
                </div>
                <div className="text-right text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                  <span className="text-cyan-400 font-semibold">{simulatedAnalysis.confidence}%</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  4. Detection Categories
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {simulatedAnalysis.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141b2b] text-cyan-300 border border-cyan-800/40"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explainable AI Analysis */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  5. Explainable AI Analysis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-slate-800/80 font-sans">
                  {simulatedAnalysis.explanation}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-emerald-400 uppercase block mb-1 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  6. Recommended Action
                </span>
                <p className="text-xs text-emerald-200/90 font-sans leading-relaxed">
                  {simulatedAnalysis.recommendedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIVE CORE SECTIONS: Threat Detection, Explainable AI, Relay Intelligence, Risk Scoring, Security Ledger */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
            Autonomous Security Architecture
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Purpose-built security modules operating client-side and server-side to protect decentralized participants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Section 1: Threat Detection */}
          <div className="p-6 rounded-2xl bg-[#0a0e17]/90 border border-slate-800/90 hover:border-cyan-500/40 transition group space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-sans">Threat Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Identifies credential harvesting, typo-squatted domains, fake support desks, coercive urgency, and fraudulent Lightning invoices before user interaction.
            </p>
          </div>

          {/* Section 2: Explainable AI */}
          <div className="p-6 rounded-2xl bg-[#0a0e17]/90 border border-slate-800/90 hover:border-cyan-500/40 transition group space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-sans">Explainable AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Dissects observable threat evidence with nuance. Distinguishes observed signals, behavioral risk assessment, and clear mitigation advice without black-box scores.
            </p>
          </div>

          {/* Section 3: Relay Intelligence */}
          <div className="p-6 rounded-2xl bg-[#0a0e17]/90 border border-slate-800/90 hover:border-cyan-500/40 transition group space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-sans">Relay Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Measures real-time WebSocket connectivity, latency, and read/write capabilities across the decentralized relay mesh with zero simulated socket metrics.
            </p>
          </div>

          {/* Section 4: Risk Scoring */}
          <div className="p-6 rounded-2xl bg-[#0a0e17]/90 border border-slate-800/90 hover:border-cyan-500/40 transition group space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-sans">Risk Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Structured 0–100 scoring tier (Low, Medium, High, Critical) based on verifiable heuristic flags and Gemini 2.5 Flash semantic classification.
            </p>
          </div>

          {/* Section 5: Security Ledger */}
          <div className="p-6 rounded-2xl bg-[#0a0e17]/90 border border-slate-800/90 hover:border-cyan-500/40 transition group space-y-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white font-sans">Security Ledger & Decentralized Advisories</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Indexes threat intelligence locally in your browser session. Allows users to broadcast signed cryptographic security advisories back to Nostr relays (via NIP-07 or disposable scout keys) with zero exposure of personal private keys.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="rounded-2xl p-8 border border-cyan-500/30 bg-gradient-to-r from-[#0c1424] via-[#090d16] to-[#0d1828] text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Ready to Analyze Decentralized Content?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Input Nostr note IDs, paste raw JSON events, or inspect live feeds streaming directly from connected relays.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/analyze')}
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 font-mono text-xs transition"
            >
              Launch Threat Analyzer
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-300 bg-[#0e1422] hover:bg-slate-800 border border-slate-700 text-xs font-mono transition"
            >
              Open SOC Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
