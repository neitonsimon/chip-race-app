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
    const liveProfit = liveCashOut > 0 ? liveCashOut - Math.max(0, liveNetCost) : 0;
    const liveHasProfit = liveProfit > 0.01;

    const liveProfitCash = Math.min(parseFloat(checkoutProfitCash) || 0, liveProfit);
    const liveProfitCredit = Math.max(0, liveProfit - liveProfitCash);

    // Final value that needs to be paid/deducted from balance
    // If there is profit, we don't deduct more from balance (except what remains of net cost if cashout < netcost)
    const liveFinalDeduct = liveCashOut > 0
        ? Math.max(0, liveNetCost - liveCashOut)
        : Math.max(0, liveNetCost);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className={`bg-[#0f0a28] border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[96vh] flex flex-col transition-all duration-300 ${liveHasProfit ? 'border-green-500/40' : 'border-white/10'}`}>

                {/* ── Header ── */}
                <div className="p-4 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${liveHasProfit ? 'bg-green-500/20 border border-green-500/40' : 'bg-primary/20 border border-primary/40'}`}>
                            <span className={`material-icons-outlined text-lg transition-all ${liveHasProfit ? 'text-green-400' : 'text-primary'}`}>
                                {liveHasProfit ? 'trending_up' : 'receipt'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-display font-black uppercase transition-colors ${liveHasProfit ? 'text-green-400' : 'text-white'} leading-none`}>
                                {liveHasProfit ? 'Checkout com Lucro' : 'Checkout'}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">Confirmar e encerrar comanda.</p>
                        </div>
                        <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-white transition-colors">
                            <span className="material-icons">close</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                        <img
                            src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`}
                            className="w-7 h-7 rounded-full border border-primary/50" alt=""
                        />
                        <div className="min-w-0">
                            <PlayerName p={selectedCommand.profiles} />
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-primary font-black uppercase">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                                <span className="text-[9px] text-green-400 font-black">💵 R$ {Number(selectedCommand.profiles?.balance_brl || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Items list ── */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 custom-scrollbar min-h-[100px] bg-black/20">
                    <div className="sticky top-0 bg-[#0f0a28]/95 z-20 py-1 border-b border-white/5 flex justify-between items-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black">Itens consumidos</p>
                        <span className="text-[10px] font-black text-white">Total: R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                        {commandItems.length === 0
                            ? <p className="text-gray-600 text-[10px] italic py-2">Nenhum item lançado.</p>
                            : commandItems.map((item, i) => {
                                const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                const rawName = item.products?.name || item.notes || 'Item';
                                const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                return (
                                    <div key={item.id || i} className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0 gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-[9px] text-gray-600 font-mono flex-shrink-0">{time}</span>
                                            <span className="text-[11px] text-gray-400 truncate">{cleanName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-[11px] text-white font-bold">
                                                {Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}
                                            </span>
                                            <button onClick={() => handleDeleteCommandItem(item)} className="text-gray-700 hover:text-red-500 transition-colors">
                                                <span className="material-icons-outlined text-[10px]">close</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="p-4 flex-shrink-0 border-t border-white/10 space-y-3 bg-[#0f0a28]">
                    {/* Inputs Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        <div className="space-y-1">
                            <label className="text-[9px] text-green-400 uppercase font-black ml-1">Desconto</label>
                            <input type="number" min="0" value={checkoutDiscount} onChange={e => setCheckoutDiscount(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-right text-white text-sm font-bold outline-none focus:border-green-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-red-500 uppercase font-black ml-1">Pendura</label>
                            <input type="number" min="0" value={checkoutDebt} onChange={e => setCheckoutDebt(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-right text-white text-sm font-bold outline-none focus:border-red-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-yellow-500 uppercase font-black ml-1">Em Espécie</label>
                            <input type="number" min="0" value={checkoutChips} onChange={e => setCheckoutChips(e.target.value)} placeholder="0.00"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-right text-white text-sm font-bold outline-none focus:border-yellow-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-blue-400 uppercase font-black ml-1">Cash Out</label>
                            <input
                                type="number" min="0" value={checkoutCashOut}
                                onChange={e => { setCheckoutCashOut(e.target.value); setCheckoutProfitCash(''); }}
                                placeholder="0.00"
                                className="w-full bg-black/40 border border-blue-400/30 rounded-lg px-2 py-1.5 text-right text-white text-sm font-bold outline-none focus:border-blue-400"
                            />
                        </div>
                    </div>

                    {/* Profit Split Area */}
                    {liveHasProfit && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-2.5 space-y-2 animate-in slide-in-from-right-2 duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-icons text-green-400 text-xs">trending_up</span>
                                    <p className="text-[9px] text-green-400 uppercase font-black">Lucro: R$ {liveProfit.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-1">
                                    {[{ l: 'Mãos', v: liveProfit }, { l: 'App', v: 0 }].map(o => (
                                        <button key={o.l} onClick={() => setCheckoutProfitCash(o.v > 0 ? o.v.toFixed(2) : '')}
                                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-gray-400 uppercase font-black hover:text-white transition-all">
                                            {o.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">Pagar em Mãos</span>
                                    <input type="number" value={checkoutProfitCash} onChange={e => setCheckoutProfitCash(e.target.value)} className="w-full bg-transparent text-center text-xs font-black text-yellow-400 outline-none" placeholder="0.00" />
                                </div>
                                <div className="bg-black/40 border border-green-500/20 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">Crédito App</span>
                                    <span className="text-xs font-black text-green-400">R$ {liveProfitCredit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result Bar */}
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${liveHasProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-primary/5 border-primary/20'}`}>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black">
                                {liveHasProfit ? 'Total Lucro' : 'Saldo a Cobrar'}
                            </p>
                            <p className="text-[8px] text-gray-600 uppercase font-bold">Cálculo ao vivo</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-base font-display font-black ${liveHasProfit ? 'text-green-400' : 'text-primary'}`}>
                                {liveHasProfit ? '+' : ''} R$ {(liveHasProfit ? liveProfit : liveFinalDeduct).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button onClick={() => setShowCheckout(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-widest border border-white/5 transition-all">Voltar</button>
                        <button
                            onClick={handleCloseCommand}
                            disabled={isLoading}
                            className={`flex-[2] disabled:opacity-50 text-white font-black py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 text-[10px] ${liveHasProfit ? 'bg-green-500 hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-primary hover:bg-primary/80 shadow-neon-pink'}`}
                        >
                            {isLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (liveHasProfit ? 'Finalizar' : 'Fechar Comanda')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
