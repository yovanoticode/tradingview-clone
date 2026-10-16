import { useState, useEffect } from 'react';
import { 
  Bookmark, 
  BarChart, 
  Compass, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search
} from 'lucide-react';
import type { OrderBookEntry, WatchlistItem, WatchlistGroup } from '../types';

interface RightSidebarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentPrice: number;
  priceChange: number;
}

const DEFAULT_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'wl-default',
    name: 'Lista de Seguimiento',
    items: [
      { symbol: 'MNQ', name: 'Micro Nasdaq Futures', price: 29389.5, change24h: -2.6, isCrypto: false },
      { symbol: 'BTCUSDT', name: 'Bitcoin', price: 82150.2, change24h: 2.45, isCrypto: true },
      { symbol: 'ETHUSDT', name: 'Ethereum', price: 3120.8, change24h: 1.82, isCrypto: true },
      { symbol: 'SOLUSDT', name: 'Solana', price: 168.4, change24h: 5.12, isCrypto: true },
      { symbol: 'BNBUSDT', name: 'BNB', price: 592.1, change24h: -0.32, isCrypto: true },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.142, change24h: 8.41, isCrypto: true },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 231.2, change24h: 0.95, isCrypto: false },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 125.8, change24h: 3.25, isCrypto: false },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 216.4, change24h: -1.4, isCrypto: false },
    ],
  },
  {
    id: 'wl-cme',
    name: 'Futuros CME',
    items: [
      { symbol: 'MNQ', name: 'Micro Nasdaq Futures', price: 29389.5, change24h: -2.6, isCrypto: false },
      { symbol: 'NQ', name: 'E-mini Nasdaq-100', price: 20450.0, change24h: -0.85, isCrypto: false },
      { symbol: 'ES', name: 'E-mini S&P 500', price: 5860.25, change24h: -0.42, isCrypto: false },
      { symbol: 'MES', name: 'Micro E-mini S&P 500', price: 5860.25, change24h: -0.42, isCrypto: false },
      { symbol: 'CL', name: 'Crude Oil Futures', price: 70.85, change24h: 1.25, isCrypto: false },
      { symbol: 'GC', name: 'Gold Futures', price: 2715.4, change24h: 0.65, isCrypto: false },
    ],
  },
  {
    id: 'wl-crypto',
    name: 'Criptomonedas',
    items: [
      { symbol: 'BTCUSDT', name: 'Bitcoin / TetherUS', price: 82150.2, change24h: 2.45, isCrypto: true },
      { symbol: 'ETHUSDT', name: 'Ethereum / TetherUS', price: 3120.8, change24h: 1.82, isCrypto: true },
      { symbol: 'SOLUSDT', name: 'Solana / TetherUS', price: 168.4, change24h: 5.12, isCrypto: true },
      { symbol: 'BNBUSDT', name: 'BNB / TetherUS', price: 592.1, change24h: -0.32, isCrypto: true },
      { symbol: 'DOGEUSDT', name: 'Dogecoin / TetherUS', price: 0.142, change24h: 8.41, isCrypto: true },
      { symbol: 'XRPUSDT', name: 'Ripple / TetherUS', price: 0.58, change24h: 3.1, isCrypto: true },
    ],
  },
  {
    id: 'wl-stocks',
    name: 'Acciones US',
    items: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 231.2, change24h: 0.95, isCrypto: false },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 125.8, change24h: 3.25, isCrypto: false },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 216.4, change24h: -1.4, isCrypto: false },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 422.5, change24h: 0.45, isCrypto: false },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 188.6, change24h: 1.15, isCrypto: false },
      { symbol: 'META', name: 'Meta Platforms Inc.', price: 585.3, change24h: 2.1, isCrypto: false },
    ],
  },
];

const ALL_CATALOG_SYMBOLS: WatchlistItem[] = [
  { symbol: 'MNQ', name: 'Micro Nasdaq Futures', price: 29389.5, change24h: -2.6, isCrypto: false },
  { symbol: 'NQ', name: 'E-mini Nasdaq-100', price: 20450.0, change24h: -0.85, isCrypto: false },
  { symbol: 'ES', name: 'E-mini S&P 500', price: 5860.25, change24h: -0.42, isCrypto: false },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', price: 5860.25, change24h: -0.42, isCrypto: false },
  { symbol: 'CL', name: 'Crude Oil Futures', price: 70.85, change24h: 1.25, isCrypto: false },
  { symbol: 'GC', name: 'Gold Futures', price: 2715.4, change24h: 0.65, isCrypto: false },
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 82150.2, change24h: 2.45, isCrypto: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 3120.8, change24h: 1.82, isCrypto: true },
  { symbol: 'SOLUSDT', name: 'Solana', price: 168.4, change24h: 5.12, isCrypto: true },
  { symbol: 'BNBUSDT', name: 'BNB', price: 592.1, change24h: -0.32, isCrypto: true },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.142, change24h: 8.41, isCrypto: true },
  { symbol: 'XRPUSDT', name: 'Ripple', price: 0.58, change24h: 3.1, isCrypto: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 231.2, change24h: 0.95, isCrypto: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 125.8, change24h: 3.25, isCrypto: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 216.4, change24h: -1.4, isCrypto: false },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 422.5, change24h: 0.45, isCrypto: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 188.6, change24h: 1.15, isCrypto: false },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 585.3, change24h: 2.1, isCrypto: false },
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

  // Watchlists State
  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>(() => {
    try {
      const saved = localStorage.getItem('tv_watchlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WATCHLIST_GROUPS;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tv_active_watchlist_id');
      if (saved) return saved;
    } catch {}
    return 'wl-default';
  });

  const [showWlMenu, setShowWlMenu] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null);
  const [modalInputName, setModalInputName] = useState('');
  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false);
  const [addSymbolQuery, setAddSymbolQuery] = useState('');

  const activeGroup = watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0] || DEFAULT_WATCHLIST_GROUPS[0];

  useEffect(() => {
    if (!showWlMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.watchlist-header-container')) {
        setShowWlMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWlMenu]);

  const saveGroups = (updated: WatchlistGroup[]) => {
    setWatchlistGroups(updated);
    localStorage.setItem('tv_watchlists', JSON.stringify(updated));
  };

  const handleCreateGroup = () => {
    if (!modalInputName.trim()) return;
    const newGroup: WatchlistGroup = {
      id: 'wl-' + Date.now(),
      name: modalInputName.trim(),
      items: [],
    };
    const updated = [...watchlistGroups, newGroup];
    saveGroups(updated);
    setActiveGroupId(newGroup.id);
    localStorage.setItem('tv_active_watchlist_id', newGroup.id);
    setModalMode(null);
  };

  const handleRenameGroup = () => {
    if (!modalInputName.trim()) return;
    const updated = watchlistGroups.map((g) => (g.id === activeGroupId ? { ...g, name: modalInputName.trim() } : g));
    saveGroups(updated);
    setModalMode(null);
  };

  const handleDeleteGroup = (id: string) => {
    if (watchlistGroups.length <= 1) return;
    const updated = watchlistGroups.filter((g) => g.id !== id);
    saveGroups(updated);
    if (activeGroupId === id) {
      setActiveGroupId(updated[0].id);
      localStorage.setItem('tv_active_watchlist_id', updated[0].id);
    }
  };

  const handleAddSymbol = (item: WatchlistItem) => {
    if (activeGroup.items.some((i) => i.symbol === item.symbol)) {
      setShowAddSymbolModal(false);
      return;
    }
    const updated = watchlistGroups.map((g) =>
      g.id === activeGroupId ? { ...g, items: [...g.items, item] } : g
    );
    saveGroups(updated);
    setShowAddSymbolModal(false);
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    const updated = watchlistGroups.map((g) =>
      g.id === activeGroupId ? { ...g, items: g.items.filter((i) => i.symbol !== symbolToRemove) } : g
    );
    saveGroups(updated);
  };

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
              <div className="sidebar-section-header watchlist-header">
                <div className="watchlist-header-container">
                  <button 
                    className="wl-select-btn" 
                    onClick={() => setShowWlMenu(!showWlMenu)}
                    title="Cambiar lista de seguimiento"
                  >
                    <span className="wl-active-name">{activeGroup.name}</span>
                    <ChevronDown size={14} className={`wl-chevron ${showWlMenu ? 'open' : ''}`} />
                  </button>

                  {showWlMenu && (
                    <div className="wl-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                      <div className="wl-dropdown-header">LISTAS DE SEGUIMIENTO</div>
                      {watchlistGroups.map((g) => {
                        const isSelected = g.id === activeGroupId;
                        return (
                          <div
                            key={g.id}
                            className={`wl-menu-row ${isSelected ? 'active' : ''}`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setActiveGroupId(g.id);
                              localStorage.setItem('tv_active_watchlist_id', g.id);
                              setShowWlMenu(false);
                            }}
                          >
                            <div className="wl-row-name">
                              <span>{g.name}</span>
                              <span className="wl-row-count">({g.items.length})</span>
                            </div>
                            <div className="wl-row-actions" onMouseDown={(e) => e.stopPropagation()}>
                              {isSelected && <Check size={14} className="wl-check" />}
                              {watchlistGroups.length > 1 && (
                                <button
                                  className="wl-del-btn"
                                  title="Eliminar lista"
                                  onClick={() => handleDeleteGroup(g.id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="wl-menu-divider" />
                      <div
                        className="wl-action-btn"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setModalMode('create');
                          setModalInputName('Nueva Lista');
                          setShowWlMenu(false);
                        }}
                      >
                        <Plus size={14} />
                        <span>Crear nueva lista...</span>
                      </div>
                      <div
                        className="wl-action-btn"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setModalMode('rename');
                          setModalInputName(activeGroup.name);
                          setShowWlMenu(false);
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Renombrar lista actual...</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="wl-add-symbol-btn"
                  title="Añadir símbolo a esta lista"
                  onClick={() => setShowAddSymbolModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="watchlist-list">
                {activeGroup.items.length === 0 ? (
                  <div className="wl-empty-state">
                    <span>Esta lista está vacía</span>
                    <button
                      className="tv-btn primary-btn"
                      style={{ marginTop: '10px', fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setShowAddSymbolModal(true)}
                    >
                      <Plus size={14} />
                      <span>Añadir símbolos</span>
                    </button>
                  </div>
                ) : (
                  activeGroup.items.map((item) => {
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
                          <button
                            className="item-remove-btn"
                            title="Quitar de la lista"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSymbol(item.symbol);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
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

      {/* Create / Rename Watchlist Modal */}
      {modalMode !== null && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                {modalMode === 'create' ? 'Crear lista de seguimiento' : 'Renombrar lista de seguimiento'}
              </span>
              <button className="close-btn" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                Nombre de la lista:
              </label>
              <input
                type="text"
                value={modalInputName}
                onChange={(e) => setModalInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (modalMode === 'create') handleCreateGroup();
                    else handleRenameGroup();
                  }
                }}
                autoFocus
                style={{
                  background: 'var(--tv-bg-main)',
                  border: '1px solid var(--tv-border)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="tv-btn"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => setModalMode(null)}
              >
                Cancelar
              </button>
              <button
                className="tv-btn primary-btn"
                style={{ padding: '6px 16px', fontSize: '13px', background: 'var(--tv-accent)', color: '#fff' }}
                onClick={() => {
                  if (modalMode === 'create') handleCreateGroup();
                  else handleRenameGroup();
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Symbol Modal */}
      {showAddSymbolModal && (
        <div className="modal-overlay" onClick={() => setShowAddSymbolModal(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                Añadir símbolo a "{activeGroup.name}"
              </span>
              <button className="close-btn" onClick={() => setShowAddSymbolModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="search-input-box" style={{ marginBottom: '12px' }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar activo (ej: NQ, ES, BTC, AAPL)..."
                value={addSymbolQuery}
                onChange={(e) => setAddSymbolQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="search-results" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {ALL_CATALOG_SYMBOLS.filter(
                (item) =>
                  item.symbol.toLowerCase().includes(addSymbolQuery.toLowerCase()) ||
                  item.name.toLowerCase().includes(addSymbolQuery.toLowerCase())
              ).map((item) => {
                const isAlreadyAdded = activeGroup.items.some((i) => i.symbol === item.symbol);
                return (
                  <div
                    key={item.symbol}
                    className={`search-item ${isAlreadyAdded ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!isAlreadyAdded) handleAddSymbol(item);
                    }}
                    style={{ cursor: isAlreadyAdded ? 'default' : 'pointer', opacity: isAlreadyAdded ? 0.5 : 1 }}
                  >
                    <div className="item-info">
                      <span className="item-symbol">{item.symbol}</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-market">
                      {isAlreadyAdded ? (
                        <span style={{ fontSize: '11px', color: 'var(--tv-green)' }}>Añadido</span>
                      ) : (
                        <Plus size={16} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
