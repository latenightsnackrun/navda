import React from 'react';

const AltitudeHistoryChart = ({ data, aircraft }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No altitude data available
      </div>
    );
  }

  // Prepare data for chart
  const maxAltitude = Math.max(...data.map(d => d.altitude));
  const minAltitude = Math.min(...data.map(d => d.altitude));
  const altitudeRange = maxAltitude - minAltitude || 1000; // Fallback to 1000ft range
  
  // Calculate chart dimensions
  const chartWidth = 100;
  const chartHeight = 100;
  const padding = 5;
  const innerWidth = chartWidth - (padding * 2);
  const innerHeight = chartHeight - (padding * 2);

  // Generate SVG path for altitude line
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * innerWidth;
    const normalizedAltitude = (point.altitude - minAltitude) / altitudeRange;
    const y = padding + innerHeight - (normalizedAltitude * innerHeight);
    return `${x},${y}`;
  }).join(' ');

  // Generate area fill path
  const areaPath = `M ${points.split(' ')[0]} L ${points} L ${padding + innerWidth},${padding + innerHeight} L ${padding},${padding + innerHeight} Z`;

  // Calculate trend
  const trend = data.length > 1 ? 
    (data[data.length - 1].altitude - data[0].altitude) / data.length : 0;
  
  const trendText = trend > 50 ? 'Climbing' : trend < -50 ? 'Descending' : 'Level';

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
        <span>{aircraft.callsign || aircraft.icao24}</span>
        <span className={trend > 50 ? 'text-green-400' : trend < -50 ? 'text-red-400' : 'text-gray-400'}>
          {trendText} ({trend > 0 ? '+' : ''}{Math.round(trend)} ft/min avg)
        </span>
      </div>
      
      <div className="relative w-full h-24">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#altitudeGradient)"
            opacity={0.3}
          />
          
          {/* Altitude line */}
          <polyline
            points={points}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * innerWidth;
            const normalizedAltitude = (point.altitude - minAltitude) / altitudeRange;
            const y = padding + innerHeight - (normalizedAltitude * innerHeight);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill="#10b981"
                className="hover:r-2 transition-all"
              />
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="altitudeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
        
        {/* Altitude labels */}
        <div className="absolute left-0 top-0 text-xs text-gray-500">
          {Math.round(maxAltitude / 1000)}k ft
        </div>
        <div className="absolute left-0 bottom-0 text-xs text-gray-500">
          {Math.round(minAltitude / 1000)}k ft
        </div>
        
        {/* Current altitude */}
        <div className="absolute right-0 top-0 text-xs text-green-400 font-mono">
          {Math.round(data[data.length - 1].altitude)} ft
        </div>
      </div>
      
      {/* Time range */}
      <div className="text-xs text-gray-500 mt-1">
        {data.length > 1 && (
          <span>
            {Math.round((data[data.length - 1].timestamp - data[0].timestamp) / 1000 / 60)} min history
          </span>
        )}
      </div>
    </div>
  );
};

export default AltitudeHistoryChart;
