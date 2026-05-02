import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Event, RankingPlayer } from '../types';
import { useApp } from '../contexts/AppContext';

interface Bet {
    id: string;
    event_id: string;
    category: 'campeao' | '3handed' | 'mesa_finalista';
    status: 'open' | 'closed' | 'settled';
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
    const { events, getAllUniquePlayers } = useApp();
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form state
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'campeao' | '3handed' | 'mesa_finalista'>('campeao');
    const [playerSearch, setPlayerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<RankingPlayer[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<{ id: string; name: string; odd: number }[]>([]);

    useEffect(() => {
        fetchBets();
    }, []);

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
            setBets(data as any);
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
        if (!selectedEventId || selectedPlayers.length === 0) return;

        const { data: bet, error: betError } = await supabase
            .from('bets')
            .insert({
                event_id: selectedEventId,
                category: selectedCategory,
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
    };

    return (
        <div className="min-h-screen bg-[#050821] text-white pt-10 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
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

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                ) : bets.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center">
                        <span className="material-icons-outlined text-6xl text-white/10 mb-4">sports_esports</span>
                        <p className="text-gray-500">Nenhum mercado de apostas disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bets.map(bet => (
                            <div key={bet.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all group">
                                <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
                                            {bet.category.replace('_', ' ')}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${bet.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {bet.status === 'open' ? 'Aberto' : 'Encerrado'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1 truncate">{bet.events?.title}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="material-icons-outlined text-xs">calendar_today</span>
                                        {new Date(bet.events?.date || '').toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="p-4 space-y-2">
                                    {bet.bet_odds?.map(odd => (
                                        <div key={odd.id} className="flex items-center justify-between p-3 bg-black/40 rounded-2xl hover:bg-black/60 transition-colors">
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
                                <button className="w-full py-4 bg-white/5 hover:bg-cyan-500 hover:text-black font-black uppercase tracking-widest text-xs transition-all">
                                    Apostar Agora
                                </button>
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
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handleCreateBet}
                                className="flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-neon-blue hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                CONFIRMAR MERCADO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
