import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
}

function applyVipDiscount(price: number, category: string, productName: string, vipStatus?: string | null): number {
    if (!vipStatus) return price;
    const isJanta = productName.toLowerCase().startsWith('janta');
    const isBar = category === 'bar';
    const isStaff = productName.toLowerCase() === 'staff';
    const isBet5 = productName === 'Bet R$ 5';
    if (vipStatus === 'vip_master') {
        if (isJanta) return Math.max(0, price - 10);
        if (isBar) return Math.max(0, price * 0.5);
        if (isStaff) return Math.max(0, price - 10);
        if (isBet5) return 0;
    }
    if (vipStatus === 'vip_anual') {
        if (isBar && !isJanta) return Math.max(0, price * 0.8);
    }
    return price;
}

const VIP_ICONS: Record<string, string> = { vip_master: '👑', vip_anual: '💎', vip_trimestral: '⭐' };
const VIP_COLORS: Record<string, string> = {
    vip_master: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
    vip_anual: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
    vip_trimestral: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
};

// One-time products: category+key that can only appear once per command
function getOneTimeKey(product: any): string | null {
    const name = (product.name || '').toLowerCase();
    if (name.startsWith('janta')) return 'janta';
    if (product.category === 'lastlonger') return 'lastlonger';
    if (product.category === 'jackpot') return 'jackpot';
    if (product.category === 'bet') return `bet:${name}`;
    return null;
}
function getOneTimeKeyFromNote(note: string): string | null {
    const n = (note || '').toLowerCase();
    if (n.startsWith('buy in')) return 'buyin';
    if (n.startsWith('staff')) return 'staff';
    return null;
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
    const [commandItems, setCommandItems] = useState<any[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [productSection, setProductSection] = useState<'bar' | 'torneio' | 'produtos'>('bar');
    const [pendingProduct, setPendingProduct] = useState<any | null>(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [commandsTab, setCommandsTab] = useState<'ativas' | 'historico'>('ativas');
    const [reportData, setReportData] = useState<any[]>([]);
    const [editingClosedCommand, setEditingClosedCommand] = useState<any | null>(null);
    const [viewingClosedCommand, setViewingClosedCommand] = useState<any | null>(null);
    const [viewingItems, setViewingItems] = useState<any[]>([]);
    const [toast, setToast] = useState<{ msg: string; price: number } | null>(null);
    const toastTimer = useRef<any>(null);

    useEffect(() => { fetchEvents(); fetchProducts(); }, []);
    useEffect(() => {
        if (selectedEvent) { fetchOpenCommands(selectedEvent.id); fetchClosedCommands(selectedEvent.id); }
        else { setOpenCommands([]); setClosedCommands([]); }
    }, [selectedEvent]);
    useEffect(() => {
        if (selectedCommand) fetchCommandItems(selectedCommand.id);
        else setCommandItems([]);
    }, [selectedCommand]);

    const showToast = (msg: string, price: number) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ msg, price });
        toastTimer.current = setTimeout(() => setToast(null), 2500);
    };

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
        if (data) setEvents(data);
    };
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('active', true).order('category');
        if (data) setProducts(data);
    };
    const fetchOpenCommands = async (eventId: string) => {
        const { data } = await supabase.from('commands').select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status, role)').eq('event_id', eventId).eq('status', 'open').order('created_at', { ascending: false });
        if (data) setOpenCommands(data);
    };
    const fetchClosedCommands = async (eventId: string) => {
        const { data } = await supabase.from('commands').select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status)').eq('event_id', eventId).eq('status', 'closed').order('closed_at', { ascending: false });
        if (data) setClosedCommands(data);
    };
    const fetchCommandItems = async (commandId: string) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category)').eq('command_id', commandId).order('created_at', { ascending: true });
        if (data) setCommandItems(data);
    };
    const fetchReport = async (eventId: string) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category), commands!inner(event_id, profiles!user_id(name, numeric_id))').eq('commands.event_id', eventId);
        if (data) setReportData(data);
    };

    const reopenCommand = async (cmd: any) => {
        if (!window.confirm(`Reabrir comanda de ${cmd.profiles?.name}? O total de R$ ${Number(cmd.total_brl).toFixed(2)} será reembolsado ao saldo.`)) return;
        // Atomically refund the balance
        if (Number(cmd.total_brl) > 0) {
            const { error } = await supabase.rpc('increment_balance_brl', { p_user_id: cmd.user_id, p_amount: Number(cmd.total_brl) });
            if (error) { alert('Erro ao reembolsar saldo: ' + error.message); return; }
        }
        const { error: upErr } = await supabase.from('commands').update({ status: 'open', closed_at: null }).eq('id', cmd.id);
        if (upErr) { alert('Erro ao reabrir: ' + upErr.message); return; }
        await supabase.from('messages').insert({ user_id: cmd.user_id, sender_id: currentUser.id, content: `Sua comanda foi reaberta pelo admin. R$ ${Number(cmd.total_brl).toFixed(2)} reembolsados ao saldo.`, category: 'system', is_read: false });
        if (selectedEvent) { fetchOpenCommands(selectedEvent.id); fetchClosedCommands(selectedEvent.id); }
        setSelectedCommand({ ...cmd, status: 'open', closed_at: null });
        setCommandsTab('ativas');
    };

    const openClosedCommandView = async (cmd: any) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category)').eq('command_id', cmd.id).order('created_at', { ascending: true });
        setViewingItems(data || []);
        setViewingClosedCommand(cmd);
    };

    // Compute which one-time keys are already used in this command
    const usedOneTimeKeys = new Set<string>();
    commandItems.forEach(item => {
        const key1 = item.products ? getOneTimeKey(item.products) : null;
        const key2 = item.notes ? getOneTimeKeyFromNote(item.notes) : null;
        if (key1) usedOneTimeKeys.add(key1);
        if (key2) usedOneTimeKeys.add(key2);
    });

    const isProductDisabled = (product: any): boolean => {
        const key = getOneTimeKey(product);
        return key ? usedOneTimeKeys.has(key) : false;
    };
    const isTourItemDisabled = (item: any): boolean => {
        const key = getOneTimeKeyFromNote(item.name);
        return key ? usedOneTimeKeys.has(key) : false;
    };

    const handleSearchPlayers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setSearchResults(data || []);
    };

    const handleOpenCommand = async (player: any) => {
        if (!selectedEvent) { alert('Selecione um evento primeiro.'); return; }
        if (openCommands.find(c => c.user_id === player.id)) { alert('Jogador já tem comanda aberta.'); return; }
        const { data, error } = await supabase.from('commands').insert({ event_id: selectedEvent.id, user_id: player.id, status: 'open', opened_by: currentUser.id }).select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status, role)').single();
        if (error) { alert('Erro: ' + error.message); return; }
        setOpenCommands([data, ...openCommands]);
        setSearchQuery(''); setSearchResults([]);
        setSelectedCommand(data);
    };

    const getTournamentItems = () => {
        if (!selectedEvent) return [];
        const ev = selectedEvent;
        const p = (v: string | undefined) => parseFloat((v || '0').replace(/[^0-9.]/g, ''));
        return [
            ev.buyin && { id: 't-buyin', name: 'Buy In', price: p(ev.buyin), chips: ev.stack || '—' },
            ev.staff_bonus_value && { id: 't-staff', name: 'Staff', price: p(ev.staff_bonus_value), chips: ev.staff_bonus_chips || '—' },
            ev.rebuy_value && { id: 't-rebuy', name: 'Rebuy', price: p(ev.rebuy_value), chips: ev.rebuy_chips || '—' },
            ev.addon_value && { id: 't-addon', name: 'Add On', price: p(ev.addon_value), chips: ev.addon_chips || '—', vipBonus: true },
            ev.double_rebuy_value && { id: 't-drebuy', name: 'Rebuy Duplo', price: p(ev.double_rebuy_value), chips: ev.double_rebuy_chips || '—' },
            ev.double_addon_value && { id: 't-daddon', name: 'Add Duplo', price: p(ev.double_addon_value), chips: ev.double_addon_chips || '—' },
        ].filter(Boolean) as any[];
    };

    const getVipPrice = (price: number, category: string, name: string) =>
        applyVipDiscount(price, category, name, selectedCommand?.profiles?.vip_status);

    const addProductToCommand = async (product: any) => {
        if (!selectedCommand) return;
        const finalPrice = getVipPrice(Number(product.price), product.category, product.name);
        const { error } = await supabase.from('command_items').insert({ command_id: selectedCommand.id, product_id: product.id, quantity: 1, unit_price_brl: finalPrice, unit_price_chipz: 0, total_price_brl: finalPrice, total_price_chipz: 0, created_by: currentUser.id });
        if (error) { alert('Erro: ' + error.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(upd);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
        fetchCommandItems(selectedCommand.id);
        showToast(product.name, finalPrice);
    };

    const addTournamentItemToCommand = async (item: any) => {
        if (!selectedCommand) return;
        const vipStatus = selectedCommand?.profiles?.vip_status;
        let finalPrice = item.price;
        if (item.name === 'Staff' && vipStatus === 'vip_master') finalPrice = Math.max(0, finalPrice - 10);
        const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
        const bonusNote = isAddon && vipStatus === 'vip_master' ? ' (+5K fichas VIP)' : '';
        const { error } = await supabase.from('command_items').insert({ command_id: selectedCommand.id, product_id: null, quantity: 1, unit_price_brl: finalPrice, unit_price_chipz: 0, total_price_brl: finalPrice, total_price_chipz: 0, notes: `${item.name} — ${item.chips} fichas${bonusNote}`, created_by: currentUser.id });
        if (error) { alert('Erro: ' + error.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(upd);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
        fetchCommandItems(selectedCommand.id);
        showToast(item.name, finalPrice);
    };

    const handleProductClick = (product: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (isProductDisabled(product)) return;
        if (pendingProduct?.id === product.id) { addProductToCommand(product); setPendingProduct(null); }
        else setPendingProduct(product);
    };
    const handleTourItemClick = (item: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (isTourItemDisabled(item)) return;
        if (pendingProduct?.id === item.id) { addTournamentItemToCommand(item); setPendingProduct(null); }
        else setPendingProduct(item);
    };

    const handleCloseCommand = async () => {
        if (!selectedCommand) return;
        setIsLoading(true);
        try {
            const total = Number(selectedCommand.total_brl);
            // Atomic deduct with balance check - fails safely if insufficient funds
            const { error: deductErr } = await supabase.rpc('deduct_balance_brl', {
                p_user_id: selectedCommand.user_id,
                p_amount: total
            });
            if (deductErr) {
                alert(deductErr.message || 'Erro ao descontar saldo.');
                setIsLoading(false); return;
            }
            await supabase.from('commands').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', selectedCommand.id);
            await supabase.from('messages').insert({ user_id: selectedCommand.user_id, sender_id: currentUser.id, content: `Sua comanda foi encerrada. Total: R$ ${total.toFixed(2)} descontado do saldo.`, category: 'system', is_read: false });
            setOpenCommands(openCommands.filter(c => c.id !== selectedCommand.id));
            if (selectedEvent) fetchClosedCommands(selectedEvent.id);
            setSelectedCommand(null); setShowCheckout(false); setCommandItems([]);
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

    const handleTopUp = async () => {
        if (!isAdmin || !selectedCommand) return;
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0) return;
        setIsLoading(true);
        try {
            // Atomic increment — no race condition
            const { error: incrErr } = await supabase.rpc('increment_balance_brl', {
                p_user_id: selectedCommand.user_id,
                p_amount: amount
            });
            if (incrErr) { alert('Erro ao creditar: ' + incrErr.message); return; }
            await supabase.from('messages').insert({ user_id: selectedCommand.user_id, sender_id: currentUser.id, content: `Pagamento de R$ ${amount.toFixed(2)} registrado pelo admin. Saldo atualizado.`, category: 'system', is_read: false });
            alert(`✅ R$ ${amount.toFixed(2)} creditado com sucesso!`);
            setShowTopUp(false); setTopUpAmount('');
            // Reload page to refresh all user local states and balances
            window.location.reload();
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

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

    const PlayerName = ({ p }: { p: any }) => (
        <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm ${p?.vip_status ? 'text-white' : 'text-gray-200'}`}>{p?.name}</span>
            {p?.vip_status && <span title={p.vip_status}>{VIP_ICONS[p.vip_status]}</span>}
            {p?.vip_status && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${VIP_COLORS[p.vip_status] || ''}`}>{p.vip_status === 'vip_master' ? 'MASTER' : p.vip_status === 'vip_anual' ? 'ANUAL' : 'TRIM.'}</span>}
        </div>
    );

    const filteredProducts = productSection === 'bar' ? products.filter(p => p.category === 'bar')
        : products.filter(p => ['bet', 'jackpot', 'lastlonger'].includes(p.category));

    return (
        <div className="fixed inset-0 z-[100] bg-[#050214] flex flex-col">
            {/* Toast */}
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                    <span className="material-icons-outlined text-sm">check_circle</span>
                    <span className="font-bold text-sm">{toast.msg}</span>
                    <span className="text-green-200 text-sm font-black">{toast.price === 0 ? '· GRÁTIS' : `· R$ ${toast.price.toFixed(2)}`}</span>
                </div>
            )}

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
                <aside className="w-52 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-2 flex-shrink-0">
                    {[{ id: 'operational', icon: 'point_of_sale', label: 'Operacional' }, { id: 'reports', icon: 'bar_chart', label: 'Relatório' }].map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id as any); if (t.id === 'reports' && selectedEvent) fetchReport(selectedEvent.id); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === t.id ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:bg-white/5'}`}>
                            <span className="material-icons-outlined text-sm">{t.icon}</span>{t.label}
                        </button>
                    ))}
                    <div className="mt-auto p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Operador</p>
                        <div className="flex items-center gap-2">
                            <img src={currentUser.avatar} className="w-7 h-7 rounded-full border border-primary/50" alt="" />
                            <div>
                                <span className="text-[11px] font-bold text-white block truncate max-w-[90px]">{currentUser.name}</span>
                                <span className="text-[9px] text-primary font-black uppercase">{isAdmin ? 'Admin' : 'Staff'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050214]">
                    {activeTab === 'operational' && (
                        <div className="h-full flex flex-col lg:flex-row">
                            {/* Left: commands list */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                                {/* Event selector */}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                                    <span className="material-icons-outlined text-primary text-sm flex-shrink-0">event</span>
                                    <select value={selectedEvent?.id || ''} onChange={e => { const ev = events.find(x => x.id === e.target.value) || null; setSelectedEvent(ev); setSelectedCommand(null); setPendingProduct(null); }}
                                        className="flex-1 bg-transparent text-white text-sm font-bold outline-none"
                                        style={{ backgroundColor: 'transparent' }}>
                                        <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                                        {events.map(ev => <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>{ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    {[{ id: 'ativas', label: `Ativas (${openCommands.length})`, dot: true }, { id: 'historico', label: `Histórico (${closedCommands.length})` }].map(t => (
                                        <button key={t.id} onClick={() => setCommandsTab(t.id as any)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${commandsTab === t.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                            {t.dot && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}{t.label}
                                        </button>
                                    ))}
                                </div>

                                {commandsTab === 'ativas' && (
                                    <div className="space-y-2">
                                        {openCommands.length === 0 ? (
                                            <div className="text-center py-12 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                                <span className="material-icons-outlined text-3xl opacity-20 block mb-2">receipt_long</span>
                                                <p className="italic text-sm">Nenhuma comanda aberta.</p>
                                            </div>
                                        ) : openCommands.map(cmd => (
                                            <div key={cmd.id} onClick={() => { setSelectedCommand(cmd); setPendingProduct(null); }}
                                                className={`bg-black/40 border p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink' : 'border-white/10 hover:border-primary/50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-9 h-9 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                    <div>
                                                        <PlayerName p={cmd.profiles} />
                                                        <span className="text-[10px] text-gray-500 font-black">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <p className="text-primary font-display font-black text-sm">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                                    {selectedCommand?.id === cmd.id && (
                                                        <div className="flex gap-1">
                                                            {isAdmin && (
                                                                <button onClick={e => { e.stopPropagation(); setShowTopUp(true); }}
                                                                    className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 text-[8px] font-black uppercase rounded hover:bg-green-500 hover:text-white transition-all whitespace-nowrap">
                                                                    + Saldo
                                                                </button>
                                                            )}
                                                            <button onClick={e => { e.stopPropagation(); setShowCheckout(true); fetchCommandItems(cmd.id); }}
                                                                className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-[8px] font-black uppercase rounded hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">
                                                                Fechar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {commandsTab === 'historico' && (
                                    <div className="space-y-2">
                                        {closedCommands.length === 0 ? (
                                            <div className="text-center py-12 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl"><p className="italic text-sm">Sem histórico.</p></div>
                                        ) : closedCommands.map(cmd => (
                                            <div key={cmd.id} className="bg-black/40 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                    <div>
                                                        <PlayerName p={cmd.profiles} />
                                                        <span className="text-[10px] text-gray-600">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')} · {cmd.closed_at ? new Date(cmd.closed_at).toLocaleString('pt-BR') : '—'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <p className="text-gray-400 font-black text-sm">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                                    <div className="flex gap-1 flex-wrap justify-end">
                                                        <button onClick={() => openClosedCommandView(cmd)}
                                                            className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black uppercase rounded hover:bg-cyan-500/30 transition-all">
                                                            Ver
                                                        </button>
                                                        <button onClick={() => setEditingClosedCommand(cmd)}
                                                            className="px-2 py-0.5 bg-white/10 border border-white/20 text-gray-400 text-[8px] font-black uppercase rounded hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:text-yellow-400 transition-all">
                                                            Editar
                                                        </button>
                                                        <button onClick={() => reopenCommand(cmd)}
                                                            className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[8px] font-black uppercase rounded hover:bg-green-500/30 transition-all">
                                                            Reabrir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: search + products */}
                            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-white/10 flex-shrink-0">
                                    <p className="text-[9px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1">
                                        <span className="material-icons-outlined text-xs text-primary">add_circle</span> Iniciar Atendimento
                                    </p>
                                    <div className="relative">
                                        <input type="text" value={searchQuery} onChange={e => handleSearchPlayers(e.target.value)} placeholder="Nome ou CR#"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-primary transition-all pr-8" />
                                        {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-2 text-gray-500 hover:text-white"><span className="material-icons-outlined text-sm">close</span></button>}
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                            {searchResults.map(player => (
                                                <button key={player.id} onClick={() => handleOpenCommand(player)}
                                                    className="w-full flex items-center gap-2 p-2.5 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 transition-colors">
                                                    <img src={player.avatar_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`} className="w-7 h-7 rounded-full border border-white/10 flex-shrink-0" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-white text-xs font-bold truncate">{player.name}</span>
                                                            {player.vip_status && <span>{VIP_ICONS[player.vip_status]}</span>}
                                                        </div>
                                                        <span className="text-[10px] text-primary font-black">CR#{String(player.numeric_id).padStart(3, '0')}</span>
                                                    </div>
                                                    <span className="material-icons-outlined text-gray-600 text-sm">login</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedCommand ? (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex-shrink-0 flex items-center gap-2">
                                            {selectedCommand.profiles?.vip_status && <span className="text-sm">{VIP_ICONS[selectedCommand.profiles.vip_status]}</span>}
                                            <p className="text-[10px] text-primary font-black uppercase truncate flex-1">
                                                ▶ {selectedCommand.profiles?.name} — R$ {Number(selectedCommand.total_brl).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="flex border-b border-white/10 flex-shrink-0">
                                            {(['bar', 'torneio', 'produtos'] as const).map(sec => (
                                                <button key={sec} onClick={() => { setProductSection(sec); setPendingProduct(null); }}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${productSection === sec ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                                                    {sec === 'bar' ? '🍺' : sec === 'torneio' ? '♠' : '🎯'} {sec}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-2">
                                                {productSection !== 'torneio' ? filteredProducts.map(product => {
                                                    const finalPrice = getVipPrice(Number(product.price), product.category, product.name);
                                                    const hasDisc = finalPrice < Number(product.price);
                                                    const isPend = pendingProduct?.id === product.id;
                                                    const disabled = isProductDisabled(product);
                                                    const qty = commandItems.filter(ci => ci.product_id === product.id).reduce((sum, ci) => sum + ci.quantity, 0);
                                                    return (
                                                        <button key={product.id} onClick={() => handleProductClick(product)} disabled={disabled}
                                                            className={`p-2.5 rounded-xl flex flex-col items-center text-center active:scale-95 transition-all border relative
                                                                ${disabled ? 'opacity-30 cursor-not-allowed border-white/5 bg-black/20' : isPend ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 hover:border-primary/50 group'}`}>
                                                            {disabled && <span className="absolute top-1 right-1 text-[8px] text-red-400 font-black">✓</span>}
                                                            {!disabled && qty > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-[#050214]">{qty}x</span>}
                                                            <span className="material-icons-outlined text-gray-500 mb-1 group-hover:text-primary transition-colors text-base">
                                                                {product.category === 'bar' ? 'local_bar' : product.category === 'jackpot' ? 'toll' : product.category === 'bet' ? 'casino' : 'confirmation_number'}
                                                            </span>
                                                            <span className="text-[10px] text-white font-bold block mb-0.5 line-clamp-1">{product.name}</span>
                                                            {hasDisc ? (
                                                                <div>
                                                                    <span className="text-[9px] text-gray-500 line-through block">R$ {Number(product.price).toFixed(2)}</span>
                                                                    <span className="text-[10px] text-green-400 font-black">{finalPrice === 0 ? 'GRÁTIS' : `R$ ${finalPrice.toFixed(2)}`}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-primary font-black">{finalPrice === 0 ? 'GRÁTIS' : `R$ ${finalPrice.toFixed(2)}`}</span>
                                                            )}
                                                        </button>
                                                    );
                                                }) : getTournamentItems().map(item => {
                                                    const vipStatus = selectedCommand?.profiles?.vip_status;
                                                    let finalPrice = item.price;
                                                    if (item.name === 'Staff' && vipStatus === 'vip_master') finalPrice = Math.max(0, finalPrice - 10);
                                                    const hasDisc = finalPrice < item.price;
                                                    const isPend = pendingProduct?.id === item.id;
                                                    const disabled = isTourItemDisabled(item);
                                                    const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
                                                    return (
                                                        <button key={item.id} onClick={() => handleTourItemClick(item)} disabled={disabled}
                                                            className={`p-2.5 rounded-xl flex flex-col items-center text-center active:scale-95 transition-all border relative
                                                                ${disabled ? 'opacity-30 cursor-not-allowed border-white/5 bg-black/20' : isPend ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 hover:border-primary/50 group'}`}>
                                                            {disabled && <span className="absolute top-1 right-1 text-[8px] text-red-400 font-black">✓</span>}
                                                            {isAddon && vipStatus === 'vip_master' && <span className="absolute -top-1 -right-1 text-[7px] bg-yellow-500 text-black font-black px-1 rounded">+5K VIP</span>}
                                                            <span className="material-icons-outlined text-gray-500 mb-1 text-base">poker_chip</span>
                                                            <span className="text-[10px] text-white font-bold">{item.name}</span>
                                                            <span className="text-[9px] text-gray-500">{item.chips}</span>
                                                            {hasDisc ? (
                                                                <div>
                                                                    <span className="text-[9px] text-gray-500 line-through">R$ {item.price.toFixed(2)}</span>
                                                                    <span className="text-[10px] text-green-400 font-black block">R$ {finalPrice.toFixed(2)}</span>
                                                                </div>
                                                            ) : <span className="text-[10px] text-primary font-black">R$ {item.price.toFixed(2)}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center p-6">
                                        <div className="text-center text-gray-600">
                                            <span className="material-icons-outlined text-3xl opacity-20 block mb-2">touch_app</span>
                                            <p className="text-xs italic">Selecione ou abra uma comanda.</p>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent && (
                                    <div className="p-3 border-t border-white/10 flex-shrink-0 flex justify-between text-xs font-bold">
                                        <span className="text-gray-500 uppercase">Aberto: <span className="text-white">R$ {openCommands.reduce((s, c) => s + Number(c.total_brl), 0).toFixed(2)}</span></span>
                                        <span className="text-gray-500 uppercase">Ativas: <span className="text-white">{openCommands.length}</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="p-6 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-black text-white uppercase">Relatório Financeiro</h3>
                                    <p className="text-gray-400 text-sm">Movimentação por sessão.</p>
                                </div>
                                <div className="flex gap-2">
                                    <select value={selectedEvent?.id || ''} onChange={e => { const ev = events.find(x => x.id === e.target.value) || null; setSelectedEvent(ev); if (ev) fetchReport(ev.id); }}
                                        className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-sm font-bold min-w-[200px]"
                                        style={{ backgroundColor: '#0a0720' }}>
                                        <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                                        {events.map(ev => <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>{ev.title}</option>)}
                                    </select>
                                    {selectedEvent && <button onClick={() => fetchReport(selectedEvent.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all"><span className="material-icons-outlined text-sm text-gray-400">refresh</span></button>}
                                </div>
                            </div>
                            {reportData.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                    <span className="material-icons-outlined text-4xl opacity-20 block mb-2">analytics</span>
                                    <p className="italic">Selecione um evento.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[{ label: 'Total Geral', val: `R$ ${reportData.reduce((s, i) => s + Number(i.total_price_brl), 0).toFixed(2)}`, color: 'text-primary' },
                                        { label: 'Total Itens', val: reportData.reduce((s, i) => s + i.quantity, 0), color: 'text-white' },
                                        { label: 'Comandas', val: [...new Set(reportData.map(i => i.command_id))].length, color: 'text-white' }].map(c => (
                                            <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                <p className="text-xs text-gray-500 uppercase font-black mb-1">{c.label}</p>
                                                <p className={`text-2xl font-display font-black ${c.color}`}>{c.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {Object.entries(reportBySection()).map(([section, data]) => (
                                        <div key={section} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                                                <span className="text-sm font-black text-white uppercase tracking-widest">{section}</span>
                                                <span className="text-primary font-black">R$ {data.total.toFixed(2)}</span>
                                            </div>
                                            <table className="w-full text-xs">
                                                <thead><tr className="border-b border-white/5">
                                                    <th className="text-left px-4 py-2 text-gray-600 font-bold uppercase">Produto</th>
                                                    <th className="text-center px-4 py-2 text-gray-600 font-bold uppercase">Qtd</th>
                                                    <th className="text-right px-4 py-2 text-gray-600 font-bold uppercase">Total</th>
                                                </tr></thead>
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 flex-shrink-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center"><span className="material-icons-outlined text-primary text-xl">receipt</span></div>
                                <div><h4 className="text-base font-display font-black text-white uppercase">Checkout</h4><p className="text-gray-400 text-xs">Confirmar e encerrar comanda.</p></div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <img src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`} className="w-8 h-8 rounded-full border border-primary/50" alt="" />
                                <div>
                                    <PlayerName p={selectedCommand.profiles} />
                                    <span className="text-[10px] text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items list */}
                        <div className="flex-1 overflow-y-auto px-5 pb-2 custom-scrollbar min-h-0">
                            <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Itens consumidos</p>
                            <div className="space-y-1">
                                {commandItems.length === 0 ? (
                                    <p className="text-gray-600 text-xs italic">Nenhum item lançado.</p>
                                ) : commandItems.map((item, i) => {
                                    const name = item.products?.name || item.notes || 'Item';
                                    return (
                                        <div key={item.id || i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                                            <span className="text-xs text-gray-300">{name}</span>
                                            <span className="text-xs text-white font-bold whitespace-nowrap ml-2">{Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-5 flex-shrink-0 border-t border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-white font-black uppercase">Total</span>
                                <span className="text-xl font-display font-black text-primary">R$ {Number(selectedCommand.total_brl).toFixed(2)}</span>
                            </div>
                            <div className="space-y-2">
                                <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">payments</span>Confirmar (BRL)</>}
                                </button>
                                <button onClick={() => setShowCheckout(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Voltar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top-Up Modal */}
            {showTopUp && selectedCommand && isAdmin && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center"><span className="material-icons-outlined text-green-400 text-2xl">account_balance_wallet</span></div>
                            <div><h4 className="text-lg font-display font-black text-white uppercase">Saldo Pago</h4><p className="text-gray-400 text-xs">Crédito de pagamento em espécie.</p></div>
                        </div>
                        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 mb-0.5">Creditando para</p>
                            <PlayerName p={selectedCommand.profiles} />
                        </div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Valor Recebido (R$)</label>
                        <input type="number" step="0.01" min="0.01" autoFocus value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTopUp()} placeholder="0.00"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-green-400 transition-all mb-4" />
                        <div className="space-y-2">
                            <button onClick={handleTopUp} disabled={isLoading || !topUpAmount} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">add_card</span>Confirmar Crédito</>}
                            </button>
                            <button onClick={() => { setShowTopUp(false); setTopUpAmount(''); }} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Closed Command Modal */}
            {editingClosedCommand && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center"><span className="material-icons-outlined text-yellow-400 text-2xl">edit_note</span></div>
                            <div><h4 className="text-base font-display font-black text-white uppercase">Editar Comanda</h4><p className="text-gray-400 text-xs">{editingClosedCommand.profiles?.name}</p></div>
                        </div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Ajustar Total (R$)</label>
                        <input type="number" step="0.01" min="0" id="edit-cmd-total" defaultValue={Number(editingClosedCommand.total_brl).toFixed(2)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-yellow-400 transition-all mb-4" />
                        <div className="space-y-2">
                            <button onClick={async () => {
                                const input = document.getElementById('edit-cmd-total') as HTMLInputElement;
                                const newTotal = parseFloat(input.value);
                                if (isNaN(newTotal) || newTotal < 0) return;
                                await supabase.from('commands').update({ total_brl: newTotal }).eq('id', editingClosedCommand.id);
                                if (selectedEvent) { fetchClosedCommands(selectedEvent.id); fetchReport(selectedEvent.id); }
                                setEditingClosedCommand(null);
                            }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                                <span className="material-icons-outlined text-sm">save</span>Salvar
                            </button>
                            <button onClick={() => setEditingClosedCommand(null)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full View Modal — closed command items */}
            {viewingClosedCommand && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 flex-shrink-0 border-b border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                                        <span className="material-icons-outlined text-cyan-400 text-xl">receipt_long</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-display font-black text-white uppercase">Extrato da Comanda</h4>
                                        <p className="text-gray-500 text-xs">{viewingClosedCommand.closed_at ? new Date(viewingClosedCommand.closed_at).toLocaleString('pt-BR') : '—'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingClosedCommand(null)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all">
                                    <span className="material-icons-outlined text-gray-400 text-sm">close</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                <img src={viewingClosedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${viewingClosedCommand.profiles?.name}&background=random`} className="w-9 h-9 rounded-full border border-white/10" alt="" />
                                <div>
                                    <PlayerName p={viewingClosedCommand.profiles} />
                                    <span className="text-[10px] text-primary font-black">CR#{String(viewingClosedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                            {viewingItems.length === 0 ? (
                                <p className="text-gray-600 text-sm italic text-center py-8">Nenhum item encontrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {viewingItems.map((item, i) => {
                                        const name = item.products?.name || item.notes?.split(' —')[0] || 'Item';
                                        const detail = item.notes?.includes('—') ? item.notes.split('— ')[1] : null;
                                        const price = Number(item.total_price_brl);
                                        return (
                                            <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-bold truncate">{name}</p>
                                                    {detail && <p className="text-[10px] text-gray-500 truncate">{detail}</p>}
                                                </div>
                                                <span className={`text-sm font-black whitespace-nowrap ${price === 0 ? 'text-green-400' : 'text-white'}`}>
                                                    {price === 0 ? 'GRÁTIS' : `R$ ${price.toFixed(2)}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
                            <span className="text-sm font-black text-gray-500 uppercase">Total Pago</span>
                            <span className="text-xl font-display font-black text-primary">R$ {Number(viewingClosedCommand.total_brl).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
