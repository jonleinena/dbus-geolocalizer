import type { Stop, Arrival, BusPosition, StopEta } from '../types.js';

// Debug mode - disable in production for performance
const DEBUG = process.env.NODE_ENV !== 'production';

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

    if (DEBUG) console.log(`[Estimator] Line ${lineNum}: ${stops.length} stops, ${arrivalMap.size} with ETAs`);

    // If no arrivals, return empty
    if (arrivalMap.size === 0) {
        return [];
    }

    // Process ALL stops together (not split) to find local minima
    // The direction info from the API tells us which way the bus is going
    const allBuses = detectBusesInDirection(lineNum, stops, arrivalMap, 'all');

    if (DEBUG) console.log(`[Estimator] Found ${allBuses.length} buses for line ${lineNum}`);

    buses.push(...allBuses);

    return buses;
}

function detectBusesInDirection(
    lineNum: string,
    stops: Stop[],
    arrivalMap: Map<string, Arrival>,
    direction: string
): BusPosition[] {
    const buses: BusPosition[] = [];

    // Get stops with ETAs, sorted by route order
    const stopsWithEta: Array<{ stop: Stop; eta: number; index: number }> = [];
    for (let i = 0; i < stops.length; i++) {
        const arrival = arrivalMap.get(stops[i].paradaId);
        if (arrival && arrival.etaMinutes !== null && arrival.etaMinutes !== undefined) {
            stopsWithEta.push({ stop: stops[i], eta: arrival.etaMinutes, index: i });
        }
    }

    if (stopsWithEta.length === 0) return [];

    // Find LOCAL MINIMA only - these indicate actual buses
    // A local minimum is where ETA decreases then increases (bus is passing)
    let busCount = 0;

    for (let i = 0; i < stopsWithEta.length; i++) {
        const prev = stopsWithEta[i - 1];
        const curr = stopsWithEta[i];
        const next = stopsWithEta[i + 1];

        // Local minimum: lower than both neighbors, OR first/last with low ETA
        const isPrevHigher = !prev || prev.eta > curr.eta;
        const isNextHigher = !next || next.eta > curr.eta;
        const isLocalMin = isPrevHigher && isNextHigher && curr.eta <= 15; // Only if within 15 min

        if (isLocalMin) {
            const stopIndex = curr.index;
            const prevStop = stopIndex > 0 ? stops[stopIndex - 1] : curr.stop;

            // Interpolate: ETA 0 = at stop, ETA 3 = ~60% back toward previous stop
            const etaRatio = Math.min(curr.eta / 5, 0.8);
            const lat = curr.stop.lat + (prevStop.lat - curr.stop.lat) * etaRatio;
            const lng = curr.stop.lng + (prevStop.lng - curr.stop.lng) * etaRatio;

            // Only include stops AHEAD of this bus (from stopIndex onward)
            // Also calculate relative ETA from this bus's perspective
            const stopsAhead: StopEta[] = [];
            for (let j = stopIndex; j < stops.length; j++) {
                const s = stops[j];
                const arrival = arrivalMap.get(s.paradaId);
                stopsAhead.push({
                    markerId: s.markerId,
                    paradaId: s.paradaId,
                    name: s.titleEs,
                    lat: s.lat,
                    lng: s.lng,
                    etaMinutes: arrival?.etaMinutes ?? null,
                });
            }

            buses.push({
                id: `${lineNum}-${direction}-${busCount++}`,
                lineNum,
                lat,
                lng,
                direction,
                nextStopId: curr.stop.markerId,
                nextStopName: curr.stop.titleEs,
                etaToNextStop: curr.eta,
                stopsWithEta: stopsAhead,
            });
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

