import React from 'react';
import { Event } from '../../types';

interface DebtsTabProps {
    activeDebts: any[];
    totalActiveDebt: number;
    debtSearchQuery: string;
    setDebtSearchQuery: (q: string) => void;
    debtSearchResults: any[];
    setDebtSearchResults: (res: any[]) => void;
    showNewDebtForm: boolean;
    setShowNewDebtForm: (s: boolean) => void;
    newDebtData: any;
    setNewDebtData: (d: any) => void;
    events: Event[];
    isAdmin: boolean;
    isLoading: boolean;
    handleDebtSearch: (query: string) => Promise<void>;
    handleRegisterDebt: () => Promise<void>;
    handleSettleDebt: (debt: any, type: 'balance' | 'manual') => Promise<void>;
}

export const DebtsTab: React.FC<DebtsTabProps> = ({
    activeDebts, totalActiveDebt, debtSearchQuery, setDebtSearchQuery,
    debtSearchResults, setDebtSearchResults, showNewDebtForm, setShowNewDebtForm,
    newDebtData, setNewDebtData, events, isAdmin, isLoading,
    handleDebtSearch, handleRegisterDebt, handleSettleDebt
}) => {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-2xl">
                        <span className="material-icons-outlined text-red-500 text-3xl">receipt_long</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Controle de Penduras</h3>
                        <p className="text-gray-400 text-sm">Gerencie débitos ativos e baixas manuais dos jogadores.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-3 text-center">
                        <p className="text-[10px] text-red-400 font-black uppercase mb-1">Total a Receber</p>
                        <p className="text-2xl font-display font-black text-white">R$ {totalActiveDebt.toFixed(2)}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowNewDebtForm(true)}
                            className="bg-white hover:bg-red-500 hover:text-white text-black font-black px-6 py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[10px] flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">add_circle</span> Novo Débito
                        </button>
                    )}
                </div>
            </div>

            {showNewDebtForm && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">edit_note</span> Registrar Débito Manual
                        </h4>
                        <button onClick={() => setShowNewDebtForm(false)} className="text-gray-500 hover:text-white transition-colors">
                            <span className="material-icons-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Jogador (Nome ou CR#)</label>
                            <input
                                type="text"
                                value={debtSearchQuery}
                                onChange={e => handleDebtSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500"
                            />
                            {debtSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0a28] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">
                                    {debtSearchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setNewDebtData({ ...newDebtData, userId: u.id, name: u.name });
                                                setDebtSearchQuery(u.name);
                                                setDebtSearchResults([]);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 text-left border-b border-white/5 last:border-0"
                                        >
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="text-xs font-bold text-white">{u.name}</p>
                                                <p className="text-[10px] text-primary font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Valor do Débito (R$)</label>
                            <input
                                type="number"
                                value={newDebtData.amount}
                                onChange={e => setNewDebtData({ ...newDebtData, amount: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black focus:border-red-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Evento Destino</label>
                            <select
                                value={newDebtData.eventId}
                                onChange={e => setNewDebtData({ ...newDebtData, eventId: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-red-500 outline-none"
                            >
                                <option value="">Selecionar Evento</option>
                                <option value="online_credit">CRÉDITO ONLINE</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleRegisterDebt}
                                disabled={isLoading || !newDebtData.userId || !newDebtData.amount}
                                className="w-full bg-red-500 hover:bg-white hover:text-red-500 text-white font-black py-3 rounded-xl transition-all shadow-lg uppercase text-[10px] tracking-widest disabled:opacity-50"
                            >
                                {isLoading ? 'SALVANDO...' : 'LANÇAR DÉBITO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Jogador</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Origem</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Data</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {activeDebts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-gray-600 italic">
                                    <span className="material-icons-outlined text-4xl block mb-2 opacity-20">sentiment_satisfied</span>
                                    Nenhuma pendênia ativa no momento.
                                </td>
                            </tr>
                        ) : activeDebts.map(debt => (
                            <tr key={debt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={debt.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${debt.profiles?.name}&background=random`} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <p className="text-white font-bold">{debt.profiles?.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">CR#{String(debt.profiles?.numeric_id).padStart(3, '0')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-gray-400">
                                        {debt.events?.title || debt.description || 'Crédito Manual'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-400 text-xs">
                                    {new Date(debt.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-red-400 font-display font-black text-base">R$ {Number(debt.amount_brl).toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleSettleDebt(debt, 'balance')}
                                            disabled={isLoading}
                                            className="px-3 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[9px] font-black uppercase transition-all border border-primary/20"
                                            title="Pagar com Saldo Atual"
                                        >
                                            SALDO R$
                                        </button>
                                        <button
                                            onClick={() => handleSettleDebt(debt, 'manual')}
                                            disabled={isLoading}
                                            className="px-3 py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all border border-green-500/20"
                                            title="Baixa Manual (Dinheiro/Pix)"
                                        >
                                            BAIXA PIX
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
