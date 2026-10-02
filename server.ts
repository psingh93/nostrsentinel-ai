import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/apiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// API routes handled via apiHandler
app.all('/api/*', async (req, res, next) => {
  const handled = await handleApiRequest(req, res);
  if (!handled && !res.headersSent) {
    next();
  }
});

// Serve static frontend assets from dist in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const isGeminiReady = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  console.log(`[NostrSentinel AI] Server running on port ${PORT}`);
  console.log(`[NostrSentinel AI] Threat Intelligence Engine: ${isGeminiReady ? 'Gemini 2.5 Flash active' : 'Sentinel Heuristics active (fallback)'}`);
});
