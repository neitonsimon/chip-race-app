import React, { useState } from 'react';
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

    const basePrices: Record<string, number> = {
      'quarterly': 189.90,
      'annual': 499.90,
      'master': 1990.90
    };

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
    if (plan.id === 'quarterly') {
      newExpiresAt = new Date('2026-05-25T23:59:59Z'); // Final 1º Trimestre
    } else if (plan.id === 'annual' || plan.id === 'master') {
      newExpiresAt = new Date('2026-11-20T23:59:59Z'); // Final Temporada Anual
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
        description: `Compra: Plano VIP ${plan.title} ${discount > 0 ? '(Upgrade)' : ''}`
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

  const plans = [
    {
      id: 'quarterly',
      title: 'Trimestral',
      price: '189,90',
      period: 'trimestre (Mar-Mai 2026)',
      color: 'border-secondary',
      btnColor: 'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-black',
      features: [
        'R$ 10 de desconto na janta',
        'R$ 10 de desconto na taxa adm/ staff',
        '5k fichas adicionais no addon',
        'Bet free R$ 5 por evento',
        'Sorteio de 1 add on por evento',
        '5 pontos adicionais no ranking por evento',
        'Participar Get Up',
        'Prioridade em assento em caso de lotação máxima',
        'R$ 10 em créditos mensais no app Chip Race',
        '*Valor total dos bônus no trimestre: R$ 280 + benefícios diversos'
      ]
    },
    {
      id: 'annual',
      title: 'Anual',
      price: '499,90',
      period: 'por ano (Mar-Nov 2026)',
      tag: 'MELHOR CUSTO-BENEFÍCIO',
      color: 'border-primary',
      btnColor: 'bg-primary text-white hover:bg-primary/90 shadow-neon-pink',
      features: [
        'R$ 10 de desconto na janta',
        'R$ 10 de desconto na taxa adm/ staff',
        '5k fichas adicionais no addon',
        'Bet free R$ 5 por evento',
        'Sorteio de 1 add on por evento',
        '5 pontos adicionais no ranking por evento',
        'Participar Get Up',
        'Prioridade em assento em caso de lotação máxima',
        '20% desconto bar e cozinha',
        'R$ 30 em créditos mensais no app Chip Race',
        '*Valor total dos bônus no ano: R$ 1.200 + benefícios diversos'
      ]
    },
    {
      id: 'master',
      title: 'Master',
      price: '1.990,90',
      period: 'ano (Mar-Nov 2026)',
      limit: 'APENAS 3 COTAS POR CLUBE',
      color: 'border-yellow-400',
      btnColor: 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.4)]',
      isMaster: true,
      features: [
        'Vaga The Chosen 30k+ (Destaque)',
        '5k fichas adicionais no addon',
        'Bet free R$ 5 por evento',
        'Sorteio de 1 add on por evento',
        '5 pontos adicionais no ranking por evento',
        'Participar Get Up',
        'Prioridade em assento em caso de lotação máxima',
        'R$ 100 em créditos mensais no app Chip Race',
        '50% desconto bar/ cozinha',
        'Staff free em todos eventos',
        'Janta cortesia em todos eventos',
        'Boné e camiseta Chip Race oficial',
        'Grupo direto com diretoria e direito a voto',
        'Nome destacado VIP Master no app',
        '*Valor total dos bônus no ano: R$ 4.550 + benefícios'
      ]
    }
  ];

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
          {plans.map((plan) => (
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
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm text-gray-400 font-bold mb-4">R$</span>
                  <span className="text-5xl font-display font-black text-white">{plan.price}</span>
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">{plan.period}</div>
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
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 ${plan.btnColor} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handlePurchase(plan)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : `Quero ser ${plan.title}`}
              </button>
            </div>
          ))}
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