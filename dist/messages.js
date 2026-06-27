import { duration, fmt, gauge, pct, pnlEmoji, riskLabel, sideEmoji, sideLabel, sign } from './utils/format.js';
function weightOf(p, equity) {
    return equity > 0 ? (p.marginSize / equity) * 100 : 0;
}
function positionTitle(p) {
    return `${sideEmoji(p.side)} ${p.symbol} ${sideLabel(p.side)}`;
}
function priceBlock(p) {
    return `진입평균가: ${fmt(p.avgPrice, 6)}\n현재가: ${fmt(p.markPrice, 6)}`;
}
export function onlineMsg(equity, openCount) {
    return `✅ Position Share Bot Online\n\n거래소: Bitget USDT Futures\n계좌 Equity: ${fmt(equity)} USDT\n오픈 포지션: ${openCount}개\n\n명령어\n/status /today /week /month\n/history /equity /help`;
}
export function openMsg(p, equity) {
    const weight = weightOf(p, equity);
    const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
    return `━━━━━━━━━━━━━━\n🚀 신규 진입 · ${sideLabel(p.side)}\n━━━━━━━━━━━━━━\n\n${positionTitle(p)}\n\n${priceBlock(p)}\n수량: ${fmt(p.total, 6)}\n레버리지: ${fmt(p.leverage, 0)}x\n\n💰 계좌 Equity: ${fmt(equity)} USDT\n💵 사용 증거금: ${fmt(p.marginSize)} USDT\n📊 시드 비중: ${pct(weight)}\n${gauge(weight)}\n\n${pnlEmoji(p.unrealizedPL)} 미실현손익: ${sign(p.unrealizedPL)} USDT (${sign(roi)}%)\n⚠️ 리스크: ${riskLabel(weight)}\n━━━━━━━━━━━━━━`;
}
export function addMsg(prev, cur, equity) {
    const prevWeight = weightOf(prev, equity);
    const curWeight = weightOf(cur, equity);
    const addMargin = cur.marginSize - prev.marginSize;
    const addWeight = curWeight - prevWeight;
    const addQty = cur.total - prev.total;
    const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
    return `━━━━━━━━━━━━━━\n➕ 추가진입 · ${sideLabel(cur.side)}\n━━━━━━━━━━━━━━\n\n${positionTitle(cur)}\n추가진입: ${cur.addCount}회차\n\n기존 비중: ${pct(prevWeight)}\n추가 비중: +${pct(Math.max(addWeight, 0))}\n현재 총 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n추가 수량: +${fmt(Math.max(addQty, 0), 6)}\n추가 증거금: +${fmt(Math.max(addMargin, 0))} USDT\n총 증거금: ${fmt(cur.marginSize)} USDT\n\n평균가 변화\n${fmt(prev.avgPrice, 6)} → ${fmt(cur.avgPrice, 6)}\n현재가: ${fmt(cur.markPrice, 6)}\n\n${pnlEmoji(cur.unrealizedPL)} 미실현손익: ${sign(cur.unrealizedPL)} USDT (${sign(roi)}%)\n⚠️ 리스크: ${riskLabel(curWeight)}\n━━━━━━━━━━━━━━`;
}
export function reduceMsg(prev, cur, equity) {
    const prevWeight = weightOf(prev, equity);
    const curWeight = weightOf(cur, equity);
    const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
    return `━━━━━━━━━━━━━━\n➖ 포지션 축소 · ${sideLabel(cur.side)}\n━━━━━━━━━━━━━━\n\n${positionTitle(cur)}\n\n기존 수량: ${fmt(prev.total, 6)}\n현재 수량: ${fmt(cur.total, 6)}\n\n기존 비중: ${pct(prevWeight)}\n현재 비중: ${pct(curWeight)}\n${gauge(curWeight)}\n\n현재가: ${fmt(cur.markPrice, 6)}\n실현/누적손익: ${sign(cur.achievedProfits)} USDT\n${pnlEmoji(cur.unrealizedPL)} 미실현손익: ${sign(cur.unrealizedPL)} USDT (${sign(roi)}%)\n━━━━━━━━━━━━━━`;
}
export function pnlUpdateMsg(p, equity) {
    const weight = weightOf(p, equity);
    const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
    return `📡 포지션 업데이트\n\n${positionTitle(p)}\n${priceBlock(p)}\n수량: ${fmt(p.total, 6)} · 레버리지 ${fmt(p.leverage, 0)}x\n\n📊 비중: ${pct(weight)}\n${gauge(weight)}\n${pnlEmoji(p.unrealizedPL)} 미실현손익: ${sign(p.unrealizedPL)} USDT (${sign(roi)}%)\n⚠️ 리스크: ${riskLabel(weight)}`;
}
export function closeMsg(prev, equity, realizedPnl) {
    const accountRoi = equity > 0 ? (realizedPnl / equity) * 100 : 0;
    return `━━━━━━━━━━━━━━\n✅ 전체 청산 · ${sideLabel(prev.side)}\n━━━━━━━━━━━━━━\n\n${positionTitle(prev)}\n진입평균가: ${fmt(prev.avgPrice, 6)}\n청산 기준가: ${fmt(prev.markPrice, 6)}\n\n${pnlEmoji(realizedPnl)} 실현손익: ${sign(realizedPnl)} USDT\n계좌 대비: ${sign(accountRoi)}%\n보유시간: ${duration(Date.now() - prev.openedAt)}\n최대 비중: ${pct(prev.maxWeightPct)}\n추가진입: ${prev.addCount}회\n━━━━━━━━━━━━━━`;
}
export function statusMsg(positions, equity) {
    if (!positions.length)
        return `📭 현재 오픈 포지션 없음\n\n💰 Equity: ${fmt(equity)} USDT`;
    const totalMargin = positions.reduce((a, p) => a + p.marginSize, 0);
    const totalPnl = positions.reduce((a, p) => a + p.unrealizedPL, 0);
    const totalWeight = equity > 0 ? (totalMargin / equity) * 100 : 0;
    const lines = positions.map(p => {
        const weight = weightOf(p, equity);
        const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
        return `${positionTitle(p)}\n${priceBlock(p)}\n수량: ${fmt(p.total, 6)} · 레버리지 ${fmt(p.leverage, 0)}x\n증거금: ${fmt(p.marginSize)} USDT\n\n📊 시드 비중: ${pct(weight)}\n${gauge(weight)}\n${pnlEmoji(p.unrealizedPL)} 미실현손익: ${sign(p.unrealizedPL)} USDT (${sign(roi)}%)\n보유시간: ${duration(Date.now() - p.openedAt)}`;
    });
    return `📊 현재 포지션\n\n💰 Equity: ${fmt(equity)} USDT\n💵 총 증거금: ${fmt(totalMargin)} USDT\n📊 총 비중: ${pct(totalWeight)}\n${gauge(totalWeight)}\n${pnlEmoji(totalPnl)} 총 미실현: ${sign(totalPnl)} USDT\n⚠️ 리스크: ${riskLabel(totalWeight)}\n\n${lines.join('\n\n━━━━━━━━━━━━━━\n\n')}`;
}
export function periodMsg(title, trades, equity, exchangeHistory = false) {
    const sum = trades.reduce((a, t) => a + t.realizedPnl, 0);
    const gross = trades.reduce((a, t) => a + (t.grossPnl ?? t.realizedPnl), 0);
    const fees = trades.reduce((a, t) => a + (t.openFee || 0) + (t.closeFee || 0), 0);
    const funding = trades.reduce((a, t) => a + (t.funding || 0), 0);
    const wins = trades.filter(t => t.realizedPnl > 0).length;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    const roi = equity && equity > 0 ? (sum / equity) * 100 : 0;
    const best = trades.length ? Math.max(...trades.map(t => t.realizedPnl)) : 0;
    const worst = trades.length ? Math.min(...trades.map(t => t.realizedPnl)) : 0;
    return `${title}\n${exchangeHistory ? 'Bitget 히스토리 기준' : '봇 감지 기록 기준'}\n\n청산 거래: ${trades.length}개\n승률: ${pct(winRate)}\n${pnlEmoji(sum)} 실현손익: ${sign(sum)} USDT${equity ? `\n계좌 대비: ${sign(roi)}%` : ''}${exchangeHistory ? `\n\n총 PnL: ${sign(gross)} USDT\n수수료: -${fmt(fees)} USDT\n펀딩: ${sign(funding)} USDT` : ''}\n\n최고 손익: ${sign(best)} USDT\n최저 손익: ${sign(worst)} USDT`;
}
export function historyMsg(trades) {
    if (!trades.length)
        return '📭 최근 청산 기록 없음';
    const recent = trades.slice(-10).reverse();
    return `🧾 최근 청산 기록\nBitget 최근 30일 기준\n\n${recent.map(t => `${sideEmoji(t.side)} ${t.symbol} ${sideLabel(t.side)}\n${pnlEmoji(t.realizedPnl)} 손익 ${sign(t.realizedPnl)} USDT\n진입 ${fmt(t.avgPrice, 6)} → 청산 ${fmt(t.closePrice, 6)}\n보유 ${duration(t.closedAt - t.openedAt)}${t.source === 'bitget' ? ` · 수수료 -${fmt((t.openFee || 0) + (t.closeFee || 0))}` : ` · 최대비중 ${pct(t.maxWeightPct)}`}`).join('\n\n')}`;
}
export function equityMsg(equity, points) {
    const first = points[0]?.equity ?? equity;
    const change = equity - first;
    const changePct = first > 0 ? (change / first) * 100 : 0;
    return `💰 Equity\n\n현재: ${fmt(equity)} USDT\n기록 시작 대비: ${sign(change)} USDT (${sign(changePct)}%)\n저장 포인트: ${points.length}개`;
}
export function helpMsg() {
    return `🤖 Position Share Bot 명령어\n\n/status 현재 포지션\n/positions 현재 포지션 alias\n/today 오늘 청산 손익\n/week 최근 7일 청산 손익\n/month 최근 30일 청산 손익\n/history Bitget 최근 30일 청산 10개\n/equity 계좌 Equity 요약\n/chatid 현재 방 chat_id 확인\n/resetstate 봇 저장 기록 초기화`;
}
export function resetMsg(openCount) {
    return `🧹 봇 저장 기록 초기화 완료\n\n기존 추적 포지션: ${openCount}개\n청산 기록/Equity 기록을 비웠습니다.\n다음 스캔부터 현재 포지션을 새 기준으로 잡습니다.`;
}
