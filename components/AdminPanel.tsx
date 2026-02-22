import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Event, PlayerStats } from '../types';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: PlayerStats;
    isAdmin?: boolean; // true = admin, false = staff
}

// VIP discount rules applied at product insertion time
function applyVipDiscount(
    price: number,
    category: string,
    productName: string,
    vipStatus: string | null | undefined
): number {
    if (!vipStatus) return price;

    const isBar = category === 'bar';
    const isJanta = productName.toLowerCase().startsWith('janta');
    const isStaff = productName.toLowerCase().includes('staff');
    const isBet5 = productName === 'Bet R$ 5';

    if (vipStatus === 'vip_master') {
        if (isBar && !isJanta) return Math.max(0, price * 0.5);     // 50% off bar items
        if (isJanta) return Math.max(0, price - 10);                  // R$10 off janta
        if (isStaff) return Math.max(0, price - 10);                  // R$10 off staff
        if (isBet5) return 0;                                          // Bet R$5 FREE
    }

    if (vipStatus === 'vip_anual') {
        if (isBar && !isJanta) return Math.max(0, price * 0.8);     // 20% off bar
    }

    return price;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser, isAdmin = false }) => {
    const [activeTab, setActiveTab] = useState<'operational' | 'reports'>('operational');
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [openCommands, setOpenCommands] = useState<any[]>([]);
    const [closedCommands, setClosedCommands] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCommand, setSelectedCommand] = useState<any | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [productSection, setProductSection] = useState<'bar' | 'torneio' | 'produtos'>('bar');
    const [pendingProduct, setPendingProduct] = useState<any | null>(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [commandsTab, setCommandsTab] = useState<'ativas' | 'historico'>('ativas');
    const [reportData, setReportData] = useState<any[]>([]);
    const [editingClosedCommand, setEditingClosedCommand] = useState<any | null>(null);

    useEffect(() => {
        fetchEvents();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchOpenCommands(selectedEvent.id);
            fetchClosedCommands(selectedEvent.id);
        } else {
            setOpenCommands([]);
            setClosedCommands([]);
        }
    }, [selectedEvent]);

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
        if (data) setEvents(data);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('active', true).order('category', { ascending: true });
        if (data) setProducts(data);
    };

    const fetchOpenCommands = async (eventId: string) => {
        const { data } = await supabase
            .from('commands')
            .select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status)')
            .eq('event_id', eventId)
            .eq('status', 'open')
            .order('created_at', { ascending: false });
        if (data) setOpenCommands(data);
    };

    const fetchClosedCommands = async (eventId: string) => {
        const { data } = await supabase
            .from('commands')
            .select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status)')
            .eq('event_id', eventId)
            .eq('status', 'closed')
            .order('closed_at', { ascending: false });
        if (data) setClosedCommands(data);
    };

    const fetchReport = async (eventId: string) => {
        const { data } = await supabase
            .from('command_items')
            .select('*, products(name, category), commands!inner(event_id, status, profiles!user_id(name, numeric_id))')
            .eq('commands.event_id', eventId);
        if (data) setReportData(data);
    };

    const handleSearchPlayers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status');
        if (isNumeric) { q = q.eq('numeric_id', parseInt(query)); }
        else { q = q.ilike('name', `%${query}%`); }
        const { data } = await q.limit(5);
        setSearchResults(data || []);
    };

    const handleOpenCommand = async (player: any) => {
        if (!selectedEvent) { alert('Selecione um evento primeiro.'); return; }
        const alreadyOpen = openCommands.find(c => c.user_id === player.id);
        if (alreadyOpen) { alert('Este jogador já possui uma comanda aberta.'); return; }

        const { data, error } = await supabase
            .from('commands')
            .insert({ event_id: selectedEvent.id, user_id: player.id, status: 'open', opened_by: currentUser.id })
            .select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status)')
            .single();

        if (error) { alert('Erro ao abrir comanda: ' + error.message); }
        else {
            setOpenCommands([data, ...openCommands]);
            setSearchQuery(''); setSearchResults([]);
            setSelectedCommand(data);
        }
    };

    // Tournament items built from event structure
    const getTournamentItems = () => {
        if (!selectedEvent) return [];
        const ev = selectedEvent;
        const items = [];
        if (ev.buyin) items.push({ id: 't-buyin', name: 'Buy In', price: parseFloat(ev.buyin.replace(/[^0-9.]/g, '') || '0'), chips: ev.stack || '0', isEventItem: true });
        if (ev.staff_bonus_value) items.push({ id: 't-staff', name: 'Staff', price: parseFloat(ev.staff_bonus_value.replace(/[^0-9.]/g, '') || '0'), chips: ev.staff_bonus_chips || '0', isEventItem: true });
        if (ev.rebuy_value) items.push({ id: 't-rebuy', name: 'Rebuy', price: parseFloat(ev.rebuy_value.replace(/[^0-9.]/g, '') || '0'), chips: ev.rebuy_chips || '0', isEventItem: true });
        if (ev.addon_value) items.push({ id: 't-addon', name: 'Add On', price: parseFloat(ev.addon_value.replace(/[^0-9.]/g, '') || '0'), chips: ev.addon_chips || '0', isEventItem: true, vipBonusChips: '5000' });
        if (ev.double_rebuy_value) items.push({ id: 't-drebuy', name: 'Rebuy Duplo', price: parseFloat(ev.double_rebuy_value.replace(/[^0-9.]/g, '') || '0'), chips: ev.double_rebuy_chips || '0', isEventItem: true });
        if (ev.double_addon_value) items.push({ id: 't-daddon', name: 'Add Duplo', price: parseFloat(ev.double_addon_value.replace(/[^0-9.]/g, '') || '0'), chips: ev.double_addon_chips || '0', isEventItem: true });
        return items;
    };

    const getFilteredProducts = () => {
        if (productSection === 'bar') return products.filter(p => p.category === 'bar');
        if (productSection === 'produtos') return products.filter(p => ['bet', 'jackpot', 'lastlonger'].includes(p.category));
        return [];
    };

    const getVipPrice = (product: any): number => {
        const vipStatus = selectedCommand?.profiles?.vip_status;
        return applyVipDiscount(Number(product.price), product.category, product.name, vipStatus);
    };

    const getVipPriceForTournament = (item: any): number => {
        const vipStatus = selectedCommand?.profiles?.vip_status;
        if (!vipStatus) return item.price;
        if ((item.name === 'Staff') && vipStatus === 'vip_master') return Math.max(0, item.price - 10);
        return item.price;
    };

    const handleProductClick = (product: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (pendingProduct?.id === product.id) {
            addProductToCommand(product);
            setPendingProduct(null);
        } else {
            setPendingProduct(product);
        }
    };

    const handleTournamentItemClick = (item: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (pendingProduct?.id === item.id) {
            addTournamentItemToCommand(item);
            setPendingProduct(null);
        } else {
            setPendingProduct(item);
        }
    };

    const addProductToCommand = async (product: any) => {
        if (!selectedCommand) return;
        const finalPrice = getVipPrice(product);
        const { error: itemError } = await supabase.from('command_items').insert({
            command_id: selectedCommand.id,
            product_id: product.id,
            quantity: 1,
            unit_price_brl: finalPrice,
            unit_price_chipz: 0,
            total_price_brl: finalPrice,
            total_price_chipz: 0,
            created_by: currentUser.id
        });
        if (itemError) { alert('Erro: ' + itemError.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const updated = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(updated);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
    };

    const addTournamentItemToCommand = async (item: any) => {
        if (!selectedCommand) return;
        const finalPrice = getVipPriceForTournament(item);
        // Add on special VIP chip bonus
        const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
        const vipStatus = selectedCommand?.profiles?.vip_status;
        const bonusChipsNote = isAddon && vipStatus === 'vip_master' ? ' (+5K fichas VIP)' : '';

        const { error: itemError } = await supabase.from('command_items').insert({
            command_id: selectedCommand.id,
            product_id: null,
            quantity: 1,
            unit_price_brl: finalPrice,
            unit_price_chipz: 0,
            total_price_brl: finalPrice,
            total_price_chipz: 0,
            notes: item.name + ' — ' + item.chips + ' fichas' + bonusChipsNote,
            created_by: currentUser.id
        });
        if (itemError) { alert('Erro: ' + itemError.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const updated = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(updated);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
    };

    const handleCloseCommand = async () => {
        if (!selectedCommand) return;
        setIsLoading(true);
        try {
            const { data: profile, error: profileError } = await supabase.from('profiles').select('balance_brl').eq('id', selectedCommand.user_id).single();
            if (profileError) throw profileError;
            const totalToDeduct = Number(selectedCommand.total_brl);
            const currentBalance = Number(profile.balance_brl || 0);
            if (currentBalance < totalToDeduct) {
                alert(`Saldo insuficiente! Jogador tem R$ ${currentBalance.toFixed(2)}, comanda: R$ ${totalToDeduct.toFixed(2)}.`);
                setIsLoading(false); return;
            }
            await supabase.from('profiles').update({ balance_brl: currentBalance - totalToDeduct }).eq('id', selectedCommand.user_id);
            await supabase.from('commands').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', selectedCommand.id);
            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id, sender_id: currentUser.id,
                content: `Sua comanda foi encerrada. Total: R$ ${totalToDeduct.toFixed(2)} descontados do saldo.`,
                category: 'system', is_read: false
            });
            alert('Comanda encerrada com sucesso!');
            setOpenCommands(openCommands.filter(c => c.id !== selectedCommand.id));
            if (selectedEvent) fetchClosedCommands(selectedEvent.id);
            setSelectedCommand(null); setShowCheckout(false);
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

    const handleTopUp = async () => {
        if (!isAdmin) { alert('Apenas admins podem inserir saldo.'); return; }
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0 || !selectedCommand) return;
        setIsLoading(true);
        try {
            const { data: profile } = await supabase.from('profiles').select('balance_brl').eq('id', selectedCommand.user_id).single();
            const newBalance = Number(profile?.balance_brl || 0) + amount;
            await supabase.from('profiles').update({ balance_brl: newBalance }).eq('id', selectedCommand.user_id);
            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id, sender_id: currentUser.id,
                content: `Pagamento de R$ ${amount.toFixed(2)} registrado pela staff. Saldo atualizado.`,
                category: 'system', is_read: false
            });
            alert(`R$ ${amount.toFixed(2)} adicionado ao saldo de ${selectedCommand.profiles?.name}!`);
            setShowTopUp(false); setTopUpAmount('');
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

    // Report calculated from command_items
    const reportBySection = () => {
        const sections: Record<string, { total: number; items: Record<string, { qty: number; total: number }> }> = {};
        reportData.forEach((item: any) => {
            const cat = item.products?.category || 'torneio';
            const sec = cat === 'bar' ? 'Bar' : ['bet', 'jackpot', 'lastlonger'].includes(cat) ? 'Produtos' : 'Torneio';
            const name = item.products?.name || item.notes || 'Item';
            if (!sections[sec]) sections[sec] = { total: 0, items: {} };
            sections[sec].total += Number(item.total_price_brl);
            if (!sections[sec].items[name]) sections[sec].items[name] = { qty: 0, total: 0 };
            sections[sec].items[name].qty += item.quantity;
            sections[sec].items[name].total += Number(item.total_price_brl);
        });
        return sections;
    };

    const vipBadgeColor = (vipStatus: string | null | undefined) => {
        if (vipStatus === 'vip_master') return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40';
        if (vipStatus === 'vip_anual') return 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40';
        if (vipStatus === 'vip_trimestral') return 'text-purple-300 bg-purple-500/20 border-purple-500/40';
        return '';
    };

    const vipLabel = (vipStatus: string | null | undefined) => {
        if (vipStatus === 'vip_master') return 'MASTER';
        if (vipStatus === 'vip_anual') return 'ANUAL';
        if (vipStatus === 'vip_trimestral') return 'TRIM.';
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050214] flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-3">
                    <img src="/cr-logo.png" alt="Chip Race" className="h-8 w-auto" />
                    <div className="h-5 w-px bg-white/10"></div>
                    <h2 className="text-base font-display font-black text-white uppercase tracking-wider">Painel Administrativo</h2>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all group">
                    <span className="material-icons-outlined text-gray-400 group-hover:text-red-500 text-base">close</span>
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-52 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setActiveTab('operational')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === 'operational' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span className="material-icons-outlined text-sm">point_of_sale</span>
                        Operacional
                    </button>
                    <button onClick={() => { setActiveTab('reports'); if (selectedEvent) fetchReport(selectedEvent.id); }} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === 'reports' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span className="material-icons-outlined text-sm">bar_chart</span>
                        Relatório
                    </button>
                    <div className="mt-auto p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Operador</p>
                        <div className="flex items-center gap-2">
                            <img src={currentUser.avatar} className="w-7 h-7 rounded-full border border-primary/50" alt="" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-white truncate max-w-[90px]">{currentUser.name}</span>
                                <span className="text-[9px] text-primary font-black uppercase">{isAdmin ? 'Admin' : 'Staff'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050214]">
                    {activeTab === 'operational' && (
                        <div className="h-full flex flex-col lg:flex-row">
                            {/* Left: Active Tab List + Product Launcher */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                                {/* Event Selector */}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <span className="material-icons-outlined text-primary text-sm">event</span>
                                    <select
                                        value={selectedEvent?.id || ''}
                                        onChange={(e) => { const ev = events.find(ev => ev.id === e.target.value) || null; setSelectedEvent(ev); setSelectedCommand(null); setPendingProduct(null); }}
                                        className="flex-1 bg-transparent text-white text-sm font-bold outline-none"
                                    >
                                        <option value="">Selecionar Evento</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Active / History Tabs */}
                                <div className="flex gap-2">
                                    <button onClick={() => setCommandsTab('ativas')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'ativas' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                        <span className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ativas ({openCommands.length})</span>
                                    </button>
                                    <button onClick={() => setCommandsTab('historico')} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'historico' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                        <span className="flex items-center justify-center gap-1"><span className="material-icons-outlined text-xs">history</span> Histórico ({closedCommands.length})</span>
                                    </button>
                                </div>

                                {commandsTab === 'ativas' && (
                                    <div className="space-y-2">
                                        {openCommands.length === 0 ? (
                                            <div className="text-center py-12 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                                <span className="material-icons-outlined text-3xl mb-2 opacity-20 block">receipt_long</span>
                                                <p className="italic text-sm">Nenhuma comanda aberta.</p>
                                            </div>
                                        ) : (
                                            openCommands.map(cmd => (
                                                <div
                                                    key={cmd.id}
                                                    onClick={() => { setSelectedCommand(cmd); setPendingProduct(null); }}
                                                    className={`bg-black/40 border p-3 rounded-2xl flex items-center justify-between cursor-pointer group transition-all ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink' : 'border-white/10 hover:border-primary/50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-9 h-9 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-bold text-sm">{cmd.profiles?.name}</span>
                                                                {vipLabel(cmd.profiles?.vip_status) && (
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${vipBadgeColor(cmd.profiles?.vip_status)}`}>{vipLabel(cmd.profiles?.vip_status)}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-black">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <p className="text-primary font-display font-black text-sm">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                                        {selectedCommand?.id === cmd.id && (
                                                            <div className="flex gap-1">
                                                                {isAdmin && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setShowTopUp(true); }} className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 text-[8px] font-black uppercase rounded hover:bg-green-500 hover:text-white transition-all whitespace-nowrap">
                                                                        + Saldo
                                                                    </button>
                                                                )}
                                                                <button onClick={(e) => { e.stopPropagation(); setShowCheckout(true); }} className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-[8px] font-black uppercase rounded hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">
                                                                    Fechar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {commandsTab === 'historico' && (
                                    <div className="space-y-2">
                                        {closedCommands.length === 0 ? (
                                            <div className="text-center py-12 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                                <p className="italic text-sm">Nenhuma comanda encerrada neste evento.</p>
                                            </div>
                                        ) : (
                                            closedCommands.map(cmd => (
                                                <div key={cmd.id} className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                        <div>
                                                            <span className="text-gray-300 font-bold text-sm">{cmd.profiles?.name}</span>
                                                            <br />
                                                            <span className="text-[10px] text-gray-600">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')} · {cmd.closed_at ? new Date(cmd.closed_at).toLocaleString('pt-BR') : '—'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <p className="text-gray-400 font-black text-sm">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                                        <button
                                                            onClick={() => setEditingClosedCommand(cmd)}
                                                            className="px-2 py-0.5 bg-white/10 border border-white/20 text-gray-400 text-[8px] font-black uppercase rounded hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all"
                                                        >
                                                            Editar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Search + Product Launcher */}
                            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col overflow-hidden">
                                {/* Player Search */}
                                <div className="p-4 border-b border-white/10">
                                    <p className="text-[9px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1">
                                        <span className="material-icons-outlined text-xs text-primary">add_circle</span> Iniciar Atendimento
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => handleSearchPlayers(e.target.value)}
                                            placeholder="Nome ou CR#"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-primary transition-all pr-8"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-2 text-gray-500 hover:text-white">
                                                <span className="material-icons-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
                                            {searchResults.map(player => (
                                                <button key={player.id} onClick={() => handleOpenCommand(player)} className="w-full flex items-center gap-2 p-2.5 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 transition-colors">
                                                    <img src={player.avatar_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-7 h-7 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-white text-xs font-bold block truncate">{player.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-primary font-black">CR#{String(player.numeric_id).padStart(3, '0')}</span>
                                                            {vipLabel(player.vip_status) && (
                                                                <span className={`text-[8px] font-black px-1 rounded border ${vipBadgeColor(player.vip_status)}`}>{vipLabel(player.vip_status)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="material-icons-outlined text-gray-600 text-sm">login</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Product Launcher */}
                                {selectedCommand ? (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {/* Target label */}
                                        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex-shrink-0">
                                            <p className="text-[10px] text-primary font-black uppercase truncate">
                                                ▶ {selectedCommand.profiles?.name} — R$ {Number(selectedCommand.total_brl).toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Section Tabs */}
                                        <div className="flex border-b border-white/10 flex-shrink-0">
                                            {(['bar', 'torneio', 'produtos'] as const).map(sec => (
                                                <button key={sec} onClick={() => { setProductSection(sec); setPendingProduct(null); }} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${productSection === sec ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                                                    {sec === 'bar' ? '🍺 Bar' : sec === 'torneio' ? '♠ Torneio' : '🎯 Produtos'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Products Grid */}
                                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                            {pendingProduct && (
                                                <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-[10px] text-yellow-300 font-bold text-center animate-pulse">
                                                    Confirmar "{pendingProduct.name}" à comanda de @{selectedCommand.profiles?.name}? Clique novamente!
                                                </div>
                                            )}
                                            {productSection !== 'torneio' ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {getFilteredProducts().map(product => {
                                                        const finalPrice = getVipPrice(product);
                                                        const hasDiscount = finalPrice < Number(product.price);
                                                        const isPending = pendingProduct?.id === product.id;
                                                        return (
                                                            <button
                                                                key={product.id}
                                                                onClick={() => handleProductClick(product)}
                                                                className={`p-2.5 rounded-xl flex flex-col items-center text-center group active:scale-95 transition-all border ${isPending ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 hover:border-primary/50'}`}
                                                            >
                                                                <span className="material-icons-outlined text-gray-500 mb-1 group-hover:text-primary transition-colors text-base">
                                                                    {product.category === 'bar' ? 'local_bar' : product.category === 'jackpot' ? 'toll' : product.category === 'bet' ? 'casino' : 'confirmation_number'}
                                                                </span>
                                                                <span className="text-[10px] text-white font-bold block mb-0.5 line-clamp-1">{product.name}</span>
                                                                {hasDiscount ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-[9px] text-gray-500 line-through">R$ {Number(product.price).toFixed(2)}</span>
                                                                        <span className="text-[10px] text-green-400 font-black">{finalPrice === 0 ? 'GRÁTIS' : `R$ ${finalPrice.toFixed(2)}`}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-primary font-black">{finalPrice === 0 ? 'GRÁTIS' : `R$ ${finalPrice.toFixed(2)}`}</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {!selectedEvent ? (
                                                        <p className="col-span-2 text-center text-gray-600 text-xs py-8">Selecione um evento.</p>
                                                    ) : getTournamentItems().length === 0 ? (
                                                        <p className="col-span-2 text-center text-gray-600 text-xs py-8">Nenhum item encontrado na estrutura do evento.</p>
                                                    ) : getTournamentItems().map(item => {
                                                        const finalPrice = getVipPriceForTournament(item);
                                                        const hasDiscount = finalPrice < item.price;
                                                        const isPending = pendingProduct?.id === item.id;
                                                        const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
                                                        const vipStatus = selectedCommand?.profiles?.vip_status;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => handleTournamentItemClick(item)}
                                                                className={`p-2.5 rounded-xl flex flex-col items-center text-center group active:scale-95 transition-all border relative ${isPending ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 hover:border-primary/50'}`}
                                                            >
                                                                <span className="material-icons-outlined text-gray-500 mb-1 group-hover:text-primary transition-colors text-base">poker_chip</span>
                                                                <span className="text-[10px] text-white font-bold block mb-0.5">{item.name}</span>
                                                                <span className="text-[9px] text-gray-500 block">{item.chips} fichas</span>
                                                                {hasDiscount ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-[9px] text-gray-500 line-through">R$ {item.price.toFixed(2)}</span>
                                                                        <span className="text-[10px] text-green-400 font-black">R$ {finalPrice.toFixed(2)}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-primary font-black">R$ {item.price.toFixed(2)}</span>
                                                                )}
                                                                {isAddon && vipStatus === 'vip_master' && (
                                                                    <span className="absolute -top-1 -right-1 text-[7px] bg-yellow-500 text-black font-black px-1 rounded">+5K VIP</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center p-6">
                                        <div className="text-center text-gray-600">
                                            <span className="material-icons-outlined text-3xl opacity-20 block mb-2">touch_app</span>
                                            <p className="text-xs italic">Selecione ou abra uma comanda para lançar produtos.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                {selectedEvent && (
                                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-500 uppercase">Total Aberto</span>
                                            <span className="text-white">R$ {openCommands.reduce((s, c) => s + Number(c.total_brl), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold mt-1">
                                            <span className="text-gray-500 uppercase">Comandas Ativas</span>
                                            <span className="text-white">{openCommands.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Financial Report Tab */}
                    {activeTab === 'reports' && (
                        <div className="p-6 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Relatório Financeiro</h3>
                                    <p className="text-gray-400 text-sm">Movimentação por sessão e produto.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedEvent?.id || ''}
                                        onChange={(e) => { const ev = events.find(ev => ev.id === e.target.value) || null; setSelectedEvent(ev); if (ev) fetchReport(ev.id); }}
                                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-primary transition-colors text-sm font-bold min-w-[200px]"
                                    >
                                        <option value="">Selecionar Evento</option>
                                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                    </select>
                                    {selectedEvent && <button onClick={() => fetchReport(selectedEvent.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all"><span className="material-icons-outlined text-sm text-gray-400">refresh</span></button>}
                                </div>
                            </div>

                            {reportData.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                    <span className="material-icons-outlined text-4xl opacity-20 block mb-2">analytics</span>
                                    <p className="italic">Selecione um evento para gerar o relatório.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-black mb-1">Total Geral</p>
                                            <p className="text-2xl font-display font-black text-primary">R$ {reportData.reduce((s, i) => s + Number(i.total_price_brl), 0).toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-black mb-1">Total Itens</p>
                                            <p className="text-2xl font-display font-black text-white">{reportData.reduce((s, i) => s + i.quantity, 0)}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-black mb-1">Comandas</p>
                                            <p className="text-2xl font-display font-black text-white">{[...new Set(reportData.map(i => i.command_id))].length}</p>
                                        </div>
                                    </div>

                                    {/* By Section */}
                                    {Object.entries(reportBySection()).map(([section, data]) => (
                                        <div key={section} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                                                <span className="text-sm font-black text-white uppercase tracking-widest">{section}</span>
                                                <span className="text-primary font-black text-sm">R$ {data.total.toFixed(2)}</span>
                                            </div>
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-white/5">
                                                        <th className="text-left px-4 py-2 text-gray-600 font-bold uppercase">Produto</th>
                                                        <th className="text-center px-4 py-2 text-gray-600 font-bold uppercase">Qtd</th>
                                                        <th className="text-right px-4 py-2 text-gray-600 font-bold uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(data.items).sort((a, b) => b[1].total - a[1].total).map(([name, item]) => (
                                                        <tr key={name} className="border-b border-white/5 hover:bg-white/5">
                                                            <td className="px-4 py-2 text-gray-300">{name}</td>
                                                            <td className="px-4 py-2 text-center text-gray-400">{item.qty}</td>
                                                            <td className="px-4 py-2 text-right text-white font-bold">R$ {item.total.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Checkout Modal */}
            {showCheckout && selectedCommand && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center"><span className="material-icons-outlined text-primary text-2xl">receipt</span></div>
                                <div>
                                    <h4 className="text-lg font-display font-black text-white uppercase">Checkout</h4>
                                    <p className="text-gray-400 text-xs">Confirmar pagamento e encerrar comanda.</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Cliente</span>
                                    <span className="text-sm text-white font-bold">{selectedCommand.profiles?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 uppercase font-bold">CR#</span>
                                    <span className="text-sm text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                </div>
                                <div className="h-px bg-white/10"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-white font-black uppercase">Total</span>
                                    <span className="text-xl font-display font-black text-primary">R$ {Number(selectedCommand.total_brl).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">payments</span>Confirmar (BRL)</>}
                                </button>
                                <button onClick={() => setShowCheckout(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl transition-all uppercase text-xs tracking-widest">Voltar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top-Up Modal — Admin only */}
            {showTopUp && selectedCommand && isAdmin && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center"><span className="material-icons-outlined text-green-400 text-2xl">account_balance_wallet</span></div>
                                <div>
                                    <h4 className="text-lg font-display font-black text-white uppercase">Saldo Pago</h4>
                                    <p className="text-gray-400 text-xs">Registrar pagamento em dinheiro.</p>
                                </div>
                            </div>
                            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-500 mb-0.5">Creditando para</p>
                                <p className="text-white font-bold text-sm">{selectedCommand.profiles?.name}</p>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Valor Recebido (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    autoFocus
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTopUp()}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-green-400 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <button onClick={handleTopUp} disabled={isLoading || !topUpAmount} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">add_card</span>Confirmar Crédito</>}
                                </button>
                                <button onClick={() => { setShowTopUp(false); setTopUpAmount(''); }} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl transition-all uppercase text-xs tracking-widest">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Closed Command Modal */}
            {editingClosedCommand && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center"><span className="material-icons-outlined text-yellow-400 text-2xl">edit_note</span></div>
                                <div>
                                    <h4 className="text-base font-display font-black text-white uppercase">Editar Comanda</h4>
                                    <p className="text-gray-400 text-xs">{editingClosedCommand.profiles?.name}</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Ajustar Total (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={Number(editingClosedCommand.total_brl).toFixed(2)}
                                    id="edit-cmd-total"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-yellow-400 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={async () => {
                                        const input = document.getElementById('edit-cmd-total') as HTMLInputElement;
                                        const newTotal = parseFloat(input.value);
                                        if (isNaN(newTotal) || newTotal < 0) return;
                                        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', editingClosedCommand.id);
                                        fetchClosedCommands(selectedEvent.id);
                                        if (selectedEvent) fetchReport(selectedEvent.id);
                                        setEditingClosedCommand(null);
                                        alert('Comanda atualizada!');
                                    }}
                                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-outlined text-sm">save</span> Salvar Alterações
                                </button>
                                <button onClick={() => setEditingClosedCommand(null)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl transition-all uppercase text-xs tracking-widest">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
