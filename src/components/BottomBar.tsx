import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { ChartTimezone } from '../types';

interface BottomBarProps {
  onSelectRange: (range: string) => void;
  activeRange: string;
  timezone: ChartTimezone;
  onSelectTimezone: (tz: ChartTimezone) => void;
}

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

const TIMEZONES: { id: ChartTimezone; label: string; offset: string; desc: string }[] = [
  { id: 'America/Bogota', label: 'America/Bogota', offset: 'UTC-5', desc: 'Bogotá (Colombia)' },
  { id: 'America/New_York', label: 'America/New_York', offset: 'UTC-4', desc: 'Nueva York (EE. UU.)' },
  { id: 'UTC', label: 'UTC', offset: 'UTC+0', desc: 'Tiempo Universal' },
];

export const BottomBar: React.FC<BottomBarProps> = ({
  onSelectRange,
  activeRange,
  timezone,
  onSelectTimezone,
}) => {
  const [showTzMenu, setShowTzMenu] = useState(false);

  useEffect(() => {
    if (!showTzMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.timezone-container')) {
        setShowTzMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTzMenu]);

  const activeTzObj = TIMEZONES.find((t) => t.id === timezone) || TIMEZONES[0];

  return (
    <footer className="tv-bottom-bar">
      <div className="bottom-left">
        <div className="range-selector">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`range-btn ${activeRange === r ? 'active' : ''}`}
              onClick={() => onSelectRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bottom-right">
        <div className="bar-item">
          <span className="live-status-dot" />
          <span>Mercado Abierto</span>
        </div>

        <div className="bar-divider" />

        {/* Timezone Switcher between Bogota and NY */}
        <div className="timezone-container">
          <button
            className="bar-item timezone-btn"
            onClick={() => setShowTzMenu(!showTzMenu)}
            title="Cambiar horario entre Bogotá y Nueva York"
          >
            <span>{activeTzObj.label} ({activeTzObj.offset})</span>
          </button>

          {showTzMenu && (
            <div className="timezone-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="timezone-dropdown-header">Zona Horaria</div>
              {TIMEZONES.map((tz) => {
                const isSelected = tz.id === timezone;
                return (
                  <div
                    key={tz.id}
                    className={`timezone-dropdown-item ${isSelected ? 'active' : ''}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectTimezone(tz.id);
                      setShowTzMenu(false);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTimezone(tz.id);
                      setShowTzMenu(false);
                    }}
                  >
                    <div className="tz-info">
                      <span className="tz-name">{tz.label} ({tz.offset})</span>
                      <span className="tz-desc">{tz.desc}</span>
                    </div>
                    {isSelected && <Check size={14} className="tz-check" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bar-divider" />

        <div className="bar-item log-scale">
          <span>%</span>
          <span>log</span>
          <span className="active">auto</span>
        </div>
      </div>
    </footer>
  );
};
