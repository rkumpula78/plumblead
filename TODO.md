# PlumbLead.ai — TODO

## ✅ Done
- [x] Domain secured: plumblead.ai
- [x] Product architecture documented
- [x] Go-to-market plan written
- [x] n8n workflow built (Speed-to-Lead MVP)
- [x] Quote tool frontend built (12 services, 4-step flow)
- [x] Landing page built (full marketing site)
- [x] Twilio number acquired: +1 833 558 0877
- [x] Water quality intelligence module built (12 AZ cities, zip lookup, hardness data, cost calculator, softener sizing, recommendations)
- [x] Emergency triage mode (step-by-step instructions for burst pipes/leaks)
- [x] Spanish language support (full translation layer with toggle)
- [x] Water quality report integrated into quote tool (auto-shows based on zip code)
- [x] "Free Water Quality Report" and "Water Filtration/RO" service cards added
- [x] Softener sizing calculator for plumber dashboard (with margin calculator + sales talking points)

## 🔧 Ryan — Next Steps (When You Wake Up)
- [ ] Point plumblead.ai DNS to Cloudflare (Namecheap → Custom DNS)
- [ ] Complete Twilio toll-free verification (or grab a local number for faster activation)
- [ ] Set up n8n credentials:
  - [ ] TWILIO_ACCOUNT_SID environment variable
  - [ ] TWILIO_PHONE_NUMBER → +18335580877
  - [ ] HTTP Basic Auth credential for Twilio
  - [ ] Note your Anthropic credential ID
- [ ] Import n8n workflow JSON (`projects/plumblead/n8n-workflow.json`)
- [ ] Test webhook with curl command (see ARCHITECTURE.md)
- [ ] Text 2-3 plumber buddies (template in GTM.md)

## 🆕 Future Features (Documented)
- [ ] **Septic Services Marketplace** — Multi-provider lead distribution for septic pumping. See `features/septic-marketplace.md`
- [ ] **Sewer Repair Advisor** — AI decision engine for cast iron pipe repair (lining vs bursting vs dig). Housing age mapping. See `features/sewer-repair-advisor.md`
- [ ] **Photo-based quoting** — Homeowner uploads photo → AI diagnoses → better quote
- [ ] **Voice AI answering** — Twilio Voice + AI answers calls, qualifies, books
- [ ] **Smart Water & Home Automation** — Leak detection (Flo/Phyn), smart sprinklers, DOE water heater compliance, "Home Water Score." See `features/smart-water-automation.md`
- [ ] **Post-job review automation** — Auto Google review requests after job completion
- [ ] **Repeat customer recognition** — AI remembers past service history

## 🔜 Next Build Phase
- [ ] Host quote tool + landing page (Cloudflare Pages or simple VPS)
- [ ] Connect quote tool webhook URL to live n8n instance
- [ ] Set up ryan@plumblead.ai email (Cloudflare email routing)
- [ ] Add Google Analytics / Plausible to landing page
- [ ] Build client config system (per-plumber pricing JSON)
- [ ] ServiceTitan API integration
- [ ] Housecall Pro API integration
- [ ] Follow-up SMS sequences (2hr, 24hr, 72hr)
- [ ] Simple dashboard for plumber clients
- [ ] Embed/widget version of quote tool

## 📁 Project Files
```
projects/plumblead/
├── README.md                          — Product overview
├── ARCHITECTURE.md                    — Full technical spec
├── GTM.md                             — Go-to-market & outreach
├── TODO.md                            — This file
├── n8n-workflow.json                  — Import into n8n
├── quote-tool/
│   ├── index.html                     — Interactive quote tool (homeowner-facing)
│   └── water-quality.js               — Water quality intelligence module
├── water-quality/
│   └── az-water-data.json             — Arizona water quality database (12 cities, 100+ zips)
└── landing-page/
    └── index.html                     — Marketing site (sells to plumbers)
```
