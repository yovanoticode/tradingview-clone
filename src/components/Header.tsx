import { useState } from 'react';
import { 
  Search, 
  CandlestickChart, 
  LineChart, 
  AreaChart, 
  BarChart2, 
  Activity, 
  Camera, 
  Maximize2, 
  X
} from 'lucide-react';
import type { ChartType, IndicatorConfig, Timeframe } from '../types';

interface HeaderProps {
  symbol: string;
  onSelectSymbol: (symbol: string) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onSelectChartType: (type: ChartType) => void;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
  currentPrice: number;
  priceChange: number;
  onTakeSnapshot: () => void;
}

const AVAILABLE_SYMBOLS = [
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq-100 (Dec 2026)', price: '30,125', change: '+0.01%', isCrypto: false },
  { symbol: 'BTCUSDT', name: 'Bitcoin / TetherUS', price: '82,000', change: '+2.4%', isCrypto: true },
  { symbol: 'ETHUSDT', name: 'Ethereum / TetherUS', price: '3,100', change: '+1.8%', isCrypto: true },
  { symbol: 'SOLUSDT', name: 'Solana / TetherUS', price: '165', change: '+5.2%', isCrypto: true },
  { symbol: 'BNBUSDT', name: 'BNB / TetherUS', price: '590', change: '-0.3%', isCrypto: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin / TetherUS', price: '0.14', change: '+8.1%', isCrypto: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: '230.50', change: '+0.9%', isCrypto: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '125.40', change: '+3.1%', isCrypto: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '215.80', change: '-1.4%', isCrypto: false },
];

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

export const Header: React.FC<HeaderProps> = ({
  symbol,
  onSelectSymbol,
  timeframe,
  onSelectTimeframe,
  chartType,
  onSelectChartType,
  indicators,
  onToggleIndicator,
  currentPrice,
  priceChange,
  onTakeSnapshot,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSymbols = AVAILABLE_SYMBOLS.filter(
    (s) => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeIndicatorCount = Object.values(indicators).filter(Boolean).length;

  return (
    <header className="tv-header">
      <div className="header-left">
        {/* TradingView Icon */}
        <div className="tv-brand">
          <div className="tv-logo-box">
            <span className="tv-logo-text">TV</span>
          </div>
          <span className="tv-brand-title">TradingView</span>
        </div>

        {/* Symbol Search Button */}
        <button className="tv-btn symbol-btn" onClick={() => setShowSearch(true)}>
          <Search size={15} />
          <span className="symbol-name">{symbol}</span>
          <span className="symbol-exchange">{symbol === 'MNQ' ? 'CME / TRADOVATE' : 'BINANCE'}</span>
        </button>

        {/* Current Price Ticker */}
        {currentPrice > 0 && (
          <div className={`price-badge ${priceChange >= 0 ? 'bull' : 'bear'}`}>
            <span className="price-val">{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            <span className="change-val">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        )}

        <div className="header-divider" />

        {/* Timeframes */}
        <div className="timeframe-group">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`tv-btn tf-btn ${timeframe === tf.value ? 'active' : ''}`}
              onClick={() => onSelectTimeframe(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="header-divider" />

        {/* Chart Style Switcher */}
        <div className="chart-type-group">
          <button
            title="Candlestick"
            className={`tv-btn icon-btn ${chartType === 'candlestick' ? 'active' : ''}`}
            onClick={() => onSelectChartType('candlestick')}
          >
            <CandlestickChart size={16} />
          </button>
          <button
            title="Line"
            className={`tv-btn icon-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => onSelectChartType('line')}
          >
            <LineChart size={16} />
          </button>
          <button
            title="Area"
            className={`tv-btn icon-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => onSelectChartType('area')}
          >
            <AreaChart size={16} />
          </button>
          <button
            title="Bar"
            className={`tv-btn icon-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => onSelectChartType('bar')}
          >
            <BarChart2 size={16} />
          </button>
        </div>

        <div className="header-divider" />

        {/* Indicators Modal Trigger */}
        <button
          className={`tv-btn indicators-btn ${showIndicators ? 'active' : ''}`}
          onClick={() => setShowIndicators(!showIndicators)}
        >
          <Activity size={16} />
          <span>Indicadores</span>
          {activeIndicatorCount > 0 && <span className="indicator-count">{activeIndicatorCount}</span>}
        </button>
      </div>

      <div className="header-right">
        {/* Live WS Status */}
        <div className="live-pill" title="Conexión en tiempo real activa">
          <span className="live-dot" />
          <span>LIVE</span>
        </div>

        {/* Snapshot */}
        <button className="tv-btn icon-btn" title="Tomar captura" onClick={onTakeSnapshot}>
          <Camera size={16} />
        </button>

        {/* Fullscreen */}
        <button
          className="tv-btn icon-btn"
          title="Pantalla completa"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Symbol Search Modal */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar símbolo (ej: BTC, ETH, SOL, AAPL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="close-btn" onClick={() => setShowSearch(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {filteredSymbols.map((item) => (
                <div
                  key={item.symbol}
                  className={`search-item ${symbol === item.symbol ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectSymbol(item.symbol);
                    setShowSearch(false);
                  }}
                >
                  <div className="item-info">
                    <span className="item-symbol">{item.symbol}</span>
                    <span className="item-name">{item.name}</span>
                  </div>
                  <div className="item-market">
                    <span className="item-badge">{item.isCrypto ? 'CRYPTO' : 'STOCK'}</span>
                    <span className="item-change">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Indicators Dropdown */}
      {showIndicators && (
        <div className="indicators-popup">
          <div className="popup-header">
            <span>Indicadores Técnicos</span>
            <button className="close-btn" onClick={() => setShowIndicators(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="popup-body">
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.volume}
                onChange={() => onToggleIndicator('volume')}
              />
              <span>Volumen (Vol)</span>
            </label>
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.sma20}
                onChange={() => onToggleIndicator('sma20')}
              />
              <span>SMA 20 (Media Móvil Simple)</span>
            </label>
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.ema50}
                onChange={() => onToggleIndicator('ema50')}
              />
              <span>EMA 50 (Media Móvil Exponencial)</span>
            </label>
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.ema200}
                onChange={() => onToggleIndicator('ema200')}
              />
              <span>EMA 200 (Tendencia a Largo Plazo)</span>
            </label>
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.bollinger}
                onChange={() => onToggleIndicator('bollinger')}
              />
              <span>Bandas de Bollinger (20, 2)</span>
            </label>
            <label className="indicator-toggle">
              <input
                type="checkbox"
                checked={indicators.rsi}
                onChange={() => onToggleIndicator('rsi')}
              />
              <span>RSI 14 (Índice de Fuerza Relativa)</span>
            </label>
          </div>
        </div>
      )}
    </header>
  );
};
