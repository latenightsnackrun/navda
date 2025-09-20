import { useRef, useEffect, useCallback, useState } from 'react';

const Cesium3D = ({ selectedAirport, aircraftData = [], radius = 200 }) => {
  const containerRef = useRef();
  const viewerRef = useRef();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [followAircraft, setFollowAircraft] = useState(null);

  // Initialize Cesium viewer
  const initializeCesium = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Wait for Cesium to be available from CDN
      if (typeof window.Cesium === 'undefined') {
        throw new Error('Cesium library not loaded from CDN. Please refresh the page.');
      }

      // Clear container
      containerRef.current.innerHTML = '';

      // Initialize Cesium viewer
      const viewer = new window.Cesium.Viewer(containerRef.current, {
        terrainProvider: showTerrain 
          ? window.Cesium.createWorldTerrain()
          : new window.Cesium.EllipsoidTerrainProvider(),
        imageryProvider: new window.Cesium.IonImageryProvider({ assetId: 3954 }), // Bing Maps
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: true,
        selectionIndicator: true,
        shadows: true,
        terrainShadows: window.Cesium.ShadowMode.RECEIVE_ONLY
      });

      // Set initial camera position
      const airportCoords = getAirportCoords(selectedAirport);
      if (airportCoords) {
        viewer.camera.setView({
          destination: window.Cesium.Cartesian3.fromDegrees(
            airportCoords.lng, 
            airportCoords.lat, 
            50000 // 50km altitude
          ),
          orientation: {
            heading: 0.0,
            pitch: window.Cesium.Math.toRadians(-45), // Look down at 45 degrees
            roll: 0.0
          }
        });
      } else {
        // Default view - Continental US
        viewer.camera.setView({
          destination: window.Cesium.Cartesian3.fromDegrees(-98.5, 39.6, 10000000)
        });
      }

      // Enable lighting based on sun/moon position
      viewer.scene.globe.enableLighting = true;

      // Store reference
      viewerRef.current = viewer;
      setIsLoading(false);

    } catch (err) {
      console.error('Cesium initialization error:', err);
      setError('Failed to initialize 3D viewer: ' + err.message);
      setIsLoading(false);
    }
  }, [selectedAirport, showTerrain]);

  // Get airport coordinates
  const getAirportCoords = (airportCode) => {
    const airports = {
      "KJFK": { lat: 40.6413, lng: -73.7781 },
      "KLAX": { lat: 33.9425, lng: -118.4081 },
      "KORD": { lat: 41.9742, lng: -87.9073 },
      "KDFW": { lat: 32.8998, lng: -97.0403 },
      "KATL": { lat: 33.6407, lng: -84.4277 },
      "KDEN": { lat: 39.8561, lng: -104.6737 },
      "KSEA": { lat: 47.4480, lng: -122.3115 },
      "KMIA": { lat: 25.7959, lng: -80.2870 },
      "KPHX": { lat: 33.4342, lng: -112.0117 },
      "KCLT": { lat: 35.2144, lng: -80.9431 },
      "EGLL": { lat: 51.4700, lng: -0.4543 },
      "LFPG": { lat: 49.0097, lng: 2.5479 },
      "EDDF": { lat: 50.0379, lng: 8.5622 },
      "EHAM": { lat: 52.3105, lng: 4.7683 },
      "LIMC": { lat: 45.6306, lng: 8.7282 },
      "LEMD": { lat: 40.4719, lng: -3.5626 },
      "RJTT": { lat: 35.5494, lng: 139.7798 },
      "RJAA": { lat: 35.7647, lng: 140.3863 },
      "ZBAA": { lat: 40.0799, lng: 116.6031 },
      "ZSPD": { lat: 31.1434, lng: 121.8053 },
      "VHHH": { lat: 22.3080, lng: 113.9185 },
      "WSSS": { lat: 1.3644, lng: 103.9915 },
      "YSSY": { lat: -33.9461, lng: 151.1772 },
      "YMML": { lat: -37.6690, lng: 144.8410 },
      "CYYZ": { lat: 43.6777, lng: -79.6248 },
      "CYVR": { lat: 49.1939, lng: -123.1844 }
    };
    return airports[airportCode];
  };

  // Create 3D aircraft model
  const createAircraftEntity = useCallback((aircraft) => {
    if (!viewerRef.current || !window.Cesium) return null;

    const viewer = viewerRef.current;
    const position = window.Cesium.Cartesian3.fromDegrees(
      aircraft.longitude,
      aircraft.latitude,
      aircraft.altitude * 0.3048 // Convert feet to meters
    );

    // Create aircraft entity
    const entity = viewer.entities.add({
      id: aircraft.icao24,
      name: aircraft.callsign || 'Unknown Aircraft',
      position: position,
      orientation: window.Cesium.Transforms.headingPitchRollQuaternion(
        position,
        window.Cesium.HeadingPitchRoll.fromDegrees(aircraft.heading || 0, 0, 0)
      ),
      model: {
        uri: aircraft.on_ground 
          ? 'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/SampleData/models/CesiumGround/Cesium_Ground.glb'
          : 'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/SampleData/models/CesiumAir/Cesium_Air.glb',
        minimumPixelSize: 64,
        maximumScale: 20000,
        color: aircraft.on_ground 
          ? window.Cesium.Color.RED 
          : window.Cesium.Color.CYAN
      },
      label: {
        text: aircraft.callsign || 'Unknown',
        font: '12pt sans-serif',
        fillColor: window.Cesium.Color.WHITE,
        outlineColor: window.Cesium.Color.BLACK,
        outlineWidth: 2,
        style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new window.Cesium.Cartesian2(0, -40),
        show: true
      },
      description: `
        <div style="color: white; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px;">
          <h3>${aircraft.callsign || 'Unknown Aircraft'}</h3>
          <p><strong>ICAO24:</strong> ${aircraft.icao24}</p>
          <p><strong>Altitude:</strong> ${Math.round(aircraft.altitude).toLocaleString()} ft</p>
          <p><strong>Speed:</strong> ${Math.round(aircraft.velocity)} kt</p>
          <p><strong>Heading:</strong> ${Math.round(aircraft.heading)}°</p>
          <p><strong>Status:</strong> <span style="color: ${aircraft.on_ground ? '#ff6b6b' : '#4ecdc4'}">${aircraft.on_ground ? 'ON GROUND' : 'AIRBORNE'}</span></p>
        </div>
      `
    });

    return entity;
  }, []);

  // Update aircraft positions
  useEffect(() => {
    if (!viewerRef.current || !aircraftData?.length) return;

    try {
      const viewer = viewerRef.current;

      // Clear existing aircraft entities
      viewer.entities.removeAll();

      // Add airport marker if selected
      if (selectedAirport) {
        const airportCoords = getAirportCoords(selectedAirport);
        if (airportCoords) {
          viewer.entities.add({
            id: 'airport-' + selectedAirport,
            name: selectedAirport,
            position: window.Cesium.Cartesian3.fromDegrees(
              airportCoords.lng,
              airportCoords.lat,
              100 // 100m above ground
            ),
            billboard: {
              image: 'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/SampleData/airport.png',
              scale: 0.5,
              verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM
            },
            label: {
              text: selectedAirport,
              font: '14pt sans-serif',
              fillColor: window.Cesium.Color.YELLOW,
              outlineColor: window.Cesium.Color.BLACK,
              outlineWidth: 2,
              style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new window.Cesium.Cartesian2(0, -50)
            }
          });
        }
      }

      // Add aircraft entities
      aircraftData.forEach(aircraft => {
        if (aircraft && 
            typeof aircraft.latitude === 'number' && 
            typeof aircraft.longitude === 'number' &&
            !isNaN(aircraft.latitude) &&
            !isNaN(aircraft.longitude)) {
          createAircraftEntity(aircraft);
        }
      });

    } catch (err) {
      console.warn('Error updating Cesium aircraft data:', err);
    }
  }, [aircraftData, selectedAirport, createAircraftEntity]);

  // Initialize Cesium on mount
  useEffect(() => {
    const timer = setTimeout(initializeCesium, 100);
    return () => clearTimeout(timer);
  }, [initializeCesium]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (err) {
          console.warn('Cesium cleanup warning:', err);
        }
        viewerRef.current = null;
      }
    };
  }, []);

  // Toggle terrain
  const toggleTerrain = () => {
    setShowTerrain(!showTerrain);
    if (viewerRef.current) {
      viewerRef.current.terrainProvider = showTerrain 
        ? new window.Cesium.EllipsoidTerrainProvider()
        : window.Cesium.createWorldTerrain();
    }
  };

  // Reset camera view
  const resetView = () => {
    if (viewerRef.current) {
      const airportCoords = selectedAirport ? getAirportCoords(selectedAirport) : null;
      if (airportCoords) {
        viewerRef.current.camera.setView({
          destination: window.Cesium.Cartesian3.fromDegrees(
            airportCoords.lng, 
            airportCoords.lat, 
            50000
          ),
          orientation: {
            heading: 0.0,
            pitch: window.Cesium.Math.toRadians(-45),
            roll: 0.0
          }
        });
      } else {
        viewerRef.current.camera.setView({
          destination: window.Cesium.Cartesian3.fromDegrees(-98.5, 39.6, 10000000)
        });
      }
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center text-red-400">
          <div className="text-lg font-medium mb-2">Cesium 3D Error</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={initializeCesium}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-lg font-medium mb-2">Loading 3D Scene...</div>
          <div className="text-sm">Initializing Cesium viewer</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-black/75 text-white px-4 py-2 rounded-lg text-sm">
        <div>{aircraftData.length} aircraft • {selectedAirport || 'Global View'} • {radius}nm</div>
        <div className="text-xs text-gray-300 mt-1">
          Cesium 3D View • Click aircraft for details
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={toggleTerrain}
          className={`p-2 rounded-lg text-white text-xs ${
            showTerrain ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title="Toggle Terrain"
        >
          TERRAIN
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
          title="Reset View"
        >
          RESET
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <span>Airborne</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Ground</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Airport</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cesium3D;
