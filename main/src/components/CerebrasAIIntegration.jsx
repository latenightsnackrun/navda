import React, { useState, useEffect } from 'react';

const CerebrasAIIntegration = ({ conflicts, aircraftData, onResolution }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [aiStatus, setAiStatus] = useState('ready');

  // Simulate Cerebras AI analysis
  const analyzeConflicts = async (conflicts) => {
    setIsAnalyzing(true);
    setAiStatus('analyzing');
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate AI conflict resolution recommendations
    const resolutions = conflicts.map((conflict, index) => {
      const { aircraft1, aircraft2, distance, altitudeDiff, severity } = conflict;
      
      // AI-generated resolution strategies
      const strategies = [
        {
          type: 'altitude_change',
          aircraft: aircraft1,
          action: 'climb',
          newAltitude: aircraft1.altitude + 1000,
          reason: 'AI recommends climbing to create vertical separation'
        },
        {
          type: 'heading_change',
          aircraft: aircraft2,
          action: 'turn_right',
          newHeading: (aircraft2.trueTrack + 15) % 360,
          reason: 'AI recommends right turn to increase lateral separation'
        },
        {
          type: 'speed_adjustment',
          aircraft: aircraft1,
          action: 'reduce_speed',
          newSpeed: Math.max(aircraft1.velocity - 50, 200),
          reason: 'AI recommends speed reduction to create time separation'
        }
      ];
      
      return {
        conflictId: index,
        severity,
        recommendedAction: strategies[Math.floor(Math.random() * strategies.length)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        estimatedResolutionTime: Math.random() * 30 + 10, // 10-40 seconds
        alternativeActions: strategies.slice(1)
      };
    });
    
    setAnalysisResults(resolutions);
    setAiStatus('completed');
    setIsAnalyzing(false);
    
    // Notify parent component
    if (onResolution) {
      onResolution(resolutions);
    }
  };

  // Auto-analyze when conflicts change
  useEffect(() => {
    if (conflicts.length > 0 && !isAnalyzing) {
      analyzeConflicts(conflicts);
    }
  }, [conflicts.length]);

  const executeResolution = (resolution) => {
    setAiStatus('executing');
    console.log('Executing AI resolution:', resolution);
    
    // Simulate execution
    setTimeout(() => {
      setAiStatus('completed');
      console.log('Resolution executed successfully');
    }, 1000);
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
      <div className="font-medium mb-3 flex items-center">
        <span className="text-2xl mr-2">🧠</span>
        Cerebras AI Conflict Resolution
      </div>
      
      {/* AI Status */}
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          aiStatus === 'ready' ? 'bg-green-900 text-green-200' :
          aiStatus === 'analyzing' ? 'bg-yellow-900 text-yellow-200' :
          aiStatus === 'completed' ? 'bg-blue-900 text-blue-200' :
          'bg-red-900 text-red-200'
        }`}>
          {aiStatus === 'ready' && '✅ Ready'}
          {aiStatus === 'analyzing' && '🔄 Analyzing...'}
          {aiStatus === 'completed' && '✅ Analysis Complete'}
          {aiStatus === 'executing' && '⚡ Executing...'}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults && analysisResults.length > 0 && (
        <div className="space-y-3">
          <div className="font-medium text-blue-200">AI Recommendations:</div>
          {analysisResults.map((result, index) => (
            <div key={index} className="bg-gray-800/50 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">
                  Conflict #{result.conflictId + 1}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  result.severity === 'critical' ? 'bg-red-800 text-red-200' : 'bg-yellow-800 text-yellow-200'
                }`}>
                  {result.severity.toUpperCase()}
                </div>
              </div>
              
              <div className="text-xs space-y-1 mb-3">
                <div><strong>Aircraft:</strong> {result.recommendedAction.aircraft.callsign}</div>
                <div><strong>Action:</strong> {result.recommendedAction.action.replace('_', ' ').toUpperCase()}</div>
                <div><strong>Reason:</strong> {result.recommendedAction.reason}</div>
                <div><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</div>
                <div><strong>Est. Time:</strong> {result.estimatedResolutionTime.toFixed(0)}s</div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => executeResolution(result)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium"
                >
                  Execute
                </button>
                <button
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                >
                  View Alternatives
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Capabilities */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-300">
          <div className="font-medium mb-1">AI Capabilities:</div>
          <div className="space-y-1">
            <div>• Real-time conflict prediction</div>
            <div>• Multi-objective optimization</div>
            <div>• Weather-aware routing</div>
            <div>• Fuel efficiency optimization</div>
            <div>• Emergency response protocols</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CerebrasAIIntegration;
