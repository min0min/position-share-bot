import crypto from 'node:crypto';
import { config } from '../config.js';
export class BitgetClient {
    baseUrl = 'https://api.bitget.com';
    sign(timestamp, method, requestPath, body = '') {
        const prehash = timestamp + method.toUpperCase() + requestPath + body;
        return crypto.createHmac('sha256', config.bitgetSecret).update(prehash).digest('base64');
    }
    async request(path, method = 'GET', bodyObj) {
        const body = bodyObj ? JSON.stringify(bodyObj) : '';
        const timestamp = Date.now().toString();
        const headers = {
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
    async getAccount() {
        const path = `/api/v2/mix/account/accounts?productType=${encodeURIComponent(config.productType)}`;
        const data = await this.request(path);
        const arr = Array.isArray(data) ? data : [];
        const target = arr.find((a) => String(a.marginCoin ?? '').toUpperCase() === config.marginCoin.toUpperCase()) ?? arr[0] ?? {};
        return {
            equity: Number(target.accountEquity ?? target.equity ?? target.usdtEquity ?? target.crossedRiskRate ?? 0),
            available: Number(target.available ?? target.availableBalance ?? 0)
        };
    }
    async getPositions() {
        const path = `/api/v2/mix/position/all-position?productType=${encodeURIComponent(config.productType)}&marginCoin=${encodeURIComponent(config.marginCoin)}`;
        const data = await this.request(path);
        const arr = Array.isArray(data) ? data : [];
        return arr.map((p) => {
            const holdSide = String(p.holdSide ?? p.posSide ?? p.side ?? '').toLowerCase();
            const side = holdSide.includes('short') || holdSide === 'sell' ? 'short' : 'long';
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
    async getHistoryPositions(startMs, endMs) {
        const path = `/api/v2/mix/position/history-position?productType=${encodeURIComponent(config.productType)}&startTime=${startMs}&endTime=${endMs}&pageSize=100`;
        const data = await this.request(path);
        const list = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : [];
        return list.map((x) => ({
            symbol: String(x.symbol ?? '').toUpperCase(),
            side: String(x.holdSide ?? x.posSide ?? ''),
            pnl: Number(x.pnl ?? x.realizedPnl ?? 0),
            netProfit: Number(x.netProfit ?? x.totalProfit ?? x.pnl ?? 0),
            cTime: Number(x.ctime ?? x.cTime ?? x.uTime ?? Date.now())
        }));
    }
}
