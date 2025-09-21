import React, { useState, useEffect } from 'react';
import Globe3D from '../components/Globe3D';
import Cesium3D from '../components/Cesium3D';
import InteractiveMap from '../components/InteractiveMap';
import BasicAircraftView from '../components/BasicAircraftView';
import Sidebar from '../components/Sidebar';
import ParametersBar from '../components/ParametersBar';
import TopNavigation from '../components/TopNavigation';
import FlightStripsView from '../components/FlightStripsView';
import WatchlistTab from '../components/WatchlistTab';
import GlobeLandingPage from '../components/GlobeLandingPage';

const Home = () => {
  const [selectedAirport, setSelectedAirport] = useState('');
  const [aircraftData, setAircraftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cesium'); // '3d', 'cesium', 'map', 'list'
  const [radius, setRadius] = useState(200); // Default 200nm
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [refreshRate, setRefreshRate] = useState(1000); // Default 1 second
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('control');
  const [showLandingPage, setShowLandingPage] = useState(true);

  const fetchAircraftData = async (airportCode, radiusValue = radius) => {
    if (!airportCode) {
      setAircraftData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5001/api/atc/aircraft/airport/${airportCode}?radius=${radiusValue}`);
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
    setShowLandingPage(false); // Hide landing page when airport is selected
    await fetchAircraftData(airportCode);
  };

  const handleEnterDashboard = () => {
    setShowLandingPage(false);
  };

  const handleBackToLanding = () => {
    setShowLandingPage(true);
    setSelectedAirport('');
    setAircraftData([]);
  };

  const handleRadiusChange = async (newRadius) => {
    setRadius(newRadius);
    if (selectedAirport) {
      await fetchAircraftData(selectedAirport, newRadius);
    }
  };

  const handleRefreshRateChange = (newRate) => {
    setRefreshRate(newRate);
  };

  // Live updates effect
  useEffect(() => {
    if (!liveUpdate || !selectedAirport) return;

    const interval = setInterval(() => {
      fetchAircraftData(selectedAirport, radius);
    }, refreshRate); // Use configurable refresh rate

    return () => clearInterval(interval);
  }, [liveUpdate, selectedAirport, radius, refreshRate]);

  // Render main viewer based on viewMode
  const renderViewer = () => {
    switch (viewMode) {
      case 'cesium':
        return (
          <Cesium3D 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
          />
        );
      case 'map':
        return (
          <InteractiveMap 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
            onRadiusChange={handleRadiusChange}
            onRefresh={() => fetchAircraftData(selectedAirport, radius)}
            loading={loading}
          />
        );
      case 'list':
        return (
          <BasicAircraftView 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
          />
        );
      default:
        return (
          <Cesium3D 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
          />
        );
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tickets':
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Flight Strips Content */}
            <div className="flex-1">
              <FlightStripsView />
            </div>
          </div>
        );
      case 'watchlist':
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Watchlist Content */}
            <div className="flex-1">
              <WatchlistTab 
                aircraftData={aircraftData}
                selectedAirport={selectedAirport}
              />
            </div>
          </div>
        );
      case 'control':
      default:
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar 
              selectedAirport={selectedAirport}
              onAirportChange={handleAirportChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              aircraftData={aircraftData}
              loading={loading}
              error={error}
              lastUpdate={lastUpdate}
              liveUpdate={liveUpdate}
              onToggleLiveUpdate={() => setLiveUpdate(!liveUpdate)}
              onRefresh={() => fetchAircraftData(selectedAirport, radius)}
            />

            {/* Main Viewer */}
            <div className="flex-1 flex flex-col">
              {viewMode === 'cesium' ? (
                <div className="flex-1">
                  {renderViewer()}
                </div>
              ) : (
                <div className="flex-1 p-4">
                  <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
                    {renderViewer()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  // Show landing page if no airport is selected and we're on the landing page
  if (showLandingPage && !selectedAirport) {
    return <GlobeLandingPage onEnterDashboard={handleEnterDashboard} />;
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Top Navigation */}
      <TopNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBackToLanding={handleBackToLanding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Bottom Parameters Bar - Always show for control tab as footer */}
      {activeTab === 'control' && (
        <ParametersBar 
          radius={radius}
          onRadiusChange={handleRadiusChange}
          selectedAirport={selectedAirport}
          aircraftData={aircraftData}
          lastUpdate={lastUpdate}
          loading={loading}
          viewMode={viewMode}
          liveUpdate={liveUpdate}
          onToggleLiveUpdate={() => setLiveUpdate(!liveUpdate)}
          refreshRate={refreshRate}
          onRefreshRateChange={handleRefreshRateChange}
        />
      )}
    </div>
  );
};

export default Home;
