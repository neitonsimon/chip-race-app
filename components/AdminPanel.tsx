import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Event, PlayerStats } from '../types';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: PlayerStats;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'operational' | 'products' | 'reports'>('operational');
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [openCommands, setOpenCommands] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCommand, setSelectedCommand] = useState<any | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchOpenCommands(selectedEventId);
        } else {
            setOpenCommands([]);
        }
    }, [selectedEventId]);

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });
        if (data) setEvents(data);
    };

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('category', { ascending: true });
        if (data) setProducts(data);
    };

    const fetchOpenCommands = async (eventId: string) => {
        const { data, error } = await supabase
            .from('commands')
            .select('*, profiles(name, numeric_id, avatar_url)')
            .eq('event_id', eventId)
            .eq('status', 'open');
        if (data) setOpenCommands(data);
    };

    const handleSearchPlayers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const isNumeric = /^\d+$/.test(query);
        let supabaseQuery = supabase.from('profiles').select('id, name, numeric_id, avatar_url');

        if (isNumeric) {
            supabaseQuery = supabaseQuery.eq('numeric_id', parseInt(query));
        } else {
            supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
        }

        const { data } = await supabaseQuery.limit(5);
        setSearchResults(data || []);
    };

    const handleOpenCommand = async (player: any) => {
        if (!selectedEventId) {
            alert('Por favor, selecione um evento primeiro.');
            return;
        }

        // Check if player already has an open command for this event
        const alreadyOpen = openCommands.find(c => c.user_id === player.id);
        if (alreadyOpen) {
            alert('Este jogador já possui uma comanda aberta para este evento.');
            return;
        }

        const { data, error } = await supabase
            .from('commands')
            .insert({
                event_id: selectedEventId,
                user_id: player.id,
                status: 'open',
                opened_by: currentUser.id
            })
            .select('*, profiles(name, numeric_id, avatar_url)')
            .single();

        if (error) {
            alert('Erro ao abrir comanda: ' + error.message);
        } else {
            setOpenCommands([...openCommands, data]);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedCommand(data); // Auto-select the newly opened command
        }
    };

    const handleAddProductToCommand = async (product: any) => {
        if (!selectedCommand) return;

        const quantity = 1; // Default to 1 for now
        const totalPriceBrl = Number(product.price) * quantity;
        const totalPriceChipz = Number(product.price_chipz || 0) * quantity;

        const { data: item, error: itemError } = await supabase
            .from('command_items')
            .insert({
                command_id: selectedCommand.id,
                product_id: product.id,
                quantity,
                unit_price_brl: product.price,
                unit_price_chipz: product.price_chipz || 0,
                total_price_brl: totalPriceBrl,
                total_price_chipz: totalPriceChipz,
                created_by: currentUser.id
            })
            .select()
            .single();

        if (itemError) {
            alert('Erro ao adicionar produto: ' + itemError.message);
            return;
        }

        // Update command total in DB
        const newTotalBrl = Number(selectedCommand.total_brl) + totalPriceBrl;
        const newTotalChipz = Number(selectedCommand.total_chipz || 0) + totalPriceChipz;

        const { error: updateError } = await supabase
            .from('commands')
            .update({
                total_brl: newTotalBrl,
                total_chipz: newTotalChipz
            })
            .eq('id', selectedCommand.id);

        if (updateError) {
            alert('Erro ao atualizar total da comanda: ' + updateError.message);
        } else {
            // Update local state
            const updatedCommands = openCommands.map(c =>
                c.id === selectedCommand.id
                    ? { ...c, total_brl: newTotalBrl, total_chipz: newTotalChipz }
                    : c
            );
            setOpenCommands(updatedCommands);
            setSelectedCommand({ ...selectedCommand, total_brl: newTotalBrl, total_chipz: newTotalChipz });
        }
    };

    const handleCloseCommand = async () => {
        if (!selectedCommand) return;
        setIsLoading(true);

        try {
            // 1. Fetch player's current balance to verify
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('balance_brl')
                .eq('id', selectedCommand.user_id)
                .single();

            if (profileError) throw profileError;

            const totalToDeduct = Number(selectedCommand.total_brl);
            const currentBalance = Number(profile.balance_brl || 0);

            if (currentBalance < totalToDeduct) {
                alert(`Saldo insuficiente! O jogador possui R$ ${currentBalance.toFixed(2)}, mas a comanda totaliza R$ ${totalToDeduct.toFixed(2)}.`);
                setIsLoading(false);
                return;
            }

            // 2. Deduct balance
            const { error: deductError } = await supabase
                .from('profiles')
                .update({ balance_brl: currentBalance - totalToDeduct })
                .eq('id', selectedCommand.user_id);

            if (deductError) throw deductError;

            // 3. Close command
            const { error: closeError } = await supabase
                .from('commands')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString()
                })
                .eq('id', selectedCommand.id);

            if (closeError) throw closeError;

            // 4. Send system message to player
            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id,
                sender_id: currentUser.id,
                content: `Sua comanda no evento foi encerrada. Total: R$ ${totalToDeduct.toFixed(2)} descontados do seu saldo.`,
                category: 'system',
                is_read: false
            });

            alert('Comanda encerrada com sucesso!');
            setOpenCommands(openCommands.filter(c => c.id !== selectedCommand.id));
            setSelectedCommand(null);
            setShowCheckout(false);
        } catch (err: any) {
            alert('Erro ao encerrar comanda: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050214] flex flex-col">
            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <img src="/cr-logo.png" alt="Chip Race" className="h-10 w-auto" />
                    <div className="h-6 w-px bg-white/10"></div>
                    <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">
                        Painel Administrativo
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                >
                    <span className="material-icons-outlined text-gray-400 group-hover:text-red-500">close</span>
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('operational')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'operational' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <span className="material-icons-outlined">point_of_sale</span>
                        <span className="font-bold uppercase text-xs tracking-widest">Núcleo Operacional</span>
                    </button>
                    {/* Other buttons for future modules */}
                    <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Operador Atual</p>
                        <div className="flex items-center gap-3">
                            <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-primary/50" alt="" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white transition-colors">{currentUser.name}</span>
                                <span className="text-[9px] text-primary font-black uppercase tracking-tighter">Admin</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050214]">
                    {activeTab === 'operational' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-3xl border border-white/10">
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                                        Comanda Eletrônica
                                    </h3>
                                    <p className="text-gray-400 text-sm">Gestão de consumo e entradas de torneio em tempo real.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary transition-colors text-sm font-bold min-w-[250px]"
                                    >
                                        <option value="">Selecionar Evento Ativo</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Atendimentos Ativos ({openCommands.length})
                                        </h4>
                                        {openCommands.length === 0 ? (
                                            <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                                <span className="material-icons-outlined text-4xl mb-2 opacity-20">receipt_long</span>
                                                <p className="italic text-sm">Nenhuma comanda aberta para este evento.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {openCommands.map(cmd => (
                                                    <div
                                                        key={cmd.id}
                                                        onClick={() => setSelectedCommand(cmd)}
                                                        className={`bg-black/40 border p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink' : 'border-white/10 hover:border-primary/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                                                            <div className="flex flex-col">
                                                                <span className="text-white font-bold text-sm">{cmd.profiles?.name}</span>
                                                                <span className="text-[10px] text-gray-500 font-black">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-primary font-display font-black text-sm">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                                            <div className="flex flex-col items-end">
                                                                <p className="text-[9px] text-gray-400 uppercase font-black">{selectedCommand?.id === cmd.id ? 'Selecionado' : 'Selecionar'}</p>
                                                                {selectedCommand?.id === cmd.id && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowCheckout(true); }}
                                                                        className="mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-500 text-[8px] font-black uppercase rounded hover:bg-red-500 hover:text-white transition-all"
                                                                    >
                                                                        Fechar Conta
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Launcher (Grid) */}
                                    {selectedCommand && (
                                        <div className="bg-white/5 rounded-3xl border border-white/10 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <span className="material-icons-outlined text-primary">shopping_bag</span>
                                                    Lançar Produtos
                                                </h4>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                                    <span className="text-[10px] text-primary font-black uppercase">Vincular a: {selectedCommand.profiles?.name}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {products.length === 0 ? (
                                                    <div className="col-span-full py-8 text-center text-gray-600 border border-dashed border-white/5 rounded-2xl">
                                                        <p className="text-xs italic">Nenhum produto cadastrado.</p>
                                                    </div>
                                                ) : (
                                                    products.map(product => (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => handleAddProductToCommand(product)}
                                                            className="bg-black/40 border border-white/10 p-3 rounded-2xl hover:border-primary transition-all flex flex-col items-center text-center group active:scale-95"
                                                        >
                                                            <span className="material-icons-outlined text-gray-600 mb-2 group-hover:text-primary transition-colors">
                                                                {product.category === 'drink' ? 'local_bar' :
                                                                    product.category === 'food' ? 'restaurant' :
                                                                        product.category === 'tournament' ? 'star' : 'inventory_2'}
                                                            </span>
                                                            <span className="text-[11px] text-white font-bold block mb-1 line-clamp-1">{product.name}</span>
                                                            <span className="text-[10px] text-primary font-black">R$ {Number(product.price).toFixed(2)}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20 p-6 backdrop-blur-sm">
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <span className="material-icons-outlined text-primary">add_circle</span>
                                            Iniciar Atendimento
                                        </h4>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchPlayers(e.target.value)}
                                                placeholder="Buscar Jogador (Nome ou CR#)"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all pr-10"
                                            />
                                            {searchQuery && (
                                                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-3 text-gray-500 hover:text-white">
                                                    <span className="material-icons-outlined text-sm">close</span>
                                                </button>
                                            )}
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div className="mt-2 bg-gray-900 border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
                                                {searchResults.map(player => (
                                                    <button
                                                        key={player.id}
                                                        onClick={() => handleOpenCommand(player)}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 transition-colors"
                                                    >
                                                        <img src={player.avatar_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                                        <div className="flex flex-col">
                                                            <span className="text-white text-xs font-bold">{player.name}</span>
                                                            <span className="text-[10px] text-primary font-black">CR#{String(player.numeric_id).padStart(3, '0')}</span>
                                                        </div>
                                                        <span className="material-icons-outlined text-gray-600 text-sm ml-auto">login</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <p className="mt-4 text-[10px] text-gray-500 uppercase font-medium leading-relaxed">
                                            Insira o nome ou CR# para localizar o perfil e vincular ao evento ativo.
                                        </p>
                                    </div>

                                    {/* Summary Stats for the Event */}
                                    <div className="bg-black/20 rounded-3xl border border-white/5 p-6">
                                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Resumo Financeiro</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Total em Aberto</span>
                                                <span className="text-sm font-black text-white">R$ {openCommands.reduce((acc, curr) => acc + Number(curr.total_brl), 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Comandas Ativas</span>
                                                <span className="text-sm font-black text-white">{openCommands.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Checkout Modal */}
            {showCheckout && selectedCommand && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                                    <span className="material-icons-outlined text-4xl">receipt</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-display font-black text-white uppercase tracking-tight">Checkout Final</h4>
                                    <p className="text-gray-400 text-xs">Encerrar comanda e processar pagamento.</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-gray-500 font-bold uppercase">Cliente</span>
                                    <span className="text-sm text-white font-bold">{selectedCommand.profiles?.name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-gray-500 font-bold uppercase">CR#</span>
                                    <span className="text-sm text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                </div>
                                <div className="h-px bg-white/10 my-4"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-white font-black uppercase">Total a Pagar</span>
                                    <span className="text-2xl font-display font-black text-primary">R$ {Number(selectedCommand.total_brl).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleCloseCommand}
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined">payments</span>
                                            Confirmar Pagamento (BRL)
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowCheckout(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3 rounded-2xl transition-all uppercase text-xs tracking-widest"
                                >
                                    Voltar
                                </button>
                            </div>

                            <p className="mt-6 text-[10px] text-gray-500 text-center uppercase font-medium leading-relaxed">
                                Ao confirmar, o valor será automaticamente deduzido da carteira BRL do jogador e a comanda será marcada como encerrada.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
