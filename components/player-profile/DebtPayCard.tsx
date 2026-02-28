import React, { useState } from 'react';

interface DebtPayCardProps {
    debt: any;
    fullAmt: number;
    playerBalance: number;
    isSaving: boolean;
    onPay: (amount: number) => void;
}

export const DebtPayCard: React.FC<DebtPayCardProps> = ({ debt, fullAmt, playerBalance, isSaving, onPay }) => {
    const [payType, setPayType] = useState<'full' | 'partial'>('full');
    const [partialAmt, setPartialAmt] = useState<string>('');
    const eventName = debt.events?.title || 'Torneio';
    const debtDate = debt.created_at ? new Date(debt.created_at).toLocaleDateString() : '';

    const handlePayClick = () => {
        if (payType === 'full') {
            onPay(fullAmt);
        } else {
            const val = parseFloat(partialAmt);
            if (!isNaN(val) && val > 0 && val <= fullAmt) {
                onPay(val);
            } else {
                alert('Valor parcial inválido!');
            }
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#1a1438] to-[#0f0a28] rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-red-500/30 transition-all flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="material-icons-outlined text-red-500 text-[18px] sm:text-[20px] mb-0.5">warning</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] sm:text-[16px] font-bold text-white uppercase tracking-wider truncate" title={eventName}>{eventName}</h4>
                        <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="material-icons-outlined text-[12px]">event</span> {debtDate}
                        </div>
                    </div>
                </div>
                <div className="sm:text-right shrink-0">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Valor Pendente</div>
                    <div className="text-xl sm:text-2xl font-display font-black text-red-400">R$ {fullAmt.toFixed(2)}</div>
                </div>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4">
                <div className="flex gap-2 p-1 bg-black/50 rounded-lg">
                    <button
                        onClick={() => setPayType('full')}
                        className={`flex-1 py-2 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors ${payType === 'full' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        Total
                    </button>
                    <button
                        onClick={() => setPayType('partial')}
                        className={`flex-1 py-2 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors ${payType === 'partial' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        Parcial
                    </button>
                </div>

                {payType === 'partial' && (
                    <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={partialAmt}
                            onChange={e => {
                                const val = e.target.value.replace(',', '.');
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    setPartialAmt(val);
                                }
                            }}
                            placeholder={`Máx: R$ ${fullAmt.toFixed(2)}`}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 sm:p-4 text-white font-bold text-center focus:border-red-500 outline-none text-sm sm:text-base transition-colors"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPartialAmt((fullAmt * 0.25).toFixed(2))}
                                className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] sm:text-xs font-bold rounded transition-colors"
                            >
                                25%
                            </button>
                            <button
                                onClick={() => setPartialAmt((fullAmt * 0.50).toFixed(2))}
                                className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] sm:text-xs font-bold rounded transition-colors"
                            >
                                50%
                            </button>
                            <button
                                onClick={() => setPartialAmt((fullAmt * 0.75).toFixed(2))}
                                className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] sm:text-xs font-bold rounded transition-colors"
                            >
                                75%
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button
                disabled={isSaving || playerBalance === undefined || (payType === 'full' ? playerBalance < fullAmt : playerBalance < (parseFloat(partialAmt) || 0))}
                onClick={handlePayClick}
                className="w-full py-3 sm:py-4 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 font-black rounded-xl sm:rounded-2xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] flex justify-center items-center gap-2 group uppercase tracking-widest text-[10px] sm:text-[11px]"
            >
                <span className="material-icons-outlined text-[16px] sm:text-[18px] group-hover:scale-110 transition-transform">check_circle</span>
                {(payType === 'full' ? playerBalance < fullAmt : playerBalance < (parseFloat(partialAmt) || 0)) ? 'Saldo Insuficiente' :
                    (payType === 'full' ? 'Quitar Total com Saldo' : `Pagar R$ ${parseFloat(partialAmt) || 0} com Saldo`)}
            </button>
        </div>
    );
}
