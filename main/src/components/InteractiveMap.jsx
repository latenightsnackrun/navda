import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapControlBar from './MapControlBar';

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom aircraft icon
const createAircraftIcon = (isOnGround, heading = 0) => {
  const color = isOnGround ? '#ff4444' : '#44ff44';
  const size = isOnGround ? 8 : 12;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background-color: ${color}; 
        border-radius: 50%; 
        border: 2px solid white;
        transform: rotate(${heading}deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 0; 
          height: 0; 
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 6px solid white;
          transform: rotate(-90deg);
        "></div>
      </div>
    `,
    className: 'aircraft-marker',
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
      map.setView([airport.lat, airport.lon], 8);
    }
  }, [selectedAirport, airports, map, autoCenter]);

  useEffect(() => {
    if (onMapReady && map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

const InteractiveMap = ({ selectedAirport, aircraftData = [], radius = 200, onRadiusChange, onRefresh, loading }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [tileLayer, setTileLayer] = useState(null);
  const [mapType, setMapType] = useState('street');
  const [showLabels, setShowLabels] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [autoCenter, setAutoCenter] = useState(true);
  const [airports] = useState({
    "KJFK": { name: "John F. Kennedy International Airport", city: "New York", lat: 40.6413, lon: -73.7781 },
    "KLAX": { name: "Los Angeles International Airport", city: "Los Angeles", lat: 33.9425, lon: -118.4081 },
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

  const defaultCenter = selectedAirport && airports[selectedAirport] 
    ? [airports[selectedAirport].lat, airports[selectedAirport].lon]
    : [40.6413, -73.7781]; // Default to JFK

  return (
    <div className="w-full h-full flex flex-col">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={8}
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

          {/* Aircraft markers */}
          {aircraftData.map((aircraft, index) => (
            <Marker
              key={`${aircraft.icao24}-${index}`}
              position={[aircraft.latitude, aircraft.longitude]}
              icon={createAircraftIcon(aircraft.on_ground, aircraft.heading)}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{aircraft.callsign}</strong><br/>
                  <span className="text-gray-600">ICAO: {aircraft.icao24}</span><br/>
                  <span className="text-gray-600">Alt: {Math.round(aircraft.altitude).toLocaleString()}ft</span><br/>
                  <span className="text-gray-600">Speed: {Math.round(aircraft.velocity)}kt</span><br/>
                  <span className="text-gray-600">Heading: {Math.round(aircraft.heading)}°</span><br/>
                  <span className={`font-semibold ${aircraft.on_ground ? 'text-red-600' : 'text-green-600'}`}>
                    {aircraft.on_ground ? 'ON GROUND' : 'AIRBORNE'}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapUpdater 
            selectedAirport={selectedAirport} 
            airports={airports} 
            onMapReady={setMapInstance}
            autoCenter={autoCenter}
          />
        </MapContainer>

        {/* Info overlay */}
        <div className="absolute top-2 left-2 bg-black/75 text-white px-3 py-2 rounded-lg text-sm">
          <div>{aircraftData.length} aircraft • {selectedAirport || 'No airport'} • {radius}nm</div>
          <div className="text-xs text-gray-300 mt-1">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-2 right-2 bg-black/75 text-white px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Airborne</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ground</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Control Bar */}
      <MapControlBar 
        map={mapInstance}
        radius={radius}
        onRadiusChange={onRadiusChange}
        selectedAirport={selectedAirport}
        aircraftData={aircraftData}
        onRefresh={onRefresh}
        loading={loading}
        mapType={mapType}
        onMapTypeChange={setMapType}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showTrails={showTrails}
        onShowTrailsChange={setShowTrails}
        autoCenter={autoCenter}
        onAutoCenterChange={setAutoCenter}
      />
    </div>
  );
};

export default InteractiveMap;
