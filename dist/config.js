import 'dotenv/config';
function first(names, fallback = '') {
    for (const name of names) {
        const v = process.env[name];
        if (v && v.trim())
            return v.trim();
    }
    if (fallback)
        return fallback;
    throw new Error(`Missing env: ${names.join(' or ')}`);
}
function optional(name, fallback = '') {
    return (process.env[name] || fallback).trim();
}
function num(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}
export const config = {
    telegram: {
        token: first(['TELEGRAM_BOT_TOKEN']),
        chatId: optional('TELEGRAM_CHAT_ID'),
        allowedUserIds: optional('TELEGRAM_ALLOWED_USER_IDS')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean),
    },
    bitget: {
        apiKey: first(['BITGET_API_KEY']),
        apiSecret: first(['BITGET_API_SECRET', 'BITGET_SECRET_KEY']),
        passphrase: first(['BITGET_API_PASSPHRASE', 'BITGET_PASSPHRASE']),
        productType: optional('BITGET_PRODUCT_TYPE', 'USDT-FUTURES'),
        marginCoin: optional('BITGET_MARGIN_COIN', 'USDT'),
        baseUrl: optional('BITGET_BASE_URL', 'https://api.bitget.com'),
    },
    bot: {
        pollIntervalMs: num('POLL_INTERVAL_MS', 3000),
        pnlUpdateIntervalMs: num('PNL_UPDATE_INTERVAL_MS', 60000),
        pnlUpdateThresholdUsdt: num('PNL_UPDATE_THRESHOLD_USDT', 5),
        timezone: optional('TIMEZONE', 'Asia/Seoul'),
    },
};
