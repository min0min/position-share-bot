import { BitgetClient, BitgetPositionRaw } from './bitget/client.js';
import { TelegramClient } from './telegram/client.js';
import { config } from './config.js';
import { n } from './utils/format.js';
import { loadState, PositionSnapshot, saveState } from './state/store.js';
import { addMsg, closeMsg, onlineMsg, openMsg, periodMsg, reduceMsg, statusMsg } from './messages.js';

const bitget = new BitgetClient();
const telegram = new TelegramClient();
const state = loadState();
let started = false;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function toSnapshot(raw: BitgetPositionRaw, equity: number, prev?: PositionSnapshot): PositionSnapshot {
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
  };
}

async function fetchSnapshot() {
  const [account, rawPositions] = await Promise.all([bitget.getAccount(), bitget.getAllPositions()]);
  const equity = n(account.usdtEquity || account.accountEquity);
  const active = rawPositions.filter(p => n(p.total) > 0 && n(p.marginSize) > 0);
  const positions = active.map(p => toSnapshot(p, equity, state.positions[`${p.symbol}:${p.holdSide}`]));
  return { equity, positions };
}

async function scanPositions() {
  const { equity, positions } = await fetchSnapshot();
  const current: Record<string, PositionSnapshot> = {};

  if (!started) {
    for (const p of positions) current[p.key] = p;
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
    current[cur.key] = cur;

    if (isAdd) await telegram.sendMessage(addMsg(prev, cur, equity));
    else if (isReduce) await telegram.sendMessage(reduceMsg(prev, cur, equity));
  }

  for (const [key, prev] of Object.entries(state.positions)) {
    if (!current[key]) {
      state.closedTrades.push({
        key,
        symbol: prev.symbol,
        side: prev.side,
        realizedPnl: prev.achievedProfits,
        closedAt: Date.now(),
        openedAt: prev.openedAt,
        maxWeightPct: prev.maxWeightPct,
      });
      await telegram.sendMessage(closeMsg(prev, equity));
    }
  }

  state.positions = current;
  saveState(state);
}

function periodStart(days: number): number {
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
    if (!msg?.text) continue;
    const text = msg.text.trim().split(' ')[0].toLowerCase();
    const userId = String(msg.from?.id || '');
    if (config.telegram.allowedUserIds.length && !config.telegram.allowedUserIds.includes(userId)) continue;

    if (text === '/chatid') {
      await telegram.sendMessage(`chat_id: ${msg.chat.id}`, String(msg.chat.id));
      console.log(`TELEGRAM_CHAT_ID=${msg.chat.id}`);
    } else if (text === '/status') {
      const { equity, positions } = await fetchSnapshot();
      await telegram.sendMessage(statusMsg(positions, equity), String(msg.chat.id));
    } else if (text === '/today') {
      const from = periodStart(1);
      await telegram.sendMessage(periodMsg('📅 오늘 손익', state.closedTrades.filter(t => t.closedAt >= from)), String(msg.chat.id));
    } else if (text === '/week') {
      const from = periodStart(7);
      await telegram.sendMessage(periodMsg('🗓 최근 7일 손익', state.closedTrades.filter(t => t.closedAt >= from)), String(msg.chat.id));
    } else if (text === '/month') {
      const from = periodStart(30);
      await telegram.sendMessage(periodMsg('📆 최근 30일 손익', state.closedTrades.filter(t => t.closedAt >= from)), String(msg.chat.id));
    } else if (text === '/help' || text === '/start') {
      await telegram.sendMessage('명령어\n/status 현재 포지션\n/today 오늘 손익\n/week 최근 7일\n/month 최근 30일\n/chatid 그룹 chat_id 확인', String(msg.chat.id));
    }
  }
  saveState(state);
}

async function main() {
  console.log('Position Share Bot starting...');
  while (true) {
    try { await scanPositions(); } catch (e) { console.error('[scan]', e); }
    try { await handleCommands(); } catch (e) { console.error('[commands]', e); }
    await sleep(config.bot.pollIntervalMs);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
