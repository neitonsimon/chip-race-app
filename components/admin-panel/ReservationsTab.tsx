import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Event, TournamentReservation } from '../../types';

interface ReservationsTabProps {
    events: Event[];
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ events }) => {
    const [reservations, setReservations] = useState<(TournamentReservation & { profiles: any, events: any })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'upcoming' | 'completed'>('upcoming');

    useEffect(() => {
        fetchReservations();
    }, []);

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">event_seat</span>
                        Gestão de Reservas
                    </h3>
                    <p className="text-sm text-gray-500">Acompanhe as reservas antecipadas de torneios.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 md:w-40"
                    >
                        <option value="upcoming">Próximos Eventos</option>
                        <option value="completed">Eventos Concluídos</option>
                    </select>

                    <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary flex-1 md:w-60"
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
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
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
                </div>
            </div>
        </div>
    );
};
