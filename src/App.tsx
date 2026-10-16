import { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { LeftToolbar } from './components/LeftToolbar';
import { ChartContainer } from './components/ChartContainer';
import { RightSidebar } from './components/RightSidebar';
import { BottomBar } from './components/BottomBar';
import { TradovatePanel } from './components/TradovatePanel';
import { PineEditor } from './components/PineEditor';
import type { Candle, ChartType, DrawingTool, IndicatorConfig, Timeframe, ICTSettings, ChartLayout, ChartTimezone } from './types';
import type { PinePlot } from './services/pineEngine';
import { fetchHistoricalKlines, subscribeToKlines } from './services/binanceService';
import { TradovateService, fetchRealMNQKlines } from './services/tradovateService';
import { calculateICTPlots, DEFAULT_ICT_SETTINGS } from './services/indicators';
import './index.css';

const DEFAULT_LAYOUTS: ChartLayout[] = [
  {
    id: 'layout-ict',
    name: 'ICT',
    symbol: 'MNQ',
    timeframe: '15m',
    chartType: 'candlestick',
    indicators: {
      volume: true,
      sma20: false,
      ema50: false,
      ema200: false,
      bollinger: false,
      rsi: false,
      ictKillzones: true,
      macd: false,
      stochastic: false,
      orb: true,
    },
    ictSettings: DEFAULT_ICT_SETTINGS,
    isFavorite: true,
    lastModified: Date.now(),
  },
  {
    id: 'layout-mes',
    name: 'MES',
    symbol: 'MNQ',
    timeframe: '1m',
    chartType: 'candlestick',
    indicators: {
      volume: true,
      sma20: true,
      ema50: true,
      ema200: false,
      bollinger: false,
      rsi: false,
      ictKillzones: true,
      macd: true,
      stochastic: false,
      orb: true,
    },
    ictSettings: DEFAULT_ICT_SETTINGS,
    isFavorite: true,
    lastModified: Date.now() - 3600000,
  },
  {
    id: 'layout-btc',
    name: 'BTC',
    symbol: 'BTCUSDT',
    timeframe: '1d',
    chartType: 'candlestick',
    indicators: {
      volume: true,
      sma20: true,
      ema50: true,
      ema200: true,
      bollinger: true,
      rsi: true,
      ictKillzones: false,
      macd: true,
      stochastic: true,
      orb: false,
    },
    ictSettings: DEFAULT_ICT_SETTINGS,
    isFavorite: true,
    lastModified: Date.now() - 7200000,
  },
  {
    id: 'layout-acciones',
    name: 'ACCIONES',
    symbol: 'AAPL',
    timeframe: '1d',
    chartType: 'candlestick',
    indicators: {
      volume: true,
      sma20: true,
      ema50: false,
      ema200: false,
      bollinger: false,
      rsi: true,
      ictKillzones: false,
      macd: true,
      stochastic: false,
      orb: false,
    },
    ictSettings: DEFAULT_ICT_SETTINGS,
    isFavorite: false,
    lastModified: Date.now() - 10800000,
  },
];

export const App: React.FC = () => {
  // Layout Management State
  const [layouts, setLayouts] = useState<ChartLayout[]>(() => {
    try {
      const saved = localStorage.getItem('tv_chart_layouts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LAYOUTS;
  });

  const [activeLayoutId, setActiveLayoutId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('tv_active_layout_id');
      if (savedId) return savedId;
    } catch {}
    return 'layout-ict';
  });

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tv_autosave');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const initialLayout = layouts.find((l) => l.id === activeLayoutId) || layouts[0] || DEFAULT_LAYOUTS[0];

  const [symbol, setSymbol] = useState(initialLayout.symbol || 'MNQ');
  const [timeframe, setTimeframe] = useState<Timeframe>(initialLayout.timeframe || '1m');
  const [chartType, setChartType] = useState<ChartType>(initialLayout.chartType || 'candlestick');
  const [indicators, setIndicators] = useState<IndicatorConfig>(initialLayout.indicators || {
    volume: true,
    sma20: true,
    ema50: false,
    ema200: false,
    bollinger: false,
    rsi: false,
    ictKillzones: true,
    macd: false,
    stochastic: false,
    orb: true,
  });

  const [ictSettings, setIctSettings] = useState<ICTSettings>(() => {
    if (initialLayout.ictSettings) return initialLayout.ictSettings;
    try {
      const saved = localStorage.getItem('ict_settings');
      return saved ? { ...DEFAULT_ICT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_ICT_SETTINGS;
    } catch {
      return DEFAULT_ICT_SETTINGS;
    }
  });

  const updateIctSettings = (newSettings: Partial<ICTSettings>) => {
    setIctSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('ict_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const [activeTool, setActiveTool] = useState<DrawingTool>('crosshair');
  const [magnetMode, setMagnetMode] = useState(false);
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [lockDrawings, setLockDrawings] = useState(false);
  const [hideDrawings, setHideDrawings] = useState(false);
  const [favoritesActive, setFavoritesActive] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [activeRange, setActiveRange] = useState('1D');
  const [timezone, setTimezone] = useState<ChartTimezone>(() => {
    try {
      const saved = localStorage.getItem('tv_timezone');
      if (saved && (saved === 'America/Bogota' || saved === 'America/New_York' || saved === 'UTC')) {
        return saved as ChartTimezone;
      }
    } catch {}
    return 'America/Bogota';
  });

  const handleSelectTimezone = (tz: ChartTimezone) => {
    setTimezone(tz);
    localStorage.setItem('tv_timezone', tz);
  };

  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [customPlots, setCustomPlots] = useState<PinePlot[]>([]);

  // Computed active plots combining Pine Editor and ICT Killzones
  const activePlots = useMemo(() => {
    const list = [...customPlots];
    if (indicators.ictKillzones) {
      const ictPlots = calculateICTPlots(candles, ictSettings, timezone);
      list.push(...ictPlots);
    }
    return list;
  }, [customPlots, indicators.ictKillzones, ictSettings, candles, timezone]);

  // Load historical data and subscribe to live ticks
  useEffect(() => {
    let isMounted = true;
    const isMNQ = symbol.toUpperCase().includes('MNQ');

    async function loadData() {
      let history: Candle[] = [];
      if (isMNQ) {
        history = await fetchRealMNQKlines(timeframe);
      } else {
        history = await fetchHistoricalKlines(symbol, timeframe);
      }
      if (!isMounted) return;

      setCandles(history);
      if (history.length > 0) {
        const last = history[history.length - 1];
        const first = history[0];
        setCurrentPrice(last.close);
        setPriceChange(((last.close - first.open) / first.open) * 100);
      }
    }

    loadData();

    // Subscribe to live feed: Tradovate for MNQ, Binance for crypto
    let unsubscribe: () => void;
    const handleIncomingCandle = (incoming: Candle) => {
      if (!isMounted) return;

      const timeframeSeconds: Record<Timeframe, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400,
      };
      const step = timeframeSeconds[timeframe] || 60;
      const bucketTime = Math.floor(incoming.time / step) * step;

      setCurrentPrice(incoming.close);
      setCandles((prev) => {
        if (prev.length === 0) {
          return [{ ...incoming, time: bucketTime }];
        }
        if (prev.length > 1) {
          const first = prev[0];
          setPriceChange(((incoming.close - first.open) / first.open) * 100);
        }
        const last = prev[prev.length - 1];

        if (last.time === bucketTime) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            high: Math.max(last.high, incoming.close, incoming.high ?? incoming.close),
            low: Math.min(last.low, incoming.close, incoming.low ?? incoming.close),
            close: incoming.close,
            volume: (last.volume || 0) + (incoming.volume || 1),
          };
          return updated;
        } else if (bucketTime > last.time) {
          return [
            ...prev.slice(-999),
            {
              time: bucketTime,
              open: incoming.open ?? last.close,
              high: Math.max(incoming.open ?? last.close, incoming.close),
              low: Math.min(incoming.open ?? last.close, incoming.close),
              close: incoming.close,
              volume: incoming.volume || 1,
            },
          ];
        }
        return prev;
      });
    };

    if (isMNQ) {
      const tradovate = TradovateService.getInstance();
      unsubscribe = tradovate.subscribeMNQKlines(timeframe, handleIncomingCandle);
    } else {
      unsubscribe = subscribeToKlines(symbol, timeframe, handleIncomingCandle);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [symbol, timeframe]);

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Layout Actions
  const handleSaveLayout = () => {
    setLayouts((prev) => {
      const updated = prev.map((l) =>
        l.id === activeLayoutId
          ? {
              ...l,
              symbol,
              timeframe,
              chartType,
              indicators,
              ictSettings,
              lastModified: Date.now(),
            }
          : l
      );
      localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
      return updated;
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 1800);
  };

  const handleLoadLayout = (id: string) => {
    const target = layouts.find((l) => l.id === id);
    if (!target) return;
    setActiveLayoutId(target.id);
    localStorage.setItem('tv_active_layout_id', target.id);
    setSymbol(target.symbol);
    setTimeframe(target.timeframe);
    setChartType(target.chartType);
    setIndicators(target.indicators);
    if (target.ictSettings) {
      setIctSettings(target.ictSettings);
      localStorage.setItem('ict_settings', JSON.stringify(target.ictSettings));
    }
  };

  const handleCreateNewLayout = (name: string) => {
    const newLayout: ChartLayout = {
      id: 'layout-' + Date.now(),
      name: name.trim() || 'Nuevo Diseño',
      symbol,
      timeframe,
      chartType,
      indicators,
      ictSettings,
      isFavorite: false,
      lastModified: Date.now(),
    };
    const updated = [...layouts, newLayout];
    setLayouts(updated);
    setActiveLayoutId(newLayout.id);
    localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
    localStorage.setItem('tv_active_layout_id', newLayout.id);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 1800);
  };

  const handleDuplicateLayout = (name: string) => {
    const activeLayout = layouts.find((l) => l.id === activeLayoutId);
    const newLayout: ChartLayout = {
      id: 'layout-' + Date.now(),
      name: name.trim() || `${activeLayout?.name || 'Diseño'} (copia)`,
      symbol,
      timeframe,
      chartType,
      indicators,
      ictSettings,
      isFavorite: false,
      lastModified: Date.now(),
    };
    const updated = [...layouts, newLayout];
    setLayouts(updated);
    setActiveLayoutId(newLayout.id);
    localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
    localStorage.setItem('tv_active_layout_id', newLayout.id);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 1800);
  };

  const handleRenameLayout = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setLayouts((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, name: newName.trim() } : l));
      localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteLayout = (id: string) => {
    if (layouts.length <= 1) return;
    const updated = layouts.filter((l) => l.id !== id);
    setLayouts(updated);
    localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
    if (activeLayoutId === id) {
      handleLoadLayout(updated[0].id);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setLayouts((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
      localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleAutoSave = () => {
    setAutoSave((prev) => {
      const next = !prev;
      localStorage.setItem('tv_autosave', JSON.stringify(next));
      return next;
    });
  };

  const handleDownloadCSV = () => {
    if (!candles || candles.length === 0) return;
    const headerRow = 'Timestamp,DateTime,Open,High,Low,Close,Volume\n';
    const rows = candles
      .map((c) => {
        const d = new Date(c.time * 1000).toISOString();
        return `${c.time},${d},${c.open},${c.high},${c.low},${c.close},${c.volume || 0}`;
      })
      .join('\n');
    const blob = new Blob([headerRow + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}_${timeframe}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveLayout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [symbol, timeframe, chartType, indicators, ictSettings, activeLayoutId]);

  // Auto-save sync
  useEffect(() => {
    if (!autoSave) return;
    const timeout = setTimeout(() => {
      setLayouts((prev) => {
        const updated = prev.map((l) =>
          l.id === activeLayoutId
            ? {
                ...l,
                symbol,
                timeframe,
                chartType,
                indicators,
                ictSettings,
                lastModified: Date.now(),
              }
            : l
        );
        localStorage.setItem('tv_chart_layouts', JSON.stringify(updated));
        return updated;
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [symbol, timeframe, chartType, indicators, ictSettings, activeLayoutId, autoSave]);

  const handleTakeSnapshot = () => {
    const canvas = document.querySelector('.chart-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${symbol}_${timeframe}_chart.png`;
      a.click();
    }
  };

  return (
    <div className="tv-root-container">
      {/* Top Header */}
      <Header
        symbol={symbol}
        onSelectSymbol={setSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        chartType={chartType}
        onSelectChartType={setChartType}
        indicators={indicators}
        onToggleIndicator={toggleIndicator}
        ictSettings={ictSettings}
        onUpdateIctSettings={updateIctSettings}
        currentPrice={currentPrice}
        priceChange={priceChange}
        onTakeSnapshot={handleTakeSnapshot}
        layouts={layouts}
        activeLayoutId={activeLayoutId}
        autoSave={autoSave}
        isSavedRecently={isSavedRecently}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onCreateNewLayout={handleCreateNewLayout}
        onDuplicateLayout={handleDuplicateLayout}
        onRenameLayout={handleRenameLayout}
        onDeleteLayout={handleDeleteLayout}
        onToggleFavorite={handleToggleFavorite}
        onToggleAutoSave={handleToggleAutoSave}
        onDownloadCSV={handleDownloadCSV}
      />

      {/* Tradovate / CME Trading Panel */}
      <TradovatePanel currentPrice={currentPrice} symbol={symbol} />

      {/* Main Workspace: Left Toolbar + Chart + Right Sidebar */}
      <div className="tv-main-workspace">
        <LeftToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          magnetMode={magnetMode}
          onToggleMagnet={() => setMagnetMode(!magnetMode)}
          onClearDrawings={() => setClearTrigger((c) => c + 1)}
          stayInDrawingMode={stayInDrawingMode}
          onToggleStayInDrawingMode={() => setStayInDrawingMode(!stayInDrawingMode)}
          lockDrawings={lockDrawings}
          onToggleLockDrawings={() => setLockDrawings(!lockDrawings)}
          hideDrawings={hideDrawings}
          onToggleHideDrawings={() => setHideDrawings(!hideDrawings)}
          favoritesActive={favoritesActive}
          onToggleFavorites={() => setFavoritesActive(!favoritesActive)}
        />

        <main className="tv-chart-viewport">
          <ChartContainer
            candles={candles}
            chartType={chartType}
            indicators={indicators}
            symbol={symbol}
            activeTool={activeTool}
            clearTrigger={clearTrigger}
            customPlots={activePlots}
            ictSettings={ictSettings}
            timezone={timezone}
          />
        </main>

        <RightSidebar
          currentSymbol={symbol}
          onSelectSymbol={setSymbol}
          currentPrice={currentPrice}
          priceChange={priceChange}
        />
      </div>

      {/* Pine Script Editor & Strategy Tester Drawer */}
      <PineEditor candles={candles} onPlotsUpdate={setCustomPlots} />

      {/* Bottom Status / Range Bar */}
      <BottomBar
        activeRange={activeRange}
        onSelectRange={setActiveRange}
        timezone={timezone}
        onSelectTimezone={handleSelectTimezone}
      />
    </div>
  );
};

export default App;
