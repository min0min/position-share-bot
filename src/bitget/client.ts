import crypto from 'node:crypto';
import { config } from '../config.js';

export type Position = {
  symbol: string;
  side: 'long' | 'short';
  total: number;
  available: number;
  averageOpenPrice: number;
  markPrice: number;
  leverage: number;
  marginSize: number;
  unrealizedPL: number;
  unrealizedRate: number;
  holdSideRaw?: string;
  openTime?: number;
};

export type Account = {
  equity: number;
  available: number;
};

export type HistoryItem = {
  symbol: string;
  side: string;
  pnl: number;
  netProfit: number;
  cTime: number;
};

export class BitgetClient {
  private baseUrl = 'https://api.bitget.com';

  private sign(timestamp: string, method: string, requestPath: string, body = ''): string {
    const prehash = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', config.bitgetSecret).update(prehash).digest('base64');
  }

  private async request(path: string, method = 'GET', bodyObj?: unknown): Promise<any> {
    const body = bodyObj ? JSON.stringify(bodyObj) : '';
    const timestamp = Date.now().toString();
    const headers: Record<string, string> = {
      'ACCESS-KEY': config.bitgetKey,
      'ACCESS-SIGN': this.sign(timestamp, method, path, body),
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': config.bitgetPassphrase,
      'Content-Type': 'application/json',
      'locale': 'en-US'
    };
    const res = await fetch(this.baseUrl + path, { method, headers, body: body || undefined });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.code !== '00000') {
      throw new Error(`Bitget API failed ${res.status}: ${JSON.stringify(json)}`);
    }
    return json.data;
  }

  async getAccount(): Promise<Account> {
    const path = `/api/v2/mix/account/accounts?productType=${encodeURIComponent(config.productType)}`;
    const data = await this.request(path);
    const arr = Array.isArray(data) ? data : [];
    const target = arr.find((a: any) => String(a.marginCoin ?? '').toUpperCase() === config.marginCoin.toUpperCase()) ?? arr[0] ?? {};
    return {
      equity: Number(target.accountEquity ?? target.equity ?? target.usdtEquity ?? target.crossedRiskRate ?? 0),
      available: Number(target.available ?? target.availableBalance ?? 0)
    };
  }

  async getPositions(): Promise<Position[]> {
    const path = `/api/v2/mix/position/all-position?productType=${encodeURIComponent(config.productType)}&marginCoin=${encodeURIComponent(config.marginCoin)}`;
    const data = await this.request(path);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((p: any) => {
      const holdSide = String(p.holdSide ?? p.posSide ?? p.side ?? '').toLowerCase();
      const side: 'long' | 'short' = holdSide.includes('short') || holdSide === 'sell' ? 'short' : 'long';
      const total = Math.abs(Number(p.total ?? p.openDelegateSize ?? p.pos ?? p.size ?? 0));
      return {
        symbol: String(p.symbol ?? '').toUpperCase(),
        side,
        total,
        available: Math.abs(Number(p.available ?? p.availableSize ?? total)),
        averageOpenPrice: Number(p.averageOpenPrice ?? p.openPriceAvg ?? p.avgPrice ?? 0),
        markPrice: Number(p.markPrice ?? p.currentPrice ?? 0),
        leverage: Number(p.leverage ?? 0),
        marginSize: Number(p.marginSize ?? p.margin ?? p.positionMargin ?? 0),
        unrealizedPL: Number(p.unrealizedPL ?? p.unrealizedPnl ?? p.upl ?? 0),
        unrealizedRate: Number(p.unrealizedPLR ?? p.unrealizedRate ?? p.roe ?? 0),
        holdSideRaw: holdSide,
        openTime: Number(p.cTime ?? p.ctime ?? p.openTime ?? p.uTime ?? p.utime ?? 0) || undefined
      };
    }).filter(p => p.symbol && p.total > 0);
  }

  async getHistoryPositions(startMs: number, endMs: number): Promise<HistoryItem[]> {
    const path = `/api/v2/mix/position/history-position?productType=${encodeURIComponent(config.productType)}&startTime=${startMs}&endTime=${endMs}&pageSize=100`;
    const data = await this.request(path);
    const list = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : [];
    return list.map((x: any) => ({
      symbol: String(x.symbol ?? '').toUpperCase(),
      side: String(x.holdSide ?? x.posSide ?? ''),
      pnl: Number(x.pnl ?? x.realizedPnl ?? 0),
      netProfit: Number(x.netProfit ?? x.totalProfit ?? x.pnl ?? 0),
      cTime: Number(x.ctime ?? x.cTime ?? x.uTime ?? Date.now())
    }));
  }
}
