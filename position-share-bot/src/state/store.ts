import fs from 'node:fs';
import path from 'node:path';

export type PositionSnapshot = {
  key: string;
  symbol: string;
  side: string;
  marginSize: number;
  total: number;
  leverage: number;
  avgPrice: number;
  markPrice: number;
  unrealizedPL: number;
  achievedProfits: number;
  marginMode: string;
  openedAt: number;
  updatedAt: number;
  maxWeightPct: number;
  addCount: number;
};

export type BotState = {
  positions: Record<string, PositionSnapshot>;
  closedTrades: Array<{
    key: string;
    symbol: string;
    side: string;
    realizedPnl: number;
    closedAt: number;
    openedAt: number;
    maxWeightPct: number;
  }>;
  telegramOffset?: number;
};

const file = path.resolve(process.cwd(), 'bot-state.json');

export function loadState(): BotState {
  try {
    if (!fs.existsSync(file)) return { positions: {}, closedTrades: [] };
    return JSON.parse(fs.readFileSync(file, 'utf8')) as BotState;
  } catch {
    return { positions: {}, closedTrades: [] };
  }
}

export function saveState(state: BotState): void {
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}
