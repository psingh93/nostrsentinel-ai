import type { IncomingMessage, ServerResponse } from 'http';
import { analyzeContentWithGemini } from './gemini.ts';
import {
  fetchEventById,
  fetchRecentRelayEvents,
  testRelayLatency,
  broadcastEventToRelays,
  DEFAULT_RELAYS,
} from './nostrRelay.ts';

// Helper to parse JSON body from incoming request
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method?.toUpperCase();

  // Only handle /api/* routes
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  try {
    // 1. Health & Config status
    if (pathname === '/api/health' && method === 'GET') {
      const rawKey = process.env.GEMINI_API_KEY;
      const hasApiKey = Boolean(rawKey && typeof rawKey === 'string' && rawKey.trim() !== '' && rawKey.trim() !== 'MY_GEMINI_API_KEY');
      sendJson(res, 200, {
        status: 'ok',
        version: '1.0.0',
        agent: 'NostrSentinel AI',
        geminiConfigured: hasApiKey,
        defaultRelays: DEFAULT_RELAYS,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    // 2. Threat Analysis
    if (pathname === '/api/analyze' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { content, eventId, author, kind } = body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        sendJson(res, 400, { error: 'Content is required for security analysis.' });
        return true;
      }

      // Sanitize input length to avoid excessive abuse
      const sanitizedContent = content.slice(0, 10000);
      const result = await analyzeContentWithGemini(sanitizedContent, {
        author: typeof author === 'string' ? author : undefined,
        eventId: typeof eventId === 'string' ? eventId : undefined,
        kind: typeof kind === 'number' ? kind : undefined,
      });

      sendJson(res, 200, { success: true, result });
      return true;
    }

    // 3. Nostr Event Fetching
    if (pathname === '/api/nostr/fetch' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { eventId, relays, feed, limit } = body;

      if (feed) {
        // Fetch recent live events from relays for live feed / scanner
        const count = Math.min(25, Math.max(1, typeof limit === 'number' ? limit : 12));
        const events = await fetchRecentRelayEvents(count, relays);
        sendJson(res, 200, { success: true, events });
        return true;
      }

      if (!eventId || typeof eventId !== 'string') {
        sendJson(res, 400, { error: 'eventId is required (note1..., nevent1..., or hex ID).' });
        return true;
      }

      const { event, relaySource, error } = await fetchEventById(eventId, relays);

      if (error && !event) {
        sendJson(res, 404, { success: false, error });
        return true;
      }

      sendJson(res, 200, { success: true, event, relaySource });
      return true;
    }

    // 4. Nostr Relay Status & Ping (all or custom list)
    if (pathname === '/api/nostr/relays' && method === 'GET') {
      const customParam = url.searchParams.get('urls');
      const targetRelays = customParam
        ? customParam.split(',').map(u => u.trim()).filter(Boolean)
        : DEFAULT_RELAYS;

      // Ping each relay with timeout
      const statuses = await Promise.all(
        targetRelays.map(relay => testRelayLatency(relay, 3500))
      );

      sendJson(res, 200, {
        success: true,
        relays: statuses,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    // 4b. Single Relay Retry / Ping
    if (pathname === '/api/nostr/relays/ping' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { url: relayUrl } = body;
      if (!relayUrl || typeof relayUrl !== 'string') {
        sendJson(res, 400, { error: 'Relay url is required.' });
        return true;
      }
      const status = await testRelayLatency(relayUrl, 4000);
      sendJson(res, 200, { success: true, relay: status });
      return true;
    }

    // 5. Nostr Security Advisory Publish
    if (pathname === '/api/nostr/publish' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { signedEvent, relays } = body;

      if (!signedEvent || !signedEvent.id || !signedEvent.sig || !signedEvent.pubkey) {
        sendJson(res, 400, {
          error: 'Signed event with id, sig, and pubkey is required. Client-side signing ensures private keys are never transmitted.',
        });
        return true;
      }

      const broadcastResults = await broadcastEventToRelays(signedEvent, relays);
      const anySuccess = broadcastResults.some(r => r.status === 'ok');

      sendJson(res, 200, {
        success: anySuccess,
        results: broadcastResults,
        eventId: signedEvent.id,
      });
      return true;
    }

    // Unmatched API route
    sendJson(res, 404, { error: `Endpoint ${pathname} not found.` });
    return true;
  } catch (err: any) {
    const safeError = String(err?.message || 'Server error processing request').replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
    console.error('[NostrSentinel AI] API Handler error:', safeError);
    sendJson(res, 500, { error: 'Internal server error processing security request.' });
    return true;
  }
}
