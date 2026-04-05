import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => { callback(null, true); },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  credentials: true,
}));

app.use(express.json());

const openClawApiEndpoint = process.env.OPENCLAW_API_ENDPOINT;
const openClawApiKey = process.env.OPENCLAW_API_KEY;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Lead Store ───────────────────────────────────────────────────────────────
// Simple JSON file store on Railway filesystem
// Persists between requests, survives restarts (Railway mounts a writable FS)

const LEADS_FILE = path.join('/tmp', 'plumblead-leads.json');

interface StoredLead {
  id: string;
  receivedAt: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';
  jobValue?: number;       // dollar amount if Won
  statusNote?: string;     // optional note on status change
  statusUpdatedAt?: string;
  // all original lead fields
  [key: string]: unknown;
}

function readLeads(): StoredLead[] {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLeads(leads: StoredLead[]): void {
  try {
    // Keep only last 500 leads to prevent unbounded growth
    const trimmed = leads.slice(-500);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(trimmed, null, 2));
  } catch (err) {
    console.error('Failed to write leads file:', err);
  }
}

function saveLead(payload: Record<string, unknown>): StoredLead {
  const leads = readLeads();
  const lead: StoredLead = {
    ...payload,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    receivedAt: new Date().toISOString(),
    status: 'New',
  };
  leads.push(lead);
  writeLeads(leads);
  return lead;
}

// Admin key auth for dashboard API calls
const ADMIN_KEY = process.env.DASHBOARD_ADMIN_KEY || 'plumblead-admin-2026';

function requireAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, lang = 'en', sessionId = 'plumblead-user' } = req.body;
  const isSpanish = lang === 'es';

  const systemInstruction = `You are a friendly plumbing assistant for PlumbLead.ai. Your job is to quickly qualify the homeowner's issue and guide them to get a free quote.

STRICT RULES:
- Keep responses SHORT — 2-4 sentences maximum. Never use headers, bullet points, or long lists.
- Ask ONE clarifying question per response to narrow down the problem.
- After 1-2 exchanges, encourage them to use the Instant Quote tool for a free estimate.
- Be warm and helpful, not clinical or encyclopedic.
- Never dump a wall of text. If you feel like writing more than 4 sentences, stop and ask a question instead.
- IMPORTANT: Respond entirely in ${isSpanish ? 'Spanish' : 'English'}.`;

  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const response = await fetch(openClawApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` },
        body: JSON.stringify({ model: 'openclaw:plumblead', messages: [{ role: 'user', content: systemInstruction + '\n\n' + message }], user: sessionId })
      });
      const result = await response.json() as any;
      const chatbotResponse = result.choices?.[0]?.message?.content || result.output;
      if (chatbotResponse) return res.json({ response: chatbotResponse });
    } catch (err) {
      console.error('OpenClaw error, falling back to Gemini:', err);
    }
  }

  try {
    const geminiResponse = await ai.models.generateContent({
      model: process.env.PLUMBLEAD_QUOTE_AI_MODEL || 'gemini-2.0-flash',
      contents: `${systemInstruction}\n\nHomeowner: ${message}`,
    });
    const text = geminiResponse.text ?? "I'm sorry, I couldn't process that right now.";
    return res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to get chatbot response.' });
  }
});

// ─── Lead Qualification ───────────────────────────────────────────────────────
async function qualifyLeadWithGemini(serviceType: string, details: string, location: string): Promise<{ leadScore: string; crossSellOpportunities: string[] }> {
  const prompt = `You are a plumbing lead qualifier. Analyze this service request and return ONLY a JSON object with no markdown, no backticks, no explanation.

Service: ${serviceType}\nDetails: ${details}\nLocation: ${location}

Return exactly this JSON structure:
{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["array", "of", "strings"] }`;

  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    const text = (response.text ?? '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(text);
    return {
      leadScore: parsed.leadScore || 'Routine',
      crossSellOpportunities: Array.isArray(parsed.crossSellOpportunities) ? parsed.crossSellOpportunities : [],
    };
  } catch {
    const isEmergency = serviceType.toLowerCase().includes('emergency') || serviceType.toLowerCase().includes('leak') || serviceType.toLowerCase().includes('sewer');
    return { leadScore: isEmergency ? 'High Urgency' : 'Routine', crossSellOpportunities: [] };
  }
}

// ─── Quote ────────────────────────────────────────────────────────────────────
app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };

  let leadScore = '';
  let crossSellOpportunities: string[] = [];
  let refinedDetails = details;

  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Analyze this request and return ONLY valid JSON with no markdown or backticks:\n{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["string"], "geminiPromptRefinement": "optional" }\nService: ${serviceType}\nDetails: ${details}\nLocation: ${location}`;
      const openClawResponse = await fetch(openClawApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` },
        body: JSON.stringify({ model: 'openclaw:plumblead', messages: [{ role: 'user', content: qualificationPrompt }], user: sessionId })
      });
      if (openClawResponse.ok) {
        const openClawResult = await openClawResponse.json() as any;
        const raw = (openClawResult.choices?.[0]?.message?.content || openClawResult.output || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.leadScore) leadScore = parsed.leadScore;
          if (Array.isArray(parsed.crossSellOpportunities)) crossSellOpportunities = parsed.crossSellOpportunities;
          if (parsed.geminiPromptRefinement) refinedDetails = `${details}\n\nAdditional context: ${parsed.geminiPromptRefinement}`;
        }
      }
    } catch (err) {
      console.error('OpenClaw qualification error:', err);
    }
  }

  if (!leadScore) {
    try {
      const geminiQualification = await qualifyLeadWithGemini(serviceType, details, location);
      leadScore = geminiQualification.leadScore;
      crossSellOpportunities = geminiQualification.crossSellOpportunities;
    } catch {
      leadScore = 'Routine';
    }
  }

  try {
    const quoteResponse: QuoteResponse = await generateAIQuote({ ...quoteRequest, details: refinedDetails });
    return res.json({ ...quoteResponse, leadScore, crossSellOpportunities });
  } catch (error) {
    console.error('Quote generation error:', error);
    return res.status(500).json({ error: 'Failed to generate quote.', leadScore, crossSellOpportunities });
  }
});

// ─── POST /api/leads — receive, store, then forward to n8n ───────────────────
app.post('/api/leads', async (req, res) => {
  // 1. Save to local store
  const stored = saveLead(req.body);

  // 2. Forward to n8n (non-blocking on failure)
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...req.body, leadId: stored.id })
      });
      if (!response.ok) console.error(`n8n forward failed: ${response.status}`);
    } catch (error) {
      console.error('Lead forwarding error:', error);
    }
  }

  res.json({ message: 'Lead received.', leadId: stored.id });
});

// ─── GET /api/leads — fetch leads for dashboard ───────────────────────────────
app.get('/api/leads', requireAdminKey, (req, res) => {
  const leads = readLeads();
  const { clientId, status, source, limit = '100', offset = '0' } = req.query as Record<string, string>;

  let filtered = leads;
  if (clientId) filtered = filtered.filter(l => l.clientId === clientId);
  if (status) filtered = filtered.filter(l => l.status === status);
  if (source) filtered = filtered.filter(l => l.source === source);

  // Most recent first
  filtered = filtered.reverse();

  const total = filtered.length;
  const page = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({ leads: page, total, offset: parseInt(offset), limit: parseInt(limit) });
});

// ─── PATCH /api/leads/:id — update status, job value, notes ──────────────────
app.patch('/api/leads/:id', requireAdminKey, (req, res) => {
  const { id } = req.params;
  const { status, jobValue, statusNote } = req.body as {
    status?: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';
    jobValue?: number;
    statusNote?: string;
  };

  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  const updated: StoredLead = {
    ...leads[idx],
    ...(status && { status }),
    ...(jobValue !== undefined && { jobValue }),
    ...(statusNote !== undefined && { statusNote }),
    statusUpdatedAt: new Date().toISOString(),
  };

  leads[idx] = updated;
  writeLeads(leads);
  res.json({ lead: updated });
});

app.listen(port, () => {
  console.log(`PlumbLead.ai server running on port ${port}`);
});
