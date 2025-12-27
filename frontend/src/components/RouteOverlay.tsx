import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import type { Stop, BusPosition } from '../types';

interface RouteOverlayProps {
  stops: Stop[];
  selectedBus: BusPosition | null;
}

export function RouteOverlay({ stops, selectedBus }: RouteOverlayProps) {
  if (!selectedBus || stops.length === 0) {
    return null;
  }

  // Create route polyline from stops
  const routePositions = stops.map(s => [s.lat, s.lng] as [number, number]);

  // Get ETAs for this bus
  const etaMap = new Map<string, number | null>();
  selectedBus.stopsWithEta.forEach(s => {
    etaMap.set(s.markerId, s.etaMinutes);
  });

  return (
    <>
      {/* Route polyline */}
      <Polyline
        positions={routePositions}
        pathOptions={{
          color: '#e63946',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 5',
        }}
      />

      {/* Stop markers with ETAs */}
      {stops.map((stop) => {
        const eta = etaMap.get(stop.markerId);
        const hasEta = eta !== null && eta !== undefined;

        return (
          <CircleMarker
            key={stop.markerId}
            center={[stop.lat, stop.lng]}
            radius={hasEta ? 8 : 5}
            pathOptions={{
              fillColor: hasEta ? '#1d3557' : '#6c757d',
              fillOpacity: 0.9,
              color: '#fff',
              weight: 2,
            }}
          >
            <Tooltip
              permanent={hasEta}
              direction="top"
              offset={[0, -10]}
              className={`stop-tooltip ${hasEta ? 'with-eta' : ''}`}
            >
              <div className="tooltip-content">
                <span className="stop-name">{stop.titleEs.split('|')[1]?.trim() || stop.titleEs}</span>
                {hasEta && (
                  <span className="eta-badge">{eta} min</span>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

