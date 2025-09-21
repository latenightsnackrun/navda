"""
Simple AI Test Service for ATC Watchlist
This is a minimal backend service to test the AI integration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/ai/analyze-aircraft', methods=['POST'])
def analyze_aircraft():
    """Analyze aircraft behavior"""
    try:
        data = request.get_json()
        aircraft = data.get('aircraft', {})
        context = data.get('context', {})
        
        # Simple rule-based analysis for testing
        altitude = aircraft.get('altitude', 0)
        speed = aircraft.get('speed', 0)
        callsign = aircraft.get('callsign', aircraft.get('icao24', 'Unknown'))
        
        status = 'normal'
        concerns = []
        
        if altitude > 0 and altitude < 1000:
            status = 'concerning'
            concerns.append('Very low altitude')
        
        if speed > 0 and speed > 500:
            status = 'concerning'
            concerns.append('High speed')
        
        if altitude == 0 and speed == 0:
            status = 'monitoring'
            concerns.append('No movement data')
        
        analysis = {
            'status': status,
            'summary': f'Aircraft {callsign} is {status}',
            'concerns': concerns,
            'confidence': 75,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/process-query', methods=['POST'])
def process_query():
    """Process natural language query"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        aircraft_data = data.get('aircraft_data', [])
        context = data.get('context', {})
        
        # Simple query processing for testing
        response = f"I received your query: '{query}'. Found {len(aircraft_data)} aircraft in the system."
        
        # Basic filtering based on common keywords
        filtered_aircraft = []
        if 'low' in query.lower() or 'altitude' in query.lower():
            filtered_aircraft = [ac for ac in aircraft_data if ac.get('altitude', 0) < 5000]
        elif 'high' in query.lower() or 'speed' in query.lower():
            filtered_aircraft = [ac for ac in aircraft_data if ac.get('speed', 0) > 300]
        elif 'watchlist' in query.lower():
            filtered_aircraft = context.get('watchlist', [])
        
        result = {
            'response': response,
            'filtered_aircraft': filtered_aircraft,
            'total_matches': len(filtered_aircraft),
            'insights': ['AI service is in test mode'],
            'recommendations': ['Enable full AI service for advanced analysis']
        }
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/generate-summary', methods=['POST'])
def generate_summary():
    """Generate incident summary"""
    try:
        data = request.get_json()
        watchlist_aircraft = data.get('watchlist_aircraft', [])
        context = data.get('context', {})
        
        summary = f"Currently monitoring {len(watchlist_aircraft)} aircraft. AI analysis in test mode."
        
        result = {
            'summary': summary,
            'key_patterns': ['Basic monitoring active'],
            'risk_level': 'low',
            'recommendations': ['Enable full AI service for detailed analysis'],
            'priority_aircraft': [],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Test Service',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting AI Test Service on port 5002")
    app.run(host='0.0.0.0', port=5002, debug=True)


