"""
Agent Coordination Service
Manages communication and coordination between AI agents
"""

import asyncio
import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import json

from agents.conflict_detection_agent import ConflictDetectionAgent, ConflictAlert, Aircraft
from agents.resolution_agent import ResolutionAgent, ResolutionStrategy
from .aircraft_tracking import AircraftTrackingService

class EventType(Enum):
    """Types of events that can be coordinated"""
    CONFLICT_DETECTED = "conflict_detected"
    CONFLICT_RESOLVED = "conflict_resolved"
    RESOLUTION_GENERATED = "resolution_generated"
    RESOLUTION_ACCEPTED = "resolution_accepted"
    RESOLUTION_REJECTED = "resolution_rejected"
    AIRCRAFT_UPDATE = "aircraft_update"
    SYSTEM_STATUS = "system_status"
    ERROR = "error"

@dataclass
class AgentEvent:
    """Represents an event in the agent coordination system"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    source_agent: str
    data: Dict[str, Any]
    priority: int = 1  # 1 = highest priority
    processed: bool = False
    recipients: List[str] = field(default_factory=list)

class AgentCoordinator:
    """Coordinates communication between AI agents"""
    
    def __init__(self, conflict_detector: ConflictDetectionAgent, 
                 resolution_agent: ResolutionAgent, 
                 aircraft_tracker: AircraftTrackingService):
        self.conflict_detector = conflict_detector
        self.resolution_agent = resolution_agent
        self.aircraft_tracker = aircraft_tracker
        
        # Event management
        self.event_queue: List[AgentEvent] = []
        self.event_handlers: Dict[EventType, List[Callable]] = {}
        self.event_history: List[AgentEvent] = []
        
        # Agent status
        self.agent_status: Dict[str, Dict] = {
            "conflict_detector": {"status": "active", "last_update": datetime.now()},
            "resolution_agent": {"status": "active", "last_update": datetime.now()},
            "aircraft_tracker": {"status": "active", "last_update": datetime.now()}
        }
        
        # Coordination settings
        self.max_event_history = 1000
        self.event_timeout = 30  # seconds
        self.coordination_interval = 1  # seconds
        
        # Logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Performance metrics
        self.events_processed = 0
        self.events_failed = 0
        self.coordination_cycles = 0
        
        # Setup event handlers
        self._setup_default_handlers()
        
        # Start coordination loop
        self.is_running = False
        self.coordination_task: Optional[asyncio.Task] = None
    
    def _setup_default_handlers(self):
        """Setup default event handlers"""
        self.register_event_handler(EventType.CONFLICT_DETECTED, self._handle_conflict_detected)
        self.register_event_handler(EventType.RESOLUTION_GENERATED, self._handle_resolution_generated)
        self.register_event_handler(EventType.RESOLUTION_ACCEPTED, self._handle_resolution_accepted)
        self.register_event_handler(EventType.RESOLUTION_REJECTED, self._handle_resolution_rejected)
        self.register_event_handler(EventType.AIRCRAFT_UPDATE, self._handle_aircraft_update)
        self.register_event_handler(EventType.ERROR, self._handle_error)
    
    def register_event_handler(self, event_type: EventType, handler: Callable[[AgentEvent], None]):
        """Register an event handler"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
        self.logger.info(f"Registered handler for {event_type.value}")
    
    def emit_event(self, event_type: EventType, source_agent: str, data: Dict[str, Any], 
                   priority: int = 1, recipients: List[str] = None):
        """Emit an event to the coordination system"""
        event = AgentEvent(
            event_id=f"{event_type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}",
            event_type=event_type,
            timestamp=datetime.now(),
            source_agent=source_agent,
            data=data,
            priority=priority,
            recipients=recipients or []
        )
        
        # Add to queue
        self.event_queue.append(event)
        
        # Sort by priority
        self.event_queue.sort(key=lambda x: x.priority)
        
        self.logger.debug(f"Emitted event {event.event_id} from {source_agent}")
    
    async def start_coordination(self):
        """Start the coordination loop"""
        if not self.is_running:
            self.is_running = True
            self.coordination_task = asyncio.create_task(self._coordination_loop())
            self.logger.info("Started agent coordination")
    
    async def stop_coordination(self):
        """Stop the coordination loop"""
        if self.is_running:
            self.is_running = False
            if self.coordination_task:
                self.coordination_task.cancel()
            self.logger.info("Stopped agent coordination")
    
    async def _coordination_loop(self):
        """Main coordination loop"""
        while self.is_running:
            try:
                await self._process_events()
                await self._update_agent_status()
                await asyncio.sleep(self.coordination_interval)
                self.coordination_cycles += 1
            except Exception as e:
                self.logger.error(f"Error in coordination loop: {e}")
                await asyncio.sleep(self.coordination_interval)
    
    async def _process_events(self):
        """Process events in the queue"""
        events_to_process = []
        
        # Get events to process (limit to prevent blocking)
        for event in self.event_queue[:10]:  # Process up to 10 events per cycle
            if not event.processed:
                events_to_process.append(event)
        
        for event in events_to_process:
            try:
                await self._process_event(event)
                event.processed = True
                self.events_processed += 1
            except Exception as e:
                self.logger.error(f"Error processing event {event.event_id}: {e}")
                self.events_failed += 1
                # Mark as processed to avoid reprocessing
                event.processed = True
        
        # Remove processed events
        self.event_queue = [event for event in self.event_queue if not event.processed]
        
        # Add to history
        for event in events_to_process:
            self.event_history.append(event)
            if len(self.event_history) > self.max_event_history:
                self.event_history = self.event_history[-self.max_event_history:]
    
    async def _process_event(self, event: AgentEvent):
        """Process a single event"""
        event_type = event.event_type
        
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    handler(event)
                except Exception as e:
                    self.logger.error(f"Error in event handler for {event_type.value}: {e}")
        else:
            self.logger.warning(f"No handlers registered for event type {event_type.value}")
    
    async def _update_agent_status(self):
        """Update agent status"""
        current_time = datetime.now()
        
        # Update conflict detector status
        conflict_metrics = self.conflict_detector.get_performance_metrics()
        self.agent_status["conflict_detector"].update({
            "status": "active" if conflict_metrics.get("is_monitoring", False) else "inactive",
            "last_update": current_time,
            "metrics": conflict_metrics
        })
        
        # Update resolution agent status
        resolution_metrics = self.resolution_agent.get_performance_metrics()
        self.agent_status["resolution_agent"].update({
            "status": "active",
            "last_update": current_time,
            "metrics": resolution_metrics
        })
        
        # Update aircraft tracker status
        self.agent_status["aircraft_tracker"].update({
            "status": "active",
            "last_update": current_time
        })
    
    def _handle_conflict_detected(self, event: AgentEvent):
        """Handle conflict detected event"""
        conflict_data = event.data.get("conflict")
        if not conflict_data:
            return
        
        self.logger.info(f"Conflict detected: {conflict_data.get('alert_id', 'unknown')}")
        
        # Generate resolution strategies
        try:
            # This would typically involve getting the full conflict object
            # For now, we'll just log the event
            self.logger.info("Generating resolution strategies for conflict")
        except Exception as e:
            self.logger.error(f"Error generating resolution strategies: {e}")
    
    def _handle_resolution_generated(self, event: AgentEvent):
        """Handle resolution generated event"""
        resolution_data = event.data.get("resolutions", [])
        self.logger.info(f"Generated {len(resolution_data)} resolution strategies")
    
    def _handle_resolution_accepted(self, event: AgentEvent):
        """Handle resolution accepted event"""
        strategy_id = event.data.get("strategy_id")
        self.logger.info(f"Resolution strategy {strategy_id} accepted")
        
        # Update conflict status
        conflict_id = event.data.get("conflict_id")
        if conflict_id:
            self.conflict_detector.resolve_conflict(conflict_id)
    
    def _handle_resolution_rejected(self, event: AgentEvent):
        """Handle resolution rejected event"""
        strategy_id = event.data.get("strategy_id")
        reason = event.data.get("reason", "No reason provided")
        self.logger.info(f"Resolution strategy {strategy_id} rejected: {reason}")
    
    def _handle_aircraft_update(self, event: AgentEvent):
        """Handle aircraft update event"""
        aircraft_count = event.data.get("aircraft_count", 0)
        self.logger.debug(f"Aircraft update: {aircraft_count} aircraft")
    
    def _handle_error(self, event: AgentEvent):
        """Handle error event"""
        error_message = event.data.get("message", "Unknown error")
        source_agent = event.source_agent
        self.logger.error(f"Error from {source_agent}: {error_message}")
    
    def get_coordination_status(self) -> Dict:
        """Get coordination system status"""
        return {
            "is_running": self.is_running,
            "events_processed": self.events_processed,
            "events_failed": self.events_failed,
            "events_in_queue": len(self.event_queue),
            "coordination_cycles": self.coordination_cycles,
            "agent_status": self.agent_status,
            "event_types_registered": len(self.event_handlers),
            "timestamp": datetime.now().isoformat()
        }
    
    def get_event_history(self, event_type: Optional[EventType] = None, 
                         limit: int = 100) -> List[Dict]:
        """Get event history"""
        history = self.event_history
        
        if event_type:
            history = [event for event in history if event.event_type == event_type]
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limit results
        history = history[:limit]
        
        return [{
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "source_agent": event.source_agent,
            "data": event.data,
            "priority": event.priority,
            "processed": event.processed
        } for event in history]
    
    def get_agent_metrics(self) -> Dict:
        """Get comprehensive agent metrics"""
        return {
            "conflict_detector": self.conflict_detector.get_performance_metrics(),
            "resolution_agent": self.resolution_agent.get_performance_metrics(),
            "coordination": self.get_coordination_status(),
            "timestamp": datetime.now().isoformat()
        }
