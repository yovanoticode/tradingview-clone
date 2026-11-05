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

export interface BinanceSearchResult {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  isCrypto: boolean;
}

let cachedTickers: { symbol: string; price: number }[] | null = null;
let cacheFetchPromise: Promise<{ symbol: string; price: number }[]> | null = null;

export async function fetchBinanceTickerList(): Promise<{ symbol: string; price: number }[]> {
  if (cachedTickers && cachedTickers.length > 0) return cachedTickers;
  if (cacheFetchPromise) return cacheFetchPromise;

  cacheFetchPromise = (async () => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price');
      if (!res.ok) throw new Error('Failed to fetch ticker list');
      const data = await res.json();
      cachedTickers = data.map((d: any) => ({
        symbol: d.symbol,
        price: parseFloat(d.price),
      }));
      return cachedTickers || [];
    } catch (e) {
      console.warn('Could not load Binance symbol list', e);
      return [];
    } finally {
      cacheFetchPromise = null;
    }
  })();

  return cacheFetchPromise;
}

export async function searchBinanceSymbols(query: string): Promise<BinanceSearchResult[]> {
  const cleanQ = query.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleanQ) return [];

  const all = await fetchBinanceTickerList();

  if (!all.length) {
    const candidates = cleanQ.endsWith('USDT') ? [cleanQ] : [`${cleanQ}USDT`, cleanQ];
    const directResults: BinanceSearchResult[] = [];
    for (const sym of candidates) {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
        if (res.ok) {
          const d = await res.json();
          directResults.push({
            symbol: d.symbol,
            name: `${d.symbol.replace('USDT', '')} / TetherUS`,
            price: parseFloat(d.lastPrice),
            change24h: parseFloat(d.priceChangePercent),
            isCrypto: true,
          });
        }
      } catch {}
    }
    return directResults;
  }

  const matches = all.filter((item) => item.symbol.includes(cleanQ));
  if (matches.length === 0) return [];

  matches.sort((a, b) => {
    const aSym = a.symbol;
    const bSym = b.symbol;
    const targetUSDT = `${cleanQ}USDT`;
    if (aSym === targetUSDT) return -1;
    if (bSym === targetUSDT) return 1;
    if (aSym === cleanQ) return -1;
    if (bSym === cleanQ) return 1;

    const aStarts = aSym.startsWith(cleanQ);
    const bStarts = bSym.startsWith(cleanQ);
    const aUsdt = aSym.endsWith('USDT');
    const bUsdt = bSym.endsWith('USDT');

    if (aStarts && aUsdt && !(bStarts && bUsdt)) return -1;
    if (!(aStarts && aUsdt) && bStarts && bUsdt) return 1;

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    if (aUsdt && !bUsdt) return -1;
    if (!aUsdt && bUsdt) return 1;

    return aSym.localeCompare(bSym);
  });

  const topMatches = matches.slice(0, 12);
  const symbolList = topMatches.map((m) => m.symbol);

  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbolList))}`;
    const res = await fetch(url);
    if (res.ok) {
      const stats = await res.json();
      const statsMap = new Map<string, any>();
      stats.forEach((s: any) => statsMap.set(s.symbol, s));

      return topMatches.map((m) => {
        const stat = statsMap.get(m.symbol);
        const base = m.symbol.endsWith('USDT')
          ? m.symbol.slice(0, -4)
          : m.symbol.endsWith('BTC')
          ? m.symbol.slice(0, -3)
          : m.symbol;
        const quote = m.symbol.endsWith('USDT')
          ? 'TetherUS'
          : m.symbol.endsWith('BTC')
          ? 'Bitcoin'
          : m.symbol.endsWith('USDC')
          ? 'USD Coin'
          : m.symbol.endsWith('FDUSD')
          ? 'FDUSD'
          : '';

        return {
          symbol: m.symbol,
          name: quote ? `${base} / ${quote}` : m.symbol,
          price: stat ? parseFloat(stat.lastPrice) : m.price,
          change24h: stat ? parseFloat(stat.priceChangePercent) : 0,
          isCrypto: true,
        };
      });
    }
  } catch (e) {
    console.warn('Failed to fetch 24hr stats for top matches', e);
  }

  return topMatches.map((m) => ({
    symbol: m.symbol,
    name: m.symbol,
    price: m.price,
    change24h: 0,
    isCrypto: true,
  }));
}

