import React, { useState } from 'react';
import { Event } from '../../types';
import { WalletMonitorTab } from './WalletMonitorTab';

interface ReportsTabProps {
    reportFilter: 'event' | 'date' | 'product';
    setReportFilter: (f: 'event' | 'date' | 'product') => void;
    reportData: any[];
    setReportData: (d: any[]) => void;
    reportCommandsData: any[];
    setReportCommandsData: (d: any[]) => void;
    extraReportData: any[];
    setExtraReportData: (d: any[]) => void;
    startDate: string;
    setStartDate: (s: string) => void;
    endDate: string;
    setEndDate: (s: string) => void;
    reportProductFilter: string;
    setReportProductFilter: (s: string) => void;
    reportCategoryFilter: string;
    setReportCategoryFilter: (s: string) => void;
    selectedEvent: Event | null;
    setSelectedEvent: (e: Event | null) => void;
    events: Event[];
    isLoading: boolean;
    fetchReport: (id: string) => Promise<void>;
    fetchMonthlyReport: (start: string, end: string) => Promise<void>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
    reportFilter, setReportFilter, reportData, setReportData,
    reportCommandsData, setReportCommandsData, extraReportData, setExtraReportData,
    startDate, setStartDate, endDate, setEndDate,
    reportProductFilter, setReportProductFilter, reportCategoryFilter, setReportCategoryFilter,
    selectedEvent, setSelectedEvent, events, isLoading,
    fetchReport, fetchMonthlyReport
}) => {
    const [reportsView, setReportsView] = useState<'financeiro' | 'carteiras'>('financeiro');
    // Local helper functions for the report UI
    const reportBySection = () => {
        const sections: Record<string, { total: number, items: any[] }> = {
            'Torneios': { total: 0, items: [] },
            'Cash Game': { total: 0, items: [] },
            'Bar': { total: 0, items: [] },
            'Outros': { total: 0, items: [] }
        };

        reportData.forEach(item => {
            const cat = (item.products?.category || (item.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')).toLowerCase();
            let section = 'Outros';
            if (cat === 'torneio') section = 'Torneios';
            else if (cat === 'cash') section = 'Cash Game';
            else if (cat === 'bar') section = 'Bar';

            sections[section].total += Number(item.total_price_brl);
            sections[section].items.push(item);
        });

        if (reportFilter !== 'event') {
            extraReportData.forEach(tx => {
                const section = 'Outros';
                sections[section].total += Math.abs(Number(tx.amount_brl));
                sections[section].items.push({ ...tx, isExtra: true });
            });
        }

        return sections;
    };

    const reportByProduct = () => {
        const products: Record<string, { qty: number, total: number, category: string }> = {};
        reportData.forEach(item => {
            const name = item.products?.name || item.notes || 'Item';
            const cat = item.products?.category || (item.notes?.startsWith('Cash Game') ? 'cash' : 'torneio');
            if (!products[name]) products[name] = { qty: 0, total: 0, category: cat };
            products[name].qty += item.quantity;
            products[name].total += Number(item.total_price_brl);
        });
        if (reportFilter !== 'event') {
            extraReportData.forEach(tx => {
                const name = tx.description || 'Transação';
                const cat = tx.category || 'outros';
                if (!products[name]) products[name] = { qty: 0, total: 0, category: cat };
                products[name].qty += 1;
                products[name].total += Math.abs(Number(tx.amount_brl));
            });
        }
        return Object.entries(products).sort((a, b) => b[1].total - a[1].total);
    };

    const availableCategories = [...new Set([
        ...reportData.map(i => i.products?.category || (i.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')),
        ...extraReportData.map(i => i.category || 'outros')
    ])].filter(Boolean);

    const availableProducts = [...new Set([
        ...reportData.map(i => i.products?.name || i.notes || 'Item'),
        ...extraReportData.map(i => i.description || 'Transação')
    ])].filter(Boolean);

    const filteredReportItems = reportData.filter(i => {
        if (reportProductFilter !== 'all' && (i.products?.name || i.notes || 'Item') !== reportProductFilter) return false;
        if (reportCategoryFilter !== 'all' && (i.products?.category || (i.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')) !== reportCategoryFilter) return false;
        return true;
    });

    const filteredExtraReportItems = extraReportData.filter(i => {
        if (reportProductFilter !== 'all' && (i.description || 'Transação') !== reportProductFilter) return false;
        if (reportCategoryFilter !== 'all' && (i.category || 'outros') !== reportCategoryFilter) return false;
        return true;
    });

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Main View Switcher */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => setReportsView('financeiro')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${reportsView === 'financeiro'
                            ? 'bg-primary text-white border-primary shadow-neon-pink'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <span className="material-icons-outlined text-sm">bar_chart</span>
                    Relatório Financeiro
                </button>
                <button
                    onClick={() => setReportsView('carteiras')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${reportsView === 'carteiras'
                            ? 'bg-primary text-white border-primary shadow-neon-pink'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <span className="material-icons-outlined text-sm">monitoring</span>
                    Monitor de Carteiras
                </button>
            </div>

            {/* Wallet Monitor View */}
            {reportsView === 'carteiras' && (
                <WalletMonitorTab />
            )}

            {/* Financial Report View */}
            {reportsView === 'financeiro' && (<>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase">Relatório Financeiro</h3>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => { setReportFilter('event'); setReportData([]); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'event' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Evento</button>
                            <button onClick={() => { setReportFilter('date'); setReportData([]); setReportProductFilter('all'); setReportCategoryFilter('all'); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'date' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Período</button>
                            <button onClick={() => { setReportFilter('product'); setReportData([]); setExtraReportData([]); setReportProductFilter('all'); setReportCategoryFilter('all'); fetchMonthlyReport(startDate, endDate); }} className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${reportFilter === 'product' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>Por Produto</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {reportFilter === 'event' ? (
                            <>
                                <select value={selectedEvent?.id || ''} onChange={e => { const ev = events.find(x => x.id === e.target.value) || null; setSelectedEvent(ev); if (ev) fetchReport(ev.id); }}
                                    className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-sm font-bold min-w-[200px]"
                                    style={{ backgroundColor: '#0a0720' }}>
                                    <option value="" style={{ backgroundColor: '#0a0720' }}>Selecionar Evento</option>
                                    {events.map(ev => <option key={ev.id} value={ev.id} style={{ backgroundColor: '#0a0720' }}>{ev.title} ({new Date(ev.date).toLocaleDateString('pt-BR')})</option>)}
                                </select>
                                {selectedEvent && <button onClick={() => fetchReport(selectedEvent.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all"><span className="material-icons-outlined text-sm text-gray-400">refresh</span></button>}
                            </>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 bg-[#0a0720] border border-white/10 rounded-xl px-3 py-1">
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-gray-400 font-bold text-sm outline-none w-32 custom-date-input" />
                                    <span className="text-gray-500 font-black">até</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-gray-400 font-bold text-sm outline-none w-32 custom-date-input" />
                                    <button onClick={() => fetchMonthlyReport(startDate, endDate)} className="p-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all shadow-neon-pink ml-2"><span className="material-icons-outlined text-sm">search</span></button>
                                </div>

                                {reportFilter === 'product' && reportData.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={reportCategoryFilter}
                                            onChange={e => { setReportCategoryFilter(e.target.value); setReportProductFilter('all'); }}
                                            className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-[10px] font-black uppercase"
                                        >
                                            <option value="all">Todas Categorias</option>
                                            {availableCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                        </select>

                                        <select
                                            value={reportProductFilter}
                                            onChange={e => setReportProductFilter(e.target.value)}
                                            className="bg-[#0a0720] border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-[10px] font-black uppercase max-w-[200px]"
                                        >
                                            <option value="all">Todos Produtos</option>
                                            {availableProducts
                                                .filter(p => {
                                                    if (reportCategoryFilter === 'all') return true;
                                                    const isCmdProd = reportData.some(i => (i.products?.name || i.notes || 'Item') === p && (i.products?.category || (i.notes?.startsWith('Cash Game') ? 'cash' : 'torneio')) === reportCategoryFilter);
                                                    const isExtraProd = extraReportData.some(i => (i.description || 'Transação') === p && (i.category || 'outros') === reportCategoryFilter);
                                                    return isCmdProd || isExtraProd;
                                                })
                                                .map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {reportData.length === 0 ? (
                    <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                        <span className="material-icons-outlined text-4xl opacity-20 block mb-2">analytics</span>
                        <p className="italic">{reportFilter === 'event' ? 'Selecione um evento.' : 'Selecione as datas e clique em buscar.'}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Total Bruto',
                                    val: `R$ ${(filteredReportItems.reduce((s, i) => s + Number(i.total_price_brl), 0) + (reportFilter !== 'event' ? filteredExtraReportItems.reduce((s, i) => s + Math.abs(Number(i.amount_brl)), 0) : 0)).toFixed(2)}`,
                                    color: 'text-white'
                                },
                                {
                                    label: 'Total Itens',
                                    val: filteredReportItems.reduce((s, i) => s + i.quantity, 0) + (reportFilter !== 'event' ? filteredExtraReportItems.length : 0),
                                    color: 'text-white'
                                },
                                {
                                    label: 'Quebra de Caixa',
                                    val: `R$ ${(reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.discount_brl || 0), 0) : 0).toFixed(2)}`,
                                    color: 'text-red-400'
                                },
                                {
                                    label: 'Pagamento em Fichas',
                                    val: `R$ ${(reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0) : 0).toFixed(2)}`,
                                    color: 'text-yellow-400'
                                },
                                {
                                    label: 'Comandas',
                                    val: [...new Set(filteredReportItems.map(i => i.command_id))].length + (reportFilter !== 'event' ? filteredExtraReportItems.length : 0),
                                    color: 'text-white'
                                }
                            ].map(c => (
                                <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">{c.label}</p>
                                    <p className={`text-xl font-display font-black ${c.color}`}>{c.val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <span className="material-icons-outlined text-red-500">trending_down</span>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase">Faturamento Líquido</p>
                                    <p className="text-[10px] text-gray-500">Total Geral - (Quebra + Pagamento em Fichas)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-display font-black text-green-400">
                                    R$ {(
                                        filteredReportItems.reduce((s, i) => s + Number(i.total_price_brl), 0) +
                                        (reportFilter !== 'event' ? filteredExtraReportItems.reduce((s, i) => s + Math.abs(Number(i.amount_brl)), 0) : 0) -
                                        (reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.discount_brl || 0), 0) : 0) -
                                        (reportProductFilter === 'all' && reportCategoryFilter === 'all' ? reportCommandsData.reduce((s, c) => s + Number(c.chips_payment_brl || 0), 0) : 0)
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        {reportFilter === 'product' ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex items-center justify-between">
                                    <span className="text-sm font-black text-white uppercase tracking-widest">Ranking de Vendas por Produto</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-black">{startDate} a {endDate}</span>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-black/40">
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Produto</th>
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Categoria</th>
                                            <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase">Quantidade</th>
                                            <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase">Total Arrecadado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportByProduct().map(([name, data]) => (
                                            <tr key={name} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons-outlined text-primary text-base">inventory_2</span>
                                                        <span className="text-white font-bold">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black uppercase text-gray-400 border border-white/10">
                                                        {data.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-white font-display font-black">{data.qty}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-primary font-display font-black">R$ {data.total.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : Object.entries(reportBySection()).map(([section, data]) => (
                            <div key={section} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
                                    <span className="text-sm font-black text-white uppercase tracking-widest">{section}</span>
                                    <span className="text-primary font-black">R$ {data.total.toFixed(2)}</span>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-black/40">
                                            <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase">Item / Detalhe</th>
                                            <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase">Qtd</th>
                                            <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((i, idx) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons-outlined text-[10px] text-gray-500">{i.isExtra ? 'account_balance_wallet' : 'receipt_long'}</span>
                                                        <div>
                                                            <p className="text-white font-bold">{i.products?.name || i.description || i.notes || 'Sem nome'}</p>
                                                            <p className="text-[9px] text-gray-500 uppercase">{i.commands?.profiles?.name || i.profiles?.name || 'Venda Direta'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-white font-bold">{i.quantity || 1}</td>
                                                <td className="px-4 py-3 text-right text-white font-bold">R$ {Number(i.total_price_brl || i.amount_brl || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </>)}
        </div>
    );
};
