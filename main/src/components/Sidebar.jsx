import { useState, useEffect } from 'react';
import AirportSelector from './AirportSelector';

const Sidebar = ({ 
  selectedAirport, 
  onAirportChange, 
  viewMode, 
  onViewModeChange,
  aircraftData,
  loading,
  error,
  lastUpdate,
  liveUpdate,
  onToggleLiveUpdate,
  onRefresh
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Define missing variables to ensure sidebar can collapse on all tabs
  const shouldPreventCollapse = false; // Allow collapsing on all tabs
  const isActuallyCollapsed = isCollapsed;
  
  const viewModes = [
    { id: 'cesium', name: '3D View', description: 'Realistic 3D aircraft models and terrain' },
    { id: 'map', name: '2D Map', description: 'Zoomable map with aircraft markers' },
    { id: 'list', name: 'List View', description: 'Detailed aircraft information table' }
  ];

  // Calculate sidebar width - consistent across all tabs
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-80';

  return (
    <div className={`bg-gray-900/50 border-r border-gray-800 transition-all duration-300 ${sidebarWidth} flex flex-col h-full`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <div>
            <h2 className="text-white text-lg font-semibold">ATC Control</h2>
            <p className="text-gray-400 text-sm">Aircraft Tracking System</p>
          </div>
        )}
        <button
          onClick={() => !shouldPreventCollapse && setIsCollapsed(!isCollapsed)}
          disabled={shouldPreventCollapse}
          className={`p-2 rounded-lg transition-colors ${
            shouldPreventCollapse 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title={shouldPreventCollapse 
            ? 'Sidebar must stay open for 3D views' 
            : (isActuallyCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar')
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isActuallyCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 7l5 5-5 5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            )}
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <>
            {/* Airport Selection */}
          <div className="p-4 border-b border-gray-700">
            <AirportSelector 
              onAirportChange={onAirportChange}
              selectedAirport={selectedAirport}
            />
          </div>

          {/* View Mode Selection */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white text-sm font-medium mb-3">View Mode</h3>
            <div className="space-y-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onViewModeChange(mode.id)}
                  className={`w-full p-3 rounded-sm text-left transition-colors border ${
                    viewMode === mode.id
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-white border-blue-400/50'
                      : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center">
                        {(mode.id === '3d' || mode.id === 'cesium') && (
                          <span className="mr-2">🌍</span>
                        )}
                        {mode.id === 'map' && (
                          <span className="mr-2">🗺️</span>
                        )}
                        {mode.id === 'list' && (
                          <span className="mr-2">📋</span>
                        )}
                        {mode.name}
                      </div>
                      <div className="text-xs opacity-75 mt-1">{mode.description}</div>
                    </div>
                    {viewMode === mode.id && (
                      <div className="text-blue-400">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status Information */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white text-sm font-medium mb-3">Status</h3>
            
            {selectedAirport && (
              <div className="space-y-3">
                {/* Aircraft Count */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">✈️ Aircraft Tracked</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-white font-bold text-lg">
                        {aircraftData.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Update */}
                {lastUpdate && (
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Last Update</div>
                    <div className="text-white text-sm">{lastUpdate.toLocaleTimeString()}</div>
                  </div>
                )}

                {/* Live Updates Control */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-400 text-sm">Live Updates</div>
                      <div className="text-xs text-gray-500">Auto-refresh every 0.25s</div>
                    </div>
                    <button
                      onClick={onToggleLiveUpdate}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        liveUpdate ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        liveUpdate ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {aircraftData.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white text-sm font-medium mb-3">Aircraft Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-2 rounded border border-green-700/50">
                  <div className="text-green-300">✈️ Airborne</div>
                  <div className="text-green-400 font-bold text-lg">
                    {aircraftData.filter(a => !a.on_ground).length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 p-2 rounded border border-red-700/50">
                  <div className="text-red-300">🛬 On Ground</div>
                  <div className="text-red-400 font-bold text-lg">
                    {aircraftData.filter(a => a.on_ground).length}
                  </div>
                </div>
              </div>
              
              {/* Aircraft Type Breakdown */}
              <div className="space-y-1">
                <div className="text-gray-400 text-xs mb-1">Aircraft Types:</div>
                {(() => {
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
                  
                  const types = {};
                  aircraftData.forEach(aircraft => {
                    if (!aircraft.on_ground) {
                      const type = getAircraftType(aircraft.callsign, aircraft.altitude);
                      types[type] = (types[type] || 0) + 1;
                    }
                  });
                  
                  return Object.entries(types).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-400 capitalize">{type}:</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </>
        )}
        
        {/* Collapsed State */}
        {isActuallyCollapsed && (
          <div className="p-2 space-y-3">
            {/* View Mode Icons */}
            <div className="space-y-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onViewModeChange(mode.id)}
                  className={`w-full p-3 rounded-lg transition-colors flex flex-col items-center ${
                    viewMode === mode.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title={mode.name}
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mode.id === '3d' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                    {mode.id === 'cesium' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    )}
                    {mode.id === 'map' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    )}
                    {mode.id === 'list' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    )}
                  </svg>
                  <span className="text-xs font-medium">{mode.id.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Status Indicators */}
            {selectedAirport && (
              <div className="pt-2 border-t border-gray-700 space-y-2">
                {/* Aircraft Count */}
                <div className="text-center">
                  <div className="w-2 h-2 rounded-full mx-auto mb-1 bg-green-400"></div>
                  <div className="text-white text-xs font-medium">
                    {aircraftData.length}
                  </div>
                  <div className="text-gray-500 text-xs">Aircraft</div>
                </div>

                {/* Live Update Indicator */}
                <div className="text-center">
                  <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                    liveUpdate ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`}></div>
                  <div className="text-gray-500 text-xs">Live</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        {!isActuallyCollapsed ? (
          <div className="text-center">
            <div className="text-xs text-gray-400">
              Live data from adsb.lol API
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ATC System v1.0
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
