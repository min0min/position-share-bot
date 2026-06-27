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
  recentEvents = new Map<string, number>();

  shouldNotify(eventKey: string, cooldownMs = 60_000): boolean {
    const now = Date.now();
    const last = this.recentEvents.get(eventKey) ?? 0;
    if (now - last < cooldownMs) return false;
    this.recentEvents.set(eventKey, now);
    for (const [key, ts] of [...this.recentEvents.entries()]) {
      if (now - ts > 10 * 60_000) this.recentEvents.delete(key);
    }
    return true;
  }

  key(p: Pick<Position, 'symbol' | 'side'>): string { return `${p.symbol}:${p.side}`; }

  snapshot(list: Position[], equity: number) {
    const now = Date.now();
    this.positions.clear();
    for (const p of list) {
      const ratio = equity > 0 ? (p.marginSize / equity) * 100 : 0;
      const key = this.key(p);
      this.positions.set(key, { ...p, key, openedAt: p.openTime ?? now, maxMarginRatio: ratio, addCount: 0 });
    }
    this.initialized = true;
  }
}
