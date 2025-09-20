import React, { useEffect, useRef, useState, useCallback } from 'react';

const CesiumATCDashboard = ({ aircraft, conflicts, onAircraftSelect, sector, onError }) => {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Cesium viewer
  useEffect(() => {
    if (!cesiumContainer.current) return;

    const initializeCesium = async () => {
      try {
        // Dynamically import Cesium
        const Cesium = await import('cesium');
        
        // Set Cesium base path
        window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';
        
        // Set Cesium Ion access token
        Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN || process.env.CESIUM_TOKEN;
        
        const viewer = new Cesium.Viewer(cesiumContainer.current, {
          terrainProvider: Cesium.createWorldTerrain({
            requestWaterMask: true,
            requestVertexNormals: true
          }),
          imageryProvider: new Cesium.IonImageryProvider({ assetId: 1 }), // Bing Maps imagery
          timeline: false,
          animation: false,
          homeButton: false,
          sceneModePicker: false,
          baseLayerPicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          infoBox: false,
          selectionIndicator: false,
          shadows: true,
          shouldAnimate: true,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity
        });

        // Configure camera
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            (sector.min_lon + sector.max_lon) / 2,
            (sector.min_lat + sector.max_lat) / 2,
            1000000
          ),
          orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0.0
          }
        });

        // Add sector boundaries
        addSectorBoundaries(viewer, sector, Cesium);

        // Configure lighting and atmosphere
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.atmosphereLightIntensity = 10.0;
        viewer.scene.globe.atmosphereMieCoefficient = new Cesium.Cartesian3(21e-6, 21e-6, 21e-6);
        viewer.scene.globe.atmosphereMieScaleHeight = 1200.0;
        viewer.scene.globe.atmosphereRayleighCoefficient = new Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);
        viewer.scene.globe.atmosphereRayleighScaleHeight = 8000.0;
        
        // Enable fog for better depth perception
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0002;
        viewer.scene.fog.screenSpaceErrorFactor = 2.0;

        viewerRef.current = { viewer, Cesium };
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Cesium:', err);
        setError('Failed to load Cesium. Please ensure Cesium is installed: npm install cesium');
        setLoading(false);
        if (onError) {
          onError();
        }
      }
    };

    initializeCesium();

    return () => {
      if (viewerRef.current && viewerRef.current.viewer) {
        viewerRef.current.viewer.destroy();
        viewerRef.current = null;
      }
    };
  }, [sector]);

  // Add sector boundaries
  const addSectorBoundaries = (viewer, sector, Cesium) => {
    const rectangle = viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(
          sector.min_lon,
          sector.min_lat,
          sector.max_lon,
          sector.max_lat
        ),
        material: Cesium.Color.YELLOW.withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        height: 0
      }
    });
  };

  // Update aircraft positions
  useEffect(() => {
    if (!viewerRef.current) return;

    const { viewer, Cesium } = viewerRef.current;

    // Clear existing aircraft
    viewer.entities.removeAll();

    // Add sector boundaries
    addSectorBoundaries(viewer, sector, Cesium);

    // Add aircraft
    aircraft.forEach(aircraftData => {
      const position = Cesium.Cartesian3.fromDegrees(
        aircraftData.longitude,
        aircraftData.latitude,
        aircraftData.altitude
      );

      const entity = viewer.entities.add({
        position: position,
        billboard: {
          image: createAircraftIcon(aircraftData),
          scale: 0.5,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        },
        label: {
          text: aircraftData.callsign || aircraftData.icao24,
          font: '12pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -40),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        },
        properties: {
          aircraft: aircraftData
        }
      });

      // Add click handler
      entity.onClick = () => {
        if (onAircraftSelect) {
          onAircraftSelect(aircraftData);
        }
      };
    });

    // Add conflicts
    conflicts.forEach(conflict => {
      const aircraft1Pos = Cesium.Cartesian3.fromDegrees(
        conflict.aircraft1.longitude,
        conflict.aircraft1.latitude,
        conflict.aircraft1.altitude
      );
      
      const aircraft2Pos = Cesium.Cartesian3.fromDegrees(
        conflict.aircraft2.longitude,
        conflict.aircraft2.latitude,
        conflict.aircraft2.altitude
      );

      // Add conflict line
      viewer.entities.add({
        polyline: {
          positions: [aircraft1Pos, aircraft2Pos],
          width: 3,
          material: Cesium.Color.RED,
          clampToGround: false
        }
      });

      // Add conflict markers
      viewer.entities.add({
        position: aircraft1Pos,
        billboard: {
          image: createConflictIcon(),
          scale: 0.8,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        }
      });

      viewer.entities.add({
        position: aircraft2Pos,
        billboard: {
          image: createConflictIcon(),
          scale: 0.8,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        }
      });
    });
  }, [aircraft, conflicts, sector, onAircraftSelect]);

  // Create aircraft icon
  const createAircraftIcon = (aircraftData) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Draw aircraft shape
    ctx.fillStyle = aircraftData.on_ground ? '#10B981' : '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(8, 28);
    ctx.lineTo(12, 28);
    ctx.lineTo(16, 20);
    ctx.lineTo(20, 28);
    ctx.lineTo(24, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas.toDataURL();
  };

  // Create conflict icon
  const createConflictIcon = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Draw warning triangle
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(4, 28);
    ctx.lineTo(28, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Add exclamation mark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 16, 22);

    return canvas.toDataURL();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-aviation-200 border-t-aviation-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-aviation-700 font-medium">Loading 3D Globe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-2">3D Viewer Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 font-medium mb-2">To fix this issue:</p>
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Stop the development server (Ctrl+C)</li>
              <li>Run: <code className="bg-yellow-100 px-1 rounded">npm install cesium resium</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div ref={cesiumContainer} className="h-full w-full" />
    </div>
  );
};

export default CesiumATCDashboard;