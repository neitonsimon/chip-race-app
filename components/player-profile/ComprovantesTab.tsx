import React from 'react';

interface ComprovantesTabProps {
    playerCommands: any[];
    handleViewReceipt: (cmd: any) => void;
    isVip?: boolean;
    onActivateVip?: (cmdId: string, duration: string) => void;
    isProcessing?: boolean;
}

export const ComprovantesTab: React.FC<ComprovantesTabProps> = ({
    playerCommands,
    handleViewReceipt,
    isVip,
    onActivateVip,
    isProcessing
}) => {
    const openCommands = playerCommands.filter(c => c.status === 'open');
    const closedCommands = playerCommands.filter(c => c.status === 'closed');

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="material-icons-outlined text-green-400 text-2xl">receipt_long</span>
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider">Histórico de Consumo</h3>
                    <p className="text-gray-400 text-sm">Registro de comandas encerradas e serviços consumidos em etapas.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* SEÇÃO COMANDA EM ABERTO */}
                {openCommands.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Comanda em Aberto (Tempo Real)
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {openCommands.map(cmd => (
                                <div key={cmd.id} className="bg-gradient-to-r from-red-900/40 to-black/40 border border-red-500/30 rounded-3xl overflow-hidden hover:border-red-400 p-6 transition-all group cursor-pointer relative"
                                    onClick={() => handleViewReceipt(cmd)}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                                <span className="material-icons-outlined text-red-500 animate-bounce">restaurant</span>
                                            </div>
                                            <div>
                                                <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-0.5 animate-pulse">Consumo Ativo</div>
                                                <h4 className="text-xl font-bold text-white">{cmd.events?.title || 'Clube Chip Race'}</h4>
                                            </div>
                                        </div>
                                        <div className="sm:text-right bg-black/40 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                                            <div className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total Parcial</div>
                                            <span className="text-2xl sm:text-4xl font-display font-black text-red-400">R$ {Number(cmd.total_brl).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-black/40 rounded-xl py-3 px-4 border border-white/5 group-hover:bg-red-500/10 transition-colors">
                                        <span className="text-sm text-gray-300 font-medium">Acompanhar lançamentos ao vivo</span>
                                        <span className="material-icons-outlined text-red-400">arrow_forward</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SEÇÃO HISTÓRICO DE CONSUMO (FECHADAS) */}
                {closedCommands.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Histórico Fechado
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {closedCommands.map(cmd => {
                                const isVoucher = cmd.metadata?.is_vip_voucher;
                                const isActivated = cmd.metadata?.activated;

                                if (isVoucher) {
                                    return (
                                        <div key={cmd.id} className={`relative overflow-hidden group transition-all duration-500 rounded-3xl border ${isActivated
                                            ? 'bg-green-600/5 border-green-500/20'
                                            : 'bg-gradient-to-br from-primary/10 via-surface-dark to-black border-primary/30 shadow-[0_10px_40px_rgba(255,0,229,0.05)]'}`}>

                                            {/* Glow effect */}
                                            {!isActivated && <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all pointer-events-none"></div>}

                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isActivated
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                        : 'bg-primary/20 border-primary/40 text-primary shadow-neon-pink'}`}>
                                                        <span className="material-icons-outlined text-2xl">{isActivated ? 'task_alt' : 'stars'}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isActivated ? 'text-green-500' : 'text-primary'}`}>
                                                            {isActivated ? 'Membro VIP Ativo' : 'Voucher VIP Disponível'}
                                                        </div>
                                                        <div className="text-2xl font-display font-black text-white uppercase">{cmd.metadata?.vip_type || 'PLANO VIP'}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="material-icons-outlined text-sm">calendar_today</span>
                                                        {cmd.closed_at ? new Date(cmd.closed_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                        <span className="material-icons-outlined text-sm">confirmation_number</span>
                                                        ID: #{cmd.id.slice(0, 8).toUpperCase()}
                                                    </div>

                                                    {!isActivated && !isVip && onActivateVip && (
                                                        <div className="grid grid-cols-1 gap-3 pt-2">
                                                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 ml-1 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                                Escolha a duração para ativar:
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onActivateVip(cmd.id, '1 month'); }}
                                                                    disabled={isProcessing}
                                                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black py-2.5 rounded-xl transition-all uppercase"
                                                                >
                                                                    1 Mês
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onActivateVip(cmd.id, '3 months'); }}
                                                                    disabled={isProcessing}
                                                                    className="flex-1 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-[9px] font-black py-2.5 rounded-xl transition-all uppercase"
                                                                >
                                                                    3 Meses
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onActivateVip(cmd.id, 'december'); }}
                                                                    disabled={isProcessing}
                                                                    className="flex-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[9px] font-black py-2.5 rounded-xl transition-all uppercase shadow-neon-pink"
                                                                >
                                                                    Até Dez
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onActivateVip(cmd.id, 'forever'); }}
                                                                disabled={isProcessing}
                                                                className="w-full bg-gradient-to-r from-primary to-accent hover:from-white hover:to-white text-white hover:text-black border border-primary/40 text-[11px] font-black py-4 rounded-2xl transition-all uppercase tracking-[0.2em] shadow-neon-pink active:scale-[0.98]"
                                                            >
                                                                Ativar Vitalício (MASTER)
                                                            </button>
                                                        </div>
                                                    )}

                                                    {!isActivated && isVip && (
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                            <p className="text-xs text-gray-400 italic">Você já possui um VIP ativo. Guarde este voucher para quando o atual expirar.</p>
                                                        </div>
                                                    )}

                                                    {isActivated && (
                                                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex items-center justify-between">
                                                            <span className="text-[10px] text-green-400 font-bold uppercase">Ativado em {new Date(cmd.metadata.activated_at).toLocaleDateString()}</span>
                                                            <span className="material-icons-outlined text-green-400 text-sm">verified</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button onClick={() => handleViewReceipt(cmd)} className="w-full mt-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 border-t border-white/5 pt-4">
                                                    Ver Detalhes do Voucher <span className="material-icons-outlined text-sm">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={cmd.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-green-400/50 hover:shadow-[0_4px_20px_rgba(74,222,128,0.1)] transition-all group cursor-pointer"
                                        onClick={() => handleViewReceipt(cmd)}>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                                    <span className="material-icons-outlined text-green-400 text-xl">point_of_sale</span>
                                                </div>
                                                <span className="text-3xl font-display font-black text-white">R$ {Number(cmd.total_brl).toFixed(2)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-base font-bold text-white leading-tight">{cmd.events?.title || 'Torneio'}</h4>
                                                {cmd.metadata?.is_vip_voucher && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${cmd.metadata?.activated ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary/20 text-primary border border-primary/30 animate-pulse'}`}>
                                                        {cmd.metadata?.activated ? 'VIP Ativado' : 'VIP Pendente'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                                <span className="material-icons-outlined text-xs">calendar_today</span>
                                                {cmd.closed_at ? new Date(cmd.closed_at).toLocaleDateString('pt-BR') : (cmd.events?.date ? cmd.events.date.split('-').reverse().join('/') : '')}
                                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                {cmd.closed_at ? new Date(cmd.closed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>

                                            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-green-400 group-hover:text-green-300 transition-colors">
                                                <span className="uppercase tracking-widest">Ver Detalhes</span>
                                                <span className="material-icons-outlined text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {playerCommands.length === 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center mt-8">
                        <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mb-4">
                            <span className="material-icons-outlined text-4xl text-gray-500 block">receipt_long</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">Nenhum comprovante</h4>
                        <p className="text-gray-400 max-w-sm">Você ainda não possui comandas registradas em eventos do Chip Race.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
