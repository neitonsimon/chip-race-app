import { RankingFormula, ScoringSchema } from '../types';

export interface PointBreakdownItem {
    label: string;
    value: number;
}

export interface ScoreBreakdown {
    total: number;
    items: PointBreakdownItem[];
}

export const calculatePointsWithBreakdown = (
    type: RankingFormula,
    players: number,
    buyin: number,
    position: number,
    prize: number,
    isVip: boolean,
    schemaId?: string,
    globalSchemas?: ScoringSchema[],
    rake: number = 0,
    profitLoss: number = 0,
    earlyStart: boolean = false,
    lateStay: boolean = false,
    minTime1h: boolean = false
): ScoreBreakdown => {
    let items: PointBreakdownItem[] = [];
    let total = 0;

    if (schemaId === 'null') return { total: 0, items: [] };
    if (players <= 0 && type !== 'cash_online' && !type.includes('legacy') && !schemaId) return { total: 0, items: [] };

    const schemas = Array.isArray(globalSchemas) ? globalSchemas : [];

    // 1. Try to use Global Schema if available
    if (schemaId && schemas.length > 0) {
        const schema = schemas.find(s => s.id === schemaId);
        if (schema) {
            // Position-based points
            if (schema.positionPoints && schema.positionPoints[position]) {
                const val = schema.positionPoints[position];
                items.push({ label: `Posição (${position}º)`, value: val });
                total += val;
            }

            const critPoints: Record<string, number> = {};

            schema.criteria.forEach(crit => {
                let multiplier = 0;
                let critLabel = '';
                if (crit.type === 'participants') { multiplier = players; critLabel = `Participantes (${players})`; }
                else if (crit.type === 'buyin') { multiplier = buyin; critLabel = `Buy-in (R$${buyin})`; }
                else if (crit.type === 'itm' || crit.type === 'winnings') { multiplier = prize; critLabel = `ITM (R$${prize})`; }
                else if (crit.type === 'isFt' && position <= 9 && position > 0) { multiplier = 1; critLabel = 'Mesa Final'; }
                else if (crit.type === 'isVip' && isVip) { multiplier = 1; critLabel = 'Bonus VIP'; }
                else if (crit.type === 'spent') { multiplier = buyin; critLabel = `Total Gasto (R$${buyin})`; }
                else if (crit.type === 'rake') { multiplier = rake; critLabel = `Rake (R$${rake})`; }
                else if (crit.type === 'profit_loss') { multiplier = Math.abs(profitLoss); critLabel = `P&L (${profitLoss > 0 ? '+' : '-'}${Math.abs(profitLoss)})`; }
                else if (crit.type === 'earlyStart' && earlyStart) { multiplier = 1; critLabel = 'Early Start'; }
                else if (crit.type === 'lateStay' && lateStay) { multiplier = 1; critLabel = 'Late Stay'; }
                else if (crit.type === 'minTime1h' && minTime1h) { multiplier = 1; critLabel = 'Mín. 1h'; }

                if (multiplier > 0 || (crit.type === 'profit_loss' && profitLoss !== 0)) {
                    let currentPts = 0;
                    if (crit.operation === 'multiply') currentPts = multiplier * crit.value;
                    else if (crit.operation === 'divide' && crit.value !== 0) currentPts = multiplier / crit.value;
                    else if (crit.operation === 'sum' && multiplier > 0) currentPts = crit.value;

                    if (currentPts !== 0) {
                        if (critPoints[crit.type] === undefined) critPoints[crit.type] = 0;
                        critPoints[crit.type] += currentPts;
                        
                        // We'll add it to items later after capping if needed
                    }
                }
            });

            // Handle profit_loss capping based on rake if both are present in schemas
            if (critPoints['profit_loss'] !== undefined && critPoints['rake'] !== undefined) {
                const rawPL = critPoints['profit_loss'];
                const cappedPL = Math.min(rawPL, critPoints['rake']);
                critPoints['profit_loss'] = cappedPL;
            }

            // Convert critPoints to items
            Object.keys(critPoints).forEach(key => {
                let label = key;
                if (key === 'participants') label = 'Participantes';
                else if (key === 'buyin') label = 'Buy-in';
                else if (key === 'itm' || key === 'winnings') label = 'ITM';
                else if (key === 'isFt') label = 'Mesa Final';
                else if (key === 'isVip') label = 'Bonus VIP';
                else if (key === 'spent') label = 'Total Gasto';
                else if (key === 'rake') label = 'Rake';
                else if (key === 'profit_loss') label = 'P&L (Capped)';
                else if (key === 'earlyStart') label = 'Early Start';
                else if (key === 'lateStay') label = 'Late Stay';
                else if (key === 'minTime1h') label = 'Mín. 1h';

                items.push({ label, value: critPoints[key] });
                total += critPoints[key];
            });

            return { total: Math.round(total), items };
        }
    }

    // 2. Fallback to Legacy logic
    const isFT = position <= 9 && position > 0;

    if (type === 'weekly') {
        const pPts = players / 3;
        const bPts = buyin / 3;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
        if (isFT) {
            items.push({ label: 'Mesa Final', value: 10 });
            total += 10;
        }
        if (prize > 0) {
            const prPts = prize / 10;
            items.push({ label: 'ITM/Prêmio', value: prPts });
            total += prPts;
        }
    } else if (type === 'monthly') {
        const pPts = players / 3;
        const bPts = buyin / 4;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
        if (isFT) {
            items.push({ label: 'Mesa Final', value: 15 });
            total += 15;
        }
        if (prize > 0) {
            const prPts = prize / 15;
            items.push({ label: 'ITM/Prêmio', value: prPts });
            total += prPts;
        }
    } else if (type === 'special') {
        const pPts = players / 4;
        const bPts = buyin / 4;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
        if (isFT) {
            items.push({ label: 'Mesa Final', value: 30 });
            total += 30;
        }
        if (prize > 0) {
            const prPts = prize / 20;
            items.push({ label: 'ITM/Prêmio', value: prPts });
            total += prPts;
        }
    } else if (type.includes('legacy')) {
        const table: Record<number, number> = { 1: 100, 2: 80, 3: 70, 4: 60, 5: 50, 6: 40, 7: 30, 8: 20, 9: 10 };
        let basePoints = table[position] || (position > 0 && position <= 15 ? 5 : 0);
        let label = `Score Tabela (${position}º)`;
        
        if (type === 'legacy_monthly') {
            items.push({ label: 'Base (Tabela)', value: basePoints });
            items.push({ label: 'Multiplicador Mensal (x1.5)', value: basePoints * 0.5 });
            total = basePoints * 1.5;
        } else if (type === 'legacy_special') {
            items.push({ label: 'Base (Tabela)', value: basePoints });
            items.push({ label: 'Multiplicador Especial (x3)', value: basePoints * 2 });
            total = basePoints * 3;
        } else {
            items.push({ label, value: basePoints });
            total = basePoints;
        }
    } else if (type === 'cash_online') {
        items.push({ label: 'Rake Gerado', value: rake });
        const plPoints = Math.min(Math.abs(profitLoss), rake);
        items.push({ label: 'P&L (Capped by Rake)', value: plPoints });
        total = rake + plPoints;
    } else if (type === 'mtt_online') {
        const pPts = players / 5;
        const bPts = buyin / 10;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
    } else if (type === 'sit_n_go') {
        const pPts = players / 2;
        const bPts = buyin / 5;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
    } else if (type === 'satellite') {
        const pPts = players / 10;
        const bPts = buyin / 50;
        items.push({ label: 'Participantes', value: pPts });
        items.push({ label: 'Buy-in', value: bPts });
        total = pPts + bPts;
    }

    if (isVip) {
        items.push({ label: 'Bonus VIP', value: 5 });
        total += 5;
    }

    return { total: Math.round(total), items };
};

export const calculatePoints = (
    type: RankingFormula,
    players: number,
    buyin: number,
    position: number,
    prize: number,
    isVip: boolean,
    schemaId?: string,
    globalSchemas?: ScoringSchema[],
    rake: number = 0,
    profitLoss: number = 0,
    earlyStart: boolean = false,
    lateStay: boolean = false,
    minTime1h: boolean = false
): number => {
    return calculatePointsWithBreakdown(
        type, players, buyin, position, prize, isVip, schemaId, globalSchemas, rake, profitLoss, earlyStart, lateStay, minTime1h
    ).total;
};

