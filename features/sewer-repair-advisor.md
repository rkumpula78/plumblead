# PlumbLead Feature: Sewer Repair Advisor

## The Problem (Ryan's Own Experience)

When you have a failing cast iron sewer line, you're thrown into a world of confusing options:
- Pipe lining (CIPP) — what is it? Is it permanent? Does it work for my situation?
- Pipe bursting — how is it different from lining?
- Traditional dig & replace — is this overkill?
- Every plumber recommends what THEY do, not what's best for YOU
- No easy way to compare methods, costs, or find specialists
- You don't even know if your home HAS cast iron until something breaks

## The Feature: AI-Powered Sewer Repair Decision Engine

### For the Homeowner

**Step 1: "Does my home have cast iron pipes?"**

Simple diagnostic:
- When was your home built? (Pre-1975 = almost certainly cast iron)
- What's happening? (Slow drains, backups, odor, sinkholes, root intrusion)
- Any previous camera inspection? (Upload the video/photos)
- Address/zip code → cross-reference with housing age data

**Step 2: "What are my options?"**

Interactive comparison tool:

| Factor | Pipe Lining (CIPP) | Pipe Bursting | Dig & Replace |
|--------|-------------------|---------------|---------------|
| **What it is** | Epoxy-coated liner inserted into existing pipe | New pipe pulled through old pipe, breaking it apart | Excavate, remove old pipe, install new |
| **Best for** | Partial damage, no bellies, minimal root intrusion | Full replacement needed, relatively straight runs | Severe damage, bellied pipes, offset joints, complex layouts |
| **Not ideal for** | Severely collapsed pipes, major bellies | Sharp turns, connections to other lines | Small yards, landscaping you want to keep, under slabs |
| **Duration** | 1 day (cure time: 4-24 hrs) | 1-2 days | 2-5 days |
| **Disruption** | Minimal — no digging (unless access pit needed) | Moderate — two small access pits | Major — trench through yard/driveway |
| **Lifespan** | 50+ years | 50-100 years (new HDPE pipe) | 50-100 years |
| **Cost range** | $4,000-15,000 | $6,000-20,000 | $5,000-25,000+ |
| **Typical for 50ft line** | $6,000-8,000 | $8,000-12,000 | $8,000-15,000 |
| **Warranty** | 10-50 years (varies by contractor) | Often lifetime on pipe | Varies |

**Step 3: AI Recommendation**

Based on their inputs, PlumbLead generates a personalized recommendation:

> "Based on your 1968-built home in [zip], you likely have cast iron sewer lines
> that are 57 years old — past their typical 50-year lifespan. Given that you're
> experiencing slow drains and occasional backups but no sinkholes or collapsed
> sections, **pipe lining (CIPP) is likely your best option.** It's the least
> disruptive, fastest, and typically costs $6,000-8,000 for your home size.
>
> However, a camera inspection ($150-300) should be done first to confirm the pipe
> condition. If the inspection reveals bellied or collapsed sections, pipe bursting
> or dig & replace may be necessary.
>
> Want quotes from licensed sewer repair specialists in your area?"

**Step 4: Match with Specialists**

Same marketplace model as septic — lead goes to 2-3 qualified contractors:
- Filtered by method (some specialize in lining, others in bursting)
- Shows which methods each contractor offers
- Includes camera inspection pricing
- Reviews and ratings

### For the Plumber (Dashboard)

**Sewer Repair Estimator:**
- Input: pipe length, diameter, depth, access points, method
- Output: material cost, labor estimate, suggested pricing, margin

**Cast Iron Risk Map:**
- Overlay of housing age data by neighborhood/zip
- Identifies areas where homes are 50+ years old = cast iron reaching end of life
- Proactive marketing tool: "Send postcards to homes in these neighborhoods"
- "327 homes in [zip 85383] were built between 1960-1975. Their cast iron pipes are failing NOW."

### Housing Age Data Sources

This data is publicly available:
- **County assessor records** — year built for every parcel
- **Census ACS data** — housing age by tract/block group
- **Zillow/Redfin APIs** — year built per address
- **City permit records** — sewer repair permits show where problems are occurring

### Cast Iron Pipe Prevalence by Era

| Construction Era | Primary Sewer Pipe Material | Status Today |
|-----------------|---------------------------|--------------|
| Pre-1950 | Clay/terra cotta, some cast iron | Failing or failed |
| 1950-1975 | Cast iron (dominant), some Orangeburg | At or past end of life |
| 1975-1985 | Transition — cast iron to ABS/PVC | Mixed condition |
| Post-1985 | PVC/ABS plastic | Generally good |

### Revenue Model

| Revenue Stream | Amount |
|----------------|--------|
| Camera inspection referral fee | $25-50 per booking |
| Sewer repair lead (per-lead) | $100-200 per qualified lead |
| Per-booking fee | $200-500 per job booked |
| Contractor monthly subscription | $300-500/mo |

**Why higher than septic:** Sewer repair is a $5,000-25,000 job. Contractors will gladly pay $200-500 for a pre-qualified, pre-educated lead who already understands their options.

### The Competitive Moat

Nobody is doing this. The current experience for homeowners:
1. "My drains are slow" → Google → overwhelmed by options
2. Call one plumber → they recommend what they do
3. Call another → different recommendation
4. No way to compare methods objectively
5. End up overpaying or choosing the wrong method

PlumbLead becomes the **trusted advisor** before the plumber ever arrives. The homeowner shows up to the appointment EDUCATED. That's better for everyone.

### Arizona Opportunity

Arizona is a HUGE cast iron market:
- Massive post-war housing boom (1950s-1970s) in Phoenix metro
- Desert soil conditions accelerate cast iron deterioration
- Citrus trees (common in AZ yards) have aggressive root systems
- Sun City, Sun City West, Glendale, older Phoenix, older Mesa, older Tempe = goldmine
- Thousands of homes reaching the 50-year cast iron failure window RIGHT NOW

### MVP Scope

1. Build the interactive comparison tool (like the quote tool but for sewer methods)
2. Add housing age lookup by address/zip (county assessor API)
3. AI recommendation engine based on symptoms + home age + location
4. Lead distribution to 3-5 sewer repair specialists per market
5. Cast iron risk heat map for plumber dashboard

Start in Phoenix metro → expand to other markets with aging housing stock (Florida, Texas, California).
