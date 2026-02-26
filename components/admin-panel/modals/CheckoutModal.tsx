import React from 'react';
import { Command } from '../../../types';
import { PlayerName } from '../../PlayerName';

interface CheckoutModalProps {
    showCheckout: boolean;
    setShowCheckout: (s: boolean) => void;
    selectedCommand: Command | null;
    commandItems: any[];
    checkoutDiscount: string;
    setCheckoutDiscount: (v: string) => void;
    checkoutDebt: string;
    setCheckoutDebt: (v: string) => void;
    checkoutChips: string;
    setCheckoutChips: (v: string) => void;
    checkoutCashOut: string;
    setCheckoutCashOut: (v: string) => void;
    checkoutProfitCash: string;
    setCheckoutProfitCash: (v: string) => void;
    handleCloseCommand: () => Promise<void>;
    handleDeleteCommandItem: (item: any) => Promise<void>;
    isLoading: boolean;
    confirmingCheckout: boolean;
    setConfirmingCheckout: (v: boolean) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    showCheckout, setShowCheckout, selectedCommand, commandItems,
    checkoutDiscount, setCheckoutDiscount, checkoutDebt, setCheckoutDebt,
    checkoutChips, setCheckoutChips, checkoutCashOut, setCheckoutCashOut,
    checkoutProfitCash, setCheckoutProfitCash,
    handleCloseCommand, handleDeleteCommandItem,
    isLoading, confirmingCheckout, setConfirmingCheckout
}) => {
    if (!showCheckout || !selectedCommand) return null;

    const total = Number(selectedCommand.total_brl);
    const discount = parseFloat(checkoutDiscount) || 0;
    const debt = parseFloat(checkoutDebt) || 0;
    const chips = parseFloat(checkoutChips) || 0;
    const cashOut = parseFloat(checkoutCashOut) || 0;
    const profitCash = Math.min(parseFloat(checkoutProfitCash) || 0, Math.max(0, cashOut - Math.max(0, total - discount - debt - chips)));

    const netCost = total - discount - debt - chips;
    const profit = cashOut > 0 ? cashOut - Math.max(0, netCost) : 0;
    const hasProfit = profit > 0;
    const profitCredit = Math.max(0, profit - profitCash);   // goes to balance
    const finalToDeduct = cashOut > 0 ? Math.max(0, netCost - cashOut) : Math.max(0, netCost);

    /* ──── CONFIRMATION SCREEN ──── */
    if (confirmingCheckout) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                <div className={`bg-[#0f0a28] border rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200 ${hasProfit ? 'border-green-500/40' : 'border-white/10'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${hasProfit ? 'bg-green-500/20 border border-green-500/40' : 'bg-primary/20 border border-primary/40'}`}>
                        <span className={`material-icons-outlined text-4xl ${hasProfit ? 'text-green-400' : 'text-primary'}`}>
                            {hasProfit ? 'trending_up' : 'help_outline'}
                        </span>
                    </div>
                    <h3 className={`text-xl font-display font-black uppercase mb-2 ${hasProfit ? 'text-green-400' : 'text-white'}`}>
                        {hasProfit ? '🏆 LUCRO REGISTRADO!' : 'Confirmar Encerramento?'}
                    </h3>

                    <div className="text-gray-400 text-sm mb-6 leading-relaxed space-y-2">
                        <p>Total consumido: <span className="text-white font-bold">R$ {total.toFixed(2)}</span></p>
                        {discount > 0 && <p className="text-green-300">Desconto: - R$ {discount.toFixed(2)}</p>}
                        {debt > 0 && <p className="text-red-400 font-bold">Pendura: R$ {debt.toFixed(2)}</p>}
                        {chips > 0 && <p className="text-yellow-400 font-bold">Pago em Espécie: R$ {chips.toFixed(2)}</p>}
                        {cashOut > 0 && <p className="text-blue-300 font-bold">Cash Out: R$ {cashOut.toFixed(2)}</p>}

                        {hasProfit ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mt-3 text-left space-y-3">
                                <p className="text-[10px] text-green-400 uppercase font-black text-center mb-1">
                                    Lucro Total: R$ {profit.toFixed(2)}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-black/30 rounded-xl p-2">
                                        <p className="text-[9px] text-gray-500 uppercase font-black">Em Mãos (Cash)</p>
                                        <p className="text-yellow-400 font-display font-black text-lg">R$ {profitCash.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-2">
                                        <p className="text-[9px] text-gray-500 uppercase font-black">Crédito App</p>
                                        <p className="text-green-400 font-display font-black text-lg">R$ {profitCredit.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 p-2 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Valor a ser debitado do saldo</p>
                                <span className="text-primary font-black text-lg">R$ {finalToDeduct.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCloseCommand}
                            disabled={isLoading}
                            className={`w-full disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${hasProfit ? 'bg-green-500 hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-primary hover:bg-primary/80 shadow-neon-pink'}`}
                        >
                            {isLoading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                : <><span className="material-icons-outlined text-sm">{hasProfit ? 'add_card' : 'payments'}</span>
                                    {hasProfit ? 'CONFIRMAR E FECHAR' : 'SIM, DEBITAR E FECHAR'}</>
                            }
                        </button>
                        <button onClick={() => setConfirmingCheckout(false)} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ──── MAIN FORM ──── */

    // Live calculations
    const liveNetCost = total - discount - debt - chips;
    const liveCashOut = parseFloat(checkoutCashOut) || 0;
    const liveProfit = liveCashOut > 0 ? liveCashOut - Math.max(0, liveNetCost) : 0;
    const liveHasProfit = liveProfit > 0;
    const liveProfitCash = Math.min(parseFloat(checkoutProfitCash) || 0, liveProfit);
    const liveProfitCredit = Math.max(0, liveProfit - liveProfitCash);
    const liveFinalDeduct = liveCashOut > 0 ? Math.max(0, liveNetCost - liveCashOut) : Math.max(0, liveNetCost);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className={`bg-[#0f0a28] border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all duration-300 ${liveHasProfit ? 'border-green-500/40' : 'border-white/10'}`}>

                {/* ── Header ── */}
                <div className="p-5 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${liveHasProfit ? 'bg-green-500/20 border border-green-500/40' : 'bg-primary/20 border border-primary/40'}`}>
                            <span className={`material-icons-outlined text-xl transition-all ${liveHasProfit ? 'text-green-400' : 'text-primary'}`}>
                                {liveHasProfit ? 'trending_up' : 'receipt'}
                            </span>
                        </div>
                        <div>
                            <h4 className={`text-base font-display font-black uppercase transition-colors ${liveHasProfit ? 'text-green-400' : 'text-white'}`}>
                                {liveHasProfit ? 'Checkout com Lucro' : 'Checkout'}
                            </h4>
                            <p className="text-gray-400 text-xs">Confirmar e encerrar comanda.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <img
                            src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`}
                            className="w-8 h-8 rounded-full border border-primary/50" alt=""
                        />
                        <div>
                            <PlayerName p={selectedCommand.profiles} />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                <span className="text-[10px] text-green-400 font-black">💵 R$ {Number(selectedCommand.profiles?.balance_brl || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Items list ── */}
                <div className="flex-1 overflow-y-auto px-5 pb-2 custom-scrollbar min-h-0">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Itens consumidos</p>
                    <div className="space-y-1">
                        {commandItems.length === 0
                            ? <p className="text-gray-600 text-xs italic">Nenhum item lançado.</p>
                            : commandItems.map((item, i) => {
                                const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                const rawName = item.products?.name || item.notes || 'Item';
                                const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                return (
                                    <div key={item.id || i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">{time}</span>
                                            <span className="text-xs text-gray-300 truncate">{cleanName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white font-bold whitespace-nowrap">
                                                {Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}
                                            </span>
                                            <button onClick={() => handleDeleteCommandItem(item)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                                                <span className="material-icons-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                        <span className="text-[9px] text-gray-500 uppercase font-black">Total Comanda</span>
                        <span className="text-sm font-display font-black text-white">R$ {total.toFixed(2)}</span>
                    </div>
                </div>

                {/* ── Footer form ── */}
                <div className="p-5 flex-shrink-0 border-t border-white/10 space-y-0">

                    {/* Standard fields */}
                    <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-green-400 uppercase font-black">Desconto (R$)</span>
                            <input type="number" min="0" value={checkoutDiscount} onChange={e => setCheckoutDiscount(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-green-400" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-red-500 uppercase font-black">Pendura (R$)</span>
                            <input type="number" min="0" value={checkoutDebt} onChange={e => setCheckoutDebt(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-red-500" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-yellow-500 uppercase font-black">Pago em Espécie (R$)</span>
                            <input type="number" min="0" value={checkoutChips} onChange={e => setCheckoutChips(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-yellow-500" />
                        </div>

                        {/* Cash Out */}
                        <div className={`pt-2 border-t transition-all ${liveCashOut > 0 ? 'border-blue-500/30' : 'border-white/5'}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] text-blue-400 uppercase font-black">Cash Out — Caixa Final (R$)</span>
                                    <p className="text-[9px] text-gray-600 mt-0.5">Valor retirado da mesa</p>
                                </div>
                                <input
                                    type="number" min="0" value={checkoutCashOut}
                                    onChange={e => { setCheckoutCashOut(e.target.value); setCheckoutProfitCash(''); }}
                                    placeholder="0.00"
                                    className="w-24 bg-black/40 border border-blue-400/30 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ★ PROFIT SPLIT — only shown when there's a profit */}
                    {liveHasProfit && (
                        <div className="bg-green-500/8 border border-green-500/30 rounded-2xl p-4 mb-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-icons-outlined text-green-400 text-base">trending_up</span>
                                <p className="text-[10px] text-green-400 uppercase font-black">Lucro: R$ {liveProfit.toFixed(2)} — Como pagar?</p>
                            </div>

                            {/* Em mãos field */}
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] text-yellow-400 uppercase font-black flex items-center gap-1">
                                        <span className="material-icons-outlined text-sm">payments</span>
                                        Em Mãos / Dinheiro
                                    </span>
                                    <p className="text-[9px] text-gray-500 mt-0.5">Pagar fisicamente ao jogador</p>
                                </div>
                                <div className="text-right">
                                    <input
                                        type="number"
                                        min="0"
                                        max={liveProfit}
                                        step="0.01"
                                        value={checkoutProfitCash}
                                        onChange={e => {
                                            const val = Math.min(parseFloat(e.target.value) || 0, liveProfit);
                                            setCheckoutProfitCash(val > 0 ? String(val) : e.target.value);
                                        }}
                                        placeholder="0.00"
                                        className="w-24 bg-black/40 border border-yellow-500/40 rounded-lg px-2 py-1.5 text-right text-yellow-400 text-sm font-bold outline-none focus:border-yellow-400"
                                    />
                                </div>
                            </div>

                            {/* Quick split buttons */}
                            <div className="flex gap-1.5 flex-wrap">
                                {[
                                    { label: 'Tudo em mãos', cash: liveProfit },
                                    { label: '50% / 50%', cash: liveProfit / 2 },
                                    { label: 'Tudo no App', cash: 0 },
                                ].map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setCheckoutProfitCash(opt.cash > 0 ? opt.cash.toFixed(2) : '')}
                                        className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${Math.abs(liveProfitCash - opt.cash) < 0.01
                                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Auto-calculated credit */}
                            <div className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-icons-outlined text-sm text-green-400">account_balance_wallet</span>
                                    <div>
                                        <p className="text-[9px] text-gray-400 uppercase font-black">Crédito no App</p>
                                        <p className="text-[8px] text-gray-600">Calculado automaticamente</p>
                                    </div>
                                </div>
                                <span className={`font-display font-black text-lg ${liveProfitCredit > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                                    R$ {liveProfitCredit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Result bar */}
                    <div className={`flex justify-between items-center pt-2 pb-3 border-t -mx-5 px-5 transition-all duration-300 ${liveHasProfit ? 'bg-green-500/10 border-green-500/20' : 'border-white/5 bg-primary/5'}`}>
                        {liveHasProfit ? (
                            <>
                                <div>
                                    <p className="text-[10px] text-green-400 font-black uppercase flex items-center gap-1">
                                        <span className="material-icons-outlined text-sm">trending_up</span>
                                        LUCRO DO JOGADOR
                                    </p>
                                    <p className="text-[8px] text-green-700 uppercase">
                                        {liveProfitCash > 0 && liveProfitCredit > 0
                                            ? `R$ ${liveProfitCash.toFixed(2)} em mãos + R$ ${liveProfitCredit.toFixed(2)} no app`
                                            : liveProfitCash > 0
                                                ? `Tudo pago em mãos`
                                                : `Tudo creditado no app`
                                        }
                                    </p>
                                </div>
                                <span className="text-xl font-display font-black text-green-400">+ R$ {liveProfit.toFixed(2)}</span>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] text-white font-black uppercase">Saldo a cobrar</p>
                                    <p className="text-[8px] text-gray-400 uppercase">
                                        Limite pendura: {Number(selectedCommand.profiles?.debt_limit_brl) === 0 ? 'ILIMITADO' : `R$ ${Number(selectedCommand.profiles?.debt_limit_brl).toFixed(2)}`}
                                    </p>
                                </div>
                                <span className="text-xl font-display font-black text-primary">R$ {liveFinalDeduct.toFixed(2)}</span>
                            </>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-3">
                        <button
                            onClick={handleCloseCommand}
                            disabled={isLoading}
                            className={`w-full disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-sm ${liveHasProfit ? 'bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-primary hover:bg-primary/80 shadow-neon-pink'}`}
                        >
                            {isLoading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                : <><span className="material-icons-outlined text-sm">{liveHasProfit ? 'add_card' : 'payments'}</span>
                                    {liveHasProfit ? 'Confirmar Pagamento e Fechar' : 'Confirmar e Cobrar'}</>
                            }
                        </button>
                        <button onClick={() => setShowCheckout(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Voltar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
