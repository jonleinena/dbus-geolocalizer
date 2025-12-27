import { Router } from 'express';
import { BUS_LINES, getLineByNum, getMapIdForLine, fetchStops, fetchAllArrivals } from '../services/dbus.js';
import { getNonce } from '../services/scraper.js';
import { estimateBusPositions } from '../services/estimator.js';
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
    const mapId = getMapIdForLine(lineNum);
    
    if (!mapId) {
      res.status(404).json({ error: `Line ${lineNum} not found` });
      return;
    }
    
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
    
    // Fetch stops
    const stops = await fetchStops(line.mapId);
    
    if (stops.length === 0) {
      res.json({
        lineNum,
        buses: [],
        stops: [],
        lastUpdated: new Date().toISOString(),
      });
      return;
    }
    
    // Get nonce for API calls
    let nonce: string;
    try {
      nonce = await getNonce(line.slug);
    } catch (error) {
      console.error('Error fetching nonce:', error);
      // Return stops without bus positions if nonce fails
      res.json({
        lineNum,
        buses: [],
        stops,
        lastUpdated: new Date().toISOString(),
        error: 'Could not fetch real-time data',
      });
      return;
    }
    
    // Fetch arrivals for all stops
    const arrivals = await fetchAllArrivals(lineNum, stops, nonce);
    
    // Estimate bus positions
    const buses = estimateBusPositions(lineNum, stops, arrivals);
    
    const response: BusesResponse = {
      lineNum,
      buses,
      stops,
      lastUpdated: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Failed to fetch bus positions' });
  }
});

export default router;

