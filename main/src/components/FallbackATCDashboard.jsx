import React from 'react';

const FallbackATCDashboard = ({ aircraft, conflicts, onAircraftSelect, sector }) => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">ATC System Dashboard</h2>
        <p className="text-lg text-gray-600 mb-8">
          Real-time aircraft tracking and AI conflict detection
        </p>

        {/* Aircraft List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
            Aircraft in Sector ({aircraft.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
            {aircraft.map((aircraftData, index) => (
              <div
                key={aircraftData.icao24 || index}
                onClick={() => onAircraftSelect && onAircraftSelect(aircraftData)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">
                      {aircraftData.callsign || aircraftData.icao24}
                    </div>
                    <div className="text-sm text-gray-600">
                      {aircraftData.origin_country} • {Math.round(aircraftData.altitude / 100)}FL
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(aircraftData.velocity * 1.944)} kts
                    </div>
                    <div className="text-xs text-gray-600">
                      {Math.round(aircraftData.heading)}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {aircraft.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No aircraft in sector
              </div>
            )}
          </div>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
              Active Conflicts ({conflicts.length})
            </h3>
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="font-medium text-red-800 mb-2">
                    {conflict.aircraft1.callsign} ↔ {conflict.aircraft2.callsign}
                  </div>
                  <div className="text-sm text-red-600">
                    Time to conflict: {conflict.time_to_conflict}s • 
                    Distance: {conflict.separation_distance.toFixed(1)}nm
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
          <h4 className="font-bold text-green-800 mb-3">System Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700">Aircraft Tracking: Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700">Conflict Detection: Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700">AI Agents: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700">Backend API: Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallbackATCDashboard;
