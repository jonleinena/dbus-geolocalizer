import { useState, useRef, useEffect } from 'react';
import type { BusLine } from '../types';

interface LineSearchProps {
  lines: BusLine[];
  selectedLine: string | null;
  onSelectLine: (lineNum: string | null) => void;
  loading?: boolean;
}

export function LineSearch({ lines, selectedLine, onSelectLine, loading }: LineSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter lines by search
  const filteredLines = lines.filter(line =>
    `${line.lineNum} ${line.name}`.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected line name
  const selectedLineName = selectedLine
    ? lines.find(l => l.lineNum === selectedLine)
    : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (lineNum: string) => {
    onSelectLine(lineNum);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelectLine(null);
    setSearch('');
  };

  return (
    <div className="line-search" ref={dropdownRef}>
      <div className="search-box" onClick={() => setIsOpen(true)}>
        {selectedLine && selectedLineName ? (
          <div className="selected-line">
            <span className="line-badge">{selectedLineName.lineNum}</span>
            <span className="line-name">{selectedLineName.name}</span>
            <button className="clear-btn" onClick={(e) => { e.stopPropagation(); handleClear(); }}>
              ✕
            </button>
          </div>
        ) : (
          <div className="search-placeholder">
            <span className="search-icon">🔍</span>
            <span>Buscar línea de autobús...</span>
          </div>
        )}
        {loading && <span className="loading-spinner" />}
      </div>

      {isOpen && (
        <div className="dropdown">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Escribe para buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="line-list">
            {filteredLines.map(line => (
              <li
                key={line.lineNum}
                className={`line-item ${line.lineNum === selectedLine ? 'selected' : ''}`}
                onClick={() => handleSelect(line.lineNum)}
              >
                <span className="line-badge">{line.lineNum}</span>
                <span className="line-name">{line.name}</span>
              </li>
            ))}
            {filteredLines.length === 0 && (
              <li className="no-results">No se encontraron líneas</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

