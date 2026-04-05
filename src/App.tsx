import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import QuoteTool from './components/QuoteTool';
import WaterQualityReport from './components/WaterQualityReport';
import Dashboard from './components/Dashboard';
import SubmitTrial from './components/SubmitTrial';
import WidgetDemo from './components/WidgetDemo';
import Chatbot from './components/Chatbot';
import ProMaxDemo from './components/demos/ProMaxDemo';
import GPSPlumbingDemo from './components/demos/GPSPlumbingDemo';

// Only show Chatbot on routes where it makes sense
const ChatbotConditional: React.FC = () => {
  const location = useLocation();
  const isWidgetDemo = location.pathname === '/widget-demo';
  const isWidgetIframe = location.pathname === '/quote' && new URLSearchParams(location.search).get('widget') === '1';
  const isDemo = location.pathname.startsWith('/demo/');
  if (isWidgetDemo || isWidgetIframe || isDemo) return null;
  return <Chatbot lang="en" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quote" element={<QuoteTool />} />
        <Route path="/water-quality" element={<WaterQualityReport />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit-trial" element={<SubmitTrial />} />
        <Route path="/widget-demo" element={<WidgetDemo />} />
        {/* Contractor demo pages */}
        <Route path="/demo/promax" element={<ProMaxDemo />} />
        <Route path="/demo/gps" element={<GPSPlumbingDemo />} />
      </Routes>
      <ChatbotConditional />
    </Router>
  );
}

export default App;
