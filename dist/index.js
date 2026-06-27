import { BitgetClient } from './bitget/client.js';
import { config } from './config.js';
import { TelegramClient } from './telegram/client.js';
import { Store } from './state/store.js';
import { addEvent, closeEvent, equity as equityMsg, help, history as historyMsg, online, openEvent, period, positionCard, reduceEvent, statusSummary } from './messages.js';
const bitget = new BitgetClient();
const telegram = new TelegramClient(config.telegramToken);
const store = new Store();
let updateOffset;
let busyScan = false;
let busyCommand = false;
function key(p) { return `${p.symbol}:${p.side}`; }
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function commandName(text) {
    const first = text.trim().split(/\s+/)[0] ?? '';
    return first.replace(/@.+$/, '').toLowerCase();
}
function nRound(v) { return Number(v || 0).toFixed(4); }
function eventKey(type, p, extra = '') {
    return `${type}:${p.symbol}:${p.side}:${extra}`;
}
async function safeSend(text) {
    await telegram.sendMessage(config.telegramChatId, text);
}
function toState(p, equity, prev) {
    const ratio = equity > 0 ? (p.marginSize / equity) * 100 : 0;
    return {
        ...p,
        key: key(p),
        openedAt: prev?.openedAt ?? p.openTime ?? Date.now(),
        maxMarginRatio: Math.max(prev?.maxMarginRatio ?? 0, ratio),
        addCount: prev?.addCount ?? 0,
        lastNotifiedPnl: prev?.lastNotifiedPnl
    };
}
async function scanPositions() {
    if (busyScan)
        return;
    busyScan = true;
    try {
        const [account, positions] = await Promise.all([bitget.getAccount(), bitget.getPositions()]);
        if (!store.initialized) {
            store.snapshot(positions, account.equity);
            await safeSend(online(account, positions.length));
            return;
        }
        const currentMap = new Map();
        for (const p of positions)
            currentMap.set(key(p), p);
        for (const [k, prev] of [...store.positions.entries()]) {
            const cur = currentMap.get(k);
            if (!cur) {
                const realizedEstimate = Number(prev.unrealizedPL ?? 0);
                store.closedTrades.unshift({
                    symbol: prev.symbol,
                    side: prev.side,
                    realized: realizedEstimate,
                    holdMs: Date.now() - prev.openedAt,
                    maxMarginRatio: prev.maxMarginRatio,
                    closedAt: Date.now()
                });
                if (store.shouldNotify(eventKey('close', prev)))
                    await safeSend(closeEvent(prev, realizedEstimate));
                store.positions.delete(k);
            }
        }
        for (const cur of positions) {
            const k = key(cur);
            const prev = store.positions.get(k);
            if (!prev) {
                const st = toState(cur, account.equity);
                store.positions.set(k, st);
                if (store.shouldNotify(eventKey('open', st)))
                    await safeSend(openEvent(st, account.equity));
                continue;
            }
            const sizeDelta = cur.total - prev.total;
            const marginDelta = cur.marginSize - prev.marginSize;
            let st = toState(cur, account.equity, prev);
            const sizeThreshold = Math.max(prev.total * 0.001, 0.0000001);
            const marginThreshold = Math.max(prev.marginSize * 0.01, 0.1);
            if (sizeDelta > sizeThreshold || marginDelta > marginThreshold) {
                st.addCount = prev.addCount + 1;
                store.positions.set(k, st);
                if (store.shouldNotify(eventKey('add', st, String(st.addCount))))
                    await safeSend(addEvent(prev, st, account.equity));
            }
            else if (sizeDelta < -sizeThreshold || marginDelta < -marginThreshold) {
                store.positions.set(k, st);
                if (store.shouldNotify(eventKey('reduce', st, `${nRound(st.total)}:${nRound(st.marginSize)}`)))
                    await safeSend(reduceEvent(prev, st, account.equity));
            }
            else {
                store.positions.set(k, st);
            }
        }
    }
    catch (err) {
        console.error('[scan] Error:', err?.message ?? err);
    }
    finally {
        busyScan = false;
    }
}
async function getPeriod(days) {
    const end = Date.now();
    const start = end - days * 24 * 60 * 60 * 1000;
    try {
        return await bitget.getHistoryPositions(start, end);
    }
    catch (err) {
        console.error('[history api] fallback:', err?.message ?? err);
        return store.closedTrades.filter(x => x.closedAt >= start);
    }
}
async function handleCommand(cmd) {
    const account = await bitget.getAccount();
    if (cmd === '/status' || cmd === '/positions') {
        const list = [...store.positions.values()];
        await safeSend(statusSummary(account, list));
        for (const p of list)
            await safeSend(positionCard(p, account.equity));
    }
    else if (cmd === '/equity') {
        await safeSend(equityMsg(account));
    }
    else if (cmd === '/today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        let items;
        try {
            items = await bitget.getHistoryPositions(start.getTime(), Date.now());
        }
        catch {
            items = store.closedTrades.filter(x => x.closedAt >= start.getTime());
        }
        await safeSend(period('📅 오늘 손익', items, account.equity));
    }
    else if (cmd === '/week') {
        await safeSend(period('🗓 최근 7일 손익', await getPeriod(7), account.equity));
    }
    else if (cmd === '/month') {
        await safeSend(period('📆 최근 30일 손익', await getPeriod(30), account.equity));
    }
    else if (cmd === '/history') {
        await safeSend(historyMsg(await getPeriod(30)));
    }
    else if (cmd === '/help' || cmd === '/start') {
        await safeSend(help());
    }
    else if (cmd === '/resetstate') {
        const positions = await bitget.getPositions();
        store.snapshot(positions, account.equity);
        await safeSend('✅ 상태 초기화 완료\n현재 포지션을 기준값으로 다시 저장했어.');
    }
}
async function pollCommands() {
    if (busyCommand)
        return;
    busyCommand = true;
    try {
        const updates = await telegram.getUpdates(updateOffset);
        for (const u of updates) {
            updateOffset = u.update_id + 1;
            const chatId = String(u.message?.chat?.id ?? '');
            const text = u.message?.text ?? '';
            if (!text.startsWith('/'))
                continue;
            if (chatId !== config.telegramChatId)
                continue;
            await handleCommand(commandName(text));
        }
    }
    catch (err) {
        console.error('[commands] Error:', err?.message ?? err);
    }
    finally {
        busyCommand = false;
    }
}
async function main() {
    console.log('Position Share Bot v3.2 final starting...');
    await scanPositions();
    while (true) {
        await Promise.all([scanPositions(), pollCommands()]);
        await sleep(config.scanIntervalMs);
    }
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
