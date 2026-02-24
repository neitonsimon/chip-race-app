import React from 'react';

interface GiftsTabProps {
    giftTarget: 'single' | 'all';
    setGiftTarget: (t: 'single' | 'all') => void;
    giftType: 'brl' | 'chipz' | 'badge';
    setGiftType: (t: 'brl' | 'chipz' | 'badge') => void;
    giftAmount: string;
    setGiftAmount: (a: string) => void;
    giftSearchQuery: string;
    setGiftSearchQuery: (q: string) => void;
    giftDescription: string;
    setGiftDescription: (d: string) => void;
    selectedBadgeId: string;
    setSelectedBadgeId: (id: string) => void;
    giftSearchResults: any[];
    setGiftSearchResults: (res: any[]) => void;
    badgeTemplates: any[];
    selectedGiftUsers: any[];
    setSelectedGiftUsers: (users: any[]) => void;
    usersWithSelectedBadge: Set<string>;
    handleSendGifts: () => Promise<void>;
    handleGiftSearch: (query: string) => Promise<void>;
    isLoading: boolean;
}

export const GiftsTab: React.FC<GiftsTabProps> = ({
    giftTarget, setGiftTarget, giftType, setGiftType, giftAmount, setGiftAmount,
    giftSearchQuery, setGiftSearchQuery, giftDescription, setGiftDescription,
    selectedBadgeId, setSelectedBadgeId, giftSearchResults, setGiftSearchResults,
    badgeTemplates, selectedGiftUsers, setSelectedGiftUsers, usersWithSelectedBadge,
    handleSendGifts, handleGiftSearch, isLoading
}) => {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-neon-pink">
                    <span className="material-icons-outlined text-primary text-3xl">stars</span>
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Prêmios & Honrarias</h3>
                    <p className="text-gray-400 text-sm">Distribua créditos, fichas ou insígnias por mérito ou glória.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">settings</span>
                            Configuração do Prêmio
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Para quem?</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setGiftTarget('single')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'single' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                        Usuários Específicos
                                    </button>
                                    <button onClick={() => setGiftTarget('all')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftTarget === 'all' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>
                                        TODOS os Usuários
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Tipo de Recompensa</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setGiftType('brl')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'brl' ? 'bg-primary border-primary text-white shadow-neon-pink' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                        Créditos (R$)
                                    </button>
                                    <button onClick={() => setGiftType('chipz')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'chipz' ? 'bg-cyan-500 border-cyan-500 text-white shadow-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                        Chipz
                                    </button>
                                    <button onClick={() => setGiftType('badge')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${giftType === 'badge' ? 'bg-yellow-500 border-yellow-500 text-white shadow-neon-yellow' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                        Insígnia
                                    </button>
                                </div>
                            </div>

                            {giftType === 'badge' ? (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Selecionar Insígnia</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {badgeTemplates.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => setSelectedBadgeId(b.id)}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedBadgeId === b.id ? 'bg-white/10 border-yellow-500/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                            >
                                                <span className="material-icons text-xl text-yellow-400">{b.icon || 'stars'}</span>
                                                <span className="text-[10px] font-black text-white uppercase truncate w-full text-center">{b.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Quantidade</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">{giftType === 'brl' ? 'R$' : 'C'}</span>
                                        <input type="number" value={giftAmount} onChange={e => setGiftAmount(e.target.value)} placeholder="0.00"
                                            className="w-full bg-[#050214] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-black focus:border-primary outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Justificativa / Motivo</label>
                                <input type="text" value={giftDescription} onChange={e => setGiftDescription(e.target.value)} placeholder={giftType === 'badge' ? 'Ex: Membro Honorário por serviços prestados...' : 'Ex: Presente de Natal, Bônus VIP...'}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />
                            </div>

                            <button onClick={handleSendGifts} disabled={isLoading || (giftType !== 'badge' && !giftAmount) || (giftType === 'badge' && !selectedBadgeId)} className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-icons-outlined text-sm">verified</span> Confirmar Recompensas</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Selection */}
                <div className={`space-y-6 transition-all ${giftTarget === 'all' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">person_search</span>
                            Selecionar Destinatários ({selectedGiftUsers.length})
                        </h4>

                        <div className="relative mb-6">
                            <input type="text" value={giftSearchQuery} onChange={e => handleGiftSearch(e.target.value)} placeholder="Buscar por Nome ou CR#"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all" />
                            {giftSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
                                    {giftSearchResults.map(u => {
                                        const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    if (!selectedGiftUsers.find(x => x.id === u.id)) setSelectedGiftUsers([...selectedGiftUsers, u]);
                                                    setGiftSearchQuery(''); setGiftSearchResults([]);
                                                }}
                                                className={`w-full flex items-center justify-between p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0 ${alreadyHasBadge ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{u.name}</p>
                                                        <p className="text-[10px] text-primary font-black uppercase">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                    </div>
                                                </div>
                                                {alreadyHasBadge && (
                                                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                                        <span className="material-icons text-xs">info</span>
                                                        <span className="text-[9px] font-black uppercase">Já possui</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {selectedGiftUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-600 border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-xs italic">Nenhum usuário selecionado.</p>
                                </div>
                            ) : selectedGiftUsers.map(u => {
                                const alreadyHasBadge = giftType === 'badge' && usersWithSelectedBadge.has(u.id);
                                return (
                                    <div key={u.id} className={`bg-white/5 border rounded-xl p-3 flex items-center justify-between transition-all ${alreadyHasBadge ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10'}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-white">{u.name}</p>
                                                    {alreadyHasBadge && (
                                                        <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase animate-pulse">Aviso</span>
                                                    )}
                                                </div>
                                                {alreadyHasBadge ? (
                                                    <p className="text-[9px] text-yellow-500/80 font-bold italic mt-0.5">⚠️ Este jogador já possui a insígnia selecionada.</p>
                                                ) : (
                                                    <p className="text-[10px] text-gray-500">Saldo: R$ {Number(u.balance_brl || 0).toFixed(2)} · {u.balance_chipz || 0} Chipz</p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedGiftUsers(selectedGiftUsers.filter(x => x.id !== u.id))} className="text-gray-500 hover:text-red-500 transition-colors">
                                            <span className="material-icons-outlined text-base">remove_circle_outline</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
