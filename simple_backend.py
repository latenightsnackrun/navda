#!/usr/bin/env python3

from flask import Flask, jsonify
from flask_cors import CORS
import requests
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

def icao24_to_registration(icao24):
    """Convert ICAO24 hex code to likely registration format"""
    if not icao24 or len(icao24) != 6:
        return icao24
    
    # Convert hex to decimal for US aircraft (common pattern)
    try:
        hex_val = int(icao24, 16)
        
        # US aircraft registrations (N-numbers)
        if 0xA00000 <= hex_val <= 0xAFFFFF:
            # US registration pattern
            suffix = hex_val - 0xA00000
            if suffix < 100000:
                return f"N{suffix}"
            else:
                return f"N{suffix}"
        
        # Canadian aircraft (C-GAAA to C-GZZZ)
        elif 0xC00000 <= hex_val <= 0xC3FFFF:
            suffix = hex_val - 0xC00000
            return f"C-G{suffix:03X}"
        
        # UK aircraft (G-AAAA to G-ZZZZ) 
        elif 0x400000 <= hex_val <= 0x43FFFF:
            suffix = hex_val - 0x400000
            return f"G-{suffix:04X}"
        
        # For other countries, return formatted ICAO24
        else:
            return icao24.upper()
            
    except ValueError:
        return icao24.upper()

# Airport data
AIRPORTS = {
    "KJFK": {"name": "John F. Kennedy International Airport", "city": "New York", "lat": 40.6413, "lon": -73.7781},
    "KLAX": {"name": "Los Angeles International Airport", "city": "Los Angeles", "lat": 33.9425, "lon": -118.4081},
    "KORD": {"name": "Chicago O'Hare International Airport", "city": "Chicago", "lat": 41.9742, "lon": -87.9073},
    "KDFW": {"name": "Dallas/Fort Worth International Airport", "city": "Dallas", "lat": 32.8998, "lon": -97.0403},
    "KDEN": {"name": "Denver International Airport", "city": "Denver", "lat": 39.8561, "lon": -104.6737},
    "KATL": {"name": "Hartsfield-Jackson Atlanta International Airport", "city": "Atlanta", "lat": 33.6407, "lon": -84.4277},
    "KSEA": {"name": "Seattle-Tacoma International Airport", "city": "Seattle", "lat": 47.4502, "lon": -122.3088},
    "KMIA": {"name": "Miami International Airport", "city": "Miami", "lat": 25.7959, "lon": -80.2870},
    "KPHX": {"name": "Phoenix Sky Harbor International Airport", "city": "Phoenix", "lat": 33.4484, "lon": -112.0740},
    "KCLT": {"name": "Charlotte Douglas International Airport", "city": "Charlotte", "lat": 35.2144, "lon": -80.9473},
    "EGLL": {"name": "Heathrow Airport", "city": "London", "lat": 51.4700, "lon": -0.4543},
    "LFPG": {"name": "Charles de Gaulle Airport", "city": "Paris", "lat": 49.0097, "lon": 2.5479},
    "EDDF": {"name": "Frankfurt Airport", "city": "Frankfurt", "lat": 50.0379, "lon": 8.5622},
    "EHAM": {"name": "Amsterdam Schiphol Airport", "city": "Amsterdam", "lat": 52.3105, "lon": 4.7683},
    "LIRF": {"name": "Leonardo da Vinci International Airport", "city": "Rome", "lat": 41.8003, "lon": 12.2389},
    "LEMD": {"name": "Adolfo Suárez Madrid-Barajas Airport", "city": "Madrid", "lat": 40.4839, "lon": -3.5680},
    "RJTT": {"name": "Tokyo Haneda Airport", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798},
    "RJAA": {"name": "Narita International Airport", "city": "Tokyo", "lat": 35.7720, "lon": 140.3928},
    "ZBAA": {"name": "Beijing Capital International Airport", "city": "Beijing", "lat": 40.0799, "lon": 116.6031},
    "ZSPD": {"name": "Shanghai Pudong International Airport", "city": "Shanghai", "lat": 31.1443, "lon": 121.8083},
    "VHHH": {"name": "Hong Kong International Airport", "city": "Hong Kong", "lat": 22.3080, "lon": 113.9185},
    "WSSS": {"name": "Singapore Changi Airport", "city": "Singapore", "lat": 1.3644, "lon": 103.9915},
    "YSSY": {"name": "Sydney Kingsford Smith Airport", "city": "Sydney", "lat": -33.9399, "lon": 151.1753},
    "YMML": {"name": "Melbourne Airport", "city": "Melbourne", "lat": -37.6690, "lon": 144.8410},
    "CYYZ": {"name": "Toronto Pearson International Airport", "city": "Toronto", "lat": 43.6777, "lon": -79.6248},
    "CYVR": {"name": "Vancouver International Airport", "city": "Vancouver", "lat": 49.1939, "lon": -123.1844}
}

def get_aircraft_data_from_api(airport_code, radius_nm=200):
    """Get real aircraft data from adsb.lol API"""
    try:
        airport_info = AIRPORTS.get(airport_code)
        if not airport_info:
            return []
        
        lat = airport_info['lat']
        lon = airport_info['lon']
        
        url = f"https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{radius_nm}"
        headers = {
            "Accept": "application/json",
            "User-Agent": "ATC-System/1.0"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        aircraft_list = []
        
        if isinstance(data, list):
            aircraft_list = data
        elif isinstance(data, dict) and 'ac' in data:
            aircraft_list = data['ac']
        
        processed_aircraft = []
        for flight in aircraft_list:
            try:
                # Extract registration from flight data or generate from ICAO24
                registration = flight.get('r', '').strip()  # Registration field from API
                icao24 = flight.get('hex', 'UNKNOWN')
                
                # If no registration, try to derive from ICAO24 (common patterns)
                if not registration and icao24 != 'UNKNOWN':
                    registration = icao24_to_registration(icao24)
                
                # Get more accurate callsign
                callsign = flight.get('flight', '').strip()
                if not callsign:
                    callsign = flight.get('call', '').strip()
                if not callsign:
                    callsign = registration if registration else icao24
                
                # More precise altitude handling
                alt_baro = flight.get('alt_baro', 0)
                alt_geom = flight.get('alt_geom', 0)
                altitude = alt_baro if alt_baro else alt_geom
                if altitude == "ground":
                    altitude = 0
                else:
                    altitude = float(altitude) if altitude else 0
                
                # Ground speed conversion (knots to m/s, then to knots for display)
                ground_speed = float(flight.get('gs', 0)) if flight.get('gs') else 0
                
                # True airspeed if available
                true_airspeed = float(flight.get('tas', 0)) if flight.get('tas') else ground_speed
                
                # More accurate vertical rate
                vertical_rate = float(flight.get('baro_rate', 0)) if flight.get('baro_rate') else 0
                
                aircraft = {
                    "icao24": icao24,
                    "registration": registration,
                    "callsign": callsign,
                    "latitude": float(flight.get('lat', 0)),
                    "longitude": float(flight.get('lon', 0)),
                    "altitude": altitude,  # Keep in feet
                    "velocity": ground_speed,  # Ground speed in knots
                    "true_airspeed": true_airspeed,  # True airspeed in knots
                    "heading": float(flight.get('track', 0)) if flight.get('track') else 0,
                    "vertical_rate": vertical_rate,  # Feet per minute
                    "origin_country": flight.get('country', 'UNKNOWN'),
                    "on_ground": flight.get('ground', False),
                    "squawk": flight.get('squawk', 'UNKNOWN'),
                    "spi": flight.get('spi', False),
                    "category": flight.get('category', 'A0'),  # Aircraft category
                    "emergency": flight.get('emergency', False),
                    "alert": flight.get('alert', False),
                    "nav_modes": flight.get('nav_modes', []),
                    "nav_altitude_mcp": flight.get('nav_altitude_mcp', None),
                    "nav_heading": flight.get('nav_heading', None),
                    "timestamp": flight.get('now', 0)
                }
                processed_aircraft.append(aircraft)
            except (ValueError, TypeError, KeyError) as e:
                print(f"Error processing aircraft data: {e}")
                continue
        
        return processed_aircraft
        
    except Exception as e:
        print(f"Error fetching from API: {e}")
        return get_sample_aircraft_data(airport_code)

def get_sample_aircraft_data(airport_code):
    """Generate sample aircraft data as fallback"""
    airport_info = AIRPORTS.get(airport_code)
    if not airport_info:
        return []
    
    lat = airport_info['lat']
    lon = airport_info['lon']
    
    aircraft_data = []
    num_aircraft = random.randint(15, 25)
    airlines = ['UAL', 'AAL', 'DAL', 'SWA', 'JBU', 'BAW', 'AFR', 'DLH', 'KLM', 'EZY']
    countries = ['US', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CA', 'AU', 'JP']
    
    for i in range(num_aircraft):
        # Generate positions around the airport
        offset_lat = random.uniform(-2, 2)
        offset_lon = random.uniform(-2, 2)
        
        altitude = random.choice([
            random.uniform(0, 2000),        # Ground/taxi
            random.uniform(2000, 10000),    # Approach/departure
            random.uniform(25000, 40000)    # Cruise
        ])
        
        on_ground = altitude < 2000
        velocity = random.uniform(50, 200) if on_ground else random.uniform(300, 600)
        
        # Generate realistic registration
        icao24_hex = f"{random.randint(0xA00000, 0xAFFFFF):06X}"
        registration = icao24_to_registration(icao24_hex)
        
        aircraft = {
            "icao24": icao24_hex,
            "registration": registration,
            "callsign": f"{random.choice(airlines)}{random.randint(100, 999)}",
            "latitude": lat + offset_lat,
            "longitude": lon + offset_lon,
            "altitude": altitude,
            "velocity": velocity,
            "true_airspeed": velocity * random.uniform(0.95, 1.05),
            "heading": random.uniform(0, 360),
            "vertical_rate": random.uniform(-3000, 3000) if not on_ground else 0,
            "origin_country": random.choice(countries),
            "on_ground": on_ground,
            "squawk": f"{random.randint(1000, 7777)}",
            "spi": False,
            "category": random.choice(['A1', 'A2', 'A3', 'A4', 'A5']),
            "emergency": False,
            "alert": False,
            "nav_modes": [],
            "nav_altitude_mcp": random.randint(20000, 40000) if not on_ground else None,
            "nav_heading": random.randint(0, 360) if not on_ground else None,
            "timestamp": int(datetime.now().timestamp())
        }
        aircraft_data.append(aircraft)
    
    return aircraft_data

@app.route('/api/atc/airports/list', methods=['GET'])
def get_airports():
    """Get list of available airports"""
    airports_list = []
    for code, info in AIRPORTS.items():
        airports_list.append({
            "code": code,
            "name": info["name"],
            "city": info["city"],
            "latitude": info["lat"],
            "longitude": info["lon"]
        })
    
    return jsonify({
        "success": True,
        "data": airports_list,
        "count": len(airports_list)
    })

@app.route('/api/atc/aircraft/airport/<airport_code>', methods=['GET'])
def get_aircraft_by_airport(airport_code):
    """Get aircraft data for a specific airport"""
    try:
        from flask import request
        radius = request.args.get('radius', 200, type=int)  # Default 200nm
        aircraft_data = get_aircraft_data_from_api(airport_code.upper(), radius)
        
        return jsonify({
            "success": True,
            "data": aircraft_data,
            "count": len(aircraft_data),
            "airport": airport_code.upper(),
            "radius": radius
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": [],
            "count": 0
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Simple ATC Backend on port 5005...")
    app.run(host='0.0.0.0', port=5005, debug=True)
