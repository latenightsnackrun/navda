/**
 * AI Service - Frontend interface for Cerebras + LangChain backend
 * Handles aircraft analysis and natural language processing
 */

class AIService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    this.isInitialized = false;
  }

  /**
   * Analyze aircraft behavior using backend AI
   */
  async analyzeAircraftBehavior(aircraft, context = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/analyze-aircraft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraft: aircraft,
          context: context
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result.data;
      
    } catch (error) {
      console.error('Aircraft behavior analysis failed:', error);
      // Return fallback analysis
      return this._createFallbackAnalysis(aircraft, error.message);
    }
  }

  /**
   * Process natural language queries about aircraft data
   */
  async processNaturalLanguageQuery(query, aircraftData, context = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/process-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          aircraft_data: aircraftData,
          context: context
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Query processing failed');
      }

      return result.data;
      
    } catch (error) {
      console.error('Natural language query processing failed:', error);
      // Return fallback response
      return this._createFallbackQueryResponse(query, error.message);
    }
  }

  /**
   * Generate incident summary for aircraft
   */
  async generateIncidentSummary(aircraft, analysis) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aircraft: aircraft,
          analysis: analysis
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Summary generation failed');
      }

      return result.data.summary;
      
    } catch (error) {
      console.error('Incident summary generation failed:', error);
      return `Flight ${aircraft.callsign || 'Unknown'} - Summary unavailable`;
    }
  }

  /**
   * Batch analyze multiple aircraft
   */
  async batchAnalyzeAircraft(aircraftList, context = {}) {
    const analyses = {};
    const batchSize = 5; // Process in batches to avoid overwhelming the backend
    
    for (let i = 0; i < aircraftList.length; i += batchSize) {
      const batch = aircraftList.slice(i, i + batchSize);
      const promises = batch.map(aircraft => 
        this.analyzeAircraftBehavior(aircraft, context)
          .then(analysis => ({ [aircraft.icao24]: analysis }))
          .catch(error => ({ [aircraft.icao24]: this._createFallbackAnalysis(aircraft, error.message) }))
      );
      
      const results = await Promise.all(promises);
      results.forEach(result => Object.assign(analyses, result));
      
      // Add small delay between batches to be respectful to the backend
      if (i + batchSize < aircraftList.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return analyses;
  }

  /**
   * Get intelligent insights for watchlist
   */
  async getWatchlistInsights(watchlistAircraft, allAircraftData) {
    if (watchlistAircraft.length === 0) {
      return {
        summary: "No aircraft currently in watchlist",
        insights: [],
        recommendations: ["Add aircraft to watchlist to monitor behavior"]
      };
    }

    try {
      // Create a summary query
      const query = `Generate a comprehensive summary of the ${watchlistAircraft.length} aircraft in the watchlist. Identify any patterns, concerns, and provide recommendations for ATC action.`;
      
      const result = await this.processNaturalLanguageQuery(query, watchlistAircraft, {
        context_type: 'watchlist_summary',
        total_aircraft: allAircraftData.length
      });

      return {
        summary: result.response,
        insights: result.insights || [],
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('Watchlist insights generation failed:', error);
      return this._createFallbackInsights(watchlistAircraft);
    }
  }

  /**
   * Check if backend AI service is available
   */
  async checkServiceHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/atc/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('AI service health check failed:', error);
      return false;
    }
  }

  /**
   * Create fallback analysis when AI service is unavailable
   */
  _createFallbackAnalysis(aircraft, error = null) {
    const concerns = [];
    const altitude = aircraft.altitude || 0;
    const speed = aircraft.speed || 0;
    const verticalRate = aircraft.vertical_rate || 0;

    // Basic rule-based analysis
    if (altitude < 1000 && speed > 200) {
      concerns.push('Low altitude with high speed - approach monitoring required');
    }

    if (Math.abs(verticalRate) > 2000) {
      const direction = verticalRate > 0 ? 'climb' : 'descent';
      concerns.push(`Rapid ${direction} at ${Math.abs(verticalRate)} ft/min`);
    }

    if (altitude > 40000) {
      concerns.push('Very high altitude - potential emergency or equipment issue');
    }

    if (speed > 500) {
      concerns.push('Excessive ground speed detected');
    }

    // Determine status
    let status;
    if (concerns.length >= 2) {
      status = 'critical';
    } else if (concerns.length >= 1) {
      status = 'concerning';
    } else {
      status = 'normal';
    }

    const callsign = aircraft.callsign || 'Unknown';

    return {
      status: status,
      summary: concerns.length > 0 
        ? `Flight ${callsign} - ${concerns.length} concern(s) detected` 
        : `Flight ${callsign} operating normally`,
      concerns: concerns,
      recommendations: concerns.length > 0 
        ? ['Monitor closely', 'Consider radio contact'] 
        : ['Continue normal monitoring'],
      confidence: 0.75,
      timestamp: new Date().toISOString(),
      processing_method: 'fallback',
      error: error
    };
  }

  /**
   * Create fallback query response
   */
  _createFallbackQueryResponse(query, error = null) {
    return {
      query_type: 'analysis',
      response: `I received your query: "${query}". The AI service is currently unavailable, but I can provide basic information. Please try again later for advanced analysis.`,
      filtered_aircraft: [],
      total_matches: 0,
      insights: ['AI service temporarily unavailable'],
      recommendations: ['Try again later', 'Use manual monitoring procedures'],
      error: error
    };
  }

  /**
   * Create fallback insights
   */
  _createFallbackInsights(watchlistAircraft) {
    const statusCounts = watchlistAircraft.reduce((acc, aircraft) => {
      acc[aircraft.status || 'unknown'] = (acc[aircraft.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const insights = [
      `${watchlistAircraft.length} aircraft in watchlist`,
      ...Object.entries(statusCounts).map(([status, count]) => 
        `${count} aircraft with ${status} status`
      )
    ];

    return {
      summary: `Watchlist contains ${watchlistAircraft.length} aircraft. AI analysis is temporarily unavailable.`,
      insights: insights,
      recommendations: [
        'Monitor watchlisted aircraft manually',
        'Check individual aircraft details',
        'Try AI analysis again later'
      ]
    };
  }

  /**
   * Format analysis for display
   */
  formatAnalysisForDisplay(analysis) {
    const statusEmoji = {
      'normal': '✅',
      'concerning': '⚠️',
      'critical': '🚨',
      'emergency': '🚨'
    };

    return {
      ...analysis,
      statusDisplay: `${statusEmoji[analysis.status] || '❓'} ${analysis.status.toUpperCase()}`,
      confidenceDisplay: `${Math.round(analysis.confidence * 100)}%`,
      timestampDisplay: new Date(analysis.timestamp).toLocaleTimeString()
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;

