import React from 'react';

interface VipPageProps {
  onNavigate: (view: string) => void;
}

export const VipPage: React.FC<VipPageProps> = ({ onNavigate }) => {
  
  const plans = [
    {
      id: 'quarterly',
      title: 'Trimestral',
      price: '149,90',
      period: 'por trimestre',
      color: 'border-secondary',
      btnColor: 'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-black',
      features: [
        'Acesso antecipado a inscrições',
        'Bônus de 2.000 fichas em torneios regulares',
        'Prioridade na fila de espera',
        'Badge "VIP Bronze" no perfil',
        'Participação no torneio exclusivo Trimestral'
      ]
    },
    {
      id: 'annual',
      title: 'Anual',
      price: '389,90',
      period: 'por ano',
      tag: 'MELHOR CUSTO-BENEFÍCIO',
      color: 'border-primary',
      btnColor: 'bg-primary text-white hover:bg-primary/90 shadow-neon-pink',
      features: [
        'Todas as vantagens do Trimestral',
        'Bônus de 5.000 fichas em torneios regulares',
        'Isenção de taxa de staff em 1 torneio/mês',
        'Badge "VIP Gold" no perfil',
        'Kit de Boas-vindas Chip Race (Boné + Camiseta)',
        'Convite para o Jantar de Gala Anual'
      ]
    },
    {
      id: 'master',
      title: 'Master',
      price: '1.490,00',
      period: 'pagamento único',
      limit: 'APENAS 3 COTAS DISPONÍVEIS',
      color: 'border-yellow-400',
      btnColor: 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.4)]',
      isMaster: true,
      features: [
        'Status de Sócio Honorário',
        'Buy-in Grátis para todos os torneios Regulares',
        'Vaga Direta Garantida no The Chosen (Sem jogar ranking)',
        'Badge "VIP Master" animada e exclusiva',
        'Lugar reservado em qualquer mesa televisionada',
        'Concierge pessoal para agendamentos',
        'Acesso ao grupo de WhatsApp da Diretoria'
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
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 ${plan.btnColor}`}
                onClick={() => alert(`Você selecionou o plano ${plan.title}. Redirecionando para checkout...`)}
              >
                Quero ser {plan.title}
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