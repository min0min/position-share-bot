import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}
function optional(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}
function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  telegram: {
    token: required('TELEGRAM_BOT_TOKEN'),
    chatId: optional('TELEGRAM_CHAT_ID'),
    allowedUserIds: optional('TELEGRAM_ALLOWED_USER_IDS')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean),
  },
  bitget: {
    apiKey: required('BITGET_API_KEY'),
    apiSecret: required('BITGET_API_SECRET'),
    passphrase: required('BITGET_API_PASSPHRASE'),
    productType: optional('BITGET_PRODUCT_TYPE', 'USDT-FUTURES'),
    marginCoin: optional('BITGET_MARGIN_COIN', 'USDT'),
    baseUrl: 'https://api.bitget.com',
  },
  bot: {
    pollIntervalMs: num('POLL_INTERVAL_MS', 3000),
    commandIntervalMs: num('COMMAND_INTERVAL_MS', 2500),
    pnlUpdateIntervalMs: num('PNL_UPDATE_INTERVAL_MS', 60000),
    pnlUpdateThresholdUsdt: num('PNL_UPDATE_THRESHOLD_USDT', 5),
    timezone: optional('TIMEZONE', 'Asia/Seoul'),
  },
};
