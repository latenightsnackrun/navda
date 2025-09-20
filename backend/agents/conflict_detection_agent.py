"""
AI Agent for Conflict Detection in Air Traffic Control
Uses advanced spatial reasoning and machine learning to detect potential separation violations
"""

import math
import asyncio
import logging
from typing import List, Dict, Tuple, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

class ConflictType(Enum):
    """Types of conflicts that can be detected"""
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"
    BOTH = "both"
    LOSS_OF_SEPARATION = "loss_of_separation"

class SeverityLevel(Enum):
    """Severity levels for conflicts"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Aircraft:
    """Represents an aircraft with its current state"""
    icao24: str
    callsign: str
    latitude: float
    longitude: float
    altitude: float  # in feet
    velocity: float  # in m/s
    heading: float   # in degrees
    vertical_rate: float  # in m/s
    timestamp: datetime
    origin_country: str = "UNKNOWN"
    on_ground: bool = False
    squawk: str = "UNKNOWN"
    spi: bool = False
    position_source: int = 0
    # Additional fields for enhanced tracking
    track_history: List[Tuple[float, float, float, datetime]] = field(default_factory=list)
    predicted_trajectory: List[Tuple[float, float, float, float]] = field(default_factory=list)
    last_update: datetime = field(default_factory=datetime.now)

@dataclass
class ConflictAlert:
    """Represents a detected conflict between aircraft"""
    aircraft1: Aircraft
    aircraft2: Aircraft
    time_to_conflict: float  # in seconds
    separation_distance: float  # in nautical miles
    vertical_separation: float  # in feet
    conflict_type: ConflictType
    severity: SeverityLevel
    suggested_actions: List[str]
    confidence: float = 0.0  # 0.0 to 1.0
    alert_id: str = field(default_factory=lambda: f"conflict_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}")
    detection_time: datetime = field(default_factory=datetime.now)
    resolution_deadline: Optional[datetime] = None
    # Enhanced conflict data
    closest_approach_time: float = 0.0
    closest_approach_distance: float = 0.0
    conflict_geometry: Dict = field(default_factory=dict)
    weather_impact: Optional[Dict] = None

class ConflictDetectionAgent:
    """AI Agent that continuously monitors aircraft for potential conflicts"""
    
    def __init__(self):
        # ICAO separation minima (in nautical miles and feet)
        self.horizontal_separation_min = 5.0  # 5 NM
        self.vertical_separation_min = 1000   # 1000 ft
        self.time_horizon = 300  # 5 minutes in seconds
        
        # Enhanced detection parameters
        self.conflict_prediction_steps = [15, 30, 60, 120, 180, 300]  # seconds
        self.min_confidence_threshold = 0.6
        self.track_history_length = 10  # number of positions to keep
        self.prediction_accuracy_threshold = 0.8
        
        # Real-time monitoring
        self.is_monitoring = False
        self.monitoring_interval = 5  # seconds
        self.active_conflicts: Dict[str, ConflictAlert] = {}
        self.conflict_callbacks: List[Callable[[ConflictAlert], None]] = []
        
        # Logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Performance metrics
        self.detection_count = 0
        self.false_positive_count = 0
        self.missed_conflict_count = 0
        
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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
    
    def calculate_vertical_separation(self, alt1: float, alt2: float) -> float:
        """Calculate vertical separation in feet"""
        return abs(alt1 - alt2)
    
    def predict_aircraft_position(self, aircraft: Aircraft, time_ahead: float) -> Tuple[float, float, float]:
        """Predict aircraft position after given time in seconds"""
        # Convert velocity from m/s to degrees per second (approximate)
        lat_velocity = (aircraft.velocity * math.cos(math.radians(aircraft.heading))) / 111000
        lon_velocity = (aircraft.velocity * math.sin(math.radians(aircraft.heading))) / (111000 * math.cos(math.radians(aircraft.latitude)))
        
        # Calculate vertical movement
        vertical_velocity_fpm = aircraft.vertical_rate * 196.85  # m/s to ft/min
        altitude_change = (vertical_velocity_fpm * time_ahead) / 60
        
        new_lat = aircraft.latitude + (lat_velocity * time_ahead)
        new_lon = aircraft.longitude + (lon_velocity * time_ahead)
        new_alt = aircraft.altitude + altitude_change
        
        return new_lat, new_lon, new_alt
    
    def detect_conflicts(self, aircraft_list: List[Aircraft]) -> List[ConflictAlert]:
        """Main method to detect conflicts between aircraft"""
        conflicts = []
        
        for i, aircraft1 in enumerate(aircraft_list):
            for aircraft2 in aircraft_list[i+1:]:
                # Check current separation
                current_horizontal = self.calculate_distance(
                    aircraft1.latitude, aircraft1.longitude,
                    aircraft2.latitude, aircraft2.longitude
                )
                current_vertical = self.calculate_vertical_separation(
                    aircraft1.altitude, aircraft2.altitude
                )
                
                # Check if already in conflict
                if (current_horizontal < self.horizontal_separation_min and 
                    current_vertical < self.vertical_separation_min):
                    conflict = self._create_conflict_alert(
                        aircraft1, aircraft2, 0, current_horizontal, current_vertical
                    )
                    conflicts.append(conflict)
                    continue
                
                # Predict future positions
                time_steps = [30, 60, 120, 180, 300]  # 30s, 1min, 2min, 3min, 5min
                
                for time_ahead in time_steps:
                    if time_ahead > self.time_horizon:
                        break
                    
                    # Predict positions
                    lat1, lon1, alt1 = self.predict_aircraft_position(aircraft1, time_ahead)
                    lat2, lon2, alt2 = self.predict_aircraft_position(aircraft2, time_ahead)
                    
                    # Calculate predicted separation
                    predicted_horizontal = self.calculate_distance(lat1, lon1, lat2, lon2)
                    predicted_vertical = self.calculate_vertical_separation(alt1, alt2)
                    
                    # Check for predicted conflict
                    if (predicted_horizontal < self.horizontal_separation_min and 
                        predicted_vertical < self.vertical_separation_min):
                        conflict = self._create_conflict_alert(
                            aircraft1, aircraft2, time_ahead, predicted_horizontal, predicted_vertical
                        )
                        conflicts.append(conflict)
                        break  # Only report the earliest conflict
        
        return conflicts
    
    def _create_conflict_alert(self, aircraft1: Aircraft, aircraft2: Aircraft, 
                             time_to_conflict: float, horizontal_sep: float, 
                             vertical_sep: float) -> ConflictAlert:
        """Create a conflict alert with severity assessment"""
        
        # Determine conflict type
        conflict_type = ConflictType.BOTH
        if horizontal_sep < self.horizontal_separation_min and vertical_sep >= self.vertical_separation_min:
            conflict_type = ConflictType.HORIZONTAL
        elif horizontal_sep >= self.horizontal_separation_min and vertical_sep < self.vertical_separation_min:
            conflict_type = ConflictType.VERTICAL
        
        # Determine severity
        severity = SeverityLevel.LOW
        if time_to_conflict < 60:  # Less than 1 minute
            severity = SeverityLevel.CRITICAL
        elif time_to_conflict < 120:  # Less than 2 minutes
            severity = SeverityLevel.HIGH
        elif time_to_conflict < 180:  # Less than 3 minutes
            severity = SeverityLevel.MEDIUM
        
        # Calculate confidence
        confidence = self.calculate_conflict_confidence(aircraft1, aircraft2, time_to_conflict, horizontal_sep, vertical_sep)
        
        # Generate suggested actions
        suggested_actions = self._generate_suggested_actions(
            aircraft1, aircraft2, conflict_type.value, severity.value
        )
        
        # Calculate closest approach
        closest_approach_time, closest_approach_distance = self._calculate_closest_approach(
            aircraft1, aircraft2, time_to_conflict
        )
        
        # Set resolution deadline
        resolution_deadline = None
        if severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]:
            resolution_deadline = datetime.now() + timedelta(seconds=time_to_conflict - 30)
        
        return ConflictAlert(
            aircraft1=aircraft1,
            aircraft2=aircraft2,
            time_to_conflict=time_to_conflict,
            separation_distance=horizontal_sep,
            vertical_separation=vertical_sep,
            conflict_type=conflict_type,
            severity=severity,
            suggested_actions=suggested_actions,
            confidence=confidence,
            closest_approach_time=closest_approach_time,
            closest_approach_distance=closest_approach_distance,
            resolution_deadline=resolution_deadline
        )
    
    def _generate_suggested_actions(self, aircraft1: Aircraft, aircraft2: Aircraft, 
                                  conflict_type: str, severity: str) -> List[str]:
        """Generate AI-suggested resolution actions"""
        actions = []
        
        if conflict_type in ["horizontal", "both"]:
            # Calculate relative heading difference
            heading_diff = abs(aircraft1.heading - aircraft2.heading)
            if heading_diff > 180:
                heading_diff = 360 - heading_diff
            
            if heading_diff < 30:  # Aircraft on similar headings
                actions.append(f"Turn {aircraft1.callsign} left 30 degrees")
                actions.append(f"Turn {aircraft2.callsign} right 30 degrees")
            else:
                actions.append(f"Turn {aircraft1.callsign} left 15 degrees")
                actions.append(f"Turn {aircraft2.callsign} right 15 degrees")
        
        if conflict_type in ["vertical", "both"]:
            if aircraft1.altitude > aircraft2.altitude:
                actions.append(f"Descend {aircraft1.callsign} 1000 feet")
                actions.append(f"Climb {aircraft2.callsign} 1000 feet")
            else:
                actions.append(f"Climb {aircraft1.callsign} 1000 feet")
                actions.append(f"Descend {aircraft2.callsign} 1000 feet")
        
        # Speed adjustments
        if severity in ["high", "critical"]:
            actions.append(f"Reduce speed {aircraft1.callsign} by 50 knots")
            actions.append(f"Reduce speed {aircraft2.callsign} by 50 knots")
        
        return actions
    
    def _calculate_closest_approach(self, aircraft1: Aircraft, aircraft2: Aircraft, 
                                   time_to_conflict: float) -> Tuple[float, float]:
        """Calculate closest approach time and distance"""
        min_distance = float('inf')
        min_time = 0
        
        # Check multiple time points to find closest approach
        for time_ahead in range(0, int(time_to_conflict) + 60, 15):  # Every 15 seconds
            lat1, lon1, alt1 = self.predict_aircraft_position(aircraft1, time_ahead)
            lat2, lon2, alt2 = self.predict_aircraft_position(aircraft2, time_ahead)
            
            distance = self.calculate_distance(lat1, lon1, lat2, lon2)
            if distance < min_distance:
                min_distance = distance
                min_time = time_ahead
        
        return min_time, min_distance
    
    def start_monitoring(self, aircraft_data_provider: Callable[[], List[Aircraft]]):
        """Start real-time conflict monitoring"""
        self.is_monitoring = True
        self.logger.info("Starting real-time conflict monitoring")
        
        async def monitor_loop():
            while self.is_monitoring:
                try:
                    aircraft_list = aircraft_data_provider()
                    if aircraft_list:
                        conflicts = self.detect_conflicts(aircraft_list)
                        await self._process_detected_conflicts(conflicts)
                    
                    await asyncio.sleep(self.monitoring_interval)
                except Exception as e:
                    self.logger.error(f"Error in monitoring loop: {e}")
                    await asyncio.sleep(self.monitoring_interval)
        
        # Run the monitoring loop
        asyncio.create_task(monitor_loop())
    
    def stop_monitoring(self):
        """Stop real-time conflict monitoring"""
        self.is_monitoring = False
        self.logger.info("Stopped real-time conflict monitoring")
    
    def add_conflict_callback(self, callback: Callable[[ConflictAlert], None]):
        """Add a callback function to be called when conflicts are detected"""
        self.conflict_callbacks.append(callback)
    
    async def _process_detected_conflicts(self, conflicts: List[ConflictAlert]):
        """Process detected conflicts and notify callbacks"""
        for conflict in conflicts:
            # Check if this is a new conflict
            conflict_key = f"{conflict.aircraft1.icao24}_{conflict.aircraft2.icao24}"
            
            if conflict_key not in self.active_conflicts:
                # New conflict detected
                self.active_conflicts[conflict_key] = conflict
                self.detection_count += 1
                self.logger.warning(f"New conflict detected: {conflict.aircraft1.callsign} vs {conflict.aircraft2.callsign}")
                
                # Notify callbacks
                for callback in self.conflict_callbacks:
                    try:
                        callback(conflict)
                    except Exception as e:
                        self.logger.error(f"Error in conflict callback: {e}")
            else:
                # Update existing conflict
                self.active_conflicts[conflict_key] = conflict
    
    def update_aircraft_track(self, aircraft: Aircraft):
        """Update aircraft track history for better prediction"""
        # Add current position to track history
        track_point = (aircraft.latitude, aircraft.longitude, aircraft.altitude, aircraft.timestamp)
        aircraft.track_history.append(track_point)
        
        # Keep only recent history
        if len(aircraft.track_history) > self.track_history_length:
            aircraft.track_history = aircraft.track_history[-self.track_history_length:]
        
        # Update predicted trajectory
        aircraft.predicted_trajectory = self._predict_trajectory(aircraft)
        aircraft.last_update = datetime.now()
    
    def _predict_trajectory(self, aircraft: Aircraft) -> List[Tuple[float, float, float, float]]:
        """Predict aircraft trajectory using track history"""
        trajectory = []
        
        if len(aircraft.track_history) < 2:
            return trajectory
        
        # Use simple linear prediction for now
        # In production, this would use more sophisticated algorithms
        for time_ahead in self.conflict_prediction_steps:
            lat, lon, alt = self.predict_aircraft_position(aircraft, time_ahead)
            trajectory.append((lat, lon, alt, time_ahead))
        
        return trajectory
    
    def calculate_conflict_confidence(self, aircraft1: Aircraft, aircraft2: Aircraft, 
                                    time_to_conflict: float, horizontal_sep: float, 
                                    vertical_sep: float) -> float:
        """Calculate confidence score for conflict prediction"""
        confidence = 0.5  # Base confidence
        
        # Factor in time to conflict (closer = higher confidence)
        if time_to_conflict < 60:
            confidence += 0.3
        elif time_to_conflict < 120:
            confidence += 0.2
        elif time_to_conflict < 180:
            confidence += 0.1
        
        # Factor in separation distance (closer = higher confidence)
        separation_ratio = horizontal_sep / self.horizontal_separation_min
        if separation_ratio < 0.5:
            confidence += 0.2
        elif separation_ratio < 0.8:
            confidence += 0.1
        
        # Factor in vertical separation
        vertical_ratio = vertical_sep / self.vertical_separation_min
        if vertical_ratio < 0.5:
            confidence += 0.2
        elif vertical_ratio < 0.8:
            confidence += 0.1
        
        # Factor in track history quality
        if len(aircraft1.track_history) >= 3 and len(aircraft2.track_history) >= 3:
            confidence += 0.1
        
        return min(max(confidence, 0.0), 1.0)
    
    def get_active_conflicts(self) -> List[ConflictAlert]:
        """Get all currently active conflicts"""
        return list(self.active_conflicts.values())
    
    def resolve_conflict(self, conflict_id: str):
        """Mark a conflict as resolved"""
        if conflict_id in self.active_conflicts:
            del self.active_conflicts[conflict_id]
            self.logger.info(f"Conflict {conflict_id} marked as resolved")
    
    def get_performance_metrics(self) -> Dict:
        """Get performance metrics for the agent"""
        total_detections = self.detection_count + self.false_positive_count
        accuracy = (self.detection_count / total_detections) if total_detections > 0 else 0
        
        return {
            "total_detections": self.detection_count,
            "false_positives": self.false_positive_count,
            "missed_conflicts": self.missed_conflict_count,
            "accuracy": accuracy,
            "active_conflicts": len(self.active_conflicts),
            "is_monitoring": self.is_monitoring
        }

