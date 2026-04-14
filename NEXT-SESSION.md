# PlumbLead.ai — Next Session Handoff
**K48 Ventures LLC | Updated April 14, 2026**

This document is the single source of truth for any new Claude session. Read this first, then proceed.

---

## What Was Built (Current State)

### Infrastructure — Live in Production
| Layer | Service | Status |
|---|---|---|
| Frontend | Cloudflare Workers → plumblead.ai | ✅ Live, auto-deploy via GitHub Actions |
| Backend | Railway (Node/Express) | ✅ Live, auto-deploy on push to `main` |
| Database | Railway Postgres | ✅ Live, leads + contractors tables |
| SMS | Twilio (623) 263-2823 | ✅ Live, 10DLC pending carrier approval |
| Payments | Stripe (3 tiers) | ✅ Integrated, webhook live |
| AI | Google Gemini 2.0 Flash | ✅ Quote + chat generation |
| Automation | n8n Lead Router v3 | ✅ Active |

### Repo: `rkumpula78/plumblead` · Branch: `main` · Local: `~/Desktop/plumblead`

### Key Files
```
server.ts                          — Full Express backend (Railway)
src/services/geminiService.ts      — AI quote generation
src/services/aquaopsService.ts     — H3 water analysis + equipment recs (NEW)
src/data/az-water-data.json        — AZ water data ~900 zips
src/data/wa-water-data.json        — WA water data ~900 zips
src/components/QuoteTool.tsx       — Homeowner quote widget
src/components/Dashboard.tsx       — Lead management dashboard
src/components/demos/             — ProMax + GPS Plumbing demo pages
```

### What Was Added This Session

**1. `src/services/aquaopsService.ts` — H3 Decision Engine (fully embedded)**
- Full H3 water analysis: classifies hardness by exact H3 thresholds (Soft ≤3.5 / Slightly Hard ≤7 / Moderately Hard ≤10.5 / Hard ≤15 / Very Hard ≤25 / Extremely Hard 25+)
- GPG→mg/L conversion (×17.1), softener sizing formula, salt dose efficiency table
- TAC viability check (max 25 GPG, iron max 0.3 mg/L)
- Iron removal method decision tree (fine mesh → Birm → Greensand → Catalytic → Air injection → Chemical oxidation)
- Resin selection (Standard 8% / Fine Mesh / 10% Crosslink based on iron + chlorine)
- Carbon filter selection (catalytic carbon Centaur for chloramines — standard GAC insufficient)
- K48/HomePlus dealer equipment catalog (12 SKUs with dealer + retail pricing)
- Annual hard-water cost estimate
- `buildPlumberBrief()` — combines all above into formatted brief for plumber notification

**2. `server.ts` — Lead Enrichment Live**
- Water data loaded at startup from AZ + WA JSON files (keyed by zip)
- `/api/leads` — enriches payload with water profile + equipment rec before saving + forwarding to n8n
- `/api/quote` — runs AquaOps brief in parallel with AI quote generation
- `buildPlumberSms()` — plumber SMS now includes water GPG, issue flags, product rec, dealer price, order URL
- `/api/aquaops/recommend` — admin endpoint to test briefs by zip
- `/api/health` — reports `waterZips` count and `aquaops` config status

**3. H3 MCP Server — Built, Compiled, Verified**
- Standalone TypeScript MCP server at `~/h3-mcp-server/` on Ryan's Mac
- 10 tools: `h3_analyze_water`, `h3_hardness_lookup`, `h3_plumber_brief`, `h3_generate_proposal`, `h3_roi_calculator`, `h3_troubleshoot`, `h3_size_softener`, `h3_iron_removal`, `h3_resin_selector`, `h3_well_water_assess`
- Build verified clean, engine tested: Peoria AZ 85383 @ 19 GPG → Fleck 5600SXT 48K, TAC secondary, RO flagged
- stdio transport for Claude Desktop, HTTP transport (`TRANSPORT=http PORT=3100`) for PlumbLead/OpenClaw
- Setup script: `cd ~/h3-mcp-server && bash setup.sh` wires Claude Desktop automatically

**4. Strategy Doc + Revenue Loop HTML**
- Complete revenue loop documented: SaaS ($500-1K/mo) + Equipment margin (25-35%) + Managed ads
- HTML one-pager at `/mnt/user-data/outputs/plumblead-revenue-loop.html`
- At 10 contractors × 2 equipment sales/mo: $20K–39K/mo

---

## Railway Environment Variables (Current)
```
GEMINI_API_KEY          ✅ set
N8N_WEBHOOK_URL         ✅ set
PORT                    ✅ 3000
DASHBOARD_ADMIN_KEY     ✅ plumblead-admin-2026
DATABASE_URL            ✅ auto-injected by Railway
TWILIO_ACCOUNT_SID      ✅ set
TWILIO_AUTH_TOKEN       ✅ set
TWILIO_FROM_NUMBER      ✅ +16232632823
STRIPE_SECRET_KEY       ✅ set
STRIPE_WEBHOOK_SECRET   ✅ set
BACKEND_URL             ✅ https://plumblead-production.up.railway.app
FRONTEND_URL            ✅ https://plumblead.ai
H3AQUAOPS_API_KEY       ⚠ NOT YET SET — add: 9mjfTLGUJFAhhojBFmNudYLxWFkMNJRQ5cYKVL3utCY
H3AQUAOPS_API_USER      ⚠ NOT YET SET — add: rkumpula
H3AQUAOPS_API_PASS      ⚠ NOT YET SET — add: h3aquaops2026
```

---

## Known Issues / Outstanding

| Issue | Priority | Notes |
|---|---|---|
| `clientName` hardcoded as "Your Local Plumber" in `QuoteTool.tsx` | CRITICAL | Fix before any demo — 2 places in file |
| n8n trial signup routing | CRITICAL | Verify `body.type === "trial_signup"` routes correctly |
| Stripe webhook end-to-end | CRITICAL | Send test event from Stripe dashboard, verify Postgres updates |
| H3 MCP Server not yet on Claude Desktop | HIGH | Run `bash setup.sh` in `~/h3-mcp-server` then restart Claude |
| H3 env vars missing from Railway | HIGH | Add 3 vars above |
| HomePlus dealer account not activated | HIGH | Equipment margin stream blocked until this is done |
| Multi-tenant config layer | IMPORTANT | Every new client requires code edit until this is built |
| 10DLC SMS campaign | PENDING | 24-48hr carrier approval window, no action needed |

---

## Next Phase — Priority Order

### PHASE 1: Close First Paying Clients (This Week)

**Step 1 — Fix demo blockers (30 min)**
```
File: src/components/QuoteTool.tsx
Search: "Your Local Plumber" (2 places)
Change to: contractor's actual company name before each demo
```

**Step 2 — Verify full system (1 hr)**
```bash
# Health check
curl https://plumblead-production.up.railway.app/api/health
# Should show: db:connected, waterZips:900+, smsFrom:+16232632823

# AquaOps engine test
curl "https://plumblead-production.up.railway.app/api/aquaops/recommend?zip=85383&serviceType=Water+Heater" \
  -H "x-admin-key: plumblead-admin-2026"
# Should return: 19 GPG Very Hard, Fleck 5600SXT 48K recommendation

# Stripe webhook test
# Stripe Dashboard → Webhooks → Send test event: customer.subscription.updated
# Check Railway logs for: "Stripe: customer.subscription.updated — plan=pro, status=active"
```

**Step 3 — Text ProMax and GPS Plumbing (today)**
- ProMax Water Heaters & Plumbing — Evan Niemela, Monroe WA
  - Live demo: plumblead.ai/demo/promax
  - clientId: `promax-water-heaters`
- GPS Plumbing Inc. — Monroe WA  
  - Live demo: plumblead.ai/demo/gps
  - clientId: `gps-plumbing`

Script: *"Hey [Name], Ryan from PlumbLead.ai. Your demo page has been live for a few weeks — wanted to follow up and see if you're ready to make it live on your site. Takes 20 minutes to set up. When's a good time?"*

**Step 4 — Convert at least one to paid ($97-$197/mo)**
- Direct ask after demo: *"Ready to get this on your site?"*
- Starter at $97/mo is break-even on one lead
- Use ROI frame: average water heater job $1,400 — one job covers 14 months of Starter

---

### PHASE 2: Activate Equipment Revenue Stream (This Week)

**HomePlus dealer account — this is the revenue unlock**
- Dealer agreement is signed
- Account needs to be activated: log in, set up ordering, get product catalog
- Once active, update `CATALOG` in `src/services/aquaopsService.ts` with real SKUs and dealer prices
- Goal: Run one end-to-end equipment sale — service call → water report → softener sale → K48 supplies

**Add H3 env vars to Railway**
```
H3AQUAOPS_API_KEY=9mjfTLGUJFAhhojBFmNudYLxWFkMNJRQ5cYKVL3utCY
H3AQUAOPS_API_USER=rkumpula
H3AQUAOPS_API_PASS=h3aquaops2026
```
Then: Railway → redeploy → verify health endpoint shows `aquaops: configured`

---

### PHASE 3: Wire H3 MCP Server (This Week)

**On your Mac:**
```bash
cd ~/h3-mcp-server
bash setup.sh
# Restart Claude Desktop
# Verify: ask Claude "analyze water at 19 GPG in Peoria AZ"
```

**Deploy to Railway for PlumbLead + OpenClaw access:**
```bash
# Create new Railway service from ~/h3-mcp-server
# Set: TRANSPORT=http PORT=3100
# Add Railway URL as H3_MCP_URL env var in PlumbLead service
```

---

### PHASE 4: Build Config-Driven Widget (Before 5th Client)

Top scaling blocker. Every new client currently requires a code edit to `QuoteTool.tsx`.

**What to build:**
- Add `config` column to `contractors` Postgres table (JSONB)
- `GET /api/contractor-config?clientId=xxx` endpoint returns services, name, branding
- `QuoteTool.tsx` fetches config on mount, replaces all hardcoded values
- Demo pages become a single `<DynamicDemo clientId="promax-water-heaters" />` component

**When to build:** After first paying client. Before 5th client.

---

### PHASE 5: Outreach System (30-Day Clock)

Rule of 100: 40 cold emails + 40 DMs + 20 calls = 100 primary actions/day for 100 days.

**Build prospect list:**
- 500 WA + AZ plumbers: company name, owner name, website, phone, email, city
- Sources: Google Maps, Angi, Yelp, state contractor license boards

**Set up outreach:**
- Cold email: Apollo or Instantly, 40/day, 3-5 sequence templates
- DMs: FB/IG/LinkedIn plumber groups, 40/day
- Calls: 20/day from prospect list

**Landing page update needed:**
- Add "The Full Loop" section (speed-to-lead → water intel → equipment upsell)
- Add plumber ROI calculator (10 leads → 3 jobs → 1 upsell = +$2,500)
- Current page sells speed-to-lead only — undersells the actual value

---

## Architecture Reference

### Data Flow (Current)
```
Homeowner submits quote
  → /api/quote
    → [parallel] Gemini AI qualification + AquaOps water brief
    → Returns: estimate + lead score + plumber brief with equipment rec
  → Homeowner fills contact form
  → /api/leads
    → buildPlumberBrief() enriches payload with water profile + equipment rec
    → saveLead() → Postgres
    → n8n webhook → SMS to plumber (includes water brief + product rec + order URL)
                  → Email to Ryan
                  → 2hr follow-up SMS
```

### Plumber SMS (Current Format)
```
🚨 EMERGENCY — Water Heater (Tank)
John Smith | 602-555-1234 | 85383 | Emergency

Water: 19 GPG Very Hard
Rec: Fleck 5600SXT — 48K Grain
Dealer: $820 | Retail: $1900–$2700
Order: https://h3api.connectable.to/plumber-pro?sku=FLK-5600-48K

Dashboard: https://plumblead.ai/dashboard
```

### H3 MCP Server Tools
| Tool | Use Case |
|---|---|
| `h3_analyze_water` | Full analysis from test values |
| `h3_plumber_brief` | Complete lead enrichment |
| `h3_generate_proposal` | Customer-facing proposal |
| `h3_roi_calculator` | Sales ROI conversation |
| `h3_troubleshoot` | Softener/filter diagnosis |
| `h3_size_softener` | Exact sizing formula |
| `h3_iron_removal` | Iron method selection |
| `h3_resin_selector` | Resin type selection |
| `h3_well_water_assess` | Full well system sequence |

### Pricing Tiers (Current)
| Plan | Price | Anchor | Target |
|---|---|---|---|
| Starter | $97/mo | ~~$297~~ | 1-2 trucks |
| Pro | $197/mo | ~~$497~~ | 3-10 trucks |
| Agency | $497/mo | ~~$997~~ | 10+ trucks / multi-location |

### Contractors Table (Key Columns)
```sql
client_id, client_name, active, plan, subscription_status,
phone, callback_phone, email, city, state, zip_codes,
crm_system, bilingual, services (JSONB), dashboard_code,
stripe_customer_id, stripe_subscription_id,
twilio_number, missed_call_sms, business_hours (JSONB)
```

---

## Critical GitHub Patterns (Don't Relearn)
- Always fetch SHA via `github:get_file_contents` immediately before `create_or_update_file`
- Use `github:push_files` (array) for multi-file atomic commits
- `.github/` path blocked via API — push workflow files locally
- Frontend API calls must use hardcoded Railway URL — relative `/api/` paths hit Cloudflare
- Railway uses `npm install` (not `npm ci`) — `package.json` changes auto-install on redeploy

## Health Check (Run at Start of Every Session)
```bash
curl https://plumblead-production.up.railway.app/api/health
# Expected: {status:ok, db:connected, waterZips:900+, smsFrom:+16232632823}
```

---
*Last updated: April 14, 2026 — End of H3 AquaOps integration session*
