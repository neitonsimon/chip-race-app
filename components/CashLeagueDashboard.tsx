import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CashLeague, CashLeagueRound, CashLeagueParticipant } from '../types';

// Standings calculation helper
export function calculateLeagueStandings(league: CashLeague) {
    const buyin = Number(league.buyin) || 100;
    const playerStats = new Map<string, { points: number; profit: number; roundsPlayed: number }>();

    // Initialize players
    (league.participants || []).forEach(p => {
        playerStats.set(p.name, { points: 0, profit: 0, roundsPlayed: 0 });
    });

    // Loop through completed rounds
    const rounds = league.rounds || [];
    rounds.forEach(r => {
        if (r.status === 'completed') {
            const roundResults = (league.results && league.results[String(r.number)]) || {};
            Object.entries(roundResults).forEach(([playerName, res]) => {
                if (!playerStats.has(playerName)) {
                    playerStats.set(playerName, { points: 0, profit: 0, roundsPlayed: 0 });
                }
                const participated = res.participated !== false;
                if (!participated) {
                    return;
                }

                const stats = playerStats.get(playerName)!;
                stats.roundsPlayed += 1;
                stats.profit += Number(res.profit_loss) || 0;

                // Formula:
                // +2 pts for participation
                let roundPoints = 2;
                // +1 pt if entered at 20h
                if (res.entered_by_20h) roundPoints += 1;
                // +1 pt if present at 23h
                if (res.stayed_until_23h) roundPoints += 1;

                const profitLoss = Number(res.profit_loss) || 0;
                if (profitLoss >= 0) {
                    // Positive up to 1 buy-in: +3 pts
                    roundPoints += 3;
                    // For each complete buy-in above 1 buy-in: +2 pts
                    const extraBuyins = Math.max(0, Math.floor(profitLoss / buyin) - 1);
                    roundPoints += extraBuyins * 2;
                } else {
                    // Negative up to 1 buy-in: +2 pts
                    roundPoints += 2;
                    // For each complete buy-in lost above 1 buy-in: +1 pt
                    const absLoss = Math.abs(profitLoss);
                    const extraBuyins = Math.max(0, Math.floor(absLoss / buyin) - 1);
                    roundPoints += extraBuyins * 1;
                }
                stats.points += roundPoints;
            });
        }
    });

    const standings = Array.from(playerStats.entries()).map(([name, stats]) => ({
        name,
        ...stats
    }));

    // Tie-breaker rules: 1st points desc, 2nd net profit desc
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.profit - a.profit;
    });

    return standings;
}

export function getRoundDurationText(round: CashLeagueRound) {
    if (!round.time || !round.end_time) return '3h';
    const [sh, sm] = round.time.split(':').map(Number);
    const [eh, em] = round.end_time.split(':').map(Number);
    if (isNaN(sh) || isNaN(eh)) return '3h';
    let diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export const CashLeagueDashboard: React.FC = () => {
    const {
        cashLeagues, handleCreateCashLeague, handleUpdateCashLeague, handleDeleteCashLeague,
        isAdmin, handleNavigate, getAllUniquePlayers, isLoggedIn, currentUser
    } = useApp();

    const [isCrudOpen, setIsCrudOpen] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState<CashLeague | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [modality, setModality] = useState('Hold\'em');
    const [blind, setBlind] = useState('0,10 / 0,20');
    const [buyin, setBuyin] = useState(20);
    const [maxPlayers, setMaxPlayers] = useState(10);
    const [prize, setPrize] = useState('Vaga The Chosen 30K + Troféu');
    const [rounds, setRounds] = useState<CashLeagueRound[]>([
        { number: 1, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
        { number: 2, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
        { number: 3, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
        { number: 4, date: '', time: '20:00', end_time: '23:00', status: 'pending' }
    ]);
    const [participants, setParticipants] = useState<CashLeagueParticipant[]>([]);
    const [newParticipantName, setNewParticipantName] = useState('');

    // New Fields Form states
    const [aporteInicial, setAporteInicial] = useState(0);
    const [bonusResgate, setBonusResgate] = useState(0);
    const [startDate, setStartDate] = useState('Pendente');
    const [weekday, setWeekday] = useState('Terça-feira');
    const [bombPotEvery, setBombPotEvery] = useState(0);
    const [rake, setRake] = useState('5%');
    const [status, setStatus] = useState<'registrando' | 'aguardando_inicio' | 'em_andamento' | 'encerrado'>('registrando');

    const allPlayers = getAllUniquePlayers ? getAllUniquePlayers() : [];

    const resetForm = () => {
        setName('');
        setModality('Hold\'em');
        setBlind('0,10 / 0,20');
        setBuyin(20);
        setMaxPlayers(10);
        setPrize('Vaga The Chosen 30K + Troféu');
        setRounds([
            { number: 1, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 2, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 3, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 4, date: '', time: '20:00', end_time: '23:00', status: 'pending' }
        ]);
        setParticipants([]);
        setNewParticipantName('');
        setSelectedLeague(null);
        setIsEditing(false);

        // New fields reset
        setAporteInicial(0);
        setBonusResgate(0);
        setStartDate('Pendente');
        setWeekday('Terça-feira');
        setBombPotEvery(0);
        setRake('5%');
        setStatus('registrando');
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsEditing(false);
        setIsCrudOpen(true);
    };

    const handleOpenEdit = (league: CashLeague) => {
        setSelectedLeague(league);
        setName(league.name);
        setModality(league.modality);
        setBlind(league.blind);
        setBuyin(league.buyin);
        setMaxPlayers(league.max_players);
        setPrize(league.prize);
        setRounds(league.rounds?.map(r => ({
            ...r,
            end_time: r.end_time || '23:00'
        })) || [
            { number: 1, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 2, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 3, date: '', time: '20:00', end_time: '23:00', status: 'pending' },
            { number: 4, date: '', time: '20:00', end_time: '23:00', status: 'pending' }
        ]);
        setParticipants(league.participants || []);
        
        // Load new fields
        setAporteInicial(league.aporte_inicial || 0);
        setBonusResgate(league.bonus_resgate || 0);
        setStartDate(league.start_date || 'Pendente');
        setWeekday(league.weekday || 'Terça-feira');
        setBombPotEvery(league.bomb_pot_every || 0);
        setRake(league.rake || '5%');
        setStatus(league.status || 'registrando');

        setIsEditing(true);
        setIsCrudOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const leagueData = {
            name,
            modality,
            blind,
            buyin,
            max_players: maxPlayers,
            prize,
            rounds,
            participants,
            status: status,
            results: selectedLeague ? selectedLeague.results : {},
            aporte_inicial: aporteInicial,
            bonus_resgate: bonusResgate,
            start_date: startDate,
            weekday: weekday,
            bomb_pot_every: bombPotEvery,
            rake: rake
        };

        try {
            if (isEditing && selectedLeague) {
                await handleUpdateCashLeague(selectedLeague.id, leagueData);
            } else {
                await handleCreateCashLeague(leagueData);
            }
            setIsCrudOpen(false);
            resetForm();
        } catch (err) {
            alert('Erro ao salvar liga.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta liga?')) return;
        try {
            await handleDeleteCashLeague(id);
            setIsCrudOpen(false);
            resetForm();
        } catch (err) {
            alert('Erro ao excluir liga.');
        }
    };

    const handleRegisterToggle = async (league: CashLeague) => {
        if (league.status !== 'registrando') {
            return; // registration is locked
        }
        if (!isLoggedIn) {
            handleNavigate('login');
            return;
        }
        if (!currentUser?.name) {
            alert('Por favor, defina seu nome de jogador em seu perfil antes de se registrar.');
            return;
        }

        const isParticipant = (league.participants || []).some(
            p => p.name.toLowerCase() === currentUser.name!.toLowerCase()
        );

        let updatedParticipants = [...(league.participants || [])];
        if (isParticipant) {
            // Remove participant
            updatedParticipants = updatedParticipants.filter(
                p => p.name.toLowerCase() !== currentUser.name!.toLowerCase()
            );
        } else {
            // Add participant
            if (updatedParticipants.length >= league.max_players) {
                alert('A liga já atingiu o limite de participantes (Cap)!');
                return;
            }
            updatedParticipants.push({
                name: currentUser.name,
                id: currentUser.id
            });
        }

        try {
            await handleUpdateCashLeague(league.id, {
                participants: updatedParticipants
            });
        } catch (err) {
            alert('Erro ao atualizar registro na liga.');
        }
    };

    const addParticipant = (pName: string) => {
        if (!pName.trim()) return;
        if (participants.some(p => p.name.toLowerCase() === pName.toLowerCase())) {
            alert('Jogador já adicionado.');
            return;
        }
        const profile = allPlayers.find(ap => ap.name.toLowerCase() === pName.toLowerCase());
        const newParticipant: CashLeagueParticipant = {
            name: pName,
            id: profile?.id
        };
        setParticipants([...participants, newParticipant]);
        setNewParticipantName('');
    };

    const removeParticipant = (pName: string) => {
        setParticipants(participants.filter(p => p.name !== pName));
    };

    // Get color code by league category
    const getModalityColor = (mod: string) => {
        if (mod.toLowerCase().includes('hold')) return 'from-[#00bfff]/20 to-[#0080ff]/10 border-[#00bfff]/30 text-[#00bfff]';
        if (mod.toLowerCase().includes('omaha')) return 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400';
        if (mod.toLowerCase().includes('dealer')) return 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400';
        return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400';
    };

    const getModalityGlow = (mod: string) => {
        if (mod.toLowerCase().includes('hold')) return 'shadow-[0_0_20px_rgba(0,191,255,0.15)] hover:border-[#00e0ff]/80';
        if (mod.toLowerCase().includes('omaha')) return 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-purple-500/80';
        if (mod.toLowerCase().includes('dealer')) return 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-500/80';
        return 'shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/80';
    };

    return (
        <div className="py-8 relative overflow-hidden min-h-screen bg-[url('/home-bg.jpg')] bg-cover bg-center bg-fixed text-white">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-0"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Page */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 mt-6">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.1em] drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                            Chip Race <span className="text-[#00e0ff]">Cash League</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 max-w-xl">
                            Dispute quatro rodadas de Cash Game oficial, suba no ranking da sua liga e garanta a sua vaga no prestigiado The Chosen 30K.
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleOpenCreate}
                            className="font-display bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)] hover:scale-[1.03]"
                        >
                            Nova Liga
                        </button>
                    )}
                </div>

                {/* Leagues Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(cashLeagues || []).map((league) => {
                        const standings = calculateLeagueStandings(league);
                        const leader = standings[0]?.name || 'Nenhum';
                        const enrolledCount = league.participants?.length || 0;
                        const completedRounds = (league.rounds || []).filter(r => r.status === 'completed').length;
                        const currentRound = completedRounds < 4 ? completedRounds + 1 : 4;
                        const nextRound = league.rounds?.[completedRounds] || league.rounds?.[3];
                        
                        const isUserRegistered = isLoggedIn && currentUser?.name && (league.participants || []).some(
                            p => p.name.toLowerCase() === currentUser.name!.toLowerCase()
                        );

                        // Refunds per round calculation: (aporte / 4) + bonus
                        const roundRefund = (Number(league.aporte_inicial || 0) / 4) + Number(league.bonus_resgate || 0);

                        // Dynamic round duration based on first round
                        const roundDuration = league.rounds?.[0] ? getRoundDurationText(league.rounds[0]) : '3h';

                        // Status elements mapper
                        const renderStatusBadge = () => {
                            switch (league.status) {
                                case 'aguardando_inicio':
                                    return (
                                        <span className="text-[9px] font-black uppercase bg-amber-950/70 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.2)]">
                                            Aguardando Início
                                        </span>
                                    );
                                case 'em_andamento':
                                    return (
                                        <span className="text-[9px] font-black uppercase bg-sky-950/70 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.2)]">
                                            Em Andamento
                                        </span>
                                    );
                                case 'encerrado':
                                    return (
                                        <span className="text-[9px] font-black uppercase bg-red-950/70 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.2)]">
                                            Encerrada
                                        </span>
                                    );
                                case 'registrando':
                                default:
                                    return (
                                        <span className="text-[9px] font-black uppercase bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                                            Registrando
                                        </span>
                                    );
                            }
                        };

                        // Registration Button configuration
                        const getRegButtonConfig = () => {
                            if (league.status === 'registrando') {
                                if (isUserRegistered) {
                                    return {
                                        text: 'Sair da Liga',
                                        className: 'bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border-red-500/20 hover:border-red-600 shadow-none',
                                        disabled: false
                                    };
                                }
                                return {
                                    text: 'Inscrever-se agora (Vagas Limitadas)',
                                    className: 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black border-transparent shadow-[0_0_15px_rgba(245,158,11,0.3)]',
                                    disabled: false
                                };
                            } else if (league.status === 'aguardando_inicio') {
                                return {
                                    text: 'Aguardando Início',
                                    className: 'bg-gray-800/40 border-white/5 text-gray-500 cursor-not-allowed',
                                    disabled: true
                                };
                            } else if (league.status === 'em_andamento') {
                                return {
                                    text: 'Em Andamento',
                                    className: 'bg-gray-800/40 border-white/5 text-gray-500 cursor-not-allowed',
                                    disabled: true
                                };
                            } else {
                                return {
                                    text: 'Encerrada',
                                    className: 'bg-gray-800/40 border-white/5 text-gray-500 cursor-not-allowed',
                                    disabled: true
                                };
                            }
                        };

                        const regButton = getRegButtonConfig();

                        return (
                            <div
                                key={league.id}
                                className={`group relative flex flex-col justify-between bg-[#041225]/50 border-2 border-white/5 hover:border-white/20 rounded-2xl p-5 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 ${getModalityGlow(league.modality)}`}
                            >
                                {/* Background glow indicator */}
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${getModalityColor(league.modality).split(' ')[0]} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity rounded-full`}></div>
                                
                                {/* Status badge */}
                                <div className="absolute top-4 right-4">
                                    {renderStatusBadge()}
                                </div>

                                <div>
                                    {/* Name & Type */}
                                    <h3 className="font-display text-xl font-black text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                        {league.name}
                                    </h3>
                                    
                                    {/* Modality & Blind Badges */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-gradient-to-r ${getModalityColor(league.modality)}`}>
                                            {league.modality}
                                        </span>
                                        <span className="text-xs text-gray-400 font-bold">
                                            Blind: <span className="text-white font-black">{league.blind}</span>
                                        </span>
                                    </div>

                                    {/* Stats List */}
                                    <div className="mt-5 space-y-2 border-t border-white/5 pt-4">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Data de Início:</span>
                                            <span className="font-bold text-white">{league.start_date || 'Pendente'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Dia de Jogo:</span>
                                            <span className="font-bold text-[#00e0ff]">{league.weekday || 'Pendente'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Taxa (Rake):</span>
                                            <span className="font-bold text-[#00e0ff]">{league.rake || '5%'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Duração de cada rodada:</span>
                                            <span className="font-bold text-white">{roundDuration}</span>
                                        </div>
                                        {nextRound && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-400">Próxima Rodada (Horário):</span>
                                                <span className="font-bold text-[#00e0ff]">
                                                    {nextRound.time || '20:00'} às {nextRound.end_time || '23:00'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Inscrição:</span>
                                            <span className="font-bold text-emerald-400">R$ {Number(league.aporte_inicial || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Resg. por Rodada (Resg.):</span>
                                            <span className="font-bold text-emerald-400">4x R$ {roundRefund.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Pote Bomba:</span>
                                            <span className="font-bold text-amber-400">
                                                {league.bomb_pot_every && league.bomb_pot_every > 0 
                                                    ? `A cada ${league.bomb_pot_every} mãos` 
                                                    : 'Desativado'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Cap de Jogadores:</span>
                                            <span className="font-bold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                                                {enrolledCount} / {league.max_players}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Rodada Atual:</span>
                                            <span className="font-bold text-white">
                                                {completedRounds === 4 ? 'Concluída' : `Rodada ${currentRound}/4`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">Líder do Ranking:</span>
                                            <span className="font-black text-emerald-400 flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm">emoji_events</span>
                                                {leader}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Registered Players List */}
                                    {league.participants && league.participants.length > 0 && (
                                        <div className="mt-4 border-t border-white/5 pt-3">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Jogadores Inscritos:</div>
                                            <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto custom-scrollbar">
                                                {league.participants.map(p => (
                                                    <span key={p.name} className="text-[10px] font-medium bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-gray-300">
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons Container */}
                                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-2.5 w-full">
                                    {/* Register Toggle Button (Dynamic based on Status) */}
                                    <button
                                        onClick={() => handleRegisterToggle(league)}
                                        disabled={regButton.disabled}
                                        className={`w-full font-display text-center font-black uppercase tracking-wider text-[10px] py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] border ${regButton.className}`}
                                    >
                                        {regButton.text}
                                    </button>

                                    {/* Ver Liga (Highlighted Cyan/Neon look) */}
                                    <button
                                        onClick={() => handleNavigate(`cash-league-individual-${league.id}`)}
                                        className="w-full font-display bg-[#00e0ff]/10 hover:bg-gradient-to-r hover:from-[#00bfff] hover:to-[#0080ff] text-[#00e0ff] hover:text-black border border-[#00e0ff]/30 hover:border-[#00e0ff] text-center font-black uppercase tracking-widest text-[9px] py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_10px_rgba(0,224,255,0.08)] hover:scale-[1.02]"
                                    >
                                        Ver Classificação & Detalhes
                                    </button>

                                    {isAdmin && (
                                        <div className="flex gap-1.5 justify-end mt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(league)}
                                                className="p-2.5 rounded-xl border border-white/10 hover:border-amber-500 hover:text-amber-400 transition-colors flex items-center justify-center"
                                                title="Editar Liga"
                                            >
                                                <span className="material-icons-outlined text-sm">edit</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rules & Regulations Panel */}
                <div className="mt-16 border-t border-white/10 pt-10">
                    <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                        <span className="material-icons-outlined text-[#00e0ff]">gavel</span>
                        Regulamento Geral - Cash League
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Rule 1 */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-emerald-400 mt-0.5">payments</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Envio de Parcelas</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        As parcelas dos resgates com o bônus serão enviadas no dia da rodada de cada grupo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 2 */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-amber-400 mt-0.5">warning_amber</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Ausência nas Rodadas</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        Não participar de uma rodada penaliza o jogador com a perda de sua parcela do resgate e o bônus dessa parcela.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 3 */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-purple-400 mt-0.5">autorenew</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Recompras Ilimitadas</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        Jogadores podem recomprar quantas vezes quiserem ao longo das rodadas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 4 */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-blue-400 mt-0.5">schedule</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Horário de Pontuação</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        As mesas estarão abertas antes e após as rodadas, porém a pontuação para o ranking será coletada no período das 20hs e 23hs de cada rodada.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 5: Scoring Formula */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-[#00e0ff] mt-0.5">calculate</span>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-white text-sm uppercase">Fórmula de Pontuação</h4>
                                    <ul className="text-gray-400 text-[11px] space-y-1.5 leading-relaxed">
                                        <li>• <span className="text-white font-bold">Participou:</span> +2 pontos.</li>
                                        <li>• <span className="text-[#00e0ff] font-bold">Entrou às 20h:</span> +1 ponto.</li>
                                        <li>• <span className="text-[#00e0ff] font-bold">Presente às 23h:</span> +1 ponto.</li>
                                        <li>• <span className="text-green-400 font-bold">Positivo (até 1 Buy-in completo):</span> +3 pontos.</li>
                                        <li>• <span className="text-red-400 font-bold">Negativo (até 1 Buy-in completo):</span> +2 pontos.</li>
                                        <li>• <span className="text-green-400 font-bold">Lucro Extra:</span> +2 pontos para cada Buy-in completo acima de 1 Buy-in.</li>
                                        <li>• <span className="text-red-400 font-bold">Prejuízo Extra:</span> +1 ponto para cada Buy-in completo acima de 1 Buy-in.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Rule 6: Tie-breakers */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-yellow-400 mt-0.5">emoji_events</span>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-white text-sm uppercase">Critérios de Desempate</h4>
                                    <ol className="text-gray-400 text-[11px] space-y-1.5 leading-relaxed">
                                        <li>1. <span className="text-white font-bold">Total de Pontos no Ranking</span> (Decrescente)</li>
                                        <li>2. <span className="text-emerald-400 font-bold">Lucro Líquido Acumulado</span> (Decrescente)</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Rule 7: Permanencia Minima */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-sky-400 mt-0.5">history</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Permanência Mínima</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        A permanência mínima para receber pontos por abertura da mesa e por participação é de 20 mãos ou perda total das fichas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 8: Encerramento da Mesa */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-red-400 mt-0.5">timer</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Pontos de Encerramento</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        Para receber os pontos de encerramento da mesa, o jogador precisa estar sentado à mesa pelo menos 30 minutos antes do encerramento da mesma.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rule 9: Limite de Buy-ins */}
                        <div className="bg-[#041225]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-green-400 mt-0.5">casino</span>
                                <div>
                                    <h4 className="font-bold text-white text-sm uppercase">Limites de Buy-in</h4>
                                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                        O jogador pode se inscrever e recomprar o buy in mínimo ao máximo da mesa.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin CRUD Modal */}
            {isCrudOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0b081e] border-2 border-[#00e0ff]/40 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,224,255,0.25)] relative overflow-hidden p-6 sm:p-8 flex flex-col max-h-[90vh]">
                        {/* Close button */}
                        <button
                            onClick={() => setIsCrudOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-30"
                        >
                            <span className="material-icons-outlined text-lg">close</span>
                        </button>

                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-2">
                            {isEditing ? 'Editar Liga de Cash' : 'Criar Nova Liga de Cash'}
                        </h2>
                        <div className="h-[2px] w-16 bg-[#00e0ff] rounded-full mb-6"></div>

                        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Row 1: Name & Modality */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome da Liga</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: ⚒️ Liga Ferro"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Modalidade</label>
                                    <select
                                        value={modality}
                                        onChange={(e) => setModality(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                    >
                                        <option value="Hold'em">Hold'em</option>
                                        <option value="Omaha">Omaha</option>
                                        <option value="Dealer Choice">Dealer Choice</option>
                                        <option value="Mixed Games">Mixed Games</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Blind, Buy-in & Max Players */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Blind</label>
                                    <input
                                        type="text"
                                        value={blind}
                                        onChange={(e) => setBlind(e.target.value)}
                                        placeholder="Ex: 0,10 / 0,20"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Buy-in Oficial (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={buyin}
                                        onChange={(e) => setBuyin(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cap Jogadores (Máx)</label>
                                    <input
                                        type="number"
                                        value={maxPlayers}
                                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 3: Inscrição, Bônus Resgate & Pote Bomba */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Inscrição (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={aporteInicial}
                                        onChange={(e) => setAporteInicial(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Bônus Resgate (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bonusResgate}
                                        onChange={(e) => setBonusResgate(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Pote Bomba a cada X mãos</label>
                                    <input
                                        type="number"
                                        value={bombPotEvery}
                                        onChange={(e) => setBombPotEvery(Number(e.target.value))}
                                        placeholder="0 = Desativado"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 4: Data de Início, Dia da Semana, Taxa (Rake) & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Data de Início</label>
                                    <input
                                        type="text"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Ex: 15/08/2026 ou Pendente"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Dia da Semana</label>
                                    <select
                                        value={weekday}
                                        onChange={(e) => setWeekday(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                    >
                                        <option value="Pendente">Pendente</option>
                                        <option value="Segunda-feira">Segunda-feira</option>
                                        <option value="Terça-feira">Terça-feira</option>
                                        <option value="Quarta-feira">Quarta-feira</option>
                                        <option value="Quinta-feira">Quinta-feira</option>
                                        <option value="Sexta-feira">Sexta-feira</option>
                                        <option value="Sábado">Sábado</option>
                                        <option value="Domingo">Domingo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Taxa (Rake)</label>
                                    <input
                                        type="text"
                                        value={rake}
                                        onChange={(e) => setRake(e.target.value)}
                                        placeholder="Ex: 5%"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Status da Liga</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all font-bold text-yellow-400"
                                    >
                                        <option value="registrando">Registrando</option>
                                        <option value="aguardando_inicio">Aguardando Início</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="encerrado">Encerrada</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Prize */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Premiação da Liga</label>
                                <input
                                    type="text"
                                    value={prize}
                                    onChange={(e) => setPrize(e.target.value)}
                                    placeholder="Ex: Vaga The Chosen 30K + Troféu"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            {/* Row 6: Dates of 4 Rounds with custom time range */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Cronograma e Horários das 4 Rodadas Oficiais</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 border border-white/5 rounded-2xl p-4">
                                    {rounds.map((round, idx) => (
                                        <div key={idx} className="space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
                                            <div className="text-[11px] font-black text-[#00e0ff] uppercase">Rodada {round.number}</div>
                                            <div className="flex flex-col gap-1.5">
                                                <input
                                                    type="date"
                                                    value={round.date}
                                                    onChange={(e) => {
                                                        const newRounds = [...rounds];
                                                        newRounds[idx] = { ...newRounds[idx], date: e.target.value };
                                                        setRounds(newRounds);
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                                                />
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <span className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">Início</span>
                                                        <input
                                                            type="time"
                                                            value={round.time}
                                                            onChange={(e) => {
                                                                const newRounds = [...rounds];
                                                                newRounds[idx] = { ...newRounds[idx], time: e.target.value };
                                                                setRounds(newRounds);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-[9px] text-gray-500 block mb-0.5 font-bold uppercase">Fim</span>
                                                        <input
                                                            type="time"
                                                            value={round.end_time || '23:00'}
                                                            onChange={(e) => {
                                                                const newRounds = [...rounds];
                                                                newRounds[idx] = { ...newRounds[idx], end_time: e.target.value };
                                                                setRounds(newRounds);
                                                            }}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Row 7: Players / Participants list */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lista Manual de Jogadores ({participants.length})</label>
                                
                                {/* Add player tool */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        id="custom-player-input"
                                        value={newParticipantName}
                                        onChange={(e) => setNewParticipantName(e.target.value)}
                                        placeholder="Nome do jogador"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addParticipant(newParticipantName);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('custom-player-input') as HTMLInputElement;
                                            if (el) addParticipant(el.value);
                                        }}
                                        className="font-display bg-primary hover:bg-primary/95 text-black font-black uppercase text-[10px] px-4 rounded-xl"
                                    >
                                        Adicionar
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto bg-black/20 border border-white/5 rounded-2xl p-3 custom-scrollbar">
                                    {participants.length === 0 ? (
                                        <span className="text-xs text-gray-600 italic">Nenhum jogador adicionado manualmente.</span>
                                    ) : (
                                        participants.map((p) => (
                                            <div key={p.name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white">
                                                <span>{p.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(p.name)}
                                                    className="text-red-400 hover:text-red-300 font-bold ml-1"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Delete button (only when editing) */}
                            {isEditing && selectedLeague && (
                                <div className="pt-4 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(selectedLeague.id)}
                                        className="w-full py-2.5 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-xs font-bold uppercase text-red-400 transition-colors"
                                    >
                                        Excluir Liga Definitivamente
                                    </button>
                                </div>
                            )}

                            {/* Form Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCrudOpen(false);
                                        resetForm();
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold uppercase text-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-[#00bfff] to-[#0080ff] hover:from-[#00bfff]/90 hover:to-[#0080ff]/90 text-black font-black uppercase tracking-wider text-xs px-6 py-2.5 rounded-xl transition-all"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
