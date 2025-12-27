import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import type { BusPosition, Stop } from '../types';
import { BusDot } from './BusDot';
import { RouteOverlay } from './RouteOverlay';

interface MapProps {
  buses: BusPosition[];
  stops: Stop[];
  routeGeometry?: [number, number][];
  selectedBusId: string | null;
  onSelectBus: (busId: string | null) => void;
}

// San Sebastián center coordinates
const DEFAULT_CENTER: [number, number] = [43.3183, -1.9812];
const DEFAULT_ZOOM = 13;

export function Map({ buses, stops, routeGeometry, selectedBusId, onSelectBus }: MapProps) {
  const selectedBus = buses.find(b => b.id === selectedBusId) || null;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-container"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />

      {/* Route overlay (shown when bus is selected) */}
      <RouteOverlay stops={stops} selectedBus={selectedBus} routeGeometry={routeGeometry} />

      {/* Bus markers */}
      {buses.map(bus => (
        <BusDot
          key={bus.id}
          bus={bus}
          isSelected={bus.id === selectedBusId}
          onSelect={onSelectBus}
        />
      ))}
    </MapContainer>
  );
}

