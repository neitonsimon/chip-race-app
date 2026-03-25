import React from 'react';

interface InventoryTabProps {
    newProduct: any;
    setNewProduct: (p: any) => void;
    allProducts: any[];
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;
    handleCreateProduct: () => Promise<void>;
    toggleProductStatus: (p: any) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    isLoading: boolean;
    productCategories: any[];
    inventoryItems: any[];
    editingProduct: any | null;
    setEditingProduct: (p: any | null) => void;
    handleUpdateProduct: () => Promise<void>;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
    newProduct, setNewProduct, allProducts, selectedCategory, setSelectedCategory,
    handleCreateProduct, toggleProductStatus, deleteProduct, isLoading,
    productCategories, inventoryItems, editingProduct, setEditingProduct, handleUpdateProduct
}) => {
    const displayCategories = productCategories;

    const onProductClick = (p: any) => {
        setEditingProduct(p);
        setNewProduct({
            name: p.name,
            category: p.category,
            price: p.price.toString(),
            description: p.description || '',
            price_unit: p.price_unit || '',
            inventory_item_id: p.inventory_item_id || ''
        });
        // Scroll back to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingProduct(null);
        setNewProduct({ name: '', category: 'bar', price: '', description: '', price_unit: '', inventory_item_id: '' });
    };

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-32">
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-2xl flex-shrink-0">
                    <span className="material-icons-outlined text-orange-500 text-2xl sm:text-3xl">inventory_2</span>
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-widest">Estoque & Produtos</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Gerencie o catálogo de produtos, taxas e serviços.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Forms Section */}
                <div className="order-2 lg:order-1 space-y-6">
                    {/* Create/Edit Product */}
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-5 sm:p-6 sticky top-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs sm:text-sm font-black text-white uppercase flex items-center gap-2">
                                <span className={`material-icons text-sm ${editingProduct ? 'text-yellow-500' : 'text-primary'}`}>
                                    {editingProduct ? 'edit' : 'add_circle'}
                                </span>
                                {editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}
                            </h4>
                            {editingProduct && (
                                <button
                                    onClick={cancelEdit}
                                    className="text-[10px] text-red-400 font-black uppercase hover:text-red-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Categoria</label>
                                <select
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-primary outline-none"
                                >
                                    {displayCategories.map(cat => (
                                        <option key={cat.name} value={cat.name}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="Ex: Coca-Cola Lata 350ml"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-emerald-500 uppercase mb-2 ml-1">Vincular Base de Estoque (Opcional)</label>
                                <select
                                    value={newProduct.inventory_item_id || ''}
                                    onChange={e => setNewProduct({ ...newProduct, inventory_item_id: e.target.value })}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-emerald-400 text-sm focus:border-emerald-500 outline-none"
                                >
                                    <option value="">Não descontar do estoque</option>
                                    {inventoryItems?.map((item: any) => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.unit_type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Preço (R$)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={newProduct.price}
                                        onChange={e => {
                                            const val = e.target.value.replace(',', '.');
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                setNewProduct({ ...newProduct, price: val });
                                            }
                                        }}
                                        placeholder="0.00"
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Unid/Tipo</label>
                                    <input
                                        type="text"
                                        value={newProduct.price_unit}
                                        onChange={e => setNewProduct({ ...newProduct, price_unit: e.target.value })}
                                        placeholder="unid, dia..."
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Descrição / Vantagens (VIP)</label>
                                <textarea
                                    value={newProduct.description || ''}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Para VIPs, coloque uma vantagem por linha..."
                                    rows={3}
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none resize-none"
                                />
                            </div>
                            <button
                                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                                disabled={isLoading || !newProduct.name || !newProduct.price}
                                className={`w-full font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs mt-4 disabled:opacity-50 ${editingProduct ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-primary text-white shadow-neon-pink'}`}
                            >
                                {isLoading ? 'SALVANDO...' : editingProduct ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product List */}
                <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-4 sm:p-6 pb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h4 className="text-xs sm:text-sm font-black text-white uppercase flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">list</span> Itens ({allProducts.length})
                            </h4>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-[#050214] border border-white/10 rounded-xl px-4 py-2 text-[10px] text-gray-400 font-black uppercase outline-none focus:border-primary w-full sm:w-auto"
                            >
                                <option value="all">Ver Tudo</option>
                                {displayCategories.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            {allProducts
                                .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
                                .map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => onProductClick(p)}
                                        className={`bg-black/20 border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer hover:border-primary/40 group ${editingProduct?.id === p.id ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/5'} ${!p.active && 'opacity-60 grayscale'}`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase flex-shrink-0 ${p.category === 'torneio' ? 'bg-blue-500/20 text-blue-400' : p.category === 'cash' ? 'bg-green-500/20 text-green-400' : p.category === 'bar' ? 'bg-orange-500/20 text-orange-400' : p.category === 'vip' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {p.category.substring(0, 3)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                                                    {editingProduct?.id === p.id && <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-black uppercase">Editando</span>}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span className="text-[10px] text-gray-500 uppercase font-black">{p.category}</span>
                                                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-700"></span>
                                                    <span className="text-[10px] text-primary font-black">R$ {Number(p.price || 0).toFixed(2)}{p.price_unit ? ` / ${p.price_unit}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleProductStatus(p)}
                                                className={`flex-1 sm:flex-none h-10 px-3 sm:w-10 sm:px-0 rounded-xl sm:rounded-full flex items-center justify-center gap-2 transition-all ${p.active ? 'bg-green-500/10 text-green-500 hover:bg-yellow-500/10 hover:text-yellow-500' : 'bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500'}`}
                                                title={p.active ? 'Desativar Produto' : 'Ativar Produto'}
                                            >
                                                <span className="material-icons-outlined text-base">{p.active ? 'visibility' : 'visibility_off'}</span>
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                className="flex-1 sm:flex-none h-10 px-3 sm:w-10 sm:px-0 rounded-xl sm:rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 transition-all"
                                                title="Excluir Permanentemente"
                                            >
                                                <span className="material-icons-outlined text-base">delete_forever</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
