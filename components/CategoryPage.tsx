import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { TournamentCategory } from '../types';

interface CategoryPageProps {
    categoryId: string;
    category?: TournamentCategory;
    onNavigate: (view: string) => void;
    isAdmin?: boolean;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId, category, onNavigate, isAdmin }) => {
    const [productDetails, setProductDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProductInfo = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', categoryId)
                    .eq('active', true)
                    .limit(1)
                    .single();

                if (data) {
                    setProductDetails(data);
                }
            } catch (e) {
                console.error('Error fetching product:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductInfo();
    }, [categoryId]);

    const getColors = (color?: string) => {
        switch (color) {
            case 'primary': return { glow: 'from-primary/20', text: 'text-primary' };
            case 'secondary': return { glow: 'from-secondary/20', text: 'text-secondary' };
            case 'cyan': return { glow: 'from-cyan-500/20', text: 'text-cyan-500' };
            case 'pink': return { glow: 'from-pink-500/20', text: 'text-pink-500' };
            case 'amber': return { glow: 'from-amber-500/20', text: 'text-amber-500' };
            case 'emerald': return { glow: 'from-emerald-500/20', text: 'text-emerald-500' };
            case 'blue': return { glow: 'from-blue-500/20', text: 'text-blue-500' };
            case 'orange': return { glow: 'from-orange-500/20', text: 'text-orange-500' };
            case 'purple': return { glow: 'from-purple-500/20', text: 'text-purple-500' };
            case 'red': return { glow: 'from-red-500/20', text: 'text-red-500' };
            default: return { glow: 'from-white/10', text: 'text-gray-400' };
        }
    };

    const styles = getColors(category?.color);

    return (
        <div className="pt-24 pb-20 bg-background-light dark:bg-background-dark min-h-screen relative flex flex-col items-center justify-center">
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent opacity-10 pointer-events-none`}></div>

            <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col items-center">
                <button
                    onClick={() => onNavigate('home')}
                    className="mb-8 flex items-center self-start gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-outlined">arrow_back</span>
                    Voltar para Início
                </button>

                <div className="bg-surface-dark w-full border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${styles.glow}`}></div>

                    <div className="w-24 h-24 rounded-3xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${styles.glow}`}></div>
                        {productDetails?.image_url ? (
                            <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover relative z-10" />
                        ) : (
                            <span className={`material-icons-outlined text-4xl relative z-10 ${styles.text}`}>
                                {category?.icon || 'category'}
                            </span>
                        )}
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
                        {productDetails?.name || category?.title || 'Categoria Não Encontrada'}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full mb-8"></div>

                    {category?.is_mystery && !isAdmin ? (
                        <div className="py-8 flex flex-col items-center justify-center">
                            <span className="material-icons-outlined text-6xl text-gray-600 mb-4 animate-pulse">lock</span>
                            <h3 className="text-xl font-display font-black text-gray-400 uppercase tracking-widest">Em Breve</h3>
                            <p className="text-sm text-gray-500 mt-2">Os detalhes desta categoria ainda são um mistério.</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-left h-full">
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
                                {productDetails ? 'DESCRIÇÃO DO PRODUTO' : 'SOBRE A CATEGORIA'}
                            </h4>
                            <div className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                                {productDetails?.description || category?.description || 'Em breve mais detalhes sobre esta categoria.'}
                            </div>
                        </div>
                    )}

                    {!category?.is_mystery && (
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => onNavigate('home')}
                                className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-white/10 transition-all hover:scale-[1.02]"
                            >
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
