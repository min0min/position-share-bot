export class Store {
    positions = new Map();
    closedTrades = [];
    initialized = false;
    key(p) { return `${p.symbol}:${p.side}`; }
    snapshot(list, equity) {
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
