import type { Candle, Timeframe } from '../types';

export async function fetchHistoricalKlines(symbol: string, interval: Timeframe, limit = 500): Promise<Candle[]> {
  try {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const url = `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Binance API error: ${res.statusText}`);
    const data = await res.json();

    return data.map((d: any) => ({
      time: Math.floor(d[0] / 1000),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (err) {
    console.warn('Falling back to synthetic historical data for', symbol, err);
    return generateSyntheticData(symbol, 300);
  }
}

export function subscribeToKlines(
  symbol: string,
  interval: Timeframe,
  onCandle: (candle: Candle) => void
): () => void {
  const cleanSymbol = symbol.replace('/', '').toLowerCase();
  let ws: WebSocket | null = null;
  let intervalId: any = null;

  try {
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${cleanSymbol}@kline_${interval}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.k) {
          const k = msg.k;
          const candle: Candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };
          onCandle(candle);
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    ws.onerror = () => {
      console.warn('WebSocket failed, running simulated tick stream');
      fallbackSimulation();
    };
  } catch {
    fallbackSimulation();
  }

  function fallbackSimulation() {
    let lastPrice = 65000;
    intervalId = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const delta = (Math.random() - 0.49) * (lastPrice * 0.001);
      lastPrice = Math.max(1, lastPrice + delta);
      onCandle({
        time: now,
        open: lastPrice - delta * 0.5,
        high: lastPrice + Math.abs(delta) * 1.5,
        low: lastPrice - Math.abs(delta) * 1.5,
        close: lastPrice,
        volume: Math.random() * 5,
      });
    }, 1000);
  }

  return () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

function generateSyntheticData(symbol: string, count: number): Candle[] {
  const candles: Candle[] = [];
  let basePrice = symbol.includes('BTC') ? 65000 : symbol.includes('ETH') ? 3500 : symbol.includes('SOL') ? 150 : 200;
  const now = Math.floor(Date.now() / 1000);
  const step = 60; // 1m intervals

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const change = (Math.random() - 0.495) * (basePrice * 0.003);
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.0015);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.0015);
    const volume = Math.random() * 20 + 5;
    candles.push({ time, open, high, low, close, volume });
    basePrice = close;
  }
  return candles;
}
