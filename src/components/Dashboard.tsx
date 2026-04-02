import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  urgency: string;
  zip: string;
  time: string;
  status: string;
  client: string;
  source: string;
  campaign: string;
  details: string;
  date: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock authentication
  const handleAuth = () => {
    if (accessCode === 'demo-2024' || accessCode === 'plumblead-admin') {
      setAuthenticated(true);
      setAuthError(false);
      loadLeads();
    } else {
      setAuthError(true);
    }
  };

  // Mock lead data loading
  const loadLeads = () => {
    setLoading(true);
    // In production, this would fetch from the API
    setTimeout(() => {
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '(602) 555-0123',
          email: 'john@example.com',
          service: 'Water Heater (Tank)',
          urgency: 'routine',
          zip: '85383',
          time: 'Morning',
          status: 'New',
          client: 'demo',
          source: 'website',
          campaign: '',
          details: '40-gallon gas water heater, 10 years old, leaking',
          date: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Maria Garcia',
          phone: '(480) 555-0456',
          email: 'maria@example.com',
          service: 'Emergency / Leak',
          urgency: 'emergency',
          zip: '85254',
          time: 'ASAP',
          status: 'Contacted',
          client: 'demo',
          source: 'google',
          campaign: 'emergency-ads',
          details: 'Pipe burst in kitchen',
          date: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setLeads(mockLeads);
      setLoading(false);
    }, 500);
  };

  const filteredLeads = filterStatus === 'all'
    ? leads
    : leads.filter(l => l.status === filterStatus);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    won: leads.filter(l => l.status === 'Won').length,
    decided: leads.filter(l => l.status === 'Won' || l.status === 'Lost').length
  };

  const closeRate = stats.decided > 0 ? Math.round((stats.won / stats.decided) * 100) : 0;

  const bySource = leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!authenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          width: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0ea5e9', marginBottom: 8 }}>
            Plumb<span style={{ color: '#0f172a' }}>Lead</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Enter your dashboard access code
          </p>
          <input
            type="text"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAuth()}
            placeholder="Access code"
            maxLength={32}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 16,
              textAlign: 'center',
              letterSpacing: 2,
              marginBottom: 16,
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleAuth}
            style={{
              width: '100%',
              padding: 14,
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            View Dashboard →
          </button>
          {authError && (
            <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
              Invalid access code
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Topbar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0ea5e9' }}>
          Plumb<span style={{ color: '#0f172a' }}>Lead</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>Demo Dashboard</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Last 30 days</div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          {[
            { label: 'Total Leads', value: stats.total },
            { label: 'New (Uncontacted)', value: stats.new },
            { label: 'Won', value: stats.won, color: '#10b981' },
            { label: 'Close Rate', value: stats.decided > 0 ? `${closeRate}%` : '—' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                color: stat.color || '#0f172a',
                marginTop: 4
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Source Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          {[
            { label: 'From Website', value: bySource.website || 0 },
            { label: 'From Google Ads', value: bySource.google || 0 },
            { label: 'From Google Business', value: bySource.gbp || 0 },
            { label: 'Other Sources', value: stats.total - (bySource.website || 0) - (bySource.google || 0) - (bySource.gbp || 0) }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Leads</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'New', 'Contacted', 'Won', 'Lost'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    fontWeight: 500,
                    background: filterStatus === status ? '#0ea5e9' : '#fff',
                    color: filterStatus === status ? '#fff' : '#64748b',
                    cursor: 'pointer'
                  }}>
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              No leads found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['Contact', 'Service', 'Urgency', 'Zip', 'Status', 'Source', 'Date'].map(header => (
                    <th key={header} style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <strong>{lead.name}</strong><br />
                      <span style={{ fontSize: 12, color: '#64748b' }}>{lead.phone}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{lead.service}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: lead.urgency === 'emergency' ? '#fee2e2' : lead.urgency === 'soon' ? '#fef3c7' : '#d1fae5',
                        color: lead.urgency === 'emergency' ? '#991b1b' : lead.urgency === 'soon' ? '#92400e' : '#065f46'
                      }}>
                        {lead.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{lead.zip}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={lead.status}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                          background: '#fff',
                          cursor: 'pointer'
                        }}>
                        {['New', 'Contacted', 'Quoted', 'Won', 'Lost'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: '#94a3b8' }}>
                      {lead.source}{lead.campaign ? ` / ${lead.campaign}` : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      {new Date(lead.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
