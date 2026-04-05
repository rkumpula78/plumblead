// src/components/demos/ProMaxDemo.tsx
// ProMax Water Heaters & Plumbing — Monroe, WA
// Owner: Evan Niemela | (425) 495-1961

import React from 'react';
import DemoShell, { DemoConfig } from './DemoShell';

const config: DemoConfig = {
  clientId: 'promax-water-heaters',
  clientName: 'ProMax Water Heaters & Plumbing',
  clientPhone: '(425) 495-1961',
  clientColor: '#1B4F8A',
  clientAccent: '#F5A623',
  address: '17461 147th St SE #6A, Monroe, WA 98272',
  serviceArea: 'Monroe, WA — Snohomish & King Counties',
  defaultZip: '98272',
  trustBadges: ['100% Satisfaction Guarantee', 'Upfront Pricing', 'Same-Day Available', 'Licensed Journeymen'],
  services: [
    { key: 'water-heater-tank',     label: 'Water Heater (Tank)',     icon: '🔥', hint: '$1,200 – $2,800' },
    { key: 'water-heater-tankless', label: 'Tankless Water Heater',   icon: '⚡', hint: '$2,500 – $5,500' },
    { key: 'water-heater-heatpump', label: 'Heat Pump Water Heater',  icon: '🌡️', hint: '$2,800 – $5,000' },
    { key: 'water-heater-repair',   label: 'Water Heater Repair',     icon: '🔧', hint: '$150 – $600' },
    { key: 'leak-detection',        label: 'Leak Detection',          icon: '💧', hint: '$200 – $500' },
    { key: 'repiping',              label: 'Repiping',                icon: '🏠', hint: '$4,000 – $12,000' },
    { key: 'drain-cleaning',        label: 'Drain Cleaning',          icon: '🚿', hint: '$150 – $400' },
    { key: 'toilet-repair',         label: 'Toilet Repair / Install', icon: '🚽', hint: '$150 – $500' },
    { key: 'sump-pump',             label: 'Sump Pump',               icon: '⛽', hint: '$500 – $1,500' },
    { key: 'faucet-fixture',        label: 'Faucets & Fixtures',      icon: '🚰', hint: '$150 – $400' },
    { key: 'main-water-line',       label: 'Main Water Line',         icon: '🔩', hint: '$1,500 – $5,000' },
    { key: 'other',                 label: 'Other Plumbing',          icon: '🛠️', hint: 'Varies' },
  ],
};

const ProMaxDemo: React.FC = () => <DemoShell config={config} />;
export default ProMaxDemo;
