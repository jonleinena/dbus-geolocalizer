import { parseStringPromise } from 'xml2js';
import https from 'https';
import type { Stop, BusLine, Arrival } from '../types.js';

// Debug mode - disable in production for performance
const DEBUG = process.env.NODE_ENV !== 'production';

// Custom fetch agent that ignores SSL certificate errors
// This is needed because dbus.eus may have certificate chain issues
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Helper to fetch with SSL bypass
async function fetchWithSSLBypass(url: string, options: Record<string, unknown> = {}): Promise<Response> {
    // Use node-fetch style with agent
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch(url, {
        ...options,
        agent: httpsAgent,
    } as Parameters<typeof nodeFetch>[1]) as unknown as Response;
}

// mapId is now scraped dynamically from line pages

// All available bus lines
export const BUS_LINES: BusLine[] = [
    { lineNum: '05', name: 'Benta Berri', mapId: 5, slug: '05-benta-berri' },
    { lineNum: '08', name: 'Gros-Intxaurrondo', mapId: 8, slug: '08-gros-intxaurrondo' },
    { lineNum: '09', name: 'Egia-Intxaurrondo', mapId: 9, slug: '09-egia-intxaurrondo' },
    { lineNum: '13', name: 'Altza', mapId: 13, slug: '13-altza' },
    { lineNum: '14', name: 'Bidebieta', mapId: 14, slug: '14-bidebieta' },
    { lineNum: '16', name: 'Igeldo', mapId: 16, slug: '16-igeldo' },
    { lineNum: '17', name: 'Gros-Amara-Miramon', mapId: 17, slug: '17-gros-amara-miramon' },
    { lineNum: '18', name: 'Seminarioa', mapId: 18, slug: '18-seminarioa' },
    { lineNum: '19', name: 'Aiete-Bera Bera', mapId: 4, slug: '19-aiete-bera-bera' },
    { lineNum: '21', name: 'Amara-Mutualitateak', mapId: 21, slug: '21-amara-mutualitateak' },
    { lineNum: '23', name: 'Errondo-Puio', mapId: 23, slug: '23-errondo-puio' },
    { lineNum: '24', name: 'Altza-Gros-Antiguo-Intxaurrondo', mapId: 24, slug: '24-altza-gros-antiguo-intxaurrondo' },
    { lineNum: '25', name: 'BentaBerri-Añorga', mapId: 25, slug: '25-bentaberri-anorga' },
    { lineNum: '26', name: 'Amara-Martutene', mapId: 26, slug: '26-amara-martutene' },
    { lineNum: '27', name: 'Altza-Intxaurrondo-Antiguo-Gros', mapId: 27, slug: '27-altza-intxaurrondo-antiguo-gros' },
    { lineNum: '28', name: 'Amara-Ospitaleak', mapId: 28, slug: '28-amara-ospitaleak' },
    { lineNum: '29', name: 'Intxaurrondo Sur', mapId: 29, slug: '29-intxaurrondo-sur' },
    { lineNum: '31', name: 'Intxaurrondo-Ospitaleak-Altza', mapId: 31, slug: '31-intxaurrondo-ospitaleak-altza' },
    { lineNum: '32', name: 'Puio-Errondo', mapId: 32, slug: '32-puio-errondo' },
    { lineNum: '33', name: 'Larratxo-Intxaur-Berio-Igara', mapId: 19, slug: '33-larratxo-intxaur-berio-igara' },
    { lineNum: '35', name: 'Antiguo-Aiete-Ospitaleak', mapId: 35, slug: '35-antiguo-aiete-ospitaleak' },
    { lineNum: '36', name: 'Aldakonea-San Roke', mapId: 36, slug: '36-aldakonea-san-roke' },
    { lineNum: '37', name: 'Rodil-Zorroaga', mapId: 37, slug: '37-rodil-zorroaga' },
    { lineNum: '38', name: 'Trintxerpe-Altza-Molinao', mapId: 38, slug: '38-trintxerpe-altza-molinao' },
    { lineNum: '39', name: 'Urgull', mapId: 39, slug: '39-urgull' },
    { lineNum: '40', name: 'Gros-Antiguo-Igara', mapId: 40, slug: '40-gros-antiguo-igara' },
    { lineNum: '41', name: 'Gros-Egia-Martutene', mapId: 41, slug: '41-gros-egia-martutene' },
    { lineNum: '42', name: 'Aldapa-Egia', mapId: 42, slug: '42-aldapa-egia' },
    { lineNum: '43', name: 'Anoeta-Igara', mapId: 43, slug: '43-anoeta-igara' },
    { lineNum: '45', name: 'Estaciones-Antiguo-Aiete', mapId: 45, slug: '45-estaciones-renfe-bus-geltokiak-antiguo-aiete' },
    { lineNum: '46', name: 'San Antonio-Morlans', mapId: 46, slug: '46-san-antonio-morlans' },
    { lineNum: 'B1', name: 'Benta Berri-Berio-Añorga', mapId: 101, slug: 'b1-benta-berri-berio-anorga' },
    { lineNum: 'B2', name: 'Aiete-Bera Bera', mapId: 102, slug: 'b2-aiete-bera-bera' },
    { lineNum: 'B3', name: 'Egia-Intxaurrondo', mapId: 103, slug: 'b3-egia-intxaurrondo' },
    { lineNum: 'B4', name: 'Amara-Riberas-Martutene', mapId: 104, slug: 'b4-amara-riberas-martutene' },
    { lineNum: 'B6', name: 'Altza', mapId: 106, slug: 'b6-altza' },
    { lineNum: 'B7', name: 'Igeldo', mapId: 107, slug: 'b7-igeldo' },
    { lineNum: 'B8', name: 'Miraconcha-BentaBerri-Seminario', mapId: 108, slug: 'b8-miraconcha-bentaberri-seminario' },
    { lineNum: 'B9', name: 'Amara-Errondo-Puio', mapId: 109, slug: 'b9-amara-errondo-puio' },
    { lineNum: 'B10', name: 'Zubiaurre-Bidebieta-Buenavista', mapId: 110, slug: 'b10-zubiaurre-bidebieta-buenavista' },
];

export function getLineByNum(lineNum: string): BusLine | undefined {
    return BUS_LINES.find(l => l.lineNum === lineNum);
}

/**
 * Fetch and parse markers XML for a given map ID
 */
export async function fetchStops(mapId: number): Promise<Stop[]> {
    const url = `https://dbus.eus/wp-content/uploads/wp-google-maps/${mapId}markers.xml`;

    const response = await fetchWithSSLBypass(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch markers XML: ${response.status}`);
    }

    const xml = await response.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    if (!parsed.markers?.marker) {
        return [];
    }

    // Ensure markers is an array
    const markers = Array.isArray(parsed.markers.marker)
        ? parsed.markers.marker
        : [parsed.markers.marker];

    return markers.map((m: Record<string, string>, index: number) => {
        const [lat, lng] = (m.address || '0,0').split(',').map(Number);
        return {
            markerId: m.marker_id || '',
            mapId: m.map_id || '',
            titleEs: m.title_es || '',
            titleEu: m.title_eu || '',
            paradaId: m.parada_id || '',
            lat,
            lng,
            descEs: m.desc_es || '',
            sequence: index,
        };
    });
}

/**
 * Fetch arrival time for a specific stop
 * NOTE: The API expects paradaId (the stop code like "2711"), NOT markerId!
 */
export async function fetchArrival(
    lineNum: string,
    paradaId: string,
    nonce: string,
    debug = false
): Promise<Arrival> {
    const now = new Date();

    const params = new URLSearchParams({
        action: 'calcula_parada',
        security: nonce,
        linea: lineNum,
        parada: paradaId, // This MUST be the parada_id, not marker_id!
        dia: String(now.getDate()),
        mes: String(now.getMonth() + 1),
        year: String(now.getFullYear()),
        hora: String(now.getHours()),
        minuto: String(now.getMinutes()),
    });

    const response = await fetchWithSSLBypass('https://dbus.eus/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
        },
        body: params.toString(),
    });

    const html = await response.text();

    if (debug) {
        console.log(`[DBUS] Arrival response for parada ${paradaId}:`, html.substring(0, 500));
    }

    // Parse ETA from response HTML
    // The response contains lines like: 'Linea 33:  "Berio-Igara": 10 min.'
    // Note: Uses "Linea" without accent and has double-space before quotes
    // IMPORTANT: Strip leading zeros - API returns "Linea 5" not "Linea 05"
    const lineNumNormalized = lineNum.replace(/^0+/, '') || lineNum;
    const lineRegex = new RegExp(`Linea\\s+${lineNumNormalized}:\\s+"([^"]+)":\\s*(\\d+)\\s*min`, 'gi');
    const matches = [...html.matchAll(lineRegex)];

    // Get the first match for this specific line
    const etaMinutes = matches.length > 0 ? parseInt(matches[0][2], 10) : null;
    const direction = matches.length > 0 ? matches[0][1] : 'unknown';

    if (debug) {
        if (etaMinutes !== null) {
            console.log(`[DBUS] Found ETA: ${etaMinutes} min for parada ${paradaId} (direction: ${direction})`);
        } else {
            console.log(`[DBUS] No ETA found for line ${lineNum} at parada ${paradaId}`);
        }
    }

    return {
        stopMarkerId: paradaId, // Using paradaId for consistency
        lineNum,
        direction,
        etaMinutes,
        rawText: html,
    };
}

/**
 * Fetch arrivals for all stops on a line
 */
export async function fetchAllArrivals(
    lineNum: string,
    stops: Stop[],
    nonce: string
): Promise<Arrival[]> {
    if (DEBUG) console.log(`[DBUS] Fetching arrivals for ${stops.length} stops on line ${lineNum}`);

    // Filter out stops without paradaId (shouldn't happen but be safe)
    const validStops = stops.filter(s => s.paradaId);
    if (validStops.length !== stops.length && DEBUG) {
        console.log(`[DBUS] Warning: ${stops.length - validStops.length} stops have no paradaId`);
    }

    // Fetch in parallel with rate limiting (max 10 concurrent for speed)
    const results: Arrival[] = [];
    const batchSize = 10;

    for (let i = 0; i < validStops.length; i += batchSize) {
        const batch = validStops.slice(i, i + batchSize);
        const isFirstBatch = i === 0 && DEBUG; // Only debug first batch
        const batchResults = await Promise.all(
            batch.map(stop => fetchArrival(lineNum, stop.paradaId, nonce, isFirstBatch))
        );
        results.push(...batchResults);

        // Minimal delay between batches
        if (i + batchSize < validStops.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    // Count how many arrivals had ETAs
    const withEta = results.filter(r => r.etaMinutes !== null);
    if (DEBUG) {
        console.log(`[DBUS] Found ${withEta.length}/${results.length} stops with ETAs`);
    }

    return results;
}

