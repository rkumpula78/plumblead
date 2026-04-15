// src/components/AdminHub.tsx
// PlumbLead.ai — Operator Control Panel
// Access at /admin (requires admin key)

import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://plumblead-production.up.railway.app';
const ADMIN_KEY = 'plumblead-admin-2026';
const headers = { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY };

const PLANS = ['trial', 'starter', 'pro', 'agency'] as const;
const PLAN_PRICE: Record<string, string> = { trial: 'Free', starter: '$97/mo', pro: '$197/mo', agency: '$497/mo' };
const PLAN_COLOR: Record<string, string> = { trial: '#854d0e', starter: '#1d4ed8', pro: '#166534', agency: '#7c3aed' };
const PLAN_BG:    Record<string, string> = { trial: '#fefce8', starter: '#eff6ff', pro: '#f0fdf4', agency: '#faf5ff' };
const SUB_COLOR:  Record<string, string> = { trial: '#854d0e', active: '#166534', past_due: '#9a3412', cancelled: '#991b1b' };
const SUB_BG:     Record<string, string> = { trial: '#fefce8', active: '#f0fdf4', past_due: '#fff7ed', cancelled: '#fef2f2' };

type Tab = 'status' | 'contractors' | 'leads' | 'onboard' | 'aquaops';

interface Contractor {
  client_id: string; client_name: string; active: boolean; plan: string;
  subscription_status: string; created_at: string; notes?: string;
  phone?: string; callback_phone?: string; email?: string;
  city?: string; state?: string; zip_codes?: string;
  crm_system?: string; bilingual?: boolean; dashboard_code?: string;
  stripe_customer_id?: string;
}
interface Lead {
  id: string; receivedAt: string; status: string; jobValue?: number;
  clientId?: string; serviceLabel?: string; name?: string;
  phone?: string; zipCode?: string; urgency?: string; leadScore?: string;
  source?: string;
}
interface Health {
  status: string; db: string; waterZips: number;
  smsFrom: string; aquaops: string; timestamp: string;
}

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

// ─── Shared styles ────────────────────────────────────────────────────────────
const F: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };
const inp: React.CSSProperties = { ...F, width: '100%', border: '2px solid #e2e8f0', padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: 12 };
const btn = (bg = '#facc15', color = '#0f172a'): React.CSSProperties => ({ ...F, background: bg, color, border: `2px solid ${color === '#0f172a' ? '#0f172a' : bg}`, padding: '9px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' });
const badge = (plan: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', background: PLAN_BG[plan] || '#f1f5f9', color: PLAN_COLOR[plan] || '#64748b' });
const subbadge = (s: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', background: SUB_BG[s] || '#f1f5f9', color: SUB_COLOR[s] || '#64748b' });

// ─── Status Tab ───────────────────────────────────────────────────────────────
function StatusTab() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then(r => r.json()).then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  const rows: [string, string, string][] = health ? [
    ['Backend', health.status === 'ok' ? '✅ Online' : '❌ Down', ''],
    ['Database', health.db === 'connected' ? '✅ Connected' : '❌ Not connected', ''],
    ['Water Zips', health.waterZips > 0 ? `✅ ${health.waterZips} loaded` : '❌ 0 — check build', ''],
    ['SMS From', `✅ ${health.smsFrom}`, ''],
    ['AquaOps', health.aquaops === 'configured' ? '✅ Configured' : '⚠️ local-catalog only', ''],
    ['Last Check', fmtTime(health.timestamp), ''],
  ] : [];

  const links = [
    { label: 'Lead Dashboard', url: '/dashboard', desc: 'Homeowner leads + conversion tracking' },
    { label: 'ProMax Demo', url: '/demo/promax', desc: 'Live demo — ProMax Water Heaters' },
    { label: 'GPS Plumbing Demo', url: '/demo/gps', desc: 'Live demo — GPS Plumbing Inc.' },
    { label: 'Quote Tool', url: '/quote', desc: 'Homeowner-facing quote widget' },
    { label: 'Water Quality', url: '/water-quality', desc: 'Homeowner water report' },
    { label: 'Contractor Onboard', url: '/admin/onboard', desc: 'Full onboarding form' },
    { label: 'Submit Trial', url: '/submit-trial', desc: 'Public contractor signup' },
    { label: 'Terms', url: '/terms', desc: 'Legal' },
    { label: 'Privacy', url: '/privacy', desc: 'Legal' },
  ];

  return (
    <div>
      <h2 style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 16 }}>System Status</h2>
      {loading ? <p style={{ color: '#94a3b8' }}>Checking health...</p> : (
        <div style={{ background: '#fff', border: '2px solid #0f172a', marginBottom: 24, overflow: 'hidden' }}>
          {rows.map(([k, v], i) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none', padding: '10px 16px' }}>
              <div style={{ ...F, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
              <div style={{ ...F, fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>Quick Links</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {links.map(l => (
          <a key={l.url} href={l.url} target={l.url.startsWith('/admin') ? '_self' : '_blank'} rel="noopener noreferrer"
            style={{ background: '#fff', border: '2px solid #e2e8f0', padding: '12px 16px', textDecoration: 'none', display: 'block' }}>
            <div style={{ ...F, fontWeight: 700, fontSize: 14, color: '#0ea5e9', marginBottom: 2 }}>{l.label} →</div>
            <div style={{ ...F, fontSize: 12, color: '#94a3b8' }}>{l.desc}</div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 24, background: '#0f172a', padding: '16px 20px', border: '2px solid #facc15' }}>
        <div style={{ ...F, fontWeight: 700, fontSize: 12, color: '#facc15', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Railway Health Check</div>
        <code style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>curl {API}/api/health</code>
        <code style={{ color: '#94a3b8', fontSize: 12, display: 'block' }}>Expected: waterZips:502, aquaops:configured, db:connected</code>
      </div>
    </div>
  );
}

// ─── Contractors Tab ──────────────────────────────────────────────────────────
function ContractorsTab() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; won: number; revenue: number }>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contractor>>({});
  const [saving, setSaving] = useState(false);
  const [planChange, setPlanChange] = useState<{ c: Contractor; plan: string } | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/contractors`, { headers }).then(r => r.json()),
      fetch(`${API}/api/leads?limit=500`, { headers }).then(r => r.json()),
    ]).then(([cData, lData]) => {
      const map: Record<string, { total: number; won: number; revenue: number }> = {};
      for (const l of (lData.leads || [])) {
        const cid = l.clientId || 'demo';
        if (!map[cid]) map[cid] = { total: 0, won: 0, revenue: 0 };
        map[cid].total++;
        if (l.status === 'Won') { map[cid].won++; map[cid].revenue += l.jobValue || 0; }
      }
      setStats(map);
      setContractors(cData.contractors || []);
    }).finally(() => setLoading(false));
  }, []);

  async function toggleActive(c: Contractor) {
    setToggling(c.client_id);
    await fetch(`${API}/api/contractors/${c.client_id}/${c.active ? 'disable' : 'enable'}`, { method: 'POST', headers });
    setContractors(prev => prev.map(x => x.client_id === c.client_id ? { ...x, active: !c.active } : x));
    setToggling(null);
  }

  async function savePlan() {
    if (!planChange) return;
    setSaving(true);
    const res = await fetch(`${API}/api/contractors/${planChange.c.client_id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ plan: planChange.plan, subscription_status: planChange.plan === 'trial' ? 'trial' : 'active' }),
    });
    const d = await res.json();
    setContractors(prev => prev.map(c => c.client_id === planChange.c.client_id ? { ...c, ...d.contractor } : c));
    setPlanChange(null); setSaving(false);
    setMsg('Plan updated.');
    setTimeout(() => setMsg(''), 3000);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`${API}/api/contractors/${editing.client_id}`, {
      method: 'PATCH', headers, body: JSON.stringify(editForm),
    });
    const d = await res.json();
    setContractors(prev => prev.map(c => c.client_id === editing.client_id ? { ...c, ...d.contractor } : c));
    setEditing(null); setSaving(false);
    setMsg('Saved.'); setTimeout(() => setMsg(''), 3000);
  }

  const mrr = contractors.filter(c => c.active && c.plan !== 'trial')
    .reduce((s, c) => s + ({ starter: 97, pro: 197, agency: 497 }[c.plan] || 0), 0);

  if (loading) return <div style={{ ...F, color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 16px', marginBottom: 16, ...F, fontSize: 13, color: '#166534' }}>{msg}</div>}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, background: '#fff', border: '2px solid #0f172a', marginBottom: 20, overflow: 'hidden' }}>
        {[
          { n: contractors.length, l: 'Total' },
          { n: contractors.filter(c => c.active).length, l: 'Active' },
          { n: contractors.filter(c => c.plan !== 'trial').length, l: 'Paying' },
          { n: `$${mrr}/mo`, l: 'MRR' },
        ].map((x, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ ...F, fontWeight: 800, fontSize: 20 }}>{x.n}</div>
            <div style={{ ...F, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Contractor list */}
      {contractors.map(c => {
        const st = stats[c.client_id] || { total: 0, won: 0, revenue: 0 };
        return (
          <div key={c.client_id} style={{ background: '#fff', border: '2px solid #e2e8f0', marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ ...F, fontWeight: 700, fontSize: 15 }}>{c.client_name}</span>
                  <span style={badge(c.plan)}>{c.plan}</span>
                  <span style={subbadge(c.subscription_status)}>{c.subscription_status}</span>
                  {!c.active && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>PAUSED</span>}
                </div>
                <div style={{ ...F, fontSize: 12, color: '#64748b' }}>
                  {[c.phone, c.email, c.city && c.state ? `${c.city}, ${c.state}` : (c.city || c.state)].filter(Boolean).join(' · ')}
                </div>
                <div style={{ ...F, fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  {c.client_id} · code: <code style={{ background: '#f1f5f9', padding: '0 4px' }}>{c.dashboard_code || '(none)'}</code> · added {fmt(c.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, ...F }}>
                {[{ n: st.total, l: 'Leads' }, { n: st.won, l: 'Won' }, { n: st.revenue ? `$${st.revenue.toLocaleString()}` : '—', l: 'Rev' }].map((x, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800 }}>{x.n}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{x.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPlanChange({ c, plan: c.plan })} style={btn('#faf5ff', '#7c3aed')}>Plan</button>
                <button onClick={() => { setEditing(c); setEditForm({ notes: c.notes, phone: c.phone, callback_phone: c.callback_phone, email: c.email, city: c.city, state: c.state, zip_codes: c.zip_codes, crm_system: c.crm_system, bilingual: c.bilingual }); }} style={btn('#0f172a', '#facc15')}>Edit</button>
                <button onClick={() => toggleActive(c)} disabled={toggling === c.client_id}
                  style={btn(c.active ? '#fef2f2' : '#f0fdf4', c.active ? '#dc2626' : '#16a34a')}>
                  {toggling === c.client_id ? '...' : c.active ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Plan change modal */}
      {planChange && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '2px solid #0f172a', padding: 28, width: '100%', maxWidth: 400 }}>
            <div style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 4 }}>Change Plan</div>
            <div style={{ ...F, fontSize: 13, color: '#64748b', marginBottom: 16 }}>{planChange.c.client_name}</div>
            {PLANS.map(p => (
              <div key={p} onClick={() => setPlanChange({ ...planChange, plan: p })}
                style={{ padding: '12px 14px', border: planChange.plan === p ? '2px solid #0f172a' : '2px solid #e2e8f0', background: planChange.plan === p ? '#0f172a' : '#fff', cursor: 'pointer', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ ...F, fontWeight: 700, color: planChange.plan === p ? '#facc15' : '#0f172a' }}>{p}</span>
                <span style={{ ...F, fontSize: 13, color: planChange.plan === p ? '#94a3b8' : '#64748b' }}>{PLAN_PRICE[p]}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={savePlan} disabled={saving} style={{ ...btn(), flex: 1 }}>{saving ? '...' : 'Save'}</button>
              <button onClick={() => setPlanChange(null)} style={{ ...btn('#f1f5f9', '#64748b'), flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '2px solid #0f172a', padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 16 }}>{editing.client_name}</div>
            {([
              ['phone', 'Business Phone'], ['callback_phone', 'Callback Phone (SMS)'],
              ['email', 'Email'], ['city', 'City'], ['state', 'State'],
              ['zip_codes', 'Service Zip Codes'], ['crm_system', 'CRM System'],
            ] as [keyof Contractor, string][]).map(([f, l]) => (
              <div key={f}>
                <label style={{ ...F, display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{l}</label>
                <input style={inp} value={(editForm[f] as string) || ''} onChange={e => setEditForm(prev => ({ ...prev, [f]: e.target.value }))} />
              </div>
            ))}
            <label style={{ ...F, display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Notes</label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={editForm.notes || ''} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={!!editForm.bilingual} onChange={e => setEditForm(prev => ({ ...prev, bilingual: e.target.checked }))} />
              <span style={{ ...F, fontSize: 13 }}>Bilingual (English + Spanish)</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveEdit} disabled={saving} style={{ ...btn(), flex: 1 }}>{saving ? '...' : 'Save Changes'}</button>
              <button onClick={() => setEditing(null)} style={{ ...btn('#f1f5f9', '#64748b'), flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [contractors, setContractors] = useState<{ client_id: string; client_name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/leads?limit=200`, { headers }).then(r => r.json()),
      fetch(`${API}/api/contractors`, { headers }).then(r => r.json()),
    ]).then(([lData, cData]) => {
      setLeads(lData.leads || []);
      setContractors(cData.contractors || []);
    }).finally(() => setLoading(false));
  }, []);

  const visible = filter ? leads.filter(l => (l.clientId || 'demo') === filter) : leads;
  const URGENCY_COLOR: Record<string, string> = { emergency: '#dc2626', soon: '#d97706', routine: '#64748b' };

  if (loading) return <div style={{ ...F, color: '#94a3b8', padding: 40, textAlign: 'center' }}>Loading leads...</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ ...inp, marginBottom: 0, width: 'auto', minWidth: 200 }}>
          <option value="">All contractors ({leads.length})</option>
          {contractors.map(c => (
            <option key={c.client_id} value={c.client_id}>{c.client_name}</option>
          ))}
        </select>
        <span style={{ ...F, fontSize: 13, color: '#94a3b8' }}>Showing {visible.length} leads</span>
      </div>

      <div style={{ background: '#fff', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ ...F, padding: 32, textAlign: 'center', color: '#94a3b8' }}>No leads yet.</div>
        ) : visible.slice(0, 100).map((l, i) => (
          <div key={l.id} style={{ padding: '12px 16px', borderBottom: i < visible.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                <span style={{ ...F, fontWeight: 700, fontSize: 14 }}>{l.name || l.phone || 'Unknown'}</span>
                {l.urgency && <span style={{ fontSize: 10, fontWeight: 800, color: URGENCY_COLOR[l.urgency] || '#64748b', textTransform: 'uppercase' }}>{l.urgency}</span>}
                {l.leadScore && <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', fontWeight: 700 }}>{l.leadScore}</span>}
                <span style={{ ...subbadge(l.status?.toLowerCase() === 'won' ? 'active' : l.status?.toLowerCase() === 'new' ? 'trial' : 'past_due'), fontSize: 10 }}>{l.status}</span>
              </div>
              <div style={{ ...F, fontSize: 12, color: '#64748b' }}>
                {[l.serviceLabel, l.phone, l.zipCode].filter(Boolean).join(' · ')}
              </div>
              <div style={{ ...F, fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                {l.clientId} · {l.source} · {fmtTime(l.receivedAt)}
              </div>
            </div>
            {l.jobValue && (
              <div style={{ ...F, fontWeight: 800, fontSize: 14, color: '#166534' }}>${l.jobValue.toLocaleString()}</div>
            )}
          </div>
        ))}
        {visible.length > 100 && (
          <div style={{ ...F, padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', background: '#f8fafc' }}>Showing 100 of {visible.length} — go to /dashboard for full view</div>
        )}
      </div>
    </div>
  );
}

// ─── Onboard Tab ──────────────────────────────────────────────────────────────
function OnboardTab() {
  const [form, setForm] = useState({ clientId: '', companyName: '', phone: '', callbackPhone: '', email: '', city: '', state: '', zipCodes: '', crmSystem: '', bilingual: false, plan: 'trial', notes: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function set(k: string, v: string | boolean) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!form.clientId || !form.companyName || !form.phone) { setResult({ ok: false, msg: 'clientId, company name, and phone are required.' }); return; }
    setSaving(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/contractors`, {
        method: 'POST', headers,
        body: JSON.stringify({ clientId: form.clientId, companyName: form.companyName, phone: form.phone, callbackPhone: form.callbackPhone || form.phone, email: form.email, city: form.city, state: form.state, zipCodes: form.zipCodes, crmSystem: form.crmSystem, bilingual: form.bilingual, plan: form.plan, notes: form.notes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setResult({ ok: true, msg: `✅ ${form.companyName} added! Dashboard code: ${d.contractor?.dashboard_code}` });
      setForm({ clientId: '', companyName: '', phone: '', callbackPhone: '', email: '', city: '', state: '', zipCodes: '', crmSystem: '', bilingual: false, plan: 'trial', notes: '' });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || 'Error' });
    } finally {
      setSaving(false);
    }
  }

  const label = (t: string) => <label style={{ ...F, display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>{t}</label>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 4 }}>Quick Onboard</h2>
      <p style={{ ...F, fontSize: 13, color: '#64748b', marginBottom: 20 }}>Add a contractor directly to Postgres. For the full onboarding form, go to /admin/onboard.</p>

      {result && (
        <div style={{ background: result.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`, padding: '12px 16px', marginBottom: 16, ...F, fontSize: 13, color: result.ok ? '#166534' : '#991b1b' }}>
          {result.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><div>{label('Client ID (slug)')}</div><input style={inp} value={form.clientId} onChange={e => set('clientId', e.target.value)} placeholder="smith-plumbing" /></div>
        <div><div>{label('Company Name')}</div><input style={inp} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Smith Plumbing LLC" /></div>
        <div><div>{label('Business Phone')}</div><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="6025551234" /></div>
        <div><div>{label('Callback Phone (SMS)')}</div><input style={inp} value={form.callbackPhone} onChange={e => set('callbackPhone', e.target.value)} placeholder="Same as above if blank" /></div>
        <div><div>{label('Email')}</div><input style={inp} value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div><div>{label('City')}</div><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} /></div>
        <div><div>{label('State')}</div><input style={inp} value={form.state} onChange={e => set('state', e.target.value)} placeholder="WA" /></div>
        <div><div>{label('CRM System')}</div><input style={inp} value={form.crmSystem} onChange={e => set('crmSystem', e.target.value)} placeholder="HCP, ServiceTitan..." /></div>
      </div>

      <div>{label('Service Zip Codes')}</div>
      <input style={inp} value={form.zipCodes} onChange={e => set('zipCodes', e.target.value)} placeholder="98272, 98273, 98274" />

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          {label('Plan')}
          <select style={{ ...inp, marginBottom: 0 }} value={form.plan} onChange={e => set('plan', e.target.value)}>
            {PLANS.map(p => <option key={p} value={p}>{p} — {PLAN_PRICE[p]}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 20 }}>
          <input type="checkbox" checked={form.bilingual} onChange={e => set('bilingual', e.target.checked)} />
          <span style={{ ...F, fontSize: 13 }}>Bilingual (ES)</span>
        </label>
      </div>

      <div>{label('Internal Notes')}</div>
      <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />

      <button onClick={handleSubmit} disabled={saving} style={{ ...btn(), width: '100%', padding: '12px' }}>
        {saving ? 'Adding...' : 'Add Contractor →'}
      </button>

      <div style={{ marginTop: 24, ...F, fontSize: 12, color: '#94a3b8' }}>
        <strong>After adding:</strong> Dashboard code is auto-generated as <code>[client-id]-2026</code>. Share it with the contractor so they can access their lead dashboard.
      </div>
    </div>
  );
}

// ─── AquaOps Test Tab ─────────────────────────────────────────────────────────
function AquaOpsTab() {
  const [zip, setZip] = useState('85383');
  const [svcType, setSvcType] = useState('Water Heater');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API}/api/aquaops/recommend?zip=${zip}&serviceType=${encodeURIComponent(svcType)}`, { headers });
      if (!res.ok) throw new Error(`${res.status}`);
      setResult(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const wp = result?.waterProfile;
  const h3 = result?.h3Analysis;
  const primary = result?.primaryRecommendation;

  return (
    <div>
      <h2 style={{ ...F, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 4 }}>AquaOps Engine Tester</h2>
      <p style={{ ...F, fontSize: 13, color: '#64748b', marginBottom: 20 }}>Test water data lookup and equipment recommendation for any zip code.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...inp, marginBottom: 0, width: 140 }} value={zip} onChange={e => setZip(e.target.value)} placeholder="Zip code" />
        <input style={{ ...inp, marginBottom: 0, flex: 1, minWidth: 200 }} value={svcType} onChange={e => setSvcType(e.target.value)} placeholder="Service type" />
        <button onClick={run} disabled={loading} style={btn()}>{loading ? 'Running...' : 'Run →'}</button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', ...F, fontSize: 13, color: '#991b1b', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Water Profile */}
          <div style={{ background: '#fff', border: '2px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ ...F, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 10 }}>Water Profile — {wp?.city}, {wp?.state} ({zip})</div>
            {wp ? ([
              ['Hardness', `${wp.hardness_gpg} GPG / ${wp.hardness_mg_l} mg/L`],
              ['Classification', wp.hardness_label],
              ['pH', wp.ph],
              ['TDS', `${wp.tds_ppm} ppm`],
              ['Chlorine', `${wp.chlorine_mg_l} mg/L`],
              ['Iron', `${wp.iron_mg_l} mg/L`],
              ['Chloramine', wp.chloramine_concern ? '⚠ Yes' : 'No'],
              ['PFAS', wp.pfas_concern ? '⚠ Yes' : 'No'],
              ['Annual Cost', result.annualCostToHomeowner],
            ] as [string, any][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', ...F, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            )) : <div style={{ ...F, color: '#94a3b8', fontSize: 13 }}>No data for this zip.</div>}
          </div>

          {/* H3 Analysis */}
          <div style={{ background: '#fff', border: '2px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ ...F, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 10 }}>H3 Analysis</div>
            {h3 ? ([
              ['Softener Viable', h3.softener_viable ? '✅ Yes' : '❌ No'],
              ['TAC Viable', h3.tac_viable ? '✅ Yes' : '❌ No'],
              ['RO Recommended', h3.ro_recommended ? '✅ Yes' : 'No'],
              ['Resin', h3.resin_recommendation],
              ['Carbon Filter', h3.carbon_type_needed || 'None needed'],
              ['Iron Pretreat', h3.iron_pretreatment_required ? '⚠ Required' : 'None'],
            ] as [string, any][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', ...F, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
              </div>
            )) : <div style={{ ...F, color: '#94a3b8', fontSize: 13 }}>No analysis available.</div>}
          </div>

          {/* Primary Rec */}
          {primary && (
            <div style={{ background: '#0f172a', border: '2px solid #facc15', padding: '16px 18px', gridColumn: '1 / -1' }}>
              <div style={{ ...F, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#facc15', marginBottom: 10 }}>Primary Recommendation</div>
              {([
                ['Equipment', primary.equipment_name],
                ['SKU', primary.sku],
                ['Dealer Price', `$${primary.dealer_price}`],
                ['Retail Install', `$${primary.retail_low}–$${primary.retail_high}`],
                ['Dealer Margin Est', `$${result.dealerMarginEst}`],
                ['Priority', primary.priority],
              ] as [string, any][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', ...F, fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{v}</span>
                </div>
              ))}
              {primary.requires_pretreatment && (
                <div style={{ marginTop: 8, background: 'rgba(250,204,21,0.1)', border: '1px solid #facc15', padding: '8px 12px', ...F, fontSize: 12, color: '#facc15' }}>⚠ {primary.requires_pretreatment}</div>
              )}
              <div style={{ marginTop: 10 }}>
                <a href={primary.order_url} target="_blank" rel="noopener noreferrer"
                  style={{ ...F, background: '#facc15', color: '#0f172a', padding: '8px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>Order → {primary.sku}</a>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, ...F, fontSize: 12, color: '#94a3b8' }}>
        Test zips: <strong>85383</strong> (Peoria AZ, 16 GPG), <strong>98101</strong> (Seattle WA, soft), <strong>85326</strong> (Buckeye AZ, 25 GPG extremely hard)
      </div>
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────
export default function AdminHub() {
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [tab, setTab] = useState<Tab>('status');

  function handleAuth() {
    if (keyInput === ADMIN_KEY) setAuthed(true);
    else setKeyError('Invalid admin key.');
  }

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'status',      label: 'Status',      emoji: '⚡' },
    { id: 'contractors', label: 'Contractors', emoji: '🔧' },
    { id: 'leads',       label: 'Leads',       emoji: '📋' },
    { id: 'onboard',     label: 'Onboard',     emoji: '➕' },
    { id: 'aquaops',     label: 'AquaOps',     emoji: '💧' },
  ];

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#1e293b', border: '2px solid #facc15', padding: 40, width: 360 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#facc15', marginBottom: 2, letterSpacing: 1 }}>PlumbLead.ai</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>Operator Control Panel</div>
        <input type="password" placeholder="Admin key" value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAuth()}
          style={{ ...inp, background: '#0f172a', border: '2px solid #334155', color: '#fff', marginBottom: 8 }} />
        {keyError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 8px' }}>{keyError}</p>}
        <button onClick={handleAuth} style={{ ...btn(), width: '100%', padding: '12px' }}>Enter →</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <div style={{ background: '#0f172a', borderBottom: '3px solid #facc15', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#facc15', letterSpacing: 1 }}>PlumbLead<span style={{ color: '#64748b' }}>.ai</span> <span style={{ color: '#334155', fontSize: 14 }}>/ Admin</span></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/dashboard" style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textDecoration: 'none' }}>Lead Dashboard →</a>
          <a href="/" style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textDecoration: 'none' }}>Site →</a>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e2e8f0', display: 'flex', padding: '0 24px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...F, background: 'none', border: 'none', borderBottom: tab === t.id ? '3px solid #facc15' : '3px solid transparent', padding: '14px 20px', cursor: 'pointer', fontWeight: tab === t.id ? 800 : 600, fontSize: 14, color: tab === t.id ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', marginBottom: -2 }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'status'      && <StatusTab />}
        {tab === 'contractors' && <ContractorsTab />}
        {tab === 'leads'       && <LeadsTab />}
        {tab === 'onboard'     && <OnboardTab />}
        {tab === 'aquaops'     && <AquaOpsTab />}
      </div>
    </div>
  );
}
