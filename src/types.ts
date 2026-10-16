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
  ictKillzones: boolean;
}

export interface ICTSettings {
  enabled: boolean;
  asia: boolean;
  asiaColor: string;
  london: boolean;
  londonColor: string;
  nyam: boolean;
  nyamColor: string;
  nypm: boolean;
  nypmColor: string;
  midnightOpen: boolean;
  midnightColor: string;
  open830: boolean;
  open830Color: string;
  open930: boolean;
  open930Color: string;
  pdhl: boolean;
  pdhlColor: string;
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
