import React from 'react';
import { DebtPayCard } from './DebtPayCard';

interface PendenciasTabProps {
    userDebts: any[];
    totalUserDebt: number;
    playerBalance: number;
    isSavingExp: boolean;
    handlePayDebt: (debt: any, amount: number) => void;
}

export const PendenciasTab: React.FC<PendenciasTabProps> = ({
    userDebts,
    totalUserDebt,
    playerBalance,
    isSavingExp,
    handlePayDebt
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-3 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-neon-red">
                        <span className="material-icons-outlined text-red-500 text-2xl sm:text-3xl">receipt_long</span>
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-wider">Suas Pendências</h3>
                        <p className="text-gray-400 text-[10px] sm:text-sm">Controle de débitos pendentes.</p>
                    </div>
                </div>
                <div className="text-center sm:text-right bg-black/30 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto border border-white/5 sm:border-none">
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase mb-1">Total a Pagar</p>
                    <p className="text-2xl sm:text-3xl font-display font-black text-red-500">R$ {totalUserDebt.toFixed(2)}</p>
                </div>
            </div>

            {userDebts.length === 0 ? (
                <div className="py-24 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-outlined text-5xl text-green-500">check_circle</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Tudo em dia!</h4>
                    <p className="text-gray-500">Você não possui nenhuma pendência registrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {userDebts.map(debt => {
                        const fullAmt = Number(debt.amount_brl);
                        return (
                            <DebtPayCard
                                key={debt.id}
                                debt={debt}
                                fullAmt={fullAmt}
                                playerBalance={playerBalance}
                                isSaving={isSavingExp}
                                onPay={(amount) => handlePayDebt(debt, amount)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};
