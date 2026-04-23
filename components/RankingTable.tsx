import React, { useState, useEffect } from 'react';
import { RankingPlayer, Event, RankingInstance, ScoringSchema, RankingFormula, BadgeTemplate } from '../types';
import { ScoringFormulaEditor } from './ScoringFormulaEditor';
import { RankingSkeleton } from './Skeleton';
import { RankingStages } from './RankingStages';
import { calculatePoints, calculatePointsWithBreakdown, ScoreBreakdown } from '../utils/scoring';

interface RankingTableProps {
    isAdmin?: boolean;
    onSelectPlayer?: (player: RankingPlayer) => void;
    rankings: RankingInstance[]; // Unified Rankings
    onUpdateRankingMeta?: (id: string, updates: Partial<RankingInstance>) => void; // Admin
    onAddRanking?: () => void; // Admin
    onDeleteRanking?: (id: string) => void; // Admin
    onUpdatePrize?: (rankingId: string, rank: number, newPrize: string) => void;
    onNavigate?: (view: string) => void;
    currentUser?: { name?: string };
    globalScoringSchemas?: ScoringSchema[];
    onUpdateGlobalSchemas?: (schemas: ScoringSchema[]) => void;
    isLoading?: boolean;
    badgeTemplates?: BadgeTemplate[];
    events?: Event[];
}

type SimType = 'weekly' | 'monthly' | 'special';

const getRankingStyle = (label: string) => {
    const uLabel = label.toUpperCase();
    if (uLabel.includes('ALPHA')) return { gradient: 'from-[#00E5FF] via-[#00A2FF] to-[#00E5FF]', shadow: 'text-shadow-cyan' };
    if (uLabel.includes('ANUAL') || uLabel.includes('ANNUAL')) return { gradient: 'from-[#FFD700] via-[#FDB931] to-[#FFD700]', shadow: 'text-shadow-gold' };
    if (uLabel.includes('MENSAL') || uLabel.includes('MONTHLY')) return { gradient: 'from-[#A855F7] via-[#D8B4FE] to-[#A855F7]', shadow: 'text-shadow-purple' };
    if (uLabel.includes('SEMANAL') || uLabel.includes('WEEKLY')) return { gradient: 'from-[#22C55E] via-[#4ADE80] to-[#22C55E]', shadow: 'text-shadow-green' };
    if (uLabel.includes('ESPECIAL') || uLabel.includes('SPECIAL')) return { gradient: 'from-[#EF4444] via-[#F87171] to-[#EF4444]', shadow: 'text-shadow-red' };
    return { gradient: 'from-primary via-accent to-primary', shadow: 'text-shadow-cyan' };
};

export const RankingTable: React.FC<RankingTableProps> = ({
    isAdmin,
    onSelectPlayer,
    rankings,
    onUpdateRankingMeta,
    onAddRanking,
    onDeleteRanking,
    onUpdatePrize,
    onNavigate,
    currentUser,
    events,
    globalScoringSchemas,
    onUpdateGlobalSchemas,
    isLoading,
    badgeTemplates = []
}) => {
    const [activeRankingId, setActiveRankingId] = useState<string>('annual');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSimulator, setShowSimulator] = useState(false);
    const [showFormulaEditor, setShowFormulaEditor] = useState(false);
    const [showStages, setShowStages] = useState(false);
    const [rankingView, setRankingView] = useState<'active' | 'finalized'>('active');
    const [isRetracted, setIsRetracted] = useState(false);
    const [detailPlayer, setDetailPlayer] = useState<RankingPlayer | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownData, setBreakdownData] = useState<{player: RankingPlayer, scores: any[]} | null>(null);


    // Admin Editing State
    const [editingRanking, setEditingRanking] = useState<RankingInstance | null>(null);
    const [justification, setJustification] = useState('');



    // --- SIMULATOR STATE ---
    const [simType, setSimType] = useState<string>('weekly');
    const [simPlayers, setSimPlayers] = useState<number>(0);
    const [simBuyin, setSimBuyin] = useState<number>(0);
    const [simPosition, setSimPosition] = useState<number>(1);
    const [simIsVip, setSimIsVip] = useState<boolean>(false);
    const [simPrize, setSimPrize] = useState<number>(0);
    const [simRake, setSimRake] = useState<number>(0);
    const [simProfitLoss, setSimProfitLoss] = useState<number>(0);
    const [simResult, setSimResult] = useState<number>(0);

    // Ensure activeRankingId is valid (fallback to first available if deleted or filtered)
    useEffect(() => {
        const availableInCurrentView = rankings.filter(r => (rankingView === 'active' ? r.isActive !== false : r.isActive === false));
        if (availableInCurrentView.length > 0 && !availableInCurrentView.find(r => r.id === activeRankingId)) {
            setActiveRankingId(availableInCurrentView[0].id);
        }
    }, [rankings, activeRankingId, rankingView]);

    const availableRankings = rankings.filter(r => (rankingView === 'active' ? r.isActive !== false : r.isActive === false));
    const activeRanking = rankings.find(r => r.id === activeRankingId) || availableRankings[0] || rankings[0];
    const rankingStyle = getRankingStyle(activeRanking?.label || 'RANKING');


    // Reset simulator type based on ranking category
    useEffect(() => {
        if (!activeRanking) return;
        const label = activeRanking.label.toLowerCase();
        if (label.includes('legado')) {
            setSimType('legacy_weekly');
        } else if (label.includes('cash')) {
            setSimType('cash_online');
        } else {
            setSimType('weekly');
        }
    }, [activeRankingId]);

    const currentSimSchema = activeRanking?.scoringSchemas?.find(s => s.id === simType) || globalScoringSchemas?.find(s => s.id === simType);
    const isCashSim = simType === 'cash_online' || (currentSimSchema?.criteria.some(c => c.type === 'rake' || c.type === 'profit_loss'));

    // --- SIMULATOR LOGIC ---
    useEffect(() => {
        let points = 0;
        const p = simPlayers || 0;
        const b = simBuyin || 0;
        const pos = simPosition || 1;
        const z = simPrize || 0;
        const r = simRake || 0;
        const pl = simProfitLoss || 0;

        // Try to find a schema specific to this ranking and event type first
        const mappedSchemaId = activeRanking?.scoringSchemaMap?.[simType];

        // Use mapped ID, or search by name (simType might be a schema name in old data)
        const schema = globalScoringSchemas?.find(s => s.id === mappedSchemaId)
            || activeRanking?.scoringSchemas?.find(s => s.id === simType || s.name === simType)
            || globalScoringSchemas?.find(s => {
                const sName = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (simType === 'legacy_weekly' && (sName.includes('legado sem') || (sName.includes('legado') && (sName.includes('padrao') || sName.includes('semanal'))))) return true;
                if (simType === 'legacy_monthly' && (sName.includes('legado mens') || (sName.includes('legado') && sName.includes('mensal')))) return true;
                if (simType === 'legacy_special' && (sName.includes('legado esp') || (sName.includes('legado') && sName.includes('especial')))) return true;
                return false;
            });

        if (schema || mappedSchemaId) {
            points = calculatePoints(
                simType as RankingFormula,
                p,
                b,
                pos,
                z,
                simIsVip,
                schema?.id || mappedSchemaId,
                globalScoringSchemas || activeRanking?.scoringSchemas,
                r,
                pl
            );
        } else {
            // Fallback to utility's legacy logic
            points = calculatePoints(simType as RankingFormula, p, b, pos, z, simIsVip, undefined, undefined, r, pl);
        }

        setSimResult(Math.round(points));
    }, [simType, simPlayers, simBuyin, simPosition, simIsVip, simPrize, simRake, simProfitLoss, activeRanking, globalScoringSchemas]);

    // Filtragem e Dropdown
    const getSuggestions = () => {
        if (!searchTerm || !activeRanking) return [];
        return activeRanking.players
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const suggestions = getSuggestions();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (name: string) => {
        setSearchTerm(name);
        setShowSuggestions(false);
    };

    const filteredRanking = activeRanking?.players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.city.toLowerCase().includes(searchTerm.toLowerCase());

        // Para o ranking Legado, mostrar apenas jogadores com pontuação
        if (activeRanking?.label.toLowerCase().includes('legado')) {
            return matchesSearch && player.points > 0;
        }

        return matchesSearch;
    }) || [];

    // Get current user points for projection
    const userCurrentPoints = currentUser?.name ? (activeRanking?.players.find(p => p.name === currentUser.name)?.points || 0) : 0;

    // Helper function to get scores with detailed breakdown
    const getAllScores = (player: RankingPlayer) => {
        if (!events) return [];

        const normalize = (name: string) => name.toLowerCase().trim();
        const playerNormName = normalize(player.name);

        return events
            .filter(e => {
                const included = e.includedRankings || ['annual', 'quarterly', 'legacy'];
                return e.status === 'closed' && e.results && !e.is_hidden && !e.isStartingDay && (included.includes(activeRankingId) || included.includes(activeRanking?.id || ''));
            })
            .map(e => {
                const res = e.results?.find(r => {
                    if (player.id && r.userId && player.id === r.userId) return true;
                    return normalize(r.name) === playerNormName;
                });

                if (!res) return null;

                const isSpecialEvent = e.rankingType === 'special';
                const isLegacyRanking = activeRanking?.id === 'legacy' || activeRanking?.label.toLowerCase().includes('legado');
                const forceRecalc = isSpecialEvent && isLegacyRanking;
                const savedPoints = res.pointsPerRanking?.[activeRankingId];
                const hasPointsMap = res.pointsPerRanking && Object.keys(res.pointsPerRanking).length > 0;
                
                const mappedSchemaId = (e.rankingType && activeRanking?.scoringSchemaMap) 
                    ? activeRanking.scoringSchemaMap[e.rankingType] 
                    : e.scoringSchemaId;
                    
                const formulaBreakdown = calculatePointsWithBreakdown(
                    (e.rankingType || 'weekly') as RankingFormula,
                    e.results?.length || 0,
                    (isSpecialEvent && res.buyinTotal) ? res.buyinTotal : (Number((e.buyin?.toString() || '0').replace(/[^0-9]/g, '')) || 0),
                    res.position,
                    res.prize || 0,
                    res.isVip || false,
                    mappedSchemaId,
                    globalScoringSchemas || activeRanking?.scoringSchemas,
                    res.rake || 0,
                    res.profitLoss || 0,
                    res.earlyStart || false,
                    res.lateStay || false,
                    res.minTime1h || false
                );

                let breakdown: ScoreBreakdown = formulaBreakdown;

                if (hasPointsMap && !forceRecalc && savedPoints !== undefined) {
                    if (Math.abs(savedPoints - formulaBreakdown.total) > 0.1) {
                        breakdown = {
                            total: savedPoints,
                            items: [
                                ...formulaBreakdown.items,
                                { label: 'Bônus / Ajuste Manual', value: savedPoints - formulaBreakdown.total }
                            ]
                        };
                    } else {
                        breakdown = {
                            total: savedPoints,
                            items: formulaBreakdown.items
                        };
                    }
                }

                return breakdown.total > 0
                    ? { 
                        eventName: e.name, 
                        date: e.date, 
                        points: breakdown.total, 
                        position: res.position, 
                        breakdown: breakdown.items.filter(item => Math.abs(item.value) > 0.01) 
                      }
                    : null;
            })
            .filter(item => item !== null)
            .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime());
    };

    // Keep existing for the inline view
    const getLastScores = (player: RankingPlayer) => {
        return getAllScores(player).slice(0, 3);
    };

    const handleSaveRanking = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRanking && onUpdateRankingMeta) {
            onUpdateRankingMeta(editingRanking.id, editingRanking);
            setEditingRanking(null);
        }
    };

    return (
        <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen relative overflow-x-hidden">
            {/* Primary Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-10 group relative">
                    {availableRankings.length > 0 ? (
                        <>
                            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-[0.1em] uppercase">
                                <span className={`title-shimmer bg-gradient-to-r ${rankingStyle.gradient} ${rankingStyle.shadow}`}>
                                    {activeRanking?.label || 'RANKING'}
                                </span>
                            </h2>
                            <div className={`h-1.5 w-32 mx-auto rounded-full mt-4 bg-gradient-to-r ${rankingStyle.gradient} bar-shimmer shadow-lg shadow-black/20`}></div>

                            <p className="text-gray-500 dark:text-gray-400 mt-4 font-light tracking-wide uppercase text-sm">
                                {activeRanking?.description}
                            </p>
                            {activeRanking?.startDate && activeRanking?.endDate && (
                                <div className="mt-2 text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-[0.3em]">
                                    {activeRanking.startDate.split('-').reverse().slice(0, 2).join('/')} - {activeRanking.endDate.split('-').reverse().slice(0, 2).join('/')}
                                </div>
                            )}

                            {/* ADMIN EDIT BUTTONS FOR CURRENT RANKING */}
                            {isAdmin && (
                                <div className="absolute top-0 right-0 lg:right-[-50px] flex flex-col gap-2">
                                    {!isRetracted && (
                                        <>
                                            <button
                                                onClick={() => setEditingRanking(activeRanking)}
                                                className="bg-white/5 p-2 rounded-full hover:bg-primary hover:text-white text-gray-400 transition-colors"
                                                title="Editar Detalhes do Ranking"
                                            >
                                                <span className="material-icons-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setShowFormulaEditor(true)}
                                                className="bg-white/5 p-2 rounded-full hover:bg-secondary hover:text-white text-gray-400 transition-colors"
                                                title="Editar Fórmulas de Pontuação"
                                            >
                                                <span className="material-icons-outlined">functions</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setIsRetracted(!isRetracted)}
                                        className={`bg-white/5 p-2 rounded-full transition-colors ${isRetracted ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white text-gray-400'}`}
                                        title={isRetracted ? "Mostrar todos os campos" : "Ocultar campos secundários (Modo TV)"}
                                    >
                                        <span className="material-icons-outlined">{isRetracted ? 'expand' : 'compress'}</span>
                                    </button>
                                    {!isRetracted && (
                                        <button
                                            onClick={() => {
                                                const action = activeRanking.isActive !== false ? 'finalizar' : 'reativar';
                                                if (window.confirm(`Deseja realmente ${action} o ranking "${activeRanking.label}"?`)) {
                                                    onUpdateRankingMeta?.(activeRanking.id, { isActive: activeRanking.isActive === false });
                                                }
                                            }}
                                            className={`bg-white/5 p-2 rounded-full transition-colors ${activeRanking.isActive !== false ? 'hover:bg-red-500' : 'hover:bg-emerald-500'} hover:text-white text-gray-400`}
                                            title={activeRanking.isActive !== false ? "Finalizar Ranking" : "Reativar Ranking"}
                                        >
                                            <span className="material-icons-outlined">{activeRanking.isActive !== false ? 'lock' : 'lock_open'}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="pt-10">
                            <span className="material-icons-outlined text-gray-700 text-6xl mb-4">history</span>
                            <h2 className="text-xl font-bold text-gray-500 uppercase">Nenhum ranking {rankingView === 'active' ? 'em andamento' : 'encerrado'}</h2>
                        </div>
                    )}
                </div>

                {/* Switch Active/Finalized */}
                {!isRetracted && (
                    <div className="flex justify-center mb-6">
                        <div className="flex bg-gray-200 dark:bg-surface-dark/50 p-1 rounded-xl border border-gray-300 dark:border-white/5 shadow-inner">
                            <button
                                onClick={() => setRankingView('active')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${rankingView === 'active' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Em Andamento
                            </button>
                            <button
                                onClick={() => setRankingView('finalized')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${rankingView === 'finalized' ? 'bg-secondary text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Encerrados
                            </button>
                        </div>
                    </div>
                )}

                {/* Dynamic Tabs + Rules Button */}
                {!isRetracted && (
                    <div className="flex flex-col items-center justify-center mb-12 gap-4">
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-1 rounded-full flex flex-wrap justify-center backdrop-blur-md shadow-lg max-w-full overflow-x-auto">
                            {availableRankings
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map(ranking => (
                                    <button
                                        key={ranking.id}
                                        onClick={() => setActiveRankingId(ranking.id)}
                                        className={`px-4 sm:px-8 py-2 rounded-full text-sm sm:text-base font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeRankingId === ranking.id
                                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-neon-pink'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {ranking.label}
                                    </button>
                                ))}


                            {/* ADMIN ADD BUTTON */}
                            {isAdmin && onAddRanking && (
                                <button
                                    onClick={onAddRanking}
                                    className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 ml-2"
                                    title="Adicionar Novo Ranking"
                                >
                                    +
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowRules(true)}
                                className="text-sm text-gray-500 hover:text-primary font-bold uppercase hover:underline flex items-center gap-1 mt-2 transition-colors"
                            >
                                <span className="material-icons-outlined text-base">info</span>
                                Regulamento
                            </button>
                            <button
                                onClick={() => setShowSimulator(!showSimulator)}
                                className={`text-sm font-bold uppercase hover:underline flex items-center gap-1 mt-2 transition-colors ${showSimulator ? 'text-secondary' : 'text-gray-500 hover:text-secondary'}`}
                            >
                                <span className="material-icons-outlined text-base">calculate</span>
                                Simulador de Pontos
                            </button>
                            <button
                                onClick={() => setShowStages(!showStages)}
                                className={`text-sm font-bold uppercase hover:underline flex items-center gap-1 mt-2 transition-colors ${showStages ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                            >
                                <span className="material-icons-outlined text-base">calendar_month</span>
                                Calendário de Etapas
                            </button>
                        </div>
                    </div>
                )}

                {availableRankings.length > 0 && (
                    <>


                        {/* --- CALENDÁRIO DE ETAPAS --- */}
                        {showStages && activeRanking && !isRetracted && (
                            <div className="animate-in slide-in-from-top-4 duration-300">
                                <RankingStages
                                    rankingId={activeRankingId}
                                    rankingLabel={activeRanking.label}
                                    events={events}
                                />
                            </div>
                        )}

                        {/* --- SIMULADOR DE PONTOS --- */}
                        {showSimulator && !isRetracted && (
                            <div className="mb-8 bg-surface-dark border border-secondary/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,224,255,0.1)] animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-2 mb-6 pb-2 border-b border-white/5">
                                    <span className="material-icons-outlined text-secondary">calculate</span>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Simulador de Pontos</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
                                    {/* Inputs */}
                                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Torneio</label>
                                            <select
                                                value={simType}
                                                onChange={(e) => setSimType(e.target.value)}
                                                className="w-full bg-[#050214] border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                            >
                                                {activeRanking?.scoringSchemas && activeRanking.scoringSchemas.length > 0 ? (
                                                    activeRanking.scoringSchemas.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))
                                                ) : activeRanking?.label.toLowerCase().includes('legado') ? (
                                                    <>
                                                        <option value="legacy_weekly">Legado Padrão</option>
                                                        <option value="legacy_monthly">Legado Mensal</option>
                                                        <option value="legacy_special">Legado Especial</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="weekly">Semanal (Padrão)</option>
                                                        <option value="monthly">Mensal (Padrão)</option>
                                                        <option value="special">Especial (Padrão)</option>
                                                        <option value="cash_online">Cash Game</option>
                                                        <option value="mtt_online">MTT Online</option>
                                                        <option value="sit_n_go">Sit & Go</option>
                                                        <option value="satellite">Satélite</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        {isCashSim ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rake Gerado (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={simRake || ''}
                                                        onChange={(e) => setSimRake(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lucro / Perda (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={simProfitLoss || ''}
                                                        onChange={(e) => setSimProfitLoss(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="hidden md:block"></div>
                                            </>
                                        ) : activeRanking?.label.toLowerCase().includes('legado') ? (
                                            <>
                                                <div className="hidden md:block"></div>
                                                <div className="hidden md:block"></div>
                                                <div className="hidden md:block"></div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Participantes</label>
                                                    <input
                                                        type="number"
                                                        value={simPlayers || ''}
                                                        onChange={(e) => setSimPlayers(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buy-in (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={simBuyin || ''}
                                                        onChange={(e) => setSimBuyin(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Premiação (ITM)</label>
                                                    <input
                                                        type="number"
                                                        value={simPrize || ''}
                                                        onChange={(e) => setSimPrize(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-secondary outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Checkboxes & Result */}
                                    <div className="lg:col-span-1 flex flex-col justify-between h-full gap-4">
                                        <div className="flex gap-4">
                                            {!isCashSim && (
                                                <div className="flex flex-col gap-1 w-24 md:w-32">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Posição Final</label>
                                                    {simType.includes('legacy') || activeRanking?.label.toLowerCase().includes('legado') ? (
                                                        <select
                                                            value={simPosition || 1}
                                                            onChange={(e) => setSimPosition(parseInt(e.target.value) || 1)}
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:border-secondary outline-none text-center"
                                                        >
                                                            <option value="1">Campeão</option>
                                                            <option value="2">Vice</option>
                                                            <option value="3">3º Lugar</option>
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={simPosition || ''}
                                                            onChange={(e) => setSimPosition(parseInt(e.target.value) || 1)}
                                                            min="1"
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:border-secondary outline-none text-center"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={simIsVip}
                                                    onChange={(e) => setSimIsVip(e.target.checked)}
                                                    className="w-4 h-4 accent-primary bg-black border-white/20 rounded"
                                                />
                                                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">VIP?</span>
                                            </label>
                                        </div>

                                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                                            <span className="text-xs uppercase font-bold text-gray-500">Resultado</span>
                                            <span className="text-2xl font-display font-black text-secondary text-glow-blue">{simResult} pts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Example / Projection Table */}
                                <div className="mt-8 border-t border-white/10 pt-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                        <span className="material-icons-outlined text-sm">trending_up</span>
                                        Projeção de Impacto: <span className="text-white">{currentUser?.name || 'Visitante'}</span>
                                    </h4>
                                    <div className="bg-black/20 rounded-xl overflow-x-auto border border-white/5">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Ranking Atual</th>
                                                    <th className="px-4 py-3 text-right">Pontuação Atual</th>
                                                    <th className="px-4 py-3 text-right text-secondary">+ Simulação</th>
                                                    <th className="px-4 py-3 text-right text-white">Total Projetado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                <tr className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-primary">{activeRanking?.label}</td>
                                                    <td className="px-4 py-3 text-right text-gray-300">{userCurrentPoints.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-secondary font-bold">+{simResult}</td>
                                                    <td className="px-4 py-3 text-right text-white font-black font-display text-lg">{(userCurrentPoints + simResult).toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Prize/Highlight Box */}
                        {activeRanking?.prizeInfoTitle && !isRetracted && (
                            <div className="max-w-3xl mx-auto mb-8">
                                <h3 className="text-primary font-bold text-xl sm:text-2xl mb-6 flex items-center justify-center gap-2">
                                    <span className="material-icons-outlined">emoji_events</span> Ranking Geral 2026
                                </h3>
                                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-2xl border border-primary/20 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg text-black font-black text-2xl">
                                            3
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-black text-xl uppercase italic">{activeRanking.prizeInfoTitle}</div>
                                            <div className="text-primary font-bold">THE CHOSEN 2026</div>
                                        </div>
                                    </div>
                                    <div className="h-px w-full md:w-px md:h-12 bg-white/10"></div>
                                    <div className="text-left md:text-right">
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {activeRanking.prizeInfoDetail || "Premiação especial para os líderes."}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest text-center">* Premiações de patrocinadores poderão ser acrescentadas.</p>
                            </div>
                        )}

                        {/* Search & Filter */}
                        {!isRetracted && (
                            <div className="flex justify-between items-center mb-6 relative z-30">
                                <div className="relative w-full max-w-md mx-auto">
                                    <input
                                        type="text"
                                        placeholder="Buscar jogador..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full py-3 px-12 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(217,0,255,0.2)] transition-all"
                                    />
                                    <span className="material-icons-outlined absolute left-4 top-3 text-gray-400">search</span>

                                    {/* Search Dropdown */}
                                    {showSuggestions && searchTerm && suggestions.length > 0 && (
                                        <ul className="absolute top-full left-0 w-full mt-2 bg-surface-dark border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                                            {suggestions.map((player) => (
                                                <li
                                                    key={player.name}
                                                    onClick={() => handleSuggestionClick(player.name)}
                                                    className="px-4 py-3 hover:bg-white/10 cursor-pointer text-gray-300 text-sm border-b border-white/5 last:border-0 flex items-center gap-3"
                                                >
                                                    <img src={player.avatar || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                                    <span className="flex-1 truncate">{player.name}</span>
                                                    {player.isVerified && (
                                                        <span className="material-icons text-[#00E5FF] text-[14px] shrink-0">verified</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Noble Table */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl relative z-10">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full text-left table-auto">
                                    <thead className="bg-gray-5 dark:bg-white/5">
                                        <tr>
                                            <th className="px-2 md:px-6 py-3 md:py-5 text-[10px] md:text-sm font-black text-primary uppercase tracking-wider w-10 md:w-16 text-center">RANK</th>
                                            <th className="px-2 md:px-6 py-3 md:py-5 text-[10px] md:text-sm font-black text-primary uppercase tracking-wider">COMPETIDOR</th>
                                            <th className="px-6 py-5 text-sm font-black text-primary uppercase tracking-[0.2em] hidden md:table-cell w-40">Últ. Pontos</th>
                                            <th className="px-2 md:px-6 py-3 md:py-5 text-[10px] md:text-sm font-black text-primary uppercase tracking-wider text-right w-20 md:w-28">SCORE</th>
                                            <th className="px-1 md:px-6 py-3 md:py-5 text-[10px] md:text-sm font-black text-secondary uppercase tracking-wider text-center w-16 md:w-28">PRÊMIO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="p-4">
                                                    <div className="space-y-4">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <RankingSkeleton key={i} />
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            (isRetracted ? filteredRanking.slice(0, 10) : filteredRanking).map((player) => (
                                                <tr
                                                    key={player.name + player.rank} // Key composta para evitar erros
                                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                                    onClick={() => onSelectPlayer && onSelectPlayer(player)}
                                                >
                                                    <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <div className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-display font-bold text-xs md:text-lg shadow-lg group-hover:scale-110 transition-transform ${player.rank === 1 ? 'bg-gradient-to-br from-primary to-cyan-700 text-white border border-primary/50' :
                                                                player.rank === 2 ? 'bg-gradient-to-br from-secondary to-cyan-700 text-black border border-secondary/50' :
                                                                    player.rank === 3 ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white border border-gray-500/50' :
                                                                        'bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/5'
                                                                }`}>
                                                                {player.rank}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td 
                                                        className="px-2 md:px-6 py-2 md:py-4 min-w-0 relative group/name"
                                                        onMouseEnter={() => {
                                                            setDetailPlayer(player);
                                                            setTooltipVisible(true);
                                                        }}
                                                        onMouseLeave={() => setTooltipVisible(false)}
                                                    >
                                                        <div className="flex items-center gap-2 md:gap-4 h-full">
                                                            <div className="relative shrink-0">
                                                                <img
                                                                    src={player.avatar || `https://ui-avatars.com/api/?name=${player.name.replace(' ', '+')}&background=random`}
                                                                    alt={player.name}
                                                                    className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-white/10 group-hover:border-primary transition-colors"
                                                                />
                                                                {player.change === 'up' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-surface-dark flex items-center justify-center"><span className="material-icons-outlined text-[7px] text-white">arrow_drop_up</span></div>}
                                                                {player.change === 'down' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-surface-dark flex items-center justify-center"><span className="material-icons-outlined text-[7px] text-white">arrow_drop_down</span></div>}
                                                            </div>
                                                            <div className="min-w-0 flex-1 overflow-hidden">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-bold text-gray-900 dark:text-gray-200 group-hover:text-primary transition-colors text-xs md:text-lg truncate">
                                                                        {player.name}
                                                                    </span>
                                                                    {player.isVerified && (
                                                                        <span className="material-icons text-[#00E5FF] text-[11px] md:text-base shrink-0" title="Perfil Verificado">verified</span>
                                                                    )}
                                                                    <button 
                                                                        className="md:hidden ml-auto p-1 bg-primary/10 text-primary rounded-full"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDetailPlayer(player);
                                                                            setTooltipVisible(true);
                                                                        }}
                                                                    >
                                                                        <span className="material-icons text-[14px]">insights</span>
                                                                    </button>
                                                                </div>
                                                                <span className="text-[9px] md:text-xs uppercase tracking-wider text-gray-500 block truncate">
                                                                    {player.numericId ? `CR#${String(player.numericId).padStart(3, '0')}` : 'CR#INV'}<span className="hidden sm:inline"> · {player.city}</span>
                                                                </span>
                                                                
                                                                {/* Botão de Justificativa / Breakdown na área ociosa (Desktop) */}
                                                                <div className="hidden md:flex mt-1 items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const scores = getAllScores(player);
                                                                            setBreakdownData({ player, scores });
                                                                            setShowBreakdown(true);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 hover:bg-primary/20 text-primary border border-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                                                                    >
                                                                        <span className="material-icons text-[12px]">analytics</span>
                                                                        Justificativa de Pontos
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tooltip / Popup Detalhado */}
                                                        {tooltipVisible && detailPlayer?.name === player.name && (
                                                            <>
                                                                {/* Backdrop para Mobile */}
                                                                <div 
                                                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] md:hidden"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTooltipVisible(false);
                                                                    }}
                                                                />
                                                                
                                                                <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:absolute md:inset-auto md:left-full md:top-0 md:ml-4 w-auto md:w-[400px] z-[110] bg-surface-dark border border-primary/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto max-h-[80vh] flex flex-col">
                                                                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/20 to-transparent rounded-t-2xl flex items-center justify-between shrink-0">
                                                                        <div className="flex items-center gap-3">
                                                                            <img src={player.avatar || `https://ui-avatars.com/api/?name=${player.name.replace(' ', '+')}&background=random`} className="w-8 h-8 rounded-full border border-primary/30" alt="" />
                                                                            <div>
                                                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">{player.name}</h4>
                                                                                <p className="text-[10px] text-primary/70 font-bold uppercase">{activeRanking?.label}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="text-right">
                                                                                <p className="text-[10px] text-gray-500 uppercase font-black">Score Total</p>
                                                                                <p className="text-lg font-black text-primary font-display">{player.points.toLocaleString()} pts</p>
                                                                            </div>
                                                                            <button 
                                                                                className="md:hidden text-gray-400 hover:text-white"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTooltipVisible(false);
                                                                                }}
                                                                            >
                                                                                <span className="material-icons">close</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                                                                        <table className="w-full text-left">
                                                                            <thead>
                                                                                <tr className="text-[9px] text-gray-500 border-b border-white/5 uppercase font-black">
                                                                                    <th className="px-3 py-2">Evento / Etapa</th>
                                                                                    <th className="px-3 py-2 text-center">Pos</th>
                                                                                    <th className="px-3 py-2 text-right">Pts</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-white/5">
                                                                                {getAllScores(player).length > 0 ? (
                                                                                    getAllScores(player).map((s, i) => (
                                                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                                            <td className="px-3 py-2">
                                                                                                <p className="text-[11px] font-bold text-gray-200 truncate">{s.eventName}</p>
                                                                                                <p className="text-[9px] text-gray-600">{s.date}</p>
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-center">
                                                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                                                                    s.position === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                                                                    s.position <= 3 ? 'bg-gray-400/20 text-gray-300' : 'text-gray-500'
                                                                                                }`}>
                                                                                                    {s.position}º
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right font-display font-black text-primary text-xs">+{s.points}</td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-600 text-[10px] uppercase font-bold tracking-widest italic">Nenhuma pontuação detalhada</td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <div className="p-3 bg-black/20 rounded-b-2xl border-t border-white/5 shrink-0">
                                                                        <p className="text-[9px] text-gray-500 italic text-center uppercase tracking-tighter">Detalhamento gerado automaticamente pelo sistema de pontuação.</p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </td>

                                                    {/* Latest Scores Column (Replaces Origem) */}
                                                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            {getLastScores(player).length > 0 ? (
                                                                getLastScores(player).map((score, idx) => (
                                                                    <div key={idx} className="flex flex-col items-center">
                                                                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs font-bold text-secondary group-hover:bg-secondary group-hover:text-black transition-colors min-w-[32px] text-center">
                                                                            {score?.points}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-gray-600 text-xs italic">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-1 md:px-6 py-2 md:py-4 text-right">
                                                        <span className="font-display font-black text-sm md:text-xl text-primary text-glow">
                                                            {player.points.toLocaleString()}
                                                        </span>
                                                        <span className="text-[9px] md:text-xs uppercase text-gray-500 ml-0.5">pts</span>
                                                    </td>
                                                    <td className="px-1 md:px-6 py-2 md:py-4 text-center">
                                                        {isAdmin && !isRetracted ? (
                                                            <input
                                                                type="text"
                                                                value={activeRanking.positionPrizes?.[player.rank] || ''}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => onUpdatePrize && onUpdatePrize(activeRankingId, player.rank, e.target.value)}
                                                                placeholder="-"
                                                                className="bg-black/30 border border-white/10 rounded px-1 py-1 text-center text-[10px] md:text-sm text-secondary font-bold w-12 md:w-24 focus:border-secondary outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] md:text-base font-bold text-gray-500 dark:text-gray-400 truncate block text-center">
                                                                {activeRanking.positionPrizes?.[player.rank] || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredRanking.length === 0 && (
                                <div className="p-8 text-center text-gray-500 italic">
                                    Nenhum jogador encontrado com este nome.
                                </div>
                            )}
                        </div>

                        {/* Footer Button - Next Events */}
                        {!isRetracted && (
                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => onNavigate && onNavigate('calendar')}
                                    className="group bg-surface-dark border border-white/10 hover:border-primary/50 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto hover:-translate-y-1"
                                >
                                    <span className="bg-primary/20 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <span className="material-icons-outlined">event</span>
                                    </span>
                                    VER PRÓXIMOS EVENTOS DO RANK
                                    <span className="material-icons-outlined text-gray-500 group-hover:text-white transition-colors">arrow_forward</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* RULES MODAL */}
            {showRules && activeRanking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative animate-float flex flex-col max-h-[90vh]">
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => setShowRules(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <span className="material-icons-outlined text-3xl text-primary">leaderboard</span>
                                <h3 className="text-xl font-bold text-white">Regulamento: {activeRanking.label}</h3>
                            </div>

                            <div className="space-y-6 text-base text-gray-300 whitespace-pre-wrap">
                                {activeRanking.rules ? activeRanking.rules : "Regulamento não disponível para este ranking."}
                            </div>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-all"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILED POINT BREAKDOWN MODAL */}
            {showBreakdown && breakdownData && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0A0B1A] border border-primary/30 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(217,0,255,0.15)] relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[85vh] overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img 
                                        src={breakdownData.player.avatar || `https://ui-avatars.com/api/?name=${breakdownData.player.name.replace(' ', '+')}&background=random`} 
                                        className="w-12 h-12 rounded-2xl border-2 border-primary/50 shadow-neon-pink" 
                                        alt="" 
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-md">
                                        <span className="material-icons text-[12px]">analytics</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider">{breakdownData.player.name}</h3>
                                    <p className="text-xs text-primary font-bold uppercase tracking-widest flex items-center gap-2">
                                        {activeRanking?.label} 
                                        <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                                        Histórico Justificado
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Score Total no Rank</p>
                                <div className="text-3xl font-black text-primary font-display drop-shadow-[0_0_10px_rgba(217,0,255,0.3)]">
                                    {breakdownData.player.points.toLocaleString()} <span className="text-xs uppercase ml-1">pts</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowBreakdown(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/5 p-2 rounded-full transition-all"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {breakdownData.scores.length > 0 ? (
                                breakdownData.scores.map((s, idx) => (
                                    <div key={idx} className="group/item bg-white/5 border border-white/5 hover:border-primary/20 rounded-2xl p-4 transition-all hover:bg-white/[0.07]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                    <span className="material-icons text-xl">event_available</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-100 uppercase text-sm tracking-wide group-hover/item:text-primary transition-colors">{s.eventName}</h4>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                            <span className="material-icons text-[12px]">calendar_today</span>
                                                            {new Date(s.date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                                            s.position === 1 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            s.position <= 3 ? 'bg-white/10 text-gray-300 border border-white/5' : 
                                                            'bg-black/20 text-gray-500 border border-white/5'
                                                        }`}>
                                                            {s.position}º LUGAR
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-center md:text-right">
                                                <p className="text-[9px] text-primary font-black uppercase tracking-widest">Ganhos no Evento</p>
                                                <p className="text-xl font-display font-black text-primary">+{s.points} pts</p>
                                            </div>
                                        </div>

                                        {/* Step by Step Breakdown */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Composição da Pontuação:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {s.breakdown && s.breakdown.map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                                                        <span className="text-[11px] font-black text-gray-200">+{Math.round(item.value)} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <span className="material-icons text-4xl text-gray-700">history</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-black text-gray-500 uppercase">Sem histórico detalhado</p>
                                        <p className="text-sm text-gray-700">Este jogador ainda não possui pontuações registradas neste ranking.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-black/40 border-t border-white/10 text-center">
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                <span className="material-icons text-[14px]">verified_user</span>
                                Cálculos validados de acordo com o regulamento oficial
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* SCORING FORMULA EDITOR MODAL */}
            {showFormulaEditor && activeRanking && (
                <ScoringFormulaEditor
                    schemas={globalScoringSchemas || []}
                    onSave={(schemas) => {
                        if (onUpdateGlobalSchemas) {
                            onUpdateGlobalSchemas(schemas);
                        }
                        setShowFormulaEditor(false);
                    }}
                    onClose={() => setShowFormulaEditor(false)}
                />
            )}

            {/* ADMIN EDIT RANKING MODAL */}
            {editingRanking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative animate-float flex flex-col max-h-[90vh]">
                        <form onSubmit={handleSaveRanking} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                <h3 className="text-xl font-bold text-white">Editar Ranking</h3>
                                <button type="button" onClick={() => setEditingRanking(null)} className="text-gray-400 hover:text-white">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Ranking (Aba)</label>
                                    <input
                                        type="text"
                                        value={editingRanking.label}
                                        onChange={e => setEditingRanking({ ...editingRanking, label: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordem (Aba)</label>
                                    <input
                                        type="number"
                                        value={editingRanking.order || 0}
                                        onChange={e => setEditingRanking({ ...editingRanking, order: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição (Subtítulo)</label>
                                <input
                                    type="text"
                                    value={editingRanking.description}
                                    onChange={e => setEditingRanking({ ...editingRanking, description: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Início</label>
                                    <input
                                        type="date"
                                        value={editingRanking.startDate || ''}
                                        onChange={e => setEditingRanking({ ...editingRanking, startDate: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fim</label>
                                    <input
                                        type="date"
                                        value={editingRanking.endDate || ''}
                                        onChange={e => setEditingRanking({ ...editingRanking, endDate: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Mapeamento de Fórmulas</h4>
                                <div className="space-y-4">
                                    {(['weekly', 'monthly', 'special', 'cash_online', 'mtt_online', 'sit_n_go', 'satellite'] as const).map((type) => (
                                        <div key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase">
                                                {type === 'weekly' ? 'Semanal' :
                                                    type === 'monthly' ? 'Mensal' :
                                                        type === 'special' ? 'Especial' :
                                                            type === 'cash_online' ? 'Cash Game Online' :
                                                                type === 'mtt_online' ? 'MTT Online' :
                                                                    type === 'sit_n_go' ? 'Sit & Go' :
                                                                        'Satélite'}
                                            </label>
                                            <select
                                                value={editingRanking.scoringSchemaMap?.[type] || ''}
                                                onChange={(e) => {
                                                    const newMap = { ...editingRanking.scoringSchemaMap, [type]: e.target.value };
                                                    setEditingRanking({ ...editingRanking, scoringSchemaMap: newMap });
                                                }}
                                                className="bg-black/40 border border-white/10 rounded p-2 text-white text-xs w-full sm:w-64 focus:border-primary outline-none"
                                            >
                                                <option value="">Padrão do App</option>
                                                <option value="null">Sem Pontuação</option>
                                                {globalScoringSchemas?.map((schema) => (
                                                    <option key={schema.id} value={schema.id}>{schema.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Regulamento (Texto Completo)</label>
                                <textarea
                                    value={editingRanking.rules}
                                    onChange={e => setEditingRanking({ ...editingRanking, rules: e.target.value })}
                                    className="w-full h-40 bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                                {onDeleteRanking && (
                                    <button
                                        type="button"
                                        onClick={() => { onDeleteRanking(editingRanking.id); setEditingRanking(null); }}
                                        className="text-red-500 hover:text-red-400 font-bold text-sm"
                                    >
                                        Excluir Ranking
                                    </button>
                                )}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setEditingRanking(null)} className="px-4 py-2 text-gray-400">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-lg">Salvar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};