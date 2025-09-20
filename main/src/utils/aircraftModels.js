// FlightRadar24 3D Models Mapping
// Maps aircraft types to their corresponding 3D models from the fr24-3d-models repository

export const aircraftModelMapping = {
  // Boeing 737 Series
  'B737': 'boeing-737-800',
  'B737-600': 'boeing-737-600',
  'B737-700': 'boeing-737-700',
  'B737-800': 'boeing-737-800',
  'B737-900': 'boeing-737-900',
  '737': 'boeing-737-800',
  '737-600': 'boeing-737-600',
  '737-700': 'boeing-737-700',
  '737-800': 'boeing-737-800',
  '737-900': 'boeing-737-900',

  // Boeing 747 Series
  'B747': 'boeing-747-400',
  'B747-400': 'boeing-747-400',
  'B747-8': 'boeing-747-8i',
  '747': 'boeing-747-400',
  '747-400': 'boeing-747-400',
  '747-8': 'boeing-747-8i',

  // Boeing 757 Series
  'B757': 'boeing-757-200',
  'B757-200': 'boeing-757-200',
  'B757-300': 'boeing-757-300',
  '757': 'boeing-757-200',
  '757-200': 'boeing-757-200',
  '757-300': 'boeing-757-300',

  // Boeing 767 Series
  'B767': 'boeing-767-300',
  'B767-200': 'boeing-767-200',
  'B767-300': 'boeing-767-300',
  'B767-400': 'boeing-767-400',
  '767': 'boeing-767-300',
  '767-200': 'boeing-767-200',
  '767-300': 'boeing-767-300',
  '767-400': 'boeing-767-400',

  // Boeing 777 Series
  'B777': 'boeing-777-300',
  'B777-200': 'boeing-777-200',
  'B777-300': 'boeing-777-300',
  '777': 'boeing-777-300',
  '777-200': 'boeing-777-200',
  '777-300': 'boeing-777-300',

  // Boeing 787 Series
  'B787': 'boeing-787-800',
  'B787-8': 'boeing-787-800',
  'B787-9': 'boeing-787-900',
  '787': 'boeing-787-800',
  '787-8': 'boeing-787-800',
  '787-9': 'boeing-787-900',

  // Airbus A320 Series
  'A318': 'airbus-a318',
  'A319': 'airbus-a319',
  'A320': 'airbus-a320',
  'A321': 'airbus-a321',

  // Airbus A330 Series
  'A330': 'airbus-a330-300',
  'A330-200': 'airbus-a330-200',
  'A330-300': 'airbus-a330-300',

  // Airbus A340 Series
  'A340': 'airbus-a340-300',
  'A340-300': 'airbus-a340-300',
  'A340-600': 'airbus-a340-600',

  // Airbus A350 Series
  'A350': 'airbus-a350',

  // Airbus A380 Series
  'A380': 'airbus-a380',

  // Regional Jets
  'CRJ700': 'bombardier-crj700',
  'CRJ900': 'bombardier-crj900',
  'E170': 'embraer-e170',
  'E190': 'embraer-e190',
  'CS100': 'bombardier-cs100',
  'CS300': 'bombardier-cs300',

  // Turboprops
  'ATR42': 'atr-42',
  'Q400': 'bombardier-dash-8-q400',
  'BAe146': 'bae-146',

  // Business Jets
  'C550': 'cessna-citation-ii',
  'C525': 'cessna-citation-ii',

  // General Aviation
  'PA28': 'piper-pa-28',

  // Helicopters
  'EC135': 'eurocopter-ec135',

  // Special Aircraft
  'AN225': 'an-225-mrija',
  'A300-600ST': 'a300-600st-beluga',
  'ASK21': 'ask-21',
  'Santa': 'santa-claus',
  'Millennium': 'millennium-falcon'
};

// Base URL for FlightRadar24 models
export const FR24_MODELS_BASE_URL = 'https://raw.githubusercontent.com/Flightradar24/fr24-3d-models/master/models';

// Get the 3D model URL for an aircraft type
export function getAircraftModelUrl(aircraftType) {
  if (!aircraftType) return null;
  
  // Normalize the aircraft type (remove spaces, convert to uppercase)
  const normalizedType = aircraftType.toString().toUpperCase().replace(/\s+/g, '');
  
  // Try exact match first
  let modelName = aircraftModelMapping[normalizedType];
  
  // If no exact match, try partial matches
  if (!modelName) {
    // Try to find a model that starts with the aircraft type
    const partialMatch = Object.keys(aircraftModelMapping).find(key => 
      normalizedType.startsWith(key) || key.startsWith(normalizedType)
    );
    if (partialMatch) {
      modelName = aircraftModelMapping[partialMatch];
    }
  }
  
  // If still no match, use a default model
  if (!modelName) {
    modelName = 'boeing-737-800'; // Default to 737-800
  }
  
  return `${FR24_MODELS_BASE_URL}/${modelName}.gltf`;
}

// Get aircraft model scale based on aircraft type
export function getAircraftModelScale(aircraftType) {
  if (!aircraftType) return 1.0;
  
  const normalizedType = aircraftType.toString().toUpperCase().replace(/\s+/g, '');
  
  // Large aircraft (747, 777, A380, etc.)
  if (normalizedType.includes('747') || normalizedType.includes('777') || 
      normalizedType.includes('A380') || normalizedType.includes('A340')) {
    return 1.2;
  }
  
  // Medium aircraft (737, 757, 767, A320, A330, etc.)
  if (normalizedType.includes('737') || normalizedType.includes('757') || 
      normalizedType.includes('767') || normalizedType.includes('A320') || 
      normalizedType.includes('A330') || normalizedType.includes('787')) {
    return 1.0;
  }
  
  // Small aircraft (regional jets, business jets, etc.)
  if (normalizedType.includes('CRJ') || normalizedType.includes('E170') || 
      normalizedType.includes('E190') || normalizedType.includes('C550') || 
      normalizedType.includes('C525')) {
    return 0.8;
  }
  
  // Very small aircraft (GA, helicopters, etc.)
  if (normalizedType.includes('PA28') || normalizedType.includes('EC135') || 
      normalizedType.includes('ASK21')) {
    return 0.6;
  }
  
  return 1.0; // Default scale
}

// Get aircraft model color based on aircraft type and status
export function getAircraftModelColor(aircraftType, status) {
  // Base colors for different aircraft types
  const typeColors = {
    'BOEING': '#1e40af', // Blue
    'AIRBUS': '#059669', // Green
    'BOMBARDIER': '#dc2626', // Red
    'EMBRAER': '#7c3aed', // Purple
    'CESSNA': '#ea580c', // Orange
    'PIPER': '#0891b2', // Cyan
    'ATR': '#be123c', // Rose
    'DEFAULT': '#6b7280' // Gray
  };
  
  if (!aircraftType) return typeColors.DEFAULT;
  
  const normalizedType = aircraftType.toString().toUpperCase();
  
  // Determine manufacturer
  let manufacturer = 'DEFAULT';
  if (normalizedType.includes('B737') || normalizedType.includes('B747') || 
      normalizedType.includes('B757') || normalizedType.includes('B767') || 
      normalizedType.includes('B777') || normalizedType.includes('B787')) {
    manufacturer = 'BOEING';
  } else if (normalizedType.includes('A318') || normalizedType.includes('A319') || 
             normalizedType.includes('A320') || normalizedType.includes('A321') || 
             normalizedType.includes('A330') || normalizedType.includes('A340') || 
             normalizedType.includes('A350') || normalizedType.includes('A380')) {
    manufacturer = 'AIRBUS';
  } else if (normalizedType.includes('CRJ') || normalizedType.includes('CS')) {
    manufacturer = 'BOMBARDIER';
  } else if (normalizedType.includes('E170') || normalizedType.includes('E190')) {
    manufacturer = 'EMBRAER';
  } else if (normalizedType.includes('C550') || normalizedType.includes('C525')) {
    manufacturer = 'CESSNA';
  } else if (normalizedType.includes('PA28')) {
    manufacturer = 'PIPER';
  } else if (normalizedType.includes('ATR')) {
    manufacturer = 'ATR';
  }
  
  return typeColors[manufacturer];
}

// Check if a model URL is valid
export async function validateModelUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Model URL validation failed:', url, error);
    return false;
  }
}
