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

app.use('/api/voice', express.urlencoded({ extended: false }));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(cors({
  origin: (origin, callback) => { callback(null, true); },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key', 'x-admin-key', 'stripe-signature'],
  credentials: true,
}));
app.use(express.json());

const openClawApiEndpoint = process.env.OPENCLAW_API_ENDPOINT;
const openClawApiKey      = process.env.OPENCLAW_API_KEY;
const ai                  = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID  || '';
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN   || '';
const TWILIO_FROM_NUMBER  = process.env.TWILIO_FROM_NUMBER  || '+18335580877';
const BACKEND_URL         = process.env.BACKEND_URL         || 'https://plumblead-production.up.railway.app';

const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  'price_1THvKdDATJBYD8CNUCHZNQ8B': 'starter',
  'price_1THvH7DATJBYD8CNVP8UjHVM': 'pro',
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

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
      CREATE TABLE IF NOT EXISTS contractors (
        client_id  TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        active     BOOLEAN NOT NULL DEFAULT true,
        plan       TEXT NOT NULL DEFAULT 'trial',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notes      TEXT
      );
      CREATE INDEX IF NOT EXISTS leads_client_id ON leads ((payload->>'clientId'));
      CREATE INDEX IF NOT EXISTS leads_source    ON leads ((payload->>'source'));
      CREATE INDEX IF NOT EXISTS leads_status    ON leads (status);
    `);
    await pool.query(`
      ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS phone                TEXT,
        ADD COLUMN IF NOT EXISTS callback_phone       TEXT,
        ADD COLUMN IF NOT EXISTS email                TEXT,
        ADD COLUMN IF NOT EXISTS address              TEXT,
        ADD COLUMN IF NOT EXISTS city                 TEXT,
        ADD COLUMN IF NOT EXISTS state                TEXT,
        ADD COLUMN IF NOT EXISTS zip_codes            TEXT,
        ADD COLUMN IF NOT EXISTS crm_system           TEXT,
        ADD COLUMN IF NOT EXISTS bilingual            BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS services             JSONB,
        ADD COLUMN IF NOT EXISTS dashboard_code       TEXT,
        ADD COLUMN IF NOT EXISTS subscription_status  TEXT NOT NULL DEFAULT 'trial',
        ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
        ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
        ADD COLUMN IF NOT EXISTS twilio_number        TEXT,
        ADD COLUMN IF NOT EXISTS missed_call_sms      BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS business_hours       JSONB;
    `);
    await pool.query(`
      INSERT INTO contractors (client_id, client_name, active, plan)
      VALUES
        ('demo', 'Demo Contractor', true, 'trial'),
        ('promax-water-heaters', 'ProMax Water Heaters & Plumbing', true, 'trial'),
        ('gps-plumbing', 'GPS Plumbing Inc.', true, 'trial')
      ON CONFLICT (client_id) DO NOTHING;
    `);
    await pool.query(`
      UPDATE contractors
      SET dashboard_code = client_id || '-' || EXTRACT(YEAR FROM NOW())::TEXT
      WHERE dashboard_code IS NULL;
    `);
    console.log('Database ready.');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

interface StoredLead {
  id: string; receivedAt: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';
  jobValue?: number; statusNote?: string; statusUpdatedAt?: string;
  [key: string]: unknown;
}

function rowToLead(row: Record<string, unknown>): StoredLead {
  const payload = (row.payload as Record<string, unknown>) || {};
  return {
    ...payload, id: row.id as string, receivedAt: row.received_at as string,
    status: row.status as StoredLead['status'],
    ...(row.job_value != null  && { jobValue: Number(row.job_value) }),
    ...(row.status_note        && { statusNote: row.status_note as string }),
    ...(row.status_updated_at  && { statusUpdatedAt: row.status_updated_at as string }),
  };
}

async function saveLead(payload: Record<string, unknown>): Promise<StoredLead> {
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await pool.query(`INSERT INTO leads (id, payload) VALUES ($1, $2)`, [id, JSON.stringify(payload)]);
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
  const dataRes = await pool.query(`SELECT * FROM leads ${where} ORDER BY received_at DESC LIMIT $${i++} OFFSET $${i++}`, values);
  return { leads: dataRes.rows.map(rowToLead), total };
}

async function patchLead(id: string, update: { status?: string; jobValue?: number; statusNote?: string }): Promise<StoredLead | null> {
  const sets: string[] = []; const values: unknown[] = []; let i = 1;
  if (update.status     != null) { sets.push(`status = $${i++}`);      values.push(update.status); }
  if (update.jobValue   != null) { sets.push(`job_value = $${i++}`);   values.push(update.jobValue); }
  if (update.statusNote != null) { sets.push(`status_note = $${i++}`); values.push(update.statusNote); }
  sets.push(`status_updated_at = NOW()`);
  values.push(id);
  const res = await pool.query(`UPDATE leads SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, values);
  if (!res.rows.length) return null;
  return rowToLead(res.rows[0]);
}

async function getContractorStatus(clientId: string): Promise<{ active: boolean; subscriptionStatus: string; callbackPhone: string | null }> {
  if (!clientId || clientId === 'demo') return { active: true, subscriptionStatus: 'active', callbackPhone: null };
  try {
    const res = await pool.query(`SELECT active, subscription_status, callback_phone FROM contractors WHERE client_id = $1`, [clientId]);
    if (!res.rows.length) return { active: true, subscriptionStatus: 'active', callbackPhone: null };
    return { active: res.rows[0].active === true, subscriptionStatus: res.rows[0].subscription_status || 'trial', callbackPhone: res.rows[0].callback_phone || null };
  } catch { return { active: true, subscriptionStatus: 'active', callbackPhone: null }; }
}

// ─── Business hours check ─────────────────────────────────────────────────────
// Returns true if current time is within contractor's business hours
function isWithinBusinessHours(businessHours: any): boolean {
  if (!businessHours?.enabled) return true; // no hours set = always in-hours
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const timeStr = now.toTimeString().slice(0, 5); // "HH:MM"

  let schedule: { enabled?: boolean; start: string; end: string } | null = null;
  if (day >= 1 && day <= 5) {
    schedule = { enabled: true, ...businessHours.weekdays };
  } else if (day === 6) {
    schedule = businessHours.saturday;
  } else if (day === 0) {
    schedule = businessHours.sunday;
  }

  if (!schedule || !schedule.enabled) return false; // day not covered = out of hours
  return timeStr >= schedule.start && timeStr <= schedule.end;
}

// ─── Twilio SMS helper ────────────────────────────────────────────────────────
async function sendTwilioSms(to: string, body: string, from: string = TWILIO_FROM_NUMBER): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) { console.error('Twilio credentials not configured'); return; }
  const cleanTo = to.replace(/\D/g, '');
  const e164To = cleanTo.startsWith('1') ? `+${cleanTo}` : `+1${cleanTo}`;
  const params = new URLSearchParams({ To: e164To, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64') },
    body: params.toString(),
  });
  if (!response.ok) { const err = await response.text(); console.error('Twilio SMS error:', err); }
  else { console.log(`SMS sent to ${e164To}`); }
}

const ADMIN_KEY = process.env.DASHBOARD_ADMIN_KEY || 'plumblead-admin-2026';
function requireAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.json({ status: 'ok', db: 'not connected', timestamp: new Date().toISOString() }); }
});

// ─── Contractor status (widget) ───────────────────────────────────────────────
app.get('/api/contractor-status', async (req, res) => {
  const clientId = (req.query.clientId as string || 'demo').trim();
  try {
    const status = await getContractorStatus(clientId);
    res.json({ active: status.active, subscriptionStatus: status.subscriptionStatus, callbackPhone: status.active ? null : status.callbackPhone });
  } catch { res.json({ active: true, subscriptionStatus: 'active', callbackPhone: null }); }
});

// ─── Dashboard auth ───────────────────────────────────────────────────────────
app.get('/api/auth/dashboard', async (req, res) => {
  const code = (req.query.code as string || '').trim();
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    const result = await pool.query(`SELECT client_id, client_name, active, plan, subscription_status FROM contractors WHERE dashboard_code = $1`, [code]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid access code' });
    const row = result.rows[0];
    if (!row.active) return res.status(403).json({ error: 'Account paused. Contact PlumbLead support.' });
    res.json({ clientId: row.client_id, label: row.client_name, plan: row.plan || 'trial', subscriptionStatus: row.subscription_status || 'trial' });
  } catch (err) { console.error('Dashboard auth error:', err); res.status(500).json({ error: 'Auth failed' }); }
});

// ─── Contractor call settings (GET) — used by dashboard Call Settings tab ─────
app.get('/api/contractors/:clientId/settings', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  try {
    const result = await pool.query(
      `SELECT phone, callback_phone, twilio_number, missed_call_sms, business_hours FROM contractors WHERE client_id = $1`,
      [clientId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch settings.' }); }
});

// ─── Contractor call settings (PATCH) — used by dashboard Call Settings tab ───
app.patch('/api/contractors/:clientId/call-settings', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  const { callback_phone, missed_call_sms, business_hours } = req.body;
  try {
    const result = await pool.query(
      `UPDATE contractors
       SET callback_phone = COALESCE($1, callback_phone),
           missed_call_sms = COALESCE($2, missed_call_sms),
           business_hours = COALESCE($3, business_hours)
       WHERE client_id = $4
       RETURNING phone, callback_phone, twilio_number, missed_call_sms, business_hours`,
      [callback_phone || null, missed_call_sms ?? null, business_hours ? JSON.stringify(business_hours) : null, clientId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error('Call settings update error:', err); res.status(500).json({ error: 'Failed to update call settings.' }); }
});

// ─── Stripe webhook ───────────────────────────────────────────────────────────
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: any;
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try { const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET); }
    catch (err: any) { console.error('Stripe webhook signature failed:', err.message); return res.status(400).json({ error: 'Invalid signature' }); }
  } else {
    try { event = JSON.parse(req.body.toString()); }
    catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  const obj = event.data?.object;
  const customerId = obj?.customer;
  const priceId = obj?.items?.data?.[0]?.price?.id || obj?.plan?.id;
  const subId = obj?.id;
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const plan = STRIPE_PRICE_TO_PLAN[priceId] || 'starter';
        const subStatus = obj.status === 'active' ? 'active' : 'past_due';
        await pool.query(`UPDATE contractors SET plan=$1,subscription_status=$2,active=true,stripe_customer_id=$3,stripe_subscription_id=$4 WHERE stripe_customer_id=$3 OR stripe_subscription_id=$4`, [plan, subStatus, customerId, subId]);
        console.log(`Stripe: ${event.type} — plan=${plan}, status=${subStatus}`);
        break;
      }
      case 'customer.subscription.deleted':
        await pool.query(`UPDATE contractors SET subscription_status='cancelled',active=false WHERE stripe_customer_id=$1 OR stripe_subscription_id=$2`, [customerId, subId]);
        break;
      case 'invoice.payment_failed':
        await pool.query(`UPDATE contractors SET subscription_status='past_due' WHERE stripe_customer_id=$1`, [customerId]);
        break;
    }
  } catch (err) { console.error('Stripe webhook DB error:', err); }
  res.json({ received: true });
});

// ─── Voice: Incoming call ─────────────────────────────────────────────────────
// Twilio fires this when a homeowner calls the contractor's PlumbLead number.
// If within business hours (or no hours set): ring contractor's real phone.
// If outside business hours AND afterHoursMode === 'sms_only': skip ring, go straight to missed.
app.post('/api/voice/incoming', async (req, res) => {
  const calledNumber = (req.body.To || '').replace(/\D/g, '');
  let contractor: any = null;
  try {
    const result = await pool.query(
      `SELECT client_id, client_name, callback_phone, missed_call_sms, business_hours
       FROM contractors
       WHERE REGEXP_REPLACE(twilio_number, '\\D', '', 'g') = $1 AND active = true`,
      [calledNumber]
    );
    if (result.rows.length) contractor = result.rows[0];
  } catch (err) { console.error('Voice lookup error:', err); }

  const forwardTo = contractor?.callback_phone?.replace(/\D/g, '') || null;
  const businessHours = contractor?.business_hours || null;
  const callerNumber = req.body.From || '';
  const clientId = contractor?.client_id || '';
  const missedUrl = `${BACKEND_URL}/api/voice/missed?clientId=${encodeURIComponent(clientId)}&callerNumber=${encodeURIComponent(callerNumber)}`;

  res.set('Content-Type', 'text/xml');

  if (!forwardTo) {
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling. We were unable to connect your call. Please try again shortly.</Say></Response>`);
    return;
  }

  // Check business hours — if outside hours and mode is sms_only, skip ring entirely
  const inHours = isWithinBusinessHours(businessHours);
  const afterHoursMode = businessHours?.afterHoursMode || 'ring_then_sms';

  if (!inHours && afterHoursMode === 'sms_only') {
    // Outside hours, skip ring — fire missed call handler immediately via redirect
    console.log(`After-hours call for ${clientId} — skipping ring, firing SMS`);
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${missedUrl}&amp;dialStatus=no-answer</Redirect>
</Response>`);
    return;
  }

  // Ring contractor's real phone. On no-answer, fire missed.
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20" action="${missedUrl}" method="POST">
    <Number>${forwardTo}</Number>
  </Dial>
</Response>`);
});

// ─── Voice: Missed call ───────────────────────────────────────────────────────
app.post('/api/voice/missed', async (req, res) => {
  const { clientId, callerNumber } = req.query as Record<string, string>;
  const dialStatus = req.body.DialCallStatus || req.query.dialStatus || '';

  if (['completed', 'in-progress'].includes(dialStatus)) {
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    return;
  }

  let contractorName = 'Your plumber';
  let quoteUrl = 'https://plumblead.ai/quote';

  try {
    if (clientId) {
      const result = await pool.query(`SELECT client_name, client_id, missed_call_sms FROM contractors WHERE client_id = $1`, [clientId]);
      if (result.rows.length && result.rows[0].missed_call_sms) {
        contractorName = result.rows[0].client_name;
        quoteUrl = `https://plumblead.ai/quote?client=${encodeURIComponent(result.rows[0].client_id)}`;
      } else if (result.rows.length && !result.rows[0].missed_call_sms) {
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
        return;
      }
    }
  } catch (err) { console.error('Missed call lookup error:', err); }

  const callerDigits = (callerNumber || '').replace(/\D/g, '');
  if (callerDigits.length >= 10) {
    const smsBody = `Hi! We missed your call at ${contractorName}. Get an instant quote online in under 60 seconds — no wait, no hold music: ${quoteUrl}`;
    try {
      await sendTwilioSms(callerDigits, smsBody);
      await saveLead({ phone: callerDigits, source: 'missed-call', clientId: clientId || 'unknown', submittedAt: new Date().toISOString(), dialStatus });
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) fetch(n8nUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: callerDigits, source: 'missed-call', clientId: clientId || 'unknown', submittedAt: new Date().toISOString() }) }).catch(err => console.error('n8n missed call error:', err));
      console.log(`Missed call SMS sent to ${callerDigits} for clientId=${clientId}`);
    } catch (err) { console.error('Missed call SMS error:', err); }
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

// ─── Provision Twilio number ──────────────────────────────────────────────────
app.post('/api/contractors/:clientId/provision-number', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  const { areaCode } = req.body;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return res.status(500).json({ error: 'Twilio credentials not configured.' });
  try {
    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const searchParams = new URLSearchParams({ AreaCode: areaCode || '833', SmsEnabled: 'true', VoiceEnabled: 'true' });
    const searchRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json?${searchParams}`, { headers: { 'Authorization': authHeader } });
    const searchData = await searchRes.json() as any;
    if (!searchData.available_phone_numbers?.length) return res.status(404).json({ error: `No numbers available for area code ${areaCode}.` });
    const numberToBuy = searchData.available_phone_numbers[0].phone_number;
    const buyParams = new URLSearchParams({ PhoneNumber: numberToBuy, VoiceUrl: `${BACKEND_URL}/api/voice/incoming`, VoiceMethod: 'POST', FriendlyName: `PlumbLead - ${clientId}` });
    const buyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`, { method: 'POST', headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' }, body: buyParams.toString() });
    const buyData = await buyRes.json() as any;
    if (!buyData.phone_number) return res.status(500).json({ error: 'Failed to purchase Twilio number.', detail: buyData });
    await pool.query(`UPDATE contractors SET twilio_number=$1, missed_call_sms=true WHERE client_id=$2`, [buyData.phone_number, clientId]);
    console.log(`Provisioned ${buyData.phone_number} for ${clientId}`);
    res.json({ message: 'Number provisioned.', twilioNumber: buyData.phone_number, clientId, nextStep: `Give ${buyData.phone_number} to the contractor for their website and Google Business profile.` });
  } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to provision number.' }); }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [], lang = 'en', sessionId = 'plumblead-user' } = req.body;
  const isSpanish = lang === 'es';
  const systemInstruction = `You are a friendly plumbing assistant for PlumbLead.ai. Your job is to quickly qualify the homeowner's issue and guide them to get a free quote.\n\nSTRICT RULES:\n- Keep responses SHORT — 2-4 sentences maximum. Never use headers, bullet points, or long lists.\n- Ask ONE clarifying question per response to narrow down the problem.\n- After 1-2 exchanges, encourage them to use the Instant Quote tool for a free estimate.\n- Be warm and helpful, not clinical or encyclopedic.\n- Never break character or mention other AI systems.\n- IMPORTANT: Respond entirely in ${isSpanish ? 'Spanish' : 'English'}.`;

  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const openClawMessages = [{ role: 'system', content: systemInstruction }, ...history.map((m: any) => ({ role: m.role, content: m.content })), { role: 'user', content: message }];
      const response = await fetch(openClawApiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` }, body: JSON.stringify({ model: 'openclaw:plumblead', messages: openClawMessages, user: sessionId }) });
      if (response.ok) { const result = await response.json() as any; const chatbotResponse = result.choices?.[0]?.message?.content || result.output; if (chatbotResponse) return res.json({ response: chatbotResponse }); }
    } catch (err) { console.error('OpenClaw error:', err); }
  }

  try {
    const historyContents = (history as any[]).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const firstUserText = historyContents.length === 0 ? `${systemInstruction}\n\nHomeowner: ${message}` : `${systemInstruction}\n\nHomeowner: ${historyContents[0]?.parts[0]?.text}`;
    const contents = historyContents.length === 0 ? [{ role: 'user', parts: [{ text: firstUserText }] }] : [{ role: 'user', parts: [{ text: firstUserText }] }, ...historyContents.slice(1), { role: 'user', parts: [{ text: message }] }];
    const geminiResponse = await ai.models.generateContent({ model: process.env.PLUMBLEAD_QUOTE_AI_MODEL || 'gemini-2.0-flash', contents });
    return res.json({ response: geminiResponse.text ?? "I'm sorry, I couldn't process that right now." });
  } catch (error) { console.error('Gemini chat error:', error); return res.status(500).json({ error: 'Failed to get chatbot response.' }); }
});

async function qualifyLeadWithGemini(serviceType: string, details: string, location: string): Promise<{ leadScore: string; crossSellOpportunities: string[] }> {
  const prompt = `You are a plumbing lead qualifier. Return ONLY a JSON object with no markdown:\n{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["array", "of", "strings"] }\nService: ${serviceType}\nDetails: ${details}\nLocation: ${location}`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    const text = (response.text ?? '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(text);
    return { leadScore: parsed.leadScore || 'Routine', crossSellOpportunities: Array.isArray(parsed.crossSellOpportunities) ? parsed.crossSellOpportunities : [] };
  } catch { return { leadScore: serviceType.toLowerCase().includes('emergency') || serviceType.toLowerCase().includes('leak') ? 'High Urgency' : 'Routine', crossSellOpportunities: [] }; }
}

app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };
  let leadScore = '', crossSellOpportunities: string[] = [], refinedDetails = details;
  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Return ONLY valid JSON:\n{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["string"], "geminiPromptRefinement": "optional" }\nService: ${serviceType}\nDetails: ${details}\nLocation: ${location}`;
      const openClawResponse = await fetch(openClawApiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` }, body: JSON.stringify({ model: 'openclaw:plumblead', messages: [{ role: 'system', content: 'You are a plumbing lead qualifier. Return only valid JSON.' }, { role: 'user', content: qualificationPrompt }], user: sessionId }) });
      if (openClawResponse.ok) {
        const openClawResult = await openClawResponse.json() as any;
        const raw = (openClawResult.choices?.[0]?.message?.content || openClawResult.output || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        if (raw) { const parsed = JSON.parse(raw); if (parsed.leadScore) leadScore = parsed.leadScore; if (Array.isArray(parsed.crossSellOpportunities)) crossSellOpportunities = parsed.crossSellOpportunities; if (parsed.geminiPromptRefinement) refinedDetails = `${details}\n\nAdditional context: ${parsed.geminiPromptRefinement}`; }
      }
    } catch (err) { console.error('OpenClaw qualification error:', err); }
  }
  if (!leadScore) { try { const q = await qualifyLeadWithGemini(serviceType, details, location); leadScore = q.leadScore; crossSellOpportunities = q.crossSellOpportunities; } catch { leadScore = 'Routine'; } }
  try { const quoteResponse: QuoteResponse = await generateAIQuote({ ...quoteRequest, details: refinedDetails }); return res.json({ ...quoteResponse, leadScore, crossSellOpportunities }); }
  catch (error) { return res.status(500).json({ error: 'Failed to generate quote.', leadScore, crossSellOpportunities }); }
});

app.post('/api/leads', async (req, res) => {
  const clientId = req.body.clientId || 'demo';
  const status = await getContractorStatus(clientId);
  if (!status.active || status.subscriptionStatus === 'cancelled') return res.status(403).json({ error: 'Service unavailable', message: 'This service is currently paused.', callbackPhone: status.callbackPhone });
  let stored: StoredLead;
  try { stored = await saveLead(req.body); }
  catch (err) { console.error('Failed to save lead:', err); return res.json({ message: 'Lead received.' }); }
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) fetch(n8nWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...req.body, leadId: stored.id }) }).catch(err => console.error('n8n forward error:', err));
  res.json({ message: 'Lead received.', leadId: stored.id });
});

app.get('/api/leads', requireAdminKey, async (req, res) => {
  const { clientId, status, source, limit = '200', offset = '0' } = req.query as Record<string, string>;
  try { const result = await queryLeads({ clientId: clientId === '__all__' ? undefined : clientId, status, source, limit: Math.min(parseInt(limit), 500), offset: parseInt(offset) }); res.json(result); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch leads.' }); }
});

app.patch('/api/leads/:id', requireAdminKey, async (req, res) => {
  const { id } = req.params;
  const { status, jobValue, statusNote } = req.body;
  try { const updated = await patchLead(id, { status, jobValue, statusNote }); if (!updated) return res.status(404).json({ error: 'Lead not found' }); res.json({ lead: updated }); }
  catch (err) { res.status(500).json({ error: 'Failed to update lead.' }); }
});

app.get('/api/contractors', requireAdminKey, async (_req, res) => {
  try { const result = await pool.query(`SELECT * FROM contractors ORDER BY created_at DESC`); res.json({ contractors: result.rows }); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch contractors.' }); }
});

app.post('/api/contractors', requireAdminKey, async (req, res) => {
  const { clientId, companyName, phone, callbackPhone, email, address, city, state, zipCodes, crmSystem, bilingual, plan, services, notes } = req.body;
  if (!clientId || !companyName || !phone) return res.status(400).json({ error: 'clientId, companyName, and phone are required.' });
  const dashboardCode = `${clientId}-${new Date().getFullYear()}`;
  try {
    const result = await pool.query(
      `INSERT INTO contractors (client_id,client_name,active,plan,subscription_status,phone,callback_phone,email,address,city,state,zip_codes,crm_system,bilingual,services,notes,dashboard_code)
       VALUES ($1,$2,true,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (client_id) DO UPDATE SET client_name=EXCLUDED.client_name,plan=EXCLUDED.plan,phone=EXCLUDED.phone,callback_phone=EXCLUDED.callback_phone,email=EXCLUDED.email,address=EXCLUDED.address,city=EXCLUDED.city,state=EXCLUDED.state,zip_codes=EXCLUDED.zip_codes,crm_system=EXCLUDED.crm_system,bilingual=EXCLUDED.bilingual,services=EXCLUDED.services,notes=EXCLUDED.notes,dashboard_code=COALESCE(contractors.dashboard_code,EXCLUDED.dashboard_code)
       RETURNING *`,
      [clientId, companyName, plan || 'trial', phone, callbackPhone || phone, email || null, address || null, city || null, state || null, zipCodes || null, crmSystem || null, bilingual || false, JSON.stringify(services || []), notes || null, dashboardCode]
    );
    res.json({ contractor: result.rows[0] });
  } catch (err) { console.error('Contractor create error:', err); res.status(500).json({ error: 'Failed to save contractor.' }); }
});

app.patch('/api/contractors/:clientId', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  const allowed = ['active','plan','subscription_status','notes','phone','callback_phone','email','city','state','zip_codes','crm_system','bilingual','missed_call_sms'];
  const sets: string[] = []; const values: unknown[] = []; let i = 1;
  for (const col of allowed) { if (req.body[col] !== undefined) { sets.push(`${col} = $${i++}`); values.push(req.body[col]); } }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(clientId);
  try { const result = await pool.query(`UPDATE contractors SET ${sets.join(', ')} WHERE client_id = $${i} RETURNING *`, values); if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' }); res.json({ contractor: result.rows[0] }); }
  catch (err) { res.status(500).json({ error: 'Failed to update contractor.' }); }
});

app.post('/api/contractors/:clientId/dashboard-code', requireAdminKey, async (req, res) => {
  const { clientId } = req.params; const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: 'code is required' });
  try {
    const existing = await pool.query(`SELECT client_id FROM contractors WHERE dashboard_code=$1 AND client_id!=$2`, [code.trim(), clientId]);
    if (existing.rows.length) return res.status(409).json({ error: 'Code already in use.' });
    const result = await pool.query(`UPDATE contractors SET dashboard_code=$1 WHERE client_id=$2 RETURNING dashboard_code`, [code.trim(), clientId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' });
    res.json({ dashboard_code: result.rows[0].dashboard_code });
  } catch (err) { res.status(500).json({ error: 'Failed to update dashboard code.' }); }
});

app.post('/api/contractors/:clientId/disable', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  try { await pool.query(`UPDATE contractors SET active=false,subscription_status='cancelled' WHERE client_id=$1`, [clientId]); res.json({ message: `${clientId} disabled.` }); }
  catch (err) { res.status(500).json({ error: 'Failed to disable contractor.' }); }
});

app.post('/api/contractors/:clientId/enable', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  try { await pool.query(`UPDATE contractors SET active=true,subscription_status='active' WHERE client_id=$1`, [clientId]); res.json({ message: `${clientId} re-enabled.` }); }
  catch (err) { res.status(500).json({ error: 'Failed to enable contractor.' }); }
});

app.post('/api/scrape-contractor', requireAdminKey, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlumbLeadBot/1.0)' } });
    if (!pageRes.ok) throw new Error(`Failed to fetch URL: ${pageRes.status}`);
    const html = await pageRes.text();
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000);
    const prompt = `Extract plumbing contractor info. Return ONLY valid JSON:\n{"companyName":null,"phone":null,"email":null,"address":null,"city":null,"state":null,"zipCodes":null,"services":[],"notes":null}\n\nContent:\n${text}`;
    const geminiRes = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    const raw = (geminiRes.text ?? '').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
    res.json(JSON.parse(raw));
  } catch (err: any) { res.status(500).json({ error: err.message || 'Scrape failed.' }); }
});

initDb().then(() => {
  app.listen(port, () => console.log(`PlumbLead.ai server running on port ${port}`));
});
