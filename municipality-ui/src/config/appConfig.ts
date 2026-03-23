import { setCurrentMunicipality, getCurrentMunicipality } from './municipalityConfig';
import { getMunicipalityById } from '../municipalities';

// Initialize municipality from environment variable
const municipalityId = import.meta.env.VITE_MUNICIPALITY_ID || '390000';
const municipalityConfig =
  getMunicipalityById(municipalityId) || getMunicipalityById('default');

if (!municipalityConfig) {
  throw new Error(`Default municipality configuration not found.`);
}

setCurrentMunicipality(municipalityConfig);

export const AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  backendUrl: import.meta.env.VITE_BACKEND_URL,
  municipalityId,
  getMunicipality: getCurrentMunicipality
};
