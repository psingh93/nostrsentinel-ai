import { GoogleGenAI, Type } from '@google/genai';
import { ThreatAnalysisResult, RiskLevel } from '../types/nostr.ts';

// Deterministic heuristic analyzer for decentralized social & Bitcoin/Lightning patterns
export function runHeuristicAnalysis(content: string, metadata?: { author?: string; eventId?: string }): ThreatAnalysisResult {
  const lower = (content || '').toLowerCase();
  const categories: string[] = [];
  const signals: string[] = [];
  let score = 5; // Base clean baseline
  let explanation = '';
  let recommendedAction = 'No immediate threats detected. Standard browsing precautions recommended.';

  // 1. Seed phrase & private key harvesting (CRITICAL)
  if (
    lower.includes('seed phrase') ||
    lower.includes('12 words') ||
    lower.includes('24 words') ||
    lower.includes('nsec1') ||
    lower.includes('private key') ||
    lower.includes('backup phrase') ||
    lower.includes('enter your key') ||
    lower.includes('export secret key')
  ) {
    categories.push('Credential Theft / Key Harvesting');
    signals.push('Explicit request for mnemonic seed phrase, private key (nsec), or wallet credentials');
    score = Math.max(score, 98);
  }

  // 2. Urgent social engineering / Account suspension scare (HIGH/CRITICAL)
  if (
    (lower.includes('account suspended') || lower.includes('security alert') || lower.includes('act now') || lower.includes('urgent action') || lower.includes('within 24 hours') || lower.includes('immediate attention required')) &&
    (lower.includes('verify') || lower.includes('click') || lower.includes('link') || lower.includes('log in') || lower.includes('login') || lower.includes('support'))
  ) {
    categories.push('Urgency Manipulation / Social Engineering');
    signals.push('High-pressure urgency coercion demanding verification or credentials');
    score = Math.max(score, 88);
  }

  // 3. Fake Lightning / Bitcoin giveaways and doubler scams (HIGH)
  if (
    (lower.includes('giveaway') || lower.includes('airdrop') || lower.includes('send 0.') || lower.includes('double your btc') || lower.includes('send sats get double') || lower.includes('claim 0.5 btc') || lower.includes('free sats')) &&
    (lower.includes('send') || lower.includes('claim') || lower.includes('deposit') || lower.includes('t.me/') || lower.includes('lnurl') || lower.includes('http'))
  ) {
    categories.push('Bitcoin/Lightning Payment Scam');
    signals.push('Unrealistic promise of free sats or doubler mechanics requesting prior action or payment');
    score = Math.max(score, 92);
  }

  // 4. Fake Support & Impersonation (HIGH)
  if (
    lower.includes('nostr support') ||
    lower.includes('damus support') ||
    lower.includes('primal support') ||
    lower.includes('official support desk') ||
    lower.includes('customer care') ||
    lower.includes('helpdesk telegram')
  ) {
    categories.push('Impersonation / Fake Support');
    signals.push('Claims of official centralized customer support on a decentralized protocol');
    score = Math.max(score, 84);
  }

  // 5. Suspicious links, shorteners, punycode, or phishing redirects
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = content.match(urlRegex) || [];
  const suspiciousTlds = ['.xyz', '.top', '.buzz', '.click', '.live', '.online', '.cam', '.cfd', '.quest'];
  const urlShorteners = ['bit.ly', 'tinyurl.com', 'is.gd', 'cutt.ly', 't.co', 'rb.gy'];

  for (const url of urls) {
    const urlLower = url.toLowerCase();
    if (suspiciousTlds.some(tld => urlLower.includes(tld))) {
      categories.push('Malicious / High-Risk Domain');
      signals.push(`Detected URL with high-risk generic TLD associated with phishing campaigns: ${url}`);
      score = Math.max(score, 78);
    }
    if (urlShorteners.some(s => urlLower.includes(s))) {
      categories.push('Obfuscated / Shortened URL');
      signals.push(`Obfuscated link mask destination redirect: ${url}`);
      score = Math.max(score, 65);
    }
    if (urlLower.includes('damus-app') || urlLower.includes('primal-web') || urlLower.includes('nostr-login') || urlLower.includes('wallet-connect')) {
      categories.push('Lookalike Phishing Domain');
      signals.push(`Typo-squatted or lookalike domain targeting Nostr ecosystem: ${url}`);
      score = Math.max(score, 94);
    }
  }

  // 6. Suspicious Lightning payment / Invoice manipulation
  if (lower.includes('lnbc') || lower.includes('lightning:lnbc')) {
    if (lower.includes('fine') || lower.includes('penalty') || lower.includes('unfreeze') || lower.includes('unlock account')) {
      categories.push('Extortion / Coercive Payment Request');
      signals.push('Lightning invoice paired with extortion or account unlocking threats');
      score = Math.max(score, 95);
    } else if (score < 40) {
      signals.push('Lightning Network invoice detected. Standard microtransaction check.');
      score = Math.max(score, 20);
    }
  }

  // 7. Malicious executable instructions or command injections
  if (
    lower.includes('curl -s') ||
    lower.includes('wget ') ||
    lower.includes('| bash') ||
    lower.includes('| sh') ||
    lower.includes('powershell -e') ||
    lower.includes('rm -rf /') ||
    lower.includes('chmod 777')
  ) {
    categories.push('Malicious CLI Payload');
    signals.push('Unsafe piping of external scripts directly into shell execution');
    score = Math.max(score, 96);
  }

  // Determine Risk Level
  let riskLevel: RiskLevel = 'LOW';
  if (score >= 85) riskLevel = 'CRITICAL';
  else if (score >= 65) riskLevel = 'HIGH';
  else if (score >= 35) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  // Construct explainable response adhering strictly to evidence-based terminology
  if (riskLevel === 'CRITICAL') {
    explanation = `Potential critical threat detected. The evaluated payload exhibits high-severity indicators of ${categories.join(', ')}. Key observable evidence: ${signals.join('; ')}. Immediate risk of credential exposure or direct financial loss.`;
    recommendedAction = 'Do not interact, do not open external links, and never disclose private keys, seed phrases, or OTPs. Consider publishing a decentralized security advisory.';
  } else if (riskLevel === 'HIGH') {
    explanation = `Potential high-severity threat detected. Multiple suspicious behavioral signals were identified: ${signals.join('; ')}. The content attempts coercive social engineering or deceptive actions.`;
    recommendedAction = 'Exercise extreme caution. Do not click unverified links, authorize Lightning wallet connections, or execute untrusted shell scripts.';
  } else if (riskLevel === 'MEDIUM') {
    explanation = `Potential risk detected. The content contains anomalous elements requiring elevated vigilance (${signals.join('; ')}). Evidence is inconclusive for malicious intent but warrants manual inspection.`;
    recommendedAction = 'Inspect destination URLs in an isolated sandbox before engaging. Verify the sender pubkey against known web-of-trust profiles.';
  } else {
    explanation = 'No significant threat patterns or malicious indicators identified in this payload. The content conforms to normal conversational or broadcast patterns on the Nostr network.';
    recommendedAction = 'Standard decentralized protocol usage precautions apply.';
  }

  return {
    riskLevel,
    riskScore: score,
    confidence: score > 50 ? 94 : 88,
    categories: categories.length ? categories : ['Clean / Informational'],
    signals: signals.length ? signals : ['Standard conversational payload', 'No known malicious patterns detected'],
    explanation,
    recommendedAction,
    analyzedAt: new Date().toISOString(),
    engineUsed: 'sentinel-heuristics',
  };
}

export async function analyzeContentWithGemini(
  content: string,
  metadata?: { author?: string; eventId?: string; kind?: number }
): Promise<ThreatAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return runHeuristicAnalysis(content, metadata);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are NostrSentinel AI, an autonomous cybersecurity intelligence agent protecting users on the decentralized Nostr social protocol.
Your task is to analyze user-submitted Nostr events, notes, URLs, or messages for cyber threats, social engineering, and scams.

Analyze specifically for:
- Phishing & lookalike/typo-squatted web links
- Credential theft & seed phrase / private key (nsec) harvesting
- Impersonation of trusted accounts or official protocol support desks (e.g. fake "Nostr/Damus/Primal Support")
- Social engineering & urgency manipulation (suspension threats, panic deadlines)
- Malicious/suspicious links and URL shorteners
- Fake rewards, giveaways, and sats-doubler airdrops
- Investment & Ponzi schemes
- OTP / PIN / password / auth token requests
- Suspicious Bitcoin / Lightning payment requests or extortion invoices
- Malicious instructions or shell command executions (e.g. curl ... | bash)

CRITICAL INSTRUCTIONS:
1. Explainability: Clearly articulate WHY content was flagged. Detail concrete, observable signals (e.g., suspicious URL, urgent language, credential request).
2. Nuanced Attribution: Never claim content is definitively malicious when evidence is circumstantial. Use evidence-based phrasing such as "Potential threat detected" or "Suspicious behavioral pattern identified".
3. Return strictly valid JSON conforming exactly to the requested schema.`;

    const userMessage = `Analyze this Nostr event payload for security threats:
---
Content:
${content}
---
Event Metadata:
- Event ID: ${metadata?.eventId || 'N/A'}
- Author Pubkey: ${metadata?.author || 'N/A'}
- Kind: ${metadata?.kind !== undefined ? metadata.kind : '1 (Text Note)'}
---
Provide your structured security evaluation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'Overall threat risk tier',
            },
            riskScore: {
              type: Type.INTEGER,
              description: 'Calculated risk score from 0 to 100',
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Model confidence score between 0 and 100',
            },
            categories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Categories of detected threats or patterns',
            },
            signals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Observable indicators that contributed to the rating',
            },
            explanation: {
              type: Type.STRING,
              description: 'Clear, explainable reasoning describing why this was or was not flagged',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Direct mitigation advice for the Nostr user',
            },
          },
          required: [
            'riskLevel',
            'riskScore',
            'confidence',
            'categories',
            'signals',
            'explanation',
            'recommendedAction',
          ],
        },
      },
    });

    let rawText = response.text?.trim() || '{}';
    // Remove markdown code fence if returned
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    const parsed = JSON.parse(rawText);

    // Strict validation
    const validLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const riskLevel: RiskLevel = validLevels.includes(parsed.riskLevel) ? parsed.riskLevel : 'LOW';
    const riskScore = typeof parsed.riskScore === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.riskScore))) : 10;
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.confidence))) : 90;
    const categories = Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : ['General Content'];
    const signals = Array.isArray(parsed.signals) && parsed.signals.length ? parsed.signals : ['No anomalous indicators detected'];
    const explanation = typeof parsed.explanation === 'string' && parsed.explanation.length ? parsed.explanation : 'No significant risk detected.';
    const recommendedAction = typeof parsed.recommendedAction === 'string' && parsed.recommendedAction.length ? parsed.recommendedAction : 'Standard decentralized protocol precautions apply.';

    return {
      riskLevel,
      riskScore,
      confidence,
      categories,
      signals,
      explanation,
      recommendedAction,
      analyzedAt: new Date().toISOString(),
      engineUsed: 'gemini-ai',
    };
  } catch (err: any) {
    // Sanitize error logging to strictly prevent API key or credential exposure
    const safeError = String(err?.message || 'API request failed').replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
    console.error('[NostrSentinel AI] Gemini API analysis error, falling back to Sentinel Heuristics:', safeError);
    // Graceful fallback to Sentinel Heuristics without failing the request
    return runHeuristicAnalysis(content, metadata);
  }
}
