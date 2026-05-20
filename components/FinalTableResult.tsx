import React from 'react';
import { Event, RankingPlayer } from '../types';

interface FinalTableResultProps {
    rankingId: string;
    rankingLabel: string;
    events: Event[];
    rankingPlayers?: RankingPlayer[];
}

const TROPHY_COLORS: Record<number, { bg: string; text: string; ring: string; icon: string }> = {
    1: {
        bg: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500',
        text: 'text-black',
        ring: 'ring-4 ring-yellow-400/40',
        icon: '🥇',
    },
    2: {
        bg: 'bg-gradient-to-br from-gray-300 via-slate-300 to-gray-400',
        text: 'text-black',
        ring: 'ring-4 ring-gray-400/40',
        icon: '🥈',
    },
    3: {
        bg: 'bg-gradient-to-br from-amber-700 via-orange-700 to-amber-800',
        text: 'text-white',
        ring: 'ring-4 ring-amber-700/40',
        icon: '🥉',
    },
};

export const FinalTableResult: React.FC<FinalTableResultProps> = ({
    rankingId,
    rankingLabel,
    events,
    rankingPlayers = [],
}) => {
    // Normalize string to compare (lowercase, accents removed)
    const titleNormalize = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Get keywords from rankingLabel to find matching Mesa Final in all events
    // E.g. "Alpha RANK" -> ["alpha"] (ignoring words shorter than 3 chars or "rank"/"ranking")
    const labelKeywords = titleNormalize(rankingLabel)
        .split(/[\s-]+/)
        .filter(w => w.length > 2 && w !== 'rank' && w !== 'ranking');

    // 1. Try to find a matching "mesa final" event from ALL events based on title keywords matching the ranking label
    const matchingEventsByTitle = events
        .filter((e) => {
            const normalizedTitle = titleNormalize(e.title);
            if (!normalizedTitle.includes('mesa final')) return false;
            if (labelKeywords.length === 0) return false;
            // Ensure all keywords from the ranking label are present in the event title
            return labelKeywords.every(keyword => normalizedTitle.includes(keyword));
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Original approach: find events with "mesa final" in the title that are explicitly included in this ranking
    const eventsInRanking = events.filter((e) =>
        e.includedRankings?.includes(rankingId)
    );

    const byTitle = eventsInRanking
        .filter((e) => titleNormalize(e.title).includes('mesa final'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Fallback: isFinalDay=true events included in this ranking
    const byFinalDay = eventsInRanking
        .filter((e) => e.isFinalDay === true)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const finalEvent = matchingEventsByTitle[0] || byTitle[0] || byFinalDay[0];

    if (!finalEvent) {
        return (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 mb-4">
                        <span className="material-icons-outlined text-yellow-500 text-3xl">emoji_events</span>
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Mesa Final</h2>
                    <p className="text-gray-500 text-sm uppercase tracking-widest">
                        A mesa final do {rankingLabel} ainda não foi disputada.
                    </p>
                </div>
            </div>
        );
    }

    const results = (finalEvent.results || []).sort((a, b) => a.position - b.position);

    // Find avatar from rankingPlayers
    const getAvatar = (result: typeof results[0]) => {
        const player = rankingPlayers.find(
            (p) =>
                (result.userId && p.id === result.userId) ||
                p.name.toLowerCase().trim() === result.name.toLowerCase().trim()
        );
        return player?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}&background=random&color=fff&size=128`;
    };

    const eventDate = new Date(finalEvent.date);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    const podium = results.slice(0, 3);
    const rest = results.slice(3);

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-inner shadow-yellow-500/10">
                        <span className="material-icons-outlined text-yellow-400 text-2xl">emoji_events</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                            Resultado Mesa Final
                        </h2>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1.5 opacity-70">
                            {rankingLabel} · {formattedDate}
                        </p>
                    </div>
                </div>

                {/* Event Stats */}
                <div className="flex gap-3 flex-wrap justify-center">
                    {finalEvent.totalPrize && finalEvent.totalPrize > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-center">
                            <div className="text-[9px] text-yellow-500/70 uppercase font-black tracking-wider mb-0.5">Prize Pool</div>
                            <div className="text-base font-black text-yellow-400">
                                R$ {finalEvent.totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    )}
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                        <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Participantes</div>
                        <div className="text-base font-black text-white">{results.length}</div>
                    </div>
                    {finalEvent.buyin && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                            <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Buy-in</div>
                            <div className="text-base font-black text-white">{finalEvent.buyin}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Podium (Top 3) */}
            {podium.length > 0 && (
                <div className="mb-8">
                    {/* Podium Trophy Display */}
                    <div className="flex items-end justify-center gap-3 md:gap-6 mb-6">
                        {/* 2nd place */}
                        {podium[1] && (
                            <div className="flex flex-col items-center gap-2">
                                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ${TROPHY_COLORS[2].ring}`}>
                                    <img
                                        src={getAvatar(podium[1])}
                                        alt={podium[1].name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="text-lg">🥈</div>
                                    <div className="text-xs font-black text-white truncate max-w-[80px] md:max-w-[120px]">{podium[1].name}</div>
                                    {podium[1].prize > 0 && (
                                        <div className="text-[10px] font-bold text-gray-400">
                                            R$ {podium[1].prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                                <div className="w-16 md:w-20 h-16 bg-gradient-to-t from-gray-600/30 to-gray-500/10 border border-gray-500/20 rounded-t-lg flex items-center justify-center">
                                    <span className="text-2xl font-display font-black text-gray-400">2</span>
                                </div>
                            </div>
                        )}

                        {/* 1st place */}
                        {podium[0] && (
                            <div className="flex flex-col items-center gap-2 -mt-6">
                                <div className="text-2xl animate-bounce">👑</div>
                                <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ${TROPHY_COLORS[1].ring} shadow-[0_0_30px_rgba(251,191,36,0.5)]`}>
                                    <img
                                        src={getAvatar(podium[0])}
                                        alt={podium[0].name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl">🥇</div>
                                    <div className="text-sm font-black text-yellow-300 truncate max-w-[100px] md:max-w-[140px]">{podium[0].name}</div>
                                    {podium[0].prize > 0 && (
                                        <div className="text-xs font-bold text-yellow-400/70">
                                            R$ {podium[0].prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                                <div className="w-20 md:w-24 h-24 bg-gradient-to-t from-yellow-600/30 to-yellow-500/10 border border-yellow-500/20 rounded-t-lg flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                    <span className="text-3xl font-display font-black text-yellow-400">1</span>
                                </div>
                            </div>
                        )}

                        {/* 3rd place */}
                        {podium[2] && (
                            <div className="flex flex-col items-center gap-2">
                                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ${TROPHY_COLORS[3].ring}`}>
                                    <img
                                        src={getAvatar(podium[2])}
                                        alt={podium[2].name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="text-lg">🥉</div>
                                    <div className="text-xs font-black text-white truncate max-w-[80px] md:max-w-[120px]">{podium[2].name}</div>
                                    {podium[2].prize > 0 && (
                                        <div className="text-[10px] font-bold text-gray-400">
                                            R$ {podium[2].prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                                <div className="w-16 md:w-20 h-10 bg-gradient-to-t from-amber-800/30 to-amber-700/10 border border-amber-700/20 rounded-t-lg flex items-center justify-center">
                                    <span className="text-2xl font-display font-black text-amber-600">3</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Results Table (4th place and beyond) */}
            {rest.length > 0 && (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                        <span className="material-icons-outlined text-gray-500 text-base">format_list_numbered</span>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Resultado Completo</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {results.map((result) => {
                            const trophyStyle = TROPHY_COLORS[result.position];
                            const isTop3 = result.position <= 3;
                            return (
                                <div
                                    key={result.id}
                                    className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 ${isTop3 ? 'bg-yellow-500/5' : ''}`}
                                >
                                    {/* Position */}
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shrink-0 ${trophyStyle ? `${trophyStyle.bg} ${trophyStyle.text}` : 'bg-white/10 text-gray-400'}`}>
                                        {result.position}
                                    </div>

                                    {/* Avatar */}
                                    <img
                                        src={getAvatar(result)}
                                        alt={result.name}
                                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                                    />

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-black text-sm truncate ${isTop3 ? 'text-yellow-300' : 'text-white'}`}>
                                            {result.name}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    {result.calculatedPoints > 0 && (
                                        <div className="text-right shrink-0">
                                            <div className="text-[10px] text-gray-500 uppercase font-black">Pts</div>
                                            <div className="text-sm font-black text-primary">{result.calculatedPoints}</div>
                                        </div>
                                    )}

                                    {/* Prize */}
                                    {result.prize > 0 && (
                                        <div className="text-right shrink-0 min-w-[80px]">
                                            <div className="text-[10px] text-gray-500 uppercase font-black">Prêmio</div>
                                            <div className={`text-sm font-black ${isTop3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                R$ {result.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
        </div>
    );
};
