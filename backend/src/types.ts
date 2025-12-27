// Bus line information
export interface BusLine {
  lineNum: string;
  name: string;
  mapId: number;
  slug: string;
}

// Stop/marker from XML
export interface Stop {
  markerId: string;
  mapId: string;
  titleEs: string;
  titleEu: string;
  paradaId: string;
  lat: number;
  lng: number;
  descEs: string;
  sequence?: number; // Order in route
}

// Arrival time for a stop
export interface Arrival {
  stopMarkerId: string;
  lineNum: string;
  direction: string;
  etaMinutes: number | null; // null if no bus coming
  rawText: string;
}

// Estimated bus position
export interface BusPosition {
  id: string;
  lineNum: string;
  lat: number;
  lng: number;
  direction: string;
  nextStopId: string;
  nextStopName: string;
  etaToNextStop: number;
  stopsWithEta: StopEta[];
}

// Stop with ETA for route overlay
export interface StopEta {
  markerId: string;
  paradaId?: string; // The stop code used by the API
  name: string;
  lat: number;
  lng: number;
  etaMinutes: number | null;
}

// API response types
export interface LinesResponse {
  lines: BusLine[];
}

export interface StopsResponse {
  lineNum: string;
  stops: Stop[];
}

export interface BusesResponse {
  lineNum: string;
  buses: BusPosition[];
  stops: Stop[];
  routeGeometry?: [number, number][]; // [lng, lat] coordinates following actual roads
  lastUpdated: string;
}

