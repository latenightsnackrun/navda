import { useState } from 'react';

const SchedulingView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'grid', 'list'

  // Sample scheduling data
  const schedules = [
    {
      id: 1,
      flight: 'AA1234',
      aircraft: 'B737-800',
      route: 'JFK → LAX',
      departure: '08:30',
      arrival: '11:45',
      gate: 'A12',
      status: 'scheduled',
      crew: 'Crew Alpha'
    },
    {
      id: 2,
      flight: 'UA5678',
      aircraft: 'A320',
      route: 'LAX → ORD',
      departure: '14:15',
      arrival: '19:30',
      gate: 'B7',
      status: 'delayed',
      crew: 'Crew Beta'
    },
    {
      id: 3,
      flight: 'DL9012',
      aircraft: 'B777-300',
      route: 'ORD → JFK',
      departure: '20:00',
      arrival: '23:15',
      gate: 'C4',
      status: 'on-time',
      crew: 'Crew Gamma'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'on-time': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Flight Scheduling</h1>
            <p className="text-gray-400 mt-1">Manage flight schedules, crew assignments, and resource allocation</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Date Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            {/* View Mode Selector */}
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              {['timeline', 'grid', 'list'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Main Schedule View */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Schedule</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Flight
              </button>
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
              {schedules.map((flight) => (
                <div key={flight.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(flight.status)}`}></div>
                      <div>
                        <div className="text-white font-semibold">{flight.flight}</div>
                        <div className="text-gray-400 text-sm">{flight.aircraft}</div>
                      </div>
                      <div className="text-gray-300">
                        <div className="font-medium">{flight.route}</div>
                        <div className="text-sm text-gray-400">{flight.departure} - {flight.arrival}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">Gate {flight.gate}</div>
                      <div className="text-gray-400 text-sm">{flight.crew}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resource Status */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resource Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Gates Available</span>
                  <span className="text-green-400 font-semibold">12/15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Aircraft Ready</span>
                  <span className="text-blue-400 font-semibold">8/10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Crew On Duty</span>
                  <span className="text-yellow-400 font-semibold">15/18</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Today's Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Flights</span>
                  <span className="text-white font-semibold">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">On Time</span>
                  <span className="text-green-400 font-semibold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Delayed</span>
                  <span className="text-red-400 font-semibold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Cancelled</span>
                  <span className="text-gray-400 font-semibold">2</span>
                </div>
              </div>
            </div>

            {/* Weather Alert */}
            <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Weather Alert</h3>
              <p className="text-yellow-200 text-sm">
                Moderate winds expected 15:00-18:00. Monitor runway conditions for potential delays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingView;
