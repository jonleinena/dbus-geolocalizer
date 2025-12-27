import { useState, useEffect, useCallback } from 'react';
import type { BusLine, BusesResponse } from '../types';

const API_BASE = '/api';

export function useLines() {
  const [lines, setLines] = useState<BusLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLines() {
      try {
        const res = await fetch(`${API_BASE}/lines`);
        if (!res.ok) throw new Error('Failed to fetch lines');
        const data = await res.json();
        setLines(data.lines);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchLines();
  }, []);

  return { lines, loading, error };
}

export function useBuses(lineNum: string | null, refreshInterval = 30000) {
  const [data, setData] = useState<BusesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuses = useCallback(async () => {
    if (!lineNum) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/lines/${lineNum}/buses`);
      if (!res.ok) throw new Error('Failed to fetch buses');
      const busData: BusesResponse = await res.json();
      setData(busData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [lineNum]);

  // Initial fetch
  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  // Auto-refresh
  useEffect(() => {
    if (!lineNum) return;

    const interval = setInterval(fetchBuses, refreshInterval);
    return () => clearInterval(interval);
  }, [lineNum, refreshInterval, fetchBuses]);

  return { data, loading, error, refetch: fetchBuses };
}

