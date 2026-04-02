import React, { useState } from 'react';
import waterData from '../data/az-water-data.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityData {
  name: string;
  hardness_gpg: { low: number; high: number; avg: number };
  hardness_ppm: { low: number; high: number; avg: number };
  tds_ppm: { low: number; high: number; avg: number };
  ph: { low: number; high: number; avg: number };
  chlorine_ppm: { low: number; high: number; avg: number };
  disinfection: string;
  source: string;
  zip_codes: string[];
}

interface HardnessLevel {
  level: string;
  color: string;
  emoji: string;
  severity: number;
}

interface Recommendation {
  priority: string;
  product: string;
  reason: string;
  priceRange: string;
}

interface WaterReport {
  city: string;
  zipCode: string;
  hardness: {
    low: number;
    high: number;
    avg: number;
    ppm: number;
    level: string;
    color: string;
    emoji: string;
  };
  tds: number;
  ph: number;
  disinfection: string;
  annualCost: {
    low: number;
    high: number;
    avg: number;
    breakdown: {
      waterHeater: number;
      appliances: number;
      soapDetergent: number;
      plumbingRepairs: number;
      cleaningProducts: number;
    };
  };
  recommendation: Recommendation[];
  facts: string[];
}

// ─── Data Processing Functions ────────────────────────────────────────────────

function getHardnessLevel(gpg: number): HardnessLevel {
  if (gpg <= 3.5) return { level: 'Soft', color: '#10b981', emoji: '💧', severity: 0 };
  if (gpg <= 7.0) return { level: 'Slightly Hard', color: '#84cc16', emoji: '💧', severity: 1 };
  if (gpg <= 10.5) return { level: 'Moderately Hard', color: '#eab308', emoji: '⚠️', severity: 2 };
  if (gpg <= 14.6) return { level: 'Hard', color: '#f97316', emoji: '🔶', severity: 3 };
  return { level: 'Very Hard', color: '#ef4444', emoji: '🚨', severity: 4 };
}

function estimateAnnualCost(hardnessGPG: number) {
  const factor = Math.min(hardnessGPG / 15, 2.5);
  return {
    low: Math.round(700 * factor),
    high: Math.round(2000 * factor),
    avg: Math.round(1350 * factor),
    breakdown: {
      waterHeater: Math.round(350 * factor),
      appliances: Math.round(200 * factor),
      soapDetergent: Math.round(175 * factor),
      plumbingRepairs: Math.round(250 * factor),
      cleaningProducts: Math.round(100 * factor)
    }
  };
}

function getRecommendations(city: CityData, hardnessAvg: number, tds: number): Recommendation[] {
  const recs: Recommendation[] = [];
  const hardnessInfo = getHardnessLevel(hardnessAvg);

  // Softener recommendation
  if (hardnessAvg > 7) {
    recs.push({
      priority: 'high',
      product: 'Water Softener',
      reason: `Your water averages ${hardnessAvg} GPG hardness — that's "${hardnessInfo.level}." A softener will protect your plumbing, extend appliance life, and save you money.`,
      priceRange: hardnessAvg > 20 ? '$2,800 – $4,500 installed' : '$1,800 – $3,500 installed'
    });
  }

  // RO recommendation
  if (tds > 400 || city.disinfection === 'chloramine') {
    recs.push({
      priority: tds > 600 ? 'high' : 'medium',
      product: 'Reverse Osmosis (Drinking Water)',
      reason: city.disinfection === 'chloramine'
        ? `${city.name} uses chloramine disinfection, which many people find affects taste. An RO system gives you pure drinking water at the tap.`
        : `With TDS at ${tds} ppm, an RO system will significantly improve your drinking water quality.`,
      priceRange: '$300 – $800 installed'
    });
  }

  // Whole house carbon
  if (city.disinfection === 'chloramine') {
    recs.push({
      priority: 'medium',
      product: 'Whole House Carbon Filter',
      reason: 'Chloramine doesn\'t evaporate like chlorine — it stays in your water through showers, laundry, and cooking. A carbon filter removes it at the point of entry.',
      priceRange: '$800 – $2,000 installed'
    });
  }

  return recs;
}

function getFacts(city: CityData, hardnessAvg: number, tds: number): string[] {
  const facts: string[] = [];

  if (hardnessAvg >= 15) {
    facts.push(`${city.name} water is ${Math.round(hardnessAvg / 3.5)}× harder than what's considered "soft" water.`);
  }

  if (hardnessAvg >= 12) {
    facts.push(`Hard water can reduce your water heater's lifespan by 30-50%. In ${city.name}, that means replacing it every 6-8 years instead of 12-15.`);
  }

  facts.push(`You're using up to ${Math.round(50 + (hardnessAvg / 15) * 25)}% more soap and detergent than homes with soft water.`);

  if (city.disinfection === 'chloramine') {
    facts.push(`${city.name} uses chloramine (chlorine + ammonia) to disinfect water. Unlike chlorine, it doesn't evaporate — a standard Brita filter won't remove it.`);
  }

  if (tds > 500) {
    facts.push(`Your water has approximately ${tds} ppm of total dissolved solids — about ${Math.round((tds / 500) * 100)}% above the EPA's recommended aesthetic limit of 500 ppm.`);
  }

  return facts;
}

function getWaterReport(zipCode: string): WaterReport | null {
  // Find city by zip code
  let cityKey: string | null = null;
  let cityData: CityData | null = null;

  for (const [key, city] of Object.entries(waterData.cities)) {
    const c = city as CityData;
    if (c.zip_codes.includes(zipCode)) {
      cityKey = key;
      cityData = c;
      break;
    }
  }

  if (!cityData) return null;

  const hardnessAvg = cityData.hardness_gpg.avg;
  const hardnessInfo = getHardnessLevel(hardnessAvg);
  const annualCost = estimateAnnualCost(hardnessAvg);
  const tds = cityData.tds_ppm.avg;

  return {
    city: cityData.name,
    zipCode,
    hardness: {
      low: cityData.hardness_gpg.low,
      high: cityData.hardness_gpg.high,
      avg: hardnessAvg,
      ppm: Math.round(hardnessAvg * 17.1),
      level: hardnessInfo.level,
      color: hardnessInfo.color,
      emoji: hardnessInfo.emoji
    },
    tds,
    ph: cityData.ph.avg,
    disinfection: cityData.disinfection,
    annualCost,
    recommendation: getRecommendations(cityData, hardnessAvg, tds),
    facts: getFacts(cityData, hardnessAvg, tds)
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const WaterQualityReport: React.FC = () => {
  const [zipCode, setZipCode] = useState('');
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    const waterReport = getWaterReport(zipCode);
    if (!waterReport) {
      setError('Sorry, we don\'t have water data for that zip code yet. Currently covering Phoenix metro area.');
      setReport(null);
    } else {
      setReport(waterReport);
    }
  };

  const costSaved5yr = report ? report.annualCost.avg * 5 : 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Free Water Quality Intelligence
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Know Your Water
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>
          Enter your zip code to see detailed water quality data, cost estimates, and personalized recommendations for your area.
        </p>
      </div>

      {/* Zip Code Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto 40px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={zipCode}
            onChange={e => setZipCode(e.target.value)}
            placeholder="Enter zip code (e.g. 85383)"
            maxLength={5}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 16,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '14px 28px',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            Get Report
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 12, padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, color: '#991b1b' }}>
            {error}
          </div>
        )}
      </form>

      {/* Report */}
      {report && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* City Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
              Free Water Quality Report
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              {report.city}, AZ — {report.zipCode}
            </div>
          </div>

          {/* Hardness Gauge */}
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 14, color: '#64748b' }}>Your Water Hardness</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: report.hardness.color }}>
              {report.hardness.avg} GPG
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: `${report.hardness.color}15`,
              color: report.hardness.color,
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600
            }}>
              {report.hardness.emoji} {report.hardness.level}
            </div>
            <div style={{ margin: '12px auto 0', maxWidth: 300 }}>
              <div style={{ background: '#f1f5f9', borderRadius: 8, height: 12, position: 'relative' }}>
                <div style={{
                  background: 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)',
                  borderRadius: 8,
                  height: 12,
                  width: '100%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: -4,
                  left: `${Math.min((report.hardness.avg / 30) * 100, 95)}%`,
                  width: 20,
                  height: 20,
                  background: '#fff',
                  border: `3px solid ${report.hardness.color}`,
                  borderRadius: '50%',
                  transform: 'translateX(-50%)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                <span>Soft</span><span>Hard</span><span>Very Hard</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0' }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.hardness.ppm}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Hardness (ppm)</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.tds}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>TDS (ppm)</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{report.ph}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>pH Level</div>
            </div>
          </div>

          {/* Cost Section */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 20,
            margin: '20px 0'
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
              💸 What Hard Water Is Costing You
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>
              ${report.annualCost.low.toLocaleString()} – ${report.annualCost.high.toLocaleString()}/year
            </div>
            <div style={{ fontSize: 13, color: '#991b1b', marginTop: 4 }}>
              That's up to <strong>${costSaved5yr.toLocaleString()} over 5 years</strong> in damage, wasted soap, and early appliance replacement.
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
              Water heater damage: ~${report.annualCost.breakdown.waterHeater}/yr •
              Appliances: ~${report.annualCost.breakdown.appliances}/yr •
              Extra soap: ~${report.annualCost.breakdown.soapDetergent}/yr •
              Plumbing repairs: ~${report.annualCost.breakdown.plumbingRepairs}/yr
            </div>
          </div>

          {/* Facts */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              💡 Did You Know?
            </div>
            {report.facts.map((fact, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                fontSize: 14,
                color: '#334155',
                lineHeight: 1.5
              }}>
                <span style={{ color: '#0ea5e9', flexShrink: 0 }}>•</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              ✅ What We Recommend
            </div>
            {report.recommendation.map((rec, i) => (
              <div key={i} style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 16,
                marginBottom: 10,
                borderLeft: rec.priority === 'high' ? '4px solid #0ea5e9' : '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{rec.product}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>{rec.priceRange}</div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
                  {rec.reason}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
              Want a precise recommendation based on your home?
            </div>
            <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              ✓ Free on-site water test included with any service call
            </div>
          </div>
        </div>
      )}

      {/* Example zips */}
      {!report && !error && (
        <div style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#94a3b8' }}>
          <div>Try: 85383 (Peoria), 85254 (Scottsdale), 85225 (Chandler)</div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityReport;
