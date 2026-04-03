import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import QuoteTool from './components/QuoteTool';
import WaterQualityReport from './components/WaterQualityReport';
import Dashboard from './components/Dashboard';
import SubmitTrial from './components/SubmitTrial';
import WidgetDemo from './components/WidgetDemo';
import Chatbot from './components/Chatbot';

// Only show Chatbot on routes where it makes sense
// Hide on /widget-demo (has its own widget) and /quote?widget=1 (inside iframe)
const ChatbotConditional: React.FC = () => {
  const location = useLocation();
  const isWidgetDemo = location.pathname === '/widget-demo';
  const isWidgetIframe = location.pathname === '/quote' && new URLSearchParams(location.search).get('widget') === '1';
  if (isWidgetDemo || isWidgetIframe) return null;
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
      </Routes>
      <ChatbotConditional />
    </Router>
  );
}

export default App;
