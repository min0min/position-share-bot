import { PositionSnapshot } from './state/store.js';
import { duration, fmt, gauge, pct, riskLabel, sideEmoji, sign } from './utils/format.js';

export function onlineMsg(equity: number, openCount: number): string {
  return `✅ Position Share Bot Online\n\n거래소: Bitget USDT Futures\n계좌 Equity: ${fmt(equity)} USDT\n오픈 포지션: ${openCount}개`;
}

export function openMsg(p: PositionSnapshot, equity: number): string {
  const weight = equity > 0 ? (p.marginSize / equity) * 100 : 0;
  return `━━━━━━━━━━━━━━\n🚀 신규 진입 ${p.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(p.side)} ${p.symbol}\n진입가: ${fmt(p.avgPrice, 6)}\n평균가: ${fmt(p.avgPrice, 6)}\n마크가: ${fmt(p.markPrice, 6)}\n수량: ${fmt(p.total, 6)}\n레버리지: ${fmt(p.leverage, 0)}x\n\n💰 전체 시드: ${fmt(equity)} USDT\n사용 증거금: ${fmt(p.marginSize)} USDT\n시드 대비 비중: ${pct(weight)}\n${gauge(weight)}\n\n리스크: ${riskLabel(weight)}\n━━━━━━━━━━━━━━`;
}

export function addMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const prevWeight = equity > 0 ? (prev.marginSize / equity) * 100 : 0;
  const curWeight = equity > 0 ? (cur.marginSize / equity) * 100 : 0;
  const addMargin = cur.marginSize - prev.marginSize;
  const addWeight = curWeight - prevWeight;
  return `━━━━━━━━━━━━━━\n➕ 추가진입 ${cur.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(cur.side)} ${cur.symbol}\n추가진입: ${cur.addCount}회차\n\n기존 비중: ${pct(prevWeight)}\n추가 비중: +${pct(addWeight)}\n현재 총 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n추가 증거금: +${fmt(addMargin)} USDT\n총 증거금: ${fmt(cur.marginSize)} USDT\n\n평균가 변화:\n${fmt(prev.avgPrice, 6)} → ${fmt(cur.avgPrice, 6)}\n\n리스크: ${riskLabel(curWeight)}\n━━━━━━━━━━━━━━`;
}

export function reduceMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const curWeight = equity > 0 ? (cur.marginSize / equity) * 100 : 0;
  return `━━━━━━━━━━━━━━\n➖ 포지션 축소 ${cur.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(cur.side)} ${cur.symbol}\n기존 수량: ${fmt(prev.total, 6)}\n현재 수량: ${fmt(cur.total, 6)}\n현재 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n미실현손익: ${sign(cur.unrealizedPL)} USDT\n━━━━━━━━━━━━━━`;
}

export function closeMsg(prev: PositionSnapshot, equity: number): string {
  const accountRoi = equity > 0 ? (prev.achievedProfits / equity) * 100 : 0;
  return `━━━━━━━━━━━━━━\n✅ 전체 청산 ${prev.side.toUpperCase()}\n━━━━━━━━━━━━━━\n\n${sideEmoji(prev.side)} ${prev.symbol}\n평균 진입가: ${fmt(prev.avgPrice, 6)}\n마지막 마크가: ${fmt(prev.markPrice, 6)}\n\n실현손익: ${sign(prev.achievedProfits)} USDT\n계좌 대비: ${sign(accountRoi)}%\n보유시간: ${duration(Date.now() - prev.openedAt)}\n최대 비중: ${pct(prev.maxWeightPct)}\n━━━━━━━━━━━━━━`;
}

export function statusMsg(positions: PositionSnapshot[], equity: number): string {
  if (!positions.length) return `📭 현재 오픈 포지션 없음\n\nEquity: ${fmt(equity)} USDT`;
  const lines = positions.map(p => {
    const weight = equity > 0 ? (p.marginSize / equity) * 100 : 0;
    return `${sideEmoji(p.side)} ${p.symbol} ${p.side.toUpperCase()}\n평균가 ${fmt(p.avgPrice, 6)} · 마크가 ${fmt(p.markPrice, 6)}\n증거금 ${fmt(p.marginSize)} USDT · 비중 ${pct(weight)}\n${gauge(weight)}\n미실현 ${sign(p.unrealizedPL)} USDT`;
  });
  return `📊 현재 포지션\n\nEquity: ${fmt(equity)} USDT\n\n${lines.join('\n\n')}`;
}

export function periodMsg(title: string, trades: { realizedPnl: number; closedAt: number }[]): string {
  const sum = trades.reduce((a, t) => a + t.realizedPnl, 0);
  return `${title}\n\n청산 거래: ${trades.length}개\n실현손익: ${sign(sum)} USDT`;
}
