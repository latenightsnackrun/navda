import { useEffect, useRef, useState, useCallback } from 'react';

const SafeGlobe = ({ selectedAirport, aircraftData = [], radius = 200 }) => {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Safe Globe initialization
  const initializeGlobe = useCallback(async () => {
    if (!containerRef.current || globeRef.current) return;

    try {
      // Dynamic import to avoid SSR issues
      const Globe = (await import('globe.gl')).default;
      
      // Ensure container exists and is in DOM
      const container = containerRef.current;
      if (!container || !container.isConnected) {
        throw new Error('Container not ready');
      }

      // Clear container safely
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Create globe with minimal configuration
      const globe = Globe(container)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundColor('#000011')
        .width(container.clientWidth || 800)
        .height(container.clientHeight || 500);

      // Store reference
      globeRef.current = globe;
      setIsLoaded(true);
      setError(null);

      // Setup controls
      if (globe.controls) {
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.5;
      }

    } catch (err) {
      console.error('Globe initialization failed:', err);
      setError(err.message);
      setIsLoaded(false);
    }
  }, []);

  // Initialize globe when component mounts
  useEffect(() => {
    const timer = setTimeout(initializeGlobe, 100);
    return () => clearTimeout(timer);
  }, [initializeGlobe]);

  // Update aircraft data
  useEffect(() => {
    if (!globeRef.current || !isLoaded || !aircraftData?.length) return;

    try {
      const globe = globeRef.current;
      
      // Process aircraft data safely
      const points = aircraftData
        .filter(aircraft => 
          aircraft && 
          typeof aircraft.latitude === 'number' && 
          typeof aircraft.longitude === 'number' &&
          !isNaN(aircraft.latitude) &&
          !isNaN(aircraft.longitude)
        )
        .map(aircraft => ({
          lat: aircraft.latitude,
          lng: aircraft.longitude,
          alt: Math.max((aircraft.altitude || 0) / 100000, 0.01),
          color: aircraft.on_ground ? '#ff4444' : '#44ff44',
          size: aircraft.on_ground ? 0.2 : 0.4,
          label: aircraft.callsign || 'Unknown'
        }));

      // Update globe data safely
      if (globe.pointsData && typeof globe.pointsData === 'function') {
        globe.pointsData(points)
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude('alt')
          .pointColor('color')
          .pointRadius('size');
      }

    } catch (err) {
      console.warn('Error updating globe data:', err);
    }
  }, [aircraftData, isLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (globeRef.current) {
        try {
          // Safe cleanup
          if (containerRef.current) {
            while (containerRef.current.firstChild) {
              containerRef.current.removeChild(containerRef.current.firstChild);
            }
          }
        } catch (err) {
          console.warn('Cleanup warning:', err);
        }
        globeRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">Globe Error</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setIsLoaded(false);
              globeRef.current = null;
              setTimeout(initializeGlobe, 100);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-white">Loading 3D Globe...</div>
          </div>
        </div>
      )}
      {isLoaded && (
        <div className="absolute top-2 left-2 bg-gray-900/75 px-2 py-1 rounded text-xs text-white">
          {aircraftData?.length || 0} aircraft • {selectedAirport || 'No airport'} • {radius}nm
        </div>
      )}
    </div>
  );
};

export default SafeGlobe;
