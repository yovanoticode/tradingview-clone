import { useState } from 'react';
import { 
  Bookmark, 
  BarChart, 
  Compass, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  Plus
} from 'lucide-react';
import type { OrderBookEntry, WatchlistItem } from '../types';

interface RightSidebarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentPrice: number;
  priceChange: number;
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'MNQ', name: 'Micro Nasdaq Futures', price: 30124.50, change24h: 0.01, isCrypto: false },
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 82150.2, change24h: 2.45, isCrypto: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 3120.8, change24h: 1.82, isCrypto: true },
  { symbol: 'SOLUSDT', name: 'Solana', price: 168.4, change24h: 5.12, isCrypto: true },
  { symbol: 'BNBUSDT', name: 'BNB', price: 592.1, change24h: -0.32, isCrypto: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.142, change24h: 8.41, isCrypto: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 231.2, change24h: 0.95, isCrypto: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 125.8, change24h: 3.25, isCrypto: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 216.4, change24h: -1.40, isCrypto: false },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentSymbol,
  onSelectSymbol,
  currentPrice,
  priceChange,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'orderbook' | 'tech' | 'alerts'>('watchlist');
  const [collapsed, setCollapsed] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alerts, setAlerts] = useState<number[]>([]);

  // Simulated Order Book around currentPrice
  const basePrice = currentPrice > 0 ? currentPrice : 82000;
  const asks: OrderBookEntry[] = Array.from({ length: 7 }, (_, i) => {
    const price = basePrice + (7 - i) * (basePrice * 0.0003);
    const amount = Number((Math.random() * 2 + 0.1).toFixed(3));
    return { price, amount, total: price * amount };
  });

  const bids: OrderBookEntry[] = Array.from({ length: 7 }, (_, i) => {
    const price = basePrice - (i + 1) * (basePrice * 0.0003);
    const amount = Number((Math.random() * 2 + 0.1).toFixed(3));
    return { price, amount, total: price * amount };
  });

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(alertPrice);
    if (!isNaN(val) && val > 0) {
      setAlerts([...alerts, val]);
      setAlertPrice('');
    }
  };

  return (
    <aside className={`tv-right-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Tab Navigation Icons */}
      <div className="sidebar-tab-strip">
        <button
          className={`tab-strip-btn ${activeTab === 'watchlist' && !collapsed ? 'active' : ''}`}
          title="Lista de Seguimiento"
          onClick={() => {
            setActiveTab('watchlist');
            setCollapsed(false);
          }}
        >
          <Bookmark size={18} />
        </button>

        <button
          className={`tab-strip-btn ${activeTab === 'orderbook' && !collapsed ? 'active' : ''}`}
          title="Libro de Órdenes"
          onClick={() => {
            setActiveTab('orderbook');
            setCollapsed(false);
          }}
        >
          <BarChart size={18} />
        </button>

        <button
          className={`tab-strip-btn ${activeTab === 'tech' && !collapsed ? 'active' : ''}`}
          title="Resumen Técnico"
          onClick={() => {
            setActiveTab('tech');
            setCollapsed(false);
          }}
        >
          <Compass size={18} />
        </button>

        <button
          className={`tab-strip-btn ${activeTab === 'alerts' && !collapsed ? 'active' : ''}`}
          title="Alertas"
          onClick={() => {
            setActiveTab('alerts');
            setCollapsed(false);
          }}
        >
          <Bell size={18} />
          {alerts.length > 0 && <span className="alert-badge">{alerts.length}</span>}
        </button>

        <div className="tab-strip-spacer" />

        <button
          className="tab-strip-btn collapse-toggle"
          title={collapsed ? 'Expandir panel' : 'Colapsar panel'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Expanded Content Panel */}
      {!collapsed && (
        <div className="sidebar-content">
          {activeTab === 'watchlist' && (
            <div className="watchlist-view">
              <div className="sidebar-section-header">
                <span>Lista de Seguimiento</span>
              </div>
              <div className="watchlist-list">
                {DEFAULT_WATCHLIST.map((item) => {
                  const isCurrent = item.symbol === currentSymbol;
                  const displayPrice = isCurrent && currentPrice > 0 ? currentPrice : item.price;
                  const displayChange = isCurrent && priceChange !== 0 ? priceChange : item.change24h;

                  return (
                    <div
                      key={item.symbol}
                      className={`watchlist-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => onSelectSymbol(item.symbol)}
                    >
                      <div className="item-symbol-col">
                        <span className="item-symbol">{item.symbol}</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <div className="item-price-col">
                        <span className="item-price">
                          {displayPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: displayPrice < 1 ? 4 : 2,
                          })}
                        </span>
                        <span className={`item-change ${displayChange >= 0 ? 'bull' : 'bear'}`}>
                          {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'orderbook' && (
            <div className="orderbook-view">
              <div className="sidebar-section-header">
                <span>Libro de Órdenes (L2)</span>
                <span className="orderbook-sym">{currentSymbol}</span>
              </div>
              <div className="orderbook-headers">
                <span>Precio (USDT)</span>
                <span>Tamaño</span>
                <span>Total</span>
              </div>
              {/* Asks (Venta - Rojo) */}
              <div className="orderbook-list asks">
                {asks.map((a, i) => (
                  <div key={i} className="ob-row ask-row">
                    <span className="ob-price red">{a.price.toFixed(2)}</span>
                    <span className="ob-amount">{a.amount.toFixed(3)}</span>
                    <span className="ob-total">{a.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              {/* Mid Spread */}
              <div className="orderbook-mid">
                <span className={`mid-price ${priceChange >= 0 ? 'bull' : 'bear'}`}>
                  {basePrice.toFixed(2)}
                </span>
                <span className="mid-spread">Spread: 0.01%</span>
              </div>
              {/* Bids (Compra - Verde) */}
              <div className="orderbook-list bids">
                {bids.map((b, i) => (
                  <div key={i} className="ob-row bid-row">
                    <span className="ob-price green">{b.price.toFixed(2)}</span>
                    <span className="ob-amount">{b.amount.toFixed(3)}</span>
                    <span className="ob-total">{b.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="tech-view">
              <div className="sidebar-section-header">
                <span>Análisis Técnico</span>
              </div>
              <div className="gauge-card">
                <div className="gauge-title">Resumen Técnico (1D)</div>
                <div className="sentiment-box buy">
                  COMPRA FUERTE
                </div>
                <div className="meter-bar">
                  <div className="meter-seg red" title="Venta" />
                  <div className="meter-seg gray" title="Neutral" />
                  <div className="meter-seg green active" title="Compra" />
                </div>
              </div>
              <div className="indicators-breakdown">
                <div className="indicator-row">
                  <span>Osciladores (RSI 14)</span>
                  <span className="val green">Compra (58.4)</span>
                </div>
                <div className="indicator-row">
                  <span>Medias Móviles (SMA 20/50)</span>
                  <span className="val green">Compra Fuerte</span>
                </div>
                <div className="indicator-row">
                  <span>Volatilidad (ATR)</span>
                  <span className="val">Media</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="alerts-view">
              <div className="sidebar-section-header">
                <span>Gestor de Alertas</span>
              </div>
              <form onSubmit={handleAddAlert} className="alert-form">
                <input
                  type="number"
                  step="any"
                  placeholder={`Precio para ${currentSymbol}...`}
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                />
                <button type="submit" className="add-alert-btn">
                  <Plus size={16} />
                </button>
              </form>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <div className="empty-alerts">No hay alertas activas</div>
                ) : (
                  alerts.map((price: number, idx: number) => (
                    <div key={idx} className="alert-item">
                      <div className="alert-meta">
                        <span className="alert-sym">{currentSymbol}</span>
                        <span className="alert-price">${price.toFixed(2)}</span>
                      </div>
                      <button
                        className="delete-alert-btn"
                        onClick={() => setAlerts(alerts.filter((_: number, i: number) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
