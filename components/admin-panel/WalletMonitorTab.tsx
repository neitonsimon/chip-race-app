import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../src/lib/supabase';

interface Transaction {
    id: string;
    user_id: string;
    amount_brl: number;
    amount_chipz: number;
    description: string;
    category: string;
    created_at: string;
    profiles?: { name: string; numeric_id: number; avatar_url: string };
}

interface UserBalance {
    id: string;
    name: string;
    numeric_id: number;
    avatar_url: string;
    balance_brl: number;
    balance_chipz: number;
    total_pending_debt: number;
}

type SubView = 'transactions' | 'balances';

const categoryIcon: Record<string, string> = {
    gift: 'card_giftcard',
    vip: 'diamond',
    chipz: 'token',
    chipz_purchase: 'token',
    wallet_deposit: 'account_balance_wallet',
    purchase: 'point_of_sale',
    command_charge: 'point_of_sale',
    debt_payment: 'receipt_long',
    system: 'settings',
    tournament: 'emoji_events',
    default: 'swap_horiz',
};

const categoryColor: Record<string, string> = {
    gift: 'text-yellow-400',
    vip: 'text-purple-400',
    chipz: 'text-primary',
    chipz_purchase: 'text-primary',
    wallet_deposit: 'text-green-400',
    purchase: 'text-red-400',
    command_charge: 'text-red-400',
    debt_payment: 'text-orange-400',
    system: 'text-gray-400',
    tournament: 'text-blue-400',
    default: 'text-white',
};

export const WalletMonitorTab: React.FC = () => {
    const [subView, setSubView] = useState<SubView>('transactions');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [txSearchQuery, setTxSearchQuery] = useState('');
    const [txCategoryFilter, setTxCategoryFilter] = useState('all');
    const [balanceSearch, setBalanceSearch] = useState('');
    const [balanceSortBy, setBalanceSortBy] = useState<'name' | 'brl' | 'chipz' | 'debt'>('brl');
    const [txLimit, setTxLimit] = useState(50);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*, profiles(name, numeric_id, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(txLimit);
            if (error) {
                console.error('Supabase error fetching transactions:', error);
            }
            if (data) {
                console.log('Transactions Data:', data.length);
                // Include all transactions, including cash/pix
                setTransactions(data as any);
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Network or Parse error fetching transactions:', err);
        } finally {
            setIsLoading(false);
        }
    }, [txLimit]);

    const fetchUserBalances = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, name, numeric_id, avatar_url, balance_brl, balance_chipz, total_pending_debt')
                .order('balance_brl', { ascending: false });
            if (data) setUserBalances(data as any);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching balances:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (subView === 'transactions') fetchTransactions();
        else fetchUserBalances();
    }, [subView, fetchTransactions, fetchUserBalances]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('wallet-monitor')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                if (subView === 'transactions') fetchTransactions();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
                if (subView === 'balances') fetchUserBalances();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [subView, fetchTransactions, fetchUserBalances]);

    // Derived
    const filteredTx = transactions.filter(tx => {
        const matchCat = txCategoryFilter === 'all' || tx.category === txCategoryFilter;
        const matchSearch = !txSearchQuery || (
            tx.profiles?.name?.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
            tx.description?.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
            tx.profiles?.numeric_id?.toString().includes(txSearchQuery)
        );
        return matchCat && matchSearch;
    });

    const filteredBalances = userBalances
        .filter(u => !balanceSearch || u.name?.toLowerCase().includes(balanceSearch.toLowerCase()) || u.numeric_id?.toString().includes(balanceSearch))
        .sort((a, b) => {
            if (balanceSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (balanceSortBy === 'brl') return Number(b.balance_brl) - Number(a.balance_brl);
            if (balanceSortBy === 'chipz') return Number(b.balance_chipz) - Number(a.balance_chipz);
            if (balanceSortBy === 'debt') return Number(b.total_pending_debt) - Number(a.total_pending_debt);
            return 0;
        });

    const totalBrl = filteredBalances.reduce((s, u) => s + Number(u.balance_brl || 0), 0);
    const totalChipz = filteredBalances.reduce((s, u) => s + Number(u.balance_chipz || 0), 0);
    const totalDebt = filteredBalances.reduce((s, u) => s + Number(u.total_pending_debt || 0), 0);
    const availableCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

    const fmtTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">monitoring</span>
                        Monitor de Carteiras
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase font-black mt-0.5">
                        {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR')}` : 'Carregando...'}
                        {subView === 'transactions' && (
                            <span className="ml-3 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block"></span>
                                <span className="hidden xs:inline">TEMPO REAL</span>
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                    {/* Sub-view tabs */}
                    <div className="flex bg-black/30 border border-white/10 rounded-xl p-1 gap-1 flex-1 sm:flex-none">
                        <button
                            onClick={() => setSubView('transactions')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${subView === 'transactions' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-500 hover:text-white'}`}
                        >
                            <span className="material-icons-outlined text-xs sm:text-sm">swap_horiz</span>
                            <span>Transações</span>
                        </button>
                        <button
                            onClick={() => setSubView('balances')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${subView === 'balances' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-500 hover:text-white'}`}
                        >
                            <span className="material-icons-outlined text-xs sm:text-sm">account_balance_wallet</span>
                            <span>Saldos</span>
                        </button>
                    </div>
                    <button
                        onClick={() => subView === 'transactions' ? fetchTransactions() : fetchUserBalances()}
                        disabled={isLoading}
                        className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all shrink-0"
                    >
                        <span className={`material-icons-outlined text-sm text-gray-400 ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </div>

            {/* ============== TRANSACTIONS VIEW ============== */}
            {subView === 'transactions' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                            <span className="material-icons-outlined text-gray-500 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Buscar jogador ou descrição..."
                                value={txSearchQuery}
                                onChange={e => setTxSearchQuery(e.target.value)}
                                className="bg-transparent text-sm text-white outline-none flex-1 placeholder-gray-600"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={txCategoryFilter}
                                onChange={e => setTxCategoryFilter(e.target.value)}
                                className="flex-1 sm:flex-none bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white outline-none min-w-[120px]"
                            >
                                <option value="all">Categorias</option>
                                {availableCategories.map(c => (
                                    <option key={c} value={c}>{String(c).toUpperCase().replace('_', ' ')}</option>
                                ))}
                            </select>
                            <select
                                value={txLimit}
                                onChange={e => { setTxLimit(Number(e.target.value)); }}
                                className="flex-1 sm:flex-none bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white outline-none"
                            >
                                <option value={50}>50 un</option>
                                <option value={100}>100 un</option>
                                <option value={200}>200 un</option>
                                <option value={500}>500 un</option>
                            </select>
                        </div>
                    </div>

                    {/* Summary Pills */}
                    {filteredTx.length > 0 && (
                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                {
                                    icon: 'add_circle', label: 'Créditos BRL',
                                    val: `R$ ${filteredTx.filter(t => Number(t.amount_brl) > 0).reduce((s, t) => s + Number(t.amount_brl), 0).toFixed(2)}`,
                                    color: 'text-green-400', bg: 'border-green-500/20 bg-green-500/5'
                                },
                                {
                                    icon: 'remove_circle', label: 'Débitos BRL',
                                    val: `R$ ${Math.abs(filteredTx.filter(t => Number(t.amount_brl) < 0).reduce((s, t) => s + Number(t.amount_brl), 0)).toFixed(2)}`,
                                    color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5'
                                },
                                {
                                    icon: 'token', label: 'Chipz Creditados',
                                    val: `${filteredTx.filter(t => Number(t.amount_chipz) > 0).reduce((s, t) => s + Number(t.amount_chipz), 0).toLocaleString('pt-BR')}`,
                                    color: 'text-primary', bg: 'border-primary/20 bg-primary/5'
                                },
                                {
                                    icon: 'receipt_long', label: 'Transações',
                                    val: filteredTx.length,
                                    color: 'text-white', bg: 'border-white/10 bg-white/5'
                                },
                            ].map(c => (
                                <div key={c.label} className={`border rounded-2xl p-3 ${c.bg}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`material-icons-outlined text-sm ${c.color}`}>{c.icon}</span>
                                        <p className="text-[9px] text-gray-500 uppercase font-black">{c.label}</p>
                                    </div>
                                    <p className={`text-base sm:text-lg font-display font-black ${c.color}`}>{c.val}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Transaction Table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Feed de Transações
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-black">{filteredTx.length} registros</span>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 text-xs">Carregando...</p>
                                </div>
                            </div>
                        ) : filteredTx.length === 0 ? (
                            <div className="py-16 text-center text-gray-600">
                                <span className="material-icons-outlined text-4xl opacity-20 block mb-2">swap_horiz</span>
                                <p className="text-sm italic">Nenhuma transação encontrada.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <table className="w-full text-xs min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-black/40">
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Data/Hora</th>
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Jogador</th>
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Descrição</th>
                                            <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase">Categoria</th>
                                            <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase">BRL</th>
                                            <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase">Chipz</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTx.map((tx, idx) => {
                                            const brl = Number(tx.amount_brl || 0);
                                            const chipz = Number(tx.amount_chipz || 0);
                                            const icon = categoryIcon[tx.category] || categoryIcon.default;
                                            const color = categoryColor[tx.category] || categoryColor.default;
                                            return (
                                                <tr key={tx.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx === 0 ? 'bg-green-500/5' : ''}`}>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-gray-400 font-mono">{fmtTime(tx.created_at)}</span>
                                                        {idx === 0 && <span className="ml-2 text-[8px] font-black text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full uppercase">NOVO</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {tx.profiles?.avatar_url ? (
                                                                <img src={tx.profiles.avatar_url} className="w-6 h-6 rounded-full border border-white/10 object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                                    <span className="material-icons-outlined text-[10px] text-primary">person</span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-white font-bold">{tx.profiles?.name || '—'}</p>
                                                                <p className="text-[9px] text-gray-600">#{tx.profiles?.numeric_id || '?'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[200px]">
                                                        <p className="text-gray-300 truncate" title={tx.description}>{tx.description || '—'}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${color} font-black text-[9px] uppercase`}>
                                                            <span className="material-icons-outlined text-[10px]">{icon}</span>
                                                            {String(tx.category || 'tx').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-display font-black">
                                                        {brl !== 0 ? (
                                                            <span className={brl > 0 ? 'text-green-400' : 'text-red-400'}>
                                                                {brl > 0 ? '+' : ''}R$ {brl.toFixed(2)}
                                                            </span>
                                                        ) : <span className="text-gray-700">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-display font-black">
                                                        {chipz !== 0 ? (
                                                            <span className={chipz > 0 ? 'text-primary' : 'text-red-400'}>
                                                                {chipz > 0 ? '+' : ''}{chipz.toLocaleString('pt-BR')}
                                                            </span>
                                                        ) : <span className="text-gray-700">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============== BALANCES VIEW ============== */}
            {subView === 'balances' && (
                <div className="space-y-4">
                    {/* Search & Sort */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                            <span className="material-icons-outlined text-gray-500 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Buscar jogador..."
                                value={balanceSearch}
                                onChange={e => setBalanceSearch(e.target.value)}
                                className="bg-transparent text-sm text-white outline-none flex-1 placeholder-gray-600"
                            />
                        </div>
                        <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none items-center gap-1 bg-black/30 border border-white/10 rounded-xl p-1">
                            {[
                                { key: 'brl', label: 'R$', icon: 'account_balance_wallet' },
                                { key: 'chipz', label: 'Chipz', icon: 'token' },
                                { key: 'debt', label: 'Débito', icon: 'receipt_long' },
                                { key: 'name', label: 'Nome', icon: 'sort_by_alpha' },
                            ].map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setBalanceSortBy(s.key as any)}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${balanceSortBy === s.key ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <span className="material-icons-outlined text-[10px]">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grand Total Summary */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { icon: 'account_balance_wallet', label: 'R$ em Circulação', val: `R$ ${totalBrl.toFixed(2)}`, color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/5', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' },
                            { icon: 'token', label: 'Chipz em Circulação', val: totalChipz.toLocaleString('pt-BR'), color: 'text-primary', bg: 'border-primary/30 bg-primary/5', glow: 'shadow-[0_0_20px_rgba(217,0,255,0.15)]' },
                            { icon: 'receipt_long', label: 'Débitos Pendentes', val: `R$ ${totalDebt.toFixed(2)}`, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
                        ].map(c => (
                            <div key={c.label} className={`border rounded-2xl p-4 sm:p-5 ${c.bg} ${c.glow}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-current/10`}>
                                        <span className={`material-icons-outlined text-sm sm:text-base ${c.color}`}>{c.icon}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 uppercase font-black leading-tight">{c.label}</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-display font-black break-words" style={{ color: 'inherit' }}>
                                    <span className={c.color}>{c.val}</span>
                                </p>
                                <p className="text-[8px] sm:text-[9px] text-gray-600 mt-1">{filteredBalances.length} usuários</p>
                            </div>
                        ))}
                    </div>

                    {/* Balances Table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Saldo Individual</span>
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-black">{filteredBalances.length} jogadores</span>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredBalances.length === 0 ? (
                            <div className="py-16 text-center text-gray-600">
                                <span className="material-icons-outlined text-4xl opacity-20 block mb-2">account_balance_wallet</span>
                                <p className="text-sm italic">Nenhum usuário encontrado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <table className="w-full text-xs min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-black/40">
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase w-10">#</th>
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Jogador</th>
                                            <th className="text-right px-4 py-3 text-green-500/70 font-bold uppercase">Saldo R$</th>
                                            <th className="text-right px-4 py-3 text-primary/70 font-bold uppercase">Chipz</th>
                                            <th className="text-right px-4 py-3 text-red-500/70 font-bold uppercase">Débito</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBalances.map((u, idx) => {
                                            const brl = Number(u.balance_brl || 0);
                                            const chipz = Number(u.balance_chipz || 0);
                                            const debt = Number(u.total_pending_debt || 0);
                                            return (
                                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-[10px]">{idx + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {u.avatar_url ? (
                                                                <img src={u.avatar_url} className="w-7 h-7 rounded-full border border-white/10 object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                                    <span className="material-icons-outlined text-[12px] text-primary">person</span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-white font-bold">{u.name || 'Sem nome'}</p>
                                                                <p className="text-[9px] text-gray-600">#{u.numeric_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-display font-black text-sm ${brl > 0 ? 'text-green-400' : brl < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                                            R$ {brl.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {chipz > 0 ? (
                                                            <span className="font-display font-black text-sm text-primary">{chipz.toLocaleString('pt-BR')}</span>
                                                        ) : (
                                                            <span className="text-gray-700">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {debt > 0 ? (
                                                            <span className="inline-flex items-center justify-end gap-1 font-display font-black text-sm text-red-400">
                                                                <span className="material-icons-outlined text-[10px] hidden xs:inline">warning</span>
                                                                R$ {debt.toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-700">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Grand Total Footer */}
                                    <tfoot>
                                        <tr className="border-t-2 border-white/20 bg-black/40">
                                            <td colSpan={2} className="px-4 py-4">
                                                <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-icons-outlined text-sm text-primary">calculate</span>
                                                    TOTAL ({filteredBalances.length})
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-green-400 font-display font-black text-sm sm:text-base">R$ {totalBrl.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-primary font-display font-black text-sm sm:text-base">{totalChipz.toLocaleString('pt-BR')}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-red-400 font-display font-black text-sm sm:text-base">R$ {totalDebt.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
