// src/App.tsx
import React from 'react';
import LandingPage from './components/LandingPage';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <>
      <LandingPage />
      <Chatbot lang="en" />
    </>
  );
}

export default App;
