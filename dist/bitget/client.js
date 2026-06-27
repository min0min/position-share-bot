import crypto from 'node:crypto';
import { config } from '../config.js';
function qs(params) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}
export class BitgetClient {
    sign(ts, method, pathWithQuery, body = '') {
        const prehash = `${ts}${method.toUpperCase()}${pathWithQuery}${body}`;
        return crypto.createHmac('sha256', config.bitget.apiSecret).update(prehash).digest('base64');
    }
    async request(method, path, params = {}) {
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
        const json = await res.json();
        if (!res.ok || json.code !== '00000') {
            throw new Error(`Bitget API error ${json.code}: ${json.msg}`);
        }
        return json.data;
    }
    async getAllPositions() {
        return this.request('GET', '/api/v2/mix/position/all-position', {
            productType: config.bitget.productType,
            marginCoin: config.bitget.marginCoin,
        });
    }
    async getAccount() {
        const list = await this.request('GET', '/api/v2/mix/account/accounts', {
            productType: config.bitget.productType,
        });
        const found = list.find(a => a.marginCoin?.toUpperCase() === config.bitget.marginCoin.toUpperCase());
        if (!found)
            throw new Error(`No ${config.bitget.marginCoin} account found`);
        return found;
    }
}
