# PlumbLead.ai — Operator Runbook

> **Audience:** You (Ryan). Everything needed to run, sell, and onboard plumbing contractors.

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Known Issues to Fix](#2-known-issues-to-fix)
3. [Deployment Checklist](#3-deployment-checklist)
4. [When a Plumber Signs Up — Onboarding Steps](#4-when-a-plumber-signs-up--onboarding-steps)
5. [Personalizing the Widget for Each Contractor](#5-personalizing-the-widget-for-each-contractor)
6. [n8n Workflow Logic](#6-n8n-workflow-logic)
7. [Testing the Full Flow](#7-testing-the-full-flow)
8. [Pricing & Plan Reference](#8-pricing--plan-reference)

---

## 1. System Architecture

```
Homeowner visits plumblead.ai
  │
  ├─ /quote         → QuoteTool.tsx (4-step form)
  │     → POST /api/quote  (Railway → Gemini → AI estimate)
  │     → POST /api/leads  (Railway → n8n webhook → SMS + Email)
  │
  ├─ /water-quality → WaterQualityReport.tsx (zip lookup → hardness data)
  │     → POST /api/leads  (source: water-quality-report → separate n8n branch)
  │
  └─ Floating Chatbot → POST /api/chat  (Railway → Gemini)

Plumber visits plumblead.ai/submit-trial
  └─ SubmitTrial.tsx → POST /api/leads  (type: trial_signup → n8n → Ryan alert + SMS to plumber)
```

**Infrastructure:**
| Layer | Service | URL |
|---|---|---|
| Frontend | Cloudflare Workers | plumblead.ai |
| Backend | Railway | https://plumblead-production.up.railway.app |
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

**B. SMS to homeowner uses `serviceType` field (old name)**
The standard homeowner SMS was updated to use `serviceLabel` in the last n8n edit, but double-check
by looking at a live execution. If it shows `undefined`, the field mapping is off.

**C. Cloudflare deploy must be re-triggered after every GitHub push**
Cloudflare Workers does NOT auto-deploy from GitHub. After every code change:
1. Go to Cloudflare Dashboard → Workers → `plumblead-site`
2. Settings → Build → click **Trigger Deploy**
OR set up a GitHub Action (see Section 3).

### 🟡 Important

**D. `QuoteTool` embeds `clientName: 'Your Local Plumber'` hardcoded**
This should be dynamic per contractor. Until multi-tenant is built, change this to your demo
contractor name when doing sales demos. File: `src/components/QuoteTool.tsx`, search `clientName`.

**E. Water Quality Report only covers Phoenix metro**
`src/data/az-water-data.json` has ~15 cities. If a homeowner enters a zip outside that dataset,
they get an error. Either expand the dataset or add a fallback message with a call-to-action.

**F. No `/api/health` check on Chatbot**
If Railway is down, the chatbot silently fails with no user-facing message. The error copy exists
in `Chatbot.tsx` but the retry logic does not — low priority but worth adding.

### 🟢 Nice to Have

**G. Dashboard (`/dashboard`) is not connected to real lead data**
Check `Dashboard.tsx` — it likely uses mock data. Wiring it to real n8n/CRM data is a future sprint.

**H. No terms/privacy pages**
`SubmitTrial.tsx` links to `/terms` and `/privacy` — these 404. Add stub pages or link to a
Hosted Google Doc until real legal pages exist.

---

## 3. Deployment Checklist

### Railway (Backend)
- [ ] `GEMINI_API_KEY` set in Variables tab
- [ ] `N8N_WEBHOOK_URL` set to: `https://[your-n8n-domain]/webhook/plumblead-quote`
- [ ] `PORT=3000` set
- [ ] Health check passing: `curl https://plumblead-production.up.railway.app/api/health`
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

**Step 4 — Send setup email**
Include:
- Link to their widget demo: `plumblead.ai/widget-demo`
- Their specific embed code (iframe snippet)
- Instructions for where to place it (header CTA + service pages)
- Your number for support

**Step 5 — Follow up in 48 hours**
Check if they've embedded the widget. If not, offer to send to their web person directly.

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

### Callback Phone Number in SMS

The Twilio SMS messages reference `(833) 558-0877` — your PlumbLead number. For white-label
clients who want their own number in the SMS, you'll need a separate Twilio number per client
and a separate n8n branch or workflow. Not built yet — use your number for all clients in MVP.

### Future: URL-Based Config
The `WidgetDemo.tsx` and `/quote?widget=1` path already support iframe embedding.
The right long-term architecture is URL params: `/quote?client=smith-plumbing` that loads
a config from a database. That's a sprint 2 build.

---

## 6. n8n Workflow Logic

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

## 7. Testing the Full Flow

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

### Test 2 — Water Quality Lead
1. Go to `plumblead.ai/water-quality`
2. Enter zip `85383` (Peoria)
3. Verify: report loads with hardness gauge, cost estimate, recommendations
4. Fill in lead capture form at bottom, submit
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

---

## 8. Pricing & Plan Reference

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
