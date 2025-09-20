import React, { useState, useEffect } from 'react';

const ATCDashboardSimple = () => {
  const [aircraft, setAircraft] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test data fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      // Test aircraft data
      const aircraftResponse = await fetch('http://localhost:5001/api/atc/aircraft?min_lat=40&max_lat=50&min_lon=-10&max_lon=10');
      const aircraftData = await aircraftResponse.json();
      
      if (aircraftData.success) {
        setAircraft(aircraftData.data);
      } else {
        setError(aircraftData.error || 'Failed to fetch aircraft data');
      }

      // Test conflict data
      const conflictResponse = await fetch('http://localhost:5001/api/atc/conflicts?min_lat=40&max_lat=50&min_lon=-10&max_lon=10');
      const conflictData = await conflictResponse.json();
      
      if (conflictData.success) {
        setConflicts(conflictData.data);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ATC Dashboard (Simple Test)</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Aircraft Tracked</h3>
            <p className="text-3xl font-bold text-blue-600">{aircraft.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Conflicts Detected</h3>
            <p className="text-3xl font-bold text-red-600">{conflicts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <p className={`text-3xl font-bold ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'Error' : 'Online'}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
            Loading aircraft data...
          </div>
        )}

        {/* Aircraft List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Aircraft in Sector</h2>
          </div>
          <div className="p-6">
            {aircraft.length === 0 ? (
              <p className="text-gray-500">No aircraft data available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aircraft.map((aircraft, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{aircraft.callsign}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>ICAO24:</strong> {aircraft.icao24}</p>
                      <p><strong>Altitude:</strong> {Math.round(aircraft.altitude / 100)}FL</p>
                      <p><strong>Speed:</strong> {Math.round(aircraft.velocity * 1.944)} kts</p>
                      <p><strong>Heading:</strong> {Math.round(aircraft.heading)}°</p>
                      <p><strong>Country:</strong> {aircraft.origin_country}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conflicts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detected Conflicts</h2>
          </div>
          <div className="p-6">
            {conflicts.length === 0 ? (
              <p className="text-gray-500">No conflicts detected</p>
            ) : (
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg text-red-800">
                      {conflict.aircraft1.callsign} ↔ {conflict.aircraft2.callsign}
                    </h3>
                    <div className="text-sm text-red-700 space-y-1">
                      <p><strong>Separation:</strong> {conflict.separation_distance.toFixed(2)} NM</p>
                      <p><strong>Time to Conflict:</strong> {conflict.time_to_conflict.toFixed(0)}s</p>
                      <p><strong>Type:</strong> {conflict.conflict_type}</p>
                      <p><strong>Severity:</strong> {conflict.severity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ATCDashboardSimple;
