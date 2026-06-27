import { ClosedTrade, PositionSnapshot } from './state/store.js';
import { duration, fmt, gauge, pct, riskLabel, sideEmoji, sign } from './utils/format.js';

function weightOf(p: PositionSnapshot, equity: number): number {
  return equity > 0 ? (p.marginSize / equity) * 100 : 0;
}

export function onlineMsg(equity: number, openCount: number): string {
  return `✅ Position Share Bot Online\n\n거래소: Bitget USDT Futures\n계좌 Equity: ${fmt(equity)} USDT\n오픈 포지션: ${openCount}개\n\n명령어: /status /today /week /month /history /equity /help`;
}

export function openMsg(p: PositionSnapshot, equity: number): string {
  const weight = weightOf(p, equity);
  return `━━━━━━━━━━━━━━\n🚀 신규 진입 ${p.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(p.side)} ${p.symbol}\n진입가: ${fmt(p.avgPrice, 6)}\n평균가: ${fmt(p.avgPrice, 6)}\n마크가: ${fmt(p.markPrice, 6)}\n수량: ${fmt(p.total, 6)}\n레버리지: ${fmt(p.leverage, 0)}x\n\n💰 전체 시드: ${fmt(equity)} USDT\n사용 증거금: ${fmt(p.marginSize)} USDT\n시드 대비 비중: ${pct(weight)}\n${gauge(weight)}\n\n리스크: ${riskLabel(weight)}\n━━━━━━━━━━━━━━`;
}

export function addMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const prevWeight = weightOf(prev, equity);
  const curWeight = weightOf(cur, equity);
  const addMargin = cur.marginSize - prev.marginSize;
  const addWeight = curWeight - prevWeight;
  const addQty = cur.total - prev.total;
  return `━━━━━━━━━━━━━━\n➕ 추가진입 ${cur.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(cur.side)} ${cur.symbol}\n추가진입: ${cur.addCount}회차\n\n기존 비중: ${pct(prevWeight)}\n추가 비중: +${pct(Math.max(addWeight, 0))}\n현재 총 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n추가 수량: +${fmt(Math.max(addQty, 0), 6)}\n추가 증거금: +${fmt(Math.max(addMargin, 0))} USDT\n총 증거금: ${fmt(cur.marginSize)} USDT\n\n평균가 변화:\n${fmt(prev.avgPrice, 6)} → ${fmt(cur.avgPrice, 6)}\n\n미실현손익: ${sign(cur.unrealizedPL)} USDT\n리스크: ${riskLabel(curWeight)}\n━━━━━━━━━━━━━━`;
}

export function reduceMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const prevWeight = weightOf(prev, equity);
  const curWeight = weightOf(cur, equity);
  return `━━━━━━━━━━━━━━\n➖ 포지션 축소 ${cur.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(cur.side)} ${cur.symbol}\n기존 수량: ${fmt(prev.total, 6)}\n현재 수량: ${fmt(cur.total, 6)}\n\n기존 비중: ${pct(prevWeight)}\n현재 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n실현/누적손익: ${sign(cur.achievedProfits)} USDT\n미실현손익: ${sign(cur.unrealizedPL)} USDT\n━━━━━━━━━━━━━━`;
}

export function pnlUpdateMsg(p: PositionSnapshot, equity: number): string {
  const weight = weightOf(p, equity);
  const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
  return `📡 포지션 업데이트\n\n${sideEmoji(p.side)} ${p.symbol} ${p.side.toUpperCase()}\n평균가: ${fmt(p.avgPrice, 6)}\n마크가: ${fmt(p.markPrice, 6)}\n비중: ${pct(weight)} ${gauge(weight)}\n미실현손익: ${sign(p.unrealizedPL)} USDT (${sign(roi)}%)`;
}

export function closeMsg(prev: PositionSnapshot, equity: number, realizedPnl: number): string {
  const accountRoi = equity > 0 ? (realizedPnl / equity) * 100 : 0;
  return `━━━━━━━━━━━━━━\n✅ 전체 청산 ${prev.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(prev.side)} ${prev.symbol}\n평균 진입가: ${fmt(prev.avgPrice, 6)}\n마지막 마크가: ${fmt(prev.markPrice, 6)}\n\n실현손익: ${sign(realizedPnl)} USDT\n계좌 대비: ${sign(accountRoi)}%\n보유시간: ${duration(Date.now() - prev.openedAt)}\n최대 비중: ${pct(prev.maxWeightPct)}\n추가진입: ${prev.addCount}회\n━━━━━━━━━━━━━━`;
}

export function statusMsg(positions: PositionSnapshot[], equity: number): string {
  if (!positions.length) return `📭 현재 오픈 포지션 없음\n\nEquity: ${fmt(equity)} USDT`;
  const totalMargin = positions.reduce((a, p) => a + p.marginSize, 0);
  const totalPnl = positions.reduce((a, p) => a + p.unrealizedPL, 0);
  const totalWeight = equity > 0 ? (totalMargin / equity) * 100 : 0;
  const lines = positions.map(p => {
    const weight = weightOf(p, equity);
    const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
    return `${sideEmoji(p.side)} ${p.symbol} ${p.side.toUpperCase()}\n평균가 ${fmt(p.avgPrice, 6)} · 마크가 ${fmt(p.markPrice, 6)}\n수량 ${fmt(p.total, 6)} · 레버리지 ${fmt(p.leverage, 0)}x\n증거금 ${fmt(p.marginSize)} USDT · 비중 ${pct(weight)}\n${gauge(weight)}\n미실현 ${sign(p.unrealizedPL)} USDT (${sign(roi)}%)\n보유시간 ${duration(Date.now() - p.openedAt)}`;
  });
  return `📊 현재 포지션\n\nEquity: ${fmt(equity)} USDT\n총 증거금: ${fmt(totalMargin)} USDT\n총 비중: ${pct(totalWeight)} ${gauge(totalWeight)}\n총 미실현: ${sign(totalPnl)} USDT\n\n${lines.join('\n\n━━━━━━━━━━━━━━\n\n')}`;
}

export function periodMsg(title: string, trades: ClosedTrade[], equity?: number): string {
  const sum = trades.reduce((a, t) => a + t.realizedPnl, 0);
  const wins = trades.filter(t => t.realizedPnl > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const roi = equity && equity > 0 ? (sum / equity) * 100 : 0;
  return `${title}\n\n청산 거래: ${trades.length}개\n승률: ${pct(winRate)}\n실현손익: ${sign(sum)} USDT${equity ? `\n계좌 대비: ${sign(roi)}%` : ''}`;
}

export function historyMsg(trades: ClosedTrade[]): string {
  if (!trades.length) return '📭 최근 청산 기록 없음';
  const recent = trades.slice(-10).reverse();
  return `🧾 최근 청산 기록\n\n${recent.map(t => `${sideEmoji(t.side)} ${t.symbol} ${t.side.toUpperCase()}\n손익 ${sign(t.realizedPnl)} USDT · 최대비중 ${pct(t.maxWeightPct)} · 보유 ${duration(t.closedAt - t.openedAt)}`).join('\n\n')}`;
}

export function equityMsg(equity: number, points: { at: number; equity: number }[]): string {
  const first = points[0]?.equity ?? equity;
  const change = equity - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  return `💰 Equity\n\n현재: ${fmt(equity)} USDT\n기록 시작 대비: ${sign(change)} USDT (${sign(changePct)}%)\n저장 포인트: ${points.length}개`;
}

export function helpMsg(): string {
  return `🤖 Position Share Bot 명령어\n\n/status 현재 포지션\n/today 오늘 청산 손익\n/week 최근 7일 청산 손익\n/month 최근 30일 청산 손익\n/history 최근 청산 10개\n/equity 계좌 Equity 요약\n/chatid 현재 방 chat_id 확인`;
}
