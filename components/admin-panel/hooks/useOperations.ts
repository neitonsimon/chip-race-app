import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface UseOperationsProps {
    currentUser: any;
    selectedEvent: any;
    setIsLoading: (loading: boolean) => void;
    updatePlayerDebtLocally: (userId: string, amount: number) => void;
    updatePlayerBalanceLocally: (userId: string, amount: number) => void;
    showToast: (msg: string, price: number) => void;
}

export function useOperations({
    currentUser,
    selectedEvent,
    setIsLoading,
    updatePlayerDebtLocally,
    updatePlayerBalanceLocally,
    showToast
}: UseOperationsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [openCommands, setOpenCommands] = useState<any[]>([]);
    const [closedCommands, setClosedCommands] = useState<any[]>([]);
    const [selectedCommand, setSelectedCommand] = useState<any | null>(null);
    const [commandItems, setCommandItems] = useState<any[]>([]);
    const [viewingClosedCommand, setViewingClosedCommand] = useState<any | null>(null);
    const [viewingItems, setViewingItems] = useState<any[]>([]);
    const [pendingProduct, setPendingProduct] = useState<any | null>(null);
    const [cashAmount, setCashAmount] = useState('');
    const [commandsTab, setCommandsTab] = useState<'ativas' | 'historico' | 'resumo'>('ativas');

    const fetchOpenCommands = async (eventId: string) => {
        const { data } = await supabase.from('commands').select('*, profiles!user_id(name, numeric_id, avatar_url, is_vip, vip_status, vip_expires_at, role, balance_brl, debt_limit_brl, total_pending_debt)').eq('event_id', eventId).eq('status', 'open').order('created_at', { ascending: false });
        if (data) setOpenCommands(data);
    };

    const fetchClosedCommands = async (eventId: string) => {
        const { data, error } = await supabase.from('commands')
            .select('*, profiles!user_id(name, numeric_id, avatar_url, is_vip, vip_status, vip_expires_at, role, balance_brl, debt_limit_brl, total_pending_debt)')
            .eq('event_id', eventId)
            .eq('status', 'closed')
            .order('created_at', { ascending: false }); // Use created_at as backup if closed_at is missing/buggy

        if (error) {
            console.error('Error fetching closed commands:', error);
            return;
        }
        setClosedCommands(data || []);
    };

    const fetchCommandItems = async (commandId: string) => {
        const { data } = await supabase.from('command_items').select('*, products(name, category, price)').eq('command_id', commandId).order('created_at', { ascending: true });
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

            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'COMMAND_ITEM_DELETED',
                description: `Admin cancelou/deletou o item "${item.products?.name || item.notes || 'Item'}" (R$ ${itemPrice.toFixed(2)}) da comanda ${currentCmd.id.slice(0, 8)}.`,
                target_user_id: currentCmd.user_id,
                details: { item_id: item.id, item_price: itemPrice, command_id: currentCmd.id }
            });

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

        } catch (err: any) {
            alert('Erro ao excluir item: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCommand = async (cmd: any) => {
        if (cmd.status !== 'open') {
            alert('Apenas comandas abertas podem ser excluídas.');
            return;
        }

        const itemsCount = openCommands.find(c => c.id === cmd.id)?.item_count || 0; // Assuming we might have count or we check items
        // We can check local commandItems if cmd is the selected one, otherwise we don't know for sure without fetching.
        // But for "accidental" additions, usually it's 0.
        
        const confirmMsg = Number(cmd.total_brl) > 0 
            ? `⚠️ Esta comanda possui R$ ${Number(cmd.total_brl).toFixed(2)} em consumo. Deseja REALMENTE excluir permanentemente?`
            : `Deseja remover a comanda de ${cmd.profiles?.name}?`;

        if (!window.confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            // 1. Delete items first (foreign key constraints)
            const { error: itemsErr } = await supabase.from('command_items').delete().eq('command_id', cmd.id);
            if (itemsErr) throw itemsErr;

            // 2. Delete the command
            const { error: cmdErr } = await supabase.from('commands').delete().eq('id', cmd.id);
            if (cmdErr) throw cmdErr;

            // 3. Audit log
            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'COMMAND_DELETED',
                description: `Admin excluiu a comanda ${cmd.id.slice(0, 8)} de ${cmd.profiles?.name}. Total era R$ ${Number(cmd.total_brl).toFixed(2)}.`,
                target_user_id: cmd.user_id,
                details: { command_id: cmd.id, total: cmd.total_brl }
            });

            // 4. Update local state
            setOpenCommands(prev => prev.filter(c => c.id !== cmd.id));
            if (selectedCommand?.id === cmd.id) {
                setSelectedCommand(null);
                setCommandItems([]);
            }

            alert('✅ Comanda removida com sucesso.');
        } catch (err: any) {
            alert('Erro ao excluir comanda: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const reopenCommand = async (cmd: any) => {
        const total = Number(cmd.total_brl || 0);
        const discount = Number(cmd.discount_brl || 0);
        const debt = Number(cmd.unpaid_amount_brl || 0);
        const chips = Number(cmd.chips_payment_brl || 0);
        const cashOut = Number(cmd.cash_out_brl || 0);
        const profit = Number(cmd.profit_brl || 0);
        const profitCash = Number(cmd.profit_cash_payment_brl || 0);

        const netCost = total - discount - debt - chips;
        const hasProfit = profit > 0.01;

        let balanceImpact = 0;
        if (hasProfit) {
            // Player received credit added to balance
            balanceImpact = profit - profitCash;
        } else {
            // amount that was deducted from balance
            const finalToDeduct = cashOut > 0 ? Math.max(0, netCost - cashOut) : Math.max(0, netCost);
            balanceImpact = -finalToDeduct;
        }

        // To undo, we apply the negative of the impact
        const refundAmount = -balanceImpact;

        const label = refundAmount >= 0 ? 'reembolsado ao' : 'estornado do';
        const confirmMsg = `Reabrir comanda de ${cmd.profiles?.name}? O valor de R$ ${Math.abs(refundAmount).toFixed(2)} será ${label} saldo.`;
        if (!window.confirm(confirmMsg)) return;

        if (Math.abs(refundAmount) > 0.01) {
            const { error } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: cmd.user_id,
                p_brl_amount: refundAmount,
                p_chipz_amount: 0,
                p_description: `Estorno/Reembolso por reabertura de comanda ${cmd.id.slice(0, 8)}`,
                p_category: 'refund',
                p_metadata: { command_id: cmd.id, event_id: cmd.event_id }
            });
            if (error) { alert('Erro ao processar estorno/reembolso: ' + error.message); return; }
        }

        // Delete associated pending debt if exists
        if (debt > 0) {
            await supabase.from('debts').delete().eq('command_id', cmd.id).eq('status', 'pending');
            updatePlayerDebtLocally(cmd.user_id, -debt);
        }

        const { error: upErr } = await supabase.from('commands').update({
            status: 'open',
            closed_at: null,
            discount_brl: 0,
            unpaid_amount_brl: 0,
            chips_payment_brl: 0,
            cash_out_brl: 0,
            profit_brl: 0,
            profit_cash_payment_brl: 0
        }).eq('id', cmd.id);

        if (upErr) { alert('Erro ao reabrir: ' + upErr.message); return; }

        const msg = refundAmount >= 0
            ? `Sua comanda foi reaberta. R$ ${refundAmount.toFixed(2)} devolvidos ao saldo.`
            : `Sua comanda foi reaberta. R$ ${Math.abs(refundAmount).toFixed(2)} estornados do saldo (lucro revertido).`;

        await supabase.from('messages').insert({
            user_id: cmd.user_id,
            sender_id: currentUser.id,
            content: msg,
            category: 'system',
            is_read: false
        });

        await supabase.from('audit_logs').insert({
            admin_id: currentUser.id,
            action_type: 'COMMAND_REOPENED',
            description: `Admin reabriu a comanda ${cmd.id.slice(0, 8)} de ${cmd.profiles?.name} (Estorno/Reembolso de R$ ${refundAmount.toFixed(2)})`,
            target_user_id: cmd.user_id,
            details: { command_id: cmd.id, refundAmount }
        });

        if (selectedEvent) { fetchOpenCommands(selectedEvent.id); fetchClosedCommands(selectedEvent.id); }
        updatePlayerBalanceLocally(cmd.user_id, refundAmount);
        setSelectedCommand({ ...cmd, status: 'open', closed_at: null, discount_brl: 0, unpaid_amount_brl: 0, chips_payment_brl: 0, cash_out_brl: 0, profit_brl: 0, profit_cash_payment_brl: 0 });
        setCommandsTab('ativas');
    };

    const openClosedCommandView = async (cmd: any) => {
        setViewingClosedCommand(cmd);
        setViewingItems([]); // Clear previous items while loading

        try {
            const { data, error } = await supabase
                .from('command_items')
                .select('*, products(name, category)')
                .eq('command_id', cmd.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setViewingItems(data || []);
        } catch (err: any) {
            console.error('Error fetching command items:', err);
            alert('Erro ao carregar itens da comanda. Verifique sua conexão.');
        }
    };

    // Compute which one-time keys are already used in this command
    const getOneTimeKey = (product: any): string | null => {
        if (!product?.category) return null;
        if (product.category === 'bar') return null;
        if (product.category === 'cash_game') return null;
        if (product.category === 'torneio' && !product.name.toLowerCase().includes('buy in') && !product.name.toLowerCase().includes('staff')) return null;
        return `${product.category}_${product.name}`.toLowerCase();
    };

    const getOneTimeKeyFromNote = (note: string): string | null => {
        const lowerNote = note.toLowerCase();
        if (lowerNote.includes('buy in')) return 'torneio_buy in';
        if (lowerNote.includes('staff')) return 'torneio_staff';
        return null;
    };

    const usedOneTimeKeys = new Set<string>();
    commandItems.forEach(item => {
        const key1 = item.products ? getOneTimeKey(item.products) : null;
        const key2 = item.notes ? getOneTimeKeyFromNote(item.notes) : null;
        if (key1) usedOneTimeKeys.add(key1);
        if (key2) usedOneTimeKeys.add(key2);
    });

    const isProductDisabled = (product: any): boolean => {
        if (selectedCommand?.status === 'closed') return true;
        const key = getOneTimeKey(product);
        return key ? usedOneTimeKeys.has(key) : false;
    };

    const isTourItemDisabled = (item: any): boolean => {
        if (selectedCommand?.status === 'closed') return true;
        const key = getOneTimeKeyFromNote(item.name);
        return key ? usedOneTimeKeys.has(key) : false;
    };

    const handleSearchPlayers = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, is_vip, vip_status, vip_expires_at, balance_brl, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.order('name', { ascending: true }).limit(5);
        setSearchResults(data || []);
    };

    const handleOpenCommand = async (player: any) => {
        if (!selectedEvent) { alert('Selecione um evento primeiro.'); return; }
        if (openCommands.find(c => c.user_id === player.id)) { alert('Jogador já tem comanda aberta.'); return; }
        const { data, error } = await supabase.from('commands').insert({ event_id: selectedEvent.id, user_id: player.id, status: 'open', opened_by: currentUser.id }).select('*, profiles!user_id(name, numeric_id, avatar_url, is_vip, vip_status, vip_expires_at, role, balance_brl, debt_limit_brl, total_pending_debt)').single();
        if (error) { alert('Erro: ' + error.message); return; }
        setOpenCommands([data, ...openCommands]);
        setSearchQuery(''); setSearchResults([]);
        setSelectedCommand(data);
    };

    const handleCreateGhostUser = async (name: string) => {
        if (!name || name.length < 2) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_ghost_user', { p_name: name });
            if (error) throw error;

            // Re-fetch the newly created user to open command
            const { data: user, error: userErr } = await supabase.from('profiles').select('id, name, numeric_id, avatar_url, is_vip, vip_status, vip_expires_at, role, balance_brl, debt_limit_brl, total_pending_debt').eq('id', data).single();
            if (userErr) throw userErr;

            if (user) {
                await handleOpenCommand(user);
                alert('Jogador fantasma criado com sucesso e comanda aberta!');
            }
        } catch (err: any) {
            alert('Erro ao criar jogador fantasma: ' + err.message);
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

    const getVipPrice = (price: number, category: string, name: string) => {
        const profile = selectedCommand?.profiles;
        if (!profile) return price;

        const isVip = profile.is_vip;
        const vipStatus = profile.vip_status;
        const vipExpiresAt = profile.vip_expires_at;

        const isVipActive = isVip && vipExpiresAt && new Date(vipExpiresAt) > new Date();
        if (!isVipActive) return price;

        const lowerName = name.toLowerCase();
        const isJanta = lowerName.includes('janta') || lowerName.includes('dinner');
        const isBar = category === 'bar';
        const isStaff = lowerName === 'staff';

        if (vipStatus === 'master') {
            if (isJanta || isStaff) return 0;
            if (isBar) return Math.max(0, price * 0.5);
        } else if (vipStatus === 'anual') {
            if (isJanta || isStaff) return Math.max(0, price - 10);
            if (isBar) return Math.max(0, price * 0.8);
        } else if (vipStatus === 'honorario') {
            if (isStaff) return Math.max(0, price - 10);
        } else if (vipStatus === 'trimestral') {
            if (isBar) return Math.max(0, price * 0.9);
        }
        return price;
    };

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
        const profile = selectedCommand?.profiles;
        const isVipActive = profile?.is_vip && profile?.vip_expires_at && new Date(profile.vip_expires_at) > new Date();
        const finalPrice = getVipPrice(item.price, 'torneio', item.name);

        const isAddon = item.name === 'Add On' || item.name === 'Add Duplo';
        const bonusNote = isAddon && isVipActive ? ' (+5K fichas VIP)' : '';
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

            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'MANUAL_SALE_CASH_GAME',
                description: `Admin adicionou R$ ${amount.toFixed(2)} de Cash Manual na comanda ${selectedCommand.id.slice(0, 8)}`,
                target_user_id: selectedCommand.user_id,
                details: { amount, command_id: selectedCommand.id }
            });

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

            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'MANUAL_SALE_ONLINE_CREDIT',
                description: `Admin adicionou R$ ${amount.toFixed(2)} de Fichas Online Manual na comanda ${selectedCommand.id.slice(0, 8)}`,
                target_user_id: selectedCommand.user_id,
                details: { amount, command_id: selectedCommand.id }
            });

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
        if (selectedCommand.status === 'closed') return;
        if (isProductDisabled(product)) return;
        if (pendingProduct?.id === product.id) { addProductToCommand(product); setPendingProduct(null); }
        else setPendingProduct(product);
    };

    const handleTourItemClick = (item: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (selectedCommand.status === 'closed') return;
        if (isTourItemDisabled(item)) return;
        if (pendingProduct?.id === item.id) { addTournamentItemToCommand(item); setPendingProduct(null); }
        else setPendingProduct(item);
    };

    const handleCashItemClick = (item: any) => {
        if (!selectedCommand) { alert('Selecione uma comanda primeiro.'); return; }
        if (selectedCommand.status === 'closed') return;
        if (pendingProduct?.id === item.id) { addCashItemToCommand(item); setPendingProduct(null); }
        else setPendingProduct(item);
    };

    return {
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
    };
}
