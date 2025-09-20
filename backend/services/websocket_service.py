"""
WebSocket Service for Real-time Communication
Provides real-time updates to the frontend for conflicts and resolutions
"""

import asyncio
import json
import logging
from typing import Dict, List, Set, Callable, Optional
from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from .aircraft_tracking import AircraftTrackingService
from agents.conflict_detection_agent import ConflictDetectionAgent, ConflictAlert, Aircraft
from agents.resolution_agent import ResolutionAgent, ResolutionStrategy

class WebSocketService:
    """Service for managing WebSocket connections and real-time updates"""
    
    def __init__(self, socketio: SocketIO, aircraft_tracker: AircraftTrackingService, 
                 conflict_detector: ConflictDetectionAgent, resolution_agent: ResolutionAgent):
        self.socketio = socketio
        self.aircraft_tracker = aircraft_tracker
        self.conflict_detector = conflict_detector
        self.resolution_agent = resolution_agent
        
        # Track connected clients
        self.connected_clients: Set[str] = set()
        self.client_rooms: Dict[str, Set[str]] = {}  # client_id -> set of room names
        
        # Real-time monitoring
        self.is_monitoring = False
        self.monitoring_task: Optional[asyncio.Task] = None
        
        # Logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Setup event handlers
        self._setup_event_handlers()
        
        # Register conflict detection callbacks
        self.conflict_detector.add_conflict_callback(self._on_conflict_detected)
    
    def _setup_event_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect():
            client_id = request.sid
            self.connected_clients.add(client_id)
            self.client_rooms[client_id] = set()
            self.logger.info(f"Client {client_id} connected. Total clients: {len(self.connected_clients)}")
            
            # Send initial data
            self._send_initial_data(client_id)
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            client_id = request.sid
            self.connected_clients.discard(client_id)
            if client_id in self.client_rooms:
                del self.client_rooms[client_id]
            self.logger.info(f"Client {client_id} disconnected. Total clients: {len(self.connected_clients)}")
        
        @self.socketio.on('join_room')
        def handle_join_room(data):
            client_id = request.sid
            room = data.get('room', 'default')
            
            if client_id not in self.client_rooms:
                self.client_rooms[client_id] = set()
            
            self.client_rooms[client_id].add(room)
            join_room(room)
            self.logger.info(f"Client {client_id} joined room {room}")
        
        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            client_id = request.sid
            room = data.get('room', 'default')
            
            if client_id in self.client_rooms:
                self.client_rooms[client_id].discard(room)
            
            leave_room(room)
            self.logger.info(f"Client {client_id} left room {room}")
        
        @self.socketio.on('request_aircraft_data')
        def handle_request_aircraft_data(data):
            client_id = request.sid
            sector = data.get('sector', {})
            
            try:
                aircraft_data = self._get_aircraft_data(sector)
                emit('aircraft_data', aircraft_data, room=client_id)
            except Exception as e:
                self.logger.error(f"Error getting aircraft data for client {client_id}: {e}")
                emit('error', {'message': str(e)}, room=client_id)
        
        @self.socketio.on('request_conflicts')
        def handle_request_conflicts(data):
            client_id = request.sid
            sector = data.get('sector', {})
            
            try:
                conflicts = self._get_conflicts(sector)
                emit('conflicts', conflicts, room=client_id)
            except Exception as e:
                self.logger.error(f"Error getting conflicts for client {client_id}: {e}")
                emit('error', {'message': str(e)}, room=client_id)
        
        @self.socketio.on('request_resolutions')
        def handle_request_resolutions(data):
            client_id = request.sid
            conflict_id = data.get('conflict_id')
            
            try:
                resolutions = self._get_resolutions(conflict_id)
                emit('resolutions', resolutions, room=client_id)
            except Exception as e:
                self.logger.error(f"Error getting resolutions for client {client_id}: {e}")
                emit('error', {'message': str(e)}, room=client_id)
        
        @self.socketio.on('accept_resolution')
        def handle_accept_resolution(data):
            client_id = request.sid
            strategy_id = data.get('strategy_id')
            
            try:
                self._accept_resolution(strategy_id)
                emit('resolution_accepted', {'strategy_id': strategy_id}, room=client_id)
                self.logger.info(f"Resolution {strategy_id} accepted by client {client_id}")
            except Exception as e:
                self.logger.error(f"Error accepting resolution for client {client_id}: {e}")
                emit('error', {'message': str(e)}, room=client_id)
        
        @self.socketio.on('reject_resolution')
        def handle_reject_resolution(data):
            client_id = request.sid
            strategy_id = data.get('strategy_id')
            reason = data.get('reason', 'No reason provided')
            
            try:
                self._reject_resolution(strategy_id, reason)
                emit('resolution_rejected', {'strategy_id': strategy_id, 'reason': reason}, room=client_id)
                self.logger.info(f"Resolution {strategy_id} rejected by client {client_id}: {reason}")
            except Exception as e:
                self.logger.error(f"Error rejecting resolution for client {client_id}: {e}")
                emit('error', {'message': str(e)}, room=client_id)
    
    def start_monitoring(self):
        """Start real-time monitoring"""
        if not self.is_monitoring:
            self.is_monitoring = True
            # Start monitoring in a separate thread
            import threading
            self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
            self.monitoring_thread.start()
            self.logger.info("Started real-time monitoring")
    
    def stop_monitoring(self):
        """Stop real-time monitoring"""
        if self.is_monitoring:
            self.is_monitoring = False
            if hasattr(self, 'monitoring_thread') and self.monitoring_thread.is_alive():
                # Wait for thread to finish gracefully
                self.monitoring_thread.join(timeout=5)
            self.logger.info("Stopped real-time monitoring")
    
    def _monitoring_loop(self):
        """Main monitoring loop (synchronous)"""
        import time
        
        while self.is_monitoring:
            try:
                # Get aircraft data
                aircraft_data = self._get_aircraft_data()
                
                # Broadcast aircraft data to all clients
                if aircraft_data:
                    self.socketio.emit('aircraft_update', aircraft_data, namespace='/')
                
                # Get active conflicts
                conflicts = self.conflict_detector.get_active_conflicts()
                if conflicts:
                    conflict_data = self._serialize_conflicts(conflicts)
                    self.socketio.emit('conflict_update', conflict_data, namespace='/')
                
                time.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)
    
    def _on_conflict_detected(self, conflict: ConflictAlert):
        """Callback for when a conflict is detected"""
        try:
            # Serialize conflict data
            conflict_data = self._serialize_conflict(conflict)
            
            # Broadcast to all clients
            self.socketio.emit('conflict_detected', conflict_data, namespace='/')
            
            # Generate resolution strategies
            aircraft_list = [conflict.aircraft1, conflict.aircraft2]
            strategies = self.resolution_agent.generate_resolution_strategies(conflict, aircraft_list)
            
            if strategies:
                resolution_data = self._serialize_resolutions(strategies)
                self.socketio.emit('resolutions_available', {
                    'conflict_id': conflict.alert_id,
                    'strategies': resolution_data
                }, namespace='/')
            
            self.logger.info(f"Conflict {conflict.alert_id} detected and broadcasted")
            
        except Exception as e:
            self.logger.error(f"Error handling conflict detection: {e}")
    
    def _get_aircraft_data(self, sector: Dict = None) -> Dict:
        """Get aircraft data for a sector"""
        if sector is None:
            sector = {
                'min_lat': 40.0,
                'max_lat': 50.0,
                'min_lon': -10.0,
                'max_lon': 10.0
            }
        
        aircraft_states = self.aircraft_tracker.get_aircraft_in_sector(
            sector['min_lat'], sector['max_lat'], 
            sector['min_lon'], sector['max_lon']
        )
        
        return {
            'aircraft': [self._serialize_aircraft(aircraft) for aircraft in aircraft_states],
            'timestamp': datetime.now().isoformat(),
            'sector': sector
        }
    
    def _get_conflicts(self, sector: Dict = None) -> Dict:
        """Get conflicts for a sector"""
        if sector is None:
            sector = {
                'min_lat': 40.0,
                'max_lat': 50.0,
                'min_lon': -10.0,
                'max_lon': 10.0
            }
        
        # Get aircraft data
        aircraft_states = self.aircraft_tracker.get_aircraft_in_sector(
            sector['min_lat'], sector['max_lat'], 
            sector['min_lon'], sector['max_lon']
        )
        
        # Convert to Aircraft objects
        aircraft_list = []
        for state in aircraft_states:
            aircraft = Aircraft(
                icao24=state.icao24,
                callsign=state.callsign,
                latitude=state.latitude,
                longitude=state.longitude,
                altitude=state.altitude,
                velocity=state.velocity,
                heading=state.heading,
                vertical_rate=state.vertical_rate,
                timestamp=state.timestamp,
                origin_country=state.origin_country,
                on_ground=state.on_ground,
                squawk=state.squawk,
                spi=state.spi,
                position_source=state.position_source
            )
            aircraft_list.append(aircraft)
        
        # Detect conflicts
        conflicts = self.conflict_detector.detect_conflicts(aircraft_list)
        
        return {
            'conflicts': [self._serialize_conflict(conflict) for conflict in conflicts],
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_resolutions(self, conflict_id: str) -> Dict:
        """Get resolution strategies for a conflict"""
        # This would typically look up the conflict and generate strategies
        # For now, return empty list
        return {
            'strategies': [],
            'conflict_id': conflict_id,
            'timestamp': datetime.now().isoformat()
        }
    
    def _accept_resolution(self, strategy_id: str):
        """Accept a resolution strategy"""
        self.resolution_agent.record_strategy_outcome(strategy_id, True)
        self.logger.info(f"Resolution strategy {strategy_id} accepted")
    
    def _reject_resolution(self, strategy_id: str, reason: str):
        """Reject a resolution strategy"""
        self.resolution_agent.record_strategy_outcome(strategy_id, False)
        self.logger.info(f"Resolution strategy {strategy_id} rejected: {reason}")
    
    def _serialize_aircraft(self, aircraft) -> Dict:
        """Serialize aircraft data for JSON transmission"""
        return {
            'icao24': aircraft.icao24,
            'callsign': aircraft.callsign,
            'latitude': aircraft.latitude,
            'longitude': aircraft.longitude,
            'altitude': aircraft.altitude,
            'velocity': aircraft.velocity,
            'heading': aircraft.heading,
            'vertical_rate': aircraft.vertical_rate,
            'timestamp': aircraft.timestamp.isoformat(),
            'origin_country': getattr(aircraft, 'origin_country', 'UNKNOWN'),
            'on_ground': getattr(aircraft, 'on_ground', False),
            'squawk': getattr(aircraft, 'squawk', 'UNKNOWN'),
            'spi': getattr(aircraft, 'spi', False)
        }
    
    def _serialize_conflict(self, conflict: ConflictAlert) -> Dict:
        """Serialize conflict data for JSON transmission"""
        return {
            'alert_id': conflict.alert_id,
            'aircraft1': self._serialize_aircraft(conflict.aircraft1),
            'aircraft2': self._serialize_aircraft(conflict.aircraft2),
            'time_to_conflict': conflict.time_to_conflict,
            'separation_distance': conflict.separation_distance,
            'vertical_separation': conflict.vertical_separation,
            'conflict_type': conflict.conflict_type.value,
            'severity': conflict.severity.value,
            'confidence': conflict.confidence,
            'detection_time': conflict.detection_time.isoformat(),
            'resolution_deadline': conflict.resolution_deadline.isoformat() if conflict.resolution_deadline else None,
            'closest_approach_time': conflict.closest_approach_time,
            'closest_approach_distance': conflict.closest_approach_distance,
            'suggested_actions': conflict.suggested_actions
        }
    
    def _serialize_conflicts(self, conflicts: List[ConflictAlert]) -> Dict:
        """Serialize multiple conflicts"""
        return {
            'conflicts': [self._serialize_conflict(conflict) for conflict in conflicts],
            'timestamp': datetime.now().isoformat()
        }
    
    def _serialize_resolutions(self, strategies: List[ResolutionStrategy]) -> List[Dict]:
        """Serialize resolution strategies for JSON transmission"""
        return [{
            'strategy_id': strategy.strategy_id,
            'strategy_type': strategy.strategy_type.value,
            'description': strategy.description,
            'confidence': strategy.confidence,
            'priority': strategy.priority.value,
            'actions': strategy.actions,
            'estimated_resolution_time': strategy.estimated_resolution_time,
            'success_probability': strategy.success_probability,
            'complexity_score': strategy.complexity_score,
            'fuel_impact': strategy.fuel_impact,
            'delay_impact': strategy.delay_impact,
            'safety_improvement': strategy.safety_improvement,
            'created_at': strategy.created_at.isoformat(),
            'expires_at': strategy.expires_at.isoformat() if strategy.expires_at else None,
            'prerequisites': strategy.prerequisites,
            'follow_up_actions': strategy.follow_up_actions
        } for strategy in strategies]
    
    def _send_initial_data(self, client_id: str):
        """Send initial data to a newly connected client"""
        try:
            # Send aircraft data
            aircraft_data = self._get_aircraft_data()
            self.socketio.emit('aircraft_data', aircraft_data, room=client_id)
            
            # Send active conflicts
            conflicts = self.conflict_detector.get_active_conflicts()
            if conflicts:
                conflict_data = self._serialize_conflicts(conflicts)
                self.socketio.emit('conflicts', conflict_data, room=client_id)
            
            # Send agent status
            conflict_metrics = self.conflict_detector.get_performance_metrics()
            resolution_metrics = self.resolution_agent.get_performance_metrics()
            
            self.socketio.emit('agent_status', {
                'conflict_detector': conflict_metrics,
                'resolution_agent': resolution_metrics,
                'timestamp': datetime.now().isoformat()
            }, room=client_id)
            
        except Exception as e:
            self.logger.error(f"Error sending initial data to client {client_id}: {e}")
    
    def get_connection_stats(self) -> Dict:
        """Get WebSocket connection statistics"""
        return {
            'connected_clients': len(self.connected_clients),
            'is_monitoring': self.is_monitoring,
            'client_rooms': {client_id: list(rooms) for client_id, rooms in self.client_rooms.items()}
        }
