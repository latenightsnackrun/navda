"""
AI Agent for Conflict Resolution Suggestions
Uses advanced reasoning and machine learning to suggest optimal resolution strategies
"""

from typing import List, Dict, Tuple, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import math
import logging
import json
from .conflict_detection_agent import Aircraft, ConflictAlert, ConflictType, SeverityLevel

class StrategyType(Enum):
    """Types of resolution strategies"""
    HEADING_CHANGE = "heading_change"
    ALTITUDE_CHANGE = "altitude_change"
    SPEED_ADJUSTMENT = "speed_adjustment"
    VECTOR_CLEARANCE = "vector_clearance"
    HOLDING_PATTERN = "holding_pattern"
    ROUTE_DEVIATION = "route_deviation"
    COMBINED = "combined"

class PriorityLevel(Enum):
    """Priority levels for resolution strategies"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

@dataclass
class ResolutionStrategy:
    """Represents a suggested resolution strategy"""
    strategy_id: str
    strategy_type: StrategyType
    description: str
    confidence: float  # 0.0 to 1.0
    priority: PriorityLevel
    actions: List[Dict[str, any]]
    estimated_resolution_time: float  # in seconds
    impact_assessment: Dict[str, any]
    success_probability: float = 0.0  # 0.0 to 1.0
    complexity_score: float = 0.0  # 0.0 to 1.0 (0 = simple, 1 = complex)
    fuel_impact: float = 0.0  # Additional fuel consumption in kg
    delay_impact: float = 0.0  # Additional delay in minutes
    safety_improvement: float = 0.0  # 0.0 to 1.0
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    prerequisites: List[str] = field(default_factory=list)
    follow_up_actions: List[str] = field(default_factory=list)

class ResolutionAgent:
    """AI Agent that suggests optimal conflict resolution strategies"""
    
    def __init__(self):
        # Initialize strategy mapping after all methods are defined
        self.resolution_strategies = {}
        
        # Enhanced configuration
        self.max_strategies_per_conflict = 5
        self.min_confidence_threshold = 0.5
        self.strategy_expiry_minutes = 10
        
        # Performance tracking
        self.strategies_generated = 0
        self.strategies_accepted = 0
        self.strategies_rejected = 0
        
        # Logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Initialize strategy mapping after all methods are defined
        self._initialize_strategy_mapping()
        
        # Strategy history for learning
        self.strategy_history: List[Dict] = []
    
    def generate_resolution_strategies(self, conflict: ConflictAlert, 
                                    aircraft_list: List[Aircraft]) -> List[ResolutionStrategy]:
        """Generate multiple resolution strategies for a given conflict"""
        strategies = []
        
        # Analyze conflict characteristics
        conflict_analysis = self._analyze_conflict(conflict, aircraft_list)
        
        # Generate different types of resolution strategies
        for strategy_type, strategy_func in self.resolution_strategies.items():
            try:
                strategy = strategy_func(conflict, aircraft_list, conflict_analysis)
                if strategy and strategy.confidence >= self.min_confidence_threshold:
                    strategies.append(strategy)
                    self.strategies_generated += 1
            except Exception as e:
                self.logger.error(f"Error generating {strategy_type.value} strategy: {e}")
                continue
        
        # Sort by priority, confidence, and success probability
        strategies.sort(key=lambda x: (x.priority.value, -x.confidence, -x.success_probability))
        
        # Limit number of strategies
        strategies = strategies[:self.max_strategies_per_conflict]
        
        # Set expiry times
        for strategy in strategies:
            strategy.expires_at = datetime.now() + timedelta(minutes=self.strategy_expiry_minutes)
        
        self.logger.info(f"Generated {len(strategies)} resolution strategies for conflict {conflict.alert_id}")
        return strategies
    
    def _analyze_conflict(self, conflict: ConflictAlert, aircraft_list: List[Aircraft]) -> Dict:
        """Analyze conflict characteristics to inform strategy selection"""
        analysis = {
            "conflict_type": conflict.conflict_type,
            "severity": conflict.severity,
            "time_to_conflict": conflict.time_to_conflict,
            "separation_distance": conflict.separation_distance,
            "vertical_separation": conflict.vertical_separation,
            "aircraft1_characteristics": self._analyze_aircraft(conflict.aircraft1),
            "aircraft2_characteristics": self._analyze_aircraft(conflict.aircraft2),
            "traffic_density": self._calculate_traffic_density(conflict, aircraft_list),
            "weather_conditions": self._assess_weather_impact(conflict),
            "airspace_constraints": self._assess_airspace_constraints(conflict)
        }
        return analysis
    
    def _analyze_aircraft(self, aircraft: Aircraft) -> Dict:
        """Analyze individual aircraft characteristics"""
        return {
            "altitude": aircraft.altitude,
            "velocity": aircraft.velocity,
            "heading": aircraft.heading,
            "vertical_rate": aircraft.vertical_rate,
            "on_ground": aircraft.on_ground,
            "track_history_length": len(aircraft.track_history),
            "predicted_trajectory_length": len(aircraft.predicted_trajectory),
            "last_update_age": (datetime.now() - aircraft.last_update).total_seconds()
        }
    
    def _calculate_traffic_density(self, conflict: ConflictAlert, aircraft_list: List[Aircraft]) -> float:
        """Calculate traffic density in the conflict area"""
        # Simple implementation - count aircraft within 20 NM of conflict
        conflict_lat = (conflict.aircraft1.latitude + conflict.aircraft2.latitude) / 2
        conflict_lon = (conflict.aircraft1.longitude + conflict.aircraft2.longitude) / 2
        
        nearby_aircraft = 0
        for aircraft in aircraft_list:
            distance = self._calculate_distance(conflict_lat, conflict_lon, 
                                             aircraft.latitude, aircraft.longitude)
            if distance <= 20:  # 20 NM radius
                nearby_aircraft += 1
        
        return nearby_aircraft / 100.0  # Normalize to 0-1 scale
    
    def _assess_weather_impact(self, conflict: ConflictAlert) -> Dict:
        """Assess weather impact on resolution strategies"""
        # Placeholder for weather assessment
        return {
            "visibility": "good",
            "wind_speed": "moderate",
            "turbulence": "light",
            "impact_score": 0.2  # 0 = no impact, 1 = high impact
        }
    
    def _assess_airspace_constraints(self, conflict: ConflictAlert) -> Dict:
        """Assess airspace constraints that might affect resolution strategies"""
        # Placeholder for airspace constraint assessment
        return {
            "restricted_areas": [],
            "altitude_restrictions": [],
            "route_constraints": [],
            "constraint_score": 0.1  # 0 = no constraints, 1 = high constraints
        }
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great circle distance between two points in nautical miles"""
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in nautical miles
        earth_radius_nm = 3440.065
        return earth_radius_nm * c
    
    def _suggest_heading_change(self, conflict: ConflictAlert, 
                              aircraft_list: List[Aircraft], 
                              conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest heading change resolution"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Calculate optimal heading changes
        relative_bearing = self._calculate_relative_bearing(aircraft1, aircraft2)
        
        # Determine turn directions
        turn1_direction = "left" if relative_bearing > 0 else "right"
        turn2_direction = "right" if relative_bearing > 0 else "left"
        
        # Calculate turn angles based on conflict severity
        base_angle = 15
        if conflict.severity == "critical":
            base_angle = 45
        elif conflict.severity == "high":
            base_angle = 30
        elif conflict.severity == "medium":
            base_angle = 20
        
        actions = [
            {
                "aircraft": aircraft1.callsign,
                "action": "heading_change",
                "direction": turn1_direction,
                "angle": base_angle,
                "new_heading": (aircraft1.heading + (base_angle if turn1_direction == "right" else -base_angle)) % 360
            },
            {
                "aircraft": aircraft2.callsign,
                "action": "heading_change",
                "direction": turn2_direction,
                "angle": base_angle,
                "new_heading": (aircraft2.heading + (base_angle if turn2_direction == "right" else -base_angle)) % 360
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "heading_change")
        
        # Calculate success probability and complexity
        success_probability = self._calculate_success_probability(conflict, "heading_change", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        
        # Calculate fuel and delay impact
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"heading_change_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.HEADING_CHANGE,
            description=f"Turn {aircraft1.callsign} {turn1_direction} {base_angle}°, {aircraft2.callsign} {turn2_direction} {base_angle}°",
            confidence=confidence,
            priority=PriorityLevel.CRITICAL if conflict.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH] else PriorityLevel.HIGH,
            actions=actions,
            estimated_resolution_time=60 + (base_angle * 2),  # 2 seconds per degree
            impact_assessment={
                "fuel_impact": "minimal",
                "delay_impact": "low",
                "safety_improvement": "high",
                "complexity": "low"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.8
        )
    
    def _suggest_altitude_change(self, conflict: ConflictAlert, 
                               aircraft_list: List[Aircraft], 
                               conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest altitude change resolution"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Determine which aircraft should climb/descend
        if aircraft1.altitude > aircraft2.altitude:
            climb_aircraft = aircraft2
            descend_aircraft = aircraft1
        else:
            climb_aircraft = aircraft1
            descend_aircraft = aircraft2
        
        # Calculate altitude change based on conflict severity
        altitude_change = 1000  # Default 1000 feet
        if conflict.severity == "critical":
            altitude_change = 2000
        elif conflict.severity == "high":
            altitude_change = 1500
        
        actions = [
            {
                "aircraft": climb_aircraft.callsign,
                "action": "altitude_change",
                "direction": "climb",
                "altitude_change": altitude_change,
                "new_altitude": climb_aircraft.altitude + altitude_change
            },
            {
                "aircraft": descend_aircraft.callsign,
                "action": "altitude_change",
                "direction": "descend",
                "altitude_change": altitude_change,
                "new_altitude": descend_aircraft.altitude - altitude_change
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "altitude_change")
        
        # Calculate success probability and complexity
        success_probability = self._calculate_success_probability(conflict, "altitude_change", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"altitude_change_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.ALTITUDE_CHANGE,
            description=f"Climb {climb_aircraft.callsign} {altitude_change}ft, descend {descend_aircraft.callsign} {altitude_change}ft",
            confidence=confidence,
            priority=PriorityLevel.HIGH if conflict.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH] else PriorityLevel.MEDIUM,
            actions=actions,
            estimated_resolution_time=120 + (altitude_change / 10),  # 10 ft per second
            impact_assessment={
                "fuel_impact": "moderate",
                "delay_impact": "moderate",
                "safety_improvement": "very_high",
                "complexity": "medium"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.9
        )
    
    def _suggest_speed_adjustment(self, conflict: ConflictAlert, 
                                aircraft_list: List[Aircraft], 
                                conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest speed adjustment resolution"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Calculate speed difference
        speed_diff = abs(aircraft1.velocity - aircraft2.velocity)
        
        # Determine speed adjustments
        speed_reduction = 50  # knots
        if conflict.severity == "critical":
            speed_reduction = 100
        elif conflict.severity == "high":
            speed_reduction = 75
        
        # Convert m/s to knots for display
        speed1_kts = aircraft1.velocity * 1.944
        speed2_kts = aircraft2.velocity * 1.944
        
        actions = [
            {
                "aircraft": aircraft1.callsign,
                "action": "speed_adjustment",
                "speed_change": -speed_reduction,
                "new_speed": max(speed1_kts - speed_reduction, 200)  # Minimum 200 knots
            },
            {
                "aircraft": aircraft2.callsign,
                "action": "speed_adjustment",
                "speed_change": -speed_reduction,
                "new_speed": max(speed2_kts - speed_reduction, 200)
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "speed_adjustment")
        
        # Calculate success probability and complexity
        success_probability = self._calculate_success_probability(conflict, "speed_adjustment", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"speed_adjustment_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.SPEED_ADJUSTMENT,
            description=f"Reduce speed {aircraft1.callsign} and {aircraft2.callsign} by {speed_reduction} knots",
            confidence=confidence,
            priority=PriorityLevel.MEDIUM,
            actions=actions,
            estimated_resolution_time=180,  # 3 minutes
            impact_assessment={
                "fuel_impact": "low",
                "delay_impact": "high",
                "safety_improvement": "moderate",
                "complexity": "low"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.6
        )
    
    def _suggest_vector_clearance(self, conflict: ConflictAlert, 
                                aircraft_list: List[Aircraft], 
                                conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest vector clearance resolution"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Calculate vector to avoid conflict
        vector_angle = self._calculate_avoidance_vector(aircraft1, aircraft2)
        
        actions = [
            {
                "aircraft": aircraft1.callsign,
                "action": "vector_clearance",
                "heading": vector_angle,
                "duration": 300  # 5 minutes
            },
            {
                "aircraft": aircraft2.callsign,
                "action": "vector_clearance",
                "heading": (vector_angle + 180) % 360,
                "duration": 300
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "vector_clearance")
        
        # Calculate success probability and complexity
        success_probability = self._calculate_success_probability(conflict, "vector_clearance", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"vector_clearance_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.VECTOR_CLEARANCE,
            description=f"Vector {aircraft1.callsign} heading {vector_angle:03d}°, {aircraft2.callsign} heading {(vector_angle + 180) % 360:03d}°",
            confidence=confidence,
            priority=PriorityLevel.HIGH,
            actions=actions,
            estimated_resolution_time=300,
            impact_assessment={
                "fuel_impact": "moderate",
                "delay_impact": "moderate",
                "safety_improvement": "high",
                "complexity": "medium"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.8
        )
    
    def _suggest_holding_pattern(self, conflict: ConflictAlert, 
                               aircraft_list: List[Aircraft], 
                               conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest holding pattern resolution for one aircraft"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Determine which aircraft should enter holding
        holding_aircraft = aircraft1 if aircraft1.altitude < aircraft2.altitude else aircraft2
        
        actions = [
            {
                "aircraft": holding_aircraft.callsign,
                "action": "holding_pattern",
                "fix": f"Hold at {holding_aircraft.callsign} current position",
                "pattern": "standard",
                "duration": 600  # 10 minutes
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "holding_pattern")
        
        # Calculate success probability and complexity
        success_probability = self._calculate_success_probability(conflict, "holding_pattern", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"holding_pattern_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.HOLDING_PATTERN,
            description=f"Hold {holding_aircraft.callsign} in standard holding pattern",
            confidence=confidence,
            priority=PriorityLevel.LOW,
            actions=actions,
            estimated_resolution_time=600,
            impact_assessment={
                "fuel_impact": "high",
                "delay_impact": "very_high",
                "safety_improvement": "very_high",
                "complexity": "low"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.95
        )
    
    def _calculate_relative_bearing(self, aircraft1: Aircraft, aircraft2: Aircraft) -> float:
        """Calculate relative bearing from aircraft1 to aircraft2"""
        lat1, lon1 = math.radians(aircraft1.latitude), math.radians(aircraft1.longitude)
        lat2, lon2 = math.radians(aircraft2.latitude), math.radians(aircraft2.longitude)
        
        dlon = lon2 - lon1
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360) % 360
    
    def _calculate_avoidance_vector(self, aircraft1: Aircraft, aircraft2: Aircraft) -> float:
        """Calculate optimal avoidance vector"""
        relative_bearing = self._calculate_relative_bearing(aircraft1, aircraft2)
        return (relative_bearing + 90) % 360  # 90 degrees to the right
    
    def _calculate_confidence(self, conflict: ConflictAlert, strategy_type: str) -> float:
        """Calculate confidence score for a resolution strategy"""
        base_confidence = 0.7
        
        # Adjust based on conflict severity
        if conflict.severity == "critical":
            base_confidence += 0.2
        elif conflict.severity == "high":
            base_confidence += 0.1
        elif conflict.severity == "low":
            base_confidence -= 0.1
        
        # Adjust based on strategy type
        if strategy_type == "heading_change":
            base_confidence += 0.1
        elif strategy_type == "altitude_change":
            base_confidence += 0.05
        elif strategy_type == "speed_adjustment":
            base_confidence -= 0.05
        
        return min(max(base_confidence, 0.0), 1.0)
    
    def _calculate_success_probability(self, conflict: ConflictAlert, strategy_type: str, 
                                     conflict_analysis: Dict) -> float:
        """Calculate success probability for a strategy"""
        base_probability = 0.7
        
        # Adjust based on conflict severity
        if conflict.severity == SeverityLevel.CRITICAL:
            base_probability += 0.2
        elif conflict.severity == SeverityLevel.HIGH:
            base_probability += 0.1
        elif conflict.severity == SeverityLevel.LOW:
            base_probability -= 0.1
        
        # Adjust based on strategy type
        if strategy_type == "heading_change":
            base_probability += 0.1
        elif strategy_type == "altitude_change":
            base_probability += 0.05
        elif strategy_type == "speed_adjustment":
            base_probability -= 0.05
        
        # Adjust based on traffic density
        traffic_density = conflict_analysis.get("traffic_density", 0.5)
        if traffic_density > 0.7:
            base_probability -= 0.1
        
        return min(max(base_probability, 0.0), 1.0)
    
    def _calculate_complexity_score(self, actions: List[Dict], conflict_analysis: Dict) -> float:
        """Calculate complexity score for a strategy"""
        base_complexity = 0.3
        
        # More actions = more complex
        base_complexity += len(actions) * 0.1
        
        # Different action types = more complex
        action_types = set(action.get("action", "") for action in actions)
        base_complexity += len(action_types) * 0.1
        
        # Traffic density affects complexity
        traffic_density = conflict_analysis.get("traffic_density", 0.5)
        base_complexity += traffic_density * 0.2
        
        return min(max(base_complexity, 0.0), 1.0)
    
    def _calculate_fuel_impact(self, actions: List[Dict], conflict_analysis: Dict) -> float:
        """Calculate fuel impact in kg"""
        fuel_impact = 0.0
        
        for action in actions:
            action_type = action.get("action", "")
            if action_type == "heading_change":
                fuel_impact += 5.0  # 5 kg per heading change
            elif action_type == "altitude_change":
                altitude_change = action.get("altitude_change", 0)
                fuel_impact += abs(altitude_change) * 0.01  # 0.01 kg per foot
            elif action_type == "speed_adjustment":
                speed_change = abs(action.get("speed_change", 0))
                fuel_impact += speed_change * 0.1  # 0.1 kg per knot change
        
        return fuel_impact
    
    def _calculate_delay_impact(self, actions: List[Dict], conflict_analysis: Dict) -> float:
        """Calculate delay impact in minutes"""
        delay_impact = 0.0
        
        for action in actions:
            action_type = action.get("action", "")
            if action_type == "heading_change":
                delay_impact += 2.0  # 2 minutes per heading change
            elif action_type == "altitude_change":
                delay_impact += 3.0  # 3 minutes per altitude change
            elif action_type == "speed_adjustment":
                delay_impact += 5.0  # 5 minutes per speed adjustment
            elif action_type == "holding_pattern":
                delay_impact += 10.0  # 10 minutes for holding
        
        return delay_impact
    
    def _suggest_route_deviation(self, conflict: ConflictAlert, 
                               aircraft_list: List[Aircraft], 
                               conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest route deviation resolution"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Calculate deviation waypoint
        deviation_angle = self._calculate_avoidance_vector(aircraft1, aircraft2)
        deviation_distance = 10.0  # 10 NM deviation
        
        actions = [
            {
                "aircraft": aircraft1.callsign,
                "action": "route_deviation",
                "waypoint": f"Deviation point at {deviation_angle:03d}°",
                "distance": deviation_distance,
                "duration": 600  # 10 minutes
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "route_deviation")
        success_probability = self._calculate_success_probability(conflict, "route_deviation", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"route_deviation_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.ROUTE_DEVIATION,
            description=f"Deviate {aircraft1.callsign} {deviation_distance} NM to {deviation_angle:03d}°",
            confidence=confidence,
            priority=PriorityLevel.MEDIUM,
            actions=actions,
            estimated_resolution_time=600,
            impact_assessment={
                "fuel_impact": "moderate",
                "delay_impact": "moderate",
                "safety_improvement": "high",
                "complexity": "medium"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.9
        )
    
    def _suggest_combined_strategy(self, conflict: ConflictAlert, 
                                 aircraft_list: List[Aircraft], 
                                 conflict_analysis: Dict) -> Optional[ResolutionStrategy]:
        """Suggest combined resolution strategy"""
        aircraft1 = conflict.aircraft1
        aircraft2 = conflict.aircraft2
        
        # Combine heading change and speed adjustment
        actions = [
            {
                "aircraft": aircraft1.callsign,
                "action": "heading_change",
                "direction": "left",
                "angle": 15,
                "new_heading": (aircraft1.heading - 15) % 360
            },
            {
                "aircraft": aircraft1.callsign,
                "action": "speed_adjustment",
                "speed_change": -25,
                "new_speed": max(aircraft1.velocity * 1.944 - 25, 200)
            },
            {
                "aircraft": aircraft2.callsign,
                "action": "heading_change",
                "direction": "right",
                "angle": 15,
                "new_heading": (aircraft2.heading + 15) % 360
            },
            {
                "aircraft": aircraft2.callsign,
                "action": "speed_adjustment",
                "speed_change": -25,
                "new_speed": max(aircraft2.velocity * 1.944 - 25, 200)
            }
        ]
        
        confidence = self._calculate_confidence(conflict, "combined")
        success_probability = self._calculate_success_probability(conflict, "combined", conflict_analysis)
        complexity_score = self._calculate_complexity_score(actions, conflict_analysis)
        fuel_impact = self._calculate_fuel_impact(actions, conflict_analysis)
        delay_impact = self._calculate_delay_impact(actions, conflict_analysis)
        
        return ResolutionStrategy(
            strategy_id=f"combined_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            strategy_type=StrategyType.COMBINED,
            description=f"Combined heading and speed changes for {aircraft1.callsign} and {aircraft2.callsign}",
            confidence=confidence,
            priority=PriorityLevel.HIGH,
            actions=actions,
            estimated_resolution_time=180,
            impact_assessment={
                "fuel_impact": "moderate",
                "delay_impact": "moderate",
                "safety_improvement": "very_high",
                "complexity": "high"
            },
            success_probability=success_probability,
            complexity_score=complexity_score,
            fuel_impact=fuel_impact,
            delay_impact=delay_impact,
            safety_improvement=0.95
        )
    
    def get_performance_metrics(self) -> Dict:
        """Get performance metrics for the agent"""
        total_strategies = self.strategies_generated
        acceptance_rate = (self.strategies_accepted / total_strategies) if total_strategies > 0 else 0
        
        return {
            "strategies_generated": self.strategies_generated,
            "strategies_accepted": self.strategies_accepted,
            "strategies_rejected": self.strategies_rejected,
            "acceptance_rate": acceptance_rate,
            "strategy_history_length": len(self.strategy_history)
        }
    
    def record_strategy_outcome(self, strategy_id: str, accepted: bool, resolution_time: float = None):
        """Record the outcome of a strategy for learning"""
        outcome = {
            "strategy_id": strategy_id,
            "accepted": accepted,
            "resolution_time": resolution_time,
            "timestamp": datetime.now()
        }
        self.strategy_history.append(outcome)
        
        if accepted:
            self.strategies_accepted += 1
        else:
            self.strategies_rejected += 1
    
    def _initialize_strategy_mapping(self):
        """Initialize the strategy mapping after all methods are defined"""
        self.resolution_strategies = {
            StrategyType.HEADING_CHANGE: self._suggest_heading_change,
            StrategyType.ALTITUDE_CHANGE: self._suggest_altitude_change,
            StrategyType.SPEED_ADJUSTMENT: self._suggest_speed_adjustment,
            StrategyType.VECTOR_CLEARANCE: self._suggest_vector_clearance,
            StrategyType.HOLDING_PATTERN: self._suggest_holding_pattern,
            StrategyType.ROUTE_DEVIATION: self._suggest_route_deviation,
            StrategyType.COMBINED: self._suggest_combined_strategy
        }

