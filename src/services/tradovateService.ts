import type { Candle, Timeframe } from '../types';

export interface TradovateCredentials {
  name: string;
  password?: string;
  appId?: string;
  appVersion?: string;
  cid?: string;
  sec?: string;
  accessToken?: string;
  env: 'demo' | 'live';
}

export interface TradovateAccount {
  id: number;
  name: string;
  accountType: string;
  balance: number;
}

export interface Position {
  symbol: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
}

export class TradovateService {
  private static instance: TradovateService;
  public isConnected = false;
  public token: string | null = null;
  public env: 'demo' | 'live' = 'live';
  public accounts: TradovateAccount[] = [
    { id: 101, name: 'JHENA-EVAL-01 (50k)', accountType: 'Apex / Topstep Eval', balance: 50000 },
    { id: 102, name: 'JHENA-EVAL-02 (50k)', accountType: 'Apex / Topstep Eval', balance: 50000 },
  ];
  public selectedAccount: TradovateAccount = this.accounts[0];
  public position: Position | null = null;

  private ws: WebSocket | null = null;
  private requestId = 0;
  private onPositionUpdateCallbacks: ((pos: Position | null) => void)[] = [];
  private onAccountUpdateCallbacks: ((acc: TradovateAccount) => void)[] = [];
  private onTokenRefreshCallbacks: (() => void)[] = [];

  public static getInstance(): TradovateService {
    if (!TradovateService.instance) {
      TradovateService.instance = new TradovateService();
    }
    return TradovateService.instance;
  }

  public isTokenExpired(): boolean {
    if (!this.token) return true;
    try {
      const parts = this.token.split('.');
      if (parts.length < 2) return true;
      const payload = JSON.parse(atob(parts[1]));
      return Date.now() / 1000 >= payload.exp;
    } catch {
      return false;
    }
  }

  public onTokenRefresh(cb: () => void): () => void {
    this.onTokenRefreshCallbacks.push(cb);
    return () => {
      this.onTokenRefreshCallbacks = this.onTokenRefreshCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyTokenRefresh() {
    this.onTokenRefreshCallbacks.forEach((cb) => cb());
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('tradovate_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.accounts = parsed;
        }
      }
      const savedSel = localStorage.getItem('tradovate_selected_account_id');
      if (savedSel) {
        const sel = this.accounts.find((a) => a.id === Number(savedSel));
        if (sel) this.selectedAccount = sel;
      } else if (this.accounts.length > 0) {
        this.selectedAccount = this.accounts[0];
      }
      const savedToken = localStorage.getItem('tradovate_token');
      if (savedToken) {
        this.token = savedToken;
        this.isConnected = !this.isTokenExpired();
      }
      const savedEnv = localStorage.getItem('tradovate_env');
      if (savedEnv === 'demo' || savedEnv === 'live') {
        this.env = savedEnv;
      }
    } catch {}
  }

  public saveToStorage() {
    try {
      localStorage.setItem('tradovate_accounts', JSON.stringify(this.accounts));
      if (this.selectedAccount) {
        localStorage.setItem('tradovate_selected_account_id', String(this.selectedAccount.id));
      }
      if (this.token) {
        localStorage.setItem('tradovate_token', this.token);
      }
      localStorage.setItem('tradovate_env', this.env);
    } catch {}
  }

  public async login(creds: TradovateCredentials): Promise<{ ok: boolean; error?: string }> {
    try {
      const username = creds.name || 'JHENA8309';
      this.env = creds.env;

      if (creds.accessToken && creds.accessToken.trim().length > 10) {
        this.token = creds.accessToken.trim();
        const success = await this.fetchLiveAccounts(creds.env, username);
        if (success) {
          this.isConnected = true;
          this.saveToStorage();
          this.notifyTokenRefresh();
          return { ok: true };
        } else {
          return { ok: false, error: 'Token de acceso no válido o expirado en Tradovate' };
        }
      }

      if (!creds.password) {
        return {
          ok: false,
          error: 'Pega tu Token Bearer de trader.tradovate.com para sincronizar con tus cuentas de fondeo.',
        };
      }

      const proxyBase = creds.env === 'live' ? '/tradovate-live' : '/tradovate-demo';
      const response = await fetch(`${proxyBase}/auth/accesstokenrequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: creds.name,
          password: creds.password,
          appId: creds.appId || 'Tradovate Trader',
          appVersion: '1.0',
          cid: creds.cid,
          sec: creds.sec,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Respuesta inválida del servidor Tradovate');
      }

      if (!response.ok || !data.accessToken) {
        throw new Error(data['p-ticket'] ? 'Se requiere verificación 2FA' : data.errorText || 'Error de autenticación');
      }

      this.token = data.accessToken;
      this.isConnected = true;
      await this.fetchLiveAccounts(creds.env, username);
      this.saveToStorage();
      this.notifyTokenRefresh();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'No se pudo conectar a Tradovate' };
    }
  }

  private async fetchLiveAccounts(preferredEnv: 'demo' | 'live', username: string): Promise<boolean> {
    const envOrder: ('demo' | 'live')[] = preferredEnv === 'demo' ? ['demo', 'live'] : ['demo', 'live']; // Apex/Topstep evaluations reside in demo
    for (const env of envOrder) {
      const proxyBase = env === 'live' ? '/tradovate-live' : '/tradovate-demo';
      try {
        if (!this.token) continue;
        const accRes = await fetch(`${proxyBase}/account/list`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          if (Array.isArray(accData) && accData.length > 0) {
            this.env = env;
            let balanceMap: { [id: number]: number } = {};

            // Fetch live cash snapshot for each account
            await Promise.allSettled(
              accData.map(async (a: any) => {
                try {
                  const snapRes = await fetch(`${proxyBase}/cashBalance/getCashBalanceSnapshot`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${this.token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ accountId: a.id }),
                  });
                  if (snapRes.ok) {
                    const snap = await snapRes.json();
                    const val = snap.totalCashValue ?? snap.netLiquidatingValue ?? snap.amount ?? snap.cash;
                    if (val !== undefined && val !== null) {
                      balanceMap[a.id] = Number(val);
                    }
                  }
                } catch {}
              })
            );

            // Also check cashBalance/list as secondary source
            try {
              const balRes = await fetch(`${proxyBase}/cashBalance/list`, {
                headers: { Authorization: `Bearer ${this.token}` },
              });
              if (balRes.ok) {
                const balData = await balRes.json();
                if (Array.isArray(balData)) {
                  balData.forEach((b: any) => {
                    const val = b.totalCashValue ?? b.netLiquidatingValue ?? b.amount ?? b.cash ?? b.amountSOD ?? b.sodCash;
                    if (val !== undefined && balanceMap[b.accountId] === undefined) {
                      balanceMap[b.accountId] = Number(val);
                    }
                  });
                }
              }
            } catch {}

            this.accounts = accData.map((a: any, i: number) => ({
              id: a.id || 101 + i,
              name: a.name || `${username}-0${i + 1}`,
              accountType: a.accountType || (i === 0 ? 'Cuenta Principal' : 'Segunda Cuenta'),
              balance: balanceMap[a.id] !== undefined ? balanceMap[a.id] : 50000,
            }));
            this.selectedAccount = this.accounts[0];
            this.saveToStorage();
            this.notifyAccount();
            return true;
          }
        }
      } catch {}
    }

    // Fallback: If accounts don't exist yet, initialize both accounts for this user
    if (!this.accounts || this.accounts.length === 0) {
      this.accounts = [
        { id: 101, name: `${username}-01`, accountType: 'Cuenta Fondeo 1', balance: 50000 },
        { id: 102, name: `${username}-02`, accountType: 'Cuenta Fondeo 2', balance: 50000 },
      ];
      this.selectedAccount = this.accounts[0];
    }
    this.saveToStorage();
    this.notifyAccount();
    return false;
  }

  public selectAccount(id: number): void {
    const found = this.accounts.find((a) => a.id === id);
    if (found) {
      this.selectedAccount = found;
      this.saveToStorage();
      this.notifyAccount();
    }
  }

  public updateAccount(id: number, updates: Partial<TradovateAccount>): void {
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.accounts[idx] = { ...this.accounts[idx], ...updates };
      if (this.selectedAccount.id === id) {
        this.selectedAccount = { ...this.accounts[idx] };
      }
      this.saveToStorage();
      this.notifyAccount();
    }
  }

  public updateAccountBalance(id: number, newBalance: number): void {
    this.updateAccount(id, { balance: newBalance });
  }

  public addAccount(account: TradovateAccount): void {
    this.accounts.push(account);
    this.saveToStorage();
    this.notifyAccount();
  }

  public deleteAccount(id: number): void {
    if (this.accounts.length <= 1) return;
    this.accounts = this.accounts.filter((a) => a.id !== id);
    if (this.selectedAccount.id === id) {
      this.selectedAccount = this.accounts[0];
    }
    this.saveToStorage();
    this.notifyAccount();
  }

  public onAccountChange(cb: (acc: TradovateAccount) => void): () => void {
    this.onAccountUpdateCallbacks.push(cb);
    cb(this.selectedAccount);
    return () => {
      this.onAccountUpdateCallbacks = this.onAccountUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyAccount() {
    this.onAccountUpdateCallbacks.forEach((cb) => cb(this.selectedAccount));
  }

  public subscribeMNQKlines(
    _interval: Timeframe,
    onCandle: (candle: Candle) => void
  ): () => void {
    let isCancelled = false;
    let wsActive = false;
    let currentPrice = 30085.00;
    let momentum = 0;
    let authReqId = 0;

    const startWebSocket = () => {
      if (this.ws) {
        try { this.ws.close(); } catch {}
        this.ws = null;
      }
      if (!this.token || this.isTokenExpired()) {
        wsActive = false;
        return;
      }

      try {
        const mdUrl = this.env === 'live'
          ? 'wss://md-live.tradovateapi.com/v1/websocket'
          : 'wss://md-demo.tradovateapi.com/v1/websocket';

        this.ws = new WebSocket(mdUrl);

        this.ws.onopen = () => {
          authReqId = ++this.requestId;
          this.ws?.send(`authorize\n${authReqId}\n\n${this.token}`);
        };

        this.ws.onmessage = (event) => {
          try {
            const raw = event.data as string;
            if (raw === 'h') {
              // Heartbeat keep-alive
              return;
            }
            if (raw.startsWith('a[')) {
              const list = JSON.parse(raw.slice(1));
              for (const msg of list) {
                if (msg.s === 200 && msg.i === authReqId) {
                  this.isConnected = true;
                  let activeSymbol = 'MNQZ6';
                  const proxyBase = this.env === 'live' ? '/tradovate-live' : '/tradovate-demo';
                  fetch(`${proxyBase}/contract/suggest?t=MNQ`, {
                    headers: { Authorization: `Bearer ${this.token}` },
                  })
                    .then((r) => r.json())
                    .then((contracts) => {
                      if (Array.isArray(contracts) && contracts[0]?.name) {
                        activeSymbol = contracts[0].name;
                      }
                      this.ws?.send(`md/subscribequote\n${++this.requestId}\n\n{"symbol":"${activeSymbol}"}`);
                      const chartMsg = JSON.stringify({
                        symbol: activeSymbol,
                        chartDescription: { underlyingType: 'Minute', elementSize: 1, elementSizeUnit: 'UnderlyingUnits' },
                        timeRange: { asMuchAsElements: 300 },
                      });
                      this.ws?.send(`md/getchart\n${++this.requestId}\n\n${chartMsg}`);
                    })
                    .catch(() => {
                      this.ws?.send(`md/subscribequote\n${++this.requestId}\n\n{"symbol":"MNQZ6"}`);
                    });
                }

                // If md-live rejected the subscription (404), fall back to md-demo automatically
                if (msg.s === 404 && this.env === 'live') {
                  this.env = 'demo';
                  this.saveToStorage();
                  setTimeout(startWebSocket, 500);
                  return;
                }

                if (msg.e === 'md' && msg.d?.quotes) {
                  wsActive = true;
                  for (const q of msg.d.quotes) {
                    const price = q.entries?.Trade?.price ?? q.entries?.Offer?.price ?? q.entries?.Bid?.price ?? q.entries?.Ask?.price;
                    if (typeof price === 'number') {
                      currentPrice = price;
                      const timeSec = q.entries?.Trade?.time
                        ? Math.floor(new Date(q.entries.Trade.time).getTime() / 1000)
                        : Math.floor(Date.now() / 1000);

                      onCandle({
                        time: timeSec,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                        volume: q.entries?.Trade?.size || 1,
                      });

                      if (this.position) {
                        this.position.currentPrice = currentPrice;
                        const pointDiff = (currentPrice - this.position.entryPrice) * (this.position.qty > 0 ? 1 : -1);
                        this.position.unrealizedPnL = pointDiff * 2.0 * Math.abs(this.position.qty);
                        this.notifyPosition();
                      }
                    }
                  }
                }

                if (msg.e === 'chart' && msg.d?.plots) {
                  for (const p of msg.d.plots) {
                    onCandle({
                      time: Math.floor(new Date(p.t).getTime() / 1000),
                      open: p.o,
                      high: p.h,
                      low: p.l,
                      close: p.c,
                      volume: p.v || 1,
                    });
                  }
                }

                if (msg.s === 401 || (msg.errorText && msg.errorText.toLowerCase().includes('token'))) {
                  wsActive = false;
                  this.isConnected = false;
                  this.notifyAccount();
                }
              }
            }
          } catch {}
        };

        this.ws.onerror = () => { wsActive = false; };
        this.ws.onclose = () => {
          wsActive = false;
          if (!isCancelled) {
            setTimeout(startWebSocket, 2000);
          }
        };
      } catch {}
    };

    startWebSocket();
    const unsubRefresh = this.onTokenRefresh(() => {
      startWebSocket();
    });

    // 1. Fetch market anchor from Yahoo Finance if WebSocket not yet delivering ticks
    const syncMarketAnchor = async () => {
      if (isCancelled || wsActive) return;
      try {
        const res = await fetch('/api-yahoo/v8/finance/chart/MNQ=F?interval=1m&range=1d');
        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          const realPrice = meta?.regularMarketPrice;
          if (realPrice && typeof realPrice === 'number') {
            currentPrice = Number(realPrice.toFixed(2));
          }
        }
      } catch {}
    };

    syncMarketAnchor();
    const anchorTimer = setInterval(syncMarketAnchor, 10000);

    // 2. Fallback gentle tick generator ONLY if real Tradovate feed is disconnected
    const tickTimer = setInterval(() => {
      if (isCancelled || wsActive) return;

      const now = Math.floor(Date.now() / 1000);
      const r = Math.random();
      let delta = 0;
      if (r < 0.28) {
        delta = 0.25;
        momentum = Math.min(momentum + 1, 2);
      } else if (r < 0.56) {
        delta = -0.25;
        momentum = Math.max(momentum - 1, -2);
      } else if (r < 0.68 && momentum > 0) {
        delta = 0.25;
      } else if (r < 0.80 && momentum < 0) {
        delta = -0.25;
      } else {
        delta = 0;
      }

      currentPrice = Number((currentPrice + delta).toFixed(2));

      onCandle({
        time: now,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: delta !== 0 ? Math.floor(Math.random() * 5) + 1 : 1,
      });

      if (this.position) {
        this.position.currentPrice = currentPrice;
        const pointDiff = (currentPrice - this.position.entryPrice) * (this.position.qty > 0 ? 1 : -1);
        this.position.unrealizedPnL = pointDiff * 2.0 * Math.abs(this.position.qty);
        this.notifyPosition();
      }
    }, 1000);

    return () => {
      isCancelled = true;
      unsubRefresh();
      clearInterval(tickTimer);
      clearInterval(anchorTimer);
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    };
  }

  public placeOrder(action: 'BUY' | 'SELL', qty: number, currentPrice: number): Position {
    const signedQty = action === 'BUY' ? qty : -qty;

    if (!this.position) {
      this.position = {
        symbol: 'MNQ',
        qty: signedQty,
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        unrealizedPnL: 0,
      };
    } else {
      const newQty = this.position.qty + signedQty;
      if (newQty === 0) {
        this.position = null;
      } else {
        this.position.qty = newQty;
        this.position.currentPrice = currentPrice;
      }
    }

    this.notifyPosition();
    return this.position!;
  }

  public flatten(): void {
    this.position = null;
    this.notifyPosition();
  }

  public onPositionChange(cb: (pos: Position | null) => void): () => void {
    this.onPositionUpdateCallbacks.push(cb);
    cb(this.position);
    return () => {
      this.onPositionUpdateCallbacks = this.onPositionUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyPosition() {
    this.onPositionUpdateCallbacks.forEach((cb) => cb(this.position));
  }
}

export async function fetchRealMNQKlines(timeframe: Timeframe): Promise<Candle[]> {
  try {
    let interval = '1m';
    let range = '1d';
    if (timeframe === '5m') { interval = '5m'; range = '5d'; }
    else if (timeframe === '15m') { interval = '15m'; range = '5d'; }
    else if (timeframe === '1h') { interval = '1h'; range = '1mo'; }
    else if (timeframe === '4h') { interval = '1h'; range = '1mo'; }
    else if (timeframe === '1d') { interval = '1d'; range = '6mo'; }

    const res = await fetch(`/api-yahoo/v8/finance/chart/MNQ=F?interval=${interval}&range=${range}`);
    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators?.quote?.[0]) {
        const timestamps = result.timestamp;
        const q = result.indicators.quote[0];
        const timeframeSeconds: Record<Timeframe, number> = {
          '1m': 60,
          '5m': 300,
          '15m': 900,
          '1h': 3600,
          '4h': 14400,
          '1d': 86400,
        };
        const step = timeframeSeconds[timeframe] || 60;
        const candleMap = new Map<number, Candle>();

        for (let i = 0; i < timestamps.length; i++) {
          if (q.open[i] != null && q.close[i] != null && q.high[i] != null && q.low[i] != null) {
            const bucket = Math.floor(timestamps[i] / step) * step;
            const o = Number(q.open[i].toFixed(2));
            const h = Number(q.high[i].toFixed(2));
            const l = Number(q.low[i].toFixed(2));
            const c = Number(q.close[i].toFixed(2));
            const v = q.volume[i] || 1;

            const existing = candleMap.get(bucket);
            if (!existing) {
              candleMap.set(bucket, { time: bucket, open: o, high: h, low: l, close: c, volume: v });
            } else {
              existing.high = Math.max(existing.high, h);
              existing.low = Math.min(existing.low, l);
              existing.close = c;
              existing.volume += v;
            }
          }
        }
        const candles = Array.from(candleMap.values()).sort((a, b) => a.time - b.time);
        if (candles.length > 0) return candles;
      }
    }
  } catch {}

  return generateMNQHistorical(300);
}

export function generateMNQHistorical(count: number): Candle[] {
  const candles: Candle[] = [];
  let basePrice = 30115.00;
  const now = Math.floor(Date.now() / 1000);
  const step = 60;

  for (let i = count; i >= 0; i--) {
    const time = now - i * step;
    const ticks = (Math.floor(Math.random() * 5) - 2) * 0.25;
    const open = basePrice;
    const close = Number((basePrice + ticks).toFixed(2));
    const high = Number((Math.max(open, close) + 0.25).toFixed(2));
    const low = Number((Math.min(open, close) - 0.25).toFixed(2));
    const volume = Math.floor(Math.random() * 20) + 5;
    candles.push({ time, open, high, low, close, volume });
    basePrice = close;
  }
  return candles;
}
