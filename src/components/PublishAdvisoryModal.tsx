import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  KeyRound,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { AnalyzedEventRecord } from '../types/nostr.ts';
import {
  hasNip07Extension,
  buildSecurityAdvisory,
  signAdvisorySafely,
  SecurityAdvisoryDraft,
} from '../services/nostrClient.ts';
import { publishSecurityAdvisoryApi } from '../services/apiClient.ts';
import { useSecurity } from '../context/SecurityContext.tsx';
import { RiskBadge } from './RiskBadge.tsx';

interface PublishAdvisoryModalProps {
  record: AnalyzedEventRecord;
  onClose: () => void;
}

export const PublishAdvisoryModal: React.FC<PublishAdvisoryModalProps> = ({ record, onClose }) => {
  const { customRelays } = useSecurity();
  const [advisoryDraft, setAdvisoryDraft] = useState<SecurityAdvisoryDraft | null>(null);
  const [signingMethod, setSigningMethod] = useState<'nip07' | 'ephemeral'>('ephemeral');
  const [isNip07Available, setIsNip07Available] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    results: { relay: string; status: 'ok' | 'failed'; reason?: string }[];
    eventId?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const draft = buildSecurityAdvisory(
      {
        id: record.nostrEventId,
        pubkey: record.authorPubkey,
      },
      record.result
    );
    setAdvisoryDraft(draft);

    const available = hasNip07Extension();
    setIsNip07Available(available);
    if (available) {
      setSigningMethod('nip07');
    } else {
      setSigningMethod('ephemeral');
    }
  }, [record]);

  const handlePublish = async () => {
    if (!advisoryDraft) return;
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      // 1. Sign locally in client browser (zero private key exposure to server)
      const signedEvent = await signAdvisorySafely(advisoryDraft, signingMethod);

      // 2. Broadcast signed event to target relays
      const response = await publishSecurityAdvisoryApi(signedEvent, customRelays);
      setPublishResult(response);
    } catch (err: any) {
      console.error('Publish advisory error:', err);
      setErrorMessage(err.message || 'Failed to sign or broadcast security advisory.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyDraft = () => {
    if (advisoryDraft) {
      navigator.clipboard.writeText(advisoryDraft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c101c] border border-cyan-900/60 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-wide text-sm sm:text-base">
                Publish security advisory to Nostr?
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Decentralized threat intelligence dissemination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Explicit Confirmation Summary */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-mono text-slate-400 uppercase">Threat Classification</span>
              <RiskBadge level={record.result.riskLevel} score={record.result.riskScore} size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">THREAT CATEGORY</span>
                <span className="text-slate-200 font-semibold">{record.result.categories.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">SOURCE / EVENT REFERENCE</span>
                <span className="text-cyan-300 truncate block">
                  {record.nostrEventId ? `nostr:${record.nostrEventId.slice(0, 16)}...` : 'Unpublished Content Reference'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-mono mb-1">EXPLANATION</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-black/40 p-2.5 rounded border border-slate-800">
                {record.result.explanation}
              </p>
            </div>
          </div>

          {/* Advisory Note Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Broadcast Payload (Kind 1 Note)
              </span>
              <button
                onClick={handleCopyDraft}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 font-mono transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <pre className="p-3 bg-black/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto select-all">
              {advisoryDraft?.content}
            </pre>
          </div>

          {/* Safe Signing Architecture */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
              Cryptographic Signing Architecture
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: NIP-07 Extension */}
              <button
                type="button"
                onClick={() => setSigningMethod('nip07')}
                disabled={!isNip07Available}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  signingMethod === 'nip07'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : isNip07Available
                    ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    : 'border-slate-800/40 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs flex items-center gap-1.5 font-mono">
                    <KeyRound className="w-3.5 h-3.5" />
                    NIP-07 Browser Extension
                  </span>
                  {isNip07Available ? (
                    <span className="text-[10px] text-emerald-400 font-mono">Available</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Not Found</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Sign with your personal extension (Alby, nos2x). Your private key never leaves the extension.
                </p>
              </button>

              {/* Option B: Ephemeral Scout Key */}
              <button
                type="button"
                onClick={() => setSigningMethod('ephemeral')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  signingMethod === 'ephemeral'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Ephemeral Sentinel Scout Key
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Zero Exposure</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Generates an in-browser disposable Nostr keypair. Completely eliminates personal key exposure.
                </p>
              </button>
            </div>

            {/* Zero Key Storage Guarantee */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Zero-Knowledge Key Policy: </strong>
                NostrSentinel AI never requests, stores, or logs raw private keys. All cryptographic operations occur strictly inside your local browser runtime.
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Publication Results Breakdown */}
          {publishResult && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  Broadcast Confirmed
                </span>
                {publishResult.eventId && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {publishResult.eventId.slice(0, 14)}...
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {publishResult.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-300">{r.relay}</span>
                    <span className={r.status === 'ok' ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                      {r.status === 'ok' ? '✓ Accepted by Relay' : `✗ Failed (${r.reason || 'Offline'})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-500 font-mono">
            Relay Target Pool: {customRelays.length} Relays
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !advisoryDraft}
              className="px-5 py-2 text-xs font-semibold font-mono rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  Broadcasting Advisory...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Confirm & Broadcast to Nostr
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
