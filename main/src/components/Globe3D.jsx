import { useEffect, useRef, useState, useCallback } from 'react';

const Globe3D = ({ selectedAirport, aircraftData = [], radius = 200 }) => {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isRotating, setIsRotating] = useState(true);

  // Initialize globe
  const initializeGlobe = useCallback(async () => {
    if (!containerRef.current || globeRef.current) return;

    try {
      // Wait for Globe to be available from CDN
      if (typeof window.Globe === 'undefined') {
        throw new Error('Globe.gl library not loaded from CDN. Please refresh the page.');
      }
      
      // Ensure container exists and is in DOM
      const container = containerRef.current;
      if (!container || !container.isConnected) {
        throw new Error('Container not ready');
      }

      // Clear container safely
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Create globe using CDN version (like the working example)
      const globe = new window.Globe(container)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .width(container.clientWidth || 800)
        .height(container.clientHeight || 500)
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor('#4A90E2')
        .atmosphereAltitude(0.1)
        .enablePointerInteraction(true);

      // Store reference
      globeRef.current = globe;

      // Setup controls and auto-rotation
      if (globe.controls) {
        globe.controls().enableZoom = true;
        globe.controls().enableRotate = true;
        globe.controls().enablePan = true;
        globe.controls().autoRotate = isRotating;
        globe.controls().autoRotateSpeed = 0.5;
      }

      // Skip custom lighting - let globe.gl handle it

      // Set initial camera position
      globe.pointOfView({ 
        lat: selectedAirport ? getAirportCoords(selectedAirport)?.lat || 0 : 0, 
        lng: selectedAirport ? getAirportCoords(selectedAirport)?.lon || 0 : 0, 
        altitude: 2.5 
      });

      setIsLoaded(true);
      setError(null);

    } catch (err) {
      console.error('Globe initialization failed:', err);
      setError(err.message);
      setIsLoaded(false);
    }
  }, [selectedAirport, isRotating]);

  // Get airport coordinates
  const getAirportCoords = (airportCode) => {
    const airports = {
      "KJFK": { lat: 40.6413, lon: -73.7781 },
      "KLAX": { lat: 33.9425, lon: -118.4081 },
      "KORD": { lat: 41.9742, lon: -87.9073 },
      "KDFW": { lat: 32.8998, lon: -97.0403 },
      "KDEN": { lat: 39.8561, lon: -104.6737 },
      "KATL": { lat: 33.6407, lon: -84.4277 },
      "KSEA": { lat: 47.4502, lon: -122.3088 },
      "KMIA": { lat: 25.7959, lon: -80.2870 },
      "KPHX": { lat: 33.4484, lon: -112.0740 },
      "KCLT": { lat: 35.2144, lon: -80.9473 },
      "EGLL": { lat: 51.4700, lon: -0.4543 },
      "LFPG": { lat: 49.0097, lon: 2.5479 },
      "EDDF": { lat: 50.0379, lon: 8.5622 },
      "EHAM": { lat: 52.3105, lon: 4.7683 },
      "LIRF": { lat: 41.8003, lon: 12.2389 },
      "LEMD": { lat: 40.4839, lon: -3.5680 },
      "RJTT": { lat: 35.5494, lon: 139.7798 },
      "RJAA": { lat: 35.7720, lon: 140.3928 },
      "ZBAA": { lat: 40.0799, lon: 116.6031 },
      "ZSPD": { lat: 31.1443, lon: 121.8083 },
      "VHHH": { lat: 22.3080, lon: 113.9185 },
      "WSSS": { lat: 1.3644, lon: 103.9915 },
      "YSSY": { lat: -33.9399, lon: 151.1753 },
      "YMML": { lat: -37.6690, lon: 144.8410 },
      "CYYZ": { lat: 43.6777, lon: -79.6248 },
      "CYVR": { lat: 49.1939, lon: -123.1844 }
    };
    return airports[airportCode];
  };

  // Initialize globe when component mounts
  useEffect(() => {
    const timer = setTimeout(initializeGlobe, 100);
    return () => clearTimeout(timer);
  }, [initializeGlobe]);

  // Load placeholder data (like the example)
  const loadPlaceholderData = useCallback(async () => {
    if (!globeRef.current || !isLoaded) return;

    try {
      // Use the example data structure from your working example
      const COUNTRY = 'United States';
      const OPACITY = 0.22;

      // Simulate loading airport and route data (like the example)
      const placeholderRoutes = [
        { airline: 'American Airlines', srcIata: 'JFK', dstIata: 'LAX', srcAirport: { lat: 40.6413, lng: -73.7781 }, dstAirport: { lat: 33.9425, lng: -118.4081 } },
        { airline: 'Delta Air Lines', srcIata: 'ATL', dstIata: 'SEA', srcAirport: { lat: 33.6407, lng: -84.4277 }, dstAirport: { lat: 47.4480, lng: -122.3115 } },
        { airline: 'United Airlines', srcIata: 'ORD', dstIata: 'SFO', srcAirport: { lat: 41.9742, lng: -87.9073 }, dstAirport: { lat: 37.7749, lng: -122.4194 } },
        { airline: 'Southwest Airlines', srcIata: 'DFW', dstIata: 'PHX', srcAirport: { lat: 32.8998, lng: -97.0403 }, dstAirport: { lat: 33.4342, lng: -112.0117 } },
        { airline: 'JetBlue Airways', srcIata: 'BOS', dstIata: 'MIA', srcAirport: { lat: 42.3601, lng: -71.0589 }, dstAirport: { lat: 25.7959, lng: -80.2870 } }
      ];

      const placeholderAirports = [
        { iata: 'JFK', lat: 40.6413, lng: -73.7781 },
        { iata: 'LAX', lat: 33.9425, lng: -118.4081 },
        { iata: 'ATL', lat: 33.6407, lng: -84.4277 },
        { iata: 'SEA', lat: 47.4480, lng: -122.3115 },
        { iata: 'ORD', lat: 41.9742, lng: -87.9073 },
        { iata: 'SFO', lat: 37.7749, lng: -122.4194 },
        { iata: 'DFW', lat: 32.8998, lng: -97.0403 },
        { iata: 'PHX', lat: 33.4342, lng: -112.0117 },
        { iata: 'BOS', lat: 42.3601, lng: -71.0589 },
        { iata: 'MIA', lat: 25.7959, lng: -80.2870 }
      ];

      const globe = globeRef.current;

      // Setup like the working example
      globe
        .arcLabel(d => `${d.airline}: ${d.srcIata} → ${d.dstIata}`)
        .arcStartLat(d => d.srcAirport.lat)
        .arcStartLng(d => d.srcAirport.lng)
        .arcEndLat(d => d.dstAirport.lat)
        .arcEndLng(d => d.dstAirport.lng)
        .arcDashLength(0.25)
        .arcDashGap(1)
        .arcDashInitialGap(() => Math.random())
        .arcDashAnimateTime(4000)
        .arcColor(d => [`rgba(0, 255, 0, ${OPACITY})`, `rgba(255, 0, 0, ${OPACITY})`])
        .arcsTransitionDuration(0)
        .pointColor(() => 'orange')
        .pointAltitude(0)
        .pointRadius(0.02)
        .pointsMerge(true);

      // Load the placeholder data
      globe
        .pointsData(placeholderAirports)
        .arcsData(placeholderRoutes);

    } catch (err) {
      console.warn('Error loading placeholder data:', err);
    }
  }, [isLoaded]);

  // Update aircraft data or show placeholder
  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;

    if (!selectedAirport || !aircraftData?.length) {
      // Show placeholder data when no airport selected
      loadPlaceholderData();
      return;
    }

    try {
      const globe = globeRef.current;
      
      // Process aircraft data for globe visualization
      const aircraftPoints = aircraftData
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
          alt: Math.max((aircraft.altitude || 0) / 100000, 0.01), // Scale altitude
          color: aircraft.on_ground ? '#ff4444' : '#44ff44',
          size: aircraft.on_ground ? 0.3 : 0.6,
          label: aircraft.callsign || 'Unknown',
          altitude: aircraft.altitude || 0,
          velocity: aircraft.velocity || 0,
          heading: aircraft.heading || 0,
          onGround: aircraft.on_ground
        }));

      // Update points data
      if (globe.pointsData && typeof globe.pointsData === 'function') {
        globe.pointsData(aircraftPoints)
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude('alt')
          .pointColor('color')
          .pointRadius('size')
          .pointsMerge(false)
          .pointLabel(d => `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
              <strong>${d.label}</strong><br/>
              Alt: ${Math.round(d.altitude).toLocaleString()}ft<br/>
              Speed: ${Math.round(d.velocity)}kt<br/>
              Heading: ${Math.round(d.heading)}°<br/>
              Status: <span style="color: ${d.onGround ? '#ff4444' : '#44ff44'}">${d.onGround ? 'GROUND' : 'AIRBORNE'}</span>
            </div>
          `);
      }

      // Add flight arcs from airport to aircraft (like the example)
      if (selectedAirport && globe.arcsData && typeof globe.arcsData === 'function') {
        const airportCoords = getAirportCoords(selectedAirport);
        if (airportCoords) {
          // Create arcs from airport to each aircraft
          const flightArcs = aircraftPoints
            .filter(aircraft => !aircraft.onGround) // Only show arcs for airborne aircraft
            .slice(0, 50) // Limit to 50 arcs for performance
            .map((aircraft, index) => ({
              startLat: airportCoords.lat,
              startLng: airportCoords.lon,
              endLat: aircraft.lat,
              endLng: aircraft.lng,
              color: aircraft.color,
              label: aircraft.label,
              altitude: aircraft.altitude,
              velocity: aircraft.velocity
            }));

          globe.arcsData(flightArcs)
            .arcStartLat('startLat')
            .arcStartLng('startLng')
            .arcEndLat('endLat')
            .arcEndLng('endLng')
            .arcColor(d => [`rgba(78, 205, 196, 0.3)`, `rgba(78, 205, 196, 0.1)`]) // Teal gradient
            .arcDashLength(0.25)
            .arcDashGap(1)
            .arcDashInitialGap(() => Math.random())
            .arcDashAnimateTime(4000)
            .arcsTransitionDuration(1000)
            .arcLabel(d => `
              <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                <strong>Flight Path</strong><br/>
                Aircraft: ${d.label}<br/>
                Alt: ${Math.round(d.altitude).toLocaleString()}ft<br/>
                Speed: ${Math.round(d.velocity)}kt
              </div>
            `);
        }
      }

      // Add airport marker if selected
      if (selectedAirport) {
        const airportCoords = getAirportCoords(selectedAirport);
        if (airportCoords) {
          // Focus the view on the airport
          globe.pointOfView({ 
            lat: airportCoords.lat, 
            lng: airportCoords.lng, 
            altitude: 2.5 
          }, 1000);
        }
      }

    } catch (err) {
      console.warn('Error updating globe data:', err);
    }
  }, [aircraftData, isLoaded, selectedAirport, loadPlaceholderData]);

  // Toggle rotation
  const toggleRotation = () => {
    setIsRotating(!isRotating);
    if (globeRef.current?.controls) {
      globeRef.current.controls().autoRotate = !isRotating;
    }
  };

  // Reset view
  const resetView = () => {
    if (globeRef.current) {
      const airportCoords = selectedAirport ? getAirportCoords(selectedAirport) : null;
      globeRef.current.pointOfView({ 
        lat: airportCoords?.lat || 0, 
        lng: airportCoords?.lon || 0, 
        altitude: 2.5 
      }, 1000);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (globeRef.current) {
        try {
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
          <div className="text-red-400 mb-2">3D Globe Error</div>
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
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-white">Loading 3D Globe...</div>
          </div>
        </div>
      )}

      {/* Info overlay */}
      {isLoaded && (
        <div className="absolute top-2 left-2 bg-black/75 text-white px-3 py-2 rounded-lg text-sm">
          <div>{aircraftData?.length || 0} aircraft • {selectedAirport || 'Global'} • {radius}nm</div>
          <div className="text-xs text-gray-300 mt-1">
            3D Globe View • {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Controls */}
      {isLoaded && (
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            onClick={toggleRotation}
            className={`p-2 rounded-lg text-white text-xs ${
              isRotating ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isRotating ? 'Stop Rotation' : 'Start Rotation'}
          >
            {isRotating ? 'STOP' : 'ROTATE'}
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
            title="Reset View"
          >
            RESET
          </button>
        </div>
      )}

      {/* Legend */}
      {isLoaded && (
        <div className="absolute bottom-2 left-2 bg-black/75 text-white px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Airborne</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ground</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Airport</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Globe3D;
