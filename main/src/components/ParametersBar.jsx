import { useState } from 'react';

const ParametersBar = ({ 
  radius, 
  onRadiusChange, 
  selectedAirport, 
  aircraftData, 
  lastUpdate,
  loading,
  viewMode,
  liveUpdate,
  onToggleLiveUpdate,
  refreshRate,
  onRefreshRateChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAircraftStats = () => {
    if (!aircraftData.length) return { airborne: 0, ground: 0, total: 0 };
    
    const airborne = aircraftData.filter(a => !a.on_ground).length;
    const ground = aircraftData.filter(a => a.on_ground).length;
    
    return { airborne, ground, total: aircraftData.length };
  };

  const stats = getAircraftStats();

  return (
    <div className="bg-black/95 backdrop-blur-sm border-t border-gray-800 transition-all duration-300">
      {/* Main Bar */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Basic Info */}
          <div className="flex items-center space-x-6">
            {/* Airport Info */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">
                {selectedAirport || 'No Airport Selected'}
              </span>
              {selectedAirport && (
                <span className="text-gray-400 text-sm">
                  {stats.total} aircraft
                </span>
              )}
            </div>

            {/* View Mode Indicator */}
            <div className="flex items-center space-x-2 px-2 py-1 bg-gray-800 rounded">
              <span className="text-gray-400 text-sm">View:</span>
              <span className="text-white text-sm capitalize">{viewMode}</span>
            </div>

            {/* Live Data Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Live Updates:</span>
              <button
                onClick={onToggleLiveUpdate}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  liveUpdate ? 'bg-green-600' : 'bg-gray-600'
                }`}
                title="Toggle live data updates"
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  liveUpdate ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Refresh Rate Slider - Only show when live updates are active */}
            {liveUpdate && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Refresh Rate:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="250"
                    max="2000"
                    step="250"
                    value={refreshRate}
                    onChange={(e) => onRefreshRateChange(parseInt(e.target.value))}
                    className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    title={`${refreshRate}ms refresh rate`}
                  />
                  <span className="text-white text-sm font-mono min-w-[3rem]">
                    {refreshRate < 1000 ? `${refreshRate}ms` : `${refreshRate / 1000}s`}
                  </span>
                </div>
              </div>
            )}

            {/* Radius Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Search Radius:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={radius}
                  onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                  className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  title={`${radius}nm search radius`}
                />
                <span className="text-white text-sm font-mono min-w-[3rem]">
                  {radius}nm
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Stats and Controls */}
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            {stats.total > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Airborne:</span>
                  <span className="text-green-400 font-medium">{stats.airborne}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-400">Ground:</span>
                  <span className="text-red-400 font-medium">{stats.ground}</span>
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-sm text-gray-400">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}


            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand parameters'}
            >
              {isExpanded ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Aircraft Statistics */}
            {stats.total > 0 && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">Aircraft Statistics</h4>
                <div className="space-y-2">
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Aircraft</span>
                      <span className="text-white font-medium">{stats.total}</span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Airborne</span>
                      <span className="text-green-400 font-medium">{stats.airborne}</span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">On Ground</span>
                      <span className="text-red-400 font-medium">{stats.ground}</span>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Coverage</span>
                      <span className="text-blue-400 font-medium">{radius}nm radius</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">System Information</h4>
              <div className="space-y-2">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 text-sm mb-1">Data Source</div>
                  <div className="text-white text-sm">adsb.lol API</div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 text-sm mb-1">Update Frequency</div>
                  <div className="text-white text-sm">
                    {liveUpdate 
                      ? `Every ${refreshRate < 1000 ? `${refreshRate}ms` : `${refreshRate / 1000}s`}`
                      : 'Manual updates only'
                    }
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 text-sm mb-1">View Mode</div>
                  <div className="text-white text-sm capitalize">{viewMode}</div>
                </div>
                {lastUpdate && (
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-gray-400 text-sm mb-1">Last Update</div>
                    <div className="text-white text-sm">{lastUpdate.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">API Status: Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-400">Real-time Updates: Active</span>
                </div>
              </div>
              <div className="text-gray-500">
                ATC System v1.0 • Live Aircraft Tracking
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametersBar;
