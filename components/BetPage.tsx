import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Event, RankingPlayer } from '../types';
import { useApp } from '../contexts/AppContext';

interface Bet {
    id: string;
    event_id: string;
    category: 'campeao' | '3handed' | 'mesa_finalista';
    status: 'open' | 'closed' | 'settled';
    expires_at?: string;
    max_bet?: number;
    total_wagered?: number;
    events?: { title: string; date: string };
    bet_odds?: BetOdd[];
}

interface BetOdd {
    id: string;
    bet_id: string;
    user_id: string | null;
    guest_name: string | null;
    odd_value: number;
    status: 'active' | 'suspended' | 'win' | 'loss';
    profiles?: { name: string; avatar_url: string };
}

export const BetPage: React.FC<{ isAdmin: boolean; onNavigate: (view: string) => void }> = ({ isAdmin, onNavigate }) => {
    const { events, getAllUniquePlayers, isLoggedIn, currentUser, allProfiles, refreshSupabaseData } = useApp();
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form state
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'campeao' | '3handed' | 'mesa_finalista'>('campeao');
    const [expiresAt, setExpiresAt] = useState('');
    const [maxBet, setMaxBet] = useState<string>('');
    const [playerSearch, setPlayerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<RankingPlayer[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<{ id: string; name: string; odd: number; odd_id?: string }[]>([]);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBet, setEditingBet] = useState<Bet | null>(null);
    const [showPlaceBetModal, setShowPlaceBetModal] = useState(false);
    const [placingBetOn, setPlacingBetOn] = useState<Bet | null>(null);
    const [showViewBetsModal, setShowViewBetsModal] = useState(false);
    const [marketBets, setMarketBets] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    // Place bet form state
    const [selectedOddId, setSelectedOddId] = useState('');
    const [wagerAmount, setWagerAmount] = useState<number>(0);
    const [punterName, setPunterName] = useState('');
    const [punterSearch, setPunterSearch] = useState('');
    const [punterResults, setPunterResults] = useState<RankingPlayer[]>([]);
    const [selectedPunter, setSelectedPunter] = useState<RankingPlayer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credits' | 'debt'>('pix');
    const [betAmount, setBetAmount] = useState<string>('');

    useEffect(() => {
        fetchBets();
    }, []);

    // Pre-fill punter for non-admins
    useEffect(() => {
        if (showPlaceBetModal && !isAdmin && isLoggedIn && currentUser) {
            const isStaff = currentUser.role === 'staff' || currentUser.role === 'admin';
            
            // For normal users, only 'credits' is allowed
            if (!isStaff) {
                setPaymentMethod('credits');
            }

            const fetchMyBalance = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('*, balance_brl')
                    .eq('id', currentUser.id)
                    .single();
                
                if (data) {
                    const myProfile = {
                        ...data,
                        balanceBrl: Number(data.balance_brl)
                    };
                    setSelectedPunter(myProfile as any);
                    setPunterSearch(data.name);
                    setPunterName(data.name);
                }
            };
            fetchMyBalance();
        }
    }, [showPlaceBetModal, isAdmin, isLoggedIn, currentUser]);

    const fetchBets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bets')
            .select(`
                *,
                events (title, date),
                bet_odds (
                    *,
                    profiles (name, avatar_url)
                )
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Fetch total wagered for each bet
            const betsWithTotals = await Promise.all(data.map(async (bet: any) => {
                const { data: wagers } = await supabase
                    .from('user_bets')
                    .select('amount')
                    .eq('bet_id', bet.id);
                
                const total = wagers?.reduce((sum, w) => sum + (Number(w.amount) || 0), 0) || 0;
                
                // Deduplicate odds by player
                const uniqueOdds = [];
                const seen = new Set();
                if (bet.bet_odds) {
                    for (const odd of bet.bet_odds) {
                        const key = odd.user_id || `GUEST:${odd.guest_name}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueOdds.push(odd);
                        }
                    }
                }

                return { ...bet, total_wagered: total, bet_odds: uniqueOdds };
            }));
            // Final deduplication of bets by ID just in case
            const uniqueBets = Array.from(new Map(betsWithTotals.map(b => [b.id, b])).values());
            setBets(uniqueBets as any);
        }
        setLoading(false);
    };

    const handlePlayerSearch = (query: string) => {
        setPlayerSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const allPlayers = getAllUniquePlayers();
        const filtered = allPlayers.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setSearchResults(filtered);
    };

    const handlePunterSearch = (query: string) => {
        setPunterSearch(query);
        setPunterName(query); // Allow ghost user by default
        setSelectedPunter(null);
        
        if (query.length < 2) {
            setPunterResults([]);
            return;
        }
        const allPlayers = getAllUniquePlayers();
        const filtered = allPlayers.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setPunterResults(filtered);
    };

    const selectPunter = async (p: RankingPlayer) => {
        // Fetch latest balance for this user specifically
        const { data, error } = await supabase
            .from('profiles')
            .select('balance_brl')
            .eq('id', p.id)
            .single();
        
        const latestBalance = !error && data ? Number(data.balance_brl) : 0;
        
        setSelectedPunter({ ...p, balanceBrl: latestBalance });
        setPunterName(p.name);
        setPunterSearch(p.name);
        setPunterResults([]);
    };

    const addPlayerToBet = (player: RankingPlayer) => {
        if (selectedPlayers.find(p => p.id === player.id)) return;
        setSelectedPlayers([...selectedPlayers, { id: player.id!, name: player.name, odd: 2.0 }]);
        setPlayerSearch('');
        setSearchResults([]);
    };

    const removePlayerFromBet = (id: string) => {
        setSelectedPlayers(selectedPlayers.filter(p => p.id !== id));
    };

    const updateOdd = (id: string, value: number) => {
        setSelectedPlayers(selectedPlayers.map(p => p.id === id ? { ...p, odd: value } : p));
    };

    const handleCreateBet = async () => {
        if (!selectedEventId || selectedPlayers.length === 0 || saving) return;
        setSaving(true);

        const { data: bet, error: betError } = await supabase
            .from('bets')
            .insert({
                event_id: selectedEventId,
                category: selectedCategory,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                max_bet: maxBet ? parseFloat(maxBet) : null,
                status: 'open'
            })
            .select()
            .single();

        if (betError) {
            alert('Erro ao criar bet');
            return;
        }

        const oddsToInsert = selectedPlayers.map(p => {
            const isGuest = p.id.startsWith('GUEST:');
            return {
                bet_id: bet.id,
                user_id: isGuest ? null : p.id,
                guest_name: isGuest ? p.name : null,
                odd_value: p.odd,
                status: 'active'
            };
        });

        const { error: oddsError } = await supabase
            .from('bet_odds')
            .insert(oddsToInsert);

        if (oddsError) {
            alert('Erro ao criar odds');
        } else {
            setShowCreateModal(false);
            setSelectedPlayers([]);
            setSelectedEventId('');
            fetchBets();
        }
        setSaving(false);
    };

    const handleUpdateBet = async () => {
        if (!editingBet || saving) return;
        setSaving(true);

        try {
            // 1. Identify which odds should be deleted
            // Odds are deleted if their primary key (odd_id) is no longer in the selectedPlayers list
            const currentOddIds = selectedPlayers.map(p => p.odd_id).filter(Boolean);
            const oddsToDelete = editingBet.bet_odds?.filter(o => !currentOddIds.includes(o.id)) || [];
            
            for (const odd of oddsToDelete) {
                // Check if there are bets for this odd before deleting
                const { count } = await supabase.from('user_bets').select('*', { count: 'exact', head: true }).eq('odd_id', odd.id);
                if (count && count > 0) {
                    alert(`Não é possível excluir o jogador ${odd.profiles?.name || odd.guest_name} pois já existem apostas vinculadas a ele.`);
                    // UI will show this player again on next fetch
                    continue; 
                }
                await supabase.from('bet_odds').delete().eq('id', odd.id);
            }

            // 2. Update existing odds and insert new ones
            for (const p of selectedPlayers) {
                const isGuest = p.id.startsWith('GUEST:');
                const oddValue = isNaN(Number(p.odd)) ? 2.0 : Number(p.odd);
                
                if (p.odd_id) {
                    // Update existing by its primary key
                    await supabase.from('bet_odds')
                        .update({ odd_value: oddValue })
                        .eq('id', p.odd_id);
                } else {
                    // Insert new
                    await supabase.from('bet_odds').insert({
                        bet_id: editingBet.id,
                        user_id: isGuest ? null : p.id,
                        guest_name: isGuest ? p.name : null,
                        odd_value: oddValue,
                        status: 'active'
                    });
                }
            }

            // 3. Update bet metadata
            await supabase.from('bets').update({ 
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                max_bet: maxBet ? parseFloat(maxBet) : null,
                category: selectedCategory,
                updated_at: new Date().toISOString()
            }).eq('id', editingBet.id);
            
            console.log('Update successful, fetching fresh data...');
            setShowEditModal(false);
            await fetchBets();
            if (refreshSupabaseData) await refreshSupabaseData();
        } catch (error) {
            console.error('Error updating bet:', error);
            alert('Erro ao atualizar o mercado. Verifique o console para mais detalhes.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBet = async () => {
        if (!editingBet) return;
        
        if (!confirm('Tem certeza que deseja excluir este mercado permanentemente? Todas as odds serão removidas.')) return;

        // Check if there are bets
        const { count } = await supabase.from('user_bets').select('*', { count: 'exact', head: true }).eq('bet_id', editingBet.id);
        if (count && count > 0) {
            alert('Não é possível excluir este mercado pois já existem apostas realizadas. Encerre o mercado em vez de excluir.');
            return;
        }

        const { error } = await supabase.from('bets').delete().eq('id', editingBet.id);
        
        if (error) {
            alert('Erro ao excluir mercado: ' + error.message);
        } else {
            setShowEditModal(false);
            fetchBets();
        }
    };

    const handlePlaceBet = async () => {
        const amount = parseFloat(betAmount);
        if (!selectedOddId || amount <= 0 || !punterSearch) {
            alert('Preencha todos os campos corretamente');
            return;
        }

        const odd = placingBetOn?.bet_odds?.find(o => o.id === selectedOddId);
        if (!odd) return;

        // Check if expired
        if (placingBetOn?.expires_at && new Date(placingBetOn.expires_at) < new Date()) {
            alert('Este mercado de apostas já foi encerrado.');
            return;
        }

        // Check Max Bet
        if (placingBetOn?.max_bet && amount > placingBetOn.max_bet) {
            alert(`O valor máximo permitido para este mercado é R$ ${placingBetOn.max_bet}.`);
            return;
        }

        // Payment Method Logic
        if (paymentMethod === 'credits') {
            if (!selectedPunter || selectedPunter.id?.startsWith('GUEST:')) {
                alert('Pagamento via crédito só é permitido para usuários cadastrados');
                return;
            }
            if ((selectedPunter.balanceBrl || 0) < amount) {
                alert(`Saldo insuficiente! Saldo atual: R$ ${(selectedPunter.balanceBrl || 0).toFixed(2)}`);
                return;
            }

            // Deduct credits
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance_brl: (selectedPunter.balanceBrl || 0) - amount })
                .eq('id', selectedPunter.id);

            if (balanceError) {
                alert('Erro ao debitar créditos: ' + balanceError.message);
                return;
            }
        } else if (paymentMethod === 'debt') {
            if (!selectedPunter || selectedPunter.id?.startsWith('GUEST:')) {
                alert('A opção "Pendura" só é permitida para usuários cadastrados');
                return;
            }

            // Create debt
            const { error: debtError } = await supabase
                .from('debts')
                .insert({
                    user_id: selectedPunter.id,
                    amount_brl: amount,
                    description: `Aposta no evento: ${placingBetOn?.events?.title} (${placingBetOn?.category})`,
                    status: 'pending',
                    event_id: placingBetOn?.event_id
                });

            if (debtError) {
                alert('Erro ao criar pendura: ' + debtError.message);
                return;
            }
        }

        const potentialReturn = amount * odd.odd_value;

        const { error } = await supabase
            .from('user_bets')
            .insert({
                bet_id: placingBetOn?.id,
                odd_id: selectedOddId,
                user_id: selectedPunter?.id && !selectedPunter.id.startsWith('GUEST:') ? selectedPunter.id : null,
                punter_id: selectedPunter?.id && !selectedPunter.id.startsWith('GUEST:') ? selectedPunter.id : null,
                punter_name: punterName,
                amount: amount,
                potential_return: potentialReturn,
                payment_method: paymentMethod,
                status: 'pending',
                created_by: currentUser?.id
            });

        if (error) {
            alert('Erro ao registrar aposta: ' + error.message);
        } else {
            alert('Bilhete emitido com sucesso!');
            setShowPlaceBetModal(false);
            setPunterName('');
            setPunterSearch('');
            setBetAmount('');
            setSelectedOddId('');
            setSelectedPunter(null);
            setPaymentMethod('pix');
            if (refreshSupabaseData) await refreshSupabaseData();
            fetchBets();
        }
    };

    const viewMarketBets = async (betId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_bets')
            .select(`
                *,
                bet_odds (
                    guest_name,
                    profiles (name)
                )
            `)
            .eq('bet_id', betId)
            .order('created_at', { ascending: false });

        if (!error) {
            setMarketBets(data);
            setShowViewBetsModal(true);
        }
        setLoading(false);
    };

    const CountdownTimer = ({ expiresAt }: { expiresAt?: string }) => {
        const [timeLeft, setTimeLeft] = useState<string>('');

        useEffect(() => {
            if (!expiresAt) return;

            const timer = setInterval(() => {
                const now = new Date().getTime();
                const target = new Date(expiresAt).getTime();
                const difference = target - now;

                if (difference <= 0) {
                    setTimeLeft('ENCERRADO');
                    clearInterval(timer);
                    return;
                }

                const hours = Math.floor((difference / (1000 * 60 * 60)));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);

            return () => clearInterval(timer);
        }, [expiresAt]);

        if (!expiresAt) return null;

        return (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border animate-pulse ${timeLeft === 'ENCERRADO' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                <span className="material-icons-outlined text-sm">{timeLeft === 'ENCERRADO' ? 'timer_off' : 'timer'}</span>
                <span className="text-[11px] font-black tracking-tighter">{timeLeft}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050821] text-white pt-10 pb-20 px-4">
            <div className="max-w-[1400px] mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                            Chip Race Bet
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            Aposte em seus jogadores favoritos e nos grandes torneios da nossa comunidade.
                        </p>
                    </div>

                    {isAdmin && (
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-3 px-8 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 group"
                        >
                            <span className="material-icons-outlined group-hover:rotate-90 transition-transform">add</span>
                            CRIAR NOVO BET
                        </button>
                    )}
                </div>

                {loading && !showViewBetsModal ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                ) : bets.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center">
                        <span className="material-icons-outlined text-6xl text-white/10 mb-4">sports_esports</span>
                        <p className="text-gray-500">Nenhum mercado de apostas disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                        {bets.map(bet => (
                            <div key={bet.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all group flex flex-col">
                                <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] w-fit font-black uppercase tracking-widest px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
                                                {bet.category.replace('_', ' ')}
                                            </span>
                                            <CountdownTimer expiresAt={bet.expires_at} />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl">
                                                <span className="material-icons-outlined text-sm">payments</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] uppercase font-black opacity-60 leading-none">Volume Total</span>
                                                    <span className="text-[11px] font-black tracking-tighter leading-none">R$ {bet.total_wagered?.toFixed(2) || '0.00'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isAdmin && (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingBet(bet);
                                                            // Format ISO date to YYYY-MM-DDTHH:MM for datetime-local input
                                                            if (bet.expires_at) {
                                                                const date = new Date(bet.expires_at);
                                                                if (!isNaN(date.getTime())) {
                                                                    const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                    setExpiresAt(formattedDate);
                                                                } else {
                                                                    setExpiresAt('');
                                                                }
                                                            } else {
                                                                setExpiresAt('');
                                                            }
                                                            setMaxBet(bet.max_bet?.toString() || '');
                                                            setSelectedCategory(bet.category);
                                                            setSelectedPlayers(bet.bet_odds?.map(o => ({
                                                                id: o.user_id || `GUEST:${o.guest_name}`,
                                                                odd_id: o.id,
                                                                name: o.profiles?.name || o.guest_name || '',
                                                                odd: o.odd_value
                                                            })) || []);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <span className="material-icons-outlined text-sm">edit</span>
                                                    </button>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${bet.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {bet.status === 'open' ? 'Aberto' : 'Encerrado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1 truncate">{bet.events?.title}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="material-icons-outlined text-xs">calendar_today</span>
                                        {new Date(bet.events?.date || '').toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="p-4 space-y-1.5 flex-1">
                                    {bet.bet_odds?.map(odd => (
                                        <div key={odd.id} className="flex items-center justify-between py-2 px-4 bg-black/40 rounded-2xl hover:bg-black/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={odd.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + (odd.profiles?.name || odd.guest_name)} 
                                                    alt={odd.profiles?.name || odd.guest_name} 
                                                    className="w-8 h-8 rounded-full border border-white/10"
                                                />
                                                <span className="text-sm font-medium">{odd.profiles?.name || odd.guest_name}</span>
                                            </div>
                                            <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-1 rounded-xl">
                                                <span className="text-cyan-400 font-black">@{odd.odd_value.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 bg-black/20 flex flex-col gap-2">
                                    {((bet.expires_at && new Date(bet.expires_at) < new Date()) && !isAdmin && currentUser?.role !== 'staff') ? (
                                        <div className="w-full py-4 bg-white/5 text-gray-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                                            <span className="material-icons-outlined text-sm">lock</span>
                                            MERCADO ENCERRADO
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    onNavigate('login');
                                                    return;
                                                }
                                                // Only check balance if not admin and not staff
                                                if (!isAdmin && currentUser?.role !== 'staff' && (currentUser.balanceBrl || 0) <= 0) {
                                                    onNavigate('recarga');
                                                    return;
                                                }
                                                setPlacingBetOn(bet);
                                                setShowPlaceBetModal(true);
                                            }}
                                            className={`w-full py-4 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                                                !isLoggedIn 
                                                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 shadow-inner' 
                                                    : (!isAdmin && currentUser?.role !== 'staff' && (currentUser.balanceBrl || 0) <= 0)
                                                        ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500/20 animate-pulse'
                                                        : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.02] border-t border-white/20'
                                            }`}
                                        >
                                            <span className="material-icons-outlined text-sm">
                                                {!isLoggedIn 
                                                    ? 'login' 
                                                    : (!isAdmin && currentUser?.role !== 'staff' && (currentUser.balanceBrl || 0) <= 0) 
                                                        ? 'account_balance_wallet' 
                                                        : 'confirmation_number'}
                                            </span>
                                            {!isLoggedIn 
                                                ? 'Fazer Login' 
                                                : (!isAdmin && currentUser?.role !== 'staff' && (currentUser.balanceBrl || 0) <= 0) 
                                                    ? 'Fazer Recarga' 
                                                    : 'Apostar Agora'}
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button 
                                            onClick={() => viewMarketBets(bet.id)}
                                            className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-cyan-400 uppercase tracking-tighter transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-icons-outlined text-xs">visibility</span>
                                            Ver Apostas Realizadas
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Bet Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0a061d] border border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Configurar Novo Mercado</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Evento Relacionado</label>
                                    <select 
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-[#0a061d] text-white">Selecione um evento...</option>
                                        {events.filter(e => e.status !== 'closed').map(e => (
                                            <option key={e.id} value={e.id} className="bg-[#0a061d] text-white">{e.title} ({new Date(e.date).toLocaleDateString('pt-BR')})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Categoria</label>
                                    <select 
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                                        className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="campeao" className="bg-[#0a061d] text-white">Campeão</option>
                                        <option value="3handed" className="bg-[#0a061d] text-white">3-Handed</option>
                                        <option value="mesa_finalista" className="bg-[#0a061d] text-white">Mesa Finalista</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Horário de Encerramento</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm cursor-pointer"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Aposta Máxima (R$)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm"
                                        placeholder="Ilimitado"
                                        value={maxBet}
                                        onChange={(e) => setMaxBet(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Buscar Jogadores</label>
                                <div className="relative">
                                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                                    <input 
                                        type="text"
                                        placeholder="Digite o nome do jogador..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-cyan-500 transition-colors text-sm"
                                        value={playerSearch}
                                        onChange={(e) => handlePlayerSearch(e.target.value)}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 bg-[#1a1633] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => addPlayerToBet(p)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <img src={p.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">{p.name}</p>
                                                        <p className="text-[10px] text-gray-500">{p.city}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPlayers.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Jogadores Selecionados & Odds</label>
                                    <div className="space-y-2">
                                        {selectedPlayers.map(p => (
                                            <div key={p.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{p.name}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-black/40 rounded-xl px-3 py-1.5 border border-white/10">
                                                        <span className="text-xs text-gray-500 mr-2">ODD:</span>
                                                        <input 
                                                            type="number"
                                                            step="0.1"
                                                            value={p.odd}
                                                            onChange={(e) => updateOdd(p.id, parseFloat(e.target.value))}
                                                            className="bg-transparent w-16 text-sm font-black text-cyan-400 outline-none"
                                                        />
                                                    </div>
                                                    <button onClick={() => removePlayerFromBet(p.id)} className="text-red-500 hover:text-red-400">
                                                        <span className="material-icons-outlined text-xl">delete_outline</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4">
                            <button 
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setExpiresAt('');
                                    setMaxBet('');
                                }}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handleCreateBet}
                                disabled={saving}
                                className={`flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-neon-blue hover:scale-[1.02] active:scale-[0.98] transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? 'CRIANDO...' : 'CONFIRMAR MERCADO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bet Modal */}
            {showEditModal && editingBet && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0a061d] border border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Editar Mercado</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {/* CONFIGURAÇÕES GERAIS */}
                            <div className="space-y-4 pb-6 border-b border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Configurações do Mercado</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Categoria</label>
                                        <select 
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value as any)}
                                            className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="campeao" className="bg-[#0a061d] text-white">Campeão</option>
                                            <option value="3handed" className="bg-[#0a061d] text-white">3-Handed</option>
                                            <option value="mesa_finalista" className="bg-[#0a061d] text-white">Mesa Finalista</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Fim das Apostas</label>
                                        <input 
                                            type="datetime-local"
                                            className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm cursor-pointer"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Aposta Máxima (R$)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-[#0a061d] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white text-sm"
                                            placeholder="Ilimitado"
                                            value={maxBet}
                                            onChange={(e) => setMaxBet(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Adicionar Jogador ao Mercado</label>
                                <div className="relative">
                                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                                    <input 
                                        type="text"
                                        placeholder="Adicionar novo jogador..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-cyan-500 transition-colors text-sm"
                                        value={playerSearch}
                                        onChange={(e) => handlePlayerSearch(e.target.value)}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 bg-[#1a1633] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => addPlayerToBet(p)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <img src={p.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">{p.name}</p>
                                                        <p className="text-[10px] text-gray-500">{p.city}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPlayers.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Gerenciar Jogadores & Odds</label>
                                    <div className="space-y-2">
                                        {selectedPlayers.map(p => (
                                            <div key={p.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{p.name}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-black/40 rounded-xl px-3 py-1.5 border border-white/10">
                                                        <span className="text-xs text-gray-500 mr-2">ODD:</span>
                                                        <input 
                                                            type="number"
                                                            step="0.1"
                                                            value={p.odd}
                                                            onChange={(e) => updateOdd(p.id, parseFloat(e.target.value))}
                                                            className="bg-transparent w-16 text-sm font-black text-cyan-400 outline-none"
                                                        />
                                                    </div>
                                                    <button onClick={() => removePlayerFromBet(p.id)} className="text-red-500 hover:text-red-400">
                                                        <span className="material-icons-outlined text-xl">delete_outline</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-white/5 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl">CANCELAR</button>
                                <button 
                                    onClick={handleUpdateBet} 
                                    disabled={saving}
                                    className={`flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-neon-blue hover:scale-[1.02] transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                            </div>
                            <button 
                                onClick={handleDeleteBet}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="material-icons-outlined text-sm group-hover:shake">delete_forever</span>
                                EXCLUIR MERCADO PERMANENTEMENTE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Place Bet Modal */}
            {showPlaceBetModal && placingBetOn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0a061d] border border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Emitir Aposta</h2>
                            <p className="text-xs text-gray-400 mt-1">{(placingBetOn.events?.title) || 'Sem Evento'} - {(placingBetOn.category || '').replace('_', ' ')}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Selecione o Jogador (Apenas 1)</label>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                    {placingBetOn.bet_odds?.map(odd => (
                                        <button 
                                            key={odd.id}
                                            onClick={() => setSelectedOddId(odd.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedOddId === odd.id ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOddId === odd.id ? 'border-cyan-500 bg-cyan-500' : 'border-white/20'}`}>
                                                    {selectedOddId === odd.id && <span className="material-icons-outlined text-black text-[14px] font-black">check</span>}
                                                </div>
                                                <span className="text-sm font-medium">{odd.profiles?.name || odd.guest_name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Valor da Aposta (R$)</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-cyan-500 transition-colors text-white font-bold text-lg"
                                            placeholder="0,00"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                        />
                                        {placingBetOn?.max_bet && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                                                MÁX: R$ {placingBetOn.max_bet}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Retorno Potencial (Green)</label>
                                    <div className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-4">
                                        <div className="text-green-400 font-black text-lg">
                                            R$ {((parseFloat(betAmount) || 0) * (placingBetOn.bet_odds?.find(o => o.id === selectedOddId)?.odd_value || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nome do Apostador</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none transition-colors text-white font-bold ${!isAdmin && isLoggedIn ? 'opacity-60 cursor-not-allowed' : 'focus:border-cyan-500'}`}
                                        placeholder="Buscar ou digitar nome..."
                                        value={punterSearch}
                                        onChange={(e) => handlePunterSearch(e.target.value)}
                                        disabled={!isAdmin && isLoggedIn}
                                    />
                                    {punterResults.length > 0 && (
                                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-[#1a1633] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {punterResults.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => selectPunter(p)}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img src={p.avatar} className="w-8 h-8 rounded-full border border-white/10" />
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-white">{p.name}</p>
                                                            <p className="text-[10px] text-gray-500">Saldo: R$ {(p.balance_brl || 0).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    {p.is_vip && <span className="material-icons-outlined text-yellow-500 text-sm">verified</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedPunter ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mt-1">
                                        <span className="material-icons-outlined text-cyan-400 text-sm">person</span>
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Perfil Vinculado: {selectedPunter.name}</span>
                                    </div>
                                ) : punterSearch.length > 2 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-1">
                                        <span className="material-icons-outlined text-amber-400 text-sm">person_outline</span>
                                        <span className="text-[10px] font-bold text-amber-400 uppercase">Usuário Fantasma (Sem Perfil)</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Método de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'pix', label: 'PIX (À Vista)', icon: 'qr_code' },
                                        { id: 'credits', label: 'Crédito App', icon: 'account_balance_wallet' },
                                        { id: 'debt', label: 'Pendura', icon: 'history_ed' }
                                    ].filter(m => {
                                        // Restrict to 'credits' only for normal users
                                        if (!isAdmin && currentUser?.role !== 'staff') {
                                            return m.id === 'credits';
                                        }
                                        return true;
                                    }).map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1 ${paymentMethod === method.id ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <span className={`material-icons-outlined text-lg ${paymentMethod === method.id ? 'text-cyan-400' : 'text-gray-500'}`}>{method.icon}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${paymentMethod === method.id ? 'text-white' : 'text-gray-500'}`}>{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0 flex gap-4">
                            <button 
                                onClick={() => {
                                    setShowPlaceBetModal(false);
                                    setSelectedOddId('');
                                    setBetAmount('');
                                    setPunterName('');
                                    setPunterSearch('');
                                    setSelectedPunter(null);
                                }}
                                className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl"
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handlePlaceBet}
                                className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-green-500/20"
                            >
                                EMITIR BILHETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Bets Modal */}
            {showViewBetsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0a061d] border border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-transparent">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Apostas Realizadas</h2>
                            <button onClick={() => setShowViewBetsModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                            {marketBets.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">Nenhuma aposta registrada neste mercado.</p>
                            ) : (
                                marketBets.map(bet => (
                                    <div key={bet.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-white">{bet.punter_name}</span>
                                                <span className="text-[10px] text-gray-500 uppercase font-bold bg-white/5 px-2 py-0.5 rounded">apostou em</span>
                                                <span className="text-sm font-black text-cyan-400">
                                                    {bet.bet_odds?.profiles?.name || bet.bet_odds?.guest_name || 'N/A'}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-gray-400">ID: {bet.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Apostou R$ {bet.amount.toFixed(2)} para ganhar R$ {bet.potential_return.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${bet.payment_method === 'credits' ? 'border-cyan-500/50 text-cyan-400' : bet.payment_method === 'debt' ? 'border-amber-500/50 text-amber-400' : 'border-green-500/50 text-green-400'}`}>
                                                {bet.payment_method || 'pix'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : bet.status === 'won' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {bet.status}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{new Date(bet.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-8 border-t border-white/5">
                            <button onClick={() => setShowViewBetsModal(false)} className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl">FECHAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
