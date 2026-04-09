// src/components/CheckoutPage.tsx
// Self-serve plan selection and Stripe checkout.
// Route: /checkout?clientId=xxx   (comes from UpgradeBanner or direct link)

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';

const PLANS = [
  {
    value: 'starter',
    label: 'Starter',
    price: '$97',
    period: '/mo',
    desc: '1–2 trucks',
    features: [
      'AI instant quote tool on your website',
      'SMS lead notification within 60 seconds',
      'Lead dashboard with conversion tracking',
      '14-day free trial',
    ],
    popular: false,
  },
  {
    value: 'pro',
    label: 'Pro',
    price: '$197',
    period: '/mo',
    desc: '3–10 trucks',
    features: [
      'Everything in Starter',
      'Missed call recovery + local forwarding number',
      'Business hours + after-hours SMS capture',
      'CRM routing (ServiceTitan, HCP, Jobber)',
      'Priority support',
    ],
    popular: true,
  },
  {
    value: 'agency',
    label: 'Agency',
    price: '$497',
    period: '/mo',
    desc: '10+ trucks',
    features: [
      'Everything in Pro',
      'White-label (remove PlumbLead branding)',
      'Multi-location support',
      'Sub-account management',
      'Dedicated onboarding call',
    ],
    popular: false,
  },
];

export default function CheckoutPage() {
  const params = new URLSearchParams(window.location.search);
  const clientIdFromUrl = params.get('clientId') || '';
  const cancelled = params.get('cancelled') === 'true';
  const preselect = params.get('plan') || '';

  const [clientId, setClientId]   = useState(clientIdFromUrl);
  const [selected, setSelected]   = useState(preselect || 'pro');
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [contractorName, setContractorName] = useState('');

  // Look up contractor name if clientId is known
  useEffect(() => {
    if (!clientId) return;
    // We use the dashboard auth endpoint with a dummy code to check existence
    // Instead just show the clientId — the backend validates on checkout
  }, [clientId]);

  const handleCheckout = async () => {
    if (!clientId.trim()) { setError('Enter your contractor ID to continue.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId.trim(), plan: selected, email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      // Redirect to Stripe hosted checkout
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Could not start checkout. Try again or call (833) 558-0877.');
      setLoading(false);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#0f172a', fontFamily: "'DM Sans', sans-serif", padding: '40px 16px' },
    card:    { maxWidth: 860, margin: '0 auto' },
    logo:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#facc15', letterSpacing: 1, marginBottom: 4 },
    tagline: { fontSize: 14, color: '#94a3b8', marginBottom: 40 },
    grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 },
    planCard: (active: boolean, popular: boolean): React.CSSProperties => ({
      border: active ? '2px solid #facc15' : popular ? '2px solid #0ea5e9' : '2px solid #1e293b',
      background: active ? '#1e293b' : '#0f172a',
      borderRadius: 12, padding: '24px 20px', cursor: 'pointer', position: 'relative',
      transition: 'border-color 0.15s',
    }),
    popularBadge: { position: 'absolute' as const, top: -11, left: 16, background: '#0ea5e9', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 10px', letterSpacing: 1, textTransform: 'uppercase' as const, borderRadius: 4 },
    planLabel: (active: boolean) => ({ fontSize: 18, fontWeight: 800, color: active ? '#facc15' : '#f1f5f9', marginBottom: 2 }),
    planPrice: { fontSize: 32, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 },
    planPeriod: { fontSize: 14, color: '#64748b' },
    planDesc:  { fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: 4 },
    feature:   { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    checkmark: { color: '#10b981', fontSize: 13, flexShrink: 0, marginTop: 1 },
    featText:  { fontSize: 13, color: '#94a3b8', lineHeight: 1.4 },
    inputWrap: { marginBottom: 16 },
    label:     { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
    input:     { width: '100%', padding: '12px 14px', background: '#1e293b', border: '2px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' as const },
    btn:       { width: '100%', padding: '16px', background: loading ? '#374151' : '#facc15', color: '#0f172a', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" },
    error:     { color: '#f87171', fontSize: 13, marginTop: 10, textAlign: 'center' as const },
    hint:      { fontSize: 12, color: '#475569', marginTop: 16, textAlign: 'center' as const, lineHeight: 1.6 },
  };

  const selectedPlan = PLANS.find(p => p.value === selected)!;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>PlumbLead<span style={{ color: '#fff' }}>.ai</span></div>
        <div style={s.tagline}>AI-powered lead capture for plumbing contractors. Stop losing jobs to slow response.</div>

        {cancelled && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#94a3b8' }}>
            No worries — your trial is still active. Pick a plan below whenever you're ready.
          </div>
        )}

        {/* Plan cards */}
        <div style={s.grid}>
          {PLANS.map(plan => (
            <div key={plan.value} style={s.planCard(selected === plan.value, plan.popular)} onClick={() => setSelected(plan.value)}>
              {plan.popular && <div style={s.popularBadge}>Most Popular</div>}
              <div style={s.planLabel(selected === plan.value)}>{plan.label}</div>
              <div style={s.planDesc}>{plan.desc}</div>
              <div style={{ marginBottom: 16 }}>
                <span style={s.planPrice}>{plan.price}</span>
                <span style={s.planPeriod}>{plan.period}</span>
              </div>
              {plan.features.map((f, i) => (
                <div key={i} style={s.feature}>
                  <span style={s.checkmark}>✓</span>
                  <span style={s.featText}>{f}</span>
                </div>
              ))}
              {selected === plan.value && (
                <div style={{ marginTop: 12, fontSize: 11, color: '#facc15', fontWeight: 700, textAlign: 'center' }}>✔ Selected</div>
              )}
            </div>
          ))}
        </div>

        {/* Checkout form */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '28px 24px', border: '1px solid #334155' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
            Start {selectedPlan.label} — {selectedPlan.price}/mo
          </div>

          {!clientIdFromUrl && (
            <div style={s.inputWrap}>
              <label style={s.label}>Your PlumbLead Contractor ID</label>
              <input style={s.input} placeholder="e.g. smith-plumbing" value={clientId}
                onChange={e => setClientId(e.target.value)} />
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>From your setup email. Contact (833) 558-0877 if you don't have it.</div>
            </div>
          )}

          <div style={s.inputWrap}>
            <label style={s.label}>Email (for receipt)</label>
            <input style={s.input} type="email" placeholder="owner@yourplumbing.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>

          <button style={s.btn} onClick={handleCheckout} disabled={loading}>
            {loading ? 'Redirecting to Stripe...' : `Start ${selectedPlan.label} — ${selectedPlan.price}/mo →`}
          </button>

          {error && <div style={s.error}>{error}</div>}

          <div style={s.hint}>
            You'll be taken to Stripe's secure checkout page. Cancel anytime.<br />
            Questions? Call <strong style={{ color: '#94a3b8' }}>(833) 558-0877</strong>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#334155' }}>
          Powered by PlumbLead.ai · Secured by Stripe
        </div>
      </div>
    </div>
  );
}
