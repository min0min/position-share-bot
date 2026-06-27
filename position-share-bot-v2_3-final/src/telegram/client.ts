import { config } from '../config.js';

export type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; title?: string; type: string };
    from?: { id: number; first_name?: string; username?: string };
  };
};

export class TelegramClient {
  private base = `https://api.telegram.org/bot${config.telegram.token}`;

  async sendMessage(text: string, chatId = config.telegram.chatId): Promise<void> {
    if (!chatId) {
      console.log('[telegram] TELEGRAM_CHAT_ID empty. Message skipped:', text);
      return;
    }
    const res = await fetch(`${this.base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) throw new Error(`Telegram sendMessage failed: ${res.status} ${await res.text()}`);
  }

  async getUpdates(offset?: number): Promise<TgUpdate[]> {
    const url = new URL(`${this.base}/getUpdates`);
    url.searchParams.set('timeout', '0');
    if (offset) url.searchParams.set('offset', String(offset));
    const res = await fetch(url);
    const json = await res.json() as { ok: boolean; result: TgUpdate[]; description?: string };
    if (!json.ok) throw new Error(`Telegram getUpdates failed: ${json.description}`);
    return json.result;
  }
}
