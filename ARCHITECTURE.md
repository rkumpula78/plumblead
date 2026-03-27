# PlumbLead.ai — Product Architecture

## 1. Instant Quote Tool (Website Embed)

### Service Categories & Price Ranges

| Service | Low | Mid | High | Variables |
|---------|-----|-----|------|-----------|
| **Emergency/Leak Repair** | $150 | $400 | $800 | Location of leak, severity, time of day |
| **Drain Cleaning** | $150 | $275 | $400 | Number of drains, snake vs hydro-jet |
| **Water Heater Install (Tank)** | $1,200 | $2,000 | $3,500 | 40 vs 50 gal, gas vs electric, location |
| **Water Heater Install (Tankless)** | $2,500 | $3,500 | $5,000 | Brand, gas line work needed |
| **Faucet/Fixture Install** | $150 | $300 | $500 | Number of fixtures, complexity |
| **Toilet Repair/Replace** | $150 | $300 | $600 | Repair vs full replacement |
| **Garbage Disposal** | $200 | $350 | $500 | New install vs replacement |
| **Sewer Line Repair** | $1,500 | $3,500 | $7,000 | Trenchless vs dig, length |
| **Slab Leak Repair** | $2,000 | $3,500 | $5,000 | Detection + repair, reroute option |
| **Repipe (Whole House)** | $4,000 | $8,000 | $15,000 | Sq footage, # bathrooms, material |
| **Gas Line Work** | $300 | $700 | $1,500 | New run vs repair, length |
| **Water Softener Install** | $800 | $1,500 | $3,000 | Unit type, plumbing modifications |

### Quote Flow (What the Homeowner Sees)

```
Step 1: "What do you need help with?"
        → Select service category (visual cards with icons)

Step 2: "Tell us a bit more"
        → 2-3 service-specific questions (sliders/buttons, not forms)
        → e.g. Water heater: Tank or Tankless? | Gas or Electric? | Urgency?

Step 3: "Your estimated range"
        → Shows price range (not a single number — manages expectations)
        → "Most homeowners in [Phoenix] pay $X–$Y for this"
        → CTA: "Get your exact quote — a plumber will confirm within 60 seconds"

Step 4: Lead capture
        → Name, phone, email, preferred time
        → Submit → AI takes over immediately
```

### Per-Client Customization

Each plumbing company gets their own pricing loaded in:
- Base rates per service (from their actual price book)
- After-hours multiplier (1.5x typical)
- Zip code modifiers (if they charge differently by area)
- Service area boundaries (don't quote outside their range)

Stored as a simple JSON config per client. Takes 30 min to set up from their price book.

## 2. Speed-to-Lead AI Agent

### Trigger → Response Flow (n8n)

```
INBOUND LEAD (form submit, chat, missed call)
    │
    ▼
[n8n Webhook] receives lead data
    │
    ▼
[AI Qualification] (Claude API)
    - Confirm service needed
    - Confirm address is in service area
    - Assess urgency (emergency vs routine)
    - Score lead (1-10)
    │
    ▼
[Instant Response] (<60 seconds from lead)
    - SMS to homeowner: "Hi [name], this is [Company]. Got your request
      for [service]. Based on what you described, most [service] jobs
      run $X-$Y. I can get a plumber to confirm your exact price.
      Does [next available slot] work for an estimate?"
    - Email backup with same info + company branding
    │
    ▼
[Team Alert]
    - SMS/push to owner/dispatcher: "New lead: [name], [service],
      [urgency], estimated $X-Y. AI already responded. Appointment
      proposed: [time]."
    │
    ▼
[CRM Push]
    - Create job/lead in ServiceTitan or Housecall Pro
    - Attach quote range, lead score, conversation log
    │
    ▼
[Follow-up Sequence] (if no booking in 2 hrs)
    - 2hr: "Still need help with [service]? We have availability [time]"
    - 24hr: "Wanted to follow up on your [service] request"
    - 72hr: Final touch + review request if they went elsewhere
```

### AI Personality

- Friendly, professional, not salesy
- Speaks like a dispatcher, not a bot
- Uses the plumbing company's name and branding
- Knows common plumbing Q&A (trained on FAQ per client)
- Escalates to human when: price objection, complex scope, angry customer

## 3. AI Chatbot (Website Widget)

### Capabilities
- Answer common questions ("Do you work on weekends?" "Do you service [zip]?")
- Walk through the quote flow conversationally
- Book appointments directly
- Handle after-hours inquiries
- Collect lead info naturally through conversation

### Knowledge Base (Per Client)
- Services offered + pricing
- Service area (zip codes)
- Hours of operation
- Licensing/insurance info
- Common FAQ (15-20 questions)
- Emergency protocol

## 4. CRM Integrations

### ServiceTitan
- API: REST API (v2)
- Create leads, book jobs, attach notes
- Pull availability for booking
- Sync customer records

### Housecall Pro
- API: REST API
- Create estimates, schedule jobs
- Customer creation
- Availability check

### Fallback
- Google Calendar integration (for smaller shops not on ST/HCP)
- Webhook to any CRM with API

## 5. Dashboard

### What the Plumber Sees
- Leads today / this week / this month
- Average response time (their vs. AI)
- Booking rate (leads → appointments)
- Revenue from AI-booked jobs
- Quote accuracy (estimated vs. actual invoice)

### Simple — Not a full analytics platform
- Single page, mobile-friendly
- Updated in real-time
- Weekly email summary

## 6. Tech Stack

| Component | Tool | Notes |
|-----------|------|-------|
| Workflow engine | n8n (self-hosted) | Core automation |
| AI/LLM | Claude API | Qualification, chat, responses |
| Frontend (quote tool) | HTML/JS embed | Lightweight, fast loading |
| Frontend (dashboard) | Simple web app | Can start with Retool/Softr |
| SMS | Twilio | Outbound texts |
| Email | SendGrid or Resend | Transactional emails |
| CRM integration | ServiceTitan API / HCP API | Per-client config |
| Hosting | VPS (Hetzner/DO) | n8n + frontend |
| Database | PostgreSQL | Leads, configs, analytics |
| Domain | plumblead.ai | Cloudflare DNS |

## 7. MVP Scope (Week 1)

**Ship this first:**
- [ ] Instant quote tool (web page, not embed yet)
- [ ] Speed-to-lead SMS response via n8n + Claude + Twilio
- [ ] Basic lead dashboard
- [ ] One CRM integration (ServiceTitan OR Housecall Pro)
- [ ] Landing page at plumblead.ai

**Add after first client:**
- [ ] Website embed version of quote tool
- [ ] AI chatbot widget
- [ ] Second CRM integration
- [ ] Follow-up sequences
- [ ] Full analytics dashboard
