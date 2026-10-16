import { useState } from 'react';
import { 
  Code2, 
  Play, 
  Save, 
  ChevronUp, 
  ChevronDown, 
  Terminal, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import type { Candle } from '../types';
import { executePineScript } from '../services/pineEngine';
import type { PineExecutionOutput } from '../services/pineEngine';

interface PineEditorProps {
  candles: Candle[];
  onPlotsUpdate: (plots: PineExecutionOutput['plots']) => void;
}

const TEMPLATES: { [key: string]: string } = {
  crossover: `//@version=5
strategy("Estrategia Cruce de Medias", overlay=true, margin_long=100)

// Configuración de Medias
fastLength = 9
slowLength = 21

fastMA = ta.sma(close, fastLength)
slowMA = ta.sma(close, slowLength)

// Dibujar en el gráfico
plot(fastMA, "Media Rápida (9)", color=color.blue)
plot(slowMA, "Media Lenta (21)", color=color.orange)

// Condiciones de entrada
longCondition = ta.crossover(fastMA, slowMA)
if (longCondition)
    strategy.entry("Compra Largo", strategy.long)

shortCondition = ta.crossunder(fastMA, slowMA)
if (shortCondition)
    strategy.close("Compra Largo")
`,
  double_ema: `//@version=5
indicator("Indicador Doble EMA", overlay=true)

ema20 = ta.ema(close, 20)
ema50 = ta.ema(close, 50)

plot(ema20, "EMA 20", color=color.aqua)
plot(ema50, "EMA 50", color=color.fuchsia)
`,
  rsi_strategy: `//@version=5
strategy("Estrategia de Reversión RSI", overlay=true)

rsiLength = 14
rsiValue = ta.rsi(close, rsiLength)
maTrend = ta.sma(close, 50)

plot(maTrend, "Filtro de Tendencia", color=color.yellow)

if (rsiValue < 30)
    strategy.entry("RSI Sobreventa", strategy.long)

if (rsiValue > 70)
    strategy.close("RSI Sobreventa")
`,
};

export const PineEditor: React.FC<PineEditorProps> = ({ candles, onPlotsUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'tester' | 'console'>('editor');
  const [code, setCode] = useState(TEMPLATES.crossover);
  const [consoleMsg, setConsoleMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [backtestResult, setBacktestResult] = useState<PineExecutionOutput['backtest'] | null>(null);

  const handleRunScript = () => {
    const res = executePineScript(code, candles);
    setConsoleMsg({ text: res.message, ok: res.success });
    if (res.success) {
      onPlotsUpdate(res.plots);
      if (res.backtest) {
        setBacktestResult(res.backtest);
      }
    }
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`tv-pine-container ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Drawer Toggle Header / Tab Strip */}
      <div className="pine-tab-bar">
        <div className="pine-tabs">
          <button
            className={`pine-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('editor');
              setIsOpen(true);
            }}
          >
            <Code2 size={14} />
            <span>Editor Pine</span>
          </button>

          <button
            className={`pine-tab-btn ${activeTab === 'tester' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tester');
              setIsOpen(true);
            }}
          >
            <TrendingUp size={14} />
            <span>Probador de Estrategias</span>
            {backtestResult && <span className="tester-badge">{backtestResult.totalTrades}</span>}
          </button>

          <button
            className={`pine-tab-btn ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('console');
              setIsOpen(true);
            }}
          >
            <Terminal size={14} />
            <span>Consola</span>
            {consoleMsg && (
              <span className={`console-dot ${consoleMsg.ok ? 'green' : 'red'}`} />
            )}
          </button>
        </div>

        <div className="pine-header-actions">
          {isOpen && (
            <>
              {/* Template Selector */}
              <select
                className="template-select"
                onChange={(e) => setCode(TEMPLATES[e.target.value] || code)}
                defaultValue="crossover"
              >
                <option value="crossover">Estrategia Cruce de Medias (SMA 9/21)</option>
                <option value="double_ema">Indicador Doble EMA (20/50)</option>
                <option value="rsi_strategy">Estrategia RSI Reversión</option>
              </select>

              {/* Add to Chart Button */}
              <button className="pine-action-btn primary" onClick={handleRunScript}>
                <Play size={13} />
                <span>Añadir al gráfico</span>
              </button>

              {/* Save Button */}
              <button
                className="pine-action-btn"
                onClick={() => setConsoleMsg({ text: 'Script guardado localmente', ok: true })}
              >
                <Save size={13} />
                <span>Guardar</span>
              </button>
            </>
          )}

          {/* Toggle Button */}
          <button
            className="pine-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Minimizar panel Pine' : 'Abrir Editor Pine'}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Drawer */}
      {isOpen && (
        <div className="pine-drawer-body">
          {activeTab === 'editor' && (
            <div className="pine-editor-pane">
              <div className="pine-line-numbers">
                {lineNumbers.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <textarea
                className="pine-code-area"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {activeTab === 'tester' && (
            <div className="pine-tester-pane">
              {backtestResult ? (
                <div className="tester-results">
                  <div className="tester-metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Beneficio Neto</span>
                      <span className={`metric-val ${backtestResult.netProfit >= 0 ? 'bull' : 'bear'}`}>
                        {backtestResult.netProfit >= 0 ? '+' : ''}${backtestResult.netProfit.toLocaleString()}
                        <small>({backtestResult.netProfitPercent}%)</small>
                      </span>
                    </div>

                    <div className="metric-card">
                      <span className="metric-label">Tasa de Aciertos (Win Rate)</span>
                      <span className="metric-val">{backtestResult.winRate}%</span>
                    </div>

                    <div className="metric-card">
                      <span className="metric-label">Factor de Ganancia</span>
                      <span className="metric-val">{backtestResult.profitFactor}</span>
                    </div>

                    <div className="metric-card">
                      <span className="metric-label">Total de Operaciones</span>
                      <span className="metric-val">{backtestResult.totalTrades}</span>
                    </div>
                  </div>

                  {/* Trades List */}
                  <div className="trades-table-wrap">
                    <div className="table-title">Historial de Operaciones Simuladas</div>
                    <div className="trades-table-header">
                      <span>Tipo</span>
                      <span>Precio Entrada / Cierre</span>
                      <span>PnL</span>
                    </div>
                    <div className="trades-table-rows">
                      {backtestResult.trades.map((t, idx) => (
                        <div key={idx} className="trade-row">
                          <span className={`trade-type ${t.type === 'BUY' ? 'bull' : 'bear'}`}>
                            {t.type === 'BUY' ? 'COMPRA' : 'VENTA'}
                          </span>
                          <span className="trade-price">${t.price.toFixed(2)}</span>
                          <span className={`trade-pnl ${t.pnl !== undefined ? (t.pnl >= 0 ? 'bull' : 'bear') : ''}`}>
                            {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : 'Abierta'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tester-empty">
                  <FileCode size={36} className="empty-icon" />
                  <p>Ejecuta una estrategia con "Añadir al gráfico" para visualizar el informe de rendimiento y métricas de backtesting.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'console' && (
            <div className="pine-console-pane">
              {consoleMsg ? (
                <div className={`console-entry ${consoleMsg.ok ? 'success' : 'error'}`}>
                  {consoleMsg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{consoleMsg.text}</span>
                </div>
              ) : (
                <div className="console-empty">La consola está lista. No hay errores de compilación.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
