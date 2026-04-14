// src/services/aquaopsService.ts
// H3AquaOps / PlumberPro integration
// Provides water-quality-aware equipment recommendations for plumbers
// Real API endpoints: H3AQUAOPS_API_URL + H3AQUAOPS_API_KEY env vars
// Falls back to local catalog if API is unreachable

import fetch from 'node-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaterProfile {
  zip: string;
  city: string;
  state: string;
  hardness_gpg: number;
  hardness_label: string;      // 'Soft' | 'Slightly Hard' | 'Moderately Hard' | 'Hard' | 'Very Hard'
  pfas_concern: boolean;
  chloramine_concern: boolean;
  ph_concern: boolean;
  tds_ppm?: number;
  arsenic_concern: boolean;
  primary_issues: string[];    // human-readable list for brief
}

export interface PlumberProProduct {
  sku: string;
  name: string;
  category: 'softener' | 'ro_system' | 'whole_house_filter' | 'uv_system' | 'iron_filter' | 'pretreatment' | 'scale_inhibitor';
  grain_capacity?: number;     // softeners only
  flow_rate_gpm?: number;
  dealer_price: number;        // K48 cost
  retail_low: number;          // install estimate low
  retail_high: number;         // install estimate high
  ideal_gpg_min?: number;
  ideal_gpg_max?: number;
  addresses: string[];         // issue tags this product resolves
  order_url: string;
  notes?: string;
}

export interface PlumberBrief {
  waterProfile: WaterProfile | null;
  primaryRecommendation: PlumberProProduct | null;
  additionalRecommendations: PlumberProProduct[];
  upsellSummary: string;       // one-line for SMS
  dealerMarginEst: number;     // estimated K48 margin on primary rec
  briefText: string;           // full formatted brief for email/dashboard
}

// ─── Local fallback catalog ───────────────────────────────────────────────────
// Stub data — real SKUs/prices replaced when H3AquaOps API schema is confirmed
// Categories map to HomePlus dealer catalog

const LOCAL_CATALOG: PlumberProProduct[] = [
  {
    sku: 'WB-900-32K',
    name: 'WaterBoss 900 — 32,000 Grain Softener',
    category: 'softener',
    grain_capacity: 32000,
    flow_rate_gpm: 9,
    dealer_price: 680,
    retail_low: 1600,
    retail_high: 2200,
    ideal_gpg_min: 10,
    ideal_gpg_max: 25,
    addresses: ['hardness', 'scale', 'dry_skin'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=WB-900-32K',
    notes: 'Compact unit, ideal for 1-3 bathroom homes. 70% salt efficient vs standard softeners.',
  },
  {
    sku: 'WB-950-48K',
    name: 'WaterBoss 950 — 48,000 Grain Softener',
    category: 'softener',
    grain_capacity: 48000,
    flow_rate_gpm: 12,
    dealer_price: 890,
    retail_low: 2000,
    retail_high: 2800,
    ideal_gpg_min: 20,
    ideal_gpg_max: 50,
    addresses: ['hardness', 'scale', 'dry_skin', 'iron_trace'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=WB-950-48K',
    notes: 'Best for 3-5 bathroom homes or high-hardness areas (20+ GPG). Includes iron reduction.',
  },
  {
    sku: 'RO-5ST-UNDRSINK',
    name: 'H3 5-Stage Reverse Osmosis — Under Sink',
    category: 'ro_system',
    flow_rate_gpm: 0.04,
    dealer_price: 290,
    retail_low: 650,
    retail_high: 950,
    addresses: ['pfas', 'arsenic', 'tds', 'taste', 'chloramine'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=RO-5ST-UNDRSINK',
    notes: 'NSF 58 certified. Removes 99% of PFAS, arsenic, nitrates. Pairs well with softener.',
  },
  {
    sku: 'WHF-CB-10',
    name: 'H3 Whole-House Carbon Block Filter',
    category: 'whole_house_filter',
    flow_rate_gpm: 10,
    dealer_price: 420,
    retail_low: 900,
    retail_high: 1400,
    addresses: ['chloramine', 'chlorine', 'taste', 'odor', 'voc'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=WHF-CB-10',
    notes: 'Ideal for soft-water areas (WA west side) where hardness is not the issue. Targets chloramine DBPs.',
  },
  {
    sku: 'UV-12GPM-PRO',
    name: 'H3 UV Disinfection System — 12 GPM',
    category: 'uv_system',
    flow_rate_gpm: 12,
    dealer_price: 380,
    retail_low: 800,
    retail_high: 1200,
    addresses: ['bacteria', 'well_water', 'surface_variability'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=UV-12GPM-PRO',
    notes: 'Required add-on for well water systems. Surface water variability areas (WA mountain runoff).',
  },
  {
    sku: 'SCALE-TAC-10',
    name: 'H3 TAC Scale Inhibitor — Salt-Free',
    category: 'scale_inhibitor',
    flow_rate_gpm: 10,
    dealer_price: 510,
    retail_low: 1100,
    retail_high: 1600,
    addresses: ['scale', 'hardness'],
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=SCALE-TAC-10',
    notes: 'Salt-free alternative. Ideal for HOA/condo restrictions on salt discharge. Moderately hard water (7-15 GPG).',
  },
  {
    sku: 'PRE-IRON-10',
    name: 'H3 Iron/Manganese Pretreatment Filter',
    category: 'pretreatment',
    flow_rate_gpm: 10,
    dealer_price: 580,
    retail_low: 1200,
    retail_high: 1800,
    addresses: ['iron', 'manganese', 'well_water', 'staining'],
    order_url: 'https://h3api.connectable.to/pretreatment?sku=PRE-IRON-10',
    notes: 'Must be installed upstream of softener for iron >2 ppm. Prevents resin fouling.',
  },
];

// ─── API client ───────────────────────────────────────────────────────────────

const H3_BASE_URL = process.env.H3AQUAOPS_API_URL || 'https://h3api.connectable.to';
const H3_API_USER = process.env.H3AQUAOPS_API_USER || 'rkumpula';
const H3_API_PASS = process.env.H3AQUAOPS_API_PASS || '';

async function fetchPlumberProCatalog(): Promise<PlumberProProduct[] | null> {
  try {
    const auth = Buffer.from(`${H3_API_USER}:${H3_API_PASS}`).toString('base64');
    const res = await fetch(`${H3_BASE_URL}/plumber-pro`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.warn(`H3AquaOps /plumber-pro returned ${res.status} — falling back to local catalog`);
      return null;
    }
    const data = await res.json() as any;
    // Normalize: API may return { products: [...] } or a raw array
    const products: any[] = Array.isArray(data) ? data : (data.products || data.items || []);
    if (!products.length) return null;
    return products.map(normalizeApiProduct);
  } catch (err) {
    console.warn('H3AquaOps API unreachable — using local catalog:', (err as Error).message);
    return null;
  }
}

async function fetchPretreatmentCatalog(): Promise<PlumberProProduct[] | null> {
  try {
    const auth = Buffer.from(`${H3_API_USER}:${H3_API_PASS}`).toString('base64');
    const res = await fetch(`${H3_BASE_URL}/pretreatment`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const products: any[] = Array.isArray(data) ? data : (data.products || data.items || []);
    return products.length ? products.map(normalizeApiProduct) : null;
  } catch {
    return null;
  }
}

// Map API response fields to our internal shape
// Adjust field names here once real schema is confirmed
function normalizeApiProduct(p: any): PlumberProProduct {
  return {
    sku:               p.sku        || p.id         || p.product_id  || 'UNKNOWN',
    name:              p.name       || p.title      || p.product_name || 'Unknown Product',
    category:          p.category   || p.type       || 'whole_house_filter',
    grain_capacity:    p.grain_capacity || p.grains  || undefined,
    flow_rate_gpm:     p.flow_rate  || p.gpm        || undefined,
    dealer_price:      Number(p.dealer_price || p.cost || p.price || 0),
    retail_low:        Number(p.retail_low   || p.msrp_low   || (Number(p.dealer_price||0) * 2.2) || 0),
    retail_high:       Number(p.retail_high  || p.msrp_high  || (Number(p.dealer_price||0) * 3.2) || 0),
    ideal_gpg_min:     p.ideal_gpg_min || p.gpg_min || undefined,
    ideal_gpg_max:     p.ideal_gpg_max || p.gpg_max || undefined,
    addresses:         Array.isArray(p.addresses) ? p.addresses : (p.treats || p.issues || []),
    order_url:         p.order_url  || p.url        || `${H3_BASE_URL}/plumber-pro?sku=${p.sku||p.id}`,
    notes:             p.notes      || p.description || undefined,
  };
}

// ─── Recommendation engine ────────────────────────────────────────────────────

export async function getProductRecommendations(
  waterProfile: WaterProfile,
  serviceType: string
): Promise<{ primary: PlumberProProduct | null; additional: PlumberProProduct[] }> {

  // Try live API first, fall back to local catalog
  const [livePlumberPro, livePretreatment] = await Promise.all([
    fetchPlumberProCatalog(),
    fetchPretreatmentCatalog(),
  ]);

  const catalog: PlumberProProduct[] = [
    ...(livePlumberPro   || LOCAL_CATALOG.filter(p => p.category !== 'pretreatment')),
    ...(livePretreatment || LOCAL_CATALOG.filter(p => p.category === 'pretreatment')),
  ];

  const gpg    = waterProfile.hardness_gpg;
  const issues = waterProfile.primary_issues.map(i => i.toLowerCase());
  const scored: Array<{ product: PlumberProProduct; score: number }> = [];

  for (const product of catalog) {
    let score = 0;

    // GPG range match (softeners / scale inhibitors)
    if (product.ideal_gpg_min !== undefined && product.ideal_gpg_max !== undefined) {
      if (gpg >= product.ideal_gpg_min && gpg <= product.ideal_gpg_max) score += 10;
      else if (gpg > product.ideal_gpg_max) score += 3;  // oversized — still relevant
    }

    // Issue match
    for (const addr of product.addresses) {
      if (issues.some(i => i.includes(addr) || addr.includes(i))) score += 5;
    }

    // Service type boosts
    const st = serviceType.toLowerCase();
    if ((st.includes('water heater') || st.includes('heater')) && product.category === 'softener') score += 6;
    if ((st.includes('water heater') || st.includes('heater')) && product.category === 'scale_inhibitor') score += 4;
    if (st.includes('water treatment') && (product.category === 'softener' || product.category === 'ro_system')) score += 8;
    if (st.includes('well') && product.category === 'pretreatment') score += 7;
    if (st.includes('well') && product.category === 'uv_system') score += 7;
    if (st.includes('filter') && product.category === 'whole_house_filter') score += 6;
    if (st.includes('softener') && product.category === 'softener') score += 10;

    // Hard water boost for softeners
    if (gpg >= 15 && product.category === 'softener') score += 5;
    if (gpg >= 25 && product.category === 'softener') score += 5;

    // Soft water: don't recommend softeners, push filters/RO
    if (gpg < 7 && product.category === 'softener') score = 0;
    if (gpg < 7 && (product.category === 'whole_house_filter' || product.category === 'ro_system')) score += 6;

    // PFAS/chloramine specific
    if (waterProfile.pfas_concern && product.addresses.includes('pfas')) score += 8;
    if (waterProfile.chloramine_concern && product.addresses.includes('chloramine')) score += 6;
    if (waterProfile.arsenic_concern && product.addresses.includes('arsenic')) score += 7;

    if (score > 0) scored.push({ product, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const primary    = scored[0]?.product || null;
  const additional = scored.slice(1, 3).map(s => s.product);

  return { primary, additional };
}

// ─── Lead enrichment ──────────────────────────────────────────────────────────

export async function buildPlumberBrief(
  zip: string,
  waterData: any,     // shape from az-water-data.json / wa-water-data.json
  serviceType: string
): Promise<PlumberBrief> {

  if (!waterData) {
    return {
      waterProfile: null,
      primaryRecommendation: null,
      additionalRecommendations: [],
      upsellSummary: 'No water data for this zip.',
      dealerMarginEst: 0,
      briefText: 'Water quality data not available for this zip code.',
    };
  }

  // Normalize water data shape (handles both AZ and WA data formats)
  const gpg: number = waterData.hardness_gpg
    ?? waterData.hardness
    ?? waterData.water_hardness_gpg
    ?? 0;

  const hardnessLabel: string = waterData.hardness_label
    ?? waterData.label
    ?? classifyHardness(gpg);

  const primary_issues: string[] = waterData.primary_issues
    ?? waterData.issues
    ?? buildIssueList(waterData, gpg);

  const profile: WaterProfile = {
    zip,
    city:               waterData.city        || waterData.municipality || '',
    state:              waterData.state        || '',
    hardness_gpg:       gpg,
    hardness_label:     hardnessLabel,
    pfas_concern:       !!(waterData.pfas_concern   || waterData.pfas   || false),
    chloramine_concern: !!(waterData.chloramine_concern || waterData.chloramine || false),
    ph_concern:         !!(waterData.ph_concern     || (waterData.ph && (waterData.ph < 6.5 || waterData.ph > 8.5)) || false),
    tds_ppm:            waterData.tds_ppm     || waterData.tds        || undefined,
    arsenic_concern:    !!(waterData.arsenic_concern || waterData.arsenic || false),
    primary_issues,
  };

  const { primary, additional } = await getProductRecommendations(profile, serviceType);

  // Estimate K48 margin (dealer to retail midpoint spread * ~30%)
  const marginEst = primary
    ? Math.round(((primary.retail_low + primary.retail_high) / 2 - primary.dealer_price) * 0.3)
    : 0;

  const upsellSummary = buildUpsellSummary(profile, primary);
  const briefText     = buildBriefText(profile, primary, additional);

  return {
    waterProfile:             profile,
    primaryRecommendation:    primary,
    additionalRecommendations: additional,
    upsellSummary,
    dealerMarginEst:          marginEst,
    briefText,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function buildUpsellSummary(profile: WaterProfile, primary: PlumberProProduct | null): string {
  if (!primary) return 'No upsell recommendation — check water data.';
  const gpgStr = profile.hardness_gpg > 0 ? `${profile.hardness_gpg} GPG ${profile.hardness_label}` : 'soft water';
  return `Water: ${gpgStr} | Rec: ${primary.name} ($${primary.dealer_price} dealer, $${primary.retail_low}–$${primary.retail_high} retail install)`;
}

function buildBriefText(
  profile: WaterProfile,
  primary: PlumberProProduct | null,
  additional: PlumberProProduct[]
): string {
  const lines: string[] = [];

  lines.push(`━━ WATER QUALITY BRIEF — ${profile.city}, ${profile.state} (${profile.zip}) ━━`);
  lines.push('');

  if (profile.hardness_gpg > 0) {
    lines.push(`Hardness: ${profile.hardness_gpg} GPG (${profile.hardness_label})`);
    if (profile.hardness_gpg >= 15) {
      const annualLow  = Math.round(profile.hardness_gpg * 2.2 * 12 * 3);
      const annualHigh = Math.round(profile.hardness_gpg * 2.2 * 12 * 6);
      lines.push(`Est. hard-water cost to homeowner: $${annualLow.toLocaleString()}–$${annualHigh.toLocaleString()}/yr (appliance wear, soap, energy)`);
    }
  } else {
    lines.push(`Hardness: Soft water area — hardness not primary concern`);
  }

  if (profile.primary_issues.length) {
    lines.push(`Issues detected: ${profile.primary_issues.join(', ')}`);
  }

  lines.push('');

  if (primary) {
    lines.push(`PRIMARY REC: ${primary.name}`);
    lines.push(`  SKU: ${primary.sku}`);
    lines.push(`  Dealer price: $${primary.dealer_price}`);
    lines.push(`  Retail install range: $${primary.retail_low.toLocaleString()}–$${primary.retail_high.toLocaleString()}`);
    if (primary.notes) lines.push(`  Note: ${primary.notes}`);
    lines.push(`  Order: ${primary.order_url}`);
  } else {
    lines.push('No equipment recommendation — manual review needed.');
  }

  if (additional.length) {
    lines.push('');
    lines.push('ALSO CONSIDER:');
    for (const p of additional) {
      lines.push(`  • ${p.name} — $${p.dealer_price} dealer | $${p.retail_low}–$${p.retail_high} retail`);
      lines.push(`    Order: ${p.order_url}`);
    }
  }

  lines.push('');
  lines.push(`Powered by H3AquaOps / PlumberPro — K48 Ventures LLC`);

  return lines.join('\n');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function classifyHardness(gpg: number): string {
  if (gpg < 1)  return 'Soft';
  if (gpg < 7)  return 'Slightly Hard';
  if (gpg < 10) return 'Moderately Hard';
  if (gpg < 14) return 'Hard';
  if (gpg < 25) return 'Very Hard';
  return 'Extremely Hard';
}

function buildIssueList(waterData: any, gpg: number): string[] {
  const issues: string[] = [];
  if (gpg >= 10)                       issues.push('hard water / scale buildup');
  if (waterData.pfas_concern)          issues.push('PFAS contamination');
  if (waterData.chloramine_concern)    issues.push('chloramines / DBPs');
  if (waterData.arsenic_concern)       issues.push('arsenic');
  if (waterData.ph_concern || (waterData.ph && (waterData.ph < 6.5 || waterData.ph > 8.5))) {
    issues.push('pH imbalance / corrosivity');
  }
  if (waterData.tds_ppm > 500)         issues.push('high TDS');
  return issues;
}
