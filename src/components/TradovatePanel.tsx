import { useState, useEffect } from 'react';
import { ShieldCheck, X, TrendingUp, TrendingDown, DollarSign, Wallet, Plus, Trash2 } from 'lucide-react';
import { TradovateService } from '../services/tradovateService';
import type { Position, TradovateAccount } from '../services/tradovateService';

interface TradovatePanelProps {
  currentPrice: number;
  symbol: string;
}

export const TradovatePanel: React.FC<TradovatePanelProps> = ({ currentPrice, symbol }) => {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('JHENA8309');
  const [accessToken, setAccessToken] = useState('');
  const [env, setEnv] = useState<'demo' | 'live'>('live');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [position, setPosition] = useState<Position | null>(null);
  const [quantity, setQuantity] = useState(1);
  const tradovate = TradovateService.getInstance();
  const [currentAccount, setCurrentAccount] = useState<TradovateAccount>(
    tradovate.selectedAccount
  );
  const [accountsList, setAccountsList] = useState<TradovateAccount[]>(
    tradovate.accounts
  );

  useEffect(() => {
    const unsubPos = tradovate.onPositionChange((pos) => {
      setPosition(pos ? { ...pos } : null);
    });
    const unsubAcc = tradovate.onAccountChange((acc) => {
      setCurrentAccount({ ...acc });
      setAccountsList([...tradovate.accounts]);
    });
    return () => {
      unsubPos();
      unsubAcc();
    };
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await tradovate.login({
      name: username,
      accessToken,
      env,
    });

    setLoading(false);
    if (res.ok) {
      setShowModal(false);
    } else {
      setErrorMsg(res.error || 'Fallo de autenticación');
    }
  };

  const isMNQ = symbol.toUpperCase().includes('MNQ');

  return (
    <>
      {/* Top Trading Bar for CME Futures / MNQ */}
      <div className="tradovate-trading-bar">
        <div className="bar-account-section">
          <div className="account-selector-wrap">
            <span
              className={`status-pill ${tradovate.isConnected ? 'online' : 'simulated'}`}
              title={tradovate.isConnected ? 'Conectado a Servidor Tradovate' : 'Modo Fondeo (JHENA8309)'}
            >
              <ShieldCheck size={14} className={tradovate.isConnected ? 'green' : 'gold'} />
              <span className="status-label">{tradovate.isConnected ? 'Tradovate Live' : 'JHENA8309'}</span>
            </span>

            {/* Account Dropdown Switcher */}
            <select
              className="account-select-dropdown"
              value={currentAccount?.id}
              onChange={(e) => tradovate.selectAccount(Number(e.target.value))}
            >
              {accountsList.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </option>
              ))}
            </select>

            <span className="balance-tag">
              ${(currentAccount?.balance ?? 50000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>

            <button
              className="edit-acc-btn"
              title="Gestionar y calibrar saldo de cuentas"
              onClick={() => setShowModal(true)}
            >
              Gestionar Cuentas ({accountsList.length})
            </button>
          </div>
        </div>

        {isMNQ && (
          <div className="order-controls">
            {/* Quantity */}
            <div className="qty-selector">
              <span className="qty-label">Contratos:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            {/* Buy Market */}
            <button
              className="trade-btn buy-mkt"
              onClick={() => tradovate.placeOrder('BUY', quantity, currentPrice || 30124.50)}
            >
              <TrendingUp size={15} />
              <span>COMPRAR ({quantity})</span>
            </button>

            {/* Sell Market */}
            <button
              className="trade-btn sell-mkt"
              onClick={() => tradovate.placeOrder('SELL', quantity, currentPrice || 30124.50)}
            >
              <TrendingDown size={15} />
              <span>VENDER ({quantity})</span>
            </button>

            {/* Position & PnL Display */}
            {position && (
              <div className={`active-position-badge ${position.unrealizedPnL >= 0 ? 'bull' : 'bear'}`}>
                <span className="pos-size">
                  {position.qty > 0 ? `LARGOS: +${position.qty}` : `CORTOS: ${position.qty}`} MNQ @ {position.entryPrice.toFixed(2)}
                </span>
                <span className="pos-pnl">
                  <DollarSign size={13} />
                  {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                </span>
                <button className="flatten-btn" onClick={() => tradovate.flatten()} title="Cerrar posición a mercado">
                  CERRAR
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection & Account Management Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tradovate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <ShieldCheck size={20} className="green" />
                <span>Gestor de Cuentas de Fondeo (Tradovate)</span>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              {/* Connected Accounts List */}
              <div className="accounts-management-box">
                <div className="box-title-row">
                  <div className="box-title">
                    <Wallet size={15} />
                    <span>Cuentas de JHENA8309 ({accountsList.length})</span>
                  </div>
                  <button
                    type="button"
                    className="add-acc-btn"
                    onClick={() => {
                      const newId = Date.now();
                      tradovate.addAccount({
                        id: newId,
                        name: `JHENA8309-0${accountsList.length + 1}`,
                        accountType: 'Apex / Topstep Eval',
                        balance: 50000,
                      });
                    }}
                  >
                    <Plus size={13} />
                    <span>Agregar Cuenta</span>
                  </button>
                </div>

                <div className="accounts-list">
                  {accountsList.map((acc, index) => (
                    <div
                      key={acc.id}
                      className={`account-card ${currentAccount?.id === acc.id ? 'active' : ''}`}
                      onClick={() => tradovate.selectAccount(acc.id)}
                    >
                      <div className="acc-card-header">
                        <span className="acc-num-tag">Cuenta #{index + 1}</span>
                        {currentAccount?.id === acc.id ? (
                          <span className="acc-active-badge">✓ Activa en Gráfico</span>
                        ) : (
                          <button
                            type="button"
                            className="select-acc-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              tradovate.selectAccount(acc.id);
                            }}
                          >
                            Seleccionar
                          </button>
                        )}
                        {accountsList.length > 1 && (
                          <button
                            type="button"
                            className="delete-acc-btn"
                            title="Eliminar cuenta"
                            onClick={(e) => {
                              e.stopPropagation();
                              tradovate.deleteAccount(acc.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="acc-card-body">
                        <div className="acc-grid-row">
                          <div className="field-group">
                            <label>Nombre / ID</label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => tradovate.updateAccount(acc.id, { name: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="field-group">
                            <label>Empresa / Tipo</label>
                            <input
                              type="text"
                              value={acc.accountType}
                              onChange={(e) => tradovate.updateAccount(acc.id, { accountType: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        <div className="field-group" style={{ marginTop: '6px' }}>
                          <label>Saldo Exacto de la Cuenta ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={acc.balance}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                tradovate.updateAccountBalance(acc.id, val);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider-text">Sincronización en Vivo vía Tradovate API</div>

              <form onSubmit={handleConnect} className="auth-form-sub">
                <div className="env-selector">
                  <button
                    type="button"
                    className={`env-btn ${env === 'live' ? 'active' : ''}`}
                    onClick={() => setEnv('live')}
                  >
                    Live / Cuenta Real (Apex, Topstep)
                  </button>
                  <button
                    type="button"
                    className={`env-btn ${env === 'demo' ? 'active' : ''}`}
                    onClick={() => setEnv('demo')}
                  >
                    Demo Sandbox Tradovate
                  </button>
                </div>

                {errorMsg && <div className="error-banner">{errorMsg}</div>}

                <div className="form-group">
                  <label>Usuario Tradovate</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="JHENA8309"
                  />
                </div>

                <div className="form-group">
                  <label>Token de Acceso Bearer (Copiado de trader.tradovate.com)</label>
                  <input
                    type="text"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Consultando saldo en tiempo real...' : 'Sincronizar Cuentas con Tradovate'}
                  </button>
                  <button
                    type="button"
                    className="demo-mode-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Listo / Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
