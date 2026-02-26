import React, { useState, useCallback } from 'react';
import { Event } from '../../types';
import { supabase } from '../../src/lib/supabase';

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
    handleSettleDebt: (debt: any, type: 'balance' | 'manual', amount?: number) => Promise<void>;
    debtFilter: string;
    setDebtFilter: (f: string) => void;
    fetchDebts: () => Promise<void>;
    // For direct operations — passed from AdminPanel
    currentUser: any;
    products: any[];
    productCategories: any[];
    onUpdateProfile?: (id: string, data: any) => void;
}

type SubTab = 'pendura' | 'credito' | 'venda';

const PlayerSearchDropdown: React.FC<{
    query: string;
    onQueryChange: (q: string) => void;
    results: any[];
    onSelect: (u: any) => void;
    onClear: () => void;
    selectedUser: any | null;
    accentColor?: string;
    label?: string;
}> = ({ query, onQueryChange, results, onSelect, onClear, selectedUser, accentColor = 'primary', label = 'Jogador (Nome ou CR#)' }) => (
    <div className="relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">{label}</label>
        {selectedUser ? (
            <div className={`flex items-center gap-3 bg-black/40 border border-${accentColor}/30 rounded-xl px-4 py-2.5`}>
                <img
                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`}
                    className="w-8 h-8 rounded-full border border-white/10"
                    alt=""
                />
                <div className="flex-1">
                    <p className="text-white font-bold text-sm">{selectedUser.name}</p>
                    <p className={`text-[9px] text-${accentColor} font-black`}>CR#{String(selectedUser.numeric_id).padStart(3, '0')} · R$ {Number(selectedUser.balance_brl || 0).toFixed(2)}</p>
                </div>
                <button onClick={onClear} className="text-gray-500 hover:text-white transition-colors">
                    <span className="material-icons-outlined text-sm">close</span>
                </button>
            </div>
        ) : (
            <>
                <input
                    type="text"
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    placeholder="Buscar jogador..."
                    className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-${accentColor}/50 transition-colors`}
                />
                {results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0a28] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">
                        {results.map(u => (
                            <button
                                key={u.id}
                                onClick={() => onSelect(u)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/10 text-left border-b border-white/5 last:border-0 transition-colors"
                            >
                                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                                <div>
                                    <p className="text-xs font-bold text-white">{u.name}</p>
                                    <p className="text-[9px] text-primary font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')} · Saldo: R$ {Number(u.balance_brl || 0).toFixed(2)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
);

export const DebtsTab: React.FC<DebtsTabProps> = ({
    activeDebts, totalActiveDebt, debtSearchQuery, setDebtSearchQuery,
    debtSearchResults, setDebtSearchResults, showNewDebtForm, setShowNewDebtForm,
    newDebtData, setNewDebtData, events, isAdmin, isLoading,
    handleDebtSearch, handleRegisterDebt, handleSettleDebt,
    debtFilter, setDebtFilter, fetchDebts,
    currentUser, products, productCategories, onUpdateProfile
}) => {
    const [subTab, setSubTab] = useState<SubTab>('pendura');
    // ── Partial settle: per-debt custom amount  ──
    const [settleAmounts, setSettleAmounts] = useState<Record<string, string>>({});

    // ── Enviar Crédito state ──
    const [creditSearch, setCreditSearch] = useState('');
    const [creditSearchResults, setCreditSearchResults] = useState<any[]>([]);
    const [creditUser, setCreditUser] = useState<any | null>(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditNote, setCreditNote] = useState('');
    const [creditLoading, setCreditLoading] = useState(false);

    // ── Vender Direto state ──
    const [saleSearch, setSaleSearch] = useState('');
    const [saleSearchResults, setSaleSearchResults] = useState<any[]>([]);
    const [saleUser, setSaleUser] = useState<any | null>(null);
    const [saleCategory, setSaleCategory] = useState('');
    const [saleProduct, setSaleProduct] = useState<any | null>(null);
    const [saleQuantity, setSaleQuantity] = useState('1');
    const [salePayMethod, setSalePayMethod] = useState<'balance' | 'cash'>('balance');
    const [saleLoading, setSaleLoading] = useState(false);
    const [saleSuccess, setSaleSuccess] = useState('');

    const searchPlayers = useCallback(async (query: string, setResults: (r: any[]) => void) => {
        if (query.length < 2) { setResults([]); return; }
        const isNum = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, balance_brl, debt_limit_brl, total_pending_debt');
        q = isNum ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(6);
        setResults(data || []);
    }, []);

    // ── Enviar Crédito handler ──
    const handleSendCredit = async () => {
        if (!creditUser || !creditAmount) return;
        const amount = parseFloat(creditAmount);
        if (isNaN(amount) || amount <= 0) { alert('Valor inválido.'); return; }
        if (!window.confirm(`Confirmar depósito de R$ ${amount.toFixed(2)} para ${creditUser.name}?`)) return;
        setCreditLoading(true);
        try {
            // 1. Credit BRL balance
            const { error } = await supabase.rpc('increment_balance_brl', {
                p_user_id: creditUser.id,
                p_amount: amount
            });
            if (error) throw error;

            // 2. Calculate bonuses
            const expBonus = Math.floor(amount / 20);     // 1 EXP per R$20
            const chipzBonus = Math.floor(amount / 100);  // 1 Chipz per R$100

            // 3. Award EXP
            if (expBonus > 0) {
                await supabase.rpc('bulk_add_event_exp', {
                    p_user_ids: [creditUser.id],
                    p_exp_amount: expBonus
                });
            }

            // 4. Award Chipz
            if (chipzBonus > 0) {
                const { error: chipzErr } = await supabase.rpc('add_chipz_balance', {
                    user_id: creditUser.id,
                    amount: chipzBonus
                });
                if (chipzErr) console.warn('Chipz bonus error:', chipzErr);

                // Log chipz gift in transactions
                await supabase.from('transactions').insert({
                    user_id: creditUser.id,
                    amount_brl: 0,
                    amount_chipz: chipzBonus,
                    description: `Bônus Chipz por depósito de R$ ${amount.toFixed(2)}`,
                    category: 'wallet_deposit'
                });
            }

            // 5. Log BRL transaction
            await supabase.from('transactions').insert({
                user_id: creditUser.id,
                amount_brl: amount,
                amount_chipz: 0,
                description: creditNote.trim() || 'Depósito em Dinheiro (Admin)',
                category: 'wallet_deposit'
            });

            // 6. Notify user — base message
            await supabase.from('messages').insert({
                user_id: creditUser.id,
                sender_id: currentUser.id,
                content: `R$ ${amount.toFixed(2)} adicionados ao seu saldo pelo admin.${creditNote ? ` Ref: ${creditNote}` : ''}`,
                category: 'system',
                is_read: false
            });

            // 7. Bonus notification in Gift inbox (only if bonuses were earned)
            if (expBonus > 0 || chipzBonus > 0) {
                const rewardLines = [
                    expBonus > 0 ? `⭐ ${expBonus} EXP` : '',
                    chipzBonus > 0 ? `🌟 ${chipzBonus} Chipz de Bônus` : ''
                ].filter(Boolean).join('\n');

                await supabase.from('messages').insert({
                    user_id: creditUser.id,
                    sender_id: currentUser.id,
                    content: `Parabéns! Sua compra de R$ ${amount.toFixed(2)} em créditos gerou recompensas! Você recebeu:\n${rewardLines}\nAproveite seus bônus!`,
                    category: 'gift',
                    is_read: false
                });
            }

            alert(`✅ R$ ${amount.toFixed(2)} creditados para ${creditUser.name}!${expBonus > 0 || chipzBonus > 0
                ? `\n🎁 Bônus: ${expBonus > 0 ? `${expBonus} EXP ` : ''}${chipzBonus > 0 ? `+ ${chipzBonus} Chipz` : ''}`
                : ''
                }`);
            setCreditUser(null);
            setCreditSearch('');
            setCreditAmount('');
            setCreditNote('');
        } catch (err: any) {
            alert('Erro ao creditar: ' + err.message);
        } finally {
            setCreditLoading(false);
        }
    };

    // ── Vender Direto handler ──
    const handleDirectSale = async () => {
        if (!saleUser || !saleProduct) return;
        const qty = parseInt(saleQuantity) || 1;
        const total = Number(saleProduct.price) * qty;

        if (salePayMethod === 'balance') {
            const balance = Number(saleUser.balance_brl || 0);
            if (balance < total) {
                alert(`Saldo insuficiente! Saldo: R$ ${balance.toFixed(2)} · Necessário: R$ ${total.toFixed(2)}`);
                return;
            }
        }
        if (!window.confirm(`Confirmar venda direta:\n${qty}x ${saleProduct.name} = R$ ${total.toFixed(2)}\nPara: ${saleUser.name}\nPagamento: ${salePayMethod === 'balance' ? 'Saldo R$' : 'Dinheiro (manual)'}`)) return;

        setSaleLoading(true);
        try {
            // Deduct balance if paying with balance
            if (salePayMethod === 'balance') {
                const { error: deductErr } = await supabase.rpc('deduct_balance_brl', {
                    p_user_id: saleUser.id,
                    p_amount: total
                });
                if (deductErr) throw deductErr;
            }

            // Create a closed command record for tracking
            const { data: cmd, error: cmdErr } = await supabase.from('commands').insert({
                event_id: null,
                user_id: saleUser.id,
                status: 'closed',
                opened_by: currentUser.id,
                total_brl: total,
                discount_brl: 0,
                closed_at: new Date().toISOString()
            }).select('id').single();
            if (cmdErr) throw cmdErr;

            // Add command item
            await supabase.from('command_items').insert({
                command_id: cmd.id,
                product_id: saleProduct.id,
                quantity: qty,
                unit_price_brl: Number(saleProduct.price),
                unit_price_chipz: 0,
                total_price_brl: total,
                total_price_chipz: 0,
                notes: `Venda Direta — ${salePayMethod === 'balance' ? 'Saldo R$' : 'Dinheiro'}`,
                created_by: currentUser.id
            });

            // Log transaction
            await supabase.from('transactions').insert({
                user_id: saleUser.id,
                amount_brl: -total,
                amount_chipz: 0,
                description: `Venda Direta: ${qty}x ${saleProduct.name}`,
                category: 'command_charge'
            });

            // Notify user
            await supabase.from('messages').insert({
                user_id: saleUser.id,
                sender_id: currentUser.id,
                content: `Compra direta registrada: ${qty}x ${saleProduct.name} — R$ ${total.toFixed(2)} (${salePayMethod === 'balance' ? 'Debitado do saldo' : 'Pago em dinheiro'}).`,
                category: 'system',
                is_read: false
            });

            setSaleSuccess(`✅ Venda registrada! ${qty}x ${saleProduct.name} = R$ ${total.toFixed(2)} para ${saleUser.name}`);
            setTimeout(() => setSaleSuccess(''), 5000);
            setSaleUser(null);
            setSaleSearch('');
            setSaleProduct(null);
            setSaleCategory('');
            setSaleQuantity('1');
        } catch (err: any) {
            alert('Erro na venda: ' + err.message);
        } finally {
            setSaleLoading(false);
        }
    };

    const filteredProductsByCategory = products.filter(p => p.active && (!saleCategory || p.category === saleCategory));

    const subTabs: { id: SubTab; icon: string; label: string; color: string }[] = [
        { id: 'pendura', icon: 'receipt_long', label: 'Penduras', color: 'text-red-400' },
        { id: 'credito', icon: 'account_balance_wallet', label: 'Enviar Crédito', color: 'text-green-400' },
        { id: 'venda', icon: 'sell', label: 'Venda Direta', color: 'text-blue-400' },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-2 mb-8">
                {subTabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${subTab === t.id
                            ? 'bg-white/10 border-white/20 text-white shadow-lg'
                            : 'bg-transparent border-white/5 text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className={`material-icons-outlined text-base ${subTab === t.id ? t.color : ''}`}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ╔══════════════════════════════╗
                ║        PENDURA TAB           ║
                ╚══════════════════════════════╝ */}
            {subTab === 'pendura' && (
                <div>
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
                                    onClick={() => setShowNewDebtForm(!showNewDebtForm)}
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
                                    <span className="material-icons-outlined text-red-400 text-sm">edit_note</span> Registrar Débito Manual
                                </h4>
                                <button onClick={() => setShowNewDebtForm(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <span className="material-icons-outlined text-sm">close</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Jogador</label>
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
                                                <button key={u.id} onClick={() => { setNewDebtData({ ...newDebtData, userId: u.id, name: u.name }); setDebtSearchQuery(u.name); setDebtSearchResults([]); }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 text-left border-b border-white/5 last:border-0">
                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
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
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Valor (R$)</label>
                                    <input type="number" value={newDebtData.amount} onChange={e => setNewDebtData({ ...newDebtData, amount: e.target.value })} placeholder="0.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black focus:border-red-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Evento</label>
                                    <select value={newDebtData.eventId} onChange={e => setNewDebtData({ ...newDebtData, eventId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-red-500 outline-none">
                                        <option value="">Selecionar</option>
                                        <option value="online_credit">CRÉDITO ONLINE</option>
                                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button onClick={handleRegisterDebt} disabled={isLoading || !newDebtData.userId || !newDebtData.amount}
                                        className="w-full bg-red-500 hover:bg-white hover:text-red-500 text-white font-black py-3 rounded-xl transition-all shadow-lg uppercase text-[10px] tracking-widest disabled:opacity-50">
                                        {isLoading ? 'SALVANDO...' : 'LANÇAR DÉBITO'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        {activeDebts.length === 0 ? (
                            <div className="px-6 py-20 text-center text-gray-600 italic">
                                <span className="material-icons-outlined text-4xl block mb-2 opacity-20">sentiment_satisfied</span>
                                Nenhuma pendência ativa no momento.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activeDebts.map(debt => {
                                    const fullAmt = Number(debt.amount_brl);
                                    const inputVal = settleAmounts[debt.id] ?? fullAmt.toFixed(2);
                                    const payAmt = Math.min(Math.max(parseFloat(inputVal) || 0, 0), fullAmt);
                                    const isPartial = payAmt < fullAmt && payAmt > 0;

                                    return (
                                        <div key={debt.id} className="p-4 sm:p-5 hover:bg-white/5 transition-colors">
                                            {/* Row: player + date + amount */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={debt.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${debt.profiles?.name}&background=random`} className="w-10 h-10 rounded-xl flex-shrink-0" alt="" />
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{debt.profiles?.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] text-gray-500 uppercase">
                                                                CR#{String(debt.profiles?.numeric_id).padStart(3, '0')} &nbsp;·&nbsp;
                                                                {new Date(debt.created_at).toLocaleDateString('pt-BR')}
                                                            </p>
                                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${Number(debt.profiles?.balance_brl || 0) < payAmt
                                                                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                }`}>
                                                                Saldo: R$ {Number(debt.profiles?.balance_brl || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <span className="mt-1 inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-black uppercase text-gray-500">
                                                            {debt.events?.title || debt.description || 'Crédito Manual'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-500 uppercase font-black mb-0.5">Total Devedor</p>
                                                    <span className="text-red-400 font-display font-black text-xl">R$ {fullAmt.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Payment row */}
                                            <div className="bg-black/30 border border-white/5 rounded-2xl p-3 flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                                    <span className="text-[9px] text-gray-500 uppercase font-black whitespace-nowrap">Pagar (R$)</span>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        max={fullAmt}
                                                        step="0.01"
                                                        value={inputVal}
                                                        onChange={e => setSettleAmounts(prev => ({ ...prev, [debt.id]: e.target.value }))}
                                                        className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-right text-white text-sm font-bold outline-none focus:border-primary/50"
                                                    />
                                                    <button
                                                        onClick={() => setSettleAmounts(prev => ({ ...prev, [debt.id]: fullAmt.toFixed(2) }))}
                                                        className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase text-gray-400 hover:text-white whitespace-nowrap transition-all"
                                                    >Tudo</button>
                                                </div>

                                                {isPartial && (
                                                    <span className="text-[9px] text-yellow-500 font-black flex items-center gap-1">
                                                        <span className="material-icons-outlined text-xs">info</span>
                                                        Restará R$ {(fullAmt - payAmt).toFixed(2)}
                                                    </span>
                                                )}

                                                <div className="flex gap-2 ml-auto">
                                                    <button
                                                        onClick={() => handleSettleDebt(debt, 'balance', payAmt)}
                                                        disabled={isLoading || payAmt <= 0 || (Number(debt.profiles?.balance_brl || 0) < payAmt)}
                                                        className="px-3 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[9px] font-black uppercase transition-all border border-primary/20 disabled:opacity-40 disabled:cursor-not-allowed group relative"
                                                    >
                                                        {isPartial ? '💳 Parcial Saldo' : 'SALDO R$'}
                                                        {(Number(debt.profiles?.balance_brl || 0) < payAmt) && (
                                                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                                                Saldo Insuficiente
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleSettleDebt(debt, 'manual', payAmt)}
                                                        disabled={isLoading || payAmt <= 0}
                                                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all border border-green-500/20 disabled:opacity-40"
                                                    >
                                                        {isPartial ? '💵 Parcial PIX' : 'BAIXA PIX'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ╔══════════════════════════════╗
                ║      ENVIAR CRÉDITO TAB      ║
                ╚══════════════════════════════╝ */}
            {subTab === 'credito' && (
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center shadow-2xl">
                            <span className="material-icons-outlined text-green-400 text-3xl">account_balance_wallet</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Enviar Crédito</h3>
                            <p className="text-gray-400 text-sm">Deposite saldo BRL diretamente na conta de um jogador.</p>
                        </div>
                    </div>

                    <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8 space-y-6">
                        {/* Player search */}
                        <PlayerSearchDropdown
                            query={creditSearch}
                            onQueryChange={q => { setCreditSearch(q); searchPlayers(q, setCreditSearchResults); }}
                            results={creditSearchResults}
                            onSelect={u => { setCreditUser(u); setCreditSearch(''); setCreditSearchResults([]); }}
                            onClear={() => { setCreditUser(null); setCreditSearch(''); }}
                            selectedUser={creditUser}
                            accentColor="green-400"
                            label="Jogador Destinatário"
                        />

                        {/* Amount */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Valor a Depositar (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-black text-sm">R$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={creditAmount}
                                    onChange={e => setCreditAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white text-2xl font-display font-black focus:border-green-500/50 outline-none transition-colors"
                                />
                            </div>
                            {/* Quick amounts */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {[20, 50, 100, 150, 200, 500].map(v => (
                                    <button key={v} onClick={() => setCreditAmount(String(v))}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${creditAmount === String(v) ? 'bg-green-500 text-white border-green-500' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                        R$ {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Observação (opcional)</label>
                            <input
                                type="text"
                                value={creditNote}
                                onChange={e => setCreditNote(e.target.value)}
                                placeholder="Ex: Pagamento evento, PIX recebido..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-green-500/50 outline-none transition-colors"
                            />
                        </div>

                        {/* Summary card */}
                        {creditUser && creditAmount && Number(creditAmount) > 0 && (
                            <div className="bg-black/30 border border-green-500/30 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={creditUser.avatar_url || `https://ui-avatars.com/api/?name=${creditUser.name}&background=random`} className="w-12 h-12 rounded-xl border border-green-500/30" alt="" />
                                    <div>
                                        <p className="text-white font-bold">{creditUser.name}</p>
                                        <p className="text-gray-400 text-xs">Saldo atual: <span className="text-green-400 font-bold">R$ {Number(creditUser.balance_brl || 0).toFixed(2)}</span></p>
                                        <p className="text-gray-400 text-xs">Novo saldo: <span className="text-green-300 font-black">R$ {(Number(creditUser.balance_brl || 0) + Number(creditAmount)).toFixed(2)}</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase">Depósito</p>
                                    <p className="text-3xl font-display font-black text-green-400">+R$ {Number(creditAmount).toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSendCredit}
                            disabled={creditLoading || !creditUser || !creditAmount || Number(creditAmount) <= 0}
                            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            {creditLoading ? (
                                <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> PROCESSANDO...</>
                            ) : (
                                <><span className="material-icons-outlined text-base">add_card</span> CONFIRMAR DEPÓSITO</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ╔══════════════════════════════╗
                ║       VENDA DIRETA TAB       ║
                ╚══════════════════════════════╝ */}
            {subTab === 'venda' && (
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-2xl">
                            <span className="material-icons-outlined text-blue-400 text-3xl">sell</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Venda Direta</h3>
                            <p className="text-gray-400 text-sm">Registre uma venda sem abrir comanda — ideal para compras via WhatsApp ou presencial.</p>
                        </div>
                    </div>

                    {saleSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-in slide-in-from-top-4">
                            <span className="material-icons-outlined text-green-400">check_circle</span>
                            <p className="text-green-400 font-bold text-sm">{saleSuccess}</p>
                        </div>
                    )}

                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 space-y-6">
                        {/* Player */}
                        <PlayerSearchDropdown
                            query={saleSearch}
                            onQueryChange={q => { setSaleSearch(q); searchPlayers(q, setSaleSearchResults); }}
                            results={saleSearchResults}
                            onSelect={u => { setSaleUser(u); setSaleSearch(''); setSaleSearchResults([]); }}
                            onClear={() => { setSaleUser(null); setSaleSearch(''); setSaleProduct(null); }}
                            selectedUser={saleUser}
                            accentColor="blue-400"
                            label="Jogador Comprador"
                        />

                        {/* Category + Product */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria</label>
                                <select
                                    value={saleCategory}
                                    onChange={e => { setSaleCategory(e.target.value); setSaleProduct(null); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-blue-500/50 outline-none transition-colors"
                                >
                                    <option value="">Todas as categorias</option>
                                    {productCategories.map((c: any) => (
                                        <option key={c.name} value={c.name}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Quantidade</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={saleQuantity}
                                    onChange={e => setSaleQuantity(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black focus:border-blue-500/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* Product grid */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3 ml-1">
                                Produto {filteredProductsByCategory.length > 0 && <span className="text-gray-700">({filteredProductsByCategory.length} disponíveis)</span>}
                            </label>
                            {filteredProductsByCategory.length === 0 ? (
                                <div className="text-center py-10 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                                    <span className="material-icons-outlined text-3xl opacity-20 block mb-1">inventory_2</span>
                                    <p className="text-xs">Nenhum produto nesta categoria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                    {filteredProductsByCategory.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSaleProduct(saleProduct?.id === p.id ? null : p)}
                                            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${saleProduct?.id === p.id
                                                ? 'bg-blue-500/20 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-xs font-bold text-white truncate w-full">{p.name}</span>
                                            <span className="text-[9px] text-gray-500 uppercase mt-0.5">{p.category}</span>
                                            <span className={`text-sm font-display font-black mt-1 ${saleProduct?.id === p.id ? 'text-blue-400' : 'text-primary'}`}>
                                                R$ {Number(p.price).toFixed(2)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment method */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Forma de Pagamento</label>
                            <div className="flex gap-3">
                                {[
                                    { value: 'balance', icon: 'account_balance_wallet', label: 'Débitar do Saldo', color: 'blue' },
                                    { value: 'cash', icon: 'payments', label: 'Dinheiro / Manual', color: 'yellow' },
                                ].map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setSalePayMethod(m.value as any)}
                                        className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border font-black text-xs uppercase transition-all ${salePayMethod === m.value
                                            ? `bg-${m.color}-500/20 border-${m.color}-500/50 text-${m.color}-400`
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="material-icons-outlined text-sm">{m.icon}</span>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        {saleUser && saleProduct && (
                            <div className="bg-black/30 border border-blue-500/30 rounded-2xl p-5">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-3">Resumo da Venda</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={saleUser.avatar_url || `https://ui-avatars.com/api/?name=${saleUser.name}&background=random`} className="w-10 h-10 rounded-xl" alt="" />
                                        <div>
                                            <p className="text-white font-bold">{saleUser.name}</p>
                                            <p className="text-xs text-gray-500">{parseInt(saleQuantity) || 1}x {saleProduct.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-500 uppercase">Total</p>
                                        <p className="text-2xl font-display font-black text-blue-400">
                                            R$ {(Number(saleProduct.price) * (parseInt(saleQuantity) || 1)).toFixed(2)}
                                        </p>
                                        {salePayMethod === 'balance' && (
                                            <p className="text-[9px] text-gray-500">
                                                Saldo pós-venda: <span className={Number(saleUser.balance_brl || 0) >= Number(saleProduct.price) * (parseInt(saleQuantity) || 1) ? 'text-green-400' : 'text-red-400'}>
                                                    R$ {(Number(saleUser.balance_brl || 0) - Number(saleProduct.price) * (parseInt(saleQuantity) || 1)).toFixed(2)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDirectSale}
                            disabled={saleLoading || !saleUser || !saleProduct}
                            className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            {saleLoading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> PROCESSANDO...</>
                            ) : (
                                <><span className="material-icons-outlined text-base">sell</span> CONFIRMAR VENDA</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
