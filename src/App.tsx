import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import QuoteTool from './components/QuoteTool';
import WaterQualityReport from './components/WaterQualityReport';
import Dashboard from './components/Dashboard';
import SubmitTrial from './components/SubmitTrial';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quote" element={<QuoteTool />} />
        <Route path="/water-quality" element={<WaterQualityReport />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/submit-trial" element={<SubmitTrial />} />
      </Routes>
      <Chatbot lang="en" />
    </Router>
  );
}

export default App;
