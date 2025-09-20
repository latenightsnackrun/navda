// Test script to verify FlightRadar24 model URLs are accessible
import { getAircraftModelUrl, validateModelUrl } from './aircraftModels';

// Test aircraft types
const testAircraftTypes = [
  'B737-800',
  'A320',
  'B747-400',
  'A380',
  'CRJ700',
  'E170',
  'C550',
  'PA28',
  'EC135'
];

// Test model URL generation
export function testModelUrls() {
  console.log('Testing FlightRadar24 model URLs...');
  
  testAircraftTypes.forEach(aircraftType => {
    const modelUrl = getAircraftModelUrl(aircraftType);
    console.log(`${aircraftType}: ${modelUrl}`);
  });
}

// Test model URL validation
export async function testModelValidation() {
  console.log('Validating FlightRadar24 model URLs...');
  
  for (const aircraftType of testAircraftTypes) {
    const modelUrl = getAircraftModelUrl(aircraftType);
    const isValid = await validateModelUrl(modelUrl);
    console.log(`${aircraftType}: ${isValid ? '✅ Valid' : '❌ Invalid'} - ${modelUrl}`);
  }
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  testModelUrls();
  testModelValidation();
} else {
  // Node environment
  console.log('Model URL tests ready for browser execution');
}
