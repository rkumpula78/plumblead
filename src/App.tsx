import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import QuoteTool from './components/QuoteTool';
import WaterQualityReport from './components/WaterQualityReport';
import Dashboard from './components/Dashboard';
import SubmitTrial from './components/SubmitTrial';
import WidgetDemo from './components/WidgetDemo';
import Chatbot from './components/Chatbot';
import QuoteModal from './components/QuoteModal';
import ProMaxDemo from './components/demos/ProMaxDemo';
import GPSPlumbingDemo from './components/demos/GPSPlumbingDemo';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import AdminOnboard from './components/AdminOnboard';
import AdminContractors from './components/AdminContractors';
import CheckoutPage from './components/CheckoutPage';
import CheckoutSuccess from './components/CheckoutSuccess';

const ChatbotWithModal: React.FC = () => {
  const location = useLocation();
  const [quoteModalOpen, setQuoteModalOpen] = React.useState(false);

  const hide =
    ['/widget-demo', '/terms', '/privacy'].includes(location.pathname) ||
    location.pathname.startsWith('/demo/') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/checkout') ||
    (location.pathname === '/quote' && new URLSearchParams(location.search).get('widget') === '1');

  if (hide) return null;

  return (
    <>
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        clientId="demo"
        clientName="Demo Contractor"
        clientColor="#0ea5e9"
      />
      <Chatbot lang="en" onOpenQuote={() => setQuoteModalOpen(true)} />
    </>
  );
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
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/demo/promax" element={<ProMaxDemo />} />
        <Route path="/demo/gps" element={<GPSPlumbingDemo />} />
        <Route path="/admin/onboard" element={<AdminOnboard />} />
        <Route path="/admin/contractors" element={<AdminContractors />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
      </Routes>
      <ChatbotWithModal />
    </Router>
  );
}

export default App;
