import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { RankingPlayer } from '../../types';

interface StockTabProps {
    currentUser: RankingPlayer;
}

export const StockTab: React.FC<StockTabProps> = ({ currentUser }) => {
    const [view, setView] = useState<'overview' | 'purchase' | 'recipe'>('overview');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('inventory_items').select('*').order('name');
            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#050214] text-white">
            <header className="px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-xl font-display font-black uppercase text-white mb-4">Controle de Estoque</h1>
                <div className="flex gap-2">
                    <button onClick={() => setView('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${view === 'overview' ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Visão Geral</button>
                    <button onClick={() => setView('purchase')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${view === 'purchase' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-emerald-500 hover:bg-white/10'}`}>Nova Compra (+)</button>
                    <button onClick={() => setView('recipe')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${view === 'recipe' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-purple-400 hover:bg-white/10'}`}>Cardápio / Baixa</button>
                </div>
            </header>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <>
                        {view === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider mb-2">Total de Itens</p>
                                        <h3 className="text-3xl font-black">{items.length}</h3>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                                        <p className="text-xs text-gray-400 uppercase font-black tracking-wider mb-2">Valor em Estoque</p>
                                        <h3 className="text-3xl font-black text-emerald-400">R$ {items.reduce((acc, i) => acc + (Number(i.current_stock) * Number(i.average_cost_brl)), 0).toFixed(2)}</h3>
                                    </div>
                                </div>
                                
                                <h2 className="text-lg font-bold mt-8 mb-4 uppercase tracking-widest text-gray-400">Insumos Cadastrados</h2>
                                {items.length === 0 ? (
                                    <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center">
                                        <span className="material-icons-outlined text-4xl text-gray-600 mb-2">inventory_2</span>
                                        <p className="text-gray-400">Nenhum item cadastrado no estoque ainda.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                        {items.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-sm uppercase">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 uppercase">{item.category} • {item.unit_type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-emerald-400">{Number(item.current_stock).toFixed(2)}</div>
                                                    <div className="text-[10px] text-gray-400">R$ {Number(item.average_cost_brl).toFixed(2)} / un</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {view === 'purchase' && (
                            <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center">
                                <span className="material-icons-outlined text-4xl text-emerald-500 mb-2">add_shopping_cart</span>
                                <p className="text-gray-400">O formulário de Nova Compra será construído aqui na Fase 2.</p>
                            </div>
                        )}
                        {view === 'recipe' && (
                            <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center">
                                <span className="material-icons-outlined text-4xl text-purple-500 mb-2">restaurant_menu</span>
                                <p className="text-gray-400">A central de Ficha Técnica (Cardápio / Baixa de Produção) será construída aqui na Fase 2.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
