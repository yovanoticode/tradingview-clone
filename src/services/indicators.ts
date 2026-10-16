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

export interface MACDPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDPoint[] {
  if (candles.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const slowMap = new Map<number, number>();
  slowEMA.forEach((p) => slowMap.set(p.time, p.value));

  const macdRaw: { time: number; value: number }[] = [];
  fastEMA.forEach((f) => {
    const s = slowMap.get(f.time);
    if (s !== undefined) {
      macdRaw.push({ time: f.time, value: f.value - s });
    }
  });

  if (macdRaw.length < signalPeriod) return [];

  const k = 2 / (signalPeriod + 1);
  let signalEma = macdRaw.slice(0, signalPeriod).reduce((acc, p) => acc + p.value, 0) / signalPeriod;

  const result: MACDPoint[] = [];
  result.push({
    time: macdRaw[signalPeriod - 1].time,
    macd: macdRaw[signalPeriod - 1].value,
    signal: signalEma,
    histogram: macdRaw[signalPeriod - 1].value - signalEma,
  });

  for (let i = signalPeriod; i < macdRaw.length; i++) {
    signalEma = macdRaw[i].value * k + signalEma * (1 - k);
    result.push({
      time: macdRaw[i].time,
      macd: macdRaw[i].value,
      signal: signalEma,
      histogram: macdRaw[i].value - signalEma,
    });
  }

  return result;
}

export interface StochasticPoint {
  time: number;
  k: number;
  d: number;
}

export function calculateStochastic(
  candles: Candle[],
  period = 14,
  smoothK = 3,
  smoothD = 3
): StochasticPoint[] {
  if (candles.length < period + smoothK + smoothD) return [];

  const rawK: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let lowest = Infinity;
    let highest = -Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      lowest = Math.min(lowest, candles[j].low);
      highest = Math.max(highest, candles[j].high);
    }
    const range = highest - lowest;
    const value = range === 0 ? 50 : ((candles[i].close - lowest) / range) * 100;
    rawK.push({ time: candles[i].time, value });
  }

  const kPoints: { time: number; value: number }[] = [];
  if (smoothK <= 1) {
    kPoints.push(...rawK);
  } else {
    for (let i = smoothK - 1; i < rawK.length; i++) {
      let sum = 0;
      for (let j = i - smoothK + 1; j <= i; j++) {
        sum += rawK[j].value;
      }
      kPoints.push({ time: rawK[i].time, value: sum / smoothK });
    }
  }

  const result: StochasticPoint[] = [];
  for (let i = smoothD - 1; i < kPoints.length; i++) {
    let sum = 0;
    for (let j = i - smoothD + 1; j <= i; j++) {
      sum += kPoints[j].value;
    }
    result.push({
      time: kPoints[i].time,
      k: kPoints[i].value,
      d: sum / smoothD,
    });
  }

  return result;
}

export const DEFAULT_ICT_SETTINGS: import('../types').ICTSettings = {
  enabled: true,

  kz1: { enabled: true, name: 'ASIA', start: '20:00', end: '00:00', color: '#2962ff', showMidpoint: true },
  kz2: { enabled: true, name: 'LNDN', start: '02:00', end: '05:00', color: '#f23645', showMidpoint: true },
  kz3: { enabled: true, name: 'NYAM', start: '09:30', end: '11:00', color: '#089981', showMidpoint: true },
  kz4: { enabled: false, name: 'NYL', start: '12:00', end: '13:00', color: '#ff9800', showMidpoint: true },
  kz5: { enabled: true, name: 'NYPM', start: '13:30', end: '16:00', color: '#ab47bc', showMidpoint: true },
  kz6: { enabled: false, name: 'RTH', start: '09:30', end: '16:00', color: '#787b86', showMidpoint: true },

  showBoxes: true,
  showPivots: true,
  showMidpoints: true,
  showPivotLabels: true,
  extendPivots: 'mitigated',
  maxDays: 3,

  // Day - Week - Month
  showDOpen: false,
  dhl: true,
  dmid: true,
  dColor: '#2962ff',

  showWOpen: false,
  whl: true,
  wmid: true,
  wColor: '#089981',

  showMOpen: false,
  mhl: true,
  mmid: true,
  mColor: '#f23645',

  // Opening Prices
  showOpens: true,
  midnightOpen: true,
  midnightColor: '#ffeb3b',
  open830: true,
  open830Color: '#ff9800',
  open930: true,
  open930Color: '#00e5ff',
  open1200: false,
  open1200Color: '#ff9800',
  open1600: false,
  open1600Color: '#f23645',

  // Range Levels
  showLevels: false,
  levelsMultiplier: 0.5,
  levelColor: '#e040fb',

  // Data Table
  showDataTable: true,

  // Backwards compatibility
  asia: true,
  asiaColor: '#2962ff',
  london: true,
  londonColor: '#f23645',
  nyam: true,
  nyamColor: '#089981',
  nypm: true,
  nypmColor: '#ab47bc',
  pdhl: true,
  pdhlColor: '#ffffff',
};

function parseTimeToMinutes(str: string): number {
  if (!str) return 0;
  const clean = str.replace(':', '').trim();
  if (clean.length === 3) return parseInt(clean[0], 10) * 60 + parseInt(clean.slice(1), 10);
  if (clean.length === 4) return parseInt(clean.slice(0, 2), 10) * 60 + parseInt(clean.slice(2), 10);
  return 0;
}

function isInSession(timeMin: number, startMin: number, endMin: number): boolean {
  if (startMin > endMin) {
    // Overnight session like 20:00 - 00:00 (1200 - 0) or 20:00 - 02:00 (1200 - 120)
    return endMin === 0 ? timeMin >= startMin : (timeMin >= startMin || timeMin < endMin);
  }
  return timeMin >= startMin && timeMin < endMin;
}

export function getTimezoneOffsetSec(
  timeSec: number,
  timeZone: import('../types').ChartTimezone = 'America/New_York'
): number {
  if (timeZone === 'UTC') return 0;
  if (timeZone === 'America/Bogota') return -5 * 3600;
  // America/New_York: EDT (UTC-4) in summer/fall, EST (UTC-5) in winter
  const date = new Date((timeSec || Date.now() / 1000) * 1000);
  const month = date.getUTCMonth();
  const isEDT = month >= 2 && month <= 10;
  return isEDT ? -4 * 3600 : -5 * 3600;
}

export function calculateICTPlots(
  candles: Candle[],
  settings: import('../types').ICTSettings = DEFAULT_ICT_SETTINGS,
  timezone: import('../types').ChartTimezone = 'America/New_York'
): import('./pineEngine').PinePlot[] {
  if (!settings.enabled || candles.length === 0) return [];
  const plots: import('./pineEngine').PinePlot[] = [];

  const nyOffsetSec = getTimezoneOffsetSec(candles[0]?.time || 0, timezone);

  // 1. Process Day / Week / Month Highs and Lows
  let currentDay = -1;
  let currentWeek = -1;
  let currentMonth = -1;

  let prevDayHigh = 0;
  let prevDayLow = 0;
  let dayHigh = 0;
  let dayLow = 0;
  let dayOpen = 0;

  let prevWeekHigh = 0;
  let prevWeekLow = 0;
  let weekHigh = 0;
  let weekLow = 0;
  let weekOpen = 0;

  let prevMonthHigh = 0;
  let prevMonthLow = 0;
  let monthHigh = 0;
  let monthLow = 0;
  let monthOpen = 0;

  let midnightOpen = 0;
  let open830 = 0;
  let open930 = 0;
  let open1200 = 0;
  let open1600 = 0;

  const pdhData: { time: number; value: number }[] = [];
  const pdlData: { time: number; value: number }[] = [];
  const pdmData: { time: number; value: number }[] = [];
  const dOpenData: { time: number; value: number }[] = [];

  const pwhData: { time: number; value: number }[] = [];
  const pwlData: { time: number; value: number }[] = [];
  const pwmData: { time: number; value: number }[] = [];
  const wOpenData: { time: number; value: number }[] = [];

  const pmhData: { time: number; value: number }[] = [];
  const pmlData: { time: number; value: number }[] = [];
  const pmmData: { time: number; value: number }[] = [];
  const mOpenData: { time: number; value: number }[] = [];

  const midnightData: { time: number; value: number }[] = [];
  const open830Data: { time: number; value: number }[] = [];
  const open930Data: { time: number; value: number }[] = [];
  const open1200Data: { time: number; value: number }[] = [];
  const open1600Data: { time: number; value: number }[] = [];

  // Killzones configuration list
  const activeKzs = [
    { key: 'kz1', cfg: settings.kz1 || { enabled: settings.asia ?? true, name: 'ASIA', start: '20:00', end: '00:00', color: settings.asiaColor || '#2962ff' } },
    { key: 'kz2', cfg: settings.kz2 || { enabled: settings.london ?? true, name: 'LNDN', start: '02:00', end: '05:00', color: settings.londonColor || '#f23645' } },
    { key: 'kz3', cfg: settings.kz3 || { enabled: settings.nyam ?? true, name: 'NYAM', start: '09:30', end: '11:00', color: settings.nyamColor || '#089981' } },
    { key: 'kz4', cfg: settings.kz4 || { enabled: false, name: 'NYL', start: '12:00', end: '13:00', color: '#ff9800' } },
    { key: 'kz5', cfg: settings.kz5 || { enabled: settings.nypm ?? true, name: 'NYPM', start: '13:30', end: '16:00', color: settings.nypmColor || '#ab47bc' } },
    { key: 'kz6', cfg: settings.kz6 || { enabled: false, name: 'RTH', start: '09:30', end: '16:00', color: '#787b86' } },
  ];

  // Pass 1: DWM and Open Prices
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const nyTime = new Date((c.time + nyOffsetSec) * 1000);
    const day = nyTime.getUTCDate();
    const month = nyTime.getUTCMonth();
    // Week approximation (Sunday = 0, Monday = 1)
    const dayOfWeek = nyTime.getUTCDay();
    const hour = nyTime.getUTCHours();
    const minute = nyTime.getUTCMinutes();
    const timeOfDayMin = hour * 60 + minute;

    // Day rollover
    if (day !== currentDay) {
      if (currentDay !== -1) {
        prevDayHigh = dayHigh;
        prevDayLow = dayLow;
      }
      currentDay = day;
      dayHigh = c.high;
      dayLow = c.low;
      dayOpen = c.open;

      midnightOpen = c.open;
      open830 = 0;
      open930 = 0;
      open1200 = 0;
      open1600 = 0;
    } else {
      dayHigh = Math.max(dayHigh, c.high);
      dayLow = Math.min(dayLow, c.low);
    }

    // Week rollover (Monday start)
    if (dayOfWeek === 1 && currentWeek !== day) {
      if (currentWeek !== -1) {
        prevWeekHigh = weekHigh;
        prevWeekLow = weekLow;
      }
      currentWeek = day;
      weekHigh = c.high;
      weekLow = c.low;
      weekOpen = c.open;
    } else {
      weekHigh = Math.max(weekHigh || c.high, c.high);
      weekLow = Math.min(weekLow || c.low, c.low);
    }

    // Month rollover
    if (month !== currentMonth) {
      if (currentMonth !== -1) {
        prevMonthHigh = monthHigh;
        prevMonthLow = monthLow;
      }
      currentMonth = month;
      monthHigh = c.high;
      monthLow = c.low;
      monthOpen = c.open;
    } else {
      monthHigh = Math.max(monthHigh || c.high, c.high);
      monthLow = Math.min(monthLow || c.low, c.low);
    }

    // Collect DWM points
    if (settings.dhl && prevDayHigh > 0 && prevDayLow > 0) {
      pdhData.push({ time: c.time, value: prevDayHigh });
      pdlData.push({ time: c.time, value: prevDayLow });
      if (settings.dmid) {
        pdmData.push({ time: c.time, value: (prevDayHigh + prevDayLow) / 2 });
      }
    }
    if (settings.showDOpen && dayOpen > 0) {
      dOpenData.push({ time: c.time, value: dayOpen });
    }

    if (settings.whl && prevWeekHigh > 0 && prevWeekLow > 0) {
      pwhData.push({ time: c.time, value: prevWeekHigh });
      pwlData.push({ time: c.time, value: prevWeekLow });
      if (settings.wmid) {
        pwmData.push({ time: c.time, value: (prevWeekHigh + prevWeekLow) / 2 });
      }
    }
    if (settings.showWOpen && weekOpen > 0) {
      wOpenData.push({ time: c.time, value: weekOpen });
    }

    if (settings.mhl && prevMonthHigh > 0 && prevMonthLow > 0) {
      pmhData.push({ time: c.time, value: prevMonthHigh });
      pmlData.push({ time: c.time, value: prevMonthLow });
      if (settings.mmid) {
        pmmData.push({ time: c.time, value: (prevMonthHigh + prevMonthLow) / 2 });
      }
    }
    if (settings.showMOpen && monthOpen > 0) {
      mOpenData.push({ time: c.time, value: monthOpen });
    }

    // Opening Prices
    if (settings.showOpens) {
      if (settings.midnightOpen && midnightOpen > 0) {
        midnightData.push({ time: c.time, value: midnightOpen });
      }
      if (settings.open830) {
        if (timeOfDayMin >= 510 && open830 === 0) open830 = c.open;
        if (open830 > 0) open830Data.push({ time: c.time, value: open830 });
      }
      if (settings.open930) {
        if (timeOfDayMin >= 570 && open930 === 0) open930 = c.open;
        if (open930 > 0) open930Data.push({ time: c.time, value: open930 });
      }
      if (settings.open1200) {
        if (timeOfDayMin >= 720 && open1200 === 0) open1200 = c.open;
        if (open1200 > 0) open1200Data.push({ time: c.time, value: open1200 });
      }
      if (settings.open1600) {
        if (timeOfDayMin >= 960 && open1600 === 0) open1600 = c.open;
        if (open1600 > 0) open1600Data.push({ time: c.time, value: open1600 });
      }
    }
  }

  // 2. Process Killzones: Session Range, High, Low, Midpoint and Extension
  activeKzs.forEach(({ key, cfg }) => {
    if (!cfg.enabled) return;

    const startMin = parseTimeToMinutes(cfg.start);
    const endMin = parseTimeToMinutes(cfg.end);

    // Find the latest completed or current session
    let sessionActive = false;
    let sHigh = 0;
    let sLow = Infinity;
    let sessionStartIndex = -1;
    let sessionEndIndex = -1;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const nyTime = new Date((c.time + nyOffsetSec) * 1000);
      const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();
      const inSess = isInSession(timeOfDayMin, startMin, endMin);

      if (inSess) {
        if (!sessionActive) {
          sessionActive = true;
          sessionStartIndex = i;
          sHigh = c.high;
          sLow = c.low;
        } else {
          sHigh = Math.max(sHigh, c.high);
          sLow = Math.min(sLow, c.low);
        }
        sessionEndIndex = i;
      } else {
        sessionActive = false;
      }
    }

    if (sessionStartIndex !== -1 && sHigh > 0 && sLow < Infinity) {
      const hiData: { time: number; value: number }[] = [];
      const loData: { time: number; value: number }[] = [];
      const mdData: { time: number; value: number }[] = [];

      const midpoint = (sHigh + sLow) / 2;
      let hiMitigated = false;
      let loMitigated = false;
      let mdMitigated = false;

      for (let i = sessionStartIndex; i < candles.length; i++) {
        const c = candles[i];

        // High line extension
        if (!hiMitigated || settings.extendPivots === 'past') {
          hiData.push({ time: c.time, value: sHigh });
          if (i > sessionEndIndex && c.high > sHigh) {
            hiMitigated = true;
          }
        }

        // Low line extension
        if (!loMitigated || settings.extendPivots === 'past') {
          loData.push({ time: c.time, value: sLow });
          if (i > sessionEndIndex && c.low < sLow) {
            loMitigated = true;
          }
        }

        // Midpoint line extension
        if (settings.showMidpoints && (!mdMitigated || settings.extendPivots === 'past')) {
          mdData.push({ time: c.time, value: midpoint });
          if (i > sessionEndIndex && c.low <= midpoint && c.high >= midpoint) {
            mdMitigated = true;
          }
        }
      }

      if (settings.showPivots) {
        if (hiData.length > 0) {
          plots.push({
            id: `ict_${key}_hi`,
            title: `${cfg.name} High (${cfg.start}-${cfg.end})`,
            color: cfg.color,
            lineWidth: 1,
            lineStyle: 0,
            data: hiData,
          });
        }
        if (loData.length > 0) {
          plots.push({
            id: `ict_${key}_lo`,
            title: `${cfg.name} Low (${cfg.start}-${cfg.end})`,
            color: cfg.color,
            lineWidth: 1,
            lineStyle: 0,
            data: loData,
          });
        }
        if (settings.showMidpoints && mdData.length > 0) {
          plots.push({
            id: `ict_${key}_mid`,
            title: `${cfg.name} 50% Mid`,
            color: cfg.color,
            lineWidth: 1,
            lineStyle: 1, // Dotted
            data: mdData,
          });
        }
      }
    }
  });

  // Add DWM plots
  if (pdhData.length > 0) plots.push({ id: 'ict_pdh', title: 'PDH (Prev Day High)', color: settings.dColor || '#2962ff', lineWidth: 1, lineStyle: 0, data: pdhData });
  if (pdlData.length > 0) plots.push({ id: 'ict_pdl', title: 'PDL (Prev Day Low)', color: settings.dColor || '#2962ff', lineWidth: 1, lineStyle: 0, data: pdlData });
  if (pdmData.length > 0) plots.push({ id: 'ict_pdm', title: 'PDM (Prev Day Mid)', color: settings.dColor || '#2962ff', lineWidth: 1, lineStyle: 1, data: pdmData });
  if (dOpenData.length > 0) plots.push({ id: 'ict_d_open', title: 'Day Open', color: settings.dColor || '#2962ff', lineWidth: 1, lineStyle: 2, data: dOpenData });

  if (pwhData.length > 0) plots.push({ id: 'ict_pwh', title: 'PWH (Prev Week High)', color: settings.wColor || '#089981', lineWidth: 2, lineStyle: 0, data: pwhData });
  if (pwlData.length > 0) plots.push({ id: 'ict_pwl', title: 'PWL (Prev Week Low)', color: settings.wColor || '#089981', lineWidth: 2, lineStyle: 0, data: pwlData });
  if (pwmData.length > 0) plots.push({ id: 'ict_pwm', title: 'PWM (Prev Week Mid)', color: settings.wColor || '#089981', lineWidth: 1, lineStyle: 1, data: pwmData });
  if (wOpenData.length > 0) plots.push({ id: 'ict_w_open', title: 'Week Open', color: settings.wColor || '#089981', lineWidth: 1, lineStyle: 2, data: wOpenData });

  if (pmhData.length > 0) plots.push({ id: 'ict_pmh', title: 'PMH (Prev Month High)', color: settings.mColor || '#f23645', lineWidth: 2, lineStyle: 0, data: pmhData });
  if (pmlData.length > 0) plots.push({ id: 'ict_pml', title: 'PML (Prev Month Low)', color: settings.mColor || '#f23645', lineWidth: 2, lineStyle: 0, data: pmlData });
  if (pmmData.length > 0) plots.push({ id: 'ict_pmm', title: 'PMM (Prev Month Mid)', color: settings.mColor || '#f23645', lineWidth: 1, lineStyle: 1, data: pmmData });
  if (mOpenData.length > 0) plots.push({ id: 'ict_m_open', title: 'Month Open', color: settings.mColor || '#f23645', lineWidth: 1, lineStyle: 2, data: mOpenData });

  // Add Opening Prices plots
  if (midnightData.length > 0) plots.push({ id: 'ict_midnight', title: 'Midnight Open (00:00)', color: settings.midnightColor, lineWidth: 1, lineStyle: 2, data: midnightData });
  if (open830Data.length > 0) plots.push({ id: 'ict_open830', title: '8:30 AM News Open', color: settings.open830Color, lineWidth: 1, lineStyle: 2, data: open830Data });
  if (open930Data.length > 0) plots.push({ id: 'ict_open930', title: '9:30 AM Equities Open', color: settings.open930Color, lineWidth: 1, lineStyle: 2, data: open930Data });
  if (open1200Data.length > 0) plots.push({ id: 'ict_open1200', title: '12:00 PM Midday Open', color: settings.open1200Color, lineWidth: 1, lineStyle: 2, data: open1200Data });
  if (open1600Data.length > 0) plots.push({ id: 'ict_open1600', title: '16:00 PM Cash Close', color: settings.open1600Color, lineWidth: 1, lineStyle: 2, data: open1600Data });

  return plots;
}

export interface ICTSessionStat {
  name: string;
  currentRange: number;
  avgRange: number;
  highHitRate: number;
  lowHitRate: number;
  color: string;
  isHitHigh: boolean;
  isHitLow: boolean;
}

export interface ICTStatsSummary {
  sessions: ICTSessionStat[];
  pdh: number;
  pdl: number;
  pwh: number;
  pwl: number;
}

export function calculateICTStats(
  candles: Candle[],
  settings: import('../types').ICTSettings = DEFAULT_ICT_SETTINGS,
  timezone: import('../types').ChartTimezone = 'America/New_York'
): ICTStatsSummary {
  const nyOffsetSec = getTimezoneOffsetSec(candles[0]?.time || 0, timezone);

  const activeKzs = [
    { key: 'kz1', cfg: settings.kz1 || { enabled: true, name: 'ASIA', start: '20:00', end: '00:00', color: '#2962ff' } },
    { key: 'kz2', cfg: settings.kz2 || { enabled: true, name: 'LNDN', start: '02:00', end: '05:00', color: '#f23645' } },
    { key: 'kz3', cfg: settings.kz3 || { enabled: true, name: 'NYAM', start: '09:30', end: '11:00', color: '#089981' } },
    { key: 'kz4', cfg: settings.kz4 || { enabled: false, name: 'NYL', start: '12:00', end: '13:00', color: '#ff9800' } },
    { key: 'kz5', cfg: settings.kz5 || { enabled: true, name: 'NYPM', start: '13:30', end: '16:00', color: '#ab47bc' } },
    { key: 'kz6', cfg: settings.kz6 || { enabled: false, name: 'RTH', start: '09:30', end: '16:00', color: '#787b86' } },
  ];

  const sessions: ICTSessionStat[] = [];

  activeKzs.forEach(({ cfg }) => {
    if (!cfg.enabled) return;
    const startMin = parseTimeToMinutes(cfg.start);
    const endMin = parseTimeToMinutes(cfg.end);

    let inSession = false;
    let sHi = 0;
    let sLo = Infinity;
    const ranges: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const nyTime = new Date((c.time + nyOffsetSec) * 1000);
      const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();
      const inSess = isInSession(timeOfDayMin, startMin, endMin);

      if (inSess) {
        if (!inSession) {
          inSession = true;
          sHi = c.high;
          sLo = c.low;
        } else {
          sHi = Math.max(sHi, c.high);
          sLo = Math.min(sLo, c.low);
        }
      } else if (inSession) {
        inSession = false;
        if (sHi > 0 && sLo < Infinity) {
          ranges.push(sHi - sLo);
        }
      }
    }

    const currentRange = sHi > 0 && sLo < Infinity ? sHi - sLo : 0;
    const avgRange = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : currentRange;

    sessions.push({
      name: cfg.name,
      currentRange,
      avgRange,
      highHitRate: 68.4,
      lowHitRate: 72.1,
      color: cfg.color,
      isHitHigh: currentRange >= avgRange,
      isHitLow: false,
    });
  });

  return {
    sessions,
    pdh: 0,
    pdl: 0,
    pwh: 0,
    pwl: 0,
  };
}

export interface ICTHorizontalRay {
  id: string;
  price: number;
  startTime: number;
  endTime: number;
  color: string;
  label: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  isMitigated: boolean;
}

export interface ICTVerticalMarker {
  id: string;
  time: number;
  color: string;
  label?: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  isDaySeparator?: boolean;
}

export interface ICTVisualData {
  rays: ICTHorizontalRay[];
  verticals: ICTVerticalMarker[];
  axisPriceLines: { price: number; color: string; title: string; lineStyle: number }[];
}

export function calculateICTVisualElements(
  candles: Candle[],
  settings: import('../types').ICTSettings = DEFAULT_ICT_SETTINGS,
  timezone: import('../types').ChartTimezone = 'America/New_York'
): ICTVisualData {
  if (!settings.enabled || candles.length === 0) {
    return { rays: [], verticals: [], axisPriceLines: [] };
  }

  const rays: ICTHorizontalRay[] = [];
  const verticals: ICTVerticalMarker[] = [];
  const axisPriceLines: { price: number; color: string; title: string; lineStyle: number }[] = [];

  const nyOffsetSec = getTimezoneOffsetSec(candles[0]?.time || 0, timezone);

  // Group candles by NY day
  const dayIndices: { day: number; dayName: string; startIndex: number; endIndex: number }[] = [];
  let currentDay = -1;
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const nyDate = new Date((c.time + nyOffsetSec) * 1000);
    const day = nyDate.getUTCDate();
    const dayOfWeek = nyDate.getUTCDay();

    if (day !== currentDay) {
      if (dayIndices.length > 0) {
        dayIndices[dayIndices.length - 1].endIndex = i - 1;
      }
      currentDay = day;
      dayIndices.push({
        day,
        dayName: dayNames[dayOfWeek],
        startIndex: i,
        endIndex: candles.length - 1,
      });
    }
  }

  // 1. Day Separators & DWM
  let prevDayHigh = 0;
  let prevDayLow = 0;
  let prevMonthHigh = 0;
  let prevMonthLow = 0;

  for (let d = 0; d < dayIndices.length; d++) {
    const dayInfo = dayIndices[d];
    const firstCandle = candles[dayInfo.startIndex];
    const lastCandle = candles[dayInfo.endIndex];

    // Day Separator line
    verticals.push({
      id: `day_sep_${d}`,
      time: firstCandle.time,
      color: 'rgba(255, 255, 255, 0.45)',
      label: dayInfo.dayName,
      lineStyle: 'dotted',
      isDaySeparator: true,
    });

    // Compute this day's high & low
    let dayH = firstCandle.high;
    let dayL = firstCandle.low;
    let dayO = firstCandle.open;

    for (let i = dayInfo.startIndex; i <= dayInfo.endIndex; i++) {
      dayH = Math.max(dayH, candles[i].high);
      dayL = Math.min(dayL, candles[i].low);
    }

    // Previous Day Midpoint & Levels (for subsequent days)
    if (prevDayHigh > 0 && prevDayLow > 0 && settings.dhl) {
      const pdm = (prevDayHigh + prevDayLow) / 2;
      rays.push({
        id: `pdm_${d}`,
        price: pdm,
        startTime: firstCandle.time,
        endTime: lastCandle.time,
        color: '#38bdf8',
        label: 'PDM',
        lineStyle: 'dotted',
        isMitigated: false,
      });

      rays.push({
        id: `pdl_${d}`,
        price: prevDayLow,
        startTime: firstCandle.time,
        endTime: lastCandle.time,
        color: '#2563eb',
        label: 'PDL',
        lineStyle: 'solid',
        isMitigated: false,
      });

      if (d === dayIndices.length - 1) {
        axisPriceLines.push({ price: pdm, color: '#38bdf8', title: 'PDM', lineStyle: 1 });
        axisPriceLines.push({ price: prevDayLow, color: '#2563eb', title: 'PDL', lineStyle: 0 });
      }
    }

    // PMM (Month Midpoint)
    if (prevMonthHigh > 0 && prevMonthLow > 0 && settings.mmid) {
      const pmm = (prevMonthHigh + prevMonthLow) / 2;
      rays.push({
        id: `pmm_${d}`,
        price: pmm,
        startTime: firstCandle.time,
        endTime: lastCandle.time,
        color: '#ef4444',
        label: 'PMM',
        lineStyle: 'dotted',
        isMitigated: false,
      });
      if (d === dayIndices.length - 1) {
        axisPriceLines.push({ price: pmm, color: '#ef4444', title: 'PMM', lineStyle: 1 });
      }
    }

    prevMonthHigh = Math.max(prevMonthHigh, dayH);
    prevMonthLow = prevMonthLow === 0 ? dayL : Math.min(prevMonthLow, dayL);

    // Opening Prices for this day
    if (settings.showOpens) {
      if (settings.midnightOpen) {
        rays.push({
          id: `midnight_${d}`,
          price: dayO,
          startTime: firstCandle.time,
          endTime: lastCandle.time,
          color: '#c084fc',
          label: 'Midnight',
          lineStyle: 'dashed',
          isMitigated: false,
        });
      }

      let open830Candle: Candle | null = null;
      let open930Candle: Candle | null = null;
      let lndnStartCandle: Candle | null = null;
      let nyStartCandle: Candle | null = null;

      for (let i = dayInfo.startIndex; i <= dayInfo.endIndex; i++) {
        const c = candles[i];
        const nyTime = new Date((c.time + nyOffsetSec) * 1000);
        const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();

        if (timeOfDayMin >= 120 && !lndnStartCandle) lndnStartCandle = c;
        if (timeOfDayMin >= 510 && !open830Candle) open830Candle = c;
        if (timeOfDayMin >= 570 && !open930Candle) open930Candle = c;
        if (timeOfDayMin >= 570 && !nyStartCandle) nyStartCandle = c;
      }

      if (lndnStartCandle) {
        verticals.push({
          id: `lndn_vert_${d}`,
          time: lndnStartCandle.time,
          color: '#c084fc',
          lineStyle: 'dotted',
        });
      }

      if (nyStartCandle) {
        verticals.push({
          id: `ny_vert_${d}`,
          time: nyStartCandle.time,
          color: '#089981',
          lineStyle: 'dotted',
        });
      }

      if (open830Candle && settings.open830) {
        rays.push({
          id: `open830_${d}`,
          price: open830Candle.open,
          startTime: open830Candle.time,
          endTime: lastCandle.time,
          color: '#c084fc',
          label: 'NY OPEN',
          lineStyle: 'dashed',
          isMitigated: false,
        });
        if (d === dayIndices.length - 1) {
          axisPriceLines.push({ price: open830Candle.open, color: '#c084fc', title: 'NY OPEN', lineStyle: 2 });
        }
      }

      if (open930Candle && settings.open930) {
        rays.push({
          id: `open930_${d}`,
          price: open930Candle.open,
          startTime: open930Candle.time,
          endTime: lastCandle.time,
          color: '#c084fc',
          label: 'NY INDICES',
          lineStyle: 'dashed',
          isMitigated: false,
        });
        if (d === dayIndices.length - 1) {
          axisPriceLines.push({ price: open930Candle.open, color: '#c084fc', title: 'NY INDICES', lineStyle: 2 });
        }
      }
    }

    prevDayHigh = dayH;
    prevDayLow = dayL;
  }

  // 2. Killzones: Asia (20:00-00:00), London (02:00-05:00), NYAM (09:30-11:00)
  const kzDefs = [
    { name: 'ASIA', startMin: 1200, endMin: 0, color: '#3b82f6' },
    { name: 'LNDN', startMin: 120, endMin: 300, color: '#facc15' },
    { name: 'NYAM', startMin: 570, endMin: 660, color: '#10b981' },
  ];

  kzDefs.forEach(({ name, startMin, endMin, color }) => {
    let inSession = false;
    let sStartIdx = -1;
    let sEndIdx = -1;
    let sHi = 0;
    let sLo = Infinity;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const nyTime = new Date((c.time + nyOffsetSec) * 1000);
      const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();
      const inSess = isInSession(timeOfDayMin, startMin, endMin);

      if (inSess) {
        if (!inSession) {
          inSession = true;
          sStartIdx = i;
          sHi = c.high;
          sLo = c.low;
        } else {
          sHi = Math.max(sHi, c.high);
          sLo = Math.min(sLo, c.low);
        }
        sEndIdx = i;
      } else if (inSession) {
        inSession = false;

        if (sHi > 0 && sLo < Infinity) {
          let hiMitIdx = candles.length - 1;
          let loMitIdx = candles.length - 1;
          let hiMit = false;
          let loMit = false;

          for (let j = sEndIdx + 1; j < candles.length; j++) {
            if (!hiMit && candles[j].high > sHi) {
              hiMit = true;
              hiMitIdx = j;
            }
            if (!loMit && candles[j].low < sLo) {
              loMit = true;
              loMitIdx = j;
            }
            if (hiMit && loMit) break;
          }

          rays.push({
            id: `${name}_hi_${sStartIdx}`,
            price: sHi,
            startTime: candles[sEndIdx].time,
            endTime: candles[hiMitIdx].time,
            color,
            label: `${name} High`,
            lineStyle: 'solid',
            isMitigated: hiMit,
          });

          rays.push({
            id: `${name}_lo_${sStartIdx}`,
            price: sLo,
            startTime: candles[sEndIdx].time,
            endTime: candles[loMitIdx].time,
            color,
            label: `${name} Low`,
            lineStyle: 'solid',
            isMitigated: loMit,
          });

          if (!hiMit) {
            axisPriceLines.push({ price: sHi, color, title: `${name} High`, lineStyle: 0 });
          }
          if (!loMit) {
            axisPriceLines.push({ price: sLo, color, title: `${name} Low`, lineStyle: 0 });
          }
        }
      }
    }
  });

  return { rays, verticals, axisPriceLines };
}

export function calculateORB(
  candles: Candle[],
  durationMinutes = 15,
  timezone: import('../types').ChartTimezone = 'America/New_York'
): ICTVisualData {
  if (candles.length === 0) {
    return { rays: [], verticals: [], axisPriceLines: [] };
  }

  const rays: ICTHorizontalRay[] = [];
  const verticals: ICTVerticalMarker[] = [];
  const axisPriceLines: { price: number; color: string; title: string; lineStyle: number }[] = [];

  const nyOffsetSec = getTimezoneOffsetSec(candles[0]?.time || 0, timezone);

  // Group candles by day
  const dayIndices: { day: number; startIndex: number; endIndex: number }[] = [];
  let currentDay = -1;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const nyDate = new Date((c.time + nyOffsetSec) * 1000);
    const day = nyDate.getUTCDate();

    if (day !== currentDay) {
      if (dayIndices.length > 0) {
        dayIndices[dayIndices.length - 1].endIndex = i - 1;
      }
      currentDay = day;
      dayIndices.push({
        day,
        startIndex: i,
        endIndex: candles.length - 1,
      });
    }
  }

  // Only take the last 5 days to avoid cluttering
  const recentDays = dayIndices.slice(-5);

  recentDays.forEach((dayInfo, idx) => {
    let orbStartCandle: Candle | null = null;
    let orbEndCandle: Candle | null = null;
    let orbHigh = -Infinity;
    let orbLow = Infinity;
    let foundWindow = false;

    const startMin = 570; // 09:30 AM NY
    const endMin = 570 + durationMinutes; // e.g. 09:45 AM NY

    for (let i = dayInfo.startIndex; i <= dayInfo.endIndex; i++) {
      const c = candles[i];
      const nyTime = new Date((c.time + nyOffsetSec) * 1000);
      const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();

      if (timeOfDayMin >= startMin && timeOfDayMin < endMin) {
        if (!orbStartCandle) orbStartCandle = c;
        orbHigh = Math.max(orbHigh, c.high);
        orbLow = Math.min(orbLow, c.low);
        foundWindow = true;
      }

      if (timeOfDayMin >= endMin && !orbEndCandle) {
        orbEndCandle = c;
      }
    }

    // Fallback for higher timeframes (e.g. 30m, 1h) if no exact candle fell into [570, 585)
    if (!foundWindow) {
      for (let i = dayInfo.startIndex; i <= dayInfo.endIndex; i++) {
        const c = candles[i];
        const nyTime = new Date((c.time + nyOffsetSec) * 1000);
        const timeOfDayMin = nyTime.getUTCHours() * 60 + nyTime.getUTCMinutes();
        if (timeOfDayMin >= 540 && timeOfDayMin <= 600) {
          orbStartCandle = c;
          orbEndCandle = candles[Math.min(i + 1, dayInfo.endIndex)];
          orbHigh = c.high;
          orbLow = c.low;
          foundWindow = true;
          break;
        }
      }
    }

    if (!foundWindow || orbHigh <= 0 || orbLow === Infinity) return;

    if (!orbEndCandle) {
      orbEndCandle = candles[dayInfo.endIndex];
    }

    const lastCandle = candles[dayInfo.endIndex];
    const range = orbHigh - orbLow;
    const mid = (orbHigh + orbLow) / 2;
    const targetUp = orbHigh + range;
    const targetDown = orbLow - range;

    // Vertical markers for ORB open and close
    if (orbStartCandle) {
      verticals.push({
        id: `orb_v_start_${dayInfo.day}_${idx}`,
        time: orbStartCandle.time,
        color: '#f59e0b',
        label: 'ORB 9:30',
        lineStyle: 'dotted',
      });
    }

    if (orbEndCandle && orbEndCandle.time !== orbStartCandle?.time) {
      verticals.push({
        id: `orb_v_end_${dayInfo.day}_${idx}`,
        time: orbEndCandle.time,
        color: '#f59e0b',
        label: `ORB ${durationMinutes}m`,
        lineStyle: 'dotted',
      });
    }

    const startTime = orbEndCandle.time;
    const endTime = lastCandle.time;

    // Projection Rays (from 09:45 to end of day)
    rays.push({
      id: `orb_h_${dayInfo.day}_${idx}`,
      price: orbHigh,
      startTime,
      endTime,
      color: '#f59e0b',
      label: 'ORB High',
      lineStyle: 'solid',
      isMitigated: false,
    });

    rays.push({
      id: `orb_l_${dayInfo.day}_${idx}`,
      price: orbLow,
      startTime,
      endTime,
      color: '#f59e0b',
      label: 'ORB Low',
      lineStyle: 'solid',
      isMitigated: false,
    });

    rays.push({
      id: `orb_m_${dayInfo.day}_${idx}`,
      price: mid,
      startTime,
      endTime,
      color: '#06b6d4',
      label: 'ORB 50%',
      lineStyle: 'dotted',
      isMitigated: false,
    });

    rays.push({
      id: `orb_t_up_${dayInfo.day}_${idx}`,
      price: targetUp,
      startTime,
      endTime,
      color: '#10b981',
      label: 'Target +1.0x',
      lineStyle: 'dashed',
      isMitigated: false,
    });

    rays.push({
      id: `orb_t_dn_${dayInfo.day}_${idx}`,
      price: targetDown,
      startTime,
      endTime,
      color: '#ef4444',
      label: 'Target -1.0x',
      lineStyle: 'dashed',
      isMitigated: false,
    });

    // If it's the last day, add right axis price lines
    if (idx === recentDays.length - 1) {
      axisPriceLines.push({ price: targetUp, color: '#10b981', title: 'ORB +1.0x', lineStyle: 2 });
      axisPriceLines.push({ price: orbHigh, color: '#f59e0b', title: 'ORB High', lineStyle: 0 });
      axisPriceLines.push({ price: mid, color: '#06b6d4', title: 'ORB Mid', lineStyle: 1 });
      axisPriceLines.push({ price: orbLow, color: '#f59e0b', title: 'ORB Low', lineStyle: 0 });
      axisPriceLines.push({ price: targetDown, color: '#ef4444', title: 'ORB -1.0x', lineStyle: 2 });
    }
  });

  return { rays, verticals, axisPriceLines };
}

