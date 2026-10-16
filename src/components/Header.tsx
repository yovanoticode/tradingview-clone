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
  X,
  Settings,
  Sliders
} from 'lucide-react';
import type { ChartType, IndicatorConfig, Timeframe, ICTSettings } from '../types';

interface HeaderProps {
  symbol: string;
  onSelectSymbol: (symbol: string) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onSelectChartType: (type: ChartType) => void;
  indicators: IndicatorConfig;
  onToggleIndicator: (key: keyof IndicatorConfig) => void;
  ictSettings: ICTSettings;
  onUpdateIctSettings: (newSettings: Partial<ICTSettings>) => void;
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
  ictSettings,
  onUpdateIctSettings,
  currentPrice,
  priceChange,
  onTakeSnapshot,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showIctModal, setShowIctModal] = useState(false);
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

            <div style={{ borderTop: '1px solid var(--tv-border)', margin: '4px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="indicator-toggle" style={{ margin: 0, flex: 1 }}>
                <input
                  type="checkbox"
                  checked={indicators.ictKillzones}
                  onChange={() => onToggleIndicator('ictKillzones')}
                />
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>ICT Killzones & Pivots [Pro]</span>
              </label>
              <button
                className="tv-btn icon-btn"
                title="Configurar parámetros de ICT Killzones"
                style={{ padding: '2px 6px', height: '24px', marginLeft: '6px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIctModal(true);
                }}
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ICT Settings Modal */}
      {showIctModal && (
        <div className="modal-overlay" onClick={() => setShowIctModal(false)} style={{ zIndex: 120 }}>
          <div
            className="search-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '18px 20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#38bdf8" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Parámetros ICT Killzones & Pivots</span>
              </div>
              <button className="close-btn" onClick={() => setShowIctModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sesiones & Killzones (Horario NY)
              </div>

              {/* Asia */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.asia}
                    onChange={(e) => onUpdateIctSettings({ asia: e.target.checked })}
                  />
                  <span>Asia Session (20:00 - 00:00)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.asiaColor}
                  onChange={(e) => onUpdateIctSettings({ asiaColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* London */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.london}
                    onChange={(e) => onUpdateIctSettings({ london: e.target.checked })}
                  />
                  <span>London Killzone (02:00 - 05:00)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.londonColor}
                  onChange={(e) => onUpdateIctSettings({ londonColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* NY AM */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.nyam}
                    onChange={(e) => onUpdateIctSettings({ nyam: e.target.checked })}
                  />
                  <span>NY AM Killzone (09:30 - 11:00)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.nyamColor}
                  onChange={(e) => onUpdateIctSettings({ nyamColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* NY PM */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.nypm}
                    onChange={(e) => onUpdateIctSettings({ nypm: e.target.checked })}
                  />
                  <span>NY PM Session (13:30 - 16:00)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.nypmColor}
                  onChange={(e) => onUpdateIctSettings({ nypmColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--tv-border)', margin: '4px 0' }} />
              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Aperturas & Niveles Clave
              </div>

              {/* Midnight */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.midnightOpen}
                    onChange={(e) => onUpdateIctSettings({ midnightOpen: e.target.checked })}
                  />
                  <span>Midnight Open (00:00 NY)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.midnightColor}
                  onChange={(e) => onUpdateIctSettings({ midnightColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* 08:30 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.open830}
                    onChange={(e) => onUpdateIctSettings({ open830: e.target.checked })}
                  />
                  <span>NY 08:30 Open (Noticias)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.open830Color}
                  onChange={(e) => onUpdateIctSettings({ open830Color: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* 09:30 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.open930}
                    onChange={(e) => onUpdateIctSettings({ open930: e.target.checked })}
                  />
                  <span>Equities 09:30 Open</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.open930Color}
                  onChange={(e) => onUpdateIctSettings({ open930Color: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>

              {/* PDH/PDL */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="indicator-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={ictSettings.pdhl}
                    onChange={(e) => onUpdateIctSettings({ pdhl: e.target.checked })}
                  />
                  <span>PDH & PDL (Prev Day High/Low)</span>
                </label>
                <input
                  type="color"
                  value={ictSettings.pdhlColor}
                  onChange={(e) => onUpdateIctSettings({ pdhlColor: e.target.value })}
                  style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="tv-btn primary-btn"
                style={{ padding: '6px 16px', fontSize: '12px' }}
                onClick={() => setShowIctModal(false)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
