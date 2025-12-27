// Types matching the backend API

export interface BusLine {
  lineNum: string;
  name: string;
  mapId: number;
  slug: string;
}

export interface Stop {
  markerId: string;
  mapId: string;
  titleEs: string;
  titleEu: string;
  paradaId: string;
  lat: number;
  lng: number;
  descEs: string;
  sequence?: number;
}

export interface StopEta {
  markerId: string;
  name: string;
  lat: number;
  lng: number;
  etaMinutes: number | null;
}

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

export interface LinesResponse {
  lines: BusLine[];
}

export interface BusesResponse {
  lineNum: string;
  buses: BusPosition[];
  stops: Stop[];
  routeGeometry?: [number, number][]; // [lng, lat] coordinates following actual roads
  lastUpdated: string;
  error?: string;
}

