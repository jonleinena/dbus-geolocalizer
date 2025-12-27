import { useState } from 'react';
import { Map } from './components/Map';
import { LineSearch } from './components/LineSearch';
import { useLines, useBuses } from './hooks/useDBUS';
import './index.css';

function App() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  const { lines, loading: linesLoading } = useLines();
  const { data: busData, loading: busesLoading } = useBuses(selectedLine);

  const handleLineSelect = (lineNum: string | null) => {
    setSelectedLine(lineNum);
    setSelectedBusId(null); // Clear selected bus when changing line
  };

  const buses = busData?.buses || [];
  const stops = busData?.stops || [];
  const routeGeometry = busData?.routeGeometry;
  const lastUpdated = busData?.lastUpdated;

  return (
    <div className="app">
      {/* Floating search box */}
      <header className="header">
        <LineSearch
          lines={lines}
          selectedLine={selectedLine}
          onSelectLine={handleLineSelect}
          loading={linesLoading || busesLoading}
        />
      </header>

      {/* Full-screen map */}
      <main className="main">
        <Map
          buses={buses}
          stops={stops}
          routeGeometry={routeGeometry}
          selectedBusId={selectedBusId}
          onSelectBus={setSelectedBusId}
        />
      </main>

      {/* Status bar */}
      {selectedLine && (
        <footer className="status-bar">
          <div className="status-content">
            <span className="bus-count">
              {buses.length} {buses.length === 1 ? 'autobús' : 'autobuses'} en línea
            </span>
            {lastUpdated && (
              <span className="last-updated">
                Actualizado: {new Date(lastUpdated).toLocaleTimeString('es-ES')}
              </span>
            )}
          </div>
          {buses.length === 0 && !busesLoading && (
            <div className="no-buses-message">
              No hay autobuses activos en esta línea ahora mismo
            </div>
          )}
        </footer>
      )}

      {/* Welcome message when no line selected */}
      {!selectedLine && !linesLoading && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <h1>🚌 DBUS Live</h1>
            <p>Visualiza la posición de los autobuses de Donostia en tiempo real</p>
            <p className="hint">↑ Selecciona una línea para empezar</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

