import React, { useState, useEffect } from 'react';
import { RankingPlayer, Event, RankingInstance, ScoringSchema, RankingFormula } from '../types';
import { ScoringFormulaEditor } from './ScoringFormulaEditor';
import { calculatePoints } from '../utils/scoring';

interface RankingTableProps {
    isAdmin?: boolean;
    onSelectPlayer?: (player: RankingPlayer) => void;
    rankings: RankingInstance[]; // Unified Rankings
    onUpdateRankingMeta?: (id: string, updates: Partial<RankingInstance>) => void; // Admin
    onAddRanking?: () => void; // Admin
    onDeleteRanking?: (id: string) => void; // Admin
    onUpdatePrize?: (rankingId: string, playerName: string, newPrize: string) => void;
    onNavigate?: (view: string) => void;
    currentUser?: { name?: string };
    events?: Event[];
    globalScoringSchemas?: ScoringSchema[];
    onUpdateGlobalSchemas?: (schemas: ScoringSchema[]) => void;
}

type SimType = 'weekly' | 'monthly' | 'special';

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
    onUpdateGlobalSchemas
}) => {
    const [activeRankingId, setActiveRankingId] = useState<string>('annual');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSimulator, setShowSimulator] = useState(false);
    const [showFormulaEditor, setShowFormulaEditor] = useState(false);

    // Admin Editing State
    const [editingRanking, setEditingRanking] = useState<RankingInstance | null>(null);

    // --- SIMULATOR STATE ---
    const [simType, setSimType] = useState<string>('weekly');
    const [simPlayers, setSimPlayers] = useState<number>(0);
    const [simBuyin, setSimBuyin] = useState<number>(0);
    const [simIsFt, setSimIsFt] = useState<boolean>(false);
    const [simIsVip, setSimIsVip] = useState<boolean>(false);
    const [simPrize, setSimPrize] = useState<number>(0);
    const [simResult, setSimResult] = useState<number>(0);

    // Ensure activeRankingId is valid (fallback to first available if deleted)
    useEffect(() => {
        if (rankings.length > 0 && !rankings.find(r => r.id === activeRankingId)) {
            setActiveRankingId(rankings[0].id);
        }
    }, [rankings, activeRankingId]);

    const activeRanking = rankings.find(r => r.id === activeRankingId) || rankings[0];

    // --- SIMULATOR LOGIC ---
    useEffect(() => {
        let points = 0;
        const p = simPlayers || 0;
        const b = simBuyin || 0;
        const z = simPrize || 0;
        const spent = 0; // Simulator doesn't have input for spent yet
        const rake = 0; // Simulator doesn't have input for rake yet

        // Try to find a schema specific to this ranking and event type first
        const mappedSchemaId = activeRanking?.scoringSchemaMap?.[simType];

        // Use mapped ID, or search by name (simType might be a schema name in old data)
        const schema = globalScoringSchemas?.find(s => s.id === mappedSchemaId)
            || activeRanking?.scoringSchemas?.find(s => s.id === simType || s.name === simType);

        if (schema || mappedSchemaId) {
            points = calculatePoints(
                simType as RankingFormula,
                p,
                b,
                simIsFt ? 1 : 10, // Default to 1st if FT for simplicity in sim, or add position input
                z,
                simIsVip,
                schema?.id || mappedSchemaId,
                globalScoringSchemas || activeRanking?.scoringSchemas
            );
        } else {
            // Fallback to utility's legacy logic
            points = calculatePoints(simType as RankingFormula, p, b, simIsFt ? 1 : 10, z, simIsVip);
        }

        setSimResult(Math.round(points));
    }, [simType, simPlayers, simBuyin, simIsFt, simIsVip, simPrize, activeRanking]);

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

    const filteredRanking = activeRanking?.players.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.city.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Get current user points for projection
    const userCurrentPoints = currentUser?.name ? (activeRanking?.players.find(p => p.name === currentUser.name)?.points || 0) : 0;

    // Helper function to get last 3 scores
    const getLastScores = (playerName: string) => {
        if (!events) return [];

        const scores = events
            .filter(e => e.status === 'closed' && e.results && (!e.includedRankings || e.includedRankings.includes(activeRankingId)))
            .map(e => {
                const res = e.results?.find(r => r.name.toLowerCase() === playerName.toLowerCase());
                if (!res) return null;

                // Prioritize ranking-specific points, fallback to generic calculatedPoints
                const points = res.pointsPerRanking?.[activeRankingId] ?? res.calculatedPoints;

                return points > 0
                    ? { date: e.date, points }
                    : null;
            })
            .filter(item => item !== null)
            .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())
            .slice(0, 3);

        return scores;
    };

    const handleSaveRanking = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRanking && onUpdateRankingMeta) {
            onUpdateRankingMeta(editingRanking.id, editingRanking);
            setEditingRanking(null);
        }
    };

    return (
        <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen relative">
            {/* Primary Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-10 group relative">
                    <h2 className="text-4xl font-display font-black text-gray-900 dark:text-white tracking-wider uppercase">
                        {activeRanking?.label || 'Ranking'}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mt-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 font-light tracking-wide uppercase text-sm">
                        {activeRanking?.description}
                    </p>
                    {activeRanking?.startDate && activeRanking?.endDate && (
                        <div className="mt-2 text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-[0.3em]">
                            {new Date(activeRanking.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {new Date(activeRanking.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                    )}

                    {/* ADMIN EDIT BUTTON FOR CURRENT RANKING */}
                    {isAdmin && activeRanking && (
                        <div className="absolute top-0 right-0 lg:right-[-50px] flex flex-col gap-2">
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
                        </div>
                    )}
                </div>

                {/* Dynamic Tabs + Rules Button */}
                <div className="flex flex-col items-center justify-center mb-12 gap-4">
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-1 rounded-full flex flex-wrap justify-center backdrop-blur-md shadow-lg max-w-full overflow-x-auto">
                        {rankings.map(ranking => (
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
                    </div>
                </div>

                {/* --- SIMULADOR DE PONTOS --- */}
                {showSimulator && (
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
                                        ) : (
                                            <>
                                                <option value="weekly">Semanal (Padrão)</option>
                                                <option value="monthly">Mensal (Padrão)</option>
                                                <option value="special">Especial (Padrão)</option>
                                            </>
                                        )}
                                    </select>
                                </div>
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
                            </div>

                            {/* Checkboxes & Result */}
                            <div className="lg:col-span-1 flex flex-col justify-between h-full gap-4">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={simIsFt}
                                            onChange={(e) => setSimIsFt(e.target.checked)}
                                            className="w-4 h-4 accent-secondary bg-black border-white/20 rounded"
                                        />
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">Mesa Final?</span>
                                    </label>
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
                            <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
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
                {activeRanking?.prizeInfoTitle && (
                    <div className="max-w-3xl mx-auto mb-8">
                        <h3 className="text-primary font-bold text-2xl mb-6 flex items-center justify-center gap-2">
                            <span className="material-icons-outlined">emoji_events</span> Ranking Geral 2026
                        </h3>
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-2xl border border-primary/20 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg text-black font-black text-2xl">
                                    3
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-black text-xl uppercase italic">{activeRanking.prizeInfoTitle}</div>
                                    <div className="text-primary font-bold">THE CHOSEN 30K+</div>
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
                                        <img src={player.avatar || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-6 h-6 rounded-full" alt="" />
                                        {player.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Noble Table */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl relative z-10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-5 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 md:py-5 text-xs md:text-sm font-black text-primary uppercase tracking-wider md:tracking-[0.2em] w-12 md:w-auto text-center md:text-left">Rank</th>
                                    <th className="px-3 md:px-6 py-3 md:py-5 text-xs md:text-sm font-black text-primary uppercase tracking-wider md:tracking-[0.2em]">Competidor</th>
                                    <th className="px-6 py-5 text-sm font-black text-primary uppercase tracking-[0.2em] hidden md:table-cell">Últimas Pontuações</th>
                                    <th className="px-3 md:px-6 py-3 md:py-5 text-xs md:text-sm font-black text-primary uppercase tracking-wider md:tracking-[0.2em] text-right">Score</th>
                                    <th className="px-3 md:px-6 py-3 md:py-5 text-xs md:text-sm font-black text-secondary uppercase tracking-wider md:tracking-[0.2em] text-center">Prêmio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {filteredRanking.map((player) => (
                                    <tr
                                        key={player.name + player.rank} // Key composta para evitar erros
                                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => onSelectPlayer && onSelectPlayer(player)}
                                    >
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-display font-bold text-sm md:text-lg shadow-lg group-hover:scale-110 transition-transform ${player.rank === 1 ? 'bg-gradient-to-br from-primary to-purple-700 text-white border border-primary/50' :
                                                    player.rank === 2 ? 'bg-gradient-to-br from-secondary to-cyan-700 text-black border border-secondary/50' :
                                                        player.rank === 3 ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white border border-gray-500/50' :
                                                            'bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/5'
                                                    }`}>
                                                    {player.rank}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={player.avatar || `https://ui-avatars.com/api/?name=${player.name.replace(' ', '+')}&background=random`}
                                                        alt={player.name}
                                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-white/10 group-hover:border-primary transition-colors"
                                                    />
                                                    {player.change === 'up' && <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center"><span className="material-icons-outlined text-[8px] md:text-[10px] text-white">arrow_drop_up</span></div>}
                                                    {player.change === 'down' && <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center"><span className="material-icons-outlined text-[8px] md:text-[10px] text-white">arrow_drop_down</span></div>}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block font-bold text-gray-900 dark:text-gray-200 group-hover:text-primary transition-colors text-sm md:text-lg truncate max-w-[120px] sm:max-w-none">
                                                        {player.name}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 block truncate max-w-[120px]">
                                                        {player.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Latest Scores Column (Replaces Origem) */}
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                {getLastScores(player.name).length > 0 ? (
                                                    getLastScores(player.name).map((score, idx) => (
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

                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right">
                                            <span className="font-display font-black text-base md:text-xl text-primary text-glow">
                                                {player.points.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] md:text-xs uppercase text-gray-500 ml-1">pts</span>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                            {isAdmin ? (
                                                <input
                                                    type="text"
                                                    value={player.manualPrize || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => onUpdatePrize && onUpdatePrize(activeRankingId, player.name, e.target.value)}
                                                    placeholder="-"
                                                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-center text-xs md:text-sm text-secondary font-bold w-16 md:w-24 focus:border-secondary outline-none"
                                                />
                                            ) : (
                                                <span className="text-xs md:text-base font-bold text-gray-500 dark:text-gray-400">
                                                    {player.manualPrize || '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Ranking (Aba)</label>
                                <input
                                    type="text"
                                    value={editingRanking.label}
                                    onChange={e => setEditingRanking({ ...editingRanking, label: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                />
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
                                <h4 className="text-sm font-bold text-primary mb-2">Box de Destaque (Opcional)</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título do Prêmio (ex: 3 Vagas)</label>
                                        <input
                                            type="text"
                                            value={editingRanking.prizeInfoTitle || ''}
                                            onChange={e => setEditingRanking({ ...editingRanking, prizeInfoTitle: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detalhes do Prêmio</label>
                                        <input
                                            type="text"
                                            value={editingRanking.prizeInfoDetail || ''}
                                            onChange={e => setEditingRanking({ ...editingRanking, prizeInfoDetail: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm"
                                        />
                                    </div>
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