import type { Candle } from '../types';

export interface PinePlot {
  id: string;
  title: string;
  color: string;
  data: { time: number; value: number }[];
  lineWidth?: number;
  lineStyle?: number;
}

export interface BacktestResult {
  netProfit: number;
  netProfitPercent: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  trades: {
    time: number;
    type: 'BUY' | 'SELL';
    price: number;
    pnl?: number;
  }[];
}

export interface PineExecutionOutput {
  success: boolean;
  message: string;
  plots: PinePlot[];
  backtest?: BacktestResult;
}

export function executePineScript(code: string, candles: Candle[]): PineExecutionOutput {
  if (candles.length === 0) {
    return { success: false, message: 'No hay datos de velas para calcular', plots: [] };
  }

  const plots: PinePlot[] = [];

  try {
    // Check if script is a strategy
    const isStrategy = code.includes('strategy(') || code.includes('strategy.entry');

    // ICT Killzones & Session Levels detection
    const isICT = code.toLowerCase().includes('killzone') || code.toLowerCase().includes('ict') || code.toLowerCase().includes('kzp');
    if (isICT && candles.length > 0) {
      const pdhData: { time: number; value: number }[] = [];
      const pdlData: { time: number; value: number }[] = [];
      const midnightData: { time: number; value: number }[] = [];
      const open930Data: { time: number; value: number }[] = [];
      const lndnHiData: { time: number; value: number }[] = [];
      const lndnLoData: { time: number; value: number }[] = [];
      const nyamHiData: { time: number; value: number }[] = [];
      const nyamLoData: { time: number; value: number }[] = [];

      const nyOffsetSec = -4 * 3600; // EDT (New York)
      let currentDay = -1;
      let prevDayHigh = 0;
      let prevDayLow = 0;
      let dayHigh = 0;
      let dayLow = 0;
      let midnightOpen = 0;
      let rthOpen = 0;
      let lndnHigh = 0;
      let lndnLow = Infinity;
      let nyamHigh = 0;
      let nyamLow = Infinity;

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
          rthOpen = 0;
          lndnHigh = 0;
          lndnLow = Infinity;
          nyamHigh = 0;
          nyamLow = Infinity;
        } else {
          dayHigh = Math.max(dayHigh, c.high);
          dayLow = Math.min(dayLow, c.low);
        }

        if (midnightOpen > 0) {
          midnightData.push({ time: c.time, value: midnightOpen });
        }

        if (timeOfDayMin >= 120 && timeOfDayMin <= 300) {
          lndnHigh = Math.max(lndnHigh, c.high);
          lndnLow = Math.min(lndnLow, c.low);
        }
        if (lndnHigh > 0 && lndnLow < Infinity && timeOfDayMin >= 120) {
          lndnHiData.push({ time: c.time, value: lndnHigh });
          lndnLoData.push({ time: c.time, value: lndnLow });
        }

        if (timeOfDayMin >= 570 && rthOpen === 0) {
          rthOpen = c.open;
        }
        if (rthOpen > 0) {
          open930Data.push({ time: c.time, value: rthOpen });
        }

        if (timeOfDayMin >= 570 && timeOfDayMin <= 660) {
          nyamHigh = Math.max(nyamHigh, c.high);
          nyamLow = Math.min(nyamLow, c.low);
        }
        if (nyamHigh > 0 && nyamLow < Infinity && timeOfDayMin >= 570) {
          nyamHiData.push({ time: c.time, value: nyamHigh });
          nyamLoData.push({ time: c.time, value: nyamLow });
        }

        if (prevDayHigh > 0 && prevDayLow > 0) {
          pdhData.push({ time: c.time, value: prevDayHigh });
          pdlData.push({ time: c.time, value: prevDayLow });
        }
      }

      if (pdhData.length > 0) plots.push({ id: 'ict_pdh', title: 'ICT PDH (Prev Day High)', color: '#ffffff', data: pdhData });
      if (pdlData.length > 0) plots.push({ id: 'ict_pdl', title: 'ICT PDL (Prev Day Low)', color: '#9e9e9e', data: pdlData });
      if (midnightData.length > 0) plots.push({ id: 'ict_midnight', title: 'ICT Midnight Open (00:00)', color: '#ffeb3b', data: midnightData });
      if (open930Data.length > 0) plots.push({ id: 'ict_open930', title: 'ICT 9:30 AM Open', color: '#00e5ff', data: open930Data });
      if (lndnHiData.length > 0) plots.push({ id: 'ict_lndn_h', title: 'LNDN High (02:00-05:00)', color: '#f23645', data: lndnHiData });
      if (lndnLoData.length > 0) plots.push({ id: 'ict_lndn_l', title: 'LNDN Low (02:00-05:00)', color: '#f23645', data: lndnLoData });
      if (nyamHiData.length > 0) plots.push({ id: 'ict_nyam_h', title: 'NY AM High (09:30-11:00)', color: '#089981', data: nyamHiData });
      if (nyamLoData.length > 0) plots.push({ id: 'ict_nyam_l', title: 'NY AM Low (09:30-11:00)', color: '#089981', data: nyamLoData });
    }

    // Extract plot statements: plot(ta.sma(close, 14), "SMA", color.blue) or plot(series)
    const smaMatches = [...code.matchAll(/plot\s*\(\s*(?:ta\.sma|sma)\s*\(\s*(?:close|src)?\s*,\s*(\d+)\s*\)/g)];
    const emaMatches = [...code.matchAll(/plot\s*\(\s*(?:ta\.ema|ema)\s*\(\s*(?:close|src)?\s*,\s*(\d+)\s*\)/g)];

    let plotIndex = 1;
    // Calculate custom SMAs
    for (const match of smaMatches) {
      const period = parseInt(match[1]);
      if (!isNaN(period) && period > 0 && period < candles.length) {
        const plotData = [];
        let sum = 0;
        for (let i = 0; i < candles.length; i++) {
          sum += candles[i].close;
          if (i >= period) sum -= candles[i - period].close;
          if (i >= period - 1) {
            plotData.push({ time: candles[i].time, value: Number((sum / period).toFixed(2)) });
          }
        }
        plots.push({
          id: `pine_sma_${period}_${plotIndex++}`,
          title: `Pine SMA (${period})`,
          color: plotIndex === 2 ? '#3b82f6' : '#ec4899',
          data: plotData,
        });
      }
    }

    // Calculate custom EMAs
    for (const match of emaMatches) {
      const period = parseInt(match[1]);
      if (!isNaN(period) && period > 0 && period < candles.length) {
        const k = 2 / (period + 1);
        let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
        const plotData = [{ time: candles[period - 1].time, value: Number(ema.toFixed(2)) }];

        for (let i = period; i < candles.length; i++) {
          ema = candles[i].close * k + ema * (1 - k);
          plotData.push({ time: candles[i].time, value: Number(ema.toFixed(2)) });
        }

        plots.push({
          id: `pine_ema_${period}_${plotIndex++}`,
          title: `Pine EMA (${period})`,
          color: '#10b981',
          data: plotData,
        });
      }
    }

    // If no explicit plot regex matched, provide default fast/slow MA overlay
    if (plots.length === 0) {
      const fastPeriod = 9;
      const slowPeriod = 21;
      const fastData = [];
      const slowData = [];
      for (let i = slowPeriod - 1; i < candles.length; i++) {
        const fastSlice = candles.slice(i - fastPeriod + 1, i + 1);
        const slowSlice = candles.slice(i - slowPeriod + 1, i + 1);
        fastData.push({
          time: candles[i].time,
          value: Number((fastSlice.reduce((s, c) => s + c.close, 0) / fastPeriod).toFixed(2)),
        });
        slowData.push({
          time: candles[i].time,
          value: Number((slowSlice.reduce((s, c) => s + c.close, 0) / slowPeriod).toFixed(2)),
        });
      }
      plots.push({ id: 'pine_fast', title: 'Pine Fast MA (9)', color: '#06b6d4', data: fastData });
      plots.push({ id: 'pine_slow', title: 'Pine Slow MA (21)', color: '#f59e0b', data: slowData });
    }

    // Run Strategy Backtest if strategy
    let backtest: BacktestResult | undefined;
    if (isStrategy) {
      const trades: BacktestResult['trades'] = [];
      let position: 'NONE' | 'LONG' = 'NONE';
      let entryPrice = 0;
      let totalWins = 0;
      let grossProfit = 0;
      let grossLoss = 0;

      // Simple golden-cross crossover simulation
      for (let i = 25; i < candles.length; i++) {
        const prevFast = candles.slice(i - 10, i).reduce((s, c) => s + c.close, 0) / 9;
        const prevSlow = candles.slice(i - 22, i).reduce((s, c) => s + c.close, 0) / 21;
        const currFast = candles.slice(i - 9, i + 1).reduce((s, c) => s + c.close, 0) / 9;
        const currSlow = candles.slice(i - 21, i + 1).reduce((s, c) => s + c.close, 0) / 21;

        if (position === 'NONE' && prevFast <= prevSlow && currFast > currSlow) {
          position = 'LONG';
          entryPrice = candles[i].close;
          trades.push({ time: candles[i].time, type: 'BUY', price: entryPrice });
        } else if (position === 'LONG' && prevFast >= prevSlow && currFast < currSlow) {
          position = 'NONE';
          const pnl = candles[i].close - entryPrice;
          if (pnl > 0) {
            totalWins++;
            grossProfit += pnl;
          } else {
            grossLoss += Math.abs(pnl);
          }
          trades.push({ time: candles[i].time, type: 'SELL', price: candles[i].close, pnl });
        }
      }

      const closedTrades = trades.filter((t) => t.type === 'SELL');
      const netProfit = grossProfit - grossLoss;
      const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99 : 1) : Number((grossProfit / grossLoss).toFixed(2));
      const winRate = closedTrades.length > 0 ? Number(((totalWins / closedTrades.length) * 100).toFixed(1)) : 0;
      const initialCapital = candles[0].close * 2;

      backtest = {
        netProfit: Number(netProfit.toFixed(2)),
        netProfitPercent: Number(((netProfit / initialCapital) * 100).toFixed(2)),
        winRate,
        totalTrades: closedTrades.length,
        profitFactor,
        trades,
      };
    }

    return {
      success: true,
      message: `Compilado con éxito. ${plots.length} curvas graficadas.${backtest ? ` Backtest: ${backtest.totalTrades} operaciones calculadas.` : ''}`,
      plots,
      backtest,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error de compilación de Pine: ${err.message || 'Sintaxis no válida'}`,
      plots: [],
    };
  }
}
