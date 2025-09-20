import { useState, useEffect } from 'react';

const AirportSelector = ({ onAirportChange, selectedAirport }) => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5005/api/atc/airports/list');
      const data = await response.json();
      
      if (data.success) {
        setAirports(data.data);
      } else {
        setError(data.error || 'Failed to fetch airports');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching airports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAirportChange = (event) => {
    const airportCode = event.target.value;
    onAirportChange(airportCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aviation-400"></div>
        <span className="ml-2 text-gray-300">Loading airports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
        <p className="text-red-300">Error: {error}</p>
        <button 
          onClick={fetchAirports}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <label htmlFor="airport-select" className="block text-sm font-medium text-gray-300 mb-2">
        Select Airport
      </label>
      <select
        id="airport-select"
        value={selectedAirport || ''}
        onChange={handleAirportChange}
        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-aviation-500 focus:border-transparent backdrop-blur-sm"
      >
        <option value="">Select an airport...</option>
        {airports.map((airport) => (
          <option key={airport.code} value={airport.code}>
            {airport.code} - {airport.name} ({airport.city})
          </option>
        ))}
      </select>
      
      {selectedAirport && (
        <div className="mt-2 text-sm text-gray-400">
          Selected: {airports.find(a => a.code === selectedAirport)?.name}
        </div>
      )}
    </div>
  );
};

export default AirportSelector;
