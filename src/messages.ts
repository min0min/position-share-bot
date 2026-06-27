import { ClosedTrade, PositionSnapshot } from './state/store.js';
import { duration, fmt, gauge, pct, pnlEmoji, riskLabel, sideEmoji, sideLabel, sign } from './utils/format.js';

function weightOf(p: PositionSnapshot, equity: number): number {
  return equity > 0 ? (p.marginSize / equity) * 100 : 0;
}

function symbolName(symbol: string): string {
  return symbol.replace(/USDT$/i, ' / USDT');
}

function posHeader(p: PositionSnapshot, title: string): string {
  return `━━━━━━━━━━━━━━━━━━\n${title}\n${sideEmoji(p.side)} ${sideLabel(p.side)} · ${symbolName(p.symbol)}\n━━━━━━━━━━━━━━━━━━`;
}

function pnlLine(value: number, roi?: number): string {
  const label = value >= 0 ? '수익' : '손실';
  return `${pnlEmoji(value)} ${label}: ${sign(value)} USDT${roi === undefined ? '' : ` (${sign(roi)}%)`}`;
}

function riskBlock(weight: number): string {
  return `📊 시드 비중\n${gauge(weight)}\n${riskLabel(weight)}`;
}

function priceBlock(p: PositionSnapshot): string {
  return `💰 평균가: ${fmt(p.avgPrice, 6)}\n📍 현재가: ${fmt(p.markPrice, 6)}`;
}

function positionBody(p: PositionSnapshot, equity: number): string {
  const weight = weightOf(p, equity);
  const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
  return `${priceBlock(p)}\n📦 수량: ${fmt(p.total, 6)}\n⚡ 레버리지: ${fmt(p.leverage, 0)}x\n💵 증거금: ${fmt(p.marginSize)} USDT\n\n${riskBlock(weight)}\n\n${pnlLine(p.unrealizedPL, roi)}\n⏱ 보유시간: ${duration(Date.now() - p.openedAt)}`;
}

export function onlineMsg(equity: number, openCount: number): string {
  return `━━━━━━━━━━━━━━━━━━\n✅ Position Share Bot Online\n━━━━━━━━━━━━━━━━━━\n\n🏦 거래소: Bitget USDT Futures\n💰 Equity: ${fmt(equity)} USDT\n📂 오픈 포지션: ${openCount}개\n\n⌨️ 명령어\n/status /today /week /month\n/history /equity /help\n━━━━━━━━━━━━━━━━━━`;
}

export function openMsg(p: PositionSnapshot, equity: number): string {
  return `${posHeader(p, '🚀 신규 진입 알림')}\n\n${positionBody(p, equity)}\n━━━━━━━━━━━━━━━━━━`;
}

export function addMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const prevWeight = weightOf(prev, equity);
  const curWeight = weightOf(cur, equity);
  const addMargin = cur.marginSize - prev.marginSize;
  const addWeight = curWeight - prevWeight;
  const addQty = cur.total - prev.total;
  const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
  return `${posHeader(cur, '➕ 추가진입 알림')}\n\n🔢 추가진입: ${cur.addCount}회차\n\n📊 비중 변화\n기존: ${pct(prevWeight)}\n추가: +${pct(Math.max(addWeight, 0))}\n현재: ${pct(curWeight)}\n${gauge(curWeight)}\n${riskLabel(curWeight)}\n\n📦 추가 수량: +${fmt(Math.max(addQty, 0), 6)}\n💵 추가 증거금: +${fmt(Math.max(addMargin, 0))} USDT\n💵 총 증거금: ${fmt(cur.marginSize)} USDT\n\n💰 평균가 변화\n${fmt(prev.avgPrice, 6)} → ${fmt(cur.avgPrice, 6)}\n📍 현재가: ${fmt(cur.markPrice, 6)}\n\n${pnlLine(cur.unrealizedPL, roi)}\n━━━━━━━━━━━━━━━━━━`;
}

export function reduceMsg(prev: PositionSnapshot, cur: PositionSnapshot, equity: number): string {
  const prevWeight = weightOf(prev, equity);
  const curWeight = weightOf(cur, equity);
  const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
  const reducedQty = Math.max(prev.total - cur.total, 0);
  const realized = cur.achievedProfits - prev.achievedProfits;
  const reduceTitle = realized < 0 ? '🛑 부분 손절 / 포지션 축소' : '➖ 부분 청산 / 포지션 축소';
  return `${posHeader(cur, reduceTitle)}\n\n📦 축소 수량: -${fmt(reducedQty, 6)}\n기존 수량: ${fmt(prev.total, 6)}\n현재 수량: ${fmt(cur.total, 6)}\n\n📊 비중 변화\n기존: ${pct(prevWeight)}\n현재: ${pct(curWeight)}\n${gauge(curWeight)}\n\n📍 현재가: ${fmt(cur.markPrice, 6)}\n${realized !== 0 ? `💵 이번 청산 손익: ${sign(realized)} USDT\n` : ''}💵 누적 실현손익: ${sign(cur.achievedProfits)} USDT\n${pnlLine(cur.unrealizedPL, roi)}\n━━━━━━━━━━━━━━━━━━`;
}

export function pnlUpdateMsg(p: PositionSnapshot, equity: number): string {
  return `${posHeader(p, '📡 포지션 상태 업데이트')}\n\n${positionBody(p, equity)}\n━━━━━━━━━━━━━━━━━━`;
}

export function closeMsg(prev: PositionSnapshot, equity: number, realizedPnl: number): string {
  const accountRoi = equity > 0 ? (realizedPnl / equity) * 100 : 0;
  const title = realizedPnl < 0 ? '🛑 손절 / 전체 청산' : '✅ 익절 / 전체 청산';
  const resultLabel = realizedPnl < 0 ? '손절 금액' : '실현 수익';
  return `${posHeader(prev, title)}\n\n💰 평균 진입가: ${fmt(prev.avgPrice, 6)}\n📍 청산 기준가: ${fmt(prev.markPrice, 6)}\n\n${pnlEmoji(realizedPnl)} ${resultLabel}: ${sign(realizedPnl)} USDT\n📊 계좌 대비: ${sign(accountRoi)}%\n\n⏱ 보유시간: ${duration(Date.now() - prev.openedAt)}\n📈 최대 비중: ${pct(prev.maxWeightPct)}\n➕ 추가진입: ${prev.addCount}회\n━━━━━━━━━━━━━━━━━━`;
}

export function statusMsg(positions: PositionSnapshot[], equity: number): string {
  if (!positions.length) return `━━━━━━━━━━━━━━━━━━\n📭 현재 오픈 포지션 없음\n━━━━━━━━━━━━━━━━━━\n\n💰 Equity: ${fmt(equity)} USDT`;
  const totalMargin = positions.reduce((a, p) => a + p.marginSize, 0);
  const totalPnl = positions.reduce((a, p) => a + p.unrealizedPL, 0);
  const totalWeight = equity > 0 ? (totalMargin / equity) * 100 : 0;
  const lines = positions.map(p => {
    return `${posHeader(p, '📌 보유 포지션')}\n\n${positionBody(p, equity)}`;
  });
  return `━━━━━━━━━━━━━━━━━━\n📊 Position Dashboard\n━━━━━━━━━━━━━━━━━━\n\n💰 Equity: ${fmt(equity)} USDT\n💵 총 증거금: ${fmt(totalMargin)} USDT\n📂 보유 포지션: ${positions.length}개\n\n📊 총 시드 비중\n${gauge(totalWeight)}\n${riskLabel(totalWeight)}\n\n${pnlEmoji(totalPnl)} 총 미실현손익: ${sign(totalPnl)} USDT\n\n${lines.join('\n\n')}\n━━━━━━━━━━━━━━━━━━`;
}

export function periodMsg(title: string, trades: ClosedTrade[], equity?: number, exchangeHistory = false): string {
  const sum = trades.reduce((a, t) => a + t.realizedPnl, 0);
  const gross = trades.reduce((a, t) => a + (t.grossPnl ?? t.realizedPnl), 0);
  const fees = trades.reduce((a, t) => a + (t.openFee || 0) + (t.closeFee || 0), 0);
  const funding = trades.reduce((a, t) => a + (t.funding || 0), 0);
  const wins = trades.filter(t => t.realizedPnl > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const roi = equity && equity > 0 ? (sum / equity) * 100 : 0;
  const best = trades.length ? Math.max(...trades.map(t => t.realizedPnl)) : 0;
  const worst = trades.length ? Math.min(...trades.map(t => t.realizedPnl)) : 0;
  return `━━━━━━━━━━━━━━━━━━\n${title}\n━━━━━━━━━━━━━━━━━━\n\n기준: ${exchangeHistory ? 'Bitget 히스토리' : '봇 감지 기록'}\n청산 거래: ${trades.length}개\n승률: ${pct(winRate)}\n\n${pnlEmoji(sum)} 실현손익: ${sign(sum)} USDT${equity ? `\n📊 계좌 대비: ${sign(roi)}%` : ''}${exchangeHistory ? `\n\n총 PnL: ${sign(gross)} USDT\n수수료: -${fmt(fees)} USDT\n펀딩: ${sign(funding)} USDT` : ''}\n\n🏆 최고 손익: ${sign(best)} USDT\n🛑 최저 손익: ${sign(worst)} USDT\n━━━━━━━━━━━━━━━━━━`;
}

export function historyMsg(trades: ClosedTrade[]): string {
  if (!trades.length) return '📭 최근 청산 기록 없음';
  const recent = trades.slice(-10).reverse();
  return `━━━━━━━━━━━━━━━━━━\n🧾 최근 청산 기록\n━━━━━━━━━━━━━━━━━━\nBitget 최근 30일 기준\n\n${recent.map(t => `${sideEmoji(t.side)} ${t.symbol} ${sideLabel(t.side)}\n${pnlEmoji(t.realizedPnl)} 손익: ${sign(t.realizedPnl)} USDT\n진입 ${fmt(t.avgPrice, 6)} → 청산 ${fmt(t.closePrice, 6)}\n보유 ${duration(t.closedAt - t.openedAt)}${t.source === 'bitget' ? ` · 수수료 -${fmt((t.openFee || 0) + (t.closeFee || 0))}` : ` · 최대비중 ${pct(t.maxWeightPct)}`}`).join('\n\n')}\n━━━━━━━━━━━━━━━━━━`;
}

export function equityMsg(equity: number, points: { at: number; equity: number }[]): string {
  const first = points[0]?.equity ?? equity;
  const change = equity - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  return `━━━━━━━━━━━━━━━━━━\n💰 Equity\n━━━━━━━━━━━━━━━━━━\n\n현재: ${fmt(equity)} USDT\n기록 시작 대비: ${sign(change)} USDT (${sign(changePct)}%)\n저장 포인트: ${points.length}개\n━━━━━━━━━━━━━━━━━━`;
}

export function helpMsg(): string {
  return `━━━━━━━━━━━━━━━━━━\n🤖 Position Share Bot 명령어\n━━━━━━━━━━━━━━━━━━\n\n/status 현재 포지션\n/positions 현재 포지션 alias\n/today 오늘 청산 손익\n/week 최근 7일 청산 손익\n/month 최근 30일 청산 손익\n/history Bitget 최근 30일 청산 10개\n/equity 계좌 Equity 요약\n/chatid 현재 방 chat_id 확인\n/resetstate 봇 저장 기록 초기화\n━━━━━━━━━━━━━━━━━━`;
}

export function resetMsg(openCount: number): string {
  return `🧹 봇 저장 기록 초기화 완료\n\n기존 추적 포지션: ${openCount}개\n청산 기록/Equity 기록을 비웠습니다.\n다음 스캔부터 현재 포지션을 새 기준으로 잡습니다.`;
}
