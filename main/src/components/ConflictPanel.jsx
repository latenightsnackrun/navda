import React, { useState, useEffect } from 'react';

const ConflictPanel = ({ conflicts, onResolutionRequest }) => {
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-select first conflict if available
  useEffect(() => {
    if (conflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(conflicts[0]);
    }
  }, [conflicts, selectedConflict]);

  // Get resolution strategies for selected conflict
  const getResolutions = async (conflict) => {
    if (!conflict) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/atc/resolutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conflicts: [conflict]
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setResolutions(data.data[0]?.strategies || []);
      }
    } catch (error) {
      console.error('Error fetching resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get resolutions when conflict is selected
  useEffect(() => {
    if (selectedConflict) {
      getResolutions(selectedConflict);
    }
  }, [selectedConflict]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (conflicts.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">All Clear</h3>
          <p className="text-green-600 font-medium">No conflicts detected - all aircraft maintaining safe separation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Conflict Detection</h2>
            <p className="text-red-100 font-medium">
              {conflicts.length} active conflict{conflicts.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
      </div>

      {/* Conflict List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 space-y-4">
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedConflict === conflict
                  ? 'border-aviation-500 bg-aviation-50 shadow-aviation'
                  : 'border-gray-200 bg-white hover:border-aviation-300 hover:bg-aviation-25'
              }`}
              onClick={() => setSelectedConflict(conflict)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">
                    {conflict.aircraft1.callsign} ↔ {conflict.aircraft2.callsign}
                  </h3>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getSeverityColor(conflict.severity)}`}>
                  {conflict.severity.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium mb-1">Separation</p>
                  <p className="font-bold text-2xl text-red-600">{conflict.separation_distance.toFixed(2)} NM</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium mb-1">Time to Conflict</p>
                  <p className="font-bold text-2xl text-orange-600">{formatTime(conflict.time_to_conflict)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium mb-1">Type</p>
                  <p className="font-bold text-lg text-gray-800 capitalize">{conflict.conflict_type}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium mb-1">Aircraft 1 Alt</p>
                  <p className="font-bold text-lg text-aviation-600">{Math.round(conflict.aircraft1.altitude / 100)}FL</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Strategies */}
      {selectedConflict && (
        <div className="border-t border-aviation-200 bg-gradient-to-br from-aviation-50 to-blue-50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">AI Resolution Strategies</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-aviation-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-aviation-500 border-t-transparent"></div>
              </div>
              <p className="text-aviation-700 font-medium">Analyzing conflict and generating strategies...</p>
            </div>
          ) : resolutions.length > 0 ? (
            <div className="space-y-4">
              {resolutions.map((strategy, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-aviation-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{strategy.description}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${getConfidenceColor(strategy.confidence)}`}>
                            {Math.round(strategy.confidence * 100)}% confidence
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-aviation-100 text-aviation-800 text-sm font-bold rounded-full">
                          Priority {strategy.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 text-sm font-medium mb-1">Resolution Time</p>
                      <p className="font-bold text-aviation-600">{formatTime(strategy.estimated_resolution_time)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 text-sm font-medium mb-1">Impact</p>
                      <p className="text-sm text-gray-700">
                        {strategy.impact_assessment.fuel_impact} fuel, {strategy.impact_assessment.delay_impact} delay
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.997.997 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm9-8.586L19.586 13H5.414L12 4.414zM18 15v5H6v-5h12z"/>
                        </svg>
                        <span>{strategy.impact_assessment.fuel_impact}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z"/>
                        </svg>
                        <span>{strategy.impact_assessment.delay_impact}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => onResolutionRequest && onResolutionRequest(strategy)}
                      className="px-6 py-3 bg-gradient-to-r from-aviation-600 to-aviation-700 text-white text-sm font-bold rounded-lg hover:from-aviation-700 hover:to-aviation-800 transition-all duration-200 shadow-lg hover:shadow-glow flex items-center space-x-2"
                    >
                      <span>✅</span>
                      <span>Apply Strategy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤔</span>
              </div>
              <p className="text-gray-600 font-medium">No resolution strategies available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConflictPanel;
