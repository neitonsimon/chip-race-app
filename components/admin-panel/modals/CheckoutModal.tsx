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
    handleCloseCommand: () => Promise<void>;
    handleDeleteCommandItem: (item: any) => Promise<void>;
    isLoading: boolean;
    confirmingCheckout: boolean;
    setConfirmingCheckout: (v: boolean) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    showCheckout, setShowCheckout, selectedCommand, commandItems,
    checkoutDiscount, setCheckoutDiscount, checkoutDebt, setCheckoutDebt,
    checkoutChips, setCheckoutChips, handleCloseCommand, handleDeleteCommandItem,
    isLoading, confirmingCheckout, setConfirmingCheckout
}) => {
    if (!showCheckout || !selectedCommand) return null;

    if (confirmingCheckout) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200">
                    <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-outlined text-primary text-4xl">help_outline</span>
                    </div>
                    <h3 className="text-xl font-display font-black text-white uppercase mb-2">Confirmar Encerramento?</h3>
                    <div className="text-gray-400 text-sm mb-6 leading-relaxed space-y-2">
                        <p>Total Final: <span className="text-white font-bold">R$ {(Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0)).toFixed(2)}</span></p>
                        {parseFloat(checkoutDebt) > 0 && <p className="text-red-400 font-bold">Pendura: R$ {parseFloat(checkoutDebt).toFixed(2)}</p>}
                        {parseFloat(checkoutChips) > 0 && <p className="text-yellow-400 font-bold">Pago em Fichas: R$ {parseFloat(checkoutChips).toFixed(2)}</p>}
                        <div className="bg-white/5 p-2 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Valor a ser debitado do saldo</p>
                            <span className="text-primary font-black text-lg">R$ {Math.max(0, Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0) - (parseFloat(checkoutDebt) || 0) - (parseFloat(checkoutChips) || 0)).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>SIM, DEBITAR E FECHAR</>}
                        </button>
                        <button onClick={() => setConfirmingCheckout(false)} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-5 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center"><span className="material-icons-outlined text-primary text-xl">receipt</span></div>
                        <div><h4 className="text-base font-display font-black text-white uppercase">Checkout</h4><p className="text-gray-400 text-xs">Confirmar e encerrar comanda.</p></div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
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

                <div className="flex-1 overflow-y-auto px-5 pb-2 custom-scrollbar min-h-0">
                    <p className="text-[9px] text-gray-500 uppercase font-black mb-2">Itens consumidos</p>
                    <div className="space-y-1">
                        {commandItems.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">Nenhum item lançado.</p>
                        ) : commandItems.map((item, i) => {
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
                                        <span className="text-xs text-white font-bold whitespace-nowrap">{Number(item.total_price_brl) === 0 ? 'GRÁTIS' : `R$ ${Number(item.total_price_brl).toFixed(2)}`}</span>
                                        <button
                                            onClick={() => handleDeleteCommandItem(item)}
                                            className="text-gray-600 hover:text-red-500 transition-colors p-1"
                                            title="Remover Item"
                                        >
                                            <span className="material-icons-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 flex-shrink-0 border-t border-white/10">
                    <div className="space-y-4 mb-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-green-400 uppercase font-black">Adicionar Desconto (R$)</span>
                            <input type="number" value={checkoutDiscount} onChange={e => setCheckoutDiscount(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-green-400" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-red-500 uppercase font-black">Colocar na Pendura (R$)</span>
                            <input type="number" value={checkoutDebt} onChange={e => setCheckoutDebt(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-red-500" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-yellow-500 uppercase font-black">Pagamento em Fichas (R$)</span>
                            <input type="number" value={checkoutChips} onChange={e => setCheckoutChips(e.target.value)} placeholder="0.00"
                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm font-bold outline-none focus:border-yellow-500" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 pt-2 border-t border-white/5 bg-primary/5 -mx-5 px-5 py-2">
                        <div>
                            <p className="text-[10px] text-white font-black uppercase">Saldo a cobrar</p>
                            <p className="text-[8px] text-gray-400 uppercase">Limite: R$ {Number(selectedCommand.profiles?.debt_limit_brl || 0).toFixed(2)}</p>
                        </div>
                        <span className="text-xl font-display font-black text-primary">R$ {Math.max(0, Number(selectedCommand.total_brl) - (parseFloat(checkoutDiscount) || 0) - (parseFloat(checkoutDebt) || 0) - (parseFloat(checkoutChips) || 0)).toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                        <button onClick={handleCloseCommand} disabled={isLoading} className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">payments</span>Confirmar e Cobrar</>}
                        </button>
                        <button onClick={() => setShowCheckout(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Voltar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
