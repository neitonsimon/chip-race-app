import React from 'react';

interface BetPageProps {
  isAdmin?: boolean;
  onNavigate: (view: string) => void;
}

export const BetPage: React.FC<BetPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070e] text-white select-none pb-24 font-body pt-6 sm:pt-10">
      {/* Estilos e Efeitos Animados */}
      <style>{`
        @keyframes alertPulse {
          0%, 100% {
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.08);
          }
          50% {
            box-shadow: 0 0 45px rgba(239, 68, 68, 0.45), inset 0 0 30px rgba(239, 68, 68, 0.18);
          }
        }
        .poker-glow-red {
          animation: alertPulse 4s ease-in-out infinite;
        }
      `}</style>

      {/* Fundo de Feltro Escuro com Gradiente e Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.12)_0%,_rgba(3,8,22,0.95)_55%,_#020409_100%)]"></div>
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(#ff3b5c_1px,transparent_1px),linear-gradient(90deg,#ff3b5c_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Naipes em marca d'água */}
        <div className="absolute top-20 left-8 text-7xl sm:text-9xl text-red-500/[0.04] font-serif select-none pointer-events-none">♥</div>
        <div className="absolute top-48 right-12 text-7xl sm:text-9xl text-[#00e0ff]/[0.03] font-serif select-none pointer-events-none">♠</div>
        <div className="absolute bottom-28 left-16 text-7xl sm:text-9xl text-amber-500/[0.03] font-serif select-none pointer-events-none">♦</div>
        <div className="absolute bottom-40 right-20 text-7xl sm:text-9xl text-red-500/[0.04] font-serif select-none pointer-events-none">♣</div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Barra Superior / Voltar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00e0ff]/50 hover:bg-[#00e0ff]/10 text-gray-300 hover:text-white transition-all text-xs font-mono font-bold tracking-wider group cursor-pointer"
          >
            <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span>VOLTAR AO INÍCIO</span>
          </button>

          <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-widest">
              Módulo Inativo
            </span>
          </div>
        </div>

        {/* Card Monumental de Desativação */}
        <div className="relative rounded-3xl border-2 border-red-500/40 bg-[#0d0910]/95 backdrop-blur-2xl p-6 sm:p-12 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center overflow-hidden poker-glow-red">
          {/* Laser Corners */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-red-500 rounded-tl-2xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-red-500 rounded-tr-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-red-500 rounded-bl-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-red-500 rounded-br-2xl pointer-events-none"></div>

          {/* Ícone de Lei / Segurança */}
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-950/40 border border-red-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <span className="material-icons text-red-400 text-4xl sm:text-5xl">gavel</span>
          </div>

          {/* Badge Informativa */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs font-bold uppercase tracking-widest mb-4">
            <span className="material-icons text-sm text-red-400">verified_user</span>
            <span>Conformidade com a Legislação Brasileira</span>
          </div>

          {/* Título Principal */}
          <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-[0.14em] text-white mb-3">
            PÁGINA DE BET <span className="text-red-500">INATIVA</span>
          </h1>

          <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full mx-auto mb-6 shadow-[0_0_10px_#ef4444]"></div>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8 font-medium">
            Em observância às diretrizes regulatórias e à legislação vigente no Brasil referente ao mercado de apostas e quotas fixas, o módulo <strong className="text-white font-bold">Chip Race Bet</strong> foi permanentemente desativado na plataforma.
          </p>

          {/* Cards Informativos Complementares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00e0ff]/40 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[#00e0ff] text-xl font-serif">♠</span>
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  Poker é Esporte da Mente
                </h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nossos torneios presenciais, satélites, etapas do The Chosen e rankings oficiais seguem funcionando a todo vapor!
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="material-icons text-amber-400 text-lg">receipt_long</span>
                <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                  Comprovantes Anteriores
                </h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Caso você tenha participado de mercados passados, seu histórico de comprovantes pode ser conferido diretamente no seu perfil.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto font-display bg-gradient-to-r from-[#00e0ff] via-[#00bfff] to-[#0080ff] text-black font-black uppercase tracking-[0.18em] text-xs px-8 py-3.5 rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,224,255,0.4)] cursor-pointer"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="w-full sm:w-auto font-display bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              Ver Calendário
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="w-full sm:w-auto font-display bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 text-gray-300 hover:text-white font-bold uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              Meu Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
