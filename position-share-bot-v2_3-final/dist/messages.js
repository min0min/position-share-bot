import { duration, fmt, gauge, pct, pnlEmoji, riskLabel, sideEmoji, sideLabel, sign } from './utils/format.js';
const LINE = '━━━━━━━━━━━━━━━━━━';
const THIN = '──────────────';
function weightOf(p, equity) {
    return equity > 0 ? (p.marginSize / equity) * 100 : 0;
}
function coin(symbol) {
    return symbol.replace(/USDT$/i, '');
}
function fullSymbol(symbol) {
    return symbol.includes('USDT') ? symbol : `${symbol}USDT`;
}
function direction(p) {
    return `${sideEmoji(p.side)} ${sideLabel(p.side)}`;
}
function pnlBlock(value, roi, title = '손익') {
    const roiText = roi === undefined ? '' : `\n📊 ROI: ${sign(roi)}%`;
    return `${pnlEmoji(value)} ${title}\n${pnlEmoji(value)} ${sign(value)} USDT${roiText}`;
}
function riskBlock(weight) {
    return `📊 시드 비중\n${gauge(weight)}\n${riskLabel(weight)}`;
}
function priceBlock(p) {
    return `💰 평균가\n${fmt(p.avgPrice, 6)}\n\n📍 현재가\n${fmt(p.markPrice, 6)}`;
}
function positionCard(p, equity) {
    const weight = weightOf(p, equity);
    const roi = p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0;
    return `${LINE}\n${direction(p)}\n💎 ${fullSymbol(p.symbol)}\n${LINE}\n\n${priceBlock(p)}\n\n📦 수량\n${fmt(p.total, 6)}\n\n⚡ 레버리지\n${fmt(p.leverage, 0)}x\n\n💵 사용 증거금\n${fmt(p.marginSize)} USDT\n\n${riskBlock(weight)}\n\n${pnlBlock(p.unrealizedPL, roi, '미실현 손익')}\n\n⏱ 보유시간\n${duration(Date.now() - p.openedAt)}\n\n➕ 추가진입\n${p.addCount}회`;
}
export function onlineMsg(equity, openCount) {
    return `${LINE}\n✅ POSITION SHARE BOT ONLINE\n${LINE}\n\n🏦 거래소\nBitget USDT Futures\n\n💰 Equity\n${fmt(equity)} USDT\n\n📂 오픈 포지션\n${openCount}개\n\n⌨️ 명령어\n/status /today /week /month\n/history /equity /help\n${LINE}`;
}
export function openMsg(p, equity) {
    return `${LINE}\n🚀 신규 진입 감지\n${LINE}\n\n${direction(p)}\n💎 ${fullSymbol(p.symbol)}\n\n${THIN}\n\n💰 진입 평균가\n${fmt(p.avgPrice, 6)}\n\n📍 현재가\n${fmt(p.markPrice, 6)}\n\n📦 수량\n${fmt(p.total, 6)}\n\n⚡ 레버리지\n${fmt(p.leverage, 0)}x\n\n💵 사용 증거금\n${fmt(p.marginSize)} USDT\n\n${riskBlock(weightOf(p, equity))}\n\n${pnlBlock(p.unrealizedPL, p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0, '현재 미실현')}\n${LINE}`;
}
export function addMsg(prev, cur, equity) {
    const prevWeight = weightOf(prev, equity);
    const curWeight = weightOf(cur, equity);
    const addMargin = Math.max(cur.marginSize - prev.marginSize, 0);
    const addWeight = Math.max(curWeight - prevWeight, 0);
    const addQty = Math.max(cur.total - prev.total, 0);
    const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
    return `${LINE}\n➕ 추가진입 감지\n${LINE}\n\n${direction(cur)}\n💎 ${fullSymbol(cur.symbol)}\n\n🔢 추가진입\n${cur.addCount}회차\n\n${THIN}\n\n💰 평균가 변화\n${fmt(prev.avgPrice, 6)}\n↓\n${fmt(cur.avgPrice, 6)}\n\n📍 현재가\n${fmt(cur.markPrice, 6)}\n\n📦 추가 수량\n+${fmt(addQty, 6)}\n\n💵 추가 증거금\n+${fmt(addMargin)} USDT\n\n📊 비중 변화\n기존 ${pct(prevWeight)} → 현재 ${pct(curWeight)}\n추가 +${pct(addWeight)}\n${gauge(curWeight)}\n${riskLabel(curWeight)}\n\n${pnlBlock(cur.unrealizedPL, roi, '현재 미실현')}\n${LINE}`;
}
export function reduceMsg(prev, cur, equity) {
    const prevWeight = weightOf(prev, equity);
    const curWeight = weightOf(cur, equity);
    const roi = cur.marginSize > 0 ? (cur.unrealizedPL / cur.marginSize) * 100 : 0;
    const reducedQty = Math.max(prev.total - cur.total, 0);
    const realized = cur.achievedProfits - prev.achievedProfits;
    const title = realized < 0 ? '🛑 부분 손절 감지' : '➖ 부분청산 감지';
    const resultTitle = realized < 0 ? '이번 손절 금액' : '이번 청산 손익';
    return `${LINE}\n${title}\n${LINE}\n\n${direction(cur)}\n💎 ${fullSymbol(cur.symbol)}\n\n📦 축소 수량\n-${fmt(reducedQty, 6)}\n\n수량 변화\n${fmt(prev.total, 6)} → ${fmt(cur.total, 6)}\n\n📍 현재가\n${fmt(cur.markPrice, 6)}\n\n📊 비중 변화\n${pct(prevWeight)} → ${pct(curWeight)}\n${gauge(curWeight)}\n${riskLabel(curWeight)}\n\n${realized !== 0 ? `${pnlEmoji(realized)} ${resultTitle}\n${pnlEmoji(realized)} ${sign(realized)} USDT\n\n` : ''}💵 누적 실현손익\n${sign(cur.achievedProfits)} USDT\n\n${pnlBlock(cur.unrealizedPL, roi, '남은 포지션 미실현')}\n${LINE}`;
}
export function pnlUpdateMsg(p, equity) {
    return `${LINE}\n📡 포지션 상태 업데이트\n${LINE}\n\n${positionCard(p, equity)}\n${LINE}`;
}
export function closeMsg(prev, equity, realizedPnl) {
    const accountRoi = equity > 0 ? (realizedPnl / equity) * 100 : 0;
    const isLoss = realizedPnl < 0;
    const title = isLoss ? '🛑 손절 / 전체 청산' : '🎉 익절 / 전체 청산';
    const resultLabel = isLoss ? '손절 금액' : '실현 수익';
    return `${LINE}\n${title}\n${LINE}\n\n${direction(prev)}\n💎 ${fullSymbol(prev.symbol)}\n\n${THIN}\n\n💰 평균 진입가\n${fmt(prev.avgPrice, 6)}\n\n📍 청산 기준가\n${fmt(prev.markPrice, 6)}\n\n${pnlEmoji(realizedPnl)} ${resultLabel}\n${pnlEmoji(realizedPnl)} ${sign(realizedPnl)} USDT\n\n📊 계좌 대비\n${sign(accountRoi)}%\n\n⏱ 보유시간\n${duration(Date.now() - prev.openedAt)}\n\n📈 최대 비중\n${pct(prev.maxWeightPct)}\n\n➕ 추가진입\n${prev.addCount}회\n${LINE}`;
}
export function statusMsg(positions, equity) {
    if (!positions.length)
        return `${LINE}\n📭 현재 오픈 포지션 없음\n${LINE}\n\n💰 Equity\n${fmt(equity)} USDT`;
    const totalMargin = positions.reduce((a, p) => a + p.marginSize, 0);
    const totalPnl = positions.reduce((a, p) => a + p.unrealizedPL, 0);
    const totalWeight = equity > 0 ? (totalMargin / equity) * 100 : 0;
    const cards = positions.map(p => positionCard(p, equity)).join('\n\n');
    return `${LINE}\n📊 POSITION DASHBOARD\n${LINE}\n\n💰 Equity\n${fmt(equity)} USDT\n\n💵 총 사용 증거금\n${fmt(totalMargin)} USDT\n\n📂 보유 포지션\n${positions.length}개\n\n📊 총 시드 비중\n${gauge(totalWeight)}\n${riskLabel(totalWeight)}\n\n${pnlEmoji(totalPnl)} 총 미실현 손익\n${pnlEmoji(totalPnl)} ${sign(totalPnl)} USDT\n\n${cards}\n${LINE}`;
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
    return `${LINE}\n${title}\n${LINE}\n\n📌 기준\n${exchangeHistory ? 'Bitget 히스토리' : '봇 감지 기록'}\n\n📦 청산 거래\n${trades.length}개\n\n🏆 승률\n${pct(winRate)}\n\n${pnlEmoji(sum)} 실현손익\n${pnlEmoji(sum)} ${sign(sum)} USDT${equity ? `\n\n📊 계좌 대비\n${sign(roi)}%` : ''}${exchangeHistory ? `\n\n총 PnL: ${sign(gross)} USDT\n수수료: -${fmt(fees)} USDT\n펀딩: ${sign(funding)} USDT` : ''}\n\n🏆 최고 손익\n${sign(best)} USDT\n\n🛑 최저 손익\n${sign(worst)} USDT\n${LINE}`;
}
export function historyMsg(trades) {
    if (!trades.length)
        return '📭 최근 청산 기록 없음';
    const recent = trades.slice(-10).reverse();
    return `${LINE}\n🧾 최근 청산 기록\n${LINE}\nBitget 최근 30일 기준\n\n${recent.map(t => `${sideEmoji(t.side)} ${fullSymbol(t.symbol)} ${sideLabel(t.side)}\n${pnlEmoji(t.realizedPnl)} 손익: ${sign(t.realizedPnl)} USDT\n진입 ${fmt(t.avgPrice, 6)} → 청산 ${fmt(t.closePrice, 6)}\n보유 ${duration(t.closedAt - t.openedAt)}${t.source === 'bitget' ? ` · 수수료 -${fmt((t.openFee || 0) + (t.closeFee || 0))}` : ` · 최대비중 ${pct(t.maxWeightPct)}`}`).join('\n\n')}\n${LINE}`;
}
export function equityMsg(equity, points) {
    const first = points[0]?.equity ?? equity;
    const change = equity - first;
    const changePct = first > 0 ? (change / first) * 100 : 0;
    return `${LINE}\n💰 EQUITY SUMMARY\n${LINE}\n\n현재 Equity\n${fmt(equity)} USDT\n\n기록 시작 대비\n${pnlEmoji(change)} ${sign(change)} USDT\n${pnlEmoji(change)} ${sign(changePct)}%\n\n저장 포인트\n${points.length}개\n${LINE}`;
}
export function helpMsg() {
    return `${LINE}\n🤖 POSITION SHARE BOT\n${LINE}\n\n/status 현재 포지션\n/positions 현재 포지션 alias\n/today 오늘 청산 손익\n/week 최근 7일 청산 손익\n/month 최근 30일 청산 손익\n/history Bitget 최근 30일 청산 10개\n/equity 계좌 Equity 요약\n/chatid 현재 방 chat_id 확인\n/resetstate 봇 저장 기록 초기화\n${LINE}`;
}
export function resetMsg(openCount) {
    return `${LINE}\n🧹 봇 저장 기록 초기화 완료\n${LINE}\n\n기존 추적 포지션\n${openCount}개\n\n청산 기록 / Equity 기록 초기화 완료\n다음 스캔부터 현재 포지션을 새 기준으로 잡습니다.\n${LINE}`;
}
