// src/components/SubmitTrial.tsx
// PlumbLead.ai — Free trial signup for plumbing contractors

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';

interface TrialFormData {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  trucks: string;
  crm: string;
  crmOther: string;
  city: string;
  hearAbout: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const INITIAL: TrialFormData = {
  firstName: '', lastName: '', company: '',
  phone: '', email: '', trucks: '',
  crm: '', crmOther: '', city: '', hearAbout: '',
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '1.2px',
  color: '#9E9B91', marginBottom: 6,
};

const INPUT_BASE: React.CSSProperties = {
  width: '100%', padding: '13px 16px', fontSize: 15,
  fontFamily: 'DM Sans, sans-serif', color: '#0D0D0D',
  background: '#FFF', border: '2px solid #E8E6DF',
  outline: 'none', transition: 'border-color 0.15s',
  appearance: 'none' as React.CSSProperties['appearance'],
};

const SubmitTrial: React.FC = () => {
  const [form, setForm] = useState<TrialFormData>(INITIAL);
  const [smsConsent, setSmsConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const set = (field: keyof TrialFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isValid = Boolean(
    form.firstName.trim() && form.lastName.trim() && form.company.trim() &&
    form.phone.replace(/\D/g, '').length === 10 && isEmail(form.email) &&
    form.trucks && form.crm &&
    (form.crm !== 'other' || form.crmOther.trim()) &&
    form.city.trim() && smsConsent
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitState('submitting');
    setErrorMsg('');
    const payload = {
      ...form,
      crm: form.crm === 'other' ? form.crmOther : form.crm,
      smsConsent: true,
      submittedAt: new Date().toISOString(),
      source: 'submit-trial',
      type: 'trial_signup',
    };
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSubmitState('success');
    } catch (err) {
      console.error('Trial submit error:', err);
      setErrorMsg('Something went wrong. Please try again or call (833) 558-0877.');
      setSubmitState('error');
    }
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    ...INPUT_BASE, borderColor: focused === name ? '#F5A623' : '#E8E6DF',
  });

  // ─── Success Screen ────────────────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ maxWidth: 520, width: '100%', border: '3px solid #F5A623', background: '#111', padding: '56px 48px', textAlign: 'center', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
            <div style={{ width: 64, height: 64, background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>✓</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 64, color: '#F5A623', lineHeight: 1, marginBottom: 12 }}>YOU'RE IN.</div>
            <p style={{ fontSize: 16, color: '#9E9B91', lineHeight: 1.6, marginBottom: 32 }}>
              Your trial will be configured within <strong style={{ color: '#FFF' }}>2 business hours</strong>.<br />
              Check <strong style={{ color: '#FFF' }}>{form.email}</strong> for setup instructions.
            </p>
            <div style={{ background: '#1A1A1A', border: '1px solid #333', padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
              {[['Company', form.company], ['Trucks', form.trucks], ['Trial Length', '14 days free'], ['CRM', form.crm === 'other' ? form.crmOther : form.crm]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222', fontSize: 14 }}>
                  <span style={{ color: '#5C5A53', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: '#FFF', fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="/" style={{ flex: 1, padding: '14px', background: '#F5A623', color: '#000', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>Back to Home</a>
              <a href="/dashboard" style={{ flex: 1, padding: '14px', background: 'transparent', color: '#F5A623', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center', border: '2px solid #F5A623', fontFamily: 'DM Sans, sans-serif' }}>View Dashboard</a>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: '#5C5A53' }}>
              Questions? <a href="tel:+18335580877" style={{ color: '#F5A623', textDecoration: 'none' }}>(833) 558-0877</a>
            </p>
          </div>
        </div>
      </>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>

      {/* Top bar */}
      <div style={{ background: '#F5A623', padding: '10px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>
        <span>🔒 14-Day Free Trial · No Credit Card Required</span>
        <span style={{ fontSize: 12, color: '#7A5810' }}>Questions? Call (833) 558-0877</span>
      </div>

      {/* Nav */}
      <nav style={{ background: '#0D0D0D', borderBottom: '3px solid #F5A623', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: 64 }}>
        <a href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#F5A623', letterSpacing: 1, textDecoration: 'none' }}>Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai</a>
        <a href="/" style={{ fontSize: 13, color: '#5C5A53', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</a>
      </nav>

      {/* Widget demo callout — contractor sees the product before signing up */}
      <div style={{ background: '#0D0D0D', borderBottom: '1px solid #222', padding: '16px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#F5A623', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔧</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Want to see the widget your homeowners will use?</div>
            <div style={{ fontSize: 12, color: '#5C5A53' }}>Try a live demo of the AI quote tool — exactly what goes on your website.</div>
          </div>
        </div>
        <a
          href="/widget-demo"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: '10px 20px', background: '#F5A623', color: '#0D0D0D', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          ⚡ Try the Live Demo →
        </a>
      </div>

      {/* Page layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 140px)', background: '#F5F4F0' }}>

        {/* Left — value prop */}
        <div style={{ background: '#0D0D0D', padding: '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '4px solid #F5A623', opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderLeft: '3px solid #F5A623', padding: '6px 14px', fontSize: 11, color: '#F5A623', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 28, width: 'fit-content' }}>
            Free Trial — No Card Required
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 72, lineHeight: 0.95, color: '#FFF', textTransform: 'uppercase', marginBottom: 20 }}>
            Start Winning<br />
            <span style={{ color: '#F5A623' }}>Every Lead</span><br />
            You Deserve.
          </h1>
          <p style={{ fontSize: 16, color: '#9E9B91', lineHeight: 1.6, marginBottom: 40, maxWidth: 400 }}>
            Takes 2 minutes to set up. Your AI quote tool, speed-to-lead SMS, and lead dashboard will be live before your next shift.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'AI responds to homeowners in under 60 seconds',
              'Instant quote estimates for 12 service categories',
              'Leads routed to ServiceTitan, HCP, or your CRM',
              'English + Spanish — automatic',
              'Full lead dashboard with status tracking',
            ].map((perk, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#9E9B91', lineHeight: 1.5, opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-12px)', transition: `opacity 0.4s ease ${0.15 + i * 0.07}s, transform 0.4s ease ${0.15 + i * 0.07}s` }}>
                <span style={{ color: '#F5A623', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
                {perk}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #222' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, color: '#F5A623', lineHeight: 1 }}>One job pays for 6 months.</div>
            <p style={{ fontSize: 13, color: '#5C5A53', marginTop: 6 }}>Average water heater install: $1,400. Monthly Pro plan: $197.</p>
          </div>
        </div>

        {/* Right — form */}
        <div style={{ padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(20px)', transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 42, lineHeight: 1, color: '#0D0D0D', marginBottom: 8 }}>Start Your Free Trial</div>
            <p style={{ fontSize: 14, color: '#9E9B91' }}>14 days free. We'll configure everything before you go live.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LABEL} htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)} placeholder="Ryan" style={inputStyle('firstName')} required autoComplete="given-name" />
              </div>
              <div>
                <label style={LABEL} htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)} placeholder="Smith" style={inputStyle('lastName')} required autoComplete="family-name" />
              </div>
            </div>

            {/* Company */}
            <div>
              <label style={LABEL} htmlFor="company">Company Name</label>
              <input id="company" type="text" value={form.company} onChange={e => set('company', e.target.value)} onFocus={() => setFocused('company')} onBlur={() => setFocused(null)} placeholder="Smith Plumbing LLC" style={inputStyle('company')} required autoComplete="organization" />
            </div>

            {/* Phone + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LABEL} htmlFor="phone">Mobile Phone</label>
                <input id="phone" type="tel" value={form.phone} onChange={e => set('phone', formatPhone(e.target.value))} onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} placeholder="(602) 555-0100" style={inputStyle('phone')} required autoComplete="tel" />
              </div>
              <div>
                <label style={LABEL} htmlFor="email">Work Email</label>
                <input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} placeholder="ryan@smithplumbing.com" style={inputStyle('email')} required autoComplete="email" />
              </div>
            </div>

            {/* Trucks + City */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LABEL} htmlFor="trucks">Number of Trucks</label>
                <div style={{ position: 'relative' }}>
                  <select id="trucks" value={form.trucks} onChange={e => set('trucks', e.target.value)} onFocus={() => setFocused('trucks')} onBlur={() => setFocused(null)} required style={{ ...inputStyle('trucks'), paddingRight: 36, backgroundImage: 'none' }}>
                    <option value="">Select...</option>
                    <option>1</option><option>2–3</option><option>4–6</option>
                    <option>7–10</option><option>11–20</option><option>20+</option>
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9E9B91', fontSize: 12 }}>▼</span>
                </div>
              </div>
              <div>
                <label style={LABEL} htmlFor="city">Primary Service City</label>
                <input id="city" type="text" value={form.city} onChange={e => set('city', e.target.value)} onFocus={() => setFocused('city')} onBlur={() => setFocused(null)} placeholder="Phoenix, AZ" style={inputStyle('city')} required />
              </div>
            </div>

            {/* CRM */}
            <div>
              <label style={LABEL} htmlFor="crm">CRM / Scheduling Software</label>
              <div style={{ position: 'relative' }}>
                <select id="crm" value={form.crm} onChange={e => set('crm', e.target.value)} onFocus={() => setFocused('crm')} onBlur={() => setFocused(null)} required style={{ ...inputStyle('crm'), paddingRight: 36 }}>
                  <option value="">Select your CRM...</option>
                  <option value="ServiceTitan">ServiceTitan</option>
                  <option value="Housecall Pro">Housecall Pro</option>
                  <option value="Jobber">Jobber</option>
                  <option value="FieldEdge">FieldEdge</option>
                  <option value="none">None / Spreadsheet</option>
                  <option value="other">Other</option>
                </select>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9E9B91', fontSize: 12 }}>▼</span>
              </div>
              {form.crm === 'other' && (
                <input type="text" value={form.crmOther} onChange={e => set('crmOther', e.target.value)} onFocus={() => setFocused('crmOther')} onBlur={() => setFocused(null)} placeholder="What do you use?" style={{ ...inputStyle('crmOther'), marginTop: 8 }} />
              )}
            </div>

            {/* How did you hear */}
            <div>
              <label style={LABEL} htmlFor="hearAbout">How'd You Hear About Us? <span style={{ color: '#5C5A53', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <select id="hearAbout" value={form.hearAbout} onChange={e => set('hearAbout', e.target.value)} onFocus={() => setFocused('hearAbout')} onBlur={() => setFocused(null)} style={{ ...inputStyle('hearAbout'), paddingRight: 36 }}>
                  <option value="">Select...</option>
                  <option>Google Search</option>
                  <option>Facebook / Instagram</option>
                  <option>Referred by another contractor</option>
                  <option>Trade show / event</option>
                  <option>Cold outreach / email</option>
                  <option>Other</option>
                </select>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9E9B91', fontSize: 12 }}>▼</span>
              </div>
            </div>

            {/* SMS consent */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: '#FFF', border: '2px solid #E8E6DF' }}>
              <input type="checkbox" id="sms-consent" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} style={{ marginTop: 3, accentColor: '#F5A623', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }} />
              <label htmlFor="sms-consent" style={{ fontSize: 12, color: '#5C5A53', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to receive SMS updates about my PlumbLead.ai trial setup and account notifications. Message &amp; data rates may apply. Reply STOP to opt out at any time.
              </label>
            </div>

            {submitState === 'error' && (
              <div style={{ background: '#1A0000', border: '1px solid #D83030', padding: '12px 16px', fontSize: 14, color: '#E57373' }}>{errorMsg}</div>
            )}

            <button type="submit" disabled={!isValid || submitState === 'submitting'} style={{ width: '100%', padding: '18px', background: isValid && submitState !== 'submitting' ? '#F5A623' : '#E8E6DF', color: isValid && submitState !== 'submitting' ? '#0D0D0D' : '#9E9B91', border: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, cursor: isValid && submitState !== 'submitting' ? 'pointer' : 'not-allowed', transition: 'background 0.2s, color 0.2s', letterSpacing: 0.3 }}>
              {submitState === 'submitting' ? 'Submitting...' : 'Start My Free Trial →'}
            </button>

            <p style={{ fontSize: 12, color: '#9E9B91', textAlign: 'center', lineHeight: 1.5 }}>
              By submitting, you agree to our <a href="/terms" style={{ color: '#C4841A', textDecoration: 'none' }}>Terms</a> and <a href="/privacy" style={{ color: '#C4841A', textDecoration: 'none' }}>Privacy Policy</a>.
              No spam. No contracts. Cancel anytime.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0D0D0D', padding: '28px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '3px solid #F5A623' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#F5A623' }}>Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai</div>
        <p style={{ fontSize: 12, color: '#5C5A53' }}>© 2026 PlumbLead.ai · Questions? (833) 558-0877</p>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/privacy" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </>
  );
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #F5F4F0; color: #0D0D0D; -webkit-font-smoothing: antialiased; }
  select:focus, input:focus { border-color: #F5A623 !important; outline: none; }
  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
`;

export default SubmitTrial;
