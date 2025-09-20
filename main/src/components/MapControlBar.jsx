import { useState, useEffect } from 'react';
import L from 'leaflet';

const MapControlBar = ({ 
  map,
  radius, 
  onRadiusChange, 
  selectedAirport, 
  aircraftData,
  mapType,
  onMapTypeChange,
  showLabels,
  onToggleLabels,
  showTrails,
  onToggleTrails,
  autoCenter,
  onToggleAutoCenter,
  selectedAircraft,
  onShowAircraftInfo,
  lastUpdate,
  loading,
  viewMode,
  liveUpdate,
  onToggleLiveUpdate,
  // 3D-specific controls
  onFlyToAirport,
  onResetView,
  onZoomIn,
  onZoomOut
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNavigationPopup, setShowNavigationPopup] = useState(false);

  // Handle ESC key for popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showNavigationPopup) {
        setShowNavigationPopup(false);
      }
    };

    if (showNavigationPopup) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showNavigationPopup]);

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

  // Airport data for navigation
  const airports = {
    "KJFK": { 
      name: "John F. Kennedy International Airport", 
      city: "New York", 
      lat: 40.6413, 
      lon: -73.7781,
      terminals: [
        { name: "Terminal 1", lat: 40.6433, lon: -73.7810 },
        { name: "Terminal 2", lat: 40.6419, lon: -73.7789 },
        { name: "Terminal 4", lat: 40.6441, lon: -73.7760 },
        { name: "Terminal 5", lat: 40.6394, lon: -73.7762 },
        { name: "Terminal 7", lat: 40.6466, lon: -73.7812 },
        { name: "Terminal 8", lat: 40.6477, lon: -73.7851 }
      ],
      runways: [
        { name: "Runway 04L/22R", lat: 40.6320, lon: -73.7780 },
        { name: "Runway 04R/22L", lat: 40.6390, lon: -73.7740 },
        { name: "Runway 08L/26R", lat: 40.6490, lon: -73.7890 },
        { name: "Runway 08R/26L", lat: 40.6530, lon: -73.7940 }
      ]
    },
    "KLAX": { 
      name: "Los Angeles International Airport", 
      city: "Los Angeles", 
      lat: 33.9425, 
      lon: -118.4081,
      terminals: [
        { name: "Terminal 1", lat: 33.9435, lon: -118.4090 },
        { name: "Terminal 2", lat: 33.9440, lon: -118.4095 },
        { name: "Terminal 3", lat: 33.9445, lon: -118.4100 },
        { name: "Terminal 4", lat: 33.9450, lon: -118.4105 },
        { name: "Terminal 5", lat: 33.9455, lon: -118.4110 },
        { name: "Terminal 6", lat: 33.9460, lon: -118.4115 },
        { name: "Terminal 7", lat: 33.9415, lon: -118.4085 },
        { name: "Terminal 8", lat: 33.9410, lon: -118.4080 }
      ],
      runways: [
        { name: "Runway 06L/24R", lat: 33.9360, lon: -118.4150 },
        { name: "Runway 06R/24L", lat: 33.9400, lon: -118.4100 },
        { name: "Runway 07L/25R", lat: 33.9480, lon: -118.4050 },
        { name: "Runway 07R/25L", lat: 33.9520, lon: -118.4020 }
      ]
    }
    // Add more airports as needed
  };

  const currentAirport = airports[selectedAirport];

  const handleNavigateToLocation = (lat, lon, zoom = 15) => {
    if (map) {
      map.setView([lat, lon], zoom);
      setShowNavigationPopup(false);
    }
  };

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

          {/* Center Section - Navigation and Radius Control */}
          <div className="flex items-center space-x-4">
            {/* Navigation Button */}
            {selectedAirport && currentAirport && (
              <button
                onClick={() => setShowNavigationPopup(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                title="Airport Navigation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline text-sm">Navigate</span>
              </button>
            )}

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
            {/* Aircraft Info Button */}
            <button
              onClick={onShowAircraftInfo}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 ${
                selectedAircraft 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
              title={selectedAircraft ? `Aircraft Info: ${selectedAircraft.callsign}` : 'Click an aircraft to view details'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">
                {selectedAircraft ? selectedAircraft.callsign : 'Aircraft Info'}
              </span>
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
                    onChange={(e) => onToggleLabels && onToggleLabels()}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Show Labels</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTrails}
                    onChange={(e) => onToggleTrails && onToggleTrails()}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Show Flight Trails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoCenter}
                    onChange={(e) => onToggleAutoCenter && onToggleAutoCenter()}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">Auto Center</span>
                </label>
              </div>
            </div>

            {/* 3D Camera Controls */}
            {viewMode === 'cesium' && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">3D Camera Controls</h4>
                <div className="space-y-2">
                  <button
                    onClick={onFlyToAirport}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Fly to Airport
                  </button>
                  <button
                    onClick={onResetView}
                    className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    Reset View
                  </button>
                  <div className="flex space-x-1">
                    <button
                      onClick={onZoomIn}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      Zoom In
                    </button>
                    <button
                      onClick={onZoomOut}
                      className="flex-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                    >
                      Zoom Out
                    </button>
                  </div>
                </div>
              </div>
            )}

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

      {/* Navigation Popup Overlay */}
      {showNavigationPopup && currentAirport && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[2000]"
            onClick={() => setShowNavigationPopup(false)}
          />
          
          {/* Popup Content */}
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2001] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md text-white rounded-lg border border-gray-600/50 shadow-2xl w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">🗺️ Airport Navigation</h2>
                  <p className="text-blue-300 text-sm">{currentAirport.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNavigationPopup(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Terminals Section */}
                {currentAirport.terminals && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center space-x-2">
                      <span>🏢</span>
                      <span>Terminals</span>
                    </h3>
                    <div className="space-y-2">
                      {currentAirport.terminals.map((terminal, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigateToLocation(terminal.lat, terminal.lon, 16)}
                          className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/30 transition-colors"
                        >
                          <div className="font-medium text-white">{terminal.name}</div>
                          <div className="text-xs text-gray-400">
                            {terminal.lat.toFixed(4)}°, {terminal.lon.toFixed(4)}°
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Runways Section */}
                {currentAirport.runways && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center space-x-2">
                      <span>🛬</span>
                      <span>Runways</span>
                    </h3>
                    <div className="space-y-2">
                      {currentAirport.runways.map((runway, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigateToLocation(runway.lat, runway.lon, 16)}
                          className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/30 transition-colors"
                        >
                          <div className="font-medium text-white">{runway.name}</div>
                          <div className="text-xs text-gray-400">
                            {runway.lat.toFixed(4)}°, {runway.lon.toFixed(4)}°
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-600/50">
                <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Quick Actions</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleNavigateToLocation(currentAirport.lat, currentAirport.lon, 12)}
                    className="p-3 bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 rounded-lg border border-blue-600/50 transition-colors"
                  >
                    <div className="font-medium text-blue-300">🏢 Airport Overview</div>
                    <div className="text-xs text-gray-400">Full airport view</div>
                  </button>
                  <button
                    onClick={() => handleFitAllAircraft()}
                    className="p-3 bg-gradient-to-r from-green-600/20 to-green-700/20 hover:from-green-600/30 hover:to-green-700/30 rounded-lg border border-green-600/50 transition-colors"
                  >
                    <div className="font-medium text-green-300">✈️ All Aircraft</div>
                    <div className="text-xs text-gray-400">Fit all in view</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-600/50 bg-gray-800/30">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div>Click any location to navigate • ESC to close</div>
                <div>{currentAirport.city}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapControlBar;
