import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
    onUpdateProfile?: (id: string, stats: any) => void;
    badgeTemplates?: any[];
    onSendAdminMessage?: (subject: string, content: string, category: 'admin' | 'system' | 'tournament') => void;
    onCreatePoll?: (question: string, options: string[]) => void;
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser, isAdmin = false, onUpdateProfile, badgeTemplates = [], onSendAdminMessage, onCreatePoll }) => {
    const [activeTab, setActiveTab] = useState<'operational' | 'reports' | 'launch' | 'send-gifts' | 'debts' | 'communications'>('operational');
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
    const [productSection, setProductSection] = useState<'bar' | 'torneio' | 'produtos' | 'cash'>('bar');
    const [pendingProduct, setPendingProduct] = useState<any | null>(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [commandsTab, setCommandsTab] = useState<'ativas' | 'historico'>('ativas');
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportFilter, setReportFilter] = useState<'event' | 'date' | 'product'>('event');
    const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
    const [reportProductFilter, setReportProductFilter] = useState('all');
    const [extraReportData, setExtraReportData] = useState<any[]>([]);
    const [reportCommandsData, setReportCommandsData] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [editingClosedCommand, setEditingClosedCommand] = useState<any | null>(null);
    const [viewingClosedCommand, setViewingClosedCommand] = useState<any | null>(null);
    const [viewingItems, setViewingItems] = useState<any[]>([]);
    const [toast, setToast] = useState<{ msg: string; price: number } | null>(null);
    const toastTimer = useRef<any>(null);

    // Launch Tab State
    const [newProduct, setNewProduct] = useState({ name: '', category: 'bar', price: '', description: '' });
    const [allProducts, setAllProducts] = useState<any[]>([]); // Includes inactive
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Gift Tab State
    const [giftTarget, setGiftTarget] = useState<'single' | 'all'>('single');
    const [selectedGiftUsers, setSelectedGiftUsers] = useState<any[]>([]);
    const [giftType, setGiftType] = useState<'brl' | 'chipz' | 'badge'>('brl');
    const [giftAmount, setGiftAmount] = useState('');
    const [giftSearchQuery, setGiftSearchQuery] = useState('');
    const [giftDescription, setGiftDescription] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState('');
    const [giftSearchResults, setGiftSearchResults] = useState<any[]>([]);
    const [checkoutDiscount, setCheckoutDiscount] = useState('');
    const [confirmingCheckout, setConfirmingCheckout] = useState(false);
    const [confirmingTopUp, setConfirmingTopUp] = useState(false);
    const [checkoutDebt, setCheckoutDebt] = useState('');
    const [activeDebts, setActiveDebts] = useState<any[]>([]);
    const [totalActiveDebt, setTotalActiveDebt] = useState(0);

    // Communication Tab State
    const [adminSubject, setAdminSubject] = useState('');
    const [adminMsgContent, setAdminMsgContent] = useState('');
    const [adminMsgCategory, setAdminMsgCategory] = useState<'admin' | 'system' | 'tournament'>('admin');
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [cashAmount, setCashAmount] = useState('');
    const [usersWithSelectedBadge, setUsersWithSelectedBadge] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchBadgeOwners = async () => {
            if (giftType === 'badge' && selectedBadgeId) {
                const { data } = await supabase.from('user_badges').select('user_id').eq('badge_template_id', selectedBadgeId);
                if (data) setUsersWithSelectedBadge(new Set(data.map(d => d.user_id)));
            } else {
                setUsersWithSelectedBadge(new Set());
            }
        };
        fetchBadgeOwners();
    }, [giftType, selectedBadgeId]);

    const [debtSearchQuery, setDebtSearchQuery] = useState('');
    const [debtSearchResults, setDebtSearchResults] = useState<any[]>([]);
    const [debtFilter, setDebtFilter] = useState('');
    const [showNewDebtForm, setShowNewDebtForm] = useState(false);
    const [newDebtData, setNewDebtData] = useState({ userId: '', amount: '', eventId: '', description: '' });

    const handleAddPollOption = () => setPollOptions([...pollOptions, '']);
    const handleUpdatePollOption = (index: number, val: string) => {
        const updated = [...pollOptions];
        updated[index] = val;
        setPollOptions(updated);
    };

    const handleSendBroadcast = () => {
        if (onSendAdminMessage && adminSubject && adminMsgContent) {
            onSendAdminMessage(adminSubject, adminMsgContent, adminMsgCategory);
            setAdminSubject('');
            setAdminMsgContent('');
            alert('Comunicado Global enviado!');
        }
    };

    const handleCreatePollSubmit = () => {
        const validOptions = pollOptions.filter(o => o.trim());
        if (onCreatePoll && pollQuestion && validOptions.length >= 2) {
            onCreatePoll(pollQuestion, validOptions);
            setPollQuestion('');
            setPollOptions(['', '']);
            alert('Enquete publicada!');
        }
    };

    const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
    const upcomingEventsList = events.filter(ev => ev.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    const pastEventsList = events.filter(ev => ev.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));


    const updatePlayerBalanceLocally = (userId: string, amount: number, type: 'brl' | 'chipz' = 'brl') => {
        const field = type === 'brl' ? 'balance_brl' : 'balance_chipz';
        const propField = type === 'brl' ? 'balanceBrl' : 'balanceChipz';

        // Update selectedCommand if matches
        if (selectedCommand && selectedCommand.user_id === userId) {
            setSelectedCommand((prev: any) => prev ? ({
                ...prev,
                profiles: {
                    ...prev.profiles,
                    [field]: (Number(prev.profiles?.[field]) || 0) + amount
                }
            }) : null);
        }

        // Update in openCommands
        setOpenCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                return {
                    ...cmd,
                    profiles: {
                        ...cmd.profiles,
                        [field]: (Number(cmd.profiles?.[field]) || 0) + amount
                    }
                };
            }
            return cmd;
        }));

        // Update in closedCommands
        setClosedCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                return {
                    ...cmd,
                    profiles: {
                        ...cmd.profiles,
                        [field]: (Number(cmd.profiles?.[field]) || 0) + amount
                    }
                };
            }
            return cmd;
        }));

        // Update in searchResults
        setSearchResults(prev => prev.map(p => {
            if (p.id === userId) {
                return {
                    ...p,
                    [field]: (Number(p[field]) || 0) + amount
                };
            }
            return p;
        }));

        // Also update the global currentUser if it's the admin themselves
        if (currentUser && currentUser.id === userId && onUpdateProfile) {
            const updatedStats = {
                ...currentUser,
                [propField]: (Number(currentUser[propField]) || 0) + amount
            };
            onUpdateProfile(userId, updatedStats);
        }
    };

    useEffect(() => { fetchEvents(); fetchProducts(); fetchAllProducts(); fetchDebts(); }, []);
    useEffect(() => {
        if (activeTab === 'debts') fetchDebts();
    }, [activeTab]);
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
    const fetchAllProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('category');
        if (data) setAllProducts(data);
    };
    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price) { alert('Nome e preço são obrigatórios.'); return; }
        setIsLoading(true);
        try {
            const { error } = await supabase.from('products').insert({
                name: newProduct.name,
                category: newProduct.category,
                price: parseFloat(newProduct.price),
                description: newProduct.description,
                active: true
            });
            if (error) throw error;
            alert('✅ Produto lançado com sucesso!');
            setNewProduct({ name: '', category: 'bar', price: '', description: '' });
            fetchAllProducts();
            fetchProducts();
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };
    const toggleProductStatus = async (product: any) => {
        const { error } = await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
        if (error) { alert('Erro: ' + error.message); return; }
        fetchAllProducts();
        fetchProducts();
    };
    const deleteProduct = async (productId: string) => {
        if (!window.confirm('⚠️ Tem certeza que deseja EXCLUIR este produto permanentemente do banco de dados?')) return;
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) { alert('Erro ao excluir: ' + error.message); return; }
        fetchAllProducts();
        fetchProducts();
    };
    const fetchOpenCommands = async (eventId: string) => {
        const { data } = await supabase.from('commands').select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status, role, balance_brl, debt_limit_brl, total_pending_debt)').eq('event_id', eventId).eq('status', 'open').order('created_at', { ascending: false });
        if (data) setOpenCommands(data);
    };
    const fetchClosedCommands = async (eventId: string) => {
        const { data } = await supabase.from('commands').select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status, balance_brl, debt_limit_brl, total_pending_debt)').eq('event_id', eventId).eq('status', 'closed').order('closed_at', { ascending: false });
        if (data) setClosedCommands(data);
    };
    const fetchCommandItems = async (commandId: string) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category)').eq('command_id', commandId).order('created_at', { ascending: true });
        if (data) setCommandItems(data);
    };

    const handleDeleteCommandItem = async (item: any) => {
        if (!selectedCommand && !viewingClosedCommand) return;
        const currentCmd = selectedCommand || viewingClosedCommand;

        if (currentCmd.status !== 'open') {
            alert('Apenas itens de comandas abertas podem ser excluídos.');
            return;
        }

        if (!window.confirm(`Excluir item "${item.products?.name || item.notes || 'Item'}" da comanda?`)) return;

        setIsLoading(true);
        try {
            // 1. Deletar o item
            const { error: delErr } = await supabase.from('command_items').delete().eq('id', item.id);
            if (delErr) throw delErr;

            // 2. Atualizar o total da comanda
            const itemPrice = Number(item.total_price_brl) || 0;
            const newTotal = Math.max(0, Number(currentCmd.total_brl) - itemPrice);

            const { error: updErr } = await supabase.from('commands').update({ total_brl: newTotal }).eq('id', currentCmd.id);
            if (updErr) throw updErr;

            // 3. Atualizar estado local
            if (selectedCommand?.id === currentCmd.id) {
                const updItems = commandItems.filter(i => i.id !== item.id);
                setCommandItems(updItems);
                setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
            }

            if (viewingClosedCommand?.id === currentCmd.id) {
                const updItems = viewingItems.filter(i => i.id !== item.id);
                setViewingItems(updItems);
                setViewingClosedCommand({ ...viewingClosedCommand, total_brl: newTotal });
            }

            setOpenCommands(prev => prev.map(c => c.id === currentCmd.id ? { ...c, total_brl: newTotal } : c));

            // alert('Item excluído com sucesso!');
        } catch (err: any) {
            alert('Erro ao excluir item: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchReport = async (eventId: string) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category), commands!inner(event_id, profiles!user_id(name, numeric_id))').eq('commands.event_id', eventId);
        if (data) setReportData(data);
        const { data: cmds } = await supabase.from('commands').select('*').eq('event_id', eventId).eq('status', 'closed');
        if (cmds) setReportCommandsData(cmds);
    };
    const fetchMonthlyReport = async (start: string, end: string) => {
        if (!start || !end) return;
        setIsLoading(true);
        // Fetch command items
        const { data: cmdItems } = await supabase.from('command_items')
            .select('*, products(name, category), commands!inner(event_id, status, closed_at, profiles!user_id(name, numeric_id))')
            .gte('commands.closed_at', start + 'T00:00:00.000Z')
            .lte('commands.closed_at', end + 'T23:59:59.999Z')
            .eq('commands.status', 'closed');

        // Fetch transactions (VIP, Chipz, etc.)
        const { data: txs } = await supabase.from('transactions')
            .select('*, profiles!user_id(name, numeric_id)')
            .gte('created_at', start + 'T00:00:00.000Z')
            .lte('created_at', end + 'T23:59:59.999Z')
            .not('category', 'eq', 'wallet_deposit'); // Don't count deposits as revenue, only sales

        if (cmdItems) setReportData(cmdItems);
        if (txs) setExtraReportData(txs);
        const { data: cmds } = await supabase.from('commands')
            .select('*')
            .gte('closed_at', start + 'T00:00:00.000Z')
            .lte('closed_at', end + 'T23:59:59.999Z')
            .eq('status', 'closed');
        if (cmds) setReportCommandsData(cmds);
        setIsLoading(false);
    };

    const fetchDebts = async () => {
        const { data } = await supabase.from('debts')
            .select('*, profiles!user_id(name, numeric_id, avatar_url, balance_brl, debt_limit_brl, total_pending_debt), events(title)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (data) {
            setActiveDebts(data);
            setTotalActiveDebt(data.reduce((sum, d) => sum + Number(d.amount_brl), 0));
        }
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
        updatePlayerBalanceLocally(cmd.user_id, Number(cmd.total_brl)); // Refund balance locally
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
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status, balance_brl, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setSearchResults(data || []);
    };

    const handleOpenCommand = async (player: any) => {
        if (!selectedEvent) { alert('Selecione um evento primeiro.'); return; }
        if (openCommands.find(c => c.user_id === player.id)) { alert('Jogador já tem comanda aberta.'); return; }
        const { data, error } = await supabase.from('commands').insert({ event_id: selectedEvent.id, user_id: player.id, status: 'open', opened_by: currentUser.id }).select('*, profiles!user_id(name, numeric_id, avatar_url, vip_status, role, balance_brl, debt_limit_brl, total_pending_debt)').single();
        if (error) { alert('Erro: ' + error.message); return; }
        setOpenCommands([data, ...openCommands]);
        setSearchQuery(''); setSearchResults([]);
        setSelectedCommand(data);
    };

    const handleGiftSearch = async (query: string) => {
        setGiftSearchQuery(query);
        if (query.length < 2) { setGiftSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status, balance_brl, balance_chipz, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(10);
        setGiftSearchResults(data || []);
    };

    const handleDebtSearch = async (query: string) => {
        setDebtSearchQuery(query);
        if (query.length < 2) { setDebtSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status, balance_brl, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setDebtSearchResults(data || []);
    };

    const handleRegisterDebt = async () => {
        if (!isAdmin || !newDebtData.userId || !newDebtData.amount || !newDebtData.eventId) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        setIsLoading(true);
        try {
            const isOnline = newDebtData.eventId === 'online_credit';
            const { error } = await supabase.from('debts').insert({
                user_id: newDebtData.userId,
                event_id: isOnline ? null : newDebtData.eventId,
                amount_brl: parseFloat(newDebtData.amount),
                description: newDebtData.description || (isOnline ? 'Crédito Online' : ''),
                status: 'pending'
            });
            if (error) throw error;

            await supabase.from('messages').insert({
                user_id: newDebtData.userId,
                sender: 'Sistema',
                sender_id: currentUser.id,
                content: `Um novo débito de R$ ${parseFloat(newDebtData.amount).toFixed(2)} foi registrado administrativamente.`,
                category: 'system',
                is_read: false
            });

            alert("Débito registrado com sucesso!");
            setShowNewDebtForm(false);
            setNewDebtData({ userId: '', amount: '', eventId: '', description: '' });
            setDebtSearchQuery('');
            setDebtSearchResults([]);
            fetchDebts();
        } catch (err: any) {
            alert("Erro ao registrar débito: " + err.message);
        } finally {
            setIsLoading(false);
        }
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

    const getCashItems = () => [
        { id: 'cash-20', name: '20 fichas', price: 20 },
        { id: 'cash-30', name: '30 fichas', price: 30 },
        { id: 'cash-50', name: '50 fichas', price: 50 },
        { id: 'cash-100', name: '100 fichas', price: 100 },
        { id: 'cash-200', name: '200 fichas', price: 200 },
        { id: 'cash-500', name: '500 fichas', price: 500 },
    ];

    const getVipPrice = (price: number, category: string, name: string) =>
        applyVipDiscount(price, category, name, selectedCommand?.profiles?.vip_status);

    const addProductToCommand = async (product: any) => {
        if (!selectedCommand) return;
        const finalPrice = getVipPrice(Number(product.price), product.category, product.name);
        const { error } = await supabase.from('command_items').insert({
            command_id: selectedCommand.id,
            product_id: product.id,
            quantity: 1,
            unit_price_brl: finalPrice,
            unit_price_chipz: 0,
            total_price_brl: finalPrice,
            total_price_chipz: 0,
            notes: null,
            created_by: currentUser.id
        });
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
        const { error } = await supabase.from('command_items').insert({
            command_id: selectedCommand.id,
            product_id: null,
            quantity: 1,
            unit_price_brl: finalPrice,
            unit_price_chipz: 0,
            total_price_brl: finalPrice,
            total_price_chipz: 0,
            notes: `${item.name} — ${item.chips} fichas${bonusNote}`,
            created_by: currentUser.id
        });
        if (error) { alert('Erro: ' + error.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(upd);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
        fetchCommandItems(selectedCommand.id);
        showToast(item.name, finalPrice);
    };

    const addCashItemToCommand = async (item: any) => {
        if (!selectedCommand) return;
        const finalPrice = item.price;
        const { error } = await supabase.from('command_items').insert({
            command_id: selectedCommand.id,
            product_id: null,
            quantity: 1,
            unit_price_brl: finalPrice,
            unit_price_chipz: 0,
            total_price_brl: finalPrice,
            total_price_chipz: 0,
            notes: `Cash Game — ${item.name}`,
            created_by: currentUser.id
        });
        if (error) { alert('Erro: ' + error.message); return; }
        const newTotal = Number(selectedCommand.total_brl) + finalPrice;
        await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);
        const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
        setOpenCommands(upd);
        setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
        fetchCommandItems(selectedCommand.id);
        showToast(item.name, finalPrice);
    };

    const handleAddManualCash = async () => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        const amount = parseFloat(cashAmount);
        if (isNaN(amount) || amount <= 0) { alert('Valor inválido.'); return; }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('command_items').insert({
                command_id: selectedCommand.id,
                product_id: null,
                quantity: 1,
                unit_price_brl: amount,
                unit_price_chipz: 0,
                total_price_brl: amount,
                total_price_chipz: 0,
                notes: `Cash Game — Compra Manual`,
                created_by: currentUser.id
            });
            if (error) throw error;

            const newTotal = Number(selectedCommand.total_brl) + amount;
            await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);

            const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
            setOpenCommands(upd);
            setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
            fetchCommandItems(selectedCommand.id);

            showToast('Compra Cash', amount);
            setCashAmount('');
        } catch (err: any) {
            alert('Erro ao lançar cash: ' + err.message);
        } finally {
            setIsLoading(false);
        }
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
    const handleCashItemClick = (item: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (pendingProduct?.id === item.id) { addCashItemToCommand(item); setPendingProduct(null); }
        else setPendingProduct(item);
    };

    const handleCloseCommand = async () => {
        if (!selectedCommand) return;
        const total = Number(selectedCommand.total_brl);
        const discount = parseFloat(checkoutDiscount) || 0;
        const debt = parseFloat(checkoutDebt) || 0;
        const finalToDeduct = Math.max(0, total - discount - debt);

        if (!confirmingCheckout) {
            // Validate debt limit before showing confirmation
            const currentDebt = Number(selectedCommand.profiles?.total_pending_debt || 0);
            const limit = Number(selectedCommand.profiles?.debt_limit_brl || 0);

            if (debt > 0 && (currentDebt + debt) > limit) {
                alert(`Limite de pendura excedido! \nLimite: R$ ${limit.toFixed(2)}\nPendência atual: R$ ${currentDebt.toFixed(2)}\nTentativa: R$ ${debt.toFixed(2)}`);
                return;
            }

            // Check if player has enough balance for the remainder
            if (Number(selectedCommand.profiles?.balance_brl || 0) < finalToDeduct) {
                alert('Saldo insuficiente para cobrir o restante da comanda!');
                return;
            }

            setConfirmingCheckout(true);
            return;
        }

        setIsLoading(true);
        try {
            // 1. If there's debt, record it
            if (debt > 0) {
                const { error: debtErr } = await supabase.from('debts').insert({
                    user_id: selectedCommand.user_id,
                    command_id: selectedCommand.id,
                    event_id: selectedCommand.event_id,
                    amount_brl: debt,
                    status: 'pending'
                });
                if (debtErr) throw debtErr;
            }

            // 2. Deduct the remainder from player balance
            if (finalToDeduct > 0) {
                const { error: deductErr } = await supabase.rpc('deduct_balance_brl', {
                    p_user_id: selectedCommand.user_id,
                    p_amount: finalToDeduct
                });
                if (deductErr) throw deductErr;
            }

            // 3. Close the command
            await supabase.from('commands').update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                discount_brl: discount,
                unpaid_amount_brl: debt
            }).eq('id', selectedCommand.id);

            // 4. Notify user
            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id,
                sender_id: currentUser.id,
                content: `Sua comanda foi encerrada. Total: R$ ${total.toFixed(2)}${discount > 0 ? ` (Desconto: R$ ${discount.toFixed(2)})` : ''}${debt > 0 ? ` (Pendura: R$ ${debt.toFixed(2)})` : ''}. R$ ${finalToDeduct.toFixed(2)} descontado do saldo.`,
                category: 'system',
                is_read: false
            });

            // 5. Update UI
            updatePlayerBalanceLocally(selectedCommand.user_id, -finalToDeduct);
            setOpenCommands(openCommands.filter(c => c.id !== selectedCommand.id));
            if (selectedEvent) fetchClosedCommands(selectedEvent.id);
            fetchDebts(); // Refresh debt list

            setSelectedCommand(null);
            setShowCheckout(false);
            setCommandItems([]);
            setCheckoutDiscount('');
            setCheckoutDebt('');
            setConfirmingCheckout(false);
        } catch (err: any) {
            alert('Erro ao fechar comanda: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettleDebt = async (debt: any, type: 'balance' | 'manual') => {
        if (!isAdmin) return;
        const amount = Number(debt.amount_brl);
        if (!window.confirm(`Confirmar baixa ${type === 'balance' ? 'via SALDO' : 'MANUAL'} de R$ ${amount.toFixed(2)} p/ ${debt.profiles?.name}?`)) return;

        setIsLoading(true);
        try {
            if (type === 'balance') {
                const { error: deductErr } = await supabase.rpc('deduct_balance_brl', {
                    p_user_id: debt.user_id,
                    p_amount: amount
                });
                if (deductErr) throw deductErr;
                updatePlayerBalanceLocally(debt.user_id, -amount);
            }

            const { error: updateErr } = await supabase.from('debts').update({
                status: 'paid',
                paid_at: new Date().toISOString()
            }).eq('id', debt.id);
            if (updateErr) throw updateErr;

            await supabase.from('messages').insert({
                user_id: debt.user_id,
                sender_id: currentUser.id,
                content: `Sua pendência de R$ ${amount.toFixed(2)} foi baixada (${type === 'balance' ? 'Saldo R$' : 'Baixa Manual'}).`,
                category: 'system',
                is_read: false
            });

            fetchDebts();
            alert('Baixa realizada com sucesso!');
        } catch (err: any) {
            alert('Erro ao dar baixa: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopUp = async () => {
        if (!isAdmin || !selectedCommand) return;
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0) return;
        if (!confirmingTopUp) {
            setConfirmingTopUp(true);
            return;
        }
        setIsLoading(true);
        try {
            // Atomic increment — no race condition
            const { error: incrErr } = await supabase.rpc('increment_balance_brl', {
                p_user_id: selectedCommand.user_id,
                p_amount: amount
            });
            if (incrErr) { alert('Erro ao creditar: ' + incrErr.message); return; }
            await supabase.from('messages').insert({ user_id: selectedCommand.user_id, sender_id: currentUser.id, content: `Pagamento de R$ ${amount.toFixed(2)} registrado pelo admin. Saldo atualizado.`, category: 'system', is_read: false });
            updatePlayerBalanceLocally(selectedCommand.user_id, amount); // Update balance locally
            alert(`✅ R$ ${amount.toFixed(2)} creditado com sucesso!`);
            setShowTopUp(false);
            setTopUpAmount('');
            setConfirmingTopUp(false);
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

    const handleSendGifts = async () => {
        if (!isAdmin) return;
        const amount = giftType === 'badge' ? 0 : parseFloat(giftAmount);

        if (giftType !== 'badge' && (!amount || amount <= 0)) { alert('Valor inválido.'); return; }
        if (giftType === 'badge' && !selectedBadgeId) { alert('Selecione uma insígnia.'); return; }

        let targetUserIds: string[] = [];

        if (giftTarget === 'all') {
            const label = giftType === 'brl' ? 'R$' : giftType === 'chipz' ? 'Chipz' : 'a Insígnia';
            const val = giftType === 'badge' ? badgeTemplates.find(b => b.id === selectedBadgeId)?.title : amount;
            if (!window.confirm(`Tem certeza que deseja enviar ${label} ${val} para TODOS os jogadores?`)) return;
            setIsLoading(true);
            const { data } = await supabase.from('profiles').select('id');
            if (data) targetUserIds = data.map(u => u.id);
        } else {
            if (selectedGiftUsers.length === 0) { alert('Selecione pelo menos um usuário.'); return; }
            targetUserIds = selectedGiftUsers.map(u => u.id);
        }

        if (targetUserIds.length === 0) { alert('Nenhum usuário encontrado.'); setIsLoading(false); return; }

        setIsLoading(true);
        try {
            // DUPLICATE BADGE PROTECTION
            if (giftType === 'badge') {
                const template = badgeTemplates.find(b => b.id === selectedBadgeId);
                if (template) {
                    const { data: duplicates } = await supabase.from('user_badges')
                        .select('user_id, profiles!user_id(name)')
                        .in('user_id', targetUserIds)
                        .eq('badge_template_id', template.id);

                    if (duplicates && duplicates.length > 0) {
                        const names = (duplicates as any[]).map(d => d.profiles?.name || 'Jogador').join(', ');
                        if (giftTarget !== 'all') {
                            alert(`🚫 BLOQUEADO: Os seguintes jogadores já possuem a insígnia "${template.title}":\n\n${names}\n\nO sistema não permite o envio repetido da mesma honraria para o mesmo jogador.`);
                            setIsLoading(false);
                            return;
                        } else {
                            if (!window.confirm(`Aviso: ${duplicates.length} jogadores já possuem a insígnia "${template.title}" e serão ignorados nesta operação. Deseja prosseguir com os demais ${targetUserIds.length - duplicates.length}?`)) {
                                setIsLoading(false);
                                return;
                            }
                            const duplicateIds = duplicates.map(d => d.user_id);
                            targetUserIds = targetUserIds.filter(id => !duplicateIds.includes(id));
                        }
                    }
                }
            }

            if (targetUserIds.length === 0) {
                alert('Nenhum usuário apto a receber esta recompensa no momento.');
                setIsLoading(false);
                return;
            }

            const finalAmount = giftType === 'chipz' ? Math.floor(amount) : amount;
            const logMsg = giftType === 'brl' ? `R$ ${finalAmount.toFixed(2)}` : giftType === 'chipz' ? `${finalAmount} Chipz` : `Insígnia: ${badgeTemplates.find(b => b.id === selectedBadgeId)?.title}`;
            const finalDescription = giftDescription.trim() || `Atribuição de Admin: ${logMsg}`;

            // Chunks for mass sending
            const chunks = [];
            for (let i = 0; i < targetUserIds.length; i += 20) {
                chunks.push(targetUserIds.slice(i, i + 20));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(async (uid) => {
                    if (giftType === 'badge') {
                        const template = badgeTemplates.find(b => b.id === selectedBadgeId);
                        if (template) {
                            await supabase.from('user_badges').insert({
                                user_id: uid,
                                title: template.title,
                                description: finalDescription || template.description,
                                icon: template.icon || 'stars',
                                badge_template_id: template.id
                            });
                        }
                    } else {
                        // Use secure_balance_transaction for logging and safety
                        await supabase.rpc('secure_balance_transaction', {
                            user_id: uid,
                            brl_amount: giftType === 'brl' ? finalAmount : 0,
                            chipz_amount: giftType === 'chipz' ? finalAmount : 0,
                            description: finalDescription,
                            category: 'gift'
                        });
                        updatePlayerBalanceLocally(uid, finalAmount, giftType);
                    }

                    await supabase.from('messages').insert({
                        user_id: uid,
                        sender: 'Admin',
                        sender_id: currentUser.id,
                        subject: giftType === 'badge' ? '🎖️ Você recebeu uma Insígnia!' : '🎁 Você recebeu um Presente!',
                        content: `${finalDescription}. ${giftType !== 'badge' ? 'O saldo já foi atualizado e está disponível para uso.' : ''}`,
                        category: 'gift',
                        is_read: false
                    });
                }));
            }

            alert(`✅ Prêmios enviados com sucesso para ${targetUserIds.length} usuários!`);
            setGiftAmount('');
            setGiftDescription('');
            setSelectedBadgeId('');
            setSelectedGiftUsers([]);
        } catch (err: any) {
            alert('Erro ao enviar prêmios: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const reportBySection = () => {
        const sections: Record<string, { total: number; items: Record<string, { qty: number; total: number }> }> = {};

        // Process command items
        reportData.forEach((item: any) => {
            const cat = item.products?.category || (item.notes?.startsWith('Cash Game') ? 'cash' : 'torneio');
            let sec = 'Torneio';
            if (cat === 'bar') sec = 'Bar';
            else if (cat === 'cash') sec = 'Cash';
            else if (['bet', 'jackpot', 'lastlonger'].includes(cat)) sec = 'Produtos';
            else if (['produtos', 'vestuario', 'aluguel', 'curso'].includes(cat)) sec = 'Geral/Loja';
            else if (cat === 'online') sec = 'Online';

            const name = item.products?.name || item.notes || 'Item';
            if (!sections[sec]) sections[sec] = { total: 0, items: {} };
            sections[sec].total += Number(item.total_price_brl);
            if (!sections[sec].items[name]) sections[sec].items[name] = { qty: 0, total: 0 };
            sections[sec].items[name].qty += item.quantity;
            sections[sec].items[name].total += Number(item.total_price_brl);
        });

        // Process extra transactions (VIP, etc.)
        if (reportFilter === 'date') {
            extraReportData.forEach((tx: any) => {
                let sec = 'Outros';
                if (tx.category === 'vip') sec = 'VIP';
                else if (tx.category === 'chipz') sec = 'Chipz Online';
                else if (tx.category === 'online' || tx.category === 'online_credits') sec = 'Online';
                else if (tx.category === 'aluguel') sec = 'Aluguéis';
                else if (tx.category === 'curso') sec = 'Cursos';
                else if (tx.category === 'produtos' || tx.category === 'vestuario') sec = 'Geral/Loja';

                if (!sections[sec]) sections[sec] = { total: 0, items: {} };
                // Reverse the amount if it's a purchase (purchases are logged as negative in rpc but positive for revenue)
                const amt = Math.abs(Number(tx.amount_brl));
                sections[sec].total += amt;

                const name = tx.description || 'Transação';
                if (!sections[sec].items[name]) sections[sec].items[name] = { qty: 0, total: 0 };
                sections[sec].items[name].qty += 1;
                sections[sec].items[name].total += amt;
            });
        }

        return sections;
    };

    const reportByProduct = () => {
        const prodMap: Record<string, { qty: number; total: number; category: string }> = {};

        // Process command items
        reportData.forEach((item: any) => {
            const name = item.products?.name || item.notes || 'Item';
            const cat = item.products?.category || (item.notes?.startsWith('Cash Game') ? 'cash' : 'torneio');

            if (reportCategoryFilter !== 'all' && cat !== reportCategoryFilter) return;
            if (reportProductFilter !== 'all' && name !== reportProductFilter) return;

            if (!prodMap[name]) prodMap[name] = { qty: 0, total: 0, category: cat };
            prodMap[name].qty += item.quantity;
            prodMap[name].total += Number(item.total_price_brl);
        });

        // Process extra transactions (VIP, etc.) if in date mode or product mode
        if (reportFilter !== 'event') {
            extraReportData.forEach((tx: any) => {
                const name = tx.description || 'Transação';
                const cat = tx.category || 'outros';

                if (reportCategoryFilter !== 'all' && cat !== reportCategoryFilter) return;
                if (reportProductFilter !== 'all' && name !== reportProductFilter) return;

                if (!prodMap[name]) prodMap[name] = { qty: 0, total: 0, category: cat };
                const amt = Math.abs(Number(tx.amount_brl));
                prodMap[name].qty += 1;
                prodMap[name].total += amt;
            });
        }

        return Object.entries(prodMap).sort((a, b) => b[1].total - a[1].total);
    };

    const PlayerName = ({ p }: { p: any }) => (
        <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm ${p?.vip_status ? 'text-white' : 'text-gray-200'}`}>{p?.name}</span>
            {p?.vip_status && <span title={p.vip_status}>{VIP_ICONS[p.vip_status]}</span>}
            {p?.vip_status && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${VIP_COLORS[p.vip_status] || ''}`}>{p.vip_status === 'vip_master' ? 'MASTER' : p.vip_status === 'vip_anual' ? 'ANUAL' : 'TRIM.'}</span>}
        </div>
    );

    const filteredProducts = productSection === 'bar' ? products.filter(p => p.category === 'bar')
        : productSection === 'produtos' ? products.filter(p => ['bet', 'jackpot', 'lastlonger'].includes(p.category))
            : [];

    // Helper lists for product/category filters in reporting
    const availableCategories = Array.from(new Set([
        ...reportData.map(i => i.products?.category || (i.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')),
        ...extraReportData.map(i => i.category || 'outros')
    ])).filter(Boolean).sort();

    const availableProducts = Array.from(new Set([
        ...reportData.map(i => i.products?.name || i.notes || 'Item'),
        ...extraReportData.map(i => i.description || 'Transação')
    ])).filter(Boolean).sort();

    const filteredReportItems = reportData.filter(item => {
        const name = item.products?.name || item.notes || 'Item';
        const cat = item.products?.category || (item.notes?.startsWith('Cash Game') ? 'cash' : 'torneio');
        if (reportFilter === 'product') {
            if (reportCategoryFilter !== 'all' && cat !== reportCategoryFilter) return false;
            if (reportProductFilter !== 'all' && name !== reportProductFilter) return false;
        }
        return true;
    });

    const filteredExtraReportItems = extraReportData.filter(tx => {
        const name = tx.description || 'Transação';
        const cat = tx.category || 'outros';
        if (reportFilter === 'product') {
            if (reportCategoryFilter !== 'all' && cat !== reportCategoryFilter) return false;
            if (reportProductFilter !== 'all' && name !== reportProductFilter) return false;
        }
        return true;
    });

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
                    {[{ id: 'operational', icon: 'point_of_sale', label: 'Operaç.' }, { id: 'launch', icon: 'add_shopping_cart', label: 'Lançar' }, { id: 'reports', icon: 'bar_chart', label: 'Relat.' }, { id: 'send-gifts', icon: 'stars', label: 'Prêmios' }, { id: 'debts', icon: 'receipt_long', label: 'Pendura' }, { id: 'communications', icon: 'campaign', label: 'Comunic.' }].map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id as any); if (t.id === 'reports' && selectedEvent) fetchReport(selectedEvent.id); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest ${activeTab === t.id ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:bg-white/5'}`}>
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
                                <div className="space-y-2">
                                    <div className={`flex items-center gap-3 bg-white/5 border rounded-2xl p-3 transition-all ${(!selectedEvent || upcomingEventsList.some(e => e.id === selectedEvent?.id)) ? 'border-primary/40 bg-primary/5' : 'border-white/10'}`}>
                                        <span className={`material-icons-outlined text-sm flex-shrink-0 ${(!selectedEvent || upcomingEventsList.some(e => e.id === selectedEvent?.id)) ? 'text-primary' : 'text-gray-500'}`}>calendar_today</span>
                                        <select
                                            value={upcomingEventsList.some(e => e.id === selectedEvent?.id) ? selectedEvent?.id : ''}
                                            onChange={e => {
                                                const ev = events.find(x => x.id === e.target.value) || null;
                                                setSelectedEvent(ev); setSelectedCommand(null); setPendingProduct(null);
                                            }}
                                            className="flex-1 bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                                        >
                                            <option value="" style={{ backgroundColor: '#0a0720' }}>Próximos Eventos / Hoje</option>
                                            {upcomingEventsList.map(ev => {
                                                const isEvToday = ev.date === todayStr;
                                                return (
                                                    <option key={ev.id} value={ev.id} style={{ backgroundColor: '#16103a', color: isEvToday ? '#ff007a' : 'white' }}>
                                                        {isEvToday ? '🔴 ' : ''}{ev.title} ({new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className={`flex items-center gap-3 bg-white/5 border rounded-2xl p-3 transition-all ${pastEventsList.some(e => e.id === selectedEvent?.id) ? 'border-gray-500 bg-white/5' : 'border-white/5 opacity-40 hover:opacity-100'}`}>
                                        <span className="material-icons-outlined text-gray-500 text-sm flex-shrink-0">history_toggle_off</span>
                                        <select
                                            value={pastEventsList.some(e => e.id === selectedEvent?.id) ? selectedEvent?.id : ''}
                                            onChange={e => {
                                                const ev = events.find(x => x.id === e.target.value) || null;
                                                setSelectedEvent(ev); setSelectedCommand(null); setPendingProduct(null);
                                            }}
                                            className="flex-1 bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                                        >
                                            <option value="" style={{ backgroundColor: '#0a0720' }}>Arquivo de Eventos (Passados)</option>
                                            {pastEventsList.map(ev => (
                                                <option key={ev.id} value={ev.id} style={{ backgroundColor: '#16103a' }}>
                                                    {ev.title} ({new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-black">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')}</span>
                                                            <span className="text-[10px] text-green-400 font-black">💵 R$ {Number(cmd.profiles?.balance_brl || 0).toFixed(2)}</span>
                                                        </div>
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
                                                            <button onClick={e => { e.stopPropagation(); openClosedCommandView(cmd); }}
                                                                className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-[8px] font-black uppercase rounded hover:bg-cyan-500 hover:text-white transition-all whitespace-nowrap">
                                                                Ver
                                                            </button>
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
                                        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex-shrink-0 flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {selectedCommand.profiles?.vip_status && <span className="text-sm">{VIP_ICONS[selectedCommand.profiles.vip_status]}</span>}
                                                <p className="text-[10px] text-primary font-black uppercase truncate">
                                                    ▶ {selectedCommand.profiles?.name} — R$ {Number(selectedCommand.total_brl).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-[10px] text-green-400 font-black whitespace-nowrap">
                                                💵 R$ {Number(selectedCommand.profiles?.balance_brl || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex border-b border-white/10 flex-shrink-0">
                                            {(['bar', 'torneio', 'cash', 'produtos'] as const).map(sec => (
                                                <button key={sec} onClick={() => { setProductSection(sec); setPendingProduct(null); }}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${productSection === sec ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                                                    {sec === 'bar' ? '🍺' : sec === 'torneio' ? '♠' : sec === 'cash' ? '💵' : '🎯'} {sec}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-2">
                                                {(productSection === 'bar' || productSection === 'produtos') ? filteredProducts.map(product => {
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
                                                }) : productSection === 'torneio' ? getTournamentItems().map(item => {
                                                    const vipStatus = selectedCommand?.profiles?.vip_status;
                                                    let finalPrice = item.price;
                                                    if (item.name === 'Staff' && vipStatus === 'vip_master') finalPrice = Math.max(0, finalPrice - 10);
                                                    const hasDisc = finalPrice < item.price;
                                                    const isPend = pendingProduct?.id === item.id;
                                                    const disabled = isTourItemDisabled(item);
                                                    const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
                                                    const qty = commandItems.filter(ci => ci.notes?.startsWith(item.name)).length;
                                                    const getTourIcon = (name: string) => {
                                                        if (name === 'Buy In') return 'login';
                                                        if (name === 'Staff') return 'volunteer_activism';
                                                        if (name.includes('Rebuy')) return 'refresh';
                                                        if (name.includes('Add')) return 'add_circle';
                                                        return 'poker_chip';
                                                    };
                                                    return (
                                                        <button key={item.id} onClick={() => handleTourItemClick(item)} disabled={disabled}
                                                            className={`p-2.5 rounded-xl flex flex-col items-center text-center active:scale-95 transition-all border relative
                                                                ${disabled ? 'opacity-30 cursor-not-allowed border-white/5 bg-black/20' : isPend ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 hover:border-primary/50 group'}`}>
                                                            {disabled && <span className="absolute top-1 right-1 text-[8px] text-red-400 font-black">✓</span>}
                                                            {!disabled && qty > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-[#050214]">{qty}x</span>}
                                                            {isAddon && vipStatus === 'vip_master' && <span className="absolute -top-1 -right-1 text-[7px] bg-yellow-500 text-black font-black px-1 rounded">+5K VIP</span>}
                                                            <span className="material-icons-outlined text-gray-500 mb-1 text-base group-hover:text-primary transition-colors">
                                                                {getTourIcon(item.name)}
                                                            </span>
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
                                                }) : (
                                                    <div className="col-span-2 space-y-4">
                                                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <span className="material-icons-outlined text-primary">payments</span>
                                                                <label className="text-[10px] font-black text-gray-300 uppercase block tracking-widest">Lançar Compra de Cash</label>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">R$</span>
                                                                    <input
                                                                        type="number"
                                                                        value={cashAmount}
                                                                        onChange={e => setCashAmount(e.target.value)}
                                                                        placeholder="0,00"
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-black text-lg focus:border-primary outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={handleAddManualCash}
                                                                    disabled={isLoading || !cashAmount}
                                                                    className="bg-primary hover:bg-white hover:text-black text-white px-6 rounded-xl font-black uppercase text-xs transition-all shadow-neon-pink flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">add_circle</span> Lançar</>}
                                                                </button>
                                                            </div>
                                                            <p className="text-[9px] text-gray-600 italic mt-3">Insira o valor exato que o jogador está comprando em fichas.</p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            {commandItems.filter(ci => ci.notes?.startsWith('Cash Game')).map((item, idx) => (
                                                                <div key={idx} className="bg-green-500/5 border border-green-500/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                                                                    <span className="material-icons-outlined text-green-500/50 text-xs mb-1">check_circle</span>
                                                                    <span className="text-[9px] text-gray-400 uppercase font-black">Lançado</span>
                                                                    <span className="text-xs text-white font-black">R$ {Number(item.total_price_brl).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

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
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => { setReportFilter('event'); setReportData([]); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'event' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Evento</button>
                                        <button onClick={() => { setReportFilter('date'); setReportData([]); setReportProductFilter('all'); setReportCategoryFilter('all'); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'date' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Período</button>
                                        <button onClick={() => { setReportFilter('product'); setReportData([]); setExtraReportData([]); setReportProductFilter('all'); setReportCategoryFilter('all'); fetchMonthlyReport(startDate, endDate); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'product' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Produto</button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {reportFilter === 'event' ? (
                                        <>
                                            <select value={selectedEvent?.id || ''} onChange={e => { const ev = events.find(x => x.id === e.target.value) || null; setSelectedEvent(ev); if (ev) fetchReport(ev.id); }}
                                                className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-sm font-bold min-w-[200px]"
                                                style={{ backgroundColor: '#0a0720' }}>
                                                <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                                                {events.map(ev => <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>{ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})</option>)}
                                            </select>
                                            {selectedEvent && <button onClick={() => fetchReport(selectedEvent.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all"><span className="material-icons-outlined text-sm text-gray-400">refresh</span></button>}
                                        </>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-2 bg-[#0a0720] border border-white/10 rounded-xl px-3 py-1">
                                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-gray-400 font-bold text-sm outline-none w-32 custom-date-input" />
                                                <span className="text-gray-500 font-black">até</span>
                                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-gray-400 font-bold text-sm outline-none w-32 custom-date-input" />
                                                <button onClick={() => fetchMonthlyReport(startDate, endDate)} className="p-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all shadow-neon-pink ml-2"><span className="material-icons-outlined text-sm">search</span></button>
                                            </div>

                                            {reportFilter === 'product' && reportData.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={reportCategoryFilter}
                                                        onChange={e => { setReportCategoryFilter(e.target.value); setReportProductFilter('all'); }}
                                                        className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-[10px] font-black uppercase"
                                                    >
                                                        <option value="all">Todas Categorias</option>
                                                        {availableCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                                    </select>

                                                    <select
                                                        value={reportProductFilter}
                                                        onChange={e => setReportProductFilter(e.target.value)}
                                                        className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-[10px] font-black uppercase max-w-[200px]"
                                                    >
                                                        <option value="all">Todos Produtos</option>
                                                        {availableProducts
                                                            .filter(p => {
                                                                if (reportCategoryFilter === 'all') return true;
                                                                const isCmdProd = reportData.some(i => (i.products?.name || i.notes || 'Item') === p && (i.products?.category || (i.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')) === reportCategoryFilter);
                                                                const isExtraProd = extraReportData.some(i => (i.description || 'Transação') === p && (i.category || 'outros') === reportCategoryFilter);
                                                                return isCmdProd || isExtraProd;
                                                            })
                                                            .map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {reportData.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                    <span className="material-icons-outlined text-4xl opacity-20 block mb-2">analytics</span>
                                    <p className="italic">{reportFilter === 'event' ? 'Selecione um evento.' : 'Selecione as datas e clique em buscar.'}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            {
                                                label: 'Total Bruto',
                                                val: `R$ ${(filteredReportItems.reduce((s, i) => s + Number(i.total_price_brl), 0) + (reportFilter !== 'event' ? filteredExtraReportItems.reduce((s, i) => s + Math.abs(Number(i.amount_brl)), 0) : 0)).toFixed(2)}`,
                                                color: 'text-white'
                                            },
                                            {
                                                label: 'Total Itens',
                                                val: filteredReportItems.reduce((s, i) => s + i.quantity, 0) + (reportFilter !== 'event' ? filteredExtraReportItems.length : 0),
                                                color: 'text-white'
                                            },
                                            {
                                                label: 'Quebra de Caixa',
                                                val: `R$ ${(reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.discount_brl || 0), 0) : 0).toFixed(2)}`,
                                                color: 'text-red-400'
                                            },
                                            {
                                                label: 'Comandas',
                                                val: [...new Set(filteredReportItems.map(i => i.command_id))].length + (reportFilter !== 'event' ? filteredExtraReportItems.length : 0),
                                                color: 'text-white'
                                            }
                                        ].map(c => (
                                            <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                <p className="text-[10px] text-gray-500 uppercase font-black mb-1">{c.label}</p>
                                                <p className={`text-xl font-display font-black ${c.color}`}>{c.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                <span className="material-icons-outlined text-red-500">trending_down</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">Faturamento Líquido</p>
                                                <p className="text-[10px] text-gray-500">Total Geral - Quebra de Caixa</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-display font-black text-green-400">
                                                R$ {(
                                                    filteredReportItems.reduce((s, i) => s + Number(i.total_price_brl), 0) +
                                                    (reportFilter !== 'event' ? filteredExtraReportItems.reduce((s, i) => s + Math.abs(Number(i.amount_brl)), 0) : 0) -
                                                    (reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.discount_brl || 0), 0) : 0)
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {reportFilter === 'product' ? (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                                                <span className="text-sm font-black text-white uppercase tracking-widest">Ranking de Vendas por Produto</span>
                                                <span className="text-[10px] text-gray-500 uppercase font-black">{startDate} a {endDate}</span>
                                            </div>
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-white/5 bg-black/40">
                                                        <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Produto</th>
                                                        <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Categoria</th>
                                                        <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase">Quantidade</th>
                                                        <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase">Total Arrecadado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportByProduct().map(([name, data]) => (
                                                        <tr key={name} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons-outlined text-primary text-base">inventory_2</span>
                                                                    <span className="text-white font-bold">{name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black uppercase text-gray-400 border border-white/10">
                                                                    {data.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-white font-display font-black">{data.qty}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="text-primary font-display font-black">R$ {data.total.toFixed(2)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : Object.entries(reportBySection()).map(([section, data]) => (
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

                    {activeTab === 'launch' && (
                        <div className="p-8 max-w-5xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-neon-pink">
                                    <span className="material-icons-outlined text-primary text-3xl">add_shopping_cart</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Lançar Produtos</h3>
                                    <p className="text-gray-400 text-sm">Gerencie o catálogo de produtos e serviços da Chip Race.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Form */}
                                <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-3xl p-6 h-fit sticky top-0">
                                    <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                                        <span className="material-icons-outlined text-primary text-sm">plus_one</span>
                                        Novo Produto
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria</label>
                                            <select
                                                value={newProduct.category}
                                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                                            >
                                                <option value="torneio">Torneio (Buy-in, Rebuy)</option>
                                                <option value="cash">Cash Game (Buy-in, Time Chip)</option>
                                                <option value="bar">Bar & Gastronomia</option>
                                                <option value="produtos">Acessórios & Poker Gear</option>
                                                <option value="vestuario">Vestuário (Bonés, Camisas)</option>
                                                <option value="aluguel">Aluguel (Mesas, Equipamentos)</option>
                                                <option value="curso">Curso / Coach</option>
                                                <option value="online">Poker Online (Créditos)</option>
                                                <option value="bet">Bet & Quests</option>
                                                <option value="jackpot">Jackpot / Last Longer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome do Produto</label>
                                            <input
                                                type="text"
                                                value={newProduct.name}
                                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                                placeholder="Ex: Boné Chip Race Pro"
                                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Preço Sugerido (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newProduct.price}
                                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Descrição (Opcional)</label>
                                            <textarea
                                                value={newProduct.description}
                                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                                placeholder="Detalhes sobre o produto..."
                                                className="w-full h-24 bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none transition-all resize-none"
                                            ></textarea>
                                        </div>
                                        <button
                                            onClick={handleAddProduct}
                                            disabled={isLoading}
                                            className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                        >
                                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">cloud_upload</span> Cadastrar no Banco</>}
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="lg:col-span-7">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                                            <span className="material-icons-outlined text-primary text-sm">inventory_2</span>
                                            Catálogo Atual
                                        </h4>
                                        <select
                                            value={selectedCategory}
                                            onChange={e => setSelectedCategory(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-gray-400 uppercase font-black outline-none focus:border-primary"
                                        >
                                            <option value="all">Todas Categorias</option>
                                            <option value="torneio">Torneio</option>
                                            <option value="cash">Cash Game</option>
                                            <option value="bar">Bar</option>
                                            <option value="produtos">Produtos</option>
                                            <option value="vestuario">Vestuário</option>
                                            <option value="aluguel">Aluguel</option>
                                            <option value="curso">Curso</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        {allProducts
                                            .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
                                            .map(p => (
                                                <div key={p.id} className={`bg-black/20 border rounded-2xl p-4 flex items-center justify-between transition-all ${p.active ? 'border-white/5' : 'border-red-500/20 opacity-60 grayscale'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase ${p.category === 'torneio' ? 'bg-blue-500/20 text-blue-400' : p.category === 'cash' ? 'bg-green-500/20 text-green-400' : p.category === 'bar' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                            {p.category.substring(0, 3)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{p.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-500 uppercase font-black">{p.category}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                                <span className="text-[10px] text-primary font-black">R$ {Number(p.price || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => toggleProductStatus(p)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${p.active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500'}`}
                                                            title={p.active ? 'Desativar Produto' : 'Ativar Produto'}
                                                        >
                                                            <span className="material-icons-outlined text-base">{p.active ? 'visibility' : 'visibility_off'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteProduct(p.id)}
                                                            className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Excluir Permanentemente"
                                                        >
                                                            <span className="material-icons-outlined text-base">delete_forever</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'send-gifts' && (
                        <div className="p-8 max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-neon-pink">
                                    <span className="material-icons-outlined text-primary text-3xl">stars</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Prêmios & Honrarias</h3>
                                    <p className="text-gray-400 text-sm">Distribua créditos, fichas ou insígnias por mérito ou glória.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Configuration */}
                                <div className="space-y-6">
                                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                                            <span className="material-icons-outlined text-primary text-sm">settings</span>
                                            Configuração do Prêmio
                                        </h4>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Para quem?</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setGiftTarget('single')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'single' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                                        Usuários Específicos
                                                    </button>
                                                    <button onClick={() => setGiftTarget('all')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'all' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                                        TODOS os Usuários
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Tipo de Recompensa</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setGiftType('brl')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'brl' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                        Créditos (R$)
                                                    </button>
                                                    <button onClick={() => setGiftType('chipz')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'chipz' ? 'bg-cyan-500 border-cyan-500 text-white shadow-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                        Chipz
                                                    </button>
                                                    <button onClick={() => setGiftType('badge')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'badge' ? 'bg-yellow-500 border-yellow-500 text-white shadow-neon-yellow' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                        Insígnia
                                                    </button>
                                                </div>
                                            </div>

                                            {giftType === 'badge' ? (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Selecionar Insígnia</label>
                                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                        {badgeTemplates.map(b => (
                                                            <button
                                                                key={b.id}
                                                                onClick={() => setSelectedBadgeId(b.id)}
                                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedBadgeId === b.id ? 'bg-white/10 border-yellow-500/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                                            >
                                                                <span className="material-icons text-xl text-yellow-400">{b.icon || 'stars'}</span>
                                                                <span className="text-[10px] font-black text-white uppercase truncate w-full text-center">{b.title}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Quantidade</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">{giftType === 'brl' ? 'R$' : 'C'}</span>
                                                        <input type="number" value={giftAmount} onChange={e => setGiftAmount(e.target.value)} placeholder="0.00"
                                                            className="w-full bg-[#050214] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-black focus:border-primary outline-none transition-all" />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Justificativa / Motivo</label>
                                                <input type="text" value={giftDescription} onChange={e => setGiftDescription(e.target.value)} placeholder={giftType === 'badge' ? 'Ex: Membro Honorário por serviços prestados...' : 'Ex: Presente de Natal, Bônus VIP...'}
                                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />
                                            </div>

                                            <button onClick={handleSendGifts} disabled={isLoading || (giftType !== 'badge' && !giftAmount) || (giftType === 'badge' && !selectedBadgeId)} className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
                                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">verified</span> Confirmar Recompensas</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* User Selection */}
                                <div className={`space-y-6 transition-all ${giftTarget === 'all' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                                            <span className="material-icons-outlined text-primary text-sm">person_search</span>
                                            Selecionar Destinatários ({selectedGiftUsers.length})
                                        </h4>

                                        <div className="relative mb-6">
                                            <input type="text" value={giftSearchQuery} onChange={e => handleGiftSearch(e.target.value)} placeholder="Buscar por Nome ou CR#"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all" />
                                            {giftSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
                                                    {giftSearchResults.map(u => {
                                                        const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                                        return (
                                                            <button
                                                                key={u.id}
                                                                onClick={() => {
                                                                    if (!selectedGiftUsers.find(x => x.id === u.id)) setSelectedGiftUsers([...selectedGiftUsers, u]);
                                                                    setGiftSearchQuery(''); setGiftSearchResults([]);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 ${alreadyHasBadge ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                                                    <div>
                                                                        <p className="text-xs font-bold text-white">{u.name}</p>
                                                                        <p className="text-[10px] text-primary font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                                    </div>
                                                                </div>
                                                                {alreadyHasBadge && (
                                                                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                                                        <span className="material-icons text-xs">info</span>
                                                                        <span className="text-[9px] font-black uppercase">Já possui</span>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {selectedGiftUsers.length === 0 ? (
                                                <div className="text-center py-8 text-gray-600 border border-dashed border-white/5 rounded-2xl">
                                                    <p className="text-xs italic">Nenhum usuário selecionado.</p>
                                                </div>
                                            ) : selectedGiftUsers.map(u => {
                                                const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                                return (
                                                    <div key={u.id} className={`bg-white/5 border rounded-xl p-3 flex items-center justify-between transition-all ${alreadyHasBadge ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-bold text-white">{u.name}</p>
                                                                    {alreadyHasBadge && (
                                                                        <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase animate-pulse">Aviso</span>
                                                                    )}
                                                                </div>
                                                                {alreadyHasBadge ? (
                                                                    <p className="text-[9px] text-yellow-500/80 font-bold italic mt-0.5">⚠️ Este jogador já possui a insígnia selecionada.</p>
                                                                ) : (
                                                                    <p className="text-[10px] text-gray-500">Saldo: R$ {Number(u.balance_brl || 0).toFixed(2)} · {u.balance_chipz || 0} Chipz</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setSelectedGiftUsers(selectedGiftUsers.filter(x => x.id !== u.id))} className="text-gray-500 hover:text-red-500 transition-colors">
                                                            <span className="material-icons-outlined text-base">remove_circle_outline</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'debts' && (
                        <div className="p-8 max-w-5xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-neon-red">
                                        <span className="material-icons-outlined text-red-500 text-3xl">receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Pendências (Pendura)</h3>
                                        <p className="text-gray-400 text-sm">Gerenciamento de débitos pendentes dos jogadores.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Pendurado</p>
                                        <p className="text-2xl font-display font-black text-red-500">R$ {totalActiveDebt.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowNewDebtForm(!showNewDebtForm)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${showNewDebtForm ? 'bg-white text-black' : 'bg-red-600 text-white shadow-neon-red'}`}
                                    >
                                        <span className="material-icons-outlined text-sm">{showNewDebtForm ? 'close' : 'add_circle'}</span>
                                        {showNewDebtForm ? 'Cancelar' : 'Novo Registro'}
                                    </button>
                                </div>
                            </div>

                            {showNewDebtForm && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                                        <span className="material-icons-outlined text-red-500">person_add</span>
                                        Registrar Novo Débito Manual
                                    </h4>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">1. Procurar Jogador</label>
                                                <div className="relative">
                                                    <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                                                    <input
                                                        type="text"
                                                        value={debtSearchQuery}
                                                        onChange={e => handleDebtSearch(e.target.value)}
                                                        placeholder="Nome ou CR#..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-all"
                                                    />
                                                </div>

                                                {debtSearchResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-red-500/30 rounded-xl overflow-hidden shadow-2xl z-20">
                                                        {debtSearchResults.map(u => (
                                                            <button
                                                                key={u.id}
                                                                onClick={() => {
                                                                    setNewDebtData({ ...newDebtData, userId: u.id });
                                                                    setDebtSearchQuery(u.name);
                                                                    setDebtSearchResults([]);
                                                                }}
                                                                className={`w-full flex items-center gap-3 p-3 text-left border-b border-white/5 last:border-0 transition-colors ${newDebtData.userId === u.id ? 'bg-red-500/20' : 'hover:bg-white/5'}`}
                                                            >
                                                                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                                                <div>
                                                                    <p className="text-xs font-bold text-white">{u.name}</p>
                                                                    <p className="text-[10px] text-red-400 font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">2. Evento Correspondente</label>
                                                <select
                                                    value={newDebtData.eventId}
                                                    onChange={e => setNewDebtData({ ...newDebtData, eventId: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-all"
                                                >
                                                    <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                                                    <option value="online_credit" style={{ backgroundColor: '#0a0720' }}>Crédito Online</option>
                                                    {events.map(ev => <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>{ev.title} ({new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')})</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">3. Valor do Débito (R$)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        value={newDebtData.amount}
                                                        onChange={e => setNewDebtData({ ...newDebtData, amount: e.target.value })}
                                                        placeholder="0,00"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-black text-lg focus:border-red-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">4. Motivo / Descrição</label>
                                                <input
                                                    type="text"
                                                    value={newDebtData.description}
                                                    onChange={e => setNewDebtData({ ...newDebtData, description: e.target.value })}
                                                    placeholder="Ex: Compra de fichas não paga..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleRegisterDebt}
                                            disabled={isLoading || !newDebtData.userId || !newDebtData.amount || !newDebtData.eventId}
                                            className="bg-red-600 hover:bg-white hover:text-black text-white font-black py-4 px-10 rounded-2xl transition-all shadow-neon-red uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-30"
                                        >
                                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">save</span> Salvar Pendência</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden">
                                <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">filter_alt</span>
                                        <input
                                            type="text"
                                            placeholder="Filtrar pendências existentes..."
                                            value={debtFilter}
                                            onChange={(e) => setDebtFilter(e.target.value)}
                                            className="w-full bg-[#050214] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <button onClick={fetchDebts} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                                        <span className="material-icons-outlined text-sm">refresh</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-black/40 text-gray-500 uppercase font-black tracking-wider">
                                                <th className="text-left px-6 py-5">Jogador</th>
                                                <th className="text-left px-6 py-5">Evento / Data</th>
                                                <th className="text-center px-6 py-5">Valor Devido</th>
                                                <th className="text-right px-6 py-5">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {activeDebts.filter(d =>
                                                (d.profiles?.name || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                (d.events?.title || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                (d.description || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                String(d.profiles?.numeric_id || '').includes(debtFilter)
                                            ).length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-600 italic">
                                                        {debtFilter ? 'Nenhum resultado para o filtro.' : 'Nenhuma pendência encontrada.'}
                                                    </td>
                                                </tr>
                                            ) : activeDebts.filter(d =>
                                                (d.profiles?.name || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                (d.events?.title || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                (d.description || '').toLowerCase().includes(debtFilter.toLowerCase()) ||
                                                String(d.profiles?.numeric_id || '').includes(debtFilter)
                                            ).map(debt => (
                                                <tr key={debt.id} className="hover:bg-white/5 transition-colors group/row">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <img src={debt.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${debt.profiles?.name}&background=random`} className="w-10 h-10 rounded-full border border-white/10 shadow-lg" alt="" />
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#050214] rounded-full"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm tracking-tight">{debt.profiles?.name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">CR#{String(debt.profiles?.numeric_id).padStart(3, '0')}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                                    <span className="text-[10px] text-green-400 font-black">💵 R$ {Number(debt.profiles?.balance_brl || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-gray-300 font-bold">{debt.events?.title || (debt.description === 'Crédito Online' ? 'Crédito Online' : 'Lançamento Manual')}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-black">{new Date(debt.created_at).toLocaleString('pt-BR')}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-red-500 font-display font-black text-lg">R$ {Number(debt.amount_brl).toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-80 group-hover/row:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleSettleDebt(debt, 'balance')}
                                                                disabled={isLoading || Number(debt.profiles?.balance_brl || 0) < Number(debt.amount_brl)}
                                                                className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-black uppercase rounded-xl hover:bg-green-500 hover:text-white transition-all disabled:opacity-20 disabled:grayscale"
                                                            >
                                                                Quitar c/ Saldo
                                                            </button>
                                                            <button
                                                                onClick={() => handleSettleDebt(debt, 'manual')}
                                                                disabled={isLoading}
                                                                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black uppercase rounded-xl hover:bg-white/20 hover:text-white transition-all"
                                                            >
                                                                Baixa Manual
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'communications' && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-neon-pink">
                                    <span className="material-icons-outlined text-primary text-3xl">campaign</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Comunicação Admin</h3>
                                    <p className="text-gray-400 text-sm">Envie comunicados globais ou crie enquetes para toda a comunidade.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                                    <h3 className="text-xl font-display font-black text-white mb-6 flex items-center gap-3">
                                        <span className="material-icons-outlined text-primary">send</span>
                                        Comunicado Global
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Assunto</label>
                                            <input
                                                className="w-full bg-[#050214] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary transition-all text-sm font-bold"
                                                placeholder="Ex: Novo Torneio High Roller Adicionado!"
                                                value={adminSubject}
                                                onChange={e => setAdminSubject(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Mensagem</label>
                                            <textarea
                                                className="w-full bg-[#050214] border border-white/10 rounded-2xl p-4 text-white h-40 outline-none focus:border-primary transition-all resize-none text-sm leading-relaxed"
                                                placeholder="Escreva aqui o conteúdo que todos os jogadores irão receber..."
                                                value={adminMsgContent}
                                                onChange={e => setAdminMsgContent(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-1.5 block">Categoria</label>
                                                <select
                                                    className="w-full bg-[#050214] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-primary text-sm font-bold"
                                                    value={adminMsgCategory}
                                                    onChange={e => setAdminMsgCategory(e.target.value as any)}
                                                >
                                                    <option value="admin">📣 Admin (Geral)</option>
                                                    <option value="system">⚙️ Sistema (Importante)</option>
                                                    <option value="tournament">🏆 Torneio (Eventos)</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end flex-1">
                                                <button
                                                    onClick={handleSendBroadcast}
                                                    disabled={!adminSubject || !adminMsgContent}
                                                    className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-3.5 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-[10px] disabled:opacity-30 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-icons-outlined text-sm">rocket_launch</span>
                                                    Disparar Agora
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
                                    <h3 className="text-xl font-display font-black text-white mb-6 flex items-center gap-3">
                                        <span className="material-icons-outlined text-secondary">poll</span>
                                        Nova Enquete
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Pergunta</label>
                                            <input
                                                className="w-full bg-[#050214] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-secondary transition-all text-sm font-bold"
                                                placeholder="Qual a pergunta?"
                                                value={pollQuestion}
                                                onChange={e => setPollQuestion(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 block mb-1.5">Opções de Resposta</label>
                                            <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                                {pollOptions.map((opt, i) => (
                                                    <div key={i} className="relative group/opt">
                                                        <input
                                                            className="w-full bg-[#050214] border border-white/10 rounded-2xl p-4 pr-10 text-xs text-white outline-none focus:border-secondary transition-all font-bold placeholder:font-normal placeholder:opacity-30"
                                                            placeholder={`Opção ${i + 1}`}
                                                            value={opt}
                                                            onChange={e => handleUpdatePollOption(i, e.target.value)}
                                                        />
                                                        {pollOptions.length > 2 && (
                                                            <button
                                                                onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                            >
                                                                <span className="material-icons-outlined text-sm">remove_circle_outline</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={handleAddPollOption} className="w-full bg-white/5 border border-white/5 hover:border-secondary/30 rounded-2xl py-3 text-secondary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                                    <span className="material-icons-outlined text-sm">add</span> Adicionar Opção
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreatePollSubmit}
                                            disabled={!pollQuestion || pollOptions.filter(o => o.trim()).length < 2}
                                            className="w-full bg-secondary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-blue-light uppercase tracking-widest text-[10px] disabled:opacity-30 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-outlined text-sm">public</span>
                                            Publicar Enquete
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                        <span className="text-[10px] text-green-400 font-black">💵 R$ {Number(selectedCommand.profiles?.balance_brl || 0).toFixed(2)}</span>
                                    </div>
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
                                    const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                    const rawName = item.products?.name || item.notes || 'Item';
                                    const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                    return (
                                        <div key={item.id || i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">{time}</span>
                                                <span className="text-xs text-gray-300 truncate">{cleanName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white font-bold whitespace-nowrap">{Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}</span>
                                                <button
                                                    onClick={() => handleDeleteCommandItem(item)}
                                                    className="text-gray-600 hover:text-red-500 transition-colors p-1"
                                                    title="Remover Item"
                                                >
                                                    <span className="material-icons-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-5 flex-shrink-0 border-t border-white/10">
                            <div className="flex items-center justify-between mb-2 pt-2 border-t border-white/5">
                                <span className="text-sm text-white font-black uppercase">Faturamento Líquido</span>
                                <span className="text-lg font-display font-black text-green-400">R$ {Math.max(0, Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0) - (parseFloat(checkoutDebt) || 0)).toFixed(2)}</span>
                            </div>
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] text-green-400 uppercase font-black">Adicionar Desconto (R$)</span>
                                    <input
                                        type="number"
                                        value={checkoutDiscount}
                                        onChange={e => setCheckoutDiscount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-green-400"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] text-red-500 uppercase font-black">Colocar na Pendura (R$)</span>
                                    <input
                                        type="number"
                                        value={checkoutDebt}
                                        onChange={e => setCheckoutDebt(e.target.value)}
                                        placeholder="0.00"
                                        className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-4 pt-2 border-t border-white/5 bg-primary/5 -mx-5 px-5 py-2">
                                <div>
                                    <p className="text-[10px] text-white font-black uppercase">Saldo a cobrar</p>
                                    <p className="text-[8px] text-gray-400 uppercase">Limite: R$ {Number(selectedCommand.profiles?.debt_limit_brl || 0).toFixed(2)}</p>
                                </div>
                                <span className="text-xl font-display font-black text-primary">R$ {Math.max(0, Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0) - (parseFloat(checkoutDebt) || 0)).toFixed(2)}</span>
                            </div>
                            <div className="space-y-2">
                                <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">payments</span>Confirmar e Cobrar</>}
                                </button>
                                <button onClick={() => setShowCheckout(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Voltar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Checkout Modal */}
            {confirmingCheckout && selectedCommand && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200">
                        <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-outlined text-primary text-4xl">help_outline</span>
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase mb-2">Confirmar Encerramento?</h3>
                        <div className="text-gray-400 text-sm mb-6 leading-relaxed space-y-2">
                            <p>Total Final: <span className="text-white font-bold">R$ {(Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0)).toFixed(2)}</span></p>
                            {parseFloat(checkoutDebt) > 0 && <p className="text-red-400 font-bold">Pendura: R$ {parseFloat(checkoutDebt).toFixed(2)}</p>}
                            <p className="bg-white/5 p-2 rounded-lg">
                                Valor a ser debitado do saldo: <br />
                                <span className="text-primary font-black text-lg">R$ {Math.max(0, Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0) - (parseFloat(checkoutDebt) || 0)).toFixed(2)}</span>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2">
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>SIM, DEBITAR E FECHAR</>}
                            </button>
                            <button onClick={() => setConfirmingCheckout(false)} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
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

            {/* Confirmation Top-Up Modal */}
            {confirmingTopUp && selectedCommand && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-outlined text-green-400 text-4xl">account_balance_wallet</span>
                        </div>
                        <h3 className="text-xl font-display font-black text-white uppercase mb-2">Confirmar Pagamento?</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Você confirma que recebeu <span className="text-green-400 font-bold">R$ {Number(topUpAmount).toFixed(2)}</span> em espécie do usuário <span className="text-white font-bold">{selectedCommand.profiles?.name}</span>?
                        </p>
                        <div className="space-y-3">
                            <button onClick={handleTopUp} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>DAR BAIXA E ADD SALDO</>}
                            </button>
                            <button onClick={() => { setConfirmingTopUp(false); setIsLoading(false); }} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
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
                                        const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                        const rawName = item.products?.name || item.notes?.split(' —')[0] || 'Item';
                                        const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                        const detail = item.notes?.includes('—') ? item.notes.split('— ')[1].replace(/\(Lançado às \d{2}:\d{2}\)/, '').trim() : null;
                                        const price = Number(item.total_price_brl);
                                        return (
                                            <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <span className="text-xs text-gray-500 font-mono flex-shrink-0">{time}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-bold truncate">{cleanName}</p>
                                                        {detail && <p className="text-[10px] text-gray-500 truncate">{detail}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-black whitespace-nowrap ${price === 0 ? 'text-green-400' : 'text-white'}`}>
                                                        {price === 0 ? 'GRÁTIS' : `R$ ${price.toFixed(2)}`}
                                                    </span>
                                                    {viewingClosedCommand.status === 'open' && (
                                                        <button
                                                            onClick={() => handleDeleteCommandItem(item)}
                                                            className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                                                            title="Excluir Lançamento Errado"
                                                        >
                                                            <span className="material-icons-outlined text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </div>
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
