import { useEffect, useState } from 'react';

const BasicAircraftView = ({ selectedAirport, aircraftData = [], radius = 200 }) => {
  const [displayData, setDisplayData] = useState([]);

  useEffect(() => {
    // Process and limit aircraft data for display
    const processed = aircraftData
      .filter(aircraft => 
        aircraft && 
        typeof aircraft.latitude === 'number' && 
        typeof aircraft.longitude === 'number'
      )
      // Remove artificial limit to show all aircraft
      .map((aircraft, index) => ({
        id: index,
        callsign: aircraft.callsign || 'Unknown',
        registration: aircraft.registration || aircraft.icao24,
        latitude: aircraft.latitude.toFixed(4),
        longitude: aircraft.longitude.toFixed(4),
        altitude: Math.round(aircraft.altitude || 0),
        velocity: Math.round(aircraft.velocity || 0),
        trueAirspeed: aircraft.true_airspeed ? Math.round(aircraft.true_airspeed) : null,
        onGround: aircraft.on_ground,
        heading: Math.round(aircraft.heading || 0),
        verticalRate: aircraft.vertical_rate ? Math.round(aircraft.vertical_rate) : 0,
        squawk: aircraft.squawk || 'N/A',
        emergency: aircraft.emergency || false,
        country: aircraft.origin_country || 'Unknown'
      }));
    
    setDisplayData(processed);
  }, [aircraftData]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 text-center">
          <h3 className="text-white text-lg font-semibold">
            Aircraft near {selectedAirport || 'Selected Airport'} ({radius}nm)
          </h3>
          <p className="text-gray-400 text-sm">
            {aircraftData.length} total aircraft • Showing {displayData.length}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Aircraft List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
          {displayData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">✈️</div>
                <div>No aircraft data available</div>
                <div className="text-sm mt-1">Select an airport to view aircraft</div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {displayData.map((aircraft) => (
                <div
                  key={aircraft.id}
                  className={`px-3 py-1.5 rounded border relative ${
                    aircraft.emergency 
                      ? 'bg-red-900/40 border-red-500 shadow-red-500/20 shadow-lg' 
                      : aircraft.onGround 
                      ? 'bg-red-900/20 border-red-700' 
                      : 'bg-green-900/20 border-green-700'
                  }`}
                >
                  {/* Emergency indicators */}
                  {aircraft.emergency && (
                    <div className="absolute top-0.5 right-1 bg-red-600 text-white px-1 py-0.5 rounded text-xs font-bold animate-pulse">
                      🚨
                    </div>
                  )}

                  {/* First line: Callsign, Registration, Coordinates */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="text-white font-bold text-sm">
                        {aircraft.callsign}
                      </div>
                      <div className="text-blue-300 font-mono">
                        {aircraft.registration}
                      </div>
                      <div className="text-gray-400">
                        {aircraft.latitude}, {aircraft.longitude}
                      </div>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {aircraft.country}
                    </div>
                  </div>

                  {/* Second line: Flight data */}
                  <div className="flex justify-between items-center text-xs mt-0.5">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400">Alt:</span>
                      <span className="text-white">{aircraft.altitude.toLocaleString()}ft</span>
                      <span className="text-gray-400">GS:</span>
                      <span className="text-white">{aircraft.velocity}kt</span>
                      <span className="text-gray-400">Hdg:</span>
                      <span className="text-white">{aircraft.heading}°</span>
                      <span className="text-gray-400">Sqk:</span>
                      <span className="text-cyan-300 font-mono">{aircraft.squawk}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {aircraft.trueAirspeed && aircraft.trueAirspeed !== aircraft.velocity && (
                        <div className="flex items-center">
                          <span className="text-gray-400">TAS:</span>
                          <span className="text-white ml-1">{aircraft.trueAirspeed}kt</span>
                        </div>
                      )}
                      {Math.abs(aircraft.verticalRate) > 64 && (
                        <div className="flex items-center">
                          <span className="text-gray-400">V/S:</span>
                          <span className={`ml-1 ${aircraft.verticalRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {aircraft.verticalRate > 0 ? '↗' : '↘'}{Math.abs(aircraft.verticalRate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-gray-700 text-center">
          <div className="text-xs text-gray-400">
            <span className="inline-flex items-center mr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Airborne
            </span>
            <span className="inline-flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              On Ground
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicAircraftView;
