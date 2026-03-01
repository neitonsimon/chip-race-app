import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Event, TournamentReservation, OnlineCreditRequest } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface ReservationsTabProps {
    events: Event[];
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ events }) => {
    const { currentUser } = useApp();
    const [activeSubTab, setActiveSubTab] = useState<'tournaments' | 'credits'>('tournaments');

    // Tournaments State
    const [reservations, setReservations] = useState<(TournamentReservation & { profiles: any, events: any })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'upcoming' | 'completed'>('upcoming');

    // Credits State
    const [creditRequests, setCreditRequests] = useState<(OnlineCreditRequest & { profiles?: { name: string, avatar_url: string } })[]>([]);
    const [creditStatusFilter, setCreditStatusFilter] = useState<'pending' | 'completed' | 'cancelled'>('pending');

    useEffect(() => {
        if (activeSubTab === 'tournaments') {
            fetchReservations();
        } else {
            fetchCreditRequests();
        }
    }, [activeSubTab]);

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
                p_action: action,
                p_admin_id: currentUser?.id
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">event_seat</span>
                        Solicitações & Reservas
                    </h3>
                    <p className="text-sm text-gray-500">Gerencie assentos e fichas online.</p>
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
            ) : (
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
                            <span className="material-icons-outlined text-sm">refresh</span>
                        </button>
                    </div>
                </>
            )}

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
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
};
