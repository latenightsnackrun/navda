import { useEffect, useRef, useState } from 'react';

const AircraftInfoWindow = ({ aircraftData, isOpen, onClose, selectedAircraft }) => {
  const windowRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [watchlist, setWatchlist] = useState([]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Watchlist management
  const addToWatchlist = (aircraft) => {
    if (!watchlist.find(w => w.icao24 === aircraft.icao24)) {
      setWatchlist(prev => [...prev, { ...aircraft, addedAt: new Date() }]);
    }
  };

  const removeFromWatchlist = (icao24) => {
    setWatchlist(prev => prev.filter(w => w.icao24 !== icao24));
  };

  const isInWatchlist = (icao24) => {
    return watchlist.some(w => w.icao24 === icao24);
  };

  // Get aircraft type for classification
  const getAircraftType = (callsign, altitude) => {
    if (!callsign) return 'unknown';
    const callsignUpper = callsign.toUpperCase();
    if (callsignUpper.includes('CARGO') || callsignUpper.includes('FDX') || callsignUpper.includes('UPS')) return 'cargo';
    if (altitude < 25000 && (callsignUpper.length <= 5 || callsignUpper.match(/^N\d/))) return 'private';
    if (callsignUpper.includes('AIR FORCE') || callsignUpper.includes('ARMY') || callsignUpper.includes('NAVY') || callsignUpper.match(/^(RCH|CNV|EVAC|REACH)/)) return 'military';
    if (callsignUpper.match(/^(AAL|UAL|DAL|BAW|AFR|DLH|KLM|SWA|JBU)/) && altitude > 30000) return 'heavy';
    if (altitude < 30000) return 'regional';
    return 'commercial';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />
      
      {/* Slide-up Panel */}
      <div 
        ref={windowRef}
        className={`fixed bottom-0 left-0 right-0 z-[2001] bg-gradient-to-t from-gray-900/98 to-gray-800/98 backdrop-blur-md text-white border-t border-gray-600/50 shadow-2xl transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '70vh', maxHeight: '600px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Aircraft Information</h2>
              <p className="text-blue-300 text-sm">
                {aircraftData?.length || 0} aircraft tracked
                {selectedAircraft && ` • ${selectedAircraft.callsign} selected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-600/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📊 Aircraft Types
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'selected'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
            disabled={!selectedAircraft}
          >
            ✈️ Selected Aircraft
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            📋 All Aircraft
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'watchlist'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            ⭐ Watchlist
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Aircraft Types Tab */}
          {activeTab === 'overview' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aircraft Type Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">Aircraft Type Breakdown</h3>
                  {(() => {
                    const types = {};
                    const typeColors = {
                      commercial: 'bg-blue-600',
                      heavy: 'bg-purple-600',
                      cargo: 'bg-orange-600',
                      military: 'bg-red-600',
                      private: 'bg-green-600',
                      regional: 'bg-yellow-600',
                      unknown: 'bg-gray-600'
                    };
                    
                    aircraftData?.forEach(aircraft => {
                      const type = getAircraftType(aircraft.callsign, aircraft.altitude);
                      types[type] = (types[type] || 0) + 1;
                    });
                    
                    return Object.entries(types).map(([type, count]) => (
                      <div key={type} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${typeColors[type] || 'bg-gray-600'}`}></div>
                            <span className="text-white font-medium capitalize">{type}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">{count}</div>
                            <div className="text-xs text-gray-400">
                              {((count / aircraftData.length) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Status Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-300 mb-4">Flight Status</h3>
                  
                  {/* Airborne vs Ground */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                    <h4 className="text-white font-medium mb-3">Aircraft Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-gray-300">Airborne</span>
                        </div>
                        <span className="text-green-400 font-bold">
                          {aircraftData?.filter(a => !a.on_ground).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-gray-300">On Ground</span>
                        </div>
                        <span className="text-red-400 font-bold">
                          {aircraftData?.filter(a => a.on_ground).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency/Alert Status */}
                  {aircraftData?.some(a => a.emergency || a.alert) && (
                    <div className="bg-red-900/50 p-4 rounded-lg border border-red-600/50">
                      <h4 className="text-red-300 font-medium mb-3">⚠️ Alerts</h4>
                      <div className="space-y-1">
                        {aircraftData.filter(a => a.emergency).length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-200">🚨 Emergency</span>
                            <span className="text-red-400 font-bold">
                              {aircraftData.filter(a => a.emergency).length}
                            </span>
                          </div>
                        )}
                        {aircraftData.filter(a => a.alert && !a.emergency).length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-yellow-200">⚠️ Alert</span>
                            <span className="text-yellow-400 font-bold">
                              {aircraftData.filter(a => a.alert && !a.emergency).length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Altitude Distribution */}
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                    <h4 className="text-blue-300 font-medium mb-3">Altitude Distribution</h4>
                    {(() => {
                      const altitudeBands = {
                        'Ground': aircraftData?.filter(a => a.on_ground).length || 0,
                        '0-10k ft': aircraftData?.filter(a => !a.on_ground && a.altitude < 10000).length || 0,
                        '10k-30k ft': aircraftData?.filter(a => !a.on_ground && a.altitude >= 10000 && a.altitude < 30000).length || 0,
                        '30k+ ft': aircraftData?.filter(a => !a.on_ground && a.altitude >= 30000).length || 0
                      };
                      
                      return Object.entries(altitudeBands).map(([band, count]) => (
                        <div key={band} className="flex justify-between text-sm">
                          <span className="text-gray-300">{band}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Aircraft Tab */}
          {activeTab === 'selected' && selectedAircraft && (
            <div className="p-4 space-y-4">
              {/* Aircraft Header */}
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-lg border border-blue-600/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedAircraft.callsign}</h3>
                    <p className="text-blue-300 font-mono">{selectedAircraft.registration || selectedAircraft.icao24}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedAircraft.on_ground 
                        ? 'bg-red-600/20 text-red-300 border border-red-600/50' 
                        : 'bg-green-600/20 text-green-300 border border-green-600/50'
                    }`}>
                      {selectedAircraft.on_ground ? '🛬 ON GROUND' : '✈️ AIRBORNE'}
                    </div>
                    <button
                      onClick={() => isInWatchlist(selectedAircraft.icao24) 
                        ? removeFromWatchlist(selectedAircraft.icao24)
                        : addToWatchlist(selectedAircraft)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        isInWatchlist(selectedAircraft.icao24)
                          ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 hover:bg-yellow-600/30'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                      }`}
                      title={isInWatchlist(selectedAircraft.icao24) ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isInWatchlist(selectedAircraft.icao24) ? '⭐' : '☆'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Emergency/Alert Status */}
              {(selectedAircraft.emergency || selectedAircraft.alert) && (
                <div className="space-y-2">
                  {selectedAircraft.emergency && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2 animate-pulse">
                      <span className="text-lg">🚨</span>
                      <span className="font-bold">EMERGENCY STATUS</span>
                    </div>
                  )}
                  {selectedAircraft.alert && !selectedAircraft.emergency && (
                    <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-bold">ALERT STATUS</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flight Data */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                  <h4 className="text-blue-300 font-semibold mb-3">Flight Data</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Altitude:</span>
                      <span className="text-white font-bold">{Math.round(selectedAircraft.altitude).toLocaleString()} ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ground Speed:</span>
                      <span className="text-white font-bold">{Math.round(selectedAircraft.velocity)} kt</span>
                    </div>
                    {selectedAircraft.true_airspeed && selectedAircraft.true_airspeed !== selectedAircraft.velocity && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">True Airspeed:</span>
                        <span className="text-white font-bold">{Math.round(selectedAircraft.true_airspeed)} kt</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Heading:</span>
                      <span className="text-white font-bold">{Math.round(selectedAircraft.heading)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vertical Rate:</span>
                      <span className={`font-bold ${selectedAircraft.vertical_rate > 0 ? 'text-green-400' : selectedAircraft.vertical_rate < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedAircraft.vertical_rate > 0 ? '↗' : selectedAircraft.vertical_rate < 0 ? '↘' : '↔'} {Math.abs(Math.round(selectedAircraft.vertical_rate || 0))} ft/min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Data */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                  <h4 className="text-purple-300 font-semibold mb-3">Technical Data</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Squawk:</span>
                      <span className="text-cyan-300 font-mono font-bold">{selectedAircraft.squawk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ICAO24:</span>
                      <span className="text-gray-300 font-mono">{selectedAircraft.icao24}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white font-bold">{selectedAircraft.origin_country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white font-bold capitalize">{getAircraftType(selectedAircraft.callsign, selectedAircraft.altitude)}</span>
                    </div>
                    {selectedAircraft.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white font-bold">{selectedAircraft.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Position Data */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30 md:col-span-2">
                  <h4 className="text-green-300 font-semibold mb-3">Position</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latitude:</span>
                      <span className="text-white font-mono">{selectedAircraft.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Longitude:</span>
                      <span className="text-white font-mono">{selectedAircraft.longitude.toFixed(6)}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Aircraft List Tab */}
          {activeTab === 'list' && (
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">All Aircraft ({aircraftData?.length || 0})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
                {aircraftData?.map((aircraft, index) => (
                  <div
                    key={`${aircraft.icao24}-${index}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      aircraft.emergency
                        ? 'bg-red-900/40 border-red-500 hover:bg-red-900/60'
                        : aircraft.alert
                        ? 'bg-yellow-900/40 border-yellow-500 hover:bg-yellow-900/60'
                        : aircraft.on_ground
                        ? 'bg-red-900/20 border-red-700 hover:bg-red-900/30'
                        : 'bg-green-900/20 border-green-700 hover:bg-green-900/30'
                    }`}
                    onClick={() => setActiveTab('selected')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{aircraft.callsign}</div>
                        <div className="text-blue-300 font-mono text-sm">{aircraft.registration || aircraft.icao24}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-white">{Math.round(aircraft.altitude).toLocaleString()} ft</div>
                        <div className="text-gray-400">{Math.round(aircraft.velocity)} kt</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded ${aircraft.on_ground ? 'bg-red-600/20 text-red-300' : 'bg-green-600/20 text-green-300'}`}>
                          {aircraft.on_ground ? '🛬 GROUND' : '✈️ AIR'}
                        </span>
                        <span className="text-gray-400">{aircraft.squawk}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isInWatchlist(aircraft.icao24) 
                            ? removeFromWatchlist(aircraft.icao24)
                            : addToWatchlist(aircraft);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isInWatchlist(aircraft.icao24)
                            ? 'text-yellow-400 hover:text-red-400'
                            : 'text-gray-500 hover:text-yellow-400'
                        }`}
                        title={isInWatchlist(aircraft.icao24) ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        {isInWatchlist(aircraft.icao24) ? '⭐' : '☆'}
                      </button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-400 py-8">
                    No aircraft data available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span>⭐ Aircraft Watchlist</span>
                <span className="text-sm bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">
                  {watchlist.length}
                </span>
              </h3>
              
              {watchlist.length > 0 ? (
                <div className="space-y-3">
                  {watchlist.map((aircraft, index) => {
                    // Find current aircraft data if still in range
                    const currentData = aircraftData?.find(a => a.icao24 === aircraft.icao24);
                    const isStillTracked = !!currentData;
                    const displayData = currentData || aircraft;
                    
                    return (
                      <div
                        key={`watchlist-${aircraft.icao24}-${index}`}
                        className={`p-4 rounded-lg border transition-colors ${
                          !isStillTracked
                            ? 'bg-gray-800/30 border-gray-600/30 opacity-60'
                            : displayData.emergency
                            ? 'bg-red-900/40 border-red-500 hover:bg-red-900/60'
                            : displayData.alert
                            ? 'bg-yellow-900/40 border-yellow-500 hover:bg-yellow-900/60'
                            : displayData.on_ground
                            ? 'bg-red-900/20 border-red-700 hover:bg-red-900/30'
                            : 'bg-green-900/20 border-green-700 hover:bg-green-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white">{displayData.callsign}</span>
                              {!isStillTracked && (
                                <span className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded">
                                  OUT OF RANGE
                                </span>
                              )}
                              {displayData.emergency && (
                                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded animate-pulse">
                                  🚨 EMERGENCY
                                </span>
                              )}
                              {displayData.alert && !displayData.emergency && (
                                <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                                  ⚠️ ALERT
                                </span>
                              )}
                            </div>
                            <div className="text-blue-300 font-mono text-sm">{displayData.registration || displayData.icao24}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isStillTracked && (
                              <button
                                onClick={() => {
                                  setActiveTab('selected');
                                  // Note: You might want to pass a callback to select the aircraft
                                }}
                                className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-600/50 rounded text-xs hover:bg-blue-600/30 transition-colors"
                              >
                                View Details
                              </button>
                            )}
                            <button
                              onClick={() => removeFromWatchlist(aircraft.icao24)}
                              className="p-1 text-yellow-400 hover:text-red-400 transition-colors"
                              title="Remove from watchlist"
                            >
                              ⭐
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Alt:</span>
                            <div className="text-white font-medium">{Math.round(displayData.altitude).toLocaleString()} ft</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Speed:</span>
                            <div className="text-white font-medium">{Math.round(displayData.velocity)} kt</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <div className={`font-medium ${displayData.on_ground ? 'text-red-400' : 'text-green-400'}`}>
                              {displayData.on_ground ? 'Ground' : 'Airborne'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <div className="text-white font-medium capitalize">{getAircraftType(displayData.callsign, displayData.altitude)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400">
                          Added to watchlist: {aircraft.addedAt.toLocaleString()}
                          {isStillTracked && (
                            <span className="ml-2 text-green-400">• Currently tracked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Aircraft in Watchlist</h3>
                  <p className="text-gray-400 mb-4">Select an aircraft and click the star button to add it to your watchlist</p>
                  <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg">
                    <div className="font-medium text-gray-400 mb-1">💡 Watchlist Features:</div>
                    <div>• Track favorite aircraft even when out of range</div>
                    <div>• Get notified when watched aircraft have emergency status</div>
                    <div>• Quick access to aircraft details</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Selected Aircraft Message */}
          {activeTab === 'selected' && !selectedAircraft && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Aircraft Selected</h3>
              <p className="text-gray-400">Click on an aircraft marker in the map to view detailed information</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-600/50 bg-gray-900/50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>Last updated: {new Date().toLocaleTimeString()} • {aircraftData?.length || 0} aircraft tracked</div>
            <div>Swipe down or press ESC to close</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AircraftInfoWindow;
