import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import fetch from 'node-fetch';
import { Pool } from 'pg';

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

// ─── Postgres ─────────────────────────────────────────────────────────────────
// DATABASE_URL is injected automatically by Railway when you add a Postgres service

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

// Create the leads table on first startup if it doesn't exist
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id           TEXT PRIMARY KEY,
        received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status       TEXT NOT NULL DEFAULT 'New',
        job_value    NUMERIC,
        status_note  TEXT,
        status_updated_at TIMESTAMPTZ,
        payload      JSONB NOT NULL
      );
      CREATE INDEX IF NOT EXISTS leads_client_id ON leads ((payload->>'clientId'));
      CREATE INDEX IF NOT EXISTS leads_source    ON leads ((payload->>'source'));
      CREATE INDEX IF NOT EXISTS leads_status    ON leads (status);
    `);
    console.log('Database ready.');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

interface StoredLead {
  id: string;
  receivedAt: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';
  jobValue?: number;
  statusNote?: string;
  statusUpdatedAt?: string;
  [key: string]: unknown;
}

// Map a DB row to the StoredLead shape the dashboard expects
function rowToLead(row: Record<string, unknown>): StoredLead {
  const payload = (row.payload as Record<string, unknown>) || {};
  return {
    ...payload,
    id: row.id as string,
    receivedAt: row.received_at as string,
    status: row.status as StoredLead['status'],
    ...(row.job_value != null  && { jobValue: Number(row.job_value) }),
    ...(row.status_note        && { statusNote: row.status_note as string }),
    ...(row.status_updated_at  && { statusUpdatedAt: row.status_updated_at as string }),
  };
}

async function saveLead(payload: Record<string, unknown>): Promise<StoredLead> {
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await pool.query(
    `INSERT INTO leads (id, payload) VALUES ($1, $2)`,
    [id, JSON.stringify(payload)]
  );
  return { ...payload, id, receivedAt: new Date().toISOString(), status: 'New' };
}

async function queryLeads(filters: { clientId?: string; status?: string; source?: string; limit: number; offset: number }) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.clientId) { conditions.push(`payload->>'clientId' = $${i++}`); values.push(filters.clientId); }
  if (filters.status)   { conditions.push(`status = $${i++}`);              values.push(filters.status); }
  if (filters.source)   { conditions.push(`payload->>'source' = $${i++}`);  values.push(filters.source); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(`SELECT COUNT(*) FROM leads ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  values.push(filters.limit, filters.offset);
  const dataRes = await pool.query(
    `SELECT * FROM leads ${where} ORDER BY received_at DESC LIMIT $${i++} OFFSET $${i++}`,
    values
  );

  return { leads: dataRes.rows.map(rowToLead), total };
}

async function patchLead(id: string, update: { status?: string; jobValue?: number; statusNote?: string }): Promise<StoredLead | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (update.status    != null) { sets.push(`status = $${i++}`);               values.push(update.status); }
  if (update.jobValue  != null) { sets.push(`job_value = $${i++}`);             values.push(update.jobValue); }
  if (update.statusNote != null) { sets.push(`status_note = $${i++}`);          values.push(update.statusNote); }
  sets.push(`status_updated_at = NOW()`);

  values.push(id);
  const res = await pool.query(
    `UPDATE leads SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!res.rows.length) return null;
  return rowToLead(res.rows[0]);
}

// Admin key auth
const ADMIN_KEY = process.env.DASHBOARD_ADMIN_KEY || 'plumblead-admin-2026';

function requireAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: 'ok', db: 'not connected', timestamp: new Date().toISOString() });
  }
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
      const q = await qualifyLeadWithGemini(serviceType, details, location);
      leadScore = q.leadScore;
      crossSellOpportunities = q.crossSellOpportunities;
    } catch { leadScore = 'Routine'; }
  }

  try {
    const quoteResponse: QuoteResponse = await generateAIQuote({ ...quoteRequest, details: refinedDetails });
    return res.json({ ...quoteResponse, leadScore, crossSellOpportunities });
  } catch (error) {
    console.error('Quote generation error:', error);
    return res.status(500).json({ error: 'Failed to generate quote.', leadScore, crossSellOpportunities });
  }
});

// ─── POST /api/leads ──────────────────────────────────────────────────────────
app.post('/api/leads', async (req, res) => {
  let stored: StoredLead;
  try {
    stored = await saveLead(req.body);
  } catch (err) {
    console.error('Failed to save lead to DB:', err);
    // Still acknowledge the lead so the user doesn't see an error
    return res.json({ message: 'Lead received.' });
  }

  // Forward to n8n asynchronously
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, leadId: stored.id })
    }).catch(err => console.error('n8n forward error:', err));
  }

  res.json({ message: 'Lead received.', leadId: stored.id });
});

// ─── GET /api/leads ───────────────────────────────────────────────────────────
app.get('/api/leads', requireAdminKey, async (req, res) => {
  const { clientId, status, source, limit = '200', offset = '0' } = req.query as Record<string, string>;
  try {
    const result = await queryLeads({
      clientId: clientId === '__all__' ? undefined : clientId,
      status,
      source,
      limit: Math.min(parseInt(limit), 500),
      offset: parseInt(offset),
    });
    res.json(result);
  } catch (err) {
    console.error('GET /api/leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// ─── PATCH /api/leads/:id ─────────────────────────────────────────────────────
app.patch('/api/leads/:id', requireAdminKey, async (req, res) => {
  const { id } = req.params;
  const { status, jobValue, statusNote } = req.body;
  try {
    const updated = await patchLead(id, { status, jobValue, statusNote });
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead: updated });
  } catch (err) {
    console.error('PATCH /api/leads error:', err);
    res.status(500).json({ error: 'Failed to update lead.' });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(port, () => {
    console.log(`PlumbLead.ai server running on port ${port}`);
  });
});
