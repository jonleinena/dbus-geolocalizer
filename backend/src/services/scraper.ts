import https from 'https';

// Custom HTTPS agent to bypass SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Helper to fetch with SSL bypass
async function fetchWithSSLBypass(url: string, options: Record<string, unknown> = {}): Promise<Response> {
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(url, {
    ...options,
    agent: httpsAgent,
  } as Parameters<typeof nodeFetch>[1]) as unknown as Response;
}

/**
 * Scrape security nonce from DBUS website
 * The nonce is required for AJAX calls to calcula_parada
 */
export async function scrapeNonce(lineSlug: string): Promise<string> {
  const url = `https://dbus.eus/es/${lineSlug}/`;
  console.log(`[Scraper] Fetching nonce from: ${url}`);
  
  const response = await fetchWithSSLBypass(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch line page: ${response.status}`);
  }
  
  const html = await response.text();
  console.log(`[Scraper] Page length: ${html.length} chars`);
  
  // Look for nonce in various patterns used by WordPress AJAX
  const patterns = [
    /security["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
    /nonce["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
    /data-security=["']([a-f0-9]+)["']/i,
    /ajax_nonce["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
    /wpgmza_security["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      console.log(`[Scraper] Found nonce: ${match[1]} (pattern: ${pattern.source})`);
      return match[1];
    }
  }
  
  // Fallback: try to find any 10-character hex string that looks like a nonce
  const hexMatch = html.match(/["']([a-f0-9]{10})["']/i);
  if (hexMatch) {
    console.log(`[Scraper] Found nonce (fallback): ${hexMatch[1]}`);
    return hexMatch[1];
  }
  
  // Debug: show what we found that might be a nonce
  const possibleNonces = html.match(/[a-f0-9]{8,12}/gi);
  console.log(`[Scraper] Possible nonces found:`, possibleNonces?.slice(0, 10));
  
  throw new Error('Could not find security nonce in page');
}

// Cache nonces and mapIds to avoid repeated scraping
interface LineCache {
  nonce: string;
  mapId: number;
  timestamp: number;
}
const lineCache = new Map<string, LineCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Scrape both nonce AND mapId from a line page
 */
export async function scrapeLineData(lineSlug: string): Promise<{ nonce: string; mapId: number }> {
  const url = `https://dbus.eus/es/${lineSlug}/`;
  console.log(`[Scraper] Fetching line data from: ${url}`);
  
  const response = await fetchWithSSLBypass(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch line page: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Find mapId from markers.xml URL
  const mapIdMatch = html.match(/(\d+)markers\.xml/);
  if (!mapIdMatch) {
    throw new Error('Could not find mapId in page');
  }
  const mapId = parseInt(mapIdMatch[1], 10);
  console.log(`[Scraper] Found mapId: ${mapId}`);
  
  // Find nonce
  const noncePatterns = [
    /security["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
    /nonce["']?\s*[:=]\s*["']([a-f0-9]+)["']/i,
  ];
  
  let nonce = '';
  for (const pattern of noncePatterns) {
    const match = html.match(pattern);
    if (match) {
      nonce = match[1];
      break;
    }
  }
  
  if (!nonce) {
    const hexMatch = html.match(/["']([a-f0-9]{10})["']/i);
    if (hexMatch) nonce = hexMatch[1];
  }
  
  if (!nonce) {
    throw new Error('Could not find nonce in page');
  }
  
  console.log(`[Scraper] Found nonce: ${nonce}`);
  return { nonce, mapId };
}

export async function getLineData(lineSlug: string): Promise<{ nonce: string; mapId: number }> {
  const cached = lineCache.get(lineSlug);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { nonce: cached.nonce, mapId: cached.mapId };
  }
  
  const data = await scrapeLineData(lineSlug);
  lineCache.set(lineSlug, { ...data, timestamp: Date.now() });
  
  return data;
}

// Legacy function for backwards compatibility
export async function getNonce(lineSlug: string): Promise<string> {
  const data = await getLineData(lineSlug);
  return data.nonce;
}
