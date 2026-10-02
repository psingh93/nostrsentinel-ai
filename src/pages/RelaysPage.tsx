import React, { useState, useEffect } from 'react';
import {
  Radio,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Wifi,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.tsx';
import { fetchRecentRelayEventsApi } from '../services/apiClient.ts';
import { NostrEvent } from '../types/nostr.ts';

interface RelaysPageProps {
  navigate: (path: string) => void;
}

export const RelaysPage: React.FC<RelaysPageProps> = ({ navigate }) => {
  const {
    relays,
    isRelaysLoading,
    refreshRelays,
    retryRelay,
    customRelays,
    setCustomRelays,
    nostrNetworkStatus,
  } = useSecurity();

  const [newRelayUrl, setNewRelayUrl] = useState<string>('');
  const [relayError, setRelayError] = useState<string | null>(null);
  const [retryingUrl, setRetryingUrl] = useState<string | null>(null);

  // Live ingress notes
  const [streamEvents, setStreamEvents] = useState<NostrEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const handleAddRelay = (e: React.FormEvent) => {
    e.preventDefault();
    setRelayError(null);
    let trimmed = newRelayUrl.trim();

    if (!trimmed) return;
    if (!trimmed.startsWith('wss://') && !trimmed.startsWith('ws://')) {
      trimmed = 'wss://' + trimmed;
    }

    if (customRelays.includes(trimmed)) {
      setRelayError('Relay is already configured in your active pool.');
      return;
    }

    const updated = [...customRelays, trimmed];
    setCustomRelays(updated);
    setNewRelayUrl('');
    refreshRelays();
  };

  const handleRemoveRelay = (urlToRemove: string) => {
    if (customRelays.length <= 1) {
      setRelayError('At least one relay must remain in the pool for decentralized verification.');
      return;
    }
    const updated = customRelays.filter(u => u !== urlToRemove);
    setCustomRelays(updated);
  };

  const handleSingleRetry = async (url: string) => {
    setRetryingUrl(url);
    try {
      await retryRelay(url);
    } finally {
      setRetryingUrl(null);
    }
  };

  const handleFetchStream = async () => {
    setIsStreaming(true);
    try {
      const events = await fetchRecentRelayEventsApi(10, customRelays);
      setStreamEvents(events);
    } catch (err: any) {
      console.error('Relay stream error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    handleFetchStream();
  }, []);

  const connectedCount = relays.filter(r => r.status === 'CONNECTED').length;
  const degradedCount = relays.filter(r => r.status === 'DEGRADED').length;
  const offlineCount = relays.filter(r => r.status === 'OFFLINE').length;
  const connectingCount = relays.filter(r => r.status === 'CONNECTING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 cyber-grid">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Nostr Relay Network Monitor
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
              Mesh Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Real-time WebSocket health, socket latency, and verified communication state for decentralized relays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshRelays()}
            disabled={isRelaysLoading}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRelaysLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Ping All Relays</span>
          </button>
        </div>
      </div>

      {/* NETWORK INTELLIGENCE OVERVIEW STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 uppercase text-[10px] block">CONFIGURED RELAYS</span>
          <span className="text-xl font-bold text-white mt-1 block">{customRelays.length}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Configured WebSocket endpoints</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 text-xs font-mono">
          <span className="text-emerald-400 uppercase text-[10px] block">CONNECTED RELAYS</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{connectedCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Handshake verified</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 text-xs font-mono">
          <span className="text-amber-400 uppercase text-[10px] block">DEGRADED RELAYS</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{degradedCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Latency {'>'} 1500ms</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 text-xs font-mono">
          <span className="text-rose-400 uppercase text-[10px] block">OFFLINE RELAYS</span>
          <span className="text-xl font-bold text-rose-400 mt-1 block">{offlineCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Connection refused or timeout</span>
        </div>
      </div>

      {/* Relays Status Board & Ingress Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Relay Pool Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Configured Relays ({connectedCount}/{relays.length} Connected)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actual WebSocket handshakes measuring broadcast availability and latency
                </p>
              </div>

              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  nostrNetworkStatus === 'Connected'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : nostrNetworkStatus === 'Degraded'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                }`}
              >
                {nostrNetworkStatus}
              </span>
            </div>

            {/* Relays List */}
            <div className="space-y-3">
              {relays.map((relay, idx) => {
                const isOnline = relay.status === 'CONNECTED';
                const isDegraded = relay.status === 'DEGRADED';
                const isConnecting = relay.status === 'CONNECTING' || retryingUrl === relay.url;
                const isOffline = relay.status === 'OFFLINE';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isOnline
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                              : isDegraded
                              ? 'bg-amber-400'
                              : isConnecting
                              ? 'bg-cyan-400 animate-pulse'
                              : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          }`}
                        />
                        <span className="text-slate-200 font-semibold truncate">
                          {relay.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            isOnline
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                              : isDegraded
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                              : isConnecting
                              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                              : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {relay.status}
                        </span>

                        {/* Latency if available */}
                        {relay.latencyMs !== undefined && (
                          <span className="text-slate-400 text-[11px]">
                            {relay.latencyMs} ms
                          </span>
                        )}

                        {/* Individual Retry button */}
                        <button
                          onClick={() => handleSingleRetry(relay.url)}
                          disabled={isConnecting}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                          title="Retry handshake with this relay"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {/* Remove button */}
                        <button
                          onClick={() => handleRemoveRelay(relay.url)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove relay from pool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Capabilities & Communication Status */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/60 gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500">Read:</span>
                          <span className={relay.read !== false && isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                            {relay.read !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500">Write:</span>
                          <span className={relay.write !== false && isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                            {relay.write !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                        <span className="text-slate-700">·</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <span className="text-slate-500">Checked:</span>
                          <span className="text-slate-300">
                            {relay.lastChecked ? new Date(relay.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                          </span>
                        </span>
                      </div>

                      {relay.error ? (
                        <span className="text-rose-400 font-mono text-[10px] truncate max-w-xs">
                          Error: {relay.error}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          Last OK: {relay.lastSuccessfulCommunication ? new Date(relay.lastSuccessfulCommunication).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified in session'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Relay */}
            <form onSubmit={handleAddRelay} className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Add Custom Nostr Relay
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRelayUrl}
                  onChange={e => setNewRelayUrl(e.target.value)}
                  placeholder="wss://relay.example.com"
                  className="flex-1 p-2.5 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Relay
                </button>
              </div>
              {relayError && (
                <p className="text-xs text-rose-400 font-mono flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {relayError}
                </p>
              )}
            </form>
          </div>

          {/* Decentralization & Relays Architecture info */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/20 to-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Decentralized Mesh Architecture
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Nostr events are broadcast across heterogeneous WebSocket relays without a centralized hosting bottleneck. NostrSentinel AI maintains parallel sockets to ensure threat evaluations reflect real consensus rather than isolated node anomalies.
            </p>
          </div>
        </div>

        {/* Right Column: Live Event Ingress Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white font-mono">
                  Live Relay Ingress Stream
                </h3>
              </div>
              <button
                onClick={handleFetchStream}
                disabled={isStreaming}
                className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isStreaming ? 'animate-spin' : ''}`} />
                Fetch Notes
              </button>
            </div>

            <p className="text-xs text-slate-400 font-sans">
              Recent text notes (Kind 1) subscribed directly from active relays. Click any event to run instant AI Sentinel analysis:
            </p>

            {isStreaming ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
                <p>Streaming events from Nostr relay pool...</p>
              </div>
            ) : streamEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No active events streamed yet. Click "Fetch Notes" to pull recent notes.
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {streamEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-800/60 transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="truncate max-w-[150px]">
                        Author: {evt.pubkey.slice(0, 10)}...
                      </span>
                      <span>{new Date(evt.created_at * 1000).toLocaleTimeString()}</span>
                    </div>

                    <p className="text-slate-300 font-mono text-xs line-clamp-3 bg-black/40 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                      {evt.content}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {evt.id.slice(0, 8)}...
                      </span>
                      <button
                        onClick={() => navigate('/analyze')}
                        className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/60 text-xs font-mono flex items-center gap-1 transition"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        Analyze Note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
