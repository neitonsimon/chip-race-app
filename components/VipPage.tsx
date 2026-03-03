import React, { useState, useEffect } from 'react';
import appConfig from '../src/config/appConfig.json';
import { supabase } from '../src/lib/supabase';
import { PlayerStats, MessageCategory } from '../types';
import { useApp } from '../contexts/AppContext';

interface VipPageProps {
  onNavigate: (view: string) => void;
  currentUser?: Partial<PlayerStats>;
  onUpdateProfile?: (targetId: string, updatedData: PlayerStats) => void;
  onSendAdminMessage?: (subject: string, content: string, category: MessageCategory, pollId?: string, targetUserId?: string) => void;
}

export const VipPage: React.FC<VipPageProps> = ({ onNavigate, currentUser, onUpdateProfile, onSendAdminMessage }) => {

  const { vipPlans } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Priority: content_db plans (from admin panel) > products table > appConfig defaults
  useEffect(() => {
    if (vipPlans && vipPlans.length > 0) {
      // Admin panel saved plans via content_db — use immediately
      setPlans(vipPlans);
      setIsLoading(false);
      return;
    }

    // Fallback: pull from products table
    const fetchFromProducts = async () => {
      setIsLoading(true);
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'vip')
          .eq('active', true)
          .order('price', { ascending: true });

        if (error) throw error;

        if (products && products.length > 0) {
          const mappedPlans = products.map((product, index) => {
            const lowerName = product.name.toLowerCase();
            let type: 'quarterly' | 'annual' | 'master' | 'honorario' = 'quarterly';
            if (lowerName.includes('master')) type = 'master';
            else if (lowerName.includes('anual') || lowerName.includes('ano')) type = 'annual';
            else if (lowerName.includes('trimestral')) type = 'quarterly';
            else if (lowerName.includes('honorario') || lowerName.includes('honorário')) type = 'honorario';
            else {
              if (Number(product.price) === 0) type = 'honorario';
              else if (index === 0) type = 'honorario';
              else if (index === 1) type = 'quarterly';
              else if (index === 2) type = 'annual';
              else type = 'master';
            }
            const configTemplate = (appConfig.vip.plans as any[]).find(p => p.id === type) || appConfig.vip.plans[0];
            return {
              ...configTemplate,
              id: type,
              db_id: product.id,
              title: product.name,
              price: Number(product.price).toFixed(2).replace('.', ','),
              rawPrice: Number(product.price),
              period: product.price_unit || configTemplate.period,
              features: product.description
                ? product.description.split('\n').map((f: string) => f.replace(/^[•*-]\s*/, '').trim()).filter(Boolean)
                : configTemplate.features
            };
          });
          setPlans(mappedPlans.length > 0 ? mappedPlans : appConfig.vip.plans);
        } else {
          setPlans(appConfig.vip.plans as any[]);
        }
      } catch (err) {
        console.error('Erro ao buscar planos VIP:', err);
        setPlans(appConfig.vip.plans as any[]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromProducts();
  }, [vipPlans]);

  const handlePurchase = async (plan: any) => {
    if (!currentUser || !currentUser.id) {
      alert('Você precisa estar logado para comprar um plano VIP.');
      onNavigate('login');
      return;
    }

    // Usar os preços dos planos carregados dinamicamente
    const currentPlansPrices: Record<string, number> = {};
    plans.forEach(p => {
      currentPlansPrices[p.id] = p.rawPrice;
    });

    let discount = 0;
    const isCurrentlyVip = currentUser.isVip && currentUser.vipExpiresAt && new Date(currentUser.vipExpiresAt) > new Date();

    if (isCurrentlyVip && currentUser.vipStatus) {
      const userPlanKey = currentUser.vipStatus === 'master' ? 'master' : (currentUser.vipStatus === 'anual' ? 'annual' : 'quarterly');
      const userPlanCost = currentPlansPrices[userPlanKey] || 0;
      const targetPlanCost = plan.rawPrice || 0;

      // Don't allow downgrade or buying same
      if (targetPlanCost <= userPlanCost) {
        alert('Você já possui este plano ou um plano com mais benefícios ativos.');
        return;
      }
      discount = userPlanCost;
    }

    const costToCharge = plan.rawPrice - discount;
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
    // Definir expiração com datas fixas (Temporadas) do config
    if (plan.id === 'honorario') {
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    } else if (appConfig.vip.expirationDates[plan.id as keyof typeof appConfig.vip.expirationDates]) {
      newExpiresAt = new Date(appConfig.vip.expirationDates[plan.id as keyof typeof appConfig.vip.expirationDates]);
    }

    const vipStatusMap: Record<string, string> = {
      'quarterly': 'trimestral',
      'annual': 'anual',
      'master': 'master',
      'honorario': 'honorario'
    };

    try {
      const { data, error } = await supabase.rpc('secure_balance_transaction', {
        p_user_id: currentUser.id,
        p_brl_amount: -costToCharge,
        p_chipz_amount: 0,
        p_description: `Compra: Plano VIP ${plan.title} ${discount > 0 ? '(Upgrade)' : ''}`,
        p_category: 'vip',
        p_metadata: { plan_id: plan.id, db_product_id: plan.db_id, discount_applied: discount, upgrade: discount > 0 }
      });

      if (error || data === false) {
        console.error(error || 'Transaction failed: RPC returned false');
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

  return (
    <div className="min-h-screen bg-background-dark py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-white mb-6">
            ELEVE SEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">NÍVEL</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Torne-se um membro VIP e desbloqueie vantagens exclusivas dentro e fora das mesas. Escolha o plano que define o seu jogo.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold animate-pulse">CARREGANDO PLANOS EXCLUSIVOS...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {/* PLANO HONORÁRIO - FULL WIDTH */}
            {plans.filter(p => p.id === 'honorario').map((plan) => {
              const isCurrentlyVip = !!(currentUser?.isVip && currentUser?.vipExpiresAt && new Date(currentUser.vipExpiresAt) > new Date());
              const isCurrentPlan = isCurrentlyVip && currentUser?.vipStatus === 'honorario';
              const isDisabled = true; // Blocked for direct purchase

              let btnText = 'DISPONÍVEL VIA CONQUISTAS';
              if (isCurrentPlan) btnText = 'Seu Plano Atual';
              if (isProcessing) btnText = 'Processando...';

              return (
                <div
                  key={plan.db_id || plan.id}
                  className="relative bg-surface-dark border-2 border-white/20 rounded-[2.5rem] p-8 lg:p-12 transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-4 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-white/5 pb-8 lg:pb-0 lg:pr-12">
                      <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider mb-2">{plan.title}</h3>
                      <div className="flex items-center justify-center lg:justify-start gap-1 mb-2">
                        <span className="text-sm font-bold text-white/40">R$</span>
                        <span className="font-display font-black leading-none text-6xl text-white">
                          {plan.price}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 uppercase tracking-widest font-black">{plan.period}</div>

                      <button
                        className={`w-full mt-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${isDisabled ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                        onClick={() => handlePurchase(plan)}
                        disabled={isDisabled}
                      >
                        {btnText}
                      </button>
                    </div>

                    <div className="lg:col-span-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {plan.features.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="material-icons-outlined text-xl text-white/40">verified</span>
                            <span className="font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PLANOS VERTICAIS: Trimestral, Anual e Master */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.filter(p => p.id !== 'honorario').map((plan) => {
                const isCurrentlyVip = !!(currentUser?.isVip && currentUser?.vipExpiresAt && new Date(currentUser.vipExpiresAt) > new Date());
                const currentPlansPrices: Record<string, number> = {};
                plans.forEach(p => { currentPlansPrices[p.id] = p.rawPrice; });

                const userPlanKey = currentUser?.vipStatus === 'master' ? 'master' : (currentUser?.vipStatus === 'anual' ? 'annual' : (currentUser?.vipStatus === 'trimestral' ? 'quarterly' : 'honorario'));
                const userPlanCost = isCurrentlyVip && currentUser?.vipStatus ? currentPlansPrices[userPlanKey] || 0 : 0;
                const targetPlanCost = plan.rawPrice || 0;

                const isCurrentPlan = isCurrentlyVip && currentUser?.vipStatus === (plan.id === 'quarterly' ? 'trimestral' : (plan.id === 'annual' ? 'anual' : plan.id));
                const isDowngrade = isCurrentlyVip && targetPlanCost < userPlanCost;
                const isUpgrade = isCurrentlyVip && targetPlanCost > userPlanCost;

                const isDisabled = isProcessing || isCurrentPlan || isDowngrade;

                let btnText = `Quero ser ${plan.title}`;
                if (isCurrentPlan) btnText = 'Seu Plano Atual';
                else if (isDowngrade) btnText = 'Plano Superior Ativo';
                else if (isUpgrade) btnText = 'Fazer Upgrade';
                if (isProcessing) btnText = 'Processando...';

                const getDynamicStyles = (id: string) => {
                  switch (id) {
                    case 'quarterly': return 'border-secondary shadow-neon-blue';
                    case 'annual': return 'border-primary shadow-neon-pink';
                    case 'master': return 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)] bg-gradient-to-b from-surface-dark to-black';
                    default: return 'border-white/10';
                  }
                };

                return (
                  <div
                    key={plan.db_id || plan.id}
                    className={`relative bg-surface-dark border-2 rounded-[2rem] p-8 flex flex-col h-full transition-all duration-300 group hover:-translate-y-2 ${getDynamicStyles(plan.id)}`}
                  >
                    {plan.tag && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase py-1 px-4 rounded-full shadow-lg z-20 whitespace-nowrap">
                        {plan.tag}
                      </div>
                    )}

                    {plan.limit && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black uppercase py-1 px-4 rounded-full shadow-lg animate-pulse whitespace-nowrap z-20">
                        {plan.limit}
                      </div>
                    )}

                    <div className="text-center mb-8 border-b border-white/5 pb-8">
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider mb-2">{plan.title}</h3>
                      <div className="flex flex-col items-center justify-center min-h-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-sm font-bold ${plan.id === 'master' ? 'text-yellow-500' : (plan.id === 'quarterly' ? 'text-secondary/60' : 'text-primary/60')}`}>R$</span>
                          <span className="font-display font-black leading-none text-5xl text-white">
                            {plan.price}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-2">{plan.period}</div>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                          <span className={`material-icons-outlined text-lg ${plan.id === 'master' ? 'text-yellow-400' : (plan.id === 'quarterly' ? 'text-secondary' : 'text-primary')}`}>verified</span>
                          <span className="leading-tight text-left font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${isDisabled ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : (plan.id === 'master' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-lg hover:scale-105' : plan.btnColor)}`}
                      onClick={() => handlePurchase(plan)}
                      disabled={isDisabled}
                    >
                      {btnText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm mb-4">Dúvidas sobre os planos?</p>
          <button
            onClick={() => window.dispatchEvent(new Event('open-support-modal'))}
            className="flex items-center justify-center gap-2 text-white hover:text-primary transition-colors font-bold"
          >
            <span className="material-icons-outlined">chat</span> Fale com nosso consultor
          </button>
        </div>

      </div>
    </div>
  );
};