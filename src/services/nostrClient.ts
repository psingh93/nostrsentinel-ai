import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { ThreatAnalysisResult, NostrEvent } from '../types/nostr.ts';

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
    };
  }
}

export function hasNip07Extension(): boolean {
  return typeof window !== 'undefined' && typeof window.nostr !== 'undefined' && typeof window.nostr.signEvent === 'function';
}

export interface SecurityAdvisoryDraft {
  content: string;
  tags: string[][];
  kind: number;
}

export function buildSecurityAdvisory(
  targetEvent: Partial<NostrEvent> | null,
  analysis: ThreatAnalysisResult
): SecurityAdvisoryDraft {
  const eventRef = targetEvent?.id ? `\nTarget Event: nostr:${targetEvent.id}` : '';
  const authorRef = targetEvent?.pubkey ? `\nFlagged Pubkey: nostr:${targetEvent.pubkey}` : '';

  const advisoryText = `🛡️ [NostrSentinel AI Security Advisory]
Risk Tier: ${analysis.riskLevel} (Score: ${analysis.riskScore}/100)
Categories: ${analysis.categories.join(', ')}
Signals: ${analysis.signals.slice(0, 3).join('; ')}
${eventRef}${authorRef}

Recommended Action: ${analysis.recommendedAction}
Explanation: ${analysis.explanation}

Automated Security Intelligence via NostrSentinel AI. Verify all links before interacting. #security #nostrsentinel`;

  const tags: string[][] = [
    ['t', 'security'],
    ['t', 'nostrsentinel'],
    ['t', 'advisory'],
    ['sentinel_risk', analysis.riskLevel],
    ['sentinel_score', String(analysis.riskScore)],
  ];

  if (targetEvent?.id) {
    tags.push(['e', targetEvent.id, '', 'mention']);
  }
  if (targetEvent?.pubkey) {
    tags.push(['p', targetEvent.pubkey]);
  }

  return {
    kind: 1, // Kind 1 Text Note readable by all Nostr clients
    content: advisoryText,
    tags,
  };
}

/**
 * Sign an advisory either using NIP-07 browser extension or client-side disposable ephemeral key
 */
export async function signAdvisorySafely(
  advisory: SecurityAdvisoryDraft,
  method: 'nip07' | 'ephemeral'
): Promise<any> {
  const created_at = Math.floor(Date.now() / 1000);

  if (method === 'nip07') {
    if (!hasNip07Extension()) {
      throw new Error('NIP-07 browser extension (e.g. Alby, nos2x) not found. Please install a Nostr extension or choose Ephemeral Scout Key.');
    }
    const pubkey = await window.nostr!.getPublicKey();
    const eventTemplate = {
      kind: advisory.kind,
      created_at,
      tags: advisory.tags,
      content: advisory.content,
      pubkey,
    };
    const signed = await window.nostr!.signEvent(eventTemplate);
    return signed;
  }

  // Ephemeral mode: Generate safe client-side single-use keypair
  // No user private key is requested or stored!
  const ephemeralSk = generateSecretKey();
  const ephemeralPk = getPublicKey(ephemeralSk);

  const eventTemplate = {
    kind: advisory.kind,
    created_at,
    tags: [
      ...advisory.tags,
      ['scout_type', 'ephemeral-sentinel-agent'],
    ],
    content: advisory.content,
    pubkey: ephemeralPk,
  };

  const signed = finalizeEvent(eventTemplate, ephemeralSk);
  return signed;
}
