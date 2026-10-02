import { SimplePool, nip19, verifyEvent } from 'nostr-tools';
import { NostrEvent, RelayStatus } from '../types/nostr.ts';

export const DEFAULT_RELAYS: string[] = (
  process.env.NOSTR_RELAYS
    ? process.env.NOSTR_RELAYS.split(',').map(r => r.trim()).filter(Boolean)
    : [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.primal.net',
        'wss://nostr.mom',
        'wss://relay.snort.social',
        'wss://offchain.pub',
      ]
);

let poolInstance: SimplePool | null = null;

export function getSimplePool(): SimplePool {
  if (!poolInstance) {
    poolInstance = new SimplePool();
  }
  return poolInstance;
}

/**
 * Decode note1..., nevent1..., nprofile1..., or plain 64-char hex string to hex event ID
 */
export function parseEventIdentifier(input: string): { eventId?: string; authorPubkey?: string; relays?: string[] } {
  const trimmed = input.trim();

  // If already 64-char hex
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return { eventId: trimmed.toLowerCase() };
  }

  // Handle nostr:note1... or nostr:nevent1...
  const cleanInput = trimmed.replace(/^nostr:/i, '');

  try {
    const decoded = nip19.decode(cleanInput);
    if (decoded.type === 'note') {
      return { eventId: decoded.data };
    }
    if (decoded.type === 'nevent') {
      return {
        eventId: decoded.data.id,
        authorPubkey: decoded.data.author,
        relays: decoded.data.relays,
      };
    }
    if (decoded.type === 'npub') {
      return { authorPubkey: decoded.data };
    }
  } catch (e) {
    // Not a valid bech32 nip19 identifier
  }

  return {};
}

/**
 * Ping a relay via WebSocket to measure round-trip latency and connectivity
 */
export async function testRelayLatency(relayUrl: string, timeoutMs = 4000): Promise<RelayStatus> {
  const start = Date.now();
  return new Promise<RelayStatus>((resolve) => {
    let resolved = false;

    try {
      // In Node.js 22+ or modern environments, WebSocket is globally available
      const ws = new WebSocket(relayUrl);

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { ws.close(); } catch {}
          resolve({
            url: relayUrl,
            status: 'OFFLINE',
            latencyMs: undefined,
            read: true,
            write: true,
            error: 'Connection handshake timed out',
            lastChecked: new Date().toISOString(),
          });
        }
      }, timeoutMs);

      ws.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const latency = Date.now() - start;
          try { ws.close(); } catch {}
          const status = latency > 1500 ? 'DEGRADED' : 'CONNECTED';
          const nowIso = new Date().toISOString();
          resolve({
            url: relayUrl,
            status,
            latencyMs: latency,
            read: true,
            write: true,
            lastChecked: nowIso,
            lastSuccessfulCommunication: nowIso,
          });
        }
      };

      ws.onerror = (err: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve({
            url: relayUrl,
            status: 'OFFLINE',
            error: err?.message || 'WebSocket connection refused',
            read: false,
            write: false,
            lastChecked: new Date().toISOString(),
          });
        }
      };
    } catch (err: any) {
      resolve({
        url: relayUrl,
        status: 'OFFLINE',
        error: err?.message || 'Failed to initialize WebSocket client',
        read: false,
        write: false,
        lastChecked: new Date().toISOString(),
      });
    }
  });
}

/**
 * Fetch a Nostr event by ID across relays
 */
export async function fetchEventById(
  identifier: string,
  customRelays?: string[],
  timeoutMs = 6000
): Promise<{ event: NostrEvent | null; relaySource?: string; error?: string }> {
  const { eventId, relays: hintedRelays } = parseEventIdentifier(identifier);

  if (!eventId) {
    return {
      event: null,
      error: 'Invalid Nostr event identifier. Expected note1..., nevent1..., or a 64-character hexadecimal event ID.',
    };
  }

  const relayTargets = Array.from(
    new Set([...(customRelays || []), ...(hintedRelays || []), ...DEFAULT_RELAYS])
  ).filter(url => url.startsWith('wss://') || url.startsWith('ws://'));

  const pool = getSimplePool();

  try {
    const eventPromise = pool.get(relayTargets, { ids: [eventId] });
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Relay query timed out')), timeoutMs)
    );

    const rawEvent = (await Promise.race([eventPromise, timeoutPromise])) as any;

    if (!rawEvent) {
      return {
        event: null,
        error: `Event ${eventId.slice(0, 8)}... not found on relays (${relayTargets.slice(0, 3).join(', ')}). The event might not have propagated or could be on private relays.`,
      };
    }

    // Verify cryptographic signature if available
    let isValidSig = true;
    try {
      isValidSig = verifyEvent(rawEvent);
    } catch {}

    const event: NostrEvent = {
      id: rawEvent.id,
      pubkey: rawEvent.pubkey,
      created_at: rawEvent.created_at,
      kind: rawEvent.kind,
      tags: rawEvent.tags || [],
      content: rawEvent.content || '',
      sig: rawEvent.sig,
      relaySource: relayTargets[0],
    };

    return { event, relaySource: relayTargets[0] };
  } catch (err: any) {
    return {
      event: null,
      error: err?.message || 'Error querying relays for event',
    };
  }
}

/**
 * Fetch recent events (kind 1 text notes) from relays for live feed and threat scanning
 */
export async function fetchRecentRelayEvents(
  limit = 15,
  customRelays?: string[]
): Promise<NostrEvent[]> {
  const targetRelays = (customRelays && customRelays.length > 0 ? customRelays : DEFAULT_RELAYS).slice(0, 3);
  const events: NostrEvent[] = [];
  const seenIds = new Set<string>();

  const queryRelay = (relayUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      let isDone = false;
      try {
        const ws = new WebSocket(relayUrl);
        const subId = 'feed_' + Math.random().toString(36).slice(2, 7);

        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try { ws.close(); } catch {}
            resolve();
          }
        }, 3000);

        ws.onopen = () => {
          try {
            ws.send(JSON.stringify(['REQ', subId, { kinds: [1], limit }]));
          } catch {
            if (!isDone) { isDone = true; resolve(); }
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            if (data[0] === 'EVENT' && data[2]) {
              const raw = data[2];
              if (!seenIds.has(raw.id)) {
                seenIds.add(raw.id);
                events.push({
                  id: raw.id,
                  pubkey: raw.pubkey,
                  created_at: raw.created_at,
                  kind: raw.kind,
                  tags: raw.tags || [],
                  content: raw.content || '',
                  sig: raw.sig,
                  relaySource: relayUrl,
                });
              }
              if (events.length >= limit) {
                if (!isDone) {
                  isDone = true;
                  clearTimeout(timer);
                  try {
                    ws.send(JSON.stringify(['CLOSE', subId]));
                    ws.close();
                  } catch {}
                  resolve();
                }
              }
            } else if (data[0] === 'EOSE') {
              if (!isDone) {
                isDone = true;
                clearTimeout(timer);
                try {
                  ws.send(JSON.stringify(['CLOSE', subId]));
                  ws.close();
                } catch {}
                resolve();
              }
            }
          } catch {}
        };

        ws.onerror = () => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timer);
            resolve();
          }
        };
      } catch {
        resolve();
      }
    });
  };

  // Run in parallel across top target relays
  await Promise.allSettled(targetRelays.map(r => queryRelay(r)));
  return events.slice(0, limit);
}

/**
 * Broadcast an advisory or event to specified relays
 */
export async function broadcastEventToRelays(
  signedEvent: any,
  relays?: string[]
): Promise<{ relay: string; status: 'ok' | 'failed'; reason?: string }[]> {
  const targetRelays = (relays && relays.length > 0 ? relays : DEFAULT_RELAYS).slice(0, 5);
  const pool = getSimplePool();

  try {
    const pubs = pool.publish(targetRelays, signedEvent);
    const results = await Promise.allSettled(pubs);

    return targetRelays.map((relay, idx) => {
      const res = results[idx];
      if (res && res.status === 'fulfilled') {
        return { relay, status: 'ok' };
      }
      return {
        relay,
        status: 'failed',
        reason: res && res.status === 'rejected' ? (res.reason?.message || 'Publish failed') : 'Relay rejected event',
      };
    });
  } catch (err: any) {
    return targetRelays.map(relay => ({
      relay,
      status: 'failed',
      reason: err?.message || 'Broadcast error',
    }));
  }
}
