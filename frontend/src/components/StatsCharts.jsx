import React from 'react';
import { styles } from '../styles';

export default function StatsCharts({ refuelings, services, trips }) {
  const fuelTotal = refuelings.reduce((sum, r) => sum + (parseFloat(r.price_total) || 0), 0);
  const serviceTotal = services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
  const maxCost = Math.max(fuelTotal, serviceTotal, 1);

  const fuelHeight = Math.round((fuelTotal / maxCost) * 135);
  const serviceHeight = Math.round((serviceTotal / maxCost) * 135);

  const tripPointsData = trips.slice(-6);
  const maxKm = Math.max(...tripPointsData.map(t => parseFloat(t.distance_km) || 0), 1);

  const points = tripPointsData
    .map((t, idx) => {
      const x = tripPointsData.length === 1 ? 160 : (idx / (tripPointsData.length - 1)) * 280 + 20;
      const y = 148 - ((parseFloat(t.distance_km) || 0) / maxKm) * 115;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.75rem' }}>
      <div style={styles.cardGlass} className="card-hover">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.25rem', color: '#f1f5f9' }}>💸 Náklady: Palivo vs. Servis</h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>Porovnání celkových výdajů v Kč</p>

        <svg viewBox="0 0 320 180" style={{ width: '100%', height: '190px', overflow: 'visible' }}>
          <line x1="20" y1="155" x2="300" y2="155" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />

          <rect
            x="65"
            y={155 - fuelHeight}
            width="65"
            height={fuelHeight}
            rx="8"
            fill="url(#fuelGrad)"
            style={{ transition: 'all 0.5s ease' }}
          />
          <text x="97" y={Math.max(155 - fuelHeight - 8, 18)} textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="600">
            {fuelTotal.toFixed(0)} Kč
          </text>
          <text x="97" y="173" textAnchor="middle" fill="#94a3b8" fontSize="12">Palivo</text>

          <rect
            x="190"
            y={155 - serviceHeight}
            width="65"
            height={serviceHeight}
            rx="8"
            fill="url(#serviceGrad)"
            style={{ transition: 'all 0.5s ease' }}
          />
          <text x="222" y={Math.max(155 - serviceHeight - 8, 18)} textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="600">
            {serviceTotal.toFixed(0)} Kč
          </text>
          <text x="222" y="173" textAnchor="middle" fill="#94a3b8" fontSize="12">Servis</text>

          <defs>
            <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="serviceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style={styles.cardGlass} className="card-hover">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.25rem', color: '#f1f5f9' }}>📈 Poslední zaznamenané jízdy</h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>Délka posledních až 6 jízd v kilometrech</p>

        {tripPointsData.length > 0 ? (
          <svg viewBox="0 0 320 180" style={{ width: '100%', height: '190px', overflow: 'visible' }}>
            <line x1="20" y1="155" x2="300" y2="155" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {tripPointsData.map((t, idx) => {
              const x = tripPointsData.length === 1 ? 160 : (idx / (tripPointsData.length - 1)) * 280 + 20;
              const y = 148 - ((parseFloat(t.distance_km) || 0) / maxKm) * 115;
              return (
                <g key={t.id || idx}>
                  <circle cx={x} cy={y} r="5" fill="#c084fc" />
                  <text x={x} y={Math.max(y - 10, 16)} textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="600">
                    {t.distance_km} km
                  </text>
                  <text x={x} y="173" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    {t.date ? t.date.slice(5) : `#${idx + 1}`}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
            Zatím nejsou zadané žádné jízdy pro vykreslení grafu.
          </div>
        )}
      </div>
    </div>
  );
}