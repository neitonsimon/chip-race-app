import React, { useState, useEffect } from 'react';
import { TournamentCategory } from '../types';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../contexts/AppContext';

interface TournamentCategoriesProps {
  isAdmin?: boolean;
  categories: TournamentCategory[];
  onUpdateCategory: (index: number, updates: Partial<TournamentCategory>) => void;
  prizeLabel?: string;
  onNavigate?: (view: string) => void;
}

export const TournamentCategories: React.FC<TournamentCategoriesProps> = ({
  isAdmin,
  categories,
  prizeLabel = "2026",
  onNavigate
}) => {
  const { contentDB, isLoggedIn, handleLogout } = useApp();
  const [activeCategory, setActiveCategory] = useState<TournamentCategory | null>(null);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const renderDescription = (desc: string) => {
    if (!desc) return 'Nenhuma descrição informada.';
    const match = desc.match(/(.*?)\((ID:\s*\d+)\)(.*)/i);
    if (match) {
      const [_, before, idPart, after] = match;
      return (
        <>
          {before}
          <span className="inline-block bg-[#00e0ff]/15 text-[#00e0ff] border border-[#00e0ff]/30 px-2 py-0.5 rounded font-mono font-black text-[11px] mx-1 shadow-[0_0_8px_rgba(0,224,255,0.25)] animate-pulse">
            {idPart}
          </span>
          {after}
        </>
      );
    }
    return desc;
  };

  const processedCategories = React.useMemo(() => {
    const virtuals: TournamentCategory[] = [];

    // Se o usuário estiver deslogado, adicione a box de login no topo
    if (!isLoggedIn) {
      virtuals.push({
        id: 'login-tile',
        title: 'ACESSE SUA CONTA',
        description: 'Faça login ou cadastre-se para gerenciar seus créditos, participar de eventos e aproveitar todas as vantagens VIP do clube!',
        icon: 'vpn_key',
        color: 'cyan',
        slots: 0,
        order: -1,
        col_span: 3,
        row_span: 1,
        target_view: 'login',
        button_text: 'LOGIN'
      });
    }

    const logoOnlyVirtualCat: TournamentCategory = {
      id: 'logo-only-tile',
      title: '',
      description: '',
      icon: '',
      color: 'cyan',
      slots: 0,
      order: 0,
      col_span: 1,
      row_span: 1,
      target_view: 'home',
      button_text: ''
    };

    virtuals.push(logoOnlyVirtualCat);

    virtuals.push({
      id: 'copa-mundo-tile',
      title: 'COPA DO MUNDO',
      description: 'Estimativa de 20K em premiação + vaga the Chosen 30K + troféu campeão! 48 jogadores, 12 grupos e mata-mata Heads-Up.',
      icon: 'emoji_events',
      color: 'red',
      slots: 48,
      order: 1,
      col_span: 2,
      row_span: 2,
      target_view: 'copa-mundo-poker',
      button_text: 'VER CHAVEAMENTO'
    });
    virtuals.push({
      id: 'cvth-tile',
      title: 'CVTH - 2ª TEMPORADA',
      description: '10 etapas presenciais. Um único objetivo: conquistar sua vaga e chegar ao Main Event com vantagem.',
      icon: 'sports_esports',
      color: 'emerald',
      slots: 10,
      order: 2,
      col_span: 1,
      row_span: 1,
      target_view: 'cvth2',
      button_text: 'VER DETALHES'
    });
    virtuals.push({
      id: 'regulamentos-tile',
      title: 'REGULAMENTO ADTP',
      description: 'Consulte os regulamentos de poker oficiais: ADTP 2025, Anexos exemplificados e regras gerais TDA 2022.',
      icon: 'gavel',
      color: 'cyan',
      slots: 0,
      order: 97,
      col_span: 1,
      row_span: 1,
      target_view: 'regulamentos',
      button_text: 'VER REGULAMENTOS'
    });

    const filtered = categories.filter(cat => !cat.is_hidden || isAdmin);
    const result = [...virtuals, ...filtered];

    if (isLoggedIn) {
      if (isAdmin) {
        result.push({
          id: 'admin-tile',
          title: 'PAINEL ADMIN',
          description: 'Configurações, caixas, bar, bets e usuários.',
          icon: 'admin_panel_settings',
          color: 'amber',
          slots: 0,
          order: 98,
          col_span: 1,
          row_span: 1,
          target_view: 'admin',
          button_text: 'GERENCIAR'
        });
      }

      result.push({
        id: 'logout-tile',
        title: 'SAIR',
        description: 'Efetuar logout da sua conta com segurança.',
        icon: 'logout',
        color: 'red',
        slots: 0,
        order: 99,
        col_span: 1,
        row_span: 1,
        target_view: 'logout',
        button_text: 'SAIR'
      });
    }

    return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories, isAdmin, isLoggedIn]);

  useEffect(() => {
    if (activeCategory) {
      fetchProductInfo(activeCategory.id);
    } else {
      setProductDetails(null);
    }
  }, [activeCategory]);

  const fetchProductInfo = async (categoryId: string) => {
    setIsLoadingProduct(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, stock, image_url, active, category')
        .eq('category', categoryId)
        .eq('active', true)
        .limit(1)
        .single();

      if (data) {
        setProductDetails(data);
      }
    } catch (e) {
      console.error('Error fetching product:', e);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Clique e redirecionamento inteligente
  const handleTileClick = async (e: React.MouseEvent, cat: TournamentCategory) => {
    e.preventDefault();

    if (cat.id === 'logout-tile') {
      if (handleLogout) {
        await handleLogout();
      }
      return;
    }

    // Se tiver modo mistério e não for Admin, não redireciona
    if (cat.is_mystery && !isAdmin) return;

    const target = cat.target_view || 'home';

    if (target === 'faq' || target === 'regulamentos') {
      // Abre o modal diretamente
      setActiveCategory(cat);
      return;
    }

    if (onNavigate) {
      onNavigate(target);
    }
  };

  return (
    <div className="py-12 relative overflow-hidden min-h-screen bg-[url('/home-bg.jpg')] bg-cover bg-center bg-fixed">
      <style>{`
        @keyframes cyberBgPulse {
          0% {
            transform: scale(1.3);
            filter: brightness(0.85) saturate(1);
            opacity: 0.20;
          }
          50% {
            transform: scale(1.42);
            filter: brightness(1.2) saturate(1.35) drop-shadow(0 0 15px rgba(0, 224, 255, 0.45));
            opacity: 0.32;
          }
          100% {
            transform: scale(1.3);
            filter: brightness(0.85) saturate(1);
            opacity: 0.20;
          }
        }
        .animate-cyber-bg {
          animation: cyberBgPulse 18s ease-in-out infinite;
        }
      `}</style>
      {/* Scrim escura de contraste para os textos e glow neon */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] pointer-events-none z-0"></div>
      
      {/* Linhas sci-fi digitais simulando uma mesa futurista */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(18,16,35,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(18,16,35,0.6)_1px,transparent_1px)] bg-[size:30px_30px] z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* CONTEXTO INTEGRADO HUD - CONTÊINER MASTER DE MOSAICO DE CAIXAS */}
        <div className="relative border-2 sm:border-[3px] border-[#00e0ff]/25 bg-black/10 rounded-3xl p-3 sm:p-5 backdrop-blur-[1px] shadow-[0_0_50px_rgba(0,224,255,0.05),inset_0_0_20px_rgba(0,224,255,0.02)]">
          {/* Cantos do Painel HUD */}
          <div className="absolute -top-[3px] -left-[3px] w-8 h-8 border-t-4 border-l-4 border-[#00e0ff]/80 rounded-tl-2xl pointer-events-none shadow-[0_0_8px_rgba(0,224,255,0.5)]"></div>
          <div className="absolute -top-[3px] -right-[3px] w-8 h-8 border-t-4 border-r-4 border-[#00e0ff]/80 rounded-tr-2xl pointer-events-none shadow-[0_0_8px_rgba(0,224,255,0.5)]"></div>
          <div className="absolute -bottom-[3px] -left-[3px] w-8 h-8 border-b-4 border-l-4 border-[#00e0ff]/80 rounded-bl-2xl pointer-events-none shadow-[0_0_8px_rgba(0,224,255,0.5)]"></div>
          <div className="absolute -bottom-[3px] -right-[3px] w-8 h-8 border-b-4 border-r-4 border-[#00e0ff]/80 rounded-br-2xl pointer-events-none shadow-[0_0_8px_rgba(0,224,255,0.5)]"></div>

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 grid-flow-row-dense"
            style={{ gridAutoRows: 'minmax(130px, auto)' }}
          >
            {processedCategories.map((cat, index) => {
                const isTheChosen = cat.id === 'the-chosen-tile';
                const isLogoOnly = cat.id === 'logo-only-tile';
                const isLogout = cat.id === 'logout-tile';
                const isLoginTile = cat.id === 'login-tile';
                const isAdminTile = cat.id === 'admin-tile';
                const isCopaMundo = cat.id === 'copa-mundo-tile';
                const isCvth = cat.id === 'cvth-tile';

                // Determinar o grid span (largura e altura) com fallbacks
                const cSpan = cat.col_span || 1;
                const rSpan = cat.row_span || 1;

                // Classes do tailwind para span dinâmico
                const colClass = cSpan === 3 ? 'sm:col-span-2 md:col-span-3' : cSpan === 2 ? 'sm:col-span-2' : 'col-span-1';
                const rowClass = rSpan === 3 ? 'md:row-span-3' : rSpan === 2 ? 'md:row-span-2' : 'row-span-1';

                if (isLoginTile) {
                  return (
                    <div
                      key="login-tile"
                      className="group relative bg-[#0a071f]/60 border-[3.5px] border-[#00e0ff]/50 shadow-[0_0_25px_rgba(0,224,255,0.2),inset_0_0_20px_rgba(0,224,255,0.05)] rounded-3xl p-5 md:p-6 transition-all duration-500 hover:border-[#00e0ff]/80 hover:shadow-[0_0_35px_rgba(0,224,255,0.4),inset_0_0_25px_rgba(0,224,255,0.1)] col-span-1 sm:col-span-2 md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md overflow-hidden"
                    >
                      {/* Cantos do Painel HUD */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00e0ff] rounded-tl-lg pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00e0ff] rounded-tr-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00e0ff] rounded-bl-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00e0ff] rounded-br-lg pointer-events-none"></div>

                      {/* Icon & Text Container */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-[#00e0ff]/10 border border-[#00e0ff]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(0,224,255,0.2)]">
                          <span className="material-icons-outlined text-[#00e0ff] text-3xl drop-shadow-[0_0_8px_rgba(0,224,255,0.8)] animate-pulse">
                            vpn_key
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                            ACESSE SUA CONTA
                          </h3>
                          <p className="font-body text-xs sm:text-sm mt-1.5 font-medium leading-relaxed text-gray-400 group-hover:text-gray-200 transition-colors max-w-2xl">
                            Faça login ou cadastre-se para gerenciar seus créditos, participar de eventos e aproveitar todas as vantagens VIP do clube!
                          </p>
                        </div>
                      </div>

                      {/* Buttons Action Container */}
                      <div className="flex flex-row gap-3 w-full md:w-auto shrink-0 justify-center">
                        <button
                          onClick={() => onNavigate && onNavigate('login')}
                          className="font-display flex-1 md:flex-none bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-black uppercase tracking-widest text-[10px] sm:text-xs px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,191,255,0.5)] hover:shadow-[0_0_25px_rgba(0,191,255,0.8)] hover:scale-[1.03]"
                        >
                          LOGIN
                        </button>
                        <button
                          onClick={() => onNavigate && onNavigate('register')}
                          className="font-display flex-1 md:flex-none border-2 border-[#00e0ff]/30 text-[#00e0ff] hover:text-white hover:border-[#00e0ff] font-black uppercase tracking-widest text-[10px] sm:text-xs px-6 py-3 rounded-xl transition-all duration-300 hover:bg-[#00e0ff]/10"
                        >
                          CADASTRAR
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isLogoOnly) {
                  return (
                    <div
                      key="logo-only-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className="group relative transition-all duration-500 select-none col-span-1 row-span-1 flex items-center justify-center p-4 min-h-[130px] cursor-pointer"
                    >
                      {/* Logo centered */}
                      <img 
                        src="/cr-logo.png" 
                        alt="Chip Race" 
                        className="h-[65px] w-auto transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(0,224,255,0.4)]" 
                      />
                    </div>
                  );
                }

                if (isAdminTile) {
                  return (
                    <div
                      key="admin-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className="group relative bg-[#1d1607]/30 border-[3.5px] border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15),inset_0_0_10px_rgba(245,158,11,0.04)] hover:bg-[#2e230b]/65 hover:border-amber-500/85 hover:shadow-[0_0_30px_rgba(245,158,11,0.55),inset_0_0_20px_rgba(245,158,11,0.15)] rounded-2xl transition-all duration-500 hover:-translate-y-1 backdrop-blur-md cursor-pointer select-none overflow-hidden col-span-1 row-span-1"
                    >
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/40 rounded-tl-lg pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/40 rounded-tr-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500/40 rounded-bl-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/40 rounded-br-lg pointer-events-none"></div>

                      <div className="flex flex-row items-center gap-5 p-4 h-full relative z-10 min-h-[130px]">
                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 relative">
                          <span className="material-icons-outlined text-amber-500 text-5xl drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-300 group-hover:scale-105 animate-pulse">
                            admin_panel_settings
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full min-h-[90px]">
                          <div>
                            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                              PAINEL ADM
                            </h3>
                            <p className="font-body text-sm sm:text-base mt-2 font-medium leading-relaxed text-gray-400 group-hover:text-white">
                              Configurações, caixas, bar, bets e usuários.
                            </p>
                          </div>

                          <div className="mt-3.5 flex justify-start">
                            <button className="font-display bg-gradient-to-r from-amber-500 to-amber-700 text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-5 py-2 rounded-lg transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:shadow-[0_0_20px_rgba(245,158,11,0.8)] hover:scale-[1.03]">
                              GERENCIAR
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isLogout) {
                  return (
                    <div
                      key="logout-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className="group relative bg-[#1a080f]/30 border-[3.5px] border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15),inset_0_0_10px_rgba(239,68,68,0.04)] hover:bg-[#2d0f17]/65 hover:border-red-500/85 hover:shadow-[0_0_30px_rgba(239,68,68,0.55),inset_0_0_20px_rgba(239,68,68,0.15)] rounded-2xl transition-all duration-500 hover:-translate-y-1 backdrop-blur-md cursor-pointer select-none overflow-hidden col-span-1 row-span-1"
                    >
                      {/* Cantos cibernéticos vermelhos */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/40 rounded-tl-lg pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500/40 rounded-tr-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500/40 rounded-bl-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/40 rounded-br-lg pointer-events-none"></div>

                      <div className="flex flex-row items-center gap-5 p-4 h-full relative z-10 min-h-[130px]">
                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 relative">
                          <span className="material-icons-outlined text-red-500 text-5xl drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 group-hover:scale-105">
                            logout
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full min-h-[90px]">
                          <div>
                            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                              SAIR
                            </h3>
                            <p className="font-body text-sm sm:text-base mt-2 font-medium leading-relaxed text-gray-400 group-hover:text-white">
                              Efetuar logout da sua conta com segurança.
                            </p>
                          </div>

                          <div className="mt-3.5 flex justify-start">
                            <button className="font-display bg-gradient-to-r from-red-500 to-red-700 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-5 py-2 rounded-lg transition-all duration-300 shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] hover:scale-[1.03]">
                              SAIR
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                 if (isCopaMundo) {
                  return (
                    <div
                      key="copa-mundo-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className={`group relative bg-gradient-to-b from-[#190a14]/90 to-[#0c0510]/95 border-[3.5px] border-amber-500/50 hover:border-amber-400/85 shadow-[0_0_25px_rgba(245,158,11,0.25),inset_0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_40px_rgba(245,158,11,0.45),inset_0_0_25px_rgba(245,158,11,0.15)] rounded-2xl transition-all duration-500 hover:-translate-y-1 backdrop-blur-md cursor-pointer select-none overflow-hidden ${colClass} ${rowClass} flex flex-col items-center justify-center p-6 text-center relative z-10 min-h-[280px]`}
                    >
                      {/* Cantos do Painel HUD Gold */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-lg pointer-events-none shadow-[0_0_5px_#f59e0b]"></div>

                      {/* Poker chip / globe overlay shape inside */}
                      <div className="absolute -bottom-16 w-48 h-48 border-2 border-red-500/10 rounded-full flex items-center justify-center animate-spin pointer-events-none opacity-20" style={{ animationDuration: '45s' }}>
                        <div className="w-40 h-40 border border-dashed border-red-500/20 rounded-full"></div>
                        <div className="absolute w-20 h-20 border border-red-500/5 rounded-full"></div>
                      </div>

                      {/* Content */}
                      <span className="material-icons text-amber-500 text-5xl drop-shadow-[0_0_12px_rgba(245,158,11,0.95)] animate-bounce mb-3 relative z-10">
                        emoji_events
                      </span>
                      
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.15em] leading-none drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] relative z-10">
                        COPA DO MUNDO
                      </h3>
                      <div className="font-display text-sm sm:text-base font-black text-red-500 tracking-[0.3em] mt-2.5 mb-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse relative z-10">
                        CHIP RACE 2026
                      </div>
                      
                      <div className="h-[2px] w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full shadow-[0_0_6px_#f59e0b] mb-4 relative z-10"></div>
                      
                      <p className="font-body text-[11px] sm:text-xs text-gray-400 max-w-sm mx-auto font-normal tracking-[0.15em] uppercase leading-relaxed mb-5 group-hover:text-white transition-colors relative z-10">
                        {cat.description}
                      </p>

                      <button className="font-display bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black group-hover:text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.8)] hover:scale-[1.03] relative z-10">
                        {cat.button_text || 'VER CHAVEAMENTO'}
                      </button>
                    </div>
                  );
                }

                if (isCvth) {
                  return (
                    <div
                      key="cvth-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className={`group relative bg-[#041c0b]/30 border-[3.5px] border-[#39ff14]/40 shadow-[0_0_12px_rgba(57,255,20,0.15),inset_0_0_10px_rgba(57,255,20,0.04)] hover:bg-[#073214]/65 hover:border-[#39ff14]/85 hover:shadow-[0_0_30px_rgba(57,255,20,0.55),inset_0_0_20px_rgba(57,255,20,0.15)] rounded-2xl transition-all duration-500 hover:-translate-y-1 backdrop-blur-md cursor-pointer select-none overflow-hidden ${colClass} ${rowClass}`}
                    >
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#39ff14]/40 rounded-tl-lg pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#39ff14]/40 rounded-tr-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#39ff14]/40 rounded-bl-lg pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#39ff14]/40 rounded-br-lg pointer-events-none"></div>

                      <div className="flex flex-row items-center gap-5 p-4 h-full relative z-10 min-h-[130px]">
                        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 relative">
                          <span className="material-icons-outlined text-[#39ff14] text-5xl drop-shadow-[0_0_10px_rgba(57,255,20,0.8)] transition-all duration-300 group-hover:scale-105 animate-pulse">
                            sports_esports
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full min-h-[90px]">
                          <div>
                            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                              CVTH - 2ª TEMP
                            </h3>
                            <p className="font-body text-sm sm:text-base mt-2 font-medium leading-relaxed text-gray-400 group-hover:text-white">
                              {cat.description}
                            </p>
                          </div>

                          <div className="mt-3.5 flex justify-start">
                            <button className="font-display bg-gradient-to-r from-[#39ff14] to-[#1e8a0a] text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-5 py-2 rounded-lg transition-all duration-300 shadow-[0_0_12px_rgba(57,255,20,0.5)] hover:shadow-[0_0_20px_rgba(57,255,20,0.8)] hover:scale-[1.03]">
                              {cat.button_text || 'VER DETALHES'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isTheChosen) {
                  const hasBgChosen = !!cat.background_url;
                  const borderChosen = hasBgChosen 
                    ? 'border-[3.5px] border-[#00e0ff]/15 hover:border-[#00e0ff]/40 shadow-[0_0_15px_rgba(0,224,255,0.08)]' 
                    : 'border-[3.5px] border-[#00e0ff]/50 hover:border-[#00e0ff]/85';

                  return (
                    <div
                      key="the-chosen-tile"
                      onClick={(e) => handleTileClick(e, cat)}
                      className={`group relative bg-gradient-to-b from-[#06152d]/90 to-[#030918]/95 ${borderChosen} shadow-[0_0_25px_rgba(0,224,255,0.25),inset_0_0_20px_rgba(0,224,255,0.1)] rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(0,224,255,0.5),inset_0_0_25px_rgba(0,224,255,0.2)] backdrop-blur-md cursor-pointer select-none overflow-hidden ${colClass} ${rowClass} flex flex-col items-center justify-center p-6 text-center relative z-10 min-h-[280px]`}
                    >
                      {/* Cantos do Painel HUD */}
                      {hasBgChosen ? (
                        <>
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00e0ff]/20 rounded-tl-lg pointer-events-none"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00e0ff]/20 rounded-tr-lg pointer-events-none"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00e0ff]/20 rounded-bl-lg pointer-events-none"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00e0ff]/20 rounded-br-lg pointer-events-none"></div>
                        </>
                      ) : (
                        <>
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00e0ff] rounded-tl-lg pointer-events-none"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00e0ff] rounded-tr-lg pointer-events-none"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00e0ff] rounded-bl-lg pointer-events-none"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00e0ff] rounded-br-lg pointer-events-none"></div>
                        </>
                      )}

                      {/* Círculo do chip de poker neon pulsante no fundo */}
                      <div className="absolute -bottom-16 w-48 h-48 border-2 border-[#00e0ff]/10 rounded-full flex items-center justify-center animate-spin pointer-events-none opacity-20" style={{ animationDuration: '45s' }}>
                        <div className="w-40 h-40 border border-dashed border-[#00e0ff]/20 rounded-full"></div>
                        <div className="absolute w-20 h-20 border border-[#00e0ff]/5 rounded-full"></div>
                      </div>

                      {/* Imagem de Fundo Absoluta (Sem Margens, Zoom Pulse Animado e Brilho Neon) */}
                      {cat.background_url && (
                        <div 
                          className="absolute -inset-4 z-0 bg-cover bg-center bg-no-repeat animate-cyber-bg pointer-events-none"
                          style={{
                            backgroundImage: `url(${cat.background_url})`,
                          }}
                        />
                      )}

                      {/* Content */}
                      <h3 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-[0.2em] leading-none drop-shadow-[0_0_12px_rgba(0,224,255,0.6)] relative z-10">
                        {cat.title || 'THE CHOSEN'}
                      </h3>
                      <div className="font-display text-lg sm:text-xl font-black text-[#00e0ff] tracking-[0.4em] mt-2 mb-3 drop-shadow-[0_0_10px_rgba(0,224,255,0.8)] animate-pulse relative z-10">
                        {prizeLabel}
                      </div>
                      
                      <div className="h-[2px] w-28 bg-gradient-to-r from-transparent via-[#00e0ff] to-transparent rounded-full shadow-[0_0_6px_#00e0ff] mb-3 relative z-10"></div>
                      
                      <p className="font-body text-[11px] sm:text-xs text-gray-400 max-w-md mx-auto font-normal tracking-[0.15em] uppercase leading-relaxed mb-4 group-hover:text-white transition-colors relative z-10">
                        {cat.description || 'O palco sagrado da Chip Race. Explore nosso ecossistema e garanta seu lugar entre os escolhidos.'}
                      </p>

                      <button className="font-display bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,191,255,0.5)] hover:shadow-[0_0_25px_rgba(0,191,255,0.8)] hover:scale-[1.03] relative z-10">
                        {cat.button_text || 'EXPLORAR'}
                      </button>
                    </div>
                  );
                }

                const isMystery = cat.is_mystery && !isAdmin;
                const isBlocked = cat.is_hidden && isAdmin;

                const hasBg = cat.background_url && !isMystery;
                const borderStyles = hasBg 
                  ? 'border-[3.5px] border-[#00bfff]/15 hover:border-[#00e0ff]/40' 
                  : `border-[3.5px] ${isBlocked ? 'border-red-500/30' : 'border-[#00bfff]/40 hover:border-[#00e0ff]/85'}`;
                const shadowStyles = hasBg
                  ? 'shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(0,224,255,0.4)]'
                  : `${isBlocked ? 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_12px_rgba(0,191,255,0.15),inset_0_0_10px_rgba(0,191,255,0.04)] hover:shadow-[0_0_30px_rgba(0,224,255,0.55),inset_0_0_20px_rgba(0,224,255,0.15)]'}`;

                // Layout vertical para o VIP (ou row_span >= 2) e horizontal para os demais
                const isVerticalLayout = cat.id === 'vip' || rSpan >= 2;

                return (
                  <div
                    key={cat.id || index}
                    onClick={(e) => handleTileClick(e, cat)}
                    className={`group relative bg-[#041225]/30 ${borderStyles} ${shadowStyles} rounded-2xl transition-all duration-500 hover:-translate-y-1 backdrop-blur-md cursor-pointer select-none overflow-hidden ${colClass} ${rowClass}`}
                  >
                    {/* Imagem de Fundo Absoluta (Sem Margens, Zoom Pulse Animado e Brilho Neon) */}
                    {cat.background_url && !isMystery && (
                      <div 
                        className="absolute -inset-4 z-0 bg-cover bg-center bg-no-repeat animate-cyber-bg pointer-events-none"
                        style={{
                          backgroundImage: `url(${cat.background_url})`,
                        }}
                      />
                    )}
                    {/* Cantos adicionais estilo cibernético */}
                    {hasBg ? (
                      <>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00bfff]/15 rounded-tl-lg pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00bfff]/15 rounded-tr-lg pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00bfff]/15 rounded-bl-lg pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00bfff]/15 rounded-br-lg pointer-events-none"></div>
                      </>
                    ) : (
                      <>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00bfff]/40 rounded-tl-lg pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00bfff]/40 rounded-tr-lg pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00bfff]/40 rounded-bl-lg pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00bfff]/40 rounded-br-lg pointer-events-none"></div>
                      </>
                    )}

                    {/* Indicador de slots ou status oculto */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                      {isBlocked && (
                        <span className="text-[8px] font-black uppercase bg-red-950/70 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                          OCULTO
                        </span>
                      )}
                      {cat.slots > 0 && !isMystery && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/30">
                          {cat.slots} Vagas
                        </span>
                      )}
                    </div>

                    {/* LAYOUT VERTICAL (ESTILO VIP) */}
                    {isVerticalLayout ? (
                      <div className="flex flex-col items-center justify-between text-center p-5 h-full min-h-[340px] relative z-10">
                        {/* Ícone Outline Neon centralizado no topo (tamanho responsivo de acordo com a altura da box) */}
                        <div className={`${rSpan === 3 ? 'w-32 h-32 mb-2 mt-4' : 'w-20 h-20'} flex items-center justify-center relative`}>
                          {cat.icon_url && !isMystery ? (
                            <img src={cat.icon_url} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,224,255,0.85)] transition-transform duration-300 group-hover:scale-105" alt="" />
                          ) : (
                            <span className={`material-icons-outlined transition-all duration-300 ${isMystery ? 'text-gray-600' : 'text-[#00e0ff]'} ${rSpan === 3 ? 'text-[110px] sm:text-[120px] drop-shadow-[0_0_25px_rgba(0,224,255,0.95)]' : rSpan === 2 ? 'text-7xl drop-shadow-[0_0_15px_rgba(0,224,255,0.85)]' : 'text-6xl drop-shadow-[0_0_12px_rgba(0,224,255,0.8)]'} group-hover:scale-105`}>
                              {isMystery ? 'help' : cat.icon || 'star'}
                            </span>
                          )}
                        </div>

                        {/* Título & Descrição */}
                        <div className="flex-1 flex flex-col justify-center items-center mt-3">
                          <h3 className={`font-display text-xl sm:text-2xl font-black uppercase tracking-wider transition-colors ${isMystery ? 'text-gray-600' : 'text-white'} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>
                            {isMystery ? '???' : cat.title}
                          </h3>
                          {isAdmin && (
                            <div className="text-[9px] font-mono text-gray-500 lowercase mt-0.5">
                              #{cat.id}
                            </div>
                          )}
                          <p className={`font-body text-sm sm:text-base mt-3.5 font-medium leading-relaxed ${isMystery ? 'text-gray-800' : 'text-gray-400 group-hover:text-white'} max-w-[240px]`}>
                            {isMystery ? '??? ??? ??? ???' : renderDescription(cat.description)}
                          </p>
                        </div>

                        {/* Botão no rodapé */}
                        {!isMystery && (
                          <div className="w-full mt-4 flex justify-center">
                            <button className="font-display bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-black uppercase tracking-widest text-[10px] sm:text-xs px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,191,255,0.6)] hover:shadow-[0_0_25px_rgba(0,191,255,0.9)] hover:scale-[1.03]">
                              {cat.button_text || 'VER MAIS'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* LAYOUT HORIZONTAL (ESTILO BAR, CREDITES E OUTROS) */
                      <div className="flex flex-row items-center gap-5 p-4 h-full relative z-10 min-h-[130px]">
                        {/* Ícone Outline Neon na Esquerda (tamanho responsivo de acordo com a largura da box) */}
                        <div className={`${cSpan >= 2 ? 'w-20 h-20' : 'w-16 h-16'} flex items-center justify-center flex-shrink-0 relative`}>
                          {cat.icon_url && !isMystery ? (
                            <img src={cat.icon_url} className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,224,255,0.85)] transition-transform duration-300 group-hover:scale-105" alt="" />
                          ) : (
                            <span className={`material-icons-outlined transition-all duration-300 ${isMystery ? 'text-gray-600' : 'text-[#00e0ff]'} ${cSpan >= 2 ? 'text-6xl drop-shadow-[0_0_15px_rgba(0,224,255,0.85)]' : 'text-5xl drop-shadow-[0_0_10px_rgba(0,224,255,0.8)]'} group-hover:scale-105`}>
                              {isMystery ? 'help' : cat.icon || 'star'}
                            </span>
                          )}
                        </div>

                        {/* Conteúdo Textual e Botão na Direita */}
                        <div className="flex-1 flex flex-col justify-between h-full min-h-[90px]">
                          <div>
                            <h3 className={`font-display text-lg sm:text-xl font-black uppercase tracking-wider transition-colors ${isMystery ? 'text-gray-600' : 'text-white'}`}>
                              {isMystery ? '???' : cat.title}
                            </h3>
                            {cat.id === 'regulamentos-tile' && (
                              <span className="text-[8px] font-mono text-[#00e0ff] font-bold uppercase tracking-widest block mt-0.5">
                                OFICIAL DO POKER
                              </span>
                            )}
                            {isAdmin && (
                              <div className="text-[8px] font-mono text-gray-500 lowercase">
                                #{cat.id}
                              </div>
                            )}
                            <p className={`font-body text-sm sm:text-base mt-2 font-medium leading-relaxed ${isMystery ? 'text-gray-800' : 'text-gray-400 group-hover:text-white'}`}>
                              {isMystery ? '??? ??? ??? ???' : renderDescription(cat.description)}
                            </p>
                          </div>

                          {/* Botão alinhado à esquerda no rodapé interno */}
                          {!isMystery && (
                            <div className="mt-3.5 flex justify-start">
                              <button className="font-display bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-5 py-2 rounded-lg transition-all duration-300 shadow-[0_0_12px_rgba(0,191,255,0.5)] hover:shadow-[0_0_20px_rgba(0,191,255,0.8)] hover:scale-[1.03]">
                                {cat.button_text || 'VER MAIS'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>



        {/* MODAL DE PRODUTO / REGULAMENTOS (POP-UP DETALHADO DO PRODUTO) */}
        {activeCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0b081e] border-2 border-[#00e0ff]/40 rounded-3xl w-full max-w-2xl shadow-[0_0_60px_rgba(0,224,255,0.3)] relative overflow-hidden p-6 sm:p-8 flex flex-col">
              
              {/* Fechar */}
              <button
                onClick={() => setActiveCategory(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full z-30"
              >
                <span className="material-icons-outlined text-xl">close</span>
              </button>

              <div className="flex flex-col items-center text-center mb-6 pt-4">
                <div className="w-16 h-16 rounded-2xl bg-black border border-[#00e0ff]/20 flex items-center justify-center mb-4 shadow-xl">
                  {productDetails?.image_url ? (
                    <img src={productDetails.image_url} alt={productDetails.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="material-icons-outlined text-4xl text-[#00e0ff] drop-shadow-[0_0_8px_rgba(0,224,255,0.8)]">
                      {activeCategory.icon || 'star'}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                  {productDetails?.name || activeCategory.title}
                </h3>
                <div className="h-[2px] w-12 bg-[#00e0ff] rounded-full mt-2"></div>
              </div>

              <div className="space-y-4">
                {activeCategory.id === 'regulamentos-tile' ? (
                  <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-2 custom-scrollbar">
                    {((contentDB.documents && contentDB.documents.length > 0) ? contentDB.documents : [
                      {
                        title: "ADTP 2025",
                        subtitle: "Regulamento oficial",
                        icon: "menu_book",
                        url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/REGULAMENTO%20ADTP%202025%20-%20OFICIAL.pdf",
                        color: "from-amber-500 to-orange-600"
                      },
                      {
                        title: "Anexos ADTP",
                        subtitle: "Exemplos e anexos",
                        icon: "description",
                        url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/EXEMPLOS%20ADTP.pdf",
                        color: "from-blue-500 to-indigo-600"
                      },
                      {
                        title: "TDA 2022",
                        subtitle: "Tournament Directors Assoc.",
                        icon: "gavel",
                        url: "https://uvipogwhdpszyfcoveic.supabase.co/storage/v1/object/public/regulamentos/REGULAMENTO%20TDA%202022%20-%20OFICIAL.pdf",
                        color: "from-emerald-500 to-teal-600"
                      }
                    ]).map((doc, idx) => {
                      const docUrl = doc.url && doc.url !== '#' && doc.url.trim() !== '' 
                        ? (doc.url.startsWith('http') ? doc.url : `https://${doc.url.trim()}`) 
                        : '#';
                      
                      return (
                        <div 
                          key={idx}
                          className="group relative overflow-hidden rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent hover:from-[#00e0ff]/50 transition-all duration-300 shadow-xl"
                        >
                          <div className="relative bg-surface-dark/90 p-5 rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Glow */}
                            <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${doc.color || 'from-primary to-secondary'} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-300 pointer-events-none`}></div>
                            
                            {/* Left part: Icon & Title */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${doc.color || 'from-primary to-secondary'} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                                <span className="material-icons-outlined text-white text-2xl">{doc.icon || 'description'}</span>
                              </div>
                              <div className="text-left">
                                <h4 className="text-base font-bold text-white mb-0.5 group-hover:text-primary transition-colors">
                                  {doc.title}
                                </h4>
                                <p className="text-xs text-gray-400 font-light">
                                  {doc.subtitle}
                                </p>
                              </div>
                            </div>

                            {/* Right part: Actions */}
                            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (docUrl === '#') {
                                    e.preventDefault();
                                    alert('Este documento ainda não foi configurado. Solicite a atualização à administração.');
                                  }
                                }}
                                className="flex-1 sm:flex-none text-center font-display bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-background-dark font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-lg transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(0,224,255,0.2)]"
                              >
                                Visualizar
                              </a>
                              <a
                                href={docUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (docUrl === '#') {
                                    e.preventDefault();
                                    alert('Este documento ainda não foi configurado.');
                                  }
                                }}
                                className="p-2.5 rounded-lg border border-white/10 hover:border-primary/50 text-gray-400 hover:text-[#00e0ff] transition-all flex items-center justify-center"
                                title="Fazer Download"
                              >
                                <span className="material-icons-outlined text-sm">download</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : activeCategory.id === 'faq' ? (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    {(contentDB.faq || []).map((faq: any, fIdx: number) => (
                      <div key={fIdx} className="bg-white/[0.03] border border-[#00e0ff]/20 rounded-xl p-4 shadow-[inset_0_0_10px_rgba(0,224,255,0.02)]">
                        <h4 className="text-xs font-bold text-white mb-2 flex items-start gap-2">
                          <span className="text-[#00e0ff] font-mono">P.</span>
                          <span>{faq.question}</span>
                        </h4>
                        <p className="text-xs text-gray-400 font-light leading-relaxed whitespace-pre-wrap pl-4">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-[#00e0ff]/20 rounded-2xl p-5">
                    <h4 className="text-[10px] font-black text-[#00e0ff] uppercase tracking-[0.2em] mb-2">
                      Informações Detalhadas
                    </h4>
                    <div className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-light max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                      {productDetails?.description || activeCategory.description}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setActiveCategory(null)}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-background-dark font-black uppercase tracking-widest shadow-lg transition-all rounded-xl"
                >
                  {activeCategory.id === 'regulamentos-tile' ? 'Fechar' : 'Entendido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};