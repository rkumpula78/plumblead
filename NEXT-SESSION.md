# PlumbLead.ai — Next Session Handoff
**K48 Ventures LLC | Updated April 15, 2026**

This document is the single source of truth for any new Claude session. Read this first, then proceed.

---

## Current System Status

```bash
curl https://plumblead-production.up.railway.app/api/health
# {"status":"ok","db":"connected","waterZips":502,"smsFrom":"+16232632823","aquaops":"configured"}
```

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
| Water Intel | AquaOps H3 Engine | ✅ Live — 502 zips (AZ + WA), equipment recs in plumber SMS |

### Repo: `rkumpula78/plumblead` · Branch: `main` · Local: `~/Desktop/plumblead`

### Key Files
```
server.ts                          — Full Express backend (Railway)
src/services/geminiService.ts      — AI quote generation
src/services/aquaopsService.ts     — H3 water analysis + equipment recs
src/data/az-water-data.json        — AZ water data (imported at compile time)
src/data/wa-water-data.json        — WA water data (imported at compile time)
src/components/QuoteTool.tsx       — Homeowner quote widget
src/components/Dashboard.tsx       — Lead management dashboard
src/components/demos/              — ProMax + GPS Plumbing demo pages
tsconfig.server.json               — includes src/data/**/* for JSON imports
nixpacks.toml                      — Railway build config
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
| `clientName` hardcoded as "Your Local Plumber" in `QuoteTool.tsx` | CRITICAL | Fix before any demo — 2 places in file |
| n8n trial signup routing | CRITICAL | Verify `body.type === "trial_signup"` routes correctly |
| Stripe webhook end-to-end | CRITICAL | Send test event from Stripe dashboard, verify Postgres updates |
| HomePlus dealer account not activated | HIGH | Equipment margin stream blocked until this is done |
| Multi-tenant config layer | IMPORTANT | Every new client requires code edit until this is built |
| 10DLC SMS campaign | PENDING | 24-48hr carrier approval window, no action needed |

### Resolved This Session
- ✅ waterZips: 0 → 502 — fixed by importing JSON at compile time via `resolveJsonModule`
- ✅ aquaops: local-catalog → configured — H3 env vars added to Railway
- ✅ TypeScript compile errors — `p.name` → `p.equipment_name`, duplicate function removed
- ✅ Railway build cache bust — `nixpacks.toml` comment forces fresh build

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

### Railway Build Cache
Railway aggressively caches Docker layers. If a build appears to succeed but old code is running:
- Change `nixpacks.toml` (add/modify a comment) to bust the cache
- The `# cache-bust: vN` comment pattern works reliably

### TreatmentRecommendation Interface
The field is `equipment_name` (not `name`). Any code referencing `p.name` on a rec will fail TypeScript compilation.

---

## Phase 1: Close First Paying Clients (Do Now)

**Step 1 — Fix demo blockers (30 min)**
```
File: src/components/QuoteTool.tsx
Search: "Your Local Plumber" (2 places)
Change to: contractor's actual company name before each demo
```

**Step 2 — Verify AquaOps engine**
```bash
curl "https://plumblead-production.up.railway.app/api/aquaops/recommend?zip=85383&serviceType=Water+Heater" \
  -H "x-admin-key: plumblead-admin-2026"
# Should return: Peoria AZ, 16 GPG, Very Hard, Fleck 5600SXT recommendation
```

**Step 3 — Verify Stripe webhook**
```
Stripe Dashboard → Webhooks → Send test event: customer.subscription.updated
Check Railway logs for: "Stripe: customer.subscription.updated — plan=pro, status=active"
Check Postgres: contractor plan + subscription_status updated
```

**Step 4 — Text ProMax and GPS Plumbing**
- ProMax Water Heaters & Plumbing — Evan Niemela, Monroe WA → plumblead.ai/demo/promax
- GPS Plumbing Inc. — Monroe WA → plumblead.ai/demo/gps

Script: *"Hey [Name], Ryan from PlumbLead.ai. Your demo page has been live for a few weeks — wanted to follow up and see if you're ready to make it live on your site. Takes 20 minutes to set up. When's a good time?"*

---

## Phase 2: Activate Equipment Revenue Stream

**HomePlus dealer account**
- Dealer agreement signed — needs activation
- Once active, update `CATALOG` in `src/services/aquaopsService.ts` with real SKUs and dealer prices
- Goal: one end-to-end equipment sale — service call → water report → softener sale → K48 supplies

---

## Phase 3: Config-Driven Widget (Before 5th Client)

Top scaling blocker. Every new client requires a code edit to `QuoteTool.tsx`.

- Add `config` JSONB column to `contractors` Postgres table
- `GET /api/contractor-config?clientId=xxx` endpoint
- `QuoteTool.tsx` fetches config on mount
- Demo pages become `<DynamicDemo clientId="promax-water-heaters" />`

---

## Phase 4: Outreach System (30-Day Clock)

Rule of 100: 40 cold emails + 40 DMs + 20 calls = 100 primary actions/day.

- Build prospect list: 500 WA + AZ plumbers (Google Maps, Angi, Yelp, license boards)
- Cold email: Apollo or Instantly, 40/day, 3-5 sequence templates
- DMs: FB/IG/LinkedIn plumber groups

Landing page needs "The Full Loop" section + ROI calculator — currently undersells the water intel + equipment upsell value.

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

---

## Critical GitHub Patterns (Don't Relearn)
- Always fetch SHA via `github:get_file_contents` immediately before `create_or_update_file`
- Use `github:push_files` (array) for multi-file atomic commits
- `.github/` path blocked via API — push workflow files locally
- Frontend API calls must use hardcoded Railway URL — relative `/api/` paths hit Cloudflare
- Railway uses `npm install` (not `npm ci`) — `package.json` changes auto-install on redeploy
- If Railway serves stale code: add `# cache-bust: vN` comment to `nixpacks.toml`

---

*Last updated: April 15, 2026 — waterZips live, H3 configured, Phase 1 unblocked*
