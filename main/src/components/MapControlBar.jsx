import { useState } from 'react';
import L from 'leaflet';

const MapControlBar = ({ 
  map,
  radius, 
  onRadiusChange, 
  selectedAirport, 
  aircraftData,
  onRefresh,
  loading,
  mapType,
  onMapTypeChange,
  showLabels,
  onShowLabelsChange,
  showTrails,
  onShowTrailsChange,
  autoCenter,
  onAutoCenterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const radiusOptions = [
    { value: 50, label: '50nm' },
    { value: 100, label: '100nm' },
    { value: 200, label: '200nm' },
    { value: 300, label: '300nm' },
    { value: 500, label: '500nm' }
  ];

  const mapTypes = [
    { value: 'street', label: 'Street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { value: 'satellite', label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { value: 'terrain', label: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
    { value: 'dark', label: 'Dark', url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' }
  ];

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleResetView = () => {
    if (map && selectedAirport) {
      // Get airport coordinates (you might want to pass these as props)
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
      
      const airport = airports[selectedAirport];
      if (airport) {
        map.setView([airport.lat, airport.lon], 8);
      }
    }
  };

  const handleMapTypeChange = (newType) => {
    onMapTypeChange(newType);
  };

  const handleFitAllAircraft = () => {
    if (map && aircraftData.length > 0) {
      const group = new L.featureGroup();
      aircraftData.forEach(aircraft => {
        if (aircraft.latitude && aircraft.longitude) {
          const marker = L.marker([aircraft.latitude, aircraft.longitude]);
          group.addLayer(marker);
        }
      });
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  };

  const getAircraftStats = () => {
    if (!aircraftData?.length) return { airborne: 0, ground: 0, total: 0 };
    
    const airborne = aircraftData.filter(a => !a.on_ground).length;
    const ground = aircraftData.filter(a => a.on_ground).length;
    
    return { airborne, ground, total: aircraftData.length };
  };

  const stats = getAircraftStats();

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
      {/* Main Control Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left Section - Zoom Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={handleZoomOut}
                className="px-3 py-2 text-white hover:bg-gray-700 transition-colors border-r border-gray-700"
                title="Zoom Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleZoomIn}
                className="px-3 py-2 text-white hover:bg-gray-700 transition-colors"
                title="Zoom In"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleResetView}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Reset View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Center Section - Radius Control */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Radius:</span>
              <div className="flex space-x-1">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onRadiusChange(option.value)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      radius === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aircraft Stats */}
            {stats.total > 0 && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Air:</span>
                  <span className="text-green-400 font-medium">{stats.airborne}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-400">Ground:</span>
                  <span className="text-red-400 font-medium">{stats.ground}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand controls'}
            >
              {isExpanded ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Map Type Selection */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Map Type</h4>
              <div className="space-y-1">
                {mapTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleMapTypeChange(type.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      mapType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Display Options</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => onShowLabelsChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Show Labels</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTrails}
                    onChange={(e) => onShowTrailsChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Show Flight Trails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoCenter}
                    onChange={(e) => onAutoCenterChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Auto Center</span>
                </label>
              </div>
            </div>

            {/* Map Info */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Map Information</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div>Center: {selectedAirport || 'Not set'}</div>
                <div>Radius: {radius}nm</div>
                <div>Aircraft: {stats.total}</div>
                <div>Zoom: Interactive</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Quick Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={handleResetView}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Reset to Airport
                </button>
                <button
                  onClick={handleFitAllAircraft}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Fit All Aircraft
                </button>
                <button
                  onClick={onRefresh}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Map: Interactive</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Data: Live</span>
                </div>
              </div>
              <div>
                2D Map View • Click and drag to pan • Scroll to zoom
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControlBar;
