import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LeftToolbar } from './components/LeftToolbar';
import { ChartContainer } from './components/ChartContainer';
import { RightSidebar } from './components/RightSidebar';
import { BottomBar } from './components/BottomBar';
import { TradovatePanel } from './components/TradovatePanel';
import { PineEditor } from './components/PineEditor';
import type { Candle, ChartType, DrawingTool, IndicatorConfig, Timeframe } from './types';
import type { PinePlot } from './services/pineEngine';
import { fetchHistoricalKlines, subscribeToKlines } from './services/binanceService';
import { TradovateService, fetchRealMNQKlines } from './services/tradovateService';
import './index.css';

export const App: React.FC = () => {
  const [symbol, setSymbol] = useState('MNQ');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    volume: true,
    sma20: true,
    ema50: false,
    ema200: false,
    bollinger: false,
    rsi: false,
  });

  const [activeTool, setActiveTool] = useState<DrawingTool>('crosshair');
  const [magnetMode, setMagnetMode] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [activeRange, setActiveRange] = useState('1D');

  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [customPlots, setCustomPlots] = useState<PinePlot[]>([]);

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

      setCandles((prev) => {
        if (prev.length === 0) {
          return [{ ...incoming, time: bucketTime }];
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

      setCurrentPrice(incoming.close);
      setCandles((prev) => {
        if (prev.length > 1) {
          const first = prev[0];
          setPriceChange(((incoming.close - first.open) / first.open) * 100);
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
        currentPrice={currentPrice}
        priceChange={priceChange}
        onTakeSnapshot={handleTakeSnapshot}
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
        />

        <main className="tv-chart-viewport">
          <ChartContainer
            candles={candles}
            chartType={chartType}
            indicators={indicators}
            symbol={symbol}
            activeTool={activeTool}
            clearTrigger={clearTrigger}
            customPlots={customPlots}
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
      <BottomBar activeRange={activeRange} onSelectRange={setActiveRange} />
    </div>
  );
};

export default App;
