import React, { useState, useEffect, useCallback } from 'react';
import FallbackATCDashboard from '../components/FallbackATCDashboard';
import ConflictPanel from '../components/ConflictPanel';

const ATCDashboard = () => {
  const [aircraft, setAircraft] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [sector, setSector] = useState({
    min_lat: 40.0,
    max_lat: 50.0,
    min_lon: -10.0,
    max_lon: 10.0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch aircraft data
  const fetchAircraft = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        min_lat: sector.min_lat,
        max_lat: sector.max_lat,
        min_lon: sector.min_lon,
        max_lon: sector.max_lon
      });
      
      const response = await fetch(`http://localhost:5005/api/atc/aircraft?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAircraft(data.data);
      } else {
        setError(data.error || 'Failed to fetch aircraft data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sector]);

  // Fetch conflict data
  const fetchConflicts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        min_lat: sector.min_lat,
        max_lat: sector.max_lat,
        min_lon: sector.min_lon,
        max_lon: sector.max_lon
      });
      
      const response = await fetch(`http://localhost:5005/api/atc/conflicts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setConflicts(data.data);
      }
    } catch (err) {
      console.error('Error fetching conflicts:', err);
    }
  }, [sector]);

  // Initial data fetch
  useEffect(() => {
    fetchAircraft();
    fetchConflicts();
  }, [fetchAircraft, fetchConflicts]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAircraft();
      fetchConflicts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAircraft, fetchConflicts]);

  // Handle aircraft selection
  const handleAircraftSelect = (aircraft) => {
    setSelectedAircraft(aircraft);
  };

  // Handle resolution request
  const handleResolutionRequest = (strategy) => {
    console.log('Resolution strategy requested:', strategy);
    // In a real application, this would send the resolution to the ATC system
    alert(`Resolution strategy applied: ${strategy.description}`);
  };

  // Handle sector change
  const handleSectorChange = (newSector) => {
    setSector(newSector);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Change refresh interval
  const handleRefreshIntervalChange = (interval) => {
    setRefreshInterval(interval);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-aviation border-b border-aviation-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-aviation-600 to-aviation-800 bg-clip-text text-transparent">
                ATC Dashboard
              </h1>
              <p className="text-gray-600 font-medium">Real-time aircraft tracking and AI conflict detection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <label className="flex items-center space-x-3 bg-aviation-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-aviation-100 transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                className="w-4 h-4 text-aviation-600 bg-gray-100 border-gray-300 rounded focus:ring-aviation-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-aviation-700">Auto-refresh</span>
            </label>
            
            {/* Refresh interval */}
            <select
              value={refreshInterval}
              onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
              className="px-4 py-2 bg-white border border-aviation-200 rounded-lg text-sm font-medium text-aviation-700 focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all"
            >
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            {/* Manual refresh */}
            <button
              onClick={() => {
                fetchAircraft();
                fetchConflicts();
              }}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-aviation-600 to-aviation-700 text-white rounded-lg hover:from-aviation-700 hover:to-aviation-800 disabled:opacity-50 text-sm font-medium shadow-lg hover:shadow-glow transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Status bar */}
        <div className="mt-4 flex items-center space-x-8 text-sm">
          <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-green-800">{aircraft.length} aircraft tracked</span>
          </div>
          <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${conflicts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className={`font-medium ${conflicts.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
              {conflicts.length} conflicts detected
            </span>
          </div>
          <div className="text-gray-600 font-mono text-xs bg-gray-100 px-3 py-2 rounded">
            Sector: {sector.min_lat.toFixed(1)}°N - {sector.max_lat.toFixed(1)}°N, {sector.min_lon.toFixed(1)}°W - {sector.max_lon.toFixed(1)}°E
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          {error ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">Connection Error</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchAircraft();
                    fetchConflicts();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          ) : (
            <FallbackATCDashboard
              sector={sector}
              aircraft={aircraft}
              conflicts={conflicts}
              onAircraftSelect={handleAircraftSelect}
            />
          )}
        </div>

        {/* Conflict Panel */}
        <div className="w-96 border-l border-aviation-200 bg-white/90 backdrop-blur-sm shadow-lg">
          <ConflictPanel
            conflicts={conflicts}
            onResolutionRequest={handleResolutionRequest}
          />
        </div>
      </div>

      {/* Selected Aircraft Info */}
      {selectedAircraft && (
        <div className="bg-white/95 backdrop-blur-md border-t border-aviation-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✈</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">{selectedAircraft.callsign}</h3>
                <p className="text-sm text-gray-600">ICAO24: {selectedAircraft.icao24}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAircraft(null)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-aviation-50 p-4 rounded-lg">
              <p className="text-aviation-600 text-sm font-medium mb-1">Altitude</p>
              <p className="font-bold text-2xl text-aviation-800">{Math.round(selectedAircraft.altitude / 100)}FL</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium mb-1">Speed</p>
              <p className="font-bold text-2xl text-green-800">{Math.round(selectedAircraft.velocity * 1.944)} kts</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-600 text-sm font-medium mb-1">Heading</p>
              <p className="font-bold text-2xl text-orange-800">{Math.round(selectedAircraft.heading)}°</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium mb-1">Squawk</p>
              <p className="font-bold text-2xl text-purple-800 font-mono">{selectedAircraft.squawk}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATCDashboard;
