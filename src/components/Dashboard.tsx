import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';
const ADMIN_KEY = 'plumblead-admin-2026';

const STRIPE_LINKS: Record<string, string> = {
  starter: 'https://buy.stripe.com/3cI4gz5HvejVevLcfrc3m03',
  pro:     'https://buy.stripe.com/eVqbJ16Lz4Jl73j5R3c3m02',
  agency:  'https://buy.stripe.com/eVq9AT5q0eN92DT1PA2ZO02',
};

const PLANS = [
  { value: 'starter', label: 'Starter',  price: '$97/mo',  desc: '1–2 trucks · Quote tool + SMS + Dashboard' },
  { value: 'pro',     label: 'Pro',      price: '$197/mo', desc: '3–10 trucks · CRM routing + missed call recovery', popular: true },
  { value: 'agency',  label: 'Agency',   price: '$497/mo', desc: '10+ trucks · Multi-location + white-label' },
];

const PLAN_PRICE: Record<string, number> = { trial: 0, starter: 97, pro: 197, agency: 497 };

type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';

interface Lead {
  id: string; receivedAt: string; status: LeadStatus; jobValue?: number;
  statusNote?: string; statusUpdatedAt?: string; name?: string; phone?: string;
  email?: string; serviceLabel?: string; service?: string; urgency?: string;
  zipCode?: string; estimateRange?: string; leadScore?: string;
  crossSellOpportunities?: string[]; preferredTime?: string; details?: string;
  lang?: string; source?: string; clientId?: string; clientName?: string;
  submittedAt?: string; waterHardness?: string; annualCostEstimate?: string;
  recommendations?: string; city?: string; state?: string; company?: string;
  trucks?: string; crm?: string; type?: string; [key: string]: unknown;
}

interface BusinessHours {
  enabled: boolean;
  weekdays: { start: string; end: string };
  saturday: { enabled: boolean; start: string; end: string };
  sunday: { enabled: boolean; start: string; end: string };
  afterHoursMode: 'sms_only' | 'ring_then_sms';
}

const DEFAULT_HOURS: BusinessHours = {
  enabled: false,
  weekdays: { start: '08:00', end: '18:00' },
  saturday: { enabled: false, start: '09:00', end: '14:00' },
  sunday:   { enabled: false, start: '10:00', end: '14:00' },
  afterHoursMode: 'sms_only',
};

const STATUS_COLOR: Record<LeadStatus, { bg: string; color: string }> = {
  New: { bg: '#eff6ff', color: '#1d4ed8' }, Contacted: { bg: '#fefce8', color: '#854d0e' },
  Quoted: { bg: '#faf5ff', color: '#7c3aed' }, Won: { bg: '#f0fdf4', color: '#166534' },
  Lost: { bg: '#fef2f2', color: '#991b1b' },
};

const URGENCY_COLOR: Record<string, { bg: string; color: string }> = {
  emergency: { bg: '#fee2e2', color: '#991b1b' },
  soon: { bg: '#fef3c7', color: '#92400e' },
  routine: { bg: '#d1fae5', color: '#065f46' },
};

function fmt(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function currency(n?: number) { if (!n) return ''; return `$${n.toLocaleString()}`; }

function calcStats(leads: Lead[]) {
  const total = leads.length;
  const byStatus = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const won = byStatus['Won'] || 0;
  const decided = (byStatus['Won'] || 0) + (byStatus['Lost'] || 0);
  const closeRate = decided > 0 ? Math.round((won / decided) * 100) : null;
  const revenue = leads.filter(l => l.status === 'Won' && l.jobValue).reduce((sum, l) => sum + (l.jobValue || 0), 0);
  const avgTicket = won > 0 ? Math.round(revenue / won) : null;
  return { total, byStatus, won, decided, closeRate, revenue, avgTicket };
}

// ─── Upgrade Banner ───────────────────────────────────────────────────────────

const UpgradeBanner: React.FC<{ currentPlan: string; revenue: number; won: number }> = ({ currentPlan, revenue, won }) => {
  const [open, setOpen] = useState(false);
  const planCost = PLAN_PRICE[currentPlan] || 0;
  const roi = planCost > 0 ? Math.round(revenue / planCost) : null;
  if (currentPlan === 'agency') return null;

  return (
    <>
      <div style={{ background: '#0D0D0D', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#9E9B91', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Your Plan — {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            {currentPlan === 'trial' && <span style={{ marginLeft: 8, background: '#854d0e', color: '#fef9c3', padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>TRIAL</span>}
          </div>
          {revenue > 0 ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A623', marginTop: 4 }}>{roi ? `${roi}× return` : 'Tracking ROI...'}</div>
              <div style={{ fontSize: 13, color: '#5C5A53', marginTop: 2 }}>${revenue.toLocaleString()} revenue · {won} job{won !== 1 ? 's' : ''} won{planCost > 0 ? ` · $${planCost}/mo plan cost` : ''}</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: '#5C5A53', marginTop: 6 }}>Log a won job to start tracking your ROI</div>
          )}
        </div>
        <button onClick={() => setOpen(true)} style={{ background: '#F5A623', color: '#0D0D0D', border: 'none', padding: '10px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>↑ Upgrade Plan</button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setOpen(false)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 560, padding: 32, fontFamily: 'DM Sans, sans-serif' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: 0.5 }}>Choose Your Plan</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Current plan: <strong>{currentPlan}</strong> · One job covers any plan</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            {PLANS.map(plan => (
              <div key={plan.value} style={{ position: 'relative', border: plan.popular ? '2px solid #F5A623' : '2px solid #e2e8f0', padding: '18px 20px', marginBottom: 12, background: plan.popular ? '#0D0D0D' : '#fff' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -11, left: 16, background: '#F5A623', color: '#0D0D0D', fontSize: 10, fontWeight: 800, padding: '2px 10px', letterSpacing: 1, textTransform: 'uppercase' }}>Most Popular</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: plan.popular ? '#F5A623' : '#0f172a' }}>{plan.label}</div>
                    <div style={{ fontSize: 12, color: plan.popular ? '#9E9B91' : '#64748b', marginTop: 2 }}>{plan.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: plan.popular ? '#fff' : '#0f172a' }}>{plan.price}</div>
                    {plan.value === currentPlan ? (
                      <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8' }}>Current</div>
                    ) : (
                      <a href={STRIPE_LINKS[plan.value]} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '8px 18px', background: plan.popular ? '#F5A623' : '#0f172a', color: plan.popular ? '#0D0D0D' : '#facc15', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>Select →</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, textAlign: 'center' }}>After payment, your plan updates automatically. Questions? Call <strong>(833) 558-0877</strong></p>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Call Settings Panel ──────────────────────────────────────────────────────

const CallSettings: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);
  const [callbackPhone, setCallbackPhone] = useState('');
  const [missedCallSms, setMissedCallSms] = useState(false);
  const [hours, setHours]             = useState<BusinessHours>(DEFAULT_HOURS);

  useEffect(() => {
    // Fetch contractor record
    fetch(`${API_BASE}/api/contractors/${clientId}/settings`, {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
      .then(r => r.json())
      .then(data => {
        setTwilioNumber(data.twilio_number || null);
        setCallbackPhone(data.callback_phone || data.phone || '');
        setMissedCallSms(data.missed_call_sms || false);
        setHours(data.business_hours || DEFAULT_HOURS);
      })
      .catch(() => setError('Could not load call settings.'))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${clientId}/call-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({
          callback_phone: callbackPhone.trim(),
          missed_call_sms: missedCallSms,
          business_hours: hours,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  const setWeekday = (field: 'start' | 'end', value: string) =>
    setHours(h => ({ ...h, weekdays: { ...h.weekdays, [field]: value } }));
  const setDay = (day: 'saturday' | 'sunday', field: string, value: string | boolean) =>
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }));

  const inp: React.CSSProperties = { padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
  const timeInp: React.CSSProperties = { ...inp, width: 120 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading call settings...</div>;

  return (
    <div style={{ maxWidth: 640 }}>

      {/* PlumbLead Number */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>📞 Your PlumbLead Number</div>
        {twilioNumber ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0ea5e9', letterSpacing: 1 }}>{twilioNumber}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.6 }}>
              Put this number on your website and Google Business Profile. Calls forward to your callback number below.
              Homeowners who call and don't reach you get an automatic SMS with your quote link.
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: '#94a3b8', padding: '16px', background: '#f8fafc', borderRadius: 8 }}>
            No PlumbLead number provisioned yet. Contact <strong>(833) 558-0877</strong> to get set up.
          </div>
        )}
      </div>

      {/* Callback Number */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>📲 Forward Calls To</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>The number that rings when a homeowner calls your PlumbLead number. Update this when your on-call tech changes.</div>
        <input
          style={inp}
          type="tel"
          value={callbackPhone}
          onChange={e => setCallbackPhone(e.target.value)}
          placeholder="(425) 555-0100"
        />
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          Tip: If you use a rotation or on-call service (Google Voice, RingCentral, etc.), enter that number here — your existing system handles the routing.
        </div>
      </div>

      {/* Missed Call SMS Toggle */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>💬 Missed Call SMS Recovery</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              When a caller doesn't reach you, automatically send them an SMS with a link to your instant quote page.
            </div>
          </div>
          <div
            onClick={() => setMissedCallSms(!missedCallSms)}
            style={{ width: 48, height: 26, borderRadius: 13, background: missedCallSms ? '#0ea5e9' : '#e2e8f0', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
          >
            <div style={{ position: 'absolute', top: 3, left: missedCallSms ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: hours.enabled ? 20 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🕐 Business Hours</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Set your hours. After-hours calls skip the ring and go straight to SMS lead capture — no 2am interruptions, but you still get the lead.
            </div>
          </div>
          <div
            onClick={() => setHours(h => ({ ...h, enabled: !h.enabled }))}
            style={{ width: 48, height: 26, borderRadius: 13, background: hours.enabled ? '#0ea5e9' : '#e2e8f0', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
          >
            <div style={{ position: 'absolute', top: 3, left: hours.enabled ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {hours.enabled && (
          <>
            {/* Weekdays */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Monday – Friday</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="time" value={hours.weekdays.start} onChange={e => setWeekday('start', e.target.value)} style={timeInp} />
                <span style={{ fontSize: 13, color: '#64748b' }}>to</span>
                <input type="time" value={hours.weekdays.end} onChange={e => setWeekday('end', e.target.value)} style={timeInp} />
              </div>
            </div>

            {/* Saturday */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input type="checkbox" id="sat-enabled" checked={hours.saturday.enabled} onChange={e => setDay('saturday', 'enabled', e.target.checked)} style={{ cursor: 'pointer', accentColor: '#0ea5e9' }} />
                <label htmlFor="sat-enabled" style={{ fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Saturday</label>
              </div>
              {hours.saturday.enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 24 }}>
                  <input type="time" value={hours.saturday.start} onChange={e => setDay('saturday', 'start', e.target.value)} style={timeInp} />
                  <span style={{ fontSize: 13, color: '#64748b' }}>to</span>
                  <input type="time" value={hours.saturday.end} onChange={e => setDay('saturday', 'end', e.target.value)} style={timeInp} />
                </div>
              )}
            </div>

            {/* Sunday */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input type="checkbox" id="sun-enabled" checked={hours.sunday.enabled} onChange={e => setDay('sunday', 'enabled', e.target.checked)} style={{ cursor: 'pointer', accentColor: '#0ea5e9' }} />
                <label htmlFor="sun-enabled" style={{ fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Sunday</label>
              </div>
              {hours.sunday.enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 24 }}>
                  <input type="time" value={hours.sunday.start} onChange={e => setDay('sunday', 'start', e.target.value)} style={timeInp} />
                  <span style={{ fontSize: 13, color: '#64748b' }}>to</span>
                  <input type="time" value={hours.sunday.end} onChange={e => setDay('sunday', 'end', e.target.value)} style={timeInp} />
                </div>
              )}
            </div>

            {/* After-hours mode */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>After-Hours Behavior</div>
              {[['sms_only', '📱 SMS only — skip the ring, send quote link immediately'], ['ring_then_sms', '📞 Ring first, then SMS if no answer']].map(([val, label]) => (
                <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => setHours(h => ({ ...h, afterHoursMode: val as BusinessHours['afterHoursMode'] }))}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${hours.afterHoursMode === val ? '#0ea5e9' : '#e2e8f0'}`, background: hours.afterHoursMode === val ? '#0ea5e9' : '#fff', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#334155' }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 12 }}>{error}</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', padding: '14px', background: saving ? '#e2e8f0' : saved ? '#10b981' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Call Settings'}
      </button>
    </div>
  );
};

// ─── Lead Modal ───────────────────────────────────────────────────────────────

const LeadModal: React.FC<{ lead: Lead; onClose: () => void; onSave: (id: string, update: { status?: LeadStatus; jobValue?: number; statusNote?: string }) => Promise<void> }> = ({ lead, onClose, onSave }) => {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [jobValue, setJobValue] = useState(lead.jobValue?.toString() || '');
  const [statusNote, setStatusNote] = useState(lead.statusNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(lead.id, { status, jobValue: jobValue ? parseFloat(jobValue) : undefined, statusNote: statusNote || undefined });
    setSaving(false); onClose();
  };

  const isWater = lead.source === 'water-quality-report';
  const isTrial = lead.type === 'trial_signup';
  const serviceDisplay = lead.serviceLabel || lead.service || (isWater ? 'Water Treatment' : isTrial ? 'Trial Signup' : 'Unknown');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{lead.name || lead.company || 'Unknown'}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{lead.phone} {lead.email ? `· ${lead.email}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Service', serviceDisplay], ['Urgency', lead.urgency || '—'], ['Zip / City', [lead.zipCode, lead.city, lead.state].filter(Boolean).join(', ') || '—'], ['Time', lead.preferredTime || '—'], ['Estimate', lead.estimateRange || '—'], ['Lead Score', lead.leadScore || '—'], ['Source', lead.source || '—'], ['Received', fmt(lead.receivedAt)]].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#0f172a', marginTop: 2, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {lead.details && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</div><div style={{ fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 1.5 }}>{lead.details}</div></div>}
          {isWater && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Water Report</div><div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>Hardness: {lead.waterHardness} · {lead.annualCostEstimate}<br/>{lead.recommendations}</div></div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Update Status</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['New', 'Contacted', 'Quoted', 'Won', 'Lost'] as LeadStatus[]).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${status === s ? STATUS_COLOR[s].color : '#e2e8f0'}`, background: status === s ? STATUS_COLOR[s].bg : '#fff', color: status === s ? STATUS_COLOR[s].color : '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
        {status === 'Won' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Job Value</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: '#64748b', fontWeight: 700 }}>$</span>
              <input type="number" value={jobValue} onChange={e => setJobValue(e.target.value)} placeholder="e.g. 1400" style={{ flex: 1, padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none' }} />
            </div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Note (optional)</label>
          <input type="text" value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="e.g. Left voicemail, booked Thursday..." style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessCode, setAccessCode]       = useState('');
  const [authError, setAuthError]         = useState('');
  const [authLoading, setAuthLoading]     = useState(false);
  const [clientId, setClientId]           = useState('__all__');
  const [clientLabel, setClientLabel]     = useState('');
  const [clientPlan, setClientPlan]       = useState('trial');
  const [isAdmin, setIsAdmin]             = useState(false);
  const [activeTab, setActiveTab]         = useState<'leads' | 'call-settings'>('leads');
  const [leads, setLeads]                 = useState<Lead[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [filterStatus, setFilterStatus]   = useState<LeadStatus | 'all'>('all');
  const [filterSource, setFilterSource]   = useState('all');
  const [selectedLead, setSelectedLead]   = useState<Lead | null>(null);
  const [lastRefresh, setLastRefresh]     = useState<Date | null>(null);

  const handleAuth = async () => {
    const code = accessCode.trim();
    if (!code) return;
    setAuthLoading(true); setAuthError('');
    try {
      if (code === ADMIN_KEY) {
        setAuthenticated(true); setClientId('__all__'); setClientLabel('Admin — All Leads');
        setClientPlan('agency'); setIsAdmin(true); return;
      }
      const res = await fetch(`${API_BASE}/api/auth/dashboard?code=${encodeURIComponent(code)}`);
      if (!res.ok) { setAuthError('Invalid access code.'); return; }
      const data = await res.json();
      setAuthenticated(true); setClientId(data.clientId);
      setClientLabel(data.label); setClientPlan(data.plan || 'trial');
      setIsAdmin(false);
    } catch { setAuthError('Connection error. Try again.'); }
    finally { setAuthLoading(false); }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '200', adminKey: ADMIN_KEY });
      if (clientId !== '__all__') params.set('clientId', clientId);
      const res = await fetch(`${API_BASE}/api/leads?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []); setLastRefresh(new Date());
    } catch { setError('Failed to load leads. Check Railway is running.'); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { if (authenticated) fetchLeads(); }, [authenticated, fetchLeads]);

  const updateLead = async (id: string, update: { status?: LeadStatus; jobValue?: number; statusNote?: string }) => {
    const res = await fetch(`${API_BASE}/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify(update),
    });
    if (res.ok) { const { lead } = await res.json(); setLeads(prev => prev.map(l => l.id === id ? lead : l)); }
  };

  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    return true;
  });

  const stats = calcStats(leads);
  const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean))) as string[];

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authenticated) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: '#F5A623', letterSpacing: 1, marginBottom: 4 }}>PlumbLead<span style={{ color: '#0D0D0D' }}>.ai</span></div>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Contractor Dashboard</div>
        <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="Enter access code" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 16, textAlign: 'center', letterSpacing: 2, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: 14, background: authLoading ? '#e2e8f0' : '#F5A623', color: '#0D0D0D', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer' }}>
          {authLoading ? 'Checking...' : 'View My Leads →'}
        </button>
        {authError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{authError}</div>}
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>Questions? (833) 558-0877</div>
      </div>
    </div>
  );

  // ── Authenticated view ───────────────────────────────────────────────────────
  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>

      {/* Nav */}
      <div style={{ background: '#0D0D0D', borderBottom: '3px solid #F5A623', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#F5A623', letterSpacing: 1 }}>PlumbLead<span style={{ color: '#fff' }}>.ai</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAdmin && <a href="/admin/contractors" style={{ fontSize: 12, color: '#F5A623', fontWeight: 700, textDecoration: 'none' }}>⚙ Manage Contractors</a>}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#9E9B91' }}>{clientLabel}</div>
            {lastRefresh && <div style={{ fontSize: 11, color: '#5C5A53' }}>Updated {fmt(lastRefresh.toISOString())}</div>}
          </div>
          <button onClick={fetchLeads} disabled={loading} style={{ padding: '6px 14px', background: '#F5A623', color: '#0D0D0D', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#991b1b' }}>{error}</div>}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[{ label: 'Total Leads', value: stats.total, color: '#0f172a' }, { label: 'New', value: stats.byStatus['New'] || 0, color: '#1d4ed8' }, { label: 'Won', value: stats.won, color: '#166534' }, { label: 'Close Rate', value: stats.closeRate !== null ? `${stats.closeRate}%` : '—', color: '#7c3aed' }, { label: 'Revenue Won', value: stats.revenue > 0 ? `$${stats.revenue.toLocaleString()}` : '—', color: '#166534' }, { label: 'Avg Ticket', value: stats.avgTicket ? `$${stats.avgTicket.toLocaleString()}` : '—', color: '#0f172a' }].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {!isAdmin && <UpgradeBanner currentPlan={clientPlan} revenue={stats.revenue} won={stats.won} />}

        {/* Tabs — only show Call Settings for non-admin contractors */}
        {!isAdmin && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
            {[['leads', '📋 My Leads'], ['call-settings', '📞 Call Settings']].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab as 'leads' | 'call-settings')}
                style={{ padding: '10px 24px', border: 'none', background: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: activeTab === tab ? '#0ea5e9' : '#64748b', borderBottom: activeTab === tab ? '2px solid #0ea5e9' : '2px solid transparent', marginBottom: -2, transition: 'color 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Call Settings Tab */}
        {activeTab === 'call-settings' && !isAdmin && (
          <CallSettings clientId={clientId} />
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginRight: 4 }}>Leads</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['all', 'New', 'Contacted', 'Quoted', 'Won', 'Lost'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterStatus === s ? '#0ea5e9' : '#fff', color: filterStatus === s ? '#fff' : '#64748b' }}>{s === 'all' ? 'All' : s} {s !== 'all' && stats.byStatus[s] ? `(${stats.byStatus[s]})` : ''}</button>
                ))}
              </div>
              {sources.length > 1 && (
                <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#fff', cursor: 'pointer' }}>
                  <option value="all">All sources</option>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>{leads.length === 0 ? 'No leads yet — submit a test lead at plumblead.ai/quote' : 'No leads match this filter'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {['Contact', 'Service', 'Urgency / Score', 'Estimate', 'Status', 'Source', 'Received'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(lead => (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name || lead.company || '—'}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{lead.phone || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155', maxWidth: 180 }}>
                          <div style={{ fontWeight: 500 }}>{lead.serviceLabel || lead.service || (lead.source === 'water-quality-report' ? 'Water Treatment' : lead.type === 'trial_signup' ? 'Trial Signup' : '—')}</div>
                          {lead.zipCode && <div style={{ fontSize: 11, color: '#94a3b8' }}>{lead.zipCode}{lead.city ? ` · ${lead.city}` : ''}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {lead.urgency && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, marginBottom: 3, ...(URGENCY_COLOR[lead.urgency] || {}) }}>{lead.urgency}</span>}
                          {lead.leadScore && <div style={{ fontSize: 11, color: lead.leadScore === 'Emergency' ? '#dc2626' : lead.leadScore === 'High Urgency' ? '#d97706' : '#64748b', fontWeight: 600 }}>{lead.leadScore}</div>}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>
                          {lead.estimateRange || '—'}
                          {lead.jobValue && <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Won: {currency(lead.jobValue)}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, ...STATUS_COLOR[lead.status] }}>{lead.status}</span>
                          {lead.statusNote && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{lead.statusNote}</div>}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>{lead.source || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>{fmt(lead.receivedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={updateLead} />}
    </div>
  );
};

export default Dashboard;
