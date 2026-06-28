export type Config = {
  telegramToken: string;
  telegramChatIds: string[];
  bitgetKey: string;
  bitgetSecret: string;
  bitgetPassphrase: string;
  productType: string;
  marginCoin: string;
  scanIntervalMs: number;
};

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v || v.trim() === '') throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function envAny(names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  throw new Error(`Missing env: ${names.join(' or ')}`);
}

export const config: Config = {
  telegramToken: env('TELEGRAM_BOT_TOKEN'),
  telegramChatIds: envAny(['TELEGRAM_CHAT_IDS', 'TELEGRAM_CHAT_ID']).split(',').map(x => x.trim()).filter(Boolean),
  bitgetKey: env('BITGET_API_KEY'),
  bitgetSecret: envAny(['BITGET_API_SECRET', 'BITGET_SECRET_KEY']),
  bitgetPassphrase: envAny(['BITGET_API_PASSPHRASE', 'BITGET_PASSPHRASE']),
  productType: env('BITGET_PRODUCT_TYPE', 'USDT-FUTURES'),
  marginCoin: env('BITGET_MARGIN_COIN', 'USDT'),
  scanIntervalMs: Number(process.env.SCAN_INTERVAL_MS ?? 2000)
};
