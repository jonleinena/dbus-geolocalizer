import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BusPosition } from '../types';

interface BusDotProps {
  bus: BusPosition;
  isSelected: boolean;
  onSelect: (busId: string | null) => void;
}

// Create a red dot icon for buses
const busIcon = L.divIcon({
  className: 'bus-dot',
  html: `<div class="bus-dot-inner"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const selectedBusIcon = L.divIcon({
  className: 'bus-dot selected',
  html: `<div class="bus-dot-inner"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export function BusDot({ bus, isSelected, onSelect }: BusDotProps) {
  const map = useMap();

  const handleClick = () => {
    if (isSelected) {
      onSelect(null);
    } else {
      onSelect(bus.id);
      // Center map on bus
      map.setView([bus.lat, bus.lng], map.getZoom());
    }
  };

  return (
    <Marker
      position={[bus.lat, bus.lng]}
      icon={isSelected ? selectedBusIcon : busIcon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup className="bus-popup">
        <div className="popup-content">
          <div className="popup-header">
            <span className="line-badge large">{bus.lineNum}</span>
            <span className="direction">{bus.direction}</span>
          </div>
          <div className="popup-body">
            <div className="next-stop">
              <span className="label">Próxima parada:</span>
              <span className="value">{bus.nextStopName}</span>
            </div>
            <div className="eta">
              <span className="label">Llegada en:</span>
              <span className="value highlight">{bus.etaToNextStop} min</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

