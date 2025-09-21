// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  AIRCRAFT: `${API_BASE_URL}/api/atc/aircraft`,
  AIRCRAFT_BY_AIRPORT: (airportCode, radius) => 
    `${API_BASE_URL}/api/atc/aircraft/airport/${airportCode}?radius=${radius}`,
  AIRPORTS: `${API_BASE_URL}/api/atc/airports/list`,
  CONFLICTS: `${API_BASE_URL}/api/atc/conflicts`,
  RESOLUTIONS: `${API_BASE_URL}/api/atc/resolutions`,
  AI_ANALYZE: `${API_BASE_URL}/api/ai/analyze-aircraft`,
  AI_QUERY: `${API_BASE_URL}/api/ai/process-query`,
  AI_SUMMARY: `${API_BASE_URL}/api/ai/generate-summary`
};

export default API_BASE_URL;
