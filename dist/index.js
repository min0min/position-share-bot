import { BitgetClient } from './bitget/client.js';
import { TelegramClient } from './telegram/client.js';
import { config } from './config.js';
import { n } from './utils/format.js';
import { loadState, saveState } from './state/store.js';
import { addMsg, closeMsg, equityMsg, helpMsg, historyMsg, onlineMsg, openMsg, periodMsg, pnlUpdateMsg, reduceMsg, statusMsg, resetMsg } from './messages.js';
const bitget = new BitgetClient();
const telegram = new TelegramClient();
const state = loadState();
let started = false;
let lastEquitySave = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function toSnapshot(raw, equity, prev) {
    const key = `${raw.symbol}:${raw.holdSide}`;
    const marginSize = n(raw.marginSize);
    const weightPct = equity > 0 ? (marginSize / equity) * 100 : 0;
    return {
        key,
        symbol: raw.symbol,
        side: raw.holdSide,
        marginSize,
        total: n(raw.total),
        leverage: n(raw.leverage),
        avgPrice: n(raw.openPriceAvg),
        markPrice: n(raw.markPrice),
        unrealizedPL: n(raw.unrealizedPL),
        achievedProfits: n(raw.achievedProfits),
        marginMode: raw.marginMode,
        openedAt: prev?.openedAt || n(raw.cTime) || Date.now(),
        updatedAt: n(raw.uTime) || Date.now(),
        maxWeightPct: Math.max(prev?.maxWeightPct || 0, weightPct),
        addCount: prev?.addCount || 0,
        lastPnlNoticeAt: prev?.lastPnlNoticeAt,
        lastPnlNoticeValue: prev?.lastPnlNoticeValue,
    };
}
async function fetchSnapshot() {
    const [account, rawPositions] = await Promise.all([bitget.getAccount(), bitget.getAllPositions()]);
    const equity = n(account.usdtEquity || account.accountEquity);
    const active = rawPositions.filter(p => n(p.total) > 0 && n(p.marginSize) > 0);
    const positions = active.map(p => toSnapshot(p, equity, state.positions[`${p.symbol}:${p.holdSide}`]));
    return { equity, positions };
}
function recordEquity(equity) {
    const now = Date.now();
    if (now - lastEquitySave < 5 * 60 * 1000 && state.equityHistory.length)
        return;
    state.equityHistory.push({ at: now, equity });
    if (state.equityHistory.length > 2000)
        state.equityHistory = state.equityHistory.slice(-2000);
    lastEquitySave = now;
}
function estimatedClosePnl(prev) {
    // Bitget이 포지션 제거 직전 achievedProfits를 0으로 주는 경우가 있어 마지막 미실현손익을 예비값으로 사용.
    if (Math.abs(prev.achievedProfits) > 0.000001)
        return prev.achievedProfits;
    return prev.unrealizedPL;
}
async function maybeSendPnlUpdate(cur, equity) {
    const now = Date.now();
    // 첫 관측값은 기준점으로만 저장한다. 재배포 직후 불필요한 업데이트 알림이 연속 발송되는 것을 막기 위함.
    if (!cur.lastPnlNoticeAt || cur.lastPnlNoticeValue === undefined) {
        return { ...cur, lastPnlNoticeAt: now, lastPnlNoticeValue: cur.unrealizedPL };
    }
    const enoughTime = now - cur.lastPnlNoticeAt >= config.bot.pnlUpdateIntervalMs;
    const enoughMove = Math.abs(cur.unrealizedPL - cur.lastPnlNoticeValue) >= config.bot.pnlUpdateThresholdUsdt;
    if (!enoughTime || !enoughMove)
        return cur;
    await telegram.sendMessage(pnlUpdateMsg(cur, equity));
    return { ...cur, lastPnlNoticeAt: now, lastPnlNoticeValue: cur.unrealizedPL };
}
async function scanPositions() {
    const { equity, positions } = await fetchSnapshot();
    recordEquity(equity);
    const current = {};
    if (!started) {
        for (const p of positions)
            current[p.key] = p;
        state.positions = current;
        saveState(state);
        await telegram.sendMessage(onlineMsg(equity, positions.length));
        started = true;
        return;
    }
    for (const cur0 of positions) {
        const prev = state.positions[cur0.key];
        let cur = cur0;
        if (!prev) {
            current[cur.key] = cur;
            await telegram.sendMessage(openMsg(cur, equity));
            continue;
        }
        const sizeDelta = cur.total - prev.total;
        const marginDelta = cur.marginSize - prev.marginSize;
        const isAdd = sizeDelta > Math.max(prev.total * 0.01, 0.00000001) || marginDelta > Math.max(prev.marginSize * 0.03, 1);
        const isReduce = sizeDelta < -Math.max(prev.total * 0.01, 0.00000001) || marginDelta < -Math.max(prev.marginSize * 0.05, 1);
        cur = { ...cur, addCount: isAdd ? prev.addCount + 1 : prev.addCount };
        if (isAdd)
            await telegram.sendMessage(addMsg(prev, cur, equity));
        else if (isReduce)
            await telegram.sendMessage(reduceMsg(prev, cur, equity));
        else
            cur = await maybeSendPnlUpdate(cur, equity);
        current[cur.key] = cur;
    }
    for (const [key, prev] of Object.entries(state.positions)) {
        if (!current[key]) {
            const realizedPnl = estimatedClosePnl(prev);
            state.closedTrades.push({
                key,
                symbol: prev.symbol,
                side: prev.side,
                realizedPnl,
                closedAt: Date.now(),
                openedAt: prev.openedAt,
                maxWeightPct: prev.maxWeightPct,
                avgPrice: prev.avgPrice,
                closePrice: prev.markPrice,
                maxMarginSize: prev.marginSize,
                addCount: prev.addCount,
            });
            if (state.closedTrades.length > 1000)
                state.closedTrades = state.closedTrades.slice(-1000);
            await telegram.sendMessage(closeMsg(prev, equity, realizedPnl));
        }
    }
    state.positions = current;
    saveState(state);
}
function periodStart(days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days + 1);
    return d.getTime();
}
async function handleCommands() {
    const updates = await telegram.getUpdates(state.telegramOffset);
    for (const u of updates) {
        state.telegramOffset = u.update_id + 1;
        const msg = u.message;
        if (!msg?.text)
            continue;
        const rawText = msg.text.trim();
        const text = rawText.split(/\s+/)[0].toLowerCase().split('@')[0];
        const userId = String(msg.from?.id || '');
        if (config.telegram.allowedUserIds.length && !config.telegram.allowedUserIds.includes(userId))
            continue;
        console.log(`[command] ${text} chat=${msg.chat.id} user=${userId}`);
        if (text === '/chatid') {
            await telegram.sendMessage(`chat_id: ${msg.chat.id}`, String(msg.chat.id));
            console.log(`TELEGRAM_CHAT_ID=${msg.chat.id}`);
        }
        else if (text === '/status' || text === '/positions') {
            const { equity, positions } = await fetchSnapshot();
            await telegram.sendMessage(statusMsg(positions, equity), String(msg.chat.id));
        }
        else if (text === '/today') {
            const { equity } = await fetchSnapshot();
            const from = periodStart(1);
            await telegram.sendMessage(periodMsg('📅 오늘 손익', state.closedTrades.filter(t => t.closedAt >= from), equity), String(msg.chat.id));
        }
        else if (text === '/week') {
            const { equity } = await fetchSnapshot();
            const from = periodStart(7);
            await telegram.sendMessage(periodMsg('🗓 최근 7일 손익', state.closedTrades.filter(t => t.closedAt >= from), equity), String(msg.chat.id));
        }
        else if (text === '/month') {
            const { equity } = await fetchSnapshot();
            const from = periodStart(30);
            await telegram.sendMessage(periodMsg('📆 최근 30일 손익', state.closedTrades.filter(t => t.closedAt >= from), equity), String(msg.chat.id));
        }
        else if (text === '/history') {
            await telegram.sendMessage(historyMsg(state.closedTrades), String(msg.chat.id));
        }
        else if (text === '/equity') {
            const { equity } = await fetchSnapshot();
            await telegram.sendMessage(equityMsg(equity, state.equityHistory), String(msg.chat.id));
        }
        else if (text === '/resetstate') {
            const openCount = Object.keys(state.positions).length;
            state.positions = {};
            state.closedTrades = [];
            state.equityHistory = [];
            saveState(state);
            await telegram.sendMessage(resetMsg(openCount), String(msg.chat.id));
        }
        else if (text === '/help' || text === '/start') {
            await telegram.sendMessage(helpMsg(), String(msg.chat.id));
        }
    }
    saveState(state);
}
async function main() {
    console.log('Position Share Bot starting...');
    while (true) {
        try {
            await scanPositions();
        }
        catch (e) {
            console.error('[scan]', e);
        }
        try {
            await handleCommands();
        }
        catch (e) {
            console.error('[commands]', e);
        }
        await sleep(config.bot.pollIntervalMs);
    }
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
