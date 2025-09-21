import React, { useEffect, useRef, useState } from 'react';

const GlobeVisualization = () => {
  const globeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.Globe) {
      setError('Globe.gl not loaded');
      setIsLoading(false);
      return;
    }

    const initializeGlobe = () => {
      try {
        // Use example data instead of fetching real-time data
        const myGlobe = new Globe(globeRef.current)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
          .pointOfView({ lat: 39.6, lng: -98.5, altitude: 2 }) // aim at continental US centroid
          .enablePointerInteraction(false) // disable mouse interaction for smooth rotation

          .arcLabel(d => `${d.airline}: ${d.srcIata} &#8594; ${d.dstIata}`)
          .arcStartLat(d => +d.srcAirport.lat)
          .arcStartLng(d => +d.srcAirport.lng)
          .arcEndLat(d => +d.dstAirport.lat)
          .arcEndLng(d => +d.dstAirport.lng)
          .arcDashLength(0.25)
          .arcDashGap(1)
          .arcDashInitialGap(() => Math.random())
          .arcDashAnimateTime(4000)
          .arcColor(d => [`rgba(0, 255, 0, 0.22)`, `rgba(255, 0, 0, 0.22)`])
          .arcsTransitionDuration(0)

          .pointColor(() => 'orange')
          .pointAltitude(0)
          .pointRadius(0.02)
          .pointsMerge(true);

        // Comprehensive flight data - 50+ airports and 100+ routes
        const sampleAirports = [
          // North America
          { iata: 'JFK', lat: 40.6413, lng: -73.7781, name: 'John F. Kennedy International' },
          { iata: 'LAX', lat: 34.0522, lng: -118.2437, name: 'Los Angeles International' },
          { iata: 'ORD', lat: 41.9786, lng: -87.9048, name: 'Chicago O\'Hare International' },
          { iata: 'ATL', lat: 33.6407, lng: -84.4277, name: 'Hartsfield-Jackson Atlanta International' },
          { iata: 'DFW', lat: 32.8968, lng: -97.0380, name: 'Dallas/Fort Worth International' },
          { iata: 'DEN', lat: 39.8561, lng: -104.6737, name: 'Denver International' },
          { iata: 'SFO', lat: 37.6213, lng: -122.3790, name: 'San Francisco International' },
          { iata: 'SEA', lat: 47.4502, lng: -122.3088, name: 'Seattle-Tacoma International' },
          { iata: 'MIA', lat: 25.7959, lng: -80.2870, name: 'Miami International' },
          { iata: 'BOS', lat: 42.3656, lng: -71.0096, name: 'Logan International' },
          { iata: 'YYZ', lat: 43.6777, lng: -79.6308, name: 'Toronto Pearson International' },
          { iata: 'YVR', lat: 49.1967, lng: -123.1815, name: 'Vancouver International' },
          { iata: 'MEX', lat: 19.4363, lng: -99.0721, name: 'Mexico City International' },
          
          // Europe
          { iata: 'LHR', lat: 51.4700, lng: -0.4543, name: 'London Heathrow' },
          { iata: 'CDG', lat: 49.0097, lng: 2.5479, name: 'Charles de Gaulle' },
          { iata: 'FRA', lat: 50.0379, lng: 8.5622, name: 'Frankfurt Airport' },
          { iata: 'AMS', lat: 52.3105, lng: 4.7683, name: 'Amsterdam Schiphol' },
          { iata: 'MAD', lat: 40.4983, lng: -3.5676, name: 'Madrid-Barajas' },
          { iata: 'FCO', lat: 41.8003, lng: 12.2389, name: 'Leonardo da Vinci-Fiumicino' },
          { iata: 'MUC', lat: 48.3538, lng: 11.7861, name: 'Munich Airport' },
          { iata: 'ZUR', lat: 47.4647, lng: 8.5492, name: 'Zurich Airport' },
          { iata: 'VIE', lat: 48.1103, lng: 16.5697, name: 'Vienna International' },
          { iata: 'ARN', lat: 59.6519, lng: 17.9186, name: 'Stockholm Arlanda' },
          { iata: 'CPH', lat: 55.6179, lng: 12.6560, name: 'Copenhagen Airport' },
          { iata: 'HEL', lat: 60.3172, lng: 24.9633, name: 'Helsinki-Vantaa' },
          { iata: 'IST', lat: 41.2753, lng: 28.7519, name: 'Istanbul Airport' },
          { iata: 'DME', lat: 55.4146, lng: 37.9005, name: 'Domodedovo International' },
          
          // Asia Pacific
          { iata: 'NRT', lat: 35.7720, lng: 140.3928, name: 'Narita International' },
          { iata: 'HND', lat: 35.5494, lng: 139.7798, name: 'Haneda Airport' },
          { iata: 'ICN', lat: 37.4602, lng: 126.4407, name: 'Incheon International' },
          { iata: 'PVG', lat: 31.1434, lng: 121.8052, name: 'Shanghai Pudong International' },
          { iata: 'PEK', lat: 39.9042, lng: 116.4074, name: 'Beijing Capital International' },
          { iata: 'HKG', lat: 22.3080, lng: 113.9185, name: 'Hong Kong International' },
          { iata: 'SIN', lat: 1.3644, lng: 103.9915, name: 'Singapore Changi' },
          { iata: 'BKK', lat: 13.6900, lng: 100.7501, name: 'Suvarnabhumi' },
          { iata: 'KUL', lat: 2.7456, lng: 101.7099, name: 'Kuala Lumpur International' },
          { iata: 'CGK', lat: -6.1256, lng: 106.6558, name: 'Soekarno-Hatta International' },
          { iata: 'MNL', lat: 14.5086, lng: 121.0196, name: 'Ninoy Aquino International' },
          { iata: 'SYD', lat: -33.9399, lng: 151.1753, name: 'Sydney Kingsford Smith' },
          { iata: 'MEL', lat: -37.6733, lng: 144.8433, name: 'Melbourne Airport' },
          { iata: 'BNE', lat: -27.3842, lng: 153.1175, name: 'Brisbane Airport' },
          { iata: 'AKL', lat: -37.0082, lng: 174.7850, name: 'Auckland Airport' },
          { iata: 'BOM', lat: 19.0896, lng: 72.8656, name: 'Chhatrapati Shivaji Maharaj International' },
          { iata: 'DEL', lat: 28.5562, lng: 77.1000, name: 'Indira Gandhi International' },
          { iata: 'BKK', lat: 13.6900, lng: 100.7501, name: 'Suvarnabhumi' },
          
          // Middle East & Africa
          { iata: 'DXB', lat: 25.2532, lng: 55.3657, name: 'Dubai International' },
          { iata: 'DOH', lat: 25.2731, lng: 51.6081, name: 'Hamad International' },
          { iata: 'AUH', lat: 24.4330, lng: 54.6511, name: 'Abu Dhabi International' },
          { iata: 'JNB', lat: -26.1367, lng: 28.2411, name: 'O.R. Tambo International' },
          { iata: 'CPT', lat: -33.9648, lng: 18.6017, name: 'Cape Town International' },
          { iata: 'CAI', lat: 30.1127, lng: 31.4000, name: 'Cairo International' },
          { iata: 'NBO', lat: -1.3192, lng: 36.9258, name: 'Jomo Kenyatta International' },
          
          // South America
          { iata: 'GRU', lat: -23.4356, lng: -46.4731, name: 'São Paulo-Guarulhos International' },
          { iata: 'EZE', lat: -34.8222, lng: -58.5358, name: 'Ministro Pistarini International' },
          { iata: 'SCL', lat: -33.3928, lng: -70.7858, name: 'Arturo Merino Benítez International' },
          { iata: 'BOG', lat: 4.7016, lng: -74.1469, name: 'El Dorado International' },
          { iata: 'LIM', lat: -12.0219, lng: -77.1143, name: 'Jorge Chávez International' }
        ];

        const airlines = [
          'American', 'United', 'Delta', 'Southwest', 'JetBlue', 'Alaska', 'Hawaiian',
          'British Airways', 'Lufthansa', 'Air France', 'KLM', 'Iberia', 'Alitalia',
          'SAS', 'Finnair', 'Swiss', 'Austrian', 'Turkish', 'Aeroflot',
          'Japan Airlines', 'ANA', 'Korean Air', 'China Eastern', 'China Southern',
          'Air China', 'Cathay Pacific', 'Singapore Airlines', 'Thai Airways',
          'Malaysia Airlines', 'Garuda Indonesia', 'Philippine Airlines',
          'Qantas', 'Virgin Australia', 'Air New Zealand',
          'Emirates', 'Qatar Airways', 'Etihad', 'Saudia',
          'South African Airways', 'EgyptAir', 'Kenya Airways',
          'LATAM', 'Avianca', 'Aeromexico', 'Copa Airlines'
        ];

        // Generate 100+ realistic flight routes
        const sampleRoutes = [
          // Transatlantic routes
          { airline: 'American', srcIata: 'JFK', dstIata: 'LHR', srcAirport: sampleAirports[0], dstAirport: sampleAirports[13] },
          { airline: 'British Airways', srcIata: 'LHR', dstIata: 'JFK', srcAirport: sampleAirports[13], dstAirport: sampleAirports[0] },
          { airline: 'United', srcIata: 'LAX', dstIata: 'LHR', srcAirport: sampleAirports[1], dstAirport: sampleAirports[13] },
          { airline: 'Delta', srcIata: 'ATL', dstIata: 'CDG', srcAirport: sampleAirports[3], dstAirport: sampleAirports[14] },
          { airline: 'Air France', srcIata: 'CDG', dstIata: 'ATL', srcAirport: sampleAirports[14], dstAirport: sampleAirports[3] },
          { airline: 'Lufthansa', srcIata: 'FRA', dstIata: 'JFK', srcAirport: sampleAirports[15], dstAirport: sampleAirports[0] },
          { airline: 'KLM', srcIata: 'AMS', dstIata: 'LAX', srcAirport: sampleAirports[16], dstAirport: sampleAirports[1] },
          { airline: 'Iberia', srcIata: 'MAD', dstIata: 'MIA', srcAirport: sampleAirports[17], dstAirport: sampleAirports[8] },
          { airline: 'Alitalia', srcIata: 'FCO', dstIata: 'JFK', srcAirport: sampleAirports[18], dstAirport: sampleAirports[0] },
          { airline: 'Swiss', srcIata: 'ZUR', dstIata: 'SFO', srcAirport: sampleAirports[20], dstAirport: sampleAirports[6] },
          
          // Transpacific routes
          { airline: 'United', srcIata: 'LAX', dstIata: 'NRT', srcAirport: sampleAirports[1], dstAirport: sampleAirports[25] },
          { airline: 'Japan Airlines', srcIata: 'NRT', dstIata: 'LAX', srcAirport: sampleAirports[25], dstAirport: sampleAirports[1] },
          { airline: 'ANA', srcIata: 'HND', dstIata: 'SFO', srcAirport: sampleAirports[26], dstAirport: sampleAirports[6] },
          { airline: 'Korean Air', srcIata: 'ICN', dstIata: 'LAX', srcAirport: sampleAirports[27], dstAirport: sampleAirports[1] },
          { airline: 'China Eastern', srcIata: 'PVG', dstIata: 'JFK', srcAirport: sampleAirports[28], dstAirport: sampleAirports[0] },
          { airline: 'Air China', srcIata: 'PEK', dstIata: 'LAX', srcAirport: sampleAirports[29], dstAirport: sampleAirports[1] },
          { airline: 'Cathay Pacific', srcIata: 'HKG', dstIata: 'SFO', srcAirport: sampleAirports[30], dstAirport: sampleAirports[6] },
          { airline: 'Singapore Airlines', srcIata: 'SIN', dstIata: 'LAX', srcAirport: sampleAirports[31], dstAirport: sampleAirports[1] },
          { airline: 'Thai Airways', srcIata: 'BKK', dstIata: 'JFK', srcAirport: sampleAirports[32], dstAirport: sampleAirports[0] },
          { airline: 'Malaysia Airlines', srcIata: 'KUL', dstIata: 'LAX', srcAirport: sampleAirports[33], dstAirport: sampleAirports[1] },
          
          // Australia/New Zealand routes
          { airline: 'Qantas', srcIata: 'LAX', dstIata: 'SYD', srcAirport: sampleAirports[1], dstAirport: sampleAirports[40] },
          { airline: 'Virgin Australia', srcIata: 'SYD', dstIata: 'LAX', srcAirport: sampleAirports[40], dstAirport: sampleAirports[1] },
          { airline: 'Air New Zealand', srcIata: 'AKL', dstIata: 'LAX', srcAirport: sampleAirports[43], dstAirport: sampleAirports[1] },
          { airline: 'Qantas', srcIata: 'MEL', dstIata: 'LHR', srcAirport: sampleAirports[41], dstAirport: sampleAirports[13] },
          { airline: 'Qantas', srcIata: 'BNE', dstIata: 'SIN', srcAirport: sampleAirports[42], dstAirport: sampleAirports[31] },
          
          // Middle East routes
          { airline: 'Emirates', srcIata: 'JFK', dstIata: 'DXB', srcAirport: sampleAirports[0], dstAirport: sampleAirports[45] },
          { airline: 'Emirates', srcIata: 'DXB', dstIata: 'JFK', srcAirport: sampleAirports[45], dstAirport: sampleAirports[0] },
          { airline: 'Qatar Airways', srcIata: 'DOH', dstIata: 'LAX', srcAirport: sampleAirports[46], dstAirport: sampleAirports[1] },
          { airline: 'Etihad', srcIata: 'AUH', dstIata: 'JFK', srcAirport: sampleAirports[47], dstAirport: sampleAirports[0] },
          { airline: 'Emirates', srcIata: 'DXB', dstIata: 'LHR', srcAirport: sampleAirports[45], dstAirport: sampleAirports[13] },
          { airline: 'Qatar Airways', srcIata: 'DOH', dstIata: 'CDG', srcAirport: sampleAirports[46], dstAirport: sampleAirports[14] },
          
          // European internal routes
          { airline: 'Lufthansa', srcIata: 'FRA', dstIata: 'LHR', srcAirport: sampleAirports[15], dstAirport: sampleAirports[13] },
          { airline: 'Air France', srcIata: 'CDG', dstIata: 'FRA', srcAirport: sampleAirports[14], dstAirport: sampleAirports[15] },
          { airline: 'KLM', srcIata: 'AMS', dstIata: 'FRA', srcAirport: sampleAirports[16], dstAirport: sampleAirports[15] },
          { airline: 'Iberia', srcIata: 'MAD', dstIata: 'FCO', srcAirport: sampleAirports[17], dstAirport: sampleAirports[18] },
          { airline: 'Swiss', srcIata: 'ZUR', dstIata: 'FRA', srcAirport: sampleAirports[20], dstAirport: sampleAirports[15] },
          { airline: 'Austrian', srcIata: 'VIE', dstIata: 'FRA', srcAirport: sampleAirports[21], dstAirport: sampleAirports[15] },
          { airline: 'SAS', srcIata: 'ARN', dstIata: 'CPH', srcAirport: sampleAirports[22], dstAirport: sampleAirports[23] },
          { airline: 'Finnair', srcIata: 'HEL', dstIata: 'FRA', srcAirport: sampleAirports[24], dstAirport: sampleAirports[15] },
          { airline: 'Turkish', srcIata: 'IST', dstIata: 'FRA', srcAirport: sampleAirports[25], dstAirport: sampleAirports[15] },
          { airline: 'Aeroflot', srcIata: 'DME', dstIata: 'FRA', srcAirport: sampleAirports[26], dstAirport: sampleAirports[15] },
          
          // Asian internal routes
          { airline: 'Japan Airlines', srcIata: 'NRT', dstIata: 'HND', srcAirport: sampleAirports[25], dstAirport: sampleAirports[26] },
          { airline: 'Korean Air', srcIata: 'ICN', dstIata: 'NRT', srcAirport: sampleAirports[27], dstAirport: sampleAirports[25] },
          { airline: 'China Eastern', srcIata: 'PVG', dstIata: 'PEK', srcAirport: sampleAirports[28], dstAirport: sampleAirports[29] },
          { airline: 'Cathay Pacific', srcIata: 'HKG', dstIata: 'SIN', srcAirport: sampleAirports[30], dstAirport: sampleAirports[31] },
          { airline: 'Singapore Airlines', srcIata: 'SIN', dstIata: 'BKK', srcAirport: sampleAirports[31], dstAirport: sampleAirports[32] },
          { airline: 'Thai Airways', srcIata: 'BKK', dstIata: 'KUL', srcAirport: sampleAirports[32], dstAirport: sampleAirports[33] },
          { airline: 'Malaysia Airlines', srcIata: 'KUL', dstIata: 'CGK', srcAirport: sampleAirports[33], dstAirport: sampleAirports[34] },
          { airline: 'Garuda Indonesia', srcIata: 'CGK', dstIata: 'MNL', srcAirport: sampleAirports[34], dstAirport: sampleAirports[35] },
          { airline: 'Philippine Airlines', srcIata: 'MNL', dstIata: 'HKG', srcAirport: sampleAirports[35], dstAirport: sampleAirports[30] },
          { airline: 'Air India', srcIata: 'BOM', dstIata: 'DEL', srcAirport: sampleAirports[36], dstAirport: sampleAirports[37] },
          
          // North American internal routes
          { airline: 'American', srcIata: 'JFK', dstIata: 'LAX', srcAirport: sampleAirports[0], dstAirport: sampleAirports[1] },
          { airline: 'United', srcIata: 'LAX', dstIata: 'ORD', srcAirport: sampleAirports[1], dstAirport: sampleAirports[2] },
          { airline: 'Delta', srcIata: 'ATL', dstIata: 'DFW', srcAirport: sampleAirports[3], dstAirport: sampleAirports[4] },
          { airline: 'Southwest', srcIata: 'DEN', dstIata: 'SFO', srcAirport: sampleAirports[5], dstAirport: sampleAirports[6] },
          { airline: 'Alaska', srcIata: 'SEA', dstIata: 'LAX', srcAirport: sampleAirports[7], dstAirport: sampleAirports[1] },
          { airline: 'JetBlue', srcIata: 'MIA', dstIata: 'JFK', srcAirport: sampleAirports[8], dstAirport: sampleAirports[0] },
          { airline: 'Hawaiian', srcIata: 'BOS', dstIata: 'LAX', srcAirport: sampleAirports[9], dstAirport: sampleAirports[1] },
          { airline: 'Air Canada', srcIata: 'YYZ', dstIata: 'YVR', srcAirport: sampleAirports[10], dstAirport: sampleAirports[11] },
          { airline: 'Aeromexico', srcIata: 'MEX', dstIata: 'LAX', srcAirport: sampleAirports[12], dstAirport: sampleAirports[1] },
          
          // Transcontinental routes
          { airline: 'United', srcIata: 'JFK', dstIata: 'SFO', srcAirport: sampleAirports[0], dstAirport: sampleAirports[6] },
          { airline: 'Delta', srcIata: 'ATL', dstIata: 'LAX', srcAirport: sampleAirports[3], dstAirport: sampleAirports[1] },
          { airline: 'American', srcIata: 'DFW', dstIata: 'SEA', srcAirport: sampleAirports[4], dstAirport: sampleAirports[7] },
          { airline: 'Southwest', srcIata: 'DEN', dstIata: 'MIA', srcAirport: sampleAirports[5], dstAirport: sampleAirports[8] },
          { airline: 'Alaska', srcIata: 'SEA', dstIata: 'BOS', srcAirport: sampleAirports[7], dstAirport: sampleAirports[9] },
          
          // South American routes
          { airline: 'LATAM', srcIata: 'GRU', dstIata: 'EZE', srcAirport: sampleAirports[52], dstAirport: sampleAirports[53] },
          { airline: 'Avianca', srcIata: 'BOG', dstIata: 'GRU', srcAirport: sampleAirports[55], dstAirport: sampleAirports[52] },
          { airline: 'Copa Airlines', srcIata: 'LIM', dstIata: 'GRU', srcAirport: sampleAirports[56], dstAirport: sampleAirports[52] },
          { airline: 'LATAM', srcIata: 'SCL', dstIata: 'GRU', srcAirport: sampleAirports[54], dstAirport: sampleAirports[52] },
          { airline: 'Aeromexico', srcIata: 'MEX', dstIata: 'GRU', srcAirport: sampleAirports[12], dstAirport: sampleAirports[52] },
          
          // Africa routes
          { airline: 'South African Airways', srcIata: 'JNB', dstIata: 'CPT', srcAirport: sampleAirports[48], dstAirport: sampleAirports[49] },
          { airline: 'EgyptAir', srcIata: 'CAI', dstIata: 'JNB', srcAirport: sampleAirports[50], dstAirport: sampleAirports[48] },
          { airline: 'Kenya Airways', srcIata: 'NBO', dstIata: 'JNB', srcAirport: sampleAirports[51], dstAirport: sampleAirports[48] },
          { airline: 'Emirates', srcIata: 'DXB', dstIata: 'JNB', srcAirport: sampleAirports[45], dstAirport: sampleAirports[48] },
          { airline: 'Qatar Airways', srcIata: 'DOH', dstIata: 'CAI', srcAirport: sampleAirports[46], dstAirport: sampleAirports[50] },
          
          // Additional intercontinental routes
          { airline: 'Lufthansa', srcIata: 'FRA', dstIata: 'SIN', srcAirport: sampleAirports[15], dstAirport: sampleAirports[31] },
          { airline: 'KLM', srcIata: 'AMS', dstIata: 'BKK', srcAirport: sampleAirports[16], dstAirport: sampleAirports[32] },
          { airline: 'Air France', srcIata: 'CDG', dstIata: 'HKG', srcAirport: sampleAirports[14], dstAirport: sampleAirports[30] },
          { airline: 'British Airways', srcIata: 'LHR', dstIata: 'BOM', srcAirport: sampleAirports[13], dstAirport: sampleAirports[36] },
          { airline: 'Turkish', srcIata: 'IST', dstIata: 'NRT', srcAirport: sampleAirports[25], dstAirport: sampleAirports[25] },
          { airline: 'Aeroflot', srcIata: 'DME', dstIata: 'PEK', srcAirport: sampleAirports[26], dstAirport: sampleAirports[29] },
          { airline: 'Emirates', srcIata: 'DXB', dstIata: 'SIN', srcAirport: sampleAirports[45], dstAirport: sampleAirports[31] },
          { airline: 'Qatar Airways', srcIata: 'DOH', dstIata: 'MEL', srcAirport: sampleAirports[46], dstAirport: sampleAirports[41] },
          { airline: 'Etihad', srcIata: 'AUH', dstIata: 'SYD', srcAirport: sampleAirports[47], dstAirport: sampleAirports[40] },
          { airline: 'Saudia', srcIata: 'JED', dstIata: 'LAX', srcAirport: sampleAirports[45], dstAirport: sampleAirports[1] },
          
          // Additional North American routes
          { airline: 'American', srcIata: 'JFK', dstIata: 'ORD', srcAirport: sampleAirports[0], dstAirport: sampleAirports[2] },
          { airline: 'United', srcIata: 'ORD', dstIata: 'ATL', srcAirport: sampleAirports[2], dstAirport: sampleAirports[3] },
          { airline: 'Delta', srcIata: 'ATL', dstIata: 'DEN', srcAirport: sampleAirports[3], dstAirport: sampleAirports[5] },
          { airline: 'Southwest', srcIata: 'DEN', dstIata: 'DFW', srcAirport: sampleAirports[5], dstAirport: sampleAirports[4] },
          { airline: 'Alaska', srcIata: 'SEA', dstIata: 'SFO', srcAirport: sampleAirports[7], dstAirport: sampleAirports[6] },
          { airline: 'JetBlue', srcIata: 'MIA', dstIata: 'BOS', srcAirport: sampleAirports[8], dstAirport: sampleAirports[9] },
          { airline: 'Hawaiian', srcIata: 'LAX', dstIata: 'HNL', srcAirport: sampleAirports[1], dstAirport: sampleAirports[1] },
          { airline: 'Air Canada', srcIata: 'YYZ', dstIata: 'JFK', srcAirport: sampleAirports[10], dstAirport: sampleAirports[0] },
          { airline: 'Aeromexico', srcIata: 'MEX', dstIata: 'DFW', srcAirport: sampleAirports[12], dstAirport: sampleAirports[4] },
          
          // Additional European routes
          { airline: 'Lufthansa', srcIata: 'FRA', dstIata: 'MUC', srcAirport: sampleAirports[15], dstAirport: sampleAirports[19] },
          { airline: 'Air France', srcIata: 'CDG', dstIata: 'MAD', srcAirport: sampleAirports[14], dstAirport: sampleAirports[17] },
          { airline: 'KLM', srcIata: 'AMS', dstIata: 'ZUR', srcAirport: sampleAirports[16], dstAirport: sampleAirports[20] },
          { airline: 'Iberia', srcIata: 'MAD', dstIata: 'FCO', srcAirport: sampleAirports[17], dstAirport: sampleAirports[18] },
          { airline: 'Alitalia', srcIata: 'FCO', dstIata: 'VIE', srcAirport: sampleAirports[18], dstAirport: sampleAirports[21] },
          { airline: 'Swiss', srcIata: 'ZUR', dstIata: 'VIE', srcAirport: sampleAirports[20], dstAirport: sampleAirports[21] },
          { airline: 'Austrian', srcIata: 'VIE', dstIata: 'ARN', srcAirport: sampleAirports[21], dstAirport: sampleAirports[22] },
          { airline: 'SAS', srcIata: 'ARN', dstIata: 'CPH', srcAirport: sampleAirports[22], dstAirport: sampleAirports[23] },
          { airline: 'Finnair', srcIata: 'HEL', dstIata: 'ARN', srcAirport: sampleAirports[24], dstAirport: sampleAirports[22] },
          { airline: 'Turkish', srcIata: 'IST', dstIata: 'VIE', srcAirport: sampleAirports[25], dstAirport: sampleAirports[21] },
          { airline: 'Aeroflot', srcIata: 'DME', dstIata: 'IST', srcAirport: sampleAirports[26], dstAirport: sampleAirports[25] }
        ];

        myGlobe
          .pointsData(sampleAirports)
          .arcsData(sampleRoutes);

        // Enable slow rotation
        myGlobe.controls().autoRotate = true;
        myGlobe.controls().autoRotateSpeed = 0.3; // Slow rotation speed

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing globe:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    // Wait for DOM to be ready
    const timeout = setTimeout(() => {
      if (globeRef.current) {
        initializeGlobe();
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="text-red-400 mb-2">⚠️ Globe visualization unavailable</div>
          <div className="text-sm text-gray-400">Using fallback visualization</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={globeRef} 
        className="w-full h-full"
        style={{ 
          background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)',
          margin: 0,
          padding: 0
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-lg">Loading Global Flight Network...</div>
            <div className="text-sm text-gray-400 mt-2">Initializing visualization</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobeVisualization;
