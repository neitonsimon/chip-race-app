import React, { useState, useEffect } from 'react';
import { PlayerStats, ChipzPackage } from '../types';
import { supabase } from '../src/lib/supabase';

interface RechargePageProps {
    currentUser: PlayerStats;
    onNavigate: (view: string) => void;
    onUpdateProfile?: (originalName: string, updatedData: PlayerStats) => void;
}

export const RechargePage: React.FC<RechargePageProps> = ({ currentUser, onNavigate, onUpdateProfile }) => {
    const [activeTab, setActiveTab] = useState<'brl' | 'chipz'>('brl');
    const [isProcessing, setIsProcessing] = useState(false);
    const [customBrlAmount, setCustomBrlAmount] = useState<string>('');

    const [chipzPackages, setChipzPackages] = useState<ChipzPackage[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            setIsLoadingPackages(true);
            try {
                const { data, error } = await supabase
                    .from('chipz_packages')
                    .select('*')
                    .eq('active', true)
                    .order('amount', { ascending: true });

                if (error) throw error;
                if (data) setChipzPackages(data as ChipzPackage[]);
            } catch (err: any) {
                console.error('Erro ao carregar pacotes:', err);
            } finally {
                setIsLoadingPackages(false);
            }
        };

        fetchPackages();
    }, []);

    const handlePurchase = async (id: string, type: 'brl' | 'chipz') => {
        setIsProcessing(true);
        try {
            if (type === 'chipz') {
                const pack = chipzPackages.find(p => p.id === id);
                if (!pack) return;

                const cost = pack.price_brl;
                const totalChipz = pack.amount + (pack.bonus || 0);
                const currentBalance = currentUser.balanceBrl || 0;

                if (currentBalance < cost) {
                    alert(`Saldo insuficiente! Seu saldo atual é R$ ${currentBalance.toFixed(2).replace('.', ',')}. Você precisa de R$ ${cost.toFixed(2).replace('.', ',')} para este pacote.`);
                    setIsProcessing(false);
                    return;
                }

                if (!window.confirm(`Confirma a compra de ${totalChipz} Chipz por R$ ${cost.toFixed(2).replace('.', ',')}? Isso será descontado do seu saldo de reais.`)) {
                    setIsProcessing(false);
                    return;
                }

                // Chamar RPC para atualizar ambos os saldos de forma segura
                const { error: txError } = await supabase.rpc('secure_balance_transaction', {
                    user_id: currentUser.id,
                    brl_amount: -cost,
                    chipz_amount: totalChipz,
                    description: `Compra: Pacote Chipz - ${pack.name}`
                });

                if (txError) {
                    console.error('Erro na transação de compra:', txError);
                    alert('Falha na transação. Tente novamente em alguns instantes.');
                    setIsProcessing(false);
                    return;
                }

                if (onUpdateProfile) {
                    const newPlayerData = {
                        ...currentUser,
                        balanceBrl: (currentUser.balanceBrl || 0) - cost,
                        balanceChipz: (currentUser.balanceChipz || 0) + totalChipz
                    };
                    onUpdateProfile(currentUser.name, newPlayerData);
                }

                alert(`Sucesso! Você adquiriu o pacote ${pack.name} e recebeu ${totalChipz} Chipz.`);
            } else {
                // Type BRL (Recharge Wallet)
                await new Promise(resolve => setTimeout(resolve, 1500));

                const amountToAdd = parseFloat(id);
                if (isNaN(amountToAdd) || amountToAdd <= 0) return;

                const newBalanceBrl = (currentUser.balanceBrl || 0) + amountToAdd;
                const newPlayerData = { ...currentUser, balanceBrl: newBalanceBrl };

                if (onUpdateProfile) {
                    onUpdateProfile(currentUser.name, newPlayerData);
                }

                setCustomBrlAmount('');
                alert(`Sucesso! R$ ${amountToAdd.toFixed(2)} foram adicionados à sua carteira.`);
            }
        } catch (err: any) {
            console.error('Erro na compra:', err);
            alert('Falha ao processar solicitação.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-8">

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <button
                        onClick={() => onNavigate('home')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                    >
                        <span className="material-icons-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Voltar
                    </button>
                    <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight">Carteira & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Recarga</span></h1>
                    <p className="text-gray-400 mt-2 text-lg">Gerencie seus saldos e adquira mais créditos para jogar.</p>
                </div>

                {/* Current Balances Display */}
                <div className="flex gap-4">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl p-4 flex flex-col min-w-[140px] relative overflow-hidden group hover:border-green-500/50 transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full group-hover:bg-green-500/20 transition-colors"></div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <span className="material-icons-outlined text-[14px] text-green-500">account_balance_wallet</span> Reais
                        </span>
                        <span className="text-2xl font-black text-white">R$ {(currentUser.balanceBrl || 0).toFixed(2)}</span>
                    </div>

                    <div className="bg-surface-dark border border-white/10 rounded-2xl p-4 flex flex-col min-w-[140px] relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl rounded-full group-hover:bg-primary/20 transition-colors"></div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <span className="material-icons-outlined text-[14px] text-primary bg-primary/20 rounded-full p-[2px]">token</span> Chipz
                        </span>
                        <span className="text-2xl font-black text-primary">{(currentUser.balanceChipz || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('brl')}
                    className={`pb-4 px-6 text-lg font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'brl' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="flex items-center gap-2">
                        <span className="material-icons-outlined">payments</span> Adicionar Reais
                    </span>
                    {activeTab === 'brl' && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-t-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('chipz')}
                    className={`pb-4 px-6 text-lg font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'chipz' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="flex items-center gap-2">
                        <span className="material-icons-outlined">token</span> Pacotes de Chipz
                    </span>
                    {activeTab === 'chipz' && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-neon-pink"></span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="relative">
                {isProcessing && (
                    <div className="absolute inset-0 z-10 bg-background-dark/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin mb-4"></div>
                        <span className="text-xl font-bold text-white uppercase tracking-widest animate-pulse">Processando...</span>
                    </div>
                )}

                {activeTab === 'brl' ? (
                    <div className="flex justify-center w-full">
                        <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden text-center shadow-2xl">
                            <div className="absolute top-4 right-[-35px] bg-green-500 text-black text-[10px] font-black uppercase py-1.5 px-12 rotate-45 shadow-lg">
                                PIX / CARTÃO
                            </div>

                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 mx-auto border border-green-500/20">
                                <span className="material-icons-outlined text-3xl text-green-400">account_balance_wallet</span>
                            </div>

                            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6 block">Comprar Reais</span>

                            <div className="flex justify-center items-center mb-4">
                                <span className="text-2xl font-black text-gray-500 mr-2 mt-2">R$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="0"
                                    value={customBrlAmount}
                                    onChange={(e) => setCustomBrlAmount(e.target.value)}
                                    className="w-full max-w-[200px] bg-transparent text-6xl font-black text-white text-center border-b-2 border-white/20 focus:border-green-500 outline-none transition-colors pb-2"
                                />
                            </div>

                            <p className="text-gray-500 text-sm mb-8 font-light">Digite o valor que deseja adicionar em sua carteira. Sem taxas adicionais.</p>

                            <div className="mt-auto pt-6 border-t border-white/10">
                                <button
                                    disabled={!customBrlAmount || Number(customBrlAmount) <= 0}
                                    onClick={() => handlePurchase(customBrlAmount, 'brl')}
                                    className="w-full bg-green-500 hover:bg-green-400 disabled:bg-white/5 disabled:text-gray-500 text-black font-black py-4 rounded-xl transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:shadow-none cursor-pointer"
                                >
                                    <span className="material-icons-outlined">payments</span> Prosseguir
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoadingPackages ? (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <span className="material-icons-outlined animate-spin text-4xl mb-2">refresh</span>
                                <p>Carregando pacotes disponíveis...</p>
                            </div>
                        ) : chipzPackages.map((pkg) => {
                            const isSoldOut = pkg.stock === 0;
                            return (
                                <div key={pkg.id} className={`bg-surface-dark border ${pkg.popular ? 'border-primary' : 'border-white/5'} rounded-2xl p-6 ${!isSoldOut ? 'hover:border-primary/50 hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all duration-300 group flex flex-col h-full relative overflow-hidden`} onClick={() => !isSoldOut && handlePurchase(pkg.id, 'chipz')}>

                                    {pkg.popular && !isSoldOut && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase py-1 px-4 rounded-b-lg shadow-neon-pink">
                                            Mais Popular
                                        </div>
                                    )}

                                    {isSoldOut && (
                                        <div className="absolute top-4 right-[-30px] bg-red-600 text-white text-[10px] font-black uppercase py-1 px-10 rotate-45 shadow-lg z-10">
                                            Esgotado
                                        </div>
                                    )}

                                    <div className={`mt-6 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${pkg.popular && !isSoldOut ? 'bg-gradient-to-br from-primary to-accent shadow-neon-pink' : 'bg-white/5 group-hover:bg-primary/20'} transition-colors`}>
                                        <span className={`material-icons-outlined text-3xl ${pkg.popular && !isSoldOut ? 'text-white' : 'text-gray-400 group-hover:text-primary'} ${isSoldOut && 'opacity-50'}`}>token</span>
                                    </div>

                                    <div className="text-center mb-6">
                                        <div className="text-3xl font-black text-white mb-1"><span className="text-primary">{pkg.amount}</span> Chipz</div>
                                        <div className="text-gray-400 text-sm">Moeda Virtual</div>
                                        {pkg.stock > 0 && (
                                            <div className="text-xs text-orange-400 font-bold mt-2 animate-pulse">
                                                Restam: ???
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/10">
                                        <button disabled={isSoldOut} className={`w-full ${pkg.popular && !isSoldOut ? 'bg-primary' : 'bg-white/5 group-hover:bg-primary/20'} text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed`}>
                                            Bloqueado
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Info Card Market */}
                        <div className="col-span-full mt-6 bg-accent/10 border border-accent/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons-outlined text-3xl text-accent">storefront</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase">Livre Mercado de Chipz (Em Breve)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    A Chip Race permitirá a venda de Chipz entre jogadores. Você poderá empacotar seus Chipz e anunciá-los no nosso marketplace para outros jogadores comprarem por Reais.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
