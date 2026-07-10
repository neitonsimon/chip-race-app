import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CashLeague, CashLeagueRound, CashLeagueResult } from '../types';
import { calculateLeagueStandings, getRoundDurationText } from './CashLeagueDashboard';

interface CashLeagueIndividualProps {
    leagueId: string;
}

export const CashLeagueIndividual: React.FC<CashLeagueIndividualProps> = ({ leagueId }) => {
    const { cashLeagues, handleUpdateCashLeague, isAdmin, handleNavigate, isLoggedIn, currentUser } = useApp();
    const league = (cashLeagues || []).find(l => l.id === leagueId);

    const [isLauncherOpen, setIsLauncherOpen] = useState(false);
    const [selectedRound, setSelectedRound] = useState<CashLeagueRound | null>(null);
    const [roundResults, setRoundResults] = useState<Record<string, CashLeagueResult>>({});

    if (!league) {
        return (
            <div className="py-24 text-center text-white bg-black/60 min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#00e0ff]/30 border-t-[#00e0ff] animate-spin mb-4"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Carregando dados da Liga...</p>
            </div>
        );
    }

    const standings = calculateLeagueStandings(league);
    const completedRoundsCount = (league.rounds || []).filter(r => r.status === 'completed').length;
    const remainingRoundsCount = 4 - completedRoundsCount;

    // Refunds per round calculation: (aporte / 4) + bonus
    const roundRefund = (Number(league.aporte_inicial || 0) / 4) + Number(league.bonus_resgate || 0);

    const isUserRegistered = isLoggedIn && currentUser?.name && (league.participants || []).some(
        p => p.name.toLowerCase() === currentUser.name!.toLowerCase()
    );

    // --- Statistics Calculations ---
    const leaderName = standings[0]?.name || 'Nenhum';
    const viceLeaderName = standings[1]?.name || 'Nenhum';
    
    let totalMovedProfit = 0;
    let highestProfit = 0;
    let highestLoss = 0;

    // Loop through results to aggregate statistics
    if (league.results) {
        Object.values(league.results).forEach((roundRes) => {
            Object.values(roundRes).forEach((res) => {
                const profit = Number(res.profit_loss) || 0;
                if (profit > 0) {
                    totalMovedProfit += profit;
                    if (profit > highestProfit) highestProfit = profit;
                } else if (profit < 0) {
                    if (profit < highestLoss) highestLoss = profit;
                }
            });
        });
    }

    const handleOpenLauncher = (round: CashLeagueRound) => {
        setSelectedRound(round);
        
        // Initialize results with existing ones or default values
        const existingResults = (league.results && league.results[String(round.number)]) || {};
        const initialRes: Record<string, CashLeagueResult> = {};
        
        (league.participants || []).forEach(p => {
            if (existingResults[p.name]) {
                initialRes[p.name] = { ...existingResults[p.name] };
                if (initialRes[p.name].participated === undefined) {
                    initialRes[p.name].participated = true; // backward compatibility
                }
            } else {
                initialRes[p.name] = {
                    participated: false,
                    entered_by_20h: false,
                    stayed_until_23h: false,
                    profit_loss: 0
                };
            }
        });
        
        setRoundResults(initialRes);
        setIsLauncherOpen(true);
    };

    const handleSaveResults = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRound) return;

        // Clone current results and update the specific round
        const updatedResults = { ...(league.results || {}) };
        updatedResults[String(selectedRound.number)] = roundResults;

        // Update the rounds array to mark this round as completed
        const updatedRounds = (league.rounds || []).map(r => 
            r.number === selectedRound.number ? { ...r, status: 'completed' as const } : r
        );

        try {
            await handleUpdateCashLeague(league.id, {
                results: updatedResults,
                rounds: updatedRounds
            });
            setIsLauncherOpen(false);
            setSelectedRound(null);
        } catch (err) {
            alert('Erro ao salvar resultados da rodada.');
        }
    };

    const handleResultFieldChange = (playerName: string, field: keyof CashLeagueResult, value: any) => {
        setRoundResults(prev => ({
            ...prev,
            [playerName]: {
                ...prev[playerName],
                [field]: value
            }
        }));
    };

    const handleRegisterToggle = async () => {
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

    return (
        <div className="py-8 relative overflow-hidden min-h-screen bg-[url('/home-bg.jpg')] bg-cover bg-center bg-fixed text-white">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-0"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Back Button */}
                <button
                    onClick={() => handleNavigate('cash-league')}
                    className="flex items-center gap-2 mb-6 px-4 py-2 border border-white/10 hover:border-[#00e0ff]/50 bg-black/30 hover:bg-black/50 text-gray-300 hover:text-[#00e0ff] rounded-xl transition-all duration-300 backdrop-blur-md text-xs font-bold uppercase tracking-wider"
                >
                    <span className="material-icons-outlined text-sm">arrow_back</span>
                    Voltar para o Dashboard
                </button>

                {/* Main Header Card */}
                <div className="bg-[#041225]/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00e0ff]/10 border border-[#00e0ff]/30 text-[#00e0ff] text-xs font-black uppercase tracking-widest rounded-full mb-3 shadow-[0_0_8px_rgba(0,224,255,0.15)]">
                                <span>{league.modality}</span>
                                <span>•</span>
                                <span>Blind {league.blind}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                                {league.name}
                            </h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                Premiação garantida: <span className="text-[#00e0ff] font-bold">{league.prize}</span>
                            </p>
                            
                            {/* Register Toggle Button inside Header */}
                            {(() => {
                                const getRegButtonConfig = () => {
                                    if (league.status === 'registrando') {
                                        if (isUserRegistered) {
                                            return {
                                                text: 'Sair desta Liga',
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
                                const regBtn = getRegButtonConfig();

                                return (
                                    <button
                                        onClick={handleRegisterToggle}
                                        disabled={regBtn.disabled}
                                        className={`mt-4 w-full sm:w-auto font-display text-center font-black uppercase tracking-wider text-[10px] px-6 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] border ${regBtn.className}`}
                                    >
                                        {regBtn.text}
                                    </button>
                                );
                            })()}
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full lg:w-auto mt-4 lg:mt-0">
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Inscrição</div>
                                <div className="text-sm font-black text-emerald-400 mt-1">R$ {Number(league.aporte_inicial || 0).toFixed(2)}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Resgate/Rodada</div>
                                <div className="text-sm font-black text-emerald-400 mt-1">R$ {roundRefund.toFixed(2)}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Dia de Jogo</div>
                                <div className="text-sm font-black text-[#00e0ff] mt-1">{league.weekday || 'Pendente'}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Início</div>
                                <div className="text-sm font-black text-white mt-1">{league.start_date || 'Pendente'}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Duração</div>
                                <div className="text-sm font-black text-white mt-1">
                                    {league.rounds?.[0] ? getRoundDurationText(league.rounds[0]) : '3h'}
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Taxa (Rake)</div>
                                <div className="text-sm font-black text-[#00e0ff] mt-1">{league.rake || '5%'}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Pote Bomba</div>
                                <div className="text-[11px] font-black text-amber-400 mt-1.5 leading-tight">
                                    {league.bomb_pot_every && league.bomb_pot_every > 0 ? `A cada ${league.bomb_pot_every} mãos` : 'Desativado'}
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Vagas (Cap)</div>
                                <div className="text-sm font-black text-white mt-1">{(league.participants || []).length} / {league.max_players}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Standings Table & Rounds Section (9 cols) */}
                    <div className="lg:col-span-9 space-y-8">
                        
                        {/* Standings/Ranking Panel */}
                        <div className="bg-[#041225]/45 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl overflow-hidden">
                            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-[#00e0ff]">leaderboard</span>
                                Classificação Geral
                            </h3>
                            
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 font-bold uppercase">
                                            <th className="py-3 px-2 text-center w-12">Pos</th>
                                            <th className="py-3 px-3">Jogador</th>
                                            <th className="py-3 px-3 text-center">Pontos</th>
                                            <th className="py-3 px-3 text-right">Lucro Líquido</th>
                                            <th className="py-3 px-3 text-center">R. Disp.</th>
                                            <th className="py-3 px-2 text-center w-12">R1</th>
                                            <th className="py-3 px-2 text-center w-12">R2</th>
                                            <th className="py-3 px-2 text-center w-12">R3</th>
                                            <th className="py-3 px-2 text-center w-12">R4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standings.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                                                    Nenhum jogador inscrito nesta liga. Adicione jogadores no painel de administração ou inscreva-se!
                                                </td>
                                            </tr>
                                        ) : (
                                            standings.map((row, idx) => {
                                                const profitStyle = row.profit > 0 
                                                    ? 'text-green-400 font-black' 
                                                    : row.profit < 0 
                                                        ? 'text-red-400' 
                                                        : 'text-gray-400';

                                                return (
                                                    <tr 
                                                        key={row.name} 
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="py-3 px-2 text-center font-mono font-black text-sm">
                                                            {idx === 0 ? (
                                                                <span className="inline-flex w-6 h-6 items-center justify-center bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.2)] animate-pulse">1</span>
                                                            ) : idx === 1 ? (
                                                                <span className="inline-flex w-6 h-6 items-center justify-center bg-gray-400/20 text-gray-300 border border-gray-400/40 rounded-full">2</span>
                                                            ) : idx === 2 ? (
                                                                <span className="inline-flex w-6 h-6 items-center justify-center bg-amber-700/20 text-amber-500 border border-amber-700/40 rounded-full">3</span>
                                                            ) : (
                                                                idx + 1
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 font-bold text-white text-sm">{row.name}</td>
                                                        <td className="py-3 px-3 text-center font-mono font-black text-[#00e0ff] text-sm">{row.points}</td>
                                                        <td className={`py-3 px-3 text-right font-mono text-sm ${profitStyle}`}>
                                                            {row.profit > 0 ? '+' : ''}R$ {row.profit.toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-medium text-gray-300">{row.roundsPlayed} / 4</td>
                                                        
                                                        {/* Round results columns */}
                                                        {[1, 2, 3, 4].map(roundNum => {
                                                            const roundResults = (league.results && league.results[String(roundNum)]) || {};
                                                            const pResult = roundResults[row.name];
                                                            
                                                            let displayPoints = '-';
                                                            let displayClass = 'text-gray-600';
                                                            
                                                            if (pResult) {
                                                                const participated = pResult.participated !== false;
                                                                if (!participated) {
                                                                    displayPoints = '-';
                                                                    displayClass = 'text-gray-600';
                                                                } else {
                                                                    // Formula:
                                                                    // +2 pts for participation
                                                                    let pts = 2;
                                                                    // +1 pt if entered at 20h
                                                                    if (pResult.entered_by_20h) pts += 1;
                                                                    // +1 pt if present at 23h
                                                                    if (pResult.stayed_until_23h) pts += 1;
                                                                    
                                                                    const pProfit = Number(pResult.profit_loss) || 0;
                                                                    if (pProfit >= 0) {
                                                                        // Positive up to 1 buy-in: +3 pts
                                                                        pts += 3;
                                                                        // For each complete buy-in above 1 buy-in: +2 pts
                                                                        const extraBuyins = Math.max(0, Math.floor(pProfit / Number(league.buyin)) - 1);
                                                                        pts += extraBuyins * 2;
                                                                    } else {
                                                                        // Negative up to 1 buy-in: +2 pts
                                                                        pts += 2;
                                                                        // For each complete buy-in lost above 1 buy-in: +1 pt
                                                                        const absLoss = Math.abs(pProfit);
                                                                        const extraBuyins = Math.max(0, Math.floor(absLoss / Number(league.buyin)) - 1);
                                                                        pts += extraBuyins * 1;
                                                                    }
                                                                    displayPoints = `${pts}`;
                                                                    displayClass = 'text-gray-200 font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded';
                                                                }
                                                            }

                                                            return (
                                                                <td key={roundNum} className="py-3 px-2 text-center">
                                                                    <span className={displayClass}>{displayPoints}</span>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Rounds Administration List */}
                        <div className="bg-[#041225]/45 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-[#00e0ff]">schedule</span>
                                Cronograma e Resultados das Rodadas
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(league.rounds || []).map((round) => (
                                    <div 
                                        key={round.number}
                                        className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <div className="text-xs font-black text-[#00e0ff] uppercase tracking-wider">Rodada {round.number}</div>
                                            <div className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                                                <span className="material-icons-outlined text-xs text-gray-500">calendar_today</span>
                                                {round.date ? new Date(round.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não definida'}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                <span className="material-icons-outlined text-xs text-gray-500">schedule</span>
                                                Horário: {round.time || '20:00'} às {round.end_time || '23:00'} (Duração: {getRoundDurationText(round)})
                                            </div>
                                            <div className="mt-2.5 flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${round.status === 'completed' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                                <span className="text-[10px] font-black uppercase text-gray-400">
                                                    {round.status === 'completed' ? 'Finalizada' : 'Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleOpenLauncher(round)}
                                                    className="font-display bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-black font-black uppercase tracking-widest text-[9px] px-4 py-2.5 rounded-xl transition-all"
                                                >
                                                    {round.status === 'completed' ? 'Re-lançar' : 'Lançar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Statistics Side Panel (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Statistics Card */}
                        <div className="bg-[#041225]/45 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl space-y-6">
                            <h3 className="text-base font-black uppercase tracking-wider text-white border-b border-white/10 pb-3 flex items-center gap-2">
                                <span className="material-icons-outlined text-[#00e0ff]">analytics</span>
                                Painel de Estatísticas
                            </h3>

                            {/* Stat Items */}
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Líder Atual</div>
                                    <div className="text-sm font-black text-yellow-400 mt-1 flex items-center gap-1 truncate">
                                        <span className="material-icons-outlined text-sm">emoji_events</span>
                                        {leaderName}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Vice-Líder</div>
                                    <div className="text-sm font-black text-gray-300 mt-1 flex items-center gap-1 truncate">
                                        <span className="material-icons-outlined text-sm">sports_score</span>
                                        {viceLeaderName}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rodadas Conc.</div>
                                        <div className="text-base font-black text-white mt-1">{completedRoundsCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Restantes</div>
                                        <div className="text-base font-black text-white mt-1">{remainingRoundsCount}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total de Jogadores</div>
                                    <div className="text-base font-black text-white mt-1">{(league.participants || []).length}</div>
                                </div>

                                <div className="border-t border-white/5 pt-4">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lucro Movimentado (Oficial)</div>
                                    <div className="text-base font-black text-green-400 mt-1">R$ {totalMovedProfit.toFixed(2)}</div>
                                    <div className="text-[9px] text-gray-500 mt-0.5">Soma de todos os lucros oficiais</div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Maior Lucro Individual</div>
                                    <div className="text-sm font-black text-green-400 mt-1">+R$ {highestProfit.toFixed(2)}</div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Maior Prejuízo Individual</div>
                                    <div className="text-sm font-black text-red-400 mt-1">R$ {highestLoss.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Enrolled Players Card */}
                        <div className="bg-[#041225]/45 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl space-y-4">
                            <h3 className="text-base font-black uppercase tracking-wider text-white border-b border-white/10 pb-3 flex items-center gap-2">
                                <span className="material-icons-outlined text-[#00e0ff]">groups</span>
                                Jogadores Inscritos ({(league.participants || []).length})
                            </h3>
                            <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {(league.participants || []).length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">Nenhum jogador inscrito.</p>
                                ) : (
                                    (league.participants || []).map(p => (
                                        <span key={p.name} className="text-[10px] font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-gray-300">
                                            {p.name}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Launch Round Results Modal */}
            {isLauncherOpen && selectedRound && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0b081e] border-2 border-[#00e0ff]/40 rounded-3xl w-full max-w-3xl shadow-[0_0_50px_rgba(0,224,255,0.25)] relative overflow-hidden p-6 sm:p-8 flex flex-col max-h-[90vh]">
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setIsLauncherOpen(false);
                                setSelectedRound(null);
                            }}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-30"
                        >
                            <span className="material-icons-outlined text-lg">close</span>
                        </button>

                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-2">
                            Lançar Resultados — {league.name} — Rodada {selectedRound.number}
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Lançamento manual dos dados da rodada. Os pontos serão calculados automaticamente com base na fórmula oficial.
                        </p>
                        <div className="h-[2px] w-16 bg-[#00e0ff] rounded-full mb-6"></div>

                        <form onSubmit={handleSaveResults} className="flex flex-col flex-1 overflow-hidden">
                            {/* Table of inputs */}
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar mb-6">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 font-bold uppercase">
                                            <th className="py-2.5 px-3">Jogador</th>
                                            <th className="py-2.5 px-3 text-center">Participou?</th>
                                            <th className="py-2.5 px-3 text-center">Entrou às 20h?</th>
                                            <th className="py-2.5 px-3 text-center">Ficou às 23h?</th>
                                            <th className="py-2.5 px-3 text-right">Lucro (+) (R$)</th>
                                            <th className="py-2.5 px-3 text-right">Prejuízo (-) (R$)</th>
                                            <th className="py-2.5 px-3 text-center w-32">Pontos na Rodada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(league.participants || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-6 text-center text-gray-500 italic">
                                                    Adicione participantes à liga para lançar os resultados.
                                                </td>
                                            </tr>
                                        ) : (
                                            (league.participants || []).map((p) => {
                                                const pres = roundResults[p.name] || {
                                                    participated: false,
                                                    entered_by_20h: false,
                                                    stayed_until_23h: false,
                                                    profit_loss: 0
                                                };

                                                const isParticipating = pres.participated !== false;

                                                const livePoints = (() => {
                                                    if (!isParticipating) return 0;
                                                    
                                                    // Formula:
                                                    // +2 pts for participation
                                                    let pts = 2;
                                                    // +1 pt if entered at 20h
                                                    if (pres.entered_by_20h) pts += 1;
                                                    // +1 pt if present at 23h
                                                    if (pres.stayed_until_23h) pts += 1;
                                                    
                                                    const buyin = Number(league.buyin) || 100;
                                                    const pProfit = Number(pres.profit_loss) || 0;
                                                    if (pProfit >= 0) {
                                                        // Positive up to 1 buy-in: +3 pts
                                                        pts += 3;
                                                        // For each complete buy-in above 1 buy-in: +2 pts
                                                        const extraBuyins = Math.max(0, Math.floor(pProfit / buyin) - 1);
                                                        pts += extraBuyins * 2;
                                                    } else {
                                                        // Negative up to 1 buy-in: +2 pts
                                                        pts += 2;
                                                        // For each complete buy-in lost above 1 buy-in: +1 pt
                                                        const absLoss = Math.abs(pProfit);
                                                        const extraBuyins = Math.max(0, Math.floor(absLoss / buyin) - 1);
                                                        pts += extraBuyins * 1;
                                                    }
                                                    return pts;
                                                })();

                                                return (
                                                    <tr key={p.name} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!isParticipating ? 'opacity-40' : ''}`}>
                                                        <td className="py-3 px-3 font-bold text-white text-sm">{p.name}</td>
                                                        
                                                        {/* Checkbox Participou */}
                                                        <td className="py-3 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isParticipating}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    handleResultFieldChange(p.name, 'participated', checked);
                                                                    if (!checked) {
                                                                        // Reset other fields if they did not participate
                                                                        handleResultFieldChange(p.name, 'entered_by_20h', false);
                                                                        handleResultFieldChange(p.name, 'stayed_until_23h', false);
                                                                        handleResultFieldChange(p.name, 'profit_loss', 0);
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded bg-black border-white/10 text-yellow-500 focus:ring-0 cursor-pointer"
                                                            />
                                                        </td>

                                                        {/* Checkbox 20h */}
                                                        <td className="py-3 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={pres.entered_by_20h}
                                                                disabled={!isParticipating}
                                                                onChange={(e) => handleResultFieldChange(p.name, 'entered_by_20h', e.target.checked)}
                                                                className="w-4 h-4 rounded bg-black border-white/10 text-primary focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            />
                                                        </td>

                                                        {/* Checkbox 23h */}
                                                        <td className="py-3 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={pres.stayed_until_23h}
                                                                disabled={!isParticipating}
                                                                onChange={(e) => handleResultFieldChange(p.name, 'stayed_until_23h', e.target.checked)}
                                                                className="w-4 h-4 rounded bg-black border-white/10 text-primary focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            />
                                                        </td>

                                                        {/* Lucro (+) Input */}
                                                        <td className="py-3 px-3 text-right">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={pres.profit_loss > 0 ? pres.profit_loss : ''}
                                                                disabled={!isParticipating}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, Number(e.target.value));
                                                                    handleResultFieldChange(p.name, 'profit_loss', val);
                                                                }}
                                                                placeholder="0.00"
                                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-green-400 font-bold"
                                                            />
                                                        </td>

                                                        {/* Prejuízo (-) Input */}
                                                        <td className="py-3 px-3 text-right">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={pres.profit_loss < 0 ? Math.abs(pres.profit_loss) : ''}
                                                                disabled={!isParticipating}
                                                                onChange={(e) => {
                                                                    const val = Math.max(0, Number(e.target.value));
                                                                    handleResultFieldChange(p.name, 'profit_loss', -val);
                                                                }}
                                                                placeholder="0.00"
                                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 font-bold"
                                                            />
                                                        </td>

                                                        {/* Live calculated points */}
                                                        <td className="py-3 px-3 text-center font-mono font-black text-[#00e0ff] text-sm">
                                                            {livePoints} pts
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLauncherOpen(false);
                                        setSelectedRound(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold uppercase text-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-wider text-xs px-6 py-2.5 rounded-xl transition-all"
                                >
                                    Finalizar e Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
