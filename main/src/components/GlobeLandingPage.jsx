import GlobeVisualization from './GlobeVisualization';

const GlobeLandingPage = ({ onEnterDashboard }) => {
  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* NAVDA Logo with custom font */}
      <div className="absolute top-6 left-6 z-10">
        <h1 
          className="text-3xl font-bold text-white"
          style={{ 
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}
        >
          <span className="text-blue-400">NAV</span>
          <span className="text-white">DA</span>
        </h1>
        <p className="text-sm text-gray-300 mt-1" style={{ fontFamily: 'monospace' }}>
          Supporting tools for ATC efficiency
        </p>
      </div>

      {/* Globe Visualization - takes up the entire screen */}
      <div className="absolute inset-0">
        <GlobeVisualization />
      </div>

      {/* Dashboard Button - top right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onEnterDashboard}
          className="bg-transparent hover:bg-white/10 text-white font-semibold py-2 px-4 rounded-lg border border-white transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          style={{ 
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: '600'
          }}
        >
          <span>Take Me to Dashboard</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GlobeLandingPage;
