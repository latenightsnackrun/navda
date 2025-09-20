import { useEffect, useRef } from 'react';

const SimpleGlobe = ({ selectedAirport, aircraftData = [], radius = 200 }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);

    // Draw simple globe representation
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;

    // Draw globe circle
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = -2; i <= 2; i++) {
      const y = centerY + (i * radius / 3);
      ctx.beginPath();
      ctx.moveTo(centerX - radius, y);
      ctx.lineTo(centerX + radius, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = -2; i <= 2; i++) {
      const x = centerX + (i * radius / 3);
      ctx.beginPath();
      ctx.moveTo(x, centerY - radius);
      ctx.lineTo(x, centerY + radius);
      ctx.stroke();
    }

    // Draw aircraft as points
    aircraftData.forEach(aircraft => {
      if (!aircraft || typeof aircraft.latitude !== 'number' || typeof aircraft.longitude !== 'number') return;

      // Convert lat/lng to canvas coordinates
      const x = centerX + (aircraft.longitude / 180) * radius;
      const y = centerY - (aircraft.latitude / 90) * radius;

      // Only draw if within globe bounds
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        ctx.fillStyle = aircraft.on_ground ? '#ff6b6b' : '#4ecdc4';
        ctx.beginPath();
        ctx.arc(x, y, aircraft.on_ground ? 3 : 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Aircraft near ${selectedAirport || 'Selected Airport'} (${radius}nm)`, centerX, 30);
    ctx.fillText(`${aircraftData.length} aircraft tracked • ${new Date().toLocaleTimeString()}`, centerX, height - 20);

  }, [aircraftData, selectedAirport]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border border-gray-700 rounded-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default SimpleGlobe;
