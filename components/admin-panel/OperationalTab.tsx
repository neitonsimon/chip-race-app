import React from 'react';
import { Event, Command, CommandItem } from '../../types';
import { formatCurrencyK } from '../../utils/format';
import { supabase } from '../../src/lib/supabase';

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
    productSection: string;
    setProductSection: (s: string) => void;
    productCategories?: any[];
    reopenCommand: (cmd: any) => Promise<void>;
    handleDownloadCommandReceipt: (cmd: any, items: any[]) => void;
    isLoading: boolean;
    allProducts: any[];
    tournamentItems: any[];
    cashItems: any[];
    cashAmount: string;
    setCashAmount: (v: string) => void;
    handleAddManualCash: () => void;
    commandsTab: 'ativas' | 'encerradas' | 'resumo';
    setCommandsTab: (t: 'ativas' | 'encerradas' | 'resumo') => void;
    staffExpenses: string;
    setStaffExpenses: (v: string) => void;
    prizePayout: string;
    setPrizePayout: (v: string) => void;
    updateStaffExpenses: () => Promise<void>;
    updatePrizePayout: () => Promise<void>;
    handleAddManualOnline: () => void;
    isAdmin: boolean;
    isProductDisabled: (p: any) => boolean;
    isTourItemDisabled: (i: any) => boolean;
    pastEventsList: Event[];
    handleFinalizeEvent: () => Promise<void>;
    handleCreateQuickEvent?: () => void;
    searchQuery?: string;
    handleCreateGhostUser?: (name: string) => Promise<void>;
    getVipPrice?: (price: number, category: string, name: string) => number;
    handleDeleteCommand: (cmd: any) => Promise<void>;
    currentUserRole?: string;
    handleImportReservations?: () => Promise<void>;
}

export const OperationalTab: React.FC<OperationalTabProps> = ({
    selectedEvent, setSelectedEvent, events, openCommands, closedCommands,
    selectedCommand, setSelectedCommand, commandItems, pendingProduct, setPendingProduct,
    searchResults, upcomingEventsList, handleSearchPlayers, handleOpenCommand,
    handleTourItemClick, handleCashItemClick, handleProductClick, handleDeleteCommandItem,
    fetchOpenCommands, fetchClosedCommands, setShowCheckout, setShowTopUp,
    productSection, setProductSection, reopenCommand, handleDownloadCommandReceipt, isLoading,
    allProducts, tournamentItems, cashItems, cashAmount, setCashAmount, handleAddManualCash,
    commandsTab, setCommandsTab, staffExpenses, setStaffExpenses,
    prizePayout, setPrizePayout, updateStaffExpenses, updatePrizePayout, handleAddManualOnline, isAdmin,
    isProductDisabled, isTourItemDisabled, productCategories = [],
    pastEventsList, handleFinalizeEvent, handleCreateQuickEvent,
    searchQuery, handleCreateGhostUser,
    getVipPrice,
    handleDeleteCommand,
    currentUserRole,
    handleImportReservations
}) => {
    const [eventFilterTab, setEventFilterTab] = React.useState<'proximos' | 'concluidos'>('proximos');
    const [selectedSubCategory, setSelectedSubCategory] = React.useState<string | null>(null);
    const [rightMode, setRightMode] = React.useState<'venda' | 'itens'>('venda');
    const [commandCardFilter, setCommandCardFilter] = React.useState('');
    const [rightPanelWidth, setRightPanelWidth] = React.useState(500);
    const [isResizing, setIsResizing] = React.useState(false);
    const operationalContainerRef = React.useRef<HTMLDivElement>(null);

    // --- Product Exclusion per Event ---
    const [excludedProductIds, setExcludedProductIds] = React.useState<Set<string>>(new Set());
    const [showProductMgr, setShowProductMgr] = React.useState(false);
    const [productMgrSection, setProductMgrSection] = React.useState<string>('bar');

    React.useEffect(() => {
        if (!selectedEvent) { setExcludedProductIds(new Set()); return; }
        supabase
            .from('event_product_exclusions')
            .select('product_id')
            .eq('event_id', selectedEvent.id)
            .then(({ data }) => {
                setExcludedProductIds(new Set((data || []).map((r: any) => r.product_id)));
            });
    }, [selectedEvent?.id]);

    const toggleProductExclusion = async (product: any) => {
        if (!selectedEvent || !currentUserRole || currentUserRole !== 'admin') return;
        const pid = String(product.id);
        const isExcluded = excludedProductIds.has(pid);
        if (isExcluded) {
            await supabase.from('event_product_exclusions')
                .delete()
                .eq('event_id', selectedEvent.id)
                .eq('product_id', pid);
            setExcludedProductIds(prev => { const s = new Set(prev); s.delete(pid); return s; });
        } else {
            await supabase.from('event_product_exclusions').insert({
                event_id: selectedEvent.id,
                product_id: pid,
                product_category: product.category || productMgrSection
            });
            setExcludedProductIds(prev => new Set(prev).add(pid));
        }
    };

    // Filter categories that should go into 'Diversos' (now Jackpot)
    const getVisibleItems = () => {
        if (productSection === 'torneio') return tournamentItems;
        if (productSection === 'cash') return cashItems;
        if (productSection === 'diversos') {
            return allProducts.filter(p => p.category === 'jackpot' && p.active && !excludedProductIds.has(String(p.id)));
        }
        return allProducts.filter(p => p.category === productSection && p.active && !excludedProductIds.has(String(p.id)));
    };

    const visibleItems = getVisibleItems();

    const getItemCount = (p: any) => {
        if (!commandItems) return 0;
        if (productSection === 'torneio') {
            return commandItems.filter(item => item.notes?.startsWith(p.name)).reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
        if (productSection === 'cash') {
            return commandItems.filter(item => item.notes?.includes(p.name)).reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
        // Use ID for bar and diversos subcategories
        return commandItems.filter(item => item.product_id === p.id).reduce((sum, item) => sum + (item.quantity || 1), 0);
    };
    const startResizing = () => setIsResizing(true);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !operationalContainerRef.current) return;
            const containerRect = operationalContainerRef.current.getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;
            // Limit width between 300px and 800px
            if (newWidth > 320 && newWidth < 900) {
                setRightPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <>
        <div ref={operationalContainerRef} className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden select-none">
            {/* Sidebar: Event Selection & Player Search */}
            <div className={`w-full lg:w-80 flex-1 lg:flex-none border-b lg:border-r border-white/5 bg-black/40 flex flex-col ${selectedEvent ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Evento Ativo</label>
                        <div className="flex bg-black/40 rounded-lg p-1 mb-3">
                            <button
                                onClick={() => setEventFilterTab('proximos')}
                                className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${eventFilterTab === 'proximos' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Próximos
                            </button>
                            <button
                                onClick={() => setEventFilterTab('concluidos')}
                                className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${eventFilterTab === 'concluidos' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Concluídos
                            </button>
                        </div>
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
                            {(eventFilterTab === 'proximos' ? upcomingEventsList : pastEventsList).map(ev => (
                                <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>
                                    {ev.title} ({ev.date.split('-').reverse().join('/')})
                                </option>
                            ))}
                        </select>
                        {currentUserRole === 'admin' && (
                            <button
                                onClick={handleCreateQuickEvent}
                                className="w-full mt-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20"
                            >
                                + Evento Comum (Simples)
                            </button>
                        )}
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
                            {(searchResults.length > 0 || (searchQuery && searchQuery.length >= 2)) && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                    {searchResults.length > 0 ? searchResults.map(u => (
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
                                    )) : (
                                        handleCreateGhostUser && (
                                            <button
                                                onClick={() => handleCreateGhostUser(searchQuery!)}
                                                className="w-full flex items-center justify-center gap-2 p-4 hover:bg-primary/20 text-center"
                                            >
                                                <span className="material-icons-outlined text-gray-400">person_add</span>
                                                <span className="text-xs font-bold text-gray-300">
                                                    Criar Fantasma: <span className="text-white">"{searchQuery}"</span>
                                                </span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    {currentUserRole === 'admin' && selectedEvent && handleImportReservations && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleImportReservations}
                                disabled={isLoading}
                                className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                                title="Importar todos jogadores com reservas"
                            >
                                <span className="material-icons-outlined text-[14px]">group_add</span>
                                Importar Reservas
                            </button>
                            <button
                                onClick={handleImportReservations}
                                disabled={isLoading}
                                className="w-10 flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                                title="Sincronizar Novas Reservas"
                            >
                                <span className="material-icons-outlined text-sm">sync</span>
                            </button>
                        </div>
                    )}

                    {currentUserRole === 'admin' && selectedEvent && (
                        <button
                            onClick={() => setShowProductMgr(true)}
                            className="w-full py-2 flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all"
                        >
                            <span className="material-icons-outlined text-[14px]">tune</span>
                            Gerenciar Produtos do Evento
                            {excludedProductIds.size > 0 && (
                                <span className="ml-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                                    {excludedProductIds.size} ocultos
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {selectedEvent && currentUserRole !== 'staff' ? (
                        <>
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                                <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center justify-between">
                                    Resumo Financeiro
                                    <span className="text-gray-500 font-bold">{selectedEvent.title}</span>
                                </h4>
                                <div className="space-y-2">
                                    <div className="bg-black/20 rounded-xl p-2">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total Bruto</div>
                                        <div className="text-sm font-black text-white">{formatCurrencyK(openCommands.reduce((s, c) => s + Number(c.total_brl), 0) + closedCommands.reduce((s, c) => s + Number(c.total_brl), 0))}</div>
                                    </div>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                            <span className="text-gray-500">Staff / Galpão:</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={staffExpenses}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(',', '.');
                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                            setStaffExpenses(val);
                                                        }
                                                    }}
                                                    onBlur={updateStaffExpenses}
                                                    className="w-16 bg-black/40 border border-white/5 rounded px-1 py-0.5 text-right text-red-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-red-400">Staff / Galpão:</span>
                                            <span className="text-red-400">- {formatCurrencyK(staffExpenses)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-blue-400">Cash Out (Prêmios):</span>
                                            <span className="text-blue-400">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.cash_out_brl || 0), 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-yellow-400">Pago em Espécie:</span>
                                            <span className="text-yellow-400">{formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <span className="text-purple-400">Lucro Pago em Mãos:</span>
                                            <span className="text-purple-400">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.profit_cash_payment_brl || 0), 0))}</span>
                                        </div>
                                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2 mt-1">
                                            <div className="text-[9px] text-primary/70 uppercase font-bold tracking-wider mb-0.5">Faturamento Líquido</div>
                                            <div className="text-base font-black text-primary">{formatCurrencyK(
                                                openCommands.reduce((s, c) => s + Number(c.total_brl), 0) +
                                                closedCommands.reduce((s, c) => s + Number(c.total_brl), 0) -
                                                Number(staffExpenses) -
                                                closedCommands.reduce((s, c) => s + Number(c.cash_out_brl || 0), 0)
                                            )}</div>
                                        </div>

                                        <div className="pt-2 space-y-1.5 opacity-80">
                                            <div className="flex justify-between text-[9px] font-bold uppercase">
                                                <span className="text-gray-500">Total em Desconto:</span>
                                                <span className="text-gray-400">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.discount_brl || 0), 0))}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase">
                                                <span className="text-red-500/70">Total em Pendura:</span>
                                                <span className="text-red-500/70">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.unpaid_amount_brl || 0), 0))}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase">
                                                <span className="text-cyan-500/70">Saldo App Utilizado:</span>
                                                <span className="text-cyan-500/70">- {formatCurrencyK(closedCommands.reduce((s, c) => {
                                                    const netCost = Number(c.total_brl || 0) - Number(c.discount_brl || 0) - Number(c.unpaid_amount_brl || 0) - Number(c.chips_payment_brl || 0);
                                                    return s + (Number(c.cash_out_brl || 0) > 0 ? Math.max(0, netCost - Number(c.cash_out_brl || 0)) : Math.max(0, netCost));
                                                }, 0))}</span>
                                            </div>
                                        </div>

                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2">
                                            <div className="text-[9px] text-green-400/70 uppercase font-bold tracking-wider mb-0.5">Faturamento Real (Caixa)</div>
                                            <div className="text-base font-black text-green-400">{formatCurrencyK(
                                                closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0) -
                                                Number(staffExpenses) -
                                                closedCommands.reduce((s, c) => s + Number(c.profit_cash_payment_brl || 0), 0)
                                            )}</div>
                                        </div>

                                        <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase pt-2 border-t border-white/5 mt-1">
                                            <span>Comandas em Aberto:</span>
                                            <span className="text-white font-black">{openCommands.length}</span>
                                        </div>
                                    </div>

                                    {currentUserRole === 'admin' && (
                                        <button
                                            onClick={handleFinalizeEvent}
                                            disabled={selectedEvent.status === 'closed'}
                                            className={`w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group ${selectedEvent.status === 'closed' ? 'bg-green-500/10 text-green-500/50 cursor-not-allowed border border-green-500/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 shadow-sm'}`}
                                        >
                                            <span className={`material-icons text-sm ${selectedEvent.status !== 'closed' && 'group-hover:rotate-12 transition-transform'}`}>
                                                {selectedEvent.status === 'closed' ? 'check_circle' : 'flag_circle'}
                                            </span>
                                            {selectedEvent.status === 'closed' ? 'Evento Encerrado Oficialmente' : 'Finalizar Evento e Fechar Dia'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-600 uppercase ml-1">
                                {eventFilterTab === 'proximos' ? 'Próximos Eventos' : 'Eventos Concluídos'}
                            </p>
                            {(eventFilterTab === 'proximos' ? upcomingEventsList : pastEventsList).map(ev => (
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
                                    <p className="text-[10px] text-gray-500">{ev.date.split('-').reverse().join('/')}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Command Lists & Actions */}
            <div className={`flex-1 min-h-0 flex flex-col bg-background-dark/50 ${(selectedEvent && !selectedCommand) ? 'flex' : 'hidden lg:flex'}`}>
                <div className="p-4 sm:p-6 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={() => setSelectedEvent(null)} className="lg:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="material-icons-outlined text-sm">arrow_back</span>
                        </button>
                        <div className="flex gap-1.5 sm:gap-4 flex-1">
                            <button onClick={() => setCommandsTab('ativas')} className={`flex-1 sm:flex-none px-2 sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'ativas' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 hover:text-gray-300'}`}>Ativas ({openCommands.length})</button>
                            <button onClick={() => setCommandsTab('encerradas')} className={`flex-1 sm:flex-none px-2 sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'encerradas' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300'}`}>Encerradas ({closedCommands.length})</button>
                            {currentUserRole === 'admin' && (
                                <button onClick={() => setCommandsTab('resumo')} className={`lg:hidden flex-1 sm:flex-none px-2 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${commandsTab === 'resumo' ? 'bg-secondary text-white shadow-neon-blue' : 'text-gray-400 hover:text-gray-300'}`}>Resumo</button>
                            )}
                        </div>
                    </div>
                    {commandsTab !== 'resumo' && (
                        <div className="relative w-full sm:w-64">
                            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Procurar jogador nesta lista..."
                                value={commandCardFilter}
                                onChange={(e) => setCommandCardFilter(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-primary placeholder-gray-600"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {!selectedEvent ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                            <span className="material-icons-outlined text-6xl mb-4 opacity-20">event_busy</span>
                            <p className="text-sm font-bold uppercase tracking-widest">Selecione um evento para gerenciar comandas</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-black/20 border border-white/5 p-4 rounded-xl shadow-lg lg:hidden">
                                <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-2">Abrir Nova Comanda</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Pesquise por Nome ou ID (CR#)..."
                                        onChange={(e) => handleSearchPlayers(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary placeholder-gray-600"
                                    />
                                    {(searchResults.length > 0 || (searchQuery && searchQuery.length >= 2)) && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0720] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                            {searchResults.length > 0 ? searchResults.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => handleOpenCommand(u)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-primary/20 text-left border-b border-white/5 last:border-0"
                                                >
                                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{u.name}</p>
                                                        <p className="text-xs text-primary font-black">CR#{String(u.numeric_id).padStart(3, '0')}</p>
                                                    </div>
                                                </button>
                                            )) : (
                                                handleCreateGhostUser && (
                                                    <button
                                                        onClick={() => handleCreateGhostUser(searchQuery!)}
                                                        className="w-full flex items-center justify-center gap-2 p-4 hover:bg-primary/20 text-center"
                                                    >
                                                        <span className="material-icons-outlined text-gray-400">person_add</span>
                                                        <span className="text-sm font-bold text-gray-300">
                                                            Criar Fantasma: <span className="text-white">"{searchQuery}"</span>
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={commandsTab === 'resumo' ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4' : 'flex flex-col gap-1.5'}>
                                {commandsTab === 'resumo' && currentUserRole === 'admin' ? (
                                    <div className="lg:hidden animate-in fade-in slide-in-from-top-4 col-span-full">
                                        {/* FINANCIAL SUMMARY REPLICATED FOR MOBILE TAB */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6 mb-8">
                                            <h4 className="text-xs font-black text-primary uppercase mb-5 flex items-center justify-between">
                                                Resumo Financeiro
                                                <span className="text-gray-500 font-bold">{selectedEvent.title}</span>
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                                    <span className="text-gray-400">Total Bruto:</span>
                                                    <span className="text-white text-lg">{formatCurrencyK(openCommands.reduce((s, c) => s + Number(c.total_brl), 0) + closedCommands.reduce((s, c) => s + Number(c.total_brl), 0))}</span>
                                                </div>
                                                <div className="h-px bg-white/5 my-2"></div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                                                        <span className="text-gray-500">Staff / Galpão:</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={staffExpenses}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                        setStaffExpenses(val);
                                                                    }
                                                                }}
                                                                onBlur={updateStaffExpenses}
                                                                className="w-20 bg-black/40 border border-white/5 rounded px-2 py-1 text-right text-red-400 outline-none text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                                        <span className="text-red-400">Staff / Galpão:</span>
                                                        <span className="text-red-400 text-lg">- {formatCurrencyK(staffExpenses)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                                        <span className="text-blue-400">Cash Out (Prêmios):</span>
                                                        <span className="text-blue-400 text-lg">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.cash_out_brl || 0), 0))}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                                                        <span className="text-yellow-400">Pago em Espécie:</span>
                                                        <span className="text-yellow-400 text-lg">{formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0))}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                                        <span className="text-purple-400">Lucro Pago em Mãos:</span>
                                                        <span className="text-purple-400">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.profit_cash_payment_brl || 0), 0))}</span>
                                                    </div>
                                                    <div className="h-px bg-white/5"></div>
                                                    <div className="flex justify-between text-sm font-black uppercase tracking-wider">
                                                        <span className="text-primary">Faturamento Líquido:</span>
                                                        <span className="text-primary text-xl shadow-neon-pink">R$ {(
                                                            openCommands.reduce((s, c) => s + Number(c.total_brl), 0) +
                                                            closedCommands.reduce((s, c) => s + Number(c.total_brl), 0) -
                                                            Number(staffExpenses) -
                                                            closedCommands.reduce((s, c) => s + Number(c.cash_out_brl || 0), 0)
                                                        ).toFixed(2)}</span>
                                                    </div>

                                                    <div className="pt-2 space-y-2 opacity-80 border-t border-white/5">
                                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                                            <span className="text-gray-500">Total em Desconto:</span>
                                                            <span className="text-gray-400">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.discount_brl || 0), 0))}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                                            <span className="text-red-500/70">Total em Pendura:</span>
                                                            <span className="text-red-500/70">- {formatCurrencyK(closedCommands.reduce((s, c) => s + Number(c.unpaid_amount_brl || 0), 0))}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                                            <span className="text-cyan-500/70">Saldo App Utilizado:</span>
                                                            <span className="text-cyan-500/70">- R$ {closedCommands.reduce((s, c) => {
                                                                const netCost = Number(c.total_brl || 0) - Number(c.discount_brl || 0) - Number(c.unpaid_amount_brl || 0) - Number(c.chips_payment_brl || 0);
                                                                return s + (Number(c.cash_out_brl || 0) > 0 ? Math.max(0, netCost - Number(c.cash_out_brl || 0)) : Math.max(0, netCost));
                                                            }, 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between text-sm font-black uppercase tracking-wider pt-3 border-t border-white/10 mt-1">
                                                        <span className="text-green-400">Faturamento Real (Caixa):</span>
                                                        <span className="text-green-400 text-xl">R$ {(
                                                            closedCommands.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0) -
                                                            Number(staffExpenses) -
                                                            closedCommands.reduce((s, c) => s + Number(c.profit_cash_payment_brl || 0), 0)
                                                        ).toFixed(2)}</span>
                                                    </div>

                                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase pt-3 border-t border-white/5 mt-1">
                                                        <span>Comandas em Aberto:</span>
                                                        <span className="text-white font-black">{openCommands.length}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleFinalizeEvent}
                                                    disabled={selectedEvent.status === 'closed'}
                                                    className={`w-full mt-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group ${selectedEvent.status === 'closed' ? 'bg-green-500/10 text-green-500/50 cursor-not-allowed border border-green-500/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 shadow-sm'}`}
                                                >
                                                    <span className={`material-icons text-xl ${selectedEvent.status !== 'closed' && 'group-hover:rotate-12 transition-transform'}`}>
                                                        {selectedEvent.status === 'closed' ? 'check_circle' : 'flag_circle'}
                                                    </span>
                                                    {selectedEvent.status === 'closed' ? 'Evento Encerrado Oficialmente' : 'Finalizar Evento e Fechar Dia'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    (commandsTab === 'ativas' ? openCommands : closedCommands)
                                    .filter(cmd => {
                                        if (!commandCardFilter) return true;
                                        const searchLower = commandCardFilter.toLowerCase().trim();
                                        const matchName = cmd.profiles?.name?.toLowerCase().includes(searchLower);
                                        const matchCr = `cr#${String(cmd.profiles?.numeric_id).padStart(3, '0')}`.includes(searchLower) || String(cmd.profiles?.numeric_id).includes(searchLower);
                                        return matchName || matchCr;
                                    })
                                    .sort((a, b) => (a.profiles?.name || '').localeCompare(b.profiles?.name || ''))
                                    .map(cmd => {
                                        if (commandsTab === 'ativas') {
                                            return (
                                                <div
                                                    key={cmd.id}
                                                    onClick={() => setSelectedCommand(cmd)}
                                                    className={`bg-black/40 border rounded-lg px-3 py-2 cursor-pointer transition-all hover:border-primary flex flex-wrap xl:flex-nowrap items-center gap-3 xl:gap-4 ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink ring-1 ring-primary' : 'border-white/5'}`}
                                                >
                                                    <div className="flex-1 min-w-[120px] max-w-full">
                                                        <h5 className="text-white font-black text-sm lg:text-base truncate uppercase tracking-wider">{cmd.profiles?.name}</h5>
                                                    </div>

                                                    <div className="flex flex-wrap xl:flex-nowrap items-center gap-8 overflow-x-auto no-scrollbar shrink-0">
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            {currentUserRole === 'admin' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCommand(cmd); }}
                                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/20 active:scale-95 shrink-0"
                                                                    title="Excluir Comanda"
                                                                >
                                                                    <span className="material-icons-outlined text-[15px]">delete</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setShowCheckout(true); }}
                                                                className="px-4 h-8 bg-white hover:bg-primary hover:text-white text-black text-[11px] sm:text-xs font-black uppercase rounded-lg transition-all shadow-sm active:scale-95 shrink-0"
                                                            >
                                                                Fechar
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setRightMode('venda'); setProductSection('torneio'); setSelectedSubCategory(null); }}
                                                                className={`px-4 h-8 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${selectedCommand?.id === cmd.id && productSection === 'torneio' && rightMode === 'venda' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/10 text-white hover:bg-primary hover:text-white border border-white/20'}`}
                                                            >
                                                                Evento
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setRightMode('venda'); setProductSection('bar'); setSelectedSubCategory(null); }}
                                                                className={`px-4 h-8 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${selectedCommand?.id === cmd.id && productSection === 'bar' && rightMode === 'venda' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/10 text-white hover:bg-primary hover:text-white border border-white/20'}`}
                                                            >
                                                                Bar
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setRightMode('venda'); setProductSection('cash'); setSelectedSubCategory(null); }}
                                                                className={`px-4 h-8 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${selectedCommand?.id === cmd.id && productSection === 'cash' && rightMode === 'venda' ? 'bg-white text-black shadow-neon-blue' : 'bg-white/10 text-white hover:bg-white hover:text-black border border-white/20'}`}
                                                            >
                                                                Cash
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCommand(cmd); setRightMode('venda'); setProductSection('diversos'); setSelectedSubCategory(null); }}
                                                                className={`px-4 h-8 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${selectedCommand?.id === cmd.id && productSection === 'diversos' && rightMode === 'venda' ? 'bg-secondary text-white shadow-neon-blue' : 'bg-white/10 text-white hover:bg-secondary hover:text-white border border-white/20'}`}
                                                            >
                                                                Diversos
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center shrink-0 ml-auto border-l border-white/10 pl-3 md:pl-4">
                                                        <p className="text-primary font-display font-black text-sm md:text-base shadow-neon-pink leading-none whitespace-nowrap">
                                                            R$ {Number(cmd.total_brl).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={cmd.id}
                                                onClick={() => {
                                                    setSelectedCommand(cmd);
                                                    setRightMode('itens');
                                                }}
                                                className={`bg-black/40 border rounded-lg px-3 py-2 cursor-pointer transition-all hover:border-primary flex flex-wrap lg:flex-nowrap items-center gap-4 ${selectedCommand?.id === cmd.id ? 'border-primary shadow-neon-pink ring-1 ring-primary' : 'border-white/5'}`}
                                            >
                                                <div className="flex-1 min-w-[120px] max-w-full">
                                                    <h5 className="text-white font-black text-sm lg:text-base truncate uppercase tracking-wider">{cmd.profiles?.name}</h5>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 ml-auto">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadCommandReceipt(cmd, []); }}
                                                        className="px-4 h-8 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase rounded-lg transition-all border border-white/20 active:scale-95"
                                                    >
                                                        Recibo
                                                    </button>
                                                    
                                                    {isAdmin && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); reopenCommand(cmd); }}
                                                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/20 active:scale-95"
                                                            title="Reabrir Comanda"
                                                        >
                                                            <span className="material-icons text-[15px]">settings_backup_restore</span>
                                                        </button>
                                                    )}

                                                    <div className="flex items-center shrink-0 border-l border-white/10 pl-3 md:pl-4">
                                                        <p className="text-primary font-display font-black text-sm md:text-base shadow-neon-pink leading-none whitespace-nowrap">
                                                            R$ {Number(cmd.total_brl).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DIVIDER HANDLE */}
            <div 
                onMouseDown={startResizing}
                className={`hidden lg:flex w-1.5 h-full items-center justify-center cursor-col-resize z-50 group hover:bg-primary/20 transition-colors ${isResizing ? 'bg-primary/30 border-x border-primary/40' : 'bg-transparent border-x border-white/5'}`}
            >
                <div className={`w-[2px] h-24 rounded-full transition-all group-hover:h-32 ${isResizing ? 'bg-primary h-48 scale-x-150' : 'bg-white/10'}`}></div>
            </div>

            {/* Right Panel: Selected Command Details */}
            <div 
                style={{ width: (typeof window !== 'undefined' && window.innerWidth >= 1024) ? `${rightPanelWidth}px` : '100%' }}
                className={`flex-1 lg:flex-none border-t lg:border-l border-white/5 bg-black/40 flex flex-col min-h-0 overflow-y-auto ${selectedCommand ? 'flex pb-12' : 'hidden lg:flex'}`}
            >
                {selectedCommand ? (
                    <>
                        <div className="p-4 sm:p-6 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-4 sm:mb-6">
                                <button onClick={() => setSelectedCommand(null)} className="lg:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="material-icons-outlined text-sm">arrow_back</span>
                                </button>
                                <img src={selectedCommand.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${selectedCommand.profiles?.name}&background=random`} className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl" />
                                <div>
                                    <h4 className="text-sm sm:text-lg font-display font-black text-white uppercase truncate max-w-[150px]">{selectedCommand.profiles?.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-primary font-black">CR#{String(selectedCommand.profiles?.numeric_id).padStart(3, '0')}</p>
                                </div>
                            </div>

                            {selectedCommand.status === 'open' && (
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button onClick={() => setShowTopUp(true)} className="flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white hover:text-black border border-white/10 py-2 rounded-xl transition-all group">
                                        <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">add_card</span>
                                        <span className="text-[8px] font-black uppercase">Recarga</span>
                                    </button>
                                    <button
                                        onClick={() => setRightMode('venda')}
                                        className={`flex flex-col items-center justify-center gap-1 border py-2 rounded-xl transition-all group ${rightMode === 'venda' ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white hover:text-black border-white/10'}`}
                                    >
                                        <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">storefront</span>
                                        <span className="text-[8px] font-black uppercase">Venda</span>
                                    </button>
                                    <button
                                        onClick={() => setRightMode('itens')}
                                        className={`flex flex-col items-center justify-center gap-1 border py-2 rounded-xl transition-all group relative ${rightMode === 'itens' ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white hover:text-black border-white/10'}`}
                                    >
                                        <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">receipt_long</span>
                                        <span className="text-[8px] font-black uppercase">Itens</span>
                                        {commandItems.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-neon-pink">
                                                {commandItems.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-4 lg:overflow-y-auto lg:custom-scrollbar">
                            {rightMode === 'venda' ? (
                                <div className="space-y-4">
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-3">
                                            <p className="text-xs font-black text-gray-500 uppercase">Categorias</p>
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => { setProductSection('bar'); setSelectedSubCategory(null); }}
                                                    className={`px-4 py-2 flex-1 xl:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${productSection === 'bar' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    Bar
                                                </button>
                                                <button
                                                    onClick={() => { setProductSection('torneio'); setSelectedSubCategory(null); }}
                                                    className={`px-4 py-2 flex-1 xl:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${productSection === 'torneio' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    Evento
                                                </button>
                                                <button
                                                    onClick={() => { setProductSection('cash'); setSelectedSubCategory(null); }}
                                                    className={`px-4 py-2 flex-1 xl:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${productSection === 'cash' ? 'bg-white text-black shadow-neon-blue' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    onClick={() => { setProductSection('diversos'); setSelectedSubCategory(null); }}
                                                    className={`px-4 py-2 flex-1 xl:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap text-center ${productSection === 'diversos' ? 'bg-secondary text-white shadow-neon-blue' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    Jackpot
                                                </button>
                                            </div>
                                        </div>

                                        {productSection === 'cash' && (
                                            <div className="mb-4 flex gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Valor Cash R$"
                                                    value={cashAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.');
                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                            setCashAmount(val);
                                                        }
                                                    }}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-primary outline-none transition-all"
                                                />
                                                <button
                                                    onClick={handleAddManualCash}
                                                    className="bg-primary hover:scale-105 active:scale-95 text-white p-2 rounded-xl transition-all shadow-neon-pink"
                                                >
                                                    <span className="material-icons text-sm">add</span>
                                                </button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                                            {visibleItems.map(p => {
                                                const disabled = productSection === 'torneio' ? isTourItemDisabled(p) : isProductDisabled(p);
                                                const count = getItemCount(p);
                                                const originalPrice = Number(p.price);
                                                const vipPrice = getVipPrice ? getVipPrice(originalPrice, p.category || productSection, p.name) : originalPrice;
                                                const hasDiscount = vipPrice < originalPrice;

                                                return (
                                                    <button
                                                        key={p.id}
                                                        disabled={disabled}
                                                        onClick={() => {
                                                            if (productSection === 'torneio') handleTourItemClick(p);
                                                            else if (productSection === 'cash') handleCashItemClick(p);
                                                            else handleProductClick(p);
                                                        }}
                                                        className={`p-3 border rounded-xl text-left transition-all group relative ${
                                                            pendingProduct?.id === p.id 
                                                                ? 'bg-primary border-primary shadow-neon-pink' 
                                                                : count > 0 
                                                                    ? 'bg-primary/10 border-primary/40 shadow-inner' 
                                                                    : disabled 
                                                                        ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' 
                                                                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                                                        }`}
                                                    >
                                                        {count > 0 && !pendingProduct && (
                                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#080518] z-10 animate-in zoom-in duration-200">
                                                                <span className="material-icons text-[12px]">check</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className={`text-xs xl:text-sm font-black uppercase flex-1 leading-tight ${pendingProduct?.id === p.id ? 'text-white' : count > 0 ? 'text-primary' : 'text-gray-200'}`}>{p.name}</p>
                                                            {count > 0 && (
                                                                <span className={`text-xs xl:text-sm font-black px-2 py-1 rounded-md ${pendingProduct?.id === p.id ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary shadow-sm border border-primary/20'}`}>
                                                                    {count}x
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <p className={`text-xs font-display font-black ${pendingProduct?.id === p.id ? 'text-white' : 'text-white'}`}>R$ {vipPrice.toFixed(2)}</p>
                                                            {hasDiscount && (
                                                                <p className={`text-[8px] line-through font-bold ${pendingProduct?.id === p.id ? 'text-white/60' : 'text-gray-500'}`}>R$ {originalPrice.toFixed(2)}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
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
                                                        <div className="min-w-0">
                                                            <p className="text-white font-bold text-xs truncate max-w-[150px]">{item.products?.name || item.notes}</p>
                                                            <p className="text-[10px] text-gray-500 font-bold">Qtd: {item.quantity} · R$ {Number(item.total_price_brl).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    {selectedCommand.status === 'open' && (
                                                        <button onClick={() => handleDeleteCommandItem(item)} className="w-8 h-8 rounded-full bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0">
                                                            <span className="material-icons-outlined text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/10 space-y-4">
                            {selectedCommand.status === 'closed' && (
                                <div className="space-y-2 border-b border-white/5 pb-4">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Detalhamento do Pagamento</p>

                                    {Number(selectedCommand.discount_brl) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold">Desconto</span>
                                            <span className="text-pink-500 font-black">- R$ {Number(selectedCommand.discount_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(selectedCommand.unpaid_amount_brl) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold">Pendura (Dívida)</span>
                                            <span className="text-orange-400 font-black">R$ {Number(selectedCommand.unpaid_amount_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(selectedCommand.chips_payment_brl) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold">Pago em Espécie</span>
                                            <span className="text-yellow-400 font-black">R$ {Number(selectedCommand.chips_payment_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(selectedCommand.cash_out_brl) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold">Cash Out (Puxado)</span>
                                            <span className="text-blue-400 font-black">R$ {Number(selectedCommand.cash_out_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(selectedCommand.profit_brl) > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-green-400 font-black uppercase text-[10px]">Lucro Total</span>
                                            <span className="text-green-400 font-black">R$ {Number(selectedCommand.profit_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(selectedCommand.profit_cash_payment_brl) > 0 && (
                                        <div className="flex justify-between text-[10px] pl-4 italic">
                                            <span className="text-gray-500 font-bold">↳ Parte paga em mãos</span>
                                            <span className="text-gray-400">R$ {Number(selectedCommand.profit_cash_payment_brl).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {(() => {
                                        const total = Number(selectedCommand.total_brl || 0);
                                        const disc = Number(selectedCommand.discount_brl || 0);
                                        const debt = Number(selectedCommand.unpaid_amount_brl || 0);
                                        const chips = Number(selectedCommand.chips_payment_brl || 0);
                                        const cashOut = Number(selectedCommand.cash_out_brl || 0);
                                        const profit = Number(selectedCommand.profit_brl || 0);
                                        const profitCash = Number(selectedCommand.profit_cash_payment_brl || 0);

                                        // Balance used = net cost after cashOut (if any)
                                        const balanceUsed = cashOut > 0 ? Math.max(0, (total - disc - debt - chips) - cashOut) : Math.max(0, total - disc - debt - chips);
                                        const balanceEarned = Math.max(0, profit - profitCash);

                                        return (
                                            <>
                                                {balanceUsed > 0 && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400 font-bold">Débito App</span>
                                                        <span className="text-primary font-black">R$ {balanceUsed.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {balanceEarned > 0 && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400 font-bold">Crédito App (Lucro)</span>
                                                        <span className="text-green-400 font-black">R$ {balanceEarned.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {(() => {
                                const savings = commandItems.reduce((acc, item) => {
                                    let originalPrice = 0;
                                    if (item.products) {
                                        originalPrice = Number(item.products.price);
                                    } else if (item.notes) {
                                        const tourMatch = tournamentItems.find(ti => item.notes.startsWith(ti.name));
                                        if (tourMatch) originalPrice = Number(tourMatch.price);
                                    }

                                    if (originalPrice > 0) {
                                        const diff = originalPrice - Number(item.unit_price_brl);
                                        if (diff > 0.01) return acc + (diff * (item.quantity || 1));
                                    }
                                    return acc;
                                }, 0);

                                if (savings > 0) {
                                    return (
                                        <div className="flex items-center justify-between mb-4 p-2 bg-primary/10 border border-primary/20 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-outlined text-sm text-primary">auto_awesome</span>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-wider">Benefício VIP</span>
                                            </div>
                                            <span className="text-xs font-black text-primary">- R$ {savings.toFixed(2)}</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-white uppercase tracking-widest">
                                    {selectedCommand.status === 'closed' ? 'Total Final' : 'Total Geral'}
                                </span>
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

        {/* Product Manager Modal */}
        {showProductMgr && selectedEvent && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowProductMgr(false)}>
                <div className="bg-[#080518] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Gerenciar Produtos</h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">Ocultar produtos deste evento: <span className="text-amber-400 font-bold">{selectedEvent.title}</span></p>
                        </div>
                        <button onClick={() => setShowProductMgr(false)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <span className="material-icons text-sm">close</span>
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-1 p-3 border-b border-white/5 flex-shrink-0">
                        {[
                            { key: 'bar', label: 'Bar', icon: 'local_bar' },
                            { key: 'jackpot', label: 'Jackpot', icon: 'stars' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setProductMgrSection(tab.key)}
                                className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${productMgrSection === tab.key ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                <span className="material-icons-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="px-5 py-2 flex-shrink-0">
                        <p className="text-[10px] text-gray-500">
                            <span className="material-icons-outlined text-[11px] align-middle mr-1 text-amber-400">info</span>
                            Produtos <span className="text-red-400 font-bold">ocultos</span> ficam indisponíveis para lançamento neste evento. Os demais eventos não são afetados.
                        </p>
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-2">
                            {allProducts
                                .filter(p => p.category === productMgrSection && p.active)
                                .map(product => {
                                    const pid = String(product.id);
                                    const isExcluded = excludedProductIds.has(pid);
                                    return (
                                        <div
                                            key={pid}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isExcluded ? 'bg-red-500/5 border-red-500/20 opacity-60' : 'bg-white/5 border-white/10'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isExcluded ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}`}>
                                                    <span className="material-icons-outlined text-sm">{isExcluded ? 'visibility_off' : 'inventory_2'}</span>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black uppercase ${isExcluded ? 'line-through text-gray-500' : 'text-white'}`}>{product.name}</p>
                                                    <p className="text-[10px] text-gray-500">R$ {Number(product.price).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleProductExclusion(product)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isExcluded
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white'
                                                }`}
                                            >
                                                {isExcluded ? (
                                                    <><span className="material-icons-outlined text-[12px] align-middle mr-1">visibility</span>Mostrar</>
                                                ) : (
                                                    <><span className="material-icons-outlined text-[12px] align-middle mr-1">visibility_off</span>Ocultar</>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            {allProducts.filter(p => p.category === productMgrSection && p.active).length === 0 && (
                                <div className="text-center py-8 text-gray-600">
                                    <span className="material-icons-outlined text-3xl block mb-2 opacity-30">inventory_2</span>
                                    <p className="text-xs">Nenhum produto nesta categoria</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 flex-shrink-0 flex items-center justify-between">
                        <p className="text-[10px] text-gray-500">
                            {excludedProductIds.size} produto(s) oculto(s) neste evento
                        </p>
                        <button
                            onClick={() => setShowProductMgr(false)}
                            className="px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase hover:bg-primary/80 transition-colors"
                        >
                            Concluído
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
