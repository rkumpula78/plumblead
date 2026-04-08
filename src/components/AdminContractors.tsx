// src/components/AdminContractors.tsx
// Admin contractor management panel at /admin/contractors

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';
const ADMIN_KEY = 'plumblead-admin-2026';

const STRIPE_LINKS: Record<string, string> = {
  starter: 'https://buy.stripe.com/3cI4gz5HvejVevLcfrc3m03',
  pro:     'https://buy.stripe.com/eVqbJ16Lz4Jl73j5R3c3m02',
};

const PLANS = [
  { value: 'trial',   label: 'Trial',          price: 'Free' },
  { value: 'starter', label: 'Starter',        price: '$97/mo' },
  { value: 'pro',     label: 'Pro',            price: '$197/mo' },
  { value: 'agency',  label: 'Agency',         price: '$397/mo' },
];

const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  trial:   { bg: '#fefce8', color: '#854d0e' },
  starter: { bg: '#eff6ff', color: '#1d4ed8' },
  pro:     { bg: '#f0fdf4', color: '#166534' },
  agency:  { bg: '#faf5ff', color: '#7c3aed' },
};

const SUB_COLOR: Record<string, { bg: string; color: string }> = {
  trial:     { bg: '#fefce8', color: '#854d0e' },
  active:    { bg: '#f0fdf4', color: '#166534' },
  past_due:  { bg: '#fff7ed', color: '#9a3412' },
  cancelled: { bg: '#fef2f2', color: '#991b1b' },
  suspended: { bg: '#fef2f2', color: '#991b1b' },
};

interface Contractor {
  client_id: string;
  client_name: string;
  active: boolean;
  plan: string;
  subscription_status: string;
  created_at: string;
  notes?: string;
  phone?: string;
  callback_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_codes?: string;
  crm_system?: string;
  bilingual?: boolean;
  services?: string[];
  dashboard_code?: string;
  stripe_customer_id?: string;
}

function fmt(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  contractor: Contractor;
  onClose: () => void;
  onSave: (updated: Contractor) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ contractor, onClose, onSave }) => {
  const [selectedPlan, setSelectedPlan] = useState(contractor.plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const isDowngrade = PLANS.findIndex(p => p.value === selectedPlan) < PLANS.findIndex(p => p.value === contractor.plan);
  const hasStripeLink = !!STRIPE_LINKS[selectedPlan];

  async function handleSave() {
    if (!confirmed) { setConfirmed(true); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${contractor.client_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ plan: selectedPlan, subscription_status: selectedPlan === 'trial' ? 'trial' : 'active' }),
      });
      if (!res.ok) throw new Error('Failed to update plan');
      const data = await res.json();
      onSave(data.contractor);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  const s: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal:   { background: '#fff', border: '2px solid #0f172a', padding: 28, width: '100%', maxWidth: 480, fontFamily: "'DM Sans', sans-serif" },
    plan:    (selected: boolean, val: string): React.CSSProperties => ({
      padding: '14px 16px', border: selected ? '2px solid #0f172a' : '2px solid #e2e8f0',
      background: selected ? '#0f172a' : '#f8fafc', cursor: 'pointer', marginBottom: 8,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }),
    planName: (selected: boolean): React.CSSProperties => ({ fontWeight: 700, fontSize: 15, color: selected ? '#facc15' : '#0f172a' }),
    planPrice: (selected: boolean): React.CSSProperties => ({ fontSize: 13, color: selected ? '#94a3b8' : '#64748b' }),
    btn:     { background: '#facc15', color: '#0f172a', border: '2px solid #0f172a', padding: '12px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%', marginTop: 16 },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 0.5 }}>Change Plan</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{contractor.client_name} · currently on <strong>{contractor.plan}</strong></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {PLANS.map(p => (
          <div key={p.value} style={s.plan(selectedPlan === p.value, p.value)} onClick={() => { setSelectedPlan(p.value); setConfirmed(false); }}>
            <span style={s.planName(selectedPlan === p.value)}>{p.label}</span>
            <span style={s.planPrice(selectedPlan === p.value)}>{p.price}</span>
          </div>
        ))}

        {selectedPlan !== contractor.plan && (
          <div style={{ background: confirmed ? '#fef2f2' : '#f0fdf4', border: `1px solid ${confirmed ? '#fecaca' : '#bbf7d0'}`, padding: '12px 14px', marginTop: 12, fontSize: 13, color: confirmed ? '#991b1b' : '#166534' }}>
            {confirmed
              ? `⚠ Confirm: change ${contractor.client_name} from ${contractor.plan} → ${selectedPlan}${isDowngrade ? ' (DOWNGRADE)' : ''}. This updates the DB immediately.`
              : `Change ${contractor.client_name} from ${contractor.plan} → ${selectedPlan}${isDowngrade ? ' (downgrade)' : ' (upgrade)'}.`
            }
          </div>
        )}

        {hasStripeLink && selectedPlan !== contractor.plan && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', marginTop: 8, fontSize: 12, color: '#1d4ed8' }}>
            💳 Stripe payment link for {selectedPlan}:{' '}
            <a href={STRIPE_LINKS[selectedPlan]} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: 700 }}>Send to contractor →</a>
            <br />Share this before or after updating the plan.
          </div>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}

        <button
          style={{ ...s.btn, background: saving || selectedPlan === contractor.plan ? '#e2e8f0' : '#facc15', color: saving ? '#94a3b8' : '#0f172a' }}
          disabled={saving || selectedPlan === contractor.plan}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : confirmed ? '✓ Confirm Change' : selectedPlan === contractor.plan ? 'No Change' : `Change to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} →`}
        </button>
      </div>
    </div>
  );
};

// ─── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  contractor: Contractor;
  onClose: () => void;
  onSave: (updated: Contractor) => void;
}

const EditModal: React.FC<EditModalProps> = ({ contractor, onClose, onSave }) => {
  const [form, setForm] = useState({ ...contractor });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [rotatingCode, setRotatingCode] = useState(false);

  function set(field: keyof Contractor, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${contractor.client_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ notes: form.notes, phone: form.phone, callback_phone: form.callback_phone, email: form.email, city: form.city, state: form.state, zip_codes: form.zip_codes, crm_system: form.crm_system, bilingual: form.bilingual }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      onSave(data.contractor); onClose();
    } catch (e: any) { setError(e.message || 'Save failed.'); }
    finally { setSaving(false); }
  }

  async function handleRotateCode() {
    if (!newCode.trim()) return;
    setRotatingCode(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${contractor.client_id}/dashboard-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update code');
      const data = await res.json();
      setForm(prev => ({ ...prev, dashboard_code: data.dashboard_code })); setNewCode('');
    } catch (e: any) { setError(e.message || 'Code update failed.'); }
    finally { setRotatingCode(false); }
  }

  const s: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal:   { background: '#fff', border: '2px solid #0f172a', padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" },
    label:   { display: 'block', fontWeight: 700, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
    input:   { width: '100%', border: '2px solid #e2e8f0', padding: '9px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, outline: 'none', marginBottom: 14 },
    row:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btn:     { background: '#facc15', color: '#0f172a', border: '2px solid #0f172a', padding: '11px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%', marginTop: 8 },
    shead:   { fontWeight: 800, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#94a3b8', marginBottom: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' },
    code:    { background: '#0f172a', color: '#facc15', fontFamily: 'monospace', fontSize: 13, padding: '8px 14px', display: 'inline-block', marginBottom: 8 },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#0f172a', letterSpacing: 0.5 }}>{contractor.client_name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>clientId: {contractor.client_id}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>
        <div style={s.row}>
          <div><label style={s.label}>Business Phone</label><input style={s.input} value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
          <div><label style={s.label}>Callback Phone (SMS)</label><input style={s.input} value={form.callback_phone || ''} onChange={e => set('callback_phone', e.target.value)} /></div>
        </div>
        <div><label style={s.label}>Email</label><input style={s.input} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
        <div style={s.row}>
          <div><label style={s.label}>City</label><input style={s.input} value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
          <div><label style={s.label}>State</label><input style={s.input} value={form.state || ''} onChange={e => set('state', e.target.value)} /></div>
        </div>
        <div><label style={s.label}>Zip / Service Area</label><input style={s.input} value={form.zip_codes || ''} onChange={e => set('zip_codes', e.target.value)} /></div>
        <div style={s.row}>
          <div><label style={s.label}>CRM System</label><input style={s.input} value={form.crm_system || ''} onChange={e => set('crm_system', e.target.value)} placeholder="HCP, ServiceTitan..." /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input type="checkbox" id="bil" checked={!!form.bilingual} onChange={e => set('bilingual', e.target.checked)} />
            <label htmlFor="bil" style={{ fontSize: 13, cursor: 'pointer' }}>Bilingual (ES)</label>
          </div>
        </div>
        <div><label style={s.label}>Internal Notes</label><textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
        <div style={s.shead}>Dashboard Access Code</div>
        <div style={s.code}>{form.dashboard_code || '(not set)'}</div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 10px' }}>Contractor uses this at plumblead.ai/dashboard</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...s.input, marginBottom: 0, flex: 1 }} value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="New code (e.g. smith-plumbing-2026)" />
          <button onClick={handleRotateCode} disabled={rotatingCode || !newCode.trim()} style={{ ...s.btn, width: 'auto', marginTop: 0, padding: '9px 16px', fontSize: 13 }}>{rotatingCode ? '...' : 'Update'}</button>
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button style={{ ...s.btn, marginTop: 24, background: saving ? '#e2e8f0' : '#facc15', color: saving ? '#94a3b8' : '#0f172a' }} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AdminContractors() {
  const [authed, setAuthed]           = useState(false);
  const [keyInput, setKeyInput]       = useState('');
  const [keyError, setKeyError]       = useState('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading]         = useState(false);
  const [editing, setEditing]         = useState<Contractor | null>(null);
  const [upgrading, setUpgrading]     = useState<Contractor | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [stats, setStats]             = useState<Record<string, { total: number; won: number; revenue: number; last_lead_at: string }>>({});

  function handleAuth() {
    if (keyInput === ADMIN_KEY) setAuthed(true);
    else setKeyError('Invalid admin key.');
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/contractors`, { headers: { 'x-admin-key': ADMIN_KEY } }),
        fetch(`${API_BASE}/api/leads?limit=500&adminKey=${ADMIN_KEY}`),
      ]);
      const cData = await cRes.json();
      const lData = await lRes.json();
      const map: Record<string, { total: number; won: number; revenue: number; last_lead_at: string }> = {};
      for (const lead of (lData.leads || [])) {
        const cid = lead.clientId || 'demo';
        if (!map[cid]) map[cid] = { total: 0, won: 0, revenue: 0, last_lead_at: '' };
        map[cid].total++;
        if (lead.status === 'Won') { map[cid].won++; map[cid].revenue += lead.jobValue || 0; }
        if (!map[cid].last_lead_at || lead.receivedAt > map[cid].last_lead_at) map[cid].last_lead_at = lead.receivedAt;
      }
      setStats(map);
      setContractors(cData.contractors || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (authed) fetchAll(); }, [authed]);

  async function toggleActive(c: Contractor) {
    setToggling(c.client_id);
    try {
      const endpoint = c.active ? 'disable' : 'enable';
      await fetch(`${API_BASE}/api/contractors/${c.client_id}/${endpoint}`, { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY } });
      setContractors(prev => prev.map(x => x.client_id === c.client_id ? { ...x, active: !c.active, subscription_status: !c.active ? 'active' : 'cancelled' } : x));
    } finally { setToggling(null); }
  }

  function handleSaved(updated: Contractor) {
    setContractors(prev => prev.map(c => c.client_id === updated.client_id ? { ...c, ...updated } : c));
  }

  const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" },
    bar:    { background: '#0f172a', borderBottom: '3px solid #facc15', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:   { maxWidth: 1100, margin: '0 auto', padding: 24 },
    card:   { background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 12 },
    badge:  (plan: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', ...(PLAN_COLOR[plan] || { bg: '#f1f5f9', color: '#64748b' }) }),
    subbadge: (status: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', ...(SUB_COLOR[status] || { bg: '#f1f5f9', color: '#64748b' }) }),
    toggle: (active: boolean): React.CSSProperties => ({ padding: '5px 12px', fontSize: 12, fontWeight: 700, border: `2px solid ${active ? '#16a34a' : '#dc2626'}`, background: active ? '#f0fdf4' : '#fef2f2', color: active ? '#16a34a' : '#dc2626', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }),
    stat:   { textAlign: 'center' as const },
    statN:  { fontSize: 18, fontWeight: 800, color: '#0f172a' },
    statL:  { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  };

  if (!authed) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '2px solid #0f172a', padding: 32, width: 360, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#0f172a', marginBottom: 4 }}>Admin Access</div>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>PlumbLead.ai — Contractor Manager</p>
        <input type="password" placeholder="Admin key" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} style={{ width: '100%', border: '2px solid #e2e8f0', padding: '10px 12px', fontSize: 15, boxSizing: 'border-box', outline: 'none', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }} />
        {keyError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 8px' }}>{keyError}</p>}
        <button onClick={handleAuth} style={{ width: '100%', background: '#facc15', color: '#0f172a', border: '2px solid #0f172a', padding: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Enter →</button>
      </div>
    </div>
  );

  const active   = contractors.filter(c => c.active);
  const inactive = contractors.filter(c => !c.active);
  const totalRevenue = Object.values(stats).reduce((s, v) => s + v.revenue, 0);
  const mrr = contractors.filter(c => c.active && c.plan !== 'trial').reduce((sum, c) => sum + ({ starter: 97, pro: 197, agency: 397 }[c.plan] || 0), 0);

  return (
    <div style={s.page}>
      <div style={s.bar}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#facc15', letterSpacing: 1 }}>PlumbLead<span style={{ color: '#fff' }}>.ai</span></div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: 12, color: '#facc15', fontWeight: 700, textDecoration: 'none' }}>← Lead Dashboard</a>
          <a href="/admin/onboard" style={{ fontSize: 12, color: '#facc15', fontWeight: 700, textDecoration: 'none' }}>+ Onboard</a>
        </div>
      </div>

      <div style={s.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#0f172a', margin: '0 0 4px', letterSpacing: 0.5 }}>Contractor Manager</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{contractors.length} contractors · {active.length} active · <strong style={{ color: '#166534' }}>${mrr.toLocaleString()}/mo MRR</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 0, background: '#fff', border: '2px solid #0f172a' }}>
            {[{ n: contractors.length, l: 'Total' }, { n: active.length, l: 'Active' }, { n: inactive.length, l: 'Paused' }, { n: `$${mrr}/mo`, l: 'MRR' }, { n: `$${totalRevenue.toLocaleString()}`, l: 'Rev Won' }].map((x, i) => (
              <div key={i} style={{ ...s.stat, borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none', padding: '12px 18px' }}>
                <div style={s.statN}>{x.n}</div>
                <div style={s.statL}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading contractors...</div>
        ) : contractors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No contractors yet. <a href="/admin/onboard">Onboard your first one →</a></div>
        ) : (
          [{ label: 'Active', items: active }, { label: 'Paused', items: inactive }].map(group =>
            group.items.length === 0 ? null : (
              <div key={group.label}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 8, marginTop: 8 }}>{group.label}</div>
                {group.items.map(c => {
                  const st = stats[c.client_id] || { total: 0, won: 0, revenue: 0, last_lead_at: '' };
                  const subStatus = c.subscription_status || 'trial';
                  return (
                    <div key={c.client_id} style={s.card}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16, flexWrap: 'wrap' }}>
                        {/* Name + meta */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{c.client_name}</span>
                            <span style={s.badge(c.plan)}>{c.plan}</span>
                            <span style={s.subbadge(subStatus)}>{subStatus}</span>
                            {!c.active && <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '2px 7px', fontWeight: 800 }}>PAUSED</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {[c.phone, c.email, c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state].filter(Boolean).join(' · ') || c.client_id}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            {c.client_id}{c.crm_system ? ` · ${c.crm_system}` : ''}{c.bilingual ? ' · 🌐 ES' : ''} · Added {fmt(c.created_at)}
                          </div>
                        </div>

                        {/* Lead stats */}
                        <div style={{ display: 'flex', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                          {[{ n: st.total, l: 'Leads' }, { n: st.won, l: 'Won' }, { n: st.revenue ? `$${st.revenue.toLocaleString()}` : '—', l: 'Revenue' }].map((x, i) => (
                            <div key={i} style={{ ...s.stat, borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none', padding: '8px 14px' }}>
                              <div style={s.statN}>{x.n}</div>
                              <div style={s.statL}>{x.l}</div>
                            </div>
                          ))}
                        </div>

                        {/* Dashboard code */}
                        <div style={{ minWidth: 130, fontSize: 12 }}>
                          <div style={{ color: '#94a3b8', marginBottom: 2 }}>Dashboard code</div>
                          <code style={{ background: '#f1f5f9', padding: '2px 6px', fontSize: 11 }}>{c.dashboard_code || '(not set)'}</code>
                          <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Last lead: {st.last_lead_at ? fmt(st.last_lead_at) : '—'}</div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => setUpgrading(c)}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, border: '2px solid #7c3aed', background: '#faf5ff', color: '#7c3aed', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                            ↑ Plan
                          </button>
                          <button style={s.toggle(c.active)} disabled={toggling === c.client_id} onClick={() => toggleActive(c)}>
                            {toggling === c.client_id ? '...' : c.active ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => setEditing(c)}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, border: '2px solid #0f172a', background: '#0f172a', color: '#facc15', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Warnings */}
                      {!c.dashboard_code && (
                        <div style={{ background: '#fefce8', borderTop: '1px solid #fde047', padding: '7px 20px', fontSize: 12, color: '#713f12' }}>
                          ⚠ No dashboard code set — click Edit to add one.
                        </div>
                      )}
                      {subStatus === 'past_due' && (
                        <div style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa', padding: '7px 20px', fontSize: 12, color: '#9a3412' }}>
                          ⚠ Payment past due — follow up with contractor or send Stripe payment link.
                        </div>
                      )}
                      {subStatus === 'cancelled' && c.active && (
                        <div style={{ background: '#fef2f2', borderTop: '1px solid #fecaca', padding: '7px 20px', fontSize: 12, color: '#991b1b' }}>
                          ⚠ Subscription cancelled but account still active — pause or re-activate billing.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )
        )}
      </div>

      {upgrading && <UpgradeModal contractor={upgrading} onClose={() => setUpgrading(null)} onSave={handleSaved} />}
      {editing   && <EditModal   contractor={editing}   onClose={() => setEditing(null)}   onSave={handleSaved} />}
    </div>
  );
}
