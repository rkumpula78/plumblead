import React from 'react';

const Privacy: React.FC = () => (
  <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '0 auto', padding: '60px 24px', color: '#0f172a', lineHeight: 1.7 }}>
    <div style={{ marginBottom: 40 }}><a href="/" style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: 14 }}>← Back to PlumbLead.ai</a></div>
    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 40 }}>Last updated: April 2026 · PlumbLead.ai is operated by K48 Ventures LLC</p>
    <p style={{ marginBottom: 24 }}>K48 Ventures LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;PlumbLead.ai&rdquo;) is committed to protecting your privacy. This Policy explains how we collect, use, and protect information when you use our Service.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>1. Information We Collect</h2>
    <p>We collect name, phone number, email address, zip code, and service details submitted through quote forms. For contractor signups we collect business name, city, CRM system, and truck count. We also collect basic usage data about how you interact with the Service.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>2. How We Use Your Information</h2>
    <p>We use your information to: connect homeowners with plumbing contractors; send transactional SMS messages about service requests; generate AI-powered price estimates; notify contractors of new leads; and improve the Service.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>3. Information Sharing</h2>
    <p>We share homeowner contact information with the contractor fulfilling the service request. <strong>We do not sell your personal information to third parties. We do not share your information with advertisers or for third-party marketing purposes.</strong> Third-party services used: Twilio (SMS delivery), Google Gemini (AI estimates), Railway (hosting), Cloudflare (CDN), Stripe (payment processing).</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>4. SMS Messaging Program</h2>
    <p><strong>Program name: PlumbLead</strong></p>
    <p style={{ marginTop: 8 }}>By submitting your phone number through a service request form, you consent to receive SMS messages from PlumbLead.ai. Messages are sent from phone numbers operated by K48 Ventures LLC using Twilio.</p>
    <p style={{ marginTop: 12 }}><strong>Message types:</strong> Service request confirmations, contractor connection notifications, quote follow-ups, and missed-call recovery alerts. These are transactional messages directly related to your service request.</p>
    <p style={{ marginTop: 12 }}><strong>Message frequency:</strong> Typically 1–3 messages per service request. Frequency varies based on activity.</p>
    <p style={{ marginTop: 12 }}><strong>Message and data rates may apply.</strong></p>
    <p style={{ marginTop: 12 }}>To opt out: reply <strong>STOP</strong> to any message. You will receive one confirmation and no further messages will be sent. To get help: reply <strong>HELP</strong> or email ryan@plumblead.ai. Carriers are not liable for delayed or undelivered messages.</p>
    <p style={{ marginTop: 12 }}>Your phone number is not shared with third parties for their own marketing. It is shared only with the plumbing contractor fulfilling your request.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>5. Data Storage and Security</h2>
    <p>Lead data is stored in a PostgreSQL database on Railway infrastructure in the United States, using industry-standard security practices including SSL encryption. We retain data for up to 24 months or until deletion is requested.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>6. Your Rights</h2>
    <p>You may request access to, correction of, or deletion of your personal information at any time by emailing ryan@plumblead.ai. We respond within 30 days.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>7. Cookies</h2>
    <p>PlumbLead.ai does not use tracking or advertising cookies. We may use essential session cookies required for the Service to function.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>8. Children</h2>
    <p>The Service is not directed at children under 13. We do not knowingly collect information from children under 13.</p>

    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>9. Contact</h2>
    <p>K48 Ventures LLC · PlumbLead.ai<br />
    7010 E Acoma Dr Suite 101, Scottsdale, AZ 85254<br />
    Email: <a href="mailto:ryan@plumblead.ai" style={{ color: '#0ea5e9' }}>ryan@plumblead.ai</a><br />
    Phone: <a href="tel:+18335580877" style={{ color: '#0ea5e9' }}>(833) 558-0877</a></p>

    <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid #e2e8f0', fontSize: 13, color: '#94a3b8' }}>
      © 2026 K48 Ventures LLC · PlumbLead.ai &middot; <a href="/terms" style={{ color: '#94a3b8' }}>Terms of Service</a>
    </div>
  </div>
);
export default Privacy;
