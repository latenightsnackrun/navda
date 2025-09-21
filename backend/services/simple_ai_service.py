"""
Simple AI Service - Lightweight fallback without heavy dependencies
Provides aircraft analysis and natural language processing for ATC systems
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

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
class AircraftAnalysis:
    status: str
    summary: str
    concerns: List[str]
    recommendations: List[str]
    confidence: float
    metrics: Optional[Dict[str, float]] = None
    timestamp: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()

@dataclass
class QueryResponse:
    query_type: str
    response: str
    filtered_aircraft: List[Dict]
    total_matches: int
    insights: List[str]
    recommendations: List[str]

class SimpleAIService:
    """
    Simple AI service with intelligent fallback logic
    """
    
    def __init__(self):
        self.logger = logging_service
        self.initialized = False
        
        # Aircraft data cache
        self.aircraft_cache = {}
        self.pattern_history = {}
        
    async def initialize(self):
        """Initialize the AI service"""
        if self.initialized:
            return
            
        try:
            self.initialized = True
            self.logger.log(LogLevel.INFO, "simple_ai", "Simple AI service initialized successfully")
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "simple_ai", f"Failed to initialize Simple AI service: {str(e)}")
            raise
    
    async def analyze_aircraft_behavior(self, aircraft_data: Dict, context: Dict = None) -> AircraftAnalysis:
        """
        Analyze aircraft behavior using intelligent rule-based logic
        
        Args:
            aircraft_data: Aircraft information
            context: Additional context (traffic, weather, etc.)
        
        Returns:
            Detailed aircraft analysis
        """
        await self.initialize()
        
        try:
            # Enhanced analysis with computed metrics
            enhanced_data = await self._enhance_aircraft_data(aircraft_data)
            
            # Perform rule-based analysis
            analysis = self._analyze_aircraft_patterns(enhanced_data, context)
            
            # Cache result for pattern tracking
            self._cache_aircraft_analysis(aircraft_data.get('icao24'), analysis)
            
            self.logger.log(LogLevel.INFO, "simple_ai", f"Aircraft analysis completed: {aircraft_data.get('callsign', 'Unknown')} - {analysis.status}")
            
            return analysis
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "simple_ai", f"Aircraft analysis failed: {str(e)}")
            return self._create_fallback_analysis(aircraft_data, str(e))
    
    async def process_natural_language_query(self, query: str, aircraft_data: List[Dict], context: Dict = None) -> QueryResponse:
        """
        Process natural language queries with intelligent filtering
        
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
            filtered_aircraft = await self._filter_aircraft_by_query(query, aircraft_data)
            
            # Generate intelligent response
            response = self._generate_query_response(query, filtered_aircraft, query_intent, context)
            
            self.logger.log(LogLevel.INFO, "simple_ai", f"Query processed: '{query}' -> {len(filtered_aircraft)} matches")
            
            return response
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "simple_ai", f"Query processing failed: {str(e)}")
            return self._create_fallback_query_response(query, str(e), [])
    
    async def generate_incident_summary(self, aircraft_data: Dict, analysis: AircraftAnalysis) -> str:
        """Generate concise ATC incident summary"""
        await self.initialize()
        
        try:
            callsign = aircraft_data.get('callsign', 'UNKNOWN')
            
            # Use a template based on status
            if analysis.status == AircraftStatusEnum.CRITICAL:
                template = f"🚨 CRITICAL: Flight {callsign} - {analysis.summary}"
            elif analysis.status == AircraftStatusEnum.CONCERNING:
                template = f"⚠️ ALERT: Flight {callsign} - {analysis.summary}"
            else:
                template = f"✅ NORMAL: Flight {callsign} - {analysis.summary}"
            
            return template
            
        except Exception as e:
            self.logger.log(LogLevel.ERROR, "simple_ai", f"Summary generation failed: {str(e)}")
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
    
    def _analyze_aircraft_patterns(self, aircraft_data: Dict, context: Dict = None) -> AircraftAnalysis:
        """Analyze aircraft patterns using rule-based logic"""
        
        concerns = []
        recommendations = []
        
        altitude = aircraft_data.get('altitude', 0) or 0
        speed = aircraft_data.get('speed', 0) or 0
        vertical_rate = aircraft_data.get('vertical_rate', 0) or 0
        risk_score = aircraft_data.get('risk_score', 0)
        
        # Altitude analysis
        if altitude < 1000 and speed > 200:
            concerns.append('Low altitude with high speed - approach monitoring required')
            recommendations.append('Monitor approach path closely')
        
        if altitude > 40000:
            concerns.append('Very high altitude - potential emergency or equipment issue')
            recommendations.append('Verify flight level authorization')
        
        # Vertical rate analysis
        if abs(vertical_rate) > 2000:
            direction = 'climb' if vertical_rate > 0 else 'descent'
            concerns.append(f'Rapid {direction} at {abs(vertical_rate)} ft/min')
            recommendations.append(f'Monitor {direction} rate closely')
        
        # Speed analysis
        if speed > 500:
            concerns.append('Excessive ground speed detected')
            recommendations.append('Verify speed restrictions')
        
        if speed < 100 and altitude > 1000:
            concerns.append('Unusually low speed for altitude')
            recommendations.append('Check aircraft status')
        
        # Pattern analysis
        if risk_score > 0.7:
            concerns.append('Multiple risk factors detected')
            recommendations.append('Priority monitoring required')
        
        # Determine status
        if len(concerns) >= 3 or risk_score > 0.8:
            status = AircraftStatusEnum.CRITICAL
        elif len(concerns) >= 2 or risk_score > 0.5:
            status = AircraftStatusEnum.CONCERNING
        elif len(concerns) >= 1:
            status = AircraftStatusEnum.CONCERNING
        else:
            status = AircraftStatusEnum.NORMAL
        
        # Generate summary
        callsign = aircraft_data.get('callsign', 'Unknown')
        if concerns:
            summary = f"Flight {callsign} showing {len(concerns)} concern(s) - {concerns[0]}"
        else:
            summary = f"Flight {callsign} operating normally at {altitude}ft, {speed}kts"
        
        # Add default recommendations
        if not recommendations:
            if status == AircraftStatusEnum.NORMAL:
                recommendations = ['Continue normal monitoring']
            else:
                recommendations = ['Monitor closely', 'Consider radio contact']
        
        return AircraftAnalysis(
            status=status,
            summary=summary,
            concerns=concerns,
            recommendations=recommendations,
            confidence=0.85,
            metrics={'risk_score': risk_score, 'concern_count': len(concerns)}
        )
    
    def _generate_query_response(self, query: str, filtered_aircraft: List[Dict], intent: str, context: Dict = None) -> QueryResponse:
        """Generate intelligent response to natural language query"""
        
        response_parts = []
        insights = []
        recommendations = []
        
        # Analyze the filtered results
        if filtered_aircraft:
            response_parts.append(f"Found {len(filtered_aircraft)} aircraft matching your query.")
            
            # Statistical analysis
            altitudes = [a.get('altitude', 0) for a in filtered_aircraft if a.get('altitude')]
            speeds = [a.get('velocity', 0) for a in filtered_aircraft if a.get('velocity')]
            
            if altitudes:
                avg_alt = sum(altitudes) / len(altitudes)
                max_alt = max(altitudes)
                min_alt = min(altitudes)
                
                insights.append(f"Altitude range: {min_alt:.0f}ft - {max_alt:.0f}ft (avg: {avg_alt:.0f}ft)")
            
            if speeds:
                avg_speed = sum(speeds) / len(speeds)
                insights.append(f"Average speed: {avg_speed:.0f}kts")
            
            # Intent-specific analysis
            if 'height' in query.lower() or 'altitude' in query.lower():
                # Show individual aircraft heights
                response_parts.append("\nAircraft Heights:")
                for i, aircraft in enumerate(filtered_aircraft[:5]):  # Show first 5
                    callsign = aircraft.get('callsign', aircraft.get('icao24', 'Unknown'))
                    altitude = aircraft.get('altitude', 0)
                    response_parts.append(f"• {callsign}: {altitude:.0f}ft")
                if len(filtered_aircraft) > 5:
                    response_parts.append(f"... and {len(filtered_aircraft) - 5} more aircraft")
            
            if 'descending' in query.lower():
                rapid_descent = [a for a in filtered_aircraft if (a.get('vertical_rate', 0) or 0) < -1500]
                if rapid_descent:
                    insights.append(f"{len(rapid_descent)} aircraft descending rapidly (>1500 ft/min)")
                    recommendations.append("Monitor rapid descent aircraft closely")
            
            if 'high altitude' in query.lower() or 'above' in query.lower():
                high_alt = [a for a in filtered_aircraft if (a.get('altitude', 0) or 0) > 35000]
                if high_alt:
                    insights.append(f"{len(high_alt)} aircraft above 35,000ft")
            
            # Safety recommendations
            if len(filtered_aircraft) > 10:
                recommendations.append("High traffic density - maintain extra vigilance")
            
            if any((a.get('altitude', 0) or 0) < 5000 for a in filtered_aircraft):
                recommendations.append("Low altitude aircraft present - monitor separation")
        
        else:
            response_parts.append("No aircraft match your current query criteria.")
            insights.append("Consider broadening search parameters")
            recommendations.append("Try different query terms")
        
        # Generate final response
        response = "\n".join(response_parts)
        
        if insights:
            response += f"\n\n📊 Analysis:\n" + "\n".join(f"• {insight}" for insight in insights)
        
        return QueryResponse(
            query_type=intent,
            response=response,
            filtered_aircraft=filtered_aircraft,
            total_matches=len(filtered_aircraft),
            insights=insights,
            recommendations=recommendations
        )
    
    async def _filter_aircraft_by_query(self, query: str, aircraft_data: List[Dict]) -> List[Dict]:
        """Filter aircraft based on natural language query"""
        
        query_lower = query.lower()
        filtered = []
        
        for aircraft in aircraft_data:
            altitude = aircraft.get('altitude', 0) or 0
            speed = aircraft.get('velocity', 0) or 0  # Use 'velocity' instead of 'speed'
            vertical_rate = aircraft.get('vertical_rate', 0) or 0
            
            # Altitude filters
            if 'high altitude' in query_lower or 'above' in query_lower:
                if altitude > 30000:
                    filtered.append(aircraft)
                continue
            
            if 'low altitude' in query_lower or 'below' in query_lower:
                if altitude < 10000:
                    filtered.append(aircraft)
                continue
            
            # Speed filters
            if 'fast' in query_lower or 'high speed' in query_lower:
                if speed > 400:
                    filtered.append(aircraft)
                continue
            
            if 'slow' in query_lower or 'low speed' in query_lower:
                if speed < 200:
                    filtered.append(aircraft)
                continue
            
            # Descent/climb filters
            if 'descending' in query_lower or 'descent' in query_lower:
                if vertical_rate < -500:
                    filtered.append(aircraft)
                continue
            
            if 'climbing' in query_lower or 'climb' in query_lower:
                if vertical_rate > 500:
                    filtered.append(aircraft)
                continue
            
            # Height/altitude queries
            if 'height' in query_lower or 'altitude' in query_lower:
                # For height queries, include all aircraft with their altitudes
                filtered.append(aircraft)
                continue
            
            # Emergency or concerning
            if 'emergency' in query_lower or 'critical' in query_lower or 'concerning' in query_lower:
                risk_score = self._calculate_risk_score(aircraft)
                if risk_score > 0.5:
                    filtered.append(aircraft)
                continue
            
            # Default - if no specific filters, include all
            if not any(term in query_lower for term in ['high', 'low', 'fast', 'slow', 'descending', 'climbing', 'emergency', 'critical', 'height', 'altitude']):
                filtered.append(aircraft)
        
        return filtered
    
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
        
        # Very low speed at altitude
        if speed < 100 and altitude > 1000:
            score += 0.2
        
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
    
    def _cache_aircraft_analysis(self, icao24: str, analysis: AircraftAnalysis):
        """Cache analysis for pattern tracking"""
        if icao24:
            if icao24 not in self.pattern_history:
                self.pattern_history[icao24] = {"previous_analyses": []}
            
            self.pattern_history[icao24]["previous_analyses"].append({
                "timestamp": analysis.timestamp,
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
            summary=f"Flight {aircraft_data.get('callsign', 'Unknown')} - Basic analysis available",
            concerns=[],
            recommendations=["Monitor normally"],
            confidence=0.6,
            metrics={"risk_score": self._calculate_risk_score(aircraft_data)}
        )
    
    def _create_fallback_query_response(self, query: str, error: str = None, filtered_aircraft: List[Dict] = None) -> QueryResponse:
        """Create fallback query response"""
        filtered = filtered_aircraft or []
        
        response_text = f"Query processed: '{query}'\n\n"
        
        if filtered:
            response_text += f"Found {len(filtered)} aircraft using basic filtering."
        else:
            response_text += "No aircraft match the basic query criteria."
        
        return QueryResponse(
            query_type=QueryTypeEnum.ANALYSIS,
            response=response_text,
            filtered_aircraft=filtered,
            total_matches=len(filtered),
            insights=["Using simplified analysis"],
            recommendations=["Query processed with basic logic"]
        )

# Create singleton instance
simple_ai_service = SimpleAIService()
