import React from 'react';
import appConfig from '../../src/config/appConfig.json';
import { ProfileStatsSkeleton } from '../Skeleton';

const PLAY_STYLE_DEFINITIONS: Record<string, string> = appConfig.playerProfile.playStyleDefinitions;

interface OverviewTabProps {
    player: any;
    isAdmin: boolean;
    isOwnProfile: boolean;
    canClaimDaily: boolean;
    toggleVerification?: () => void;
    xpPercentage: number;
    currentExpInTier: number;
    displayNextExp: number | string;
    setShowMessageModal: (show: boolean) => void;
    checkClaimAvailability: (lastClaim: string) => void;
    onUpdateProfile?: (id: string, data: any) => void;
    targetIdRef: { current: string | null };
    setShowClaimModal: (show: boolean) => void;
    isLoading: boolean;
    rankings: any[];
    experienceLevels: any[];
    handleOpenFlyer: (log: any) => void;
    setSelectedImage: (img: string | null) => void;
    setPlayer: (player: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    player,
    isAdmin,
    isOwnProfile,
    canClaimDaily,
    toggleVerification,
    xpPercentage,
    currentExpInTier,
    displayNextExp,
    setShowMessageModal,
    checkClaimAvailability,
    onUpdateProfile,
    targetIdRef,
    setShowClaimModal,
    isLoading,
    rankings,
    experienceLevels,
    handleOpenFlyer,
    setSelectedImage,
    setPlayer
}) => {
    if (!player) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Main Info */}
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-8 text-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>

                    <div className="relative inline-block mb-6 group">
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-40 h-40 rounded-full border-4 border-gray-100 dark:border-white/10 p-1 mx-auto object-cover"
                        />
                        {(player.vipStatus === 'master') ? (
                            <div className="absolute bottom-2 right-[-10px] bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[10px] md:text-xs font-black px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center gap-1 animate-pulse">
                                <span className="material-icons-outlined text-[10px] md:text-xs">diamond</span>
                                VIP MASTER
                            </div>
                        ) : (player.vipStatus === 'anual') ? (
                            <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-neon-blue flex items-center gap-1">
                                <span className="material-icons-outlined text-[10px] md:text-xs">diamond</span>
                                VIP GOLD
                            </div>
                        ) : (player.vipStatus === 'trimestral') ? (
                            <div className="absolute bottom-2 right-2 bg-secondary text-black text-[10px] md:text-xs font-black px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-[0_0_15px_rgba(0,224,255,0.5)] flex items-center gap-1">
                                <span className="material-icons-outlined text-[10px] md:text-xs">diamond</span>
                                VIP BRONZE
                            </div>
                        ) : (player.isVip) ? (
                            <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-neon-blue flex items-center gap-1">
                                <span className="material-icons-outlined text-[10px] md:text-xs">diamond</span>
                                VIP
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-0.5">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{player.name}</h1>
                        {(player.isVerified || isAdmin) && (
                            <span
                                onClick={isAdmin ? toggleVerification : undefined}
                                className={`material-icons text-xl transition-all ${player.isVerified ? 'text-cyan-400' : 'text-white/10'} ${isAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                                title={player.isVerified ? "Usuário Verificado" : isAdmin ? "Clique para verificar usuário" : ""}
                            >
                                verified
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 bg-primary/10 inline-block px-3 py-1 rounded-full border border-primary/20">
                        ID: {player.numericId ? `CR#${String(player.numericId).padStart(3, '0')}` : 'CR#GUEST'}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-base mb-6">{player.city}</p>

                    {/* Badges Section */}
                    {player.badges && player.badges.length > 0 && (
                        <div className="mb-8 flex flex-wrap justify-center gap-3">
                            {player.badges.map((badge: any) => {
                                const originalDesc = badge.badge_templates?.description;
                                return (
                                    <div key={badge.id}
                                        className="group relative w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all cursor-help transform hover:scale-110 hover:border-primary/50 hover:bg-primary/5">

                                        <span className="material-icons-outlined text-primary text-2xl">{badge.icon || 'stars'}</span>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#0c0920] text-white text-[10px] p-3 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl scale-90 group-hover:scale-100">
                                            <p className="font-black text-primary uppercase tracking-widest mb-1 leading-none">{badge.title}</p>
                                            <p className="text-gray-400 leading-relaxed font-medium">{originalDesc || badge.description}</p>
                                            {/* Arrow */}
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0c0920] border-b border-r border-white/10 transform rotate-45" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}



                    {/* Social Media Section */}
                    <div className="flex justify-center gap-4 mb-8">
                        {player.social?.instagram && (
                            <a
                                href={`https://instagram.com/${player.social.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-pink-600/20 hover:text-pink-500 flex items-center justify-center transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        )}
                        {player.social?.twitter && (
                            <a
                                href={`https://twitter.com/${player.social.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-400/20 hover:text-blue-400 flex items-center justify-center transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                </svg>
                            </a>
                        )}
                        {player.social?.discord && (
                            <a
                                href="https://discord.com/app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#5865F2]/20 hover:text-[#5865F2] flex items-center justify-center transition-colors"
                                title={`ID: ${player.social.discord}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                                </svg>
                            </a>
                        )}
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div title={`UUID: ${player.id}`}>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">ID Chip Race</div>
                                <div className="text-xl font-display font-black text-primary">
                                    {player.numericId ? `CR#${String(player.numericId).padStart(3, '0')}` : 'CR#GUEST'}
                                </div>
                            </div>
                            {/* NEW XP & LEVEL UI */}
                            <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nível {player.level}</div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                        style={{ width: `${xpPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-[9px] text-gray-400 mt-1">{currentExpInTier} / {displayNextExp} XP</div>
                            </div>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowMessageModal(true)}
                                className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-outlined text-base">mail</span> Enviar Mensagem
                            </button>
                        </div>
                    )}
                </div>

                {/* DAILY LOGIN SECTION (Replaced Trophy Room) */}
                <div className="mt-8 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                    {/* Glow Effect if Claim Available */}
                    {isOwnProfile && canClaimDaily && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none"></div>}

                    <div className="flex justify-between items-center mb-4 w-full">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons-outlined text-yellow-400">calendar_today</span>
                            Login Diário
                        </h3>
                        <div className="flex items-center gap-2">
                            {isAdmin && isOwnProfile && (
                                <button
                                    onClick={() => {
                                        const yesterday = new Date();
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        const newLastClaim = yesterday.toISOString();
                                        const newPlayerData = { ...player, lastDailyClaim: newLastClaim };
                                        setPlayer(newPlayerData);
                                        checkClaimAvailability(newLastClaim);
                                        if (onUpdateProfile && targetIdRef.current) onUpdateProfile(targetIdRef.current, newPlayerData);
                                    }}
                                    className="px-2 py-1 bg-cyan-600/20 text-cyan-400 text-[10px] font-bold rounded uppercase hover:bg-cyan-600 hover:text-white transition-colors flex items-center gap-1"
                                    title="DEV: Forçar reset de 24h"
                                >
                                    <span className="material-icons-outlined text-[12px]">fast_forward</span> DEV: +1 DIA
                                </button>
                            )}
                            <div className="text-xs bg-black/20 px-2 py-1 rounded text-gray-400">
                                Reset: 21:00
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center py-2">
                        {isOwnProfile ? (
                            <>
                                <div className="mb-4 relative">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${canClaimDaily
                                        ? 'bg-primary border-primary shadow-neon-pink animate-bounce'
                                        : 'bg-gray-800 border-gray-700'
                                        }`}>
                                        <span className="material-icons-outlined text-3xl text-white">
                                            {canClaimDaily ? 'redeem' : 'check'}
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-white mb-1">
                                    {canClaimDaily ? 'Recompensa Disponível!' : 'Volte amanhã'}
                                </h4>
                                <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
                                    {canClaimDaily
                                        ? 'Resgate agora seu bônus diário de XP e itens exclusivos.'
                                        : 'Você já resgatou seu bônus de hoje. O reset ocorre às 21:00.'}
                                </p>

                                <button
                                    onClick={() => setShowClaimModal(true)}
                                    disabled={!canClaimDaily}
                                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${canClaimDaily
                                        ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-neon-pink hover:scale-105'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {canClaimDaily ? 'RESGATAR BÔNUS' : 'JÁ RESGATADO'}
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Visível apenas para o dono do perfil.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Stats & Analysis */}
            <div className="lg:col-span-2 space-y-8">

                {/* Main Stats Cards */}
                {isLoading ? (
                    <ProfileStatsSkeleton />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">leaderboard</span>
                            </div>
                            <div className="text-3xl font-display font-black text-white">
                                {(() => {
                                    if (rankings) {
                                        const legacy = rankings.find((r: any) => r.id === 'legacy');
                                        if (legacy) {
                                            const match = legacy.players.find((p: any) =>
                                                (p.id && player.id && p.id === player.id) ||
                                                p.name.toLowerCase() === player.name.toLowerCase()
                                            );
                                            if (match && match.rank > 0) return match.rank + 'º';
                                        }
                                    }
                                    return player.rank > 0 ? player.rank + 'º' : '-';
                                })()}
                            </div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Ranking Geral</div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-secondary/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">payments</span>
                            </div>
                            <div className="text-xl font-display font-black text-secondary">{player.winnings}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Ganhos Totais</div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">emoji_events</span>
                            </div>
                            <div className="text-3xl font-display font-black text-cyan-500">{player.titles}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Títulos</div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-pink-500/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">pie_chart</span>
                            </div>
                            <div className="text-3xl font-display font-black text-pink-500">{player.itm}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">ITM %</div>
                        </div>
                        {/* NEW: CREDIT LIMIT CARD - HIDDEN AS REQUESTED */}
                        {/* 
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-green-500/50 transition-colors col-span-2 sm:col-span-4">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">credit_card</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-display font-black text-green-500">
                                        R$ {((player as any).debtLimitBrl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Limite de Crédito (Nível {player.level})</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Próximo Limite</div>
                                    <div className="text-sm font-black text-white/40">
                                        {(() => {
                                            const nextLvl = experienceLevels?.find((l: any) => l.level === player.level + 1);
                                            return nextLvl ? `R$ ${nextLvl.credit_limit.toFixed(2)}` : 'Limite Máximo';
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed italic">
                                O seu nível Chip Race reflete sua frequência, engajamento e paixão pelo esporte.
                                Quanto mais você participa dos eventos e interage no app, mais EXP ganha, evoluindo seu nível e desbloqueando benefícios como maiores limites de pendura e recompensas exclusivas.
                            </div>
                        </div>
                        */}
                    </div>
                )}

                {/* Tournament Log - CONDENSED MOBILE VIEW */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons-outlined text-primary">history</span>
                            Histórico de Torneios
                        </h3>
                    </div>
                    <div className="overflow-hidden">
                        <table className="w-full text-left text-sm md:text-base text-gray-400">
                            <thead className="bg-black/20 text-[10px] md:text-xs uppercase font-bold text-gray-500">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 hidden sm:table-cell">Data</th>
                                    <th className="px-3 md:px-6 py-3">Evento</th>
                                    <th className="px-2 md:px-6 py-3 text-center">Pos</th>
                                    <th className="px-3 md:px-6 py-3 text-right">Prêmio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {player.tournamentLog && player.tournamentLog.length > 0 ? (
                                    player.tournamentLog.map((log: any, index: number) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group/row"
                                            onClick={() => handleOpenFlyer(log)}
                                        >
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden sm:table-cell">{log.date}</td>
                                            <td className="px-3 md:px-6 py-4 font-bold text-white truncate max-w-[120px] md:max-w-none">
                                                <div className="flex flex-col">
                                                    <span className="group-hover/row:text-primary transition-colors">{log.eventName}</span>
                                                    <span className="text-[9px] text-gray-500 sm:hidden block mt-0.5">{log.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 md:px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] md:text-sm font-bold ${log.position === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    log.position <= 3 ? 'bg-gray-500/20 text-gray-300' : 'text-gray-500'
                                                    }`}>
                                                    {log.position}º
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-4 text-right text-white text-xs md:text-base">{log.prize}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-600 italic">
                                            Nenhum torneio registrado nesta temporada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Play Style & Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col overflow-visible">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Estilo de Jogo</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {player.playStyles && player.playStyles.map((style: string, idx: number) => {
                                const colors = [
                                    'text-red-500 border-red-500/20 bg-red-500/10',
                                    'text-blue-500 border-blue-500/20 bg-blue-500/10',
                                    'text-cyan-500 border-cyan-500/20 bg-cyan-500/10',
                                    'text-green-500 border-green-500/20 bg-green-500/10',
                                    'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
                                ];
                                const colorClass = colors[idx % colors.length];
                                return (
                                    <div key={idx} className="group relative">
                                        <span className={`cursor-help px-3 py-1 text-sm font-bold rounded-full border ${colorClass}`}>
                                            {style}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-surface-dark border border-white/20 rounded-xl text-xs text-white shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-[100] pointer-events-none">
                                            <div className="font-bold mb-1 text-primary">{style}</div>
                                            <div className="text-gray-300 leading-snug">{PLAY_STYLE_DEFINITIONS[style] || "Sem descrição."}</div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/20"></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!player.playStyles || player.playStyles.length === 0) && (
                                <span className="text-gray-500 text-sm italic">Nenhum estilo definido.</span>
                            )}
                        </div>
                        <div className="mt-6">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Bio</h4>
                            <p className="text-gray-500 text-base leading-relaxed italic">
                                "{player.bio}"
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Galeria</h3>
                        {player.gallery && player.gallery.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {player.gallery.map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <img src={img} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="material-icons-outlined text-white text-3xl">zoom_in</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-500 text-sm italic border border-white/5 rounded-lg">
                                Sem fotos.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
