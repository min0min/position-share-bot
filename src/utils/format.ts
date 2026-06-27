export function n(value: unknown, digits = 2): number {
  const x = Number(value);
  return Number.isFinite(x) ? x : 0;
}

export function fmt(value: unknown, digits = 2): string {
  const x = n(value);
  return x.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function sign(value: number, digits = 2): string {
  const s = value >= 0 ? '+' : '';
  return `${s}${fmt(value, digits)}`;
}

export function pct(value: number, digits = 2): string {
  return `${fmt(value, digits)}%`;
}

export function sideEmoji(side: string): string {
  return side.toLowerCase() === 'long' ? '🟢📈' : '🔴📉';
}

export function sideLabel(side: string): string {
  return side.toLowerCase() === 'long' ? 'LONG' : 'SHORT';
}

export function pnlEmoji(value: number): string {
  return value >= 0 ? '🟢' : '🔴';
}

export function pnlLabel(value: number): string {
  return value >= 0 ? '수익' : '손실';
}

export function riskLabel(weightPct: number): string {
  if (weightPct < 5) return '🟢 SAFE / 안정';
  if (weightPct < 10) return '🟡 NORMAL / 보통';
  if (weightPct < 15) return '🟠 CAUTION / 주의';
  return '🔴 DANGER / 위험';
}

export function gauge(weightPct: number): string {
  // 30% 비중을 10칸 만땅 기준으로 보여준다. 20%대도 과하게 꽉 차 보이지 않게 조정.
  const filled = Math.max(0, Math.min(10, Math.round((weightPct / 30) * 10)));
  return `${'🟩'.repeat(filled)}${'⬜'.repeat(10 - filled)} ${pct(weightPct)}`;
}

export function duration(ms: number): string {
  if (ms <= 0) return '-';
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}일 ${h % 24}시간`;
  if (h > 0) return `${h}시간 ${m % 60}분`;
  return `${m}분`;
}
