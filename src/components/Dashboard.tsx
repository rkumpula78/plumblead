import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://plumblead-production.up.railway.app';
const ADMIN_KEY = 'plumblead-admin-2026';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';

interface Lead {
  id: string;
  receivedAt: string;
  status: LeadStatus;
  jobValue?: number;
  statusNote?: string;
  statusUpdatedAt?: string;
  name?: string;
  phone?: string;
  email?: string;
  serviceLabel?: string;
  service?: string;
  urgency?: string;
  zipCode?: string;
  estimateRange?: string;
  leadScore?: string;
  crossSellOpportunities?: string[];
  preferredTime?: string;
  details?: string;
  lang?: string;
  source?: string;
  clientId?: string;
  clientName?: string;
  submittedAt?: string;
  // water quality fields
  waterHardness?: string;
  annualCostEstimate?: string;
  recommendations?: string;
  city?: string;
  state?: string;
  // trial fields
  company?: string;
  trucks?: string;
  crm?: string;
  type?: string;
  [key: string]: unknown;
}

// ─── Access Codes ─────────────────────────────────────────────────────────────
// clientId → access code mapping
// Add contractor slugs + codes here as you onboard clients
const ACCESS_CODES: Record<string, { clientId: string; label: string }> = {
  'plumblead-admin-2026': { clientId: '__all__', label: 'Admin — All Leads' },
  'demo-2024':            { clientId: 'demo',    label: 'Demo Contractor' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<LeadStatus, { bg: string; color: string }> = {
  New:       { bg: '#eff6ff', color: '#1d4ed8' },
  Contacted: { bg: '#fefce8', color: '#854d0e' },
  Quoted:    { bg: '#faf5ff', color: '#7c3aed' },
  Won:       { bg: '#f0fdf4', color: '#166534' },
  Lost:      { bg: '#fef2f2', color: '#991b1b' },
};

const URGENCY_COLOR: Record<string, { bg: string; color: string }> = {
  emergency: { bg: '#fee2e2', color: '#991b1b' },
  soon:      { bg: '#fef3c7', color: '#92400e' },
  routine:   { bg: '#d1fae5', color: '#065f46' },
};

function fmt(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function currency(n?: number) {
  if (!n) return '';
  return `$${n.toLocaleString()}`;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

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

// ─── Lead Detail Modal ────────────────────────────────────────────────────────

interface ModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: string, update: { status?: LeadStatus; jobValue?: number; statusNote?: string }) => Promise<void>;
}

const LeadModal: React.FC<ModalProps> = ({ lead, onClose, onSave }) => {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [jobValue, setJobValue] = useState(lead.jobValue?.toString() || '');
  const [statusNote, setStatusNote] = useState(lead.statusNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(lead.id, {
      status,
      jobValue: jobValue ? parseFloat(jobValue) : undefined,
      statusNote: statusNote || undefined,
    });
    setSaving(false);
    onClose();
  };

  const isWater = lead.source === 'water-quality-report';
  const isTrial = lead.type === 'trial_signup';
  const serviceDisplay = lead.serviceLabel || lead.service || (isWater ? 'Water Treatment Consultation' : isTrial ? 'Trial Signup' : 'Unknown');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{lead.name || lead.company || 'Unknown'}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{lead.phone} {lead.email ? `· ${lead.email}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Lead Info */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Service', serviceDisplay],
              ['Urgency', lead.urgency || '—'],
              ['Zip / City', [lead.zipCode, lead.city, lead.state].filter(Boolean).join(', ') || '—'],
              ['Preferred Time', lead.preferredTime || '—'],
              ['Estimate Range', lead.estimateRange || '—'],
              ['AI Lead Score', lead.leadScore || '—'],
              ['Source', lead.source || '—'],
              ['Received', fmt(lead.receivedAt)],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#0f172a', marginTop: 2, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {lead.details && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</div>
              <div style={{ fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 1.5 }}>{lead.details}</div>
            </div>
          )}
          {isWater && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Water Report</div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                Hardness: {lead.waterHardness} · Est. cost: {lead.annualCostEstimate}<br />
                Recommendations: {lead.recommendations}
              </div>
            </div>
          )}
          {lead.crossSellOpportunities && (lead.crossSellOpportunities as string[]).length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(lead.crossSellOpportunities as string[]).map((opp, i) => (
                <span key={i} style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{opp}</span>
              ))}
            </div>
          )}
        </div>

        {/* Status Update */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Update Status</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['New', 'Contacted', 'Quoted', 'Won', 'Lost'] as LeadStatus[]).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: '8px 16px', borderRadius: 8, border: `2px solid ${status === s ? STATUS_COLOR[s].color : '#e2e8f0'}`,
                background: status === s ? STATUS_COLOR[s].bg : '#fff',
                color: status === s ? STATUS_COLOR[s].color : '#64748b',
                fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Job Value — only show if Won */}
        {status === 'Won' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Job Value (Revenue Won)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, color: '#64748b', fontWeight: 700 }}>$</span>
              <input
                type="number"
                value={jobValue}
                onChange={e => setJobValue(e.target.value)}
                placeholder="e.g. 1400"
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none' }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Enter the actual job revenue to track ROI</div>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Note (optional)</label>
          <input
            type="text"
            value={statusNote}
            onChange={e => setStatusNote(e.target.value)}
            placeholder="e.g. Left voicemail, booked for Thursday..."
            style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: 14, background: saving ? '#94a3b8' : '#0ea5e9',
          color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer'
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [clientId, setClientId] = useState('__all__');
  const [clientLabel, setClientLabel] = useState('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleAuth = () => {
    const match = ACCESS_CODES[accessCode.trim()];
    if (match) {
      setAuthenticated(true);
      setClientId(match.clientId);
      setClientLabel(match.label);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200', adminKey: ADMIN_KEY });
      if (clientId !== '__all__') params.set('clientId', clientId);
      const res = await fetch(`${API_BASE}/api/leads?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load leads. Check Railway is running.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (authenticated) fetchLeads();
  }, [authenticated, fetchLeads]);

  const updateLead = async (id: string, update: { status?: LeadStatus; jobValue?: number; statusNote?: string }) => {
    const res = await fetch(`${API_BASE}/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify(update),
    });
    if (res.ok) {
      const { lead } = await res.json();
      setLeads(prev => prev.map(l => l.id === id ? lead : l));
    }
  };

  // Filtered leads
  const filtered = leads.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    return true;
  });

  const stats = calcStats(leads);
  const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean))) as string[];

  // ─── Login Screen ──────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D0D0D', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: '#F5A623', letterSpacing: 1, marginBottom: 4 }}>PlumbLead<span style={{ color: '#0D0D0D' }}>.ai</span></div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Contractor Dashboard</div>
          <input
            type="password"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Enter access code"
            style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 16, textAlign: 'center', letterSpacing: 2, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <button onClick={handleAuth} style={{ width: '100%', padding: 14, background: '#F5A623', color: '#0D0D0D', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>View My Leads →</button>
          {authError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>Invalid access code</div>}
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>Questions? (833) 558-0877</div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>

      {/* Topbar */}
      <div style={{ background: '#0D0D0D', borderBottom: '3px solid #F5A623', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#F5A623', letterSpacing: 1 }}>PlumbLead<span style={{ color: '#fff' }}>.ai</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#991b1b' }}>{error}</div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Leads', value: stats.total, color: '#0f172a' },
            { label: 'New', value: stats.byStatus['New'] || 0, color: '#1d4ed8' },
            { label: 'Won', value: stats.won, color: '#166534' },
            { label: 'Close Rate', value: stats.closeRate !== null ? `${stats.closeRate}%` : '—', color: '#7c3aed' },
            { label: 'Revenue Won', value: stats.revenue > 0 ? `$${stats.revenue.toLocaleString()}` : '—', color: '#166534' },
            { label: 'Avg Ticket', value: stats.avgTicket ? `$${stats.avgTicket.toLocaleString()}` : '—', color: '#0f172a' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ROI Box — only show if there's revenue data */}
        {stats.revenue > 0 && (
          <div style={{ background: '#0D0D0D', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#9E9B91', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>PlumbLead ROI</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A623', marginTop: 4 }}>
                {stats.revenue > 0 ? `${Math.round(stats.revenue / (197 || 97))}× return` : '—'}
              </div>
              <div style={{ fontSize: 13, color: '#5C5A53', marginTop: 2 }}>
                ${stats.revenue.toLocaleString()} revenue / $197 plan cost
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#9E9B91' }}>Won jobs: {stats.won}</div>
              <div style={{ fontSize: 13, color: '#9E9B91' }}>Avg ticket: {stats.avgTicket ? `$${stats.avgTicket.toLocaleString()}` : '—'}</div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Filters */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginRight: 4 }}>Leads</span>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'New', 'Contacted', 'Quoted', 'Won', 'Lost'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: filterStatus === s ? '#0ea5e9' : '#fff',
                  color: filterStatus === s ? '#fff' : '#64748b'
                }}>{s === 'all' ? 'All' : s} {s !== 'all' && stats.byStatus[s] ? `(${stats.byStatus[s]})` : ''}</button>
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
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              {leads.length === 0 ? 'No leads yet — submit a test lead at plumblead.ai/quote' : 'No leads match this filter'}
            </div>
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
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name || lead.company || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{lead.phone || '—'}</div>
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#334155', maxWidth: 180 }}>
                        <div style={{ fontWeight: 500 }}>{lead.serviceLabel || lead.service || (lead.source === 'water-quality-report' ? 'Water Treatment' : lead.type === 'trial_signup' ? 'Trial Signup' : '—')}</div>
                        {lead.zipCode && <div style={{ fontSize: 11, color: '#94a3b8' }}>{lead.zipCode}{lead.city ? ` · ${lead.city}` : ''}</div>}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {lead.urgency && (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, marginBottom: 3, ...(URGENCY_COLOR[lead.urgency] || { bg: '#f1f5f9', color: '#334155' }) }}>
                            {lead.urgency}
                          </span>
                        )}
                        {lead.leadScore && (
                          <div style={{ fontSize: 11, color: lead.leadScore === 'Emergency' ? '#dc2626' : lead.leadScore === 'High Urgency' ? '#d97706' : '#64748b', fontWeight: 600 }}>
                            {lead.leadScore}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#0ea5e9', fontWeight: 600 }}>
                        {lead.estimateRange || '—'}
                        {lead.jobValue && <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Won: {currency(lead.jobValue)}</div>}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, ...STATUS_COLOR[lead.status] }}>
                          {lead.status}
                        </span>
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
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={updateLead}
        />
      )}
    </div>
  );
};

export default Dashboard;
