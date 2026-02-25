import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import { PlayerName } from './PlayerName';
import { ReportsTab } from './admin-panel/ReportsTab';
import { GiftsTab } from './admin-panel/GiftsTab';
import { DebtsTab } from './admin-panel/DebtsTab';
import { CommunicationsTab } from './admin-panel/CommunicationsTab';
import { OperationalTab } from './admin-panel/OperationalTab';
import { InventoryTab } from './admin-panel/InventoryTab';
import { CheckoutModal } from './admin-panel/modals/CheckoutModal';
import { TopUpModal } from './admin-panel/modals/TopUpModal';
import { EditClosedCommandModal } from './admin-panel/modals/EditClosedCommandModal';
import { ViewCommandItemsModal } from './admin-panel/modals/ViewCommandItemsModal';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
    onUpdateProfile?: (id: string, stats: any) => void;
    badgeTemplates?: any[];
    onCreateBadgeTemplate?: (badge: any) => Promise<void>;
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser, isAdmin = false, onUpdateProfile, badgeTemplates = [], onCreateBadgeTemplate, onSendAdminMessage, onCreatePoll }) => {
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
    const [productSection, setProductSection] = useState<'bar' | 'torneio' | 'opcionais' | 'cash'>('bar');
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
    const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', description: '', price_unit: '' });
    const [allProducts, setAllProducts] = useState<any[]>([]); // Includes inactive
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [productCategories, setProductCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState({ name: '', label: '', icon: 'inventory_2' });

    // Gift Tab State
    const [giftTarget, setGiftTarget] = useState<'single' | 'all'>('single');
    const [selectedGiftUsers, setSelectedGiftUsers] = useState<any[]>([]);
    const [giftType, setGiftType] = useState<'brl' | 'chipz' | 'badge'>('brl');
    const [giftAmount, setGiftAmount] = useState('');
    const [giftSearchQuery, setGiftSearchQuery] = useState('');
    const [giftDescription, setGiftDescription] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState('');
    const [giftSearchResults, setGiftSearchResults] = useState<any[]>([]);
    const [staffExpenses, setStaffExpenses] = useState('');
    const [prizePayout, setPrizePayout] = useState('');
    const [checkoutDiscount, setCheckoutDiscount] = useState('');
    const [confirmingCheckout, setConfirmingCheckout] = useState(false);
    const [confirmingTopUp, setConfirmingTopUp] = useState(false);
    const [checkoutDebt, setCheckoutDebt] = useState('');
    const [checkoutChips, setCheckoutChips] = useState('');
    const [checkoutCashOut, setCheckoutCashOut] = useState('');
    const [checkoutProfitCash, setCheckoutProfitCash] = useState('');
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

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEventsList = events.filter(ev => ev.date >= todayStr && ev.status !== 'closed').sort((a, b) => a.date.localeCompare(b.date));
    const pastEventsList = events.filter(ev => ev.date < todayStr || ev.status === 'closed').sort((a, b) => b.date.localeCompare(a.date));


    const updatePlayerBalanceLocally = (userId: string, amount: number, type: 'brl' | 'chipz' = 'brl') => {
        const field = type === 'brl' ? 'balance_brl' : 'balance_chipz';
        const propField = type === 'brl' ? 'balanceBrl' : 'balanceChipz';

        // Update selectedCommand if matches
        if (selectedCommand && selectedCommand.user_id === userId) {
            setSelectedCommand((prev: any) => {
                if (!prev) return null;
                const profiles = prev.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...prev,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...prev,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
                    }
                };
            });
        }

        setOpenCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                const profiles = cmd.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...cmd,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...cmd,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
                    }
                };
            }
            return cmd;
        }));

        setClosedCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                const profiles = cmd.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...cmd,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...cmd,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
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
            onUpdateProfile(userId, { [propField]: (Number(currentUser[propField]) || 0) + amount });
        }
    };

    const updatePlayerDebtLocally = (userId: string, amount: number) => {
        const field = 'total_pending_debt';

        // Update selectedCommand if matches
        if (selectedCommand && selectedCommand.user_id === userId) {
            setSelectedCommand((prev: any) => {
                if (!prev) return null;
                const profiles = prev.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...prev,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...prev,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
                    }
                };
            });
        }

        setOpenCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                const profiles = cmd.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...cmd,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...cmd,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
                    }
                };
            }
            return cmd;
        }));

        setClosedCommands(prev => prev.map(cmd => {
            if (cmd.user_id === userId) {
                const profiles = cmd.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...cmd,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...cmd,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
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

        // Update searchResults for gifts and debts
        setGiftSearchResults(prev => prev.map(p => {
            if (p.id === userId) {
                return {
                    ...p,
                    [field]: (Number(p[field]) || 0) + amount
                };
            }
            return p;
        }));

        setDebtSearchResults(prev => prev.map(p => {
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
            onUpdateProfile(userId, { totalPendingDebt: (Number(currentUser.totalPendingDebt) || 0) + amount });
        }
    };

    useEffect(() => { fetchEvents(); fetchProducts(); fetchAllProducts(); fetchDebts(); fetchProductCategories(); }, []);
    useEffect(() => {
        if (activeTab === 'debts') fetchDebts();
    }, [activeTab]);
    useEffect(() => {
        if (selectedEvent) {
            fetchOpenCommands(selectedEvent.id);
            fetchClosedCommands(selectedEvent.id);
            setStaffExpenses(selectedEvent.staff_expenses_brl?.toString() || '0');
            setPrizePayout(selectedEvent.prize_payout_brl?.toString() || '0');
        }
        else {
            setOpenCommands([]);
            setClosedCommands([]);
            setStaffExpenses('');
            setPrizePayout('');
        }
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
    const fetchProductCategories = async () => {
        const { data } = await supabase.from('ecosystem_categories').select('*').order('order', { ascending: true });
        if (data) {
            // Map table fields to frontend 'name/label' used by InventoryTab/OperationalTab
            setProductCategories(data.map(c => ({
                id: c.id,
                name: c.id, // Using id as the internal name
                label: c.title,
                icon: c.icon,
                active: true
            })));
        }
    };
    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.label) { alert('Nome e Rótulo são obrigatórios.'); return; }
        setIsLoading(true);
        try {
            const id = newCategory.name.toLowerCase().replace(/\s+/g, '_');
            const { error } = await supabase.from('ecosystem_categories').insert({
                id,
                title: newCategory.label,
                icon: newCategory.icon,
                color: 'primary', // Default color
                order: productCategories.length + 1
            });
            if (error) throw error;
            alert('✅ Categoria criada com sucesso!');
            setNewCategory({ name: '', label: '', icon: 'inventory_2' });
            fetchProductCategories();
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
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
                price_unit: newProduct.price_unit,
                active: true
            });
            if (error) throw error;
            alert('✅ Produto lançado com sucesso!');
            setNewProduct({ name: '', category: 'bar', price: '', description: '', price_unit: '' });
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

    const handleSaveExpenses = async () => {
        if (!selectedEvent) return;
        setIsLoading(true);
        try {
            const expensesVal = parseFloat(staffExpenses) || 0;
            const prizeVal = parseFloat(prizePayout) || 0;

            const { error } = await supabase.from('events').update({
                staff_expenses_brl: expensesVal,
                prize_payout_brl: prizeVal
            }).eq('id', selectedEvent.id);

            if (error) throw error;

            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? {
                ...e,
                staff_expenses_brl: expensesVal,
                prize_payout_brl: prizeVal
            } : e));

            setSelectedEvent((prev: any) => ({
                ...prev,
                staff_expenses_brl: expensesVal,
                prize_payout_brl: prizeVal
            }));

            alert('✅ Despesas do evento salvas com sucesso!');
        } catch (err: any) {
            alert('Erro ao salvar despesas: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalizeEvent = async () => {
        if (!selectedEvent) return;
        if (openCommands.length > 0) {
            if (!window.confirm(`⚠️ Existem ${openCommands.length} comandas ainda ABERTAS. Tem certeza que deseja finalizar o evento e fechar o dia mesmo assim?`)) return;
        } else {
            if (!window.confirm(`Confirmar o encerramento oficial do evento "${selectedEvent.title}"? Isso consolidará os dados para relatórios.`)) return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('events').update({ status: 'closed' }).eq('id', selectedEvent.id);
            if (error) throw error;

            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: 'closed' } : e));
            setSelectedEvent((prev: any) => prev ? ({ ...prev, status: 'closed' }) : null);
            alert('✅ Evento FINALIZADO com sucesso! O dia foi encerrado.');
        } catch (err: any) {
            alert('Erro ao finalizar evento: ' + err.message);
        } finally {
            setIsLoading(false);
        }
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
        const total = Number(cmd.total_brl);
        const discount = Number(cmd.discount_brl || 0);
        const debt = Number(cmd.unpaid_amount_brl || 0);
        const chips = Number(cmd.chips_payment_brl || 0);
        const refundedAmount = Math.max(0, total - discount - debt - chips);

        if (!window.confirm(`Reabrir comanda de ${cmd.profiles?.name}? O valor pago de R$ ${refundedAmount.toFixed(2)} será reembolsado ao saldo.`)) return;

        if (refundedAmount > 0) {
            const { error } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: cmd.user_id,
                p_brl_amount: refundedAmount,
                p_chipz_amount: 0,
                p_description: `Reembolso por reabertura de comanda ${cmd.id.slice(0, 8)}`,
                p_category: 'wallet_deposit',
                p_metadata: { command_id: cmd.id, event_id: cmd.event_id }
            });
            if (error) { alert('Erro ao reembolsar saldo: ' + error.message); return; }
        }

        // Delete associated pending debt if exists
        if (debt > 0) {
            await supabase.from('debts').delete().eq('command_id', cmd.id).eq('status', 'pending');
        }

        const { error: upErr } = await supabase.from('commands').update({
            status: 'open',
            closed_at: null,
            discount_brl: 0,
            unpaid_amount_brl: 0,
            chips_payment_brl: 0
        }).eq('id', cmd.id);

        if (upErr) { alert('Erro ao reabrir: ' + upErr.message); return; }
        await supabase.from('messages').insert({ user_id: cmd.user_id, sender_id: currentUser.id, content: `Sua comanda foi reaberta pelo admin. R$ ${refundedAmount.toFixed(2)} reembolsados ao saldo.`, category: 'system', is_read: false });
        if (selectedEvent) { fetchOpenCommands(selectedEvent.id); fetchClosedCommands(selectedEvent.id); }
        updatePlayerBalanceLocally(cmd.user_id, refundedAmount); // Refund balance locally
        setSelectedCommand({ ...cmd, status: 'open', closed_at: null, discount_brl: 0, unpaid_amount_brl: 0, chips_payment_brl: 0 });
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
            const debtAmount = parseFloat(newDebtData.amount);

            const { error } = await supabase.from('debts').insert({
                user_id: newDebtData.userId,
                event_id: isOnline ? null : newDebtData.eventId,
                amount_brl: debtAmount,
                description: newDebtData.description || (isOnline ? 'Crédito Online' : ''),
                status: 'pending'
            });
            if (error) throw error;

            // Trigger will handle total_pending_debt update in database
            updatePlayerDebtLocally(newDebtData.userId, debtAmount);

            await supabase.from('messages').insert({
                user_id: newDebtData.userId,
                sender: 'Sistema',
                sender_id: currentUser.id,
                content: `Um novo débito de R$ ${debtAmount.toFixed(2)} foi registrado administrativamente.`,
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
            notes: product.price_unit ? `Cobrança: ${product.price_unit}` : null,
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

    const handleAddManualOnline = async () => {
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
                notes: `Fichas Online — Compra Manual`,
                created_by: currentUser.id
            });
            if (error) throw error;

            const newTotal = Number(selectedCommand.total_brl) + amount;
            await supabase.from('commands').update({ total_brl: newTotal }).eq('id', selectedCommand.id);

            const upd = openCommands.map(c => c.id === selectedCommand.id ? { ...c, total_brl: newTotal } : c);
            setOpenCommands(upd);
            setSelectedCommand({ ...selectedCommand, total_brl: newTotal });
            fetchCommandItems(selectedCommand.id);

            showToast('Fichas Online', amount);
            setCashAmount('');
        } catch (err: any) {
            alert('Erro ao lançar fichas online: ' + err.message);
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
        const chips = parseFloat(checkoutChips) || 0;
        const cashOut = parseFloat(checkoutCashOut) || 0;
        const profitCashRaw = parseFloat(checkoutProfitCash) || 0;

        // Net cost = total - discount - debt - chips
        const netCost = total - discount - debt - chips;
        // Full profit if cashOut is provided
        const profit = cashOut > 0 ? cashOut - Math.max(0, netCost) : 0;
        const hasProfit = profit > 0;
        // Cash paid in hands, credit goes to app balance
        const profitCash = Math.min(profitCashRaw, profit);   // physically paid
        const profitCredit = Math.max(0, profit - profitCash); // credited to balance
        // Normal deduction when no profit
        const finalToDeduct = cashOut > 0 ? Math.max(0, netCost - cashOut) : Math.max(0, netCost);

        if (!confirmingCheckout) {
            const profile = Array.isArray(selectedCommand.profiles) ? selectedCommand.profiles[0] : selectedCommand.profiles;
            const currentDebt = Number(profile?.total_pending_debt || profile?.totalPendingDebt || 0);
            const limit = Number(profile?.debt_limit_brl || profile?.debtLimitBrl || 0);

            if (debt > 0 && limit > 0 && (currentDebt + debt) > limit) {
                alert(`Limite de pendura excedido! \nLimite: R$ ${limit.toFixed(2)}\nPendência atual: R$ ${currentDebt.toFixed(2)}\nTentativa: R$ ${debt.toFixed(2)}`);
                return;
            }

            // Only check balance if there's a net deduction needed
            if (!hasProfit && finalToDeduct > 0 && Number(selectedCommand.profiles?.balance_brl || 0) < finalToDeduct) {
                alert('Saldo insuficiente para cobrir o restante da comanda!');
                return;
            }

            setConfirmingCheckout(true);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Record debt if any
            if (debt > 0) {
                const { error: debtErr } = await supabase.from('debts').insert({
                    user_id: selectedCommand.user_id,
                    command_id: selectedCommand.id,
                    event_id: selectedCommand.event_id,
                    amount_brl: debt,
                    status: 'pending'
                });
                if (debtErr) throw debtErr;

                // Trigger will handle total_pending_debt update in database
                updatePlayerDebtLocally(selectedCommand.user_id, debt);
            }

            // 2a. If player PROFITED: credit them (only the credit portion, not cash-in-hands)
            if (hasProfit) {
                if (profitCredit > 0) {
                    const { error: creditErr } = await supabase.rpc('secure_balance_transaction', {
                        p_user_id: selectedCommand.user_id,
                        p_brl_amount: profitCredit,
                        p_chipz_amount: 0,
                        p_description: `Lucro Cash Game — Comanda encerrada${profitCash > 0 ? ` (R$ ${profitCash.toFixed(2)} pago em mãos)` : ''}`,
                        p_category: 'wallet_deposit',
                        p_metadata: { command_id: selectedCommand.id, event_id: selectedCommand.event_id, profit_total: profit, cash_payment: profitCash }
                    });
                    if (creditErr) throw creditErr;
                    updatePlayerBalanceLocally(selectedCommand.user_id, profitCredit);
                }
            }
            // 2b. Normal deduction from balance
            else if (finalToDeduct > 0) {
                const { error: deductErr } = await supabase.rpc('secure_balance_transaction', {
                    p_user_id: selectedCommand.user_id,
                    p_brl_amount: -finalToDeduct,
                    p_chipz_amount: 0,
                    p_description: `Pagamento de comanda ${selectedCommand.id.slice(0, 8)}`,
                    p_category: 'purchase',
                    p_metadata: { command_id: selectedCommand.id, event_id: selectedCommand.event_id, total_consumo: total }
                });
                if (deductErr) throw deductErr;
                updatePlayerBalanceLocally(selectedCommand.user_id, -finalToDeduct);
            }

            // 3. Close the command (store cashOut for records)
            await supabase.from('commands').update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                discount_brl: discount,
                unpaid_amount_brl: debt,
                chips_payment_brl: chips
            }).eq('id', selectedCommand.id);

            // 4. Notify user
            const msgParts = [
                `Sua comanda foi encerrada. Total consumido: R$ ${total.toFixed(2)}.`,
                discount > 0 ? `Desconto: R$ ${discount.toFixed(2)}.` : '',
                debt > 0 ? `Pendura: R$ ${debt.toFixed(2)}.` : '',
                chips > 0 ? `Pago em fichas: R$ ${chips.toFixed(2)}.` : '',
                cashOut > 0 ? `Cash Out: R$ ${cashOut.toFixed(2)}.` : '',
                hasProfit
                    ? [
                        `🏆 Lucro de R$ ${profit.toFixed(2)}:`,
                        profitCash > 0 ? `R$ ${profitCash.toFixed(2)} pago em mãos.` : '',
                        profitCredit > 0 ? `R$ ${profitCredit.toFixed(2)} creditado no saldo do app.` : ''
                    ].filter(Boolean).join(' ')
                    : finalToDeduct > 0 ? `R$ ${finalToDeduct.toFixed(2)} descontado do saldo.` : ''
            ].filter(Boolean).join(' ');

            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id,
                sender_id: currentUser.id,
                content: msgParts,
                category: 'system',
                is_read: false
            });

            // 5. Update UI
            setOpenCommands(openCommands.filter(c => c.id !== selectedCommand.id));
            if (selectedEvent) fetchClosedCommands(selectedEvent.id);
            fetchDebts();

            setSelectedCommand(null);
            setShowCheckout(false);
            setCommandItems([]);
            setCheckoutDiscount('');
            setCheckoutDebt('');
            setCheckoutChips('');
            setCheckoutCashOut('');
            setCheckoutProfitCash('');
            setConfirmingCheckout(false);
        } catch (err: any) {
            alert('Erro ao fechar comanda: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettleDebt = async (debt: any, type: 'balance' | 'manual', amount?: number) => {
        if (!isAdmin) return;
        const fullAmount = Number(debt.amount_brl);
        const payAmount = amount ?? fullAmount;
        const isPartial = payAmount < fullAmount;

        if (payAmount <= 0 || payAmount > fullAmount) {
            alert('Valor inválido para pagamento.');
            return;
        }

        if (!window.confirm(
            `Confirmar baixa ${isPartial ? 'PARCIAL ' : ''}${type === 'balance' ? 'via SALDO' : 'MANUAL'} de R$ ${payAmount.toFixed(2)}${isPartial ? ` (R$ ${(fullAmount - payAmount).toFixed(2)} continua em aberto)` : ''} p/ ${debt.profiles?.name}?`
        )) return;

        setIsLoading(true);
        try {
            // Deduct from balance if paying via balance
            if (type === 'balance') {
                const { error: deductErr } = await supabase.rpc('secure_balance_transaction', {
                    p_user_id: debt.user_id,
                    p_brl_amount: -payAmount,
                    p_chipz_amount: 0,
                    p_description: `Baixa de pendura (Comanda ${debt.command_id?.slice(0, 8)})`,
                    p_category: 'purchase',
                    p_metadata: { debt_id: debt.id, command_id: debt.command_id }
                });
                if (deductErr) throw deductErr;
                updatePlayerBalanceLocally(debt.user_id, -payAmount);
            }

            if (isPartial) {
                // Partial: reduce the debt amount, keep pending
                const remaining = fullAmount - payAmount;
                const { error: updateErr } = await supabase.from('debts').update({
                    amount_brl: remaining
                }).eq('id', debt.id);
                if (updateErr) throw updateErr;
            } else {
                // Full: mark as paid
                const { error: updateErr } = await supabase.from('debts').update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                }).eq('id', debt.id);
                if (updateErr) throw updateErr;
            }

            // Trigger will handle total_pending_debt update in database
            updatePlayerDebtLocally(debt.user_id, -payAmount);

            await supabase.from('messages').insert({
                user_id: debt.user_id,
                sender_id: currentUser.id,
                content: isPartial
                    ? `Pagamento parcial de R$ ${payAmount.toFixed(2)} registrado. Saldo devedor atualizado para R$ ${(fullAmount - payAmount).toFixed(2)}.`
                    : `Sua pendência de R$ ${fullAmount.toFixed(2)} foi quitada (${type === 'balance' ? 'Saldo R$' : 'Baixa Manual'}).`,
                category: 'system',
                is_read: false
            });

            fetchDebts();
            alert(isPartial ? `Pagamento parcial de R$ ${payAmount.toFixed(2)} registrado!` : 'Baixa total realizada com sucesso!');
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
            const userId = selectedCommand.user_id;

            // 1. Calculate bonuses: R$20 = 1 EXP, R$100 = 1 Chipz
            const expBonus = Math.floor(amount / 20);
            const chipzBonus = Math.floor(amount / 100);

            const { error: topUpErr } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: userId,
                p_brl_amount: amount,
                p_chipz_amount: chipzBonus,
                p_description: `Recarga de crédito via Admin${chipzBonus > 0 ? ` (+${chipzBonus} Chipz bônus)` : ''}`,
                p_category: 'wallet_deposit',
                p_metadata: { admin_id: currentUser.id, exp_bonus: expBonus }
            });
            if (topUpErr) { alert('Erro ao processar recarga: ' + topUpErr.message); return; }

            updatePlayerBalanceLocally(userId, amount);

            // 2. Award EXP (Keep separate as it's not a financial currency in transactions table yet)
            if (expBonus > 0) {
                const { data: profData } = await supabase.from('profiles').select('current_exp').eq('id', userId).single();
                await supabase.from('profiles').update({ current_exp: (Number(profData?.current_exp) || 0) + expBonus }).eq('id', userId);
            }

            // 5. Base system message
            await supabase.from('messages').insert({
                user_id: userId,
                sender_id: currentUser.id,
                content: `Pagamento de R$ ${amount.toFixed(2)} registrado pelo admin. Saldo atualizado.`,
                category: 'system',
                is_read: false
            });

            // 6. Gift bonus message
            if (expBonus > 0 || chipzBonus > 0) {
                const rewardLines = [
                    expBonus > 0 ? `⭐ ${expBonus} EXP` : '',
                    chipzBonus > 0 ? `🌟 ${chipzBonus} Chipz de Bônus` : ''
                ].filter(Boolean).join('\n');

                await supabase.from('messages').insert({
                    user_id: userId,
                    sender_id: currentUser.id,
                    content: `Parabéns! Sua compra de R$ ${amount.toFixed(2)} em créditos gerou recompensas! Você recebeu:\n${rewardLines}\nAproveite seus bônus!`,
                    category: 'gift',
                    is_read: false
                });
            }

            alert(`✅ R$ ${amount.toFixed(2)} creditado com sucesso!${expBonus > 0 || chipzBonus > 0
                ? `\n🎁 Bônus: ${expBonus > 0 ? `${expBonus} EXP ` : ''}${chipzBonus > 0 ? `+ ${chipzBonus} Chipz` : ''}`
                : ''
                }`);
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
                                color: template.color || '#00E5FF',
                                badge_template_id: template.id
                            });
                        }
                    } else {
                        // Use secure_balance_transaction for logging and safety
                        await supabase.rpc('secure_balance_transaction', {
                            p_user_id: uid,
                            p_brl_amount: giftType === 'brl' ? finalAmount : 0,
                            p_chipz_amount: giftType === 'chipz' ? finalAmount : 0,
                            p_description: finalDescription,
                            p_category: 'gift',
                            p_metadata: { admin_id: currentUser.id }
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
                    {[
                        { id: 'operational', icon: 'point_of_sale', label: 'Operaç.' },
                        { id: 'launch', icon: 'add_shopping_cart', label: 'Produtos' },
                        { id: 'reports', icon: 'bar_chart', label: 'Relat.' },
                        { id: 'send-gifts', icon: 'stars', label: 'Prêmios' },
                        { id: 'debts', icon: 'receipt_long', label: 'Crédito' },
                        { id: 'communications', icon: 'campaign', label: 'Comunic.' }
                    ].filter(t => currentUser?.role !== 'staff' || t.id === 'operational').map(t => (
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
                                <span className="text-[9px] text-primary font-black uppercase">{currentUser?.role === 'staff' ? 'Staff' : 'Admin'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050214]">
                    {activeTab === 'operational' && (
                        <OperationalTab
                            selectedEvent={selectedEvent}
                            setSelectedEvent={setSelectedEvent}
                            events={events}
                            openCommands={openCommands}
                            closedCommands={closedCommands}
                            selectedCommand={selectedCommand}
                            setSelectedCommand={setSelectedCommand}
                            commandItems={commandItems}
                            pendingProduct={pendingProduct}
                            setPendingProduct={setPendingProduct}
                            searchResults={searchResults}
                            upcomingEventsList={upcomingEventsList}
                            handleSearchPlayers={handleSearchPlayers}
                            handleOpenCommand={handleOpenCommand}
                            handleTourItemClick={handleTourItemClick}
                            handleCashItemClick={handleCashItemClick}
                            handleProductClick={handleProductClick}
                            handleDeleteCommandItem={handleDeleteCommandItem}
                            fetchOpenCommands={fetchOpenCommands}
                            fetchClosedCommands={fetchClosedCommands}
                            setShowCheckout={setShowCheckout}
                            setShowTopUp={setShowTopUp}
                            productSection={productSection}
                            setProductSection={setProductSection}
                            reopenCommand={reopenCommand}
                            handleDownloadCommandReceipt={() => { }}
                            isLoading={isLoading}
                            allProducts={products}
                            tournamentItems={getTournamentItems()}
                            cashItems={getCashItems()}
                            cashAmount={cashAmount}
                            setCashAmount={setCashAmount}
                            handleAddManualCash={handleAddManualCash}
                            handleAddManualOnline={handleAddManualOnline}
                            commandsTab={commandsTab === 'ativas' ? 'ativas' : 'encerradas'}
                            setCommandsTab={(t) => setCommandsTab(t === 'ativas' ? 'ativas' : 'historico')}
                            staffExpenses={staffExpenses}
                            setStaffExpenses={setStaffExpenses}
                            prizePayout={prizePayout}
                            setPrizePayout={setPrizePayout}
                            isTourItemDisabled={isTourItemDisabled}
                            isProductDisabled={isProductDisabled}
                            isAdmin={isAdmin}
                            productCategories={productCategories}
                            pastEventsList={pastEventsList}
                            handleFinalizeEvent={handleFinalizeEvent}
                            updateStaffExpenses={handleSaveExpenses}
                            updatePrizePayout={handleSaveExpenses}
                        />
                    )}

                    {activeTab === 'reports' && (
                        <ReportsTab
                            reportFilter={reportFilter}
                            setReportFilter={setReportFilter}
                            reportData={reportData}
                            setReportData={setReportData}
                            reportCommandsData={reportCommandsData}
                            setReportCommandsData={setReportCommandsData}
                            extraReportData={extraReportData}
                            setExtraReportData={setExtraReportData}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            reportProductFilter={reportProductFilter}
                            setReportProductFilter={setReportProductFilter}
                            reportCategoryFilter={reportCategoryFilter}
                            setReportCategoryFilter={setReportCategoryFilter}
                            selectedEvent={selectedEvent}
                            setSelectedEvent={setSelectedEvent}
                            events={events}
                            isLoading={isLoading}
                            fetchReport={fetchReport}
                            fetchMonthlyReport={fetchMonthlyReport}
                        />
                    )}

                    {activeTab === 'launch' && (
                        <InventoryTab
                            newProduct={newProduct}
                            setNewProduct={setNewProduct}
                            allProducts={allProducts}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            handleCreateProduct={handleAddProduct}
                            toggleProductStatus={toggleProductStatus}
                            deleteProduct={deleteProduct}
                            isLoading={isLoading}
                            productCategories={productCategories}
                            newCategory={newCategory}
                            setNewCategory={setNewCategory}
                            handleAddCategory={handleAddCategory}
                        />
                    )}
                    {activeTab === 'send-gifts' && (
                        <GiftsTab
                            giftTarget={giftTarget}
                            setGiftTarget={setGiftTarget}
                            giftType={giftType}
                            setGiftType={setGiftType}
                            giftAmount={giftAmount}
                            setGiftAmount={setGiftAmount}
                            giftSearchQuery={giftSearchQuery}
                            setGiftSearchQuery={setGiftSearchQuery}
                            giftDescription={giftDescription}
                            setGiftDescription={setGiftDescription}
                            selectedBadgeId={selectedBadgeId}
                            setSelectedBadgeId={setSelectedBadgeId}
                            giftSearchResults={giftSearchResults}
                            setGiftSearchResults={setGiftSearchResults}
                            badgeTemplates={badgeTemplates}
                            selectedGiftUsers={selectedGiftUsers}
                            setSelectedGiftUsers={setSelectedGiftUsers}
                            usersWithSelectedBadge={usersWithSelectedBadge}
                            handleSendGifts={handleSendGifts}
                            handleGiftSearch={handleGiftSearch}
                            onCreateBadgeTemplate={onCreateBadgeTemplate}
                            isLoading={isLoading}
                        />
                    )}

                    {activeTab === 'debts' && (
                        <DebtsTab
                            activeDebts={activeDebts}
                            totalActiveDebt={totalActiveDebt}
                            debtSearchQuery={debtSearchQuery}
                            setDebtSearchQuery={setDebtSearchQuery}
                            debtSearchResults={debtSearchResults}
                            setDebtSearchResults={setDebtSearchResults}
                            showNewDebtForm={showNewDebtForm}
                            setShowNewDebtForm={setShowNewDebtForm}
                            newDebtData={newDebtData}
                            setNewDebtData={setNewDebtData}
                            events={events}
                            isAdmin={isAdmin || false}
                            isLoading={isLoading}
                            handleDebtSearch={handleDebtSearch}
                            handleRegisterDebt={handleRegisterDebt}
                            handleSettleDebt={handleSettleDebt}
                            debtFilter={debtFilter}
                            setDebtFilter={setDebtFilter}
                            fetchDebts={fetchDebts}
                            currentUser={currentUser}
                            products={products}
                            productCategories={productCategories}
                            onUpdateProfile={onUpdateProfile}
                        />
                    )}

                    {activeTab === 'communications' && (
                        <CommunicationsTab
                            adminSubject={adminSubject}
                            setAdminSubject={setAdminSubject}
                            adminMsgContent={adminMsgContent}
                            setAdminMsgContent={setAdminMsgContent}
                            adminMsgCategory={adminMsgCategory}
                            setAdminMsgCategory={setAdminMsgCategory}
                            pollQuestion={pollQuestion}
                            setPollQuestion={setPollQuestion}
                            pollOptions={pollOptions}
                            setPollOptions={setPollOptions}
                            handleSendAdminMessage={handleSendBroadcast}
                            handleCreatePollSubmit={handleCreatePollSubmit}
                        />
                    )}
                </main>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                showCheckout={showCheckout}
                setShowCheckout={setShowCheckout}
                selectedCommand={selectedCommand}
                commandItems={commandItems}
                checkoutDiscount={checkoutDiscount}
                setCheckoutDiscount={setCheckoutDiscount}
                checkoutDebt={checkoutDebt}
                setCheckoutDebt={setCheckoutDebt}
                checkoutChips={checkoutChips}
                setCheckoutChips={setCheckoutChips}
                checkoutCashOut={checkoutCashOut}
                setCheckoutCashOut={setCheckoutCashOut}
                checkoutProfitCash={checkoutProfitCash}
                setCheckoutProfitCash={setCheckoutProfitCash}
                handleCloseCommand={handleCloseCommand}
                handleDeleteCommandItem={handleDeleteCommandItem}
                isLoading={isLoading}
                confirmingCheckout={confirmingCheckout}
                setConfirmingCheckout={setConfirmingCheckout}
            />

            <TopUpModal
                showTopUp={showTopUp}
                setShowTopUp={setShowTopUp}
                selectedCommand={selectedCommand}
                topUpAmount={topUpAmount}
                setTopUpAmount={setTopUpAmount}
                handleTopUp={handleTopUp}
                isLoading={isLoading}
                isAdmin={isAdmin}
                confirmingTopUp={confirmingTopUp}
                setConfirmingTopUp={setConfirmingTopUp}
            />

            <EditClosedCommandModal
                editingClosedCommand={editingClosedCommand}
                setEditingClosedCommand={setEditingClosedCommand}
                handleUpdateCommandTotal={async (id, newTotal) => {
                    await supabase.from('commands').update({ total_brl: newTotal }).eq('id', id);
                    if (selectedEvent) { fetchClosedCommands(selectedEvent.id); fetchReport(selectedEvent.id); }
                }}
            />

            <ViewCommandItemsModal
                viewingClosedCommand={viewingClosedCommand}
                setViewingClosedCommand={setViewingClosedCommand}
                viewingItems={viewingItems}
                handleDeleteCommandItem={handleDeleteCommandItem}
            />
        </div>
    );
};
