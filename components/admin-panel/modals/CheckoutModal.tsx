import React from 'react';
import { Command, CommandItem } from '../../../types';
import { PlayerName } from '../../PlayerName';

interface CheckoutModalProps {
    showCheckout: boolean;
    setShowCheckout: (s: boolean) => void;
    selectedCommand: Command | null;
    commandItems: CommandItem[];
    handleDeleteCommandItem: (item: any) => Promise<void>;
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
    isLoading: boolean;
    confirmingCheckout?: boolean;
    setConfirmingCheckout?: (v: boolean) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    showCheckout, setShowCheckout, selectedCommand, commandItems,
    handleDeleteCommandItem, checkoutDiscount, setCheckoutDiscount,
    checkoutDebt, setCheckoutDebt, checkoutChips, setCheckoutChips,
    checkoutCashOut, setCheckoutCashOut, checkoutProfitCash, setCheckoutProfitCash,
    handleCloseCommand, isLoading, confirmingCheckout, setConfirmingCheckout
}) => {
    if (!showCheckout || !selectedCommand) return null;

    // --- Calculations ---
    const total = Number(selectedCommand.total_brl || 0);
    const liveDiscount = parseFloat(checkoutDiscount) || 0;
    const liveDebt = parseFloat(checkoutDebt) || 0;
    const liveChips = parseFloat(checkoutChips) || 0;
    const liveCashOut = parseFloat(checkoutCashOut) || 0;

    // Net cost after discounts/debt/chips
    const liveNetCost = total - liveDiscount - liveDebt - liveChips;

    // Profit calculation: only if cash out exists
    // Profit = (What house gets from chips/cash payment) - (What the player actually consumed)
    // Actually, in this UI, profit is typically CashOut - NetCost
    const liveProfit = liveCashOut > 0 ? liveCashOut - Math.max(0, liveNetCost) : 0;
    const liveHasProfit = liveProfit > 0.01;

    const liveProfitCash = Math.min(parseFloat(checkoutProfitCash) || 0, liveHasProfit ? liveProfit : 0);
    const liveProfitCredit = Math.max(0, liveProfit - liveProfitCash);

    // Final value that needs to be paid/deducted from balance
    const liveFinalDeduct = liveCashOut > 0
        ? Math.max(0, liveNetCost - liveCashOut)
        : Math.max(0, liveNetCost);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className={`bg-[#0f0a28] border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[96vh] flex flex-col transition-all duration-300 ${liveHasProfit ? 'border-green-500/40' : 'border-white/10'}`}>

                <div className="p-5 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${liveHasProfit ? 'bg-green-500/20 border border-green-500/40' : 'bg-primary/20 border border-primary/40'}`}>
                            <span className={`material-icons-outlined text-xl transition-all ${liveHasProfit ? 'text-green-400' : 'text-primary'}`}>
                                {liveHasProfit ? 'trending_up' : 'receipt'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base font-display font-black text-white uppercase leading-tight">Checkout</h4>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest opacity-60">Finalizar Comanda</p>
                        </div>
                        <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-white transition-colors">
                            <span className="material-icons">close</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <img src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`} className="w-8 h-8 rounded-full border border-primary/50" alt="" />
                        <div>
                            <PlayerName p={selectedCommand.profiles} />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                <span className="text-[10px] text-green-400 font-black">💵 R$ {Number(selectedCommand.profiles?.balance_brl || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-2 custom-scrollbar min-h-0 bg-black/20">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-2 mt-2">Itens consumidos</p>
                    <div className="space-y-1">
                        {commandItems.length === 0 ? (
                            <p className="text-gray-600 text-xs italic text-center py-6">Nenhum item lançado.</p>
                        ) : commandItems.map((item, i) => {
                            const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                            const rawName = item.products?.name || item.notes || 'Item';
                            const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                            return (
                                <div key={item.id || i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-[10px] text-gray-600 font-mono shrink-0">{time}</span>
                                        <span className="text-xs text-gray-400 truncate">{cleanName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-white font-bold whitespace-nowrap">{Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}</span>
                                        <button
                                            onClick={() => handleDeleteCommandItem(item)}
                                            className="text-gray-700 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 flex-shrink-0 border-t border-white/10 space-y-4">
                    {/* Input Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black ml-1">Desconto (R$)</label>
                            <input type="number" value={checkoutDiscount} onChange={e => setCheckoutDiscount(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black ml-1">Pendura (R$)</label>
                            <input type="number" value={checkoutDebt} onChange={e => setCheckoutDebt(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:border-red-500/50 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black ml-1">Pago em Espécie (R$)</label>
                            <input type="number" value={checkoutChips} onChange={e => setCheckoutChips(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:border-yellow-500/50 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black ml-1">Troco / Cash Out (R$)</label>
                            <input type="number" value={checkoutCashOut} onChange={e => setCheckoutCashOut(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:border-blue-400/50 transition-all" />
                        </div>
                    </div>

                    {/* Profit Area */}
                    {liveHasProfit && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-3 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-green-400 font-bold uppercase">Premiação / Lucro</span>
                                <span className="text-sm font-black text-green-400 italic font-display">R$ {liveProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] text-gray-500 uppercase font-black flex-1 italic">Pago em mãos (R$)</span>
                                <input type="number" value={checkoutProfitCash} onChange={e => setCheckoutProfitCash(e.target.value)} placeholder="0.00"
                                    className="w-24 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-right text-white text-xs font-bold outline-none focus:border-green-400/50" />
                            </div>
                            <p className="text-[8px] text-gray-600 mt-2 text-right">Saldo App: + R$ {liveProfitCredit.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Summary Bar */}
                    <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${liveHasProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-primary/5 border-primary/20'}`}>
                        <div>
                            <p className="text-[10px] text-white font-black uppercase tracking-widest">{liveHasProfit ? 'Lucro Total' : 'Saldo a cobrar'}</p>
                            <p className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">Débito do Aplicativo</p>
                        </div>
                        <div className="text-right min-w-0">
                            <p className={`text-xl sm:text-2xl font-display font-black shadow-neon-pink break-words leading-tight ${liveHasProfit ? 'text-green-400' : 'text-primary'}`}>
                                R$ {(liveHasProfit ? liveProfit : liveFinalDeduct).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={handleCloseCommand}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${liveHasProfit ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg' : 'bg-primary hover:bg-white hover:text-black text-white shadow-neon-pink'}`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <><span className="material-icons text-sm">{liveHasProfit ? 'emoji_events' : 'point_of_sale'}</span>{liveHasProfit ? 'Lançar Lucro e Fechar' : 'Fechar e Cobrar'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
