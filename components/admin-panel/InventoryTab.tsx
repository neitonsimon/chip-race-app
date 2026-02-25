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
    newCategory: any;
    setNewCategory: (c: any) => void;
    handleAddCategory: () => Promise<void>;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
    newProduct, setNewProduct, allProducts, selectedCategory, setSelectedCategory,
    handleCreateProduct, toggleProductStatus, deleteProduct, isLoading,
    productCategories, newCategory, setNewCategory, handleAddCategory
}) => {
    const displayCategories = productCategories;

    return (
        <div className="p-8 max-w-6xl mx-auto pb-32">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-2xl">
                    <span className="material-icons-outlined text-orange-500 text-3xl">inventory_2</span>
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest">Estoque & Produtos</h3>
                    <p className="text-gray-400 text-sm">Gerencie o catálogo de produtos, taxas e serviços do clube.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Forms Section */}
                <div className="space-y-6">
                    {/* Create Product */}
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons text-primary text-sm">add_circle</span> Cadastrar Produto
                        </h4>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Preço Sugerido (R$)</label>
                                    <input
                                        type="number"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-black focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Condicional / Unid.</label>
                                    <input
                                        type="text"
                                        value={newProduct.price_unit}
                                        onChange={e => setNewProduct({ ...newProduct, price_unit: e.target.value })}
                                        placeholder="unid, dia, mes..."
                                        className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateProduct}
                                disabled={isLoading || !newProduct.name || !newProduct.price}
                                className="w-full bg-primary hover:bg-white hover:text-black text-white font-black py-4 rounded-2xl transition-all shadow-neon-pink uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
                            >
                                {isLoading ? 'SALVANDO...' : 'CADASTRAR PRODUTO'}
                            </button>
                        </div>
                    </div>

                    {/* Create Category */}
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                            <span className="material-icons text-secondary text-sm">category</span> Nova Categoria
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">ID / Slug (Sem espaços)</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    placeholder="ex: vinhos_premium"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Nome de Exibição</label>
                                <input
                                    type="text"
                                    value={newCategory.label}
                                    onChange={e => setNewCategory({ ...newCategory, label: e.target.value })}
                                    placeholder="Ex: Vinhos Premium"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Ícone (Material Icons)</label>
                                <input
                                    type="text"
                                    value={newCategory.icon}
                                    onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                                    placeholder="ex: local_bar"
                                    className="w-full bg-[#050214] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                                />
                            </div>
                            <button
                                onClick={handleAddCategory}
                                disabled={isLoading || !newCategory.name || !newCategory.label}
                                className="w-full bg-secondary hover:bg-white hover:text-black text-black font-black py-4 rounded-2xl transition-all shadow-neon-blue uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
                            >
                                {isLoading ? 'SALVANDO...' : 'CRIAR CATEGORIA'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                                <span className="material-icons text-primary text-sm">list</span> Lista de Itens ({allProducts.length})
                            </h4>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-[#050214] border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-400 font-black uppercase outline-none focus:border-primary"
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
                                    <div key={p.id} className={`bg-black/20 border rounded-2xl p-4 flex items-center justify-between transition-all ${p.active ? 'border-white/5' : 'border-red-500/20 opacity-60 grayscale'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase ${p.category === 'torneio' ? 'bg-blue-500/20 text-blue-400' : p.category === 'cash' ? 'bg-green-500/20 text-green-400' : p.category === 'bar' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {p.category.substring(0, 3)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{p.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-500 uppercase font-black">{p.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                    <span className="text-[10px] text-primary font-black">R$ {Number(p.price || 0).toFixed(2)}{p.price_unit ? ` / ${p.price_unit}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleProductStatus(p)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${p.active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500'}`}
                                                title={p.active ? 'Desativar Produto' : 'Ativar Produto'}
                                            >
                                                <span className="material-icons-outlined text-base">{p.active ? 'visibility' : 'visibility_off'}</span>
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
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
