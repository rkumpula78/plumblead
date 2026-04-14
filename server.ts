import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import { buildPlumberBrief, PlumberBrief } from './src/services/aquaopsService';
import fetch from 'node-fetch';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

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
const TWILIO_FROM_NUMBER  = process.env.TWILIO_FROM_NUMBER  || '+16232632823';
const BACKEND_URL         = process.env.BACKEND_URL         || 'https://plumblead-production.up.railway.app';
const FRONTEND_URL        = process.env.FRONTEND_URL        || 'https://plumblead.ai';

const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  'price_1THvKdDATJBYD8CNUCHZNQ8B': 'starter',
  'price_1THvH7DATJBYD8CNVP8UjHVM': 'pro',
  'price_1TJoOyDATJBYD8CNQiijLaxf': 'agency',
};
const PLAN_TO_PRICE_ID: Record<string, string> = {
  starter: 'price_1THvKdDATJBYD8CNUCHZNQ8B',
  pro:     'price_1THvH7DATJBYD8CNVP8UjHVM',
  agency:  'price_1TJoOyDATJBYD8CNQiijLaxf',
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

// ─── Water data loader ────────────────────────────────────────────────────────
// Loads AZ + WA water data at startup; builds a flat zip-keyed lookup map.
// Handles three JSON shapes:
//   1. Flat zip-keyed:  { "85383": { hardness_gpg: {...}, ... }, ... }
//   2. Array:           [ { zip: "85383", ... }, ... ]
//   3. City-keyed:      { cities: { phoenix: { zip_codes: ["85001",...], hardness_gpg: {...} } } }
let waterDataByZip: Record<string, any> = {};

function loadWaterData() {
  try {
    const azPath = path.join(__dirname, 'src/data/az-water-data.json');
    const waPath = path.join(__dirname, 'src/data/wa-water-data.json');
    const azRaw  = fs.existsSync(azPath) ? JSON.parse(fs.readFileSync(azPath, 'utf8')) : {};
    const waRaw  = fs.existsSync(waPath) ? JSON.parse(fs.readFileSync(waPath, 'utf8')) : {};

    const normalize = (raw: any): Record<string, any> => {
      // Shape 1: array of records with zip field
      if (Array.isArray(raw)) {
        return Object.fromEntries(raw.map((r: any) => [String(r.zip || r.zip_code || r.zipCode), r]));
      }
      // Shape 2: city-keyed object with cities map and zip_codes arrays per city
      if (raw && typeof raw === 'object' && raw.cities && typeof raw.cities === 'object') {
        const result: Record<string, any> = {};
        for (const [, cityData] of Object.entries(raw.cities as Record<string, any>)) {
          const zips: string[] = cityData.zip_codes || [];
          // Build a flat record for each zip — strip the zip_codes array to avoid bloat
          const { zip_codes: _zc, ...cityRecord } = cityData;
          for (const zip of zips) {
            result[String(zip)] = cityRecord;
          }
        }
        return result;
      }
      // Shape 3: already flat zip-keyed object
      return raw;
    };

    waterDataByZip = { ...normalize(azRaw), ...normalize(waRaw) };
    console.log(`Water data loaded: ${Object.keys(waterDataByZip).length} zip codes`);
  } catch (err) {
    console.warn('Failed to load water data:', err);
  }
}

// ─── DB init ──────────────────────────────────────────────────────────────────
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

function isWithinBusinessHours(businessHours: any): boolean {
  if (!businessHours?.enabled) return true;
  const now = new Date();
  const day = now.getDay();
  const timeStr = now.toTimeString().slice(0, 5);
  let schedule: { enabled?: boolean; start: string; end: string } | null = null;
  if (day >= 1 && day <= 5) { schedule = { enabled: true, ...businessHours.weekdays }; }
  else if (day === 6) { schedule = businessHours.saturday; }
  else if (day === 0) { schedule = businessHours.sunday; }
  if (!schedule || !schedule.enabled) return false;
  return timeStr >= schedule.start && timeStr <= schedule.end;
}

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
  else { console.log(`SMS sent to ${e164To} from ${from}`); }
}

const ADMIN_KEY = process.env.DASHBOARD_ADMIN_KEY || 'plumblead-admin-2026';
function requireAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ─── Build enriched plumber SMS ───────────────────────────────────────────────
function buildPlumberSms(
  lead: Record<string, any>,
  brief: PlumberBrief | null
): string {
  const name       = lead.name        || 'New lead';
  const phone      = lead.phone       || '';
  const service    = lead.serviceLabel || lead.serviceType || 'Plumbing';
  const urgency    = lead.urgency      || '';
  const zip        = lead.zipCode      || lead.zip || '';
  const score      = lead.leadScore    || '';
  const dashUrl    = `${FRONTEND_URL}/dashboard`;

  const urgencyTag = urgency === 'emergency' ? '🚨 EMERGENCY' :
                     urgency === 'soon'      ? '⚡ Soon'      : '📋 Routine';

  let sms = `${urgencyTag} — ${service}\n`;
  sms    += `${name} | ${phone} | ${zip}`;
  if (score) sms += ` | ${score}`;
  sms    += '\n';

  if (brief?.waterProfile && brief.waterProfile.hardness_gpg > 0) {
    const wp = brief.waterProfile;
    sms += `\nWater: ${wp.hardness_gpg} GPG ${wp.hardness_label}`;
    if (wp.pfas_concern)       sms += ' · PFAS';
    if (wp.chloramine_concern) sms += ' · Chloramine';
    if (wp.arsenic_concern)    sms += ' · Arsenic';
  } else if (brief?.waterProfile && brief.waterProfile.primary_issues.length) {
    sms += `\nWater issues: ${brief.waterProfile.primary_issues.slice(0, 2).join(', ')}`;
  }

  if (brief?.primaryRecommendation) {
    const p = brief.primaryRecommendation;
    sms += `\nRec: ${p.name}`;
    sms += `\nDealer: $${p.dealer_price} | Retail: $${p.retail_low}–$${p.retail_high}`;
    sms += `\nOrder: ${p.order_url}`;
  }

  sms += `\n\nDashboard: ${dashUrl}`;
  return sms;
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok', db: 'connected',
      timestamp: new Date().toISOString(),
      smsFrom: TWILIO_FROM_NUMBER,
      waterZips: Object.keys(waterDataByZip).length,
      aquaops: process.env.H3AQUAOPS_API_PASS ? 'configured' : 'local-catalog',
    });
  } catch {
    res.json({ status: 'ok', db: 'not connected', timestamp: new Date().toISOString() });
  }
});

// ─── Contractor status ────────────────────────────────────────────────────────
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

// ─── Contractor call settings GET ─────────────────────────────────────────────
app.get('/api/contractors/:clientId/settings', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  try {
    const result = await pool.query(`SELECT phone, callback_phone, twilio_number, missed_call_sms, business_hours FROM contractors WHERE client_id = $1`, [clientId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to fetch settings.' }); }
});

// ─── Contractor call settings PATCH ──────────────────────────────────────────
app.patch('/api/contractors/:clientId/call-settings', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  const { callback_phone, missed_call_sms, business_hours } = req.body;
  try {
    const result = await pool.query(
      `UPDATE contractors SET callback_phone=COALESCE($1,callback_phone), missed_call_sms=COALESCE($2,missed_call_sms), business_hours=COALESCE($3,business_hours) WHERE client_id=$4 RETURNING phone,callback_phone,twilio_number,missed_call_sms,business_hours`,
      [callback_phone||null, missed_call_sms??null, business_hours?JSON.stringify(business_hours):null, clientId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contractor not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error('Call settings error:', err); res.status(500).json({ error: 'Failed to update.' }); }
});

// ─── Stripe: Create checkout session ─────────────────────────────────────────
app.post('/api/stripe/checkout', async (req, res) => {
  const { clientId, plan, email } = req.body;
  if (!clientId || !plan) return res.status(400).json({ error: 'clientId and plan are required.' });
  const priceId = PLAN_TO_PRICE_ID[plan];
  if (!priceId) return res.status(400).json({ error: `Plan '${plan}' is not configured. Contact support.` });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured.' });
  try {
    const stripe = require('stripe')(stripeKey);
    const contractorRes = await pool.query(`SELECT client_name, email AS contractor_email, stripe_customer_id FROM contractors WHERE client_id = $1`, [clientId]);
    const contractor = contractorRes.rows[0];
    if (!contractor) return res.status(404).json({ error: 'Contractor not found. Complete onboarding first.' });
    let customerId: string | undefined = contractor.stripe_customer_id || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: email || contractor.contractor_email || undefined, name: contractor.client_name, metadata: { clientId } });
      customerId = customer.id;
      await pool.query(`UPDATE contractors SET stripe_customer_id=$1 WHERE client_id=$2`, [customerId, clientId]);
      console.log(`Stripe: created customer ${customerId} for ${clientId}`);
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId, mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { clientId, plan },
      subscription_data: { metadata: { clientId, plan } },
      success_url: `${FRONTEND_URL}/checkout/success?clientId=${encodeURIComponent(clientId)}&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/checkout?clientId=${encodeURIComponent(clientId)}&cancelled=true`,
      allow_promotion_codes: true,
    });
    console.log(`Stripe checkout session created for ${clientId} (${plan}): ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) { console.error('Stripe checkout error:', err); res.status(500).json({ error: err.message || 'Failed to create checkout session.' }); }
});

// ─── Stripe: Webhook ──────────────────────────────────────────────────────────
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: any;
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try { const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET); }
    catch (err: any) { console.error('Stripe webhook sig failed:', err.message); return res.status(400).json({ error: 'Invalid signature' }); }
  } else {
    try { event = JSON.parse(req.body.toString()); }
    catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  const obj = event.data?.object;
  const customerId = obj?.customer;
  const priceId = obj?.items?.data?.[0]?.price?.id || obj?.plan?.id;
  const subId = obj?.id;
  const metaClientId = obj?.metadata?.clientId || obj?.subscription_data?.metadata?.clientId;
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const plan = STRIPE_PRICE_TO_PLAN[priceId] || 'starter';
        const subStatus = obj.status === 'active' ? 'active' : 'past_due';
        if (metaClientId) {
          await pool.query(`UPDATE contractors SET plan=$1, subscription_status=$2, active=true, stripe_customer_id=$3, stripe_subscription_id=$4 WHERE client_id=$5 OR stripe_customer_id=$3 OR stripe_subscription_id=$4`, [plan, subStatus, customerId, subId, metaClientId]);
        } else {
          await pool.query(`UPDATE contractors SET plan=$1, subscription_status=$2, active=true, stripe_customer_id=$3, stripe_subscription_id=$4 WHERE stripe_customer_id=$3 OR stripe_subscription_id=$4`, [plan, subStatus, customerId, subId]);
        }
        console.log(`Stripe: ${event.type} — clientId=${metaClientId||'unknown'}, plan=${plan}, status=${subStatus}`);
        break;
      }
      case 'customer.subscription.deleted':
        await pool.query(`UPDATE contractors SET subscription_status='cancelled', active=false WHERE stripe_customer_id=$1 OR stripe_subscription_id=$2`, [customerId, subId]);
        console.log(`Stripe: subscription deleted — customer=${customerId}`);
        break;
      case 'invoice.payment_failed':
        await pool.query(`UPDATE contractors SET subscription_status='past_due' WHERE stripe_customer_id=$1`, [customerId]);
        console.log(`Stripe: payment failed — customer=${customerId}`);
        break;
      case 'checkout.session.completed': {
        const sessionClientId = obj?.metadata?.clientId;
        const sessionCustomerId = obj?.customer;
        const sessionSubId = obj?.subscription;
        if (sessionClientId && sessionCustomerId) {
          await pool.query(`UPDATE contractors SET stripe_customer_id=$1, stripe_subscription_id=COALESCE($2, stripe_subscription_id) WHERE client_id=$3`, [sessionCustomerId, sessionSubId||null, sessionClientId]);
          console.log(`Stripe: checkout complete — linked ${sessionClientId} to customer ${sessionCustomerId}`);
        }
        break;
      }
    }
  } catch (err) { console.error('Stripe webhook DB error:', err); }
  res.json({ received: true });
});

// ─── Voice: Incoming call ─────────────────────────────────────────────────────
app.post('/api/voice/incoming', async (req, res) => {
  const calledNumber = (req.body.To || '').replace(/\D/g, '');
  let contractor: any = null;
  try {
    const result = await pool.query(`SELECT client_id, client_name, callback_phone, missed_call_sms, business_hours FROM contractors WHERE REGEXP_REPLACE(twilio_number, '\\D', '', 'g') = $1 AND active = true`, [calledNumber]);
    if (result.rows.length) contractor = result.rows[0];
  } catch (err) { console.error('Voice lookup error:', err); }
  const forwardTo = contractor?.callback_phone?.replace(/\D/g, '') || null;
  const businessHours = contractor?.business_hours || null;
  const callerNumber = req.body.From || '';
  const clientId = contractor?.client_id || '';
  const missedUrl = `${BACKEND_URL}/api/voice/missed?clientId=${encodeURIComponent(clientId)}&callerNumber=${encodeURIComponent(callerNumber)}`;
  res.set('Content-Type', 'text/xml');
  if (!forwardTo) { res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling. We were unable to connect your call. Please try again shortly.</Say></Response>`); return; }
  const inHours = isWithinBusinessHours(businessHours);
  const afterHoursMode = businessHours?.afterHoursMode || 'ring_then_sms';
  if (!inHours && afterHoursMode === 'sms_only') {
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${missedUrl}&amp;dialStatus=no-answer</Redirect></Response>`);
    return;
  }
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Dial timeout="20" action="${missedUrl}" method="POST">\n    <Number>${forwardTo}</Number>\n  </Dial>\n</Response>`);
});

// ─── Voice: Missed call ───────────────────────────────────────────────────────
app.post('/api/voice/missed', async (req, res) => {
  const { clientId, callerNumber } = req.query as Record<string, string>;
  const dialStatus = req.body.DialCallStatus || req.query.dialStatus || '';
  if (['completed', 'in-progress'].includes(dialStatus)) { res.set('Content-Type', 'text/xml'); res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`); return; }
  let contractorName = 'Your plumber';
  let quoteUrl = 'https://plumblead.ai/quote';
  try {
    if (clientId) {
      const result = await pool.query(`SELECT client_name, client_id, missed_call_sms FROM contractors WHERE client_id=$1`, [clientId]);
      if (result.rows.length && result.rows[0].missed_call_sms) {
        contractorName = result.rows[0].client_name;
        quoteUrl = `https://plumblead.ai/quote?client=${encodeURIComponent(result.rows[0].client_id)}`;
      } else if (result.rows.length && !result.rows[0].missed_call_sms) {
        res.set('Content-Type', 'text/xml'); res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`); return;
      }
    }
  } catch (err) { console.error('Missed call lookup error:', err); }
  const callerDigits = (callerNumber || '').replace(/\D/g, '');
  if (callerDigits.length >= 10) {
    const smsBody = `Hi! We missed your call at ${contractorName}. Get an instant quote online in under 60 seconds — no wait, no hold music: ${quoteUrl}`;
    try {
      await sendTwilioSms(callerDigits, smsBody);
      await saveLead({ phone: callerDigits, source: 'missed-call', clientId: clientId||'unknown', submittedAt: new Date().toISOString(), dialStatus });
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) fetch(n8nUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ phone:callerDigits, source:'missed-call', clientId:clientId||'unknown', submittedAt:new Date().toISOString() }) }).catch(err=>console.error('n8n error:',err));
    } catch (err) { console.error('Missed call SMS error:', err); }
  }
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

// ─── Provision Twilio number ──────────────────────────────────────────────────
app.post('/api/contractors/:clientId/provision-number', requireAdminKey, async (req, res) => {
  const { clientId } = req.params;
  const { areaCode } = req.body;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return res.status(500).json({ error: 'Twilio not configured.' });
  try {
    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const searchParams = new URLSearchParams({ AreaCode: areaCode||'623', SmsEnabled:'true', VoiceEnabled:'true' });
    const searchRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json?${searchParams}`, { headers:{'Authorization':authHeader} });
    const searchData = await searchRes.json() as any;
    if (!searchData.available_phone_numbers?.length) return res.status(404).json({ error:`No numbers for area code ${areaCode}.` });
    const numberToBuy = searchData.available_phone_numbers[0].phone_number;
    const buyParams = new URLSearchParams({ PhoneNumber:numberToBuy, VoiceUrl:`${BACKEND_URL}/api/voice/incoming`, VoiceMethod:'POST', FriendlyName:`PlumbLead - ${clientId}` });
    const buyRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`, { method:'POST', headers:{'Authorization':authHeader,'Content-Type':'application/x-www-form-urlencoded'}, body:buyParams.toString() });
    const buyData = await buyRes.json() as any;
    if (!buyData.phone_number) return res.status(500).json({ error:'Failed to purchase number.', detail:buyData });
    await pool.query(`UPDATE contractors SET twilio_number=$1, missed_call_sms=true WHERE client_id=$2`, [buyData.phone_number, clientId]);
    res.json({ message:'Number provisioned.', twilioNumber:buyData.phone_number, clientId, nextStep:`Give ${buyData.phone_number} to the contractor for their website and Google Business profile.` });
  } catch (err: any) { res.status(500).json({ error: err.message||'Failed to provision.' }); }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history=[], lang='en', sessionId='plumblead-user' } = req.body;
  const isSpanish = lang === 'es';
  const systemInstruction = `You are a friendly plumbing assistant for PlumbLead.ai. Your job is to quickly qualify the homeowner's issue and guide them to get a free quote.\n\nSTRICT RULES:\n- Keep responses SHORT — 2-4 sentences maximum. Never use headers, bullet points, or long lists.\n- Ask ONE clarifying question per response to narrow down the problem.\n- After 1-2 exchanges, encourage them to use the Instant Quote tool for a free estimate.\n- Be warm and helpful, not clinical or encyclopedic.\n- Never break character or mention other AI systems.\n- IMPORTANT: Respond entirely in ${isSpanish?'Spanish':'English'}.`;
  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const msgs = [{role:'system',content:systemInstruction},...history.map((m:any)=>({role:m.role,content:m.content})),{role:'user',content:message}];
      const r = await fetch(openClawApiEndpoint, {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${openClawApiKey}`},body:JSON.stringify({model:'openclaw:plumblead',messages:msgs,user:sessionId})});
      if (r.ok) { const result=await r.json() as any; const resp=result.choices?.[0]?.message?.content||result.output; if(resp) return res.json({response:resp}); }
    } catch(err){console.error('OpenClaw error:',err);}
  }
  try {
    const hc=(history as any[]).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const fut=hc.length===0?`${systemInstruction}\n\nHomeowner: ${message}`:`${systemInstruction}\n\nHomeowner: ${hc[0]?.parts[0]?.text}`;
    const contents=hc.length===0?[{role:'user',parts:[{text:fut}]}]:[{role:'user',parts:[{text:fut}]},...hc.slice(1),{role:'user',parts:[{text:message}]}];
    const gr=await ai.models.generateContent({model:process.env.PLUMBLEAD_QUOTE_AI_MODEL||'gemini-2.0-flash',contents});
    return res.json({response:gr.text??"I'm sorry, I couldn't process that right now."});
  } catch(err){console.error('Gemini chat error:',err);return res.status(500).json({error:'Failed to get chatbot response.'}); }
});

async function qualifyLeadWithGemini(serviceType:string,details:string,location:string):Promise<{leadScore:string;crossSellOpportunities:string[]}> {
  const prompt=`You are a plumbing lead qualifier. Return ONLY a JSON object with no markdown:\n{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["array", "of", "strings"] }\nService: ${serviceType}\nDetails: ${details}\nLocation: ${location}`;
  try {
    const r=await ai.models.generateContent({model:'gemini-2.0-flash',contents:prompt});
    const text=(r.text??'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
    const p=JSON.parse(text);
    return {leadScore:p.leadScore||'Routine',crossSellOpportunities:Array.isArray(p.crossSellOpportunities)?p.crossSellOpportunities:[]};
  } catch { return {leadScore:serviceType.toLowerCase().includes('emergency')||serviceType.toLowerCase().includes('leak')?'High Urgency':'Routine',crossSellOpportunities:[]}; }
}

// ─── Quote ────────────────────────────────────────────────────────────────────
app.post('/api/quote', async (req, res) => {
  const {serviceType,details,location,language='en',sessionId='plumblead-quote-user',zipCode}=req.body;
  const qr:QuoteRequest={serviceType,details,location,language};
  let ls='',cso:string[]=[],rd=details;

  // Parallel: AI qualification + AquaOps brief
  const zip = zipCode || '';
  const waterData = zip ? waterDataByZip[zip] : null;

  const [qualResult, brief] = await Promise.allSettled([
    (async () => {
      if(openClawApiEndpoint&&openClawApiKey){
        try{
          const qp=`You are a PlumbLead.ai Lead Qualifier. Return ONLY valid JSON:\n{ "leadScore": "Emergency|High Urgency|Routine", "crossSellOpportunities": ["string"], "geminiPromptRefinement": "optional" }\nService: ${serviceType}\nDetails: ${details}\nLocation: ${location}`;
          const r=await fetch(openClawApiEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${openClawApiKey}`},body:JSON.stringify({model:'openclaw:plumblead',messages:[{role:'system',content:'Return only valid JSON.'},{role:'user',content:qp}],user:sessionId})});
          if(r.ok){const d=await r.json() as any;const raw=(d.choices?.[0]?.message?.content||d.output||'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();if(raw){const p=JSON.parse(raw);return p;}}
        }catch(err){console.error('OpenClaw error:',err);}
      }
      return await qualifyLeadWithGemini(serviceType,details,location);
    })(),
    buildPlumberBrief(zip, waterData, serviceType),
  ]);

  if(qualResult.status==='fulfilled'){
    const p=qualResult.value as any;
    if(p.leadScore)ls=p.leadScore;
    if(Array.isArray(p.crossSellOpportunities))cso=p.crossSellOpportunities;
    if(p.geminiPromptRefinement)rd=`${details}\n\nAdditional context: ${p.geminiPromptRefinement}`;
  }
  if(!ls){ls=serviceType.toLowerCase().includes('emergency')||serviceType.toLowerCase().includes('leak')?'High Urgency':'Routine';}

  const plumberBrief = brief.status==='fulfilled' ? brief.value : null;

  // Merge AquaOps cross-sell into crossSellOpportunities if not already populated
  if(plumberBrief?.primaryRecommendation && !cso.length){
    cso=[plumberBrief.primaryRecommendation.name, ...plumberBrief.additionalRecommendations.map(p=>p.name)];
  }

  try{
    const qresp:QuoteResponse=await generateAIQuote({...qr,details:rd});
    return res.json({...qresp,leadScore:ls,crossSellOpportunities:cso,plumberBrief});
  }catch(err){
    return res.status(500).json({error:'Failed to generate quote.',leadScore:ls,crossSellOpportunities:cso,plumberBrief});
  }
});

// ─── Leads ────────────────────────────────────────────────────────────────────
app.post('/api/leads', async (req, res) => {
  const clientId=req.body.clientId||'demo';
  const status=await getContractorStatus(clientId);
  if(!status.active||status.subscriptionStatus==='cancelled') return res.status(403).json({error:'Service unavailable',message:'This service is currently paused.',callbackPhone:status.callbackPhone});

  // Build AquaOps brief for enriched plumber notification
  const zip        = req.body.zipCode || req.body.zip || '';
  const waterData  = zip ? waterDataByZip[zip] : null;
  const serviceType = req.body.serviceLabel || req.body.serviceType || '';

  let brief: PlumberBrief | null = null;
  try {
    brief = await buildPlumberBrief(zip, waterData, serviceType);
  } catch(err) {
    console.warn('AquaOps brief failed — continuing without:', err);
  }

  // Attach brief summary to lead payload for dashboard + n8n
  const enrichedPayload = {
    ...req.body,
    ...(brief && {
      waterProfile:          brief.waterProfile,
      plumberBriefText:      brief.briefText,
      primaryEquipmentRec:   brief.primaryRecommendation ? {
        sku:         brief.primaryRecommendation.sku,
        name:        brief.primaryRecommendation.name,
        dealerPrice: brief.primaryRecommendation.dealer_price,
        retailLow:   brief.primaryRecommendation.retail_low,
        retailHigh:  brief.primaryRecommendation.retail_high,
        orderUrl:    brief.primaryRecommendation.order_url,
      } : null,
    }),
  };

  let stored: StoredLead;
  try{stored=await saveLead(enrichedPayload);}catch(err){console.error('Failed to save lead:',err);return res.json({message:'Lead received.'});}

  // Forward enriched payload to n8n
  const n8nUrl=process.env.N8N_WEBHOOK_URL;
  if(n8nUrl) fetch(n8nUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...enrichedPayload,leadId:stored.id,plumberSms:buildPlumberSms(req.body,brief)})}).catch(err=>console.error('n8n error:',err));

  res.json({message:'Lead received.',leadId:stored.id});
});

app.get('/api/leads', requireAdminKey, async (req, res) => {
  const {clientId,status,source,limit='200',offset='0'}=req.query as Record<string,string>;
  try{const r=await queryLeads({clientId:clientId==='__all__'?undefined:clientId,status,source,limit:Math.min(parseInt(limit),500),offset:parseInt(offset)});res.json(r);}
  catch{res.status(500).json({error:'Failed to fetch leads.'}); }
});

app.patch('/api/leads/:id', requireAdminKey, async (req, res) => {
  const {id}=req.params;
  const {status,jobValue,statusNote}=req.body;
  try{const u=await patchLead(id,{status,jobValue,statusNote});if(!u)return res.status(404).json({error:'Lead not found'});res.json({lead:u});}
  catch{res.status(500).json({error:'Failed to update lead.'}); }
});

// ─── AquaOps: Product lookup endpoint (admin) ─────────────────────────────────
app.get('/api/aquaops/recommend', requireAdminKey, async (req, res) => {
  const { zip, serviceType='Water Heater' } = req.query as Record<string,string>;
  if (!zip) return res.status(400).json({ error: 'zip is required' });
  const waterData = waterDataByZip[zip] || null;
  try {
    const brief = await buildPlumberBrief(zip, waterData, serviceType);
    res.json(brief);
  } catch(err:any) {
    res.status(500).json({ error: err.message || 'Failed to build brief' });
  }
});

app.get('/api/contractors', requireAdminKey, async (_req, res) => {
  try{const r=await pool.query(`SELECT * FROM contractors ORDER BY created_at DESC`);res.json({contractors:r.rows});}
  catch{res.status(500).json({error:'Failed to fetch contractors.'}); }
});

app.post('/api/contractors', requireAdminKey, async (req, res) => {
  const {clientId,companyName,phone,callbackPhone,email,address,city,state,zipCodes,crmSystem,bilingual,plan,services,notes}=req.body;
  if(!clientId||!companyName||!phone) return res.status(400).json({error:'clientId, companyName, and phone are required.'});
  const dc=`${clientId}-${new Date().getFullYear()}`;
  try{
    const r=await pool.query(
      `INSERT INTO contractors (client_id,client_name,active,plan,subscription_status,phone,callback_phone,email,address,city,state,zip_codes,crm_system,bilingual,services,notes,dashboard_code) VALUES ($1,$2,true,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (client_id) DO UPDATE SET client_name=EXCLUDED.client_name,plan=EXCLUDED.plan,phone=EXCLUDED.phone,callback_phone=EXCLUDED.callback_phone,email=EXCLUDED.email,address=EXCLUDED.address,city=EXCLUDED.city,state=EXCLUDED.state,zip_codes=EXCLUDED.zip_codes,crm_system=EXCLUDED.crm_system,bilingual=EXCLUDED.bilingual,services=EXCLUDED.services,notes=EXCLUDED.notes,dashboard_code=COALESCE(contractors.dashboard_code,EXCLUDED.dashboard_code) RETURNING *`,
      [clientId,companyName,plan||'trial',phone,callbackPhone||phone,email||null,address||null,city||null,state||null,zipCodes||null,crmSystem||null,bilingual||false,JSON.stringify(services||[]),notes||null,dc]
    );
    res.json({contractor:r.rows[0]});
  }catch(err){console.error('Contractor create error:',err);res.status(500).json({error:'Failed to save contractor.'}); }
});

app.patch('/api/contractors/:clientId', requireAdminKey, async (req, res) => {
  const {clientId}=req.params;
  const allowed=['active','plan','subscription_status','notes','phone','callback_phone','email','city','state','zip_codes','crm_system','bilingual','missed_call_sms'];
  const sets:string[]=[]; const values:unknown[]=[]; let i=1;
  for(const col of allowed){if(req.body[col]!==undefined){sets.push(`${col} = $${i++}`);values.push(req.body[col]);}}
  if(!sets.length) return res.status(400).json({error:'Nothing to update'});
  values.push(clientId);
  try{const r=await pool.query(`UPDATE contractors SET ${sets.join(', ')} WHERE client_id=$${i} RETURNING *`,values);if(!r.rows.length)return res.status(404).json({error:'Contractor not found'});res.json({contractor:r.rows[0]});}
  catch{res.status(500).json({error:'Failed to update contractor.'}); }
});

app.post('/api/contractors/:clientId/dashboard-code', requireAdminKey, async (req, res) => {
  const {clientId}=req.params; const {code}=req.body;
  if(!code?.trim()) return res.status(400).json({error:'code is required'});
  try{
    const ex=await pool.query(`SELECT client_id FROM contractors WHERE dashboard_code=$1 AND client_id!=$2`,[code.trim(),clientId]);
    if(ex.rows.length) return res.status(409).json({error:'Code already in use.'});
    const r=await pool.query(`UPDATE contractors SET dashboard_code=$1 WHERE client_id=$2 RETURNING dashboard_code`,[code.trim(),clientId]);
    if(!r.rows.length) return res.status(404).json({error:'Contractor not found'});
    res.json({dashboard_code:r.rows[0].dashboard_code});
  }catch{res.status(500).json({error:'Failed to update code.'});}
});

app.post('/api/contractors/:clientId/disable', requireAdminKey, async (req, res) => {
  const {clientId}=req.params;
  try{await pool.query(`UPDATE contractors SET active=false,subscription_status='cancelled' WHERE client_id=$1`,[clientId]);res.json({message:`${clientId} disabled.`});}
  catch{res.status(500).json({error:'Failed to disable.'});}
});

app.post('/api/contractors/:clientId/enable', requireAdminKey, async (req, res) => {
  const {clientId}=req.params;
  try{await pool.query(`UPDATE contractors SET active=true,subscription_status='active' WHERE client_id=$1`,[clientId]);res.json({message:`${clientId} re-enabled.`});}
  catch{res.status(500).json({error:'Failed to enable.'});}
});

app.post('/api/scrape-contractor', requireAdminKey, async (req, res) => {
  const {url}=req.body;
  if(!url) return res.status(400).json({error:'url is required'});
  try{
    const pr=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; PlumbLeadBot/1.0)'}});
    if(!pr.ok) throw new Error(`Failed to fetch: ${pr.status}`);
    const html=await pr.text();
    const text=html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000);
    const prompt=`Extract plumbing contractor info. Return ONLY valid JSON:\n{"companyName":null,"phone":null,"email":null,"address":null,"city":null,"state":null,"zipCodes":null,"services":[],"notes":null}\n\nContent:\n${text}`;
    const gr=await ai.models.generateContent({model:'gemini-2.0-flash',contents:prompt});
    const raw=(gr.text??'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
    res.json(JSON.parse(raw));
  }catch(err:any){res.status(500).json({error:err.message||'Scrape failed.'});}
});

loadWaterData();
initDb().then(() => {
  app.listen(port, () => console.log(`PlumbLead.ai server running on port ${port} | SMS from: ${TWILIO_FROM_NUMBER}`));
});
