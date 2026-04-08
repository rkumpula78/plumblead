// src/components/AdminOnboard.tsx
// Admin-only contractor onboarding panel at /admin/onboard
// Tab 1: Manual entry  |  Tab 2: Scrape from website

import React, { useState } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';
const ADMIN_KEY = 'plumblead-admin-2026';

const ALL_SERVICES = [
  { key: 'emergency-leak',         label: 'Emergency / Leak' },
  { key: 'drain-cleaning',         label: 'Drain Cleaning' },
  { key: 'water-heater-tank',      label: 'Water Heater (Tank)' },
  { key: 'water-heater-tankless',  label: 'Water Heater (Tankless)' },
  { key: 'toilet',                 label: 'Toilet Repair/Replace' },
  { key: 'faucet-fixture',         label: 'Faucet / Fixture' },
  { key: 'garbage-disposal',       label: 'Garbage Disposal' },
  { key: 'sewer-line',             label: 'Sewer Line' },
  { key: 'slab-leak',              label: 'Slab Leak' },
  { key: 'gas-line',               label: 'Gas Line Work' },
  { key: 'repipe',                 label: 'Whole House Repipe' },
  { key: 'water-softener',         label: 'Water Softener' },
  { key: 'filtration',             label: 'Water Filtration / RO' },
  { key: 'water-test',             label: 'Free Water Quality Report' },
];

interface ContractorForm {
  companyName: string;
  clientId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCodes: string;
  callbackPhone: string;
  crmSystem: string;
  bilingual: boolean;
  plan: string;
  services: string[];
  notes: string;
}

const BLANK: ContractorForm = {
  companyName: '', clientId: '', phone: '', email: '',
  address: '', city: '', state: '', zipCodes: '',
  callbackPhone: '', crmSystem: '', bilingual: false,
  plan: 'trial', services: ALL_SERVICES.map(s => s.key), notes: '',
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminOnboard() {
  const [authed, setAuthed]         = useState(false);
  const [keyInput, setKeyInput]     = useState('');
  const [keyError, setKeyError]     = useState('');
  const [tab, setTab]               = useState<'manual' | 'scrape'>('manual');
  const [form, setForm]             = useState<ContractorForm>(BLANK);
  const [scrapeUrl, setScrapeUrl]   = useState('');
  const [scraping, setScraping]     = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState<ContractorForm | null>(null);
  const [saveError, setSaveError]   = useState('');

  // ── Auth ──────────────────────────────────────────────────────────────────
  function handleAuth() {
    if (keyInput === ADMIN_KEY) { setAuthed(true); }
    else { setKeyError('Invalid admin key.'); }
  }

  // ── Field helpers ─────────────────────────────────────────────────────────
  function set(field: keyof ContractorForm, value: string | boolean | string[]) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'companyName' && typeof value === 'string') {
      setForm(prev => ({ ...prev, companyName: value, clientId: slugify(value) }));
    }
  }

  function toggleService(key: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(key)
        ? prev.services.filter(s => s !== key)
        : [...prev.services, key],
    }));
  }

  // ── Scrape ────────────────────────────────────────────────────────────────
  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeError('');
    try {
      const res = await fetch(`${API_BASE}/api/scrape-contractor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // Pre-fill the manual form with whatever Gemini extracted
      setForm(prev => ({
        ...prev,
        companyName:   data.companyName   || prev.companyName,
        clientId:      data.companyName   ? slugify(data.companyName) : prev.clientId,
        phone:         data.phone         || prev.phone,
        email:         data.email         || prev.email,
        address:       data.address       || prev.address,
        city:          data.city          || prev.city,
        state:         data.state         || prev.state,
        zipCodes:      data.zipCodes      || prev.zipCodes,
        callbackPhone: data.phone         || prev.callbackPhone,
        services:      data.services?.length ? data.services : prev.services,
        notes:         data.notes         || prev.notes,
      }));
      setTab('manual');
    } catch (e: any) {
      setScrapeError(e.message || 'Scrape failed. Check URL and try again.');
    } finally {
      setScraping(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.companyName || !form.clientId || !form.phone) {
      setSaveError('Company name, client ID, and phone are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Server error ${res.status}`);
      }
      setSaved(form);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived output values ─────────────────────────────────────────────────
  const accessCode    = `${form.clientId}-${new Date().getFullYear()}`;
  const embedSnippet  = `<iframe\n  src="https://plumblead.ai/quote?widget=1&client=${form.clientId}"\n  width="100%" height="700" frameborder="0"\n  style="border:none;max-width:680px;">\n</iframe>`;

  // ── Styles ────────────────────────────────────────────────────────────────
  const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", padding: '32px 16px' },
    card:    { maxWidth: 780, margin: '0 auto', background: '#fff', border: '2px solid #0f172a', padding: '32px' },
    h1:      { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#0f172a', margin: '0 0 4px', letterSpacing: 1 },
    sub:     { color: '#64748b', fontSize: 14, marginBottom: 28 },
    tabs:    { display: 'flex', borderBottom: '2px solid #0f172a', marginBottom: 28 },
    tab:     (active: boolean): React.CSSProperties => ({
      padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      background: active ? '#0f172a' : 'transparent',
      color: active ? '#facc15' : '#64748b',
      border: 'none', fontFamily: "'DM Sans', sans-serif",
    }),
    label:   { display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 },
    input:   { width: '100%', border: '2px solid #e2e8f0', padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, outline: 'none', marginBottom: 16 },
    row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    row3:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
    section: { borderTop: '1px solid #e2e8f0', paddingTop: 20, marginTop: 20 },
    shead:   { fontWeight: 800, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#94a3b8', marginBottom: 12 },
    servGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 },
    servChk: (on: boolean): React.CSSProperties => ({
      padding: '8px 12px', fontSize: 13, cursor: 'pointer', userSelect: 'none',
      border: on ? '2px solid #0f172a' : '2px solid #e2e8f0',
      background: on ? '#0f172a' : '#f8fafc',
      color: on ? '#facc15' : '#64748b', fontWeight: on ? 700 : 400,
    }),
    btn:     { background: '#facc15', color: '#0f172a', border: '2px solid #0f172a', padding: '13px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%', marginTop: 8 },
    outBox:  { background: '#0f172a', color: '#facc15', padding: '16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' as const, marginBottom: 12, wordBreak: 'break-all' as const },
    success: { background: '#f0fdf4', border: '2px solid #22c55e', padding: '24px', textAlign: 'center' as const },
    error:   { color: '#ef4444', fontSize: 13, marginTop: 8 },
    select:  { width: '100%', border: '2px solid #e2e8f0', padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', boxSizing: 'border-box' as const, outline: 'none', marginBottom: 16 },
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: 400 }}>
        <h1 style={s.h1}>Admin Access</h1>
        <p style={s.sub}>PlumbLead.ai Onboarding Panel</p>
        <label style={s.label}>Admin Key</label>
        <input style={s.input} type="password" placeholder="plumblead-admin-2026"
          value={keyInput} onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAuth()} />
        {keyError && <p style={s.error}>{keyError}</p>}
        <button style={s.btn} onClick={handleAuth}>Enter →</button>
      </div>
    </div>
  );

  // ── Success state ─────────────────────────────────────────────────────────
  if (saved) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.success}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ ...s.h1, fontSize: 26 }}>{saved.companyName} — Saved!</h2>
          <p style={{ color: '#374151', fontSize: 15, margin: '8px 0 24px' }}>
            Contractor added to Postgres. Here's everything you need to send them.
          </p>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Dashboard Access Code</div>
          <div style={s.outBox}>{accessCode}</div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
            Add this to <code>ACCESS_CODES</code> in Dashboard.tsx:
            <br />
            <code>'{accessCode}': {'{'} clientId: '{saved.clientId}', label: '{saved.companyName}' {'}'}</code>
          </p>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Widget Embed Code</div>
          <div style={s.outBox}>{embedSnippet}</div>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Demo Page URL</div>
          <div style={s.outBox}>https://plumblead.ai/demo/{saved.clientId}</div>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            This page doesn't exist yet — create it with the demo page builder (next feature).
          </p>
        </div>

        <button style={{ ...s.btn, marginTop: 24 }} onClick={() => { setSaved(null); setForm(BLANK); setScrapeUrl(''); }}>
          + Onboard Another Contractor
        </button>
      </div>
    </div>
  );

  // ── Main panel ────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.h1}>Contractor Onboarding</h1>
        <p style={s.sub}>Add a new contractor to PlumbLead.ai</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'manual')} onClick={() => setTab('manual')}>✏️ Manual Entry</button>
          <button style={s.tab(tab === 'scrape')} onClick={() => setTab('scrape')}>🔍 Scrape from Website</button>
        </div>

        {/* ── Scrape Tab ── */}
        {tab === 'scrape' && (
          <div>
            <p style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>
              Paste the contractor's website URL. Gemini will extract company name, phone,
              address, services, and service area — then pre-fill the form for your review.
            </p>
            <label style={s.label}>Website URL</label>
            <input style={s.input} placeholder="https://www.smithplumbing.com"
              value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
            {scrapeError && <p style={s.error}>{scrapeError}</p>}
            <button style={{ ...s.btn, background: scraping ? '#e2e8f0' : '#facc15' }}
              disabled={scraping || !scrapeUrl.trim()} onClick={handleScrape}>
              {scraping ? 'Scraping...' : '🔍 Extract Info from Website →'}
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
              After extraction, you'll be taken to the manual form to review and confirm.
            </p>
          </div>
        )}

        {/* ── Manual Entry Tab ── */}
        {tab === 'manual' && (
          <div>

            {/* Company */}
            <div style={s.shead}>Company Info</div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Company Name *</label>
                <input style={s.input} placeholder="Smith Plumbing LLC"
                  value={form.companyName}
                  onChange={e => set('companyName', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Client ID (auto-generated slug)</label>
                <input style={s.input} placeholder="smith-plumbing"
                  value={form.clientId}
                  onChange={e => set('clientId', e.target.value)} />
              </div>
            </div>

            <div style={s.row}>
              <div>
                <label style={s.label}>Business Phone *</label>
                <input style={s.input} type="tel" placeholder="(602) 555-0100"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Callback Phone (shown in SMS)</label>
                <input style={s.input} type="tel" placeholder="Same as business phone"
                  value={form.callbackPhone} onChange={e => set('callbackPhone', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" placeholder="owner@smithplumbing.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            {/* Location */}
            <div style={{ ...s.section }}>
              <div style={s.shead}>Location</div>
              <div>
                <label style={s.label}>Street Address</label>
                <input style={s.input} placeholder="123 Main St"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>City</label>
                  <input style={s.input} placeholder="Phoenix"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>State</label>
                  <input style={s.input} placeholder="AZ"
                    value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Primary Zip</label>
                  <input style={s.input} placeholder="85383"
                    value={form.zipCodes} onChange={e => set('zipCodes', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Setup */}
            <div style={s.section}>
              <div style={s.shead}>Setup Options</div>
              <div style={s.row}>
                <div>
                  <label style={s.label}>CRM System</label>
                  <input style={s.input} placeholder="Housecall Pro, ServiceTitan, Jobber..."
                    value={form.crmSystem} onChange={e => set('crmSystem', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Plan</label>
                  <select style={s.select} value={form.plan} onChange={e => set('plan', e.target.value)}>
                    <option value="trial">Trial (14 days)</option>
                    <option value="starter">Starter — $97/mo</option>
                    <option value="pro">Pro — $197/mo</option>
                    <option value="agency">Agency — $397/mo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input type="checkbox" id="bilingual" checked={form.bilingual}
                  onChange={e => set('bilingual', e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="bilingual" style={{ ...s.label, marginBottom: 0, cursor: 'pointer', fontWeight: 400 }}>
                  Enable Spanish (bilingual widget)
                </label>
              </div>
            </div>

            {/* Services */}
            <div style={s.section}>
              <div style={s.shead}>Services Offered (uncheck to disable in widget)</div>
              <div style={s.servGrid}>
                {ALL_SERVICES.map(svc => (
                  <div key={svc.key} style={s.servChk(form.services.includes(svc.key))}
                    onClick={() => toggleService(svc.key)}>
                    {form.services.includes(svc.key) ? '✓ ' : ''}{svc.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={s.section}>
              <div style={s.shead}>Internal Notes</div>
              <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                placeholder="e.g. Met at trade show. Wants white-label. Uses HCP."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {/* Preview output */}
            {form.clientId && (
              <div style={s.section}>
                <div style={s.shead}>Preview — Generated Values</div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  <strong>Dashboard access code:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px' }}>{accessCode}</code>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  <strong>Demo page:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px' }}>plumblead.ai/demo/{form.clientId}</code>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  <strong>Embed src:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px' }}>plumblead.ai/quote?widget=1&client={form.clientId}</code>
                </div>
              </div>
            )}

            {saveError && <p style={s.error}>{saveError}</p>}

            <button style={{ ...s.btn, background: saving ? '#e2e8f0' : '#facc15', marginTop: 24 }}
              disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : '💾 Save Contractor & Generate Setup Docs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
