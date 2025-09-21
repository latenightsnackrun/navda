import React, { useEffect, useRef, useState } from 'react';

// Helper function to create aircraft icon with better visibility
const createAircraftIcon = (color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 24; // Smaller for better performance
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  
  // Draw aircraft shape with better contrast
  ctx.fillStyle = color.toCssColorString();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  
  // Aircraft body (main fuselage)
  ctx.beginPath();
  ctx.ellipse(12, 12, 8, 3, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Aircraft wings (horizontal)
  ctx.beginPath();
  ctx.ellipse(12, 12, 6, 1.5, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Aircraft tail (vertical)
  ctx.beginPath();
  ctx.ellipse(12, 9, 1.5, 4, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Add a small dot in the center for better visibility
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(12, 12, 1, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas;
};

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

        // Set up proper terrain provider with water and normals
        try {
          // Use Cesium World Terrain with water mask and vertex normals
          if (window.Cesium.createWorldTerrainAsync) {
            viewer.terrainProvider = await window.Cesium.createWorldTerrainAsync({
              requestWaterMask: true,   // for realistic water effects
              requestVertexNormals: true // for better lighting/shading
            });
            console.log('Cesium World Terrain loaded with water mask and vertex normals');
          } else {
            // Fallback to Ion terrain
            if (window.Cesium.CesiumTerrainProvider && window.Cesium.CesiumTerrainProvider.fromIonAssetId) {
              window.Cesium.CesiumTerrainProvider.fromIonAssetId(1)
                .then(terrainProvider => {
                  viewer.terrainProvider = terrainProvider;
                  console.log('Ion terrain loaded');
                })
                .catch(error => {
                  console.warn('Could not load Ion terrain, using default:', error);
                  viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
                });
            } else {
              viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
              console.log('Using default terrain provider');
            }
          }
        } catch (error) {
          console.warn('Terrain setup error, using default:', error);
          viewer.terrainProvider = new window.Cesium.EllipsoidTerrainProvider();
        }

        // 3D buildings disabled for better performance - terrain only
        console.log('3D buildings disabled - using terrain only for optimal performance');

        // Ensure proper imagery layer is loaded beneath terrain
        try {
          // Add Bing Maps imagery for better terrain visualization
          if (window.Cesium.IonImageryProvider) {
            viewer.imageryLayers.addImageryProvider(
              new window.Cesium.IonImageryProvider({ assetId: 2 }) // Bing Maps
            );
            console.log('Bing Maps imagery loaded for terrain visualization');
          } else {
            console.log('Ion imagery provider not available, using default imagery');
          }
        } catch (error) {
          console.warn('Imagery setup error:', error);
        }

        // Enhanced lighting settings are now in the optimized rendering section below
        viewer.scene.globe.atmosphereMieCoefficient = new window.Cesium.Cartesian3(21e-6, 21e-6, 21e-6);
        viewer.scene.globe.atmosphereMieScaleHeight = 8.0;
        viewer.scene.globe.atmosphereRayleighCoefficient = new window.Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

        // Enable fog for better depth perception
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0001;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;
        viewer.scene.fog.minimumBrightness = 0.03;

        // Enable better shadows and lighting
        viewer.scene.shadowMap.enabled = true;
        viewer.scene.shadowMap.softShadows = true;
        viewer.scene.shadowMap.size = 2048;

        // Enable post-processing effects for better visuals
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.scene.postProcessStages.fxaa.edgeThreshold = 0.1;
        viewer.scene.postProcessStages.fxaa.edgeThresholdMin = 0.05;

        // Set optimized rendering quality for faster loading and fix tile gaps
        viewer.scene.globe.maximumScreenSpaceError = 2.0; // Lower quality for faster loading
        viewer.scene.globe.tileCacheSize = 2000; // Increased cache to prevent tile gaps
        viewer.scene.globe.preloadSiblings = true; // Preload adjacent tiles to prevent gaps
        viewer.scene.globe.preloadAncestors = true; // Preload parent tiles for better coverage
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.atmosphereLightIntensity = 15.0;
        
        // Fix terrain gaps and holes
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.globe.showSkyAtmosphere = true;
        viewer.scene.globe.atmosphereMieCoefficient = new window.Cesium.Cartesian3(21e-6, 21e-6, 21e-6);
        viewer.scene.globe.atmosphereMieScaleHeight = 8.0;
        viewer.scene.globe.atmosphereRayleighCoefficient = new window.Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);
        
        // Optimize rendering performance
        viewer.scene.requestRenderMode = false; // Disable request render mode for better performance
        viewer.scene.maximumRenderTimeChange = 0.0; // Allow unlimited render time changes
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

      // Configure camera controls for better 3D navigation
      const controller = viewer.scene.screenSpaceCameraController;
      
      // Allow tilting and rotation for full 3D control
      controller.enableTilt = true;
      controller.enableLook = true;
      controller.enableRotate = true;
      controller.enableTranslate = true;
      controller.enableZoom = true;
      
      // Set pitch limits for better 3D viewing
      controller.minimumPitch = window.Cesium.Math.toRadians(-90.0); // look straight down
      controller.maximumPitch = window.Cesium.Math.toRadians(90.0);  // look straight up
      
      // Configure mouse controls for X/Y movement (pan and rotate)
      controller.tiltEventTypes = [
        window.Cesium.CameraEventType.LEFT_DRAG,
        window.Cesium.CameraEventType.MIDDLE_DRAG
      ];
      
      // Configure zoom controls (two fingers/pinch)
      controller.zoomEventTypes = [
        window.Cesium.CameraEventType.WHEEL,
        window.Cesium.CameraEventType.PINCH
      ];
      
      // Right-click drag for vertical panning (look up/down)
      controller.lookEventTypes = [
        {
          eventType: window.Cesium.CameraEventType.RIGHT_DRAG,
          modifier: window.Cesium.KeyboardEventModifier.NONE
        }
      ];
      
      // Configure mouse controls for better navigation
      // Left click + drag: rotate around center
      // Right click + drag: look up/down (pitch)
      // Middle click + drag: pan
      // Scroll wheel: zoom
      
      console.log('Camera controls configured: Mouse for X/Y movement, right-click for vertical panning, scroll for zoom');
        
        // Set initial camera to show the entire globe over North America
        setTimeout(() => {
          viewer.camera.setView({
            destination: window.Cesium.Cartesian3.fromDegrees(-100, 40, 15000000), // North America view
            orientation: {
              heading: window.Cesium.Math.toRadians(0.0),   // face north
              pitch: window.Cesium.Math.toRadians(-90.0),   // top-down view to see Earth
              roll: 0.0
            }
          });
          console.log('Initial camera view set to show entire globe over North America with top-down view');
        }, 100);

        viewerRef.current = viewer;

        // Save camera state when user navigates away
        const saveCameraState = () => {
          if (viewer && !viewer.isDestroyed()) {
            const cameraState = {
              position: viewer.camera.positionWC,
              direction: viewer.camera.directionWC,
              up: viewer.camera.upWC,
              right: viewer.camera.rightWC
            };
            localStorage.setItem('cesiumCamera', JSON.stringify(cameraState));
            console.log('Camera state saved to localStorage');
          }
        };

        // Restore camera state if available
        const restoreCameraState = () => {
          try {
            const saved = localStorage.getItem('cesiumCamera');
            if (saved && viewer && !viewer.isDestroyed()) {
              const state = JSON.parse(saved);
              viewer.camera.setView({
                destination: new window.Cesium.Cartesian3(
                  state.position.x,
                  state.position.y,
                  state.position.z
                ),
                orientation: {
                  direction: new window.Cesium.Cartesian3(
                    state.direction.x,
                    state.direction.y,
                    state.direction.z
                  ),
                  up: new window.Cesium.Cartesian3(state.up.x, state.up.y, state.up.z),
                  right: new window.Cesium.Cartesian3(state.right.x, state.right.y, state.right.z)
                }
              });
              console.log('Camera state restored from localStorage');
            }
          } catch (error) {
            console.warn('Failed to restore camera state:', error);
          }
        };

        // Restore camera state after a short delay
        setTimeout(restoreCameraState, 1000);

        // Save camera state when component unmounts
        const handleBeforeUnload = () => {
          saveCameraState();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

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

    // Validate aircraft data but don't artificially limit count
    const safeAircraft = aircraftData
      .filter(a => a && Number.isFinite(a.latitude) && Number.isFinite(a.longitude)
        && a.latitude >= -90 && a.latitude <= 90 && a.longitude >= -180 && a.longitude <= 180);

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
          
          // Determine aircraft color based on altitude
          let aircraftColor = window.Cesium.Color.YELLOW; // Default
          if (altitudeMeters > 30000) {
            aircraftColor = window.Cesium.Color.RED; // High altitude
          } else if (altitudeMeters > 10000) {
            aircraftColor = window.Cesium.Color.ORANGE; // Medium altitude
          } else if (altitudeMeters > 3000) {
            aircraftColor = window.Cesium.Color.YELLOW; // Low altitude
          } else {
            aircraftColor = window.Cesium.Color.GREEN; // Ground/low altitude
          }
          
          // Add aircraft as 3D billboard with proper distance scaling
          viewer.entities.add({
            position: window.Cesium.Cartesian3.fromDegrees(
              aircraft.longitude,
              aircraft.latitude,
              altitudeMeters
            ),
            billboard: {
              image: createAircraftIcon(aircraftColor),
              width: 16,
              height: 16,
              verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
              scaleByDistance: new window.Cesium.NearFarScalar(500, 1.0, 20000, 0.6, 100000, 0.3, 300000, 0.1),
              translucencyByDistance: new window.Cesium.NearFarScalar(500, 1.0, 50000, 0.8, 150000, 0.4, 300000, 0.1)
            },
            point: { 
              pixelSize: 4, 
              color: aircraftColor,
              outlineColor: window.Cesium.Color.WHITE,
              outlineWidth: 1,
              heightReference: window.Cesium.HeightReference.RELATIVE_TO_GROUND,
              scaleByDistance: new window.Cesium.NearFarScalar(500, 1.5, 20000, 0.8, 100000, 0.4, 300000, 0.2)
            },
            label: {
              text: labelText.slice(0, 12),
              font: 'bold 14px sans-serif',
              fillColor: window.Cesium.Color.WHITE,
              outlineColor: window.Cesium.Color.BLACK,
              outlineWidth: 3,
              pixelOffset: new window.Cesium.Cartesian2(0, -35), // Move further up
              style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new window.Cesium.NearFarScalar(1000, 1.0, 100000, 0.7),
              heightReference: window.Cesium.HeightReference.NONE, // Don't clamp to ground
              verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM, // Anchor to bottom
              horizontalOrigin: window.Cesium.HorizontalOrigin.CENTER // Center horizontally
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
    
    // If no airport is selected, force full earth view over North America
    if (!selectedAirport) {
      viewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(-100, 40, 15000000), // North America view
        orientation: {
          heading: window.Cesium.Math.toRadians(0.0),   // face north
          pitch: window.Cesium.Math.toRadians(-90.0),   // top-down view to see Earth
          roll: 0.0
        },
        duration: 1.0,
        complete: () => {
          console.log('Forced full earth view over North America - no airport selected');
        }
      });
      return;
    }
    
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
            material: window.Cesium.Color.TRANSPARENT, // No fill, just border
            outline: true,
            outlineColor: window.Cesium.Color.YELLOW,
            outlineWidth: 3, // Make border more visible
            height: 0
          }
        });
      }
      
      // Use globe transition approach: zoom out to globe, then zoom in to airport
      const airportEntity = viewer.entities.getById('airport-marker');
      if (airportEntity) {
        const position = airportEntity.position.getValue(window.Cesium.JulianDate.now());
        const targetDistance = radius ? Math.max(2000, radius * 100) : 5000;
        
        // First zoom out to entire globe with top-down view over North America
        viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(-100, 40, 15000000), // North America view
          orientation: {
            heading: window.Cesium.Math.toRadians(0.0),
            pitch: window.Cesium.Math.toRadians(-90.0), // Top-down view to see Earth
            roll: 0.0
          },
          duration: 1.5, // 1.5 second zoom out
          complete: () => {
            console.log('Zoomed out to globe view over North America');
            
            // Then zoom in to the new airport
            setTimeout(() => {
              viewer.camera.flyTo({
                destination: position,
                orientation: {
                  heading: window.Cesium.Math.toRadians(0.0),
                  pitch: window.Cesium.Math.toRadians(-15.0),
                  roll: 0.0
                },
                duration: 2.0, // 2 second zoom in
                complete: () => {
                  // Final precise positioning with lookAt
                  viewer.camera.lookAt(
                    position,
                    new window.Cesium.HeadingPitchRange(
                      window.Cesium.Math.toRadians(0.0),   // heading (rotation around entity)
                      window.Cesium.Math.toRadians(-15.0), // pitch (shallower angle to see flights in air)
                      targetDistance  // range (closer zoom for better detail)
                    )
                  );
                  
                  // Release the lock so you can move freely again
                  viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
                  
                  console.log(`Camera positioned using globe transition: ${targetDistance}m from airport with -15° shallow pitch`);
                }
              });
            }, 500); // Small delay between zoom out and zoom in
          }
        });
      } else {
        console.warn('Airport entity not found for lookAt positioning');
      }
    } else if (selectedAirport) {
      console.warn('Invalid airport coordinates:', selectedAirport);
    }
  }, [selectedAirport, radius]);

  // Ensure globe view is always shown on initial load over North America
  useEffect(() => {
    if (viewerRef.current && !selectedAirport) {
      const viewer = viewerRef.current;
      viewer.camera.flyTo({
        destination: window.Cesium.Cartesian3.fromDegrees(-100, 40, 15000000), // North America view
        orientation: {
          heading: window.Cesium.Math.toRadians(0.0),   // face north
          pitch: window.Cesium.Math.toRadians(-90.0),   // top-down view to see Earth
          roll: 0.0
        },
        duration: 0.5,
        complete: () => {
          console.log('Initial globe view over North America ensured');
        }
      });
    }
  }, [selectedAirport]);



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