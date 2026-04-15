# PlumbLead.ai — Next Session Handoff
**K48 Ventures LLC | Updated April 15, 2026**

This document is the single source of truth for any new Claude session. Read this first, then proceed.

---

## Current System Status

```bash
curl https://plumblead-production.up.railway.app/api/health
# {"status":"ok","db":"connected","waterZips":502,"smsFrom":"+16232632823","aquaops":"configured"}

# Verify contractor config endpoint (new as of April 15):
curl "https://plumblead-production.up.railway.app/api/contractor-config?clientId=promax-water-heaters"
# Should return ProMax DemoConfig JSON

# Verify dynamic demo pages:
# plumblead.ai/demo/promax-water-heaters
# plumblead.ai/demo/gps-plumbing
```

### Infrastructure — Live in Production
| Layer | Service | Status |
|---|---|---|
| Frontend | Cloudflare Workers → plumblead.ai | ✅ Live, auto-deploy via GitHub Actions |
| Backend | Railway (Node/Express) | ✅ Live, auto-deploy on push to `main` |
| Database | Railway Postgres | ✅ Live, leads + contractors tables + config JSONB column |
| SMS | Twilio (623) 263-2823 | ✅ Live, 10DLC pending carrier approval |
| Payments | Stripe (3 tiers) | ✅ Integrated, webhook live |
| AI | Google Gemini 2.0 Flash | ✅ Quote + chat generation |
| Automation | n8n Lead Router v3 | ✅ Active, trial signup routing verified |
| Water Intel | AquaOps H3 Engine | ✅ Live — 502 zips (AZ + WA), equipment recs in plumber SMS |
| Config-driven widget | GET /api/contractor-config | ✅ Live — no code edit needed for new clients |

### Repo: `rkumpula78/plumblead` · Branch: `main` · Local: `~/Desktop/plumblead`

### Key Files
```
server.ts                               — Full Express backend (Railway)
src/services/geminiService.ts           — AI quote generation
src/services/aquaopsService.ts          — H3 water analysis + equipment recs (local engine)
src/data/az-water-data.json             — AZ water data (imported at compile time)
src/data/wa-water-data.json             — WA water data (imported at compile time)
src/components/QuoteTool.tsx            — Homeowner quote widget (clientName from URL param)
src/components/Dashboard.tsx            — Lead management dashboard
src/components/demos/DynamicDemo.tsx    — Config-driven demo page (NEW — replaces per-client files)
src/components/demos/DemoShell.tsx      — Shared demo shell (quote + water tabs)
src/components/demos/ProMaxDemo.tsx     — Legacy file (still works, redirects to /demo/promax-water-heaters)
src/components/demos/GPSPlumbingDemo.tsx — Legacy file (still works, redirects to /demo/gps-plumbing)
tsconfig.server.json                    — includes src/data/**/* for JSON imports
nixpacks.toml                           — Railway build config
```

---

## Railway Environment Variables (All Set)
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
H3AQUAOPS_API_KEY       ✅ set
H3AQUAOPS_API_USER      ✅ set
H3AQUAOPS_API_PASS      ✅ set
```

---

## Known Issues / Outstanding

| Issue | Priority | Notes |
|---|---|---|
| Stripe webhook end-to-end | CRITICAL | Send test event from Stripe dashboard, verify Postgres updates. Not yet done. |
| HomePlus dealer account not activated | HIGH | Equipment order URLs are stubs until activated — see H3 backend section below |
| 10DLC SMS campaign | PENDING | 24-48hr carrier approval window, no action needed |
| H3 live API response not used to override local recs | LOW | `apiEnrichment` fetched but only in briefText footer. Fine until dealer account active. |

### Resolved April 15, 2026
- ✅ `clientName` hardcoded as "Your Local Plumber" in `QuoteTool.tsx` — now reads from URL query param `?clientName=`
- ✅ n8n trial signup routing verified live — `type: "trial_signup"` arrives intact
- ✅ ProMax + GPS outreach texts drafted and sent
- ✅ Config-driven widget built — `GET /api/contractor-config`, `DynamicDemo.tsx`, `/demo/:clientId` route
- ✅ `config` JSONB column added to contractors table; ProMax + GPS seeded on startup
- ✅ Legacy `/demo/promax` and `/demo/gps` routes redirect to full slug URLs

### Resolved Previous Session
- ✅ waterZips: 0 → 502 — fixed by importing JSON at compile time via `resolveJsonModule`
- ✅ aquaops: local-catalog → configured — H3 env vars added to Railway
- ✅ TypeScript compile errors — `p.name` → `p.equipment_name`, duplicate function removed
- ✅ Railway build cache bust — `nixpacks.toml` comment forces fresh build

---

## H3 Water Treatment Backend — Full Status

### What's live and working
The intelligence layer is complete. Every lead with a zip code gets full water analysis before hitting n8n.

| Component | Status | Notes |
|---|---|---|
| `H3PlumberProEngine` local decision engine | ✅ Live | Hardness classification, softener sizing, resin selection, iron method, carbon type, RO/UV flags |
| Equipment catalog (11 SKUs) | ✅ Live | Fleck 5600SXT (3 sizes), TAC, RO, catalytic carbon, GAC, birm/greensand/air injection iron filters, UV, sediment |
| `buildPlumberBrief()` | ✅ Live | Called on every `/api/leads` and `/api/quote` request |
| Plumber SMS enrichment | ✅ Live | SMS to contractor includes hardness, issues, primary rec with dealer price + order URL |
| `GET /api/aquaops/recommend` | ✅ Live (admin) | `curl ".../api/aquaops/recommend?zip=85383&serviceType=Water+Heater" -H "x-admin-key: plumblead-admin-2026"` |
| H3 live API call | ✅ Wired | Calls `https://h3api.connectable.to/plumber-pro` if H3 creds set, falls back to local engine gracefully |
| DemoShell WaterTab | ✅ Live | Shows hardness, issues, recommendations with price ranges to homeowner |

### What's blocked on HomePlus dealer activation
| Gap | What changes when activated |
|---|---|
| SKUs + dealer prices | Update `EQUIPMENT_CATALOG` in `aquaopsService.ts` with real SKUs and actual dealer prices |
| Order URLs | Replace stub `h3api.connectable.to/plumber-pro?sku=...` URLs with live purchase links |
| Equipment margin revenue | `dealerMarginEst` is already calculated — just needs real prices |
| H3 live API enrichment | `apiEnrichment` object already fetched and passed through — wire it to override local recs if richer data returned |

**The rebuild is NOT required.** It's a catalog data update in one file (`aquaopsService.ts`, the `EQUIPMENT_CATALOG` const) plus verifying order URLs resolve to live purchase flows.

---

## Config-Driven Widget — How It Works (New as of April 15)

Adding a new contractor no longer requires a code edit.

**Flow:**
1. POST to `/api/contractors` (admin endpoint) with `clientId`, `companyName`, `phone`, and `config` (DemoConfig JSON)
2. Demo page is live at `plumblead.ai/demo/[clientId]` immediately — `DynamicDemo.tsx` fetches config from `/api/contractor-config?clientId=xxx`
3. Config priority: `contractors.config` JSONB column → in-memory `CONTRACTOR_CONFIGS` seed (covers ProMax + GPS) → 404

**DemoConfig shape:**
```typescript
{
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientColor: string;       // hex, e.g. '#1B4F8A'
  clientAccent: string;      // hex, e.g. '#F5A623'
  address: string;
  serviceArea: string;
  defaultZip: string;
  trustBadges: string[];
  services: { key: string; label: string; icon: string; hint: string }[];
  emergencyBanner?: string;  // optional — shows red banner at top
}
```

**Legacy redirects in place:**
- `plumblead.ai/demo/promax` → `plumblead.ai/demo/promax-water-heaters`
- `plumblead.ai/demo/gps` → `plumblead.ai/demo/gps-plumbing`

---

## Critical Technical Notes

### Water Data Architecture
JSON files are imported at **compile time** via TypeScript `resolveJsonModule`:
```typescript
import azWaterRaw from './src/data/az-water-data.json';
import waWaterRaw from './src/data/wa-water-data.json';
```
- `tsconfig.server.json` must include `"src/data/**/*"` in the `include` array
- JSON has city-keyed structure: `{ cities: { phoenix: { zip_codes: [...], ... } } }`
- `normalizeWaterJson()` in `server.ts` flattens to zip-keyed at startup
- Do NOT use `fs.readFile` or `path.join(__dirname, ...)` for these files — Railway's compiled output is in `dist-server/` and filesystem paths break

### QuoteTool clientName
`clientName` is now read from URL query param `?clientName=Encoded+Name` via `getClientName()`. Fallback is `'Your Local Plumber'`. Demo pages pass this via URL; the generic `/quote` page shows the fallback. No hardcoded string remains.

### Railway Build Cache
Railway aggressively caches Docker layers. If a build appears to succeed but old code is running:
- Change `nixpacks.toml` (add/modify a comment) to bust the cache
- The `# cache-bust: vN` comment pattern works reliably

### TreatmentRecommendation Interface
The field is `equipment_name` (not `name`). Any code referencing `p.name` on a rec will fail TypeScript compilation.

### GitHub MCP Timeout
The GitHub MCP tool times out on files >~40KB (server.ts is ~45KB). For large server.ts edits, make changes locally and push via git. Frontend files (components, services) are fine via API.

---

## Phase 1: Close First Paying Clients (Do Now)

**Step 1 — Verify Stripe webhook end-to-end**
```
Stripe Dashboard → Webhooks → Send test event: customer.subscription.updated
Check Railway logs for: "Stripe: customer.subscription.updated — plan=pro, status=active"
Check Postgres: contractor plan + subscription_status updated
```

**Step 2 — Follow up ProMax and GPS Plumbing**
- ProMax Water Heaters & Plumbing — Evan Niemela, (425) 495-1961 → plumblead.ai/demo/promax-water-heaters
- GPS Plumbing Inc. — Monroe WA, (425) 458-8548 → plumblead.ai/demo/gps-plumbing
- Texts sent April 15. If no response in 48hrs, follow up with a call.
- Script: *"Hey [Name], Ryan from PlumbLead.ai. Following up on my text — your demo page is live and ready. Takes 20 minutes to go live on your site. When's a good time?"*

**Step 3 — Activate HomePlus dealer account**
- Dealer agreement signed — needs activation
- Once active: update `EQUIPMENT_CATALOG` in `src/services/aquaopsService.ts` with real SKUs and prices
- Confirm order URLs at `h3api.connectable.to` resolve to live purchase flows
- Goal: one end-to-end equipment sale — service call → water report → softener sale → K48 margin

**Step 4 — Verify AquaOps engine**
```bash
curl "https://plumblead-production.up.railway.app/api/aquaops/recommend?zip=85383&serviceType=Water+Heater" \
  -H "x-admin-key: plumblead-admin-2026"
# Should return: Peoria AZ, 16 GPG, Very Hard, Fleck 5600SXT recommendation
```

---

## Phase 2: Outreach System (30-Day Clock)

Rule of 100: 40 cold emails + 40 DMs + 20 calls = 100 primary actions/day.

- Build prospect list: 500 WA + AZ plumbers (Google Maps, Angi, Yelp, license boards)
- Cold email: Apollo or Instantly, 40/day, 3-5 sequence templates
- DMs: FB/IG/LinkedIn plumber groups

Landing page needs "The Full Loop" section + ROI calculator — currently undersells the water intel + equipment upsell value.

---

## Phase 3: Onboarding New Clients (No Code Edit Required)

Config-driven widget is live. New client onboarding flow:

1. Call or text within 15 minutes of signup
2. Collect: business name, service area zips, services offered, CRM, bilingual?, callback number
3. POST to `/api/contractors` with full contractor record including `config` JSON
4. Demo page is live at `plumblead.ai/demo/[clientId]` immediately
5. Send setup email with demo URL, embed code, dashboard URL + access code

**Embed code:**
```html
<iframe src="https://plumblead.ai/quote?widget=1&client=[clientId]"
  width="100%" height="700" frameborder="0"
  style="border:none;max-width:680px;"></iframe>
```

**Dashboard access code format:** `[clientId]-2026` (auto-set on contractor creation)

---

## Architecture Reference

### Plumber SMS (Current Format)
```
🚨 EMERGENCY — Water Heater (Tank)
John Smith | 602-555-1234 | 85383 | Emergency

Water: 16 GPG Very Hard · Chloramine
Rec: Fleck 5600SXT — 48,000 Grain Softener (2-4 bath)
Dealer: $820 | Retail: $1900–$2700
Order: https://h3api.connectable.to/plumber-pro?sku=FLK-5600-48K

Dashboard: https://plumblead.ai/dashboard
```

### n8n Routing Logic
| Condition | Routing |
|---|---|
| `body.type === "trial_signup"` | ACK → Email Ryan (New Trial) → SMS to contractor |
| `body.source === "water-quality-report"` | ACK → SMS homeowner (hardness-specific) → Email Ryan |
| All other leads | ACK → SMS homeowner (60s) → Email Ryan → Wait 2hr → SMS follow-up |

### Pricing Tiers
| Plan | Price | Anchor | Target |
|---|---|---|---|
| Starter | $97/mo | ~~$297~~ | 1-2 trucks |
| Pro | $197/mo | ~~$497~~ | 3-10 trucks |
| Agency | $497/mo | ~~$997~~ | 10+ trucks / multi-location |

### ROI Frame
- Average water heater install: $1,400
- Pro plan: $197/mo → break-even = less than 1 job/month
- PlumbLead closes 3 extra jobs/month → $4,200 revenue on $197 spend

### Demo Pages
| Contractor | URL | clientId | Phone |
|---|---|---|---|
| ProMax Water Heaters & Plumbing | plumblead.ai/demo/promax-water-heaters | promax-water-heaters | (425) 495-1961 |
| GPS Plumbing Inc. | plumblead.ai/demo/gps-plumbing | gps-plumbing | (425) 458-8548 |

Legacy short URLs (`/demo/promax`, `/demo/gps`) redirect to the above.

---

## Critical GitHub Patterns (Don't Relearn)
- Always fetch SHA via `github:get_file_contents` immediately before `create_or_update_file`
- Use `github:push_files` (array) for multi-file atomic commits
- `.github/` path blocked via API — push workflow files locally
- Frontend API calls must use hardcoded Railway URL — relative `/api/` paths hit Cloudflare
- Railway uses `npm install` (not `npm ci`) — `package.json` changes auto-install on redeploy
- If Railway serves stale code: add `# cache-bust: vN` comment to `nixpacks.toml`
- **server.ts is ~45KB — GitHub MCP times out on writes to this file. Make large server.ts edits locally and push via git.**

---

*Last updated: April 15, 2026 — config-driven widget live, n8n routing verified, H3 intelligence layer complete, HomePlus activation pending*
