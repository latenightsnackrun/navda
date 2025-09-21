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
    """Represents current state of an aircraft"""
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

class AircraftTrackingService:
    """Service for tracking aircraft using adsb.lol API"""
    
    def __init__(self):
        self.adsb_base_url = "https://api.adsb.lol"
        
        # Cache for API responses
        self.cache = {}
        self.cache_duration = 5  # seconds - reduced for more frequent updates
        
        # Major airports data for dropdown
        self.airports = {
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
            "EGLL": {"name": "London Heathrow Airport", "city": "London", "lat": 51.4700, "lon": -0.4543},
            "LFPG": {"name": "Charles de Gaulle Airport", "city": "Paris", "lat": 49.0097, "lon": 2.5479},
            "EDDF": {"name": "Frankfurt Airport", "city": "Frankfurt", "lat": 50.0379, "lon": 8.5622},
            "EHAM": {"name": "Amsterdam Airport Schiphol", "city": "Amsterdam", "lat": 52.3105, "lon": 4.7683},
            "LIRF": {"name": "Leonardo da Vinci International Airport", "city": "Rome", "lat": 41.8003, "lon": 12.2389},
            "LEMD": {"name": "Adolfo Suárez Madrid-Barajas Airport", "city": "Madrid", "lat": 40.4839, "lon": -3.5680},
            "RJTT": {"name": "Tokyo Haneda Airport", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798},
            "RJAA": {"name": "Narita International Airport", "city": "Tokyo", "lat": 35.7720, "lon": 140.3928},
            "ZBAA": {"name": "Beijing Capital International Airport", "city": "Beijing", "lat": 40.0799, "lon": 116.6031},
            "ZSPD": {"name": "Shanghai Pudong International Airport", "city": "Shanghai", "lat": 31.1434, "lon": 121.8052},
            "VHHH": {"name": "Hong Kong International Airport", "city": "Hong Kong", "lat": 22.3080, "lon": 113.9185},
            "WSSS": {"name": "Singapore Changi Airport", "city": "Singapore", "lat": 1.3644, "lon": 103.9915},
            "YSSY": {"name": "Sydney Kingsford Smith Airport", "city": "Sydney", "lat": -33.9399, "lon": 151.1753},
            "YMML": {"name": "Melbourne Airport", "city": "Melbourne", "lat": -37.6733, "lon": 144.8433},
            "CYYZ": {"name": "Toronto Pearson International Airport", "city": "Toronto", "lat": 43.6777, "lon": -79.6248},
            "CYVR": {"name": "Vancouver International Airport", "city": "Vancouver", "lat": 49.1967, "lon": -123.1815}
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
    
    def get_aircraft_by_airport(self, airport_code: str, radius_nm: float = 200) -> List[AircraftState]:
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
            
            return self.get_aircraft_in_sector(min_lat, max_lat, min_lon, max_lon)
            
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
            radius_nm = 200  # 200 nautical miles radius (max 250nm per API)
            
            # Use the correct v2 endpoint format
            url = f"https://api.adsb.lol/v2/lat/{center_lat}/lon/{center_lon}/dist/{radius_nm}"
            
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
            except requests.exceptions.JSONDecodeError as e:
                print(f"Response was not valid JSON: {response.text[:200]}")
                raise Exception(f"Invalid JSON response: {e}")
            
            aircraft_states = []
            
            # Handle different response formats
            aircraft_list = []
            if isinstance(data, list):
                aircraft_list = data
            elif isinstance(data, dict) and 'ac' in data:
                aircraft_list = data['ac']
            elif isinstance(data, dict) and 'aircraft' in data:
                aircraft_list = data['aircraft']
            
            for flight in aircraft_list:
                try:
                    # Check if flight is within the specified sector
                    lat = flight.get('lat', 0)
                    lon = flight.get('lon', 0)
                    
                    if (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
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

                        # Enhanced data extraction
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

                        # Get additional useful fields
                        nav_modes = flight.get('nav_modes', [])
                        category = flight.get('category', 'N/A')
                        
                        # Enhanced altitude calculation
                        altitude_ft = safe_float(alt_baro) if alt_baro != 'ground' else 0
                        if altitude_ft > 0 and altitude_ft < 1000:
                            altitude_ft = round(altitude_ft, 0)
                        elif altitude_ft >= 1000:
                            altitude_ft = round(altitude_ft, -1)  # Round to nearest 10 feet

                        aircraft = AircraftState(
                            icao24=icao24 if icao24 else 'N/A',
                            callsign=callsign.strip(),
                            latitude=round(safe_float(lat), 6),  # Round to 6 decimal places
                            longitude=round(safe_float(lon), 6),  # Round to 6 decimal places
                            altitude=altitude_ft,
                            velocity=round(safe_float(flight.get('gs', flight.get('speed', 0))), 1),  # Round to 1 decimal
                            heading=round(safe_float(flight.get('track', flight.get('heading', 0))), 1),  # Round to 1 decimal
                            vertical_rate=round(safe_float(flight.get('baro_rate', flight.get('vrate', 0))), 0),  # Round to whole number
                            timestamp=datetime.now(),
                            origin_country=origin_country,
                            on_ground=is_on_ground,
                            squawk=squawk,
                            spi=safe_bool(flight.get('spi', False)),
                            position_source=1  # ADSB source
                        )
                        aircraft_states.append(aircraft)
                except (ValueError, TypeError) as e:
                    print(f"Error parsing aircraft data: {e}")
                    continue
            
            # Cache the result
            self.cache[cache_key] = (aircraft_states, datetime.now())
            
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

