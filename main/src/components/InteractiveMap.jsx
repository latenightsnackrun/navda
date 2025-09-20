import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapControlBar from './MapControlBar';
import AircraftInfoWindow from './AircraftInfoWindow';

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Detect aircraft type from callsign
const getAircraftType = (callsign, altitude) => {
  if (!callsign) return 'unknown';
  
  const callsignUpper = callsign.toUpperCase();
  
  // Cargo aircraft
  if (callsignUpper.includes('CARGO') || callsignUpper.includes('FDX') || callsignUpper.includes('UPS')) {
    return 'cargo';
  }
  
  // Private/Business jets (typically small aircraft at lower altitudes)
  if (altitude < 25000 && (callsignUpper.length <= 5 || callsignUpper.match(/^N\d/))) {
    return 'private';
  }
  
  // Military (common military callsigns)
  if (callsignUpper.includes('AIR FORCE') || callsignUpper.includes('ARMY') || 
      callsignUpper.includes('NAVY') || callsignUpper.match(/^(RCH|CNV|EVAC|REACH)/)) {
    return 'military';
  }
  
  // Heavy commercial aircraft (wide-body indicators)
  if (callsignUpper.match(/^(AAL|UAL|DAL|BAW|AFR|DLH|KLM|SWA|JBU)/) && altitude > 30000) {
    return 'heavy';
  }
  
  // Regional aircraft (typically smaller, lower altitude)
  if (altitude < 30000) {
    return 'regional';
  }
  
  // Default commercial
  return 'commercial';
};

// Custom aircraft icon with different types
const createAircraftIcon = (isOnGround, heading = 0, callsign = '', altitude = 0) => {
  const aircraftType = getAircraftType(callsign, altitude);
  
  let color, size, shape;
  
  if (isOnGround) {
    color = '#ff4444';
    size = 12;
    shape = 'circle';
  } else {
    switch (aircraftType) {
      case 'heavy':
        color = '#3b82f6'; // Blue
        size = 16;
        shape = 'aircraft-large';
        break;
      case 'cargo':
        color = '#f59e0b'; // Amber
        size = 14;
        shape = 'aircraft-cargo';
        break;
      case 'military':
        color = '#ef4444'; // Red
        size = 14;
        shape = 'aircraft-military';
        break;
      case 'private':
        color = '#10b981'; // Emerald
        size = 10;
        shape = 'aircraft-small';
        break;
      case 'regional':
        color = '#8b5cf6'; // Violet
        size = 12;
        shape = 'aircraft-medium';
        break;
      default: // commercial
        color = '#06b6d4'; // Cyan
        size = 14;
        shape = 'aircraft-medium';
    }
  }
  
  const createAircraftSVG = (type, color, size) => {
    const svgSize = size + 4;
    let path = '';
    
    switch (type) {
      case 'aircraft-large':
        path = `<path d="M${svgSize/2} 2 L${svgSize/2 + 3} ${svgSize - 4} L${svgSize/2} ${svgSize - 6} L${svgSize/2 - 3} ${svgSize - 4} Z M${svgSize/2 - 5} ${svgSize/2} L${svgSize/2 + 5} ${svgSize/2} M${svgSize/2 - 3} ${svgSize/2 + 2} L${svgSize/2 + 3} ${svgSize/2 + 2}" stroke="${color}" stroke-width="2" fill="${color}"/>`;
        break;
      case 'aircraft-cargo':
        path = `<rect x="${svgSize/2 - 3}" y="3" width="6" height="${svgSize - 8}" fill="${color}" stroke="white" stroke-width="1"/> <path d="M${svgSize/2} 2 L${svgSize/2 + 2} 5 L${svgSize/2} 4 L${svgSize/2 - 2} 5 Z" fill="${color}"/>`;
        break;
      case 'aircraft-military':
        path = `<path d="M${svgSize/2} 1 L${svgSize/2 + 4} ${svgSize - 3} L${svgSize/2} ${svgSize - 5} L${svgSize/2 - 4} ${svgSize - 3} Z" fill="${color}" stroke="white" stroke-width="1"/> <circle cx="${svgSize/2}" cy="${svgSize/2}" r="2" fill="white"/>`;
        break;
      case 'aircraft-small':
        path = `<path d="M${svgSize/2} 2 L${svgSize/2 + 2} ${svgSize - 3} L${svgSize/2} ${svgSize - 4} L${svgSize/2 - 2} ${svgSize - 3} Z" fill="${color}" stroke="white" stroke-width="1"/>`;
        break;
      default: // aircraft-medium
        path = `<path d="M${svgSize/2} 2 L${svgSize/2 + 3} ${svgSize - 3} L${svgSize/2} ${svgSize - 5} L${svgSize/2 - 3} ${svgSize - 3} Z M${svgSize/2 - 4} ${svgSize/2 + 1} L${svgSize/2 + 4} ${svgSize/2 + 1}" stroke="${color}" stroke-width="1.5" fill="${color}"/>`;
    }
    
    return `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${heading}deg);">${path}</svg>`;
  };
  
  if (isOnGround) {
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background-color: ${color}; 
        border-radius: 50%; 
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
            width: 4px; 
            height: 4px; 
            background-color: white;
            border-radius: 50%;
        "></div>
      </div>
    `,
      className: 'aircraft-marker-ground',
      iconSize: [size + 4, size + 4],
      iconAnchor: [size / 2 + 2, size / 2 + 2],
    });
  }
  
  return L.divIcon({
    html: createAircraftSVG(shape, color, size),
    className: 'aircraft-marker-airborne',
    iconSize: [size + 4, size + 4],
    iconAnchor: [size / 2 + 2, size / 2 + 2],
  });
};

// Component to manage tile layers
const TileLayerManager = ({ mapType }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new tile layer based on mapType
    let tileUrl, attribution;
    
    switch (mapType) {
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = '&copy; <a href="https://www.esri.com/">Esri</a>';
        break;
      case 'terrain':
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        attribution = '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
        break;
      case 'dark':
        tileUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
        attribution = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';
        break;
      case 'street':
      default:
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        break;
    }

    const newTileLayer = L.tileLayer(tileUrl, { attribution });
    newTileLayer.addTo(map);
    
  }, [map, mapType]);
  
  return null;
};

// Component to update map view when airport changes
const MapUpdater = ({ selectedAirport, airports, onMapReady, autoCenter }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedAirport && airports[selectedAirport] && autoCenter) {
      const airport = airports[selectedAirport];
      // Zoom closer to the airport for better detail
      map.setView([airport.lat, airport.lon], 10);
    }
  }, [selectedAirport, airports, map, autoCenter]);

  useEffect(() => {
    if (onMapReady && map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

const InteractiveMap = ({ selectedAirport, aircraftData = [], radius = 200, onRadiusChange }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [tileLayer, setTileLayer] = useState(null);
  const [mapType, setMapType] = useState('street');
  const [showLabels, setShowLabels] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [showAircraftInfo, setShowAircraftInfo] = useState(false);
  const [airports] = useState({
    "KJFK": { 
      name: "John F. Kennedy International Airport", 
      city: "New York", 
      lat: 40.6413, 
      lon: -73.7781,
      runways: [
        { name: "04L/22R", lat: 40.6399, lon: -73.7789 },
        { name: "04R/22L", lat: 40.6426, lon: -73.7773 },
        { name: "08L/26R", lat: 40.6388, lon: -73.7765 },
        { name: "08R/26L", lat: 40.6438, lon: -73.7797 }
      ],
      gates: [
        { name: "Terminal 1", lat: 40.6441, lon: -73.7822 },
        { name: "Terminal 4", lat: 40.6398, lon: -73.7789 },
        { name: "Terminal 5", lat: 40.6394, lon: -73.7764 },
        { name: "Terminal 7", lat: 40.6459, lon: -73.7813 },
        { name: "Terminal 8", lat: 40.6472, lon: -73.7838 }
      ]
    },
    "KLAX": { 
      name: "Los Angeles International Airport", 
      city: "Los Angeles", 
      lat: 33.9425, 
      lon: -118.4081,
      runways: [
        { name: "06L/24R", lat: 33.9378, lon: -118.4081 },
        { name: "06R/24L", lat: 33.9472, lon: -118.4081 },
        { name: "07L/25R", lat: 33.9425, lon: -118.4156 },
        { name: "07R/25L", lat: 33.9425, lon: -118.4006 }
      ],
      gates: [
        { name: "Terminal 1", lat: 33.9434, lon: -118.4089 },
        { name: "Terminal 2", lat: 33.9447, lon: -118.4073 },
        { name: "Terminal 3", lat: 33.9461, lon: -118.4057 },
        { name: "TBIT", lat: 33.9416, lon: -118.4105 }
      ]
    },
    "KORD": { name: "Chicago O'Hare International Airport", city: "Chicago", lat: 41.9742, lon: -87.9073 },
    "KDFW": { name: "Dallas/Fort Worth International Airport", city: "Dallas", lat: 32.8998, lon: -97.0403 },
    "KDEN": { name: "Denver International Airport", city: "Denver", lat: 39.8561, lon: -104.6737 },
    "KATL": { name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", lat: 33.6407, lon: -84.4277 },
    "KSEA": { name: "Seattle-Tacoma International Airport", city: "Seattle", lat: 47.4502, lon: -122.3088 },
    "KMIA": { name: "Miami International Airport", city: "Miami", lat: 25.7959, lon: -80.2870 },
    "KPHX": { name: "Phoenix Sky Harbor International Airport", city: "Phoenix", lat: 33.4484, lon: -112.0740 },
    "KCLT": { name: "Charlotte Douglas International Airport", city: "Charlotte", lat: 35.2144, lon: -80.9473 },
    "EGLL": { name: "Heathrow Airport", city: "London", lat: 51.4700, lon: -0.4543 },
    "LFPG": { name: "Charles de Gaulle Airport", city: "Paris", lat: 49.0097, lon: 2.5479 },
    "EDDF": { name: "Frankfurt Airport", city: "Frankfurt", lat: 50.0379, lon: 8.5622 },
    "EHAM": { name: "Amsterdam Schiphol Airport", city: "Amsterdam", lat: 52.3105, lon: 4.7683 },
    "LIRF": { name: "Leonardo da Vinci International Airport", city: "Rome", lat: 41.8003, lon: 12.2389 },
    "LEMD": { name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", lat: 40.4839, lon: -3.5680 },
    "RJTT": { name: "Tokyo Haneda Airport", city: "Tokyo", lat: 35.5494, lon: 139.7798 },
    "RJAA": { name: "Narita International Airport", city: "Tokyo", lat: 35.7720, lon: 140.3928 },
    "ZBAA": { name: "Beijing Capital International Airport", city: "Beijing", lat: 40.0799, lon: 116.6031 },
    "ZSPD": { name: "Shanghai Pudong International Airport", city: "Shanghai", lat: 31.1443, lon: 121.8083 },
    "VHHH": { name: "Hong Kong International Airport", city: "Hong Kong", lat: 22.3080, lon: 113.9185 },
    "WSSS": { name: "Singapore Changi Airport", city: "Singapore", lat: 1.3644, lon: 103.9915 },
    "YSSY": { name: "Sydney Kingsford Smith Airport", city: "Sydney", lat: -33.9399, lon: 151.1753 },
    "YMML": { name: "Melbourne Airport", city: "Melbourne", lat: -37.6690, lon: 144.8410 },
    "CYYZ": { name: "Toronto Pearson International Airport", city: "Toronto", lat: 43.6777, lon: -79.6248 },
    "CYVR": { name: "Vancouver International Airport", city: "Vancouver", lat: 49.1939, lon: -123.1844 }
  });

  // Function to center map on specific location
  const centerOnLocation = (lat, lon, zoom = 15) => {
    if (mapInstance) {
      mapInstance.setView([lat, lon], zoom);
    }
  };

  // Handle aircraft selection - memoized for performance
  const handleAircraftClick = useCallback((aircraft) => {
    setSelectedAircraft(aircraft);
    setShowAircraftInfo(true);
  }, []);

  // Handle showing aircraft info window - memoized for performance
  const handleShowAircraftInfo = useCallback(() => {
    if (selectedAircraft) {
      setShowAircraftInfo(true);
    }
  }, [selectedAircraft]);

  // Handle closing aircraft info window - memoized for performance
  const handleCloseAircraftInfo = useCallback(() => {
    setShowAircraftInfo(false);
  }, []);

  const defaultCenter = selectedAirport && airports[selectedAirport] 
    ? [airports[selectedAirport].lat, airports[selectedAirport].lon]
    : [40.6413, -73.7781]; // Default to JFK

  // Memoize aircraft markers for performance optimization
  const aircraftMarkers = useMemo(() => {
    return aircraftData.map((aircraft, index) => {
      const key = `${aircraft.icao24}-${index}`;
      const icon = createAircraftIcon(aircraft.on_ground, aircraft.heading, aircraft.callsign, aircraft.altitude);
      
      return (
        <Marker
          key={key}
          position={[aircraft.latitude, aircraft.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => handleAircraftClick(aircraft)
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-lg text-blue-700 mb-1">{aircraft.callsign}</div>
              <div className="text-gray-600 font-mono text-sm mb-2">{aircraft.registration || aircraft.icao24}</div>
              <div className="space-y-1">
                <div>{Math.round(aircraft.altitude).toLocaleString()} ft • {Math.round(aircraft.velocity)} kt</div>
                <div>Heading: {Math.round(aircraft.heading)}° • Squawk: {aircraft.squawk}</div>
                <div className={`font-semibold ${aircraft.on_ground ? 'text-red-600' : 'text-green-600'}`}>
                  {aircraft.on_ground ? '🛬 ON GROUND' : '✈️ AIRBORNE'}
                </div>
              </div>
              <button
                onClick={() => handleAircraftClick(aircraft)}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [aircraftData, handleAircraftClick]);


  return (
    <div className="w-full h-full flex flex-col">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          className="w-full h-full rounded-t-lg"
          style={{ height: '100%', minHeight: '400px' }}
        >
          <TileLayerManager mapType={mapType} />
          
          {/* Airport marker */}
          {selectedAirport && airports[selectedAirport] && (
            <Marker position={[airports[selectedAirport].lat, airports[selectedAirport].lon]}>
              <Popup>
                <div className="text-center">
                  <strong>{airports[selectedAirport].name}</strong><br/>
                  <span className="text-sm text-gray-600">{airports[selectedAirport].city}</span><br/>
                  <span className="text-xs text-blue-600">{selectedAirport}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Aircraft markers - optimized */}
          {aircraftMarkers}

          <MapUpdater 
            selectedAirport={selectedAirport} 
            airports={airports} 
            onMapReady={setMapInstance}
            autoCenter={autoCenter}
          />
        </MapContainer>


      </div>

      {/* Aircraft Info Window */}
      <AircraftInfoWindow
        aircraftData={aircraftData}
        selectedAircraft={selectedAircraft}
        isOpen={showAircraftInfo}
        onClose={handleCloseAircraftInfo}
      />

      {/* Map Control Bar */}
      <MapControlBar 
        map={mapInstance}
        radius={radius}
        onRadiusChange={onRadiusChange}
        selectedAirport={selectedAirport}
        aircraftData={aircraftData}
        mapType={mapType}
        onMapTypeChange={setMapType}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showTrails={showTrails}
        onShowTrailsChange={setShowTrails}
        autoCenter={autoCenter}
        onAutoCenterChange={setAutoCenter}
        selectedAircraft={selectedAircraft}
        onShowAircraftInfo={handleShowAircraftInfo}
      />
    </div>
  );
};

export default InteractiveMap;
