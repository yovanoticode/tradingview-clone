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

export type ChartTimezone = 'America/Bogota' | 'America/New_York' | 'UTC';

export type DrawingTool = 'crosshair' | 'trendline' | 'horizontal' | 'measure' | 'none';

export interface IndicatorConfig {
  sma20: boolean;
  ema50: boolean;
  ema200: boolean;
  bollinger: boolean;
  rsi: boolean;
  volume: boolean;
  ictKillzones: boolean;
  macd: boolean;
  stochastic: boolean;
}

export interface ICTKillzoneConfig {
  enabled: boolean;
  name: string;
  start: string; // "HH:MM" e.g. "20:00"
  end: string;   // "HH:MM" e.g. "00:00"
  color: string;
  showMidpoint?: boolean;
}

export interface ICTSettings {
  enabled: boolean;
  
  // Killzones 1-6
  kz1: ICTKillzoneConfig; // ASIA
  kz2: ICTKillzoneConfig; // LNDN
  kz3: ICTKillzoneConfig; // NYAM
  kz4: ICTKillzoneConfig; // NYL
  kz5: ICTKillzoneConfig; // NYPM
  kz6: ICTKillzoneConfig; // RTH

  // Killzone options
  showBoxes: boolean;
  showPivots: boolean;
  showMidpoints: boolean;
  showPivotLabels: boolean;
  extendPivots: 'mitigated' | 'past';
  maxDays: number;

  // Day - Week - Month (DWM)
  showDOpen: boolean;
  dhl: boolean;
  dmid: boolean;
  dColor: string;

  showWOpen: boolean;
  whl: boolean;
  wmid: boolean;
  wColor: string;

  showMOpen: boolean;
  mhl: boolean;
  mmid: boolean;
  mColor: string;

  // Opening Prices
  showOpens: boolean;
  midnightOpen: boolean;
  midnightColor: string;
  open830: boolean;
  open830Color: string;
  open930: boolean;
  open930Color: string;
  open1200: boolean;
  open1200Color: string;
  open1600: boolean;
  open1600Color: string;

  // Range Levels
  showLevels: boolean;
  levelsMultiplier: number;
  levelColor: string;

  // Data Table Stats HUD
  showDataTable: boolean;

  // Backwards compatibility helpers
  asia?: boolean;
  asiaColor?: string;
  london?: boolean;
  londonColor?: string;
  nyam?: boolean;
  nyamColor?: string;
  nypm?: boolean;
  nypmColor?: string;
  pdhl?: boolean;
  pdhlColor?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  isCrypto: boolean;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  items: WatchlistItem[];
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface ChartLayout {
  id: string;
  name: string;
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: IndicatorConfig;
  ictSettings: ICTSettings;
  isFavorite?: boolean;
  lastModified: number;
}

