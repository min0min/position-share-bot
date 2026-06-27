export const line = '━━━━━━━━━━━━━━━━━━';
export const smallLine = '──────────────';
export function n(value, digits = 4) {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num))
        return '0';
    if (Math.abs(num) >= 1000)
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (Math.abs(num) >= 1)
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return Number(num.toFixed(digits)).toString();
}
export function money(value) {
    const num = Number(value ?? 0);
    const sign = num > 0 ? '+' : '';
    return `${sign}${n(num, 2)} USDT`;
}
export function pct(value) {
    const num = Number(value ?? 0);
    const sign = num > 0 ? '+' : '';
    return `${sign}${n(num, 2)}%`;
}
export function gauge(percent, blocks = 10) {
    const p = Math.max(0, Math.min(100, percent));
    const filled = Math.min(blocks, Math.round((p / 30) * blocks));
    const empty = blocks - filled;
    return `${'🟩'.repeat(filled)}${'⬜'.repeat(empty)} ${n(p, 2)}%`;
}
export function pnlIcon(v) {
    if (v > 0)
        return '🟢';
    if (v < 0)
        return '🔴';
    return '⚪';
}
export function sideIcon(side) {
    return side.toLowerCase().includes('short') || side.toLowerCase() === 'sell' ? '🔴📉 SHORT' : '🟢📈 LONG';
}
export function symbolBase(symbol) {
    return symbol.replace(/USDT$/i, '');
}
export function holdTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0)
        return '0분';
    const m = Math.floor(ms / 60000);
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const min = m % 60;
    if (d > 0)
        return `${d}일 ${h}시간`;
    if (h > 0)
        return `${h}시간 ${min}분`;
    return `${min}분`;
}
