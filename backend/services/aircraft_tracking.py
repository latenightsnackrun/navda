"""
Aircraft Tracking Service
Integrates with adsb.lol API for real-time aircraft data
"""

import requests
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import json

@dataclass
class AircraftState:
    """Represents current state of an aircraft with comprehensive data"""
    # Basic identification
    icao24: str
    callsign: str
    latitude: float
    longitude: float
    altitude: float
    velocity: float
    heading: float
    vertical_rate: float
    timestamp: datetime
    origin_country: str
    on_ground: bool
    squawk: str
    spi: bool
    position_source: int
    
    # Additional comprehensive data fields
    registration: str = 'N/A'
    ias: float = 0.0  # Indicated airspeed
    tas: float = 0.0  # True airspeed
    mach: float = 0.0  # Mach number
    gs: float = 0.0   # Ground speed
    mag_heading: float = 0.0
    true_heading: float = 0.0
    nav_heading: float = 0.0
    nav_altitude_mcp: float = 0.0
    nav_altitude_fms: float = 0.0
    nav_qnh: float = 0.0
    nav_modes: list = None
    wd: float = 0.0   # Wind direction
    ws: float = 0.0   # Wind speed
    oat: float = 0.0  # Outside air temperature
    tat: float = 0.0  # Total air temperature
    roll: float = 0.0 # Roll angle
    gps_altitude: float = 0.0
    baro_rate: float = 0.0
    geom_rate: float = 0.0
    aircraft_type: str = 'N/A'
    category: str = 'N/A'
    wake_turb: str = 'N/A'
    manufacturer: str = 'N/A'
    model: str = 'N/A'
    typecode: str = 'N/A'
    year: int = 0
    engine_count: int = 0
    engine_type: str = 'N/A'
    operator: str = 'N/A'
    operator_icao: str = 'N/A'
    operator_iata: str = 'N/A'
    operator_callsign: str = 'N/A'
    owner: str = 'N/A'
    owner_icao: str = 'N/A'
    owner_iata: str = 'N/A'
    owner_callsign: str = 'N/A'
    test: bool = False
    special: bool = False
    military: bool = False
    interesting: bool = False
    alert: bool = False
    emergency: bool = False
    silent: bool = False
    rssi: float = 0.0
    dbm: float = 0.0
    seen: float = 0.0
    seen_pos: float = 0.0
    seen_at: float = 0.0
    messages: int = 0
    mlat: list = None
    tisb: list = None
    data_age_sec: float = 0.0

class AircraftTrackingService:
    """Service for tracking aircraft using adsb.lol API"""
    
    def __init__(self):
        self.adsb_base_url = "https://api.adsb.lol"
        
        # Cache for API responses
        self.cache = {}
        self.cache_duration = 2  # seconds - very frequent updates for more datapoints
        
        # Major airports data for dropdown - expanded list
        self.airports = {
            # US Major Airports
            "KJFK": {"name": "John F. Kennedy International Airport", "city": "New York", "lat": 40.6413, "lon": -73.7781},
            "KLAX": {"name": "Los Angeles International Airport", "city": "Los Angeles", "lat": 33.9425, "lon": -118.4081},
            "KORD": {"name": "O'Hare International Airport", "city": "Chicago", "lat": 41.9786, "lon": -87.9048},
            "KDFW": {"name": "Dallas/Fort Worth International Airport", "city": "Dallas", "lat": 32.8968, "lon": -97.0380},
            "KATL": {"name": "Hartsfield-Jackson Atlanta International Airport", "city": "Atlanta", "lat": 33.6407, "lon": -84.4277},
            "KDEN": {"name": "Denver International Airport", "city": "Denver", "lat": 39.8561, "lon": -104.6737},
            "KSEA": {"name": "Seattle-Tacoma International Airport", "city": "Seattle", "lat": 47.4502, "lon": -122.3088},
            "KMIA": {"name": "Miami International Airport", "city": "Miami", "lat": 25.7959, "lon": -80.2870},
            "KPHX": {"name": "Phoenix Sky Harbor International Airport", "city": "Phoenix", "lat": 33.4342, "lon": -112.0116},
            "KCLT": {"name": "Charlotte Douglas International Airport", "city": "Charlotte", "lat": 35.2144, "lon": -80.9473},
            "KBOS": {"name": "Logan International Airport", "city": "Boston", "lat": 42.3656, "lon": -71.0096},
            "KLAS": {"name": "McCarran International Airport", "city": "Las Vegas", "lat": 36.0840, "lon": -115.1537},
            "KIAH": {"name": "George Bush Intercontinental Airport", "city": "Houston", "lat": 29.9844, "lon": -95.3414},
            "KMSP": {"name": "Minneapolis-Saint Paul International Airport", "city": "Minneapolis", "lat": 44.8848, "lon": -93.2223},
            "KDTW": {"name": "Detroit Metropolitan Airport", "city": "Detroit", "lat": 42.2162, "lon": -83.3554},
            "KPHL": {"name": "Philadelphia International Airport", "city": "Philadelphia", "lat": 39.8729, "lon": -75.2437},
            "KSLC": {"name": "Salt Lake City International Airport", "city": "Salt Lake City", "lat": 40.7899, "lon": -111.9791},
            "KBWI": {"name": "Baltimore/Washington International Airport", "city": "Baltimore", "lat": 39.1774, "lon": -76.6684},
            "KSAN": {"name": "San Diego International Airport", "city": "San Diego", "lat": 32.7338, "lon": -117.1933},
            "KTPA": {"name": "Tampa International Airport", "city": "Tampa", "lat": 27.9755, "lon": -82.5332},
            
            # International Airports
            "EGLL": {"name": "London Heathrow Airport", "city": "London", "lat": 51.4700, "lon": -0.4543},
            "LFPG": {"name": "Charles de Gaulle Airport", "city": "Paris", "lat": 49.0097, "lon": 2.5479},
            "EDDF": {"name": "Frankfurt Airport", "city": "Frankfurt", "lat": 50.0379, "lon": 8.5622},
            "EHAM": {"name": "Amsterdam Airport Schiphol", "city": "Amsterdam", "lat": 52.3105, "lon": 4.7683},
            "LIRF": {"name": "Leonardo da Vinci International Airport", "city": "Rome", "lat": 41.8003, "lon": 12.2389},
            "LEMD": {"name": "Adolfo Suárez Madrid-Barajas Airport", "city": "Madrid", "lat": 40.4839, "lon": -3.5680},
            "RJTT": {"name": "Tokyo Haneda Airport", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798},
            "RJAA": {"name": "Narita International Airport", "city": "Tokyo", "lat": 35.7720, "lon": 140.3928},
            "ZBAA": {"name": "Beijing Capital International Airport", "city": "Beijing", "lat": 40.0799, "lon": 116.6031},
            "YSSY": {"name": "Sydney Kingsford Smith Airport", "city": "Sydney", "lat": -33.9399, "lon": 151.1753},
            "CYYZ": {"name": "Toronto Pearson International Airport", "city": "Toronto", "lat": 43.6777, "lon": -79.6248},
            "CYVR": {"name": "Vancouver International Airport", "city": "Vancouver", "lat": 49.1967, "lon": -123.1815},
            "SBGR": {"name": "São Paulo/Guarulhos International Airport", "city": "São Paulo", "lat": -23.4356, "lon": -46.4731},
            "ZSPD": {"name": "Shanghai Pudong International Airport", "city": "Shanghai", "lat": 31.1434, "lon": 121.8052},
            "VHHH": {"name": "Hong Kong International Airport", "city": "Hong Kong", "lat": 22.3080, "lon": 113.9185},
            "WSSS": {"name": "Singapore Changi Airport", "city": "Singapore", "lat": 1.3644, "lon": 103.9915},
            "YMML": {"name": "Melbourne Airport", "city": "Melbourne", "lat": -37.6733, "lon": 144.8433}
        }
    
    def get_aircraft_in_sector(self, min_lat: float, max_lat: float, 
                             min_lon: float, max_lon: float) -> List[AircraftState]:
        """Get all aircraft in a specified sector using adsb.lol API"""
        try:
            aircraft_data = self._get_adsb_data(min_lat, max_lat, min_lon, max_lon)
            return aircraft_data
            
        except Exception as e:
            print(f"Error getting aircraft data: {e}")
            return []
    
    def get_aircraft_by_airport(self, airport_code: str, radius_nm: float = 300) -> List[AircraftState]:
        """Get aircraft near a specific airport within specified radius"""
        try:
            if airport_code not in self.airports:
                return []
            
            airport = self.airports[airport_code]
            # Convert nautical miles to degrees (approximate)
            # 1 degree latitude ≈ 60 nautical miles
            # 1 degree longitude ≈ 60 * cos(latitude) nautical miles
            lat_range = radius_nm / 60.0
            lon_range = radius_nm / (60.0 * abs(airport["lat"]))
            
            min_lat = airport["lat"] - lat_range
            max_lat = airport["lat"] + lat_range
            min_lon = airport["lon"] - lon_range
            max_lon = airport["lon"] + lon_range
            
            # Use the direct API call instead of the sector method to get more aircraft
            return self._get_adsb_data(min_lat, max_lat, min_lon, max_lon)
            
        except Exception as e:
            print(f"Error getting aircraft by airport: {e}")
            return []
    
    def _get_adsb_data(self, min_lat: float, max_lat: float, 
                      min_lon: float, max_lon: float) -> List[AircraftState]:
        """Get aircraft data from adsb.lol API"""
        cache_key = f"adsb_{min_lat}_{max_lat}_{min_lon}_{max_lon}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=self.cache_duration):
                return cached_data
        
        try:
            # Use adsb.lol v2 API to get aircraft data
            # Calculate center point and radius for the sector
            center_lat = (min_lat + max_lat) / 2
            center_lon = (min_lon + max_lon) / 2
            
            # Calculate actual radius needed and use max allowed by API
            lat_span = max_lat - min_lat
            lon_span = max_lon - min_lon
            calculated_radius = max(lat_span, lon_span) * 60  # Convert to nautical miles
            radius_nm = min(calculated_radius * 1.5, 250)  # Use 1.5x calculated radius, max 250nm
            
            # Use the correct v2 endpoint format
            url = f"https://api.adsb.lol/v2/lat/{center_lat}/lon/{center_lon}/dist/{radius_nm}"
            
            print(f"Fetching aircraft data from: {url}")
            
            headers = {
                "Accept": "application/json",
                "User-Agent": "ATC-System/1.0"
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            # Debug logging (only if there's an error)
            if response.status_code != 200:
                print(f"ADSB API Status: {response.status_code}")
                print(f"ADSB API Response (first 200 chars): {response.text[:200]}")
            
            response.raise_for_status()
            
            # Check if response is valid JSON
            try:
                data = response.json()
                print(f"Successfully parsed JSON response, type: {type(data)}")
            except requests.exceptions.JSONDecodeError as e:
                print(f"Response was not valid JSON: {response.text[:200]}")
                print(f"Response status: {response.status_code}")
                print(f"Response headers: {response.headers}")
                raise Exception(f"Invalid JSON response: {e}")
            except Exception as e:
                print(f"Unexpected error parsing JSON: {e}")
                print(f"Response text: {response.text[:200]}")
                raise
            
            aircraft_states = []
            
            # Handle different response formats
            aircraft_list = []
            if isinstance(data, list):
                aircraft_list = data
            elif isinstance(data, dict) and 'ac' in data:
                aircraft_list = data['ac']
            elif isinstance(data, dict) and 'aircraft' in data:
                aircraft_list = data['aircraft']
            elif isinstance(data, str):
                print(f"API returned string instead of JSON: {data[:200]}")
                return []
            else:
                print(f"Unexpected data format: {type(data)} - {str(data)[:200]}")
                return []
            
            print(f"API Response type: {type(data)}, aircraft_list type: {type(aircraft_list)}, length: {len(aircraft_list) if aircraft_list else 0}")
            if aircraft_list and len(aircraft_list) > 0:
                print(f"First aircraft item type: {type(aircraft_list[0])}, content: {aircraft_list[0] if len(str(aircraft_list[0])) < 100 else str(aircraft_list[0])[:100]}")
            
            for flight in aircraft_list:
                try:
                    # Skip if flight is not a dictionary
                    if not isinstance(flight, dict):
                        print(f"Skipping non-dict flight item: {type(flight)} - {flight}")
                        continue
                    
                    # Check if flight is within the specified sector (with some tolerance)
                    lat = flight.get('lat', 0)
                    lon = flight.get('lon', 0)
                    
                    # Add small tolerance to include aircraft near the edges
                    lat_tolerance = 0.1  # ~6 nautical miles
                    lon_tolerance = 0.1  # ~6 nautical miles
                    
                    if (min_lat - lat_tolerance <= lat <= max_lat + lat_tolerance and 
                        min_lon - lon_tolerance <= lon <= max_lon + lon_tolerance):
                        # Safely parse numeric fields
                        def safe_float(value, default=0.0):
                            try:
                                return float(value) if value is not None else default
                            except (ValueError, TypeError):
                                return default
                        
                        def safe_bool(value, default=False):
                            if isinstance(value, bool):
                                return value
                            if isinstance(value, str):
                                return value.lower() in ['true', '1', 'yes', 'on']
                            return default
                        
                        def safe_str(value, default='N/A'):
                            if value is None or value == '':
                                return default
                            return str(value).strip()
                        
                        def safe_int(value, default=0):
                            try:
                                return int(value) if value is not None else default
                            except (ValueError, TypeError):
                                return default
                        
                        # Determine if aircraft is on ground
                        alt_baro = flight.get('alt_baro', 0)
                        is_on_ground = (alt_baro == 'ground' or 
                                      (isinstance(alt_baro, (int, float)) and alt_baro < 100))
                        
                        # Get callsign with better fallback logic
                        callsign = flight.get('flight', flight.get('callsign', ''))
                        if not callsign or callsign.strip() == '':
                            # Try to construct callsign from other fields
                            if flight.get('hex'):
                                callsign = f"AC{flight.get('hex', '')[-4:]}"
                            else:
                                callsign = 'N/A'
                        
                        # Clean up callsign
                        if callsign and callsign != 'N/A':
                            callsign = callsign.strip().upper()
                            # Remove common prefixes/suffixes that might be noise
                            if callsign.startswith('N'):
                                callsign = callsign[1:]
                            if len(callsign) > 8:  # Limit length
                                callsign = callsign[:8]
                        
                        # Get squawk code with better handling
                        squawk = flight.get('squawk', '')
                        if not squawk or squawk == '' or squawk == '0':
                            squawk = 'N/A'
                        
                        # Get origin country from icao24 if available
                        icao24 = flight.get('hex', flight.get('icao', ''))
                        origin_country = 'N/A'
                        if icao24 and len(icao24) >= 6:
                            # Basic country detection from ICAO24
                            if icao24.startswith(('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h')):
                                origin_country = 'US'
                            elif icao24.startswith(('4')):
                                origin_country = 'US'
                            elif icao24.startswith(('3')):
                                origin_country = 'CA'
                            elif icao24.startswith(('4')):
                                origin_country = 'US'
                            elif icao24.startswith(('5')):
                                origin_country = 'US'
                            elif icao24.startswith(('6')):
                                origin_country = 'US'
                            elif icao24.startswith(('7')):
                                origin_country = 'US'
                            elif icao24.startswith(('8')):
                                origin_country = 'US'
                            elif icao24.startswith(('9')):
                                origin_country = 'US'
                            elif icao24.startswith(('c')):
                                origin_country = 'CA'
                            elif icao24.startswith(('e')):
                                origin_country = 'EU'
                            elif icao24.startswith(('f')):
                                origin_country = 'FR'
                            elif icao24.startswith(('g')):
                                origin_country = 'UK'
                            elif icao24.startswith(('h')):
                                origin_country = 'US'
                            elif icao24.startswith(('i')):
                                origin_country = 'IT'
                            elif icao24.startswith(('j')):
                                origin_country = 'JP'
                            elif icao24.startswith(('k')):
                                origin_country = 'US'
                            elif icao24.startswith(('l')):
                                origin_country = 'US'
                            elif icao24.startswith(('m')):
                                origin_country = 'MX'
                            elif icao24.startswith(('n')):
                                origin_country = 'US'
                            elif icao24.startswith(('o')):
                                origin_country = 'US'
                            elif icao24.startswith(('p')):
                                origin_country = 'US'
                            elif icao24.startswith(('q')):
                                origin_country = 'US'
                            elif icao24.startswith(('r')):
                                origin_country = 'RU'
                            elif icao24.startswith(('s')):
                                origin_country = 'US'
                            elif icao24.startswith(('t')):
                                origin_country = 'US'
                            elif icao24.startswith(('u')):
                                origin_country = 'US'
                            elif icao24.startswith(('v')):
                                origin_country = 'CA'
                            elif icao24.startswith(('w')):
                                origin_country = 'US'
                            elif icao24.startswith(('x')):
                                origin_country = 'US'
                            elif icao24.startswith(('y')):
                                origin_country = 'US'
                            elif icao24.startswith(('z')):
                                origin_country = 'US'

                        # Enhanced data extraction with more fields
                        aircraft_type = flight.get('t', 'N/A')
                        if aircraft_type == 'N/A' or aircraft_type == '':
                            # Try to determine aircraft type from callsign patterns
                            if callsign and callsign != 'N/A':
                                callsign_upper = callsign.upper()
                                if any(airline in callsign_upper for airline in ['AAL', 'UAL', 'DAL', 'SWA', 'JBU', 'BAW', 'AFR', 'DLH', 'KLM']):
                                    aircraft_type = 'Commercial'
                                elif any(military in callsign_upper for military in ['RCH', 'CNV', 'EVAC', 'REACH', 'AIR FORCE', 'ARMY', 'NAVY']):
                                    aircraft_type = 'Military'
                                elif callsign_upper.startswith('N') and len(callsign_upper) <= 6:
                                    aircraft_type = 'Private'
                                else:
                                    aircraft_type = 'Unknown'

                        # Get additional useful fields for more comprehensive data
                        nav_modes = flight.get('nav_modes', [])
                        category = flight.get('category', 'N/A')
                        rssi = flight.get('rssi', 0)  # Signal strength
                        dbm = flight.get('dbm', 0)   # Signal power
                        seen = flight.get('seen', 0)  # Time since last seen
                        seen_pos = flight.get('seen_pos', 0)  # Time since position update
                        seen_at = flight.get('seen_at', 0)    # Time since last message
                        messages = flight.get('messages', 0)  # Total message count
                        mlat = flight.get('mlat', [])        # MLAT data
                        tisb = flight.get('tisb', [])        # TIS-B data
                        gs = flight.get('gs', 0)             # Ground speed
                        ias = flight.get('ias', 0)           # Indicated airspeed
                        tas = flight.get('tas', 0)           # True airspeed
                        mach = flight.get('mach', 0)         # Mach number
                        wd = flight.get('wd', 0)             # Wind direction
                        ws = flight.get('ws', 0)             # Wind speed
                        oat = flight.get('oat', 0)           # Outside air temperature
                        tat = flight.get('tat', 0)           # Total air temperature
                        roll = flight.get('roll', 0)         # Roll angle
                        mag_heading = flight.get('mag_heading', 0)  # Magnetic heading
                        true_heading = flight.get('true_heading', 0)  # True heading
                        baro_rate = flight.get('baro_rate', 0)  # Barometric rate
                        geom_rate = flight.get('geom_rate', 0)  # Geometric rate
                        nav_altitude_mcp = flight.get('nav_altitude_mcp', 0)  # MCP altitude
                        nav_altitude_fms = flight.get('nav_altitude_fms', 0)  # FMS altitude
                        nav_qnh = flight.get('nav_qnh', 0)    # QNH setting
                        nav_heading = flight.get('nav_heading', 0)  # Navigation heading
                        # Additional fields
                        wake_turb = flight.get('wake_turb', 'N/A')
                        engine_count = flight.get('engine_count', 0)
                        engine_type = flight.get('engine_type', 'N/A')
                        manufacturer = flight.get('manufacturer', 'N/A')
                        model = flight.get('model', 'N/A')
                        typecode = flight.get('typecode', 'N/A')
                        operator = flight.get('operator', 'N/A')
                        operator_icao = flight.get('operator_icao', 'N/A')
                        operator_iata = flight.get('operator_iata', 'N/A')
                        operator_callsign = flight.get('operator_callsign', 'N/A')
                        owner = flight.get('owner', 'N/A')
                        owner_icao = flight.get('owner_icao', 'N/A')
                        owner_iata = flight.get('owner_iata', 'N/A')
                        owner_callsign = flight.get('owner_callsign', 'N/A')
                        test = flight.get('test', False)
                        special = flight.get('special', False)
                        military = flight.get('military', False)
                        interesting = flight.get('interesting', False)
                        alert = flight.get('alert', False)
                        emergency = flight.get('emergency', False)
                        silent = flight.get('silent', False)
                        gps_altitude = flight.get('gps_altitude', flight.get('gps', 0))
                        year = flight.get('year', 0)
                        
                        # Enhanced altitude calculation
                        altitude_ft = safe_float(alt_baro) if alt_baro != 'ground' else 0
                        if altitude_ft > 0 and altitude_ft < 1000:
                            altitude_ft = round(altitude_ft, 0)
                        elif altitude_ft >= 1000:
                            altitude_ft = round(altitude_ft, -1)  # Round to nearest 10 feet

                        aircraft = AircraftState(
                            # Basic identification
                            icao24=icao24 if icao24 else 'N/A',
                            callsign=callsign.strip(),
                            latitude=round(safe_float(lat), 6),
                            longitude=round(safe_float(lon), 6),
                            altitude=altitude_ft,
                            velocity=round(safe_float(flight.get('gs', flight.get('speed', 0))), 1),
                            heading=round(safe_float(flight.get('track', flight.get('heading', 0))), 1),
                            vertical_rate=round(safe_float(flight.get('baro_rate', flight.get('vrate', 0))), 0),
                            timestamp=datetime.now(),
                            origin_country=origin_country,
                            on_ground=is_on_ground,
                            squawk=squawk,
                            spi=safe_bool(flight.get('spi', False)),
                            position_source=1,
                            
                            # Additional comprehensive data
                            registration=safe_str(flight.get('r', flight.get('registration', 'N/A'))),
                            ias=safe_float(flight.get('ias', 0)),
                            tas=safe_float(flight.get('tas', 0)),
                            mach=safe_float(flight.get('mach', 0)),
                            gs=safe_float(flight.get('gs', 0)),
                            mag_heading=safe_float(flight.get('mag_heading', 0)),
                            true_heading=safe_float(flight.get('true_heading', 0)),
                            nav_heading=safe_float(flight.get('nav_heading', 0)),
                            nav_altitude_mcp=safe_float(flight.get('nav_altitude_mcp', 0)),
                            nav_altitude_fms=safe_float(flight.get('nav_altitude_fms', 0)),
                            nav_qnh=safe_float(flight.get('nav_qnh', 0)),
                            nav_modes=flight.get('nav_modes', []),
                            wd=safe_float(flight.get('wd', 0)),
                            ws=safe_float(flight.get('ws', 0)),
                            oat=safe_float(flight.get('oat', 0)),
                            tat=safe_float(flight.get('tat', 0)),
                            roll=safe_float(flight.get('roll', 0)),
                            gps_altitude=safe_float(flight.get('gps_altitude', flight.get('gps', 0))),
                            baro_rate=safe_float(flight.get('baro_rate', 0)),
                            geom_rate=safe_float(flight.get('geom_rate', 0)),
                            aircraft_type=safe_str(flight.get('t', aircraft_type)),
                            category=safe_str(flight.get('category', 'N/A')),
                            wake_turb=safe_str(flight.get('wake_turb', 'N/A')),
                            manufacturer=safe_str(flight.get('manufacturer', 'N/A')),
                            model=safe_str(flight.get('model', 'N/A')),
                            typecode=safe_str(flight.get('typecode', 'N/A')),
                            year=safe_int(flight.get('year', 0)),
                            engine_count=safe_int(flight.get('engine_count', 0)),
                            engine_type=safe_str(flight.get('engine_type', 'N/A')),
                            operator=safe_str(flight.get('operator', 'N/A')),
                            operator_icao=safe_str(flight.get('operator_icao', 'N/A')),
                            operator_iata=safe_str(flight.get('operator_iata', 'N/A')),
                            operator_callsign=safe_str(flight.get('operator_callsign', 'N/A')),
                            owner=safe_str(flight.get('owner', 'N/A')),
                            owner_icao=safe_str(flight.get('owner_icao', 'N/A')),
                            owner_iata=safe_str(flight.get('owner_iata', 'N/A')),
                            owner_callsign=safe_str(flight.get('owner_callsign', 'N/A')),
                            test=safe_bool(flight.get('test', False)),
                            special=safe_bool(flight.get('special', False)),
                            military=safe_bool(flight.get('military', False)),
                            interesting=safe_bool(flight.get('interesting', False)),
                            alert=safe_bool(flight.get('alert', False)),
                            emergency=safe_bool(flight.get('emergency', False)),
                            silent=safe_bool(flight.get('silent', False)),
                            rssi=safe_float(flight.get('rssi', 0)),
                            dbm=safe_float(flight.get('dbm', 0)),
                            seen=safe_float(flight.get('seen', 0)),
                            seen_pos=safe_float(flight.get('seen_pos', 0)),
                            seen_at=safe_float(flight.get('seen_at', 0)),
                            messages=safe_int(flight.get('messages', 0)),
                            mlat=flight.get('mlat', []),
                            tisb=flight.get('tisb', []),
                            data_age_sec=(datetime.now() - datetime.now()).total_seconds()
                        )
                        aircraft_states.append(aircraft)
                except (ValueError, TypeError) as e:
                    print(f"Error parsing aircraft data: {e}")
                    continue
            
            # Cache the result
            self.cache[cache_key] = (aircraft_states, datetime.now())
            
            print(f"Fetched {len(aircraft_states)} aircraft from adsb.lol API for sector {min_lat:.2f},{min_lon:.2f} to {max_lat:.2f},{max_lon:.2f}")
            
            return aircraft_states
            
        except Exception as e:
            print(f"Error fetching from adsb.lol API: {e}")
            # Return sample data as fallback
            return self._get_sample_data(min_lat, max_lat, min_lon, max_lon)
    
    def _get_sample_data(self, min_lat: float, max_lat: float, 
                        min_lon: float, max_lon: float) -> List[AircraftState]:
        """Get sample aircraft data as fallback"""
        # Generate some sample aircraft data within the sector
        import random
        
        aircraft_states = []
        center_lat = (min_lat + max_lat) / 2
        center_lon = (min_lon + max_lon) / 2
        
        # Generate 8-15 sample aircraft for better visualization
        num_aircraft = random.randint(8, 15)
        
        # Common airline codes for more realistic data
        airlines = ['UAL', 'AAL', 'DAL', 'SWA', 'JBU', 'BAW', 'AFR', 'DLH', 'KLM', 'EZY']
        countries = ['US', 'GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CA', 'AU', 'JP']
        
        for i in range(num_aircraft):
            # Random position within sector
            lat = random.uniform(min_lat, max_lat)
            lon = random.uniform(min_lon, max_lon)
            
            # More realistic altitude distribution
            altitude = random.choice([
                random.uniform(0, 2000),  # Ground/low altitude
                random.uniform(2000, 10000),  # Approach/departure
                random.uniform(10000, 25000),  # Cruise altitude
                random.uniform(25000, 40000)   # High altitude
            ])
            
            # More realistic velocity based on altitude
            if altitude < 2000:
                velocity = random.uniform(50, 200)  # Ground/taxi speeds
                on_ground = True
            else:
                velocity = random.uniform(300, 600)  # Flight speeds
                on_ground = False
            
            aircraft = AircraftState(
                icao24=f"{random.choice(airlines)}{random.randint(100, 999)}",
                callsign=f"{random.choice(airlines)}{random.randint(100, 999)}",
                latitude=lat,
                longitude=lon,
                altitude=altitude,
                velocity=velocity,
                heading=random.uniform(0, 360),
                vertical_rate=random.uniform(-3000, 3000) if not on_ground else 0,
                timestamp=datetime.now(),
                origin_country=random.choice(countries),
                on_ground=on_ground,
                squawk=f"{random.randint(1000, 7777)}",
                spi=False,
                position_source=1
            )
            aircraft_states.append(aircraft)
        
        return aircraft_states
    
    def get_airports_list(self) -> List[Dict]:
        """Get list of available airports for dropdown"""
        return [
            {
                "code": code,
                "name": info["name"],
                "city": info["city"],
                "lat": info["lat"],
                "lon": info["lon"]
            }
            for code, info in self.airports.items()
        ]
    
    def get_aircraft_by_callsign(self, callsign: str) -> Optional[AircraftState]:
        """Get specific aircraft by callsign"""
        # This would typically search through recent data
        # For now, return None as we'd need to implement search logic
        return None
    
    def get_aircraft_track(self, icao24: str, start_time: datetime, 
                          end_time: datetime) -> List[AircraftState]:
        """Get historical track for a specific aircraft using adsb.lol"""
        try:
            # For now, return empty list as adsb.lol doesn't provide historical tracks
            # In production, you might want to implement this using a different service
            return []
            
        except Exception as e:
            print(f"Error getting aircraft track: {e}")
            return []
    
    def get_airports_in_sector(self, min_lat: float, max_lat: float, 
                              min_lon: float, max_lon: float) -> List[Dict]:
        """Get airports in the specified sector"""
        try:
            airports_in_sector = []
            for code, info in self.airports.items():
                if (min_lat <= info["lat"] <= max_lat and 
                    min_lon <= info["lon"] <= max_lon):
                    airports_in_sector.append({
                        "icao": code,
                        "name": info["name"],
                        "city": info["city"],
                        "latitude": info["lat"],
                        "longitude": info["lon"]
                    })
            return airports_in_sector
            
        except Exception as e:
            print(f"Error getting airports: {e}")
            return []
    
    def get_weather_data(self, lat: float, lon: float) -> Optional[Dict]:
        """Get weather data for a specific location"""
        # This would integrate with a weather API
        # For now, return mock data
        return {
            'temperature': 15,
            'wind_speed': 10,
            'wind_direction': 270,
            'visibility': 10,
            'cloud_cover': 30
        }

