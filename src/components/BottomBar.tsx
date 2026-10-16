import React from 'react';

interface BottomBarProps {
  onSelectRange: (range: string) => void;
  activeRange: string;
}

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

export const BottomBar: React.FC<BottomBarProps> = ({ onSelectRange, activeRange }) => {
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
        <div className="bar-item timezone">
          <span>{Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC)</span>
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
