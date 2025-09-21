import React, { useEffect, useRef, useState } from 'react';

const Cesium3D = ({ selectedAirport, aircraftData, radius, onRadiusChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const cesiumContainerRef = useRef(null);

  // Airport coordinates database
  const airportCoordinates = {
    "KJFK": { lat: 40.6413, lon: -73.7781, name: "John F. Kennedy International Airport" },
    "KLAX": { lat: 33.9425, lon: -118.4081, name: "Los Angeles International Airport" },
    "KORD": { lat: 41.9786, lon: -87.9048, name: "O'Hare International Airport" },
    "KATL": { lat: 33.6367, lon: -84.4281, name: "Hartsfield-Jackson Atlanta International Airport" },
    "KDFW": { lat: 32.8998, lon: -97.0403, name: "Dallas/Fort Worth International Airport" },
    "KDEN": { lat: 39.8617, lon: -104.6731, name: "Denver International Airport" },
    "KSFO": { lat: 37.6213, lon: -122.3790, name: "San Francisco International Airport" },
    "KLAS": { lat: 36.0840, lon: -115.1537, name: "McCarran International Airport" },
    "KMIA": { lat: 25.7932, lon: -80.2906, name: "Miami International Airport" },
    "KSEA": { lat: 47.4502, lon: -122.3088, name: "Seattle-Tacoma International Airport" },
    "KBOS": { lat: 42.3656, lon: -71.0096, name: "Logan International Airport" },
    "KPHX": { lat: 33.4343, lon: -112.0116, name: "Phoenix Sky Harbor International Airport" },
    "KIAH": { lat: 29.9902, lon: -95.3368, name: "George Bush Intercontinental Airport" },
    "KMCO": { lat: 28.4312, lon: -81.3081, name: "Orlando International Airport" },
    "KDCA": { lat: 38.8521, lon: -77.0377, name: "Ronald Reagan Washington National Airport" },
    "KBWI": { lat: 39.1775, lon: -76.6684, name: "Baltimore/Washington International Airport" },
    "KPHL": { lat: 39.8729, lon: -75.2437, name: "Philadelphia International Airport" },
    "KDTW": { lat: 42.2124, lon: -83.3534, name: "Detroit Metropolitan Wayne County Airport" },
    "KMSP": { lat: 44.8848, lon: -93.2223, name: "Minneapolis-Saint Paul International Airport" },
    "KCLT": { lat: 35.2144, lon: -80.9473, name: "Charlotte Douglas International Airport" },
  };

  // Debug props changes
  useEffect(() => {
    console.log('Props changed:', {
      selectedAirport: selectedAirport,
      selectedAirportStructure: selectedAirport ? Object.keys(selectedAirport) : null,
      selectedAirportValues: selectedAirport ? Object.entries(selectedAirport) : null,
      aircraftCount: aircraftData?.length,
      radius,
      viewerExists: !!viewerRef.current
    });
  }, [selectedAirport, aircraftData, radius]);

  useEffect(() => {
    let viewer = null;

    const initCesium = async () => {
      try {
        // Check Cesium is loaded
        if (typeof window.Cesium === 'undefined') {
          throw new Error('Cesium not loaded');
        }

        // Check container exists
        if (!cesiumContainerRef.current) {
          // Wait a tick for the ref to attach
          setTimeout(initCesium, 50);
          return;
        }

        // Set token
        window.Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YzRjMzUxYy0xNzViLTQ5ZjYtOWQ1Ny0zM2IyMzNhNjMyNjEiLCJpZCI6MzQyNjcyLCJpYXQiOjE3NTgyMzU2OTB9.DTCEydDbow3_K2Wqxw4KIu-hO5H9Dni60LRy-FOYugA';

        // Create viewer with 3D buildings and enhanced terrain
        viewer = new window.Cesium.Viewer(cesiumContainerRef.current, {
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          scene3DOnly: true, // Force 3D mode
          shadows: true, // Enable shadows for realism
          terrainShadows: window.Cesium.ShadowMode.ENABLED
        });

        // Set terrain provider after viewer creation
        try {
          // Try to use world terrain if available
          if (window.Cesium.CesiumTerrainProvider && window.Cesium.CesiumTerrainProvider.fromIonAssetId) {
            window.Cesium.CesiumTerrainProvider.fromIonAssetId(1)
              .then(terrainProvider => {
                viewer.terrainProvider = terrainProvider;
                console.log('World terrain loaded');
              })
              .catch(error => {
                console.warn('Could not load world terrain, using default:', error);
                viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
              });
          } else {
            // Use default terrain provider
            viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
            console.log('Using default terrain provider');
          }
        } catch (error) {
          console.warn('Terrain setup error, using default:', error);
          viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
        }

        // Enable 3D buildings
        try {
          if (window.Cesium.Cesium3DTileset && window.Cesium.Cesium3DTileset.fromIonAssetId) {
            window.Cesium.Cesium3DTileset.fromIonAssetId(1, {
              maximumScreenSpaceError: 0.8,
              maximumMemoryUsage: 1024
            }).then(tileset => {
              viewer.scene.primitives.add(tileset);
              console.log('3D buildings loaded');
            }).catch(error => {
              console.warn('Could not load 3D buildings:', error);
          });
        } else {
            console.log('3D buildings not available in this Cesium version');
          }
        } catch (error) {
          console.warn('3D buildings setup error:', error);
        }

        // Enable enhanced lighting
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.atmosphereLightIntensity = 10.0;

        // Enable fog for depth perception
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

        // Enable post-processing effects for better visuals
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.scene.postProcessStages.fxaa.edgeThreshold = 0.1;
        viewer.scene.postProcessStages.fxaa.edgeThresholdMin = 0.05;

        // Set better rendering quality
        viewer.scene.globe.maximumScreenSpaceError = 1.0;
        viewer.scene.globe.tileCacheSize = 1000;

        // Configure camera controls for ATC-style side view
        const controller = viewer.scene.screenSpaceCameraController;
        
        // Allow tilting (default is restricted)
        controller.enableTilt = true;
        
        // Allow panning (drag camera without orbiting)
        controller.enableTranslate = true;
        
        // Set pitch (tilt up/down) limits for globe view
        controller.minimumPitch = window.Cesium.Math.toRadians(-90.0); // look straight down
        controller.maximumPitch = window.Cesium.Math.toRadians(0.0);   // horizon
        
        console.log('Camera controls configured:', {
          enableTilt: controller.enableTilt,
          enableTranslate: controller.enableTranslate,
          minPitch: controller.minimumPitch,
          maxPitch: controller.maximumPitch
        });
        
        // Set initial camera to show the whole globe
        setTimeout(() => {
          viewer.camera.setView({
            destination: window.Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // Center of globe, high altitude
            orientation: {
              heading: window.Cesium.Math.toRadians(0.0),   // face north
              pitch: window.Cesium.Math.toRadians(-90.0),   // look straight down at globe
              roll: 0.0
            }
          });
          console.log('Initial camera view set to show whole globe');
        }, 100);

        viewerRef.current = viewer;

        // Ensure canvas size is valid and reacts to layout
        const handleResize = () => {
          try {
            viewer.resize();
          } catch (_) {}
        };
        window.addEventListener('resize', handleResize);
        // First resize after mount
        setTimeout(handleResize, 0);
        setIsLoading(false);
        console.log('Cesium loaded successfully');
        console.log('Props received:', { selectedAirport, aircraftData: aircraftData?.length, radius });

      } catch (err) {
        console.error('Cesium error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    // Initialize Cesium after first paint
    const timer = setTimeout(initCesium, 0);

    return () => {
      clearTimeout(timer);
      if (viewerRef.current) {
        try { window.removeEventListener('resize', () => {}); } catch (_) {}
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update aircraft - red dots with optional radius filter
  useEffect(() => {
    if (!viewerRef.current || !aircraftData) return;

    const viewer = viewerRef.current;
    viewer.entities.removeAll();

    console.log('Aircraft update:', {
      totalAircraft: aircraftData?.length,
      selectedAirport: selectedAirport?.name,
      radius,
      firstAircraft: aircraftData?.[0]
    });

    // Add aircraft as simple red dots
    const withinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
      // If no radius filtering specified, show all aircraft
      if (!radiusKm || !selectedAirport) return true;
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= radiusKm;
    };

    // Validate and cap dataset size to prevent rendering issues
    const safeAircraft = aircraftData
      .filter(a => a && Number.isFinite(a.latitude) && Number.isFinite(a.longitude)
        && a.latitude >= -90 && a.latitude <= 90 && a.longitude >= -180 && a.longitude <= 180)
      .slice(0, 2000);

    let addedCount = 0;
    safeAircraft.forEach((aircraft, index) => {
      if (aircraft.latitude && aircraft.longitude) {
        // Apply radius filter only if both airport and radius are specified
        let airportLat = null;
        let airportLon = null;
        
        if (typeof selectedAirport === 'string') {
          const airportData = airportCoordinates[selectedAirport];
          if (airportData) {
            airportLat = airportData.lat;
            airportLon = airportData.lon;
          }
        } else if (selectedAirport && typeof selectedAirport === 'object') {
          airportLat = selectedAirport.latitude || selectedAirport.lat || selectedAirport.Latitude || selectedAirport.LAT;
          airportLon = selectedAirport.longitude || selectedAirport.lng || selectedAirport.lon || selectedAirport.Longitude || selectedAirport.LON;
        }
        
        const withinFilter = withinRadius(
          airportLat,
          airportLon,
          aircraft.latitude,
          aircraft.longitude,
          radius
        );
        
        if (selectedAirport && radius && !withinFilter) {
          return;
        }
        try {
          const altitudeMeters = Number.isFinite(aircraft.altitude) ? Math.max(0, aircraft.altitude * 0.3048 + 100) : 100;
          const labelText = (aircraft.callsign ?? aircraft.tag ?? aircraft.id ?? `A${index + 1}`) + '';
      viewer.entities.add({
        position: window.Cesium.Cartesian3.fromDegrees(
          aircraft.longitude,
          aircraft.latitude,
              altitudeMeters
        ),
        point: { 
              pixelSize: 8, 
          color: window.Cesium.Color.RED 
        },
        label: {
              text: labelText.slice(0, 16),
              font: '12px sans-serif',
          fillColor: window.Cesium.Color.WHITE,
          outlineColor: window.Cesium.Color.BLACK,
              outlineWidth: 2,
              pixelOffset: new window.Cesium.Cartesian2(0, -18),
              style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
          addedCount++;
        } catch (_) {}
      }
    });
    
    console.log(`Added ${addedCount} aircraft entities to viewer`);
  }, [aircraftData, selectedAirport, radius]);

  // Update airport view (validate coordinates and add airport marker)
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    
    // Remove existing airport markers
    const airportEntities = viewer.entities.values.filter(entity => 
      entity.id && entity.id.toString().startsWith('airport-')
    );
    airportEntities.forEach(entity => viewer.entities.remove(entity));
    
    // Handle both string airport codes and airport objects
    let airportData = null;
    let lat = null;
    let lon = null;
    let airportName = null;

    if (typeof selectedAirport === 'string') {
      // selectedAirport is an airport code like "KJFK"
      airportData = airportCoordinates[selectedAirport];
      if (airportData) {
        lat = airportData.lat;
        lon = airportData.lon;
        airportName = airportData.name;
      }
    } else if (selectedAirport && typeof selectedAirport === 'object') {
      // selectedAirport is an object with coordinate properties
      lat = selectedAirport.latitude || selectedAirport.lat || selectedAirport.Latitude || selectedAirport.LAT;
      lon = selectedAirport.longitude || selectedAirport.lng || selectedAirport.lon || selectedAirport.Longitude || selectedAirport.LON;
      airportName = selectedAirport.name || selectedAirport.code;
    }
    
    console.log('Airport coordinate check:', {
      selectedAirport,
      isString: typeof selectedAirport === 'string',
      foundInDatabase: !!airportData,
      extractedLat: lat,
      extractedLon: lon,
      airportName,
      latValid: Number.isFinite(lat),
      lonValid: Number.isFinite(lon)
    });
    
    if (selectedAirport && Number.isFinite(lat) && Number.isFinite(lon)
      && lat >= -90 && lat <= 90
      && lon >= -180 && lon <= 180) {
      
      console.log('Flying to airport:', selectedAirport.name, lat, lon);
      
      // Add airport marker
      viewer.entities.add({
        id: 'airport-marker',
        position: window.Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          0
        ),
        point: {
          pixelSize: 15,
          color: window.Cesium.Color.BLUE,
          outlineColor: window.Cesium.Color.WHITE,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: airportName || selectedAirport || 'Airport',
          font: '14px bold sans-serif',
          fillColor: window.Cesium.Color.CYAN,
          outlineColor: window.Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new window.Cesium.Cartesian2(0, -25),
          style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      // Add radius circle if radius is specified
      if (radius && radius > 0) {
        viewer.entities.add({
          id: 'airport-radius',
          position: window.Cesium.Cartesian3.fromDegrees(
            lon,
            lat,
            0
          ),
          ellipse: {
            semiMajorAxis: radius * 1000, // Convert km to meters
            semiMinorAxis: radius * 1000,
            material: window.Cesium.Color.YELLOW.withAlpha(0.2),
            outline: true,
            outlineColor: window.Cesium.Color.YELLOW,
            height: 0
          }
        });
      }
      
      // Fly to airport with ATC-style camera positioning
      viewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          radius ? Math.max(8000, radius * 800) : 15000 // Higher altitude for 3D buildings visibility
        ),
        orientation: {
          heading: window.Cesium.Math.toRadians(0.0),   // face north
          pitch: window.Cesium.Math.toRadians(-60.0),   // tilt 60° down from horizon (vertical ATC view)
          roll: 0.0
        },
        duration: 3.0,
        complete: () => {
          console.log('Camera fly-to completed with 60° ATC tilt');
        }
      });
    } else if (selectedAirport) {
      console.warn('Invalid airport coordinates:', selectedAirport);
    }
  }, [selectedAirport, radius]);

    return (
    <div className="w-full h-full relative">
      <div 
        ref={cesiumContainerRef}
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          backgroundColor: '#1a1a1a'
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading 3D View...</div>
        </div>
      </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Failed to load 3D view</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
      )}
      
      {!isLoading && !error && (
      <div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg z-10">
        <div className="text-sm font-medium">✅ NAVDA Active</div>
        <div className="text-xs text-gray-300">
            {selectedAirport ? `Tracking: ${typeof selectedAirport === 'string' ? airportCoordinates[selectedAirport]?.name || selectedAirport : selectedAirport.name || selectedAirport.code || 'Airport'}` : '3D Globe View'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
            Aircraft: {aircraftData ? aircraftData.length : 0}
            {selectedAirport && (
              <div className="text-blue-300">
                Airport: {(() => {
                  if (typeof selectedAirport === 'string') {
                    const data = airportCoordinates[selectedAirport];
                    return data ? `${data.lat.toFixed(2)}, ${data.lon.toFixed(2)}` : 'Not in database';
                  } else {
                    const lat = selectedAirport.latitude || selectedAirport.lat || selectedAirport.Latitude || selectedAirport.LAT;
                    const lon = selectedAirport.longitude || selectedAirport.lng || selectedAirport.lon || selectedAirport.Longitude || selectedAirport.LON;
                    return (lat && lon) ? `${lat.toFixed(2)}, ${lon.toFixed(2)}` : 'N/A, N/A';
                  }
                })()}
              </div>
            )}
            {selectedAirport && radius && (
              <div className="text-yellow-300">
                Radius: {radius}km
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cesium3D;