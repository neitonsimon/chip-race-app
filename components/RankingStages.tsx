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

        // Check for common Main Event patterns
        if (event.isStartingDay || title.includes('dia 1')) {
            const match = title.match(/dia 1([a-z0-9])/i);
            const suffix = match ? match[1].toUpperCase() : "A";
            return { label: `ME - DIA 1${suffix}`, color: 'bg-cyan-600' };
        }

        if (event.isFinalDay || title.includes('dia final') || title.includes('final')) {
            return { label: 'ME - FINAL', color: 'bg-yellow-500' };
        }

        // Generic Stage
        stageCounter++;
        return { label: `ETAPA #${stageCounter}`, color: 'bg-indigo-500' };
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-6 mb-8 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="material-icons-outlined text-primary">calendar_month</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Calendário de Etapas</h2>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-tight">Datas, buy-ins e premiações garantidas</p>
                    </div>
                </div>
            </div>

            {/* Grid for Stages - Compact horizontally */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                {[...rankingEvents]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => {
                        const { label, color } = getStageLabel(event);
                        const isCompleted = event.status === 'closed' || new Date(event.date) < new Date();
                        const formattedDate = new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                        return (
                            <div
                                key={event.id}
                                className={`relative group bg-[#0F111A] border transition-all duration-300 rounded-lg p-2 md:p-3 overflow-hidden ${isCompleted
                                    ? 'border-gray-800 opacity-60 grayscale-[0.8]'
                                    : 'border-white/5 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(217,0,255,0.05)]'
                                    }`}
                            >
                                {/* Etapa Badge - Ultra Compact */}
                                <div className={`absolute -top-1 -left-1 px-2 py-0.5 transform -rotate-6 z-10 shadow-lg ${isCompleted ? 'bg-gray-700' : color
                                    }`}>
                                    <div className="text-[7px] font-black text-black uppercase leading-none text-center">
                                        {label}
                                    </div>
                                    <div className="text-[9px] font-black text-black leading-none mt-0.5 text-center">
                                        {formattedDate}
                                    </div>
                                </div>

                                {/* Main Prize - GTD - Centered and tight */}
                                <div className="mt-4 text-center mb-1">
                                    <div className="relative inline-block">
                                        <span className={`text-xl font-display font-black tracking-tighter transition-all ${isCompleted ? 'text-gray-600' : 'text-white group-hover:scale-110 block'
                                            }`}>
                                            {event.guaranteed || '0K'}
                                        </span>
                                        <span className={`text-[7px] font-black ml-0.5 px-0.5 py-0 rounded border leading-none ${isCompleted ? 'text-gray-700 border-gray-800' : 'text-cyan-400 border-cyan-400/20'
                                            }`}>
                                            GTD
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid - Ultra compact */}
                                <div className="space-y-1 border-t border-white/5 pt-1.5 mt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] font-bold text-gray-600 uppercase">Buy:</span>
                                        <span className="text-[8px] font-black text-gray-400">R$ {event.buyin || '0'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] font-bold text-gray-600 uppercase">Re:</span>
                                        <span className="text-[8px] font-black text-gray-400">R$ {event.rebuyValue || '0'}</span>
                                    </div>
                                </div>

                                {isCompleted && (
                                    <div className="absolute top-1 right-1">
                                        <span className="material-icons-outlined text-[10px] text-emerald-500">check_circle</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
