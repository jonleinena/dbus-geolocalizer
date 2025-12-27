import type { Stop, Arrival, BusPosition, StopEta } from '../types.js';

/**
 * Estimate bus positions based on arrival times at stops
 * 
 * Algorithm:
 * 1. Group stops by direction (first half = outbound, second half = return)
 * 2. For each direction, look for stops with ETAs
 * 3. A bus is estimated to be between the stop with lowest ETA and the previous stop
 * 4. Interpolate position based on ETA ratio
 * 5. Detect multiple buses by finding "resets" in ETA sequence
 */
export function estimateBusPositions(
  lineNum: string,
  stops: Stop[],
  arrivals: Arrival[]
): BusPosition[] {
  const buses: BusPosition[] = [];
  
  // Create a map of paradaId -> arrival
  // Note: stopMarkerId in Arrival is actually the paradaId (the API expects parada_id)
  const arrivalMap = new Map<string, Arrival>();
  for (const arrival of arrivals) {
    if (arrival.etaMinutes !== null) {
      arrivalMap.set(arrival.stopMarkerId, arrival);
    }
  }
  
  // If no arrivals, return empty
  if (arrivalMap.size === 0) {
    return [];
  }
  
  // Try to detect route direction split
  // For now, assume stops are ordered: outbound then return
  const midpoint = Math.floor(stops.length / 2);
  const outboundStops = stops.slice(0, midpoint);
  const returnStops = stops.slice(midpoint);
  
  // Process each direction
  const outboundBuses = detectBusesInDirection(lineNum, outboundStops, arrivalMap, 'outbound');
  const returnBuses = detectBusesInDirection(lineNum, returnStops, arrivalMap, 'return');
  
  buses.push(...outboundBuses, ...returnBuses);
  
  return buses;
}

function detectBusesInDirection(
  lineNum: string,
  stops: Stop[],
  arrivalMap: Map<string, Arrival>,
  direction: string
): BusPosition[] {
  const buses: BusPosition[] = [];
  
  // Get stops with arrivals in this direction
  // Lookup by paradaId (the stop code used by the API)
  const stopsWithEta: Array<{ stop: Stop; eta: number; index: number }> = [];
  
  for (let i = 0; i < stops.length; i++) {
    const arrival = arrivalMap.get(stops[i].paradaId);
    if (arrival && arrival.etaMinutes !== null) {
      stopsWithEta.push({
        stop: stops[i],
        eta: arrival.etaMinutes,
        index: i,
      });
    }
  }
  
  if (stopsWithEta.length === 0) {
    return [];
  }
  
  // Detect buses by finding local minima in ETA sequence
  // A bus is near the stop with the lowest ETA before it increases again
  let busCount = 0;
  let lastMinEta = -1;
  
  for (let i = 0; i < stopsWithEta.length; i++) {
    const current = stopsWithEta[i];
    const next = stopsWithEta[i + 1];
    
    // Check if this is a local minimum (ETA increases after this)
    // Or if this is significantly lower than what we've seen (new bus)
    const isLocalMin = !next || next.eta > current.eta;
    const isNewBus = lastMinEta !== -1 && current.eta > lastMinEta + 10;
    
    if (isLocalMin || isNewBus) {
      // Estimate position between this stop and the previous
      const stopIndex = current.index;
      const prevStop = stopIndex > 0 ? stops[stopIndex - 1] : stops[stopIndex];
      const currStop = current.stop;
      
      // Interpolate position based on ETA
      // If ETA is 0, bus is at the stop
      // If ETA is higher, bus is further back
      const etaRatio = Math.min(current.eta / 5, 1); // Assume ~5 min between stops
      const lat = currStop.lat + (prevStop.lat - currStop.lat) * etaRatio;
      const lng = currStop.lng + (prevStop.lng - currStop.lng) * etaRatio;
      
      // Build ETA list for all stops from this bus's perspective
      const stopsWithEtaList: StopEta[] = stops.map((s, idx) => {
        const arrival = arrivalMap.get(s.paradaId);
        // Adjust ETA based on this bus's position
        let adjustedEta: number | null = null;
        if (idx >= stopIndex && arrival?.etaMinutes !== null) {
          adjustedEta = arrival.etaMinutes;
        }
        
        return {
          markerId: s.markerId, // Keep markerId for map display
          paradaId: s.paradaId, // Also include paradaId for reference
          name: s.titleEs,
          lat: s.lat,
          lng: s.lng,
          etaMinutes: adjustedEta,
        };
      });
      
      buses.push({
        id: `${lineNum}-${direction}-${busCount}`,
        lineNum,
        lat,
        lng,
        direction,
        nextStopId: currStop.markerId,
        nextStopName: currStop.titleEs,
        etaToNextStop: current.eta,
        stopsWithEta: stopsWithEtaList,
      });
      
      busCount++;
      lastMinEta = current.eta;
    }
  }
  
  return buses;
}

/**
 * Calculate distance between two points in km (Haversine formula)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

