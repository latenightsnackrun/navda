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
    ACTION = "action"
    ADD_TO_WATCHLIST = "add_to_watchlist"
    REMOVE_FROM_WATCHLIST = "remove_from_watchlist"
    ANALYZE_SPECIFIC = "analyze_specific"

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
    actions: List[Dict] = Field(default_factory=list)  # Actions to perform
    target_aircraft: Optional[Dict] = None  # Specific aircraft for actions
    updated_context: Optional[Dict] = None  # Updated conversation context

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
        
        # Context memory for conversation
        self.conversation_context = {
            "last_mentioned_aircraft": None,
            "last_query_type": None,
            "recent_aircraft": []
        }
        
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
            
            Your analysis should consider ALL available aircraft data:
            - Position and movement (lat/lon, altitude, velocity, heading, vertical_rate)
            - Navigation data (squawk, nav_heading, nav_altitude_mcp/fms, nav_qnh, nav_modes)
            - Speed and performance (ias, tas, mach, gs, mag_heading, true_heading)
            - Environmental data (wind direction/speed, outside air temp, roll, gps_altitude, baro/geom_rate)
            - Aircraft information (type, category, wake_turb, manufacturer, model, year, engine_count/type)
            - Operator data (operator, owner, icao/iata codes, callsigns)
            - Status flags (test, special, military, interesting, alert, emergency, silent)
            - Technical data (rssi, dbm, seen timestamps, messages, mlat)
            - Altitude history patterns and trends
            - Communication patterns and squawk codes
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
            ("system", """You are an intelligent ATC query processor and action executor. Parse natural language queries about aircraft data and provide structured responses with executable actions.
            
            You have access to comprehensive aircraft data including:
            - Position, altitude, speed, heading, vertical rate
            - Navigation data (squawk, nav modes, altitude settings)
            - Performance data (IAS, TAS, Mach, ground speed)
            - Environmental data (wind, temperature, roll)
            - Aircraft details (type, manufacturer, operator, year)
            - Status flags (emergency, military, special, alert)
            - Technical data (signal strength, message counts)
            - Altitude history and patterns
            
            Query types you handle:
            - Aircraft filtering ("show flights above 30000ft", "find military aircraft")
            - Pattern analysis ("find unusual behavior", "detect altitude deviations") 
            - Summaries ("generate watchlist summary", "analyze traffic patterns")
            - Alerts ("critical aircraft", "emergency situations")
            - Performance analysis ("analyze climb rates", "check speed consistency")
            - Actions ("add 233LA to watchlist", "analyze flight behavior of ABC123", "remove XYZ789 from watchlist")
            
            For action queries, identify the specific aircraft by callsign, ICAO24, or registration and provide executable actions.
            Always provide actionable ATC insights based on ALL available data."""),
            ("user", """Process this query about aircraft data:
            
            Query: {query}
            Aircraft Data: {aircraft_data}
            Current Context: {context}
            
            Provide response in this JSON format:
            {{
                "query_type": "analysis|filter|summary|alert|action|add_to_watchlist|remove_from_watchlist|analyze_specific",
                "response": "Clear natural language response",
                "filtered_aircraft": [list of matching aircraft],
                "total_matches": number,
                "insights": ["key insights"],
                "recommendations": ["actionable items"],
                "actions": [{{"type": "add_to_watchlist|remove_from_watchlist|analyze", "aircraft_icao24": "string"}}],
                "target_aircraft": {{"icao24": "string", "callsign": "string"}}
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
            self.logger.log(LogLevel.INFO, "cerebras_ai", f"Query intent detected: '{query_intent}' for query: '{query}'")
            
            # Handle action-based queries
            if query_intent in ['add_to_watchlist', 'remove_from_watchlist', 'analyze_specific']:
                self.logger.log(LogLevel.INFO, "cerebras_ai", f"Routing to action handler for intent: {query_intent}")
                return await self._handle_action_query(query, query_intent, aircraft_data, context)
            
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
    
    async def _handle_action_query(self, query: str, intent: str, aircraft_data: List[Dict], context: Dict = None) -> QueryResponse:
        """Handle action-based queries like adding/removing from watchlist"""
        try:
            self.logger.log(LogLevel.INFO, "cerebras_ai", f"Handling action query: '{query}' with intent: {intent}")
            
            # Get conversation context from request
            conversation_context = context.get('conversation_context', {}) if context else {}
            
            # Check for context references first
            query_lower = query.lower().strip()
            aircraft_identifier = None
            
            # Handle context references like "add it", "analyze that", etc.
            if any(ref in query_lower for ref in ['it', 'that', 'this', 'the last one', 'previous']):
                if conversation_context.get("lastMentionedAircraft"):
                    aircraft_identifier = conversation_context["lastMentionedAircraft"]
                    self.logger.log(LogLevel.INFO, "cerebras_ai", f"Using context reference: {aircraft_identifier}")
                else:
                    return QueryResponse(
                        query_type=QueryTypeEnum.ACTION,
                        response="No previous aircraft mentioned. Please specify a callsign, ICAO24, or registration.",
                        filtered_aircraft=[],
                        total_matches=0,
                        insights=["Use format: 'add ABC123 to watchlist' or 'analyze flight behavior of XYZ789'"],
                        recommendations=["Specify aircraft by callsign, ICAO24, or registration"]
                    )
            
            # Extract aircraft identifier from query - improved logic
            if not aircraft_identifier:
                words = query.split()
                
                # Look for aircraft identifiers in the query
                for word in words:
                    # Clean the word (remove punctuation)
                    clean_word = ''.join(c for c in word if c.isalnum())
                    if len(clean_word) >= 3:  # Aircraft identifiers are usually 3+ characters
                        found_aircraft = self._find_aircraft_by_identifier(clean_word, aircraft_data)
                        if found_aircraft:
                            aircraft_identifier = clean_word
                            break
            
            # If still not found, try to extract from common patterns
            if not aircraft_identifier:
                import re
                # Look for patterns like "233LA", "ABC123", "N123AB", etc.
                patterns = [
                    r'\b\d{2,3}[A-Z]{2,3}\b',         # Like 233LA, 123AB
                    r'\b[A-Z]{2,3}\d{2,4}[A-Z]?\b',    # Like ABC123, 223LA
                    r'\b[A-Z]\d{2,4}[A-Z]{1,3}\b',     # Like N123AB
                    r'\b[A-Z]{3,6}\d{2,4}\b',          # Like SWA1234
                    r'\b[A-Z]{2,4}\d{2,4}[A-Z]?\b',    # Like AC1234
                    r'\b[A-Z]{2,6}\b',                 # Like SWA, UAL, etc.
                    r'\b[A-Z]\d{2,4}\b'                # Like A123, B456
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, query.upper())
                    for match in matches:
                        found_aircraft = self._find_aircraft_by_identifier(match, aircraft_data)
                        if found_aircraft:
                            aircraft_identifier = match
                            break
                    if aircraft_identifier:
                        break
            
            if not aircraft_identifier:
                # Get available aircraft for suggestions
                available_callsigns = [ac.get('callsign', 'N/A') for ac in aircraft_data[:10] if ac.get('callsign')]
                suggestions_text = f"Available aircraft: {', '.join(available_callsigns[:5])}" if available_callsigns else "No aircraft data available"
                
                return QueryResponse(
                    query_type=QueryTypeEnum.ACTION,
                    response=f"Could not find aircraft '{query}' in current data.\n\n{suggestions_text}\n\nTry using one of the available callsigns above.",
                    filtered_aircraft=aircraft_data[:5],  # Show some available aircraft
                    total_matches=len(aircraft_data[:5]),
                    insights=["Aircraft may not be in range or may have landed", f"Found {len(aircraft_data)} total aircraft in area"],
                    recommendations=["Use exact callsign from available aircraft", "Check if aircraft is in range"]
                )
            
            target_aircraft = self._find_aircraft_by_identifier(aircraft_identifier, aircraft_data)
            self.logger.log(LogLevel.INFO, "cerebras_ai", f"Found aircraft identifier: '{aircraft_identifier}', target_aircraft: {target_aircraft is not None}")
            
            if not target_aircraft:
                return QueryResponse(
                    query_type=QueryTypeEnum.ACTION,
                    response=f"Aircraft '{aircraft_identifier}' not found in current data.",
                    filtered_aircraft=[],
                    total_matches=0,
                    insights=["Aircraft may not be in range or may have landed"],
                    recommendations=["Check aircraft callsign, ICAO24, or registration"]
                )
            
            # Update conversation context for future references
            updated_context = {
                "lastMentionedAircraft": aircraft_identifier,
                "lastQueryType": intent,
                "recentAircraft": conversation_context.get("recentAircraft", [])
            }
            
            # Add current aircraft to recent list if not already there
            if target_aircraft not in updated_context["recentAircraft"]:
                updated_context["recentAircraft"].append(target_aircraft)
                # Keep only last 5 aircraft
                updated_context["recentAircraft"] = updated_context["recentAircraft"][-5:]
            
            # Generate appropriate response based on intent
            if intent == 'add_to_watchlist':
                callsign = target_aircraft.get('callsign', aircraft_identifier)
                altitude = target_aircraft.get('altitude', 0)
                speed = target_aircraft.get('velocity', 0)
                
                # Create more intelligent response
                response_text = f"Ready to add {callsign} to watchlist for monitoring."
                
                # Add flight phase analysis
                if altitude > 30000:
                    response_text += f"\n\n{callsign} is at cruise altitude ({altitude:,}ft) at {speed}kt"
                elif altitude > 10000:
                    response_text += f"\n\n{callsign} is in climb/descent phase ({altitude:,}ft) at {speed}kt"
                else:
                    response_text += f"\n\n{callsign} is in approach phase ({altitude:,}ft) at {speed}kt"
                
                return QueryResponse(
                    query_type=QueryTypeEnum.ADD_TO_WATCHLIST,
                    response=response_text,
                    filtered_aircraft=[target_aircraft],
                    total_matches=1,
                    actions=[{"type": "add_to_watchlist", "aircraft_icao24": target_aircraft.get('icao24')}],
                    target_aircraft=target_aircraft,
                    updated_context=updated_context,
                    insights=[f"Aircraft: {callsign}", 
                             f"Altitude: {altitude:,}ft",
                             f"Speed: {speed}kt",
                             f"Phase: {'Cruise' if altitude > 30000 else 'Climb/Descent' if altitude > 10000 else 'Approach'}"],
                    recommendations=["Aircraft will be added to watchlist for continuous monitoring"]
                )
            
            elif intent == 'remove_from_watchlist':
                return QueryResponse(
                    query_type=QueryTypeEnum.REMOVE_FROM_WATCHLIST,
                    response=f"Ready to remove {target_aircraft.get('callsign', aircraft_identifier)} from watchlist.",
                    filtered_aircraft=[target_aircraft],
                    total_matches=1,
                    actions=[{"type": "remove_from_watchlist", "aircraft_icao24": target_aircraft.get('icao24')}],
                    target_aircraft=target_aircraft,
                    insights=[f"Aircraft: {target_aircraft.get('callsign', 'Unknown')}"],
                    recommendations=["Aircraft will be removed from watchlist"]
                )
            
            elif intent == 'analyze_specific':
                return QueryResponse(
                    query_type=QueryTypeEnum.ANALYZE_SPECIFIC,
                    response=f"🔍 Analyzing flight behavior of {target_aircraft.get('callsign', aircraft_identifier)}...",
                    filtered_aircraft=[target_aircraft],
                    total_matches=1,
                    actions=[{"type": "analyze", "aircraft_icao24": target_aircraft.get('icao24')}],
                    target_aircraft=target_aircraft,
                    insights=[f"Aircraft: {target_aircraft.get('callsign', 'Unknown')}", 
                             f"Current altitude: {target_aircraft.get('altitude', 'N/A')}ft",
                             f"Current speed: {target_aircraft.get('velocity', 'N/A')}kt",
                             f"Vertical rate: {target_aircraft.get('vertical_rate', 'N/A')} ft/min"],
                    recommendations=["Performing detailed behavior analysis"]
                )
            
            else:
                return QueryResponse(
                    query_type=QueryTypeEnum.ACTION,
                    response=f"❓ Action not recognized: {intent}",
                    filtered_aircraft=[],
                    total_matches=0,
                    insights=["Supported actions: add to watchlist, remove from watchlist, analyze specific aircraft"],
                    recommendations=["Use clear action commands"]
                )
                
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "cerebras_ai", f"Action query handling failed: {str(e)}")
            return QueryResponse(
                query_type=QueryTypeEnum.ACTION,
                response=f"Action processing failed: {str(e)}",
                filtered_aircraft=[],
                total_matches=0,
                insights=["Please try again with a clearer command"],
                recommendations=["Use format: 'add ABC123 to watchlist' or 'analyze XYZ789'"]
            )
    
    async def generate_incident_summary(self, aircraft_data: Dict, analysis: AircraftAnalysis) -> str:
        """Generate concise ATC incident summary"""
        await self.initialize()
        
        try:
            callsign = aircraft_data.get('callsign', 'UNKNOWN')
            
            # Use a simple template for summaries
            if analysis.status == AircraftStatusEnum.CRITICAL:
                template = f"CRITICAL: Flight {callsign} - {analysis.summary}"
            elif analysis.status == AircraftStatusEnum.CONCERNING:
                template = f"ALERT: Flight {callsign} - {analysis.summary}"
            else:
                template = f"NORMAL: Flight {callsign} - {analysis.summary}"
            
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
        """Analyze query intent with improved natural language understanding"""
        query_lower = query.lower().strip()
        
        # Action-based queries - check for specific patterns first
        if ('add' in query_lower and 'watchlist' in query_lower) or ('add' in query_lower and 'monitor' in query_lower):
            return 'add_to_watchlist'
        elif ('add' in query_lower and any(ref in query_lower for ref in ['it', 'that', 'this', 'the last one', 'previous'])):
            return 'add_to_watchlist'
        elif ('remove' in query_lower and 'watchlist' in query_lower) or ('remove' in query_lower and 'from' in query_lower):
            return 'remove_from_watchlist'
        elif ('remove' in query_lower and any(ref in query_lower for ref in ['it', 'that', 'this', 'the last one', 'previous'])):
            return 'remove_from_watchlist'
        elif ('analyze' in query_lower and ('behavior' in query_lower or 'flight' in query_lower or 'of' in query_lower)):
            return 'analyze_specific'
        elif ('analyze' in query_lower and any(ref in query_lower for ref in ['it', 'that', 'this', 'the last one', 'previous'])):
            return 'analyze_specific'
        
        # Specific aircraft analysis queries
        elif any(phrase in query_lower for phrase in [
            'tell me about', 'analyze', 'show me', 'what about', 'info about'
        ]):
            return 'analysis'
        
        # Summary and overview queries
        elif any(phrase in query_lower for phrase in [
            'summary', 'overview', 'at least give me a summary', 'give me a summary',
            'show me a summary', 'aircraft summary', 'traffic summary'
        ]):
            return 'summary'
        
        # Filter and search queries
        elif any(phrase in query_lower for phrase in [
            'show me', 'find', 'list', 'filter', 'search', 'airborne aircraft',
            'show some', 'give me some', 'at least give me'
        ]):
            return 'filter'
        
        # Analysis queries
        elif any(word in query_lower for word in ['analyze', 'behavior', 'pattern', 'analysis']):
            return 'analysis'
        
        # Alert queries
        elif any(word in query_lower for word in ['alert', 'critical', 'emergency', 'concern', 'problem']):
            return 'alert'
        
        # Default to general
        else:
            return 'general'
    
    def _find_aircraft_by_identifier(self, query: str, aircraft_data: List[Dict]) -> Optional[Dict]:
        """Find aircraft by callsign, ICAO24, or registration with improved matching"""
        query_upper = query.upper().strip()
        
        # Try exact matches first
        for aircraft in aircraft_data:
            if aircraft.get('callsign') and aircraft.get('callsign').upper().strip() == query_upper:
                return aircraft
        
        for aircraft in aircraft_data:
            if aircraft.get('icao24') and aircraft.get('icao24').upper().strip() == query_upper:
                return aircraft
        
        for aircraft in aircraft_data:
            if aircraft.get('registration') and aircraft.get('registration').upper().strip() == query_upper:
                return aircraft
        
        # Try partial matches (substring)
        for aircraft in aircraft_data:
            callsign = aircraft.get('callsign', '').upper().strip()
            icao24 = aircraft.get('icao24', '').upper().strip()
            registration = aircraft.get('registration', '').upper().strip()
            
            if (callsign and query_upper in callsign) or \
               (icao24 and query_upper in icao24) or \
               (registration and query_upper in registration):
                return aircraft
        
        # Try fuzzy matching for similar callsigns
        for aircraft in aircraft_data:
            callsign = aircraft.get('callsign', '').upper().strip()
            if callsign and self._fuzzy_match(query_upper, callsign):
                return aircraft
        
        return None
    
    def _fuzzy_match(self, query: str, callsign: str) -> bool:
        """Simple fuzzy matching for aircraft callsigns"""
        if len(query) < 3 or len(callsign) < 3:
            return False
        
        # Check if query is contained in callsign or vice versa
        if query in callsign or callsign in query:
            return True
        
        # Check for similar patterns (e.g., "233LA" vs "223LA")
        if len(query) == len(callsign):
            differences = sum(1 for a, b in zip(query, callsign) if a != b)
            return differences <= 1  # Allow 1 character difference
        
        return False

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
        """Create fallback query response with intelligent local analysis"""
        filtered = filtered_aircraft or []
        query_lower = query.lower()
        
        # Enhanced local analysis based on query type
        if 'summary' in query_lower or 'overview' in query_lower:
            if filtered:
                altitudes = [a.get('altitude', 0) for a in filtered if a.get('altitude') and a.get('altitude') > 0]
                speeds = [a.get('velocity', 0) for a in filtered if a.get('velocity') and a.get('velocity') > 0]
                airborne = [a for a in filtered if not a.get('on_ground', True) and a.get('altitude', 0) > 0]
                on_ground = [a for a in filtered if a.get('on_ground', True) or a.get('altitude', 0) <= 0]
                
                response_text = f"Aircraft Summary:\n\n"
                response_text += f"• Total aircraft: {len(filtered)}\n"
                response_text += f"• Airborne: {len(airborne)} aircraft\n"
                response_text += f"• On ground: {len(on_ground)} aircraft\n"
                
                if altitudes:
                    response_text += f"• Altitude range: {min(altitudes):,}ft - {max(altitudes):,}ft (avg: {sum(altitudes)/len(altitudes):.0f}ft)\n"
                
                if speeds:
                    response_text += f"• Speed range: {min(speeds):.0f}kt - {max(speeds):.0f}kt (avg: {sum(speeds)/len(speeds):.0f}kt)\n"
                
                # Add aircraft examples with more detail
                response_text += f"\nSample aircraft:\n"
                for aircraft in filtered[:5]:
                    callsign = aircraft.get('callsign', 'Unknown')
                    altitude = aircraft.get('altitude', 0)
                    speed = aircraft.get('velocity', 0)
                    on_ground = aircraft.get('on_ground', True)
                    status = "Ground" if on_ground else "Airborne"
                    response_text += f"• {callsign} - {altitude:,}ft, {speed:.0f}kt {status}\n"
            else:
                response_text = "No aircraft data available for summary."
        
        elif 'tell me about' in query_lower or 'analyze' in query_lower:
            # Try to find specific aircraft mentioned
            words = query.split()
            mentioned_aircraft = None
            for word in words:
                clean_word = ''.join(c for c in word if c.isalnum())
                if len(clean_word) >= 3:
                    found = self._find_aircraft_by_identifier(clean_word, filtered)
                    if found:
                        mentioned_aircraft = found
                        break
            
            if mentioned_aircraft:
                callsign = mentioned_aircraft.get('callsign', 'Unknown')
                altitude = mentioned_aircraft.get('altitude', 0)
                speed = mentioned_aircraft.get('velocity', 0)
                heading = mentioned_aircraft.get('heading', 0)
                on_ground = mentioned_aircraft.get('on_ground', True)
                
                response_text = f"Aircraft Analysis: {callsign}\n\n"
                response_text += f"• Status: {'On Ground' if on_ground else 'Airborne'}\n"
                response_text += f"• Altitude: {altitude:,}ft\n"
                response_text += f"• Speed: {speed:.0f}kt\n"
                response_text += f"• Heading: {heading:.0f}°\n"
                
                # Add flight phase analysis
                if not on_ground and altitude > 0:
                    if altitude > 30000:
                        response_text += f"• Phase: Cruise altitude\n"
                    elif altitude > 10000:
                        response_text += f"• Phase: Climb/Descent\n"
                    else:
                        response_text += f"• Phase: Approach\n"
                
                response_text += f"\nThis aircraft is currently {'on the ground' if on_ground else 'in flight'}."
            else:
                response_text = f"Query processed: '{query}'\n\n"
                response_text += f"Found {len(filtered)} matching aircraft:\n"
                for aircraft in filtered[:5]:
                    callsign = aircraft.get('callsign', 'Unknown')
                    altitude = aircraft.get('altitude', 0)
                    speed = aircraft.get('velocity', 0)
                    response_text += f"• {callsign} - {altitude:,}ft, {speed:.0f}kt\n"
        else:
            response_text = f"Query processed: '{query}'\n\n"
            
            if filtered:
                response_text += f"Found {len(filtered)} matching aircraft:\n"
                for aircraft in filtered[:5]:
                    callsign = aircraft.get('callsign', 'Unknown')
                    altitude = aircraft.get('altitude', 0)
                    speed = aircraft.get('velocity', 0)
                    response_text += f"• {callsign} - {altitude:,}ft, {speed:.0f}kt\n"
            else:
                response_text += "No aircraft found matching your criteria."
        
        return QueryResponse(
            query_type=QueryTypeEnum.ANALYSIS,
            response=response_text,
            filtered_aircraft=filtered,
            total_matches=len(filtered),
            insights=["Using enhanced local analysis", "AI service not configured"],
            recommendations=["Configure API keys for advanced AI analysis"]
        )

# Create singleton instance
cerebras_ai_service = CerebrasAIService()
