import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Event, TournamentReservation, OnlineCreditRequest } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface ReservationsTabProps {
    events: Event[];
    currentUser?: any;
    isAdmin?: boolean;
    onRefreshData?: () => Promise<void>;
    onSelectPlayer?: (player: any) => void;
    onNavigate?: (view: string) => void;
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ 
    events, currentUser: propCurrentUser, isAdmin, onRefreshData, onSelectPlayer, onNavigate 
}) => {
    const { currentUser: contextCurrentUser, refreshSupabaseData: contextRefreshData } = useApp();
    const currentUser = propCurrentUser || contextCurrentUser;
    const refreshSupabaseData = onRefreshData || contextRefreshData;
    const [activeSubTab, setActiveSubTab] = useState<'tournaments' | 'credits' | 'merge' | 'withdrawals'>('tournaments');
    const [supremaSubTab, setSupremaSubTab] = useState<'buy' | 'withdraw'>('buy');

    // Merge State
    const [ghostAccount, setGhostAccount] = useState<any | null>(null);
    const [realAccount, setRealAccount] = useState<any | null>(null);
    const [mergeSearchQuery1, setMergeSearchQuery1] = useState('');
    const [mergeSearchQuery2, setMergeSearchQuery2] = useState('');
    const [mergeSearchResults1, setMergeSearchResults1] = useState<any[]>([]);
    const [mergeSearchResults2, setMergeSearchResults2] = useState<any[]>([]);

    // Tournaments State
    const [reservations, setReservations] = useState<(TournamentReservation & { profiles: any, events: any })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'upcoming' | 'completed'>('upcoming');

    // Credits State
    const [creditRequests, setCreditRequests] = useState<(OnlineCreditRequest & { profiles?: { name: string, avatar_url: string } })[]>([]);
    const [creditStatusFilter, setCreditStatusFilter] = useState<'pending' | 'completed' | 'cancelled'>('pending');

    // Withdrawals State
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'pending' | 'completed' | 'rejected'>('pending');

    // Online Withdrawals (Resgates Suprema)
    const [onlineWithdrawals, setOnlineWithdrawals] = useState<any[]>([]);
    const [onlineWithdrawalStatusFilter, setOnlineWithdrawalStatusFilter] = useState<'pending' | 'completed' | 'cancelled'>('pending');

    // Nova Reserva Admin
    const [resSearchQuery, setResSearchQuery] = useState('');
    const [resSearchResults, setResSearchResults] = useState<any[]>([]);
    const [resSelectedPlayer, setResSelectedPlayer] = useState<any | null>(null);
    const [resSelectedEventId, setResSelectedEventId] = useState<string>('');
    const [resBonusChips, setResBonusChips] = useState<string>('5000');
    const [showGhostCreate, setShowGhostCreate] = useState(false);
    const [newGhostName, setNewGhostName] = useState('');
    const [isSubmittingRes, setIsSubmittingRes] = useState(false);

    useEffect(() => {
        if (activeSubTab === 'tournaments') {
            fetchReservations();
        } else if (activeSubTab === 'credits') {
            fetchCreditRequests();
            fetchOnlineWithdrawals();
        } else if (activeSubTab === 'withdrawals') {
            fetchWithdrawals();
        }
    }, [activeSubTab]);

    const fetchOnlineWithdrawals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('online_withdrawal_requests')
                .select('*, profiles(name, avatar_url, numeric_id)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOnlineWithdrawals(data || []);
        } catch (err) {
            console.error("Erro ao buscar resgates online:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessOnlineWithdrawal = async (id: string, action: 'complete' | 'cancel', amount?: number, userId?: string, playerNick?: string) => {
        const actionLabel = action === 'complete' ? 'AUTORIZAR E ADICIONAR SALDO' : 'CANCELAR';
        if (!window.confirm(`Confirma ${actionLabel} para este resgate de R$ ${(amount || 0).toFixed(2)}?`)) return;

        setIsLoading(true);
        try {
            if (action === 'complete') {
                // Adicionar saldo BRL ao usuário
                const { error: rpcErr } = await supabase.rpc('secure_balance_transaction', {
                    p_user_id: userId,
                    p_brl_amount: amount,
                    p_description: `Resgate de Fichas Suprema (Nick: ${playerNick})`,
                    p_category: 'deposit'
                });
                if (rpcErr) throw rpcErr;

                const { error } = await supabase.from('online_withdrawal_requests').update({ status: 'completed' }).eq('id', id);
                if (error) throw error;

                await supabase.from('audit_logs').insert({
                    admin_id: currentUser.id,
                    action_type: 'ONLINE_WITHDRAWAL_APPROVED',
                    description: `Admin aprovou resgate de R$ ${(amount || 0).toFixed(2)} (Nick: ${playerNick})`,
                    target_user_id: userId,
                    details: { request_id: id, amount }
                });

                alert("Resgate autorizado com sucesso! Saldo adicionado à carteira do jogador.");
            } else {
                const { error } = await supabase.from('online_withdrawal_requests').update({ status: 'cancelled' }).eq('id', id);
                if (error) throw error;
                alert("Pedido de resgate cancelado.");
            }
            fetchOnlineWithdrawals();
        } catch (err: any) {
            console.error("Erro ao processar resgate:", err);
            alert("Erro: " + (err.message || "Falha ao processar solicitação."));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select('*, profiles(name, avatar_url, numeric_id)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setWithdrawals(data || []);
        } catch (err) {
            console.error("Erro ao buscar saques:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessWithdrawal = async (id: string, action: 'completed' | 'rejected', amount?: number, userId?: string) => {
        const actionLabel = action === 'completed' ? 'MARCAR COMO FEITO (Aprovar)' : 'DECLINAR (Recusar e Estornar)';
        if (!window.confirm(`Tem certeza que deseja ${actionLabel} este saque?`)) return;

        setIsLoading(true);
        try {
            if (action === 'rejected') {
                // Devolver o saldo via RPC
                const { error: rpcErr } = await supabase.rpc('secure_balance_transaction', {
                    p_user_id: userId,
                    p_brl_amount: amount,
                    p_description: `Estorno de Saque Recusado`,
                    p_category: 'refund'
                });
                if (rpcErr) throw rpcErr;
            }

            const { error } = await supabase.from('withdrawal_requests').update({ status: action }).eq('id', id);
            if (error) throw error;

            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: action === 'completed' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
                description: `Admin ${action === 'completed' ? 'aprovou' : 'recusou'} saque de R$ ${(amount || 0).toFixed(2)}`,
                target_user_id: userId,
                details: { request_id: id, amount }
            });

            alert(`Saque ${action === 'completed' ? 'Aprovado' : 'Recusado/Estornado'} com sucesso!`);
            fetchWithdrawals();
        } catch (err: any) {
            console.error("Erro ao processar saque:", err);
            alert("Erro: " + (err.message || "Falha ao processar solicitação."));
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGICA NOVA RESERVA ---
    const handleSearchProfiles = async (query: string) => {
        setResSearchQuery(query);
        if (query.length < 2) { setResSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, role');
        if (isNumeric) q = q.eq('numeric_id', parseInt(query));
        else q = q.ilike('name', `%${query}%`);
        
        const { data } = await q.order('name', { ascending: true }).limit(8);
        setResSearchResults(data || []);
    };

    const handleCreateGhost = async () => {
        if (!newGhostName || newGhostName.length < 2) { alert('Nome inválido.'); return; }
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_ghost_user', { p_name: newGhostName });
            if (error) throw error;
            
            const { data: user } = await supabase.from('profiles').select('*').eq('id', data).single();
            if (user) {
                setResSelectedPlayer(user);
                setShowGhostCreate(false);
                setNewGhostName('');
                setResSearchQuery('');
                setResSearchResults([]);
                alert(`Jogador fantasma "${user.name}" criado com sucesso!`);
            }
        } catch (err: any) {
            alert('Erro ao criar ghost: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmManualReservation = async () => {
        if (!resSelectedPlayer) { alert('Selecione um jogador.'); return; }
        if (!resSelectedEventId) { alert('Selecione um evento.'); return; }
        
        const bonusAmount = parseInt(resBonusChips) || 0;
        if (bonusAmount > 15000) { alert('O bônus máximo permitido é de 15.000 fichas.'); return; }

        setIsSubmittingRes(true);
        try {
            const isOutsourced = resSelectedPlayer.role === 'ghost' || resSelectedPlayer.name.toLowerCase().includes('ghost');
            
            const { error } = await supabase.from('tournament_reservations').insert({
                event_id: resSelectedEventId,
                user_id: resSelectedPlayer.id,
                status: 'reserved',
                is_outsourced: isOutsourced,
                metadata: { 
                    manual_bonus_input: bonusAmount,
                    launched_by_admin_id: currentUser.id
                }
            });

            if (error) throw error;

            alert('Reserva lançada com sucesso!');
            setResSelectedPlayer(null);
            setResSelectedEventId('');
            setResBonusChips('5000');
            fetchReservations();
        } catch (err: any) {
            alert('Erro ao lançar reserva: ' + err.message);
        } finally {
            setIsSubmittingRes(false);
        }
    };

    const fetchReservations = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tournament_reservations')
                .select('*, profiles!user_id(id, name, numeric_id, avatar_url), events(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReservations(data || []);
        } catch (err) {
            console.error("Erro ao buscar reservas:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!window.confirm(`Deseja alterar o status desta reserva para ${newStatus}?`)) return;

        try {
            const { error } = await supabase
                .from('tournament_reservations')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert("Erro ao atualizar status da reserva.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir esta reserva?")) return;

        try {
            const { error } = await supabase
                .from('tournament_reservations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setReservations(prev => prev.filter(r => r.id !== id));
            if (refreshSupabaseData) await refreshSupabaseData();
            alert("Reserva excluída com sucesso.");
        } catch (err) {
            console.error("Erro ao excluir reserva:", err);
            alert("Erro ao excluir reserva.");
        }
    };

    const filteredReservations = reservations.filter(res => {
        // Event Filter
        if (eventFilter !== 'all' && res.event_id !== eventFilter) return false;

        // Status Filter
        const isClosed = res.events?.status === 'closed';
        if (statusFilter === 'upcoming' && isClosed) return false;
        if (statusFilter === 'completed' && !isClosed) return false;

        // NEW: Filter only 'site' related claims OR app-originated claims
        const isAppClaim = res.metadata?.source === 'app_bonus_claim';
        const hasSiteBonus = [1, 2, 3].some(tier => {
            const condition = res.events?.[`bonus${tier}_condition` as keyof Event] as string;
            return condition?.toLowerCase().includes('site') || condition?.toLowerCase().includes('garantir bonus');
        });

        // Also allow legacy/manual ones if explicitly marked with site compensation in metadata
        const isSiteCompensation = !!res.metadata?.extra_10k_compensation;
        const isManualLaunch = res.metadata?.manual_bonus_input !== undefined;

        return isAppClaim || hasSiteBonus || isSiteCompensation || isManualLaunch;
    });

    // --- CREDITS LOGIC ---
    const fetchCreditRequests = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('online_credit_requests')
                .select('*, profiles(name, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCreditRequests(data || []);
        } catch (err) {
            console.error("Erro ao buscar solicitações de crédito:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessCreditRequest = async (id: string, action: 'complete' | 'cancel') => {
        const actionLabel = action === 'complete' ? 'COMPLETAR (aprovar)' : 'CANCELAR (estornar)';
        if (!window.confirm(`Tem certeza que deseja ${actionLabel} este pedido? Essa ação deduzirá/estornará fundos e enviará notificação ao jogador.`)) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('process_online_credit_request', {
                p_request_id: id,
                p_action: action
            });

            if (error) throw error;

            if (data && data.success) {
                const req = creditRequests.find(r => r.id === id);
                await supabase.from('audit_logs').insert({
                    admin_id: currentUser.id,
                    action_type: action === 'complete' ? 'ONLINE_CREDIT_APPROVED' : 'ONLINE_CREDIT_REJECTED',
                    description: `Admin ${action === 'complete' ? 'aprovou' : 'recusou e estornou'} pedido de crédito online de R$ ${(req?.amount_brl || 0).toFixed(2)}`,
                    target_user_id: req?.user_id || null,
                    details: { request_id: id, action: action }
                });

                alert(`Pedido ${action === 'complete' ? 'Aprovado' : 'Cancelado (Estornado)'} com sucesso!`);
                fetchCreditRequests(); // Refresh data
            } else {
                throw new Error(data?.error || 'Erro desconhecido');
            }
        } catch (err: any) {
            console.error("Erro ao processar crédito:", err);
            alert("Erro: " + (err.message || "Falha ao processar solicitação."));
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCredits = creditRequests.filter(req => req.status === creditStatusFilter);

    // --- MERGE LOGIC ---
    const handleMergeSearch1 = async (query: string) => {
        setMergeSearchQuery1(query);
        if (query.length < 2) { setMergeSearchResults1([]); return; }

        try {
            const { data, error } = await supabase.rpc('search_profiles_extended', {
                search_query: query,
                filter_type: 'ghost'
            });
            if (error) throw error;
            setMergeSearchResults1(data || []);
        } catch (err) {
            console.error("Error searching ghost profiles:", err);
            // Fallback to basic search if RPC fails
            const isNumeric = /^\d+$/.test(query);
            let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, role, email');
            q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
            q = q.ilike('email', 'ghost_%@chiprace.com.br');
            const { data } = await q.order('name', { ascending: true }).limit(5);
            setMergeSearchResults1(data || []);
        }
    };

    const handleMergeSearch2 = async (query: string) => {
        setMergeSearchQuery2(query);
        if (query.length < 2) { setMergeSearchResults2([]); return; }

        try {
            const { data, error } = await supabase.rpc('search_profiles_extended', {
                search_query: query,
                filter_type: 'real'
            });
            if (error) throw error;
            setMergeSearchResults2(data || []);
        } catch (err) {
            console.error("Error searching real profiles:", err);
            // Fallback
            const isNumeric = /^\d+$/.test(query);
            let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, role, email');
            q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
            q = q.or('email.is.null,email.not.ilike.ghost_%');
            const { data } = await q.order('name', { ascending: true }).limit(5);
            setMergeSearchResults2(data || []);
        }
    };

    const handleMergeAccounts = async () => {
        if (!ghostAccount || !realAccount) { alert('Selecione as duas contas para mesclar.'); return; }
        if (ghostAccount.id === realAccount.id) { alert('Você selecionou a mesma conta duas vezes.'); return; }
        const confirmMsg = `ATENÇÃO! Você está prestes a transferir todo o histórico de:\n\n[FANTASMA] ${ghostAccount.name}\n\nPara a conta:\n\n[REAL] ${realAccount.name}\n\nO perfil fantasma será DELETADO PARA SEMPRE. Tem certeza?`;
        if (!window.confirm(confirmMsg)) return;

        setIsLoading(true);
        try {
            // First we need to check if both profiles exist in current database
            const { data, error } = await supabase.rpc('merge_player_accounts', {
                p_old_id: ghostAccount.id,
                p_new_id: realAccount.id
            });
            if (error) throw error;
            if (data && data.success === false) {
                if (data.error) throw new Error(data.error);
                throw new Error('Erro desconhecido ao mesclar contas. Verifique se a conta não é a sua ou um admin.');
            }

            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'ACCOUNT_MERGE',
                description: `Admin uniu a conta fantasma "${ghostAccount.name}" (ID: ${ghostAccount.numeric_id}) -> conta real "${realAccount.name}" (ID: ${realAccount.numeric_id})`,
                target_user_id: realAccount.id,
                details: { ghost_id: ghostAccount.id, real_id: realAccount.id }
            });

            alert('✅ Contas mescladas com sucesso!');
            await refreshSupabaseData();
            setGhostAccount(null);
            setRealAccount(null);
            setMergeSearchQuery1('');
            setMergeSearchQuery2('');
            setMergeSearchResults1([]);
            setMergeSearchResults2([]);
        } catch (err: any) {
            console.error('Merge error:', err);
            alert('Erro ao mesclar contas: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">support_agent</span>
                        Atendimento & Contas
                    </h3>
                    <p className="text-sm text-gray-500">Gerencie assentos, fichas online e mesclagem de contas.</p>
                </div>

                {/* SUB-TABS OVERRIDE */}
                <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveSubTab('tournaments')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'tournaments' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        Bônus & Reservas (Live)
                    </button>
                    <button
                        onClick={() => setActiveSubTab('credits')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'credits' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        Suprema Poker
                        {(creditRequests.filter(r => r.status === 'pending').length + onlineWithdrawals.filter(w => w.status === 'pending').length) > 0 && (
                            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {creditRequests.filter(r => r.status === 'pending').length + onlineWithdrawals.filter(w => w.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSubTab('withdrawals')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'withdrawals' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        Saques
                        {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {withdrawals.filter(w => w.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSubTab('merge')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'merge' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        Mesclar Contas
                    </button>
                </div>
            </div>

            {activeSubTab === 'tournaments' ? (
                <div className="flex flex-col gap-6">
                    {/* Painel de Lançamento de Reserva ADM */}
                    <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent p-6 rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-icons-outlined">add_task</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Lançamento de Bônus Manual</h3>
                                <p className="text-xs text-gray-400">Garantir bônus manualmente para jogadores presenciais ou captados via terceiros.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* Jogador */}
                            <div className="relative md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">1. Selecionar Jogador</label>
                                {resSelectedPlayer ? (
                                    <div className="flex items-center gap-3 bg-white/5 border border-primary/40 p-2.5 rounded-xl">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                                            <img src={resSelectedPlayer.avatar_url || 'https://ui-avatars.com/api/?name=' + resSelectedPlayer.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{resSelectedPlayer.name}</div>
                                            <div className="text-[10px] text-gray-500">ID: {resSelectedPlayer.numeric_id}</div>
                                        </div>
                                        <button onClick={() => setResSelectedPlayer(null)} className="text-gray-500 hover:text-red-500 p-1">
                                            <span className="material-icons-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={resSearchQuery}
                                            onChange={(e) => handleSearchProfiles(e.target.value)}
                                            placeholder="Buscar nome ou ID..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-gray-600"
                                        />
                                        <button 
                                            onClick={() => setShowGhostCreate(true)}
                                            className="absolute right-2 top-1.5 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Criar Novo Fantasma"
                                        >
                                            <span className="material-icons-outlined text-xl">person_add_alt_1</span>
                                        </button>

                                        {resSearchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
                                                {resSearchResults.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => { setResSelectedPlayer(p); setResSearchResults([]); setResSearchQuery(''); }}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                                                            <img src={p.avatar_url || 'https://ui-avatars.com/api/?name=' + p.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white leading-tight">{p.name}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold">ID: {p.numeric_id} • {p.role}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Evento */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">2. Selecionar Evento</label>
                                <select
                                    value={resSelectedEventId}
                                    onChange={(e) => setResSelectedEventId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                                >
                                    <option value="">Escolha um evento...</option>
                                    {events.filter(ev => 
                                        ev.status !== 'closed' && 
                                        (ev.type === 'live' || ev.type === 'online') && 
                                        (ev.gameMode === 'tournament' || (ev as any).game_mode === 'tournament')
                                    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Bônus */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">3. Fichas de Bônus</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={resBonusChips}
                                        onChange={(e) => setResBonusChips(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary pr-12 font-black text-yellow-500"
                                        placeholder="Ex: 5000"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase">FICHAS</span>
                                </div>
                            </div>

                            {/* Botão */}
                            <div className="md:col-span-1">
                                <button
                                    onClick={handleConfirmManualReservation}
                                    disabled={isSubmittingRes || !resSelectedPlayer || !resSelectedEventId}
                                    className="w-full h-[46px] bg-primary hover:bg-primary-dark disabled:bg-white/5 disabled:text-gray-600 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                                >
                                    {isSubmittingRes ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined text-sm">rocket_launch</span>
                                            Garantir Bônus
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Modal Criar Ghost Rápido */}
                        {showGhostCreate && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                                <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up">
                                    <h4 className="text-lg font-black text-white uppercase mb-1">Criar Perfil Fantasma</h4>
                                    <p className="text-xs text-gray-500 mb-6">Cria um usuário temporário para controle de comanda e reserva.</p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome do Jogador</label>
                                            <input
                                                type="text"
                                                autoFocus
                                                value={newGhostName}
                                                onChange={(e) => setNewGhostName(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
                                                placeholder="Ex: João da Silva (Ghost)"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => { setShowGhostCreate(false); setNewGhostName(''); }} className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                                            <button onClick={handleCreateGhost} disabled={!newGhostName || isLoading} className="flex-1 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Criar Perfil</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 md:w-40 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                            <option value="upcoming">Próximos Eventos</option>
                            <option value="completed">Eventos Concluídos</option>
                        </select>

                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 md:w-60 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                            <option value="all">Todos os Eventos</option>
                            {Array.from(new Set(reservations.map(r => r.event_id))).map(eventId => {
                                const event = events.find(e => e.id === eventId) || (reservations.find(r => r.event_id === eventId)?.events);
                                if (!event) return null;
                                return (
                                    <option key={eventId} value={eventId}>{event.title}</option>
                                );
                            })}
                        </select>

                        <button onClick={fetchReservations} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400">
                            <span className="material-icons-outlined text-sm">refresh</span>
                        </button>
                    </div>
                </div>
            ) : activeSubTab === 'credits' ? (
                <>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                onClick={() => setSupremaSubTab('buy')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${supremaSubTab === 'buy' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <span className="material-icons-outlined text-sm">shopping_cart</span>
                                Depósitos
                                {creditRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {creditRequests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setSupremaSubTab('withdraw')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${supremaSubTab === 'withdraw' ? 'bg-neon-pink/20 text-neon-pink shadow-sm shadow-neon-pink/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <span className="material-icons-outlined text-sm">payments</span>
                                Saques (Resgates)
                                {onlineWithdrawals.filter(w => w.status === 'pending').length > 0 && (
                                    <span className="bg-neon-pink text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {onlineWithdrawals.filter(w => w.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {supremaSubTab === 'buy' ? (
                                <select
                                    value={creditStatusFilter}
                                    onChange={(e) => setCreditStatusFilter(e.target.value as any)}
                                    className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 sm:w-48 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                                >
                                    <option value="pending">Aguardando Envio (Depósitos)</option>
                                    <option value="completed">Concluídos</option>
                                    <option value="cancelled">Estornados / Editados</option>
                                </select>
                            ) : (
                                <select
                                    value={onlineWithdrawalStatusFilter}
                                    onChange={(e) => setOnlineWithdrawalStatusFilter(e.target.value as any)}
                                    className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 sm:w-48 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                                >
                                    <option value="pending">Aguardando Recebimento (Saques)</option>
                                    <option value="completed">Concluídos</option>
                                    <option value="cancelled">Cancelados</option>
                                </select>
                            )}
                            <button onClick={() => supremaSubTab === 'buy' ? fetchCreditRequests() : fetchOnlineWithdrawals()} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400">
                                <span className="material-icons-outlined text-sm">refresh</span>
                            </button>
                        </div>
                    </div>
                </>
            ) : activeSubTab === 'withdrawals' ? (
                <>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={withdrawalStatusFilter}
                            onChange={(e) => setWithdrawalStatusFilter(e.target.value as any)}
                            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 sm:w-48 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                            <option value="pending">Pendentes</option>
                            <option value="completed">Concluídos</option>
                            <option value="rejected">Recusados (Estornados)</option>
                        </select>
                        <button onClick={fetchWithdrawals} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400">
                            <span className="material-icons-outlined text-sm">refresh</span>
                        </button>
                    </div>
                </>
            ) : null}

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeSubTab === 'tournaments' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jogador</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitado em</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Bônus & Vantagens</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td>
                                    </tr>
                                ) : filteredReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">Nenhuma reserva encontrada para este filtro.</td>
                                    </tr>
                                ) : (
                                    filteredReservations.map(res => (
                                        <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                            <td className="p-4 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden shrink-0">
                                                        {res.profiles?.avatar_url ? (
                                                            <img src={res.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-icons-outlined text-gray-400 w-full h-full flex items-center justify-center text-sm">person</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div 
                                                            className="flex items-center gap-2 group/name cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onSelectPlayer && onNavigate && res.profiles) {
                                                                    const profileData = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
                                                                    if (profileData && profileData.id) {
                                                                        const mappedPlayer = {
                                                                            id: profileData.id,
                                                                            name: profileData.name || 'Jogador',
                                                                            avatar: profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.name?.replace(' ', '+') || 'User'}&background=random`,
                                                                            numericId: profileData.numeric_id,
                                                                            rank: 0,
                                                                            points: 0
                                                                        };
                                                                        onSelectPlayer(mappedPlayer);
                                                                    } else {
                                                                        alert('Erro: Perfil do jogador não encontrado ou sem ID.');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white group-hover/name:text-primary transition-colors">{ (Array.isArray(res.profiles) ? res.profiles[0] : res.profiles)?.name || 'Desconhecido' }</span>
                                                            <span className="material-icons-outlined text-[10px] text-gray-400 opacity-0 group-hover/name:opacity-100 transition-all">open_in_new</span>
                                                            {res.is_outsourced && (
                                                                <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-purple-200 dark:border-purple-500/30 flex items-center gap-1" title="Lançado pelo Admin">
                                                                    <span className="material-icons-outlined text-[10px]">admin_panel_settings</span>
                                                                    Terceirizado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            {res.profiles?.numeric_id && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ID App: {res.profiles.numeric_id}</span>}

                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{res.events?.title || 'Evento não encontrado'}</div>
                                                {res.events?.date && <div className="text-xs text-gray-500">{new Date(res.events.date).toLocaleDateString('pt-BR')}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(res.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="p-4">
                                                {(() => {
                                                    const parseChips = (val: string | undefined | null) => {
                                                        if (!val) return 0;
                                                        const clean = val.toString().replace(/[^\d]/g, '');
                                                        return parseInt(clean) || 0;
                                                    };
                                                    
                                                    let bonusTotal = 0;
                                                    let bonusBreakdown = [];
                                                    
                                                    // Prioridade 1: Bônus Manual (Lançado pelo ADM na nova interface)
                                                    if (res.metadata?.manual_bonus_input !== undefined) {
                                                        bonusTotal = parseInt(res.metadata.manual_bonus_input);
                                                        bonusBreakdown.push(`+${bonusTotal.toLocaleString('pt-BR')} (Manual)`);
                                                    } 
                                                    // Prioridade 2: Novos Tiers de Bônus (Check if they are site-claimable)
                                                    else if (res.events?.bonus1_condition || res.events?.bonus2_condition || res.events?.bonus3_condition) {
                                                        [1, 2, 3].forEach(tier => {
                                                            const condition = res.events[`bonus${tier}_condition` as keyof Event] as string;
                                                            const stack = parseChips(res.events[`bonus${tier}_stack` as keyof Event] as string);
                                                            const addon = parseChips(res.events[`bonus${tier}_addon` as keyof Event] as string);
                                                            const extra = res.events[`bonus${tier}_extra` as keyof Event] as string;

                                                            if (condition?.toLowerCase().includes('site') || condition?.toLowerCase().includes('garantir bonus')) {
                                                                bonusTotal += (stack + addon);
                                                                if (stack > 0) bonusBreakdown.push(`+${stack.toLocaleString('pt-BR')} (Tier ${tier} Stack)`);
                                                                if (addon > 0) bonusBreakdown.push(`+${addon.toLocaleString('pt-BR')} (Tier ${tier} Addon)`);
                                                                if (extra) bonusBreakdown.push(`${extra} (T${tier})`);
                                                            }
                                                        });
                                                        
                                                        // Fallback to legacy fields if total is still 0
                                                        if (bonusTotal === 0) {
                                                            const eventStaff = parseChips(res.events?.staff_bonus_chips);
                                                            const eventTime = parseChips(res.events?.time_chip_chips);
                                                            const eventTAddon = parseChips(res.events?.time_chip_addon_chips);
                                                            bonusTotal = eventStaff + eventTime + eventTAddon;
                                                            if (eventStaff > 0) bonusBreakdown.push(`+${eventStaff.toLocaleString('pt-BR')} (Staff)`);
                                                            if (eventTime > 0) bonusBreakdown.push(`+${eventTime.toLocaleString('pt-BR')} (Time)`);
                                                            if (eventTAddon > 0) bonusBreakdown.push(`+${eventTAddon.toLocaleString('pt-BR')} (T.Addon)`);
                                                        }
                                                    }
                                                    // Prioridade 3: Lógica legada (para reservas antigas)
                                                    else {
                                                        const eventStaff = parseChips(res.events?.staff_bonus_chips);
                                                        const eventTime = parseChips(res.events?.time_chip_chips);
                                                        const eventTAddon = parseChips(res.events?.time_chip_addon_chips);
                                                        
                                                        if (res.is_outsourced) {
                                                            if (res.metadata?.extra_10k_compensation) {
                                                                bonusTotal = eventStaff + eventTime + eventTAddon + 10000;
                                                                if (eventStaff > 0) bonusBreakdown.push(`+${eventStaff.toLocaleString('pt-BR')} (Staff)`);
                                                                if (eventTime > 0) bonusBreakdown.push(`+${eventTime.toLocaleString('pt-BR')} (Time)`);
                                                                if (eventTAddon > 0) bonusBreakdown.push(`+${eventTAddon.toLocaleString('pt-BR')} (T.Addon)`);
                                                                bonusBreakdown.push("+10.000 (Compensação)");
                                                            } else {
                                                                bonusTotal = 5000;
                                                                bonusBreakdown.push("+5.000 (Admin)");
                                                            }
                                                        } else {
                                                            bonusTotal = eventStaff + eventTime + eventTAddon;
                                                            if (eventStaff > 0) bonusBreakdown.push(`+${eventStaff.toLocaleString('pt-BR')} (Staff)`);
                                                            if (eventTime > 0) bonusBreakdown.push(`+${eventTime.toLocaleString('pt-BR')} (Time)`);
                                                            if (eventTAddon > 0) bonusBreakdown.push(`+${eventTAddon.toLocaleString('pt-BR')} (T.Addon)`);
                                                        }
                                                    }
                                                    
                                                    if (bonusTotal === 0) return <div className="text-gray-500 text-xs italic">Sem bônus</div>;

                                                    return (
                                                        <div className="flex flex-col items-center justify-center p-2 bg-yellow-500/5 rounded-lg min-w-[120px] border border-yellow-500/10 shadow-sm relative overflow-hidden group/bonus">
                                                            {res.metadata?.source === 'app_bonus_claim' && (
                                                                <div className="absolute top-0 right-0 px-1 bg-yellow-500 text-black text-[7px] font-black uppercase tracking-tighter">APP</div>
                                                            )}
                                                            <div className="text-[15px] font-black text-yellow-500 mb-1">
                                                                +{bonusTotal.toLocaleString('pt-BR')}
                                                                <span className="text-[10px] ml-1 opacity-80 uppercase tracking-tighter">Bônus</span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 items-center opacity-70">
                                                                {bonusBreakdown.map((b, i) => (
                                                                    <span key={i} className="text-[9px] text-gray-400 font-bold uppercase tracking-tight leading-none">{b}</span>
                                                                ))}
                                                                {res.events?.time_chip_discount_brl && (
                                                                    <span className="text-[9px] text-green-500 font-black uppercase tracking-tight leading-none mt-1">
                                                                        Desc. R$ {res.events.time_chip_discount_brl}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={res.status}
                                                    onChange={(e) => handleUpdateStatus(res.id, e.target.value)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-full outline-none leading-none ${res.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        res.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        } border`}
                                                >
                                                    <option value="reserved">Reservado</option>
                                                    <option value="confirmed">Confirmado</option>
                                                    <option value="cancelled">Cancelado</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(res.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/5 rounded-lg hover:bg-red-500/10"
                                                    title="Excluir Reserva"
                                                >
                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : activeSubTab === 'credits' ? (
                        supremaSubTab === 'buy' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jogador</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dados Suprema</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor BRL</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ação do Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td>
                                        </tr>
                                    ) : filteredCredits.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum pedido encontrado.</td>
                                        </tr>
                                    ) : (
                                        filteredCredits.map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden shrink-0">
                                                            {req.profiles?.avatar_url ? (
                                                                <img src={req.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-icons-outlined text-gray-400 w-full h-full flex items-center justify-center text-sm">person</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{req.profiles?.name || 'Desconhecido'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{req.suprema_nickname}</div>
                                                    <div className="text-xs text-gray-500">ID: {req.suprema_user_id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">R$ {req.amount_brl.toFixed(2)}</span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleProcessCreditRequest(req.id, 'complete')}
                                                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                title="Marcar como enviado (Fichas enviadas no App)"
                                                            >
                                                                <span className="material-icons-outlined text-sm">check</span>
                                                                Já Enviei
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessCreditRequest(req.id, 'cancel')}
                                                                className="flex items-center gap-1 bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white dark:bg-white/10 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                title="Cancelar Pedido e Estornar BRL"
                                                            >
                                                                <span className="material-icons-outlined text-sm">close</span>
                                                                Recusar / Estornar
                                                            </button>
                                                        </div>
                                                    ) : req.status === 'completed' ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                            <span className="material-icons-outlined text-sm">check_circle</span>
                                                            Processado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                            <span className="material-icons-outlined text-sm">cancel</span>
                                                            Cancelado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jogador</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nick Suprema</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor do Resgate</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ação do Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td>
                                        </tr>
                                    ) : onlineWithdrawals.filter(w => w.status === onlineWithdrawalStatusFilter).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum resgate encontrado.</td>
                                        </tr>
                                    ) : (
                                        onlineWithdrawals.filter(w => w.status === onlineWithdrawalStatusFilter).map(req => (
                                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden shrink-0">
                                                            {req.profiles?.avatar_url ? (
                                                                <img src={req.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-icons-outlined text-gray-400 w-full h-full flex items-center justify-center text-sm">person</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{req.profiles?.name || 'Desconhecido'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-neon-pink">{req.suprema_nickname}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">R$ {req.amount_brl.toFixed(2)}</span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleProcessOnlineWithdrawal(req.id, 'complete', req.amount_brl, req.user_id, req.suprema_nickname)}
                                                                className="flex items-center gap-1 bg-neon-pink hover:bg-white text-white hover:text-neon-pink px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                title="Confirmar recebimento das fichas e liberar BRL no app"
                                                            >
                                                                <span className="material-icons-outlined text-sm">payments</span>
                                                                Autorizar
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessOnlineWithdrawal(req.id, 'cancel')}
                                                                className="flex items-center gap-1 bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white dark:bg-white/10 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                            >
                                                                <span className="material-icons-outlined text-sm">close</span>
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : req.status === 'completed' ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                            <span className="material-icons-outlined text-sm">check_circle</span>
                                                            Liberado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                            <span className="material-icons-outlined text-sm">cancel</span>
                                                            Cancelado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )
                    ) : activeSubTab === 'withdrawals' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jogador</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Chave PIX</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Saque</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ação do Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td>
                                    </tr>
                                ) : withdrawals.filter(w => w.status === withdrawalStatusFilter).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum saque encontrado.</td>
                                    </tr>
                                ) : (
                                    withdrawals.filter(w => w.status === withdrawalStatusFilter).map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden shrink-0">
                                                        {req.profiles?.avatar_url ? (
                                                            <img src={req.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-icons-outlined text-gray-400 w-full h-full flex items-center justify-center text-sm">person</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{req.profiles?.name || 'Desconhecido'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{req.pix_key}</div>
                                                <div className="text-xs text-gray-500 uppercase">{req.pix_type}</div>
                                                <div className="text-[10px] text-gray-400 mt-1">ID: {req.profiles?.numeric_id}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-black text-gray-900 dark:text-white">R$ {(req.amount_brl || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleProcessWithdrawal(req.id, 'completed', req.amount_brl, req.user_id)}
                                                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                            title="Marcar como enviado"
                                                        >
                                                            <span className="material-icons-outlined text-sm">check</span>
                                                            Já Enviei
                                                        </button>
                                                        <button
                                                            onClick={() => handleProcessWithdrawal(req.id, 'rejected', req.amount_brl, req.user_id)}
                                                            className="flex items-center gap-1 bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white dark:bg-white/10 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                            title="Recusar Saque e Estornar BRL"
                                                        >
                                                            <span className="material-icons-outlined text-sm">close</span>
                                                            Recusar / Estornar
                                                        </button>
                                                    </div>
                                                ) : req.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                        <span className="material-icons-outlined text-sm">check_circle</span>
                                                        Processado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                        <span className="material-icons-outlined text-sm">cancel</span>
                                                        Estornado
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : null}
                </div>
            </div>

            {activeSubTab === 'merge' && (
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-4xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons-outlined text-red-500 text-3xl">warning</span>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Fusão de Contas (Merge)</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                            Atenção: Esta ação transfere todo o histórico de jogo, créditos online, comandas e débitos da Conta A (Fantasma) para a Conta B (App). Após a transferência, a Conta A será <strong className="text-red-500">deletada permanentemente</strong>. Não pode ser desfeita.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
                        {/* Old / Ghost Account Column */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">1. Conta Antiga (Fantasma)</h3>
                            {!ghostAccount ? (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-outlined text-gray-400 text-sm">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar Perfil (Nome ou ID)"
                                        value={mergeSearchQuery1}
                                        onChange={(e) => handleMergeSearch1(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                                    />
                                    {mergeSearchResults1.length > 0 && (
                                        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                            {mergeSearchResults1.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => {
                                                        setGhostAccount(user);
                                                        setMergeSearchQuery1('');
                                                        setMergeSearchResults1([]);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                                                >
                                                    <img src={user.avatar_url || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=User&background=random'; }} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">ID: {user.numeric_id}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={ghostAccount.avatar_url || '/default-avatar.png'} alt="" className="w-12 h-12 rounded-full border-2 border-red-400 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=User&background=random'; }} />
                                        <div>
                                            <div className="text-sm font-black text-red-700 dark:text-red-400">{ghostAccount.name}</div>
                                            <div className="text-xs text-red-600/70 font-medium tracking-wide">ID: {ghostAccount.numeric_id}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setGhostAccount(null)} className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-red-600 rounded-full transition-colors">
                                        <span className="material-icons-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Middle Arrow for large screens, omitted on small screens */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 bg-white dark:bg-surface-dark border-4 border-gray-100 dark:border-black rounded-full z-10 shadow-sm text-gray-400">
                            <span className="material-icons-outlined">arrow_forward</span>
                        </div>
                        <div className="flex md:hidden items-center justify-center my-2 text-gray-400">
                            <span className="material-icons-outlined">arrow_downward</span>
                        </div>

                        {/* New / App Account Column */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">2. Conta Nova (Destino)</h3>
                            {!realAccount ? (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-outlined text-gray-400 text-sm">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar Perfil (Nome ou ID)"
                                        value={mergeSearchQuery2}
                                        onChange={(e) => handleMergeSearch2(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-green-500 focus:outline-none"
                                    />
                                    {mergeSearchResults2.length > 0 && (
                                        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                                            {mergeSearchResults2.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => {
                                                        setRealAccount(user);
                                                        setMergeSearchQuery2('');
                                                        setMergeSearchResults2([]);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                                                >
                                                    <img src={user.avatar_url || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=User&background=random'; }} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">ID: {user.numeric_id}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={realAccount.avatar_url || '/default-avatar.png'} alt="" className="w-12 h-12 rounded-full border-2 border-green-400 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=User&background=random'; }} />
                                        <div>
                                            <div className="text-sm font-black text-green-700 dark:text-green-400">{realAccount.name}</div>
                                            <div className="text-xs text-green-600/70 font-medium tracking-wide">ID: {realAccount.numeric_id}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setRealAccount(null)} className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/40 text-green-600 rounded-full transition-colors">
                                        <span className="material-icons-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleMergeAccounts}
                            disabled={!ghostAccount || !realAccount || isLoading}
                            className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${!ghostAccount || !realAccount || isLoading
                                ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                                : 'bg-primary hover:bg-white text-white hover:text-primary hover:shadow-neon-pink'
                                }`}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-icons-outlined">merge</span>
                                    Fundir Contas (Merge)
                                </>
                            )}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};
