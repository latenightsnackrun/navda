import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AircraftMap = ({ sector, aircraft, conflicts, onAircraftSelect }) => {
  const [mapCenter, setMapCenter] = useState([45.0, 0.0]);
  const [mapZoom, setMapZoom] = useState(6);
  const mapRef = useRef(null);

  // Update map center when sector changes
  useEffect(() => {
    if (sector) {
      const centerLat = (sector.min_lat + sector.max_lat) / 2;
      const centerLon = (sector.min_lon + sector.max_lon) / 2;
      setMapCenter([centerLat, centerLon]);
    }
  }, [sector]);

  // Create aircraft icon based on altitude and status
  const createAircraftIcon = (aircraft) => {
    const altitude = aircraft.altitude || 0;
    const isOnGround = aircraft.on_ground;
    
    let color = '#3b82f6'; // Default blue
    let shadowColor = 'rgba(59, 130, 246, 0.3)';
    
    if (isOnGround) {
      color = '#6b7280'; // Gray for ground
      shadowColor = 'rgba(107, 114, 128, 0.3)';
    } else if (altitude > 35000) {
      color = '#ef4444'; // Red for high altitude
      shadowColor = 'rgba(239, 68, 68, 0.3)';
    } else if (altitude > 25000) {
      color = '#f59e0b'; // Orange for medium altitude
      shadowColor = 'rgba(245, 158, 11, 0.3)';
    } else if (altitude > 15000) {
      color = '#10b981'; // Green for low altitude
      shadowColor = 'rgba(16, 185, 129, 0.3)';
    }

    return L.divIcon({
      className: 'aircraft-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
          box-shadow: 0 4px 8px ${shadowColor}, 0 0 0 1px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          ✈
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Create conflict marker
  const createConflictIcon = (conflict) => {
    return L.divIcon({
      className: 'conflict-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 4px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: white;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
          animation: pulse 1.5s infinite;
          cursor: pointer;
        ">
          ⚠
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3); }
            50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3); }
          }
        </style>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  // Get aircraft color based on altitude
  const getAircraftColor = (aircraft) => {
    const altitude = aircraft.altitude || 0;
    if (aircraft.on_ground) return '#6b7280';
    if (altitude > 35000) return '#ef4444';
    if (altitude > 25000) return '#f59e0b';
    if (altitude > 15000) return '#10b981';
    return '#3b82f6';
  };

  // Format altitude for display
  const formatAltitude = (altitude) => {
    if (!altitude) return 'N/A';
    return `${Math.round(altitude / 100)}FL`;
  };

  // Format speed for display
  const formatSpeed = (velocity) => {
    if (!velocity) return 'N/A';
    return `${Math.round(velocity * 1.944)} kts`; // Convert m/s to knots
  };

  // Format heading for display
  const formatHeading = (heading) => {
    if (!heading) return 'N/A';
    return `${Math.round(heading)}°`;
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Sector boundary */}
        {sector && (
          <Circle
            center={[(sector.min_lat + sector.max_lat) / 2, (sector.min_lon + sector.max_lon) / 2]}
            radius={50000} // 50km radius
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
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
              <div className="p-4 min-w-[280px]">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✈</span>
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
                  <div className="p-4 min-w-[320px]">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">⚠</span>
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
                  color: '#ef4444',
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

export default AircraftMap;
