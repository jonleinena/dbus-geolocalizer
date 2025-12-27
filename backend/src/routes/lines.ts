import { Router } from 'express';
import { BUS_LINES, getLineByNum, fetchStops, fetchAllArrivals } from '../services/dbus.js';
import { getLineData } from '../services/scraper.js';
import { estimateBusPositions } from '../services/estimator.js';
import { fetchRouteGeometry } from '../services/routing.js';
import type { LinesResponse, StopsResponse, BusesResponse } from '../types.js';

const router = Router();

/**
 * GET /api/lines
 * List all available bus lines
 */
router.get('/', (_req, res) => {
  const response: LinesResponse = {
    lines: BUS_LINES,
  };
  res.json(response);
});

/**
 * GET /api/lines/:lineNum/stops
 * Get all stops for a specific line
 */
router.get('/:lineNum/stops', async (req, res) => {
  try {
    const { lineNum } = req.params;
    const line = getLineByNum(lineNum);
    
    if (!line) {
      res.status(404).json({ error: `Line ${lineNum} not found` });
      return;
    }
    
    // Scrape mapId dynamically from line page
    const { mapId } = await getLineData(line.slug);
    const stops = await fetchStops(mapId);
    
    const response: StopsResponse = {
      lineNum,
      stops,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching stops:', error);
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
});

/**
 * GET /api/lines/:lineNum/buses
 * Get estimated bus positions with ETAs
 */
router.get('/:lineNum/buses', async (req, res) => {
  try {
    const { lineNum } = req.params;
    const line = getLineByNum(lineNum);
    
    if (!line) {
      res.status(404).json({ error: `Line ${lineNum} not found` });
      return;
    }
    
    // Scrape nonce AND mapId from line page
    let nonce: string;
    let mapId: number;
    try {
      const data = await getLineData(line.slug);
      nonce = data.nonce;
      mapId = data.mapId;
    } catch (error) {
      console.error('Error fetching line data:', error);
      res.status(500).json({ error: 'Could not fetch real-time data' });
      return;
    }
    
    // Fetch stops using dynamic mapId
    const stops = await fetchStops(mapId);
    
    if (stops.length === 0) {
      res.json({
        lineNum,
        buses: [],
        stops: [],
        lastUpdated: new Date().toISOString(),
      });
      return;
    }
    
    // Fetch arrivals for all stops and route geometry in parallel
    const [arrivals, routeGeometry] = await Promise.all([
      fetchAllArrivals(lineNum, stops, nonce),
      fetchRouteGeometry(lineNum, stops),
    ]);
    
    // Estimate bus positions
    const buses = estimateBusPositions(lineNum, stops, arrivals);
    
    const response: BusesResponse = {
      lineNum,
      buses,
      stops,
      routeGeometry,
      lastUpdated: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Failed to fetch bus positions' });
  }
});

export default router;

