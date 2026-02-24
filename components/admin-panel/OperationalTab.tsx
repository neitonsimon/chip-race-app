import React from 'react';
import { Event, Command, CommandItem } from '../../types';

interface OperationalTabProps {
    selectedEvent: Event | null;
    setSelectedEvent: (e: Event | null) => void;
    events: Event[];
    openCommands: Command[];
    closedCommands: Command[];
    selectedCommand: Command | null;
    setSelectedCommand: (c: Command | null) => void;
    commandItems: CommandItem[];
    pendingProduct: any;
    setPendingProduct: (p: any) => void;
    searchResults: any[];
    upcomingEventsList: Event[];
    handleSearchPlayers: (q: string) => Promise<void>;
    handleOpenCommand: (user: any) => Promise<void>;
    handleTourItemClick: (item: any) => void;
    handleCashItemClick: (item: any) => void;
    handleProductClick: (product: any) => void;
    handleDeleteCommandItem: (item: any) => Promise<void>;
    fetchOpenCommands: (id: string) => Promise<void>;
    fetchClosedCommands: (id: string) => Promise<void>;
    setShowCheckout: (s: boolean) => void;
    setShowTopUp: (s: boolean) => void;
    productSection: 'bar' | 'torneio' | 'produtos' | 'cash';
    setProductSection: (s: 'bar' | 'torneio' | 'produtos' | 'cash') => void;
    reopenCommand: (cmd: any) => Promise<void>;
    handleDownloadCommandReceipt: (cmd: any, items: any[]) => void;
    isLoading: boolean;
    allProducts: any[];
    commandsTab: 'ativas' | 'encerradas';
    setCommandsTab: (t: 'ativas' | 'encerradas') => void;
    staffExpenses: string;
    setStaffExpenses: (v: string) => void;
    prizePayout: string;
    setPrizePayout: (v: string) => void;
    updateStaffExpenses: () => Promise<void>;
    updatePrizePayout: () => Promise<void>;
    isAdmin: boolean;
    isProductDisabled: (p: any) => boolean;
    isTourItemDisabled: (i: any) => boolean;
}

export const OperationalTab: React.FC<OperationalTabProps> = ({
    selectedEvent, setSelectedEvent, events, openCommands, closedCommands,
    selectedCommand, setSelectedCommand, commandItems, pendingProduct, setPendingProduct,
    searchResults, upcomingEventsList, handleSearchPlayers, handleOpenCommand,
    handleTourItemClick, handleCashItemClick, handleProductClick, handleDeleteCommandItem,
    fetchOpenCommands, fetchClosedCommands, setShowCheckout, setShowTopUp,
    productSection, setProductSection, reopenCommand, handleDownloadCommandReceipt, isLoading,
    allProducts, commandsTab, setCommandsTab, staffExpenses, setStaffExpenses,
    prizePayout, setPrizePayout, updateStaffExpenses, updatePrizePayout, isAdmin,
    isProductDisabled, isTourItemDisabled
}) => {
    return (
        <div className="flex h-[calc(100vh-140px)] overflow-hidden">
            {/* Sidebar: Event Selection & Player Search */}
            <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col">
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Evento Ativo</label>
                        <select
                            value={selectedEvent?.id || ''}
                            onChange={(e) => {
                                const ev = events.find(x => x.id === e.target.value) || null;
                                setSelectedEvent(ev);
                                if (ev) {
                                    fetchOpenCommands(ev.id);
                                    fetchClosedCommands(ev.id);
                                }
                            }}
                            className="w-full bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-sm font-bold"
                            style={{ backgroundColor: '#0a0720' }}
                        >
                            <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>
                                    {ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1">Abrir Nova Comanda</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nome ou CR#..."
                                onChange={(e) => handleSearchPlayers(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                    {searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleOpenCommand(u)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0"
                                        >
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="text-xs font-bold text-white">{u.name}</p>
                                                <p className="text-[10px] text-primary font-black">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {selectedEvent ? (
                        <>
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                                <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center justify-between">
                                    Resumo Financeiro
                                    <span className="text-gray-500 font-bold">{selectedEvent.title}</span>
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                        <span className="text-gray-400">Total Bruto:</span>
                                        <span className="text-white">R$ {(openCommands.reduce((s, c) => s + Number(c.total_brl), 0) + closedCommands.reduce((s, c) => s + Number(c.total_brl), 0)).toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                            <span className="text-gray-500">Staff / Galpão:</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={staffExpenses}
                                                    onChange={e => setStaffExpenses(e.target.value)}
                                                    onBlur={updateStaffExpenses}
                                                    className="w-16 bg-black/40 border border-white/5 rounded px-1 py-0.5 text-right text-red-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                            <span className="text-gray-500">Premiações Pagas:</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={prizePayout}
                                                    onChange={e => setPrizePayout(e.target.value)}
                                                    onBlur={updatePrizePayout}
                                                    className="w-16 bg-black/40 border border-white/5 rounded px-1 py-0.5 text-right text-red-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-red-400">Despesas:</span>
                                            <span className="text-red-400">- R$ {(Number(staffExpenses) + Number(prizePayout)).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-yellow-400">Pago em Fichas:</span>
                                            <span className="text-yellow-400">- R$ {closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="h-px bg-white/5"></div>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                            <span className="text-primary">Faturamento Líquido:</span>
                                            <span className="text-primary shadow-neon-pink">R$ {(
                                                openCommands.reduce((s, c) => s + Number(c.total_brl), 0) +
                                                closedCommands.reduce((s, c) => s + Number(c.total_brl), 0) -
                                                (Number(staffExpenses) + Number(prizePayout)) -
                                                closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0)
                                            ).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-gray-600 uppercase pt-1 border-t border-white/5">
                                            <span>Em Aberto: R$ {openCommands.reduce((s, c) => s + Number(c.total_brl), 0).toFixed(2)}</span>
                                            <span>({openCommands.length})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        upcomingEventsList.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-gray-600 uppercase ml-1">Próximos Eventos</p>
                                {upcomingEventsList.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => {
                                            setSelectedEvent(ev);
                                            fetchOpenCommands(ev.id);
                                            fetchClosedCommands(ev.id);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-left hover:border-primary transition-all group"
                                    >
                                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{ev.title}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(ev.date).toLocaleDateString('pt-BR')}</p>
                                    </button>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Main Content: Command Lists & Actions */}
            <div className="flex-1 flex flex-col bg-background-dark/50">
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex gap-4">
                        <button onClick={() => setCommandsTab('ativas')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'ativas' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-500 hover:text-gray-300'}`}>Comandas Ativas ({openCommands.length})</button>
                        <button onClick={() => setCommandsTab('encerradas')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'encerradas' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Encerradas ({closedCommands.length})</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {!selectedEvent ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                            <span className="material-icons-outlined text-6xl mb-4 opacity-20">event_busy</span>
                            <p className="text-sm font-bold uppercase tracking-widest">Selecione um evento para gerenciar comandas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {(commandsTab === 'ativas' ? openCommands : closedCommands).map(cmd => (
                                <div
                                    key={cmd.id}
                                    onClick={() => setSelectedCommand(cmd)}
                                    className={`bg-surface-dark border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink ring-1 ring-primary' : 'border-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={cmd.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${cmd.profiles?.name}&background=random`} className="w-12 h-12 rounded-xl" />
                                        <div className="min-w-0 flex-1">
                                            <h5 className="text-white font-bold truncate">{cmd.profiles?.name}</h5>
                                            <p className="text-[10px] text-gray-500 font-black">CR#{String(cmd.profiles?.numeric_id).padStart(3, '0')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-primary font-display font-black">R$ {Number(cmd.total_brl).toFixed(2)}</p>
                                            <p className="text-[8px] text-gray-500 uppercase font-black">{new Date(cmd.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {cmd.status === 'open' ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setShowCheckout(true); }}
                                                className="flex-1 bg-white hover:bg-primary hover:text-white text-black text-[10px] font-black uppercase py-2 rounded-lg transition-all"
                                            >
                                                Fechar
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadCommandReceipt(cmd, []); }}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all border border-white/10"
                                                >
                                                    Recibo
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); reopenCommand(cmd); }}
                                                        className="px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all border border-red-500/20"
                                                        title="Reabrir Comanda"
                                                    >
                                                        <span className="material-icons text-sm">settings_backup_restore</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Selected Command Details */}
            <div className="w-96 border-l border-white/5 bg-black/40 flex flex-col">
                {selectedCommand ? (
                    <>
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`} className="w-14 h-14 rounded-2xl" />
                                <div>
                                    <h4 className="text-lg font-display font-black text-white uppercase">{selectedCommand.profiles?.name}</h4>
                                    <p className="text-xs text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</p>
                                </div>
                            </div>

                            {selectedCommand.status === 'open' && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={() => setShowTopUp(true)} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white hover:text-black border border-white/10 py-3 rounded-xl transition-all group">
                                        <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">add_card</span>
                                        <span className="text-[10px] font-black uppercase">Recarga</span>
                                    </button>
                                    <button onClick={() => setProductSection('cash')} className={`flex items-center justify-center gap-2 border py-3 rounded-xl transition-all group ${productSection !== 'bar' && productSection !== 'torneio' && productSection !== 'produtos' ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white hover:text-black border-white/10'}`}>
                                        <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">shopping_bag</span>
                                        <span className="text-[10px] font-black uppercase">Venda</span>
                                    </button>
                                </div>
                            )}

                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Categorias</p>
                                    <div className="flex gap-1">
                                        {(['torneio', 'cash', 'bar', 'produtos'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setProductSection(cat)}
                                                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${productSection === cat ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                    {allProducts
                                        .filter(p => p.category === productSection && p.active)
                                        .map(p => {
                                            const disabled = productSection === 'torneio' ? isTourItemDisabled(p) : isProductDisabled(p);
                                            return (
                                                <button
                                                    key={p.id}
                                                    disabled={disabled}
                                                    onClick={() => {
                                                        if (productSection === 'torneio') handleTourItemClick(p);
                                                        else if (productSection === 'cash') handleCashItemClick(p);
                                                        else handleProductClick(p);
                                                    }}
                                                    className={`p-3 border rounded-xl text-left transition-all group relative ${pendingProduct?.id === p.id ? 'bg-primary border-primary shadow-neon-pink' : disabled ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                                                >
                                                    <p className={`text-[9px] font-black uppercase truncate ${pendingProduct?.id === p.id ? 'text-white' : 'text-gray-400'}`}>{p.name}</p>
                                                    <p className={`text-xs font-display font-black ${pendingProduct?.id === p.id ? 'text-white' : 'text-white'}`}>R$ {Number(p.price).toFixed(2)}</p>
                                                    {pendingProduct?.id === p.id && (
                                                        <div className="absolute top-1 right-1">
                                                            <span className="material-icons text-[10px] text-white animate-pulse">check_circle</span>
                                                        </div>
                                                    )}
                                                    {disabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">Já Lançado</span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Itens da Comanda</h5>
                            {commandItems.length === 0 ? (
                                <div className="text-center py-10 opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                                    <span className="material-icons-outlined text-4xl block mb-2">receipt_long</span>
                                    <p className="text-xs font-bold uppercase">Comanda Vazia</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {commandItems.map(item => (
                                        <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase ${item.products?.category === 'torneio' ? 'bg-blue-500/20 text-blue-400' : item.products?.category === 'cash' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {item.products?.category?.substring(0, 3) || 'ITM'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-xs">{item.products?.name || item.notes}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold">Qtd: {item.quantity} · R$ {Number(item.total_price_brl).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            {selectedCommand.status === 'open' && (
                                                <button onClick={() => handleDeleteCommandItem(item.id)} className="w-8 h-8 rounded-full bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-white uppercase tracking-widest">Total Geral</span>
                                <span className="text-2xl font-display font-black text-primary shadow-neon-pink">R$ {Number(selectedCommand.total_brl).toFixed(2)}</span>
                            </div>
                            {selectedCommand.status === 'open' && (
                                <button
                                    onClick={() => setShowCheckout(true)}
                                    className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-outlined text-sm">point_of_sale</span> Encerrar Comanda
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-600">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 opacity-20">
                            <span className="material-icons-outlined text-4xl">person</span>
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Nenhum Selecionado</h4>
                        <p className="text-xs">Selecione uma comanda ao lado para gerenciar itens, efetuar recargas ou realizar o encerramento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
