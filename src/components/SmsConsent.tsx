import React from 'react';

interface SmsConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  contractorName?: string;
}

const SmsConsent: React.FC<SmsConsentProps> = ({ checked, onChange, contractorName }) => {
  const senderLabel = contractorName
    ? `PlumbLead.ai and ${contractorName}`
    : 'PlumbLead.ai and the participating plumbing contractor';

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '14px',
        margin: '16px 0',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#334155',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '3px', flexShrink: 0, width: '16px', height: '16px' }}
      />
      <span>
        By checking this box, I agree to receive SMS messages from {senderLabel} about
        my service request, including service confirmations, quote follow-ups, and
        missed-call recovery alerts. Message frequency varies (typically 1–4 per
        request). Message and data rates may apply. Reply <strong>STOP</strong> to opt
        out, <strong>HELP</strong> for help. See our{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
          Terms
        </a>.
      </span>
    </label>
  );
};

export default SmsConsent;
