# NostrSentinel AI

> **Autonomous AI Security Intelligence for the Decentralized Nostr Network**  
> *Prepared for the AWS Zero to Shipped Hackathon*

NostrSentinel AI is an autonomous, explainable AI cybersecurity intelligence platform purpose-built for the decentralized Nostr protocol. By bridging live WebSocket Nostr relays with Google Gemini 2.5 Flash threat reasoning, NostrSentinel identifies credential harvesting, lookalike phishing domains, fake support impersonators, coercive social engineering, and fraudulent Bitcoin/Lightning network payment requests—without centralized gatekeeping or protocol censorship.

---

## 1. Project Overview

As the decentralized web expands, open protocols like Nostr enable censorship-resistant social communication and value transfer. However, the absence of centralized gatekeepers shifts threat exposure directly onto end users. Malicious actors leverage this environment to distribute lookalike domains, steal cryptographic keys (`nsec`), and broadcast fraudulent Lightning invoices.

**NostrSentinel AI** functions as an autonomous, client-sovereign Security Operations Center (SOC) for Nostr. It inspects event payloads, extracts observable security indicators, classifies risks into standard tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), produces evidence-based explainability, monitors relay mesh health, and equips analysts to publish signed decentralized security advisories back to relays without compromising private keys.

---

## 2. Problem Statement

Traditional web applications rely on centralized moderators, proprietary blocklists, and walled-garden platform policies. In decentralized protocols like Nostr:
1. **Unfiltered Ingress:** Anyone can publish events to open public relays without preliminary content filtering.
2. **Asymmetric Social Engineering:** Attackers masquerade as official client support desks (e.g. fake "Damus Support" or "Primal Helpdesk") to panic users into disclosing credentials.
3. **Cryptographic Key Harvesting:** Private keys (`nsec`) and 12/24-word mnemonic seed phrases are irrevocable; once compromised, an identity and associated Lightning wallet are permanently lost.
4. **Lightning Invoice Extortion:** Fraudulent Lightning invoices (`lnbc...`) and sats-doubler scams prey on microtransaction speed.
5. **The Censorship Trap:** Centralized blacklists destroy the core premise of decentralization. Users require decentralized, explainable threat intelligence so they can make informed, autonomous decisions.

---

## 3. The Solution

NostrSentinel AI decouples threat intelligence from centralized authority:
- **Client-Authoritative Security:** The user remains in total control. The platform evaluates risk and explains *why* a note is suspicious rather than silently censoring content.
- **Explainable Reasoning Pipeline:** Distinguishes observable behavioral evidence from probabilistic assessment.
- **Dual-Engine Architecture:** Operates with server-isolated Gemini 2.5 Flash for deep semantic threat intelligence, backed by a deterministic Sentinel Heuristic Engine for continuous offline resilience.
- **Zero-Knowledge Privacy:** Never requests, collects, stores, or transmits user private keys (`nsec`).
- **Decentralized Advisory Broadcasting:** Allows security analysts to cryptographically sign and broadcast advisories to relays via standard NIP-07 browser extensions (Alby, nos2x) or single-use disposable scout keys.

---

## 4. Key Features

- **Security Intelligence Center (SOC Dashboard):** Real-time session telemetry displaying total events analyzed, threats detected, critical incidents, average risk score, threat detection rate, and live connected relays.
- **Threat Activity Timeline:** Real event timeline tracking timestamped threat detections with direct 1-click payload inspection.
- **Multi-Vector Threat Analyzer:**
  - Raw text & messages
  - Raw Nostr event JSON (auto-extracts `id`, `pubkey`, `kind`, `tags`, `content`)
  - Note & event identifier resolution (`note1...`, `nevent1...`, 64-char hex)
  - Suspicious URL scanner (detects high-risk TLDs, URL shorteners, punycode typo-squatting)
  - Real-time relay stream ingress (subscribes to live Kind 1 text notes flowing across public relays)
- **Visual Intelligence Pipeline:** Explicit 6-stage evaluation flow:
  `INPUT` → `SIGNAL EXTRACTION` → `THREAT ANALYSIS` → `RISK SCORING` → `EXPLANATION` → `RECOMMENDED ACTION`
- **Professional SVG Risk Gauge:** Dynamic semicircular gauge visualizing 0–100 risk score, confidence rating, and underlying engine.
- **Threat Intelligence Ledger:** Searchable, filterable historical record of all evaluated events. Supports severity filtering (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), category filtering, dual sorting (by risk or timestamp), expandable threat signals, and JSON export.
- **Nostr Relay Network Monitor:** Real WebSocket ping telemetry across configured relays, tracking connection status (`CONNECTED`, `CONNECTING`, `DEGRADED`, `OFFLINE`), round-trip latency (ms), read/write capabilities, and custom relay management.
- **Honest System Statuses:** Never displays fake "100% protection" or simulated uptime. If Gemini is not configured, the system explicitly marks `CONFIGURATION REQUIRED` and activates heuristic protection.
- **Benchmark Hackathon Demo Mode:** One-click pre-seeded benchmark attack scenarios (seed phrase harvesting, typo-squatting, helpdesk extortion, sats doubler, shell pipe command, and clean notes) clearly tagged with `DEMO DATA`.

---

## 5. System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Nostr Relay Mesh         │
                                  │(wss://relay.damus.io, nos.lol)│
                                  └───────────────┬───────────────┘
                                                  │
                                                  │ WebSocket (NIP-01)
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NostrSentinel AI Platform                             │
│                                                                                 │
│   ┌────────────────────────┐                    ┌───────────────────────────┐   │
│   │    Express / Node.js   │                    │     Vite React 19 SOC     │   │
│   │   Proxy Middleware     │                    │      User Interface       │   │
│   │  (/api/analyze, /relays)                    │ (Dashboard, Analyzer, SOC)│   │
│   └───────────┬────────────┘                    └─────────────┬─────────────┘   │
│               │                                               │                 │
│               ▼                                               │                 │
│   ┌────────────────────────┐                                  │                 │
│   │  Gemini 2.5 Flash SDK  │                                  │                 │
│   │  (@google/genai TS)    │                                  │                 │
│   │  Strict JSON Schema    │                                  │                 │
│   └───────────┬────────────┘                                  │                 │
│               │ (Fallback)                                    │                 │
│               ▼                                               │                 │
│   ┌────────────────────────┐                                  │                 │
│   │ Sentinel Deterministic │                                  │                 │
│   │    Heuristic Engine    │                                  │                 │
│   └───────────┬────────────┘                                  │                 │
│               │                                               │                 │
│               └───────────────────────┬───────────────────────┘                 │
│                                       ▼                                         │
│                       ┌───────────────────────────────┐                         │
│                       │   Structured Risk Assessment  │                         │
│                       │   - Risk Level & Score (0-100)│                         │
│                       │   - Observable Signals        │                         │
│                       │   - Explainable Reasoning     │                         │
│                       │   - Actionable Mitigation     │                         │
│                       └───────────────┬───────────────┘                         │
└───────────────────────────────────────┼─────────────────────────────────────────┘
                                        │
                                        ▼ Optional Advisory
                        ┌───────────────────────────────┐
                        │   Client-Side Safe Signing    │
                        │   (NIP-07 Browser Extension   │
                        │   or Disposable Scout Key)    │
                        └───────────────┬───────────────┘
                                        │
                                        ▼ Broadcast
                        ┌───────────────────────────────┐
                        │   Decentralized Security Note │
                        │  to Nostr Relay Mesh (#sentinel)│
                        └───────────────────────────────┘
```

---

## 6. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend & Proxy** | Node.js 22 LTS, Express 4, tsx, native WebSocket |
| **AI Intelligence** | Google Gemini 2.5 Flash (`@google/genai` TypeScript SDK) |
| **Decentralized Web** | Nostr Protocol, `nostr-tools` v2 (NIP-01, NIP-07, NIP-19) |
| **Container & Cloud** | Docker, AWS App Runner / Amazon ECS Fargate deployment specs |

---

## 7. AI Threat Reasoning Workflow

1. **Payload Intake & Sanitization:** Notes, JSON events, or URLs are accepted and length-capped (max 10,000 characters) to prevent denial-of-service abuse. Content is strictly parsed as inert text—executable code or scripts are never executed.
2. **Server-Side AI Dispatch:** The backend routes the payload to Google Gemini 2.5 Flash via `@google/genai`. `GEMINI_API_KEY` is securely retained on the server and never exposed to the client.
3. **Structured Schema Enforcement:** The model is invoked with strict JSON schema constraints (`responseSchema` + `Type.OBJECT`):
   - `riskLevel`: `'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'`
   - `riskScore`: Integer between `0` and `100`
   - `confidence`: Confidence score between `0` and `100`
   - `categories`: Array of detected threat vectors
   - `signals`: Observable indicators extracted from the payload
   - `explanation`: Nuanced reasoning justifying the risk level
   - `recommendedAction`: Concrete defensive guidance for the user
4. **Deterministic Heuristic Fallback:** If `GEMINI_API_KEY` is not configured or if an upstream network error occurs, the built-in Sentinel Heuristic Engine automatically performs regex and pattern analysis without failing the request.

---

## 8. Nostr Protocol Workflow

- **Relay Pool Connection:** Maintains concurrent WebSocket connections to verified Nostr relays (`wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.primal.net`, `wss://nostr.mom`).
- **Ping & Latency Measurement:** Dispatches WebSocket connection handshakes to calculate round-trip latency and identify degraded relays.
- **NIP-19 Identifier Resolution:** Decodes `note1...`, `nevent1...`, and `npub1...` bech32 strings to standard 64-character hex keys.
- **Zero-Exposure Advisory Broadcasting:** When an analyst chooses to broadcast an advisory, signing occurs strictly in the browser runtime:
  - **NIP-07 Browser Extension:** Requests a cryptographic signature from Alby, nos2x, or Amber.
  - **Disposable Ephemeral Scout Key:** Generates a temporary local secp256k1 keypair to publish anonymously.
  - User private keys (`nsec`) are never touched or requested by NostrSentinel AI.

---

## 9. Environment Variables

Documented in `.env.example`:

```env
GEMINI_API_KEY=
NOSTR_RELAYS=wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net,wss://nostr.mom
APP_URL=http://localhost:3000
```

---

## 10. Local Setup & Running

### Prerequisites
- Node.js 22 LTS or higher
- npm 10+ or bun

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd nostr-sentinel-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY (optional for heuristic testing)
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 11. Production Build & Execution

To test the compiled production bundle with the Express production server:

```bash
# 1. Typecheck and lint codebase
npm run lint

# 2. Compile frontend assets
npm run build

# 3. Start production server
npm start
```
The application will serve compiled assets from `dist/` on port 3000.

---

## 12. AWS Deployment Guidance

NostrSentinel AI is containerized and architected for seamless deployment on Amazon Web Services for the **AWS Zero to Shipped** hackathon:

### Option A: AWS App Runner (Fastest, Fully Managed)
AWS App Runner provides seamless container-to-cloud deployments without infrastructure management:
1. Push the repository to GitHub.
2. In the AWS Management Console, navigate to **AWS App Runner** → **Create Service**.
3. Source: **Source code repository** (select your GitHub repository and branch) or **Container registry** (using Amazon ECR).
4. Build configuration:
   - Runtime: **Node.js 22** or use the included multi-stage `Dockerfile`.
   - Build command: `npm install && npm run build`
   - Start command: `node server.ts` (or `tsx server.ts`)
   - Port: `3000`
5. Environment variables: Add `GEMINI_API_KEY` under **Configuration** → **Environment variables**.
6. Click **Deploy**. App Runner provisions SSL, load balancing, and a public URL automatically.

### Option B: Amazon ECS with AWS Fargate (Serverless Containers)
For enterprise scalability:
1. Build and tag the Docker image:
   ```bash
   docker build -t nostr-sentinel-ai .
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag nostr-sentinel-ai:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/nostr-sentinel-ai:latest
   docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/nostr-sentinel-ai:latest
   ```
2. Create an **ECS Task Definition** targeting the Fargate launch type:
   - Container Port: `3000`
   - Environment Secrets: Map `GEMINI_API_KEY` from **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**.
3. Create an **ECS Service** with an **Application Load Balancer (ALB)** distributing HTTPS traffic to the Fargate tasks.

### Option C: AWS Amplify Hosting
For full-stack server-side rendered (SSR) web deployments:
1. Connect repository in the **AWS Amplify Console**.
2. Amplify automatically detects Vite/Node.js build settings.
3. Configure `GEMINI_API_KEY` in Amplify **Environment Variables**.
4. Deploy with automated CI/CD on every push.

---

## 13. Security Considerations

- **Server-Side API Key Confinement:** The `GEMINI_API_KEY` is accessed only by backend proxy routes. It is never injected into client-side JS bundles, local storage, or network headers.
- **Zero Private Key Handling:** NostrSentinel AI has no access to user `nsec` private keys. Signing requests are delegated to browser extensions via NIP-07 or executed with single-use ephemeral throwaway keys.
- **Safe Payload Rendering:** Evaluated text, URLs, and code snippets are escaped and rendered inert. The application never evaluates shell commands, executes scripts, or auto-redirects browsers to analyzed destination URLs.
- **Deterministic Heuristic Safeguards:** Heuristic analyzers run with bounded timeouts to prevent ReDoS (Regular Expression Denial of Service) attacks.
- **Strict Content-Length Limits:** Payloads exceeding 10,000 characters are safely rejected to protect system memory.

---

## 14. Hackathon Demo Instructions (2–3 Minute Walkthrough)

For live evaluation and hackathon presentations:

1. **Open the Security Intelligence Center (`/dashboard`):**
   - Point out real application telemetry: Total Analyzed, Threats Detected, Critical Incidents, Average Risk Score, and Connected Relays.
   - Show the honest system indicators: `AI ENGINE` (`READY` or `CONFIGURATION REQUIRED`) and `NOSTR NETWORK` (live connected sockets).
2. **Explore Benchmark Scenarios:**
   - Click *"Load Benchmark Threat Data"* to demonstrate instant population of the Risk Distribution chart and Threat Activity Timeline.
3. **Navigate to the AI Event Security Analyzer (`/analyze`):**
   - Select a rapid attack vector benchmark (e.g. *Mnemonic Seed Phrase Harvesting* or *Typo-Squatted Client Phishing*).
   - Click *"Run Threat Analysis"*.
   - Walk through the 6-stage visual pipeline:
     `INPUT` → `SIGNAL EXTRACTION` → `THREAT ANALYSIS` → `RISK SCORING` → `EXPLANATION` → `RECOMMENDED ACTION`.
   - Highlight the dynamic SVG Risk Gauge, the concrete observable signals, and the evidence-based explainable reasoning.
4. **Inspect the Threat Intelligence Ledger (`/threats`):**
   - Demonstrate the Search bar, Severity filters (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Category filter, and Risk/Time sorting controls.
   - Expand a record to review observable signals.
   - Show the *"Export Report"* button generating structured JSON threat intelligence.
5. **Review Relay Network Telemetry (`/relays`):**
   - Display real WebSocket connections, ping latencies in milliseconds, and read/write capability flags.
   - Demonstrate the live relay ingress stream pulling authentic Kind 1 notes from public relays.
6. **Conclude at Settings (`/settings`):**
   - Show the zero-knowledge privacy architecture and server-side key isolation policy.

---

## 15. Known Limitations & Roadmap

- **NIP-1984 Reporting Standard:** Future iterations will support native Kind 1984 reporting tags directly integrated with Nostr relay moderation engines.
- **Web of Trust Graphing (NIP-02):** Cross-referencing flagged note authors against the user's local contact graph to identify targeted impersonation attacks against known network contacts.
- **Decentralized Edge Cache:** Leveraging AWS CloudFront and Lambda@Edge to cache verified threat signatures close to end users for ultra-low latency event validation.

---

## License

Apache-2.0
