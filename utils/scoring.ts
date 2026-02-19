import { RankingFormula, ScoringSchema } from '../types';

export const calculatePoints = (
    type: RankingFormula,
    players: number,
    buyin: number,
    position: number,
    prize: number,
    isVip: boolean,
    schemaId?: string,
    globalSchemas?: ScoringSchema[]
): number => {
    if (players <= 0 || schemaId === 'null') return 0;

    // 1. Try to use Global Schema if available
    if (schemaId && globalSchemas) {
        const schema = globalSchemas.find(s => s.id === schemaId);
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
                else if (crit.type === 'spent') multiplier = 0; // Not used yet
                else if (crit.type === 'rake') multiplier = 0; // Not used yet

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
    } else if (type === 'cash_online') {
        points = (buyin / 10);
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
