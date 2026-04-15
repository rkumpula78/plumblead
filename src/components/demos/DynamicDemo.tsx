// src/components/demos/DynamicDemo.tsx
// Config-driven demo page — renders DemoShell from API config.
// Used by the /demo/:clientId route in App.tsx.
// No per-contractor file needed for new clients — just POST to /api/contractors.

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DemoShell, { DemoConfig } from './DemoShell';

const API_BASE = 'https://plumblead-production.up.railway.app';

const DynamicDemo: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) { setError('No client ID provided.'); return; }
    fetch(`${API_BASE}/api/contractor-config?clientId=${encodeURIComponent(clientId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: DemoConfig) => setConfig(data))
      .catch(() => setError('Demo page not found. Please contact PlumbLead support.'));
  }, [clientId]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Page Not Found</h2>
          <p style={{ fontSize: 14, color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  return <DemoShell config={config} />;
};

export default DynamicDemo;
