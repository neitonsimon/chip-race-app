import React from 'react';
import { Event } from '../types';

interface RankingStagesProps {
    rankingId: string;
    rankingLabel: string;
    events: Event[];
}

export const RankingStages: React.FC<RankingStagesProps> = ({ rankingId, rankingLabel, events }) => {
    // Filter events that belong to this ranking
    const rankingEvents = events
        .filter(e => e.includedRankings?.includes(rankingId))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (rankingEvents.length === 0) return null;

    // Helper to determine the badge label and color
    let stageCounter = 0;
    const getStageLabel = (event: Event) => {
        const title = event.title.toLowerCase();

        if (event.isStartingDay || title.includes('dia 1')) {
            const match = title.match(/dia 1([a-z])/i);
            const suffix = match ? match[1].toUpperCase() : "";
            return { label: `ME - Dia 1${suffix}`, color: 'bg-cyan-600' };
        }

        if (event.isFinalDay || title.includes('dia final')) {
            return { label: 'ME - Final', color: 'bg-yellow-500' };
        }

        stageCounter++;
        return { label: `Etapa #${stageCounter}`, color: 'bg-cyan-500' };
    };

    // Reset counter before mapping
    stageCounter = 0;

    return (
        <div className="mt-8 mb-16 px-2">
            <div className="text-center mb-8">
                <h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-1">
                    {rankingLabel}
                </h3>
                <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px]">
                    Calendário de Etapas
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                {rankingEvents.map((event) => {
                    const isCompleted = event.status === 'closed';
                    const dateObj = new Date(event.date);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const { label, color } = getStageLabel(event);

                    return (
                        <div
                            key={event.id}
                            className={`relative group bg-[#0F111A] border transition-all duration-300 rounded-xl p-3 md:p-4 overflow-hidden ${isCompleted
                                    ? 'border-gray-800 opacity-60 grayscale-[0.8]'
                                    : 'border-white/5 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(217,0,255,0.05)]'
                                }`}
                        >
                            {/* Etapa Badge - More Compact */}
                            <div className={`absolute -top-1 -left-1 px-3 py-1 transform -rotate-12 z-10 shadow-lg ${isCompleted ? 'bg-gray-700' : color
                                }`}>
                                <div className="text-[8px] font-black text-black uppercase leading-none text-center">
                                    {label}
                                </div>
                                <div className="text-[10px] font-black text-black leading-none mt-0.5 text-center">
                                    {formattedDate}
                                </div>
                            </div>

                            {/* Status Overlay for Completed */}
                            {isCompleted && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 pointer-events-none">
                                    <div className="bg-emerald-500/80 text-black font-black text-[8px] uppercase px-2 py-0.5 rounded-full rotate-12 border border-black shadow-sm">
                                        Check
                                    </div>
                                </div>
                            )}

                            {/* Main Prize - GTD - Compacted */}
                            <div className="mt-3 text-center mb-4">
                                <div className="relative inline-block">
                                    <span className={`text-2xl font-display font-black tracking-tighter ${isCompleted ? 'text-gray-600' : 'text-white'
                                        }`}>
                                        {event.guaranteed || '0K'}
                                    </span>
                                    <span className={`text-[8px] font-black ml-0.5 px-1 py-0.2 rounded border ${isCompleted ? 'text-gray-700 border-gray-800' : 'text-cyan-400 border-cyan-400/20'
                                        }`}>
                                        GTD
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid - More Compact font */}
                            <div className="space-y-1.5 border-t border-white/5 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-gray-600 uppercase">Buy-In:</span>
                                    <span className="text-[9px] font-black text-gray-400">R$ {event.buyin || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-gray-600 uppercase">Rebuy:</span>
                                    <span className="text-[9px] font-black text-gray-400">R$ {event.rebuyValue || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-gray-600 uppercase">Add-on:</span>
                                    <span className="text-[9px] font-black text-gray-400">R$ {event.addonValue || '0'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
