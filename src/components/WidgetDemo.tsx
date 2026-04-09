// src/components/WidgetDemo.tsx
// PlumbLead.ai — Widget demo page at /widget-demo
// Opens with the quote panel visible by default so contractors immediately see the product

import React, { useState } from 'react';

const WidgetDemo: React.FC = () => {
  // Open by default so contractors land and immediately see the widget in action
  const [panelOpen, setPanelOpen] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const color = '#F5A623';

  const open = () => { setPanelOpen(true); setTooltipVisible(false); };
  const close = () => { setPanelOpen(false); setTooltipVisible(true); };

  const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: "'Inter', -apple-system, sans-serif", background: '#fff', color: '#111', minHeight: '100vh' },
    banner: { background: '#0D0D0D', color, textAlign: 'center', padding: '10px 20px', fontSize: 13, fontWeight: 600, position: 'sticky', top: 0, zIndex: 100 },
    nav: { background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68 },
    navLogo: { color: '#fff', fontSize: 22, fontWeight: 700 },
    navLinks: { display: 'flex', gap: 28 },
    navLink: { color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
    navCta: { background: color, color: '#000', fontWeight: 700, fontSize: 14, padding: '10px 20px', textDecoration: 'none' },
    hero: { background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
    heroH1: { fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16 },
    heroP: { fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 32 },
    heroBtns: { display: 'flex', gap: 14 },
    btnPrimary: { background: color, color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 28px', textDecoration: 'none', display: 'inline-block', cursor: 'pointer', border: 'none' } as React.CSSProperties,
    btnSecondary: { background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px 28px', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block' },
    heroBadge: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 32, textAlign: 'center' },
    services: { padding: '72px 48px', background: '#f8f9fa' },
    serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 },
    serviceCard: { background: '#fff', padding: '28px 24px', border: '1px solid #e5e7eb', borderRadius: 6 },
    why: { padding: '72px 48px' },
    whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 36 },
    whyCard: { textAlign: 'center', padding: '24px 16px' },
    whyNum: { fontSize: 36, fontWeight: 700, color: '#1a3a5c', marginBottom: 8 },
    cta: { background: '#1a3a5c', padding: '56px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 },
    footer: { background: '#0d1117', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pl-demo-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @media (max-width: 600px) {
          .pl-demo-panel { bottom: 0 !important; right: 0 !important; left: 0 !important; width: 100% !important; max-height: 90vh !important; }
          .pl-demo-hero { grid-template-columns: 1fr !important; }
          .pl-demo-nav-links { display: none !important; }
          .pl-demo-service-grid { grid-template-columns: 1fr 1fr !important; }
          .pl-demo-why-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={s.page}>

        {/* Demo banner */}
        <div style={s.banner}>
          👀 This is a <span style={{ color: '#fff' }}>PlumbLead.ai widget demo</span> — the quote tool is already open in the bottom-right corner
        </div>

        {/* Fake nav */}
        <nav style={s.nav}>
          <div style={s.navLogo}>Smith<span style={{ color }}>Plumbing</span></div>
          <div className="pl-demo-nav-links" style={s.navLinks}>
            <a href="#" style={s.navLink}>Services</a>
            <a href="#" style={s.navLink}>About</a>
            <a href="#" style={s.navLink}>Reviews</a>
            <a href="#" style={s.navLink}>Contact</a>
          </div>
          <a href="#" style={s.navCta}>Call (602) 555-0100</a>
        </nav>

        {/* Hero */}
        <section className="pl-demo-hero" style={s.hero}>
          <div>
            <h1 style={s.heroH1}>Phoenix's Most <span style={{ color }}>Trusted</span> Plumbers</h1>
            <p style={s.heroP}>Fast, reliable plumbing for homeowners across the Valley. Available 24/7 for emergencies. Licensed & insured.</p>
            <div style={s.heroBtns}>
              <button style={s.btnPrimary} onClick={open}>Get a Free Quote</button>
              <a href="#" style={s.btnSecondary}>(602) 555-0100</a>
            </div>
          </div>
          <div style={s.heroBadge}>
            <span style={{ fontSize: 72, display: 'block', marginBottom: 16 }}>🔧</span>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Licensed & Insured · 4.9 Stars · 500+ Reviews</p>
          </div>
        </section>

        {/* Services */}
        <section style={s.services}>
          <h2 style={{ fontSize: 30, fontWeight: 700 }}>Our Services</h2>
          <p style={{ color: '#666', fontSize: 15, marginTop: 8 }}>We handle everything from dripping faucets to full repipes.</p>
          <div className="pl-demo-service-grid" style={s.serviceGrid}>
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

        {/* Why us */}
        <section style={s.why}>
          <h2 style={{ fontSize: 30, fontWeight: 700 }}>Why Homeowners Choose Us</h2>
          <p style={{ color: '#666', fontSize: 15, marginTop: 8 }}>We show up on time and get it done right the first time.</p>
          <div className="pl-demo-why-grid" style={s.whyGrid}>
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

        {/* CTA */}
        <section style={s.cta}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>Need a plumber today?</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 14 }}>Get an instant quote in 30 seconds — no phone call required.</p>
          </div>
          <button style={{ ...s.btnPrimary, fontSize: 16, padding: '16px 32px' }} onClick={open}>
            Get Instant Quote →
          </button>
        </section>

        {/* Footer */}
        <footer style={s.footer}>
          <div style={{ color, fontWeight: 700, fontSize: 17 }}>SmithPlumbing</div>
          <p style={{ color: '#5c5a53', fontSize: 12 }}>© 2026 Smith Plumbing LLC · Phoenix, AZ · ROC #123456</p>
          <p style={{ color: '#5c5a53', fontSize: 12 }}>Licensed & Insured</p>
        </footer>

        {/* ── Widget ── */}

        {/* Tooltip — shown after panel is closed */}
        <div style={{
          position: 'fixed', bottom: 96, right: 24,
          background: '#0D0D0D', color: '#fff',
          padding: '10px 16px', fontSize: 13, fontWeight: 600,
          fontFamily: 'sans-serif', whiteSpace: 'nowrap',
          zIndex: 999997, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          opacity: tooltipVisible && !panelOpen ? 1 : 0,
          transform: tooltipVisible && !panelOpen ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: 'none',
        }}>
          Get a Free Instant Quote
        </div>

        {/* Overlay */}
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 999997,
            opacity: panelOpen ? 1 : 0,
            pointerEvents: panelOpen ? 'all' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Panel */}
        <div
          className="pl-demo-panel"
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: 400,
            height: 'min(600px, calc(100vh - 120px))',
            background: '#fff',
            boxShadow: '0 8px 48px rgba(0,0,0,0.3)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderTop: `4px solid ${color}`,
            opacity: panelOpen ? 1 : 0,
            transform: panelOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
            transition: 'transform 0.25s ease, opacity 0.25s ease',
            pointerEvents: panelOpen ? 'all' : 'none',
          }}
        >
          {/* Header */}
          <div style={{ background: '#0D0D0D', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', fontFamily: 'sans-serif' }}>PL</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>PlumbLead.ai</div>
                <div style={{ fontSize: 11, color: '#4CAF50', fontFamily: 'sans-serif' }}>● Online Now</div>
              </div>
            </div>
            <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E9B91', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* iFrame */}
          <iframe
            style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
            src="https://plumblead.ai/quote?widget=1&client=demo&lang=en"
            title="PlumbLead.ai Instant Quote"
          />

          {/* Footer */}
          <div style={{ background: '#0D0D0D', padding: '8px 16px', textAlign: 'center', fontSize: 10, color: '#5C5A53', fontFamily: 'sans-serif', flexShrink: 0 }}>
            Powered by{' '}
            <a href="https://plumblead.ai" target="_blank" rel="noopener" style={{ color, textDecoration: 'none' }}>PlumbLead.ai</a>
          </div>
        </div>

        {/* Bubble */}
        <button
          onClick={() => panelOpen ? close() : open()}
          aria-label="Open PlumbLead.ai Quote Tool"
          aria-expanded={panelOpen}
          style={{
            position: 'fixed', bottom: 24, right: 24,
            width: 60, height: 60, borderRadius: '50%',
            background: panelOpen ? '#0D0D0D' : color,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            zIndex: 999998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, transition: 'all 0.2s',
            animation: !panelOpen ? 'pl-demo-pulse 3s infinite' : 'none',
          }}
        >
          {panelOpen
            ? <span style={{ color, fontSize: 20, fontWeight: 700 }}>✕</span>
            : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#D83030', borderRadius: '50%', border: '2px solid #fff' }} />
              </>
            )
          }
        </button>

      </div>
    </>
  );
};

export default WidgetDemo;
