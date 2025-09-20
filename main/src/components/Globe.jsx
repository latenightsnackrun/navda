import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';

const GlobeComponent = ({ selectedAirport, aircraftData = [], onError }) => {
  const globeRef = useRef();
  const [globe, setGlobe] = useState(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  // Initialize globe
  useEffect(() => {
    if (!globeRef.current) return;

    const initializeGlobe = () => {
      try {
        // Clear any existing globe
        if (globeRef.current.hasChildNodes()) {
          globeRef.current.innerHTML = '';
        }

        // Create new globe instance
        const myGlobe = new Globe(globeRef.current)
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
          .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
          .backgroundColor('#000011')
          .width(800)
          .height(600);

        // Set up controls
        myGlobe.controls().autoRotate = true;
        myGlobe.controls().autoRotateSpeed = 0.5;

        // Set initial view
        myGlobe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });

        setGlobe(myGlobe);
        setIsGlobeReady(true);

        return myGlobe;
      } catch (error) {
        console.error('Error initializing globe:', error);
        if (onError) onError();
        return null;
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeGlobe, 100);

    return () => {
      clearTimeout(timer);
      if (globe) {
        try {
          // Simple cleanup - just clear the container
          if (globeRef.current) {
            globeRef.current.innerHTML = '';
          }
        } catch (error) {
          console.warn('Error during globe cleanup:', error);
        }
      }
    };
  }, []);

  // Update aircraft data
  useEffect(() => {
    if (!globe || !isGlobeReady || !aircraftData || aircraftData.length === 0) return;

    try {
      // Convert aircraft data to points
      const pointsData = aircraftData
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
          color: aircraft.on_ground ? '#ff6b6b' : '#4ecdc4',
          size: aircraft.on_ground ? 0.3 : 0.5,
          callsign: aircraft.callsign || 'UNKNOWN'
        }));

      // Update points data
      if (pointsData.length > 0) {
        globe.pointsData(pointsData)
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude('alt')
          .pointColor('color')
          .pointRadius('size')
          .pointsMerge(false);
      } else {
        // Clear points if no data
        globe.pointsData([]);
      }

    } catch (error) {
      console.error('Error updating globe data:', error);
      if (onError) onError();
    }
  }, [globe, isGlobeReady, aircraftData, selectedAirport]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        ref={globeRef} 
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '500px',
          minHeight: '400px'
        }}
      />
      {!isGlobeReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="text-white">Loading Globe...</div>
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;