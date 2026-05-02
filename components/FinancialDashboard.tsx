import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { ClubTransaction, RankingPlayer } from '../types';

interface FinancialDashboardProps {
    currentUser: RankingPlayer;
    onClose: () => void;
    isAdmin: boolean;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ currentUser, onClose, isAdmin }) => {
    const [transactions, setTransactions] = useState<ClubTransaction[]>([]);
    const [totalDebts, setTotalDebts] = useState<number>(0);
    const [totalAppBalance, setTotalAppBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [category, setCategory] = useState('outros');
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit states
    const [editingTransaction, setEditingTransaction] = useState<ClubTransaction | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const categories = [
        { id: 'evento', label: 'Fechamento de Evento' },
        { id: 'recarga_app', label: 'Recarga de Saldo no App' },
        { id: 'saque_app', label: 'Saque de Saldo do App' },
        { id: 'pendura', label: 'Recebimento de Pendura' },
        { id: 'marketing', label: 'Marketing (Ads, Impulsionamento)' },
        { id: 'aluguel', label: 'Aluguel' },
        { id: 'aporte_capital', label: 'Aporte de Capital (Sócios)' },
        { id: 'quebra_caixa', label: 'Correção / Quebra de Caixa' },
        { id: 'retirada_socios', label: 'Retirada de Sócios / Sangria' },
        { id: 'pagamento_staff', label: 'Pagamento de Staff' },
        { id: 'outros', label: 'Outros' }
    ];

    const paymentMethods = [
        { id: 'pix', label: 'PIX' },
        { id: 'dinheiro', label: 'Dinheiro (Espécie)' },
        { id: 'cartao', label: 'Cartão (Crédito/Débito)' },
        { id: 'transferencia', label: 'Transferência Bancária' },
    ];

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Transactions
            const { data: txData, error: txError } = await supabase
                .from('club_transactions')
                .select('id, amount_brl, type, category, description, payment_method, admin_id, created_at')
                .order('created_at', { ascending: false })
                .limit(500);

            if (txError) throw txError;
            setTransactions(txData || []);

            // Fetch App Liabilities (Sum of all user balances)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('balance_brl');
            
            if (profilesError) throw profilesError;
            const liability = profilesData?.reduce((acc, p) => acc + Number(p.balance_brl || 0), 0) || 0;
            setTotalAppBalance(liability);

            // Fetch Active Debts (Sum of all pending debts)
            const { data: debtsData, error: debtsError } = await supabase
                .from('debts')
                .select('amount_brl')
                .eq('status', 'pending');
            
            if (debtsError) throw debtsError;
            const activeDebts = debtsData?.reduce((acc, d) => acc + Number(d.amount_brl || 0), 0) || 0;
            setTotalDebts(activeDebts);

        } catch (error) {
            console.error('Error fetching financial data:', error);
            alert('Erro ao carregar dados financeiros.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0 || !description.trim()) {
            alert('Preencha um valor válido e uma descrição.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('club_transactions')
                .insert([{
                    amount_brl: Number(amount),
                    type,
                    category,
                    description: description.trim(),
                    payment_method: paymentMethod,
                    admin_id: currentUser.id
                }]);

            if (error) throw error;

            alert('Lançamento registrado com sucesso!');
            setAmount('');
            setDescription('');
            fetchData();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Erro ao registrar lançamento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Deseja realmente excluir este lançamento? Esta ação não pode ser desfeita.')) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('club_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Erro ao deletar lançamento.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEditClick = (tx: ClubTransaction) => {
        setEditingTransaction(tx);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('club_transactions')
                .update({
                    amount_brl: Number(editingTransaction.amount_brl),
                    type: editingTransaction.type,
                    category: editingTransaction.category,
                    description: editingTransaction.description.trim(),
                    payment_method: editingTransaction.payment_method
                })
                .eq('id', editingTransaction.id);

            if (error) throw error;

            alert('Lançamento atualizado com sucesso!');
            setEditingTransaction(null);
            fetchData();
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Erro ao atualizar lançamento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-red-500 font-bold">Acesso restrito a administradores.</p>
            </div>
        );
    }

    const currentCash = transactions.reduce((acc, tx) => {
        return acc + (tx.type === 'credit' ? Number(tx.amount_brl) : -Number(tx.amount_brl));
    }, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-icons-outlined text-green-400 text-4xl">account_balance</span>
                        Caixa Geral
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Visão centralizada e controle do fluxo bancário e gavetas.</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5"
                >
                    <span className="material-icons-outlined text-sm">arrow_back</span>
                    Voltar
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dashboard Cards (Left Column - 1 part) */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Capital em Caixa */}
                        <div className="bg-gradient-to-br from-[#0a061d] to-black border border-green-500/30 p-5 rounded-2xl shadow-[0_0_30px_rgba(74,222,128,0.1)]">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Capital Total (Caixa + Banco)</h3>
                            <div className={`text-4xl font-black ${currentCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                R$ {currentCash.toFixed(2)}
                            </div>
                        </div>

                        {/* Passivo do App */}
                        <div className="bg-gradient-to-br from-[#0a061d] to-black border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Passivo do App (Saldos)</h3>
                            <div className="text-2xl font-black text-white">
                                R$ {totalAppBalance.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Dívida da casa com jogadores.</div>
                            <span className="material-icons-outlined absolute -bottom-4 -right-4 text-6xl text-white/5 group-hover:scale-110 transition-transform">account_balance_wallet</span>
                        </div>

                        {/* Ativo na Praça */}
                        <div className="bg-gradient-to-br from-[#0a061d] to-black border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Ativo na Praça (Penduras)</h3>
                            <div className="text-2xl font-black text-yellow-400">
                                R$ {totalDebts.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Valores a receber de jogadores.</div>
                            <span className="material-icons-outlined absolute -bottom-4 -right-4 text-6xl text-white/5 group-hover:scale-110 transition-transform">receipt_long</span>
                        </div>
                    </div>

                    {/* Operational Area (Right Column - 2 parts) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Manual Entry Form */}
                        <div className="bg-surface-dark border border-white/10 p-5 rounded-2xl">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">add_circle</span>
                                Novo Lançamento Manual
                            </h2>

                            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Tipo da Operação</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setType('credit')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                                                type === 'credit' 
                                                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                                : 'bg-black/30 text-gray-500 border-white/5 hover:bg-white/5'
                                            }`}
                                        >
                                            ENTRADA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('debit')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                                                type === 'debit' 
                                                ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                                                : 'bg-black/30 text-gray-500 border-white/5 hover:bg-white/5'
                                            }`}
                                        >
                                            SAÍDA
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-surface-dark">{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Forma de Pagamento</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method.id} value={method.id} className="bg-surface-dark">{method.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Ex: Compra de 100 copos plásticos..."
                                    />
                                </div>

                                <div className="sm:col-span-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-accent text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Registrando...' : 'Registrar Lançamento'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Recent Transactions Table */}
                        <div className="bg-surface-dark border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <h3 className="text-white font-bold">Extrato Recente</h3>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Nenhum lançamento encontrado.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {transactions.map(tx => (
                                            <div key={tx.id} className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                        tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'
                                                    }`}>
                                                        <span className="material-icons-outlined text-sm">
                                                            {tx.type === 'credit' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-bold">{tx.description}</p>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <p className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full uppercase">
                                                                {categories.find(c => c.id === tx.category)?.label || tx.category}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">
                                                                {new Date(tx.created_at).toLocaleString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right pl-11 sm:pl-0">
                                                        <p className={`font-black tracking-wide ${
                                                            tx.type === 'credit' ? 'text-green-400' : 'text-red-500'
                                                        }`}>
                                                            {tx.type === 'credit' ? '+' : '-'} R$ {Number(tx.amount_brl).toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 uppercase mt-0.5">
                                                            {paymentMethods.find(p => p.id === tx.payment_method)?.label || tx.payment_method}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Edit/Delete Buttons */}
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleEditClick(tx)}
                                                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all text-gray-400 hover:text-primary"
                                                            title="Editar"
                                                        >
                                                            <span className="material-icons-outlined text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteTransaction(tx.id)}
                                                            disabled={isDeleting === tx.id}
                                                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-all text-gray-400 hover:text-red-500 disabled:opacity-30"
                                                            title="Excluir"
                                                        >
                                                            <span className={`material-icons-outlined text-sm ${isDeleting === tx.id ? 'animate-spin' : ''}`}>
                                                                {isDeleting === tx.id ? 'refresh' : 'delete'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#0f0a28] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <h3 className="text-white font-black uppercase text-lg flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">edit</span>
                                Editar Lançamento
                            </h3>
                            <button 
                                onClick={() => setEditingTransaction(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveEdit} className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Tipo da Operação</label>
                                    <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setEditingTransaction({...editingTransaction, type: 'credit'})}
                                            className={`flex-1 py-2 px-3 rounded-lg font-black text-[10px] transition-all ${
                                                editingTransaction.type === 'credit' 
                                                ? 'bg-green-500/20 text-green-400 shadow-neon-emerald' 
                                                : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            ENTRADA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTransaction({...editingTransaction, type: 'debit'})}
                                            className={`flex-1 py-2 px-3 rounded-lg font-black text-[10px] transition-all ${
                                                editingTransaction.type === 'debit' 
                                                ? 'bg-red-500/20 text-red-500 shadow-neon-pink' 
                                                : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            SAÍDA
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editingTransaction.amount_brl}
                                        onChange={(e) => setEditingTransaction({...editingTransaction, amount_brl: Number(e.target.value)})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                                    <select
                                        value={editingTransaction.category}
                                        onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none text-sm font-bold"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-[#0f0a28]">{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Forma de Pagamento</label>
                                    <select
                                        value={editingTransaction.payment_method}
                                        onChange={(e) => setEditingTransaction({...editingTransaction, payment_method: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none text-sm font-bold"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method.id} value={method.id} className="bg-[#0f0a28]">{method.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingTransaction.description}
                                        onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                        placeholder="Ex: Compra de 100 copos plásticos..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingTransaction(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition-all border border-white/10"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-primary hover:bg-accent text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition-all shadow-neon-pink disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
