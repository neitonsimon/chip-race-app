import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
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
    const { badgeTemplates } = useApp();
    const [showAllBadges, setShowAllBadges] = useState(false);
    const [expandedHistory, setExpandedHistory] = useState(false);

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
                        ) : (player.vipStatus === 'honorario') ? (
                            <div className="absolute bottom-2 right-[-5px] md:right-[-10px] bg-emerald-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1">
                                <span className="material-icons-outlined text-[10px] md:text-xs">star</span>
                                VIP HONORÁRIO
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
                    <p className="text-gray-500 dark:text-gray-400 text-base mb-2">{player.city}</p>
                    {player.suprema_nickname && (
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 mb-6 bg-blue-500/10 py-2 px-4 rounded-xl border border-blue-500/20 mx-auto w-fit uppercase tracking-widest">
                            <span className="material-icons-outlined text-sm">casino</span>
                            <span className="opacity-60 text-gray-500">Nick Suprema:</span>
                            <span className="ml-1">{player.suprema_nickname}</span>
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
                        {player.social?.whatsapp && (
                            <a
                                href={`https://wa.me/${player.social.whatsapp.replace(/\D/g, '').startsWith('55') ? player.social.whatsapp.replace(/\D/g, '') : '55' + player.social.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-emerald-600/20 hover:text-emerald-500 flex items-center justify-center transition-colors"
                                title="Enviar mensagem no WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.011 2c-5.518 0-9.998 4.476-9.998 9.985 0 2.22.724 4.261 1.94 5.907L3 22l4.287-1.372c1.448.869 3.125 1.372 4.904 1.372 5.518 0 9.998-4.476 9.998-9.985 0-5.509-4.48-9.985-9.998-9.985zm0 17.5c-1.688 0-3.26-.523-4.593-1.42l-.3-.213-2.6.833.826-2.583-.242-.358C3.899 14.544 3.3 12.83 3.3 11.002c0-4.809 3.916-8.724 8.711-8.724s8.711 3.916 8.711 8.724-3.917 8.724-8.711 8.724zm4.846-6.65c-.266-.134-1.574-.775-1.817-.863-.24-.088-.415-.133-.59.133s-.678.863-.83 1.04c-.15.178-.302.199-.567.066s-1.121-.413-2.133-1.317c-.788-.702-1.319-1.569-1.474-1.835-.154-.266-.017-.41.117-.543.12-.12.266-.31.399-.466.13-.155.175-.266.264-.442.088-.178.044-.333-.022-.466s-.59-1.42-.808-1.947c-.21-.512-.423-.42-.59-.42-.15 0-.324-.012-.497-.012s-.46.066-.7.31c-.24.244-.913.887-.913 2.162s.931 2.506 1.062 2.684c.13.178 1.83 2.793 4.432 3.918.62.267 1.103.427 1.48.547.621.198 1.185.17 1.63.104.498-.073 1.574-.643 1.795-1.264.223-.62.223-1.151.155-1.264-.066-.11-.243-.177-.508-.31z" />
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
                                    Esta funcionalidade estará disponível em breve com recompensas exclusivas!
                                </p>

                                <button
                                    disabled={true}
                                    className="w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all bg-white/5 text-gray-600 cursor-not-allowed"
                                >
                                    EM BREVE
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
                                        // Buscar o ranking do tipo Legado (lifetime)
                                        const legacy = rankings.find((r: any) =>
                                            r.id === 'legacy' ||
                                            r.id === 'legado' ||
                                            r.label?.toLowerCase().includes('legado')
                                        );
                                        if (legacy) {
                                            const match = legacy.players.find((p: any) =>
                                                (p.id && player.id && p.id === player.id) ||
                                                (p.name && player.name && p.name.toLowerCase().trim() === player.name.toLowerCase().trim())
                                            );
                                            if (match && match.rank > 0) return match.rank + 'º';
                                        }
                                    }
                                    return player.rank > 0 ? player.rank + 'º' : '-';
                                })()}
                            </div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Ranking Geral</div>
                            <div className="text-[10px] text-primary font-black mt-1 uppercase tracking-tighter opacity-80">
                                {(() => {
                                    if (rankings) {
                                        const legacy = rankings.find((r: any) =>
                                            r.id === 'legacy' ||
                                            r.id === 'legado' ||
                                            r.label?.toLowerCase().includes('legado')
                                        );
                                        if (legacy) {
                                            const match = legacy.players.find((p: any) =>
                                                (p.id && player.id && p.id === player.id) ||
                                                (p.name && player.name && p.name.toLowerCase().trim() === player.name.toLowerCase().trim())
                                            );
                                            if (match) return `${Math.floor(match.points)} PTS LIFE TIME`;
                                        }
                                    }
                                    return `${player.points || 0} PTS`;
                                })()}
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-secondary/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">payments</span>
                            </div>
                            <div className="text-xl font-display font-black text-secondary truncate">{player.winnings}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Ganhos Totais</div>
                            <div className="text-[10px] mt-1 invisible h-[15px]">spacer</div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">emoji_events</span>
                            </div>
                            <div className="text-3xl font-display font-black text-cyan-500">{player.titles}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">Títulos</div>
                            <div className="text-[10px] mt-1 invisible h-[15px]">spacer</div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-pink-500/50 transition-colors">
                            <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-icons-outlined text-4xl">pie_chart</span>
                            </div>
                            <div className="text-3xl font-display font-black text-pink-500">{player.itm}</div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider">ITM %</div>
                            <div className="text-[10px] mt-1 invisible h-[15px]">spacer</div>
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

                {/* New Conquistas (Achievements) Section */}
                {player.badges && player.badges.length > 0 && (
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-primary">stars</span>
                                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">Conquistas</h3>
                            </div>
                            <button
                                onClick={() => setShowAllBadges(true)}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/10"
                            >
                                Ver Todas
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {player.badges.map((badge: any) => {
                                const template = badge.badge_templates;
                                // Always prefer live template values so edits propagate immediately
                                const badgeIcon = template?.icon || badge.icon || 'stars';
                                const badgeTitle = template?.title || badge.title || '';
                                const badgeColor = template?.color || badge.color || '#00E5FF';
                                const originalDesc = template?.description || badge.description;

                                const isPatrao = badgeTitle?.toLowerCase().includes('patrão') || badgeTitle?.toLowerCase().includes('patrao');
                                const isSupreme = badgeColor === '#ff4d79' || badgeTitle?.toLowerCase().includes('supreme');
                                const isLegendary = badgeColor === '#FFD700' || badgeTitle?.toLowerCase().includes('lendária') || badgeTitle?.toLowerCase().includes('lendaria') || badgeTitle?.toLowerCase().includes('legendary');

                                const supremeGradientStyle = {
                                    background: 'linear-gradient(135deg, #f9a8d4 0%, #ec4899 30%, #db2777 55%, #ea580c 80%, #c2410c 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                };

                                return (
                                    <div key={badge.id}
                                        className={`group relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-all cursor-help transform hover:scale-110 rounded-[1.25rem] border-2 ${isPatrao ? 'badge-patrao-aura' : isSupreme ? 'badge-supreme-aura' : isLegendary ? 'badge-legendary-aura' : ''}`}
                                        style={isPatrao ? {
                                            borderColor: '#fff',
                                        } : isSupreme ? {
                                            borderColor: 'rgba(236,72,153,0.6)',
                                        } : isLegendary ? {
                                            borderColor: 'rgba(255,215,0,0.5)',
                                        } : {
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderColor: `${badgeColor}22`,
                                            boxShadow: `0 8px 20px ${badgeColor}08`,
                                        }}
                                    >
                                        <div className="w-full h-full flex items-center justify-center rounded-[1.25rem] transition-all group-hover:bg-white/[0.05]">
                                            {badge.image_url ? (
                                                <img src={badge.image_url} alt={badgeTitle} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <span
                                                    className={`material-icons-outlined text-3xl ${isPatrao ? 'text-white' : ''}`}
                                                    style={isPatrao ? { textShadow: '0 0 15px rgba(255,255,255,0.8)' } : isSupreme ? supremeGradientStyle : isLegendary ? { color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.5)' } : { color: badgeColor }}
                                                >{badgeIcon}</span>
                                            )}
                                        </div>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 max-sm:-translate-x-[40%] mb-4 w-48 md:w-64 bg-[#0c0920] text-white p-4 rounded-2xl border border-white/10 invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none transition-all z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.8)] scale-90 group-hover:scale-100 font-sans">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={isSupreme ? {
                                                    background: 'linear-gradient(135deg, #f9a8d4, #ec4899, #ea580c)',
                                                    boxShadow: '0 0 8px rgba(236,72,153,0.8), 0 0 4px rgba(234,88,12,0.6)'
                                                } : {
                                                    backgroundColor: badgeColor,
                                                    boxShadow: `0 0 10px ${badgeColor}`
                                                }}></div>
                                                <p className="font-black text-xs uppercase tracking-widest leading-none" style={isSupreme ? {
                                                    background: 'linear-gradient(90deg, #f9a8d4, #ec4899, #ea580c)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text',
                                                } : { color: badgeColor }}>{badgeTitle}</p>
                                            </div>
                                            <p className="text-gray-400 text-[11px] leading-relaxed font-medium break-words">{originalDesc}</p>
                                            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-600 font-black uppercase tracking-wider">
                                                Ganha em: {new Date(badge.awarded_at).toLocaleDateString()}
                                            </div>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 max-sm:left-[40%] w-3 h-3 bg-[#0c0920] border-b border-r border-white/10 transform rotate-45" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                                    (expandedHistory ? player.tournamentLog : player.tournamentLog.slice(0, 8)).map((log: any, index: number) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group/row animate-in fade-in"
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
                                                <span className={`px-2 py-1 rounded text-[10px] md:text-sm font-bold whitespace-nowrap ${log.position === 1 ? (log.isStartingDay ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]') :
                                                    log.position === 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        log.position <= 3 ? 'bg-gray-500/20 text-gray-300' : 'text-gray-500'
                                                    }`}>
                                                    {log.position === 0 ? 'Não Classif.' : (log.isStartingDay && log.position === 1) ? 'CLASSIF.' : `${log.position}º`}
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
                        
                        {player.tournamentLog && player.tournamentLog.length > 8 && (
                            <div className="p-4 bg-black/10 border-t border-white/5 text-center">
                                <button
                                    onClick={() => setExpandedHistory(!expandedHistory)}
                                    className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 mx-auto group"
                                >
                                    <span className="material-icons-outlined text-sm group-hover:animate-bounce-slow">
                                        {expandedHistory ? 'expand_less' : 'expand_more'}
                                    </span>
                                    {expandedHistory ? 'Ver Menos' : `Ver Mais (${player.tournamentLog.length - 8} eventos restantes)`}
                                </button>
                            </div>
                        )}
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
                                        <div className="absolute bottom-full left-1/2 -translate-x-[40%] md:-translate-x-1/2 mb-2 w-44 md:w-48 p-3 bg-surface-dark border border-white/20 rounded-xl text-xs text-white shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-[100] pointer-events-none">
                                            <div className="font-black mb-1 text-primary uppercase tracking-wider text-[10px]">{style}</div>
                                            <div className="text-gray-400 leading-snug text-[11px] font-medium">{PLAY_STYLE_DEFINITIONS[style] || "Sem descrição."}</div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-[40%] md:left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/20"></div>
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
            {/* All Badges Modal */}
            {showAllBadges && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAllBadges(false)}></div>
                    <div className="relative w-full max-w-4xl max-h-[85vh] bg-surface-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                                    <span className="material-icons text-primary text-3xl">emoji_events</span>
                                    Todas as Medalhas
                                </h3>
                                <p className="text-gray-500 text-xs mt-1 uppercase font-black tracking-widest italic">Coleção completa de medalhas Chip Race</p>
                            </div>
                            <button onClick={() => setShowAllBadges(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badgeTemplates.map((template) => {
                                const isUnlocked = player.badges?.some((b: any) => b.badge_template_id === template.id);
                                const badgeColor = template.color || '#00E5FF';

                                return (
                                    <div
                                        key={template.id}
                                        className={`p-4 md:p-5 rounded-3xl border transition-all flex items-start gap-4 relative group ${isUnlocked ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-40 grayscale'}`}
                                    >
                                        {isUnlocked && (
                                            <div className="absolute top-3 right-3 shrink-0">
                                                <span className="material-icons text-primary text-sm">verified</span>
                                            </div>
                                        )}

                                        <div 
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 mt-1" 
                                            style={{ 
                                                backgroundColor: `${badgeColor}11`, 
                                                backgroundImage: badgeColor === '#ff4d79' ? 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(249,115,22,0.1) 100%)' : 'none',
                                                borderColor: `${badgeColor}33` 
                                            }}
                                        >
                                            <span 
                                                className="material-icons-outlined text-2xl" 
                                                style={badgeColor === '#ff4d79' && isUnlocked ? { background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: badgeColor }}
                                            >{template.icon || 'stars'}</span>
                                        </div>

                                        <div className="flex-1 min-w-0 pr-6 md:pr-0">
                                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 truncate md:whitespace-normal" style={{ color: isUnlocked ? badgeColor : '#999' }}>
                                                {template.title}
                                            </h4>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium break-words">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Total de Medalhas: {badgeTemplates.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
