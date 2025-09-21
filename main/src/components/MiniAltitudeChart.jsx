import React from 'react';

const MiniAltitudeChart = ({ data, aircraft, className = "" }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-500 text-xs ${className}`}>
        No data
      </div>
    );
  }

  // Prepare data for mini chart
  const altitudes = data.map(d => d.altitude);
  const minAltitude = Math.min(...altitudes);
  const maxAltitude = Math.max(...altitudes);
  const currentAltitude = altitudes[altitudes.length - 1];
  const firstAltitude = altitudes[0];

  // Calculate trend
  let trend = 'level';
  let trendColor = '#9CA3AF'; // gray
  if (currentAltitude > firstAltitude + 100) {
    trend = 'climbing';
    trendColor = '#34D399'; // green
  } else if (currentAltitude < firstAltitude - 100) {
    trend = 'descending';
    trendColor = '#EF4444'; // red
  }

  // Normalize data for mini chart (0-100 range)
  const normalizedData = altitudes.map(alt => {
    if (maxAltitude === minAltitude) return 50;
    return ((alt - minAltitude) / (maxAltitude - minAltitude)) * 100;
  });

  // Create SVG path
  const width = 120;
  const height = 40;
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const points = normalizedData.map((value, index) => {
    const x = padding + (index / (normalizedData.length - 1)) * chartWidth;
    const y = padding + ((100 - value) / 100) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const pathData = `M ${points}`;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Mini Chart */}
      <div className="flex-shrink-0">
        <svg width={width} height={height} className="overflow-visible">
          {/* Background */}
          <rect
            x={padding}
            y={padding}
            width={chartWidth}
            height={chartHeight}
            fill="rgba(55, 65, 81, 0.3)"
            rx="2"
          />
          
          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding + chartHeight * 0.5}
            x2={padding + chartWidth}
            y2={padding + chartHeight * 0.5}
            stroke="rgba(75, 85, 99, 0.5)"
            strokeWidth="0.5"
          />
          
          {/* Altitude line */}
          <polyline
            points={points}
            fill="none"
            stroke={trendColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Current point */}
          {normalizedData.length > 0 && (
            <circle
              cx={padding + ((normalizedData.length - 1) / (normalizedData.length - 1)) * chartWidth}
              cy={padding + ((100 - normalizedData[normalizedData.length - 1]) / 100) * chartHeight}
              r="2"
              fill={trendColor}
            />
          )}
        </svg>
      </div>

      {/* Altitude Info */}
      <div className="flex-shrink-0 text-xs">
        <div className="text-gray-300 font-mono">
          {currentAltitude ? `${Math.round(currentAltitude)}ft` : 'N/A'}
        </div>
        <div className="flex items-center space-x-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: trendColor }}
          />
          <span className="text-gray-500 capitalize">{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default MiniAltitudeChart;
