import { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  CrosshairMode,
  ColorType,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import type { Candle, ChartType, DrawingTool, IndicatorConfig, ICTSettings, ChartTimezone } from '../types';
import {
  calculateBollingerBands,
  calculateEMA,
  calculateSMA,
  calculateICTStats,
  calculateICTVisualElements,
  calculateORB,
  calculateMACD,
  calculateStochastic,
} from '../services/indicators';
import type { PinePlot } from '../services/pineEngine';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ChartContainerProps {
  candles: Candle[];
  chartType: ChartType;
  indicators: IndicatorConfig;
  symbol: string;
  activeTool: DrawingTool;
  clearTrigger: number;
  customPlots?: PinePlot[];
  ictSettings?: ICTSettings;
  timezone?: ChartTimezone;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  candles,
  chartType,
  indicators,
  symbol,
  activeTool,
  clearTrigger,
  customPlots = [],
  ictSettings,
  timezone = 'America/Bogota',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Indicator series refs
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const pineSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // MACD series refs
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Stochastic series refs
  const stochKRef = useRef<ISeriesApi<'Line'> | null>(null);
  const stochDRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Stored price lines (drawings)
  const priceLinesRef = useRef<any[]>([]);

  // Legend State
  const [legend, setLegend] = useState<{
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
  }>({});

  const ictStats = useMemo(() => {
    if (!indicators.ictKillzones || !ictSettings?.showDataTable) return null;
    return calculateICTStats(candles, ictSettings, timezone);
  }, [candles, ictSettings, indicators.ictKillzones, timezone]);

  const ictVisualData = useMemo(() => {
    if (!indicators.ictKillzones) return null;
    return calculateICTVisualElements(candles, ictSettings, timezone);
  }, [candles, ictSettings, indicators.ictKillzones, timezone]);

  const orbVisualData = useMemo(() => {
    if (!indicators.orb) return null;
    return calculateORB(candles, 15, timezone);
  }, [candles, indicators.orb, timezone]);

  const [overlayItems, setOverlayItems] = useState<{
    lines: { id: string; x1: number; y1: number; x2: number; y2: number; color: string; strokeDasharray?: string }[];
    texts: { id: string; x: number; y: number; text: string; color: string }[];
    verticals: { id: string; x: number; y1: number; y2: number; color: string; label?: string; isDaySeparator?: boolean }[];
  }>({ lines: [], texts: [], verticals: [] });

  const [overlayTick, setOverlayTick] = useState(0);
  const triggerOverlayUpdate = () => {
    setOverlayTick((t) => (t + 1) % 1000000);
  };

  const overlayPriceLinesRef = useRef<any[]>([]);

  // Update right axis badges for ICT and ORB levels
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    overlayPriceLinesRef.current.forEach((pl) => {
      try {
        mainSeriesRef.current?.removePriceLine(pl);
      } catch {}
    });
    overlayPriceLinesRef.current = [];

    const allPriceLines = [
      ...(indicators.ictKillzones && ictVisualData ? ictVisualData.axisPriceLines : []),
      ...(indicators.orb && orbVisualData ? orbVisualData.axisPriceLines : []),
    ];

    allPriceLines.forEach((item) => {
      try {
        const pl = mainSeriesRef.current?.createPriceLine({
          price: item.price,
          color: item.color,
          lineWidth: 1,
          lineStyle: item.lineStyle,
          axisLabelVisible: true,
          title: item.title,
        });
        if (pl) overlayPriceLinesRef.current.push(pl);
      } catch {}
    });
  }, [ictVisualData, orbVisualData, indicators.ictKillzones, indicators.orb]);

  // Compute exact pixel coordinates for SVG rays, labels, and day separators
  useEffect(() => {
    const hasVisuals = (indicators.ictKillzones && ictVisualData) || (indicators.orb && orbVisualData);
    if (!chartRef.current || !mainSeriesRef.current || !hasVisuals) {
      setOverlayItems({ lines: [], texts: [], verticals: [] });
      return;
    }
    const timeScale = chartRef.current.timeScale();
    const mainSeries = mainSeriesRef.current;
    const container = chartContainerRef.current;
    if (!container) return;
    const height = container.clientHeight || 500;
    const width = container.clientWidth || 800;

    const lines: any[] = [];
    const texts: any[] = [];
    const verticals: any[] = [];

    const allRays = [
      ...(indicators.ictKillzones && ictVisualData ? ictVisualData.rays : []),
      ...(indicators.orb && orbVisualData ? orbVisualData.rays : []),
    ];

    const allVerticals = [
      ...(indicators.ictKillzones && ictVisualData ? ictVisualData.verticals : []),
      ...(indicators.orb && orbVisualData ? orbVisualData.verticals : []),
    ];

    allRays.forEach((ray) => {
      const x1 = timeScale.timeToCoordinate(ray.startTime as any);
      const x2 = timeScale.timeToCoordinate(ray.endTime as any);
      const y = mainSeries.priceToCoordinate(ray.price);

      if (y !== null && (x1 !== null || x2 !== null)) {
        const startX = x1 !== null ? x1 : 0;
        const endX = x2 !== null ? x2 : width;

        if (endX >= 0 && startX <= width) {
          const finalX1 = Math.max(0, startX);
          const finalX2 = Math.min(width, Math.max(endX, startX + 25));

          lines.push({
            id: ray.id,
            x1: finalX1,
            y1: y,
            x2: finalX2,
            y2: y,
            color: ray.color,
            strokeDasharray: ray.lineStyle === 'dashed' ? '5 4' : ray.lineStyle === 'dotted' ? '2 3' : undefined,
          });

          const textX = endX <= width - 75 ? endX + 6 : Math.max(8, startX + 6);
          texts.push({
            id: `${ray.id}_txt`,
            x: textX,
            y: y - 4,
            text: ray.label,
            color: ray.color,
          });
        }
      }
    });

    allVerticals.forEach((v) => {
      const x = timeScale.timeToCoordinate(v.time as any);
      if (x !== null && x >= 0 && x <= width) {
        verticals.push({
          id: v.id,
          x,
          y1: 0,
          y2: height,
          color: v.color,
          label: v.label,
          isDaySeparator: v.isDaySeparator,
        });
      }
    });

    setOverlayItems({ lines, texts, verticals });
  }, [overlayTick, ictVisualData, orbVisualData, indicators.ictKillzones, indicators.orb, candles]);

  // 1. Create and manage chart instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontSize: 12,
        fontFamily: "'Trebuchet MS', Roboto, Ubuntu, sans-serif",
      },
      grid: {
        vertLines: { color: '#1f2430' },
        horzLines: { color: '#1f2430' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      localization: {
        timeFormatter: (t: any) => {
          const sec = typeof t === 'number' ? t : typeof t === 'string' ? new Date(t).getTime() / 1000 : (t?.timestamp || 0);
          if (!sec) return '';
          return new Intl.DateTimeFormat('es-CO', {
            timeZone: timezone,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date(sec * 1000));
        },
        dateFormat: 'yyyy-MM-dd',
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (t: any, markType: any) => {
          const sec = typeof t === 'number' ? t : typeof t === 'string' ? new Date(t).getTime() / 1000 : (t?.timestamp || 0);
          if (!sec) return null;
          const date = new Date(sec * 1000);
          switch (markType) {
            case 0:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, year: 'numeric' }).format(date);
            case 1:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, month: 'short' }).format(date);
            case 2:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, day: 'numeric' }).format(date);
            case 3:
            case 4:
              return new Intl.DateTimeFormat('es-CO', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(date);
            default:
              return null;
          }
        },
      },
    });

    chartRef.current = chart;

    // Crosshair listener for Legend
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !mainSeriesRef.current) {
        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          const prev = candles.length > 1 ? candles[candles.length - 2] : last;
          setLegend({
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume,
            change: ((last.close - prev.close) / prev.close) * 100,
          });
        }
        return;
      }

      const priceData = param.seriesData.get(mainSeriesRef.current) as any;
      if (priceData) {
        setLegend({
          open: priceData.open ?? priceData.value,
          high: priceData.high ?? priceData.value,
          low: priceData.low ?? priceData.value,
          close: priceData.close ?? priceData.value,
          volume: priceData.volume,
          change:
            priceData.open && priceData.close
              ? ((priceData.close - priceData.open) / priceData.open) * 100
              : undefined,
        });
      }
    });

    // Time scale subscription for custom SVG overlay
    chart.timeScale().subscribeVisibleTimeRangeChange(triggerOverlayUpdate);
    chart.timeScale().subscribeVisibleLogicalRangeChange(triggerOverlayUpdate);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) {
        chartRef.current.applyOptions({ width: w, height: h });
        triggerOverlayUpdate();
      }
    });

    resizeObserver.observe(container);

    return () => {
      try {
        chart.timeScale().unsubscribeVisibleTimeRangeChange(triggerOverlayUpdate);
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(triggerOverlayUpdate);
      } catch {}
      resizeObserver.disconnect();
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
      ema50SeriesRef.current = null;
      ema200SeriesRef.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
    };
  }, []);

  // Update time formatters when timezone changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      localization: {
        timeFormatter: (t: any) => {
          const sec = typeof t === 'number' ? t : typeof t === 'string' ? new Date(t).getTime() / 1000 : (t?.timestamp || 0);
          if (!sec) return '';
          return new Intl.DateTimeFormat('es-CO', {
            timeZone: timezone,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date(sec * 1000));
        },
      },
      timeScale: {
        tickMarkFormatter: (t: any, markType: any) => {
          const sec = typeof t === 'number' ? t : typeof t === 'string' ? new Date(t).getTime() / 1000 : (t?.timestamp || 0);
          if (!sec) return null;
          const date = new Date(sec * 1000);
          switch (markType) {
            case 0:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, year: 'numeric' }).format(date);
            case 1:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, month: 'short' }).format(date);
            case 2:
              return new Intl.DateTimeFormat('es-CO', { timeZone: timezone, day: 'numeric' }).format(date);
            case 3:
            case 4:
              return new Intl.DateTimeFormat('es-CO', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(date);
            default:
              return null;
          }
        },
      },
    });
    triggerOverlayUpdate();
  }, [timezone]);

  // 2. Manage Main Series type changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch {}
      mainSeriesRef.current = null;
    }

    let series: ISeriesApi<any>;

    if (chartType === 'candlestick') {
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderVisible: false,
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
      });
    } else if (chartType === 'line') {
      series = chart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
      });
    } else if (chartType === 'area') {
      series = chart.addSeries(AreaSeries, {
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: '#2962ff',
        lineWidth: 2,
      });
    } else {
      series = chart.addSeries(BarSeries, {
        upColor: '#089981',
        downColor: '#f23645',
      });
    }

    mainSeriesRef.current = series;

    if (candles.length > 0) {
      if (chartType === 'line' || chartType === 'area') {
        series.setData(
          candles.map((c) => ({
            time: c.time as Time,
            value: c.close,
          }))
        );
      } else {
        series.setData(
          candles.map((c) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
      }
      chart.timeScale().fitContent();
    }
  }, [chartType]);

  // 3. Update candles data whenever it changes
  useEffect(() => {
    if (!mainSeriesRef.current || candles.length === 0) return;

    if (chartType === 'line' || chartType === 'area') {
      mainSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as Time,
          value: c.close,
        }))
      );
    } else {
      mainSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    }

    const last = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : last;
    setLegend({
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
      change: ((last.close - prev.close) / prev.close) * 100,
    });
  }, [candles]);

  // 4. Volume Series
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (!indicators.volume) {
      if (volumeSeriesRef.current) {
        try {
          chart.removeSeries(volumeSeriesRef.current);
        } catch {}
        volumeSeriesRef.current = null;
      }
      return;
    }

    if (!volumeSeriesRef.current) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volSeries;
    }

    if (candles.length > 0 && volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)',
        }))
      );
    }
  }, [indicators.volume, candles]);

  // 5. Technical Indicators: SMA 20, EMA 50, EMA 200, Bollinger
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    // SMA 20
    if (indicators.sma20) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#f5a623',
          lineWidth: 2,
          title: 'SMA 20',
        });
      }
      const data = calculateSMA(candles, 20);
      smaSeriesRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.value })));
    } else if (smaSeriesRef.current) {
      try {
        chart.removeSeries(smaSeriesRef.current);
      } catch {}
      smaSeriesRef.current = null;
    }

    // EMA 50
    if (indicators.ema50) {
      if (!ema50SeriesRef.current) {
        ema50SeriesRef.current = chart.addSeries(LineSeries, {
          color: '#00d4ff',
          lineWidth: 2,
          title: 'EMA 50',
        });
      }
      const data = calculateEMA(candles, 50);
      ema50SeriesRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.value })));
    } else if (ema50SeriesRef.current) {
      try {
        chart.removeSeries(ema50SeriesRef.current);
      } catch {}
      ema50SeriesRef.current = null;
    }

    // EMA 200
    if (indicators.ema200) {
      if (!ema200SeriesRef.current) {
        ema200SeriesRef.current = chart.addSeries(LineSeries, {
          color: '#9b51e0',
          lineWidth: 2,
          title: 'EMA 200',
        });
      }
      const data = calculateEMA(candles, 200);
      ema200SeriesRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.value })));
    } else if (ema200SeriesRef.current) {
      try {
        chart.removeSeries(ema200SeriesRef.current);
      } catch {}
      ema200SeriesRef.current = null;
    }

    // Bollinger Bands
    if (indicators.bollinger) {
      if (!bbUpperRef.current) {
        bbUpperRef.current = chart.addSeries(LineSeries, {
          color: 'rgba(41, 98, 255, 0.5)',
          lineWidth: 1,
          title: 'BB Upper',
        });
        bbMiddleRef.current = chart.addSeries(LineSeries, {
          color: 'rgba(255, 152, 0, 0.7)',
          lineWidth: 1,
          title: 'BB Basis',
        });
        bbLowerRef.current = chart.addSeries(LineSeries, {
          color: 'rgba(41, 98, 255, 0.5)',
          lineWidth: 1,
          title: 'BB Lower',
        });
      }
      const data = calculateBollingerBands(candles, 20, 2);
      bbUpperRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.upper })));
      bbMiddleRef.current?.setData(data.map((d) => ({ time: d.time as Time, value: d.middle })));
      bbLowerRef.current?.setData(data.map((d) => ({ time: d.time as Time, value: d.lower })));
    } else if (bbUpperRef.current) {
      try {
        if (bbUpperRef.current) chart.removeSeries(bbUpperRef.current);
        if (bbMiddleRef.current) chart.removeSeries(bbMiddleRef.current);
        if (bbLowerRef.current) chart.removeSeries(bbLowerRef.current);
      } catch {}
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
    }

    // MACD (12, 26, 9)
    if (indicators.macd) {
      if (!macdLineRef.current) {
        macdLineRef.current = chart.addSeries(LineSeries, {
          color: '#2962ff',
          lineWidth: 2,
          title: 'MACD (12, 26)',
          priceScaleId: 'macd_scale',
        });
        macdSignalRef.current = chart.addSeries(LineSeries, {
          color: '#ff6d00',
          lineWidth: 1,
          title: 'Signal (9)',
          priceScaleId: 'macd_scale',
        });
        macdHistRef.current = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          title: 'Histogram',
          priceScaleId: 'macd_scale',
        });
        chart.priceScale('macd_scale').applyOptions({
          scaleMargins: {
            top: 0.75,
            bottom: 0.02,
          },
        });
      }
      const data = calculateMACD(candles);
      if (data.length > 0) {
        macdLineRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.macd })));
        macdSignalRef.current?.setData(data.map((d) => ({ time: d.time as Time, value: d.signal })));
        macdHistRef.current?.setData(
          data.map((d) => ({
            time: d.time as Time,
            value: d.histogram,
            color: d.histogram >= 0 ? '#26a69a' : '#ef5350',
          }))
        );
      }
    } else if (macdLineRef.current) {
      try {
        if (macdLineRef.current) chart.removeSeries(macdLineRef.current);
        if (macdSignalRef.current) chart.removeSeries(macdSignalRef.current);
        if (macdHistRef.current) chart.removeSeries(macdHistRef.current);
      } catch {}
      macdLineRef.current = null;
      macdSignalRef.current = null;
      macdHistRef.current = null;
    }

    // Stochastic Oscillator (14, 3, 3)
    if (indicators.stochastic) {
      if (!stochKRef.current) {
        stochKRef.current = chart.addSeries(LineSeries, {
          color: '#2962ff',
          lineWidth: 2,
          title: '%K (14, 3)',
          priceScaleId: 'stoch_scale',
        });
        stochDRef.current = chart.addSeries(LineSeries, {
          color: '#ff6d00',
          lineWidth: 1,
          title: '%D (3)',
          priceScaleId: 'stoch_scale',
        });
        chart.priceScale('stoch_scale').applyOptions({
          scaleMargins: {
            top: 0.75,
            bottom: 0.02,
          },
        });
      }
      const data = calculateStochastic(candles);
      if (data.length > 0) {
        stochKRef.current.setData(data.map((d) => ({ time: d.time as Time, value: d.k })));
        stochDRef.current?.setData(data.map((d) => ({ time: d.time as Time, value: d.d })));
      }
    } else if (stochKRef.current) {
      try {
        if (stochKRef.current) chart.removeSeries(stochKRef.current);
        if (stochDRef.current) chart.removeSeries(stochDRef.current);
      } catch {}
      stochKRef.current = null;
      stochDRef.current = null;
    }
  }, [indicators, candles]);

  // 5.1 Custom Pine Script Plots
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Clear existing Pine series
    pineSeriesRef.current.forEach((series) => {
      try {
        chart.removeSeries(series);
      } catch {}
    });
    pineSeriesRef.current.clear();

    // Add new Pine series
    if (customPlots && customPlots.length > 0) {
      customPlots.forEach((plot) => {
        try {
          const s = chart.addSeries(LineSeries, {
            color: plot.color,
            lineWidth: (plot.lineWidth || 2) as any,
            lineStyle: (plot.lineStyle !== undefined ? plot.lineStyle : 0) as any,
            title: plot.title,
          });
          s.setData(plot.data.map((d) => ({ time: d.time as Time, value: d.value })));
          pineSeriesRef.current.set(plot.id, s);
        } catch {}
      });
    }
  }, [customPlots]);

  // 6. Handle Drawing Tools
  const handleChartClick = (e: React.MouseEvent) => {
    if (activeTool === 'horizontal' && mainSeriesRef.current && chartRef.current && chartContainerRef.current) {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = mainSeriesRef.current.coordinateToPrice(y);
      if (price !== null) {
        const line = mainSeriesRef.current.createPriceLine({
          price,
          color: '#2962ff',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `Nivel: ${price.toFixed(2)}`,
        });
        priceLinesRef.current.push(line);
      }
    }
  };

  // 7. Clear Drawings
  useEffect(() => {
    if (clearTrigger > 0 && mainSeriesRef.current) {
      priceLinesRef.current.forEach((line: any) => {
        try {
          mainSeriesRef.current?.removePriceLine(line);
        } catch {}
      });
      priceLinesRef.current = [];
    }
  }, [clearTrigger]);

  // 8. Navigation Controls (Zoom Out, Zoom In, Scroll Left, Scroll Right, Reset View)
  const handleZoomIn = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const delta = span * 0.15;
      if (span - 2 * delta > 3) {
        timeScale.setVisibleLogicalRange({
          from: range.from + delta,
          to: range.to - delta,
        });
      }
    }
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const delta = Math.max(span * 0.15, 2);
      timeScale.setVisibleLogicalRange({
        from: range.from - delta,
        to: range.to + delta,
      });
    }
  };

  const handleScrollLeft = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const shift = Math.max(span * 0.25, 4);
      timeScale.setVisibleLogicalRange({
        from: range.from - shift,
        to: range.to - shift,
      });
    }
  };

  const handleScrollRight = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const shift = Math.max(span * 0.25, 4);
      timeScale.setVisibleLogicalRange({
        from: range.from + shift,
        to: range.to + shift,
      });
    }
  };

  const handleResetView = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().resetTimeScale();
    try {
      chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    } catch {}
  };

  return (
    <div className="chart-wrapper" onClick={handleChartClick}>
      {/* Legend Top Left */}
      <div className="tv-legend">
        <span className="legend-symbol">{symbol}</span>
        <span className="legend-indicator">
          {chartType.toUpperCase()}
          {indicators.volume ? ' · VOL' : ''}
          {indicators.sma20 ? ' · SMA20' : ''}
          {indicators.ema50 ? ' · EMA50' : ''}
        </span>
        {legend.open !== undefined && (
          <div className="legend-ohlc">
            <span>O <strong className="val">{legend.open?.toFixed(2)}</strong></span>
            <span>H <strong className="val">{legend.high?.toFixed(2)}</strong></span>
            <span>L <strong className="val">{legend.low?.toFixed(2)}</strong></span>
            <span>C <strong className="val">{legend.close?.toFixed(2)}</strong></span>
            {legend.change !== undefined && (
              <span className={`change ${legend.change >= 0 ? 'bull' : 'bear'}`}>
                {legend.change >= 0 ? '+' : ''}{legend.change.toFixed(2)}%
              </span>
            )}
            {legend.volume !== undefined && (
              <span>Vol <strong className="val">{legend.volume?.toFixed(2)}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Main Lightweight Charts Canvas */}
      <div ref={chartContainerRef} className="chart-canvas" />

      {/* SVG Overlay for ICT Killzones Rays & ORB Levels */}
      {(indicators.ictKillzones || indicators.orb) && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3,
            overflow: 'hidden',
          }}
        >
          {/* Vertical Session & Day Separator Lines */}
          {overlayItems.verticals.map((v) => (
            <g key={v.id}>
              <line
                x1={v.x}
                y1={0}
                x2={v.x}
                y2={v.y2}
                stroke={v.color}
                strokeWidth={v.isDaySeparator ? 1.5 : 1}
                strokeDasharray={v.isDaySeparator ? '4 4' : '2 3'}
              />
              {v.label && (
                <text
                  x={v.x + 8}
                  y={v.y2 - 24}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  letterSpacing="0.8px"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, sans-serif"
                >
                  {v.label}
                </text>
              )}
            </g>
          ))}

          {/* Horizontal Killzone & Open Rays */}
          {overlayItems.lines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={1.5}
              strokeDasharray={line.strokeDasharray}
            />
          ))}

          {/* Text Labels along each ray */}
          {overlayItems.texts.map((t) => (
            <text
              key={t.id}
              x={t.x}
              y={t.y}
              fill={t.color}
              fontSize="11"
              fontWeight="700"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, sans-serif"
            >
              {t.text}
            </text>
          ))}
        </svg>
      )}

      {/* ICT Range Data & Pivots HUD Table */}
      {indicators.ictKillzones && ictSettings?.showDataTable && ictStats && ictStats.sessions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: '65px',
            background: 'rgba(19, 23, 34, 0.90)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #2a2e39',
            borderRadius: '6px',
            padding: '6px 10px',
            zIndex: 10,
            fontSize: '11px',
            color: '#d1d4dc',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            userSelect: 'none',
          }}
        >
          <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ICT Killzones Range Data
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #2a2e39', textAlign: 'left', fontSize: '10px' }}>
                <th style={{ padding: '2px 6px' }}>Sesión</th>
                <th style={{ padding: '2px 6px', textAlign: 'right' }}>Rango</th>
                <th style={{ padding: '2px 6px', textAlign: 'right' }}>Prom.</th>
                <th style={{ padding: '2px 6px', textAlign: 'right' }}>High %</th>
                <th style={{ padding: '2px 6px', textAlign: 'right' }}>Low %</th>
              </tr>
            </thead>
            <tbody>
              {ictStats.sessions.map((s) => (
                <tr key={s.name} style={{ borderBottom: '1px solid rgba(42, 46, 57, 0.5)' }}>
                  <td style={{ padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: s.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                  </td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: s.isHitHigh ? '#089981' : '#cbd5e1' }}>
                    {s.currentRange.toFixed(1)}
                  </td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: '#94a3b8' }}>
                    {s.avgRange.toFixed(1)}
                  </td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: '#38bdf8' }}>
                    {s.highHitRate.toFixed(0)}%
                  </td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: '#f43f5e' }}>
                    {s.lowHitRate.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating TradingView Navigation Controls */}
      <div className="tv-chart-nav-controls" onClick={(e) => e.stopPropagation()}>
        <div className="nav-btn-group">
          <button
            type="button"
            className="tv-nav-btn"
            title="Alejar (Zoom Out)"
            onClick={handleZoomOut}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="tv-nav-btn"
            title="Acercar (Zoom In)"
            onClick={handleZoomIn}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="nav-btn-group">
          <button
            type="button"
            className="tv-nav-btn"
            title="Desplazar a la izquierda"
            onClick={handleScrollLeft}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="tv-nav-btn"
            title="Desplazar a la derecha"
            onClick={handleScrollRight}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="nav-btn-group">
          <button
            type="button"
            className="tv-nav-btn"
            title="Restablecer gráfico"
            onClick={handleResetView}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
