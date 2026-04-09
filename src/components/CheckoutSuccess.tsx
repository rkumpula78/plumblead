// src/components/CheckoutSuccess.tsx
// Shown after successful Stripe payment.
// Route: /checkout/success?clientId=xxx&plan=pro

import React, { useEffect, useState } from 'react';

export default function CheckoutSuccess() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('clientId') || '';
  const plan     = params.get('plan') || 'pro';
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const s: Record<string, React.CSSProperties> = {
    page:  { minHeight: '100vh', background: '#0f172a', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card:  { background: '#1e293b', border: '2px solid #10b981', borderRadius: 16, padding: '48px 40px', maxWidth: 500, width: '100%', textAlign: 'center' as const },
    icon:  { fontSize: 56, marginBottom: 16 },
    title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#facc15', letterSpacing: 1, marginBottom: 8 },
    sub:   { fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 },
    badge: { display: 'inline-block', background: '#064e3b', color: '#10b981', padding: '6px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 28 },
    btn:   { display: 'block', width: '100%', padding: 16, background: '#facc15', color: '#0f172a', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' },
    hint:  { fontSize: 12, color: '#475569', marginTop: 16 },
  };

  const nextSteps = [
    'Check your email for your receipt and dashboard access code',
    'Log into your dashboard at plumblead.ai/dashboard',
    'Add the widget embed code to your website',
    'Update your Google Business Profile with your PlumbLead number',
  ];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>🎉</div>
        <div style={s.title}>You're Live!</div>
        <div style={s.badge}>{planLabel} Plan • Active</div>
        <div style={s.sub}>
          Welcome to PlumbLead.ai. Your account is now active and your lead capture system is ready to go.
          {clientId && <><br /><br />Account: <strong style={{ color: '#f1f5f9' }}>{clientId}</strong></>}
        </div>

        <div style={{ textAlign: 'left', background: '#0f172a', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Next Steps</div>
          {nextSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>

        <a href="/dashboard" style={s.btn}>Go to My Dashboard →</a>
        <div style={s.hint}>Redirecting automatically in {seconds}s · Questions? (833) 558-0877</div>
      </div>
    </div>
  );
}
