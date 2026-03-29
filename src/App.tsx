// src/App.tsx (Placeholder - to be fully implemented with React UI)

import React from 'react';
import WaterQualityReport from './components/WaterQualityReport'; // Import the new component

export const translations = {
  en: {
    // ... (keep your existing nav, hero, trust sections)
    quote: {
      // ... (keep your existing steps)
      services: [
        "Water Heater Install",
        "Sewer Line Repair",
        "Drain Cleaning",
        "Leak Detection",
        "Toilet Repair/Install",
        "Water Treatment",
        "Other Plumbing Service",
      ],
    },
    // ...
  },
  es: {
    // ...
    quote: {
      // ...
      services: [
        "Instalación de Calentador",
        "Reparación de Alcantarillado",
        "Limpieza de Drenaje",
        "Detección de Fugas",
        "Reparación/Instalación de Inodoro",
        "Tratamiento de Agua",
        "Otro Servicio de Plomería",
      ],
    },
    // ...
  }
};

function App() {
  // A very basic, temporary way to show the report. In a real app, you'd use a router like react-router-dom.
  const [showReport, setShowReport] = React.useState(false);

  return (
    <div>
      {/* This will be the main React UI for PlumbLead.ai */}
      <h1>PlumbLead.ai (Under Construction with React)</h1>
      <p>This is a placeholder for the new React frontend. The backend services are being set up.</p>
      {/* TODO: Integrate QuoteTool, Chatbot, and other UI components here */}

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => setShowReport(!showReport)} style={{
          padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none',
          borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '700'
        }}>
          {showReport ? 'Hide Water Quality Report' : 'View Water Quality Report'}
        </button>
      </p>

      {showReport && <WaterQualityReport />}

      {/* PROBLEM - Rephrased Stats */}
      <section className="problem">
        <div className="container">
          <h2>Right now, your business could be <span className="red">missing out on opportunities</span></h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="stat">Up to 78%</div>
              <div className="stat-label">of jobs often go to the first responder</div>
              <p>Industry observations suggest that a significant majority of plumbing jobs are awarded to the company that responds first. Speed matters.</p>
            </div>
            <div className="problem-card">
              <div className="stat">~2hrs</div>
              <div className="stat-label">average web lead response time</div>
              <p>Many plumbing companies currently average response times around two hours for web leads, often missing out on urgent opportunities.</p>
            </div>
            <div className="problem-card">
              <div className="stat">Thousands</div>
              <div className="stat-label">in potential revenue per missed lead</div>
              <p>Each missed lead, potentially a significant job like a water heater install or sewer repair, could represent thousands in lost revenue for your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO VIDEO Placeholder */}
      <section className="demo-video-section" style={{ padding: '80px 0', textAlign: 'center', backgroundColor: '#f1f5f9' }}>
        <div className="container">
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>See PlumbLead.ai In Action</h2>
          <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px' }}>A quick walkthrough of how PlumbLead.ai captures, qualifies, and routes leads to your business in under 60 seconds.</p>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: '0', overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
            {/* Replace this iframe with your actual video embed code (e.g., Loom, YouTube) */}
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: '0', left: '0' }}
              title="PlumbLead.ai Demo Video Placeholder"
            ></iframe>
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '20px' }}>*This is a placeholder video. Your actual demo video will go here.</p>
        </div>
      </section>
    </div>
  );
}

export default App;
