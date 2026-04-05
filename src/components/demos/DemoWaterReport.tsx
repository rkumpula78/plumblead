// src/components/demos/DemoWaterReport.tsx
// Shared water quality report widget for contractor demo pages
// Pulls from the same AZ/WA datasets as WaterQualityReport.tsx

import React, { useState } from 'react';
import azWaterData from '../../data/az-water-data.json';
import waWaterData from '../../data/wa-water-data.json';

const API_BASE = 'https://plumblead-production.up.railway.app';

interface CityData {
  name: string;
  hardness_gpg: { low: number; high: number; avg: number };
  tds_ppm: { low: number; high: number; avg: number };
  ph: { low: number; high: number; avg: number };
  chlorine_ppm: { low: number; high: number; avg: number };
  disinfection: string;
  source: string;
  zip_codes: string[];
}

interface WaterIssue {
  icon: string;
  title: string;
  severity: 'high' | 'medium' | 'info';
  description: string;
}

interface Rec {
  priority: 'high' | 'medium' | 'info';
  tag: string;
  product: string;
  reason: string;
  price: string;
}

interface WaterReport {
  city: string; state: string; zipCode: string;
  hardnessGPG: number; hardnessPPM: number; hardnessLevel: string; hardnessColor: string;
  tds: number; ph: number; disinfection: string; source: string;
  annualCostLow: number; annualCostHigh: number;
  issues: WaterIssue[];
  recs: Rec[];
  facts: string[];
}

function getHardnessLevel(gpg: number): { level: string; color: string } {
  if (gpg <= 3.5) return { level: 'Soft', color: '#10b981' };
  if (gpg <= 7.0) return { level: 'Slightly Hard', color: '#84cc16' };
  if (gpg <= 10.5) return { level: 'Moderately Hard', color: '#eab308' };
  if (gpg <= 14.6) return { level: 'Hard', color: '#f97316' };
  return { level: 'Very Hard', color: '#ef4444' };
}

function isSurface(source: string) {
  return ['river','reservoir','lake','creek','canal','snowmelt','surface','tolt','cedar','sultan','green river','colorado','naches','yakima','skagit','cowlitz','elwha','columbia','puyallup'].some(k => source.toLowerCase().includes(k));
}

function buildReport(zipCode: string): WaterReport | null {
  const datasets: Array<{ data: typeof azWaterData; state: string }> = [
    { data: azWaterData, state: 'AZ' },
    { data: waWaterData, state: 'WA' },
  ];
  for (const { data, state } of datasets) {
    for (const [, city] of Object.entries(data.cities)) {
      const c = city as CityData;
      if (!c.zip_codes.includes(zipCode)) continue;
      const gpg = c.hardness_gpg.avg;
      const { level, color } = getHardnessLevel(gpg);
      const tds = c.tds_ppm.avg;
      const factor = Math.min(gpg / 15, 2.5);
      const annualCostLow = Math.round(700 * factor);
      const annualCostHigh = Math.round(2000 * factor);

      // Issues
      const issues: WaterIssue[] = [];
      if (gpg > 14.6) issues.push({ icon: '🚨', title: 'Very Hard Water', severity: 'high', description: `At ${gpg} GPG, scale buildup is actively damaging your water heater, pipes, and appliances.` });
      else if (gpg > 10.5) issues.push({ icon: '🔶', title: 'Hard Water', severity: 'medium', description: `${gpg} GPG hardness causes noticeable scale buildup and reduces appliance efficiency.` });
      else if (gpg > 7) issues.push({ icon: '⚠️', title: 'Moderately Hard Water', severity: 'medium', description: `${gpg} GPG — enough to leave spots and gradually reduce water heater efficiency.` });
      if (c.disinfection === 'chloramine') issues.push({ icon: '🧪', title: 'Chloramine Disinfection', severity: 'medium', description: `${c.name} uses chloramine. It doesn't evaporate like chlorine and a standard pitcher filter won't remove it — common cause of unpleasant taste and odor.` });
      else if (c.disinfection === 'chlorine' && c.chlorine_ppm.avg > 1.2) issues.push({ icon: '💨', title: 'Chlorine Taste & Odor', severity: 'info', description: `Chlorine levels in ${c.name} can cause noticeable taste and odor in tap water.` });
      if (gpg <= 5 && c.ph.avg < 7.5) issues.push({ icon: '⚗️', title: 'Corrosive Water (Low pH)', severity: 'medium', description: `Soft, slightly acidic water (pH ${c.ph.avg}) can leach lead and copper from older pipes and fixtures.` });
      if (tds > 500) issues.push({ icon: '🌊', title: 'High Dissolved Solids', severity: 'medium', description: `At ${tds} ppm TDS — above the EPA aesthetic guideline of 500 ppm. Water may taste flat or mineral-heavy.` });
      issues.push({ icon: 'ℹ️', title: 'PFAS ("Forever Chemicals")', severity: 'info', description: 'PFAS are found in tap water systems nationwide. An NSF 58-certified reverse osmosis system is the most effective removal method.' });
      if (isSurface(c.source)) issues.push({ icon: '🌿', title: 'Surface Water Variability', severity: 'info', description: `${c.name} draws from ${c.source}. Quality can vary seasonally after heavy rain or snowmelt.` });

      // Recs
      const recs: Rec[] = [];
      if (gpg > 7) recs.push({ priority: gpg > 14 ? 'high' : 'medium', tag: 'Scale Protection', product: 'Water Softener', reason: `Your water averages ${gpg} GPG — "${level}." A softener protects your water heater, extends appliance life 30–50%, and eliminates scale.`, price: gpg > 20 ? '$2,800 – $4,500 installed' : '$1,800 – $3,500 installed' });
      const roReason = c.disinfection === 'chloramine'
        ? `${c.name} uses chloramine. Standard pitcher filters don't remove it — an RO system does, plus removes PFAS, lead, and arsenic.`
        : tds > 400 ? `With TDS at ${tds} ppm, an RO system significantly improves drinking water quality and removes PFAS.`
        : 'An NSF 58-certified RO system removes PFAS, lead, chlorine byproducts, and other invisible contaminants standard treatment misses.';
      recs.push({ priority: c.disinfection === 'chloramine' || tds > 400 ? 'medium' : 'info', tag: c.disinfection === 'chloramine' ? 'Taste & Safety' : 'Safety', product: 'Reverse Osmosis System', reason: roReason, price: '$300 – $800 installed' });
      if (c.disinfection === 'chloramine') recs.push({ priority: 'medium', tag: 'Taste & Odor', product: 'Whole House Carbon Filter', reason: 'Chloramine affects every outlet — showers, laundry, cooking water. A whole-house catalytic carbon filter removes it at the point of entry.', price: '$800 – $2,000 installed' });
      if (gpg <= 5 && c.ph.avg < 7.5) recs.push({ priority: 'medium', tag: 'Pipe Protection', product: 'pH Neutralizer / Calcite Filter', reason: `Soft, low-pH water (${c.ph.avg} avg) is mildly corrosive. A calcite neutralizer raises pH to a safe range, protecting your plumbing.`, price: '$500 – $1,200 installed' });

      // Facts
      const facts: string[] = [];
      if (gpg >= 15) facts.push(`${c.name} water is ${Math.round(gpg / 3.5)}× harder than what's considered "soft" water.`);
      if (gpg >= 12) facts.push(`Hard water can reduce your water heater's lifespan by 30–50%.`);
      if (gpg <= 3.5) facts.push(`${c.name} has naturally soft water from Cascade snowmelt — minimal scale buildup. But soft water has its own issues worth knowing about.`);
      if (c.disinfection === 'chloramine') facts.push(`${c.name} uses chloramine to disinfect water. Boiling or a standard pitcher filter won't remove it.`);
      facts.push('PFAS have been detected in tap water systems nationwide. The EPA issued a maximum contaminant level of 4 ppt in 2024. An NSF 58-certified RO system removes >95% of PFAS.');
      if (tds > 500) facts.push(`Your water has ${tds} ppm TDS — above the EPA aesthetic limit of 500 ppm.`);

      return { city: c.name, state, zipCode, hardnessGPG: gpg, hardnessPPM: Math.round(gpg * 17.1), hardnessLevel: level, hardnessColor: color, tds, ph: c.ph.avg, disinfection: c.disinfection, source: c.source, annualCostLow, annualCostHigh, issues, recs, facts };
    }
  }
  return null;
}

const SEVERITY_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f97316', info: '#64748b' };
const PRIORITY_BORDER: Record<string, string> = { high: '#ef4444', medium: '#0ea5e9', info: '#e2e8f0' };

interface Props {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientColor: string;
}

const DemoWaterReport: React.FC<Props> = ({ clientId, clientName, clientPhone, clientColor }) => {
  const [zipCode, setZipCode] = useState('');
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{5}$/.test(zipCode)) { setError('Please enter a valid 5-digit zip code'); return; }
    const r = buildReport(zipCode);
    if (!r) {
      setError("We don't have data for that zip code yet. Currently covering Arizona and Washington State. Call " + clientPhone + " for a consultation.");
      setReport(null);
    } else {
      setReport(r);
    }
  };

  const handleLeadSubmit = async () => {
    if (!name.trim() || !phone.trim() || !consent) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email,
          service: 'water-treatment-consultation',
          serviceLabel: 'Water Treatment Consultation',
          zipCode: report?.zipCode,
          city: report?.city,
          state: report?.state,
          waterHardness: `${report?.hardnessGPG} GPG (${report?.hardnessLevel})`,
          annualCostEstimate: `$${report?.annualCostLow.toLocaleString()} – $${report?.annualCostHigh.toLocaleString()}/yr`,
          recommendations: report?.recs.map(r => r.product).join(', '),
          issues: report?.issues.map(i => i.title).join(', '),
          source: 'water-quality-report',
          clientId,
          clientName,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
    setSubmitted(true);
  };

  const s = { fontFamily: 'system-ui, -apple-system, sans-serif' };

  return (
    <div style={{ ...s, maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

      {/* Intro */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', background: `${clientColor}15`, border: `1px solid ${clientColor}40`, borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 12, color: clientColor }}>Free Water Intelligence</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Know What's In Your Water</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>Enter your zip code for a free water quality report — hardness levels, contaminant risks, and personalized treatment recommendations for your area.</p>
      </div>

      {/* Zip Form */}
      <form onSubmit={handleZipSubmit} style={{ display: 'flex', gap: 12, maxWidth: 360, margin: '0 auto 32px' }}>
        <input
          type="text" value={zipCode} onChange={e => setZipCode(e.target.value)}
          placeholder="Enter zip code" maxLength={5}
          style={{ flex: 1, padding: '13px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 16, outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="submit" style={{ padding: '13px 20px', background: clientColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Check</button>
      </form>
      {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#991b1b', marginBottom: 20, textAlign: 'center' }}>{error}</div>}

      {!report && !error && (
        <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          <div>Try: 98272 (Monroe WA) · 98101 (Seattle) · 99201 (Spokane) · 85383 (Peoria AZ)</div>
        </div>
      )}

      {report && (
        <div>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Water Quality Report</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{report.city}, {report.state} — {report.zipCode}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Source: {report.source}</div>
          </div>

          {/* Hardness Gauge */}
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Water Hardness</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: report.hardnessColor, lineHeight: 1 }}>{report.hardnessGPG} GPG</div>
            <div style={{ display: 'inline-block', padding: '4px 14px', background: `${report.hardnessColor}15`, color: report.hardnessColor, borderRadius: 20, fontSize: 13, fontWeight: 700, marginTop: 6, marginBottom: 16 }}>{report.hardnessLevel}</div>
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, position: 'relative' }}>
                <div style={{ background: 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)', borderRadius: 6, height: 10, width: '100%' }} />
                <div style={{ position: 'absolute', top: -5, left: `${Math.min((report.hardnessGPG / 30) * 100, 95)}%`, width: 20, height: 20, background: '#fff', border: `3px solid ${report.hardnessColor}`, borderRadius: '50%', transform: 'translateX(-50%)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}><span>Soft</span><span>Hard</span><span>Very Hard</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
              {[['Hardness', `${report.hardnessPPM} ppm`], ['TDS', `${report.tds} ppm`], ['pH', `${report.ph}`]].map(([l, v]) => (
                <div key={l} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>⚠️ Water Quality Issues Detected</div>
            {report.issues.map((issue, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, borderLeft: `4px solid ${SEVERITY_COLOR[issue.severity]}`, marginBottom: 8 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{issue.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{issue.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{issue.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Annual Cost */}
          {report.annualCostLow > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>💸 Estimated Annual Cost of Your Water</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>${report.annualCostLow.toLocaleString()} – ${report.annualCostHigh.toLocaleString()}/year</div>
              <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>In appliance damage, extra soap, and early replacement costs</div>
            </div>
          )}

          {/* Facts */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>💡 Did You Know?</div>
            {report.facts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                <span style={{ color: clientColor, flexShrink: 0 }}>•</span><span>{fact}</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>✅ What We Recommend</div>
            {report.recs.map((rec, i) => (
              <div key={i} style={{ border: `1px solid ${PRIORITY_BORDER[rec.priority]}`, borderLeft: `4px solid ${PRIORITY_BORDER[rec.priority]}`, borderRadius: 10, padding: 14, marginBottom: 10, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{rec.product}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${PRIORITY_BORDER[rec.priority]}15`, color: PRIORITY_BORDER[rec.priority], textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{rec.tag}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: clientColor }}>{rec.price}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{rec.reason}</div>
              </div>
            ))}
          </div>

          {/* Lead Capture */}
          {!submitted ? (
            <div style={{ background: '#fff', border: `2px solid ${clientColor}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: clientColor, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Free Consultation</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Want a solution for your {report.city} water?</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>A licensed plumber will review your report and give you an exact installation quote — no pressure, no obligation.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <input type="checkbox" id="wq-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: clientColor }} />
                  <label htmlFor="wq-consent" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>I agree to receive SMS updates about water treatment options from {clientName}. Reply STOP to opt out.</label>
                </div>
                <button
                  onClick={handleLeadSubmit}
                  disabled={!name.trim() || !phone.trim() || !consent || submitting}
                  style={{ padding: '14px', background: name.trim() && phone.trim() && consent && !submitting ? clientColor : '#e2e8f0', color: name.trim() && phone.trim() && consent && !submitting ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: name.trim() && phone.trim() && consent && !submitting ? 'pointer' : 'not-allowed' }}>
                  {submitting ? 'Sending...' : 'Get My Free Water Consultation 🔒'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>✓ Licensed & Insured &nbsp; ✓ No obligation &nbsp; ✓ Response within 60 seconds</div>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 6 }}>You're on the list!</div>
              <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>A licensed plumber from {clientName} will reach out shortly to discuss water treatment options for your {report.city} home.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoWaterReport;
