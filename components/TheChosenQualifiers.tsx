import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { TheChosenQualifier, QualificationMode, PlayerStats } from '../types';

interface TheChosenQualifiersProps {
    isAdmin?: boolean;
    onNavigatePlayer?: (playerName: string) => void;
    playerSuggestions?: { name: string }[];
}

const MODES: { id: QualificationMode; label: string; icon: string; color: string }[] = [
    { id: 'rankings', label: 'Rankings', icon: 'leaderboard', color: 'text-pink-500' },
    { id: 'jackpot', label: 'Jackpot', icon: 'attach_money', color: 'text-blue-400' },
    { id: 'last_longer', label: 'Last Longer', icon: 'schedule', color: 'text-green-400' },
    { id: 'bet', label: 'Bet', icon: 'casino', color: 'text-cyan-400' },
    { id: 'bet_up', label: 'Bet Up', icon: 'psychology', color: 'text-cyan-400' },
    { id: 'sng_sat', label: 'SnG / Sat', icon: 'layers', color: 'text-fuchsia-500' },
    { id: 'quests', label: 'Quests', icon: 'explore', color: 'text-cyan-500' },
    { id: 'vip', label: 'VIP', icon: 'diamond', color: 'text-pink-400' },
];

interface PlayerSummary {
    userId?: string;
    name: string;
    qualifications: Record<QualificationMode, number>;
    totalCount: number;
    initialStack: number;
    bonusStack: number;
}

export const TheChosenQualifiers: React.FC<TheChosenQualifiersProps> = ({
    isAdmin,
    onNavigatePlayer,
    playerSuggestions = []
}) => {
    const [qualifiers, setQualifiers] = useState<TheChosenQualifier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});

    // Form state
    const [newPlayerName, setNewPlayerName] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
    const [selectedMode, setSelectedMode] = useState<QualificationMode>('rankings');
    const [isSaving, setIsSaving] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<{ id?: string, name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [profileMap, setProfileMap] = useState<Record<string, { name: string, avatar?: string }>>({});

    useEffect(() => {
        fetchQualifiers();
    }, []);

    useEffect(() => {
        if (newPlayerName.trim().length > 0) {
            const filtered = playerSuggestions.filter(p =>
                p.name.toLowerCase().includes(newPlayerName.toLowerCase())
            ).slice(0, 5);
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredSuggestions([]);
            setShowSuggestions(false);
        }
    }, [newPlayerName, playerSuggestions]);

    const fetchQualifiers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('the_chosen_qualifiers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const rows = data || [];
            setQualifiers(rows);

            // Fetch profiles by ID and Name for accurate mapping
            const uniqueUserIds = [...new Set(rows.filter((q: any) => q.user_id).map((q: any) => q.user_id))];
            const uniqueNames = [...new Set(rows.filter((q: any) => !q.user_id).map((q: any) => q.player_name as string))];

            const fullProfileMap: Record<string, { name: string, avatar?: string }> = {};

            if (uniqueUserIds.length > 0) {
                const { data: profilesById } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .in('id', uniqueUserIds);

                profilesById?.forEach((p: any) => {
                    fullProfileMap[p.id] = { name: p.name || 'Usuário', avatar: p.avatar_url };
                });
            }

            if (uniqueNames.length > 0) {
                const { data: profilesByName } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .in('name', uniqueNames);

                profilesByName?.forEach((p: any) => {
                    fullProfileMap[p.name.toLowerCase().trim()] = { name: p.name, avatar: p.avatar_url };
                });
            }

            setProfileMap(fullProfileMap);

            // Legacy avatar map for backwards compatibility if needed elsewhere
            const legacyMap: Record<string, string> = {};
            Object.keys(fullProfileMap).forEach(key => {
                if (fullProfileMap[key].avatar) legacyMap[key] = fullProfileMap[key].avatar!;
            });
            setAvatarMap(legacyMap);
        } catch (err) {
            console.error('Error fetching qualifiers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddQualifier = async () => {
        if (!newPlayerName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('the_chosen_qualifiers')
                .insert([{ player_name: newPlayerName.trim(), user_id: selectedUserId, mode: selectedMode }]);

            if (error) throw error;

            setShowAddModal(false);
            setNewPlayerName('');
            setSelectedUserId(undefined);
            fetchQualifiers();
        } catch (err: any) {
            console.error('Error adding qualifier:', err);
            alert(`Erro ao salvar classificação: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQualifier = async (id: string) => {
        if (!window.confirm('Excluir esta classificação?')) return;
        try {
            const { error } = await supabase
                .from('the_chosen_qualifiers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchQualifiers();
        } catch (err) {
            console.error('Error deleting qualifier:', err);
        }
    };

    // Calculate summaries per player
    const playerSummariesMap: Record<string, PlayerSummary> = {};

    qualifiers.forEach(q => {
        const key = q.user_id || q.player_name.toLowerCase().trim();
        const profile = q.user_id ? profileMap[q.user_id] : (profileMap[q.player_name.toLowerCase().trim()] || null);

        if (!playerSummariesMap[key]) {
            playerSummariesMap[key] = {
                userId: q.user_id,
                name: profile?.name || q.player_name,
                qualifications: {
                    rankings: 0, jackpot: 0, last_longer: 0, bet: 0, bet_up: 0, sng_sat: 0, quests: 0, vip: 0
                },
                totalCount: 0,
                initialStack: 0,
                bonusStack: 0
            };
        }
        playerSummariesMap[key].qualifications[q.mode]++;
        playerSummariesMap[key].totalCount++;
    });

    const summaries = Object.values(playerSummariesMap).map(player => {
        const uniqueModes = MODES.filter(m => player.qualifications[m.id] > 0).length;
        const totalQuals = player.totalCount;

        // Rules:
        // Initial Stack: 25k + (UniqueModes - 1) * 25k
        player.initialStack = uniqueModes > 0 ? 25 + (uniqueModes - 1) * 25 : 0;

        // Rebuy/Addon Bonus: (Total - Unique) * 25k
        player.bonusStack = (totalQuals - uniqueModes) * 25;

        return player;
    }).sort((a, b) => b.initialStack - a.initialStack || b.bonusStack - a.bonusStack);

    return (
        <div className="w-full bg-[#050214] rounded-[2rem] p-6 lg:p-10 border border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h3 className="text-2xl lg:text-3xl font-display font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-icons-outlined text-primary">groups</span>
                        Classificados Capítulo Final
                    </h3>
                    <p className="text-gray-400 mt-1">Acompanhe quem já garantiu vaga e seus bônus de stack.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary/80 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-neon-pink"
                    >
                        <span className="material-icons-outlined">add_circle</span>
                        Adicionar Classificação
                    </button>
                )}
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
                <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            <th className="pb-4 text-left pl-6">Competidor</th>
                            {MODES.map(mode => (
                                <th key={mode.id} className="pb-4 text-center px-2">
                                    <div className="flex flex-col items-center gap-1 group">
                                        <span className={`material-icons-outlined text-lg ${mode.color}`}>{mode.icon}</span>
                                        <span className="hidden lg:block text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">{mode.label}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="pb-4 text-center px-4 text-primary">Stack Inicial</th>
                            <th className="pb-4 text-center px-4 text-secondary">Bônus Reb/Add</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={11} className="py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                                    Carregando dados...
                                </td>
                            </tr>
                        ) : summaries.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-20 text-center text-gray-500 italic">
                                    Nenhum jogador classificado ainda.
                                </td>
                            </tr>
                        ) : summaries.map((player, idx) => (
                            <tr key={idx} className="group hover:scale-[1.01] transition-transform duration-300">
                                {/* Player Name */}
                                <td className="bg-white/5 backdrop-blur-md rounded-l-2xl py-4 pl-6 border-y border-l border-white/5 transition-colors group-hover:border-primary/20">
                                    <button
                                        onClick={() => onNavigatePlayer?.(player.name)}
                                        className="flex items-center gap-3 text-left hover:text-primary transition-colors"
                                    >
                                        {(player.userId ? profileMap[player.userId]?.avatar : profileMap[player.name.toLowerCase().trim()]?.avatar) ? (
                                            <img
                                                src={player.userId ? profileMap[player.userId]?.avatar : profileMap[player.name.toLowerCase().trim()]?.avatar}
                                                alt={player.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-lg shadow-primary/20 flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-xs font-bold text-white shadow-lg border border-white/10 flex-shrink-0">
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-bold text-white">{player.name}</span>
                                    </button>
                                </td>

                                {/* Qualification Modes Icons */}
                                {MODES.map(mode => {
                                    const count = player.qualifications[mode.id];
                                    return (
                                        <td key={mode.id} className="bg-white/5 backdrop-blur-md py-4 text-center border-y border-white/5">
                                            {count > 0 ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                                        <span className="material-icons-outlined text-[14px] text-green-400 font-bold">check</span>
                                                    </div>
                                                    {count > 1 && (
                                                        <span className="text-[9px] font-black text-secondary uppercase animate-pulse">+{count - 1} Bônus</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-800 font-black">-</span>
                                            )}
                                        </td>
                                    );
                                })}

                                {/* Initial Stack */}
                                <td className="bg-white/5 backdrop-blur-md py-4 text-center border-y border-white/5">
                                    <span className="text-xl font-display font-black text-primary text-glow-pink">
                                        {player.initialStack > 0 ? `${player.initialStack}k` : '-'}
                                    </span>
                                </td>

                                {/* Bonus Stack */}
                                <td className="bg-white/5 backdrop-blur-md py-4 text-center rounded-r-2xl border-y border-r border-white/5 pr-6 transition-colors group-hover:border-primary/20">
                                    <span className="text-lg font-display font-black text-secondary">
                                        {player.bonusStack > 0 ? `+${player.bonusStack}k` : '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rules Section */}
            <div className="mt-12 p-8 bg-black/40 rounded-3xl border border-white/5">
                <h4 className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-sm mb-6">
                    <span className="material-icons-outlined">info</span>
                    Regras de Acúmulo de Stack
                </h4>
                <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                        <span className="text-pink-500 font-black">•</span>
                        <p className="text-gray-300">
                            <span className="text-white font-bold">Qualificação Base:</span> A classificação em qualquer um dos 8 modos garante a entrada no capítulo final com o stack inicial de <span className="text-yellow-400 font-bold">25k fichas</span>.
                        </p>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-pink-500 font-black">•</span>
                        <p className="text-gray-300">
                            <span className="text-white font-bold">Bônus de Stack Inicial (Qualificação Cruzada):</span> Já estando classificado, uma nova classificação em um dos 7 modos restantes (diferente do primeiro) soma <span className="text-primary font-bold">+25k fichas</span> ao stack inicial.
                        </p>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-pink-500 font-black">•</span>
                        <p className="text-gray-300">
                            <span className="text-white font-bold">Bônus de Rebuy/Add-on (Reincidência):</span> Uma segunda classificação no <span className="text-white font-bold">mesmo modo</span> não soma ao inicial, mas garante <span className="text-secondary font-bold">25k fichas extras</span> para serem adicionadas ao fazer Rebuy ou Add-on.
                        </p>
                    </li>
                </ul>
            </div>

            {/* Admin Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md bg-[#0A051E] border border-white/10 rounded-3xl p-8 animate-in zoom-in-95 duration-200">
                        <h4 className="text-xl font-display font-black text-white uppercase mb-6 flex items-center justify-between">
                            Nova Classificação
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </h4>

                        <div className="space-y-6">
                            <div className="relative">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Jogador</label>
                                <input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onFocus={() => newPlayerName.trim().length > 0 && setShowSuggestions(true)}
                                    placeholder="Nome do jogador"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors"
                                />

                                {showSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-[#120B2E] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                        {filteredSuggestions.map((p, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setNewPlayerName(p.name);
                                                    setSelectedUserId(p.id);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-primary/20 text-white text-sm transition-colors border-b border-white/5 last:border-0"
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modo de Qualificação</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MODES.map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setSelectedMode(mode.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedMode === mode.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}
                                        >
                                            <span className={`material-icons-outlined text-lg ${mode.color}`}>{mode.icon}</span>
                                            <span className="text-xs font-bold">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddQualifier}
                                disabled={isSaving || !newPlayerName.trim()}
                                className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-700 text-white font-black py-4 rounded-xl shadow-neon-pink transition-all uppercase tracking-widest"
                            >
                                {isSaving ? 'Salvando...' : 'Confirmar Vaga'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
