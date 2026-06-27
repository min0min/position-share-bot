import type { Position } from '../bitget/client.js';

export type PositionState = Position & {
  key: string;
  openedAt: number;
  maxMarginRatio: number;
  addCount: number;
  lastNotifiedPnl?: number;
};

export type ClosedTrade = {
  symbol: string;
  side: 'long' | 'short';
  realized: number;
  holdMs: number;
  maxMarginRatio: number;
  closedAt: number;
};

export class Store {
  positions = new Map<string, PositionState>();
  closedTrades: ClosedTrade[] = [];
  initialized = false;

  key(p: Pick<Position, 'symbol' | 'side'>): string { return `${p.symbol}:${p.side}`; }

  snapshot(list: Position[], equity: number) {
    const now = Date.now();
    this.positions.clear();
    for (const p of list) {
      const ratio = equity > 0 ? (p.marginSize / equity) * 100 : 0;
      const key = this.key(p);
      this.positions.set(key, { ...p, key, openedAt: now, maxMarginRatio: ratio, addCount: 0 });
    }
    this.initialized = true;
  }
}
