import crypto from 'node:crypto';
import { config } from '../config.js';

export type BitgetPositionRaw = {
  symbol: string;
  holdSide: 'long' | 'short' | string;
  marginSize: string;
  total: string;
  leverage: string;
  achievedProfits: string;
  openPriceAvg: string;
  unrealizedPL: string;
  markPrice: string;
  marginMode: string;
  cTime: string;
  uTime: string;
};

export type BitgetAccountRaw = {
  marginCoin: string;
  accountEquity: string;
  usdtEquity: string;
  available: string;
  unrealizedPL: string;
};

export type BitgetHistoryPositionRaw = {
  positionId: string;
  symbol: string;
  marginCoin: string;
  holdSide: 'long' | 'short' | string;
  openAvgPrice: string;
  closeAvgPrice: string;
  marginMode: string;
  openTotalPos: string;
  closeTotalPos: string;
  pnl: string;
  netProfit: string;
  totalFunding: string;
  openFee: string;
  closeFee: string;
  cTime?: string;
  ctime?: string;
  uTime?: string;
  utime?: string;
};

export type BitgetHistoryPositionResponse = {
  list: BitgetHistoryPositionRaw[];
  endId?: string;
};

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export class BitgetClient {
  private sign(ts: string, method: string, pathWithQuery: string, body = ''): string {
    const prehash = `${ts}${method.toUpperCase()}${pathWithQuery}${body}`;
    return crypto.createHmac('sha256', config.bitget.apiSecret).update(prehash).digest('base64');
  }

  private async request<T>(method: 'GET', path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const query = qs(params);
    const pathWithQuery = query ? `${path}?${query}` : path;
    const ts = Date.now().toString();
    const res = await fetch(`${config.bitget.baseUrl}${pathWithQuery}`, {
      method,
      headers: {
        'ACCESS-KEY': config.bitget.apiKey,
        'ACCESS-SIGN': this.sign(ts, method, pathWithQuery),
        'ACCESS-PASSPHRASE': config.bitget.passphrase,
        'ACCESS-TIMESTAMP': ts,
        'locale': 'en-US',
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json() as { code: string; msg: string; data: T };
    if (!res.ok || json.code !== '00000') {
      throw new Error(`Bitget API error ${json.code}: ${json.msg}`);
    }
    return json.data;
  }

  async getAllPositions(): Promise<BitgetPositionRaw[]> {
    return this.request<BitgetPositionRaw[]>('GET', '/api/v2/mix/position/all-position', {
      productType: config.bitget.productType,
      marginCoin: config.bitget.marginCoin,
    });
  }

  async getAccount(): Promise<BitgetAccountRaw> {
    const list = await this.request<BitgetAccountRaw[]>('GET', '/api/v2/mix/account/accounts', {
      productType: config.bitget.productType,
    });
    const found = list.find(a => a.marginCoin?.toUpperCase() === config.bitget.marginCoin.toUpperCase());
    if (!found) throw new Error(`No ${config.bitget.marginCoin} account found`);
    return found;
  }

  async getHistoricalPositions(startTime: number, endTime = Date.now(), limit = 100): Promise<BitgetHistoryPositionRaw[]> {
    const first = await this.request<BitgetHistoryPositionResponse>('GET', '/api/v2/mix/position/history-position', {
      productType: config.bitget.productType,
      startTime: String(startTime),
      endTime: String(endTime),
      limit: String(Math.min(Math.max(limit, 1), 100)),
    });
    return first.list || [];
  }
}
