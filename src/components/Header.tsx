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
  const [ictTab, setIctTab] = useState<'kz' | 'dwm' | 'opens'>('kz');
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
            style={{ maxWidth: '480px', padding: '18px 22px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#38bdf8" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Parámetros ICT Killzones & Pivots [TFO]</span>
              </div>
              <button className="close-btn" onClick={() => setShowIctModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--tv-border)', marginBottom: '14px', gap: '8px' }}>
              <button
                type="button"
                className={`tv-btn ${ictTab === 'kz' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px 4px 0 0' }}
                onClick={() => setIctTab('kz')}
              >
                Killzones (6)
              </button>
              <button
                type="button"
                className={`tv-btn ${ictTab === 'dwm' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px 4px 0 0' }}
                onClick={() => setIctTab('dwm')}
              >
                Día / Sem / Mes (DWM)
              </button>
              <button
                type="button"
                className={`tv-btn ${ictTab === 'opens' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px 4px 0 0' }}
                onClick={() => setIctTab('opens')}
              >
                Aperturas & Stats
              </button>
            </div>

            {/* TAB 1: KILLZONES */}
            {ictTab === 'kz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Sesiones & Horarios (America/New_York)
                </div>

                {[
                  { id: 'kz1' as const, dName: 'ASIA', dStart: '20:00', dEnd: '00:00', dCol: '#2962ff' },
                  { id: 'kz2' as const, dName: 'LNDN', dStart: '02:00', dEnd: '05:00', dCol: '#f23645' },
                  { id: 'kz3' as const, dName: 'NYAM', dStart: '09:30', dEnd: '11:00', dCol: '#089981' },
                  { id: 'kz4' as const, dName: 'NYL',  dStart: '12:00', dEnd: '13:00', dCol: '#ff9800' },
                  { id: 'kz5' as const, dName: 'NYPM', dStart: '13:30', dEnd: '16:00', dCol: '#ab47bc' },
                  { id: 'kz6' as const, dName: 'RTH',  dStart: '09:30', dEnd: '16:00', dCol: '#787b86' },
                ].map(({ id, dName, dStart, dEnd, dCol }) => {
                  const cfg = ictSettings[id] || { enabled: true, name: dName, start: dStart, end: dEnd, color: dCol };
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <label className="indicator-toggle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={cfg.enabled}
                          onChange={(e) => onUpdateIctSettings({ [id]: { ...cfg, enabled: e.target.checked } })}
                        />
                        <input
                          type="text"
                          value={cfg.name}
                          onChange={(e) => onUpdateIctSettings({ [id]: { ...cfg, name: e.target.value } })}
                          style={{ width: '48px', background: '#1e222d', border: '1px solid #2a2e39', color: '#fff', fontSize: '11px', padding: '2px 4px', borderRadius: '3px' }}
                        />
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={cfg.start}
                          onChange={(e) => onUpdateIctSettings({ [id]: { ...cfg, start: e.target.value } })}
                          style={{ width: '46px', background: '#1e222d', border: '1px solid #2a2e39', color: '#cbd5e1', fontSize: '11px', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}
                        />
                        <span style={{ color: '#64748b' }}>-</span>
                        <input
                          type="text"
                          value={cfg.end}
                          onChange={(e) => onUpdateIctSettings({ [id]: { ...cfg, end: e.target.value } })}
                          style={{ width: '46px', background: '#1e222d', border: '1px solid #2a2e39', color: '#cbd5e1', fontSize: '11px', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}
                        />
                      </div>
                      <input
                        type="color"
                        value={cfg.color}
                        onChange={(e) => onUpdateIctSettings({ [id]: { ...cfg, color: e.target.value } })}
                        style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}

                <div style={{ borderTop: '1px solid var(--tv-border)', margin: '6px 0' }} />
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Opciones de Pivots & Líneas
                </div>

                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showPivots ?? true}
                    onChange={(e) => onUpdateIctSettings({ showPivots: e.target.checked })}
                  />
                  <span>Mostrar Líneas de Pivots (High / Low)</span>
                </label>

                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showMidpoints ?? true}
                    onChange={(e) => onUpdateIctSettings({ showMidpoints: e.target.checked })}
                  />
                  <span>Mostrar Punto Medio 50% (Equilibrium Midpoint)</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Extensión de Pivots:</span>
                  <select
                    value={ictSettings.extendPivots ?? 'mitigated'}
                    onChange={(e) => onUpdateIctSettings({ extendPivots: e.target.value as any })}
                    style={{ background: '#1e222d', border: '1px solid #2a2e39', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '3px' }}
                  >
                    <option value="mitigated">Hasta Mitigación (Until Mitigated)</option>
                    <option value="past">Continuo (Past Mitigation)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: DWM (DAY - WEEK - MONTH) */}
            {ictTab === 'dwm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Día Anterior (Daily)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.dhl ?? true}
                      onChange={(e) => onUpdateIctSettings({ dhl: e.target.checked })}
                    />
                    <span>PDH & PDL (Prev Day High/Low)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.dColor || '#2962ff'}
                    onChange={(e) => onUpdateIctSettings({ dColor: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.dmid ?? true}
                    onChange={(e) => onUpdateIctSettings({ dmid: e.target.checked })}
                  />
                  <span>PDM (Punto Medio 50% Día Anterior)</span>
                </label>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showDOpen ?? false}
                    onChange={(e) => onUpdateIctSettings({ showDOpen: e.target.checked })}
                  />
                  <span>D Open (Apertura Diaria)</span>
                </label>

                <div style={{ borderTop: '1px solid var(--tv-border)', margin: '4px 0' }} />
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Semana Anterior (Weekly)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.whl ?? true}
                      onChange={(e) => onUpdateIctSettings({ whl: e.target.checked })}
                    />
                    <span>PWH & PWL (Prev Week High/Low)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.wColor || '#089981'}
                    onChange={(e) => onUpdateIctSettings({ wColor: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.wmid ?? true}
                    onChange={(e) => onUpdateIctSettings({ wmid: e.target.checked })}
                  />
                  <span>PWM (Punto Medio 50% Semana Anterior)</span>
                </label>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showWOpen ?? false}
                    onChange={(e) => onUpdateIctSettings({ showWOpen: e.target.checked })}
                  />
                  <span>W Open (Apertura Semanal)</span>
                </label>

                <div style={{ borderTop: '1px solid var(--tv-border)', margin: '4px 0' }} />
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Mes Anterior (Monthly)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.mhl ?? true}
                      onChange={(e) => onUpdateIctSettings({ mhl: e.target.checked })}
                    />
                    <span>PMH & PML (Prev Month High/Low)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.mColor || '#f23645'}
                    onChange={(e) => onUpdateIctSettings({ mColor: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.mmid ?? true}
                    onChange={(e) => onUpdateIctSettings({ mmid: e.target.checked })}
                  />
                  <span>PMM (Punto Medio 50% Mes Anterior)</span>
                </label>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showMOpen ?? false}
                    onChange={(e) => onUpdateIctSettings({ showMOpen: e.target.checked })}
                  />
                  <span>M Open (Apertura Mensual)</span>
                </label>
              </div>
            )}

            {/* TAB 3: OPENING PRICES & STATS */}
            {ictTab === 'opens' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Precios de Apertura Clave (Opening Prices)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.midnightOpen ?? true}
                      onChange={(e) => onUpdateIctSettings({ midnightOpen: e.target.checked })}
                    />
                    <span>Midnight Open (00:00 NY)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.midnightColor || '#ffeb3b'}
                    onChange={(e) => onUpdateIctSettings({ midnightColor: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.open830 ?? true}
                      onChange={(e) => onUpdateIctSettings({ open830: e.target.checked })}
                    />
                    <span>NY 08:30 Open (Macro Noticias)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.open830Color || '#ff9800'}
                    onChange={(e) => onUpdateIctSettings({ open830Color: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.open930 ?? true}
                      onChange={(e) => onUpdateIctSettings({ open930: e.target.checked })}
                    />
                    <span>Equities 09:30 Open (Apertura Wall St)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.open930Color || '#00e5ff'}
                    onChange={(e) => onUpdateIctSettings({ open930Color: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.open1200 ?? false}
                      onChange={(e) => onUpdateIctSettings({ open1200: e.target.checked })}
                    />
                    <span>Midday 12:00 Open (Almuerzo NY)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.open1200Color || '#ff9800'}
                    onChange={(e) => onUpdateIctSettings({ open1200Color: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="indicator-toggle" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={ictSettings.open1600 ?? false}
                      onChange={(e) => onUpdateIctSettings({ open1600: e.target.checked })}
                    />
                    <span>Cash Close 16:00 (Cierre de Mercado)</span>
                  </label>
                  <input
                    type="color"
                    value={ictSettings.open1600Color || '#f23645'}
                    onChange={(e) => onUpdateIctSettings({ open1600Color: e.target.value })}
                    style={{ width: '28px', height: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--tv-border)', margin: '4px 0' }} />
                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                  Tabla de Datos & Estadísticas (HUD)
                </div>

                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={ictSettings.showDataTable ?? true}
                    onChange={(e) => onUpdateIctSettings({ showDataTable: e.target.checked })}
                  />
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>Mostrar Tabla de Rangos y Aciertos en pantalla</span>
                </label>
              </div>
            )}

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
