import React, { useState } from 'react';
import azWaterData from '../data/az-water-data.json';
import waWaterData from '../data/wa-water-data.json';

const API_BASE = 'https://plumblead-production.up.railway.app';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityData {
  name: string;
  hardness_gpg: { low: number; high: number; avg: number };
  hardness_ppm: { low: number; high: number; avg: number };
  tds_ppm: { low: number; high: number; avg: number };
  ph: { low: number; high: number; avg: number };
  chlorine_ppm: { low: number; high: number; avg: number };
  disinfection: string;
  source: string;
  zip_codes: string[];
}

interface HardnessLevel {
  level: string;
  color: string;
  emoji: string;
  severity: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'info';
  product: string;
  reason: string;
  priceRange: string;
  tag?: string; // e.g. 'Safety', 'Taste & Odor', 'Scale Protection'
}

interface WaterIssue {
  icon: string;
  title: string;
  severity: 'high' | 'medium' | 'info';
  description: string;
}

interface WaterReport {
  city: string;
  state: string;
  zipCode: string;
  hardness: { low: number; high: number; avg: number; ppm: number; level: string; color: string; emoji: string };
  tds: number;
  ph: number;
  disinfection: string;
  source: string;
  annualCost: {
    low: number; high: number; avg: number;
    breakdown: { waterHeater: number; appliances: number; soapDetergent: number; plumbingRepairs: number; cleaningProducts: number };
  };
  recommendation: Recommendation[];
  issues: WaterIssue[];
  facts: string[];
  isSoftWater: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHardnessLevel(gpg: number): HardnessLevel {
  if (gpg <= 3.5) return { level: 'Soft', color: '#10b981', emoji: '💧', severity: 0 };
  if (gpg <= 7.0) return { level: 'Slightly Hard', color: '#84cc16', emoji: '💧', severity: 1 };
  if (gpg <= 10.5) return { level: 'Moderately Hard', color: '#eab308', emoji: '⚠️', severity: 2 };
  if (gpg <= 14.6) return { level: 'Hard', color: '#f97316', emoji: '🔶', severity: 3 };
  return { level: 'Very Hard', color: '#ef4444', emoji: '🚨', severity: 4 };
}

function estimateAnnualCost(hardnessGPG: number) {
  const factor = Math.min(hardnessGPG / 15, 2.5);
  return {
    low: Math.round(700 * factor),
    high: Math.round(2000 * factor),
    avg: Math.round(1350 * factor),
    breakdown: {
      waterHeater: Math.round(350 * factor),
      appliances: Math.round(200 * factor),
      soapDetergent: Math.round(175 * factor),
      plumbingRepairs: Math.round(250 * factor),
      cleaningProducts: Math.round(100 * factor)
    }
  };
}

// Detect if source is surface water (rivers, reservoirs, snowmelt)
function isSurfaceWater(source: string): boolean {
  const keywords = ['river', 'reservoir', 'lake', 'creek', 'canal', 'snowmelt', 'surface', 'tolt', 'cedar', 'sultan', 'green river', 'colorado', 'naches', 'yakima', 'skagit', 'cowlitz', 'elwha', 'columbia', 'puyallup'];
  return keywords.some(k => source.toLowerCase().includes(k));
}

// PFAS risk based on region/state — surface water systems and areas near military/industrial sites
function getPFASRiskLevel(city: CityData, state: string): 'elevated' | 'standard' {
  // Areas with documented or elevated PFAS concern
  // WA: areas near military installations (JBLM — Lakewood/Tacoma/Puyallup, Whidbey — Oak Harbor)
  // AZ: areas near Luke AFB (Goodyear, Litchfield Park, Buckeye, Surprise)
  const elevatedCities = [
    'lakewood', 'puyallup', 'tacoma', 'oak harbor', 'goodyear', 'litchfield park',
    'buckeye', 'surprise', 'yuma', 'sierra vista' // military installations nearby
  ];
  return elevatedCities.some(c => city.name.toLowerCase().includes(c)) ? 'elevated' : 'standard';
}

// ─── Issues Engine ────────────────────────────────────────────────────────────

function getWaterIssues(city: CityData, hardnessAvg: number, tds: number, state: string): WaterIssue[] {
  const issues: WaterIssue[] = [];

  // Hardness
  if (hardnessAvg > 14.6) {
    issues.push({ icon: '🚨', title: 'Very Hard Water', severity: 'high', description: `At ${hardnessAvg} GPG, scale buildup is actively damaging your water heater, pipes, and appliances.` });
  } else if (hardnessAvg > 10.5) {
    issues.push({ icon: '🔶', title: 'Hard Water', severity: 'medium', description: `${hardnessAvg} GPG hardness causes noticeable scale buildup and reduces appliance efficiency over time.` });
  } else if (hardnessAvg > 7) {
    issues.push({ icon: '⚠️', title: 'Moderately Hard Water', severity: 'medium', description: `${hardnessAvg} GPG — enough to leave spots on dishes and gradually reduce water heater efficiency.` });
  }

  // Chloramine
  if (city.disinfection === 'chloramine') {
    issues.push({ icon: '🧪', title: 'Chloramine Disinfection', severity: 'medium', description: `${city.name} uses chloramine (chlorine + ammonia). It doesn't evaporate like chlorine and a standard pitcher filter won't remove it. Common cause of unpleasant taste and odor.` });
  }

  // Chlorine taste/odor (chlorine systems with higher dosing)
  if (city.disinfection === 'chlorine' && city.chlorine_ppm.avg > 1.2) {
    issues.push({ icon: '💨', title: 'Chlorine Taste & Odor', severity: 'info', description: `${city.name} uses standard chlorine disinfection at levels that can cause noticeable taste and odor in tap water, especially when cold.` });
  }

  // Low pH / corrosivity (soft water is naturally more corrosive)
  if (hardnessAvg <= 5 && city.ph.avg < 7.5) {
    issues.push({ icon: '⚗️', title: 'Corrosive Water (Low pH)', severity: 'medium', description: `Soft, slightly acidic water (pH ${city.ph.avg}) can leach lead and copper from older pipes and fixtures. Common in ${state === 'WA' ? 'Western Washington' : 'mountain water systems'}.` });
  }

  // High TDS
  if (tds > 500) {
    issues.push({ icon: '🌊', title: 'High Dissolved Solids (TDS)', severity: 'medium', description: `At ${tds} ppm TDS — above the EPA aesthetic guideline of 500 ppm. Drinking water may taste flat or mineral-heavy.` });
  }

  // PFAS awareness (universal)
  const pfasRisk = getPFASRiskLevel(city, state);
  if (pfasRisk === 'elevated') {
    issues.push({ icon: '⚠️', title: 'Elevated PFAS Risk Area', severity: 'high', description: `${city.name} is near industrial or military sites with documented PFAS ("forever chemical") contamination history. Standard filtration does not remove PFAS — a certified reverse osmosis system does.` });
  } else {
    issues.push({ icon: 'ℹ️', title: 'PFAS ("Forever Chemicals")', severity: 'info', description: `PFAS are found in tap water systems nationwide, including municipal supplies. They don't break down naturally and accumulate in the body. An NSF-certified reverse osmosis system is the only reliably effective removal method.` });
  }

  // Surface water sediment / seasonal variation
  if (isSurfaceWater(city.source)) {
    issues.push({ icon: '🌿', title: 'Surface Water Variability', severity: 'info', description: `${city.name} draws from surface water (${city.source}). Quality can vary seasonally — turbidity and organic compounds may increase after heavy rainfall or snowmelt events.` });
  }

  return issues;
}

// ─── Recommendations Engine ───────────────────────────────────────────────────

function getRecommendations(city: CityData, hardnessAvg: number, tds: number, state: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const hardnessInfo = getHardnessLevel(hardnessAvg);
  const pfasRisk = getPFASRiskLevel(city, state);

  // Water softener — hardness-driven
  if (hardnessAvg > 7) {
    recs.push({
      priority: hardnessAvg > 14 ? 'high' : 'medium',
      tag: 'Scale Protection',
      product: 'Water Softener',
      reason: `Your water averages ${hardnessAvg} GPG hardness — that's "${hardnessInfo.level}." A softener protects your water heater, extends appliance life by 30–50%, and eliminates scale on fixtures and dishes.`,
      priceRange: hardnessAvg > 20 ? '$2,800 – $4,500 installed' : '$1,800 – $3,500 installed'
    });
  }

  // RO system — PFAS elevated risk (highest priority)
  if (pfasRisk === 'elevated') {
    recs.push({
      priority: 'high',
      tag: 'Safety',
      product: 'NSF-Certified Reverse Osmosis System',
      reason: `Your area has elevated PFAS risk from nearby industrial or military activity. An NSF 58-certified RO system removes PFAS, lead, arsenic, nitrates, and other contaminants that standard filters miss. This is the most important upgrade for drinking water safety in your area.`,
      priceRange: '$400 – $900 installed'
    });
  } else {
    // Standard RO recommendation — driven by chloramine, TDS, or soft water drinking quality
    const roReason = city.disinfection === 'chloramine'
      ? `${city.name} uses chloramine disinfection. Standard pitcher filters (Brita, etc.) don't remove chloramine — an under-sink RO system does, giving you clean, great-tasting drinking water at the tap. Also removes PFAS, lead, and arsenic.`
      : tds > 400
        ? `With TDS at ${tds} ppm, an RO system will significantly improve your drinking water quality. Also removes PFAS, lead, arsenic, and chlorine byproducts.`
        : `Even with soft, clean-tasting water, an RO system removes PFAS, lead, chlorine byproducts, and other invisible contaminants that municipal treatment doesn't eliminate. NSF 58-certified systems are the gold standard for drinking water safety.`;

    recs.push({
      priority: city.disinfection === 'chloramine' || tds > 400 ? 'medium' : 'info',
      tag: city.disinfection === 'chloramine' ? 'Taste & Safety' : 'Safety',
      product: 'Reverse Osmosis (Drinking Water)',
      reason: roReason,
      priceRange: '$300 – $800 installed'
    });
  }

  // Whole house carbon filter — chloramine or elevated chlorine
  if (city.disinfection === 'chloramine') {
    recs.push({
      priority: 'medium',
      tag: 'Taste & Odor',
      product: 'Whole House Carbon Filter',
      reason: `Chloramine affects every water outlet in your home — showers, laundry, cooking water. A whole-house catalytic carbon filter removes it at the point of entry, protecting your skin, hair, and clothing from chemical exposure.`,
      priceRange: '$800 – $2,000 installed'
    });
  } else if (city.disinfection === 'chlorine' && city.chlorine_ppm.avg > 1.2) {
    recs.push({
      priority: 'info',
      tag: 'Taste & Odor',
      product: 'Whole House Carbon Filter',
      reason: `${city.name}'s chlorine levels can cause noticeable taste and odor. A whole-house carbon filter removes chlorine at the point of entry — improving taste, reducing skin irritation in the shower, and protecting clothing in the wash.`,
      priceRange: '$600 – $1,800 installed'
    });
  }

  // Low pH / corrosivity neutralizer
  if (hardnessAvg <= 5 && city.ph.avg < 7.5) {
    recs.push({
      priority: 'medium',
      tag: 'Pipe Protection',
      product: 'pH Neutralizer / Calcite Filter',
      reason: `Soft, low-pH water (${city.ph.avg} avg) is corrosive and can leach lead and copper from older pipes and brass fixtures. A calcite neutralizer raises pH to a safe range, protecting your plumbing and preventing metal contamination in your drinking water.`,
      priceRange: '$500 – $1,200 installed'
    });
  }

  // Sediment pre-filter for surface water
  if (isSurfaceWater(city.source)) {
    recs.push({
      priority: 'info',
      tag: 'Sediment',
      product: 'Whole House Sediment Pre-Filter',
      reason: `Surface water sources like ${city.source} can carry fine sediment, especially after rain or snowmelt. A sediment pre-filter protects your water heater, appliances, and any downstream filtration systems from particulate buildup.`,
      priceRange: '$150 – $400 installed'
    });
  }

  return recs;
}

// ─── Facts Engine ─────────────────────────────────────────────────────────────

function getFacts(city: CityData, hardnessAvg: number, tds: number, state: string): string[] {
  const facts: string[] = [];

  if (hardnessAvg >= 15) facts.push(`${city.name} water is ${Math.round(hardnessAvg / 3.5)}× harder than what's considered "soft" water.`);
  if (hardnessAvg >= 12) facts.push(`Hard water can reduce your water heater's lifespan by 30–50%. In ${city.name}, that means replacing it every 6–8 years instead of 12–15.`);
  if (hardnessAvg <= 3.5) facts.push(`${city.name} has naturally soft water from ${isSurfaceWater(city.source) ? 'Cascade snowmelt' : 'local groundwater'} — minimal scale buildup. But soft water has its own issues worth knowing about.`);
  if (hardnessAvg > 3.5) facts.push(`You're using up to ${Math.round(50 + (hardnessAvg / 15) * 25)}% more soap and detergent than homes with soft water.`);

  if (city.disinfection === 'chloramine') facts.push(`${city.name} uses chloramine to disinfect water. It's effective at killing bacteria but doesn't evaporate like chlorine — boiling or a standard pitcher filter won't remove it.`);

  if (tds > 500) facts.push(`Your water has approximately ${tds} ppm of total dissolved solids — above the EPA's recommended aesthetic limit of 500 ppm.`);

  if (hardnessAvg <= 5 && city.ph.avg < 7.5) facts.push(`Soft water with a pH below 7.5 is mildly corrosive. In homes with copper pipes or older brass fixtures, this can slowly leach metal into drinking water.`);

  // PFAS universal fact
  facts.push(`PFAS ("forever chemicals") have been detected in tap water systems nationwide. The EPA issued a maximum contaminant level of 4 parts per trillion (ppt) in 2024 — most utilities are still working toward compliance. An NSF 58-certified RO system removes >95% of PFAS.`);

  if (isSurfaceWater(city.source)) facts.push(`${city.name} sources water from ${city.source}. Surface water is treated but can vary seasonally — organic compounds and turbidity tend to increase after heavy rain.`);

  return facts;
}

// ─── Data Lookup ──────────────────────────────────────────────────────────────

function getWaterReport(zipCode: string): WaterReport | null {
  const datasets: Array<{ data: typeof azWaterData; state: string }> = [
    { data: azWaterData, state: 'AZ' },
    { data: waWaterData, state: 'WA' },
  ];

  for (const { data, state } of datasets) {
    for (const [, city] of Object.entries(data.cities)) {
      const c = city as CityData;
      if (c.zip_codes.includes(zipCode)) {
        const hardnessAvg = c.hardness_gpg.avg;
        const hardnessInfo = getHardnessLevel(hardnessAvg);
        const tds = c.tds_ppm.avg;
        return {
          city: c.name, state, zipCode,
          hardness: { low: c.hardness_gpg.low, high: c.hardness_gpg.high, avg: hardnessAvg, ppm: Math.round(hardnessAvg * 17.1), level: hardnessInfo.level, color: hardnessInfo.color, emoji: hardnessInfo.emoji },
          tds, ph: c.ph.avg, disinfection: c.disinfection, source: c.source,
          annualCost: estimateAnnualCost(hardnessAvg),
          recommendation: getRecommendations(c, hardnessAvg, tds, state),
          issues: getWaterIssues(c, hardnessAvg, tds, state),
          facts: getFacts(c, hardnessAvg, tds, state),
          isSoftWater: hardnessAvg <= 7,
        };
      }
    }
  }
  return null;
}

// ─── Priority colors ──────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { border: string; bg: string; tagBg: string; tagColor: string }> = {
  high:   { border: '#ef4444', bg: '#fff',    tagBg: '#fef2f2', tagColor: '#dc2626' },
  medium: { border: '#0ea5e9', bg: '#fff',    tagBg: '#eff6ff', tagColor: '#1d4ed8' },
  info:   { border: '#e2e8f0', bg: '#f8fafc', tagBg: '#f1f5f9', tagColor: '#475569' },
};

const ISSUE_SEVERITY_COLOR: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f97316',
  info:   '#64748b',
};

// ─── Lead Capture Form ────────────────────────────────────────────────────────

interface LeadFormProps { zipCode: string; report: WaterReport; }

const WaterLeadCapture: React.FC<LeadFormProps> = ({ zipCode, report }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) { alert('Please enter your name and phone number'); return; }
    if (phone.replace(/\D/g, '').length < 10) { alert('Please enter a valid phone number'); return; }
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email,
          service: 'water-treatment-consultation',
          serviceLabel: 'Water Treatment Consultation',
          zipCode, source: 'water-quality-report',
          waterHardness: `${report.hardness.avg} GPG (${report.hardness.level})`,
          annualCostEstimate: `$${report.annualCost.low.toLocaleString()} – $${report.annualCost.high.toLocaleString()}/yr`,
          recommendations: report.recommendation.map(r => r.product).join(', '),
          issues: report.issues.map(i => i.title).join(', '),
          city: report.city, state: report.state,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (err) { console.error('Water lead submit error:', err); }
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '28px 24px', textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 8 }}>You're on the list!</div>
        <div style={{ fontSize: 14, color: '#15803d', lineHeight: 1.6 }}>A licensed plumber will reach out shortly to discuss water treatment options for your {report.city} home.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '2px solid #0ea5e9', borderRadius: 12, padding: '24px', marginTop: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Free Consultation</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Want a solution for your {report.city} water?</div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>A licensed plumber will review your water report and give you an exact installation quote — no pressure, no obligation.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={{ padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '14px', background: loading ? '#94a3b8' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending...' : 'Get My Free Water Consultation 🔒'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
        ✓ Licensed & Insured &nbsp; ✓ No obligation &nbsp; ✓ Response within 60 seconds
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const WaterQualityReport: React.FC = () => {
  const [zipCode, setZipCode] = useState('');
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) { setError('Please enter a valid 5-digit zip code'); return; }
    const waterReport = getWaterReport(zipCode);
    if (!waterReport) {
      setError("Sorry, we don't have water data for that zip code yet. Currently covering Arizona and Washington State. Call (833) 558-0877 for a free consultation in your area.");
      setReport(null);
    } else {
      setReport(waterReport);
    }
  };

  const costSaved5yr = report ? report.annualCost.avg * 5 : 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Free Water Quality Intelligence</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Know Your Water</h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>Enter your zip code to see detailed water quality data, potential health concerns, and personalized recommendations for your area.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto 40px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Enter zip code" maxLength={5} style={{ flex: 1, padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 16, outline: 'none', fontFamily: 'inherit' }} />
          <button type="submit" style={{ padding: '14px 28px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Get Report</button>
        </div>
        {error && <div style={{ marginTop: 12, padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, color: '#991b1b' }}>{error}</div>}
      </form>

      {report && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Free Water Quality Report</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{report.city}, {report.state} — {report.zipCode}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Source: {report.source}</div>
          </div>

          {/* Hardness Gauge */}
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 14, color: '#64748b' }}>Your Water Hardness</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: report.hardness.color }}>{report.hardness.avg} GPG</div>
            <div style={{ display: 'inline-block', padding: '4px 16px', background: `${report.hardness.color}15`, color: report.hardness.color, borderRadius: 20, fontSize: 14, fontWeight: 600 }}>{report.hardness.emoji} {report.hardness.level}</div>
            <div style={{ margin: '12px auto 0', maxWidth: 300 }}>
              <div style={{ background: '#f1f5f9', borderRadius: 8, height: 12, position: 'relative' }}>
                <div style={{ background: 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)', borderRadius: 8, height: 12, width: '100%' }} />
                <div style={{ position: 'absolute', top: -4, left: `${Math.min((report.hardness.avg / 30) * 100, 95)}%`, width: 20, height: 20, background: '#fff', border: `3px solid ${report.hardness.color}`, borderRadius: '50%', transform: 'translateX(-50%)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                <span>Soft</span><span>Hard</span><span>Very Hard</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0' }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.hardness.ppm}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Hardness (ppm)</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.tds}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>TDS (ppm)</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.ph}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>pH Level</div>
            </div>
          </div>

          {/* Issues Panel — replaces/supplements the hardness cost box */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>⚠️ Water Quality Issues Detected</div>
            {report.issues.map((issue, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, borderLeft: `4px solid ${ISSUE_SEVERITY_COLOR[issue.severity]}` }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{issue.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{issue.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{issue.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hard water cost — only shown if hardness is meaningful */}
          {report.annualCost.avg > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, margin: '20px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>💸 What Hard Water Is Costing You</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>${report.annualCost.low.toLocaleString()} – ${report.annualCost.high.toLocaleString()}/year</div>
              <div style={{ fontSize: 13, color: '#991b1b', marginTop: 4 }}>That's up to <strong>${costSaved5yr.toLocaleString()} over 5 years</strong> in damage, wasted soap, and early appliance replacement.</div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                Water heater damage: ~${report.annualCost.breakdown.waterHeater}/yr &bull; Appliances: ~${report.annualCost.breakdown.appliances}/yr &bull; Extra soap: ~${report.annualCost.breakdown.soapDetergent}/yr &bull; Plumbing repairs: ~${report.annualCost.breakdown.plumbingRepairs}/yr
              </div>
            </div>
          )}

          {/* Facts */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>💡 Did You Know?</div>
            {report.facts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                <span style={{ color: '#0ea5e9', flexShrink: 0 }}>•</span><span>{fact}</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>✅ What We Recommend</div>
            {report.recommendation.map((rec, i) => {
              const style = PRIORITY_STYLE[rec.priority];
              return (
                <div key={i} style={{ border: `1px solid ${style.border}`, borderLeft: `4px solid ${style.border}`, borderRadius: 10, padding: 16, marginBottom: 10, background: style.bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{rec.product}</div>
                      {rec.tag && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: style.tagBg, color: style.tagColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {rec.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9', flexShrink: 0 }}>{rec.priceRange}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>{rec.reason}</div>
                </div>
              );
            })}
          </div>

          <WaterLeadCapture zipCode={zipCode} report={report} />
        </div>
      )}

      {!report && !error && (
        <div style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#94a3b8' }}>
          <div>Arizona: 85383 (Peoria), 85254 (Scottsdale), 85225 (Chandler)</div>
          <div style={{ marginTop: 4 }}>Washington: 98101 (Seattle), 99201 (Spokane), 99336 (Kennewick)</div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityReport;
