/**
 * AI Analysis Service - LangChain + Cerebras Integration
 * 
 * This service handles all AI-powered analysis for the ATC Watchlist system.
 * It integrates with Cerebras AI for real-time aircraft behavior analysis
 * and uses LangChain for natural language query processing.
 */

class AIAnalysisService {
  constructor() {
    this.cerebrasApiKey = process.env.REACT_APP_CEREBRAS_API_KEY;
    this.cerebrasBaseUrl = 'https://api.cerebras.ai/v1';
    this.isInitialized = false;
    this.analysisHistory = new Map(); // Store analysis history for context
  }

  /**
   * Initialize the AI service with Cerebras API
   */
  async initialize() {
    if (!this.cerebrasApiKey) {
      console.warn('Cerebras API key not found. AI features will be limited.');
      return false;
    }

    try {
      // Test connection to Cerebras API
      const response = await fetch(`${this.cerebrasBaseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.cerebrasApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isInitialized = true;
        console.log('✅ Cerebras AI service initialized successfully');
        return true;
      } else {
        console.error('Failed to initialize Cerebras AI service:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error initializing Cerebras AI service:', error);
      return false;
    }
  }

  /**
   * Analyze aircraft behavior using Cerebras AI
   * @param {Object} aircraft - Aircraft data object
   * @param {Object} context - Additional context (airport, total aircraft, etc.)
   * @returns {Object} Analysis result with status, summary, concerns, and confidence
   */
  async analyzeAircraftBehavior(aircraft, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackAnalysis(aircraft);
    }

    try {
      const prompt = this.buildAircraftAnalysisPrompt(aircraft, context);
      
      const response = await fetch(`${this.cerebrasBaseUrl}/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cerebrasApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'cerebras-llama-2-7b-chat',
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.3,
          stop: ['Human:', 'Assistant:']
        })
      });

      if (!response.ok) {
        throw new Error(`Cerebras API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = this.parseAircraftAnalysis(data.choices[0].text, aircraft);
      
      // Store analysis in history
      this.analysisHistory.set(aircraft.icao24, {
        ...analysis,
        timestamp: new Date().toISOString(),
        context
      });

      return analysis;

    } catch (error) {
      console.error('Aircraft analysis failed:', error);
      return this.getFallbackAnalysis(aircraft);
    }
  }

  /**
   * Process natural language queries using LangChain + Cerebras
   * @param {string} query - Natural language query
   * @param {Array} aircraftData - Current aircraft data
   * @param {Object} context - Additional context (watchlist, airport, etc.)
   * @returns {Object} Query response with filtered aircraft and insights
   */
  async processNaturalLanguageQuery(query, aircraftData, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackQueryResponse(query, aircraftData);
    }

    try {
      // Step 1: Parse the query using LangChain-style prompt
      const queryAnalysisPrompt = this.buildQueryAnalysisPrompt(query, aircraftData, context);
      
      const response = await fetch(`${this.cerebrasBaseUrl}/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cerebrasApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'cerebras-llama-2-7b-chat',
          prompt: queryAnalysisPrompt,
          max_tokens: 800,
          temperature: 0.2,
          stop: ['Human:', 'Assistant:']
        })
      });

      if (!response.ok) {
        throw new Error(`Cerebras API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseQueryResponse(data.choices[0].text, query, aircraftData, context);

    } catch (error) {
      console.error('Query processing failed:', error);
      return this.getFallbackQueryResponse(query, aircraftData);
    }
  }

  /**
   * Generate incident summary using AI
   * @param {Array} watchlistAircraft - Aircraft in watchlist
   * @param {Object} context - Additional context
   * @returns {Object} Summary with key insights and recommendations
   */
  async generateIncidentSummary(watchlistAircraft, context = {}) {
    if (!this.isInitialized) {
      return this.getFallbackSummary(watchlistAircraft);
    }

    try {
      const summaryPrompt = this.buildSummaryPrompt(watchlistAircraft, context);
      
      const response = await fetch(`${this.cerebrasBaseUrl}/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cerebrasApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'cerebras-llama-2-7b-chat',
          prompt: summaryPrompt,
          max_tokens: 600,
          temperature: 0.3,
          stop: ['Human:', 'Assistant:']
        })
      });

      if (!response.ok) {
        throw new Error(`Cerebras API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSummaryResponse(data.choices[0].text, watchlistAircraft);

    } catch (error) {
      console.error('Summary generation failed:', error);
      return this.getFallbackSummary(watchlistAircraft);
    }
  }

  /**
   * Build prompt for aircraft behavior analysis
   */
  buildAircraftAnalysisPrompt(aircraft, context) {
    const altitude = aircraft.altitude || 'Unknown';
    const speed = aircraft.speed || 'Unknown';
    const callsign = aircraft.callsign || aircraft.icao24;
    const airport = context.airport || 'Unknown';
    const totalAircraft = context.total_aircraft || 0;

    return `You are an expert Air Traffic Control (ATC) analyst. Analyze this aircraft's behavior and determine if it requires attention.

AIRCRAFT DATA:
- Callsign: ${callsign}
- ICAO24: ${aircraft.icao24}
- Altitude: ${altitude}ft
- Speed: ${speed}kts
- Airport: ${airport}
- Total aircraft in area: ${totalAircraft}

ANALYSIS REQUIREMENTS:
1. Determine status: "normal", "monitoring", "concerning", or "critical"
2. Provide a concise summary (1-2 sentences)
3. List specific concerns (if any)
4. Give confidence level (0-100%)

Consider these factors:
- Altitude deviations from standard patterns
- Speed anomalies
- Unusual flight patterns
- Proximity to other aircraft
- Standard ATC procedures

Respond in this exact JSON format:
{
  "status": "normal|monitoring|concerning|critical",
  "summary": "Brief description of behavior",
  "concerns": ["concern1", "concern2"],
  "confidence": 85
}`;
  }

  /**
   * Build prompt for natural language query analysis
   */
  buildQueryAnalysisPrompt(query, aircraftData, context) {
    const watchlistCount = context.watchlist ? context.watchlist.length : 0;
    const airport = context.selected_airport || 'Unknown';

    return `You are an expert ATC assistant. Process this natural language query about aircraft data.

QUERY: "${query}"

CURRENT CONTEXT:
- Airport: ${airport}
- Total aircraft: ${aircraftData.length}
- Watchlist aircraft: ${watchlistCount}

AIRCRAFT DATA SAMPLE:
${aircraftData.slice(0, 5).map(ac => 
  `- ${ac.callsign || ac.icao24}: ${ac.altitude || 'N/A'}ft, ${ac.speed || 'N/A'}kts`
).join('\n')}

TASK:
1. Understand what the user is asking for
2. Filter relevant aircraft based on the query
3. Provide insights and recommendations
4. Respond in a helpful, professional manner

Respond in this exact JSON format:
{
  "response": "Direct answer to the query",
  "filtered_aircraft": [list of relevant aircraft ICAO24s],
  "total_matches": 0,
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"]
}`;
  }

  /**
   * Build prompt for incident summary generation
   */
  buildSummaryPrompt(watchlistAircraft, context) {
    const airport = context.selected_airport || 'Unknown';
    const timestamp = new Date().toISOString();

    return `You are an expert ATC supervisor. Generate a comprehensive summary of watchlisted aircraft behavior.

TIMESTAMP: ${timestamp}
AIRPORT: ${airport}
WATCHLIST AIRCRAFT: ${watchlistAircraft.length}

AIRCRAFT DETAILS:
${watchlistAircraft.map(ac => 
  `- ${ac.callsign || ac.icao24}: ${ac.altitude || 'N/A'}ft, ${ac.speed || 'N/A'}kts, Status: ${ac.status}`
).join('\n')}

Generate a professional ATC summary including:
1. Overall situation assessment
2. Key behavioral patterns
3. Risk assessment
4. Recommended actions

Respond in this exact JSON format:
{
  "summary": "Overall situation description",
  "key_patterns": ["pattern1", "pattern2"],
  "risk_level": "low|medium|high|critical",
  "recommendations": ["action1", "action2"],
  "priority_aircraft": [list of ICAO24s requiring immediate attention]
}`;
  }

  /**
   * Parse aircraft analysis response from Cerebras
   */
  parseAircraftAnalysis(responseText, aircraft) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          status: parsed.status || 'monitoring',
          summary: parsed.summary || 'No analysis available',
          concerns: parsed.concerns || [],
          confidence: parsed.confidence || 50,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to parse aircraft analysis:', error);
    }

    return this.getFallbackAnalysis(aircraft);
  }

  /**
   * Parse query response from Cerebras
   */
  parseQueryResponse(responseText, query, aircraftData, context) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Filter aircraft based on response
        const filteredAircraft = aircraftData.filter(ac => 
          parsed.filtered_aircraft && parsed.filtered_aircraft.includes(ac.icao24)
        );

        return {
          response: parsed.response || 'Unable to process query',
          filtered_aircraft: filteredAircraft,
          total_matches: parsed.total_matches || 0,
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || []
        };
      }
    } catch (error) {
      console.error('Failed to parse query response:', error);
    }

    return this.getFallbackQueryResponse(query, aircraftData);
  }

  /**
   * Parse summary response from Cerebras
   */
  parseSummaryResponse(responseText, watchlistAircraft) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'No summary available',
          key_patterns: parsed.key_patterns || [],
          risk_level: parsed.risk_level || 'low',
          recommendations: parsed.recommendations || [],
          priority_aircraft: parsed.priority_aircraft || [],
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to parse summary response:', error);
    }

    return this.getFallbackSummary(watchlistAircraft);
  }

  /**
   * Fallback analysis when AI service is unavailable
   */
  getFallbackAnalysis(aircraft) {
    const altitude = aircraft.altitude || 0;
    const speed = aircraft.speed || 0;
    
    let status = 'normal';
    let concerns = [];
    
    // Basic rule-based analysis
    if (altitude > 0 && altitude < 1000) {
      status = 'concerning';
      concerns.push('Very low altitude');
    }
    
    if (speed > 0 && speed > 500) {
      status = 'concerning';
      concerns.push('High speed');
    }
    
    if (altitude === 0 && speed === 0) {
      status = 'monitoring';
      concerns.push('No movement data');
    }

    return {
      status,
      summary: `Aircraft ${aircraft.callsign || aircraft.icao24} is ${status}`,
      concerns,
      confidence: 60,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback query response when AI service is unavailable
   */
  getFallbackQueryResponse(query, aircraftData) {
    return {
      response: `I received your query: "${query}". AI analysis is currently unavailable, but I can see ${aircraftData.length} aircraft in the system.`,
      filtered_aircraft: [],
      total_matches: 0,
      insights: ['AI service unavailable - using basic functionality'],
      recommendations: ['Enable AI service for advanced analysis']
    };
  }

  /**
   * Fallback summary when AI service is unavailable
   */
  getFallbackSummary(watchlistAircraft) {
    return {
      summary: `Currently monitoring ${watchlistAircraft.length} aircraft. AI analysis unavailable.`,
      key_patterns: ['Basic monitoring active'],
      risk_level: 'low',
      recommendations: ['Enable AI service for detailed analysis'],
      priority_aircraft: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if the AI service is available
   */
  async checkServiceHealth() {
    return this.isInitialized;
  }

  /**
   * Get analysis history for an aircraft
   */
  getAnalysisHistory(icao24) {
    return this.analysisHistory.get(icao24) || null;
  }

  /**
   * Clear analysis history
   */
  clearHistory() {
    this.analysisHistory.clear();
  }
}

// Create singleton instance
const aiAnalysisService = new AIAnalysisService();

export default aiAnalysisService;


