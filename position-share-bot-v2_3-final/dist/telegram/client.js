import { config } from '../config.js';
export class TelegramClient {
    base = `https://api.telegram.org/bot${config.telegram.token}`;
    async sendMessage(text, chatId = config.telegram.chatId) {
        if (!chatId) {
            console.log('[telegram] TELEGRAM_CHAT_ID empty. Message skipped:', text);
            return;
        }
        const res = await fetch(`${this.base}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        });
        if (!res.ok)
            throw new Error(`Telegram sendMessage failed: ${res.status} ${await res.text()}`);
    }
    async getUpdates(offset) {
        const url = new URL(`${this.base}/getUpdates`);
        url.searchParams.set('timeout', '0');
        if (offset)
            url.searchParams.set('offset', String(offset));
        const res = await fetch(url);
        const json = await res.json();
        if (!json.ok)
            throw new Error(`Telegram getUpdates failed: ${json.description}`);
        return json.result;
    }
}
