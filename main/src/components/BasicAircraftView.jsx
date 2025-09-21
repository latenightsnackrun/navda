import { useEffect, useState } from 'react';

const BasicAircraftView = ({ selectedAirport, aircraftData = [], radius = 200, onAddToWatchlist }) => {
  const [displayData, setDisplayData] = useState([]);

  useEffect(() => {
    // Process and filter aircraft data for display - only airborne aircraft with complete data
    const processed = aircraftData
      .filter(aircraft => 
        aircraft && 
        typeof aircraft.latitude === 'number' && 
        typeof aircraft.longitude === 'number' &&
        // Only show airborne aircraft (not on ground)
        !aircraft.on_ground &&
        // Ensure we have complete data - no 0 or N/A values for key fields
        aircraft.altitude && aircraft.altitude > 0 &&
        aircraft.velocity && aircraft.velocity > 0 &&
        aircraft.heading !== null && aircraft.heading !== undefined &&
        aircraft.squawk && aircraft.squawk !== 'N/A' && aircraft.squawk !== '0000' &&
        aircraft.callsign && aircraft.callsign.trim() !== '' &&
        aircraft.icao24 && aircraft.icao24.trim() !== ''
      )
      .map((aircraft, index) => ({
        id: index,
        callsign: aircraft.callsign.trim(),
        registration: aircraft.registration || aircraft.icao24,
        latitude: aircraft.latitude.toFixed(4),
        longitude: aircraft.longitude.toFixed(4),
        altitude: Math.round(aircraft.altitude),
        velocity: Math.round(aircraft.velocity),
        trueAirspeed: aircraft.true_airspeed ? Math.round(aircraft.true_airspeed) : null,
        onGround: aircraft.on_ground,
        heading: Math.round(aircraft.heading),
        verticalRate: aircraft.vertical_rate ? Math.round(aircraft.vertical_rate) : 0,
        squawk: aircraft.squawk,
        emergency: aircraft.emergency || false,
        country: aircraft.origin_country || 'Unknown',
        // Include additional data for watchlist
        icao24: aircraft.icao24,
        vertical_rate: aircraft.vertical_rate,
        on_ground: aircraft.on_ground
      }));
    
    setDisplayData(processed);
  }, [aircraftData]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 text-center">
          <h3 className="text-white text-lg font-semibold">
            Airborne Aircraft ({radius}nm radius)
          </h3>
          <p className="text-gray-400 text-sm">
            {aircraftData.length} total aircraft • {displayData.length} airborne with complete data
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
                <div>No airborne aircraft with complete data</div>
                <div className="text-sm mt-1">Only showing aircraft in flight with valid data</div>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayData.map((aircraft) => (
                <div
                  key={aircraft.id}
                  className={`px-2 py-1 rounded border relative ${
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

                  {/* Single line: All aircraft data */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-white font-bold text-sm flex-shrink-0">
                        {aircraft.callsign}
                      </div>
                      <div className="text-blue-300 font-mono flex-shrink-0">
                        {aircraft.registration}
                      </div>
                      <div className="text-gray-500 text-xs flex-shrink-0">
                        {aircraft.country}
                      </div>
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-gray-400">Alt:</span>
                        <span className="text-white">{aircraft.altitude.toLocaleString()}ft</span>
                        <span className="text-gray-400">GS:</span>
                        <span className="text-white">{aircraft.velocity}kt</span>
                        <span className="text-gray-400">Hdg:</span>
                        <span className="text-white">{aircraft.heading}°</span>
                        <span className="text-gray-400">Sqk:</span>
                        <span className="text-cyan-300 font-mono">{aircraft.squawk}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {aircraft.trueAirspeed && aircraft.trueAirspeed !== aircraft.velocity && (
                        <div className="flex items-center">
                          <span className="text-gray-400">TAS:</span>
                          <span className="text-white ml-1">{aircraft.trueAirspeed}kt</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="text-gray-400">V/S:</span>
                        <span className={`ml-1 ${aircraft.verticalRate > 0 ? 'text-green-400' : aircraft.verticalRate < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {aircraft.verticalRate > 0 ? '↗' : aircraft.verticalRate < 0 ? '↘' : '↔'}{Math.abs(aircraft.verticalRate || 0)}
                        </span>
                      </div>
                      {onAddToWatchlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToWatchlist({
                              ...aircraft,
                              latitude: parseFloat(aircraft.latitude),
                              longitude: parseFloat(aircraft.longitude),
                              altitude: aircraft.altitude,
                              velocity: aircraft.velocity,
                              heading: aircraft.heading,
                              vertical_rate: aircraft.verticalRate,
                              on_ground: aircraft.onGround,
                              squawk: aircraft.squawk,
                              callsign: aircraft.callsign,
                              icao24: aircraft.icao24,
                              origin_country: aircraft.country,
                              emergency: aircraft.emergency
                            });
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Add to watchlist"
                        >
                          + Watch
                        </button>
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
