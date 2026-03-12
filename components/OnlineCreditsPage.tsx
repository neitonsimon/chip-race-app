import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../src/lib/supabase';
import { PlayerStats } from '../types';

interface OnlineCreditsPageProps {
    onNavigate: (view: string) => void;
    currentUser: PlayerStats;
    onUpdateProfile?: (id: string, updates: any) => void;
}

export const OnlineCreditsPage: React.FC<OnlineCreditsPageProps> = ({ onNavigate, currentUser, onUpdateProfile }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [supremaNickname, setSupremaNickname] = useState(currentUser?.suprema_nickname || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const currentBalance = currentUser?.balanceBrl || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!amount || amount <= 0) {
            setError('Por favor, informe um valor válido.');
            return;
        }
        if (amount > currentBalance) {
            setError('Saldo insuficiente para esta solicitação.');
            return;
        }
        if (!supremaNickname) {
            setError('Por favor, preencha seu Nickname da Suprema Poker.');
            return;
        }

        setIsLoading(true);

        try {
            // O RPC 'request_online_credits' já cuida de deduzir o saldo do usuário e criar o pedido
            const { data, error } = await supabase.rpc('request_online_credits', {
                p_amount: Number(amount),
                p_suprema_nickname: supremaNickname.trim(),
                p_suprema_id: 'N/A' // ID removido conforme solicitado
            });

            if (error) throw error;

            if (data && data.success) {
                setSuccess(`Solicitação de R$ ${amount.toFixed(2)} enviada com sucesso! Aguarde o envio das fichas.`);

                // Redireciona para o WhatsApp para confirmar os dados
                const text = encodeURIComponent(`Olá! Fiz uma solicitação de fichas pelo app e gostaria de confirmar:\n\n*Nome:* ${currentUser.name || 'Jogador'}\n*Nick Suprema:* ${supremaNickname.trim()}\n*Quantidade:* ${amount} Fichas\n\nAguardo o envio!`);
                window.open(`https://wa.me/5551992425186?text=${text}`, '_blank');

                setAmount('');

                // Atualiza os states locais para refletirem a Suprema (o BD já atualizou)
                if (onUpdateProfile) {
                    onUpdateProfile(currentUser.id, {
                        balanceBrl: currentBalance - Number(amount),
                        suprema_nickname: supremaNickname.trim()
                    });
                }
            }
        } catch (err: any) {
            console.error('Error requesting credits:', err);
            setError(err.message || 'Erro ao processar a solicitação. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-20 bg-background-light dark:bg-background-dark min-h-screen">
            <div className="w-full max-w-4xl mx-auto px-4 mt-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => onNavigate('home')}
                        className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:border-primary transition-colors"
                    >
                        <span className="material-icons-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Créditos Online
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Adquira fichas para jogar no nosso Home Game Online.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Info Card */}
                        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <span className="material-icons-outlined text-9xl">casino</span>
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                <img src="/suprema-logo.png" alt="Suprema Poker" className="h-16 w-auto object-contain bg-white rounded-xl p-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1"><span className="text-indigo-300">CLUBE:</span> CHIP RACE O N L I N E</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-neon-pink tracking-widest bg-black/40 px-3 py-1 rounded-lg">55641</span>
                                        <button onClick={() => navigator.clipboard.writeText('55641')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Copiar ID">
                                            <span className="material-icons-outlined text-sm">content_copy</span>
                                        </button>
                                    </div>
                                    <p className="text-indigo-200 text-sm mt-2">Home game oficial. Baixe o app Suprema Poker, busque pelo ID acima e solicite entrada.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">add_shopping_cart</span>
                                Comprar Fichas Online
                            </h3>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-500">
                                    <span className="material-icons-outlined shrink-0">error_outline</span>
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-start gap-3 text-green-500">
                                    <span className="material-icons-outlined shrink-0">check_circle</span>
                                    <p className="text-sm font-medium">{success}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                <div className="p-4 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Seu Saldo Disponível:</span>
                                    <span className="text-xl font-black text-primary">R$ {currentBalance.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Seu Nick na Suprema</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="material-icons-outlined text-gray-400 text-sm">person</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={supremaNickname}
                                                onChange={(e) => setSupremaNickname(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                placeholder="Ex: PokerKing99"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Valor da Recarga (R$)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-icons-outlined text-gray-400 text-sm">payments</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            max={currentBalance}
                                            step="1"
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value) || '')}
                                            className="w-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-4 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="0,00"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        1 BRL no app = 1 Ficha na Suprema Poker. O valor será deduzido imediatamente do seu saldo.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !amount || amount <= 0 || amount > currentBalance}
                                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading || !amount || amount <= 0 || amount > currentBalance
                                        ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                                        : 'bg-primary hover:bg-white text-white hover:text-primary hover:shadow-neon-pink'
                                        }`}
                                >
                                    {isLoading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined">send</span>
                                            Solicitar Fichas
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar Section */}
                    <div className="space-y-6">

                        {/* Instructions */}
                        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border border-white/10 shadow-xl">
                            <h4 className="text-base md:text-lg font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-primary text-xl">info</span>
                                Como Funciona
                            </h4>
                            <ul className="space-y-4 md:space-y-6 text-sm md:text-base text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-black md:text-lg">1.</span>
                                    <p className="leading-relaxed">Baixe o aplicativo <strong>Suprema Poker</strong> nas lojas oficiais (App Store ou Play Store).</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-black md:text-lg">2.</span>
                                    <p className="leading-relaxed">Crie sua conta e anote exatamente seu Nome (Nick).</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-black md:text-lg">3.</span>
                                    <p className="leading-relaxed">Entre na aba Clubes e busque pelo ID <strong>55641</strong>, solicitando a entrada no clube Chip Race.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-black md:text-lg">4.</span>
                                    <p className="leading-relaxed">Utilize esta página para transferir seu saldo da Carteira Virtual para o online. Em minutos a aprovação é concluída pelo administrador.</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
