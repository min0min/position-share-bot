import fs from 'node:fs';
import path from 'node:path';
const file = path.resolve(process.cwd(), 'bot-state.json');
export function loadState() {
    try {
        if (!fs.existsSync(file))
            return { positions: {}, closedTrades: [], equityHistory: [] };
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        return {
            positions: parsed.positions || {},
            closedTrades: parsed.closedTrades || [],
            equityHistory: parsed.equityHistory || [],
            telegramOffset: parsed.telegramOffset,
        };
    }
    catch {
        return { positions: {}, closedTrades: [], equityHistory: [] };
    }
}
export function saveState(state) {
    fs.writeFileSync(file, JSON.stringify(state, null, 2));
}
