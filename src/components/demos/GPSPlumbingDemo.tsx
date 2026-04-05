// src/components/demos/GPSPlumbingDemo.tsx
// Personalized PlumbLead.ai demo for GPS Plumbing Inc.
// Location: Monroe, WA | (425) 458-8548 | Snohomish & King counties

import React, { useState, useEffect } from 'react';
import DemoWaterReport from './DemoWaterReport';

const API_BASE = 'https://plumblead-production.up.railway.app';
const CLIENT_ID = 'gps-plumbing';
const CLIENT_NAME = 'GPS Plumbing Inc.';
const CLIENT_PHONE = '(425) 458-8548';
const CLIENT_COLOR = '#1A5C2A';
const CLIENT_ACCENT = '#F5A623';

const SERVICES = [
  { key: 'water-heater-tank',     label: 'Water Heater Replacement', icon: '🔥', hint: '$1,200 – $2,800' },
  { key: 'water-heater-tankless', label: 'Tankless Water Heater',    icon: '⚡', hint: '$2,500 – $5,500' },
  { key: 'water-heater-repair',   label: 'Water Heater Repair',      icon: '🔧', hint: '$150 – $600' },
  { key: 'emergency-leak',        label: '🚨 Emergency / Leak',      icon: '🚨', hint: 'Call immediately' },
  { key: 'drain-cleaning',        label: 'Drain Cleaning',           icon: '🚿', hint: '$150 – $400' },
  { key: 'toilet-repair',         label: 'Toilet Repair / Install',  icon: '🚽', hint: '$150 – $500' },
  { key: 'faucet-fixture',        label: 'Faucets & Fixtures',       icon: '🚰', hint: '$150 – $400' },
  { key: 'low-water-pressure',    label: 'Low Water Pressure',       icon: '💧', hint: '$200 – $800' },
  { key: 'sewer-line',            label: 'Sewer Line',               icon: '🔩', hint: '$2,000 – $8,000' },
  { key: 'property-manager',      label: 'Property Management',      icon: '🏢', hint: 'Custom pricing' },
  { key: 'repiping',              label: 'Repiping',                 icon: '🏠', hint: '$4,000 – $12,000' },
  { key: 'other',                 label: 'Other Plumbing',           icon: '🛠️', hint: 'Varies' },
];

interface QuoteResult {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
  leadScore?: string;
  crossSellOpportunities?: string[];
}

const GPSPlumbingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quote' | 'water'>('quote');
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleGetQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/quote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: service, details, location: 'Monroe, WA', language: 'en' }),
      });
      const data: QuoteResult = await res.json();
      setResult(data); setStep(3);
    } catch {
      setResult({ estimateRange: '$150 – $8,000', personalizedMessage: 'Our team will give you an exact quote after reviewing your situation. Available 24/7 — call ' + CLIENT_PHONE + ' for emergencies.', suggestedNextSteps: ['Call us anytime — we offer 24/7 emergency service', 'We\'ll confirm all pricing before work begins'] });
      setStep(3);
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, urgency, service: serviceKey, serviceLabel: service, details, zipCode: '98272', estimateRange: result?.estimateRange || '', leadScore: result?.leadScore || '', crossSellOpportunities: result?.crossSellOpportunities || [], clientId: CLIENT_ID, clientName: CLIENT_NAME, source: 'quote-tool', lang: 'en', submittedAt: new Date().toISOString() }),
      });
    } catch (e) { console.error(e); }
    setLoading(false); setSubmitted(true); setStep(4);
  };

  const s = { fontFamily: 'system-ui, -apple-system, sans-serif' };

  if (submitted && step === 4) {
    return (
      <div style={{ ...s, minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Request Received!</h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>Thanks {name.split(' ')[0]}! Someone from <strong>GPS Plumbing</strong> will reach out within 60 seconds.</p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 4 }}>Your Estimate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>{result?.estimateRange}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Exact quote confirmed before any work begins · 100% satisfaction guarantee</div>
          </div>
          {urgency === 'emergency' && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#dc2626', fontWeight: 600 }}>🚨 Emergency? Call now: <a href={`tel:${CLIENT_PHONE.replace(/\D/g,'')}`} style={{ color: '#dc2626' }}>{CLIENT_PHONE}</a> — GPS Plumbing is available 24/7</div>}
          <a href={`tel:${CLIENT_PHONE.replace(/\D/g,'')}`} style={{ display: 'block', padding: '14px', background: CLIENT_COLOR, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>📞 Call {CLIENT_PHONE}</a>
          <button onClick={() => { setStep(1); setSubmitted(false); setResult(null); setService(''); setDetails(''); setName(''); setPhone(''); setEmail(''); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px', width: '100%', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>Start New Request</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{ background: CLIENT_COLOR, color: '#fff', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>GPS Plumbing Inc.</div>
        <a href={`tel:${CLIENT_PHONE.replace(/\D/g,'')}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20 }}>📞 {CLIENT_PHONE}</a>
      </div>

      {/* Emergency Banner */}
      <div style={{ background: '#dc2626', color: '#fff', padding: '10px 24px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
        🚨 24/7 Emergency Service Available — <a href={`tel:${CLIENT_PHONE.replace(/\D/g,'')}`} style={{ color: '#fff' }}>{CLIENT_PHONE}</a>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${CLIENT_COLOR} 0%, #0a2e12 100%)`, color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(245,166,35,0.2)', border: '1px solid rgba(245,166,35,0.4)', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 12, color: CLIENT_ACCENT }}>Monroe, WA · Snohomish & King Counties</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, lineHeight: 1.1 }}>Instant Quote & Free Water Report</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', maxWidth: 460, margin: '0 auto', lineHeight: 1.5 }}>Family-owned, licensed journeymen plumbers. 100% satisfaction guarantee.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' as const }}>
          {['100% Satisfaction Guarantee', '24/7 Emergency Service', 'Family Owned & Operated'].map(b => (
            <div key={b} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: CLIENT_ACCENT }}>✓</span> {b}</div>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        {([['quote', '🔧 Get a Quote'], ['water', '💧 Check Your Water']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '16px', border: 'none', borderBottom: `3px solid ${activeTab === tab ? CLIENT_COLOR : 'transparent'}`,
            background: 'transparent', fontSize: 14, fontWeight: 700, color: activeTab === tab ? CLIENT_COLOR : '#64748b',
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
          }}>{label}</button>
        ))}
      </div>

      {/* Quote Tab */}
      {activeTab === 'quote' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
          {step < 4 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              {['Select Service', 'Describe Job', 'Your Estimate', 'Confirm'].map((label, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 3, background: step > i + 1 ? '#10b981' : step === i + 1 ? CLIENT_COLOR : '#e2e8f0', borderRadius: 2, marginBottom: 6, transition: 'background 0.3s' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: step >= i + 1 ? CLIENT_COLOR : '#94a3b8' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>What can GPS Plumbing help with?</h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Select your service and get an instant estimate.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {SERVICES.map(svc => (
                  <button key={svc.key} onClick={() => { setService(svc.label); setServiceKey(svc.key); setStep(2); }}
                    style={{ padding: '16px', background: svc.key === 'emergency-leak' ? '#fff5f5' : '#fff', border: `2px solid ${service === svc.label ? CLIENT_COLOR : svc.key === 'emergency-leak' ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{svc.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: svc.key === 'emergency-leak' ? '#dc2626' : '#0f172a', marginBottom: 2 }}>{svc.label}</div>
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
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>More detail = more accurate estimate. GPS Plumbing reviews every request personally.</p>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                <div style={{ display: 'inline-block', background: '#f0fdf4', color: CLIENT_COLOR, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>Selected: {service}</div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Describe the issue</label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. Water heater not producing hot water, unit is 8 years old. House in Monroe, WA." rows={4} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 16, marginBottom: 8 }}>Urgency</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['emergency', '🚨 Emergency', '#fee2e2', '#dc2626'], ['soon', '⏰ Within a Week', '#fef3c7', '#d97706'], ['routine', '📅 No Rush', '#f0fdf4', '#16a34a']].map(([val, label, bg, color]) => (
                    <button key={val} onClick={() => setUrgency(val)} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `2px solid ${urgency === val ? color : '#e2e8f0'}`, background: urgency === val ? bg : '#fff', color: urgency === val ? color : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleGetQuote} disabled={!details.trim() || loading} style={{ width: '100%', padding: '16px', background: details.trim() && !loading ? CLIENT_COLOR : '#e2e8f0', color: details.trim() && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: details.trim() && !loading ? 'pointer' : 'not-allowed' }}>
                {loading ? 'Generating estimate...' : 'Get My Instant Estimate →'}
              </button>
            </div>
          )}

          {step === 3 && result && (
            <div>
              <div style={{ background: CLIENT_COLOR, borderRadius: 12, padding: 24, color: '#fff', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Your Estimate</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: CLIENT_ACCENT, lineHeight: 1, marginBottom: 12 }}>{result.estimateRange}</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{result.personalizedMessage}</p>
              </div>
              {result.suggestedNextSteps?.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 }}>Next Steps</div>
                  {result.suggestedNextSteps.map((s, i) => (<div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#334155' }}><span style={{ color: CLIENT_COLOR, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}</div>))}
                </div>
              )}
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Confirm Your Request</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>GPS Plumbing will reach out in under 60 seconds. 24/7 emergency service available.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" style={{ padding: '12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                    <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: CLIENT_COLOR }} />
                    <label htmlFor="consent" style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>I agree to receive SMS updates from GPS Plumbing Inc. Reply STOP to opt out.</label>
                  </div>
                  <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !consent || loading} style={{ padding: '16px', background: name.trim() && phone.trim() && consent && !loading ? CLIENT_COLOR : '#e2e8f0', color: name.trim() && phone.trim() && consent && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: name.trim() && phone.trim() && consent && !loading ? 'pointer' : 'not-allowed' }}>
                    {loading ? 'Sending...' : 'Send My Request to GPS Plumbing →'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>✓ Licensed & Insured &nbsp; ✓ 100% Satisfaction Guarantee &nbsp; ✓ No surprise charges</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Water Tab */}
      {activeTab === 'water' && (
        <DemoWaterReport clientId={CLIENT_ID} clientName={CLIENT_NAME} clientPhone={CLIENT_PHONE} clientColor={CLIENT_COLOR} />
      )}

      {/* Footer */}
      <div style={{ background: CLIENT_COLOR, color: '#fff', padding: '28px 24px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>GPS Plumbing Inc.</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>26016 132nd St SE, Monroe, WA 98272 · Snohomish & King Counties</div>
        <a href={`tel:${CLIENT_PHONE.replace(/\D/g,'')}`} style={{ color: CLIENT_ACCENT, textDecoration: 'none', fontWeight: 700 }}>{CLIENT_PHONE}</a>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 14 }}>Powered by PlumbLead.ai</div>
      </div>
    </div>
  );
};

export default GPSPlumbingDemo;
