import React from 'react';
import { Command } from '../../../types';
import { PlayerName } from '../../PlayerName';

interface ViewCommandItemsModalProps {
    viewingClosedCommand: Command | null;
    setViewingClosedCommand: (c: Command | null) => void;
    viewingItems: any[];
    handleDeleteCommandItem: (item: any) => Promise<void>;
}

export const ViewCommandItemsModal: React.FC<ViewCommandItemsModalProps> = ({
    viewingClosedCommand, setViewingClosedCommand, viewingItems, handleDeleteCommandItem
}) => {
    if (!viewingClosedCommand) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0f0a28] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-5 flex-shrink-0 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                                <span className="material-icons-outlined text-cyan-400 text-xl">receipt_long</span>
                            </div>
                            <div>
                                <h4 className="text-base font-display font-black text-white uppercase">Extrato da Comanda</h4>
                                <p className="text-gray-500 text-xs">{viewingClosedCommand.closed_at ? new Date(viewingClosedCommand.closed_at).toLocaleString('pt-BR') : '—'}</p>
                            </div>
                        </div>
                        <button onClick={() => setViewingClosedCommand(null)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all">
                            <span className="material-icons-outlined text-gray-400 text-sm">close</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <img src={viewingClosedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${viewingClosedCommand.profiles?.name}&background=random`} className="w-9 h-9 rounded-full border border-white/10" alt="" />
                        <div>
                            <PlayerName p={viewingClosedCommand.profiles} />
                            <span className="text-[10px] text-primary font-black">CR#{String(viewingClosedCommand.profiles?.numeric_id).padStart(3, '0')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                    {viewingItems.length === 0 ? (
                        <p className="text-gray-600 text-sm italic text-center py-8">Nenhum item encontrado.</p>
                    ) : (
                        <div className="space-y-2">
                            {viewingItems.map((item, i) => {
                                const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                const rawName = item.products?.name || item.notes?.split(' —')[0] || 'Item';
                                const cleanName = rawName.replace(/\(Lançado às \d{2}:\d{2}\)/, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                const detail = item.notes?.includes('—') ? item.notes.split('— ')[1].replace(/\(Lançado às \d{2}:\d{2}\)/, '').trim() : null;
                                const price = Number(item.total_price_brl);
                                return (
                                    <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-xs text-gray-500 font-mono flex-shrink-0">{time}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-bold truncate">{cleanName}</p>
                                                {detail && <p className="text-[10px] text-gray-500 truncate">{detail}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-black whitespace-nowrap ${price === 0 ? 'text-green-400' : 'text-white'}`}>
                                                {price === 0 ? 'GRÁTIS' : `R$ ${price.toFixed(2)}`}
                                            </span>
                                            {viewingClosedCommand.status === 'open' && (
                                                <button
                                                    onClick={() => handleDeleteCommandItem(item)}
                                                    className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                                                    title="Excluir Lançamento Errado"
                                                >
                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 bg-black/20 space-y-3">
                    {viewingClosedCommand.status === 'closed' && (
                        <div className="space-y-2 border-b border-white/5 pb-3">
                            {Number(viewingClosedCommand.discount_brl) > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 uppercase font-bold">Desconto</span>
                                    <span className="text-pink-500">- R$ {Number(viewingClosedCommand.discount_brl).toFixed(2)}</span>
                                </div>
                            )}
                            {Number(viewingClosedCommand.unpaid_amount_brl) > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 uppercase font-bold">Pendura (Fiado)</span>
                                    <span className="text-orange-400">R$ {Number(viewingClosedCommand.unpaid_amount_brl).toFixed(2)}</span>
                                </div>
                            )}
                            {Number(viewingClosedCommand.chips_payment_brl) > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 uppercase font-bold">Pago em Espécie</span>
                                    <span className="text-cyan-400">R$ {Number(viewingClosedCommand.chips_payment_brl).toFixed(2)}</span>
                                </div>
                            )}

                            {/* Payment/Profit breakdown logic */}
                            {(() => {
                                const total = Number(viewingClosedCommand.total_brl || 0);
                                const disc = Number(viewingClosedCommand.discount_brl || 0);
                                const debt = Number(viewingClosedCommand.unpaid_amount_brl || 0);
                                const chips = Number(viewingClosedCommand.chips_payment_brl || 0);
                                const netCost = total - disc - debt - chips;

                                // Note: We don't have fields for cashOut or profit stored in the command object yet.
                                // However, we can infer credit usage if netCost > 0.
                                // If netCost <= 0, it means it was a cash game command with a cash out.
                                // But since we don't store the exact profit/cashOut in 'commands' table, 
                                // we'll just show 'Créditos App' for the paid portion for now.

                                return netCost > 0 ? (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 uppercase font-bold">Créditos App</span>
                                        <span className="text-green-400">R$ {netCost.toFixed(2)}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-gray-500 uppercase tracking-widest">
                            {viewingClosedCommand.status === 'open' ? 'Total Parcial' : 'Total Consumido'}
                        </span>
                        <span className={`text-xl font-display font-black ${viewingClosedCommand.status === 'open' ? 'text-red-400' : 'text-primary'}`}>
                            R$ {Number(viewingClosedCommand.total_brl).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
