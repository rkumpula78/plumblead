import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteState {
  currentStep: number;
  service: string;
  serviceLabel: string;
  urgency: 'emergency' | 'soon' | 'routine';
  details: string;
  zipCode: string;
  preferredTime: 'ASAP' | 'Morning' | 'Afternoon' | 'Evening';
  name: string;
  phone: string;
  email: string;
  language: 'en' | 'es';
}

interface PriceRange {
  low: number;
  high: number;
  label: string;
}

interface AIQuoteResult {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
  leadScore?: string;
  crossSellOpportunities?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_RANGES: Record<string, PriceRange> = {
  'emergency-leak': { low: 150, high: 800, label: 'Emergency / Leak Repair' },
  'drain-cleaning': { low: 150, high: 400, label: 'Drain Cleaning' },
  'water-heater-tank': { low: 1200, high: 3500, label: 'Water Heater (Tank)' },
  'water-heater-tankless': { low: 2500, high: 5000, label: 'Water Heater (Tankless)' },
  'faucet-fixture': { low: 150, high: 500, label: 'Faucet / Fixture Install' },
  'toilet': { low: 150, high: 600, label: 'Toilet Repair / Replace' },
  'garbage-disposal': { low: 200, high: 500, label: 'Garbage Disposal' },
  'sewer-line': { low: 1500, high: 7000, label: 'Sewer Line Repair' },
  'slab-leak': { low: 2000, high: 5000, label: 'Slab Leak Repair' },
  'repipe': { low: 4000, high: 15000, label: 'Whole House Repipe' },
  'gas-line': { low: 300, high: 1500, label: 'Gas Line Work' },
  'water-softener': { low: 800, high: 3000, label: 'Water Softener Install' },
  'filtration': { low: 300, high: 2000, label: 'Water Filtration / RO System' },
  'water-test': { low: 0, high: 0, label: 'Free Water Quality Report' }
};

const SERVICES = [
  { key: 'emergency-leak', icon: '🚨', label: 'Emergency / Leak', priceHint: '$150 – $800' },
  { key: 'drain-cleaning', icon: '🚿', label: 'Drain Cleaning', priceHint: '$150 – $400' },
  { key: 'water-heater-tank', icon: '🔥', label: 'Water Heater (Tank)', priceHint: '$1,200 – $3,500' },
  { key: 'water-heater-tankless', icon: '⚡', label: 'Water Heater (Tankless)', priceHint: '$2,500 – $5,000' },
  { key: 'toilet', icon: '🚽', label: 'Toilet Repair/Replace', priceHint: '$150 – $600' },
  { key: 'faucet-fixture', icon: '🔧', label: 'Faucet / Fixture', priceHint: '$150 – $500' },
  { key: 'garbage-disposal', icon: '♻️', label: 'Garbage Disposal', priceHint: '$200 – $500' },
  { key: 'sewer-line', icon: '🏗️', label: 'Sewer Line', priceHint: '$1,500 – $7,000' },
  { key: 'slab-leak', icon: '💧', label: 'Slab Leak', priceHint: '$2,000 – $5,000' },
  { key: 'gas-line', icon: '🔥', label: 'Gas Line Work', priceHint: '$300 – $1,500' },
  { key: 'repipe', icon: '🏠', label: 'Whole House Repipe', priceHint: '$4,000 – $15,000' },
  { key: 'water-softener', icon: '💎', label: 'Water Softener', priceHint: '$800 – $3,000' },
  { key: 'water-test', icon: '🧪', label: 'Free Water Quality Report', priceHint: 'FREE — Enter Your Zip', highlight: true },
  { key: 'filtration', icon: '🚰', label: 'Water Filtration / RO', priceHint: '$300 – $2,000' },
];

const SERVICES_ES: Record<string, string> = {
  'emergency-leak': 'Emergencia / Fuga',
  'drain-cleaning': 'Limpieza de Drenaje',
  'water-heater-tank': 'Calentador (Tanque)',
  'water-heater-tankless': 'Calentador (Sin Tanque)',
  'toilet': 'Reparar/Cambiar Inodoro',
  'faucet-fixture': 'Grifo / Accesorio',
  'garbage-disposal': 'Triturador de Basura',
  'sewer-line': 'Línea de Alcantarillado',
  'slab-leak': 'Fuga en Losa',
  'gas-line': 'Línea de Gas',
  'repipe': 'Reinstalación de Tubería',
  'water-softener': 'Ablandador de Agua',
  'water-test': 'Informe de Calidad del Agua GRATIS',
  'filtration': 'Filtración de Agua / Ósmosis'
};

const T = {
  en: {
    mainTitle: 'Get Your Instant Estimate',
    mainSubtitle: 'Answer a few quick questions — see your price in 60 seconds',
    step1: 'Step 1 of 4',
    step2: 'Step 2 of 4',
    step3: 'Step 3 of 4',
    step4: 'Step 4 of 4',
    whatNeed: 'What do you need help with?',
    fewDetails: 'A few more details',
    urgencyQ: 'How urgent is this?',
    emergency: 'Emergency',
    emergencyDesc: 'Need help NOW',
    thisWeek: 'This Week',
    thisWeekDesc: 'Within a few days',
    flexible: 'Flexible',
    flexibleDesc: 'Just need a quote',
    detailsLabel: 'Anything else we should know? (optional)',
    detailsPlaceholder: 'e.g., Water heater is in the garage, 15 years old, starting to leak from the bottom...',
    zipLabel: 'Your zip code',
    seeEstimate: 'See My Estimate →',
    back: '← Back',
    estimateFor: 'Estimated cost for',
    basedOn: 'Based on typical jobs in your area',
    licensed: 'Licensed & Insured',
    noObligation: 'No obligation',
    getExact: 'Get your exact price — we\'ll text you in under 60 seconds',
    nameLabel: 'Your name',
    phoneLabel: 'Phone number',
    emailLabel: 'Email (optional)',
    timeLabel: 'Preferred time',
    submitBtn: 'Get My Exact Quote 🔒',
    successTitle: 'You\'re all set!',
    successMsg: 'We\'re reviewing your request right now.<br/>Expect a text within:',
    seconds: 'seconds',
    successFooter: 'Check your phone for a text from us with your personalized quote and next steps.',
    waterNudge: 'Don\'t forget — your FREE water quality report!',
    waterNudgeSub: 'Submit your info and we\'ll include a detailed water report for your zip code.',
    timeASAP: 'ASAP',
    timeMorning: 'Morning',
    timeAfternoon: 'Afternoon',
    timeEvening: 'Evening',
    loadingQuote: 'Generating your AI estimate...',
    aiQuoteLabel: 'AI-Powered Estimate',
    whyRange: 'Why a range?',
    whyRangeText: 'Final price depends on site conditions, parts, and local labor rates.',
    nextSteps: 'Suggested next steps:',
    crossSell: 'You might also need:',
    quoteError: 'Could not load AI estimate. Showing typical range.',
  },
  es: {
    mainTitle: 'Obtenga Su Presupuesto Instantáneo',
    mainSubtitle: 'Responda algunas preguntas — vea su precio en 60 segundos',
    step1: 'Paso 1 de 4',
    step2: 'Paso 2 de 4',
    step3: 'Paso 3 de 4',
    step4: 'Paso 4 de 4',
    whatNeed: '¿Qué necesita?',
    fewDetails: 'Algunos detalles más',
    urgencyQ: '¿Qué tan urgente es?',
    emergency: 'Emergencia',
    emergencyDesc: 'Necesito ayuda AHORA',
    thisWeek: 'Esta Semana',
    thisWeekDesc: 'En unos días',
    flexible: 'Flexible',
    flexibleDesc: 'Solo necesito un presupuesto',
    detailsLabel: '¿Algo más que debamos saber? (opcional)',
    detailsPlaceholder: 'Ej: El calentador de agua está en el garaje, tiene 15 años, empieza a gotear...',
    zipLabel: 'Su código postal',
    seeEstimate: 'Ver Mi Presupuesto →',
    back: '← Atrás',
    estimateFor: 'Costo estimado para',
    basedOn: 'Basado en trabajos típicos en su área',
    licensed: 'Licenciado y Asegurado',
    noObligation: 'Sin compromiso',
    getExact: 'Obtenga su precio exacto — le enviaremos un mensaje en menos de 60 segundos',
    nameLabel: 'Su nombre',
    phoneLabel: 'Número de teléfono',
    emailLabel: 'Correo electrónico (opcional)',
    timeLabel: 'Horario preferido',
    submitBtn: 'Obtener Mi Presupuesto Exacto 🔒',
    successTitle: '¡Todo listo!',
    successMsg: 'Estamos revisando su solicitud.<br/>Espere un mensaje en:',
    seconds: 'segundos',
    successFooter: 'Revise su teléfono para un mensaje de nosotros con su presupuesto personalizado.',
    waterNudge: '¡No olvide su informe GRATUITO de calidad del agua!',
    waterNudgeSub: 'Envíe su información y le incluiremos un informe detallado del agua para su código postal.',
    timeASAP: 'Lo antes posible',
    timeMorning: 'Mañana',
    timeAfternoon: 'Tarde',
    timeEvening: 'Noche',
    loadingQuote: 'Generando su estimado con IA...',
    aiQuoteLabel: 'Estimado con Inteligencia Artificial',
    whyRange: '¿Por qué un rango?',
    whyRangeText: 'El precio final depende de las condiciones del sitio, piezas y tarifas locales.',
    nextSteps: 'Próximos pasos sugeridos:',
    crossSell: 'También podría necesitar:',
    quoteError: 'No se pudo cargar el estimado. Mostrando rango típico.',
  }
};

const API_BASE = 'https://plumblead-production.up.railway.app';

// ─── Main Component ───────────────────────────────────────────────────────────

const QuoteTool: React.FC = () => {
  const [state, setState] = useState<QuoteState>({
    currentStep: 1,
    service: '',
    serviceLabel: '',
    urgency: 'routine',
    details: '',
    zipCode: '',
    preferredTime: 'ASAP',
    name: '',
    phone: '',
    email: '',
    language: 'en'
  });

  const [countdown, setCountdown] = useState(60);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aiQuote, setAiQuote] = useState<AIQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);

  const t = T[state.language];

  const goToStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectService = (key: string, label: string) => {
    setState(prev => ({ ...prev, service: key, serviceLabel: PRICE_RANGES[key]?.label || label }));
    setTimeout(() => goToStep(2), 300);
  };

  const selectUrgency = (urgency: 'emergency' | 'soon' | 'routine') => {
    setState(prev => ({ ...prev, urgency }));
  };

  const selectTime = (time: 'ASAP' | 'Morning' | 'Afternoon' | 'Evening') => {
    setState(prev => ({ ...prev, preferredTime: time }));
  };

  // Fetch AI quote as soon as user moves to step 3
  const fetchAIQuote = async (currentState: QuoteState) => {
    setQuoteLoading(true);
    setQuoteError(false);
    setAiQuote(null);
    try {
      const res = await fetch(`${API_BASE}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: currentState.serviceLabel || currentState.service,
          details: currentState.details || currentState.serviceLabel,
          location: currentState.zipCode || 'unknown',
          language: currentState.language,
        }),
      });
      if (!res.ok) throw new Error('Quote API error');
      const data: AIQuoteResult = await res.json();
      setAiQuote(data);
    } catch (err) {
      console.error('AI quote fetch error:', err);
      setQuoteError(true);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSeeEstimate = () => {
    const nextState = { ...state };
    goToStep(3);
    fetchAIQuote(nextState);
  };

  const submitLead = async () => {
    if (!state.name.trim() || !state.phone.trim()) {
      alert('Please enter your name and phone number');
      return;
    }
    if (state.phone.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setSubmitLoading(true);

    const payload = {
      name: state.name,
      phone: state.phone,
      email: state.email,
      service: state.service,
      serviceLabel: state.serviceLabel,
      urgency: state.urgency,
      details: state.details || '',
      zipCode: state.zipCode || '',
      preferredTime: state.preferredTime,
      estimateRange: aiQuote?.estimateRange || '',
      leadScore: aiQuote?.leadScore || '',
      source: 'quote-tool',
      campaign: '',
      clientId: 'demo',
      clientName: 'Your Local Plumber',
      lang: state.language,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Fire /api/leads to forward to n8n — this is the primary lead capture
      await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Lead submit error:', err);
      // Non-blocking — proceed to success even if n8n webhook fails
    }

    setSubmitLoading(false);
    goToStep(4);
    startCountdown();
  };

  const startCountdown = () => {
    let seconds = 60;
    const timer = setInterval(() => {
      seconds--;
      setCountdown(seconds);
      if (seconds <= 0) clearInterval(timer);
    }, 1000);
  };

  const priceRange = PRICE_RANGES[state.service];
  const displayRange = aiQuote?.estimateRange || (priceRange ? `$${priceRange.low.toLocaleString()} – $${priceRange.high.toLocaleString()}` : '');

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 0 }}>
          <button
            onClick={() => setState(prev => ({ ...prev, language: 'en' }))}
            style={{
              padding: '4px 10px',
              border: '2px solid #0ea5e9',
              background: state.language === 'en' ? '#0ea5e9' : '#fff',
              color: state.language === 'en' ? '#fff' : '#0ea5e9',
              borderRadius: '4px 0 0 4px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            English
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, language: 'es' }))}
            style={{
              padding: '4px 10px',
              border: '2px solid #0ea5e9',
              background: state.language === 'es' ? '#0ea5e9' : '#fff',
              color: state.language === 'es' ? '#fff' : '#0ea5e9',
              borderRadius: '0 4px 4px 0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            Español
          </button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Your Local Plumber
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
          {t.mainTitle}
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', marginTop: 8 }}>
          {t.mainSubtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              background: state.currentStep > i ? '#10b981' : state.currentStep === i ? '#0ea5e9' : '#e2e8f0',
              borderRadius: 2,
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>

      {/* Step 1: Service Selection */}
      {state.currentStep === 1 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            {t.step1}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t.whatNeed}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {SERVICES.map(svc => (
              <div
                key={svc.key}
                onClick={() => selectService(svc.key, svc.label)}
                style={{
                  background: svc.highlight ? '#f0f9ff' : '#fff',
                  border: svc.highlight ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0ea5e9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = svc.highlight ? '#0ea5e9' : '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{svc.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                  {state.language === 'es' ? (SERVICES_ES[svc.key] || svc.label) : svc.label}
                </div>
                <div style={{ fontSize: 12, color: svc.highlight ? '#10b981' : '#94a3b8', marginTop: 4, fontWeight: svc.highlight ? 700 : 400 }}>
                  {svc.priceHint}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details & Urgency */}
      {state.currentStep === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            {t.step2}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t.fewDetails}</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 10 }}>
              {t.urgencyQ}
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['emergency', 'soon', 'routine'] as const).map(u => (
                <div
                  key={u}
                  onClick={() => selectUrgency(u)}
                  style={{
                    flex: 1,
                    padding: 14,
                    border: state.urgency === u ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
                    background: state.urgency === u ? '#f0f9ff' : '#fff',
                    borderRadius: 8,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>
                    {u === 'emergency' ? '🚨' : u === 'soon' ? '📅' : '🕐'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    {u === 'emergency' ? t.emergency : u === 'soon' ? t.thisWeek : t.flexible}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {u === 'emergency' ? t.emergencyDesc : u === 'soon' ? t.thisWeekDesc : t.flexibleDesc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 10 }}>
              {t.detailsLabel}
            </label>
            <textarea
              value={state.details}
              onChange={e => setState(prev => ({ ...prev, details: e.target.value }))}
              placeholder={t.detailsPlaceholder}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 15,
                color: '#1e293b',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 10 }}>
              {t.zipLabel}
            </label>
            <input
              type="text"
              value={state.zipCode}
              onChange={e => setState(prev => ({ ...prev, zipCode: e.target.value }))}
              placeholder="85383"
              maxLength={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 15,
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSeeEstimate}
            style={{
              width: '100%',
              padding: 16,
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 8
            }}>
            {t.seeEstimate}
          </button>
          <button
            onClick={() => goToStep(1)}
            style={{
              width: '100%',
              padding: 12,
              background: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer'
            }}>
            {t.back}
          </button>
        </div>
      )}

      {/* Step 3: Quote Result + Lead Capture */}
      {state.currentStep === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            {t.step3}
          </div>

          {/* Quote Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {t.aiQuoteLabel}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              {priceRange?.label || state.serviceLabel}
            </div>

            {quoteLoading ? (
              <div style={{ padding: '24px 0' }}>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>{t.loadingQuote}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {[0, 150, 300].map((d, i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9',
                      animation: `bounce 1s ${d}ms infinite`
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#0ea5e9', lineHeight: 1, marginBottom: 4 }}>
                  {displayRange || '—'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                  {state.urgency === 'emergency' ? 'Emergency service may include after-hours rates' : t.basedOn}
                </div>

                {/* AI Personalized Message */}
                {aiQuote?.personalizedMessage && !quoteError && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', textAlign: 'left', marginBottom: 16, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                    {aiQuote.personalizedMessage}
                  </div>
                )}

                {quoteError && (
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, fontStyle: 'italic' }}>
                    {t.quoteError}
                  </div>
                )}

                {/* Suggested Next Steps */}
                {aiQuote?.suggestedNextSteps && aiQuote.suggestedNextSteps.length > 0 && (
                  <div style={{ textAlign: 'left', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      {t.nextSteps}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      {aiQuote.suggestedNextSteps.map((step, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#334155', marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Cross-sell */}
                {aiQuote?.crossSellOpportunities && aiQuote.crossSellOpportunities.length > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', textAlign: 'left', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      {t.crossSell}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiQuote.crossSellOpportunities.map((opp, i) => (
                        <span key={i} style={{ fontSize: 12, background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 4 }}>{opp}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lead score badge */}
                {aiQuote?.leadScore && (
                  <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: aiQuote.leadScore === 'Emergency' ? '#fef2f2' : aiQuote.leadScore === 'High Urgency' ? '#fffbeb' : '#f0f9ff',
                    color: aiQuote.leadScore === 'Emergency' ? '#dc2626' : aiQuote.leadScore === 'High Urgency' ? '#d97706' : '#0369a1',
                    border: `1px solid ${aiQuote.leadScore === 'Emergency' ? '#fecaca' : aiQuote.leadScore === 'High Urgency' ? '#fde68a' : '#bae6fd'}`
                  }}>
                    {aiQuote.leadScore}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12, color: '#64748b', marginTop: 16 }}>
              <span><span style={{ color: '#10b981' }}>✓</span> {t.licensed}</span>
              <span><span style={{ color: '#10b981' }}>✓</span> {t.noObligation}</span>
            </div>
          </div>

          {state.zipCode && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🧪</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{t.waterNudge}</div>
                <div style={{ fontSize: 13, color: '#15803d' }}>{t.waterNudgeSub}</div>
              </div>
            </div>
          )}

          {/* Lead Capture Form */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{t.getExact}</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{t.nameLabel}</label>
            <input
              type="text"
              value={state.name}
              onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Smith"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{t.phoneLabel}</label>
            <input
              type="tel"
              value={state.phone}
              onChange={e => setState(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(602) 555-1234"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{t.emailLabel}</label>
            <input
              type="email"
              value={state.email}
              onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@email.com"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>{t.timeLabel}</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(['ASAP', 'Morning', 'Afternoon', 'Evening'] as const).map(time => (
                <div
                  key={time}
                  onClick={() => selectTime(time)}
                  style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '12px 10px',
                    background: state.preferredTime === time ? '#f0f9ff' : '#fff',
                    border: state.preferredTime === time ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: state.preferredTime === time ? '#0369a1' : '#334155',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}>
                  {time === 'ASAP' ? t.timeASAP : time === 'Morning' ? t.timeMorning : time === 'Afternoon' ? t.timeAfternoon : t.timeEvening}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={submitLead}
            disabled={submitLoading}
            style={{
              width: '100%',
              padding: 16,
              background: submitLoading ? '#94a3b8' : '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: submitLoading ? 'not-allowed' : 'pointer',
              marginBottom: 8
            }}>
            {submitLoading ? 'Sending...' : t.submitBtn}
          </button>
          <button
            onClick={() => goToStep(2)}
            style={{
              width: '100%',
              padding: 12,
              background: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer'
            }}>
            {t.back}
          </button>
        </div>
      )}

      {/* Step 4: Success */}
      {state.currentStep === 4 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, color: '#10b981', marginBottom: 8 }}>{t.successTitle}</h2>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t.successMsg }} />
          <div style={{ fontSize: 48, fontWeight: 800, color: countdown > 0 ? '#0ea5e9' : '#10b981', margin: '24px 0' }}>
            {countdown > 0 ? countdown : '✓'}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>{t.seconds}</div>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 24 }}>{t.successFooter}</p>
        </div>
      )}

      {/* Powered By */}
      <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: '#cbd5e1' }}>
        Powered by <a href="https://plumblead.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>PlumbLead.ai</a>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default QuoteTool;
