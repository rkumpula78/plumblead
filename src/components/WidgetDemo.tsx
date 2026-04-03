// src/components/WidgetDemo.tsx
// PlumbLead.ai — Widget demo page
// Shows a fake plumber site with the widget bubble active
// URL: /widget-demo

import React, { useEffect } from 'react';

const WidgetDemo: React.FC = () => {

  useEffect(() => {
    // Inject the widget script dynamically
    // Remove any existing instance first
    const existing = document.getElementById('pl-widget-script');
    if (existing) existing.remove();
    // Reset loaded flag so it re-initialises
    (window as any).__plumblead_loaded = false;

    const script = document.createElement('script');
    script.id = 'pl-widget-script';
    script.src = '/widget.js';
    script.setAttribute('data-client', 'demo');
    script.setAttribute('data-color', '#F5A623');
    script.setAttribute('data-position', 'right');
    script.setAttribute('data-lang', 'en');
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount — remove injected elements
      script.remove();
      (window as any).__plumblead_loaded = false;
      document.querySelectorAll('.pl-bubble, .pl-panel, .pl-overlay, .pl-tooltip').forEach(el => el.remove());
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .demo-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .demo-page { font-family: 'Inter', sans-serif; background: #fff; color: #111; }
        .demo-banner {
          background: #0D0D0D; color: #F5A623;
          text-align: center; padding: 10px 20px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
          position: sticky; top: 0; z-index: 100;
        }
        .demo-banner span { color: #fff; }
        .demo-nav {
          background: #1a3a5c;
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 48px; height: 68px;
        }
        .demo-nav-logo { color: #fff; font-size: 22px; font-weight: 700; }
        .demo-nav-logo span { color: #F5A623; }
        .demo-nav-links { display: flex; gap: 28px; }
        .demo-nav-links a { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 14px; font-weight: 500; }
        .demo-nav-cta { background: #F5A623; color: #000; font-weight: 700; font-size: 14px; padding: 10px 20px; text-decoration: none; }
        .demo-hero {
          background: linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%);
          padding: 80px 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
        }
        .demo-hero h1 { font-size: 44px; font-weight: 700; color: #fff; line-height: 1.1; margin-bottom: 16px; }
        .demo-hero h1 span { color: #F5A623; }
        .demo-hero p { font-size: 17px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 32px; }
        .demo-hero-btns { display: flex; gap: 14px; }
        .demo-btn-primary { background: #F5A623; color: #000; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; display: inline-block; }
        .demo-btn-secondary { background: transparent; color: #fff; font-weight: 600; font-size: 15px; padding: 14px 28px; text-decoration: none; border: 2px solid rgba(255,255,255,0.3); display: inline-block; }
        .demo-hero-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 32px; text-align: center; }
        .demo-hero-badge .emoji { font-size: 72px; display: block; margin-bottom: 16px; }
        .demo-hero-badge p { color: rgba(255,255,255,0.5); font-size: 14px; }
        .demo-services { padding: 72px 48px; background: #f8f9fa; }
        .demo-services h2 { font-size: 30px; font-weight: 700; margin-bottom: 8px; }
        .demo-services .sub { color: #666; font-size: 15px; margin-bottom: 36px; }
        .demo-service-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .demo-service-card { background: #fff; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .demo-service-card .icon { font-size: 30px; margin-bottom: 12px; }
        .demo-service-card h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .demo-service-card p { font-size: 13px; color: #666; line-height: 1.5; }
        .demo-why { padding: 72px 48px; }
        .demo-why h2 { font-size: 30px; font-weight: 700; margin-bottom: 8px; }
        .demo-why .sub { color: #666; font-size: 15px; margin-bottom: 36px; }
        .demo-why-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .demo-why-card { text-align: center; padding: 24px 16px; }
        .demo-why-card .num { font-size: 36px; font-weight: 700; color: #1a3a5c; margin-bottom: 8px; }
        .demo-why-card p { font-size: 13px; color: #666; line-height: 1.5; }
        .demo-cta { background: #1a3a5c; padding: 56px 48px; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
        .demo-cta h2 { font-size: 26px; font-weight: 700; color: #fff; }
        .demo-cta p { color: rgba(255,255,255,0.6); margin-top: 6px; font-size: 14px; }
        .demo-footer { background: #0d1117; padding: 28px 48px; display: flex; justify-content: space-between; align-items: center; }
        .demo-footer p { color: #5c5a53; font-size: 12px; }
        .demo-footer .logo { color: #F5A623; font-weight: 700; font-size: 17px; }
        .demo-arrow-label {
          position: fixed; bottom: 106px; right: 92px;
          background: #0D0D0D; color: #F5A623;
          padding: 8px 14px; font-size: 12px; font-weight: 700;
          font-family: 'Inter', sans-serif; z-index: 888888;
          pointer-events: none; white-space: nowrap;
          animation: fadeLabel 0.6s ease 3.5s both;
        }
        @keyframes fadeLabel { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          .demo-nav { padding: 0 20px; }
          .demo-nav-links { display: none; }
          .demo-hero { grid-template-columns: 1fr; padding: 48px 20px; }
          .demo-hero h1 { font-size: 30px; }
          .demo-hero-badge { display: none; }
          .demo-services { padding: 48px 20px; }
          .demo-service-grid { grid-template-columns: 1fr 1fr; }
          .demo-why { padding: 48px 20px; }
          .demo-why-grid { grid-template-columns: 1fr 1fr; }
          .demo-cta { flex-direction: column; padding: 40px 20px; text-align: center; }
          .demo-footer { flex-direction: column; gap: 10px; padding: 24px 20px; text-align: center; }
          .demo-arrow-label { display: none; }
        }
      `}</style>

      <div className="demo-page">

        {/* Demo banner */}
        <div className="demo-banner">
          👀 This is a <span>PlumbLead.ai widget demo</span> — click the amber bubble in the bottom-right corner
        </div>

        {/* Fake nav */}
        <nav className="demo-nav">
          <div className="demo-nav-logo">Smith<span>Plumbing</span></div>
          <div className="demo-nav-links">
            <a href="#">Services</a>
            <a href="#">About</a>
            <a href="#">Reviews</a>
            <a href="#">Contact</a>
          </div>
          <a href="#" className="demo-nav-cta">Call (602) 555-0100</a>
        </nav>

        {/* Hero */}
        <section className="demo-hero">
          <div>
            <h1>Phoenix's Most <span>Trusted</span> Plumbers</h1>
            <p>Fast, reliable plumbing for homeowners across the Valley. Available 24/7 for emergencies. Licensed &amp; insured.</p>
            <div className="demo-hero-btns">
              <a href="#" className="demo-btn-primary">Get a Free Quote</a>
              <a href="#" className="demo-btn-secondary">(602) 555-0100</a>
            </div>
          </div>
          <div className="demo-hero-badge">
            <span className="emoji">🔧</span>
            <p>Licensed &amp; Insured · 4.9 Stars · 500+ Reviews</p>
          </div>
        </section>

        {/* Services */}
        <section className="demo-services">
          <h2>Our Services</h2>
          <p className="sub">We handle everything from dripping faucets to full repipes.</p>
          <div className="demo-service-grid">
            {[
              { icon: '🚧', title: 'Water Heater Install', desc: 'Tank & tankless installation, replacement, and repair.' },
              { icon: '🚰', title: 'Drain Cleaning', desc: 'Clogged drains cleared fast with professional-grade equipment.' },
              { icon: '🔍', title: 'Leak Detection', desc: 'Non-invasive leak detection before damage occurs.' },
              { icon: '🚿', title: 'Toilet Repair', desc: 'Running toilets, clogs, replacements — same day.' },
              { icon: '💧', title: 'Water Treatment', desc: 'Whole-home softeners, RO systems, and filtration.' },
              { icon: '🚨', title: 'Emergency Service', desc: 'Burst pipes, flooding, gas leaks — available 24/7.' },
            ].map((s, i) => (
              <div className="demo-service-card" key={i}>
                <div className="icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section className="demo-why">
          <h2>Why Homeowners Choose Us</h2>
          <p className="sub">We show up on time and get it done right the first time.</p>
          <div className="demo-why-grid">
            {[
              { num: '24/7', desc: 'Emergency service available around the clock' },
              { num: '4.9★', desc: 'Average rating across 500+ Google reviews' },
              { num: '<1hr', desc: 'Average response time for urgent requests' },
              { num: '12yr', desc: 'Serving Phoenix homeowners since 2012' },
            ].map((w, i) => (
              <div className="demo-why-card" key={i}>
                <div className="num">{w.num}</div>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section className="demo-cta">
          <div>
            <h2>Need a plumber today?</h2>
            <p>Get an instant quote in 30 seconds — no phone call required.</p>
          </div>
          <a href="#" className="demo-btn-primary" style={{ fontSize: 16, padding: '16px 32px', whiteSpace: 'nowrap' }}>Get Instant Quote →</a>
        </section>

        {/* Footer */}
        <footer className="demo-footer">
          <div className="logo">SmithPlumbing</div>
          <p>© 2026 Smith Plumbing LLC · Phoenix, AZ · ROC #123456</p>
          <p>Licensed &amp; Insured</p>
        </footer>

        {/* Arrow label pointing to widget */}
        <div className="demo-arrow-label">👇 Try the AI Quote Widget</div>

      </div>
    </>
  );
};

export default WidgetDemo;
