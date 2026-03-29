// src/components/WaterQualityReport.tsx

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown'; // You'll need to install react-markdown

const WaterQualityReport: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the markdown file from the public directory
    fetch('/docs/water-quality-for-customers.md')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => setMarkdown(text))
      .catch(err => {
        console.error("Failed to fetch water quality report:", err);
        setError("Could not load water quality report. Please try again later.");
      });
  }, []);

  if (error) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div className="container" style={{ padding: '40px', lineHeight: '1.8' }}>
      <ReactMarkdown children={markdown} />
    </div>
  );
};

export default WaterQualityReport;
