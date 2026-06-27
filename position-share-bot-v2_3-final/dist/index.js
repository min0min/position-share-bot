import { BitgetClient } from './bitget/client.js';
import { TelegramClient } from './telegram/client.js';
import { config } from './config.js';
import { n } from './utils/format.js';
import { loadState, saveState } from './state/store.js';
import { addMsg, closeMsg, equityMsg, helpMsg, historyMsg, onlineMsg, openMsg, periodMsg, reduceMsg, statusMsg, resetMsg } from './messages.js';
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
// 일반 홀딩 중 PnL 변동은 알림을 보내지 않습니다.
// 신규진입/추가진입/부분청산/전체청산 같은 실제 포지션 변화만 알림 전송.
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
        else {
            // 홀딩 중 단순 현재가/미실현손익 변동은 조용히 상태만 갱신한다.
            cur = { ...cur, lastPnlNoticeAt: prev.lastPnlNoticeAt, lastPnlNoticeValue: prev.lastPnlNoticeValue };
        }
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
function historyToClosedTrade(h) {
    const openedAt = n(h.cTime || h.ctime) || Date.now();
    const closedAt = n(h.uTime || h.utime) || Date.now();
    const grossPnl = n(h.pnl);
    const netProfit = n(h.netProfit);
    const openFee = n(h.openFee);
    const closeFee = n(h.closeFee);
    const funding = n(h.totalFunding);
    return {
        key: h.positionId || `${h.symbol}:${h.holdSide}:${closedAt}`,
        symbol: h.symbol,
        side: h.holdSide,
        realizedPnl: Number.isFinite(netProfit) ? netProfit : grossPnl,
        grossPnl,
        netProfit,
        funding,
        openFee,
        closeFee,
        source: 'bitget',
        closedAt,
        openedAt,
        maxWeightPct: 0,
        avgPrice: n(h.openAvgPrice),
        closePrice: n(h.closeAvgPrice),
        maxMarginSize: 0,
        addCount: 0,
    };
}
async function fetchExchangeClosedTrades(days) {
    const from = periodStart(days);
    const list = await bitget.getHistoricalPositions(from, Date.now(), 100);
    return list.map(historyToClosedTrade).filter(t => t.closedAt >= from).sort((a, b) => a.closedAt - b.closedAt);
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
            const trades = await fetchExchangeClosedTrades(1);
            await telegram.sendMessage(periodMsg('📅 오늘 손익', trades, equity, true), String(msg.chat.id));
        }
        else if (text === '/week') {
            const { equity } = await fetchSnapshot();
            const trades = await fetchExchangeClosedTrades(7);
            await telegram.sendMessage(periodMsg('🗓 최근 7일 손익', trades, equity, true), String(msg.chat.id));
        }
        else if (text === '/month') {
            const { equity } = await fetchSnapshot();
            const trades = await fetchExchangeClosedTrades(30);
            await telegram.sendMessage(periodMsg('📆 최근 30일 손익', trades, equity, true), String(msg.chat.id));
        }
        else if (text === '/history') {
            const trades = await fetchExchangeClosedTrades(30);
            await telegram.sendMessage(historyMsg(trades), String(msg.chat.id));
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
