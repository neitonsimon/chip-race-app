import React, { useState } from 'react';
import appConfig from '../src/config/appConfig.json';
import { supabase } from '../src/lib/supabase';
import { PlayerStats, MessageCategory } from '../types';

interface VipPageProps {
  onNavigate: (view: string) => void;
  currentUser?: Partial<PlayerStats>;
  onUpdateProfile?: (targetId: string, updatedData: PlayerStats) => void;
  onSendAdminMessage?: (subject: string, content: string, category: MessageCategory, pollId?: string, targetUserId?: string) => void;
}

export const VipPage: React.FC<VipPageProps> = ({ onNavigate, currentUser, onUpdateProfile, onSendAdminMessage }) => {

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (plan: any) => {
    if (!currentUser || !currentUser.id) {
      alert('Você precisa estar logado para comprar um plano VIP.');
      onNavigate('login');
      return;
    }

    const basePrices: Record<string, number> = appConfig.vip.basePrices;

    let discount = 0;
    const isCurrentlyVip = currentUser.isVip && currentUser.vipExpiresAt && new Date(currentUser.vipExpiresAt) > new Date();

    if (isCurrentlyVip && currentUser.vipStatus) {
      const userPlanCost = basePrices[currentUser.vipStatus === 'master' ? 'master' : (currentUser.vipStatus === 'anual' ? 'annual' : 'quarterly')] || 0;
      const targetPlanCost = basePrices[plan.id] || 0;

      // Don't allow downgrade or buying same
      if (targetPlanCost <= userPlanCost) {
        alert('Você já possui este plano ou um plano com mais benefícios ativos.');
        return;
      }
      discount = userPlanCost;
    }

    const costToCharge = (basePrices[plan.id] || parseFloat(plan.price.replace(/\./g, '').replace(',', '.'))) - discount;
    const currentBalance = currentUser.balanceBrl || 0;

    if (currentBalance < costToCharge) {
      alert(`Saldo insuficiente! Seu saldo atual é R$ ${currentBalance.toFixed(2).replace('.', ',')}. Você precisa de R$ ${costToCharge.toFixed(2).replace('.', ',')} para adquirir/fazer upgrade para este plano.`);
      onNavigate('profile');
      return;
    }

    const confirmMsg = discount > 0
      ? `Você está fazendo um UPGRADE! O valor do seu plano atual (R$ ${discount.toFixed(2).replace('.', ',')}) será descontado. Confirma a compra por apenas R$ ${costToCharge.toFixed(2).replace('.', ',')}?`
      : `Confirma a compra do plano ${plan.title} por R$ ${costToCharge.toFixed(2).replace('.', ',')}? Isso será descontado do seu saldo BRL.`;

    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    let newExpiresAt = new Date();
    // Definir expiração com datas fixas (Temporadas)
    if (appConfig.vip.expirationDates[plan.id as keyof typeof appConfig.vip.expirationDates]) {
      newExpiresAt = new Date(appConfig.vip.expirationDates[plan.id as keyof typeof appConfig.vip.expirationDates]);
    }

    const vipStatusMap: Record<string, 'trimestral' | 'anual' | 'master'> = {
      'quarterly': 'trimestral',
      'annual': 'anual',
      'master': 'master'
    };

    try {
      const { error } = await supabase.rpc('secure_balance_transaction', {
        user_id: currentUser.id,
        brl_amount: -costToCharge,
        chipz_amount: 0,
        description: `Compra: Plano VIP ${plan.title} ${discount > 0 ? '(Upgrade)' : ''}`,
        category: 'vip'
      });

      if (error) {
        console.error(error);
        alert('Falha na transação. Verifique seu saldo ou tente novamente em instantes.');
        setIsProcessing(false);
        return;
      }

      // Atualiza status vip na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          vip_status: vipStatusMap[plan.id],
          vip_expires_at: newExpiresAt.toISOString(),
          is_vip: true
        })
        .eq('id', currentUser.id);

      if (profileError) {
        console.error(profileError);
        alert('Plano comprado, mas falha ao atualizar status. Contate o suporte.');
        // Não retornamos porque a cobrança já foi feita, tentaremos continuar
      }

      // Emita uma mensagem automática do sistema
      if (onSendAdminMessage) {
        const dateStr = newExpiresAt.toLocaleDateString('pt-BR');
        onSendAdminMessage(
          `Bem-vindo ao VIP ${plan.title}! 💎`,
          `Parabéns, ${currentUser.name}! Você acabou de adquirir o plano VIP ${plan.title}. Seus benefícios exclusivos já estão ativos e válidos até ${dateStr}. Aproveite ao máximo as vantagens dentro e fora das mesas do Chip Race!`,
          'system',
          undefined,
          currentUser.id
        );
      }

      alert(`Você adquiriu o plano ${plan.title} com sucesso!`);

      if (onUpdateProfile && currentUser) {
        // Força um refresh lendo do db, mas passamos a mutation local antes pro update instantâneo
        const updated = {
          ...currentUser,
          balanceBrl: currentBalance - costToCharge,
          vipStatus: vipStatusMap[plan.id],
          vipExpiresAt: newExpiresAt.toISOString(),
          isVip: true
        } as PlayerStats;
        onUpdateProfile(currentUser.id || '', updated);
      }

      onNavigate('profile');

    } catch (e) {
      console.error(e);
      alert('Erro inesperado durante a compra.');
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = appConfig.vip.plans;

  return (
    <div className="min-h-screen bg-background-dark py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-black text-white mb-6">
            ELEVE SEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">NÍVEL</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Torne-se um membro VIP e desbloqueie vantagens exclusivas dentro e fora das mesas. Escolha o plano que define o seu jogo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => {
            const basePrices: Record<string, number> = appConfig.vip.basePrices;
            const isCurrentlyVip = !!(currentUser?.isVip && currentUser?.vipExpiresAt && new Date(currentUser.vipExpiresAt) > new Date());
            const userPlanCost = isCurrentlyVip && currentUser?.vipStatus ? basePrices[currentUser.vipStatus === 'master' ? 'master' : (currentUser.vipStatus === 'anual' ? 'annual' : 'quarterly')] || 0 : 0;
            const targetPlanCost = basePrices[plan.id] || 0;

            const isCurrentPlan = isCurrentlyVip && targetPlanCost === userPlanCost;
            const isDowngrade = isCurrentlyVip && targetPlanCost < userPlanCost;
            const isUpgrade = isCurrentlyVip && targetPlanCost > userPlanCost;
            const isDisabled = isProcessing || isCurrentPlan || isDowngrade;

            let btnText = `Quero ser ${plan.title}`;
            if (isCurrentPlan) btnText = 'Seu Plano Atual';
            else if (isDowngrade) btnText = 'Apenas Upgrade Permitido';
            else if (isUpgrade) btnText = 'Fazer Upgrade';
            if (isProcessing) btnText = 'Processando...';

            return (
              <div
                key={plan.id}
                className={`relative bg-surface-dark border-2 rounded-3xl p-8 flex flex-col h-full transition-all duration-300 group ${plan.color} ${plan.isMaster ? 'transform md:-translate-y-4 shadow-2xl bg-gradient-to-b from-surface-dark to-black' : 'hover:-translate-y-2'}`}
              >
                {plan.tag && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase py-1 px-4 rounded-full shadow-lg">
                    {plan.tag}
                  </div>
                )}

                {plan.limit && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-black uppercase py-1 px-4 rounded-full shadow-lg animate-pulse whitespace-nowrap">
                    {plan.limit}
                  </div>
                )}

                <div className="text-center mb-8 border-b border-white/5 pb-8">
                  <h3 className="text-2xl font-display font-bold text-white uppercase tracking-wider mb-2">{plan.title}</h3>

                  <div className="flex flex-col items-center justify-center min-h-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-sm font-bold ${isUpgrade ? 'text-gray-500' : 'text-gray-400'}`}>R$</span>
                      <span className={`font-display font-black leading-none ${isUpgrade ? 'text-3xl text-gray-500 line-through' : 'text-6xl text-white'}`}>
                        {plan.price}
                      </span>
                    </div>

                    {isUpgrade ? (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                          <span className="text-sm">- R$ {userPlanCost.toFixed(2).replace('.', ',')}</span>
                          <span className="text-[10px] bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 uppercase tracking-tighter">Desconto Upgrade</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <span className="text-xs text-white/50 uppercase font-black">Total:</span>
                          <span className="text-sm text-white/50 font-bold">R$</span>
                          <span className="text-5xl font-display font-black text-white shadow-neon-pink">
                            {(targetPlanCost - userPlanCost).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-2">{plan.period}</div>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className={`material-icons-outlined text-lg ${plan.isMaster ? 'text-yellow-400' : 'text-primary'}`}>check_circle</span>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 ${isDisabled ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : plan.btnColor}`}
                  onClick={() => handlePurchase(plan)}
                  disabled={isDisabled}
                >
                  {btnText}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm mb-4">Dúvidas sobre os planos?</p>
          <button className="flex items-center gap-2 mx-auto text-white hover:text-green-400 transition-colors font-bold">
            <span className="material-icons-outlined">whatsapp</span> Fale com nosso consultor
          </button>
        </div>

      </div>
    </div>
  );
};