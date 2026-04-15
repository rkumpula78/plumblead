// src/services/aquaopsService.ts
// H3 AquaOps / PlumberPro — water treatment recommendation engine

import fetch from 'node-fetch';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WaterProfile {
  zip: string;
  city: string;
  state: string;
  hardness_gpg: number;
  hardness_mg_l: number;
  ph: number;
  tds_ppm: number;
  iron_mg_l: number;
  chlorine_mg_l: number;
  hardness_label: string;
  pfas_concern: boolean;
  chloramine_concern: boolean;
  ph_concern: boolean;
  arsenic_concern: boolean;
  iron_concern: boolean;
  manganese_concern: boolean;
  high_tds: boolean;
  water_source: 'municipal' | 'well' | 'unknown';
  primary_issues: string[];
}

export interface TreatmentRecommendation {
  category: 'softener' | 'tac_salt_free' | 'ro_system' | 'whole_house_carbon' |
            'catalytic_carbon' | 'iron_filter' | 'uv_system' | 'sediment_filter' |
            'multimedia_filter' | 'pretreatment_combo';
  priority: 'primary' | 'secondary' | 'addon';
  sizing: {
    resin_ft3?: number;
    grain_capacity?: number;
    salt_dose_lb_ft3?: number;
    flow_rate_gpm?: number;
    daily_usage_gal?: number;
    regen_days?: number;
  };
  resin_type?: string;
  resin_note?: string;
  equipment_name: string;
  sku: string;
  dealer_price: number;
  retail_low: number;
  retail_high: number;
  order_url: string;
  why: string;
  notes?: string;
  requires_pretreatment?: string;
}

export interface PlumberBrief {
  waterProfile: WaterProfile | null;
  h3Analysis: H3WaterAnalysis | null;
  primaryRecommendation: TreatmentRecommendation | null;
  additionalRecommendations: TreatmentRecommendation[];
  upsellSummary: string;
  dealerMarginEst: number;
  annualCostToHomeowner: string;
  briefText: string;
}

export interface H3WaterAnalysis {
  hardness_classification: string;
  softener_viable: boolean;
  tac_viable: boolean;
  iron_pretreatment_required: boolean;
  iron_method: string | null;
  carbon_type_needed: string | null;
  ro_recommended: boolean;
  uv_recommended: boolean;
  resin_recommendation: string;
  sizing_notes: string;
}

// ─── H3 Decision Engine ────────────────────────────────────────────────────────

export class H3PlumberProEngine {

  static classifyHardness(gpg: number): string {
    if (gpg <= 3.5)  return 'Soft';
    if (gpg <= 7)    return 'Slightly Hard';
    if (gpg <= 10.5) return 'Moderately Hard';
    if (gpg <= 15)   return 'Hard';
    if (gpg <= 25)   return 'Very Hard';
    return 'Extremely Hard';
  }

  static gpgToMgL(gpg: number): number {
    return Math.round(gpg * 17.1 * 10) / 10;
  }

  static sizeSoftener(
    hardness_gpg: number,
    daily_usage_gal: number = 75,
    occupants: number = 3,
    regen_days: number = 7,
    salt_dose: 6 | 8 | 10 | 12 | 15 = 8
  ): { resin_ft3: number; grain_capacity: number; salt_dose: number; regen_days: number } {
    const capacityMap: Record<number, number> = {
      6: 20000, 8: 24000, 10: 27000, 12: 29000, 15: 32000
    };
    const capacity_per_ft3 = capacityMap[salt_dose] || 24000;
    const total_daily_gal  = daily_usage_gal * occupants;
    const grains_per_day   = total_daily_gal * hardness_gpg;
    const grain_capacity   = grains_per_day * regen_days;
    const resin_ft3        = Math.ceil((grain_capacity / capacity_per_ft3) * 10) / 10;
    return { resin_ft3, grain_capacity: Math.round(grain_capacity), salt_dose, regen_days };
  }

  static tacViable(hardness_gpg: number, iron_mg_l: number): { viable: boolean; reason: string } {
    if (hardness_gpg > 25) {
      return { viable: false, reason: `${hardness_gpg} GPG exceeds TAC max (25 GPG). Softener required.` };
    }
    if (iron_mg_l > 0.3) {
      return { viable: false, reason: `Iron ${iron_mg_l} mg/L fouls TAC media (max 0.3). Iron filter or softener required.` };
    }
    return { viable: true, reason: `TAC viable — ${hardness_gpg} GPG within 25 GPG limit, iron ${iron_mg_l} mg/L acceptable.` };
  }

  static selectIronMethod(iron_mg_l: number, manganese_mg_l: number = 0, ph: number = 7.5): string | null {
    if (iron_mg_l <= 0 && manganese_mg_l <= 0) return null;
    if (iron_mg_l <= 3 && manganese_mg_l <= 0.05) return 'fine_mesh_softener';
    if (iron_mg_l <= 10 && manganese_mg_l <= 1 && ph >= 6.8) return 'birm_filter';
    if (iron_mg_l <= 15 && manganese_mg_l <= 5 && ph >= 6.2) return 'greensand_filter';
    if (iron_mg_l <= 20 && ph >= 6.5) return 'catalytic_carbon_filter';
    if (iron_mg_l <= 30) return 'air_injection_filter';
    return 'chemical_oxidation_mmf';
  }

  static selectResin(
    iron_mg_l: number,
    chlorine_mg_l: number,
    water_source: string
  ): { resin: string; note: string } {
    if (iron_mg_l > 0.5) {
      return { resin: 'Fine Mesh Cation (SAC)', note: 'Iron >0.5 mg/L — fine mesh resin traps ferric iron. Add Iron-Out cleaner to maintenance schedule.' };
    }
    if (chlorine_mg_l > 1.0) {
      return { resin: '10% Crosslink Cation (SAC)', note: `Chlorine ${chlorine_mg_l} mg/L — 10% crosslink resin resists oxidation better than standard 8%.` };
    }
    return {
      resin: 'Standard 8% Crosslink Cation (SAC)',
      note: water_source === 'well' ? 'Well water — monitor iron quarterly.' : 'Standard resin appropriate for municipal water.'
    };
  }

  static selectCarbonType(chloramine_concern: boolean, chlorine_mg_l: number, voc_concern: boolean = false): string | null {
    if (!chloramine_concern && chlorine_mg_l < 0.5) return null;
    if (chloramine_concern) return 'Catalytic carbon (Centaur) — EBCT 10+ min required. Standard GAC insufficient for chloramines.';
    if (voc_concern) return 'GAC coconut shell — removes VOCs, THMs. EBCT 5-10 min.';
    return 'GAC bituminous coal — chlorine, taste/odor. EBCT 5-10 min.';
  }

  static analyzeWater(
    gpg: number,
    ph: number,
    tds: number,
    iron: number,
    chlorine: number,
    chloramine_concern: boolean,
    water_source: 'municipal' | 'well' | 'unknown' = 'municipal'
  ): H3WaterAnalysis {
    const hardness_classification    = this.classifyHardness(gpg);
    const tac                        = this.tacViable(gpg, iron);
    const iron_method                = this.selectIronMethod(iron, 0, ph);
    const resinRec                   = this.selectResin(iron, chlorine, water_source);
    const carbonType                 = this.selectCarbonType(chloramine_concern, chlorine);
    const iron_pretreatment_required = iron > 0.5 && iron_method !== 'fine_mesh_softener';

    const sizing_notes = [
      `H3 sizing @ 8 lb/ft3 salt dose (standard efficiency: 24,000 gr/ft3).`,
      chlorine > 1.0 ? `⚠ Chlorine ${chlorine} mg/L — install carbon prefilter to protect resin life.` : '',
      iron > 0.3 && iron <= 0.5 ? `⚠ Iron ${iron} mg/L — use Iron-Out cleaner monthly.` : '',
      ph < 6.5 ? `⚠ pH ${ph} — low pH damages resin.` : '',
      ph > 8.5 ? `⚠ pH ${ph} — high pH reduces softener capacity.` : '',
    ].filter(Boolean).join(' ');

    return {
      hardness_classification,
      softener_viable: gpg > 3.5,
      tac_viable: tac.viable,
      iron_pretreatment_required,
      iron_method: iron_method !== 'fine_mesh_softener' ? iron_method : null,
      carbon_type_needed: carbonType,
      ro_recommended: tds > 500 || ph < 6.5,
      uv_recommended: water_source === 'well',
      resin_recommendation: resinRec.resin,
      sizing_notes: sizing_notes || 'Standard installation. No additional pretreatment required.',
    };
  }
}

// ─── Equipment catalog ────────────────────────────────────────────────────────

const EQUIPMENT_CATALOG: Record<string, Omit<TreatmentRecommendation, 'priority' | 'why' | 'sizing' | 'resin_type' | 'resin_note' | 'requires_pretreatment'>> = {
  softener_1bath: {
    category: 'softener',
    equipment_name: 'Fleck 5600SXT — 32,000 Grain Softener (1-2 bath)',
    sku: 'FLK-5600-32K',
    dealer_price: 650,
    retail_low: 1500,
    retail_high: 2200,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=FLK-5600-32K',
    notes: '1.0 ft3 resin, Fleck 5600SXT metered valve. Ideal for 1-2 bath, 1-3 occupants, <20 GPG.',
  },
  softener_2bath: {
    category: 'softener',
    equipment_name: 'Fleck 5600SXT — 48,000 Grain Softener (2-4 bath)',
    sku: 'FLK-5600-48K',
    dealer_price: 820,
    retail_low: 1900,
    retail_high: 2700,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=FLK-5600-48K',
    notes: '1.5 ft3 resin, metered valve. 2-4 bath homes, 3-5 occupants. Handles up to 30 GPG.',
  },
  softener_large: {
    category: 'softener',
    equipment_name: 'Clack WS1 — 64,000 Grain Softener (5+ bath / high hardness)',
    sku: 'CLK-WS1-64K',
    dealer_price: 1050,
    retail_low: 2400,
    retail_high: 3500,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=CLK-WS1-64K',
    notes: '2.0 ft3 resin, Clack WS1 valve. 5+ bath or hardness 25+ GPG.',
  },
  tac_whole_house: {
    category: 'tac_salt_free',
    equipment_name: 'H3 TAC Scale Inhibitor — Salt-Free (≤25 GPG)',
    sku: 'H3-TAC-WH',
    dealer_price: 520,
    retail_low: 1100,
    retail_high: 1700,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=H3-TAC-WH',
    notes: 'Template Assisted Crystallization. 88-97% scale reduction. No salt, drain, or electricity.',
  },
  ro_undersink: {
    category: 'ro_system',
    equipment_name: 'H3 5-Stage RO — Under Sink',
    sku: 'H3-RO-5ST',
    dealer_price: 285,
    retail_low: 650,
    retail_high: 950,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=H3-RO-5ST',
    notes: 'NSF 58. Removes 99%+ PFAS, arsenic, nitrates, TDS.',
  },
  carbon_catalytic: {
    category: 'catalytic_carbon',
    equipment_name: 'H3 Catalytic Carbon Filter — Whole House (Chloramines)',
    sku: 'H3-CAT-CARBON-WH',
    dealer_price: 480,
    retail_low: 1000,
    retail_high: 1500,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=H3-CAT-CARBON-WH',
    notes: 'Centaur catalytic carbon. Only effective option for chloramine removal. EBCT 10+ min required.',
  },
  carbon_gac: {
    category: 'whole_house_carbon',
    equipment_name: 'H3 GAC Whole-House Carbon Filter (Chlorine / Taste-Odor)',
    sku: 'H3-GAC-WH',
    dealer_price: 380,
    retail_low: 850,
    retail_high: 1300,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=H3-GAC-WH',
    notes: 'Coconut shell GAC. Chlorine, THMs, VOCs. EBCT 5-10 min.',
  },
  iron_filter_birm: {
    category: 'iron_filter',
    equipment_name: 'H3 Birm Iron Filter (Iron 1-10 mg/L)',
    sku: 'H3-BIRM-10',
    dealer_price: 540,
    retail_low: 1200,
    retail_high: 1800,
    order_url: 'https://h3api.connectable.to/pretreatment?sku=H3-BIRM-10',
    notes: 'Catalytic media. pH >6.8 required. Install before softener.',
  },
  iron_filter_greensand: {
    category: 'iron_filter',
    equipment_name: 'H3 Greensand Plus Iron/Manganese Filter (Iron 1-15 mg/L)',
    sku: 'H3-GSAND-15',
    dealer_price: 680,
    retail_low: 1500,
    retail_high: 2200,
    order_url: 'https://h3api.connectable.to/pretreatment?sku=H3-GSAND-15',
    notes: 'KMnO4 regenerated. Iron 1-15 mg/L, Mn 1-5 mg/L. pH >6.2.',
  },
  iron_filter_air: {
    category: 'iron_filter',
    equipment_name: 'H3 Air Injection Iron Filter (Iron 5-30 mg/L, chemical-free)',
    sku: 'H3-AIR-INJ-30',
    dealer_price: 760,
    retail_low: 1700,
    retail_high: 2500,
    order_url: 'https://h3api.connectable.to/pretreatment?sku=H3-AIR-INJ-30',
    notes: 'Air pocket oxidizes iron. No chemicals. High-iron well water.',
  },
  uv_system: {
    category: 'uv_system',
    equipment_name: 'H3 UV Disinfection System — 12 GPM',
    sku: 'H3-UV-12GPM',
    dealer_price: 375,
    retail_low: 800,
    retail_high: 1200,
    order_url: 'https://h3api.connectable.to/plumber-pro?sku=H3-UV-12GPM',
    notes: 'Required for well water. Install after all filtration. Annual lamp replacement.',
  },
  sediment_filter: {
    category: 'sediment_filter',
    equipment_name: 'H3 Sediment Pre-Filter — 5 Micron Whole House',
    sku: 'H3-SED-5UM',
    dealer_price: 85,
    retail_low: 200,
    retail_high: 350,
    order_url: 'https://h3api.connectable.to/pretreatment?sku=H3-SED-5UM',
    notes: 'Sediment <5 NTU required before softener to prevent resin channeling.',
  },
};

// ─── Recommendation builder ────────────────────────────────────────────────────

function buildRecommendations(
  profile: WaterProfile,
  analysis: H3WaterAnalysis,
  serviceType: string
): { primary: TreatmentRecommendation | null; additional: TreatmentRecommendation[] } {

  const recs: TreatmentRecommendation[] = [];
  const st = serviceType.toLowerCase();
  const gpg = profile.hardness_gpg;

  if (gpg > 3.5) {
    const tac = H3PlumberProEngine.tacViable(gpg, profile.iron_mg_l);
    const sizingData = H3PlumberProEngine.sizeSoftener(gpg);

    if (analysis.softener_viable) {
      let softenerKey = 'softener_1bath';
      if (sizingData.resin_ft3 > 1.5) softenerKey = 'softener_large';
      else if (sizingData.resin_ft3 > 1.0) softenerKey = 'softener_2bath';

      const equip = EQUIPMENT_CATALOG[softenerKey];
      const resinRec = H3PlumberProEngine.selectResin(profile.iron_mg_l, profile.chlorine_mg_l, profile.water_source);

      recs.push({
        ...equip,
        priority: 'primary',
        sizing: {
          resin_ft3: sizingData.resin_ft3,
          grain_capacity: sizingData.grain_capacity,
          salt_dose_lb_ft3: sizingData.salt_dose,
          regen_days: sizingData.regen_days,
        },
        resin_type: resinRec.resin,
        resin_note: resinRec.note,
        requires_pretreatment: analysis.iron_pretreatment_required
          ? `Iron ${profile.iron_mg_l} mg/L — install iron filter upstream.`
          : profile.chlorine_mg_l > 1.0
          ? `Chlorine ${profile.chlorine_mg_l} mg/L — install carbon prefilter upstream.`
          : undefined,
        why: `${gpg} GPG (${analysis.hardness_classification}) — scale buildup on water heater, fixtures, and appliances. ` +
             `H3 sizing: ${sizingData.resin_ft3} ft3 resin @ ${sizingData.salt_dose} lb/ft3 = ${sizingData.grain_capacity.toLocaleString()} gr, regen every ${sizingData.regen_days} days.`,
      });
    }

    if (tac.viable) {
      const tacEquip = EQUIPMENT_CATALOG['tac_whole_house'];
      recs.push({
        ...tacEquip,
        priority: 'secondary',
        sizing: { flow_rate_gpm: 10 },
        why: `Salt-free alternative. ${tac.reason} 88-97% scale reduction. No salt, drain, or electricity.`,
      });
    }
  }

  if (analysis.carbon_type_needed) {
    const isCatalytic = analysis.carbon_type_needed.includes('Catalytic');
    const equip = EQUIPMENT_CATALOG[isCatalytic ? 'carbon_catalytic' : 'carbon_gac'];
    recs.push({
      ...equip,
      priority: gpg <= 3.5 ? 'primary' : 'secondary',
      sizing: { flow_rate_gpm: 10 },
      why: isCatalytic
        ? `Chloramines detected — catalytic carbon only effective option.`
        : `Chlorine ${profile.chlorine_mg_l} mg/L — carbon filter improves taste/odor and protects softener resin.`,
    });
  }

  if (analysis.ro_recommended || profile.pfas_concern || profile.arsenic_concern) {
    const equip = EQUIPMENT_CATALOG['ro_undersink'];
    recs.push({
      ...equip,
      priority: (profile.pfas_concern || profile.arsenic_concern) ? 'primary' : 'addon',
      sizing: {},
      why: [
        profile.pfas_concern    ? 'PFAS concern — RO removes 99%+ PFAS.' : '',
        profile.arsenic_concern ? 'Arsenic concern — RO removes arsenic.' : '',
        profile.high_tds        ? `TDS ${profile.tds_ppm} ppm — RO reduces TDS for drinking water.` : '',
      ].filter(Boolean).join(' '),
    });
  }

  if (profile.iron_concern && profile.iron_mg_l > 0.5) {
    const method = analysis.iron_method;
    let ironEquipKey = 'iron_filter_birm';
    if (method === 'greensand_filter') ironEquipKey = 'iron_filter_greensand';
    if (method === 'air_injection_filter') ironEquipKey = 'iron_filter_air';
    const equip = EQUIPMENT_CATALOG[ironEquipKey];
    recs.push({
      ...equip,
      priority: 'secondary',
      sizing: { flow_rate_gpm: 10 },
      why: `Iron ${profile.iron_mg_l} mg/L — fouls softener resin. H3 method: ${method}. Install upstream.`,
    });
  }

  if (analysis.uv_recommended) {
    const equip = EQUIPMENT_CATALOG['uv_system'];
    recs.push({
      ...equip,
      priority: 'addon',
      sizing: { flow_rate_gpm: 12 },
      why: 'Well water — bacteria/virus risk. Install after all filtration as final stage.',
    });
  }

  if (profile.water_source === 'well' || profile.iron_concern) {
    const equip = EQUIPMENT_CATALOG['sediment_filter'];
    recs.push({
      ...equip,
      priority: 'addon',
      sizing: {},
      why: 'Sediment <5 NTU required before softener to prevent resin bed channeling.',
    });
  }

  if (st.includes('water heater') || st.includes('heater')) {
    recs.sort((a, b) => {
      if (a.category === 'softener' || a.category === 'tac_salt_free') return -1;
      if (b.category === 'softener' || b.category === 'tac_salt_free') return 1;
      return 0;
    });
  }
  if (profile.pfas_concern || profile.arsenic_concern) {
    recs.sort((a, b) => {
      if (a.category === 'ro_system') return -1;
      if (b.category === 'ro_system') return 1;
      return 0;
    });
  }

  const primaryRec = recs.find(r => r.priority === 'primary') || recs[0] || null;
  const additionalRecs = recs.filter(r => r !== primaryRec).slice(0, 3);
  return { primary: primaryRec, additional: additionalRecs };
}

// ─── H3 live API client ────────────────────────────────────────────────────────

const H3_BASE_URL  = process.env.H3AQUAOPS_API_URL  || 'https://h3api.connectable.to';
const H3_API_KEY   = process.env.H3AQUAOPS_API_KEY  || '';
const H3_API_USER  = process.env.H3AQUAOPS_API_USER || '';
const H3_API_PASS  = process.env.H3AQUAOPS_API_PASS || '';

async function callH3Api(endpoint: string, body: object): Promise<any | null> {
  try {
    const auth = Buffer.from(`${H3_API_USER}:${H3_API_PASS}`).toString('base64');
    const res = await fetch(`${H3_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}`, 'X-API-Key': H3_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) { console.warn(`H3 API ${endpoint} returned ${res.status} — using local engine`); return null; }
    return await res.json();
  } catch (err) {
    console.warn(`H3 API unreachable (${endpoint}) — using local engine:`, (err as Error).message);
    return null;
  }
}

// ─── Annual cost estimator ─────────────────────────────────────────────────────

function estimateAnnualHardWaterCost(gpg: number): string {
  if (gpg < 3.5) return 'Minimal (soft water area)';
  const low  = Math.round(gpg * 36);
  const high = Math.round(gpg * 72);
  return `$${low.toLocaleString()}–$${high.toLocaleString()}/yr`;
}

// ─── Main export: buildPlumberBrief ───────────────────────────────────────────

export async function buildPlumberBrief(
  zip: string,
  waterData: any,
  serviceType: string
): Promise<PlumberBrief> {

  if (!waterData) {
    return {
      waterProfile: null,
      h3Analysis: null,
      primaryRecommendation: null,
      additionalRecommendations: [],
      upsellSummary: 'No water data for this zip.',
      dealerMarginEst: 0,
      annualCostToHomeowner: 'Unknown',
      briefText: 'Water quality data not available for this zip code.',
    };
  }

  // ── Extract numeric value from flat number OR nested {low, high, avg} object ──
  // AZ water JSON uses {low, high, avg} objects; WA uses flat numbers.
  // Always extract .avg (or .low as fallback) to get a usable number.
  const extractNum = (val: any, fallback: number = 0): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object') {
      if (typeof val.avg === 'number') return val.avg;
      if (typeof val.low === 'number') return val.low;
    }
    return fallback;
  };

  const gpg      = extractNum(waterData.hardness_gpg ?? waterData.hardness ?? waterData.water_hardness_gpg);
  const ph       = extractNum(waterData.ph, 7.5);
  const tds      = extractNum(waterData.tds_ppm ?? waterData.tds);
  const iron     = extractNum(waterData.iron_mg_l ?? waterData.iron);
  const chlorine = extractNum(waterData.chlorine_mg_l ?? waterData.free_chlorine ?? waterData.chlorine, 0.8);

  const chloramine: boolean = !!(waterData.chloramine_concern ?? waterData.chloramine ?? false);
  const source: 'municipal' | 'well' | 'unknown' =
    (waterData.water_source as any) ?? (waterData.source_type as any) ?? 'municipal';

  // ── City/state: AZ JSON uses `name` field; WA may use `city` ──
  const city  = waterData.city || waterData.name || waterData.municipality || '';
  const state = waterData.state ||
    (waterData.source && typeof waterData.source === 'string'
      ? (waterData.source.includes('AZ') || waterData.source.includes('Arizona') ? 'AZ'
        : waterData.source.includes('WA') || waterData.source.includes('Washington') ? 'WA' : '')
      : '');

  const profile: WaterProfile = {
    zip,
    city,
    state,
    hardness_gpg:       gpg,
    hardness_mg_l:      H3PlumberProEngine.gpgToMgL(gpg),
    ph,
    tds_ppm:            tds,
    iron_mg_l:          iron,
    chlorine_mg_l:      chlorine,
    hardness_label:     waterData.hardness_label || H3PlumberProEngine.classifyHardness(gpg),
    pfas_concern:       !!(waterData.pfas_concern    ?? false),
    chloramine_concern: chloramine,
    ph_concern:         !!(waterData.ph_concern ?? (ph < 6.5 || ph > 8.5)),
    arsenic_concern:    !!(waterData.arsenic_concern ?? false),
    iron_concern:       iron > 0.3 || !!(waterData.iron_concern ?? false),
    manganese_concern:  !!(waterData.manganese_concern ?? false),
    high_tds:           tds > 500,
    water_source:       source,
    primary_issues:     waterData.primary_issues ?? waterData.issues ?? buildIssueList(gpg, ph, tds, iron, chloramine, source),
  };

  const analysis = H3PlumberProEngine.analyzeWater(gpg, ph, tds, iron, chlorine, chloramine, source);

  let apiEnrichment: any = null;
  if (H3_API_KEY) {
    apiEnrichment = await callH3Api('/plumber-pro', {
      water_test: { total_hardness_gpg: gpg, ph, tds_ppm: tds, iron_mg_l: iron, free_chlorine_mg_l: chlorine },
      location: { zip, city: profile.city, state: profile.state },
      service_type: serviceType,
    });
  }

  const { primary, additional } = buildRecommendations(profile, analysis, serviceType);

  const marginEst = primary
    ? Math.round(((primary.retail_low + primary.retail_high) / 2 - primary.dealer_price) * 0.30)
    : 0;

  return {
    waterProfile:              profile,
    h3Analysis:                analysis,
    primaryRecommendation:     primary,
    additionalRecommendations: additional,
    upsellSummary:             buildUpsellSummary(profile, primary),
    dealerMarginEst:           marginEst,
    annualCostToHomeowner:     estimateAnnualHardWaterCost(gpg),
    briefText:                 buildBriefText(profile, analysis, primary, additional, apiEnrichment),
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────────

function buildUpsellSummary(profile: WaterProfile, primary: TreatmentRecommendation | null): string {
  if (!primary) return 'No upsell recommendation — check water data.';
  const gpgStr = profile.hardness_gpg > 0 ? `${profile.hardness_gpg} GPG ${profile.hardness_label}` : 'soft water';
  return `Water: ${gpgStr} | Rec: ${primary.equipment_name} ($${primary.dealer_price} dealer, $${primary.retail_low}–$${primary.retail_high} retail install)`;
}

function buildBriefText(
  profile: WaterProfile,
  analysis: H3WaterAnalysis,
  primary: TreatmentRecommendation | null,
  additional: TreatmentRecommendation[],
  apiEnrichment: any
): string {
  const L: string[] = [];
  L.push(`━━ H3 WATER QUALITY BRIEF — ${profile.city}, ${profile.state} (${profile.zip}) ━━`);
  L.push('');
  L.push(`Source: ${profile.water_source === 'well' ? 'Private Well' : 'Municipal'}`);
  L.push(`Hardness: ${profile.hardness_gpg} GPG / ${profile.hardness_mg_l} mg/L (${profile.hardness_label})`);
  if (profile.ph)            L.push(`pH: ${profile.ph}`);
  if (profile.tds_ppm)       L.push(`TDS: ${profile.tds_ppm} ppm`);
  if (profile.iron_mg_l)     L.push(`Iron: ${profile.iron_mg_l} mg/L`);
  if (profile.chlorine_mg_l) L.push(`Chlorine: ${profile.chlorine_mg_l} mg/L`);
  L.push('');
  if (profile.primary_issues.length)  L.push(`Issues: ${profile.primary_issues.join(' · ')}`);
  if (profile.hardness_gpg >= 10)     L.push(`Annual hard-water cost: ${estimateAnnualHardWaterCost(profile.hardness_gpg)}`);
  L.push('');
  L.push('H3 ANALYSIS:');
  L.push(`  Softener viable: ${analysis.softener_viable ? 'Yes' : 'No'}`);
  L.push(`  TAC (salt-free) viable: ${analysis.tac_viable ? 'Yes' : 'No'}`);
  if (analysis.iron_pretreatment_required) L.push(`  ⚠ Iron pretreatment required before softener`);
  if (analysis.carbon_type_needed)         L.push(`  Carbon filter needed: ${analysis.carbon_type_needed}`);
  if (analysis.sizing_notes)               L.push(`  Sizing: ${analysis.sizing_notes}`);
  L.push(`  Resin rec: ${analysis.resin_recommendation}`);
  L.push('');
  if (primary) {
    L.push('PRIMARY RECOMMENDATION:');
    L.push(`  ${primary.equipment_name}`);
    L.push(`  SKU: ${primary.sku}`);
    if (primary.sizing.resin_ft3) L.push(`  Sizing: ${primary.sizing.resin_ft3} ft3 | ${primary.sizing.grain_capacity?.toLocaleString()} gr @ ${primary.sizing.salt_dose_lb_ft3} lb/ft3`);
    if (primary.resin_type)       L.push(`  Resin: ${primary.resin_type}`);
    L.push(`  Dealer: $${primary.dealer_price} | Retail install: $${primary.retail_low.toLocaleString()}–$${primary.retail_high.toLocaleString()}`);
    L.push(`  Why: ${primary.why}`);
    if (primary.requires_pretreatment) L.push(`  ⚠ Pretreat first: ${primary.requires_pretreatment}`);
    if (primary.notes)                 L.push(`  Note: ${primary.notes}`);
    L.push(`  Order: ${primary.order_url}`);
  } else {
    L.push('No equipment recommendation — manual review needed.');
  }
  if (additional.length) {
    L.push('');
    L.push('ALSO CONSIDER:');
    for (const p of additional) {
      L.push(`  • ${p.equipment_name} — $${p.dealer_price} dealer | $${p.retail_low}–$${p.retail_high} retail`);
      L.push(`    Order: ${p.order_url}`);
    }
  }
  if (apiEnrichment) L.push('\nH3 PLATFORM: Live enrichment available at https://h3api.connectable.to/plumber-pro');
  L.push('');
  L.push('Powered by H3 AquaOps Decision Engine + K48 Ventures LLC');
  return L.join('\n');
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function buildIssueList(
  gpg: number,
  ph: number,
  tds: number,
  iron: number,
  chloramine: boolean,
  source: string
): string[] {
  const issues: string[] = [];
  if (gpg >= 10)         issues.push('hard water / scale buildup');
  if (gpg >= 15)         issues.push('accelerated water heater / appliance wear');
  if (iron > 0.3)        issues.push('iron / staining');
  if (chloramine)        issues.push('chloramines / DBPs');
  if (ph < 6.5)          issues.push('low pH / corrosivity');
  if (ph > 8.5)          issues.push('high pH');
  if (tds > 500)         issues.push('high TDS / dissolved solids');
  if (source === 'well') issues.push('well water / bacteria risk');
  return issues;
}
