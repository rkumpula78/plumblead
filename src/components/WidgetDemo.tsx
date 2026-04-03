// src/components/WidgetDemo.tsx
// PlumbLead.ai — Widget demo page at /widget-demo
// Fake plumber site showing the widget bubble in action

import React, { useEffect } from 'react';

const WidgetDemo: React.FC = () => {

  useEffect(() => {
    // Remove any stale widget elements from a previous mount
    document.querySelectorAll('.pl-bubble, .pl-panel, .pl-overlay, .pl-tooltip').forEach(el => el.remove());
    (window as any).__plumblead_loaded = false;

    // Inject widget script
    const script = document.createElement('script');
    script.id = 'pl-widget-script';
    script.src = '/widget.js';
    script.setAttribute('data-client', 'demo');
    script.setAttribute('data-color', '#F5A623');
    script.setAttribute('data-position', 'right');
    script.setAttribute('data-lang', 'en');
    document.head.appendChild(script);

    return () => {
      script.remove();
      (window as any).__plumblead_loaded = false;
      document.querySelectorAll('.pl-bubble, .pl-panel, .pl-overlay, .pl-tooltip').forEach(el => el.remove());
      const styleEl = document.getElementById('pl-widget-styles');
      if (styleEl) styleEl.remove();
    };
  }, []);

  const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: "'Inter', -apple-system, sans-serif", background: '#fff', color: '#111' },
    banner: { background: '#0D0D0D', color: '#F5A623', textAlign: 'center', padding: '10px 20px', fontSize: 13, fontWeight: 600, position: 'sticky', top: 0, zIndex: 100 },
    nav: { background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68 },
    navLogo: { color: '#fff', fontSize: 22, fontWeight: 700 },
    navLinks: { display: 'flex', gap: 28 },
    navLink: { color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
    navCta: { background: '#F5A623', color: '#000', fontWeight: 700, fontSize: 14, padding: '10px 20px', textDecoration: 'none' },
    hero: { background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
    heroH1: { fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16 },
    heroP: { fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 32 },
    heroBtns: { display: 'flex', gap: 14 },
    btnPrimary: { background: '#F5A623', color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', textDecoration: 'none', display: 'inline-block' },
    btnSecondary: { background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px 28px', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block' },
    heroBadge: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 32, textAlign: 'center' },
    services: { padding: '72px 48px', background: '#f8f9fa' },
    servicesH2: { fontSize: 30, fontWeight: 700, marginBottom: 8 },
    servicesSub: { color: '#666', fontSize: 15, marginBottom: 36 },
    serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
    serviceCard: { background: '#fff', padding: '28px 24px', border: '1px solid #e5e7eb', borderRadius: 6 },
    why: { padding: '72px 48px' },
    whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 },
    whyCard: { textAlign: 'center', padding: '24px 16px' },
    whyNum: { fontSize: 36, fontWeight: 700, color: '#1a3a5c', marginBottom: 8 },
    cta: { background: '#1a3a5c', padding: '56px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 },
    ctaH2: { fontSize: 26, fontWeight: 700, color: '#fff' },
    ctaP: { color: 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 14 },
    footer: { background: '#0d1117', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerLogo: { color: '#F5A623', fontWeight: 700, fontSize: 17 },
    footerP: { color: '#5c5a53', fontSize: 12 },
    arrowLabel: {
      position: 'fixed', bottom: 106, right: 92,
      background: '#0D0D0D', color: '#F5A623',
      padding: '8px 14px', fontSize: 12, fontWeight: 700,
      zIndex: 500, pointerEvents: 'none', whiteSpace: 'nowrap',
      animation: 'pl-fade-label 0.6s ease 3.5s both',
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pl-fade-label { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={s.page}>

        <div style={s.banner}>
          👀 This is a <span style={{ color: '#fff' }}>PlumbLead.ai widget demo</span> — click the 💛 bubble in the bottom-right corner
        </div>

        <nav style={s.nav}>
          <div style={s.navLogo}>Smith<span style={{ color: '#F5A623' }}>Plumbing</span></div>
          <div style={s.navLinks}>
            <a href="#" style={s.navLink}>Services</a>
            <a href="#" style={s.navLink}>About</a>
            <a href="#" style={s.navLink}>Reviews</a>
            <a href="#" style={s.navLink}>Contact</a>
          </div>
          <a href="#" style={s.navCta}>Call (602) 555-0100</a>
        </nav>

        <section style={s.hero}>
          <div>
            <h1 style={s.heroH1}>Phoenix's Most <span style={{ color: '#F5A623' }}>Trusted</span> Plumbers</h1>
            <p style={s.heroP}>Fast, reliable plumbing for homeowners across the Valley. Available 24/7 for emergencies. Licensed &amp; insured.</p>
            <div style={s.heroBtns}>
              <a href="#" style={s.btnPrimary}>Get a Free Quote</a>
              <a href="#" style={s.btnSecondary}>(602) 555-0100</a>
            </div>
          </div>
          <div style={s.heroBadge}>
            <span style={{ fontSize: 72, display: 'block', marginBottom: 16 }}>🔧</span>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Licensed &amp; Insured · 4.9 Stars · 500+ Reviews</p>
          </div>
        </section>

        <section style={s.services}>
          <h2 style={s.servicesH2}>Our Services</h2>
          <p style={s.servicesSub}>We handle everything from dripping faucets to full repipes.</p>
          <div style={s.serviceGrid}>
            {[
              { icon: '🚧', title: 'Water Heater Install', desc: 'Tank & tankless installation, replacement, and repair.' },
              { icon: '🚿', title: 'Drain Cleaning', desc: 'Clogged drains cleared fast with professional-grade equipment.' },
              { icon: '🔍', title: 'Leak Detection', desc: 'Non-invasive leak detection before damage occurs.' },
              { icon: '🚽', title: 'Toilet Repair', desc: 'Running toilets, clogs, replacements — same day.' },
              { icon: '💧', title: 'Water Treatment', desc: 'Whole-home softeners, RO systems, and filtration.' },
              { icon: '🚨', title: 'Emergency Service', desc: 'Burst pipes, flooding, gas leaks — available 24/7.' },
            ].map((sv, i) => (
              <div style={s.serviceCard} key={i}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{sv.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{sv.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{sv.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={s.why}>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Why Homeowners Choose Us</h2>
          <p style={{ color: '#666', fontSize: 15, marginBottom: 36 }}>We show up on time and get it done right the first time.</p>
          <div style={s.whyGrid}>
            {[
              { num: '24/7', desc: 'Emergency service around the clock' },
              { num: '4.9★', desc: 'Average across 500+ Google reviews' },
              { num: '<1hr', desc: 'Average response for urgent requests' },
              { num: '12yr', desc: 'Serving Phoenix since 2012' },
            ].map((w, i) => (
              <div style={s.whyCard} key={i}>
                <div style={s.whyNum}>{w.num}</div>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={s.cta}>
          <div>
            <h2 style={s.ctaH2}>Need a plumber today?</h2>
            <p style={s.ctaP}>Get an instant quote in 30 seconds — no phone call required.</p>
          </div>
          <a href="#" style={{ ...s.btnPrimary, fontSize: 16, padding: '16px 32px', whiteSpace: 'nowrap' }}>Get Instant Quote →</a>
        </section>

        <footer style={s.footer}>
          <div style={s.footerLogo}>SmithPlumbing</div>
          <p style={s.footerP}>© 2026 Smith Plumbing LLC · Phoenix, AZ · ROC #123456</p>
          <p style={s.footerP}>Licensed &amp; Insured</p>
        </footer>

        {/* Arrow label pointing to widget bubble */}
        <div style={s.arrowLabel}>👇 Try the AI Quote Widget</div>

      </div>
    </>
  );
};

export default WidgetDemo;
