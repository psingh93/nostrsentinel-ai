import React, { useState } from 'react';
import {
  FileWarning,
  Search,
  Download,
  Trash2,
  Eye,
  Radio,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.tsx';
import { RiskBadge } from '../components/RiskBadge.tsx';
import { AnalyzedEventRecord, RiskLevel } from '../types/nostr.ts';
import { PublishAdvisoryModal } from '../components/PublishAdvisoryModal.tsx';

interface ThreatsPageProps {
  navigate: (path: string) => void;
}

export const ThreatsPage: React.FC<ThreatsPageProps> = ({ navigate }) => {
  const { records, clearRecords, seedDemoSamples } = useSecurity();
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'time_desc' | 'time_asc' | 'risk_desc' | 'risk_asc'>('time_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [advisoryRecord, setAdvisoryRecord] = useState<AnalyzedEventRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Derive unique categories from records
  const allCategories = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => r.result.categories.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = React.useMemo(() => {
    let result = records.filter(r => {
      if (filterLevel !== 'ALL' && r.result.riskLevel !== filterLevel) {
        return false;
      }
      if (selectedCategory !== 'ALL' && !r.result.categories.includes(selectedCategory)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = r.content.toLowerCase().includes(q);
        const categoryMatch = r.result.categories.some(c => c.toLowerCase().includes(q));
        const reasonMatch = r.result.explanation.toLowerCase().includes(q);
        const eventIdMatch = r.nostrEventId?.toLowerCase().includes(q);
        const authorMatch = r.authorPubkey?.toLowerCase().includes(q);
        return contentMatch || categoryMatch || reasonMatch || eventIdMatch || authorMatch;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'time_desc') return b.timestamp - a.timestamp;
      if (sortBy === 'time_asc') return a.timestamp - b.timestamp;
      if (sortBy === 'risk_desc') return b.result.riskScore - a.result.riskScore;
      if (sortBy === 'risk_asc') return a.result.riskScore - b.result.riskScore;
      return 0;
    });

    return result;
  }, [records, filterLevel, selectedCategory, searchQuery, sortBy]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nostrsentinel-threat-intel-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 cyber-grid">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Threat Intelligence Ledger
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              Session Database
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Historical index of evaluated Nostr notes, categorized threats, observable signals, and relay vectors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {records.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition"
                title="Export threat ledger as JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 border border-rose-900/60 hover:bg-rose-950/40 text-xs font-mono text-rose-300 flex items-center gap-1.5 transition"
                title="Clear current session records with confirmation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Ledger</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter, Search, and Sort Bar */}
      <div className="p-4 rounded-xl bg-[#0c101c]/90 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs font-mono">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search threats, pubkeys, event IDs..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Severity filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                filterLevel === lvl
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Category & Sort Controls */}
        <div className="flex items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              {allCategories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="time_desc">Time (Newest First)</option>
              <option value="time_asc">Time (Oldest First)</option>
              <option value="risk_desc">Risk (Highest First)</option>
              <option value="risk_asc">Risk (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* HONEST EMPTY STATE OR REAL THREAT LIST */}
      {records.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl bg-[#0c101c]/90 border border-slate-800 text-center space-y-4">
          <FileWarning className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-white font-sans">
              No threats detected in this session.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Analyze Nostr notes or suspicious content to populate this security intelligence ledger.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/analyze')}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-semibold font-mono transition"
            >
              Analyze a Nostr Event
            </button>
            <button
              onClick={seedDemoSamples}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono transition"
            >
              Load Benchmark Threat Data
            </button>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0c101c]/90 border border-slate-800 text-center text-xs text-slate-400 space-y-2 font-mono">
          <p>No recorded threats match the "{filterLevel}" filter or search query.</p>
          <button
            onClick={() => {
              setFilterLevel('ALL');
              setSearchQuery('');
            }}
            className="text-cyan-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRecords.map(record => {
            const isExpanded = expandedId === record.id;
            return (
              <div
                key={record.id}
                className="p-5 rounded-2xl bg-[#0c101c]/95 border border-slate-800 hover:border-slate-700 transition space-y-4"
              >
                {/* Header: Severity, Score, Category, Timestamp, Relay */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <RiskBadge
                      level={record.result.riskLevel}
                      score={record.result.riskScore}
                      size="sm"
                    />
                    <span className="text-sm font-semibold text-white font-mono">
                      {record.result.categories.join(' • ')}
                    </span>
                    {record.isDemo && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Benchmark Sample
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-cyan-400/80">
                      Relay: {record.relaySource ? record.relaySource.replace('wss://', '') : 'Manual'}
                    </span>
                  </div>
                </div>

                {/* Short Explanation */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Detection Explanation
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
                    {record.result.explanation}
                  </p>
                </div>

                {/* Action Recommendation */}
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono uppercase font-semibold">Recommended Action: </span>
                    {record.result.recommendedAction}
                  </div>
                </div>

                {/* EXPANDABLE DETAILS */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                        Raw Payload Content
                      </span>
                      <pre className="p-3 bg-black/60 rounded border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {record.content}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1.5">
                        Observable Security Signals ({record.result.signals.length})
                      </span>
                      <div className="space-y-1">
                        {record.result.signals.map((sig, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 flex items-start gap-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer details + Expand & Advisory Controls */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-500">
                    {record.nostrEventId && (
                      <button
                        onClick={() => handleCopy(record.nostrEventId!, record.id + '-id')}
                        className="hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedId === record.id + '-id' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Event: {record.nostrEventId.slice(0, 14)}...
                      </button>
                    )}
                    {record.authorPubkey && (
                      <span className="truncate max-w-[160px]">
                        Author: {record.authorPubkey.slice(0, 10)}...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(record.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 text-xs font-mono transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                          Hide Signals
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                          Expand Details
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setAdvisoryRecord(record)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 text-xs font-mono transition"
                    >
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Publish Advisory
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c101c] border border-slate-800 rounded-xl p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white font-sans">
                Clear Threat Intelligence Ledger?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to permanently erase all <span className="text-white font-bold">{records.length}</span> analyzed threat records from your current browser session? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearRecords();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold transition"
              >
                Confirm Clear
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
