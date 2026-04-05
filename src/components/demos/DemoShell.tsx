// src/components/demos/DemoShell.tsx
// Shared shell for all contractor demo pages
// Renders a two-tab layout: Instant Quote + Water Quality Report
// Each tab is self-contained and sends leads tagged with the contractor's clientId

import React, { useState, useEffect } from 'react';
import azWaterData from '../../data/az-water-data.json';
import waWaterData from '../../data/wa-water-data.json';

const API_BASE = 'https://plumblead-production.up.railway.app';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DemoConfig {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientColor: string;
  clientAccent: string;
  address: string;
  serviceArea: string;
  defaultZip: string;
  services: { key: string; label: string; icon: string; hint: string }[];
  trustBadges: string[];
  emergencyBanner?: string;
}

interface QuoteResult {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
  leadScore?: string;
  crossSellOpportunities?: string[];
}

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

interface WaterRec {
  priority: 'high' | 'medium' | 'info';
  tag: string;
  product: string;
  reason: string;
  priceRange: string;
}

// ─── Water Logic (inline, no external import needed) ─────────────────────────

function getHardnessLevel(gpg: number) {
  if (gpg <= 3.5) return { level: 'Soft', color: '#10b981', emoji: '💧', severity: 0 };
  if (gpg <= 7.0) return { level: 'Slightly Hard', color: '#84cc16', emoji: '💧', severity: 1 };
  if (gpg <= 10.5) return { level: 'Moderately Hard', color: '#eab308', emoji: '⚠️', severity: 2 };
  if (gpg <= 14.6) return { level: 'Hard', color: '#f97316', emoji: '🔶', severity: 3 };
  return { level: 'Very Hard', color: '#ef4444', emoji: '🚨', severity: 4 };
}

function isSurface(source: string) {
  return ['river','reservoir','lake','creek','canal','snowmelt','surface','tolt','cedar','sultan','green river','columbia','naches','skagit'].some(k => source.toLowerCase().includes(k));
}

function getIssues(city: CityData, gpg: number): WaterIssue[] {
  const issues: WaterIssue[] = [];
  if (gpg > 14.6) issues.push({ icon: '🚨', title: 'Very Hard Water', severity: 'high', description: `At ${gpg} GPG, scale is actively damaging your water heater, pipes, and appliances.` });
  else if (gpg > 10.5) issues.push({ icon: '🔶', title: 'Hard Water', severity: 'medium', description: `${gpg} GPG hardness causes visible scale buildup and reduces appliance efficiency.` });
  else if (gpg > 7) issues.push({ icon: '⚠️', title: 'Moderately Hard Water', severity: 'medium', description: `${gpg} GPG — enough for spots on dishes and gradual water heater efficiency loss.` });
  if (city.disinfection === 'chloramine') issues.push({ icon: '🧪', title: 'Chloramine Disinfection', severity: 'medium', description: `${city.name} uses chloramine. It doesn't evaporate and a standard pitcher filter won't remove it — a common cause of taste and odor issues.` });
  else if (city.chlorine_ppm.avg > 1.2) issues.push({ icon: '💨', title: 'Chlorine Taste & Odor', severity: 'info', description: `Chlorine levels in ${city.name} can cause noticeable taste and odor in tap water.` });
  if (gpg <= 5 && city.ph.avg < 7.5) issues.push({ icon: '⚗️', title: 'Corrosive Water (Low pH)', severity: 'medium', description: `Soft, slightly acidic water (pH ${city.ph.avg}) can leach lead and copper from older pipes. Common in Western Washington.` });
  if (city.tds_ppm.avg > 500) issues.push({ icon: '🌊', title: 'High TDS', severity: 'medium', description: `At ${city.tds_ppm.avg} ppm TDS — above EPA's aesthetic guideline of 500 ppm.` });
  issues.push({ icon: 'ℹ️', title: 'PFAS ("Forever Chemicals")', severity: 'info', description: `PFAS are found in tap water systems nationwide. An NSF-certified reverse osmosis system is the most effective removal method.` });
  if (isSurface(city.source)) issues.push({ icon: '🌿', title: 'Surface Water Variability', severity: 'info', description: `${city.name} draws from ${city.source}. Quality can vary seasonally after heavy rain or snowmelt.` });
  return issues;
}

function getRecs(city: CityData, gpg: number, clientName: string): WaterRec[] {
  const recs: WaterRec[] = [];
  if (gpg > 7) recs.push({ priority: gpg > 14 ? 'high' : 'medium', tag: 'Scale Protection', product: 'Water Softener', reason: `Your water averages ${gpg} GPG — "${getHardnessLevel(gpg).level}." A softener protects your water heater, extends appliance life 30–50%, and eliminates scale.`, priceRange: gpg > 20 ? '$2,800 – $4,500 installed' : '$1,800 – $3,500 installed' });
  const roReason = city.disinfection === 'chloramine'
    ? `${city.name} uses chloramine. Standard pitcher filters don't remove it — an under-sink RO system does, and also removes PFAS, lead, and arsenic.`
    : `Even with soft water, an RO system removes PFAS, lead, chlorine byproducts, and other invisible contaminants.`;
  recs.push({ priority: city.disinfection === 'chloramine' ? 'high' : 'medium', tag: city.disinfection === 'chloramine' ? 'Taste & Safety' : 'Safety', product: 'Reverse Osmosis (Drinking Water)', reason: roReason, priceRange: '$300 – $800 installed' });
  if (city.disinfection === 'chloramine') recs.push({ priority: 'medium', tag: 'Taste & Odor', product: 'Whole House Carbon Filter', reason: `Chloramine affects every outlet in your home. A whole-house catalytic carbon filter removes it at the point of entry.`, priceRange: '$800 – $2,000 installed' });
  if (gpg <= 5 && city.ph.avg < 7.5) recs.push({ priority: 'medium', tag: 'Pipe Protection', product: 'pH Neutralizer / Calcite Filter', reason: `Soft, low-pH water is corrosive and can leach metal from older pipes. A calcite neutralizer raises pH to a safe range.`, priceRange: '$500 – $1,200 installed' });
  return recs;
}

function lookupWater(zip: string) {
  const datasets: Array<{ data: typeof azWaterData; state: string }> = [
    { data: azWaterData, state: 'AZ' },
    { data: waWaterData, state: 'WA' },
  ];
  for (const { data, state } of datasets) {
    for (const [, city] of Object.entries(data.cities)) {
      const c = city as CityData;
      if (c.zip_codes.includes(zip)) return { city: c, state };
    }
  }
  return null;
}

// ─── Severity colors ──────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f97316', info: '#64748b' };
const PRI_BORDER: Record<string, string> = { high: '#ef4444', medium: '#3b82f6', info: '#e2e8f0' };

// ─── Water Quality Tab ────────────────────────────────────────────────────────

const WaterTab: React.FC<{ config: DemoConfig }> = ({ config }) => {
  const [zip, setZip] = useState('');
  const [report, setReport] = useState<{ city: CityData; state: string; gpg: number; level: string; color: string } | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{5}$/.test(zip)) { setError('Please enter a valid 5-digit zip code'); return; }
    const result = lookupWater(zip);
    if (!result) {
      setError("We don't have data for that zip yet — call us at " + config.clientPhone + " for a free water consultation.");
      setReport(null);
    } else {
      const gpg = result.city.hardness_gpg.avg;
      const hl = getHardnessLevel(gpg);
      setReport({ city: result.city, state: result.state, gpg, level: hl.level, color: hl.color });
    }
  };

  const handleSubmit = async () => {
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
          zipCode: zip,
          city: report?.city.name,
          state: report?.state,
          waterHardness: `${report?.gpg} GPG (${report?.level})`,
          recommendations: getRecs(report!.city, report!.gpg, config.clientName).map(r => r.product).join(', '),
          clientId: config.clientId,
          clientName: config.clientName,
          source: 'water-quality-report',
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You're on the list!</h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>A licensed plumber from {config.clientName} will reach out shortly to discuss water treatment options for your home.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Know Your Water</h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5 }}>Enter your zip code to see what's really in your water — and what it's costing you.</p>
      </div>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: 12, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
        <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip code" maxLength={5}
          style={{ flex: 1, padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 16, outline: 'none', fontFamily: 'inherit' }} />
        <button type="submit" style={{ padding: '14px 24px', background: config.clientColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Check</button>
      </form>
      {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#991b1b', marginBottom: 20, textAlign: 'center' }}>{error}</div>}

      {!report && !error && (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          <div>Try: 98272 (Monroe WA), 98101 (Seattle), 98201 (Everett)</div>
        </div>
      )}

      {report && (() => {
        const issues = getIssues(report.city, report.gpg);
        const recs = getRecs(report.city, report.gpg, config.clientName);
        const annualLow = Math.round(700 * Math.min(report.gpg / 15, 2.5));
        const annualHigh = Math.round(2000 * Math.min(report.gpg / 15, 2.5));
        return (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Water Quality Report</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{report.city.name}, {report.state} — {zip}</div>
            </div>

            {/* Hardness gauge */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Water Hardness</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: report.color }}>{report.gpg} GPG</div>
              <div style={{ display: 'inline-block', padding: '4px 16px', background: `${report.color}15`, color: report.color, borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{report.level}</div>
              <div style={{ margin: '12px auto 0', maxWidth: 280 }}>
                <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, position: 'relative' }}>
                  <div style={{ background: 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)', borderRadius: 8, height: 10, width: '100%' }} />
                  <div style={{ position: 'absolute', top: -5, left: `${Math.min((report.gpg / 30) * 100, 95)}%`, width: 20, height: 20, background: '#fff', border: `3px solid ${report.color}`, borderRadius: '50%', transform: 'translateX(-50%)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}><span>Soft</span><span>Hard</span><span>Very Hard</span></div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[['TDS', `${report.city.tds_ppm.avg} ppm`], ['pH', `${report.city.ph.avg}`], ['Treatment', report.city.disinfection]].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Annual cost — only if meaningful */}
            {annualLow > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>💸 What Hard Water Is Costing You</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>${annualLow.toLocaleString()} – ${annualHigh.toLocaleString()}/year</div>
                <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>In appliance damage, wasted soap, and reduced water heater life.</div>
              </div>
            )}

            {/* Issues */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>⚠️ Water Quality Issues Detected</div>
              {issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '12px', background: '#f8fafc', borderRadius: 8, borderLeft: `4px solid ${SEV_COLOR[issue.severity]}` }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{issue.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{issue.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{issue.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>✅ What We Recommend</div>
              {recs.map((rec, i) => (
                <div key={i} style={{ border: `1px solid ${PRI_BORDER[rec.priority]}`, borderLeft: `4px solid ${PRI_BORDER[rec.priority]}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{rec.product}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#eff6ff', color: config.clientColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{rec.tag}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: config.clientColor }}>{rec.priceRange}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>{rec.reason}</div>
                </div>
              ))}
            </div>

            {/* Lead capture */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Want a solution for your {report.city.name} water?</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>A licensed plumber from {config.clientName} will review your report and give you an exact quote — no pressure.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" style={{ padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="wq-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: config.clientColor }} />
                  <label htmlFor="wq-consent" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>I agree to receive SMS updates from {config.clientName}. Reply STOP to opt out.</label>
                </div>
                <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !consent || submitting}
                  style={{ padding: '14px', background: name.trim() && phone.trim() && consent && !submitting ? config.clientColor : '#e2e8f0', color: name.trim() && phone.trim() && consent && !submitting ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: name.trim() && phone.trim() && consent && !submitting ? 'pointer' : 'not-allowed' }}>
                  {submitting ? 'Sending...' : 'Get My Free Water Consultation 🔒'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>✓ Licensed & Insured &nbsp; ✓ No obligation &nbsp; ✓ Response within 60 seconds</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Quote Tab ────────────────────────────────────────────────────────────────

const QuoteTab: React.FC<{ config: DemoConfig }> = ({ config }) => {
  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [details, setDetails] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleGetQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: service, details, location: config.serviceArea, language: 'en' }),
      });
      const data: QuoteResult = await res.json();
      setResult(data);
      setStep(3);
    } catch {
      setResult({ estimateRange: '$150 – $5,500', personalizedMessage: `Our team will give you an exact quote after reviewing your situation. Call ${config.clientPhone} for a fast response.`, suggestedNextSteps: ['Call or text us for a same-day assessment', 'We\'ll confirm pricing before any work begins'] });
      setStep(3);
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email, urgency,
          service: serviceKey, serviceLabel: service, details,
          zipCode: config.defaultZip,
          estimateRange: result?.estimateRange || '',
          leadScore: result?.leadScore || '',
          crossSellOpportunities: result?.crossSellOpportunities || [],
          clientId: config.clientId, clientName: config.clientName,
          source: 'quote-tool', lang: 'en',
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (e) { console.error(e); }
    setLoading(false);
    setSubmitted(true);
    setStep(4);
  };

  if (submitted && step === 4) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Request Received!</h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>Thanks {name.split(' ')[0]}! Someone from <strong>{config.clientName}</strong> will reach out within 60 seconds.</p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 4 }}>Your Estimate</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>{result?.estimateRange}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Final quote confirmed before any work begins</div>
        </div>
        <a href={`tel:${config.clientPhone.replace(/\D/g,'')}`} style={{ display: 'block', padding: '14px', background: config.clientColor, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>📞 Call {config.clientPhone}</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Select Service', 'Describe Job', 'Your Estimate', 'Confirm'].map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 3, background: step > i + 1 ? '#10b981' : step === i + 1 ? config.clientColor : '#e2e8f0', borderRadius: 2, marginBottom: 6, transition: 'background 0.3s' }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: step >= i + 1 ? config.clientColor : '#94a3b8' }}>{label}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>What can we help you with?</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Select the service you need for an instant estimate.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {config.services.map(svc => (
              <button key={svc.key} onClick={() => { setService(svc.label); setServiceKey(svc.key); setStep(2); }}
                style={{ padding: '16px', background: '#fff', border: `2px solid ${service === svc.label ? config.clientColor : '#e2e8f0'}`, borderRadius: 10, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{svc.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{svc.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{svc.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}>← Back</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tell us about the job</h2>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <div style={{ display: 'inline-block', background: '#eff6ff', color: config.clientColor, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>Selected: {service}</div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Describe the issue</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder={`e.g. 40-gallon gas water heater, 12 years old, leaking from bottom. Located in ${config.serviceArea}.`} rows={4}
              style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 }}>Urgency</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['emergency','🚨 Emergency','#fee2e2','#dc2626'],['soon','⏰ Within a Week','#fef3c7','#d97706'],['routine','📅 No Rush','#f0fdf4','#16a34a']].map(([val,label,bg,color]) => (
                <button key={val} onClick={() => setUrgency(val)} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `2px solid ${urgency === val ? color : '#e2e8f0'}`, background: urgency === val ? bg : '#fff', color: urgency === val ? color : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGetQuote} disabled={!details.trim() || loading}
            style={{ width: '100%', padding: '16px', background: details.trim() && !loading ? config.clientColor : '#e2e8f0', color: details.trim() && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: details.trim() && !loading ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Generating estimate...' : 'Get My Instant Estimate →'}
          </button>
        </div>
      )}

      {step === 3 && result && (
        <div>
          <div style={{ background: config.clientColor, borderRadius: 12, padding: 24, color: '#fff', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Your Estimate</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: config.clientAccent, lineHeight: 1, marginBottom: 12 }}>{result.estimateRange}</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{result.personalizedMessage}</p>
          </div>
          {result.suggestedNextSteps?.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Next Steps</div>
              {result.suggestedNextSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#334155' }}>
                  <span style={{ color: config.clientColor, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}
                </div>
              ))}
            </div>
          )}
          {result.crossSellOpportunities && result.crossSellOpportunities.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {result.crossSellOpportunities.map((o, i) => (
                <span key={i} style={{ fontSize: 11, background: '#eff6ff', color: config.clientColor, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{o}</span>
              ))}
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Confirm Your Request</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{config.clientName} will reach out in under 60 seconds.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                <input type="checkbox" id="q-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: config.clientColor }} />
                <label htmlFor="q-consent" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>I agree to receive SMS updates from {config.clientName}. Reply STOP to opt out.</label>
              </div>
              <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !consent || loading}
                style={{ padding: '16px', background: name.trim() && phone.trim() && consent && !loading ? config.clientColor : '#e2e8f0', color: name.trim() && phone.trim() && consent && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: name.trim() && phone.trim() && consent && !loading ? 'pointer' : 'not-allowed' }}>
                {loading ? 'Sending...' : `Send My Request to ${config.clientName.split(' ')[0]} →`}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>✓ Licensed & Insured &nbsp; ✓ Upfront pricing &nbsp; ✓ 100% satisfaction guarantee</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Shell ───────────────────────────────────────────────────────────────

const DemoShell: React.FC<{ config: DemoConfig }> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'quote' | 'water'>('quote');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: config.clientColor, color: '#fff', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{config.clientName}</div>
        <a href={`tel:${config.clientPhone.replace(/\D/g,'')}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20 }}>📞 {config.clientPhone}</a>
      </div>

      {/* Emergency banner */}
      {config.emergencyBanner && (
        <div style={{ background: '#dc2626', color: '#fff', padding: '8px 24px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
          {config.emergencyBanner} — <a href={`tel:${config.clientPhone.replace(/\D/g,'')}`} style={{ color: '#fff' }}>{config.clientPhone}</a>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${config.clientColor} 0%, #0a1628 100%)`, color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: `rgba(245,166,35,0.2)`, border: '1px solid rgba(245,166,35,0.4)', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, color: config.clientAccent }}>
          {config.serviceArea}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, lineHeight: 1.1 }}>Instant Quotes &amp; Water Intelligence</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>Get an instant plumbing estimate or check what's really in your water — both tools, one place.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {config.trustBadges.map(b => (
            <div key={b} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: config.clientAccent }}>✓</span> {b}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e2e8f0', display: 'flex', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        {[
          { key: 'quote', label: '⚡ Instant Quote', sub: 'Get a price estimate' },
          { key: 'water', label: '💧 Water Report', sub: 'Know your water quality' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'quote' | 'water')}
            style={{ flex: 1, padding: '16px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center', borderBottom: activeTab === tab.key ? `3px solid ${config.clientColor}` : '3px solid transparent', transition: 'all 0.2s' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: activeTab === tab.key ? config.clientColor : '#64748b' }}>{tab.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'quote' ? <QuoteTab config={config} /> : <WaterTab config={config} />}

      {/* Footer */}
      <div style={{ background: config.clientColor, color: '#fff', padding: '28px 24px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{config.clientName}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{config.address}</div>
        <a href={`tel:${config.clientPhone.replace(/\D/g,'')}`} style={{ color: config.clientAccent, textDecoration: 'none', fontWeight: 700 }}>{config.clientPhone}</a>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>Powered by PlumbLead.ai</div>
      </div>
    </div>
  );
};

export default DemoShell;
