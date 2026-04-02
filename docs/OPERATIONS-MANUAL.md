# PlumbLead.ai — Operations Manual
### Version 1.0 | April 2026

---

## TABLE OF CONTENTS

1. [How the Platform Works — End to End](#1-how-the-platform-works)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Onboarding a New Plumber — Step by Step](#3-onboarding-a-new-plumber)
4. [What You Need From the Plumber](#4-what-you-need-from-the-plumber)
5. [Website Integration Options](#5-website-integration-options)
6. [The n8n Workflow — How Leads Route](#6-the-n8n-workflow)
7. [Dashboard Access](#7-dashboard-access)
8. [Pre-Launch Checklist](#8-pre-launch-checklist)
9. [Going Fully Live — What's Still Needed](#9-going-fully-live)
10. [Pricing & Billing](#10-pricing--billing)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. HOW THE PLATFORM WORKS

### The Full Lead Journey (Homeowner Perspective)

```
Homeowner lands on plumber's website
        ↓
Clicks "Get Free Quote" button (or chatbot widget pops up)
        ↓
Fills out 4-step quote tool at plumblead.ai/quote
  Step 1: Select service (12 categories)
  Step 2: Describe the job + enter zip code
  Step 3: Name, phone, email
  Step 4: AI generates estimate range + next steps
        ↓
AI qualification runs (OpenClaw → Gemini)
  - Lead scored: Emergency / High Urgency / Routine
  - Price range generated
  - Cross-sell opportunities flagged
        ↓
Lead payload POSTed to Railway backend → /api/leads
        ↓
Railway forwards to n8n webhook
        ↓
n8n BRANCH A — Homeowner Lead:
  - SMS to homeowner within 60 seconds confirming receipt
  - Email alert to Ryan (or plumber owner)
  - 2-hour SMS follow-up if no response
        ↓
Plumber calls/texts to close
```

### The Full Trial Signup Journey (Plumber Perspective)

```
Plumber visits plumblead.ai
        ↓
Clicks "Start Free Trial" → /submit-trial
        ↓
Fills out: name, company, phone, email, trucks, CRM, city
        ↓
Payload POSTed to /api/leads with type: "trial_signup"
        ↓
n8n BRANCH B — Trial Signup:
  - Immediate SMS confirmation to plumber's mobile
  - Email alert to ryan@plumblead.ai with all details
  - You manually configure their account within 2 hours
```

---

## 2. TECH STACK & INFRASTRUCTURE

| Layer | Service | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite | Hosted on Railway |
| Backend API | Node.js / Express (server.ts) | Hosted on Railway |
| Primary AI | OpenClaw gateway (http://178.156.236.80:18789/v1) | Falls back to Gemini |
| Fallback AI | Google Gemini (gemini-2.0-flash) | Via GEMINI_API_KEY |
| Automation | n8n (self-hosted) | Your VPS |
| SMS | Twilio | Number: +1 833 558 0877 |
| DNS | Cloudflare | plumblead.ai |
| Domain | plumblead.ai | Live |
| Repo | github.com/rkumpula78/plumblead | Main branch auto-deploys |

### Environment Variables (Railway)

```
GEMINI_API_KEY=your_key
N8N_WEBHOOK_URL=https://your-n8n.domain/webhook/plumblead-quote
OPENCLAW_API_ENDPOINT=http://178.156.236.80:18789/v1
OPENCLAW_API_KEY=your_key
PORT=3000
```

---

## 3. ONBOARDING A NEW PLUMBER — STEP BY STEP

### When a Trial Signup Comes In

You'll receive:
- Email to ryan@plumblead.ai with full signup details
- The plumber gets an SMS confirmation immediately

### Your Onboarding Checklist (2-Hour Window)

**Step 1 — Review Their Signup**
- [ ] Check email for trial signup notification
- [ ] Note: company name, CRM, truck count, city/market

**Step 2 — Configure Their Pricing (if custom)**
- [ ] Open `src/data/az-water-data.json` (or your client config)
- [ ] Add their service area zip codes if outside default coverage
- [ ] Adjust base rates if they want custom pricing vs. defaults
- [ ] For ProMax-style dedicated client: create `/clients/[slug]/` config

**Step 3 — Get Their Widget Live**
- [ ] Send them the embed snippet (see Section 5 below)
- [ ] Confirm their website platform (WordPress, Wix, Squarespace, custom)
- [ ] Either walk them through installing it OR install it for them

**Step 4 — Set Up Lead Routing**
- [ ] Confirm their preferred lead delivery method:
  - SMS to their mobile (default — already live)
  - Email to owner/dispatcher
  - CRM webhook (ServiceTitan or HCP — requires API key from them)
- [ ] Update n8n to add their number to lead notifications if multi-tenant

**Step 5 — Test Everything**
- [ ] Submit a test quote from their website
- [ ] Confirm they receive the SMS
- [ ] Confirm the lead shows in your dashboard

**Step 6 — Send Welcome Email**
- [ ] Login credentials (if dashboard access enabled)
- [ ] Link to their quote tool URL
- [ ] The embed snippet
- [ ] Your mobile number for support

---

## 4. WHAT YOU NEED FROM THE PLUMBER

### Required (Collect at Onboarding)

| Info | Why You Need It | How to Get It |
|---|---|---|
| Mobile phone number | SMS lead alerts | Trial signup form |
| Email address | Lead email alerts | Trial signup form |
| Service area zip codes | Quote tool geo-filtering | Ask during onboarding call |
| Website URL | Embed the widget | Trial signup or call |
| Website platform | Know how to install widget | Ask: "Is your site on WordPress, Wix, etc?" |
| CRM name | Lead routing | Trial signup form |
| After-hours preference | Route leads differently at night | Ask: "Do you want after-hours leads to go to voicemail or SMS?" |

### Optional (Nice to Have)

| Info | Why |
|---|---|
| ServiceTitan API key | Automatic CRM push (advanced) |
| Housecall Pro API key | Automatic CRM push (advanced) |
| Company logo + brand colors | Custom-branded quote tool |
| Specific services to highlight | Customize service card order |
| Pricing preferences | Override default estimate ranges |
| Staff dispatcher number | CC on lead alerts |

### You Do NOT Need

- Their hosting credentials
- Access to their website backend
- DNS access
- Payment processor info (upfront)

The widget is a simple JavaScript snippet that works on any website. You never need to touch their server.

---

## 5. WEBSITE INTEGRATION OPTIONS

### Option A — Chatbot Widget (Recommended — Zero IT Required)

This is a floating chat bubble that appears on every page of their site. Homeowners click it, the AI chat begins, and leads flow to you.

**The Snippet (send this to the plumber):**

```html
<!-- PlumbLead.ai Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://plumblead.ai/widget.js';
    s.setAttribute('data-client', 'YOUR_CLIENT_ID');
    s.setAttribute('data-color', '#F5A623');
    document.head.appendChild(s);
  })();
</script>
```

**Installation by platform:**
- **WordPress:** Paste into Appearance → Theme Editor → footer.php, OR use a plugin like "Insert Headers and Footers"
- **Wix:** Settings → Custom Code → Add code to `<body>` → All Pages
- **Squarespace:** Settings → Advanced → Code Injection → Footer
- **GoDaddy Website Builder:** Settings → SEO → Footer Code
- **Custom HTML:** Paste before the `</body>` tag on every page

> ⚠️ NOTE: The `/widget.js` file is not yet built. This is a pre-launch to-do item (see Section 9).

### Option B — Dedicated Quote Page Link

Simpler. No code required. The plumber just links to:

```
https://plumblead.ai/quote
```

They add a button on their site: **"Get a Free Instant Quote"** → links to that URL.

This works today, right now, with zero setup. Downside: takes the user off their site.

### Option C — iFrame Embed

Embeds the quote tool directly in their own website page:

```html
<iframe
  src="https://plumblead.ai/quote"
  width="100%"
  height="800"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

Works on any platform. Lead routing and SMS still fire normally.

### Option D — Dedicated Client Subdomain (Premium)

For Pro/Agency clients who want full white-label:
- `quotes.smithplumbing.com` → points to PlumbLead via Cloudflare CNAME
- Requires: they add a CNAME record in their DNS (you send them one line to add)
- You configure their client config JSON in the repo

---

## 6. THE N8N WORKFLOW

### File Location
`n8n/plumblead-workflow-v3.json` in the repo

### How to Import
1. Open your n8n instance
2. Create New Workflow
3. Click ⋮ menu → Import from File
4. Upload `plumblead-workflow-v3.json`
5. Configure credentials (Twilio, Email/SMTP)
6. Activate the workflow
7. Copy the webhook URL → paste into Railway env var `N8N_WEBHOOK_URL`

### Workflow Logic

```
Webhook (POST to /webhook/plumblead-quote)
    ↓
IF node — checks body.type field
    ↓
  [TRUE = "trial_signup"]          [FALSE = homeowner lead]
    ↓                                    ↓
Respond ACK                          Respond ACK
    ↓                                    ↓
Email ryan@plumblead.ai              SMS homeowner (< 60s)
  (full signup details)                  ↓
    ↓                                Email Ryan (lead alert)
SMS plumber                             ↓
  (confirmation)                    Wait 2 hours
                                         ↓
                                    SMS homeowner follow-up
```

### Credentials You Need to Configure in n8n

| Credential | Where to Add | Notes |
|---|---|---|
| Twilio Account SID | n8n Credentials → Twilio | From twilio.com/console |
| Twilio Auth Token | n8n Credentials → Twilio | Same place |
| SMTP / Email | n8n Credentials → Email | Use Gmail SMTP or SendGrid |

### Adding a New Plumber's Phone to Lead Alerts

When you onboard a new client, add an additional Twilio SMS node in n8n:
1. Duplicate the "SMS Homeowner" node after the lead branch
2. Change the `to` number to the plumber's mobile
3. Update the message: "New lead for [Company]: {name}, {phone}, {serviceType} — {estimateRange}"
4. Connect it in sequence after the homeowner SMS

For scale (5+ clients), you'll want to add a `clientId` field to the lead payload and use a Switch node to route to different phone numbers.

---

## 7. DASHBOARD ACCESS

**URL:** `plumblead.ai/dashboard`

**Current Auth:** Access code (hardcoded in Dashboard.tsx)

**What the Dashboard Shows:**
- Lead table (all inbound leads)
- Status dropdowns (New → Contacted → Booked → Lost)
- Lead stats (total, high urgency, booked)
- Water softener sizing calculator
- Margin calculator

**For Multi-Client Setup:**
Currently one shared dashboard. Before scaling to multiple clients:
- Add client-specific views filtered by `clientId`
- Or give each client their own access code that filters their leads
- Or build `/dashboard/[clientId]` routes with individual auth

---

## 8. PRE-LAUNCH CHECKLIST

Things that MUST work before you start marketing:

### Backend / Infrastructure
- [ ] Railway deployment is live and stable
- [ ] `/api/health` returns `{"status": "ok"}` at plumblead-production.up.railway.app/api/health
- [ ] `/api/quote` returns a valid estimate (test it)
- [ ] `/api/leads` successfully forwards to n8n
- [ ] n8n workflow is active (not just saved — must be toggled ON)
- [ ] Twilio SMS sends successfully (send yourself a test)
- [ ] ryan@plumblead.ai email is receiving (set up email routing in Cloudflare or forward to Gmail)

### Quote Tool
- [ ] All 12 services work and return estimates
- [ ] Spanish toggle works
- [ ] Emergency triage displays correctly
- [ ] Lead capture (Step 3) submits without errors
- [ ] You receive SMS + email after a test submission

### Trial Signup
- [ ] `/submit-trial` page loads at plumblead.ai/submit-trial
- [ ] Form validates correctly (phone, email)
- [ ] Submission fires correctly and you receive notification
- [ ] Plumber receives SMS confirmation

### Website & UX
- [ ] Landing page loads clean on mobile
- [ ] All nav links work
- [ ] Chatbot widget loads and responds
- [ ] /privacy and /terms pages live
- [ ] "Start Free Trial" buttons link to /submit-trial

### Legal / Business
- [ ] Terms of Service covers your liability for AI-generated estimates
- [ ] Privacy Policy covers SMS opt-in language (TCPA compliance)
- [ ] You have a simple service agreement template for clients
- [ ] Stripe or payment link ready for when trial converts to paid

---

## 9. GOING FULLY LIVE — WHAT'S STILL NEEDED

### Priority 1 — Must Have Before First Paying Customer

| Item | What It Is | Effort |
|---|---|---|
| Widget JS file | `/widget.js` — the embeddable chat/quote bubble for client sites | Medium (2-4hrs) |
| ryan@plumblead.ai routing | Email needs to actually receive mail (Cloudflare + Gmail forward) | 30 min |
| Stripe payment link | So trial → paid converts cleanly | 30 min |
| SMS opt-in language | TCPA requires homeowners to consent to SMS — add checkbox to quote Step 3 | 1hr |
| n8n live & tested | Import v3 workflow, configure Twilio + email creds, activate | 1hr |

### Priority 2 — Before 5+ Clients

| Item | What It Is | Effort |
|---|---|---|
| Multi-client lead routing | Switch node in n8n routes by clientId | Medium |
| Client config system | JSON config per client for pricing, branding, service area | Medium |
| Dashboard auth per client | Each client logs in and sees only their leads | Medium |
| Google Analytics / Plausible | Track conversion on landing page and quote tool | Easy |
| CRM live integrations | ServiceTitan + HCP APIs for automatic job creation | Hard |

### Priority 3 — Growth Features

| Item | Notes |
|---|---|
| Voice AI answering | Missed call → AI answers and captures lead |
| Photo-based quoting | Homeowner uploads photo, AI quotes from image |
| Review request automation | Post-job SMS asks for Google review |
| Referral tracking | UTM links per contractor for attribution |

---

## 10. PRICING & BILLING

### Current Pricing Structure

| Plan | Setup | Monthly | Who It's For |
|---|---|---|---|
| Starter | $0 | $97 | 1-2 truck owner-operators |
| Pro | $0 | $197 | 2-10 trucks, wants CRM routing |
| Agency | $0 | $497 | Multi-location or resellers |

### Trial → Paid Conversion Flow

1. Plumber submits trial at `/submit-trial`
2. You configure their account manually within 2 hours
3. After 14 days, you send invoice via Stripe payment link
4. If they don't pay, you pause their lead routing in n8n
5. If they pay, they're live on monthly billing

### What "Configured" Means for Each Plan

**Starter:**
- Add their phone to n8n homeowner lead notifications
- Give them Option B or C integration (link or iFrame)
- Grant dashboard access with their access code

**Pro:**
- Everything in Starter
- Set up CRM webhook if they use ServiceTitan/HCP
- Configure custom pricing JSON if requested
- Give them embed widget snippet (Option A)

**Agency:**
- Everything in Pro × up to 5 locations
- Create `/clients/[slug]/` config and portal
- Dedicated onboarding call

---

## 11. TROUBLESHOOTING

### "Lead submitted but I didn't get a notification"
1. Check Railway logs: railway.app → your project → Logs
2. Confirm `N8N_WEBHOOK_URL` env var is set in Railway
3. Confirm n8n workflow is **active** (green toggle)
4. Test n8n webhook manually: POST to the webhook URL with sample JSON
5. Check Twilio logs for SMS delivery errors

### "Quote tool returns an error"
1. Check OpenClaw is running at `http://178.156.236.80:18789/v1`
2. Gemini fallback should kick in — check `GEMINI_API_KEY` is set
3. Test `/api/quote` directly via Postman or curl

### "SMS isn't sending"
1. Twilio console → Logs → check for errors
2. Verify Twilio number (+18335580877) has SMS enabled
3. Confirm n8n Twilio credentials are not expired
4. Note: SMS to landlines will fail silently — always use mobile numbers

### "Chatbot gives a wall of text"
- The system prompt in `server.ts` limits responses to 2-4 sentences
- If OpenClaw ignores this, it's a model instruction issue — escalate to Pepe
- Gemini fallback respects the instruction reliably

### Railway Redeploy
```bash
git push origin main  # auto-deploys via Railway GitHub integration
```
Or manually trigger from Railway dashboard.

---

*Last updated: April 2026 | PlumbLead.ai | ryan@plumblead.ai | (833) 558-0877*
