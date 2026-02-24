import React from 'react';
import { Command } from '../../../types';
import { PlayerName } from '../../PlayerName';

interface TopUpModalProps {
    showTopUp: boolean;
    setShowTopUp: (s: boolean) => void;
    selectedCommand: Command | null;
    topUpAmount: string;
    setTopUpAmount: (a: string) => void;
    handleTopUp: () => Promise<void>;
    isLoading: boolean;
    isAdmin: boolean;
    confirmingTopUp: boolean;
    setConfirmingTopUp: (c: boolean) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
    showTopUp, setShowTopUp, selectedCommand, topUpAmount, setTopUpAmount,
    handleTopUp, isLoading, isAdmin, confirmingTopUp, setConfirmingTopUp
}) => {
    if (!showTopUp || !selectedCommand || !isAdmin) return null;

    if (confirmingTopUp) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in duration-200">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-outlined text-green-400 text-4xl">account_balance_wallet</span>
                    </div>
                    <h3 className="text-xl font-display font-black text-white uppercase mb-2">Confirmar Pagamento?</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Você confirma que recebeu <span className="text-green-400 font-bold">R$ {Number(topUpAmount).toFixed(2)}</span> em espécie do usuário <span className="text-white font-bold">{selectedCommand.profiles?.name}</span>?
                    </p>
                    <div className="space-y-3">
                        <button onClick={handleTopUp} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>DAR BAIXA E ADD SALDO</>}
                        </button>
                        <button onClick={() => { setConfirmingTopUp(false); }} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <span className="material-icons-outlined text-green-400 text-2xl">account_balance_wallet</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-display font-black text-white uppercase">Saldo Pago</h4>
                        <p className="text-gray-400 text-xs">Crédito de pagamento em espécie.</p>
                    </div>
                </div>
                <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-gray-500 mb-0.5">Creditando para</p>
                    <PlayerName p={selectedCommand.profiles} />
                </div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Valor Recebido (R$)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setConfirmingTopUp(true)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-green-400 transition-all mb-4"
                />
                <div className="space-y-2">
                    <button onClick={() => setConfirmingTopUp(true)} disabled={isLoading || !topUpAmount} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 text-sm">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">add_card</span>Confirmar Crédito</>}
                    </button>
                    <button onClick={() => { setShowTopUp(false); setTopUpAmount(''); }} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                </div>
            </div>
        </div>
    );
};
