export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';

export type DrawingTool = 'crosshair' | 'trendline' | 'horizontal' | 'measure' | 'none';

export interface IndicatorConfig {
  sma20: boolean;
  ema50: boolean;
  ema200: boolean;
  bollinger: boolean;
  rsi: boolean;
  volume: boolean;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  isCrypto: boolean;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}
