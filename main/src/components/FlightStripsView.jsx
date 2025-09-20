import { useState } from 'react';

const FlightStripsView = () => {
  const [selectedSector, setSelectedSector] = useState('approach');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample flight strips data
  const flightStrips = [
    {
      id: 1,
      callsign: 'AAL1234',
      aircraft: 'B737',
      departure: 'KJFK',
      arrival: 'KLAX',
      altitude: 35000,
      speed: 480,
      route: 'KJFK..KLAX',
      squawk: '1234',
      status: 'enroute',
      sector: 'approach',
      estimate: '14:25',
      remarks: 'Request direct BAYST'
    },
    {
      id: 2,
      callsign: 'UAL5678',
      aircraft: 'A320',
      departure: 'KORD',
      arrival: 'KJFK',
      altitude: 12000,
      speed: 250,
      route: 'KORD..KJFK',
      squawk: '5678',
      status: 'descending',
      sector: 'approach',
      estimate: '14:30',
      remarks: 'ILS RWY 04L'
    },
    {
      id: 3,
      callsign: 'DLH456',
      aircraft: 'B777',
      departure: 'EDDF',
      arrival: 'KJFK',
      altitude: 8000,
      speed: 180,
      route: 'EDDF..KJFK',
      squawk: '0456',
      status: 'final',
      sector: 'tower',
      estimate: '14:22',
      remarks: 'Heavy, RWY 04L'
    }
  ];

  const sectors = [
    { id: 'approach', name: 'Approach' },
    { id: 'departure', name: 'Departure' },
    { id: 'tower', name: 'Tower' },
    { id: 'ground', name: 'Ground' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'enroute': return 'bg-blue-500';
      case 'descending': return 'bg-yellow-500';
      case 'final': return 'bg-red-500';
      case 'landed': return 'bg-green-500';
      case 'taxiing': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredStrips = flightStrips.filter(strip => 
    (selectedSector === 'all' || strip.sector === selectedSector) &&
    (filterStatus === 'all' || strip.status === filterStatus)
  );

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Flight Progress Strips</h1>
            <p className="text-gray-400 mt-1">Digital replacement for paper flight progress strips</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Sector Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">Sector:</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="enroute">En Route</option>
                <option value="descending">Descending</option>
                <option value="final">Final Approach</option>
                <option value="landed">Landed</option>
                <option value="taxiing">Taxiing</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Tabs */}
      <div className="bg-gray-900/30 border-b border-gray-800 px-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedSector === 'all'
                ? 'text-white border-white'
                : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
            }`}
          >
            All Sectors
          </button>
          {sectors.map(sector => (
            <button
              key={sector.id}
              onClick={() => setSelectedSector(sector.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                selectedSector === sector.id
                  ? 'text-white border-white'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>

      {/* Flight Strips */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {filteredStrips.map((strip) => (
            <div key={strip.id} className="bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              {/* Strip Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded ${getStatusColor(strip.status)}`}></div>
                  <div className="text-xl font-mono font-bold text-white">{strip.callsign}</div>
                  <div className="text-gray-400">{strip.aircraft}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white font-semibold">EST: {strip.estimate}</div>
                    <div className="text-gray-400 text-sm capitalize">{strip.status}</div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Strip Content */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Route</div>
                    <div className="text-white font-mono">{strip.departure} → {strip.arrival}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Altitude</div>
                    <div className="text-white font-mono">{strip.altitude.toLocaleString()}'</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Speed</div>
                    <div className="text-white font-mono">{strip.speed} kts</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Squawk</div>
                    <div className="text-white font-mono">{strip.squawk}</div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="mb-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Route</div>
                  <div className="text-gray-300 font-mono text-sm">{strip.route}</div>
                </div>

                {/* Remarks */}
                {strip.remarks && (
                  <div className="mb-4">
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Remarks</div>
                    <div className="text-yellow-300 text-sm">{strip.remarks}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Contact
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                    Clear
                  </button>
                  <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors">
                    Amend
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                    Hold
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStrips.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No flight strips found</div>
            <div className="text-gray-500">Try adjusting your filters or check back later</div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-400">En Route: {flightStrips.filter(s => s.status === 'enroute').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">Descending: {flightStrips.filter(s => s.status === 'descending').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">Final: {flightStrips.filter(s => s.status === 'final').length}</span>
            </div>
          </div>
          <div className="text-gray-400">
            Total Strips: {flightStrips.length} • Active Sector: {selectedSector}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightStripsView;
