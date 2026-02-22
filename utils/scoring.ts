import { RankingFormula, ScoringSchema } from '../types';

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
    profitLoss: number = 0
): number => {
    if (schemaId === 'null') return 0;
    if (players <= 0 && type !== 'cash_online' && !schemaId) return 0;

    const schemas = Array.isArray(globalSchemas) ? globalSchemas : [];

    // 1. Try to use Global Schema if available
    if (schemaId && schemas.length > 0) {
        const schema = schemas.find(s => s.id === schemaId);
        if (schema) {
            let points = 0;

            // Position-based points
            if (schema.positionPoints && schema.positionPoints[position]) {
                points += schema.positionPoints[position];
            }

            // Criteria-based points
            schema.criteria.forEach(crit => {
                let multiplier = 0;
                if (crit.type === 'participants') multiplier = players;
                else if (crit.type === 'buyin') multiplier = buyin;
                else if (crit.type === 'itm' || crit.type === 'winnings') multiplier = prize;
                else if (crit.type === 'isFt' && position <= 9 && position > 0) multiplier = 1;
                else if (crit.type === 'isVip' && isVip) multiplier = 1;
                else if (crit.type === 'spent') multiplier = buyin; // Defaulting spent to buyin
                else if (crit.type === 'rake') multiplier = rake;
                else if (crit.type === 'profit_loss') multiplier = Math.min(Math.abs(profitLoss), rake);

                if (crit.operation === 'multiply') points += multiplier * crit.value;
                else if (crit.operation === 'divide' && crit.value !== 0) points += multiplier / crit.value;
                else if (crit.operation === 'sum' && multiplier > 0) points += crit.value;
            });

            return Math.round(points);
        }
    }

    // 2. Fallback to Legacy logic
    let points = 0;
    const isFT = position <= 9 && position > 0;

    if (type === 'weekly') {
        points = (players / 3) + (buyin / 3);
        if (isFT) points += 10;
        if (prize > 0) points += (prize / 10);
    } else if (type === 'monthly') {
        points = (players / 3) + (buyin / 4);
        if (isFT) points += 15;
        if (prize > 0) points += (prize / 15);
    } else if (type === 'special') {
        points = (players / 4) + (buyin / 6);
        if (isFT) points += 30;
        if (prize > 0) points += (prize / 25);
    } else if (type === 'legacy_weekly' || type === 'legacy_monthly' || type === 'legacy_special') {
        const table: Record<number, number> = { 1: 100, 2: 80, 3: 70, 4: 60, 5: 50, 6: 40, 7: 30, 8: 20, 9: 10 };
        let basePoints = table[position] || (position <= 15 ? 5 : 0);
        if (type === 'legacy_monthly') basePoints *= 1.5;
        if (type === 'legacy_special') basePoints *= 3;
        points = basePoints;
    } else if (type === 'cash_online') {
        points = rake + Math.min(Math.abs(profitLoss), rake);
    } else if (type === 'mtt_online') {
        points = (players / 5) + (buyin / 10);
    } else if (type === 'sit_n_go') {
        points = (players / 2) + (buyin / 5);
    } else if (type === 'satellite') {
        points = (players / 10) + (buyin / 50);
    }
    if (isVip) points += 5;
    return Math.round(points);
};
