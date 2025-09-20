import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map controls component
const MapControls = ({ onCenterChange, onZoomChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange(center);
      onZoomChange(zoom);
    };
    
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map, onCenterChange, onZoomChange]);
  
  return null;
};

const FlightTrackerMap = ({ 
  sector, 
  aircraft, 
  conflicts, 
  onAircraftSelect,
  onMapInteraction,
  selectedAircraft 
}) => {
  const [mapCenter, setMapCenter] = useState([45.0, 0.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const [mapBounds, setMapBounds] = useState(null);
  const mapRef = useRef(null);

  // Update map center when sector changes
  useEffect(() => {
    if (sector) {
      const centerLat = (sector.min_lat + sector.max_lat) / 2;
      const centerLon = (sector.min_lon + sector.max_lon) / 2;
      setMapCenter([centerLat, centerLon]);
    }
  }, [sector]);

  // Handle map interactions
  const handleCenterChange = (center) => {
    setMapCenter([center.lat, center.lng]);
    if (onMapInteraction) {
      onMapInteraction({ center, zoom: mapZoom, bounds: mapBounds });
    }
  };

  const handleZoomChange = (zoom) => {
    setMapZoom(zoom);
    if (onMapInteraction) {
      onMapInteraction({ center: mapCenter, zoom, bounds: mapBounds });
    }
  };

  // Create aircraft icon based on altitude and status
  const createAircraftIcon = (aircraft) => {
    const altitude = aircraft.altitude || 0;
    const isOnGround = aircraft.on_ground;
    const isSelected = selectedAircraft && selectedAircraft.icao24 === aircraft.icao24;
    
    let color = '#0ea5e9'; // Default aviation blue
    let size = 20;
    
    if (isSelected) {
      color = '#dc2626'; // Red for selected
      size = 28;
    } else if (isOnGround) {
      color = '#6b7280'; // Gray for ground
    } else if (altitude > 35000) {
      color = '#dc2626'; // Red for high altitude
    } else if (altitude > 25000) {
      color = '#d97706'; // Orange for medium altitude
    } else if (altitude > 15000) {
      color = '#059669'; // Green for low altitude
    }

    return L.divIcon({
      className: 'aircraft-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.5}px;
          font-weight: bold;
          color: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">
          ✈
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1); }
            50% { transform: scale(1.1); box-shadow: 0 6px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(220, 38, 38, 0.3); }
            100% { transform: scale(1); box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1); }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Create conflict marker
  const createConflictIcon = (conflict) => {
    return L.divIcon({
      className: 'conflict-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: 4px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          color: white;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.3);
          animation: conflict-pulse 1.5s infinite;
          cursor: pointer;
        ">
          ⚠
        </div>
        <style>
          @keyframes conflict-pulse {
            0% { transform: scale(1); box-shadow: 0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.3); }
            50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(220, 38, 38, 0.8), 0 0 60px rgba(220, 38, 38, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.3); }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  // Format altitude for display
  const formatAltitude = (altitude) => {
    if (!altitude) return 'N/A';
    return `${Math.round(altitude / 100)}FL`;
  };

  // Format speed for display
  const formatSpeed = (velocity) => {
    if (!velocity) return 'N/A';
    return `${Math.round(velocity * 1.944)} kts`;
  };

  // Format heading for display
  const formatHeading = (heading) => {
    if (!heading) return 'N/A';
    return `${Math.round(heading)}°`;
  };

  // Get aircraft status color
  const getAircraftStatusColor = (aircraft) => {
    const altitude = aircraft.altitude || 0;
    if (aircraft.on_ground) return 'text-gray-600';
    if (altitude > 35000) return 'text-red-600';
    if (altitude > 25000) return 'text-orange-600';
    if (altitude > 15000) return 'text-green-600';
    return 'text-aviation-600';
  };

  return (
    <div className="h-full w-full relative">
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Map Info</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Center: {mapCenter[0].toFixed(4)}°, {mapCenter[1].toFixed(4)}°</div>
            <div>Zoom: {mapZoom}</div>
            <div>Aircraft: {aircraft.length}</div>
            <div>Conflicts: {conflicts.length}</div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>On Ground</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Alt (15k-25k)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Med Alt (25k-35k)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Alt (35k+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-aviation-500 rounded-full"></div>
              <span>Normal</span>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Map Controls */}
        <MapControls onCenterChange={handleCenterChange} onZoomChange={handleZoomChange} />
        
        {/* Sector boundary */}
        {sector && (
          <Circle
            center={[(sector.min_lat + sector.max_lat) / 2, (sector.min_lon + sector.max_lon) / 2]}
            radius={50000} // 50km radius
            pathOptions={{
              color: '#0ea5e9',
              fillColor: '#0ea5e9',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        )}

        {/* Aircraft markers */}
        {aircraft.map((aircraft) => (
          <Marker
            key={aircraft.icao24}
            position={[aircraft.latitude, aircraft.longitude]}
            icon={createAircraftIcon(aircraft)}
            eventHandlers={{
              click: () => onAircraftSelect && onAircraftSelect(aircraft)
            }}
          >
            <Popup>
              <div className="p-4 min-w-[320px]">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{aircraft.callsign}</h3>
                    <p className="text-sm text-gray-600">ICAO24: {aircraft.icao24}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-aviation-50 p-3 rounded-lg">
                    <p className="text-aviation-600 text-xs font-medium mb-1">Altitude</p>
                    <p className="font-bold text-lg text-aviation-800">{formatAltitude(aircraft.altitude)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-600 text-xs font-medium mb-1">Speed</p>
                    <p className="font-bold text-lg text-green-800">{formatSpeed(aircraft.velocity)}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-orange-600 text-xs font-medium mb-1">Heading</p>
                    <p className="font-bold text-lg text-orange-800">{formatHeading(aircraft.heading)}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-purple-600 text-xs font-medium mb-1">Squawk</p>
                    <p className="font-bold text-lg text-purple-800 font-mono">{aircraft.squawk}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium text-gray-900">{aircraft.origin_country}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      aircraft.on_ground 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-aviation-100 text-aviation-800'
                    }`}>
                      {aircraft.on_ground ? 'On Ground' : 'In Flight'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-xs text-gray-700">
                      {aircraft.latitude.toFixed(4)}°, {aircraft.longitude.toFixed(4)}°
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Conflict markers and lines */}
        {conflicts.map((conflict, index) => {
          const aircraft1 = conflict.aircraft1;
          const aircraft2 = conflict.aircraft2;
          
          return (
            <React.Fragment key={index}>
              {/* Conflict markers */}
              <Marker
                position={[aircraft1.latitude, aircraft1.longitude]}
                icon={createConflictIcon(conflict)}
              >
                <Popup>
                  <div className="p-4 min-w-[360px]">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-red-600">CONFLICT ALERT</h3>
                        <p className="text-sm text-gray-600">Immediate attention required</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-red-600 text-xs font-medium mb-1">Aircraft 1</p>
                        <p className="font-bold text-lg text-red-800">{aircraft1.callsign}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-red-600 text-xs font-medium mb-1">Aircraft 2</p>
                        <p className="font-bold text-lg text-red-800">{aircraft2.callsign}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-orange-600 text-xs font-medium mb-1">Separation</p>
                        <p className="font-bold text-lg text-orange-800">{conflict.separation_distance.toFixed(2)} NM</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-600 text-xs font-medium mb-1">Time to Conflict</p>
                        <p className="font-bold text-lg text-yellow-800">{conflict.time_to_conflict.toFixed(0)}s</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{conflict.conflict_type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Severity:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          conflict.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          conflict.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {conflict.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Line connecting conflicting aircraft */}
              <Polyline
                positions={[
                  [aircraft1.latitude, aircraft1.longitude],
                  [aircraft2.latitude, aircraft2.longitude]
                ]}
                pathOptions={{
                  color: '#dc2626',
                  weight: 4,
                  opacity: 0.9,
                  dashArray: '15, 10',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FlightTrackerMap;
