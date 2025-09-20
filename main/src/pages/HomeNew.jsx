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

  // Render main viewer based on viewMode
  const renderViewer = () => {
    switch (viewMode) {
      case 'map':
        return (
          <InteractiveMap 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
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
      case '3d':
      default:
        return (
          <Globe3D 
            selectedAirport={selectedAirport}
            aircraftData={aircraftData}
            radius={radius}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Main Content Area */}
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
          <div className="flex-1 p-4">
            <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
              {renderViewer()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Parameters Bar */}
      <ParametersBar 
        radius={radius}
        onRadiusChange={handleRadiusChange}
        selectedAirport={selectedAirport}
        aircraftData={aircraftData}
        lastUpdate={lastUpdate}
        loading={loading}
        viewMode={viewMode}
      />
    </div>
  );
};

export default Home;
