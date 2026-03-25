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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Purchase Form State
    const [purchaseMode, setPurchaseMode] = useState<'new' | 'existing'>('existing');
    const [pItemId, setPItemId] = useState('');
    const [pName, setPName] = useState('');
    const [pCategory, setPCategory] = useState('bar');
    const [pUnitType, setPUnitType] = useState('unidade');
    const [pQuantity, setPQuantity] = useState('');
    const [pTotalCost, setPTotalCost] = useState('');
    const [pDescription, setPDescription] = useState('');

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

    const resetPurchaseForm = () => {
        setPItemId('');
        setPName('');
        setPCategory('bar');
        setPUnitType('unidade');
        setPQuantity('');
        setPTotalCost('');
        setPDescription('');
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pQuantity || Number(pQuantity) <= 0 || !pTotalCost || Number(pTotalCost) < 0) {
            alert('Preencha a quantidade e o custo corretamente.');
            return;
        }

        setIsSubmitting(true);
        try {
            let actualItemId = pItemId;

            if (purchaseMode === 'new') {
                if (!pName) {
                    alert('Insira o nome do insumo.');
                    setIsSubmitting(false);
                    return;
                }
                const unitCost = Number(pTotalCost) / Number(pQuantity);
                // Create item
                const { data: newItem, error: errNew } = await supabase.from('inventory_items').insert([{
                    name: pName,
                    category: pCategory,
                    unit_type: pUnitType,
                    current_stock: Number(pQuantity),
                    average_cost_brl: unitCost
                }]).select().single();
                if (errNew) throw errNew;
                actualItemId = newItem.id;
            }

            // Create movement log
            const { error: errMove } = await supabase.from('inventory_movements').insert([{
                item_id: actualItemId,
                admin_id: currentUser.id,
                type: 'in',
                quantity: Number(pQuantity),
                total_cost_brl: Number(pTotalCost),
                description: pDescription || 'Entrada via Compras'
            }]);
            if (errMove) throw errMove;

            // If existing, update stock & avg cost
            if (purchaseMode === 'existing') {
                const item = items.find(i => i.id === actualItemId);
                if (item) {
                    const newStock = Number(item.current_stock) + Number(pQuantity);
                    const oldTotalVal = Number(item.current_stock) * Number(item.average_cost_brl);
                    const newAvgCost = (oldTotalVal + Number(pTotalCost)) / newStock;
                    const { error: errUpdate } = await supabase.from('inventory_items')
                        .update({ current_stock: newStock, average_cost_brl: newAvgCost })
                        .eq('id', actualItemId);
                    if (errUpdate) throw errUpdate;
                }
            }

            // DEDUCT FROM FINANCIAL DASHBOARD (Caixa Geral)
            if (Number(pTotalCost) > 0) {
                const { error: errTx } = await supabase.from('club_transactions').insert([{
                    amount_brl: Number(pTotalCost),
                    type: 'debit',
                    category: pCategory === 'bar' ? 'estoque_bar' : pCategory === 'cozinha' ? 'estoque_cozinha' : 'estoque_equip',
                    description: `Compra de Insumos: ${purchaseMode === 'new' ? pName : items.find(i => i.id === actualItemId)?.name}`,
                    payment_method: 'outros',
                    admin_id: currentUser.id
                }]);
                if (errTx) console.warn('Erro ao lançar no caixa:', errTx);
            }

            alert('✅ Estoque atualizado e despesa lançada no Caixa Geral!');
            resetPurchaseForm();
            setView('overview');
            fetchInventory();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao registrar entrada: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <form onSubmit={handlePurchase} className="max-w-2xl mx-auto space-y-6 bg-black/40 border border-white/10 rounded-3xl p-6">
                                <h2 className="text-xl font-black uppercase text-white border-b border-white/10 pb-4 flex items-center gap-2">
                                    <span className="material-icons-outlined text-emerald-500">add_shopping_cart</span> Entrada de Estoque
                                </h2>
                                
                                <div className="flex gap-2 p-1 bg-[#050214] border border-white/10 rounded-2xl w-fit">
                                    <button type="button" onClick={() => setPurchaseMode('existing')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${purchaseMode === 'existing' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 opacity-50'}`}>Estoque Existente</button>
                                    <button type="button" onClick={() => setPurchaseMode('new')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${purchaseMode === 'new' ? 'bg-primary text-white shadow-neon-pink' : 'text-gray-400 opacity-50'}`}>Novo Insumo</button>
                                </div>

                                {purchaseMode === 'existing' ? (
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Selecione o Insumo</label>
                                        <select required value={pItemId} onChange={e => setPItemId(e.target.value)} className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none">
                                            <option value="">-- Selecione --</option>
                                            {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit_type})</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome do Insumo</label>
                                                <input required type="text" value={pName} onChange={e => setPName(e.target.value)} placeholder="Ex: Carne Moída Patinho" className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria Física</label>
                                                <select value={pCategory} onChange={e => setPCategory(e.target.value)} className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none">
                                                    <option value="bar">Bar (Bebidas, Salgadinhos)</option>
                                                    <option value="cozinha">Cozinha (Alimentos)</option>
                                                    <option value="limpeza">Limpeza / Descartáveis</option>
                                                    <option value="equipamentos">Equipamentos / Suprimentos</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Unidade de Medida Interna (Como você vai guardar)</label>
                                            <select value={pUnitType} onChange={e => setPUnitType(e.target.value)} className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none">
                                                <option value="unidade">Unidades Finais (Latas, Pacotes, etc)</option>
                                                <option value="kg">Quilogramas (Kg)</option>
                                                <option value="litro">Litros (L)</option>
                                            </select>
                                            <p className="text-[10px] text-gray-500 mt-1 ml-1">*Dica: Se você compra Fardos mas vende/consome em Latas, escolha 'Unidades' e lance a compra do fardo multiplicada (ex: 15 fardos = 180 unidades).</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-2 ml-1">Quantidades Entrando</label>
                                        <input required type="number" step="0.01" value={pQuantity} onChange={e => setPQuantity(e.target.value)} placeholder="Ex: 5" className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm font-black focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-red-500 uppercase mb-2 ml-1">Nota da Compra (Custo Total R$)</label>
                                        <input required type="number" step="0.01" value={pTotalCost} onChange={e => setPTotalCost(e.target.value)} placeholder="0.00" className="w-full bg-red-500/5 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-black focus:border-red-500 outline-none" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Fornecedor / Descrição Adicional</label>
                                    <input type="text" value={pDescription} onChange={e => setPDescription(e.target.value)} placeholder="Supermercado Assaí..." className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <span className="material-icons-outlined text-orange-500">warning</span>
                                        <p className="text-xs text-orange-400">Ao CADASTRAR essa compra, o valor de <strong>R$ {Number(pTotalCost || 0).toFixed(2)}</strong> será subtraído <strong>imediatamente</strong> do painel <strong>Caixa Geral</strong> como uma despesa administrativa.</p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (purchaseMode === 'existing' && !pItemId)}
                                    className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Registrando Compra...' : 'Finalizar e Alimentar Estoque'}
                                </button>
                            </form>
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
