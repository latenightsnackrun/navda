"""
Cerebras AI Service with LangChain Agentic Flow
Advanced aircraft analysis and natural language processing for ATC systems
"""

import os
import json
import asyncio
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

import httpx
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_community.chat_models import ChatOpenAI

# Import logging service
from .logging_service import logging_service, LogLevel

class AircraftStatusEnum(str, Enum):
    NORMAL = "normal"
    CONCERNING = "concerning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class QueryTypeEnum(str, Enum):
    ANALYSIS = "analysis"
    FILTER = "filter"
    SUMMARY = "summary"
    ALERT = "alert"

@dataclass
class AircraftMetrics:
    altitude_deviation: float
    speed_variance: float
    heading_changes: int
    vertical_rate_anomaly: float
    pattern_score: float

class AircraftAnalysis(BaseModel):
    status: AircraftStatusEnum
    summary: str
    concerns: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    metrics: Optional[Dict[str, float]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class QueryResponse(BaseModel):
    query_type: QueryTypeEnum
    response: str
    filtered_aircraft: List[Dict] = Field(default_factory=list)
    total_matches: int = 0
    insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class CerebrasAIService:
    """
    Advanced AI service using Cerebras for aircraft analysis with LangChain agentic workflows
    """
    
    def __init__(self):
        self.logger = logging_service
        self.cerebras_api_key = os.getenv('CEREBRAS_API_KEY')
        self.cerebras_base_url = "https://api.cerebras.ai/v1"
        self.client = None
        self.initialized = False
        
        # LangChain components
        self.analysis_chain = None
        self.query_chain = None
        self.filter_chain = None
        
        # Aircraft data cache
        self.aircraft_cache = {}
        self.pattern_history = {}
        
    async def initialize(self):
        """Initialize the AI service with Cerebras and LangChain"""
        if self.initialized:
            return
            
        try:
            if not self.cerebras_api_key:
                openai_key = os.getenv('OPENAI_API_KEY')
                if openai_key:
                    self.logger.log(LogLevel.WARNING, "cerebras_ai", "No CEREBRAS_API_KEY found, using OpenAI fallback")
                    # Use OpenAI as fallback for development
                    self.client = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.3,
                        openai_api_key=openai_key
                    )
                else:
                    self.logger.log(LogLevel.WARNING, "cerebras_ai", "No API keys found, using local analysis only")
                    self.client = None
            else:
                # Use Cerebras with custom HTTP client
                self.client = ChatOpenAI(
                    model="llama3.1-70b",
                    temperature=0.3,
                    openai_api_base=self.cerebras_base_url,
                    openai_api_key=self.cerebras_api_key,
                    model_kwargs={"stop": None}
                )
            
            if self.client:
                await self._setup_langchain_chains()
            else:
                self.analysis_chain = None
                self.query_chain = None
            
            self.initialized = True
            self.logger.log(LogLevel.INFO, "cerebras_ai", "Cerebras AI service initialized successfully")
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "cerebras_ai", f"Failed to initialize Cerebras AI service: {str(e)}")
            raise
    
    async def _setup_langchain_chains(self):
        """Setup LangChain chains for different AI tasks"""
        
        # Aircraft Analysis Chain
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert ATC analyst AI. Analyze aircraft behavior and provide detailed assessments.
            
            Your analysis should consider:
            - Altitude patterns and deviations
            - Speed consistency and variations  
            - Heading changes and flight path
            - Vertical rate anomalies
            - Communication patterns
            - Weather and traffic context
            
            Respond in valid JSON format only."""),
            ("user", """Analyze this aircraft:
            
            Aircraft Data: {aircraft_data}
            Historical Context: {historical_data}
            Current Traffic: {traffic_context}
            
            Provide analysis in this exact JSON format:
            {{
                "status": "normal|concerning|critical|emergency",
                "summary": "Brief professional ATC summary",
                "concerns": ["list of specific concerns"],
                "recommendations": ["actionable recommendations"],
                "confidence": 0.95,
                "metrics": {{"pattern_score": 0.8, "deviation_level": 0.3}}
            }}""")
        ])
        
        # Natural Language Query Chain
        query_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an intelligent ATC query processor. Parse natural language queries about aircraft data and provide structured responses.
            
            Query types you handle:
            - Aircraft filtering ("show flights above 30000ft")
            - Pattern analysis ("find unusual behavior") 
            - Summaries ("generate watchlist summary")
            - Alerts ("critical aircraft")
            
            Always provide actionable ATC insights."""),
            ("user", """Process this query about aircraft data:
            
            Query: {query}
            Aircraft Data: {aircraft_data}
            Current Context: {context}
            
            Provide response in this JSON format:
            {{
                "query_type": "analysis|filter|summary|alert",
                "response": "Clear natural language response",
                "filtered_aircraft": [list of matching aircraft],
                "total_matches": number,
                "insights": ["key insights"],
                "recommendations": ["actionable items"]
            }}""")
        ])
        
        # Setup chains with output parsers
        json_parser = JsonOutputParser()
        
        self.analysis_chain = (
            analysis_prompt 
            | self.client 
            | StrOutputParser()
            | RunnableLambda(self._safe_json_parse)
        )
        
        self.query_chain = (
            query_prompt
            | self.client
            | StrOutputParser() 
            | RunnableLambda(self._safe_json_parse)
        )
    
    def _safe_json_parse(self, text: str) -> Dict:
        """Safely parse JSON with fallback"""
        try:
            # Clean up the text
            text = text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()
            
            return json.loads(text)
        except json.JSONDecodeError as e:
            self.logger.log(LogLevel.WARNING, "cerebras_ai", f"JSON parse error: {e}, text: {text[:200]}")
            return self._create_fallback_response(text)
    
    def _create_fallback_response(self, text: str) -> Dict:
        """Create fallback response when JSON parsing fails"""
        return {
            "status": "normal",
            "summary": f"Analysis completed: {text[:100]}...",
            "concerns": [],
            "recommendations": ["Review manually"],
            "confidence": 0.7,
            "response": text,
            "query_type": "analysis"
        }
    
    async def analyze_aircraft_behavior(self, aircraft_data: Dict, context: Dict = None) -> AircraftAnalysis:
        """
        Advanced aircraft behavior analysis using AI agents
        
        Args:
            aircraft_data: Aircraft information
            context: Additional context (traffic, weather, etc.)
        
        Returns:
            Detailed aircraft analysis
        """
        await self.initialize()
        
        try:
            # Enhance aircraft data with computed metrics
            enhanced_data = await self._enhance_aircraft_data(aircraft_data)
            
            # If no AI client available, use fallback
            if not self.client or not self.analysis_chain:
                return self._create_fallback_analysis(aircraft_data)
            
            # Get historical context
            historical_data = self._get_historical_context(aircraft_data.get('icao24'))
            
            # Prepare traffic context
            traffic_context = context or {}
            
            # Run analysis chain
            chain_input = {
                "aircraft_data": json.dumps(enhanced_data, indent=2),
                "historical_data": json.dumps(historical_data, indent=2),
                "traffic_context": json.dumps(traffic_context, indent=2)
            }
            
            result = await self.analysis_chain.ainvoke(chain_input)
            
            # Validate and create analysis object
            analysis = AircraftAnalysis(**result)
            
            # Cache result for pattern tracking
            self._cache_aircraft_analysis(aircraft_data.get('icao24'), analysis)
            
            self.logger.log(LogLevel.INFO, "cerebras_ai", f"Aircraft analysis completed: {aircraft_data.get('callsign', 'Unknown')} - {analysis.status}")
            
            return analysis
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "cerebras_ai", f"Aircraft analysis failed: {str(e)}")
            return self._create_fallback_analysis(aircraft_data, str(e))
    
    async def process_natural_language_query(self, query: str, aircraft_data: List[Dict], context: Dict = None) -> QueryResponse:
        """
        Process natural language queries with intelligent filtering and analysis
        
        Args:
            query: Natural language query
            aircraft_data: Current aircraft data
            context: Additional context
            
        Returns:
            Structured query response
        """
        await self.initialize()
        
        try:
            # Pre-process query to determine intent
            query_intent = self._analyze_query_intent(query)
            
            # Filter relevant aircraft based on query
            relevant_aircraft = await self._pre_filter_aircraft(query, aircraft_data)
            
            # If no AI client available, use fallback
            if not self.client or not self.query_chain:
                return self._create_fallback_query_response(query, None, relevant_aircraft)
            
            # Prepare context
            query_context = {
                "intent": query_intent,
                "aircraft_count": len(aircraft_data),
                "relevant_count": len(relevant_aircraft),
                **(context or {})
            }
            
            # Run query processing chain
            chain_input = {
                "query": query,
                "aircraft_data": json.dumps(relevant_aircraft[:20], indent=2),  # Limit for token efficiency
                "context": json.dumps(query_context, indent=2)
            }
            
            result = await self.query_chain.ainvoke(chain_input)
            
            # Enhance result with additional processing
            enhanced_result = await self._enhance_query_result(result, query, aircraft_data)
            
            # Create response object
            response = QueryResponse(**enhanced_result)
            
            self.logger.log(LogLevel.INFO, "cerebras_ai", f"Query processed: '{query}' -> {response.total_matches} matches")
            
            return response
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "cerebras_ai", f"Query processing failed: {str(e)}")
            return self._create_fallback_query_response(query, str(e), [])
    
    async def generate_incident_summary(self, aircraft_data: Dict, analysis: AircraftAnalysis) -> str:
        """Generate concise ATC incident summary"""
        await self.initialize()
        
        try:
            callsign = aircraft_data.get('callsign', 'UNKNOWN')
            
            # Use a simple template for summaries
            if analysis.status == AircraftStatusEnum.CRITICAL:
                template = f"🚨 CRITICAL: Flight {callsign} - {analysis.summary}"
            elif analysis.status == AircraftStatusEnum.CONCERNING:
                template = f"⚠️ ALERT: Flight {callsign} - {analysis.summary}"
            else:
                template = f"✅ NORMAL: Flight {callsign} - {analysis.summary}"
            
            return template
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "cerebras_ai", f"Summary generation failed: {str(e)}")
            return f"Flight {aircraft_data.get('callsign', 'UNKNOWN')} - Summary unavailable"
    
    async def _enhance_aircraft_data(self, aircraft_data: Dict) -> Dict:
        """Enhance aircraft data with computed metrics"""
        enhanced = aircraft_data.copy()
        
        # Calculate metrics
        altitude = aircraft_data.get('altitude', 0) or 0
        speed = aircraft_data.get('speed', 0) or 0
        vertical_rate = aircraft_data.get('vertical_rate', 0) or 0
        
        # Add computed fields
        enhanced['altitude_band'] = self._get_altitude_band(altitude)
        enhanced['speed_category'] = self._get_speed_category(speed)
        enhanced['climb_descent_phase'] = self._get_flight_phase(vertical_rate)
        enhanced['risk_score'] = self._calculate_risk_score(aircraft_data)
        
        return enhanced
    
    def _get_altitude_band(self, altitude: float) -> str:
        """Categorize altitude into bands"""
        if altitude < 1000:
            return "low_altitude"
        elif altitude < 10000:
            return "medium_altitude"
        elif altitude < 30000:
            return "high_altitude"
        else:
            return "very_high_altitude"
    
    def _get_speed_category(self, speed: float) -> str:
        """Categorize speed"""
        if speed < 100:
            return "slow"
        elif speed < 300:
            return "normal"
        elif speed < 500:
            return "fast"
        else:
            return "very_fast"
    
    def _get_flight_phase(self, vertical_rate: float) -> str:
        """Determine flight phase from vertical rate"""
        if abs(vertical_rate) < 100:
            return "cruise"
        elif vertical_rate > 500:
            return "climb"
        elif vertical_rate < -500:
            return "descent"
        else:
            return "level"
    
    def _calculate_risk_score(self, aircraft_data: Dict) -> float:
        """Calculate basic risk score"""
        score = 0.0
        
        altitude = aircraft_data.get('altitude', 0) or 0
        speed = aircraft_data.get('speed', 0) or 0
        vertical_rate = aircraft_data.get('vertical_rate', 0) or 0
        
        # Low altitude + high speed = risk
        if altitude < 1000 and speed > 200:
            score += 0.3
        
        # Rapid climb/descent
        if abs(vertical_rate) > 2000:
            score += 0.4
        
        # Very high altitude
        if altitude > 40000:
            score += 0.2
        
        # Excessive speed
        if speed > 500:
            score += 0.3
        
        return min(score, 1.0)
    
    def _analyze_query_intent(self, query: str) -> str:
        """Analyze query intent"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['filter', 'show', 'find', 'list']):
            return 'filter'
        elif any(word in query_lower for word in ['analyze', 'behavior', 'pattern']):
            return 'analysis'
        elif any(word in query_lower for word in ['summary', 'report', 'overview']):
            return 'summary'
        elif any(word in query_lower for word in ['alert', 'critical', 'emergency', 'concern']):
            return 'alert'
        else:
            return 'general'
    
    async def _pre_filter_aircraft(self, query: str, aircraft_data: List[Dict]) -> List[Dict]:
        """Pre-filter aircraft based on query keywords"""
        query_lower = query.lower()
        
        # Altitude filters
        if 'high altitude' in query_lower or 'above' in query_lower:
            return [a for a in aircraft_data if (a.get('altitude') or 0) > 30000]
        
        # Speed filters
        if 'fast' in query_lower or 'speed' in query_lower:
            return [a for a in aircraft_data if (a.get('speed') or 0) > 400]
        
        # Descent filters
        if 'descending' in query_lower or 'descent' in query_lower:
            return [a for a in aircraft_data if (a.get('vertical_rate') or 0) < -500]
        
        # Return all if no specific filters
        return aircraft_data
    
    async def _enhance_query_result(self, result: Dict, query: str, aircraft_data: List[Dict]) -> Dict:
        """Enhance query result with additional insights"""
        enhanced = result.copy()
        
        # Add statistical insights
        if 'filtered_aircraft' in enhanced:
            filtered = enhanced['filtered_aircraft']
            enhanced['total_matches'] = len(filtered)
            
            if filtered:
                # Calculate statistics
                altitudes = [a.get('altitude', 0) for a in filtered if a.get('altitude')]
                speeds = [a.get('speed', 0) for a in filtered if a.get('speed')]
                
                if altitudes:
                    enhanced['insights'] = enhanced.get('insights', [])
                    enhanced['insights'].append(f"Average altitude: {sum(altitudes)/len(altitudes):.0f}ft")
                
                if speeds:
                    enhanced['insights'] = enhanced.get('insights', [])
                    enhanced['insights'].append(f"Average speed: {sum(speeds)/len(speeds):.0f}kts")
        
        return enhanced
    
    def _get_historical_context(self, icao24: str) -> Dict:
        """Get historical context for aircraft"""
        return self.pattern_history.get(icao24, {
            "previous_analyses": [],
            "pattern_score": 0.5,
            "risk_trend": "stable"
        })
    
    def _cache_aircraft_analysis(self, icao24: str, analysis: AircraftAnalysis):
        """Cache analysis for pattern tracking"""
        if icao24:
            if icao24 not in self.pattern_history:
                self.pattern_history[icao24] = {"previous_analyses": []}
            
            self.pattern_history[icao24]["previous_analyses"].append({
                "timestamp": analysis.timestamp.isoformat(),
                "status": analysis.status,
                "confidence": analysis.confidence
            })
            
            # Keep only last 10 analyses
            self.pattern_history[icao24]["previous_analyses"] = \
                self.pattern_history[icao24]["previous_analyses"][-10:]
    
    def _create_fallback_analysis(self, aircraft_data: Dict, error: str = None) -> AircraftAnalysis:
        """Create fallback analysis"""
        return AircraftAnalysis(
            status=AircraftStatusEnum.NORMAL,
            summary=f"Flight {aircraft_data.get('callsign', 'Unknown')} - Basic analysis",
            concerns=[],
            recommendations=["Monitor normally"],
            confidence=0.6,
            metrics={"risk_score": self._calculate_risk_score(aircraft_data)}
        )
    
    def _create_fallback_query_response(self, query: str, error: str = None, filtered_aircraft: List[Dict] = None) -> QueryResponse:
        """Create fallback query response"""
        filtered = filtered_aircraft or []
        
        response_text = f"Query processed locally: '{query}'\n\n"
        
        if filtered:
            response_text += f"Found {len(filtered)} matching aircraft based on simple filtering.\n"
            response_text += "Note: Advanced AI analysis is not available."
        else:
            response_text += "Basic filtering applied. For advanced analysis, please configure AI service."
        
        return QueryResponse(
            query_type=QueryTypeEnum.ANALYSIS,
            response=response_text,
            filtered_aircraft=filtered,
            total_matches=len(filtered),
            insights=["Using local filtering only", "AI service not configured"],
            recommendations=["Configure CEREBRAS_API_KEY or OPENAI_API_KEY for advanced analysis"]
        )

# Create singleton instance
cerebras_ai_service = CerebrasAIService()
