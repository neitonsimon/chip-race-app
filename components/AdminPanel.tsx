import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import { PlayerName } from './PlayerName';
import { ReportsTab } from './admin-panel/ReportsTab';
import { GiftsTab } from './admin-panel/GiftsTab';
import { BadgesTab } from './admin-panel/BadgesTab';
import { DebtsTab } from './admin-panel/DebtsTab';
import { CommunicationsTab } from './admin-panel/CommunicationsTab';
import { OperationalTab } from './admin-panel/OperationalTab';
import { InventoryTab } from './admin-panel/InventoryTab';
import { StockTab } from './admin-panel/StockTab';
import { SettingsTab } from './admin-panel/SettingsTab';
import { EventsTab } from './admin-panel/EventsTab';
import { CheckoutModal } from './admin-panel/modals/CheckoutModal';
import { TopUpModal } from './admin-panel/modals/TopUpModal';
import { EditClosedCommandModal } from './admin-panel/modals/EditClosedCommandModal';
import { ViewCommandItemsModal } from './admin-panel/modals/ViewCommandItemsModal';
import { ReservationsTab } from './admin-panel/ReservationsTab';
import { useCheckout } from './admin-panel/hooks/useCheckout';
import { useTopUp } from './admin-panel/hooks/useTopUp';
import { useDebts } from './admin-panel/hooks/useDebts';
import { useCommunications } from './admin-panel/hooks/useCommunications';
import { useGifts } from './admin-panel/hooks/useGifts';
import { useBadges } from './admin-panel/hooks/useBadges';
import { useOperations } from './admin-panel/hooks/useOperations';

interface AdminPanelProps {
    onClose: () => void;
    currentUser: any;
    isAdmin?: boolean;
    onUpdateProfile?: (id: string, stats: any) => void;
    badgeTemplates?: any[];
    onCreateBadgeTemplate?: (badge: any) => Promise<void>;
    onUpdateBadgeTemplate?: (id: string, badge: any) => Promise<void>;
    onSendAdminMessage?: (subject: string, content: string, category: 'admin' | 'system' | 'tournament') => void;
    onCreatePoll?: (question: string, options: string[]) => void;
    onRefreshData?: () => Promise<void>;
    onSelectPlayer?: (player: any) => void;
    onNavigate?: (view: string) => void;
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

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    onClose, currentUser, onUpdateProfile, badgeTemplates = [], isAdmin = false, 
    onCreateBadgeTemplate, onUpdateBadgeTemplate, onSendAdminMessage, onCreatePoll, onRefreshData, onSelectPlayer, onNavigate 
}) => {
    const [activeTab, setActiveTab] = useState<'operational' | 'inventory' | 'reports' | 'launch' | 'send-gifts' | 'badges' | 'debts' | 'communications' | 'reservations' | 'events' | 'settings'>('operational');
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [productSection, setProductSection] = useState<'bar' | 'torneio' | 'opcionais' | 'cash'>('bar');
    const [showTopUp, setShowTopUp] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportFilter, setReportFilter] = useState<'event' | 'date' | 'product'>('event');
    const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
    const [reportProductFilter, setReportProductFilter] = useState('all');
    const [extraReportData, setExtraReportData] = useState<any[]>([]);
    const [reportCommandsData, setReportCommandsData] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [editingClosedCommand, setEditingClosedCommand] = useState<any | null>(null);
    const [toast, setToast] = useState<{ msg: string; price: number } | null>(null);
    const toastTimer = useRef<any>(null);

    // Launch Tab State
    const [newProduct, setNewProduct] = useState({ name: '', category: 'bar', price: '', description: '', price_unit: '', inventory_item_id: '', inventory_consumption_ratio: '1' });
    const [allProducts, setAllProducts] = useState<any[]>([]); // Includes inactive
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [productCategories, setProductCategories] = useState<any[]>([]);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);

    // Gift Tab state managed by useGifts
    const [staffExpenses, setStaffExpenses] = useState('');
    const [prizePayout, setPrizePayout] = useState('');
    const [activeDebts, setActiveDebts] = useState<any[]>([]);
    const [totalActiveDebt, setTotalActiveDebt] = useState(0);

    // Communication Tab state managed by useCommunications
    const communicationsSystem = useCommunications({ onSendAdminMessage, onCreatePoll });


    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const upcomingEventsList = events.filter(ev => ev.status !== 'closed' && ev.type !== 'online').sort((a, b) => a.date.localeCompare(b.date));
    const pastEventsList = events.filter(ev => ev.status === 'closed' && ev.type !== 'online').sort((a, b) => b.date.localeCompare(a.date));


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

        // Update in activeDebts
        setActiveDebts(prev => prev.map(d => {
            if (d.user_id === userId) {
                const profiles = d.profiles;
                if (Array.isArray(profiles)) {
                    return {
                        ...d,
                        profiles: [{
                            ...profiles[0],
                            [field]: (Number(profiles[0]?.[field]) || 0) + amount
                        }]
                    };
                }
                return {
                    ...d,
                    profiles: {
                        ...profiles,
                        [field]: (Number(profiles?.[field]) || 0) + amount
                    }
                };
            }
            return d;
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

        if (currentUser && currentUser.id === userId && onUpdateProfile) {
            onUpdateProfile(userId, { totalPendingDebt: (Number(currentUser.totalPendingDebt) || 0) + amount });
        }
    };

    const showToast = (msg: string, price: number) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ msg, price });
        toastTimer.current = setTimeout(() => setToast(null), 2500);
    };

    const {
        commandsTab, setCommandsTab,
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        openCommands, setOpenCommands,
        closedCommands, setClosedCommands,
        selectedCommand, setSelectedCommand,
        commandItems, setCommandItems,
        viewingClosedCommand, setViewingClosedCommand,
        viewingItems, setViewingItems,
        pendingProduct, setPendingProduct,
        cashAmount, setCashAmount,
        fetchOpenCommands,
        fetchClosedCommands,
        fetchCommandItems,
        handleDeleteCommandItem,
        handleDeleteCommand,
        reopenCommand,
        openClosedCommandView,
        handleSearchPlayers,
        handleCreateGhostUser,
        handleOpenCommand,
        getTournamentItems,
        getCashItems,
        handleProductClick,
        handleTourItemClick,
        handleCashItemClick,
        handleAddManualCash,
        handleAddManualOnline,
        isProductDisabled,
        isTourItemDisabled,
        getVipPrice
    } = useOperations({
        currentUser,
        selectedEvent,
        setIsLoading,
        updatePlayerDebtLocally,
        updatePlayerBalanceLocally,
        showToast
    });

    const giftsSystem = useGifts({
        isAdmin: isAdmin || false,
        currentUser,
        badgeTemplates,
        updatePlayerBalanceLocally
    });

    const badgesSystem = useBadges({
        isAdmin: isAdmin || false,
        currentUser,
        badgeTemplates
    });

    const checkoutSystem = useCheckout({
        selectedCommand,
        currentUser,
        updatePlayerBalanceLocally,
        updatePlayerDebtLocally,
        onSuccess: () => {
            setOpenCommands(prev => prev.filter(c => c?.id !== selectedCommand?.id));
            if (selectedEvent) fetchClosedCommands(selectedEvent.id);
            fetchDebts();
            setSelectedCommand(null);
            setCommandItems([]);
        }
    });

    const topUpSystem = useTopUp({
        selectedCommand,
        currentUser,
        isAdmin,
        updatePlayerBalanceLocally
    });

    const debtsSystem = useDebts({
        isAdmin,
        currentUser,
        updatePlayerDebtLocally,
        updatePlayerBalanceLocally,
        onSuccess: () => {
            fetchDebts();
        }
    });

    useEffect(() => { fetchEvents(); fetchProducts(); fetchAllProducts(); fetchDebts(); fetchProductCategories(); fetchInventoryItems(); }, []);
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

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
        if (data) setEvents(data);
    };
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('active', true).order('category');
        if (data) setProducts(data);
    };
    const fetchInventoryItems = async () => {
        const { data } = await supabase.from('inventory_items').select('*').order('name');
        if (data) setInventoryItems(data);
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
                inventory_item_id: newProduct.inventory_item_id || null,
                inventory_consumption_ratio: parseFloat(newProduct.inventory_consumption_ratio) || 1,
                active: true
            });
            if (error) throw error;
            alert('✅ Produto lançado com sucesso!');
            setNewProduct({ name: '', category: 'bar', price: '', description: '', price_unit: '', inventory_item_id: '', inventory_consumption_ratio: '1' });
            fetchAllProducts();
            fetchProducts();
        } catch (err: any) { alert('Erro: ' + err.message); }
        finally { setIsLoading(false); }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct || !newProduct.name || !newProduct.price) { alert('Nome e preço são obrigatórios.'); return; }
        setIsLoading(true);
        try {
            const { error } = await supabase.from('products').update({
                name: newProduct.name,
                category: newProduct.category,
                price: parseFloat(newProduct.price),
                description: newProduct.description,
                price_unit: newProduct.price_unit,
                inventory_item_id: newProduct.inventory_item_id || null,
                inventory_consumption_ratio: parseFloat(newProduct.inventory_consumption_ratio) || 1
            }).eq('id', editingProduct.id);

            if (error) throw error;
            alert('✅ Produto atualizado com sucesso!');
            setEditingProduct(null);
            setNewProduct({ name: '', category: 'bar', price: '', description: '', price_unit: '', inventory_item_id: '', inventory_consumption_ratio: '1' });
            fetchAllProducts();
            fetchProducts();
        } catch (err: any) { alert('Erro ao atualizar: ' + err.message); }
        finally { setIsLoading(false); }
    };

    const toggleProductStatus = async (product: any) => {
        const { error } = await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
        if (error) { alert('Erro: ' + error.message); return; }
        fetchAllProducts();
        fetchProducts();
    };
    const deleteProduct = async (productId: string) => {
        if (!window.confirm('⚠️ Tem certeza que deseja EXCLUIR este produto permanentemente? \n\n(O histórico de vendas será mantido, mas o nome do produto não aparecerá mais nos relatórios antigos).')) return;
        setIsLoading(true);
        const { error } = await supabase.from('products').delete().eq('id', productId);
        setIsLoading(false);
        if (error) { 
            alert('Erro ao excluir: ' + error.message); 
        } else {
            alert('✅ Produto excluído com sucesso!');
            fetchAllProducts();
            fetchProducts();
        }
    };

    const handleSaveExpenses = async () => {
        if (!selectedEvent) return;

        const expensesVal = parseFloat(staffExpenses) || 0;
        const prizeVal = parseFloat(prizePayout) || 0;

        // Only save if values actually changed to prevent loops
        if (expensesVal === (selectedEvent.staff_expenses_brl || 0) && prizeVal === (selectedEvent.prize_payout_brl || 0)) {
            return;
        }

        setIsLoading(true);
        try {
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

            // Removendo alert de sucesso pois causava loop com onBlur
            // O usuário pode ver a atualização nos cards de faturamento abaixo.
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

            // REGISTRAR FATURAMENTO REAL NO CAIXA GERAL AUTOMATICAMENTE
            const faturamentoReal = closedCommands.reduce((sum, cmd) => sum + Number(cmd.chips_payment_brl || 0), 0)
                - Number(selectedEvent.staff_expenses_brl || 0)
                - closedCommands.reduce((sum, cmd) => sum + Number(cmd.profit_cash_payment_brl || 0), 0);

            if (faturamentoReal !== 0) {
                const { error: txError } = await supabase.from('club_transactions').insert([{
                    amount_brl: Math.abs(faturamentoReal),
                    type: faturamentoReal >= 0 ? 'credit' : 'debit',
                    category: 'evento',
                    description: `Faturamento - ${selectedEvent.title}`,
                    payment_method: 'dinheiro',
                    admin_id: currentUser.id,
                    event_id: selectedEvent.id
                }]);
                if (txError) console.error('Erro ao registrar caixa do evento:', txError);
            }

            // AUTO-DEDUCT INVENTORY
            if (closedCommands.length > 0) {
                const { data: cmdItems } = await supabase.from('command_items')
                    .select('quantity, products!inner(id, inventory_item_id, name, inventory_consumption_ratio), commands!inner(inventory_deducted)')
                    .in('command_id', closedCommands.map((c: any) => c.id))
                    .eq('commands.inventory_deducted', false);
                
                if (cmdItems && cmdItems.length > 0) {
                    const stockDeductions: Record<string, { qty: number, names: Set<string> }> = {};
                    for (const item of cmdItems) {
                        const product = item.products as any;
                        const invId = product?.inventory_item_id;
                        if (invId) {
                            if (!stockDeductions[invId]) stockDeductions[invId] = { qty: 0, names: new Set() };
                            const ratio = Number(product.inventory_consumption_ratio) || 1;
                            stockDeductions[invId].qty += (Number(item.quantity) || 1) * ratio;
                            stockDeductions[invId].names.add(product.name);
                        }
                    }

                    for (const [invId, data] of Object.entries(stockDeductions)) {
                        const { data: currentItem } = await supabase.from('inventory_items').select('current_stock').eq('id', invId).single();
                        if (currentItem) {
                            const newStock = Number(currentItem.current_stock) - data.qty;
                            await supabase.from('inventory_items').update({ current_stock: newStock }).eq('id', invId);
                            
                            await supabase.from('inventory_movements').insert([{
                                item_id: invId,
                                admin_id: currentUser.id,
                                type: 'out',
                                quantity: data.qty,
                                total_cost_brl: 0,
                                description: `Saída Automática (Evento: ${selectedEvent.title}) - Venda de: ${Array.from(data.names).join(', ')}`
                            }]);
                        }
                    }
                }
            }

            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: 'closed' } : e));
            setSelectedEvent((prev: any) => prev ? ({ ...prev, status: 'closed' }) : null);
            alert(`✅ Evento FINALIZADO com sucesso! \n\nO Faturamento Real de R$ ${faturamentoReal.toFixed(2)} foi lançado automaticamente no CAIXA GERAL.`);
        } catch (err: any) {
            alert('Erro ao finalizar evento: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuickEvent = async () => {
        const title = prompt('Nome do Evento Rápido (Ex: Cash Game 5/5 ou Torneio VIP):');
        if (!title) return;
        setIsLoading(true);
        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

            const newEvent = {
                title,
                date: dateStr,
                time: timeStr,
                type: 'live',
                status: 'open',
                game_mode: 'cash_game',
                ranking_type: 'none',
                is_hidden: true
            };

            const { data, error } = await supabase.from('events').insert(newEvent).select().single();
            if (error) throw error;

            alert('✅ Evento rápido criado com sucesso!');
            await fetchEvents();
            if (data) setSelectedEvent(data);
        } catch (err: any) {
            alert('Erro ao criar evento: ' + err.message);
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
            .select('*, profiles(name, numeric_id)')
            .gte('created_at', start + 'T00:00:00.000Z')
            .lte('created_at', end + 'T23:59:59.999Z')
            .filter('category', 'not.in', '("wallet_deposit","gift","purchase","debt_payment","command_charge")');

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

    // handleSendGifts logic handled by useGifts




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

            <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-black/40 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img src="/cr-logo.png" alt="Chip Race" className="h-6 sm:h-8 w-auto" />
                    <div className="h-4 sm:h-5 w-px bg-white/10"></div>
                    <h2 className="text-[10px] sm:text-base font-display font-black text-white uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">Painel Administrativo</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <img src={currentUser.avatar} className="w-5 h-5 rounded-full border border-primary/50" alt="" />
                        <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{currentUser.name}</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all group">
                        <span className="material-icons-outlined text-gray-400 group-hover:text-red-500 text-sm sm:text-base">close</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Navigation (Horizontal Scroll) */}
            <div className="lg:hidden flex overflow-x-auto custom-scrollbar bg-black/20 border-b border-white/10 p-2 gap-2 flex-shrink-0 no-scrollbar">
                {[
                     { id: 'operational', icon: 'point_of_sale', label: 'Operaç.' },
                    { id: 'inventory', icon: 'inventory_2', label: 'Estoque' },
                    { id: 'launch', icon: 'add_shopping_cart', label: 'Produtos' },
                    { id: 'reports', icon: 'bar_chart', label: 'Relat.' },
                    { id: 'send-gifts', icon: 'redeem', label: 'Prêmios' },
                    { id: 'badges', icon: 'badge', label: 'Medalhas' },
                    { id: 'debts', icon: 'receipt_long', label: 'Crédito' },
                    { id: 'communications', icon: 'campaign', label: 'Comunic.' },
                    { id: 'reservations', icon: 'support_agent', label: 'Bônus/Res.' },
                    { id: 'events', icon: 'celebration', label: 'Eventos' },
                    { id: 'settings', icon: 'settings', label: 'Site' }
                ].filter(t => currentUser?.role !== 'staff' || t.id === 'operational').map(t => (
                    <button key={t.id} onClick={() => { setActiveTab(t.id as any); if (t.id === 'reports' && selectedEvent) fetchReport(selectedEvent.id); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === t.id ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 bg-white/5 border border-white/5'}`}>
                        <span className="material-icons-outlined text-sm">{t.icon}</span>{t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
                <aside className="hidden lg:flex w-52 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-2 flex-shrink-0">
                    {[
                        { id: 'operational', icon: 'point_of_sale', label: 'Operaç.' },
                        { id: 'inventory', icon: 'inventory_2', label: 'Estoque' },
                        { id: 'launch', icon: 'add_shopping_cart', label: 'Produtos' },
                        { id: 'reports', icon: 'bar_chart', label: 'Relat.' },
                        { id: 'send-gifts', icon: 'redeem', label: 'Prêmios' },
                        { id: 'badges', icon: 'badge', label: 'Medalhas' },
                        { id: 'debts', icon: 'receipt_long', label: 'Crédito' },
                        { id: 'communications', icon: 'campaign', label: 'Comunic.' },
                        { id: 'reservations', icon: 'support_agent', label: 'Bônus/Res.' },
                        { id: 'events', icon: 'celebration', label: 'Eventos' },
                        { id: 'settings', icon: 'settings', label: 'Site' }
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

                <main className={`flex-1 custom-scrollbar bg-[#050214] ${activeTab === 'operational' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
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
                            setShowCheckout={checkoutSystem.setShowCheckout}
                            setShowTopUp={topUpSystem.setShowTopUp}
                            productSection={productSection}
                            setProductSection={setProductSection}
                            reopenCommand={reopenCommand}
                            handleDownloadCommandReceipt={openClosedCommandView}
                            isLoading={isLoading}
                            allProducts={products}
                            tournamentItems={getTournamentItems()}
                            cashItems={getCashItems()}
                            cashAmount={cashAmount}
                            setCashAmount={setCashAmount}
                            handleAddManualCash={handleAddManualCash}
                            handleAddManualOnline={handleAddManualOnline}
                            commandsTab={commandsTab === 'ativas' ? 'ativas' : (commandsTab === 'resumo' ? 'resumo' : 'encerradas')}
                            setCommandsTab={(tabName) => {
                                const newTab = tabName === 'ativas' ? 'ativas' : (tabName === 'resumo' ? 'resumo' : 'historico');
                                setCommandsTab(newTab);
                                if (newTab === 'historico' && selectedEvent) {
                                    fetchClosedCommands(selectedEvent.id);
                                }
                            }}
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
                            handleCreateQuickEvent={handleCreateQuickEvent}
                            updateStaffExpenses={handleSaveExpenses}
                            updatePrizePayout={handleSaveExpenses}
                            searchQuery={searchQuery}
                            handleCreateGhostUser={handleCreateGhostUser}
                            getVipPrice={getVipPrice}
                            handleDeleteCommand={handleDeleteCommand}
                            currentUserRole={currentUser?.role}
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

                    {activeTab === 'reservations' && (
                        <ReservationsTab 
                            events={events} 
                            currentUser={currentUser} 
                            isAdmin={isAdmin}
                            onRefreshData={onRefreshData}
                            onSelectPlayer={onSelectPlayer}
                            onNavigate={onNavigate}
                        />
                    )}

                    {activeTab === 'inventory' && (
                        <StockTab currentUser={currentUser as any} />
                    )}

                    {activeTab === 'launch' && (
                        <InventoryTab
                            newProduct={newProduct}
                            setNewProduct={setNewProduct}
                            allProducts={allProducts}
                            inventoryItems={inventoryItems}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            handleCreateProduct={handleAddProduct}
                            toggleProductStatus={toggleProductStatus}
                            deleteProduct={deleteProduct}
                            isLoading={isLoading}
                            productCategories={productCategories}
                            editingProduct={editingProduct}
                            setEditingProduct={setEditingProduct}
                            handleUpdateProduct={handleUpdateProduct}
                        />
                    )}
                    {activeTab === 'send-gifts' && (
                        <GiftsTab
                            giftTarget={giftsSystem.giftTarget}
                            setGiftTarget={giftsSystem.setGiftTarget}
                            giftType={giftsSystem.giftType}
                            setGiftType={giftsSystem.setGiftType}
                            giftAmount={giftsSystem.giftAmount}
                            setGiftAmount={giftsSystem.setGiftAmount}
                            giftSearchQuery={giftsSystem.giftSearchQuery}
                            setGiftSearchQuery={giftsSystem.setGiftSearchQuery}
                            giftDescription={giftsSystem.giftDescription}
                            setGiftDescription={giftsSystem.setGiftDescription}
                            giftSearchResults={giftsSystem.giftSearchResults}
                            setGiftSearchResults={giftsSystem.setGiftSearchResults}
                            selectedGiftUsers={giftsSystem.selectedGiftUsers}
                            setSelectedGiftUsers={giftsSystem.setSelectedGiftUsers}
                            handleSendGifts={giftsSystem.handleSendGifts}
                            handleGiftSearch={giftsSystem.handleGiftSearch}
                            isLoading={giftsSystem.isLoading}
                            selectedVipType={giftsSystem.selectedVipType as any}
                            setSelectedVipType={giftsSystem.setSelectedVipType}
                        />
                    )}

                    {activeTab === 'badges' && (
                        <BadgesTab
                            targetType={badgesSystem.targetType}
                            setTargetType={badgesSystem.setTargetType}
                            searchQuery={badgesSystem.searchQuery}
                            setSearchQuery={badgesSystem.setSearchQuery}
                            description={badgesSystem.description}
                            setDescription={badgesSystem.setDescription}
                            selectedBadgeId={badgesSystem.selectedBadgeId}
                            setSelectedBadgeId={badgesSystem.setSelectedBadgeId}
                            searchResults={badgesSystem.searchResults}
                            setSearchResults={badgesSystem.setSearchResults}
                            badgeTemplates={badgeTemplates}
                            selectedUsers={badgesSystem.selectedUsers}
                            setSelectedUsers={badgesSystem.setSelectedUsers}
                            usersWithSelectedBadge={badgesSystem.usersWithSelectedBadge}
                            handleSendBadges={badgesSystem.handleSendBadges}
                            handleSearch={badgesSystem.handleSearch}
                            onCreateBadgeTemplate={onCreateBadgeTemplate}
                            onUpdateBadgeTemplate={onUpdateBadgeTemplate}
                            isLoading={badgesSystem.isLoading}
                        />
                    )}

                    {activeTab === 'debts' && (
                        <DebtsTab
                            activeDebts={activeDebts}
                            totalActiveDebt={totalActiveDebt}
                            debtSearchQuery={debtsSystem.debtSearchQuery}
                            setDebtSearchQuery={debtsSystem.setDebtSearchQuery}
                            debtSearchResults={debtsSystem.debtSearchResults}
                            setDebtSearchResults={debtsSystem.setDebtSearchResults}
                            showNewDebtForm={debtsSystem.showNewDebtForm}
                            setShowNewDebtForm={debtsSystem.setShowNewDebtForm}
                            newDebtData={debtsSystem.newDebtData}
                            setNewDebtData={debtsSystem.setNewDebtData}
                            events={events}
                            isAdmin={isAdmin || false}
                            isLoading={debtsSystem.isLoading}
                            handleDebtSearch={debtsSystem.handleDebtSearch}
                            handleRegisterDebt={debtsSystem.handleRegisterDebt}
                            handleSettleDebt={debtsSystem.handleSettleDebt}
                            debtFilter={debtsSystem.debtFilter}
                            setDebtFilter={debtsSystem.setDebtFilter}
                            fetchDebts={fetchDebts}
                            currentUser={currentUser}
                            products={products}
                            productCategories={productCategories}
                            onUpdateProfile={onUpdateProfile}
                        />
                    )}

                    {activeTab === 'communications' && (
                        <CommunicationsTab
                            adminSubject={communicationsSystem.adminSubject}
                            setAdminSubject={communicationsSystem.setAdminSubject}
                            adminMsgContent={communicationsSystem.adminMsgContent}
                            setAdminMsgContent={communicationsSystem.setAdminMsgContent}
                            adminMsgCategory={communicationsSystem.adminMsgCategory}
                            setAdminMsgCategory={communicationsSystem.setAdminMsgCategory}
                            pollQuestion={communicationsSystem.pollQuestion}
                            setPollQuestion={communicationsSystem.setPollQuestion}
                            pollOptions={communicationsSystem.pollOptions}
                            setPollOptions={communicationsSystem.setPollOptions}
                            handleSendAdminMessage={communicationsSystem.handleSendBroadcast}
                            handleCreatePollSubmit={communicationsSystem.handleCreatePollSubmit}
                        />
                    )}

                    {activeTab === 'events' && isAdmin && (
                        <div className="p-6">
                            <EventsTab />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab />
                    )}
                </main>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                showCheckout={checkoutSystem.showCheckout}
                setShowCheckout={checkoutSystem.setShowCheckout}
                selectedCommand={selectedCommand}
                commandItems={commandItems}
                checkoutDiscount={checkoutSystem.checkoutDiscount}
                setCheckoutDiscount={checkoutSystem.setCheckoutDiscount}
                checkoutDebt={checkoutSystem.checkoutDebt}
                setCheckoutDebt={checkoutSystem.setCheckoutDebt}
                checkoutChips={checkoutSystem.checkoutChips}
                setCheckoutChips={checkoutSystem.setCheckoutChips}
                checkoutCashOut={checkoutSystem.checkoutCashOut}
                setCheckoutCashOut={checkoutSystem.setCheckoutCashOut}
                checkoutProfitCash={checkoutSystem.checkoutProfitCash}
                setCheckoutProfitCash={checkoutSystem.setCheckoutProfitCash}
                handleCloseCommand={checkoutSystem.handleCloseCommand}
                handleDeleteCommandItem={handleDeleteCommandItem}
                isLoading={checkoutSystem.isLoading}
                confirmingCheckout={checkoutSystem.confirmingCheckout}
                setConfirmingCheckout={checkoutSystem.setConfirmingCheckout}
            />

            <TopUpModal
                showTopUp={topUpSystem.showTopUp}
                setShowTopUp={topUpSystem.setShowTopUp}
                selectedCommand={selectedCommand}
                topUpAmount={topUpSystem.topUpAmount}
                setTopUpAmount={topUpSystem.setTopUpAmount}
                handleTopUp={topUpSystem.handleTopUp}
                isLoading={topUpSystem.isLoading}
                isAdmin={isAdmin}
                confirmingTopUp={topUpSystem.confirmingTopUp}
                setConfirmingTopUp={topUpSystem.setConfirmingTopUp}
            />

            <EditClosedCommandModal
                editingClosedCommand={editingClosedCommand}
                setEditingClosedCommand={setEditingClosedCommand}
                handleUpdateCommandTotal={async (id, newTotal) => {
                    await supabase.from('commands').update({ total_brl: newTotal }).eq('id', id);
                    await supabase.from('audit_logs').insert({
                        admin_id: currentUser.id,
                        action_type: 'COMMAND_EDIT',
                        description: `Admin editou o total da comanda ${id.slice(0, 8)} fechada para R$ ${newTotal.toFixed(2)}`,
                        target_user_id: editingClosedCommand?.user_id,
                        details: { command_id: id, newTotal }
                    });
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
