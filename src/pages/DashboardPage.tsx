import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Zap,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  PieChart,
  Cpu,
  CheckCircle2,
  Database,
  Sliders,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.tsx';
import { RiskBadge } from '../components/RiskBadge.tsx';
import { AnalyzedEventRecord } from '../types/nostr.ts';
import { PublishAdvisoryModal } from '../components/PublishAdvisoryModal.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface DashboardPageProps {
  navigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const {
    stats,
    records,
    relays,
    isRelaysLoading,
    refreshRelays,
    retryRelay,
    aiEngineStatus,
    nostrNetworkStatus,
    securityMonitorStatus,
    seedDemoSamples,
  } = useSecurity();

  const { showToast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<AnalyzedEventRecord | null>(null);
  const [advisoryRecord, setAdvisoryRecord] = useState<AnalyzedEventRecord | null>(null);
  const [activityTab, setActivityTab] = useState<'timeline' | 'categories'>('timeline');

  // Filter high & critical threats for recent findings
  const recentThreats = records
    .filter(r => r.result.riskLevel === 'HIGH' || r.result.riskLevel === 'CRITICAL')
    .slice(0, 6);

  // Category breakdown for threat activity
  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      for (const cat of r.result.categories) {
        map[cat] = (map[cat] || 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [records]);

  // Risk percentages for visualization
  const critPct = stats.totalAnalyzed > 0 ? (stats.criticalRiskCount / stats.totalAnalyzed) * 100 : 0;
  const highPct = stats.totalAnalyzed > 0 ? (stats.highRiskCount / stats.totalAnalyzed) * 100 : 0;
  const medPct = stats.totalAnalyzed > 0 ? (stats.mediumRiskCount / stats.totalAnalyzed) * 100 : 0;
  const lowPct = stats.totalAnalyzed > 0 ? (stats.lowRiskCount / stats.totalAnalyzed) * 100 : 0;

  const handleSyncRelays = async () => {
    await refreshRelays();
    showToast('Nostr relay mesh synced and latency measured', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 cyber-grid selection:bg-cyan-500 selection:text-black">
      {/* Top SOC Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-xl sm:text-2xl tracking-tight font-sans">
              Nostrsentinel AI
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#0e1728] border border-cyan-500/40 text-cyan-300 font-semibold tracking-wider">
              SECURITY INTELLIGENCE CENTER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Autonomous threat detection, behavioral risk analysis, and decentralized protocol defense
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncRelays}
            disabled={isRelaysLoading}
            className="px-3.5 py-2 rounded-lg bg-[#0e131e] border border-slate-700/80 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-2 transition disabled:opacity-50"
            title="Ping configured Nostr relays"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRelaysLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Sync Relays</span>
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs font-semibold font-mono text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-2 transition"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Analyze a Threat</span>
          </button>
        </div>
      </div>

      {/* ACTUAL LIVE APPLICATION STATUS INDICATOR STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#090d16] border border-slate-800 text-xs font-mono">
        {/* 1. AI Engine */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d121c] border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[11px]">AI Engine</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                aiEngineStatus === 'Ready'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className={aiEngineStatus === 'Ready' ? 'text-emerald-300' : 'text-amber-300'}>
              {aiEngineStatus === 'Ready' ? 'READY' : 'CONFIGURATION REQUIRED'}
            </span>
          </div>
        </div>

        {/* 2. Nostr Network */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d121c] border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[11px]">Nostr Network</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                nostrNetworkStatus === 'Connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                  : nostrNetworkStatus === 'Degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span
              className={
                nostrNetworkStatus === 'Connected'
                  ? 'text-emerald-300'
                  : nostrNetworkStatus === 'Degraded'
                  ? 'text-amber-300'
                  : 'text-rose-400'
              }
            >
              {nostrNetworkStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 3. Security Monitor */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d121c] border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[11px]">Security Monitor</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                securityMonitorStatus === 'Active'
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                  : 'bg-slate-500'
              }`}
            />
            <span className={securityMonitorStatus === 'Active' ? 'text-cyan-300' : 'text-slate-400'}>
              {securityMonitorStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* SIX REQUIRED KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Analyzed */}
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Total Analyzed
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono">
            {stats.totalAnalyzed}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            {stats.totalAnalyzed > 0 ? 'Current Session' : 'No analyzed events yet'}
          </div>
        </div>

        {/* 2. Threats Detected */}
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 relative overflow-hidden">
          <div className="text-[11px] font-mono text-orange-400 uppercase tracking-wider">
            Threats Detected
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-400 mt-1 font-mono">
            {stats.threatsDetected}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
            {stats.totalAnalyzed > 0 ? `${stats.threatDetectionRate}% Threat Rate` : 'No analyzed events yet'}
          </div>
        </div>

        {/* 3. Critical Threats */}
        <div className="p-4 rounded-xl bg-[#1a0c10] border border-rose-900/40 relative overflow-hidden">
          <div className="text-[11px] font-mono text-rose-300 uppercase tracking-wider">
            Critical Threats
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 mt-1 font-mono">
            {stats.criticalRiskCount}
          </div>
          <div className="mt-1.5 text-[10px] text-rose-300/70 font-mono">
            {stats.totalAnalyzed > 0 ? 'Key Theft / Scams' : 'No analyzed events yet'}
          </div>
        </div>

        {/* 4. Average Risk Score */}
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 relative overflow-hidden">
          <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
            Average Risk Score
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-300 mt-1 font-mono">
            {stats.totalAnalyzed > 0 ? `${stats.averageRiskScore}` : '—'}
            {stats.totalAnalyzed > 0 && <span className="text-xs text-slate-500 ml-0.5">/100</span>}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
            {stats.totalAnalyzed > 0 ? 'Evaluated notes average' : 'No analyzed events yet'}
          </div>
        </div>

        {/* 5. Detection Rate */}
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Detection Rate
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono">
            {stats.totalAnalyzed > 0 ? `${stats.threatDetectionRate}%` : '—'}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
            {stats.totalAnalyzed > 0 ? 'High & Critical ratio' : 'No analyzed events yet'}
          </div>
        </div>

        {/* 6. Connected Relays */}
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/90 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Connected Relays
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono">
            {stats.relaysConnectedCount}
            <span className="text-xs text-slate-500 ml-0.5">/{stats.totalRelaysCount}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
            Active WebSocket mesh
          </div>
        </div>
      </div>

      {/* CONDITIONAL DISPLAY: HONEST EMPTY STATE OR REAL DATA GRIDS */}
      {records.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl bg-[#0a0e17] border border-slate-800/90 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#0f1728] border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Activity className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              No security events analyzed yet.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Analyze a Nostr note, URL, or raw JSON event to populate real-time SOC risk metrics and threat intelligence.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/analyze')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)] transition"
            >
              Analyze your first event
            </button>
            <button
              onClick={() => {
                seedDemoSamples();
                showToast('Loaded benchmark threat scenarios for demonstration', 'info');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0e1422] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 text-xs font-mono transition"
            >
              Load Benchmark Scenarios (Demo Data)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Row: Risk Distribution + Threat Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Distribution Chart (6 cols) */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-sans">Threat Risk Distribution</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {stats.totalAnalyzed} Analyzed Events
                </span>
              </div>

              {/* Horizontal Distribution Bar strictly from actual data */}
              <div className="space-y-2.5">
                <div className="h-4 w-full rounded-full overflow-hidden bg-slate-900 flex border border-slate-800">
                  {critPct > 0 && (
                    <div
                      style={{ width: `${critPct}%` }}
                      className="bg-rose-500 h-full transition-all duration-500"
                      title={`Critical: ${stats.criticalRiskCount} (${Math.round(critPct)}%)`}
                    />
                  )}
                  {highPct > 0 && (
                    <div
                      style={{ width: `${highPct}%` }}
                      className="bg-orange-500 h-full transition-all duration-500"
                      title={`High: ${stats.highRiskCount} (${Math.round(highPct)}%)`}
                    />
                  )}
                  {medPct > 0 && (
                    <div
                      style={{ width: `${medPct}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Medium: ${stats.mediumRiskCount} (${Math.round(medPct)}%)`}
                    />
                  )}
                  {lowPct > 0 && (
                    <div
                      style={{ width: `${lowPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Low: ${stats.lowRiskCount} (${Math.round(lowPct)}%)`}
                    />
                  )}
                </div>

                {/* Legend Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#1c0d12] border border-rose-900/30">
                    <span className="text-[10px] text-rose-300 block">CRITICAL</span>
                    <span className="font-bold text-rose-400">{stats.criticalRiskCount} ({Math.round(critPct)}%)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1f1109] border border-orange-900/30">
                    <span className="text-[10px] text-orange-300 block">HIGH</span>
                    <span className="font-bold text-orange-400">{stats.highRiskCount} ({Math.round(highPct)}%)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1d1709] border border-amber-900/30">
                    <span className="text-[10px] text-amber-300 block">MEDIUM</span>
                    <span className="font-bold text-amber-400">{stats.mediumRiskCount} ({Math.round(medPct)}%)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0b1812] border border-emerald-900/30">
                    <span className="text-[10px] text-emerald-300 block">LOW</span>
                    <span className="font-bold text-emerald-400">{stats.lowRiskCount} ({Math.round(lowPct)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat Intelligence Activity: Timeline & Category Tabs (6 cols) */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0a0e17] border border-slate-800/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white font-sans">
                    {activityTab === 'timeline' ? 'Threat Activity Timeline' : 'Threat Activity by Category'}
                  </h3>
                </div>
                <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setActivityTab('timeline')}
                    className={`px-2.5 py-1 rounded transition ${
                      activityTab === 'timeline'
                        ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setActivityTab('categories')}
                    className={`px-2.5 py-1 rounded transition ${
                      activityTab === 'categories'
                        ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Categories
                  </button>
                </div>
              </div>

              {activityTab === 'timeline' ? (
                /* Actual Timeline using real event timestamps */
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {records.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-4 text-center">No threat events analyzed in current session.</p>
                  ) : (
                    records.slice(0, 8).map(record => (
                      <div
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className="cursor-pointer p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs font-mono group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              record.result.riskLevel === 'CRITICAL'
                                ? 'bg-rose-500'
                                : record.result.riskLevel === 'HIGH'
                                ? 'bg-orange-500'
                                : record.result.riskLevel === 'MEDIUM'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-slate-400 text-[11px] shrink-0">
                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-slate-200 font-medium truncate group-hover:text-cyan-300 transition-colors">
                            {record.result.categories[0] || 'Content Evaluation'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              record.result.riskLevel === 'CRITICAL'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-900/50'
                                : record.result.riskLevel === 'HIGH'
                                ? 'bg-orange-950/70 text-orange-300 border border-orange-900/50'
                                : record.result.riskLevel === 'MEDIUM'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-900/50'
                                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-900/50'
                            }`}
                          >
                            {record.result.riskScore}/100
                          </span>
                          <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Category Breakdown */
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {categoryCounts.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-4 text-center">No categories identified yet.</p>
                  ) : (
                    categoryCounts.map(([cat, count], idx) => {
                      const pct = Math.round((count / stats.totalAnalyzed) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-300 truncate">{cat}</span>
                            <span className="text-slate-400 shrink-0">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-cyan-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid: Recent Security Findings + Connected Relays */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Security Findings (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-semibold text-white font-sans">Recent Security Findings</h3>
                </div>
                <button
                  onClick={() => navigate('/threats')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  <span>All Findings ({records.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentThreats.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0a0e17] border border-slate-800/90 text-center text-xs text-slate-400 font-mono">
                  No high or critical severity threats identified in current session. All analyzed notes are Low or Medium risk.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentThreats.map(record => (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800/80 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <RiskBadge
                            level={record.result.riskLevel}
                            score={record.result.riskScore}
                            size="sm"
                          />
                          <span className="text-xs font-semibold text-white font-mono">
                            {record.result.categories[0]}
                          </span>
                          {record.isDemo && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1c160b] text-amber-300 border border-amber-800/40">
                              DEMO DATA
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-mono bg-black/40 p-2.5 rounded border border-slate-800/80 line-clamp-2">
                        {record.content}
                      </p>

                      <div className="text-xs text-slate-400 flex items-start gap-1.5 font-sans">
                        <span className="font-mono text-amber-400 font-semibold shrink-0">Signal:</span>
                        <span className="truncate">{record.result.signals[0] || record.result.explanation}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                          {record.nostrEventId ? `ID: ${record.nostrEventId.slice(0, 12)}...` : 'Pasted Input'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="px-2.5 py-1 rounded bg-[#0e1422] hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/80 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" /> Inspect
                          </button>
                          <button
                            onClick={() => setAdvisoryRecord(record)}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono border border-cyan-800/60 flex items-center gap-1"
                          >
                            <Radio className="w-3 h-3 text-cyan-400" /> Publish Advisory
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Relays Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800/90 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white font-sans">Nostr Relays Status</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {stats.relaysConnectedCount}/{stats.totalRelaysCount} Connected
                  </span>
                </div>

                <div className="space-y-2">
                  {relays.map((relay, idx) => {
                    const isOnline = relay.status === 'CONNECTED';
                    const isDegraded = relay.status === 'DEGRADED';
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#0e1422] border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isOnline
                                ? 'bg-emerald-400'
                                : isDegraded
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-slate-300 truncate">
                            {relay.url.replace('wss://', '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] ${
                              isOnline
                                ? 'text-cyan-300'
                                : isDegraded
                                ? 'text-amber-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {relay.latencyMs !== undefined ? `${relay.latencyMs}ms` : 'offline'}
                          </span>
                          {!isOnline && (
                            <button
                              onClick={() => retryRelay(relay.url)}
                              className="text-slate-500 hover:text-cyan-400 p-0.5"
                              title="Retry connection"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/relays')}
                  className="w-full py-2 rounded-lg bg-[#0e1422] hover:bg-slate-800 text-xs font-mono text-cyan-400 border border-slate-700/80 transition flex items-center justify-center gap-1.5"
                >
                  <span>Relay Mesh Telemetry</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0c101c] border border-slate-800 rounded-xl p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RiskBadge
                  level={selectedRecord.result.riskLevel}
                  score={selectedRecord.result.riskScore}
                />
                <span className="text-xs font-mono text-slate-400">
                  Confidence: {selectedRecord.result.confidence}%
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase mb-1">Content Evaluated</div>
              <div className="p-3 bg-black/60 rounded border border-slate-800 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedRecord.content}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">
                Detection Reasoning (Explainable AI)
              </div>
              <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded border border-slate-800 leading-relaxed font-sans">
                {selectedRecord.result.explanation}
              </p>
            </div>

            <div>
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">Observable Signals</div>
              <ul className="space-y-1">
                {selectedRecord.result.signals.map((s, i) => (
                  <li key={i} className="text-xs text-amber-300 font-mono bg-amber-950/20 p-2 rounded border border-amber-900/40">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-500">
                Engine: {selectedRecord.result.engineUsed}
              </span>
              <button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  setAdvisoryRecord(rec);
                }}
                className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold font-mono"
              >
                Publish Advisory to Nostr
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Modal */}
      {advisoryRecord && (
        <PublishAdvisoryModal
          record={advisoryRecord}
          onClose={() => setAdvisoryRecord(null)}
        />
      )}
    </div>
  );
};
