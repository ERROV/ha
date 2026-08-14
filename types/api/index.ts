import { LatLngExpression } from "leaflet";

export interface MarkerData {
  id: number;
  position: any;
  title: string;
  description: string;
  phone?: string;
  workingHours?: string;
  category: 'internet' | 'mobile' | 'both';
  status: 'open' | 'closed' | 'unknown';
}

export interface ZoneData {
  name: string;
  coordinates: LatLngExpression[];
  color?: string;
}

export interface SearchFilters {
  query: string;
  category: string;
  status: string;
  workingHours: boolean;
}