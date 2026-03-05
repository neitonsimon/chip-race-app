import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Event, TournamentReservation, OnlineCreditRequest } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface ReservationsTabProps {
    events: Event[];
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ events }) => {
    const { currentUser } = useApp();
    const [activeSubTab, setActiveSubTab] = useState<'tournaments' | 'credits' | 'merge' | 'withdrawals'>('tournaments');

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

    useEffect(() => {
        if (activeSubTab === 'tournaments') {
            fetchReservations();
        } else if (activeSubTab === 'credits') {
            fetchCreditRequests();
        } else if (activeSubTab === 'withdrawals') {
            fetchWithdrawals();
        }
    }, [activeSubTab]);

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
                    p_category: 'wallet_deposit'
                });
                if (rpcErr) throw rpcErr;
            }

            const { error } = await supabase.from('withdrawal_requests').update({ status: action }).eq('id', id);
            if (error) throw error;

            alert(`Saque ${action === 'completed' ? 'Aprovado' : 'Recusado/Estornado'} com sucesso!`);
            fetchWithdrawals();
        } catch (err: any) {
            console.error("Erro ao processar saque:", err);
            alert("Erro: " + (err.message || "Falha ao processar solicitação."));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReservations = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tournament_reservations')
                .select('*, profiles(name, numeric_id, avatar_url), events(id, title, date, status)')
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
        } catch (err) {
            console.error("Erro ao excluir reserva:", err);
            alert("Erro ao excluir reserva.");
        }
    };

    const filteredReservations = reservations.filter(res => {
        if (eventFilter !== 'all' && res.event_id !== eventFilter) return false;

        const isClosed = res.events?.status === 'closed';
        if (statusFilter === 'upcoming' && isClosed) return false;
        if (statusFilter === 'completed' && !isClosed) return false;

        return true;
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
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, role');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setMergeSearchResults1(data || []);
    };

    const handleMergeSearch2 = async (query: string) => {
        setMergeSearchQuery2(query);
        if (query.length < 2) { setMergeSearchResults2([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, role');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setMergeSearchResults2(data || []);
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

            alert('✅ Contas mescladas com sucesso!');
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
                        Torneios Físicos
                    </button>
                    <button
                        onClick={() => setActiveSubTab('credits')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'credits' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        Suprema Poker
                        {creditRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {creditRequests.filter(r => r.status === 'pending').length}
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
                <>
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
                            {Array.from(new Set(reservations.filter(r => (statusFilter === 'upcoming' ? r.events?.status !== 'closed' : r.events?.status === 'closed')).map(r => r.event_id))).map(eventId => {
                                const event = events.find(e => e.id === eventId) || reservations.find(r => r.event_id === eventId)?.events;
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
                </>
            ) : activeSubTab === 'credits' ? (
                <>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={creditStatusFilter}
                            onChange={(e) => setCreditStatusFilter(e.target.value as any)}
                            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 sm:w-48 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                            <option value="pending">Aguardando Envio</option>
                            <option value="completed">Concluídos</option>
                            <option value="cancelled">Estornados / Editados</option>
                        </select>
                        <button onClick={fetchCreditRequests} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400">
                        </button>
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
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data da Reserva</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td>
                                    </tr>
                                ) : filteredReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma reserva encontrada para este filtro.</td>
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
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{res.profiles?.name || 'Desconhecido'}</div>
                                                        {res.profiles?.numeric_id && <div className="text-xs text-gray-500">ID: {res.profiles.numeric_id}</div>}
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
