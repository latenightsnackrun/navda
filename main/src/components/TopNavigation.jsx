import { useState } from 'react';

const TopNavigation = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { 
      id: 'control', 
      name: 'Control Tower', 
      description: 'Real-time aircraft tracking and control'
    },
    { 
      id: 'scheduling', 
      name: 'Scheduling', 
      description: 'Flight scheduling and resource management'
    },
    { 
      id: 'tickets', 
      name: 'Flight Strips', 
      description: 'Digital flight progress strips'
    }
  ];

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-gray-800/50">
      <div className="max-w-none px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              {/* Avivato Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <div className="text-xl font-semibold text-white tracking-tight">AVIVATO</div>
              </div>
            </div>

            {/* Navigation Tabs - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-6 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-white border-white'
                      : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* System Status */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-400 font-mono">OPERATIONAL</span>
              </div>
              <div className="text-gray-600">•</div>
              <div className="text-sm text-gray-400 font-mono">
                {new Date().toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {/* User Profile */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">Controller</div>
                <div className="text-xs text-gray-400 font-mono">TWR-01</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pt-6 border-t border-gray-800">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900'
                  }`}
                >
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                </button>
              ))}
            </div>

            {/* Mobile System Status */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400 font-mono">OPERATIONAL</span>
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavigation;
