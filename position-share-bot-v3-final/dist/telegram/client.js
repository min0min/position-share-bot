export class TelegramClient {
    token;
    base;
    constructor(token) {
        this.token = token;
        this.base = `https://api.telegram.org/bot${token}`;
    }
    async sendMessage(chatId, text) {
        const res = await fetch(`${this.base}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok)
            throw new Error(`Telegram sendMessage failed: ${res.status} ${JSON.stringify(json)}`);
    }
    async getUpdates(offset) {
        const params = new URLSearchParams({ timeout: '1', allowed_updates: JSON.stringify(['message']) });
        if (offset)
            params.set('offset', String(offset));
        const res = await fetch(`${this.base}/getUpdates?${params.toString()}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok)
            throw new Error(`Telegram getUpdates failed: ${res.status} ${JSON.stringify(json)}`);
        return json.result ?? [];
    }
}
