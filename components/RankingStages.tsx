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
    const getStageProps = (event: Event) => {
        const title = event.title.toLowerCase();
        const is7k = title.includes('7k');

        if (event.isFinalDay) {
            return {
                label: 'FINAL',
                color: 'bg-gradient-to-br from-yellow-400 to-amber-600',
                text: 'text-black',
                glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]'
            };
        }

        if (event.isStartingDay) {
            const match = title.match(/dia 1([a-z0-9])/i);
            const suffix = match ? match[1].toUpperCase() : "A";
            return {
                label: `DIA 1${suffix}`,
                color: 'bg-gradient-to-br from-cyan-400 to-blue-600',
                text: 'text-white',
                glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            };
        }

        if (is7k || event.rankingType === 'special') {
            return {
                label: 'ESPECIAL',
                color: 'bg-gradient-to-br from-rose-500 to-pink-700',
                text: 'text-white',
                glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]'
            };
        }

        if (event.rankingType === 'monthly') {
            return {
                label: 'MENSAL',
                color: 'bg-gradient-to-br from-amber-500 to-orange-700',
                text: 'text-white',
                glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]'
            };
        }

        // Default Weekly
        stageCounter++;
        return {
            label: `ETAPA #${stageCounter}`,
            color: 'bg-gradient-to-br from-blue-500 to-indigo-700',
            text: 'text-white',
            glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        };
    };

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Legend & Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <span className="material-icons-outlined text-primary text-2xl">calendar_view_day</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Cronograma de Etapas</h2>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1.5 opacity-70">Estrutura oficial do Ranking {rankingLabel}</p>
                    </div>
                </div>

                {/* Legend Chips */}
                <div className="flex flex-wrap justify-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">Semanal</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-amber-400 transition-colors">Mensal</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group">
                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-rose-400 transition-colors">Especial</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">Dia 1</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full group">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">Final</span>
                    </div>
                </div>
            </div>

            {/* Stages Grid - Ticket Card Style */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {rankingEvents.map((event) => {
                    const { label, color, text, glow } = getStageProps(event);
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    const isCompleted = event.status === 'closed' || event.date < todayStr;
                    const eventDate = new Date(event.date);
                    const day = eventDate.getUTCDate().toString().padStart(2, '0');
                    const month = eventDate.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).slice(0, 3).toUpperCase();
                    const gtdValue = event.guaranteed.replace(/\s*GTD/i, '').replace('R$', '').trim();

                    return (
                        <div
                            key={event.id}
                            className={`relative group flex flex-col transition-all duration-300 rounded-[1.25rem] overflow-hidden border ${isCompleted
                                    ? 'bg-black/40 border-white/5 opacity-60 grayscale-[0.5]'
                                    : 'bg-[#0a0a14] border-white/10 hover:border-white/20 hover:-translate-y-1 shadow-2xl'
                                }`}
                        >
                            {/* Top Strip - Color Coded */}
                            <div className={`h-1 w-full ${isCompleted ? 'bg-gray-700' : color} ${!isCompleted && glow}`}></div>

                            {/* Ticket Header: Date & Label */}
                            <div className="p-3 flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-primary leading-none mb-0.5">{month}</span>
                                    <span className={`text-2xl font-display font-black leading-none ${isCompleted ? 'text-gray-500' : 'text-white'}`}>{day}</span>
                                </div>
                                <div className={`text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm transform -rotate-2 ${isCompleted ? 'bg-gray-800 text-gray-500' : `${color} ${text}`}`}>
                                    {label}
                                </div>
                            </div>

                            {/* Ticket Central: Prize (GTD) */}
                            <div className="flex-1 flex flex-col items-center justify-center py-2 px-3 border-y border-white/[0.03] bg-white/[0.01]">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">GARANTIDO</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-[10px] font-black ${isCompleted ? 'text-gray-700' : 'text-primary'}`}>R$</span>
                                    <span className={`text-3xl font-display font-black tracking-tighter leading-none ${isCompleted ? 'text-gray-600' : 'text-white'}`}>
                                        {gtdValue}
                                    </span>
                                </div>
                            </div>

                            {/* Ticket Footer: Info */}
                            <div className="p-2.5 flex flex-col gap-1.5 bg-black/20">
                                <div className="flex justify-between items-center text-[9px]">
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons-outlined text-[10px] text-gray-500">schedule</span>
                                        <span className="text-gray-400 font-bold">{event.time}</span>
                                    </div>
                                    {isCompleted ? (
                                        <span className="flex items-center gap-0.5 text-emerald-500 font-black">
                                            <span className="material-icons text-[10px]">check_circle</span>
                                            OK
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500 font-bold">BUY:</span>
                                            <span className="text-white font-black">R${event.buyin.replace('R$', '').trim()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Micro Detail Decorations */}
                            <div className="absolute top-1/2 -left-1 w-2 h-2 rounded-full bg-background-dark -translate-y-1/2 border border-white/5"></div>
                            <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-background-dark -translate-y-1/2 border border-white/5"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
