// src/components/SubmitTrial.tsx
// PlumbLead.ai — Free trial signup for plumbing contractors
// Design: Bebas Neue + DM Sans, black/yellow/white — matches LandingPage aesthetic

import React, { useState, useEffect } from 'react';

// ─── API Base ─────────────────────────────────────────────────────────────────
const API_BASE = 'https://plumblead-production.up.railway.app';

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPhone = (val: string) => {
  const d = val.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── Styles ───────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #F5F4F0; color: #0D0D0D; }

  .trial-input {
    width: 100%;
    padding: 14px 16px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    border: 2px solid #E8E6DF;
    background: #FFF;
    color: #0D0D0D;
    outline: none;
    transition: border-color 0.15s;
    appearance: none;
    -webkit-appearance: none;
  }
  .trial-input:focus { border-color: #F5A623; }
  .trial-input::placeholder { color: #9E9B91; }

  .trial-select {
    width: 100%;
    padding: 14px 40px 14px 16px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    border: 2px solid #E8E6DF;
    background: #FFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239E9B91' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 16px center;
    color: #0D0D0D;
    outline: none;
    transition: border-color 0.15s;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
  .trial-select:focus { border-color: #F5A623; }
  .trial-select.placeholder-active { color: #9E9B91; }

  .field-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 600px) {
    .field-grid-2 { grid-template-columns: 1fr; }
    .trial-hero-grid { grid-template-columns: 1fr !important; }
    .trial-form-card { padding: 32px 24px !important; }
    .trial-nav { padding: 0 24px !important; }
    .trial-footer { padding: 24px !important; flex-direction: column !important; gap: 12px !important; text-align: center !important; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.5s ease forwards; opacity: 0; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.9px',
      color: '#5C5A53',
      marginBottom: 8,
    }}
  >
    {children}
  </label>
);

const FieldGroup: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', ...style }}>{children}</div>
);

// ─── Success Screen ───────────────────────────────────────────────────────────

const SuccessScreen: React.FC<{ form: TrialFormData }> = ({ form }) => (
  <>
    <style>{GLOBAL_CSS}</style>
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav className="trial-nav" style={{ background: '#0D0D0D', borderBottom: '3px solid #F5A623', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: 64 }}>
        <a href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#F5A623', letterSpacing: 1, textDecoration: 'none' }}>
          Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai
        </a>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div
          className="fade-up"
          style={{
            background: '#1A1A1A',
            border: '2px solid #333',
            borderTop: '4px solid #F5A623',
            padding: '56px 52px',
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Check icon */}
          <div style={{
            width: 72, height: 72,
            background: '#F5A623',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 32,
          }}>
            ✓
          </div>

          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#F5A623', fontWeight: 700, marginBottom: 12 }}>
            Trial Activated
          </div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, color: '#FFF', lineHeight: 1, marginBottom: 16 }}>
            You're In.
</h2>
          <p style={{ fontSize: 16, color: '#9E9B91', lineHeight: 1.6, marginBottom: 32 }}>
            We'll have <strong style={{ color: '#FFF' }}>{form.company}</strong> configured within{' '}
            <strong style={{ color: '#F5A623' }}>2 business hours</strong>.<br />
            Check <strong style={{ color: '#FFF' }}>{form.email}</strong> for your setup guide.
          </p>

          {/* Detail pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 36 }}>
            {[
              { label: 'Trucks', val: form.trucks },
              { label: 'CRM', val: form.crm === 'other' ? form.crmOther || 'Other' : form.crm || '—' },
              { label: 'Trial', val: '14 Days' },
            ].map((d, i) => (
              <div key={i} style={{ background: '#222', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#5C5A53', fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{d.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href="/"
              style={{
                flex: 1, padding: '14px', background: 'transparent',
                border: '2px solid #333', color: '#9E9B91',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                textAlign: 'center', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              ← Back to Home
            </a>
            <a
              href="/dashboard"
              style={{
                flex: 1, padding: '14px', background: '#F5A623',
                border: 'none', color: '#000',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                textAlign: 'center', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              View Dashboard →
            </a>
          </div>

          <p style={{ marginTop: 24, fontSize: 13, color: '#5C5A53' }}>
            Questions? Call or text{' '}
            <a href="tel:+18335580877" style={{ color: '#F5A623', textDecoration: 'none', fontWeight: 600 }}>(833) 558-0877</a>
          </p>
        </div>
      </div>
    </div>
  </>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SubmitTrial: React.FC = () => {
  const [form, setForm] = useState<TrialFormData>(INITIAL);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const update = (field: keyof TrialFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isValid = (): boolean =>
    !!form.firstName.trim() &&
    !!form.lastName.trim() &&
    !!form.company.trim() &&
    form.phone.replace(/\D/g, '').length === 10 &&
    isEmailValid(form.email) &&
    !!form.trucks &&
    !!form.crm &&
    (form.crm !== 'other' || !!form.crmOther.trim()) &&
    !!form.city.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitState('submitting');
    setErrorMsg('');

    const payload = {
      ...form,
      crm: form.crm === 'other' ? form.crmOther : form.crm,
      submittedAt: new Date().toISOString(),
      source: 'submit-trial',
      type: 'trial_signup',
    };

    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitState('success');
    } catch (err) {
      console.error('Trial submit error:', err);
      setErrorMsg('Something went wrong. Please try again or call (833) 558-0877.');
      setSubmitState('error');
    }
  };

  if (submitState === 'success') return <SuccessScreen form={form} />;

  const isLoading = submitState === 'submitting';
  const btnActive = isValid() && !isLoading;

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── Top bar ── */}
      <div style={{
        background: '#F5A623', padding: '9px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#0D0D0D', gap: 10,
      }}>
        <span style={{ width: 7, height: 7, background: '#0D0D0D', borderRadius: '50%', display: 'inline-block' }} />
        14-Day Free Trial · No Credit Card Required · Cancel Anytime
        <span style={{ width: 7, height: 7, background: '#0D0D0D', borderRadius: '50%', display: 'inline-block' }} />
      </div>

      {/* ── Nav ── */}
      <nav
        className="trial-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: '#0D0D0D', borderBottom: '3px solid #F5A623',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 60px', height: 64,
        }}
      >
        <a href="/" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#F5A623', letterSpacing: 1, textDecoration: 'none' }}>
          Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5C5A53' }}>
          Already have an account?
          <a href="/dashboard" style={{ color: '#F5A623', fontWeight: 700, textDecoration: 'none' }}>Sign In →</a>
        </div>
      </nav>

      {/* ── Hero + Form grid ── */}
      <div
        className="trial-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 100px)',
        }}
      >
        {/* ── Left: Hero copy ── */}
        <div style={{
          background: '#0D0D0D',
          padding: '72px 60px 72px 80px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderRight: '2px solid #222',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1A1A1A', border: '1px solid #333',
            borderLeft: '3px solid #F5A623',
            padding: '6px 14px',
            fontSize: 11, color: '#9E9B91',
            letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700,
            marginBottom: 28, width: 'fit-content',
          }}>
            Free 14-Day Trial
          </div>

          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 80, lineHeight: 0.92,
            color: '#FFF', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Start Closing<br />
            <span style={{ color: '#F5A623' }}>More Jobs</span><br />
            Tomorrow.
          </h1>

          <p style={{ fontSize: 17, color: '#9E9B91', lineHeight: 1.6, marginBottom: 40, maxWidth: 400 }}>
            Your AI quote tool, speed-to-lead automation, and contractor dashboard — live before your first shift.
          </p>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['⚡', 'Respond to leads in under 60 seconds'],
              ['💬', 'AI quotes sent to homeowners automatically'],
              ['📊', 'Lead dashboard + status tracking'],
              ['🔗', 'Works with ServiceTitan & Housecall Pro'],
              ['🇲🇽', 'Full English + Spanish support'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, animationDelay: `${i * 0.06}s` }} className="fade-up">
                <div style={{
                  width: 36, height: 36,
                  background: '#1A1A1A', border: '1px solid #333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {icon}
                </div>
                <span style={{ fontSize: 14, color: '#9E9B91', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{
            marginTop: 48,
            padding: '24px 28px',
            background: '#111', border: '1px solid #222',
            borderLeft: '3px solid #F5A623',
          }}>
            <p style={{ fontSize: 15, color: '#9E9B91', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 12 }}>
              &ldquo;PlumbLead paid for itself in the first 48 hours. Now my guys just show up and close.&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#F5A623',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: '#000',
              }}>MR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Mike R.</div>
                <div style={{ fontSize: 12, color: '#5C5A53' }}>Owner, Reliable Plumbing — Phoenix, AZ</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div style={{ background: '#F5F4F0', padding: '72px 60px 72px 60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div
            className="trial-form-card"
            style={{
              background: '#FFF',
              border: '2px solid #E8E6DF',
              borderTop: '4px solid #F5A623',
              padding: '44px 40px',
              width: '100%',
              maxWidth: 520,
            }}
          >
            {/* Card header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 11, textTransform: 'uppercase', letterSpacing: 2,
                fontWeight: 700, color: '#C4841A', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'block', width: 20, height: 2, background: '#F5A623' }} />
                Start Your Free Trial
              </div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, lineHeight: 1, textTransform: 'uppercase' }}>
                Your Info
              </h2>
              <p style={{ fontSize: 14, color: '#9E9B91', marginTop: 6 }}>
                Takes 90 seconds. We'll handle the rest.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <FieldGroup>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <input id="firstName" className="trial-input" type="text" autoComplete="given-name"
                    value={form.firstName} onChange={e => update('firstName', e.target.value)}
                    placeholder="Ryan" required />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <input id="lastName" className="trial-input" type="text" autoComplete="family-name"
                    value={form.lastName} onChange={e => update('lastName', e.target.value)}
                    placeholder="Smith" required />
                </FieldGroup>
              </div>

              {/* Company */}
              <FieldGroup style={{ marginBottom: 16 }}>
                <FieldLabel htmlFor="company">Company Name</FieldLabel>
                <input id="company" className="trial-input" type="text" autoComplete="organization"
                  value={form.company} onChange={e => update('company', e.target.value)}
                  placeholder="Smith Plumbing LLC" required />
              </FieldGroup>

              {/* Phone + Email */}
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <FieldGroup>
                  <FieldLabel htmlFor="phone">Mobile Phone</FieldLabel>
                  <input id="phone" className="trial-input" type="tel" autoComplete="tel"
                    value={form.phone}
                    onChange={e => update('phone', formatPhone(e.target.value))}
                    placeholder="(602) 555-0100" required />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="email">Work Email</FieldLabel>
                  <input id="email" className="trial-input" type="email" autoComplete="email"
                    value={form.email} onChange={e => update('email', e.target.value)}
                    placeholder="ryan@smithplumbing.com" required />
                </FieldGroup>
              </div>

              {/* City + Trucks */}
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <FieldGroup>
                  <FieldLabel htmlFor="city">Service City / Metro</FieldLabel>
                  <input id="city" className="trial-input" type="text"
                    value={form.city} onChange={e => update('city', e.target.value)}
                    placeholder="Phoenix, AZ" required />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="trucks">Number of Trucks</FieldLabel>
                  <select
                    id="trucks"
                    className={`trial-select${!form.trucks ? ' placeholder-active' : ''}`}
                    value={form.trucks}
                    onChange={e => update('trucks', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select...</option>
                    <option value="1">1 truck</option>
                    <option value="2-3">2–3 trucks</option>
                    <option value="4-7">4–7 trucks</option>
                    <option value="8-15">8–15 trucks</option>
                    <option value="16+">16+ trucks</option>
                  </select>
                </FieldGroup>
              </div>

              {/* CRM */}
              <FieldGroup style={{ marginBottom: form.crm === 'other' ? 12 : 16 }}>
                <FieldLabel htmlFor="crm">CRM / Field Software</FieldLabel>
                <select
                  id="crm"
                  className={`trial-select${!form.crm ? ' placeholder-active' : ''}`}
                  value={form.crm}
                  onChange={e => update('crm', e.target.value)}
                  required
                >
                  <option value="" disabled>Select your software...</option>
                  <option value="ServiceTitan">ServiceTitan</option>
                  <option value="Housecall Pro">Housecall Pro</option>
                  <option value="Jobber">Jobber</option>
                  <option value="FieldEdge">FieldEdge</option>
                  <option value="none">No CRM yet</option>
                  <option value="other">Other</option>
                </select>
              </FieldGroup>

              {form.crm === 'other' && (
                <FieldGroup style={{ marginBottom: 16 }}>
                  <FieldLabel htmlFor="crmOther">Which software?</FieldLabel>
                  <input id="crmOther" className="trial-input" type="text"
                    value={form.crmOther} onChange={e => update('crmOther', e.target.value)}
                    placeholder="e.g. ServiceM8, Tradify..." />
                </FieldGroup>
              )}

              {/* How did you hear */}
              <FieldGroup style={{ marginBottom: 28 }}>
                <FieldLabel htmlFor="hearAbout">How'd you hear about us? <span style={{ color: '#9E9B91', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></FieldLabel>
                <select
                  id="hearAbout"
                  className={`trial-select${!form.hearAbout ? ' placeholder-active' : ''}`}
                  value={form.hearAbout}
                  onChange={e => update('hearAbout', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Google">Google Search</option>
                  <option value="Facebook">Facebook / Instagram</option>
                  <option value="Referral">Referral from another contractor</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Podcast">Podcast</option>
                  <option value="Other">Other</option>
                </select>
              </FieldGroup>

              {/* Error */}
              {submitState === 'error' && (
                <div style={{
                  background: '#FCEBEB', border: '1px solid #F09595',
                  padding: '12px 16px', marginBottom: 20,
                  fontSize: 14, color: '#A32D2D',
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!btnActive}
                style={{
                  width: '100%', padding: '16px',
                  background: btnActive ? '#F5A623' : '#E8E6DF',
                  border: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700, fontSize: 16,
                  color: btnActive ? '#000' : '#9E9B91',
                  cursor: btnActive ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                  letterSpacing: 0.3,
                }}
              >
                {isLoading ? 'Activating Trial...' : 'Start My Free Trial →'}
              </button>

              <p style={{ fontSize: 12, color: '#9E9B91', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
                By submitting, you agree to our{' '}
                <a href="/terms" style={{ color: '#C4841A', textDecoration: 'none' }}>Terms</a>{' '}and{' '}
                <a href="/privacy" style={{ color: '#C4841A', textDecoration: 'none' }}>Privacy Policy</a>.
                No spam. No contracts. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="trial-footer"
        style={{
          background: '#0D0D0D',
          padding: '28px 80px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '3px solid #F5A623',
        }}
      >
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#F5A623' }}>
          Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai
        </div>
        <p style={{ fontSize: 13, color: '#5C5A53' }}>© 2026 PlumbLead.ai · Built for contractors who close fast.</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <a href="/privacy" style={{ color: '#5C5A53', textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ color: '#5C5A53', textDecoration: 'none' }}>Terms</a>
          <a href="tel:+18335580877" style={{ color: '#F5A623', textDecoration: 'none', fontWeight: 600 }}>(833) 558-0877</a>
        </div>
      </footer>
    </>
  );
};

export default SubmitTrial;
