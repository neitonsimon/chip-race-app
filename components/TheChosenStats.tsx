import React from 'react';

interface TheChosenStatsProps {
  isAdmin?: boolean;
  prizeLabel: string;
  totalQualifiers: number;
  nextGoal: {
      prize: number;
      qualifiers: number;
  };
  onUpdateTotal?: (value: number | null) => void;
  isManualTotal?: boolean;
}

export const TheChosenStats: React.FC<TheChosenStatsProps> = ({ 
    isAdmin, 
    prizeLabel, 
    totalQualifiers, 
    nextGoal, 
    onUpdateTotal,
    isManualTotal 
}) => {
  
  // Extrai valor numérico do prizeLabel para exibição do valor atual
  const currentGtd = parseInt(prizeLabel.replace(/\D/g, '')) * 1000 || 30000;
  
  // Proteção contra divisão por zero e cálculo de porcentagem
  const remainingQualifiers = nextGoal.qualifiers > totalQualifiers ? nextGoal.qualifiers - totalQualifiers : 0;
  const progressPercentage = Math.min(100, (totalQualifiers / nextGoal.qualifiers) * 100);

  return (
    <div className="relative py-12 lg:py-20 bg-[#0A051E] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {isAdmin && (
            <div className="absolute top-4 right-4 z-20">
                <div className="bg-white/10 text-white text-[10px] px-2 py-1 rounded border border-white/10 flex items-center gap-2">
                    <span>Sincronizado: {isManualTotal ? 'Manual' : 'Automático'}</span>
                    {isManualTotal && onUpdateTotal && (
                        <button 
                            onClick={() => onUpdateTotal(null)}
                            className="text-red-400 hover:text-white underline"
                            title="Resetar para cálculo automático"
                        >
                            Resetar
                        </button>
                    )}
                </div>
            </div>
        )}

        <div className="text-center mb-16">
            <h2 className="text-secondary font-display font-semibold tracking-widest text-sm uppercase mb-2">
              Progresso do Evento
            </h2>
            <h3 className="text-4xl lg:text-5xl font-display font-black text-white mb-4">
              THE CHOSEN <span className="text-primary">{prizeLabel}</span>
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A comunidade define o prêmio. Quanto mais classificados, maior o pote.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card: Valor Atualizado */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 overflow-hidden hover:border-primary/50 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-50">
               <span className="material-icons-outlined text-6xl text-primary/20 group-hover:text-primary/40 transition-colors">payments</span>
            </div>
            
            <p className="text-gray-400 font-display text-sm uppercase tracking-wider mb-2">Premiação Garantida Atual</p>
            <div className="flex items-baseline gap-2">
                <span className="text-primary text-2xl font-bold">R$</span>
                <span className="text-5xl lg:text-7xl font-display font-black text-white text-glow">
                    {(currentGtd / 1000).toFixed(0)}K
                </span>
                <span className="text-gray-500 font-bold">+</span>
            </div>
            
            <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-400">Próxima Meta</span>
                    <span className="text-secondary font-bold">R$ {(nextGoal.prize / 1000).toFixed(0)}K</span>
                </div>
                <p className="text-xs text-gray-500">
                    Faltam {remainingQualifiers} classificados para aumentar o garantido.
                </p>
            </div>
          </div>

          {/* Card: Contador de Classificados */}
          <div className="group relative bg-white/5 backdrop-blur-xl border border-secondary/20 rounded-3xl p-8 overflow-hidden hover:border-secondary/50 transition-all duration-500">
             <div className="absolute top-0 right-0 p-4 opacity-50">
               <span className="material-icons-outlined text-6xl text-secondary/20 group-hover:text-secondary/40 transition-colors">groups</span>
            </div>

            <p className="text-gray-400 font-display text-sm uppercase tracking-wider mb-2">Vagas Distribuídas</p>
            <div className="flex items-end gap-4">
                {isAdmin && onUpdateTotal ? (
                    <input 
                        type="number"
                        value={totalQualifiers}
                        onChange={(e) => onUpdateTotal(parseInt(e.target.value) || 0)}
                        className="text-6xl lg:text-7xl font-display font-black text-white text-glow-blue bg-transparent w-48 border-b-2 border-white/10 focus:border-secondary outline-none transition-colors leading-none"
                    />
                ) : (
                    <span className="text-6xl lg:text-7xl font-display font-black text-white text-glow-blue leading-none">
                        {totalQualifiers}
                    </span>
                )}
                
                <div className="flex flex-col pb-1">
                    <span className="text-sm text-gray-400 uppercase font-bold">VAGAS DISTRIBUÍDAS</span>
                    <span className="text-xs text-green-500 font-bold uppercase">PARA O CAPÍTULO FINAL</span>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">
                    <span>Progresso da Meta</span>
                    <span>{nextGoal.qualifiers} Classificados</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-secondary to-blue-600 h-full rounded-full transition-all duration-1000 relative"
                        style={{ width: `${progressPercentage}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};