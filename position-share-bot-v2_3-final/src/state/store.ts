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
  lastPnlNoticeAt?: number;
  lastPnlNoticeValue?: number;
};

export type ClosedTrade = {
  key: string;
  symbol: string;
  side: string;
  realizedPnl: number;
  closedAt: number;
  openedAt: number;
  maxWeightPct: number;
  avgPrice: number;
  closePrice: number;
  maxMarginSize: number;
  addCount: number;
  grossPnl?: number;
  netProfit?: number;
  funding?: number;
  openFee?: number;
  closeFee?: number;
  source?: 'bot' | 'bitget';
};

export type EquityPoint = {
  at: number;
  equity: number;
};

export type BotState = {
  positions: Record<string, PositionSnapshot>;
  closedTrades: ClosedTrade[];
  equityHistory: EquityPoint[];
  telegramOffset?: number;
};

const file = path.resolve(process.cwd(), 'bot-state.json');

export function loadState(): BotState {
  try {
    if (!fs.existsSync(file)) return { positions: {}, closedTrades: [], equityHistory: [] };
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<BotState>;
    return {
      positions: parsed.positions || {},
      closedTrades: parsed.closedTrades || [],
      equityHistory: parsed.equityHistory || [],
      telegramOffset: parsed.telegramOffset,
    };
  } catch {
    return { positions: {}, closedTrades: [], equityHistory: [] };
  }
}

export function saveState(state: BotState): void {
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}
