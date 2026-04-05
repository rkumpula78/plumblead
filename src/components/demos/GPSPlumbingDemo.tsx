// src/components/demos/GPSPlumbingDemo.tsx
// GPS Plumbing Inc. — Monroe, WA
// (425) 458-8548 | Snohomish & King Counties | 24/7 Emergency

import React from 'react';
import DemoShell, { DemoConfig } from './DemoShell';

const config: DemoConfig = {
  clientId: 'gps-plumbing',
  clientName: 'GPS Plumbing Inc.',
  clientPhone: '(425) 458-8548',
  clientColor: '#1A5C2A',
  clientAccent: '#F5A623',
  address: '26016 132nd St SE, Monroe, WA 98272',
  serviceArea: 'Monroe, WA — Snohomish & King Counties',
  defaultZip: '98272',
  emergencyBanner: '🚨 24/7 Emergency Service Available',
  trustBadges: ['100% Satisfaction Guarantee', '24/7 Emergency Service', 'Family Owned & Operated'],
  services: [
    { key: 'water-heater-tank',     label: 'Water Heater Replacement', icon: '🔥', hint: '$1,200 – $2,800' },
    { key: 'water-heater-tankless', label: 'Tankless Water Heater',    icon: '⚡', hint: '$2,500 – $5,500' },
    { key: 'water-heater-repair',   label: 'Water Heater Repair',      icon: '🔧', hint: '$150 – $600' },
    { key: 'emergency-leak',        label: '🚨 Emergency / Leak',      icon: '🚨', hint: 'Call immediately' },
    { key: 'drain-cleaning',        label: 'Drain Cleaning',           icon: '🚿', hint: '$150 – $400' },
    { key: 'toilet-repair',         label: 'Toilet Repair / Install',  icon: '🚽', hint: '$150 – $500' },
    { key: 'faucet-fixture',        label: 'Faucets & Fixtures',       icon: '🚰', hint: '$150 – $400' },
    { key: 'low-water-pressure',    label: 'Low Water Pressure',       icon: '💧', hint: '$200 – $800' },
    { key: 'sewer-line',            label: 'Sewer Line',               icon: '🔩', hint: '$2,000 – $8,000' },
    { key: 'property-manager',      label: 'Property Management',      icon: '🏢', hint: 'Custom pricing' },
    { key: 'repiping',              label: 'Repiping',                 icon: '🏠', hint: '$4,000 – $12,000' },
    { key: 'other',                 label: 'Other Plumbing',           icon: '🛠️', hint: 'Varies' },
  ],
};

const GPSPlumbingDemo: React.FC = () => <DemoShell config={config} />;
export default GPSPlumbingDemo;
