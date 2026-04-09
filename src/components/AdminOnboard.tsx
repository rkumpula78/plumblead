// src/components/AdminOnboard.tsx
// Admin-only contractor onboarding panel at /admin/onboard

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30).replace(/-$/, '');
}

export default function AdminOnboard() {
  const [authed, setAuthed]             = useState(false);
  const [keyInput, setKeyInput]         = useState('');
  const [keyError, setKeyError]         = useState('');
  const [tab, setTab]                   = useState<'manual' | 'scrape'>('manual');
  const [form, setForm]                 = useState<ContractorForm>(BLANK);
  const [scrapeUrl, setScrapeUrl]       = useState('');
  const [scraping, setScraping]         = useState(false);
  const [scrapeError, setScrapeError]   = useState('');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState<(ContractorForm & { twilioNumber?: string }) | null>(null);
  const [saveError, setSaveError]       = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ number: string; nextStep: string } | null>(null);
  const [provisionError, setProvisionError]   = useState('');
  const [areaCode, setAreaCode]         = useState('');

  function handleAuth() {
    if (keyInput === ADMIN_KEY) setAuthed(true);
    else setKeyError('Invalid admin key.');
  }

  function setField(field: keyof ContractorForm, value: string | boolean | string[]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleCompanyName(value: string) {
    setForm(prev => ({ ...prev, companyName: value, clientId: slugify(value) }));
  }

  function toggleService(key: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(key) ? prev.services.filter(s => s !== key) : [...prev.services, key],
    }));
  }

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setScrapeError('');
    try {
      const res = await fetch(`${API_BASE}/api/scrape-contractor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
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
      setScrapeError(e.message || 'Scrape failed.');
    } finally { setScraping(false); }
  }

  async function handleSave() {
    if (!form.companyName || !form.clientId || !form.phone) {
      setSaveError('Company name, client ID, and phone are required.');
      return;
    }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || `Server error ${res.status}`); }
      setSaved({ ...form });
    } catch (e: any) {
      setSaveError(e.message || 'Save failed.');
    } finally { setSaving(false); }
  }

  async function handleProvisionNumber() {
    if (!saved?.clientId) return;
    setProvisioning(true); setProvisionError(''); setProvisionResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${saved.clientId}/provision-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ areaCode: areaCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setProvisionResult({ number: data.twilioNumber, nextStep: data.nextStep });
      setSaved(prev => prev ? { ...prev, twilioNumber: data.twilioNumber } : prev);
    } catch (e: any) {
      setProvisionError(e.message || 'Provisioning failed.');
    } finally { setProvisioning(false); }
  }

  const accessCode   = `${form.clientId}-${new Date().getFullYear()}`;
  const embedSnippet = `<iframe\n  src="https://plumblead.ai/quote?widget=1&client=${form.clientId}"\n  width="100%" height="700" frameborder="0"\n  style="border:none;max-width:680px;">\n</iframe>`;

  const s: Record<string, React.CSSProperties> = {
    page:     { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", padding: '32px 16px' },
    card:     { maxWidth: 780, margin: '0 auto', background: '#fff', border: '2px solid #0f172a', padding: '32px' },
    h1:       { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#0f172a', margin: '0 0 4px', letterSpacing: 1 },
    sub:      { color: '#64748b', fontSize: 14, marginBottom: 28 },
    tabs:     { display: 'flex', borderBottom: '2px solid #0f172a', marginBottom: 28 },
    label:    { display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 },
    input:    { width: '100%', border: '2px solid #e2e8f0', padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, outline: 'none', marginBottom: 16 },
    row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    row3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
    section:  { borderTop: '1px solid #e2e8f0', paddingTop: 20, marginTop: 20 },
    shead:    { fontWeight: 800, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#94a3b8', marginBottom: 12 },
    servGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 },
    btn:      { background: '#facc15', color: '#0f172a', border: '2px solid #0f172a', padding: '13px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%', marginTop: 8 },
    outBox:   { background: '#0f172a', color: '#facc15', padding: '16px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' as const, marginBottom: 12, wordBreak: 'break-all' as const },
    success:  { background: '#f0fdf4', border: '2px solid #22c55e', padding: '24px', textAlign: 'center' as const },
    error:    { color: '#ef4444', fontSize: 13, marginTop: 8 },
    select:   { width: '100%', border: '2px solid #e2e8f0', padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: '#fff', boxSizing: 'border-box' as const, outline: 'none', marginBottom: 16 },
    hint:     { fontSize: 11, color: '#94a3b8', marginTop: -12, marginBottom: 12 },
    phoneBox: { background: '#eff6ff', border: '2px solid #3b82f6', padding: '20px 24px', marginTop: 20 },
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    background: active ? '#0f172a' : 'transparent',
    color: active ? '#facc15' : '#64748b',
    border: 'none', fontFamily: "'DM Sans', sans-serif",
  });

  const servStyle = (on: boolean): React.CSSProperties => ({
    padding: '8px 12px', fontSize: 13, cursor: 'pointer', userSelect: 'none',
    border: on ? '2px solid #0f172a' : '2px solid #e2e8f0',
    background: on ? '#0f172a' : '#f8fafc',
    color: on ? '#facc15' : '#64748b',
    fontWeight: on ? 700 : 400,
  });

  if (!authed) return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: 400 }}>
        <h1 style={s.h1}>Admin Access</h1>
        <p style={s.sub}>PlumbLead.ai Onboarding Panel</p>
        <label style={s.label}>Admin Key</label>
        <input style={s.input} type="password" placeholder="Enter admin key"
          value={keyInput} onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAuth()} />
        {keyError && <p style={s.error}>{keyError}</p>}
        <button style={s.btn} onClick={handleAuth}>Enter →</button>
      </div>
    </div>
  );

  if (saved) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.success}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ ...s.h1, fontSize: 26 }}>{saved.companyName} — Saved!</h2>
          <p style={{ color: '#374151', fontSize: 15, margin: '8px 0 24px' }}>Contractor added to Postgres. Copy these to complete setup.</p>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Dashboard Access Code</div>
          <div style={s.outBox}>{accessCode}</div>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Widget Embed Code</div>
          <div style={s.outBox}>{embedSnippet}</div>
        </div>

        <div style={s.section}>
          <div style={s.shead}>Demo Page URL</div>
          <div style={s.outBox}>https://plumblead.ai/demo/{saved.clientId}</div>
        </div>

        {/* ── Missed Call Number Provisioning ── */}
        <div style={s.section}>
          <div style={s.shead}>📞 Missed Call Recovery — Provision Phone Number</div>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
            Provision a local Twilio forwarding number for <strong>{saved.companyName}</strong>.
            Calls forward to their real phone. If unanswered, the homeowner automatically
            gets an SMS with a link to their instant quote page.
          </p>

          {!provisionResult ? (
            <div style={s.phoneBox}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 12 }}>📱 Get a Local Number</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Area Code (optional)</label>
                  <input style={{ ...s.input, marginBottom: 0 }} placeholder="e.g. 425 for Monroe WA"
                    value={areaCode} onChange={e => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                  <p style={{ ...s.hint, marginTop: 6 }}>Leave blank for any available number</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 16 }}>
                  <button
                    style={{ ...s.btn, marginTop: 0, background: provisioning ? '#e2e8f0' : '#3b82f6', color: provisioning ? '#94a3b8' : '#fff', border: '2px solid #1d4ed8', width: '100%' }}
                    disabled={provisioning}
                    onClick={handleProvisionNumber}
                  >
                    {provisioning ? 'Provisioning...' : '⚡ Provision Number'}
                  </button>
                </div>
              </div>
              {provisionError && <p style={s.error}>{provisionError}</p>}
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Cost: ~$1.15/mo per number on your Twilio account. Calls forwarded free within US.
              </p>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', padding: '20px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#166534', marginBottom: 8 }}>✅ Number Provisioned!</div>
              <div style={s.outBox}>{provisionResult.number}</div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{provisionResult.nextStep}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Missed call SMS is now <strong>active</strong>. Calls forward to {saved.callbackPhone || saved.phone}.
              </p>
            </div>
          )}
        </div>

        <button style={{ ...s.btn, marginTop: 24 }}
          onClick={() => { setSaved(null); setForm(BLANK); setScrapeUrl(''); setProvisionResult(null); setProvisionError(''); setAreaCode(''); }}>
          + Onboard Another Contractor
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.h1}>Contractor Onboarding</h1>
        <p style={s.sub}>Add a new contractor to PlumbLead.ai</p>

        <div style={s.tabs}>
          <button style={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>✏️ Manual Entry</button>
          <button style={tabStyle(tab === 'scrape')} onClick={() => setTab('scrape')}>🔍 Scrape from Website</button>
        </div>

        {tab === 'scrape' && (
          <div>
            <p style={{ color: '#374151', fontSize: 14, marginBottom: 16 }}>
              Paste the contractor's website URL. Gemini will extract company info and pre-fill the form.
            </p>
            <label style={s.label}>Website URL</label>
            <input style={s.input} placeholder="https://www.smithplumbing.com"
              value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
            {scrapeError && <p style={s.error}>{scrapeError}</p>}
            <button style={{ ...s.btn, background: scraping ? '#e2e8f0' : '#facc15', color: scraping ? '#94a3b8' : '#0f172a' }}
              disabled={scraping || !scrapeUrl.trim()} onClick={handleScrape}>
              {scraping ? 'Scraping...' : '🔍 Extract Info from Website →'}
            </button>
          </div>
        )}

        {tab === 'manual' && (
          <div>
            <div style={s.shead}>Company Info</div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Company Name *</label>
                <input style={s.input} placeholder="Smith Plumbing LLC"
                  value={form.companyName} onChange={e => handleCompanyName(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Client ID *</label>
                <input style={s.input} placeholder="smith-plumbing"
                  value={form.clientId} onChange={e => setField('clientId', e.target.value)} />
                <p style={s.hint}>Auto-generated. Max 30 chars.</p>
              </div>
            </div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Business Phone *</label>
                <input style={s.input} type="tel" placeholder="(602) 555-0100"
                  value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Callback Phone (shown in SMS)</label>
                <input style={s.input} type="tel" placeholder="Same as business"
                  value={form.callbackPhone} onChange={e => setField('callbackPhone', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" placeholder="owner@smithplumbing.com"
                value={form.email} onChange={e => setField('email', e.target.value)} />
            </div>
            <div style={s.section}>
              <div style={s.shead}>Location</div>
              <div>
                <label style={s.label}>Street Address</label>
                <input style={s.input} placeholder="123 Main St"
                  value={form.address} onChange={e => setField('address', e.target.value)} />
              </div>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>City</label>
                  <input style={s.input} placeholder="Phoenix" value={form.city} onChange={e => setField('city', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>State</label>
                  <input style={s.input} placeholder="AZ" value={form.state} onChange={e => setField('state', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Zip / Service Area</label>
                  <input style={s.input} placeholder="85383, 85374..." value={form.zipCodes} onChange={e => setField('zipCodes', e.target.value)} />
                </div>
              </div>
            </div>
            <div style={s.section}>
              <div style={s.shead}>Setup</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>CRM System</label>
                  <input style={s.input} placeholder="Housecall Pro, ServiceTitan..."
                    value={form.crmSystem} onChange={e => setField('crmSystem', e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Plan</label>
                  <select style={s.select} value={form.plan} onChange={e => setField('plan', e.target.value)}>
                    <option value="trial">Trial (14 days)</option>
                    <option value="starter">Starter — $97/mo</option>
                    <option value="pro">Pro — $197/mo</option>
                    <option value="agency">Agency — $397/mo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input type="checkbox" id="bilingual" checked={form.bilingual}
                  onChange={e => setField('bilingual', e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="bilingual" style={{ ...s.label, marginBottom: 0, fontWeight: 400, cursor: 'pointer' }}>Enable Spanish (bilingual widget)</label>
              </div>
            </div>
            <div style={s.section}>
              <div style={s.shead}>Services Offered</div>
              <div style={s.servGrid}>
                {ALL_SERVICES.map(svc => (
                  <div key={svc.key} style={servStyle(form.services.includes(svc.key))} onClick={() => toggleService(svc.key)}>
                    {form.services.includes(svc.key) ? '✓ ' : ''}{svc.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={s.section}>
              <div style={s.shead}>Internal Notes</div>
              <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                placeholder="Met at trade show. Wants white-label. Uses HCP."
                value={form.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
            {form.clientId && (
              <div style={{ ...s.section, background: '#f8fafc', padding: 16, border: '1px solid #e2e8f0' }}>
                <div style={s.shead}>Preview</div>
                <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}><strong>Access code:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px' }}>{accessCode}</code></p>
                <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}><strong>Demo page:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px' }}>plumblead.ai/demo/{form.clientId}</code></p>
              </div>
            )}
            {saveError && <p style={s.error}>{saveError}</p>}
            <button style={{ ...s.btn, background: saving ? '#e2e8f0' : '#facc15', color: saving ? '#94a3b8' : '#0f172a', marginTop: 24 }}
              disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : '💾 Save Contractor & Generate Setup Docs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
