import { useState } from 'react';
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

  const viewModes = [
    { id: '3d', name: '3D Globe', description: 'Interactive 3D globe with flight routes' },
    { id: 'cesium', name: 'Cesium 3D', description: 'Realistic 3D aircraft models and terrain' },
    { id: 'map', name: '2D Map', description: 'Zoomable map with aircraft markers' },
    { id: 'list', name: 'List View', description: 'Detailed aircraft information table' }
  ];

  return (
    <div className={`bg-gray-900/50 border-r border-gray-800 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } flex flex-col`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-white text-lg font-semibold">ATC Control</h2>
            <p className="text-gray-400 text-sm">Aircraft Tracking System</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 7l5 5-5 5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Airport Selection */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white text-sm font-medium mb-3">Select Airport</h3>
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
                      ? 'bg-white/5 text-white border-white/20'
                      : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{mode.name}</div>
                    <div className="text-xs opacity-75 mt-1">{mode.description}</div>
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
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Aircraft Tracked</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                      }`}></div>
                      <span className="text-white font-medium">
                        {loading ? 'Loading...' : aircraftData.length}
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
                      <div className="text-xs text-gray-500">Auto-refresh every 30s</div>
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

                {/* Manual Refresh */}
                <button
                  onClick={onRefresh}
                  disabled={!selectedAirport || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white text-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Now</span>
                </button>
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
              <h3 className="text-white text-sm font-medium mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-gray-400">Airborne</div>
                  <div className="text-green-400 font-medium">
                    {aircraftData.filter(a => !a.on_ground).length}
                  </div>
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-gray-400">On Ground</div>
                  <div className="text-red-400 font-medium">
                    {aircraftData.filter(a => a.on_ground).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
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
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <div className="text-white text-xs font-medium">
                  {loading ? '...' : aircraftData.length}
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

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-700">
        {!isCollapsed ? (
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
