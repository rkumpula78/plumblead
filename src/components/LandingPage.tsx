// src/components/LandingPage.tsx
// PlumbLead.ai — Full landing page with embedded QuoteTool
// Trades aesthetic: Bebas Neue + DM Sans, black/yellow/white

import React, { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteFormData {
  serviceType: string;
  details: string;
  location: string;
  name: string;
  phone: string;
  email: string;
  language: 'en' | 'es';
}

interface QuoteResult {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
  leadScore?: string;
  crossSellOpportunities?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICES = [
  'Water Heater Install / Replace',
  'Sewer Line Repair',
  'Drain Cleaning',
  'Leak Detection',
  'Toilet Repair / Install',
  'Water Treatment System',
  'Pipe Repair / Repipe',
  'Other Plumbing Service',
];

const SERVICES_ES = [
  'Instalación / Reemplazo de Calentador',
  'Reparación de Alcantarillado',
  'Limpieza de Drenaje',
  'Detección de Fugas',
  'Reparación / Instalación de Inodoro',
  'Sistema de Tratamiento de Agua',
  'Reparación de Tuberías',
  'Otro Servicio de Plomería',
];

const T = {
  en: {
    nav: { howIt: 'How It Works', compare: 'Compare', pricing: 'Pricing', faq: 'FAQ', cta: 'Start Free Trial' },
    topbar: 'Contractors using PlumbLead.ai win 3× more jobs — Average response: 47 seconds',
    eyebrow: 'Built for Plumbers, Not Tech Bros',
    hero1: 'Stop', hero2: 'Losing', hero3: 'Every', hero4: 'Job',
    heroSub: 'Your competitor just answered that lead in 58 seconds. You answered in 2 hours. That\'s a $3,200 water heater job gone.',
    heroCta: 'Get Instant Quote — Free',
    heroSecondary: 'See How It Works ↓',
    trust: ['No contracts', 'Cancel anytime', 'Pays for itself in one job'],
    quoteSection: 'Instant Quote Tool',
    quoteSectionTitle: 'What\'s The Job Worth?',
    quoteSectionSub: 'Get a ballpark estimate in 30 seconds. Our AI is trained on real plumbing pricing across your market.',
    step1: 'Select Service',
    step2: 'Describe the Job',
    step3: 'Your Info',
    step1sub: 'What does the homeowner need?',
    step2sub: 'More detail = better estimate',
    step3sub: 'Where do we send the quote?',
    detailsPlaceholder: 'e.g. 40-gallon gas water heater, 10 years old, leaking from the bottom. House is in Phoenix, AZ.',
    namePlaceholder: 'Your name',
    phonePlaceholder: 'Phone number',
    emailPlaceholder: 'Email address',
    locationPlaceholder: 'City, State',
    generating: 'Generating your estimate...',
    estimateTitle: 'Your Estimate',
    nextSteps: 'Suggested Next Steps',
    getQuote: 'Get My Estimate →',
    startOver: 'Start Over',
    leadScoreLabel: 'Lead Score',
    crossSellLabel: 'Cross-Sell Opportunities',
  },
  es: {
    nav: { howIt: 'Cómo Funciona', compare: 'Comparar', pricing: 'Precios', faq: 'FAQ', cta: 'Prueba Gratis' },
    topbar: 'Contratistas usando PlumbLead.ai ganan 3× más trabajos — Respuesta promedio: 47 segundos',
    eyebrow: 'Hecho para Plomeros, No para Tecnólogos',
    hero1: 'Deja de', hero2: 'Perder', hero3: 'Cada', hero4: 'Trabajo',
    heroSub: 'Tu competidor acaba de responder ese cliente en 58 segundos. Tú respondiste en 2 horas. Eso es un trabajo de $3,200 perdido.',
    heroCta: 'Obtener Cotización Gratis',
    heroSecondary: 'Ver Cómo Funciona ↓',
    trust: ['Sin contratos', 'Cancela cuando quieras', 'Se paga solo en un trabajo'],
    quoteSection: 'Cotización Instantánea',
    quoteSectionTitle: '¿Cuánto Vale el Trabajo?',
    quoteSectionSub: 'Obtén un estimado en 30 segundos. Nuestra IA está entrenada en precios reales de plomería en tu mercado.',
    step1: 'Seleccionar Servicio',
    step2: 'Describir el Trabajo',
    step3: 'Tu Información',
    step1sub: '¿Qué necesita el propietario?',
    step2sub: 'Más detalle = mejor estimado',
    step3sub: '¿Dónde enviamos la cotización?',
    detailsPlaceholder: 'ej. Calentador de gas 40 galones, 10 años, gotea por abajo. Casa en Phoenix, AZ.',
    namePlaceholder: 'Tu nombre',
    phonePlaceholder: 'Número de teléfono',
    emailPlaceholder: 'Correo electrónico',
    locationPlaceholder: 'Ciudad, Estado',
    generating: 'Generando tu estimado...',
    estimateTitle: 'Tu Estimado',
    nextSteps: 'Próximos Pasos Sugeridos',
    getQuote: 'Obtener Mi Estimado →',
    startOver: 'Empezar de Nuevo',
    leadScoreLabel: 'Puntuación del Lead',
    crossSellLabel: 'Oportunidades de Venta',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PhoneMockup: React.FC = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(0), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)',
        borderRadius: 20, padding: '4px 14px', fontSize: 11,
        color: '#F5A623', fontWeight: 700, letterSpacing: 1, marginBottom: 20,
      }}>
        LIVE LEAD RESPONSE
      </div>
      <div style={{
        width: 280, background: '#1A1A1A', border: '2px solid #333',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 0 60px rgba(245,166,35,0.15)',
        margin: '0 auto',
      }}>
        <div style={{ background: '#222', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #333' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#000' }}>PL</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>PlumbLead.ai</div>
            <div style={{ fontSize: 11, color: '#4CAF50' }}>● Active Now</div>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 280 }}>
          <div style={{ background: '#2A2A2A', color: '#DDD', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13, lineHeight: 1.4, maxWidth: 200 }}>
            Hi, my water heater is leaking. How much to replace it?
          </div>
          <div style={{ fontSize: 10, color: '#5C5A53' }}>Homeowner – 2:14 PM</div>
          {phase === 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px', background: '#2A2A2A', borderRadius: '4px 12px 12px 12px', width: 'fit-content' }}>
              {[0, 200, 400].map((d, i) => (
                <div key={i} style={{ width: 6, height: 6, background: '#5C5A53', borderRadius: '50%', animation: `bounce 1.2s ${d}ms infinite` }} />
              ))}
            </div>
          )}
          {phase >= 2 && (
            <>
              <div style={{ background: '#F5A623', color: '#000', borderRadius: '12px 4px 12px 12px', padding: '10px 14px', fontSize: 13, lineHeight: 1.4, maxWidth: 210, alignSelf: 'flex-end', fontWeight: 600 }}>
                Replacement typically runs $1,200–$1,800 for a standard 40-gal unit. Can we schedule a same-day assessment?
              </div>
              <div style={{ fontSize: 10, color: '#5C5A53', textAlign: 'right', alignSelf: 'flex-end' }}>PlumbLead.ai – 2:14 PM</div>
            </>
          )}
          {phase >= 3 && (
            <div style={{ background: '#2A2A2A', color: '#DDD', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13, lineHeight: 1.4, maxWidth: 180 }}>
              Yes please! When can you come?
            </div>
          )}
        </div>
        <div style={{ height: 3, background: '#222', margin: '0 16px', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#F5A623',
            width: phase >= 2 ? '100%' : '0%',
            transition: 'width 1.6s ease',
          }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#F5A623', fontWeight: 700, letterSpacing: 1, padding: '10px 16px 16px', background: 'rgba(245,166,35,0.05)' }}>
          Response in 47 seconds
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
};

// ─── Quote Tool ───────────────────────────────────────────────────────────────

const QuoteTool: React.FC<{ lang: 'en' | 'es' }> = ({ lang }) => {
  const t = T[lang];
  const services = lang === 'es' ? SERVICES_ES : SERVICES;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<QuoteFormData>({
    serviceType: '', details: '', location: '',
    name: '', phone: '', email: '', language: lang,
  });

  const updateForm = (field: keyof QuoteFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: lang }),
      });
      if (!res.ok) throw new Error('Server error');
      const data: QuoteResult = await res.json();
      setResult(data);
      setStep(4);
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...data, timestamp: new Date().toISOString() }),
      });
    } catch {
      setError('Unable to generate quote right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep(1); setResult(null); setError(null); setForm({ serviceType: '', details: '', location: '', name: '', phone: '', email: '', language: lang }); };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', fontSize: 15,
    border: '2px solid #E8E6DF', background: '#FFF',
    fontFamily: 'DM Sans, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', color: '#0D0D0D',
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#5C5A53', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 8 };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {step < 4 && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', height: 4, background: step >= s ? '#F5A623' : '#E8E6DF', transition: 'background 0.3s' }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: step >= s ? '#C4841A' : '#9E9B91', textTransform: 'uppercase', letterSpacing: 1 }}>
                {s === 1 ? t.step1 : s === 2 ? t.step2 : t.step3}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div>
          <p style={{ fontSize: 15, color: '#5C5A53', marginBottom: 20 }}>{t.step1sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {services.map((svc, i) => (
              <button key={i} onClick={() => { updateForm('serviceType', SERVICES[i]); setStep(2); }}
                style={{
                  padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600,
                  border: form.serviceType === SERVICES[i] ? '2px solid #F5A623' : '2px solid #E8E6DF',
                  background: form.serviceType === SERVICES[i] ? '#FFF3D6' : '#FFF',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
                  color: '#0D0D0D',
                }}>
                {svc}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ fontSize: 15, color: '#5C5A53', marginBottom: 20 }}>{t.step2sub}</p>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Job Details</label>
            <textarea value={form.details} onChange={e => updateForm('details', e.target.value)} placeholder={t.detailsPlaceholder} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>Location</label>
            <input type="text" value={form.location} onChange={e => updateForm('location', e.target.value)} placeholder={t.locationPlaceholder} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={{ padding: '14px 24px', border: '2px solid #E8E6DF', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#5C5A53' }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={!form.details.trim() || !form.location.trim()} style={{ flex: 1, padding: '14px 24px', background: form.details.trim() && form.location.trim() ? '#F5A623' : '#E8E6DF', border: 'none', fontWeight: 700, fontSize: 15, cursor: form.details.trim() && form.location.trim() ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', color: form.details.trim() && form.location.trim() ? '#000' : '#9E9B91', transition: 'all 0.2s' }}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ fontSize: 15, color: '#5C5A53', marginBottom: 20 }}>{t.step3sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder={t.namePlaceholder} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder={t.phonePlaceholder} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder={t.emailPlaceholder} style={{ ...inputStyle, width: '100%' }} />
          </div>
          {error && <div style={{ background: '#FCEBEB', border: '1px solid #F09595', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#A32D2D' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(2)} style={{ padding: '14px 24px', border: '2px solid #E8E6DF', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#5C5A53' }}>← Back</button>
            <button onClick={handleSubmit} disabled={loading || !form.name.trim() || !form.phone.trim() || !form.email.trim()} style={{ flex: 1, padding: '14px 24px', background: (!loading && form.name.trim() && form.phone.trim() && form.email.trim()) ? '#F5A623' : '#E8E6DF', border: 'none', fontWeight: 700, fontSize: 15, cursor: (!loading && form.name.trim() && form.phone.trim() && form.email.trim()) ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', color: (!loading && form.name.trim() && form.phone.trim() && form.email.trim()) ? '#000' : '#9E9B91' }}>
              {loading ? t.generating : t.getQuote}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#9E9B91', marginTop: 12, textAlign: 'center' }}>Your info is only shared with the contractor. No spam, ever.</p>
        </div>
      )}

      {step === 4 && result && (
        <div>
          <div style={{ background: '#0D0D0D', color: '#FFF', padding: '32px 36px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#F5A623', fontWeight: 700, marginBottom: 8 }}>{t.estimateTitle}</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 72, lineHeight: 1, color: '#F5A623', marginBottom: 16 }}>{result.estimateRange}</div>
            <p style={{ fontSize: 15, color: '#9E9B91', lineHeight: 1.7 }}>{result.personalizedMessage}</p>
          </div>
          {result.suggestedNextSteps?.length > 0 && (
            <div style={{ background: '#F5F4F0', padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#C4841A', fontWeight: 700, marginBottom: 16 }}>{t.nextSteps}</div>
              {result.suggestedNextSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontSize: 14, color: '#5C5A53', lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          )}
          {result.leadScore && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, padding: '12px 16px', border: '1px solid #E8E6DF' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9E9B91', textTransform: 'uppercase', letterSpacing: 1 }}>{t.leadScoreLabel}:</span>
              <span style={{ background: '#F5A623', color: '#000', padding: '3px 12px', fontSize: 13, fontWeight: 700 }}>{result.leadScore}</span>
            </div>
          )}
          {result.crossSellOpportunities?.length > 0 && (
            <div style={{ padding: '16px', border: '1px solid #E8E6DF', marginBottom: 24 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#C4841A', fontWeight: 700, marginBottom: 8 }}>{t.crossSellLabel}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.crossSellOpportunities.map((o, i) => (
                  <span key={i} style={{ background: '#FFF3D6', color: '#7A5810', padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{o}</span>
                ))}
              </div>
            </div>
          )}
          <button onClick={reset} style={{ width: '100%', padding: '14px', border: '2px solid #0D0D0D', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#0D0D0D' }}>
            {t.startOver}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = T[lang];
  const quoteRef = useRef<HTMLElement>(null);

  const scrollToQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    quoteRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; color: #0D0D0D; }
        html { scroll-behavior: smooth; }
        input:focus, textarea:focus { border-color: #F5A623 !important; outline: none; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: '#F5A623', padding: '10px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 14, fontWeight: 700, color: '#0D0D0D' }}>
        <span style={{ width: 8, height: 8, background: '#0D0D0D', borderRadius: '50%', display: 'inline-block' }} />
        {t.topbar}
        <span style={{ width: 8, height: 8, background: '#0D0D0D', borderRadius: '50%', display: 'inline-block' }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? '#0D0D0D' : 'transparent', color: lang === 'en' ? '#F5A623' : '#7A5810', border: '1px solid #7A5810', padding: '2px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>EN</button>
          <button onClick={() => setLang('es')} style={{ background: lang === 'es' ? '#0D0D0D' : 'transparent', color: lang === 'es' ? '#F5A623' : '#7A5810', border: '1px solid #7A5810', padding: '2px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>ES</button>
        </div>
      </div>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0D0D0D', borderBottom: '3px solid #F5A623', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: 64 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#F5A623', letterSpacing: 1 }}>
          Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[['#how', t.nav.howIt], ['#compare', t.nav.compare], ['#pricing', t.nav.pricing], ['#faq', t.nav.faq]].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#9E9B91', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{label}</a>
          ))}
        </div>
        <a href="#quote" onClick={scrollToQuote} style={{ background: '#F5A623', color: '#0D0D0D', fontWeight: 700, fontSize: 14, padding: '10px 20px', textDecoration: 'none', letterSpacing: 0.5 }}>
          {t.nav.cta}
        </a>
      </nav>

      {/* HERO */}
      <section style={{ background: '#0D0D0D', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 620, borderBottom: '4px solid #F5A623' }}>
        <div style={{ padding: '80px 60px 80px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '2px solid #222' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1A1A', border: '1px solid #333', borderLeft: '3px solid #F5A623', padding: '6px 14px', fontSize: 12, color: '#9E9B91', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 24, width: 'fit-content' }}>
            {t.eyebrow}
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 88, lineHeight: 0.92, color: '#FFF', textTransform: 'uppercase', marginBottom: 16 }}>
            {t.hero1}<br />
            <span style={{ position: 'relative', color: '#555' }}>
              {t.hero2}
              <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: '#D83030', transform: 'translateY(-50%)', display: 'block' }} />
            </span><br />
            <span style={{ color: '#F5A623' }}>{t.hero3}</span><br />
            {t.hero4}
          </h1>
          <p style={{ fontSize: 18, color: '#9E9B91', marginBottom: 36, lineHeight: 1.5, maxWidth: 420 }}>
            {t.heroSub.split('$3,200').map((part, i) => i === 0 ? part : <React.Fragment key={i}><strong style={{ color: '#FFF' }}>$3,200</strong>{part}</React.Fragment>)}
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#quote" onClick={scrollToQuote} style={{ background: '#F5A623', color: '#0D0D0D', fontWeight: 700, fontSize: 16, padding: '16px 32px', textDecoration: 'none', letterSpacing: 0.5 }}>
              {t.heroCta}
            </a>
            <a href="#how" style={{ background: 'transparent', color: '#9E9B91', fontWeight: 500, fontSize: 15, padding: '16px 24px', border: '1px solid #333', textDecoration: 'none' }}>
              {t.heroSecondary}
            </a>
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {t.trust.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9E9B91', fontWeight: 500 }}>
                <span style={{ color: '#F5A623' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '60px 60px 60px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          <PhoneMockup />
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: '#F5A623', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '4px solid #0D0D0D' }}>
        {[
          { num: '78%', label: 'Jobs Won by First Responder', sub: 'Speed isn\'t just nice — it\'s the job' },
          { num: '2hrs', label: 'Average Response Time', sub: 'That\'s how slow your competition is' },
          { num: '$3,200', label: 'Average Job Value Lost', sub: 'Per missed lead, every single time' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '40px', borderRight: i < 2 ? '3px solid rgba(0,0,0,0.15)' : 'none', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 64, color: '#0D0D0D', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B4D0A', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: '#7A5810', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* VS TABLE */}
      <section id="compare" style={{ background: '#0D0D0D', padding: '80px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#F5A623', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#F5A623' }} /> Head-to-Head
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, lineHeight: 1, textTransform: 'uppercase', color: '#FFF', marginBottom: 40 }}>
          Why Contractors <span style={{ color: '#F5A623' }}>Switch</span>
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Feature', 'PlumbLead.ai', 'Answering Service', 'DIY / In-House'].map((h, i) => (
                <th key={i} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, borderBottom: '3px solid #F5A623', color: i === 1 ? '#F5A623' : '#5C5A53' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Response time', 'Under 60 seconds', '2–5 minutes', 'Hours (if at all)', true],
              ['Available 24/7', '✓ Always on', 'Depends on plan', '✗ You sleep', false],
              ['AI quote estimates', '✓ Instant, accurate', '✗ None', '✗ None', true],
              ['Lead qualification', '✓ Automatic', '✗ None', 'Manual, inconsistent', false],
              ['CRM / n8n routing', '✓ Native integration', '✗ No', '✗ Custom dev required', true],
              ['Bilingual EN + ES', '✓ Auto-detects', 'Extra cost', 'Depends on staff', false],
              ['Monthly cost', 'From $97/mo', '$300–$800/mo', 'Your time × $$$', true],
              ['Contract required', '✗ None. Cancel anytime', 'Usually 12 months', 'N/A', false],
            ].map(([feature, pl, ans, diy, highlight], i) => (
              <tr key={i} style={{ background: highlight ? 'rgba(245,166,35,0.04)' : 'transparent' }}>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid #222', color: '#9E9B91', fontWeight: 500, fontSize: 15 }}>{feature}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid #222', color: '#4CAF50', fontWeight: 700, fontSize: 15 }}>{pl}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid #222', color: String(ans).includes('✗') ? '#E57373' : '#5C5A53', fontSize: 15 }}>{ans}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid #222', color: String(diy).includes('✗') ? '#E57373' : '#5C5A53', fontSize: 15 }}>{diy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: '#F5F4F0', padding: '80px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#C4841A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#F5A623' }} /> The Process
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, lineHeight: 1, textTransform: 'uppercase', marginBottom: 40 }}>
          Three Steps. <span style={{ color: '#C4841A' }}>Zero</span> Missed Leads.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { num: '01', icon: '📲', title: 'Lead Lands', body: 'A homeowner submits a request or calls after-hours. PlumbLead captures it instantly — no missed calls, no lost form submissions.' },
            { num: '02', icon: '⚡', title: 'AI Qualifies', body: 'Our AI assesses urgency, generates a ballpark estimate, and responds to the homeowner in under 60 seconds. Bilingual. Professional. On-brand.' },
            { num: '03', icon: '💰', title: 'You Close', body: 'The qualified lead — with urgency score, quote data, and full context — lands in your CRM or phone. You show up prepared to close.' },
          ].map((step, i) => (
            <div key={i} style={{ padding: 40, border: '2px solid #E8E6DF', background: '#FFF', borderRight: i < 2 ? 'none' : '2px solid #E8E6DF', position: 'relative' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 80, color: '#F0EDE4', lineHeight: 1, marginBottom: 16 }}>{step.num}</div>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{step.icon}</div>
              <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, textTransform: 'uppercase', marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 15, color: '#5C5A53', lineHeight: 1.6 }}>{step.body}</p>
              {i < 2 && (
                <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, zIndex: 10 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <div style={{ background: '#0D0D0D', padding: '80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#F5A623', fontSize: 18, letterSpacing: 2, marginBottom: 24 }}>★ ★ ★ ★ ★</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 120, color: '#F5A623', lineHeight: 0.5, marginBottom: 20 }}>&quot;</div>
          <p style={{ fontSize: 26, color: '#FFF', lineHeight: 1.4, marginBottom: 32 }}>
            We were losing probably 4–5 jobs a week to guys who answered faster. PlumbLead paid for itself in the first 48 hours. Now my guys just show up and close.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#000' }}>MR</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#FFF', fontSize: 16 }}>Mike R.</div>
              <div style={{ fontSize: 13, color: '#5C5A53' }}>Owner, Reliable Plumbing Services — Phoenix, AZ</div>
            </div>
          </div>
        </div>
      </div>

      {/* QUOTE TOOL */}
      <section ref={quoteRef} id="quote" style={{ background: '#FFF', padding: '80px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#C4841A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#F5A623' }} /> {t.quoteSection}
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, lineHeight: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          {t.quoteSectionTitle}
        </h2>
        <p style={{ fontSize: 18, color: '#5C5A53', marginBottom: 48, maxWidth: 560 }}>{t.quoteSectionSub}</p>
        <QuoteTool lang={lang} />
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#F5F4F0', padding: '80px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#C4841A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#F5A623' }} /> Pricing
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, lineHeight: 1, textTransform: 'uppercase', marginBottom: 40 }}>
          One Job Pays For <span style={{ color: '#C4841A' }}>Six Months</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { tier: 'Starter', price: '$97', features: ['AI chat widget (200 leads/mo)', 'Instant quote estimates', 'Email lead delivery', 'English only', 'Standard response templates'], featured: false },
            { tier: 'Pro', price: '$197', features: ['Unlimited leads', 'AI quote + lead scoring', 'CRM / n8n webhook routing', 'English + Spanish (auto)', 'Custom AI branding', 'Priority support'], featured: true },
            { tier: 'Agency', price: '$497', features: ['Up to 5 contractor accounts', 'White-label dashboard', 'Everything in Pro ×5', 'Reseller margin included', 'Dedicated onboarding call'], featured: false },
          ].map((plan, i) => (
            <div key={i} style={{ padding: '40px 36px', border: plan.featured ? '3px solid #F5A623' : '2px solid #E8E6DF', background: plan.featured ? '#0D0D0D' : '#FFF', position: 'relative', transform: plan.featured ? 'scaleY(1.02)' : 'none', zIndex: plan.featured ? 2 : 1, borderRight: !plan.featured && i === 0 ? 'none' : undefined, borderLeft: !plan.featured && i === 2 ? 'none' : undefined }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#F5A623', color: '#000', fontWeight: 700, fontSize: 11, padding: '4px 16px', letterSpacing: 1.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>
              )}
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: plan.featured ? '#F5A623' : '#9E9B91', marginBottom: 12 }}>{plan.tier}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 64, lineHeight: 1, color: plan.featured ? '#FFF' : '#0D0D0D', marginBottom: 4 }}>{plan.price}</div>
              <div style={{ fontSize: 14, color: '#9E9B91', marginBottom: 24 }}>per month</div>
              <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ padding: '8px 0', fontSize: 14, borderBottom: `1px solid ${plan.featured ? '#333' : '#E8E6DF'}`, display: 'flex', gap: 10, alignItems: 'flex-start', color: plan.featured ? '#9E9B91' : '#0D0D0D' }}>
                    <span style={{ color: '#F5A623', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => quoteRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'block', width: '100%', padding: 14, background: plan.featured ? '#F5A623' : 'transparent', border: plan.featured ? 'none' : '2px solid #0D0D0D', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: plan.featured ? '#000' : '#0D0D0D', transition: 'all 0.2s' }}>
                Start Free Trial →
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#9E9B91' }}>14-day free trial · No credit card required · Cancel anytime</p>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: '#FFF', padding: '80px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#C4841A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'block', width: 24, height: 2, background: '#F5A623' }} /> Common Questions
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, lineHeight: 1, textTransform: 'uppercase', marginBottom: 40 }}>
          No <span style={{ color: '#C4841A' }}>Surprises.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            ['How long does setup take?', 'Under 30 minutes. You get a chat widget snippet — paste it on your site and you\'re live. No developer required. We handle your n8n webhook config on Pro.'],
            ['Do I need to write scripts or train the AI?', 'No. The AI comes trained on plumbing services, pricing ranges, and technical knowledge out of the box. Pro users can customize tone in a simple settings page.'],
            ['What happens after the AI talks to the lead?', 'Full conversation, lead score, quote estimate, and contact details go to your email, CRM, or n8n workflow. You get context to close — not just a name and number.'],
            ['Does it work for Spanish-speaking customers?', 'Yes. The AI auto-detects language from the homeowner\'s first message and responds in kind. No configuration needed. Full bilingual on Pro plan.'],
            ['Can I cancel at any time?', 'Yes. Month-to-month, no contracts. Cancel from your dashboard. We don\'t lock you in because we don\'t need to — the ROI keeps contractors from leaving.'],
            ['What if the AI gives the wrong estimate?', 'The AI provides ballpark ranges with a disclaimer that final pricing is confirmed by you. It\'s designed to qualify and engage — not to replace your expertise.'],
          ].map(([q, a], i) => (
            <FaqItem key={i} question={q} answer={a} index={i} />
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <div style={{ background: '#F5A623', padding: '80px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 40, borderTop: '4px solid #0D0D0D' }}>
        <div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 56, textTransform: 'uppercase', lineHeight: 1, color: '#0D0D0D' }}>
            The Next Lead Lands<br />In 3 Minutes.
          </h2>
          <p style={{ fontSize: 18, color: '#7A5810', marginTop: 8 }}>Will it be the last one you miss?</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', minWidth: 260 }}>
          <a href="#quote" onClick={scrollToQuote} style={{ background: '#0D0D0D', color: '#F5A623', fontWeight: 700, fontSize: 18, padding: '20px 40px', textDecoration: 'none', display: 'block', textAlign: 'center', width: '100%', letterSpacing: 0.5 }}>
            Start Free Trial →
          </a>
          <span style={{ fontSize: 12, color: '#7A5810', fontWeight: 600 }}>14-day free trial · No credit card</span>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#0D0D0D', padding: '40px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#F5A623' }}>
          Plumb<span style={{ color: '#FFF' }}>Lead</span>.ai
        </div>
        <p style={{ fontSize: 13, color: '#5C5A53' }}>© 2026 PlumbLead.ai · Built for contractors who answer fast and close hard.</p>
        <p style={{ fontSize: 12, color: '#444' }}>Privacy · Terms</p>
      </footer>
    </>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FaqItem: React.FC<{ question: string; answer: string; index: number }> = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);
  const isRight = index % 2 === 1;
  return (
    <div onClick={() => setOpen(!open)} style={{ padding: 32, border: '1px solid #E8E6DF', background: open ? '#FFF3D6' : '#FFF', cursor: 'pointer', borderRight: !isRight ? 'none' : '1px solid #E8E6DF', transition: 'background 0.2s' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: open ? 12 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        {question}
        <span style={{ color: '#F5A623', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
      </div>
      <div style={{ overflow: 'hidden', maxHeight: open ? 300 : 0, transition: 'max-height 0.3s ease' }}>
        <p style={{ fontSize: 14, color: '#5C5A53', lineHeight: 1.6, paddingTop: 4 }}>{answer}</p>
      </div>
    </div>
  );
};

export default LandingPage;
