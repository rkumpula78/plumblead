# PlumbLead.ai — Operator Runbook

> **Audience:** You (Ryan). Everything needed to run, sell, and onboard plumbing contractors.

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Known Issues to Fix](#2-known-issues-to-fix)
3. [Deployment Checklist](#3-deployment-checklist)
4. [When a Plumber Signs Up — Onboarding Steps](#4-when-a-plumber-signs-up--onboarding-steps)
5. [Personalizing the Widget for Each Contractor](#5-personalizing-the-widget-for-each-contractor)
6. [Dashboard — Lead Management & Conversion Tracking](#6-dashboard--lead-management--conversion-tracking)
7. [n8n Workflow Logic](#7-n8n-workflow-logic)
8. [Testing the Full Flow](#8-testing-the-full-flow)
9. [Pricing & Plan Reference](#9-pricing--plan-reference)

---

## 1. System Architecture

```
Homeowner visits plumblead.ai
  │
  ├─ /quote         → QuoteTool.tsx (4-step form)
  │     → POST /api/quote  (Railway → Gemini → AI estimate)
  │     → POST /api/leads  (Railway → saves to Postgres → n8n webhook → SMS + Email)
  │
  ├─ /water-quality → WaterQualityReport.tsx (zip lookup → hardness data)
  │     → POST /api/leads  (source: water-quality-report → separate n8n branch)
  │
  └─ Floating Chatbot → POST /api/chat  (Railway → Gemini)

Plumber visits plumblead.ai/submit-trial
  └─ SubmitTrial.tsx → POST /api/leads  (type: trial_signup → n8n → Ryan alert + SMS to plumber)

Plumber/Ryan visits plumblead.ai/dashboard
  └─ Dashboard.tsx → GET/PATCH /api/leads  (Railway → Postgres → real lead data)
```

**Infrastructure:**
| Layer | Service | URL |
|---|---|---|
| Frontend | Cloudflare Workers | plumblead.ai |
| Backend | Railway | https://plumblead-production.up.railway.app |
| Database | Railway Postgres | auto-injected as `DATABASE_URL` |
| AI | Google Gemini 2.0 Flash | via @google/genai |
| Automation | n8n (your instance) | Lead Router v3 |
| SMS | Twilio | +1 (833) 558-0877 |

---

## 2. Known Issues to Fix

Priority order — fix these before showing to a real contractor:

### 🔴 Critical

**A. `SubmitTrial.tsx` posts to `/api/leads` but n8n checks `body.type === 'trial_signup'`**
The n8n IF node reads `$json.body.type` but `server.ts` forwards the raw body — confirm the payload
arrives with `type: 'trial_signup'` intact. Test by submitting the trial form and checking n8n executions.

**B. Cloudflare deploy must be re-triggered after every GitHub push**
Cloudflare Workers does NOT auto-deploy from GitHub. After every code change:
1. Go to Cloudflare Dashboard → Workers → `plumblead-site`
2. Settings → Build → click **Trigger Deploy**
OR set up a GitHub Action (see Section 3).

### 🟡 Important

**C. `QuoteTool` embeds `clientName: 'Your Local Plumber'` hardcoded**
This should be dynamic per contractor. Until multi-tenant is built, change this to your demo
contractor name when doing sales demos. File: `src/components/QuoteTool.tsx`, search `clientName`.

**D. No terms/privacy pages**
`SubmitTrial.tsx` links to `/terms` and `/privacy` — these 404. Add stub pages or link to a
hosted Google Doc until real legal pages exist.

### ✅ Resolved

- ~~Dashboard uses mock data~~ — Dashboard is now wired to real Postgres lead data
- ~~Water Quality Report only covers Phoenix metro~~ — Expanded to full AZ + WA statewide coverage
- ~~SMS uses wrong field name~~ — Updated to use `serviceLabel`

---

## 3. Deployment Checklist

### Railway (Backend)
- [ ] `GEMINI_API_KEY` set in Variables tab
- [ ] `N8N_WEBHOOK_URL` set to: `https://[your-n8n-domain]/webhook/plumblead-quote`
- [ ] `PORT=3000` set
- [ ] `DASHBOARD_ADMIN_KEY` set to: `plumblead-admin-2026` (or rotate to a new value)
- [ ] **Postgres service added** to the Railway project (auto-injects `DATABASE_URL`)
- [ ] Health check confirms DB connected: `curl https://plumblead-production.up.railway.app/api/health`
  - Should return: `{ "status": "ok", "db": "connected" }`
- [ ] Redeploy after any env var change (Railway does not hot-reload vars)

### Cloudflare Workers (Frontend)
- [ ] `wrangler.jsonc` exists in repo root (prevents auto-config injection)
- [ ] Build command in Cloudflare UI set to: `bun run deploy`
- [ ] Maps to: `vite build && wrangler deploy` in `package.json`
- [ ] Vite version is 6.x (required for Wrangler 4 compatibility)
- [ ] `package.json` does NOT have `"type": "module"` (breaks Railway Express build)

### n8n
- [ ] Workflow `PlumbLead.ai — Lead Router v3` is **Active**
- [ ] Webhook path is `plumblead-quote` (matches `N8N_WEBHOOK_URL`)
- [ ] Twilio credentials (`Twilio Plumblead`) connected
- [ ] Gmail credentials (`Gmail account (rkumpula)`) connected
- [ ] Test execution confirms all 3 branches work (trial, water, standard lead)

---

## 4. When a Plumber Signs Up — Onboarding Steps

When a plumber completes the form at `/submit-trial`, here's what happens automatically
and what you do manually:

### Automatic (n8n handles)
1. **SMS to plumber** — trial confirmation with your number (833) 558-0877
2. **Email to you** — full signup details: company, trucks, CRM, city

### Manual — Your Checklist (do within 2 business hours)

**Step 1 — Reply to the plumber**
Call or text them within 15 minutes. Script:
> *"Hey [Name], Ryan from PlumbLead.ai. Got your signup for [Company] — excited to get you set up.
> Takes about 20 minutes to configure. Are you available for a quick call now or later today?"*

**Step 2 — Collect what you need to personalize**
Ask for (or confirm from their signup):
- [ ] Business name (exact, for SMS sender tag)
- [ ] Primary service area / zip codes
- [ ] Services they offer (check off from the 14 in `SERVICES` array)
- [ ] CRM they use (for future webhook routing — note for now)
- [ ] Do they want English only or English + Spanish?
- [ ] Their callback number (the number homeowners call back)
- [ ] Logo / brand color (if you're building a white-label widget for them)

**Step 3 — Personalize the widget** (see Section 5)

**Step 4 — Add their dashboard access code** (see Section 6)

**Step 5 — Send setup email**
Include:
- Link to their widget demo: `plumblead.ai/widget-demo`
- Their specific embed code (iframe snippet)
- Their dashboard URL + access code: `plumblead.ai/dashboard`
- Instructions for where to place widget (header CTA + service pages)
- Your number for support

**Step 6 — Follow up in 48 hours**
Check if they've embedded the widget. If not, offer to send instructions directly to their web developer.

---

## 5. Personalizing the Widget for Each Contractor

The current `QuoteTool.tsx` is a single generic widget. Until multi-tenant config is built,
personalize per client by editing these values in the component:

### Fields to Change Per Client

```tsx
// In QuoteTool.tsx — search for these values:

// 1. Brand label shown at top of widget
<div>Your Local Plumber</div>        // ← Change to: "Smith Plumbing LLC"

// 2. clientName in lead payload
clientName: 'Your Local Plumber',    // ← Change to: contractor company name

// 3. clientId in lead payload
clientId: 'demo',                    // ← Change to: short slug e.g. 'smith-plumbing'

// 4. Powered-by footer (optional — hide for white-label)
// Search: Powered by PlumbLead.ai
// Comment out or replace with contractor brand
```

### Services to Enable/Disable

The `SERVICES` array in `QuoteTool.tsx` controls which tiles show. Comment out any service
the contractor doesn't offer. Example — if they don't do gas line work:
```tsx
// { key: 'gas-line', icon: '🔥', label: 'Gas Line Work', priceHint: '$300 – $1,500' },
```

### Embed Code for the Contractor's Website

```html
<iframe
  src="https://plumblead.ai/quote?widget=1&client=[clientId]"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none;max-width:680px;">
</iframe>
```

Placement recommendations:
- Header / hero: button that says "Get Instant Quote" that opens the widget
- Each service page: embed above the fold, below the service description
- Contact Us page: full widget embed as the primary CTA

### Callback Phone Number in SMS

The Twilio SMS messages reference `(833) 558-0877` — your PlumbLead number. For white-label
clients who want their own number, a separate Twilio number per client and a separate n8n branch
is needed. Not built yet — use your number for all MVP clients.

---

## 6. Dashboard — Lead Management & Conversion Tracking

### Access

**URL:** `plumblead.ai/dashboard`

| Access Code | Who | Sees |
|---|---|---|
| `plumblead-admin-2026` | You (Ryan) | All leads from all contractors |
| `demo-2024` | Demo contractor | Only leads with `clientId: demo` |

### Adding a New Contractor to the Dashboard

Open `src/components/Dashboard.tsx` and find the `ACCESS_CODES` object. Add one line:

```ts
const ACCESS_CODES: Record<string, { clientId: string; label: string }> = {
  'plumblead-admin-2026': { clientId: '__all__', label: 'Admin — All Leads' },
  'demo-2024':            { clientId: 'demo',    label: 'Demo Contractor' },
  // Add new contractors here:
  'smith-plumbing-2026':  { clientId: 'smith-plumbing', label: 'Smith Plumbing LLC' },
};
```

The access code can be anything — use a pattern like `[slug]-[year]` for easy rotation.
After adding, redeploy Cloudflare (trigger deploy in dashboard).

### What the Dashboard Shows

**Stats row (top):**
- Total Leads, New, Won, Close Rate, Revenue Won, Avg Ticket

**ROI box** (appears once you log won jobs):
- Shows revenue ÷ plan cost (e.g. "21× return")
- Auto-calculates based on job values you enter

**Lead table:**
- Filter by status (New / Contacted / Quoted / Won / Lost) and source
- Click any row to open the lead detail modal

### Logging a Conversion (Won Job)

1. Click any lead row to open the detail modal
2. Click **Won** in the status selector
3. Enter the **job value** (actual revenue) in the dollar field that appears
4. Optionally add a note (e.g. "Booked water heater install Thursday")
5. Click **Save Changes**

The Revenue Won and ROI stats update immediately.

### Lead Storage — Postgres

All leads are stored permanently in the Railway Postgres database. The table is
auto-created on first startup — no manual SQL needed.

**Schema:**
```sql
leads (
  id                TEXT PRIMARY KEY,        -- e.g. lead-1712345678-abc12
  received_at       TIMESTAMPTZ,             -- when the lead arrived
  status            TEXT DEFAULT 'New',      -- New / Contacted / Quoted / Won / Lost
  job_value         NUMERIC,                 -- dollar amount, set when Won
  status_note       TEXT,                    -- optional call notes
  status_updated_at TIMESTAMPTZ,
  payload           JSONB                    -- all lead fields (name, phone, service, etc.)
)
```

**To add Postgres to a fresh Railway project:**
1. Railway dashboard → your project → **+ New** → **Database** → **PostgreSQL**
2. `DATABASE_URL` is auto-injected into your service
3. Redeploy — look for `Database ready.` in the build logs
4. Confirm: `curl https://plumblead-production.up.railway.app/api/health` → `"db": "connected"`

**API endpoints (protected by `x-admin-key` header):**
- `GET /api/leads?adminKey=plumblead-admin-2026` — fetch leads (supports `clientId`, `status`, `source` filters)
- `PATCH /api/leads/:id` — update status, job value, notes

---

## 7. n8n Workflow Logic

**Workflow:** `PlumbLead.ai — Lead Router v3` (ID: `BcnhFGDClYaIh3pu`)
**Webhook path:** `plumblead-quote`

```
Incoming POST
  │
  ├─ body.type === 'trial_signup'
  │     → Respond ACK
  │     → Email Ryan (🔥 New Trial: [Company])
  │     → SMS plumber (trial confirmation + setup timeline)
  │
  └─ (all other leads)
        │
        ├─ body.source === 'water-quality-report'
        │     → Respond ACK
        │     → SMS homeowner (hardness-specific message with city + GPG)
        │     → Email Ryan (💧 Water Treatment Lead: [Name] — [City])
        │         Fields: waterHardness, annualCostEstimate, recommendations
        │
        └─ (standard homeowner quote leads)
              → Respond ACK
              → SMS homeowner (60s response with serviceLabel + estimateRange)
              → Email Ryan (⚡ New Lead: [serviceLabel] — [zipCode])
                  Fields: name, phone, email, serviceLabel, urgency, details,
                          zipCode, estimateRange, leadScore, crossSellOpportunities
              → Wait 2 hours
              → SMS homeowner (2hr follow-up check-in)
```

### Key Payload Fields by Source

**Standard quote lead** (`source: 'quote-tool'`):
```json
{
  "name": "John Smith",
  "phone": "6025551234",
  "email": "john@email.com",
  "service": "water-heater-tank",
  "serviceLabel": "Water Heater (Tank)",
  "urgency": "emergency | soon | routine",
  "details": "15 year old unit, leaking from bottom",
  "zipCode": "85383",
  "estimateRange": "$1,200 – $3,500",
  "leadScore": "Emergency | High Urgency | Routine",
  "crossSellOpportunities": ["Water Softener", "Expansion Tank"],
  "preferredTime": "ASAP | Morning | Afternoon | Evening",
  "lang": "en | es",
  "source": "quote-tool",
  "clientId": "demo",
  "leadId": "lead-1712345678-abc12",
  "submittedAt": "2026-04-04T00:00:00.000Z"
}
```

**Water treatment lead** (`source: 'water-quality-report'`):
```json
{
  "name": "Jane Smith",
  "phone": "6025559999",
  "email": "jane@email.com",
  "service": "water-treatment-consultation",
  "zipCode": "85383",
  "city": "Peoria",
  "state": "AZ",
  "waterHardness": "22.5 GPG (Very Hard)",
  "annualCostEstimate": "$2,025 – $5,787/yr",
  "recommendations": "Water Softener, Reverse Osmosis (Drinking Water)",
  "source": "water-quality-report",
  "submittedAt": "2026-04-04T00:00:00.000Z"
}
```

**Trial signup** (`type: 'trial_signup'`):
```json
{
  "firstName": "Ryan",
  "lastName": "Smith",
  "company": "Smith Plumbing LLC",
  "phone": "6025550100",
  "email": "ryan@smithplumbing.com",
  "trucks": "2–3",
  "crm": "Housecall Pro",
  "city": "Phoenix, AZ",
  "hearAbout": "Google Search",
  "type": "trial_signup",
  "source": "submit-trial",
  "submittedAt": "2026-04-04T00:00:00.000Z"
}
```

---

## 8. Testing the Full Flow

### Test 1 — Standard Quote Lead
1. Go to `plumblead.ai/quote`
2. Select **Water Heater (Tank)**
3. Set urgency to **Emergency**, enter zip `85383`, click See My Estimate
4. Verify: AI quote loads with estimate range + personalized message
5. Enter your own name/phone, submit
6. Verify: success screen + countdown
7. Check your phone — SMS should arrive within 60 seconds
8. Check Gmail — email with `⚡ New Lead:` subject
9. Check n8n executions — should show success
10. Go to `plumblead.ai/dashboard` → login → verify the lead appears

### Test 2 — Water Quality Lead
1. Go to `plumblead.ai/water-quality`
2. Enter zip `85383` (Peoria AZ) or `98101` (Seattle WA)
3. Verify: report loads with hardness gauge, issue cards, recommendations
4. Fill in the lead capture form at the bottom, submit
5. Check Gmail — email with `💧 Water Treatment Lead:` subject
6. Check phone — SMS referencing water hardness

### Test 3 — Trial Signup
1. Go to `plumblead.ai/submit-trial`
2. Fill out entire form, check SMS consent
3. Submit
4. Verify: success screen with company name + trial length
5. Check Gmail — `🔥 New Trial Signup:` email
6. Check phone — trial confirmation SMS

### Test 4 — Chatbot
1. Any page on the site, click the 🔧 button (bottom right)
2. Type: *"My water heater is leaking"*
3. Verify: response in 2-4 sentences, ends with a question
4. Verify: NOT a wall of text or bullet points

### Test 5 — Dashboard Conversion Tracking
1. Go to `plumblead.ai/dashboard`, enter `plumblead-admin-2026`
2. Verify leads from Tests 1 and 2 appear
3. Click the Test 1 lead → change status to **Won** → enter `$1400` job value → Save
4. Verify: Revenue Won and ROI stats update in the stats row

---

## 9. Pricing & Plan Reference

Current pricing in `LandingPage.tsx` — update when you finalize:

| Plan | Price | Target |
|---|---|---|
| Starter | $97/mo | 1-2 trucks, basic quote tool + SMS |
| Pro | $197/mo | 3-10 trucks, full dashboard + CRM routing |
| Agency | $397/mo | 10+ trucks or multi-location, white-label |

**Key sales frame (from the HVAC Quote competitive intel):**
- One water heater install = $1,400 avg ticket
- Monthly Pro plan = $197
- Break-even = less than one job per month
- ROI message: *"PlumbLead pays for itself with the first lead you close that you would have lost"*

**Objection handling:**
- *"I already have a website"* → Your website doesn't respond in 60 seconds. Ours does.
- *"I use ServiceTitan"* → We route leads INTO ServiceTitan, we don't replace it.
- *"Too expensive"* → What does a missed $3,000 sewer job cost you? We prevent that.
- *"I'll think about it"* → Your competitor signed up this morning. Want the demo?
- *"How is this different from Angi/HomeAdvisor?"* → Angi sells your lead to 5 competitors. PlumbLead captures leads from YOUR site and routes them to YOU only.
