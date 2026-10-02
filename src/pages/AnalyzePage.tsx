import React, { useState } from 'react';
import {
  SearchCode,
  Sparkles,
  Link,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Copy,
  Check,
  Shield,
  FileCode,
  RefreshCw,
  HelpCircle,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge.tsx';
import { RiskGauge } from '../components/RiskGauge.tsx';
import { ThreatAnalysisResult, NostrEvent, AnalyzedEventRecord } from '../types/nostr.ts';
import {
  analyzeContentApi,
  fetchNostrEventApi,
  fetchRecentRelayEventsApi,
  SAMPLE_SECURITY_SCENARIOS,
} from '../services/apiClient.ts';
import { useSecurity } from '../context/SecurityContext.tsx';
import { PublishAdvisoryModal } from '../components/PublishAdvisoryModal.tsx';

type AnalysisMode = 'paste_text' | 'paste_json' | 'event_id' | 'url' | 'relay_stream';

export const AnalyzePage: React.FC = () => {
  const { addRecord, customRelays, isDemoMode } = useSecurity();

  const [mode, setMode] = useState<AnalysisMode>('paste_text');

  // Input states
  const [textContent, setTextContent] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<string>('');
  const [parsedJsonInfo, setParsedJsonInfo] = useState<{ id?: string; pubkey?: string; kind?: number } | null>(null);
  const [eventIdInput, setEventIdInput] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [authorInput, setAuthorInput] = useState<string>('');

  // Live relay feed
  const [relayEvents, setRelayEvents] = useState<NostrEvent[]>([]);
  const [isFetchingRelayFeed, setIsFetchingRelayFeed] = useState<boolean>(false);

  // Analysis result state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ThreatAnalysisResult | null>(null);
  const [activeEventMeta, setActiveEventMeta] = useState<Partial<NostrEvent> | null>(null);
  const [lastAnalyzedPayload, setLastAnalyzedPayload] = useState<string>('');

  // Advisory modal state
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Auto-parse JSON when user changes jsonContent
  const handleJsonChange = (val: string) => {
    setJsonContent(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') {
        setParsedJsonInfo({
          id: parsed.id,
          pubkey: parsed.pubkey,
          kind: parsed.kind,
        });
      } else {
        setParsedJsonInfo(null);
      }
    } catch {
      setParsedJsonInfo(null);
    }
  };

  // Execute Analysis
  const executeAnalysis = async (
    textToAnalyze: string,
    meta?: { eventId?: string; author?: string; kind?: number; relaySource?: string }
  ) => {
    const trimmed = textToAnalyze.trim();
    if (!trimmed) {
      setErrorMessage('Content is empty. Please enter or paste text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setCurrentResult(null);

    try {
      const result = await analyzeContentApi(trimmed, {
        eventId: meta?.eventId,
        author: meta?.author,
        kind: meta?.kind,
      });

      setCurrentResult(result);
      setLastAnalyzedPayload(trimmed);
      setActiveEventMeta({
        id: meta?.eventId,
        pubkey: meta?.author,
        kind: meta?.kind,
        relaySource: meta?.relaySource,
      });

      // Record in session context
      const record: AnalyzedEventRecord = {
        id: `analysis-${Date.now()}`,
        nostrEventId: meta?.eventId,
        authorPubkey: meta?.author,
        content: trimmed,
        kind: meta?.kind ?? 1,
        timestamp: Date.now(),
        result,
        isDemo: isDemoMode,
        relaySource: meta?.relaySource || 'manual-input',
      };
      addRecord(record);
    } catch (err: any) {
      console.error('Analysis execution error:', err);
      setErrorMessage(err.message || 'Security threat evaluation failed. Please check network connectivity.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mode handlers
  const handleAnalyzeText = () => {
    // If text looks like a JSON Nostr event, intelligently extract it
    const trimmed = textContent.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.content) {
          executeAnalysis(parsed.content, {
            eventId: parsed.id,
            author: parsed.pubkey,
            kind: parsed.kind,
          });
          return;
        }
      } catch {}
    }
    executeAnalysis(textContent, { author: authorInput.trim() || undefined });
  };

  const handleAnalyzeJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.content && typeof parsed !== 'string') {
        throw new Error('Nostr JSON object must contain a "content" string field.');
      }
      const extractedContent = parsed.content || JSON.stringify(parsed);
      executeAnalysis(extractedContent, {
        eventId: parsed.id,
        author: parsed.pubkey,
        kind: parsed.kind,
      });
    } catch (e: any) {
      setErrorMessage(`Invalid Nostr JSON: ${e.message}`);
    }
  };

  const handleFetchEventById = async () => {
    if (!eventIdInput.trim()) {
      setErrorMessage('Please provide a Nostr event ID (note1..., nevent1..., or 64-hex ID).');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const { event, relaySource } = await fetchNostrEventApi(eventIdInput.trim(), customRelays);
      if (!event) {
        throw new Error('Event could not be retrieved from the active relay pool.');
      }

      setTextContent(event.content);
      setAuthorInput(event.pubkey);
      await executeAnalysis(event.content, {
        eventId: event.id,
        author: event.pubkey,
        kind: event.kind,
        relaySource,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve event from Nostr relays.');
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter a target URL or link to evaluate.');
      return;
    }
    const formatted = `Analyzing target URL: ${urlInput.trim()}`;
    executeAnalysis(formatted);
  };

  const handleFetchRelayStream = async () => {
    setIsFetchingRelayFeed(true);
    setErrorMessage(null);
    try {
      const events = await fetchRecentRelayEventsApi(8, customRelays);
      setRelayEvents(events);
    } catch (err: any) {
      setErrorMessage(`Failed to stream from relays: ${err.message || 'Relay timeout'}`);
    } finally {
      setIsFetchingRelayFeed(false);
    }
  };

  // Quick load attack benchmark
  const handleLoadBenchmark = (sc: typeof SAMPLE_SECURITY_SCENARIOS[0]) => {
    setTextContent(sc.content);
    setAuthorInput(sc.author);
    setMode('paste_text');
    executeAnalysis(sc.content, { author: sc.author });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 cyber-grid">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
            AI Event Security Analyzer
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            Autonomous Inspection
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Deep behavioral risk evaluation for phishing campaigns, lookalike domains, key harvesting, and malicious Lightning payment requests.
        </p>
      </div>

      {/* Preset Benchmarks for Rapid Evaluation */}
      <div className="p-4 rounded-xl bg-[#0c101c]/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Rapid Attack Vector Benchmarks
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Click to auto-populate and run detection
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SAMPLE_SECURITY_SCENARIOS.map((sc, i) => (
            <button
              key={i}
              onClick={() => handleLoadBenchmark(sc)}
              className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                {sc.title}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {sc.category}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Multi-Vector Input Interface (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setMode('paste_text')}
              className={`py-2 rounded-lg transition text-center truncate px-1 ${
                mode === 'paste_text'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Paste Nostr content"
            >
              Text
            </button>
            <button
              onClick={() => setMode('paste_json')}
              className={`py-2 rounded-lg transition text-center truncate px-1 ${
                mode === 'paste_json'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Paste Nostr event JSON"
            >
              Event JSON
            </button>
            <button
              onClick={() => setMode('event_id')}
              className={`py-2 rounded-lg transition text-center truncate px-1 ${
                mode === 'event_id'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Enter an event ID"
            >
              Event ID
            </button>
            <button
              onClick={() => setMode('url')}
              className={`py-2 rounded-lg transition text-center truncate px-1 ${
                mode === 'url'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Analyze suspicious URL"
            >
              URL
            </button>
            <button
              onClick={() => {
                setMode('relay_stream');
                if (relayEvents.length === 0) handleFetchRelayStream();
              }}
              className={`py-2 rounded-lg transition text-center truncate px-1 ${
                mode === 'relay_stream'
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fetch event from Nostr relay stream"
            >
              Relay Feed
            </button>
          </div>

          {/* Form Content by Mode */}
          <div className="p-5 rounded-2xl bg-[#0c101c]/90 border border-slate-800 space-y-4">
            {/* Mode 1: Paste Text */}
            {mode === 'paste_text' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Nostr Content / Message
                  </label>
                  <textarea
                    rows={6}
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="Paste note content, Lightning invoice (lnbc...), or message text to analyze..."
                    className="w-full p-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Author Pubkey (Optional)
                  </label>
                  <input
                    type="text"
                    value={authorInput}
                    onChange={e => setAuthorInput(e.target.value)}
                    placeholder="npub1... or 64-hex pubkey"
                    className="w-full p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzing || !textContent.trim()}
                  className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono transition shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating Threat Signals...
                    </>
                  ) : (
                    <>
                      <SearchCode className="w-4 h-4" />
                      Analyze Content Payload
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 2: Paste Nostr Event JSON */}
            {mode === 'paste_json' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-mono text-slate-300 uppercase">
                      Nostr Event JSON Payload
                    </label>
                    {parsedJsonInfo && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Valid Event (Kind {parsedJsonInfo.kind ?? '?'})
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={7}
                    value={jsonContent}
                    onChange={e => handleJsonChange(e.target.value)}
                    placeholder='{"id": "...", "pubkey": "...", "kind": 1, "content": "..."}'
                    className="w-full p-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition resize-y"
                  />
                </div>

                {parsedJsonInfo && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    {parsedJsonInfo.id && <div className="truncate">ID: {parsedJsonInfo.id}</div>}
                    {parsedJsonInfo.pubkey && <div className="truncate">Pubkey: {parsedJsonInfo.pubkey}</div>}
                  </div>
                )}

                <button
                  onClick={handleAnalyzeJson}
                  disabled={isAnalyzing || !jsonContent.trim()}
                  className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono transition shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Decomposing Event Structure...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4" />
                      Decompose & Analyze Event JSON
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 3: Fetch by Event ID */}
            {mode === 'event_id' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Nostr Event Identifier
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Queries live relays for note1..., nevent1..., or 64-character hexadecimal event ID.
                  </p>
                  <input
                    type="text"
                    value={eventIdInput}
                    onChange={e => setEventIdInput(e.target.value)}
                    placeholder="note1... or 64-hex event ID"
                    className="w-full p-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-500">
                  Target Pool: {customRelays.slice(0, 3).join(', ')}...
                </div>

                <button
                  onClick={handleFetchEventById}
                  disabled={isAnalyzing || !eventIdInput.trim()}
                  className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono transition shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Querying Relays & Evaluating...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Fetch from Relays & Analyze
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 4: Analyze URL */}
            {mode === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Suspicious Link or Web URL
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://damus-verify.online/login"
                    className="w-full p-3 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleAnalyzeUrl}
                  disabled={isAnalyzing || !urlInput.trim()}
                  className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono transition shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating Link Heuristics...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Analyze URL Security Profile
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 5: Live Relay Stream Ingress */}
            {mode === 'relay_stream' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 uppercase">
                    Live Ingress Stream (Kind 1)
                  </span>
                  <button
                    onClick={handleFetchRelayStream}
                    disabled={isFetchingRelayFeed}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRelayFeed ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {isFetchingRelayFeed ? (
                  <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
                    <p>Subscribing to live relay pool...</p>
                  </div>
                ) : relayEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 space-y-2 font-mono">
                    <p>No active notes streamed yet.</p>
                    <button
                      onClick={handleFetchRelayStream}
                      className="px-3 py-1.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs"
                    >
                      Connect & Pull Live Notes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {relayEvents.map(evt => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-black/40 border border-slate-800 hover:border-cyan-800 transition text-xs space-y-1.5"
                      >
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          ID: {evt.id.slice(0, 14)}...
                        </div>
                        <p className="line-clamp-2 text-slate-300 font-mono text-[11px]">
                          {evt.content}
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() =>
                              executeAnalysis(evt.content, {
                                eventId: evt.id,
                                author: evt.pubkey,
                                kind: evt.kind,
                                relaySource: evt.relaySource,
                              })
                            }
                            className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/60 font-mono text-[10px]"
                          >
                            Analyze Note
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Message with Retry */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-[11px] underline text-rose-300 hover:text-white shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complete Security Analysis Output (7 cols) */}
        <div className="lg:col-span-7">
          {isAnalyzing ? (
            /* Skeleton Loading State */
            <div className="h-full min-h-[460px] rounded-2xl bg-[#0c101c]/90 border border-slate-800 p-6 space-y-6 animate-pulse">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="h-8 w-40 bg-slate-800 rounded-lg" />
                <div className="h-6 w-24 bg-slate-800 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-8 w-full bg-slate-900 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-800 rounded" />
                <div className="h-16 w-full bg-slate-900 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-36 bg-slate-800 rounded" />
                <div className="h-12 w-full bg-slate-900 rounded-lg" />
              </div>
              <div className="flex items-center justify-center pt-8">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autonomous Threat Reasoner evaluating payload...</span>
                </div>
              </div>
            </div>
          ) : !currentResult ? (
            /* Idle State */
            <div className="h-full min-h-[460px] rounded-2xl bg-[#0c101c]/50 border border-slate-800/80 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <SearchCode className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">
                Threat Intelligence Analyzer Ready
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Submit a Nostr event payload or click any preset benchmark to view real-time risk scoring, explainable threat signals, and mitigation advice.
              </p>
            </div>
          ) : (
            /* COMPREHENSIVE EIGHT-SECTION REPORT REQUIRED BY SECTION 6 & 7 */
            <div className="rounded-2xl bg-[#0c101c]/95 border border-cyan-900/50 p-6 space-y-6 shadow-2xl">
              {/* 6-Step Visual Intelligence Flow */}
              <div className="flex items-center justify-between overflow-x-auto pb-2 text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span className="text-cyan-400 font-semibold shrink-0">1. INPUT</span>
                <span className="text-slate-600 px-1">→</span>
                <span className="text-cyan-400 font-semibold shrink-0">2. SIGNAL EXTRACTION</span>
                <span className="text-slate-600 px-1">→</span>
                <span className="text-cyan-400 font-semibold shrink-0">3. THREAT ANALYSIS</span>
                <span className="text-slate-600 px-1">→</span>
                <span className="text-cyan-400 font-semibold shrink-0">4. RISK SCORING</span>
                <span className="text-slate-600 px-1">→</span>
                <span className="text-cyan-400 font-semibold shrink-0">5. EXPLANATION</span>
                <span className="text-slate-600 px-1">→</span>
                <span className="text-emerald-400 font-semibold shrink-0">6. RECOMMENDED ACTION</span>
              </div>

              {/* 1. Header with Professional RiskGauge and Threat Tier */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-4 border-b border-slate-800">
                <div className="md:col-span-6 flex justify-center">
                  <RiskGauge
                    score={currentResult.riskScore}
                    level={currentResult.riskLevel}
                    confidence={currentResult.confidence}
                    engineUsed={currentResult.engineUsed}
                  />
                </div>

                <div className="md:col-span-6 space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                      Threat Classification
                    </span>
                    <RiskBadge
                      level={currentResult.riskLevel}
                      score={currentResult.riskScore}
                      size="lg"
                    />
                  </div>

                  <div className="space-y-1 text-xs font-mono text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">RISK SCORE:</span>
                      <span className="text-white font-bold">{currentResult.riskScore} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">AI CONFIDENCE:</span>
                      <span className="text-cyan-400 font-bold">{currentResult.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ENGINE:</span>
                      <span className="text-slate-300">
                        {currentResult.engineUsed === 'gemini-ai' ? 'Gemini 2.5 Flash' : 'Sentinel Heuristics'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. THREAT CATEGORIES */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Threat Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentResult.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-950/80 text-cyan-200 border border-cyan-500/30"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. WHY THIS WAS FLAGGED (Explainable AI) */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Why was this flagged?
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {currentResult.explanation}
                </p>
              </div>

              {/* 4. SECURITY SIGNALS */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Observable Security Signals
                </span>
                <div className="space-y-2">
                  {currentResult.signals.map((signal, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-slate-200 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. RECOMMENDED ACTION */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recommended Action
                </div>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  {currentResult.recommendedAction}
                </p>
              </div>

              {/* 6. EVENT / RELAY INFORMATION */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Event & Relay Metadata
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                  <div className="truncate">
                    <span className="text-slate-500">Event ID: </span>
                    <span className="text-slate-300">{activeEventMeta?.id || 'Raw Input (Unpublished)'}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Author: </span>
                    <span className="text-slate-300">{activeEventMeta?.pubkey || 'Unspecified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Kind: </span>
                    <span className="text-slate-300">{activeEventMeta?.kind ?? 1} (Text Note)</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Relay Vector: </span>
                    <span className="text-slate-300">{activeEventMeta?.relaySource || 'Manual Payload'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Engine: </span>
                    <span className="text-cyan-300 font-semibold">{currentResult.engineUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Analyzed: </span>
                    <span className="text-slate-300">{new Date(currentResult.analyzedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* 7. Analyzed Content Payload with Copy */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Evaluated Payload Body
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lastAnalyzedPayload);
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPayload ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {lastAnalyzedPayload}
                </pre>
              </div>

              {/* 8. Action: Broadcast Security Advisory */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition"
                >
                  <Radio className="w-4 h-4" />
                  Publish Security Advisory to Nostr
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advisory Broadcast Modal */}
      {showPublishModal && currentResult && (
        <PublishAdvisoryModal
          record={{
            id: `temp-${Date.now()}`,
            nostrEventId: activeEventMeta?.id,
            authorPubkey: activeEventMeta?.pubkey,
            content: lastAnalyzedPayload,
            timestamp: Date.now(),
            result: currentResult,
          }}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
};
