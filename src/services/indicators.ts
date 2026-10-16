import type { Candle } from '../types';

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface BollingerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export function calculateSMA(candles: Candle[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: candles[i].time,
        value: sum / period,
      });
    }
  }
  return result;
}

export function calculateEMA(candles: Candle[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length < period) return result;

  const k = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
  result.push({ time: candles[period - 1].time, value: ema });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({
      time: candles[i].time,
      value: ema,
    });
  }
  return result;
}

export function calculateBollingerBands(candles: Candle[], period = 20, multiplier = 2): BollingerPoint[] {
  const result: BollingerPoint[] = [];
  if (candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    result.push({
      time: candles[i].time,
      middle: mean,
      upper: mean + multiplier * stdDev,
      lower: mean - multiplier * stdDev,
    });
  }
  return result;
}

export function calculateRSI(candles: Candle[], period = 14): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: candles[period].time, value: rsi });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time, value: rsi });
  }

  return result;
}

export const DEFAULT_ICT_SETTINGS: import('../types').ICTSettings = {
  enabled: true,
  asia: true,
  asiaColor: '#2962ff',
  london: true,
  londonColor: '#f23645',
  nyam: true,
  nyamColor: '#089981',
  nypm: true,
  nypmColor: '#ab47bc',
  midnightOpen: true,
  midnightColor: '#ffeb3b',
  open830: true,
  open830Color: '#ff9800',
  open930: true,
  open930Color: '#00e5ff',
  pdhl: true,
  pdhlColor: '#ffffff',
};

export function calculateICTPlots(candles: Candle[], settings: import('../types').ICTSettings = DEFAULT_ICT_SETTINGS): import('./pineEngine').PinePlot[] {
  if (!settings.enabled || candles.length === 0) return [];
  const plots: import('./pineEngine').PinePlot[] = [];

  const pdhData: { time: number; value: number }[] = [];
  const pdlData: { time: number; value: number }[] = [];
  const midnightData: { time: number; value: number }[] = [];
  const open830Data: { time: number; value: number }[] = [];
  const open930Data: { time: number; value: number }[] = [];
  const asiaHiData: { time: number; value: number }[] = [];
  const asiaLoData: { time: number; value: number }[] = [];
  const lndnHiData: { time: number; value: number }[] = [];
  const lndnLoData: { time: number; value: number }[] = [];
  const nyamHiData: { time: number; value: number }[] = [];
  const nyamLoData: { time: number; value: number }[] = [];
  const nypmHiData: { time: number; value: number }[] = [];
  const nypmLoData: { time: number; value: number }[] = [];

  const nyOffsetSec = -4 * 3600; // New York Time (EDT)
  let currentDay = -1;
  let prevDayHigh = 0;
  let prevDayLow = 0;
  let dayHigh = 0;
  let dayLow = 0;
  let midnightOpen = 0;
  let open830 = 0;
  let open930 = 0;

  let asiaHigh = 0;
  let asiaLow = Infinity;
  let lndnHigh = 0;
  let lndnLow = Infinity;
  let nyamHigh = 0;
  let nyamLow = Infinity;
  let nypmHigh = 0;
  let nypmLow = Infinity;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const nyTime = new Date((c.time + nyOffsetSec) * 1000);
    const day = nyTime.getUTCDate();
    const hour = nyTime.getUTCHours();
    const minute = nyTime.getUTCMinutes();
    const timeOfDayMin = hour * 60 + minute;

    if (day !== currentDay) {
      if (currentDay !== -1) {
        prevDayHigh = dayHigh;
        prevDayLow = dayLow;
      }
      currentDay = day;
      dayHigh = c.high;
      dayLow = c.low;
      midnightOpen = c.open;
      open830 = 0;
      open930 = 0;
      asiaHigh = 0;
      asiaLow = Infinity;
      lndnHigh = 0;
      lndnLow = Infinity;
      nyamHigh = 0;
      nyamLow = Infinity;
      nypmHigh = 0;
      nypmLow = Infinity;
    } else {
      dayHigh = Math.max(dayHigh, c.high);
      dayLow = Math.min(dayLow, c.low);
    }

    if (settings.midnightOpen && midnightOpen > 0) {
      midnightData.push({ time: c.time, value: midnightOpen });
    }

    if (settings.london) {
      if (timeOfDayMin >= 120 && timeOfDayMin <= 300) {
        lndnHigh = Math.max(lndnHigh, c.high);
        lndnLow = Math.min(lndnLow, c.low);
      }
      if (lndnHigh > 0 && lndnLow < Infinity && timeOfDayMin >= 120) {
        lndnHiData.push({ time: c.time, value: lndnHigh });
        lndnLoData.push({ time: c.time, value: lndnLow });
      }
    }

    if (settings.open830) {
      if (timeOfDayMin >= 510 && open830 === 0) open830 = c.open;
      if (open830 > 0) open830Data.push({ time: c.time, value: open830 });
    }

    if (settings.open930) {
      if (timeOfDayMin >= 570 && open930 === 0) open930 = c.open;
      if (open930 > 0) open930Data.push({ time: c.time, value: open930 });
    }

    if (settings.nyam) {
      if (timeOfDayMin >= 570 && timeOfDayMin <= 660) {
        nyamHigh = Math.max(nyamHigh, c.high);
        nyamLow = Math.min(nyamLow, c.low);
      }
      if (nyamHigh > 0 && nyamLow < Infinity && timeOfDayMin >= 570) {
        nyamHiData.push({ time: c.time, value: nyamHigh });
        nyamLoData.push({ time: c.time, value: nyamLow });
      }
    }

    if (settings.nypm) {
      if (timeOfDayMin >= 810 && timeOfDayMin <= 960) {
        nypmHigh = Math.max(nypmHigh, c.high);
        nypmLow = Math.min(nypmLow, c.low);
      }
      if (nypmHigh > 0 && nypmLow < Infinity && timeOfDayMin >= 810) {
        nypmHiData.push({ time: c.time, value: nypmHigh });
        nypmLoData.push({ time: c.time, value: nypmLow });
      }
    }

    if (settings.asia) {
      if (timeOfDayMin >= 1200) {
        asiaHigh = Math.max(asiaHigh, c.high);
        asiaLow = Math.min(asiaLow, c.low);
      }
      if (asiaHigh > 0 && asiaLow < Infinity && timeOfDayMin >= 1200) {
        asiaHiData.push({ time: c.time, value: asiaHigh });
        asiaLoData.push({ time: c.time, value: asiaLow });
      }
    }

    if (settings.pdhl && prevDayHigh > 0 && prevDayLow > 0) {
      pdhData.push({ time: c.time, value: prevDayHigh });
      pdlData.push({ time: c.time, value: prevDayLow });
    }
  }

  if (pdhData.length > 0) plots.push({ id: 'ict_pdh', title: 'PDH (Prev Day High)', color: settings.pdhlColor, data: pdhData });
  if (pdlData.length > 0) plots.push({ id: 'ict_pdl', title: 'PDL (Prev Day Low)', color: '#9e9e9e', data: pdlData });
  if (midnightData.length > 0) plots.push({ id: 'ict_midnight', title: 'Midnight Open (00:00)', color: settings.midnightColor, data: midnightData });
  if (open830Data.length > 0) plots.push({ id: 'ict_open830', title: '8:30 AM News Open', color: settings.open830Color, data: open830Data });
  if (open930Data.length > 0) plots.push({ id: 'ict_open930', title: '9:30 AM Equity Open', color: settings.open930Color, data: open930Data });
  if (lndnHiData.length > 0) plots.push({ id: 'ict_lndn_h', title: 'London High (02:00-05:00)', color: settings.londonColor, data: lndnHiData });
  if (lndnLoData.length > 0) plots.push({ id: 'ict_lndn_l', title: 'London Low (02:00-05:00)', color: settings.londonColor, data: lndnLoData });
  if (nyamHiData.length > 0) plots.push({ id: 'ict_nyam_h', title: 'NY AM High (09:30-11:00)', color: settings.nyamColor, data: nyamHiData });
  if (nyamLoData.length > 0) plots.push({ id: 'ict_nyam_l', title: 'NY AM Low (09:30-11:00)', color: settings.nyamColor, data: nyamLoData });
  if (nypmHiData.length > 0) plots.push({ id: 'ict_nypm_h', title: 'NY PM High (13:30-16:00)', color: settings.nypmColor, data: nypmHiData });
  if (nypmLoData.length > 0) plots.push({ id: 'ict_nypm_l', title: 'NY PM Low (13:30-16:00)', color: settings.nypmColor, data: nypmLoData });
  if (asiaHiData.length > 0) plots.push({ id: 'ict_asia_h', title: 'Asia High (20:00-00:00)', color: settings.asiaColor, data: asiaHiData });
  if (asiaLoData.length > 0) plots.push({ id: 'ict_asia_l', title: 'Asia Low (20:00-00:00)', color: settings.asiaColor, data: asiaLoData });

  return plots;
}
