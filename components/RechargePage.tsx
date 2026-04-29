import React, { useState, useEffect } from 'react';
import { PlayerStats, ChipzPackage } from '../types';
import { supabase } from '../src/lib/supabase';

interface RechargePageProps {
    currentUser: PlayerStats;
    onNavigate: (view: string) => void;
    onUpdateProfile?: (targetId: string, updatedData: PlayerStats) => void;
}

export const RechargePage: React.FC<RechargePageProps> = ({ currentUser, onNavigate, onUpdateProfile }) => {
    const [activeTab, setActiveTab] = useState<'brl' | 'chipz' | 'cashout'>('brl');
    const [isProcessing, setIsProcessing] = useState(false);
    const [customBrlAmount, setCustomBrlAmount] = useState<string>('');
    const [cashOutAmount, setCashOutAmount] = useState<string>('');
    const [pixKey, setPixKey] = useState<string>('');
    const [pixType, setPixType] = useState<string>('cpf');

    const [chipzPackages, setChipzPackages] = useState<ChipzPackage[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            setIsLoadingPackages(true);
            try {
                const { data, error } = await supabase
                    .from('chipz_packages')
                    .select('*')
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

    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, payment_id: string } | null>(null);

    const handlePurchase = async (id: string, type: 'brl' | 'chipz') => {
        if (isProcessing) return;

        if (type === 'chipz') {
            alert('A venda de Chipz ainda não está disponível.');
            return;
        }

        setIsProcessing(true);
        setPixData(null);
        try {
            const amountToAdd = parseFloat(id);
            if (isNaN(amountToAdd) || amountToAdd <= 0) {
                setIsProcessing(false);
                return;
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) {
                throw new Error('Sessão expirada. Por favor, faça login novamente para continuar.');
            }

            const { data, error } = await supabase.functions.invoke('create-pix-payment', {
                body: {
                    amount: Number(amountToAdd.toFixed(2)),
                    description: `Recarga de Saldo - Chip Race`
                },
                headers: {
                    Authorization: `Bearer ${sessionData.session.access_token}`
                }
            });

            if (error || !data || data.error) {
                const errMsg = data?.error || error?.message || "Serviço de pagamento indisponível no momento.";
                throw new Error(errMsg);
            }

            setPixData({
                qr_code: data.qr_code,
                qr_code_base64: data.qr_code_base64,
                payment_id: data.payment_id
            });

        } catch (err: any) {
            console.error('Erro na compra:', err);
            alert(`Falha ao gerar cobrança: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!pixData?.payment_id) return;

        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from('payment_intents')
                .select('status, amount')
                .eq('gateway_id', pixData.payment_id)
                .single();

            if (!error && data && data.status === 'approved') {
                clearInterval(interval);

                if (onUpdateProfile) {
                    const { data: profile } = await supabase.from('profiles').select('balance_brl').eq('id', currentUser.id).single();
                    if (profile) {
                        onUpdateProfile(currentUser.id, { balanceBrl: Number(profile.balance_brl) } as any);
                    }
                }

                const bonusValue = data.amount * 0.10;
                const totalCredited = data.amount + bonusValue;
                alert(`Pagamento de R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} reconhecido! R$ ${totalCredited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} creditados (Bônus 10% aplicado)`);

                setPixData(null);
                setCustomBrlAmount('');
                setActiveTab('brl');
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pixData]);

    const availableToWithdraw = Math.max(0, (currentUser.balanceBrl || 0));

    const handleCashOut = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const amountToWithdraw = parseFloat(cashOutAmount);
            if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
                alert('Mínimo R$ 1,00');
                return;
            }
            if (amountToWithdraw > availableToWithdraw) {
                alert('Valor excede o limite disponível para saque.');
                return;
            }
            if (!pixKey) {
                alert('Informe a chave PIX.');
                return;
            }

            const { error: dbErr, data: rpcData } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: currentUser.id,
                p_brl_amount: -amountToWithdraw,
                p_description: `Solicitação de Saque via PIX`,
                p_category: 'wallet_withdrawal',
                p_metadata: { pix_key: pixKey, pix_type: pixType }
            });

            if (dbErr || rpcData === false) throw dbErr || new Error("Falha ao debitar saldo para saque. Tente novamente.");

            const { error: reqErr } = await supabase.from('withdrawal_requests').insert({
                user_id: currentUser.id,
                amount_brl: amountToWithdraw,
                pix_key: pixKey,
                pix_type: pixType,
                status: 'pending'
            });

            if (reqErr) throw reqErr;

            const { data: adminRoleData } = await supabase.from('profiles').select('id').in('role', ['admin', 'staff']);
            if (adminRoleData && adminRoleData.length > 0) {
                const notifications = adminRoleData.map(admin => ({
                    user_id: admin.id,
                    sender: 'Sistema',
                    sender_id: currentUser.id,
                    subject: '🚨 Nova Solicitação de Saque',
                    content: `O jogador ${currentUser.name} solicitou um saque de R$ ${amountToWithdraw.toFixed(2)}. Chave PIX: ${pixKey} (${pixType.toUpperCase()}). Acesse o painel de Atendimento para analisar.`,
                    category: 'system'
                }));
                await supabase.from('messages').insert(notifications);
            }

            if (onUpdateProfile) {
                const { data: updatedProf } = await supabase.from('profiles').select('balance_brl').eq('id', currentUser.id).single();
                if (updatedProf) {
                    onUpdateProfile(currentUser.id, { balanceBrl: Number(updatedProf.balance_brl) } as any);
                }
            }

            alert('Solicitação de saque enviada com sucesso! Aguarde a avaliação da administração.');
            setCashOutAmount('');
            setPixKey('');
        } catch (err: any) {
            console.error('Erro no cash out:', err);
            alert(`Falha ao solicitar saque: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full overflow-x-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="min-w-0">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                        >
                            <span className="material-icons-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Voltar
                        </button>
                        <h1 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight break-words">Carteira & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Recarga</span></h1>
                        <p className="text-gray-400 mt-2 text-base sm:text-lg">Gerencie seus saldos e adquira mais créditos para jogar.</p>
                    </div>

                    <div className="flex gap-2 sm:gap-4 overflow-x-hidden">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col flex-1 min-w-[140px] relative overflow-hidden group hover:border-green-500/50 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full group-hover:bg-green-500/20 transition-colors"></div>
                            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="material-icons-outlined text-[12px] sm:text-[14px] text-green-500">account_balance_wallet</span> REAIS
                            </span>
                            <span className="text-lg sm:text-2xl font-black text-white">R$ {(currentUser.balanceBrl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="bg-surface-dark border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col flex-1 min-w-[120px] relative overflow-hidden group hover:border-primary/50 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl rounded-full group-hover:bg-primary/20 transition-colors"></div>
                            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="material-icons-outlined text-[12px] sm:text-[14px] text-primary bg-primary/20 rounded-full p-[2px]">token</span> CHIPZ
                            </span>
                            <span className="text-lg sm:text-2xl font-black text-primary">{(currentUser.balanceChipz || 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <button
                        onClick={() => setActiveTab('brl')}
                        className={`pb-4 px-4 sm:px-6 text-base sm:text-lg font-bold uppercase tracking-wider transition-colors relative flex-shrink-0 ${activeTab === 'brl' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
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
                        className={`pb-4 px-4 sm:px-6 text-base sm:text-lg font-bold uppercase tracking-wider transition-colors relative flex-shrink-0 ${activeTab === 'chipz' ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-icons-outlined">token</span> Pacotes de Chipz
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400">EM BREVE</span>
                        </span>
                        {activeTab === 'chipz' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-neon-pink"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('cashout')}
                        className={`pb-4 px-4 sm:px-6 text-base sm:text-lg font-bold uppercase tracking-wider transition-colors relative flex-shrink-0 ${activeTab === 'cashout' ? 'text-accent' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-icons-outlined">account_balance</span> Sacar
                        </span>
                        {activeTab === 'cashout' && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>
                        )}
                    </button>
                </div>

                <div className="relative">
                    {isProcessing && (
                        <div className="absolute inset-0 z-10 bg-background-dark/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin mb-4"></div>
                            <span className="text-xl font-bold text-white uppercase tracking-widest animate-pulse">Processando...</span>
                        </div>
                    )}

                    {activeTab === 'brl' && !pixData ? (
                        <div className="flex flex-col items-center w-full gap-6">
                            <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden text-center shadow-2xl">
                                <div className="absolute top-4 right-[-35px] bg-green-500 text-black text-[10px] font-black uppercase py-1.5 px-12 rotate-45 shadow-lg">
                                    PIX / CARTÃO
                                </div>

                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 mx-auto border border-green-500/20">
                                    <span className="material-icons-outlined text-3xl text-green-400">account_balance_wallet</span>
                                </div>

                                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 block">Comprar Reais</span>
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl py-2 px-4 mb-6 animate-pulse">
                                    <span className="text-green-400 text-xs font-black uppercase tracking-tighter flex items-center justify-center gap-2">
                                        <span className="material-icons-outlined text-sm">stars</span>
                                        BÔNUS ATIVO: +10% EM TODOS OS DEPÓSITOS
                                    </span>
                                </div>


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

                                {customBrlAmount && Number(customBrlAmount) > 0 && (
                                    <div className="mb-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Você Recebe:</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-green-400">R$ {(Number(customBrlAmount) * 1.1).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">+10% BONUS</span>
                                        </div>
                                    </div>
                                )}

                                <p className="text-gray-500 text-sm mb-8 font-light">Digite o valor que deseja adicionar em sua carteira. Sem taxas adicionais.</p>

                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <button
                                        disabled={isProcessing || !customBrlAmount || Number(customBrlAmount) <= 0}
                                        onClick={() => handlePurchase(customBrlAmount, 'brl')}
                                        className="w-full bg-green-500 hover:bg-green-400 disabled:bg-white/5 disabled:text-gray-500 text-black font-black py-4 rounded-xl transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:shadow-none cursor-pointer"
                                    >
                                        <span className="material-icons-outlined">{isProcessing ? 'hourglass_empty' : 'payments'}</span>
                                        {isProcessing ? 'Gerando PIX...' : 'Pagar com PIX'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'chipz' ? (
                        <>
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-surface-dark/50 border border-white/5 rounded-3xl backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <span className="material-icons-outlined text-4xl text-gray-600">block</span>
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Vendas Indisponíveis</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Os pacotes de Chipz ainda não estão liberados para aquisição.
                                    Fique atento às nossas atualizações!
                                </p>
                                <button
                                    onClick={() => setActiveTab('brl')}
                                    className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    ADICIONAR REAIS
                                </button>
                            </div>

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
                        </>
                    ) : activeTab === 'cashout' ? (
                        <div className="flex justify-center w-full">
                            <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden text-center shadow-2xl">
                                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 mx-auto border border-accent/20">
                                    <span className="material-icons-outlined text-3xl text-accent">account_balance</span>
                                </div>

                                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 block">Sacar Saldo</span>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 flex justify-between items-center">
                                    <span className="text-gray-400 text-sm font-bold uppercase">Livre para Saque:</span>
                                    <span className="text-green-400 font-black text-lg">R$ {availableToWithdraw.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-center items-center mb-4">
                                    <span className="text-2xl font-black text-gray-500 mr-2 mt-2">R$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="0"
                                        value={cashOutAmount}
                                        onChange={(e) => setCashOutAmount(e.target.value)}
                                        className="w-full max-w-[200px] bg-transparent text-6xl font-black text-white text-center border-b-2 border-white/20 focus:border-accent outline-none transition-colors pb-2"
                                    />
                                </div>

                                <div className="mb-4 text-left">
                                    <label className="text-gray-400 text-[10px] font-bold uppercase mb-1.5 block tracking-widest">Tipo de Chave PIX</label>
                                    <select
                                        value={pixType}
                                        onChange={(e) => setPixType(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent transition-colors mb-4 appearance-none"
                                    >
                                        <option value="cpf" className="bg-[#050214]">CPF</option>
                                        <option value="cnpj" className="bg-[#050214]">CNPJ</option>
                                        <option value="email" className="bg-[#050214]">E-mail</option>
                                        <option value="telefone" className="bg-[#050214]">Telefone</option>
                                        <option value="aleatoria" className="bg-[#050214]">Chave Aleatória</option>
                                    </select>

                                    <label className="text-gray-400 text-[10px] font-bold uppercase mb-1.5 block tracking-widest">Sua Chave PIX</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 123.456.789-00"
                                        value={pixKey}
                                        onChange={(e) => setPixKey(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>

                                <p className="text-gray-500 text-xs mb-8 font-light text-left">As solicitações são analisadas pela administração e podem levar até 24h úteis para serem processadas.</p>

                                <div className="mt-auto pt-6 border-t border-white/10">
                                    <button
                                        disabled={isProcessing || !cashOutAmount || Number(cashOutAmount) <= 0 || Number(cashOutAmount) > availableToWithdraw}
                                        onClick={handleCashOut}
                                        className="w-full bg-accent hover:bg-yellow-400 disabled:bg-white/5 disabled:text-gray-500 text-black font-black py-4 rounded-xl transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] disabled:shadow-none cursor-pointer"
                                    >
                                        <span className="material-icons-outlined">{isProcessing ? 'hourglass_empty' : 'send'}</span>
                                        {isProcessing ? 'Solicitando...' : 'Solicitar Saque'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <div className="w-full max-w-md bg-surface-dark border border-primary/30 rounded-3xl p-8 flex flex-col relative overflow-hidden text-center shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto border border-primary/20">
                                    <span className="material-icons-outlined text-3xl text-primary">qr_code_scanner</span>
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase mb-2 text-primary">Pagar via PIX</h3>
                                <p className="text-gray-400 text-sm mb-6">Escaneie o QR Code abaixo ou copie o código PIX para concluir o pagamento de R$ {Number(customBrlAmount).toFixed(2).replace('.', ',')}</p>

                                <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-[250px] h-[250px] flex items-center justify-center border-4 border-primary/20">
                                    {pixData?.qr_code_base64 ? (
                                        <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="material-icons-outlined text-gray-400 text-6xl">qr_code_2</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        if (pixData?.qr_code) {
                                            navigator.clipboard.writeText(pixData.qr_code);
                                            alert('Código PIX Copiado!');
                                        }
                                    }}
                                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors mb-4"
                                >
                                    <span className="material-icons-outlined text-sm">content_copy</span> Copiar Código PIX
                                </button>

                                <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase animate-pulse">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    Aguardando pagamento...
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
