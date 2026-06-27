import { gauge, holdTime, line, money, n, pct, pnlIcon, sideIcon, smallLine, symbolBase } from './utils/format.js';
function marginRatio(p, equity) { return equity > 0 ? (p.marginSize / equity) * 100 : 0; }
function pnlRate(p) { return p.marginSize > 0 ? (p.unrealizedPL / p.marginSize) * 100 : 0; }
function emojiForClose(pnl) { return pnl >= 0 ? '🎉 익절' : '🛑 손절'; }
export function online(account, count) {
    return [
        line,
        '🤖 POSITION SHARE BOT ONLINE',
        line,
        '',
        '🟢 거래소',
        'Bitget USDT Futures',
        '',
        '💰 Equity',
        `${n(account.equity, 2)} USDT`,
        '',
        '📂 오픈 포지션',
        `${count}개`,
        '',
        smallLine,
        '명령어: /status /today /week /month /history /equity /help'
    ].join('\n');
}
export function help() {
    return [
        line,
        '🧭 COMMANDS',
        line,
        '/status  현재 포지션',
        '/today   오늘 손익',
        '/week    최근 7일 손익',
        '/month   최근 30일 손익',
        '/history 최근 청산 기록',
        '/equity  계좌 상태',
        '/positions 현재 포지션',
        '/resetstate 상태 초기화'
    ].join('\n');
}
export function equity(account) {
    return [
        line,
        '💰 EQUITY',
        line,
        '',
        '계좌 Equity',
        `${n(account.equity, 2)} USDT`,
        '',
        '사용 가능 금액',
        `${n(account.available, 2)} USDT`
    ].join('\n');
}
export function status(account, positions) {
    const totalMargin = positions.reduce((s, p) => s + p.marginSize, 0);
    const totalRatio = account.equity > 0 ? (totalMargin / account.equity) * 100 : 0;
    const totalPnl = positions.reduce((s, p) => s + p.unrealizedPL, 0);
    const header = [
        line,
        '📊 POSITION DASHBOARD',
        line,
        '',
        '💰 Equity',
        `${n(account.equity, 2)} USDT`,
        '',
        '💵 총 사용 증거금',
        `${n(totalMargin, 2)} USDT`,
        '',
        '📦 총 시드 비중',
        gauge(totalRatio),
        '',
        '💸 총 미실현 손익',
        `${pnlIcon(totalPnl)} ${money(totalPnl)}`,
        '',
        '📂 보유 포지션',
        `${positions.length}개`,
        line
    ];
    if (positions.length === 0)
        return [...header, '', '현재 보유 포지션 없음'].join('\n');
    return [...header, ...positions.map(p => positionCard(p, account.equity))].join('\n\n');
}
export function positionCard(p, equity) {
    const r = marginRatio(p, equity);
    const pnlR = pnlRate(p);
    return [
        `${sideIcon(p.side)}`,
        `💎 ${symbolBase(p.symbol)}USDT`,
        smallLine,
        '',
        '💰 평균가',
        `${n(p.averageOpenPrice, 6)}`,
        '',
        '📍 현재가',
        `${n(p.markPrice, 6)}`,
        '',
        '📦 수량',
        `${n(p.total, 6)}`,
        '',
        '⚡ 레버리지',
        `${n(p.leverage, 0)}x`,
        '',
        '💵 증거금',
        `${n(p.marginSize, 2)} USDT`,
        '',
        '📊 시드 비중',
        gauge(r),
        '',
        '📉 미실현 손익',
        `${pnlIcon(p.unrealizedPL)} ${money(p.unrealizedPL)} (${pct(pnlR)})`,
        '',
        '⏱ 보유시간',
        holdTime(Date.now() - p.openedAt),
        '',
        line
    ].join('\n');
}
export function openEvent(p, equity) {
    return [
        line,
        '🚀 신규 진입',
        line,
        '',
        sideIcon(p.side),
        `💎 ${p.symbol}`,
        smallLine,
        '',
        '💰 진입가',
        n(p.averageOpenPrice, 6),
        '',
        '📍 현재가',
        n(p.markPrice, 6),
        '',
        '📦 수량',
        n(p.total, 6),
        '',
        '⚡ 레버리지',
        `${n(p.leverage, 0)}x`,
        '',
        '💵 증거금',
        `${n(p.marginSize, 2)} USDT`,
        '',
        '📊 시드 비중',
        gauge(marginRatio(p, equity)),
        line
    ].join('\n');
}
export function addEvent(prev, cur, equity) {
    const addedMargin = cur.marginSize - prev.marginSize;
    const addRatio = equity > 0 ? (addedMargin / equity) * 100 : 0;
    return [
        line,
        '➕ 추가진입',
        line,
        '',
        `${sideIcon(cur.side)}`,
        `💎 ${cur.symbol}`,
        smallLine,
        '',
        '📌 추가진입 회차',
        `${cur.addCount}차`,
        '',
        '💰 평균가 변화',
        `${n(prev.averageOpenPrice, 6)} → ${n(cur.averageOpenPrice, 6)}`,
        '',
        '📦 수량 변화',
        `${n(prev.total, 6)} → ${n(cur.total, 6)}`,
        '',
        '💵 추가 증거금',
        `${n(addedMargin, 2)} USDT`,
        '',
        '📊 추가 비중',
        pct(addRatio),
        '',
        '📦 현재 총 비중',
        gauge(marginRatio(cur, equity)),
        line
    ].join('\n');
}
export function reduceEvent(prev, cur, equity) {
    return [
        line,
        '➖ 부분청산 / 포지션 축소',
        line,
        '',
        sideIcon(cur.side),
        `💎 ${cur.symbol}`,
        smallLine,
        '',
        '📦 수량 변화',
        `${n(prev.total, 6)} → ${n(cur.total, 6)}`,
        '',
        '💵 증거금 변화',
        `${n(prev.marginSize, 2)} → ${n(cur.marginSize, 2)} USDT`,
        '',
        '📊 현재 비중',
        gauge(marginRatio(cur, equity)),
        '',
        '📉 현재 미실현 손익',
        `${pnlIcon(cur.unrealizedPL)} ${money(cur.unrealizedPL)} (${pct(pnlRate(cur))})`,
        line
    ].join('\n');
}
export function closeEvent(prev, realizedEstimate) {
    return [
        line,
        emojiForClose(realizedEstimate),
        line,
        '',
        sideIcon(prev.side),
        `💎 ${prev.symbol}`,
        smallLine,
        '',
        '💵 실현/손절 추정금액',
        `${pnlIcon(realizedEstimate)} ${money(realizedEstimate)}`,
        '',
        '⏱ 보유시간',
        holdTime(Date.now() - prev.openedAt),
        '',
        '📊 최대 시드 비중',
        `${n(prev.maxMarginRatio, 2)}%`,
        '',
        '💰 평균 진입가',
        n(prev.averageOpenPrice, 6),
        '',
        '📍 마지막 현재가',
        n(prev.markPrice, 6),
        line
    ].join('\n');
}
export function period(title, items, equity) {
    const profits = items.map((x) => Number(x.netProfit ?? x.realized ?? x.pnl ?? 0));
    const total = profits.reduce((a, b) => a + b, 0);
    const wins = profits.filter(x => x > 0).length;
    const rate = profits.length ? (wins / profits.length) * 100 : 0;
    return [
        line,
        title,
        line,
        '',
        '청산 거래',
        `${profits.length}개`,
        '',
        '승률',
        pct(rate),
        '',
        '실현손익',
        `${pnlIcon(total)} ${money(total)}`,
        '',
        '계좌 대비',
        equity > 0 ? pct((total / equity) * 100) : '+0%'
    ].join('\n');
}
export function history(items) {
    const rows = items.slice(0, 10).map((x, i) => {
        const pnl = Number(x.netProfit ?? x.realized ?? x.pnl ?? 0);
        return `${i + 1}. ${x.symbol ?? '-'} ${x.side ?? ''} · ${pnlIcon(pnl)} ${money(pnl)}`;
    });
    return [line, '📚 HISTORY', line, '', ...(rows.length ? rows : ['기록 없음'])].join('\n');
}
