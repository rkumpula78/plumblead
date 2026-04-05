// src/components/QuoteModal.tsx
// Popup modal that wraps the QuoteTool for embedding on contractor sites
// Opens when a button with data-plumblead-quote is clicked
// Also used by the chatbot handoff CTA

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  clientColor?: string;
  lang?: 'en' | 'es';
}

interface QuoteResult {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
  leadScore?: string;
  crossSellOpportunities?: string[];
}

const SERVICES = [
  { key: 'water-heater-tank',     label: 'Water Heater (Tank)',     icon: '🔥', hint: '$1,200 – $2,800' },
  { key: 'water-heater-tankless', label: 'Tankless Water Heater',   icon: '⚡', hint: '$2,500 – $5,500' },
  { key: 'water-heater-repair',   label: 'Water Heater Repair',     icon: '🔧', hint: '$150 – $600' },
  { key: 'emergency-leak',        label: '🚨 Emergency / Leak',     icon: '🚨', hint: 'Call us now' },
  { key: 'drain-cleaning',        label: 'Drain Cleaning',          icon: '🚿', hint: '$150 – $400' },
  { key: 'toilet-repair',         label: 'Toilet Repair / Install', icon: '🚽', hint: '$150 – $500' },
  { key: 'leak-detection',        label: 'Leak Detection',          icon: '💧', hint: '$200 – $500' },
  { key: 'sewer-line',            label: 'Sewer Line',              icon: '🔩', hint: '$2,000 – $8,000' },
  { key: 'repiping',              label: 'Repiping',                icon: '🏠', hint: '$4,000 – $12,000' },
  { key: 'faucet-fixture',        label: 'Faucets & Fixtures',      icon: '🚰', hint: '$150 – $400' },
  { key: 'sump-pump',             label: 'Sump Pump',               icon: '⛽', hint: '$500 – $1,500' },
  { key: 'other',                 label: 'Other Plumbing',          icon: '🛠️', hint: 'Varies' },
];

const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen, onClose,
  clientId = 'demo',
  clientName = 'Your Local Plumber',
  clientColor = '#0ea5e9',
  lang = 'en',
}) => {
  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1); setService(''); setServiceKey(''); setDetails(''); setLocation('');
        setName(''); setPhone(''); setEmail(''); setUrgency('routine');
        setConsent(false); setResult(null); setSubmitted(false);
      }, 300);
    }
  }, [isOpen]);

  const handleGetQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: service, details, location: location || 'Local area', language: lang }),
      });
      const data: QuoteResult = await res.json();
      setResult(data);
      setStep(3);
    } catch {
      setResult({ estimateRange: '$150 – $5,500', personalizedMessage: `Our team will provide an exact quote. Get in touch with ${clientName} directly for a fast response.`, suggestedNextSteps: ['Contact us for a same-day assessment', 'We confirm pricing before any work begins'] });
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
          location, estimateRange: result?.estimateRange || '',
          leadScore: result?.leadScore || '',
          crossSellOpportunities: result?.crossSellOpportunities || [],
          clientId, clientName,
          source: 'quote-modal', lang,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (e) { console.error(e); }
    setLoading(false);
    setSubmitted(true);
    setStep(4);
  };

  if (!isOpen) return null;

  const inp: React.CSSProperties = { padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };

  return (
    <>
      <style>{`@keyframes qm-fadein{from{opacity:0}to{opacity:1}}@keyframes qm-slidein{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}.qm-overlay{animation:qm-fadein 0.2s ease}.qm-panel{animation:qm-slidein 0.25s ease}`}</style>

      {/* Overlay */}
      <div className="qm-overlay" onClick={onClose}
        style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10000,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 0 0' }}
      >
        {/* Panel */}
        <div className="qm-panel" onClick={e=>e.stopPropagation()}
          style={{ background:'#fff',width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',borderRadius:'20px 20px 0 0',display:'flex',flexDirection:'column',fontFamily:'system-ui,-apple-system,sans-serif' }}
        >
          {/* Modal header */}
          <div style={{ background: clientColor, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '18px 18px 0 0', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{clientName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Instant Quote — Free, No Commitment</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Progress */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', flexShrink: 0 }}>
              {['Service','Details','Estimate','Done'].map((label, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 3, background: step > i+1 ? '#10b981' : step === i+1 ? clientColor : '#e2e8f0', borderRadius: 2, marginBottom: 4, transition: 'background 0.3s' }} />
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: step >= i+1 ? clientColor : '#94a3b8' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '20px', flex: 1 }}>

            {/* Step 1 — Service */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>What can we help you with?</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {SERVICES.map(svc => (
                    <button key={svc.key} onClick={() => { setService(svc.label); setServiceKey(svc.key); setStep(2); }}
                      style={{ padding: '14px 12px', background: '#fff', border: `2px solid ${service === svc.label ? clientColor : '#e2e8f0'}`, borderRadius: 10, textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{svc.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{svc.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{svc.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'left' }}>← Back</button>
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: clientColor }}>Selected: {service}</div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Describe the issue</label>
                  <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="e.g. Water heater leaking, 12 years old. Located in Monroe, WA."
                    style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Your city / zip</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Monroe, WA" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Urgency</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['emergency','🚨 Emergency','#fee2e2','#dc2626'],['soon','⏰ This Week','#fef3c7','#d97706'],['routine','📅 No Rush','#f0fdf4','#16a34a']].map(([val,label,bg,color]) => (
                      <button key={val} onClick={() => setUrgency(val)}
                        style={{ flex: 1, padding: '9px 6px', borderRadius: 8, border: `2px solid ${urgency === val ? color : '#e2e8f0'}`, background: urgency === val ? bg : '#fff', color: urgency === val ? color : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGetQuote} disabled={!details.trim() || loading}
                  style={{ padding: '14px', background: details.trim() && !loading ? clientColor : '#e2e8f0', color: details.trim() && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: details.trim() && !loading ? 'pointer' : 'not-allowed' }}>
                  {loading ? 'Generating estimate...' : 'Get My Instant Estimate →'}
                </button>
              </div>
            )}

            {/* Step 3 — Estimate + contact */}
            {step === 3 && result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: clientColor, borderRadius: 12, padding: 20, color: '#fff' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Your Estimate</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#F5A623', lineHeight: 1, marginBottom: 10 }}>{result.estimateRange}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{result.personalizedMessage}</p>
                </div>
                {result.suggestedNextSteps?.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                    {result.suggestedNextSteps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#334155' }}>
                        <span style={{ color: clientColor, fontWeight: 700, flexShrink: 0 }}>{i+1}.</span>{s}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel" style={inp} />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" style={inp} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <input type="checkbox" id="qm-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, accentColor: clientColor }} />
                    <label htmlFor="qm-consent" style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>I agree to receive SMS updates from {clientName}. Reply STOP to opt out.</label>
                  </div>
                  <button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || !consent || loading}
                    style={{ padding: '14px', background: name.trim() && phone.trim() && consent && !loading ? clientColor : '#e2e8f0', color: name.trim() && phone.trim() && consent && !loading ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: name.trim() && phone.trim() && consent && !loading ? 'pointer' : 'not-allowed' }}>
                    {loading ? 'Sending...' : 'Send My Request →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Success */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>✓</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Request Received!</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>Thanks {name.split(' ')[0]}! {clientName} will reach out within 60 seconds.</p>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4 }}>Your Estimate</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#166534' }}>{result?.estimateRange}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Final price confirmed before work begins</div>
                </div>
                <button onClick={onClose} style={{ width: '100%', padding: '13px', background: clientColor, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuoteModal;
