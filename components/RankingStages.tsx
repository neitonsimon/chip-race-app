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

    return (
        <div className="mt-12 mb-16 px-4">
            <div className="text-center mb-10">
                <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-2">
                    {rankingLabel}
                </h3>
                <p className="text-primary font-bold uppercase tracking-[0.3em] text-sm">
                    Calendário de Etapas
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rankingEvents.map((event, index) => {
                    const isCompleted = event.status === 'closed';
                    const dateObj = new Date(event.date);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    return (
                        <div
                            key={event.id}
                            className={`relative group bg-[#0F111A] border-2 transition-all duration-300 rounded-2xl p-6 overflow-hidden ${isCompleted
                                ? 'border-gray-800 opacity-70 grayscale-[0.5]'
                                : 'border-white/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(217,0,255,0.1)]'
                                }`}
                        >
                            {/* Etapa Badge - Grunge Style */}
                            <div className={`absolute -top-1 -left-1 px-4 py-1.5 transform -rotate-12 z-10 shadow-lg ${event.isFinalDay ? 'bg-yellow-500' : (isCompleted ? 'bg-gray-700' : 'bg-cyan-500')
                                }`}>
                                <div className="text-[10px] font-black text-black uppercase leading-none text-center">
                                    {event.isFinalDay ? 'Mesa Final' : `Etapa #${index + 1}`}
                                </div>
                                <div className="text-xs font-black text-black leading-none mt-1 text-center">
                                    {formattedDate}
                                </div>
                            </div>

                            {/* Status Overlay for Completed */}
                            {isCompleted && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
                                    <div className="bg-emerald-500/90 text-black font-black text-xs uppercase px-4 py-1 rounded-full rotate-12 border-2 border-black shadow-lg">
                                        Etapa Concluída
                                    </div>
                                </div>
                            )}

                            {/* Main Prize - GTD */}
                            <div className="mt-4 text-center mb-6">
                                <div className="relative inline-block">
                                    <span className={`text-4xl font-display font-black tracking-tighter sm:text-5xl ${isCompleted ? 'text-gray-500' : 'text-white'
                                        }`}>
                                        {event.guaranteed || '0K'}
                                    </span>
                                    <span className={`text-xs font-black ml-1 px-1.5 py-0.5 rounded border ${isCompleted ? 'text-gray-600 border-gray-700' : 'text-cyan-400 border-cyan-400/30'
                                        }`}>
                                        GTD
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-2 border-t border-white/5 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Buy-In:</span>
                                    <span className="text-xs font-black text-gray-300">R$ {event.buyin || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rebuy:</span>
                                    <span className="text-xs font-black text-gray-300">R$ {event.rebuyValue || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add-on:</span>
                                    <span className="text-xs font-black text-gray-300">R$ {event.addonValue || '0'}</span>
                                </div>
                            </div>

                            {/* Background decoration */}
                            <div className="absolute -bottom-4 -right-4 opacity-[0.03] pointer-events-none">
                                <span className="material-icons-outlined text-8xl">military_tech</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
