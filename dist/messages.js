import { gauge, holdTime, money, n, pct, pnlIcon, sideIcon } from './utils/format.js';
function marginRatio(p, equity) { return equity > 0 ? (p.marginSize / equity) * 100 : 0; }
function pnlRate(p) { return p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0; }
function closeTitle(pnl) { return pnl >= 0 ? '🎉 익절' : '🛑 손절'; }
export function online(account, count) {
    return [
        '✅ Position Share Bot Online',
        '',
        `거래소: Bitget USDT Futures`,
        `Equity: ${n(account.equity, 2)} USDT`,
        `오픈 포지션: ${count}개`,
        '',
        '명령어: /status /today /week /month /history /equity /help'
    ].join('\n');
}
export function help() {
    return [
        '🧭 명령어',
        '',
        '/status  현재 포지션',
        '/today   오늘 손익',
        '/week    최근 7일 손익',
        '/month   최근 30일 손익',
        '/history 최근 청산 기록',
        '/equity  계좌 상태',
        '/resetstate 현재 포지션 기준값 초기화'
    ].join('\n');
}
export function equity(account) {
    return [
        '💰 계좌 상태',
        '',
        `Equity: ${n(account.equity, 2)} USDT`,
        `사용 가능: ${n(account.available, 2)} USDT`
    ].join('\n');
}
export function statusSummary(account, positions) {
    const totalMargin = positions.reduce((s, p) => s + p.marginSize, 0);
    const totalRatio = account.equity > 0 ? (totalMargin / account.equity) * 100 : 0;
    const totalPnl = positions.reduce((s, p) => s + p.unrealizedPL, 0);
    return [
        '📊 현재 포지션 요약',
        '',
        `💰 Equity: ${n(account.equity, 2)} USDT`,
        `📦 보유: ${positions.length}개`,
        `💵 총 증거금: ${n(totalMargin, 2)} USDT (${n(totalRatio, 2)}%)`,
        `💸 총 미실현: ${pnlIcon(totalPnl)} ${money(totalPnl)}`,
        '',
        positions.length ? '종목별 상세는 아래 메시지로 나눠서 보냄.' : '현재 보유 포지션 없음.'
    ].join('\n');
}
export function positionCard(p, equity) {
    const r = marginRatio(p, equity);
    const pnlR = pnlRate(p);
    return [
        `${sideIcon(p.side)} | ${p.symbol}`,
        '━━━━━━━━━━━━━━',
        `평균가: ${n(p.averageOpenPrice, 6)}`,
        `현재가: ${n(p.markPrice, 6)}`,
        `수량: ${n(p.total, 6)} | 레버리지: ${n(p.leverage, 0)}x`,
        `증거금: ${n(p.marginSize, 2)} USDT`,
        `비중: ${gauge(r)}`,
        `손익: ${pnlIcon(p.unrealizedPL)} ${money(p.unrealizedPL)} (${pct(pnlR)})`,
        `보유: ${holdTime(Date.now() - p.openedAt)}`
    ].join('\n');
}
export function openEvent(p, equity) {
    return [
        `🚀 신규진입 | ${sideIcon(p.side)} | ${p.symbol}`,
        '━━━━━━━━━━━━━━',
        `진입가: ${n(p.averageOpenPrice, 6)}`,
        `현재가: ${n(p.markPrice, 6)}`,
        `수량: ${n(p.total, 6)} | 레버리지: ${n(p.leverage, 0)}x`,
        `증거금: ${n(p.marginSize, 2)} USDT`,
        `시드 비중: ${gauge(marginRatio(p, equity))}`,
        `미실현: ${pnlIcon(p.unrealizedPL)} ${money(p.unrealizedPL)} (${pct(pnlRate(p))})`
    ].join('\n');
}
export function addEvent(prev, cur, equity) {
    const addedMargin = cur.marginSize - prev.marginSize;
    const addedSize = cur.total - prev.total;
    const addRatio = equity > 0 ? (addedMargin / equity) * 100 : 0;
    return [
        `➕ 추가진입 ${cur.addCount}차 | ${sideIcon(cur.side)} | ${cur.symbol}`,
        '━━━━━━━━━━━━━━',
        `평균가: ${n(prev.averageOpenPrice, 6)} → ${n(cur.averageOpenPrice, 6)}`,
        `현재가: ${n(cur.markPrice, 6)}`,
        `추가 수량: ${n(addedSize, 6)}`,
        `총 수량: ${n(cur.total, 6)}`,
        `추가 증거금: ${n(addedMargin, 2)} USDT (${pct(addRatio)})`,
        `총 증거금: ${n(cur.marginSize, 2)} USDT`,
        `현재 비중: ${gauge(marginRatio(cur, equity))}`,
        `미실현: ${pnlIcon(cur.unrealizedPL)} ${money(cur.unrealizedPL)} (${pct(pnlRate(cur))})`
    ].join('\n');
}
export function reduceEvent(prev, cur, equity) {
    const reducedSize = prev.total - cur.total;
    return [
        `➖ 부분청산 | ${sideIcon(cur.side)} | ${cur.symbol}`,
        '━━━━━━━━━━━━━━',
        `축소 수량: ${n(reducedSize, 6)}`,
        `총 수량: ${n(prev.total, 6)} → ${n(cur.total, 6)}`,
        `증거금: ${n(prev.marginSize, 2)} → ${n(cur.marginSize, 2)} USDT`,
        `현재가: ${n(cur.markPrice, 6)}`,
        `현재 비중: ${gauge(marginRatio(cur, equity))}`,
        `현재 미실현: ${pnlIcon(cur.unrealizedPL)} ${money(cur.unrealizedPL)} (${pct(pnlRate(cur))})`
    ].join('\n');
}
export function closeEvent(prev, realizedEstimate) {
    return [
        `${closeTitle(realizedEstimate)} | ${sideIcon(prev.side)} | ${prev.symbol}`,
        '━━━━━━━━━━━━━━',
        `손익 금액: ${pnlIcon(realizedEstimate)} ${money(realizedEstimate)}`,
        `평균가: ${n(prev.averageOpenPrice, 6)}`,
        `마지막 현재가: ${n(prev.markPrice, 6)}`,
        `보유시간: ${holdTime(Date.now() - prev.openedAt)}`,
        `최대 비중: ${n(prev.maxMarginRatio, 2)}%`,
        '',
        realizedEstimate < 0 ? '손절 금액 표기 완료.' : '익절 금액 표기 완료.'
    ].join('\n');
}
export function period(title, items, equity) {
    const profits = items.map((x) => Number(x.netProfit ?? x.realized ?? x.pnl ?? 0));
    const total = profits.reduce((a, b) => a + b, 0);
    const wins = profits.filter(x => x > 0).length;
    const rate = profits.length ? (wins / profits.length) * 100 : 0;
    return [
        title,
        '━━━━━━━━━━━━━━',
        `청산 거래: ${profits.length}개`,
        `승률: ${pct(rate)}`,
        `실현손익: ${pnlIcon(total)} ${money(total)}`,
        `계좌 대비: ${equity > 0 ? pct((total / equity) * 100) : '+0%'}`
    ].join('\n');
}
export function history(items) {
    const rows = items.slice(0, 10).map((x, i) => {
        const pnl = Number(x.netProfit ?? x.realized ?? x.pnl ?? 0);
        return `${i + 1}. ${x.symbol ?? '-'} ${x.side ?? ''} | ${pnlIcon(pnl)} ${money(pnl)}`;
    });
    return ['📚 최근 청산 기록', '━━━━━━━━━━━━━━', ...(rows.length ? rows : ['기록 없음'])].join('\n');
}
