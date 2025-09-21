from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our AI agents and services
from agents.conflict_detection_agent import ConflictDetectionAgent, Aircraft
from agents.resolution_agent import ResolutionAgent
from services.aircraft_tracking import AircraftTrackingService
from services.websocket_service import WebSocketService
from services.agent_coordinator import AgentCoordinator
from services.logging_service import logging_service, LogLevel
from services.simple_ai_service import simple_ai_service

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize AI agents and services
conflict_detector = ConflictDetectionAgent()
resolution_agent = ResolutionAgent()
aircraft_tracker = AircraftTrackingService()

# Initialize agent coordinator
agent_coordinator = AgentCoordinator(conflict_detector, resolution_agent, aircraft_tracker)

# Initialize WebSocket service
websocket_service = WebSocketService(socketio, aircraft_tracker, conflict_detector, resolution_agent)

# Sample data - replace with your actual data source
sample_data = {
    "users": [
        {"id": 1, "name": "John Doe", "email": "john@atc-system.com"},
        {"id": 2, "name": "Jane Smith", "email": "jane@atc-system.com"},
    ],
    "services": [
        {"id": 1, "name": "Web Development", "description": "Custom web applications"},
        {"id": 2, "name": "Mobile Apps", "description": "iOS and Android applications"},
        {"id": 3, "name": "Consulting", "description": "Technical consulting services"},
    ]
}

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to ATC System API",
        "version": "1.0.0",
        "endpoints": {
            "users": "/api/users",
            "services": "/api/services",
            "health": "/api/health"
        }
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "ATC System API is running"
    })

@app.route('/api/users')
def get_users():
    return jsonify({
        "success": True,
        "data": sample_data["users"],
        "count": len(sample_data["users"])
    })

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "error": "Name and email are required"
        }), 400
    
    new_user = {
        "id": len(sample_data["users"]) + 1,
        "name": data["name"],
        "email": data["email"]
    }
    
    sample_data["users"].append(new_user)
    
    return jsonify({
        "success": True,
        "data": new_user,
        "message": "User created successfully"
    }), 201

@app.route('/api/services')
def get_services():
    return jsonify({
        "success": True,
        "data": sample_data["services"],
        "count": len(sample_data["services"])
    })

@app.route('/api/services', methods=['POST'])
def create_service():
    data = request.get_json()
    
    if not data or 'name' not in data or 'description' not in data:
        return jsonify({
            "success": False,
            "error": "Name and description are required"
        }), 400
    
    new_service = {
        "id": len(sample_data["services"]) + 1,
        "name": data["name"],
        "description": data["description"]
    }
    
    sample_data["services"].append(new_service)
    
    return jsonify({
        "success": True,
        "data": new_service,
        "message": "Service created successfully"
    }), 201

# ATC-Specific API Endpoints

@app.route('/api/atc/aircraft')
def get_aircraft_in_sector():
    """Get all aircraft in a specified sector"""
    try:
        # Get sector parameters from query string
        min_lat = float(request.args.get('min_lat', 40.0))
        max_lat = float(request.args.get('max_lat', 50.0))
        min_lon = float(request.args.get('min_lon', -10.0))
        max_lon = float(request.args.get('max_lon', 10.0))
        
        # Get aircraft data
        aircraft_states = aircraft_tracker.get_aircraft_in_sector(
            min_lat, max_lat, min_lon, max_lon
        )
        
        # Convert to JSON-serializable format with comprehensive data
        aircraft_data = []
        for aircraft in aircraft_states:
            aircraft_data.append({
                # Basic identification
                "icao24": aircraft.icao24,
                "callsign": aircraft.callsign,
                "registration": aircraft.registration,
                "latitude": aircraft.latitude,
                "longitude": aircraft.longitude,
                "altitude": aircraft.altitude,
                "velocity": aircraft.velocity,
                "heading": aircraft.heading,
                "vertical_rate": aircraft.vertical_rate,
                "timestamp": aircraft.timestamp.isoformat(),
                "origin_country": aircraft.origin_country,
                "on_ground": aircraft.on_ground,
                "squawk": aircraft.squawk,
                "spi": aircraft.spi,
                "position_source": aircraft.position_source,
                
                # Speed data
                "ias": aircraft.ias,
                "tas": aircraft.tas,
                "mach": aircraft.mach,
                "gs": aircraft.gs,
                
                # Navigation data
                "mag_heading": aircraft.mag_heading,
                "true_heading": aircraft.true_heading,
                "nav_heading": aircraft.nav_heading,
                "nav_altitude_mcp": aircraft.nav_altitude_mcp,
                "nav_altitude_fms": aircraft.nav_altitude_fms,
                "nav_qnh": aircraft.nav_qnh,
                "nav_modes": aircraft.nav_modes,
                
                # Environmental data
                "wd": aircraft.wd,
                "ws": aircraft.ws,
                "oat": aircraft.oat,
                "tat": aircraft.tat,
                "roll": aircraft.roll,
                "gps_altitude": aircraft.gps_altitude,
                "baro_rate": aircraft.baro_rate,
                "geom_rate": aircraft.geom_rate,
                
                # Aircraft information
                "aircraft_type": aircraft.aircraft_type,
                "category": aircraft.category,
                "wake_turb": aircraft.wake_turb,
                "manufacturer": aircraft.manufacturer,
                "model": aircraft.model,
                "typecode": aircraft.typecode,
                "year": aircraft.year,
                "engine_count": aircraft.engine_count,
                "engine_type": aircraft.engine_type,
                
                # Operator information
                "operator": aircraft.operator,
                "operator_icao": aircraft.operator_icao,
                "operator_iata": aircraft.operator_iata,
                "operator_callsign": aircraft.operator_callsign,
                "owner": aircraft.owner,
                "owner_icao": aircraft.owner_icao,
                "owner_iata": aircraft.owner_iata,
                "owner_callsign": aircraft.owner_callsign,
                
                # Status flags
                "test": aircraft.test,
                "special": aircraft.special,
                "military": aircraft.military,
                "interesting": aircraft.interesting,
                "alert": aircraft.alert,
                "emergency": aircraft.emergency,
                "silent": aircraft.silent,
                
                # Technical data
                "rssi": aircraft.rssi,
                "dbm": aircraft.dbm,
                "seen": aircraft.seen,
                "seen_pos": aircraft.seen_pos,
                "seen_at": aircraft.seen_at,
                "messages": aircraft.messages,
                "mlat": aircraft.mlat,
                "tisb": aircraft.tisb,
                "data_age_sec": aircraft.data_age_sec,
                
                # Legacy fields for compatibility
                "altitude_ft": aircraft.altitude,
                "speed_kts": aircraft.velocity,
                "vs_fpm": aircraft.vertical_rate,
                "track_deg": aircraft.heading,
                "last_seen": aircraft.timestamp.isoformat()
            })
        
        return jsonify({
            "success": True,
            "data": aircraft_data,
            "count": len(aircraft_data),
            "sector": {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/conflicts')
def detect_conflicts():
    """Detect conflicts in the current sector"""
    try:
        # Get sector parameters
        min_lat = float(request.args.get('min_lat', 40.0))
        max_lat = float(request.args.get('max_lat', 50.0))
        min_lon = float(request.args.get('min_lon', -10.0))
        max_lon = float(request.args.get('max_lon', 10.0))
        
        # Get aircraft data
        aircraft_states = aircraft_tracker.get_aircraft_in_sector(
            min_lat, max_lat, min_lon, max_lon
        )
        
        # Convert to Aircraft objects for conflict detection
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
                timestamp=state.timestamp
            )
            aircraft_list.append(aircraft)
        
        # Detect conflicts
        conflicts = conflict_detector.detect_conflicts(aircraft_list)
        
        # Convert conflicts to JSON-serializable format
        conflict_data = []
        for conflict in conflicts:
            conflict_data.append({
                "aircraft1": {
                    "icao24": conflict.aircraft1.icao24,
                    "callsign": conflict.aircraft1.callsign,
                    "latitude": conflict.aircraft1.latitude,
                    "longitude": conflict.aircraft1.longitude,
                    "altitude": conflict.aircraft1.altitude,
                    "heading": conflict.aircraft1.heading
                },
                "aircraft2": {
                    "icao24": conflict.aircraft2.icao24,
                    "callsign": conflict.aircraft2.callsign,
                    "latitude": conflict.aircraft2.latitude,
                    "longitude": conflict.aircraft2.longitude,
                    "altitude": conflict.aircraft2.altitude,
                    "heading": conflict.aircraft2.heading
                },
                "time_to_conflict": conflict.time_to_conflict,
                "separation_distance": conflict.separation_distance,
                "conflict_type": conflict.conflict_type,
                "severity": conflict.severity,
                "suggested_actions": conflict.suggested_actions
            })
        
        return jsonify({
            "success": True,
            "data": conflict_data,
            "count": len(conflict_data),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/resolutions')
def get_resolution_strategies():
    """Get AI-suggested resolution strategies for conflicts"""
    try:
        # Get conflict data from request body
        data = request.get_json()
        if not data or 'conflicts' not in data:
            return jsonify({
                "success": False,
                "error": "Conflicts data is required"
            }), 400
        
        resolutions = []
        
        for conflict_data in data['conflicts']:
            # Convert conflict data back to ConflictAlert object
            # This is a simplified version - in production you'd want proper deserialization
            aircraft1 = Aircraft(
                icao24=conflict_data['aircraft1']['icao24'],
                callsign=conflict_data['aircraft1']['callsign'],
                latitude=conflict_data['aircraft1']['latitude'],
                longitude=conflict_data['aircraft1']['longitude'],
                altitude=conflict_data['aircraft1']['altitude'],
                velocity=0,  # Not provided in conflict data
                heading=conflict_data['aircraft1']['heading'],
                vertical_rate=0,  # Not provided in conflict data
                timestamp=datetime.now()
            )
            
            aircraft2 = Aircraft(
                icao24=conflict_data['aircraft2']['icao24'],
                callsign=conflict_data['aircraft2']['callsign'],
                latitude=conflict_data['aircraft2']['latitude'],
                longitude=conflict_data['aircraft2']['longitude'],
                altitude=conflict_data['aircraft2']['altitude'],
                velocity=0,  # Not provided in conflict data
                heading=conflict_data['aircraft2']['heading'],
                vertical_rate=0,  # Not provided in conflict data
                timestamp=datetime.now()
            )
            
            # Create a mock conflict alert
            from agents.conflict_detection_agent import ConflictAlert
            conflict = ConflictAlert(
                aircraft1=aircraft1,
                aircraft2=aircraft2,
                time_to_conflict=conflict_data['time_to_conflict'],
                separation_distance=conflict_data['separation_distance'],
                conflict_type=conflict_data['conflict_type'],
                severity=conflict_data['severity'],
                suggested_actions=conflict_data['suggested_actions']
            )
            
            # Get resolution strategies
            strategies = resolution_agent.generate_resolution_strategies(conflict, [aircraft1, aircraft2])
            
            # Convert to JSON-serializable format
            strategy_data = []
            for strategy in strategies:
                strategy_data.append({
                    "strategy_id": strategy.strategy_id,
                    "description": strategy.description,
                    "confidence": strategy.confidence,
                    "priority": strategy.priority,
                    "actions": strategy.actions,
                    "estimated_resolution_time": strategy.estimated_resolution_time,
                    "impact_assessment": strategy.impact_assessment
                })
            
            resolutions.append({
                "conflict_id": f"{aircraft1.icao24}_{aircraft2.icao24}",
                "strategies": strategy_data
            })
        
        return jsonify({
            "success": True,
            "data": resolutions,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/airports')
def get_airports_in_sector():
    """Get airports in the specified sector"""
    try:
        min_lat = float(request.args.get('min_lat', 40.0))
        max_lat = float(request.args.get('max_lat', 50.0))
        min_lon = float(request.args.get('min_lon', -10.0))
        max_lon = float(request.args.get('max_lon', 10.0))
        
        airports = aircraft_tracker.get_airports_in_sector(
            min_lat, max_lat, min_lon, max_lon
        )
        
        return jsonify({
            "success": True,
            "data": airports,
            "count": len(airports)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/airports/list')
def get_airports_list():
    """Get list of all available airports for dropdown"""
    try:
        airports = aircraft_tracker.get_airports_list()
        
        return jsonify({
            "success": True,
            "data": airports,
            "count": len(airports)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/aircraft/airport/<airport_code>')
def get_aircraft_by_airport(airport_code):
    """Get aircraft near a specific airport"""
    try:
        # Get radius parameter from query string, default to 200nm
        radius = float(request.args.get('radius', 200))
        
        aircraft_data = aircraft_tracker.get_aircraft_by_airport(airport_code, radius)
        
        # Convert to JSON-serializable format with comprehensive data
        aircraft_list = []
        for aircraft in aircraft_data:
            aircraft_list.append({
                # Basic identification
                "icao24": aircraft.icao24,
                "callsign": aircraft.callsign,
                "registration": aircraft.registration,
                "latitude": aircraft.latitude,
                "longitude": aircraft.longitude,
                "altitude": aircraft.altitude,
                "velocity": aircraft.velocity,
                "heading": aircraft.heading,
                "vertical_rate": aircraft.vertical_rate,
                "timestamp": aircraft.timestamp.isoformat(),
                "origin_country": aircraft.origin_country,
                "on_ground": aircraft.on_ground,
                "squawk": aircraft.squawk,
                "spi": aircraft.spi,
                "position_source": aircraft.position_source,
                
                # Speed data
                "ias": aircraft.ias,
                "tas": aircraft.tas,
                "mach": aircraft.mach,
                "gs": aircraft.gs,
                
                # Navigation data
                "mag_heading": aircraft.mag_heading,
                "true_heading": aircraft.true_heading,
                "nav_heading": aircraft.nav_heading,
                "nav_altitude_mcp": aircraft.nav_altitude_mcp,
                "nav_altitude_fms": aircraft.nav_altitude_fms,
                "nav_qnh": aircraft.nav_qnh,
                "nav_modes": aircraft.nav_modes,
                
                # Environmental data
                "wd": aircraft.wd,
                "ws": aircraft.ws,
                "oat": aircraft.oat,
                "tat": aircraft.tat,
                "roll": aircraft.roll,
                "gps_altitude": aircraft.gps_altitude,
                "baro_rate": aircraft.baro_rate,
                "geom_rate": aircraft.geom_rate,
                
                # Aircraft information
                "aircraft_type": aircraft.aircraft_type,
                "category": aircraft.category,
                "wake_turb": aircraft.wake_turb,
                "manufacturer": aircraft.manufacturer,
                "model": aircraft.model,
                "typecode": aircraft.typecode,
                "year": aircraft.year,
                "engine_count": aircraft.engine_count,
                "engine_type": aircraft.engine_type,
                
                # Operator information
                "operator": aircraft.operator,
                "operator_icao": aircraft.operator_icao,
                "operator_iata": aircraft.operator_iata,
                "operator_callsign": aircraft.operator_callsign,
                "owner": aircraft.owner,
                "owner_icao": aircraft.owner_icao,
                "owner_iata": aircraft.owner_iata,
                "owner_callsign": aircraft.owner_callsign,
                
                # Status flags
                "test": aircraft.test,
                "special": aircraft.special,
                "military": aircraft.military,
                "interesting": aircraft.interesting,
                "alert": aircraft.alert,
                "emergency": aircraft.emergency,
                "silent": aircraft.silent,
                
                # Technical data
                "rssi": aircraft.rssi,
                "dbm": aircraft.dbm,
                "seen": aircraft.seen,
                "seen_pos": aircraft.seen_pos,
                "seen_at": aircraft.seen_at,
                "messages": aircraft.messages,
                "mlat": aircraft.mlat,
                "tisb": aircraft.tisb,
                "data_age_sec": aircraft.data_age_sec,
                
                # Legacy fields for compatibility
                "altitude_ft": aircraft.altitude,
                "speed_kts": aircraft.velocity,
                "vs_fpm": aircraft.vertical_rate,
                "track_deg": aircraft.heading,
                "last_seen": aircraft.timestamp.isoformat()
            })
        
        return jsonify({
            "success": True,
            "data": aircraft_list,
            "count": len(aircraft_list),
            "airport_code": airport_code,
            "radius": radius
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Real-time monitoring endpoints

@app.route('/api/atc/monitoring/start')
def start_monitoring():
    """Start real-time conflict monitoring"""
    try:
        websocket_service.start_monitoring()
        return jsonify({
            "success": True,
            "message": "Real-time monitoring started"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/monitoring/stop')
def stop_monitoring():
    """Stop real-time conflict monitoring"""
    try:
        websocket_service.stop_monitoring()
        return jsonify({
            "success": True,
            "message": "Real-time monitoring stopped"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/monitoring/status')
def get_monitoring_status():
    """Get monitoring status and statistics"""
    try:
        conflict_metrics = conflict_detector.get_performance_metrics()
        resolution_metrics = resolution_agent.get_performance_metrics()
        websocket_stats = websocket_service.get_connection_stats()
        
        return jsonify({
            "success": True,
            "data": {
                "conflict_detector": conflict_metrics,
                "resolution_agent": resolution_metrics,
                "websocket": websocket_stats,
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/conflicts/active')
def get_active_conflicts():
    """Get all currently active conflicts"""
    try:
        conflicts = conflict_detector.get_active_conflicts()
        
        # Convert to JSON-serializable format
        conflict_data = []
        for conflict in conflicts:
            conflict_data.append({
                "alert_id": conflict.alert_id,
                "aircraft1": {
                    "icao24": conflict.aircraft1.icao24,
                    "callsign": conflict.aircraft1.callsign,
                    "latitude": conflict.aircraft1.latitude,
                    "longitude": conflict.aircraft1.longitude,
                    "altitude": conflict.aircraft1.altitude,
                    "heading": conflict.aircraft1.heading
                },
                "aircraft2": {
                    "icao24": conflict.aircraft2.icao24,
                    "callsign": conflict.aircraft2.callsign,
                    "latitude": conflict.aircraft2.latitude,
                    "longitude": conflict.aircraft2.longitude,
                    "altitude": conflict.aircraft2.altitude,
                    "heading": conflict.aircraft2.heading
                },
                "time_to_conflict": conflict.time_to_conflict,
                "separation_distance": conflict.separation_distance,
                "vertical_separation": conflict.vertical_separation,
                "conflict_type": conflict.conflict_type.value,
                "severity": conflict.severity.value,
                "confidence": conflict.confidence,
                "detection_time": conflict.detection_time.isoformat(),
                "resolution_deadline": conflict.resolution_deadline.isoformat() if conflict.resolution_deadline else None
            })
        
        return jsonify({
            "success": True,
            "data": conflict_data,
            "count": len(conflict_data),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/conflicts/<conflict_id>/resolve', methods=['POST'])
def resolve_conflict(conflict_id):
    """Mark a conflict as resolved"""
    try:
        conflict_detector.resolve_conflict(conflict_id)
        return jsonify({
            "success": True,
            "message": f"Conflict {conflict_id} marked as resolved"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/coordination/status')
def get_coordination_status():
    """Get agent coordination status"""
    try:
        status = agent_coordinator.get_coordination_status()
        return jsonify({
            "success": True,
            "data": status
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/coordination/events')
def get_event_history():
    """Get event history"""
    try:
        event_type = request.args.get('event_type')
        limit = int(request.args.get('limit', 100))
        
        events = agent_coordinator.get_event_history(
            event_type=event_type,
            limit=limit
        )
        
        return jsonify({
            "success": True,
            "data": events,
            "count": len(events)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/coordination/metrics')
def get_agent_metrics():
    """Get comprehensive agent metrics"""
    try:
        metrics = agent_coordinator.get_agent_metrics()
        return jsonify({
            "success": True,
            "data": metrics
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Logging and monitoring endpoints

@app.route('/api/atc/logs')
def get_logs():
    """Get system logs"""
    try:
        component = request.args.get('component')
        level = request.args.get('level')
        limit = int(request.args.get('limit', 1000))
        
        # Parse start and end times if provided
        start_time = None
        end_time = None
        if request.args.get('start_time'):
            start_time = datetime.fromisoformat(request.args.get('start_time'))
        if request.args.get('end_time'):
            end_time = datetime.fromisoformat(request.args.get('end_time'))
        
        logs = logging_service.get_logs(
            component=component,
            level=LogLevel(level) if level else None,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        
        return jsonify({
            "success": True,
            "data": logs,
            "count": len(logs)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/metrics')
def get_metrics():
    """Get system metrics"""
    try:
        component = request.args.get('component')
        metric_type = request.args.get('metric_type')
        limit = int(request.args.get('limit', 1000))
        
        # Parse start and end times if provided
        start_time = None
        end_time = None
        if request.args.get('start_time'):
            start_time = datetime.fromisoformat(request.args.get('start_time'))
        if request.args.get('end_time'):
            end_time = datetime.fromisoformat(request.args.get('end_time'))
        
        metrics = logging_service.get_metrics(
            component=component,
            metric_type=metric_type,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        
        return jsonify({
            "success": True,
            "data": metrics,
            "count": len(metrics)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/performance')
def get_performance():
    """Get performance summary"""
    try:
        component = request.args.get('component')
        
        # Parse start and end times if provided
        start_time = None
        end_time = None
        if request.args.get('start_time'):
            start_time = datetime.fromisoformat(request.args.get('start_time'))
        if request.args.get('end_time'):
            end_time = datetime.fromisoformat(request.args.get('end_time'))
        
        performance = logging_service.get_performance_summary(
            component=component,
            start_time=start_time,
            end_time=end_time
        )
        
        return jsonify({
            "success": True,
            "data": performance
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/atc/health')
def get_system_health():
    """Get system health status"""
    try:
        health = logging_service.get_system_health()
        return jsonify({
            "success": True,
            "data": health
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# AI Analysis Endpoints
@app.route('/api/ai/analyze-aircraft', methods=['POST'])
def analyze_aircraft():
    """Analyze aircraft behavior using Cerebras AI"""
    try:
        data = request.get_json()
        aircraft_data = data.get('aircraft', {})
        context = data.get('context', {})
        
        if not aircraft_data:
            return jsonify({
                "success": False,
                "error": "Aircraft data is required"
            }), 400
        
        # Run async analysis
        import asyncio
        
        # Create new event loop for this request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            analysis = loop.run_until_complete(
                simple_ai_service.analyze_aircraft_behavior(aircraft_data, context)
            )
            
            # Convert to dict for JSON serialization
            analysis_dict = {
                "status": analysis.status,
                "summary": analysis.summary,
                "concerns": analysis.concerns,
                "recommendations": analysis.recommendations,
                "confidence": analysis.confidence,
                "metrics": analysis.metrics,
                "timestamp": analysis.timestamp
            }
            
            return jsonify({
                "success": True,
                "data": analysis_dict
            })
            
        finally:
            loop.close()
        
    except Exception as e:
        logging_service.log(LogLevel.ERROR, "ai_analysis", f"Aircraft analysis failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/process-query', methods=['POST'])
def process_natural_language_query():
    """Process natural language queries about aircraft data"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        aircraft_data = data.get('aircraft_data', [])
        context = data.get('context', {})
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Query is required"
            }), 400
        
        # Run async query processing
        import asyncio
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                simple_ai_service.process_natural_language_query(query, aircraft_data, context)
            )
            
            # Convert to dict for JSON serialization
            result_dict = {
                "query_type": result.query_type,
                "response": result.response,
                "filtered_aircraft": result.filtered_aircraft,
                "total_matches": result.total_matches,
                "insights": result.insights,
                "recommendations": result.recommendations
            }
            
            return jsonify({
                "success": True,
                "result": result_dict
            })
            
        except Exception as e:
            logging_service.log(LogLevel.ERROR, "ai_query", f"Query processing error: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Query processing failed: {str(e)}"
            }), 500
            
        finally:
            loop.close()
        
    except Exception as e:
        logging_service.log(LogLevel.ERROR, "ai_analysis", f"Query processing failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/generate-summary', methods=['POST'])
def generate_incident_summary():
    """Generate incident summary for aircraft"""
    try:
        data = request.get_json()
        aircraft_data = data.get('aircraft', {})
        analysis_data = data.get('analysis', {})
        
        if not aircraft_data or not analysis_data:
            return jsonify({
                "success": False,
                "error": "Aircraft data and analysis are required"
            }), 400
        
        # Create analysis object from dict
        from services.simple_ai_service import AircraftAnalysis, AircraftStatusEnum
        
        analysis = AircraftAnalysis(
            status=AircraftStatusEnum(analysis_data.get('status', 'normal')),
            summary=analysis_data.get('summary', ''),
            concerns=analysis_data.get('concerns', []),
            recommendations=analysis_data.get('recommendations', []),
            confidence=analysis_data.get('confidence', 0.5)
        )
        
        # Run async summary generation
        import asyncio
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            summary = loop.run_until_complete(
                simple_ai_service.generate_incident_summary(aircraft_data, analysis)
            )
            
            return jsonify({
                "success": True,
                "data": {
                    "summary": summary,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
            
        finally:
            loop.close()
        
    except Exception as e:
        logging_service.log(LogLevel.ERROR, "ai_analysis", f"Summary generation failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def start_coordination_async():
    """Start agent coordination in a separate thread"""
    import threading
    import asyncio
    
    def run_coordination():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(agent_coordinator.start_coordination())
    
    coordination_thread = threading.Thread(target=run_coordination, daemon=True)
    coordination_thread.start()
    return coordination_thread

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    
    # Log system startup
    logging_service.log(LogLevel.INFO, "system", f"Starting ATC System on port {port}")
    
    # Start agent coordination in separate thread
    start_coordination_async()
    logging_service.log(LogLevel.INFO, "agent_coordinator", "Agent coordination started")
    
    # Start real-time monitoring
    websocket_service.start_monitoring()
    logging_service.log(LogLevel.INFO, "websocket_service", "Real-time monitoring started")
    
    # Log system ready
    logging_service.log(LogLevel.INFO, "system", "ATC System ready")
    
    # Run with SocketIO
    socketio.run(app, debug=True, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
