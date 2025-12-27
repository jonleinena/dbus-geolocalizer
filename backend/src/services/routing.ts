import https from 'https';
import type { Stop } from '../types.js';

// Debug mode - disable in production for performance
const DEBUG = process.env.NODE_ENV !== 'production';

// Custom HTTPS agent to bypass SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Cache for route geometries (lineNum -> coordinates array)
const routeCache = new Map<string, [number, number][]>();

/**
 * Fetch route geometry from OSRM for a list of stops
 * Returns an array of [lng, lat] coordinates that follow actual roads
 */
export async function fetchRouteGeometry(
  lineNum: string,
  stops: Stop[]
): Promise<[number, number][]> {
  // Check cache first
  const cached = routeCache.get(lineNum);
  if (cached) {
    if (DEBUG) console.log(`[Routing] Using cached route for line ${lineNum}`);
    return cached;
  }

  if (stops.length < 2) {
    return stops.map(s => [s.lng, s.lat]);
  }

  if (DEBUG) console.log(`[Routing] Fetching OSRM route for line ${lineNum} (${stops.length} stops)`);

  try {
    // Build coordinates string for OSRM
    // OSRM uses lng,lat format
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
    
    // OSRM has a limit of ~100 waypoints, so we might need to sample
    // For most bus lines this should be fine
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DBUS-Visualizer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json() as {
      code: string;
      routes?: Array<{
        geometry: {
          type: string;
          coordinates: [number, number][];
        };
      }>;
    };

    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
      throw new Error(`OSRM returned no route: ${data.code}`);
    }

    const coordinates = data.routes[0].geometry.coordinates;
    if (DEBUG) console.log(`[Routing] Got ${coordinates.length} points for line ${lineNum}`);

    // Cache the result
    routeCache.set(lineNum, coordinates);

    return coordinates;
  } catch (error) {
    console.error(`[Routing] OSRM failed for line ${lineNum}:`, error);
    
    // Fallback: return stop coordinates (straight lines)
    const fallback = stops.map(s => [s.lng, s.lat] as [number, number]);
    routeCache.set(lineNum, fallback); // Cache fallback too to avoid repeated failures
    return fallback;
  }
}

/**
 * Clear the route cache (useful if stops change)
 */
export function clearRouteCache(lineNum?: string): void {
  if (lineNum) {
    routeCache.delete(lineNum);
  } else {
    routeCache.clear();
  }
}

