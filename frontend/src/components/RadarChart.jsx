import React, { useState } from 'react';

/**
 * High-precision SVG Radar Chart
 * Uses Champagne Gold (#D4AF37) for primary analytical visual,
 * and Dusty Rose (#C8879B) for secondary / comparison data.
 */
export default function RadarChart({
  data = [],
  compareMode = false,
  primaryLabel = 'Resume Evidence',
  secondaryLabel = 'Expected JD Requirement',
  primaryColor = '#D4AF37', // Champagne Gold
  secondaryColor = '#C8879B', // Dusty Rose
  size = 380,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-wine-muted)' }}>
        No radar metrics available.
      </div>
    );
  }

  const center = size / 2;
  const radius = (size / 2) - 50; // Leave margin for outer labels
  const total = data.length;
  const angleStep = (Math.PI * 2) / total;

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to calculate coordinates
  const getCoordinates = (value, index, maxVal = 100) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build points for primary series (Evidence or Simulated)
  const primaryPoints = data.map((item, i) => {
    const val = item.evidence !== undefined ? item.evidence : (item.value || 50);
    const { x, y } = getCoordinates(val, i);
    return `${x},${y}`;
  }).join(' ');

  // Build points for secondary series (Expected or Current)
  const secondaryPoints = compareMode
    ? data.map((item, i) => {
        const val = item.expected !== undefined ? item.expected : (item.simulated || item.current || 50);
        const { x, y } = getCoordinates(val, i);
        return `${x},${y}`;
      }).join(' ')
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: `${size}px`, maxHeight: `${size}px`, overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Concentric Polygons (Rings) */}
        {levels.map((level, lvlIdx) => {
          const levelPoints = data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = level * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');

          return (
            <polygon
              key={`ring-${lvlIdx}`}
              points={levelPoints}
              fill="none"
              stroke="#ebdcd2"
              strokeWidth="1"
              strokeDasharray={lvlIdx === levels.length - 1 ? 'none' : '3,3'}
              opacity="0.85"
            />
          );
        })}

        {/* Radial Axis Lines */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#e2cfc2"
              strokeWidth="1"
              opacity="0.7"
            />
          );
        })}

        {/* Secondary Polygon (e.g. Expected or Current) */}
        {secondaryPoints && (
          <polygon
            points={secondaryPoints}
            fill={secondaryColor}
            fillOpacity="0.2"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* Primary Polygon (Champagne Gold) */}
        <polygon
          points={primaryPoints}
          fill={primaryColor}
          fillOpacity="0.35"
          stroke={primaryColor}
          strokeWidth="2.5"
        />

        {/* Interactive Vertex Dots */}
        {data.map((item, i) => {
          const val = item.evidence !== undefined ? item.evidence : (item.value || 50);
          const { x, y } = getCoordinates(val, i);
          const isHovered = hoveredIndex === i;

          return (
            <g key={`dot-${i}`} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={primaryColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
              />
            </g>
          );
        })}

        {/* Labels at points */}
        {data.map((item, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          let textAnchor = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          if (Math.cos(angle) < -0.3) textAnchor = 'end';

          const skillName = item.skill || item.name || `Metric ${i + 1}`;
          const isHovered = hoveredIndex === i;

          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fill={isHovered ? 'var(--text-wine-primary)' : 'var(--text-wine-secondary)'}
              fontWeight={isHovered ? '700' : '600'}
              fontSize={isHovered ? '12.5px' : '11.5px'}
              style={{ transition: 'all 0.15s ease', userSelect: 'none' }}
            >
              {skillName}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px', fontWeight: '600' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-wine-primary)' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: primaryColor, display: 'inline-block' }} />
          {primaryLabel}
        </div>
        {compareMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-wine-primary)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: secondaryColor, display: 'inline-block' }} />
            {secondaryLabel}
          </div>
        )}
      </div>
    </div>
  );
}
