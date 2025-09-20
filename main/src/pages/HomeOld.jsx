import { useState, useEffect } from 'react';
import Globe3D from '../components/Globe3D';
import InteractiveMap from '../components/InteractiveMap';
import BasicAircraftView from '../components/BasicAircraftView';
import Sidebar from '../components/Sidebar';
import ParametersBar from '../components/ParametersBar';

const Home = () => {
  const [selectedAirport, setSelectedAirport] = useState('');
  const [aircraftData, setAircraftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'map', 'list'
  const [globeError, setGlobeError] = useState(false);
  const [radius, setRadius] = useState(200); // Default 200nm
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAircraftData = async (airportCode, radiusValue = radius) => {
    if (!airportCode) {
      setAircraftData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5005/api/atc/aircraft/airport/${airportCode}?radius=${radiusValue}`);
      const data = await response.json();
      
      if (data.success) {
        setAircraftData(data.data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch aircraft data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching aircraft data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAirportChange = async (airportCode) => {
    setSelectedAirport(airportCode);
    await fetchAircraftData(airportCode);
  };

  const handleRadiusChange = async (newRadius) => {
    setRadius(newRadius);
    if (selectedAirport) {
      await fetchAircraftData(selectedAirport, newRadius);
    }
  };

  // Live updates effect
  useEffect(() => {
    if (!liveUpdate || !selectedAirport) return;

    const interval = setInterval(() => {
      fetchAircraftData(selectedAirport, radius);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [liveUpdate, selectedAirport, radius]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hero Section with Globe */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="w-24 h-24 bg-aviation-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
              </div>
              <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl text-white">
                ATC System
              </h1>
              <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-2xl text-gray-200 font-medium">
                AI-Powered Air Traffic Control System
              </p>
              <p className="mt-6 max-w-3xl mx-auto lg:mx-0 text-lg text-gray-300 leading-relaxed">
                Real-time aircraft tracking, intelligent conflict detection, and AI-suggested resolution strategies for modern air traffic control.
              </p>
              
              {/* Airport Selector */}
              <div className="mt-8 flex justify-center lg:justify-start">
                <AirportSelector 
                  onAirportChange={handleAirportChange}
                  selectedAirport={selectedAirport}
                />
              </div>

              {/* Controls */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center lg:justify-start">
                {/* Radius Control */}
                <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                  <label className="text-sm text-gray-300">Radius:</label>
                  <select 
                    value={radius} 
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value={50}>50 nm</option>
                    <option value={100}>100 nm</option>
                    <option value={200}>200 nm</option>
                    <option value={300}>300 nm</option>
                    <option value={500}>500 nm</option>
                  </select>
                </div>

                {/* Live Update Toggle */}
                <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                  <label className="text-sm text-gray-300">Live Updates:</label>
                  <button
                    onClick={() => setLiveUpdate(!liveUpdate)}
                    className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                      liveUpdate ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      liveUpdate ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Manual Refresh */}
                <button
                  onClick={() => fetchAircraftData(selectedAirport, radius)}
                  disabled={!selectedAirport || loading}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded-lg text-sm text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {/* Aircraft Count Display */}
              {selectedAirport && (
                <div className="mt-4 text-center lg:text-left">
                  <div className="inline-flex items-center px-4 py-2 bg-aviation-900/50 rounded-lg border border-aviation-700">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      loading ? 'bg-yellow-400 animate-pulse' : 'bg-aviation-400'
                    }`}></div>
                    <span className="text-aviation-300">
                      {loading ? 'Loading...' : `${aircraftData.length} aircraft tracked`}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    <div className="inline-flex items-center">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                      Live data from adsb.lol API • {radius}nm radius
                    </div>
                    {lastUpdate && (
                      <div className="text-xs text-gray-500">
                        Last update: {lastUpdate.toLocaleTimeString()}
                        {liveUpdate && <span className="ml-2 text-green-400">• Auto-refresh ON</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/atc"
                  className="inline-flex items-center px-10 py-4 bg-aviation-600 text-white text-lg font-bold rounded-xl hover:bg-aviation-700 transition-all duration-200 shadow-2xl hover:shadow-glow"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                  </svg>
                  Launch ATC Dashboard
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-10 py-4 border-2 border-gray-400 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Learn More
                </Link>
              </div>
            </div>
            
            {/* Right side - Globe */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-2xl h-96 bg-gray-800/50 rounded-2xl p-4 backdrop-blur-sm border border-gray-700">
                {viewMode === 'list' ? (
                  <BasicAircraftView 
                    selectedAirport={selectedAirport}
                    aircraftData={aircraftData}
                    radius={radius}
                  />
                ) : viewMode === '2d' ? (
                  <SimpleGlobe 
                    selectedAirport={selectedAirport}
                    aircraftData={aircraftData}
                    radius={radius}
                  />
                ) : (
                  <SafeGlobe 
                    selectedAirport={selectedAirport}
                    aircraftData={aircraftData}
                    radius={radius}
                  />
                )}
                <div className="mt-2 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setViewMode('3d')}
                      className={`text-xs px-2 py-1 rounded ${
                        viewMode === '3d' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      3D Globe
                    </button>
                    <button
                      onClick={() => setViewMode('2d')}
                      className={`text-xs px-2 py-1 rounded ${
                        viewMode === '2d' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      2D Canvas
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`text-xs px-2 py-1 rounded ${
                        viewMode === 'list' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      List View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-aviation-400 to-aviation-600 bg-clip-text text-transparent mb-4">
            Key Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced AI agents working together to enhance air traffic control with cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Live Aircraft Tracking */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-aviation-500 to-aviation-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Live Aircraft Tracking</h3>
            <p className="text-gray-300 leading-relaxed">
              Real-time map overlay showing aircraft positions, altitudes, and flight paths with color-coded status indicators and predictive analytics.
            </p>
          </div>

          {/* AI Conflict Detection */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Conflict Detection</h3>
            <p className="text-gray-300 leading-relaxed">
              Intelligent agents continuously monitor aircraft separation and automatically detect potential conflicts before they occur with 99.9% accuracy.
            </p>
          </div>

          {/* Resolution Suggestions */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Resolution Strategies</h3>
            <p className="text-gray-300 leading-relaxed">
              Advanced AI agents suggest optimal resolution strategies including heading changes, altitude adjustments, and speed modifications with impact analysis.
            </p>
          </div>

          {/* Real-time Alerts */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Real-time Alerts</h3>
            <p className="text-gray-300 leading-relaxed">
              Instant notifications for conflicts with severity-based prioritization, suggested immediate actions, and escalation protocols.
            </p>
          </div>

          {/* Multi-agent System */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-3.01A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.54.37-2.01.99L1 14.37V22h2v-6h2.5l2.5 7.5h2L8 16h2l2.5 7.5h2L16 16h2v6h2z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Multi-agent System</h3>
            <p className="text-gray-300 leading-relaxed">
              Specialized AI agents working together: conflict detection, resolution planning, continuous monitoring, and coordination management.
            </p>
          </div>

          {/* API Integration */}
          <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">API Integration</h3>
            <p className="text-gray-300 leading-relaxed">
              Seamless integration with OpenSky Network and AirLabs APIs for comprehensive aircraft data, weather information, and real-time tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent mb-4">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built with modern technologies for reliability, performance, and scalability
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">R</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">React</div>
              <div className="text-sm text-gray-400">Frontend</div>
            </div>
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">F</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">Flask</div>
              <div className="text-sm text-gray-400">Backend</div>
            </div>
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">AI</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">AI Agents</div>
              <div className="text-sm text-gray-400">Intelligence</div>
            </div>
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">G</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">Globe.gl</div>
              <div className="text-sm text-gray-400">3D Globe</div>
            </div>
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">O</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">OpenSky</div>
              <div className="text-sm text-gray-400">Data Source</div>
            </div>
            <div className="group text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/50 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-white">T</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">Tailwind</div>
              <div className="text-sm text-gray-400">Styling</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-24 overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-aviation-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 sm:text-5xl">
            Ready to Experience the Future of ATC?
          </h2>
          <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Launch the ATC Dashboard and see AI agents in action with real-time conflict detection and resolution strategies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/atc"
              className="inline-flex items-center px-10 py-4 bg-aviation-600 text-white text-lg font-bold rounded-xl hover:bg-aviation-700 transition-all duration-200 shadow-2xl hover:shadow-glow"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              Start ATC Dashboard
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center px-10 py-4 border-2 border-gray-400 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              View Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
