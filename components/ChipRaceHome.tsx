import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface ChipRaceHomeProps {
  onNavigate?: (view: string) => void;
  isAdmin?: boolean;
}

export const ChipRaceHome: React.FC<ChipRaceHomeProps> = ({
  onNavigate,
  isAdmin
}) => {
  const {
    isLoggedIn,
    currentUser,
    handleLogout,
    unreadCount,
    prizeLabel = '2026',
    contentDB
  } = useApp();

  const [activeModal, setActiveModal] = useState<'none' | 'faq' | 'regulamentos' | 'logoutConfirm'>('none');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const navigateTo = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigateTo('profile');
    } else {
      navigateTo('login');
    }
  };

  // Filtragem das Perguntas Frequentes
  const faqList = contentDB?.faq || [
    {
      question: "Como funciona a pontuação do Ranking Chip Race?",
      answer: "A pontuação varia de acordo com a posição final alcançada na etapa, o field total e o multiplicador específico do torneio (regulares ou especiais). Cada premiação é calculada e adicionada automaticamente ao ranking geral."
    },
    {
      question: "Como posso garantir minha vaga para o The Chosen 30K?",
      answer: "A vaga para o The Chosen 30K é conquistada pelos melhores colocados no ranking ao longo da temporada, vencedores de etapas especiais designadas e através de satélites exclusivos anunciados no calendário."
    },
    {
      question: "O que é o Mystery Jackpot e como concorrer?",
      answer: "O Mystery Jackpot é ativado em torneios específicos onde eliminações garantem envelopes mistério com premiações imediatas em dinheiro e recompensas instantâneas depositadas no seu saldo."
    },
    {
      question: "Como funcionam as apostas no Chip Race Bet?",
      answer: "No Chip Race Bet, você pode apostar nos jogadores das mesas finais, heads-up e confrontos diretos com cotações dinâmicas calculadas com base nas probabilidades e fichas em jogo."
    }
  ];

  const filteredFaq = faqList.filter((item: any) =>
    item.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.answer?.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Documentos Oficiais do Regulamento
  const officialDocs = ((contentDB?.documents && contentDB.documents.length > 0) ? contentDB.documents : [
    {
      title: "ADTP 2025",
      subtitle: "Regulamento Oficial dos Torneios de Poker",
      icon: "menu_book",
      url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/REGULAMENTO%20ADTP%202025%20-%20OFICIAL.pdf",
      badge: "OFICIAL",
      tagColor: "border-amber-500/40 text-amber-400 bg-amber-500/10"
    },
    {
      title: "Anexos ADTP",
      subtitle: "Exemplos práticos, penalidades e decisões de mesa",
      icon: "description",
      url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/EXEMPLOS%20ADTP.pdf",
      badge: "ANEXO",
      tagColor: "border-blue-500/40 text-blue-400 bg-blue-500/10"
    },
    {
      title: "TDA 2022",
      subtitle: "Tournament Directors Association - Regras Mundiais",
      icon: "gavel",
      url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/REGULAMENTO%20TDA%202022%20-%20OFICIAL.pdf",
      badge: "GLOBAL TDA",
      tagColor: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
    }
  ]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070e] text-white select-none pb-24 font-body">
      {/* Estilos e Efeitos Animados de Mesa de Poker */}
      <style>{`
        @keyframes pokerPulse {
          0%, 100% {
            box-shadow: 0 0 25px rgba(0, 224, 255, 0.25), inset 0 0 20px rgba(0, 224, 255, 0.08);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 224, 255, 0.5), inset 0 0 30px rgba(0, 224, 255, 0.18);
          }
        }
        @keyframes goldGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.3), inset 0 0 15px rgba(245, 158, 11, 0.1);
          }
          50% {
            box-shadow: 0 0 45px rgba(245, 158, 11, 0.6), inset 0 0 25px rgba(245, 158, 11, 0.2);
          }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-card-float {
          animation: cardFloat 6s ease-in-out infinite;
        }
        .poker-glow-cyan {
          animation: pokerPulse 4s ease-in-out infinite;
        }
        .poker-glow-gold {
          animation: goldGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Fundo de Feltro Futurista de Poker com Gradientes Dinâmicos */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Feltro sutil de poker escuro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,162,255,0.12)_0%,_rgba(3,8,22,0.92)_55%,_#020409_100%)]"></div>
        {/* Grid sutil de mesa high tech */}
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(#00e0ff_1px,transparent_1px),linear-gradient(90deg,#00e0ff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Naipes de poker em marca d'água holográfica nas laterais */}
        <div className="absolute top-16 left-4 sm:left-12 text-6xl sm:text-8xl text-[#00e0ff]/[0.03] select-none pointer-events-none font-serif">♠</div>
        <div className="absolute top-48 right-6 sm:right-16 text-6xl sm:text-8xl text-red-500/[0.03] select-none pointer-events-none font-serif">♥</div>
        <div className="absolute bottom-32 left-8 sm:left-24 text-6xl sm:text-8xl text-amber-400/[0.03] select-none pointer-events-none font-serif">♦</div>
        <div className="absolute bottom-48 right-8 sm:right-28 text-6xl sm:text-8xl text-[#00e0ff]/[0.03] select-none pointer-events-none font-serif">♣</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4">

        {/* ========================================================================= */}
        {/* 1. TOP BAR / PLAYER HUD (IDENTIDADE CHIP RACE & STATUS DO JOGADOR)       */}
        {/* ========================================================================= */}
        <header className="mb-6 sm:mb-8">
          <div className="relative border border-[#00e0ff]/20 bg-[#070e1c]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_0_30px_rgba(0,224,255,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Canto laser futurista */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] rounded-tl-lg pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] rounded-tr-lg pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e0ff] rounded-bl-lg pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e0ff] rounded-br-lg pointer-events-none"></div>

            {/* Logo da Chip Race com efeito neon */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => navigateTo('home')}
                className="cursor-pointer flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-[#00e0ff]/20 rounded-full blur-md group-hover:bg-[#00e0ff]/40 transition-all"></div>
                  <img 
                    src="/cr-logo.png" 
                    alt="Chip Race" 
                    className="h-10 sm:h-12 w-auto relative drop-shadow-[0_0_12px_rgba(0,224,255,0.6)] group-hover:scale-105 transition-transform" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-base sm:text-lg tracking-[0.2em] text-white">
                      CHIP RACE
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-[#00e0ff]/15 text-[#00e0ff] border border-[#00e0ff]/30 px-1.5 py-0.5 rounded">
                      2026
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block">
                    Ecossistema do Pôquer
                  </span>
                </div>
              </div>
            </div>

            {/* Status do Usuário / Login HUD */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {isLoggedIn && currentUser ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Avatar Chip com borda de poker */}
                  <div 
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 bg-black/40 border border-[#00e0ff]/30 hover:border-[#00e0ff] p-1.5 pr-3 rounded-full cursor-pointer transition-all hover:bg-[#00e0ff]/10 shadow-[0_0_15px_rgba(0,224,255,0.15)] group"
                    title="Acessar meu perfil"
                  >
                    <div className="relative w-8 h-8 sm:w-9 sm:sm:h-9 rounded-full bg-gradient-to-br from-[#00e0ff] to-blue-700 p-[2px] shadow-[0_0_10px_rgba(0,224,255,0.5)]">
                      {currentUser.photo_url ? (
                        <img 
                          src={currentUser.photo_url} 
                          alt={currentUser.name || 'Jogador'} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#070e1c] rounded-full flex items-center justify-center text-[#00e0ff] font-display font-black text-xs">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '♠'}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070e1c] animate-pulse" title="Online"></div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-xs font-display font-bold text-white group-hover:text-[#00e0ff] transition-colors leading-tight flex items-center gap-1.5">
                        <span className="truncate max-w-[110px] sm:max-w-[140px]">{currentUser.name || 'Jogador'}</span>
                        {isAdmin ? (
                          <span className="text-[9px] bg-red-950/80 text-red-400 border border-red-500/40 px-1 py-0.2 rounded font-mono font-bold">ADM</span>
                        ) : currentUser.role === 'staff' ? (
                          <span className="text-[9px] bg-blue-950/80 text-blue-400 border border-blue-500/40 px-1 py-0.2 rounded font-mono font-bold">STAFF</span>
                        ) : null}
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono tracking-wider flex items-center gap-1">
                        <span className="text-[#00e0ff]">♠</span> Ver Perfil
                      </span>
                    </div>
                  </div>

                  {/* Notificações se houver */}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => navigateTo('profile')}
                      className="relative p-2 rounded-xl bg-[#00e0ff]/10 border border-[#00e0ff]/40 text-[#00e0ff] hover:bg-[#00e0ff]/20 transition-all"
                      title={`${unreadCount} mensagens não lidas`}
                    >
                      <span className="material-icons-outlined text-lg">notifications</span>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    </button>
                  )}

                  {/* Botão Sair Rápido */}
                  <button
                    onClick={() => setActiveModal('logoutConfirm')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white transition-all text-xs font-display font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                    title="Encerrar Sessão"
                  >
                    <span className="material-icons-outlined text-sm">logout</span>
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => navigateTo('login')}
                    className="flex-1 sm:flex-none font-display text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(0,191,255,0.4)]"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => navigateTo('register')}
                    className="flex-1 sm:flex-none font-display text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border border-[#00e0ff]/40 text-[#00e0ff] hover:bg-[#00e0ff]/10 hover:border-[#00e0ff] transition-all"
                  >
                    Cadastrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. CARD MASTER EM DESTAQUE: THE CHOSEN 30K (O CARRO-CHEFE)              */}
        {/* ========================================================================= */}
        <section className="mb-8">
          <div
            onClick={() => navigateTo('the-chosen-details')}
            className="group relative rounded-3xl overflow-hidden border-[3px] border-[#00e0ff]/50 hover:border-[#00e0ff] transition-all duration-500 cursor-pointer shadow-[0_0_35px_rgba(0,224,255,0.25)] hover:shadow-[0_0_55px_rgba(0,224,255,0.5)] transform hover:-translate-y-1 bg-[#040a16]"
          >
            {/* Cantos do Card Master HUD */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#00e0ff] rounded-tl-2xl pointer-events-none z-30 shadow-[0_0_10px_#00e0ff]"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#00e0ff] rounded-tr-2xl pointer-events-none z-30 shadow-[0_0_10px_#00e0ff]"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#00e0ff] rounded-bl-2xl pointer-events-none z-30 shadow-[0_0_10px_#00e0ff]"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#00e0ff] rounded-br-2xl pointer-events-none z-30 shadow-[0_0_10px_#00e0ff]"></div>

            {/* Imagem de Fundo Especial de Pôquer / The Chosen */}
            <div className="relative min-h-[300px] sm:min-h-[380px] md:min-h-[440px] flex flex-col justify-end p-6 sm:p-10 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/images/home/the-chosen-master.jpg')" }}
              />

              {/* Scrim com gradiente de feltro escuro para leitura perfeita */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#02050c] via-[#02050c]/75 to-black/25 pointer-events-none"></div>

              {/* Holograma Laser e Naipes em Marca d'água */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
                <span className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold bg-[#00e0ff]/20 text-[#00e0ff] border border-[#00e0ff]/50 px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,224,255,0.4)]">
                  <span className="w-2 h-2 rounded-full bg-[#00e0ff] animate-ping"></span>
                  TORNEIO SUPREMO
                </span>
              </div>

              {/* Conteúdo Principal do The Chosen */}
              <div className="relative z-20 max-w-2xl">
                {/* Badge de Premiação */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/50 mb-3 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <span className="material-icons text-amber-400 text-sm animate-bounce">emoji_events</span>
                  <span className="font-display font-black text-xs sm:text-sm text-amber-300 tracking-widest uppercase">
                    R$ 30.000 GARANTIDOS
                  </span>
                </div>

                {/* Título Monumental */}
                <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.15em] text-white drop-shadow-[0_0_25px_rgba(0,224,255,0.8)] leading-none">
                  THE CHOSEN <span className="text-[#00e0ff]">{prizeLabel}</span>
                </h2>

                <div className="h-1 w-24 sm:w-36 bg-gradient-to-r from-[#00e0ff] to-transparent rounded-full mt-3 mb-4 shadow-[0_0_10px_#00e0ff]"></div>

                <p className="font-body text-sm sm:text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-xl group-hover:text-white transition-colors">
                  O palco sagrado do pôquer da Chip Race. Uma temporada histórica com os melhores jogadores, disputa pelo anel de campeão e glória eterna no circuito.
                </p>

                {/* Botão de Ação All-in */}
                <div className="mt-6 flex items-center gap-4">
                  <button className="font-display bg-gradient-to-r from-[#00e0ff] via-[#00bfff] to-[#0077ff] text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm px-7 py-3.5 rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(0,224,255,0.7)] group-hover:shadow-[0_0_40px_rgba(0,224,255,1)] group-hover:scale-105 flex items-center gap-2">
                    <span>EXPLORAR TEMPORADA</span>
                    <span className="material-icons-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                  <span className="text-xs font-mono text-gray-400 hidden sm:inline-flex items-center gap-1">
                    <span className="text-[#00e0ff]">♠</span> Tabela • Vagas • Qualificatórios
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. MESA PRINCIPAL DE CARTAS & FICHAS DE PÔQUER (GRID DE MENUS)          */}
        {/* ========================================================================= */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[#00e0ff] text-xl font-serif">♠</span>
              <h3 className="font-display font-black text-lg sm:text-xl uppercase tracking-wider text-white">
                NAVEGAÇÃO OFICIAL DA MESA
              </h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400 tracking-wider">
              CIRCUITO CHIP RACE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* CARD 1: RANKING */}
            <div
              onClick={() => navigateTo('ranking')}
              className="group relative rounded-2xl overflow-hidden border-2 border-[#00e0ff]/40 hover:border-[#00e0ff] bg-[#070f1e] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/ranking-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1e] via-[#070f1e]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-[#00e0ff]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-amber-400 text-sm">leaderboard</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-[#00e0ff] uppercase">LEADERBOARD</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-[#00e0ff] transition-colors">
                      RANKING
                    </h4>
                    <span className="text-xl text-[#00e0ff] font-serif">♠</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Consulte a tabela de classificação oficial, líderes de pontos e a corrida de troféus da temporada Chip Race.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Tabela de Pontos</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,191,255,0.4)]">
                    VER RANKING
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2: PERFIL */}
            <div
              onClick={handleProfileClick}
              className="group relative rounded-2xl overflow-hidden border-2 border-[#00e0ff]/40 hover:border-[#00e0ff] bg-[#070f1e] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/profile-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1e] via-[#070f1e]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-[#00e0ff]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-[#00e0ff] text-sm">badge</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-[#00e0ff] uppercase">PLAYER PASS</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-[#00e0ff] transition-colors">
                      PERFIL
                    </h4>
                    <span className="text-xl text-amber-400 font-serif">♦</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Gerencie seus dados pessoais, visualize medalhas e conquistas, histórico de torneios e estatísticas completas.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Histórico & Conquistas</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,191,255,0.4)]">
                    ACESSAR
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: BET */}
            <div
              onClick={() => navigateTo('bet')}
              className="group relative rounded-2xl overflow-hidden border-2 border-red-500/40 hover:border-red-500 bg-[#16070a] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_35px_rgba(239,68,68,0.45)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500 pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500 pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/bet-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16070a] via-[#16070a]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-red-500/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-red-500 text-sm animate-pulse">local_fire_department</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-red-400 uppercase">HIGH STAKES</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-red-400 transition-colors">
                      BET
                    </h4>
                    <span className="text-xl text-red-500 font-serif">♥</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Aposte nos eventos da Chip Race! Palpites ao vivo, confrontos diretos Heads-Up e cotações dinâmicas nas mesas finais.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Apostas & Odds</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                    APOSTAR
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 4: CALENDÁRIO */}
            <div
              onClick={() => navigateTo('calendar')}
              className="group relative rounded-2xl overflow-hidden border-2 border-[#00e0ff]/40 hover:border-[#00e0ff] bg-[#070f1e] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/calendar-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1e] via-[#070f1e]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-[#00e0ff]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-[#00e0ff] text-sm">calendar_month</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-[#00e0ff] uppercase">CRONOGRAMA</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-[#00e0ff] transition-colors">
                      CALENDÁRIO
                    </h4>
                    <span className="text-xl text-[#00e0ff] font-serif">♣</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Fique por dentro das datas, horários, blinds e estrutura de todos os torneios regulares e etapas especiais.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Datas & Blinds</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,191,255,0.4)]">
                    VER AGENDA
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 5: MYSTERY JACKPOT */}
            <div
              onClick={() => navigateTo('jackpot')}
              className="group relative rounded-2xl overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 bg-[#161005] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-500 pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-500 pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/jackpot-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161005] via-[#161005]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-amber-500/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-amber-400 text-sm animate-bounce">savings</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-amber-300 uppercase">PRÊMIOS SURPRESA</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors">
                      MYSTERY JACKPOT
                    </h4>
                    <span className="text-xl text-amber-400">★</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Concorra a grandes prêmios em dinheiro nos envelopes de bounty e jackpots progressivos da Chip Race!
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">Envelopes & Bounties</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                    EXPLORAR
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 6: REGULAMENTO OFICIAL */}
            <div
              onClick={() => setActiveModal('regulamentos')}
              className="group relative rounded-2xl overflow-hidden border-2 border-[#00e0ff]/40 hover:border-[#00e0ff] bg-[#070f1e] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/rules-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1e] via-[#070f1e]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-[#00e0ff]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-[#00e0ff] text-sm">verified</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-[#00e0ff] uppercase">REGRAS ADTP</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-[#00e0ff] transition-colors">
                      REGULAMENTO
                    </h4>
                    <span className="text-xl text-[#00e0ff] font-serif">♠</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Consulte as diretrizes e normas oficiais de poker: ADTP 2025, Anexos práticos e regras mundiais TDA.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">PDFs Oficiais</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,191,255,0.4)]">
                    CONSULTAR
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 7: PERGUNTAS E RESPOSTAS */}
            <div
              onClick={() => setActiveModal('faq')}
              className="group relative rounded-2xl overflow-hidden border-2 border-[#00e0ff]/40 hover:border-[#00e0ff] bg-[#070f1e] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:shadow-[0_0_35px_rgba(0,224,255,0.4)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] pointer-events-none z-20"></div>

              {/* Banner visual de poker */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: "url('/images/home/faq-card.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1e] via-[#070f1e]/60 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-black/60 border border-[#00e0ff]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5">
                  <span className="material-icons text-[#00e0ff] text-sm">quiz</span>
                  <span className="text-[10px] font-display font-black tracking-widest text-[#00e0ff] uppercase">CENTRAL FAQ</span>
                </div>
              </div>

              {/* Conteúdo textual */}
              <div className="p-5 pt-0 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-[#00e0ff] transition-colors">
                      PERGUNTAS & RESPOSTAS
                    </h4>
                    <span className="text-xl text-[#00e0ff] font-serif">?</span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">
                    Tire todas as suas dúvidas sobre pontuação de etapas, regras de buy-in, blinds e estrutura do clube.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Dúvidas Frequentes</span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,191,255,0.4)]">
                    VER DÚVIDAS
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 8: PAINEL ADM (VISÍVEL APENAS PARA ADMIN OU STAFF) */}
            {(isAdmin || currentUser?.role === 'staff') && (
              <div
                onClick={() => navigateTo('admin')}
                className="group relative rounded-2xl overflow-hidden border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-b from-[#1c1404] to-[#0a0701] transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-500 pointer-events-none z-20"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-500 pointer-events-none z-20"></div>

                <div className="p-6 flex flex-col flex-1 justify-between relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <span className="material-icons text-amber-400 text-3xl animate-pulse">admin_panel_settings</span>
                      </div>
                      <span className="text-[9px] font-display font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full">
                        DIRETORIA
                      </span>
                    </div>

                    <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
                      PAINEL ADM
                    </h4>
                    <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-2 group-hover:text-gray-200 transition-colors">
                      Central de gerenciamento completo do clube: inscrições, caixas, bets, mensagens e parâmetros de torneios.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Acesso Restrito</span>
                    <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-black group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      GERENCIAR
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARD 9: SAIR / ACESSO */}
            <div
              onClick={() => {
                if (isLoggedIn) {
                  setActiveModal('logoutConfirm');
                } else {
                  navigateTo('login');
                }
              }}
              className="group relative rounded-2xl overflow-hidden border-2 border-red-500/30 hover:border-red-500/70 bg-[#0f070b]/60 transition-all duration-500 hover:-translate-y-1.5 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500/50 pointer-events-none z-20"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500/50 pointer-events-none z-20"></div>

              <div className="p-6 flex flex-col flex-1 justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                      <span className="material-icons-outlined text-red-400 text-3xl">
                        {isLoggedIn ? 'logout' : 'login'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                      SESSÃO
                    </span>
                  </div>

                  <h4 className="font-display font-black text-xl uppercase tracking-wider text-white group-hover:text-red-400 transition-colors">
                    {isLoggedIn ? 'SAIR DA CONTA' : 'FAZER LOGIN'}
                  </h4>
                  <p className="font-body text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mt-2 group-hover:text-gray-200 transition-colors">
                    {isLoggedIn 
                      ? 'Efetue o encerramento seguro da sua sessão no aplicativo Chip Race.'
                      : 'Entre na sua conta para gerenciar créditos, estatísticas e inscrições.'
                    }
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    {isLoggedIn ? 'Logout Seguro' : 'Acesso de Jogador'}
                  </span>
                  <button className="font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:text-white hover:bg-red-900/60 transition-all">
                    {isLoggedIn ? 'SAIR' : 'ENTRAR'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PERGUNTAS E RESPOSTAS (FAQ INTERATIVO DE PÔQUER)                 */}
      {/* ========================================================================= */}
      {activeModal === 'faq' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#080d19] border-2 border-[#00e0ff]/40 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,224,255,0.3)] relative overflow-hidden p-6 sm:p-8 flex flex-col max-h-[90vh]">
            
            {/* Fechar */}
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-30"
            >
              <span className="material-icons-outlined text-xl">close</span>
            </button>

            {/* Cabeçalho do FAQ */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#00e0ff]/15 border border-[#00e0ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,224,255,0.3)] shrink-0">
                <span className="material-icons text-[#00e0ff] text-2xl">quiz</span>
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                  PERGUNTAS & RESPOSTAS
                </h3>
                <p className="text-xs text-gray-400 font-mono">Tire suas dúvidas sobre o ecossistema Chip Race</p>
              </div>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="mb-4 relative">
              <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Buscar por termo (ex: ranking, pontos, blinds...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-[#00e0ff]/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00e0ff] transition-all"
              />
            </div>

            {/* Lista de Perguntas (Acordeão) */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {filteredFaq.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs font-mono">
                  Nenhuma dúvida encontrada para "{faqSearch}".
                </div>
              ) : (
                filteredFaq.map((faq: any, idx: number) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-[#00e0ff]/20 bg-white/[0.02] rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-[#00e0ff]/5 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <span className="text-[#00e0ff] font-mono">♠</span>
                          {faq.question}
                        </span>
                        <span className={`material-icons-outlined text-sm text-[#00e0ff] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-1 text-xs text-gray-300 leading-relaxed font-light border-t border-white/5 bg-black/20">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé Fechar */}
            <div className="mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-display font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:scale-[1.01] transition-all"
              >
                ENTENDIDO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGULAMENTOS OFICIAIS DE PÔQUER (ADTP 2025, ANEXOS, TDA)        */}
      {/* ========================================================================= */}
      {activeModal === 'regulamentos' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#080d19] border-2 border-[#00e0ff]/40 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,224,255,0.3)] relative overflow-hidden p-6 sm:p-8 flex flex-col max-h-[90vh]">
            
            {/* Fechar */}
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-30"
            >
              <span className="material-icons-outlined text-xl">close</span>
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                <span className="material-icons text-amber-400 text-2xl">gavel</span>
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                  REGULAMENTOS OFICIAIS
                </h3>
                <p className="text-xs text-gray-400 font-mono">Normas Técnicas da ADTP e Diretrizes Mundiais de Poker</p>
              </div>
            </div>

            {/* Lista de Documentos Oficiais */}
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {officialDocs.map((doc: any, dIdx: number) => {
                const docUrl = doc.url && doc.url !== '#' && doc.url.trim() !== '' 
                  ? (doc.url.startsWith('http') ? doc.url : `https://${doc.url.trim()}`) 
                  : '#';

                return (
                  <div
                    key={dIdx}
                    className="border border-[#00e0ff]/25 bg-black/40 hover:border-[#00e0ff]/60 rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg group"
                  >
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-[#00e0ff]/10 border border-[#00e0ff]/30 flex items-center justify-center text-[#00e0ff] group-hover:scale-105 transition-transform shrink-0">
                        <span className="material-icons-outlined text-2xl">{doc.icon || 'description'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-sm uppercase text-white group-hover:text-[#00e0ff] transition-colors">
                            {doc.title}
                          </h4>
                          {doc.badge && (
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${doc.tagColor || 'border-[#00e0ff]/30 text-[#00e0ff]'}`}>
                              {doc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-light mt-0.5">
                          {doc.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (docUrl === '#') {
                            e.preventDefault();
                            alert('Este documento ainda não foi configurado pela administração.');
                          }
                        }}
                        className="flex-1 sm:flex-none font-display text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black text-center transition-all hover:scale-105 shadow-[0_0_12px_rgba(0,191,255,0.4)]"
                      >
                        Visualizar
                      </a>
                      <a
                        href={docUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-[#00e0ff] transition-all"
                        title="Baixar PDF"
                      >
                        <span className="material-icons-outlined text-sm">download</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé Fechar */}
            <div className="mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-display font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:scale-[1.01] transition-all"
              >
                FECHAR
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMAÇÃO DE LOGOUT                                            */}
      {/* ========================================================================= */}
      {activeModal === 'logoutConfirm' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12070b] border-2 border-red-500/50 rounded-2xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <span className="material-icons-outlined text-3xl">logout</span>
            </div>
            
            <h4 className="font-display font-black text-lg uppercase tracking-wider text-white mb-2">
              Deseja Sair?
            </h4>
            <p className="text-xs text-gray-400 font-light mb-6">
              Você será desconectado da sua conta com segurança. Suas estatísticas e conquistas continuarão salvas.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveModal('none')}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-gray-300 font-display font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setActiveModal('none');
                  if (handleLogout) {
                    await handleLogout();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-display font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
