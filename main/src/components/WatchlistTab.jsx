import { useState, useEffect } from 'react';

const WatchlistTab = ({ aircraftData, selectedAirport }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiServiceAvailable, setAiServiceAvailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAircraft, setFilteredAircraft] = useState([]);
  const [sortBy, setSortBy] = useState('callsign'); // callsign, altitude, speed, icao24

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'assistant',
          content: 'Welcome to ATC Watchlist Assistant! 🚀\n\nThis is the watchlist interface where you can:\n• Add aircraft to monitor for concerning behavior\n• Track aircraft status and patterns\n• Chat with the AI assistant for intelligent analysis\n\nSelect an airport first to see available aircraft, then add them to your watchlist!',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Check AI service availability
  useEffect(() => {
    const checkAIService = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/health');
        if (response.ok) {
          setAiServiceAvailable(true);
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'assistant',
            content: '✅ AI analysis service is available! I can now provide intelligent aircraft behavior analysis.',
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.log('AI service not available, using basic functionality');
      }
    };
    
    checkAIService();
  }, []);

  // Filter and sort aircraft based on search term and sort criteria
  useEffect(() => {
    let filtered = [...aircraftData];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(aircraft => 
        (aircraft.callsign && aircraft.callsign.toLowerCase().includes(term)) ||
        (aircraft.icao24 && aircraft.icao24.toLowerCase().includes(term)) ||
        (aircraft.origin_country && aircraft.origin_country.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'callsign':
          return (a.callsign || a.icao24 || '').localeCompare(b.callsign || b.icao24 || '');
        case 'altitude':
          return (b.altitude || 0) - (a.altitude || 0);
        case 'speed':
          return (b.velocity || 0) - (a.velocity || 0);
        case 'icao24':
          return (a.icao24 || '').localeCompare(b.icao24 || '');
        default:
          return 0;
      }
    });
    
    setFilteredAircraft(filtered);
  }, [aircraftData, searchTerm, sortBy]);

  const addToWatchlist = async (aircraft) => {
    if (!watchlist.find(item => item.icao24 === aircraft.icao24)) {
      const watchItem = {
        ...aircraft,
        addedAt: new Date(),
        status: 'monitoring',
        reason: 'Manual addition'
      };
      setWatchlist([...watchlist, watchItem]);
      
      // Add confirmation message
      const confirmationMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `✈️ Added ${aircraft.callsign || aircraft.icao24} to watchlist for monitoring.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);

      // Automatically analyze the aircraft if AI service is available
      if (aiServiceAvailable) {
        await analyzeAircraft(aircraft);
      }
    }
  };

  const analyzeAircraft = async (aircraft) => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5002/api/ai/analyze-aircraft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraft: aircraft,
          context: {
            airport: selectedAirport,
            total_aircraft: aircraftData.length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const analysis = data.analysis;
        
        // Update watchlist item with analysis
        setWatchlist(prev => prev.map(item => 
          item.icao24 === aircraft.icao24 
            ? { ...item, status: analysis.status, lastAnalysis: analysis }
            : item
        ));
        
        // Add analysis message
        const analysisMessage = {
          id: Date.now(),
          type: 'assistant',
          content: `🧠 Analysis for ${aircraft.callsign || aircraft.icao24}:\n\nStatus: ${analysis.status}\nSummary: ${analysis.summary}\n${analysis.concerns.length > 0 ? `Concerns: ${analysis.concerns.join(', ')}\n` : ''}Confidence: ${analysis.confidence}%`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, analysisMessage]);
      }
    } catch (error) {
      console.error('Aircraft analysis failed:', error);
    }
    
    setIsAnalyzing(false);
  };


  const removeFromWatchlist = (icao24) => {
    const aircraft = watchlist.find(item => item.icao24 === icao24);
    setWatchlist(watchlist.filter(item => item.icao24 !== icao24));
    
    if (selectedAircraft && selectedAircraft.icao24 === icao24) {
      setSelectedAircraft(null);
    }

    // Add removal message
    if (aircraft) {
      const removalMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `✈️ Removed ${aircraft.callsign || aircraft.icao24} from watchlist.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, removalMessage]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAnalyzing(true);

    try {
      if (aiServiceAvailable) {
        // Use AI service for intelligent responses
        const response = await fetch('http://localhost:5001/api/ai/process-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.content,
            aircraft_data: aircraftData,
            context: {
              watchlist: watchlist,
              selected_airport: selectedAirport
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.result;
          
          let responseText = result.response;
          
          if (result.filtered_aircraft && result.filtered_aircraft.length > 0) {
            responseText += `\n\n📊 Found ${result.total_matches} matching aircraft:\n`;
            result.filtered_aircraft.slice(0, 5).forEach(aircraft => {
              const callsign = aircraft.callsign ? aircraft.callsign.trim() : aircraft.icao24;
              const altitude = aircraft.altitude ? `${Math.round(aircraft.altitude)}ft` : 'N/A';
              const speed = aircraft.velocity ? `${Math.round(aircraft.velocity)}kts` : 'N/A';
              responseText += `• ${callsign} - ${altitude}, ${speed}\n`;
            });
          }

          if (result.insights && result.insights.length > 0) {
            responseText += `\n💡 Key Insights:\n${result.insights.map(insight => `• ${insight}`).join('\n')}`;
          }

          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: responseText,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('AI service error');
        }
      } else {
        // Fallback response when AI service is not available
        const responseMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `I received your message: "${userMessage.content}"\n\nAI analysis service is not available. For now, you can add aircraft to your watchlist to monitor their behavior.`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, responseMessage]);
      }
    } catch (error) {
      console.error('Query processing failed:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `❌ Sorry, I encountered an error processing your query. Please try again.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }

    setIsAnalyzing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'concerning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'monitoring': return 'text-blue-400 bg-blue-900/20 border-blue-800';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-800';
    }
  };

  const formatAircraftInfo = (aircraft) => {
    const altitude = aircraft.altitude ? `${Math.round(aircraft.altitude)}ft` : 'N/A';
    const speed = aircraft.velocity ? `${Math.round(aircraft.velocity)}kts` : 'N/A';
    const callsign = aircraft.callsign ? aircraft.callsign.trim() : 'Unknown';
    
    return `${callsign} • ${altitude} • ${speed}`;
  };

  // Show globe view when no airport is selected
  if (!selectedAirport) {
    return (
      <div className="h-full bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Global Flight Network</h3>
            <p className="text-gray-400 mb-6">Select an airport to view aircraft and start monitoring</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-semibold text-gray-100 mb-3">Watchlist Features</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Real-time aircraft tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>AI-powered behavior analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Intelligent watchlist management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Natural language queries</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex">
      {/* Left Panel - Aircraft Lists */}
      <div className="w-1/2 border-r border-gray-700 flex flex-col">
        {/* Available Aircraft */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-100">Available Aircraft</h3>
              <div className="text-xs text-gray-400">
                {filteredAircraft.length} of {aircraftData.length}
              </div>
            </div>
            
            {/* Search and Sort Controls */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by callsign, ICAO24, or country..."
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-2 py-1.5 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="callsign">Callsign</option>
                  <option value="altitude">Altitude</option>
                  <option value="speed">Speed</option>
                  <option value="icao24">ICAO24</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 'calc(50vh - 120px)' }}>
            {aircraftData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
                <p className="text-sm">Select an airport to view aircraft</p>
              </div>
            ) : filteredAircraft.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">No aircraft match your search</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredAircraft.map((aircraft) => (
                <div
                  key={aircraft.icao24}
                  className="p-3 bg-gray-800/50 rounded border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedAircraft(aircraft)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-100">
                        {formatAircraftInfo(aircraft)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-400">
                          ICAO: {aircraft.icao24}
                        </div>
                        {aircraft.origin_country && (
                          <div className="text-xs text-gray-500">
                            {aircraft.origin_country}
                          </div>
                        )}
                      </div>
                      {aircraft.vertical_rate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Vertical: {aircraft.vertical_rate > 0 ? '+' : ''}{Math.round(aircraft.vertical_rate)} ft/min
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWatchlist(aircraft);
                      }}
                      disabled={watchlist.find(item => item.icao24 === aircraft.icao24)}
                      className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {watchlist.find(item => item.icao24 === aircraft.icao24) ? 'Added' : '+ Watch'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Watchlist */}
        <div className="h-1/2 border-t border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-100">Watchlist</h3>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400">
                  {watchlist.length} aircraft
                </div>
                {watchlist.length > 0 && (
                  <button
                    onClick={() => {
                      setWatchlist([]);
                      setMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'assistant',
                        content: '🗑️ Cleared all aircraft from watchlist.',
                        timestamp: new Date()
                      }]);
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            {/* Status Summary */}
            {watchlist.length > 0 && (
              <div className="flex space-x-2 text-xs">
                {['critical', 'concerning', 'monitoring', 'normal'].map(status => {
                  const count = watchlist.filter(item => item.status === status).length;
                  if (count === 0) return null;
                  return (
                    <span key={status} className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
                      {count} {status}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 'calc(50vh - 120px)' }}>
            {watchlist.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-sm">No aircraft in watchlist</p>
                <p className="text-xs text-gray-600 mt-1">Add aircraft to monitor behavior</p>
              </div>
            ) : (
              watchlist.map((aircraft) => (
                <div
                  key={aircraft.icao24}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedAircraft && selectedAircraft.icao24 === aircraft.icao24
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedAircraft(aircraft)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-100">
                        {formatAircraftInfo(aircraft)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(aircraft.status)}`}>
                            {aircraft.status}
                          </span>
                          {aircraft.lastAnalysis && (
                            <span className="text-xs text-gray-500">
                              {aircraft.lastAnalysis.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {aircraft.addedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      {aircraft.lastAnalysis && aircraft.lastAnalysis.concerns.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-400">
                          ⚠️ {aircraft.lastAnalysis.concerns.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzeAircraft(aircraft);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Re-analyze aircraft"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(aircraft.icao24);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove from watchlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="w-1/2 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-100">ATC Assistant</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${aiServiceAvailable ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {aiServiceAvailable ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Ask questions about aircraft patterns • Get intelligent insights • Monitor behavior
          </p>
          
          {/* Quick Query Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Show low altitude aircraft',
              'Find high speed flights',
              'Analyze watchlist',
              'Generate summary'
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs mt-2 opacity-60">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
            
            {/* Loading indicator for AI analysis */}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 border border-gray-700 p-3 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span>🧠 AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about aircraft behavior, patterns, or request analysis..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Try: "Show me aircraft with unusual patterns" • "Analyze flight behavior" • "Generate summary"
          </div>
        </form>
      </div>

      {/* Selected Aircraft Detail Panel (Optional Overlay) */}
      {selectedAircraft && (
        <div className="absolute right-4 top-20 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-100">Aircraft Details</h4>
            <button
              onClick={() => setSelectedAircraft(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Callsign:</span>
              <span className="text-gray-100 font-mono">{selectedAircraft.callsign || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ICAO24:</span>
              <span className="text-gray-100 font-mono">{selectedAircraft.icao24}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Altitude:</span>
              <span className="text-gray-100 font-mono">
                {selectedAircraft.altitude ? `${Math.round(selectedAircraft.altitude)}ft` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speed:</span>
              <span className="text-gray-100 font-mono">
                {selectedAircraft.speed ? `${Math.round(selectedAircraft.speed)}kts` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedAircraft.status)}`}>
                {selectedAircraft.status}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Added to watchlist:</div>
              <div className="text-gray-100 text-xs font-mono">
                {selectedAircraft.addedAt.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistTab;
