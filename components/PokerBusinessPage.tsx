import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../src/lib/supabase';

interface PokerBusinessPageProps {
  onNavigate: (view: string) => void;
}

export const PokerBusinessPage: React.FC<PokerBusinessPageProps> = ({ onNavigate }) => {
  const { currentUser, isLoggedIn } = useApp();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    whatsapp: '',
    email: '',
    city: 'Venâncio Aires',
    segment: '',
    referralSource: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Auto-fill form if user is already logged in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        email: prev.email || (currentUser as any).email || '',
        city: prev.city || currentUser.city || 'Venâncio Aires',
        whatsapp: prev.whatsapp || ((currentUser as any).social?.whatsapp || '')
      }));
    }
  }, [isLoggedIn, currentUser]);

  // SEO, Document Title & Open Graph
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "1º Poker Business | CHIP RACE";

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const originalDesc = metaDesc ? metaDesc.content : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "1º Poker Business em Venâncio Aires/RS. Uma noite de poker, descontração e networking para empresários e empreendedores dos Vales do Taquari e Rio Pardo. 21 de outubro de 2026.";

    // Open Graph helper
    const setOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setOgTag('og:title', '1º Poker Business | CHIP RACE');
    setOgTag('og:description', 'Uma noite de poker, descontração e networking para empresários e empreendedores dos Vales do Taquari e Rio Pardo. 21 de outubro de 2026 em Venâncio Aires/RS.');
    setOgTag('og:type', 'website');
    setOgTag('og:url', window.location.href);

    // Scroll listener for sticky CTA
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.content = originalDesc;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      setErrorMessage('Por favor, preencha os campos obrigatórios (Nome e WhatsApp).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('poker_business_leads').insert({
        user_id: currentUser?.id || null,
        name: formData.name.trim(),
        company: formData.company.trim() || null,
        whatsapp: formData.whatsapp.trim(),
        email: formData.email.trim() || null,
        city: formData.city.trim() || 'Venâncio Aires',
        segment: formData.segment.trim() || null,
        referral_source: formData.referralSource.trim() || null,
        status: 'pendente'
      });

      if (error) {
        console.error('Erro ao salvar inscrição do Poker Business no banco:', error);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Falha inesperada no envio:', err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppDirect = () => {
    const officialPhone = '5551992425186';
    const text = encodeURIComponent(
      `Olá, equipe CHIP RACE! Gostaria de confirmar minha solicitação de participação no 1º POKER BUSINESS (21/10/2026).\n\n` +
      `• Nome: ${formData.name || 'Convidado'}\n` +
      `• Empresa: ${formData.company || 'Não informada'}\n` +
      `• Cidade: ${formData.city || 'Venâncio Aires'}`
    );
    window.open(`https://wa.me/${officialPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-[#f1f3f9] selection:bg-[#d4af37]/30 selection:text-[#f8e7b9] font-body relative overflow-x-hidden">
      {/* Luxury Ambience & Subtle Gold Keyframes */}
      <style>{`
        @keyframes subtleGoldGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.04); }
        }
        .gold-glow-ambient {
          animation: subtleGoldGlow 8s ease-in-out infinite;
        }
        .text-gold-gradient {
          background: linear-gradient(135deg, #FFF5D0 0%, #E8C15A 35%, #C29B38 70%, #94711D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-gold-bright {
          background: linear-gradient(135deg, #FFFFFF 0%, #F7E2A9 40%, #E5BE53 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Atmospheric Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Warm top spotlight */}
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.14)_0%,rgba(136,19,55,0.06)_45%,transparent_75%)] blur-[100px] gold-glow-ambient"></div>
        {/* Wine red ambient accent */}
        <div className="absolute top-1/3 -left-48 w-[420px] h-[420px] bg-[radial-gradient(circle,rgba(136,19,55,0.09)_0%,transparent_70%)] blur-[90px]"></div>
        {/* Soft lower golden glow */}
        <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] blur-[100px]"></div>
        {/* Micro-grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:52px_52px] opacity-[0.025]"></div>
      </div>

      {/* ── 17. STICKY TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#07080d]/92 backdrop-blur-xl border-b border-[#d4af37]/25 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onNavigate('home')}
            title="Voltar ao início da Chip Race"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-[#d4af37]/20 rounded-full blur-md group-hover:bg-[#d4af37]/40 transition-all"></div>
              <img 
                src="/cr-logo.png" 
                alt="Chip Race" 
                className="h-8 sm:h-10 w-auto relative drop-shadow-[0_0_12px_rgba(212,175,55,0.35)] group-hover:scale-105 transition-transform" 
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base tracking-[0.2em] text-white">
                  CHIP RACE
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#f1d075] border border-[#d4af37]/40 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  POKER BUSINESS
                </span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono tracking-widest uppercase hidden sm:block">
                Experiência Corporativa Exclusiva
              </span>
            </div>
          </div>

          {/* Simple Navigation Anchor Links (Requisito 17) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-display font-bold uppercase tracking-[0.16em] text-gray-300">
            <button 
              onClick={() => scrollToSection('conceito')} 
              className="hover:text-[#d4af37] transition-colors cursor-pointer"
            >
              O EVENTO
            </button>
            <button 
              onClick={() => scrollToSection('experiencia')} 
              className="hover:text-[#d4af37] transition-colors cursor-pointer"
            >
              EXPERIÊNCIA
            </button>
            <button 
              onClick={() => scrollToSection('incluso')} 
              className="hover:text-[#d4af37] transition-colors cursor-pointer"
            >
              INCLUSO
            </button>
            <button 
              onClick={() => scrollToSection('inscricao')} 
              className="hover:text-[#d4af37] transition-colors cursor-pointer"
            >
              INSCRIÇÃO
            </button>
          </nav>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://wa.me/5551992425186?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20respons%C3%A1vel%20sobre%20o%201%C2%BA%20Poker%20Business."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
              title="Falar no WhatsApp com o responsável: (51) 99242-5186"
            >
              <span className="material-icons-outlined text-sm">chat</span>
              <span className="hidden sm:inline font-bold">Falar com Responsável</span>
            </a>

            <button
              onClick={() => onNavigate('home')}
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
              title="Voltar para a página principal da Chip Race"
            >
              <span className="material-icons-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Menu Principal</span>
            </button>
            
            {/* Fixed CTA button on desktop */}
            <button
              onClick={() => scrollToSection('inscricao')}
              className="font-display text-xs font-black uppercase tracking-[0.15em] px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer font-bold"
            >
              <span>QUERO PARTICIPAR</span>
              <span className="material-icons-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 4. HERO DA LANDING PAGE ── */}
      <section className="relative pt-12 pb-24 sm:pt-20 sm:pb-36 overflow-hidden z-10 border-b border-white/5">
        {/* Cinematic Backdrop Image with Dark Luxury Felt / Lighting Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-25 sm:opacity-30">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=2000&q=85')"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/85 to-[#07080d]/45"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07080d_80%)]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Subtle Golden Private Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#16120a] border border-[#d4af37]/45 shadow-[0_0_25px_rgba(212,175,55,0.18)] mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
            <span className="font-display font-black text-[11px] sm:text-xs text-[#f7e2a9] uppercase tracking-[0.25em]">
              1ª EDIÇÃO • RESTRITO A 50 CONVIDADOS
            </span>
          </div>

          {/* Main Title (Orbitron / High-end typography) */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-[0.12em] text-white leading-tight drop-shadow-[0_0_35px_rgba(212,175,55,0.4)]">
            1º POKER <span className="text-gold-gradient">BUSINESS</span>
          </h1>

          {/* Subtitle */}
          <p className="font-display font-bold text-sm sm:text-lg md:text-xl uppercase tracking-[0.3em] text-[#d4af37] mt-3 mb-6">
            POKER • DESCONTRAÇÃO • NETWORKING
          </p>

          {/* Event Information Chips: Date & Location */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 text-xs sm:text-sm font-mono text-gray-300">
            <div className="flex items-center gap-2 bg-[#0e121a]/80 border border-[#d4af37]/35 px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="material-icons-outlined text-[#d4af37] text-base">calendar_today</span>
              <span className="font-bold tracking-wider text-white">21 DE OUTUBRO DE 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0e121a]/80 border border-[#d4af37]/35 px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="material-icons-outlined text-[#d4af37] text-base">place</span>
              <span className="font-bold tracking-wider text-white">VARANDA • VENÂNCIO AIRES — RS</span>
            </div>
          </div>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 font-body leading-relaxed mb-10 text-balance">
            Uma noite exclusiva reunindo empresários e empreendedores dos Vales do Taquari e Rio Pardo em torno de poker, descontração e novas conexões.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => scrollToSection('inscricao')}
              className="w-full sm:w-auto font-display font-black text-sm sm:text-base uppercase tracking-[0.18em] px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:shadow-[0_0_50px_rgba(212,175,55,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
            >
              <span>QUERO PARTICIPAR</span>
              <span className="material-icons-outlined text-lg font-bold">arrow_forward</span>
            </button>
            <a
              href="https://wa.me/5551992425186?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20respons%C3%A1vel%20sobre%20o%201%C2%BA%20Poker%20Business."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto font-display font-bold text-xs sm:text-sm uppercase tracking-[0.16em] px-6 py-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <span className="material-icons-outlined text-emerald-400 text-lg">chat</span>
              <span>FALAR COM RESPONSÁVEL</span>
            </a>
            <button
              onClick={() => scrollToSection('conceito')}
              className="w-full sm:w-auto font-display font-bold text-xs sm:text-sm uppercase tracking-[0.18em] px-6 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/20 hover:border-[#d4af37]/60 text-gray-200 hover:text-white transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>COMO FUNCIONA?</span>
              <span className="material-icons-outlined text-base">expand_more</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. BLOCO DE DESTAQUE (4 INFORMAÇÕES VISUAIS) ── */}
      <section className="relative z-10 -mt-12 sm:-mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Destaque 1: 21 OUTUBRO */}
          <div className="bg-[#0c0f18]/95 border border-[#d4af37]/30 hover:border-[#d4af37]/70 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all group">
            <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block mb-1">
              Data Marcada
            </span>
            <div className="font-display font-black text-3xl sm:text-4xl text-white group-hover:text-[#f7e2a9] transition-colors leading-none">
              21
            </div>
            <div className="font-display font-bold text-xs sm:text-sm text-[#d4af37] tracking-wider uppercase mt-1.5">
              OUTUBRO
            </div>
          </div>

          {/* Destaque 2: R$ 300 POR PARTICIPANTE */}
          <div className="bg-[#0c0f18]/95 border border-[#d4af37]/30 hover:border-[#d4af37]/70 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all group">
            <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block mb-1">
              Experiência Completa
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-white group-hover:text-[#f7e2a9] transition-colors leading-none">
              R$ 300
            </div>
            <div className="font-display font-bold text-xs sm:text-sm text-[#d4af37] tracking-wider uppercase mt-1.5">
              POR PARTICIPANTE
            </div>
          </div>

          {/* Destaque 3: POKER TORNEIO + CASH GAME */}
          <div className="bg-[#0c0f18]/95 border border-[#d4af37]/30 hover:border-[#d4af37]/70 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all group">
            <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block mb-1">
              Dinâmica da Mesa
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-white group-hover:text-[#f7e2a9] transition-colors leading-none">
              POKER
            </div>
            <div className="font-display font-bold text-xs sm:text-sm text-[#d4af37] tracking-wider uppercase mt-1.5">
              TORNEIO + CASH GAME
            </div>
          </div>

          {/* Destaque 4: EXPERIÊNCIA ALIMENTAÇÃO + BEBIDAS */}
          <div className="bg-[#0c0f18]/95 border border-[#d4af37]/30 hover:border-[#d4af37]/70 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all group">
            <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block mb-1">
              Noite All-Inclusive
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-white group-hover:text-[#f7e2a9] transition-colors leading-none">
              EXPERIÊNCIA
            </div>
            <div className="font-display font-bold text-xs sm:text-sm text-[#d4af37] tracking-wider uppercase mt-1.5">
              ALIMENTAÇÃO + BEBIDAS
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. O CONCEITO ── */}
      <section id="conceito" className="py-20 sm:py-28 relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Copy Principal */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-mono tracking-widest uppercase mb-3">
              <span className="text-sm font-serif">♠</span> UMA PROPOSTA INOVADORA
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider text-white mb-6 leading-tight">
              UMA NOITE <span className="text-gold-gradient">DIFERENTE</span>
            </h2>
            <div className="space-y-4 text-gray-300 text-base sm:text-lg leading-relaxed font-normal">
              <p>
                O <strong className="text-white font-semibold">1º Poker Business</strong> foi criado para reunir empresários e empreendedores em um ambiente descontraído, sofisticado e diferente do tradicional ambiente corporativo.
              </p>
              <p>
                O poker funciona como ponto de encontro: uma experiência competitiva, divertida e acessível, capaz de colocar pessoas diferentes na mesma mesa.
              </p>
            </div>

            {/* Destaque / Callout de Boas-Vindas a Iniciantes */}
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1c160a] to-[#0c0f18] border-l-4 border-[#d4af37] border-y border-r border-[#d4af37]/25 shadow-[0_0_25px_rgba(212,175,55,0.08)]">
              <div className="flex items-start gap-3.5">
                <span className="material-icons-outlined text-[#d4af37] text-2xl shrink-0 mt-0.5">verified_user</span>
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wider mb-1">
                    Você não precisa ser jogador profissional.
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    O evento terá uma breve introdução prática ao poker antes do início das atividades, orientando regras, dinâmica e jogabilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fotografia Cinematográfica de Conversa & Negócios */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/35 shadow-[0_0_40px_rgba(0,0,0,0.8)] group">
              <img
                src="/images/poker-business-table.jpg"
                alt="Mesa de poker com empresários descontraídos"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block">
                  Vales do Taquari & Rio Pardo
                </span>
                <p className="font-display font-bold text-sm text-white uppercase tracking-wider mt-1">
                  Pessoas interessantes, boas conversas e novas oportunidades à mesa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. O QUE VAI ACONTECER (4 CARDS + EXPERIÊNCIA) ── */}
      <section id="experiencia" className="py-20 sm:py-28 relative z-10 bg-[#0a0d16]/80 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#d4af37] font-mono text-xs uppercase tracking-widest block mb-2">
              Estrutura da Noite
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-white">
              O QUE VAI <span className="text-gold-gradient">ACONTECER</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3">
              Uma noite completa estruturada para entretenimento, aprendizado prático e relações de alto nível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Aula de Poker */}
            <div className="bg-[#0d111c] border border-white/10 hover:border-[#d4af37]/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group relative flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xl text-[#d4af37] font-serif mb-5 group-hover:scale-110 transition-transform">
                  ♠
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-[#f7e2a9] transition-colors mb-2.5">
                  AULA DE POKER
                </h3>
                <p className="font-body text-sm text-gray-300 leading-relaxed">
                  Uma breve introdução prática para quem nunca jogou ou quer entender melhor a dinâmica do poker.
                </p>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-6 block pt-3 border-t border-white/5">
                Iniciação Descomplicada
              </span>
            </div>

            {/* Card 2: Torneio */}
            <div className="bg-[#0d111c] border border-white/10 hover:border-[#d4af37]/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group relative flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xl text-[#d4af37] font-serif mb-5 group-hover:scale-110 transition-transform">
                  ♠
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-[#f7e2a9] transition-colors mb-2.5">
                  TORNEIO
                </h3>
                <p className="font-body text-sm text-gray-300 leading-relaxed">
                  Um torneio especial para os participantes do evento, estimulando estratégia e entretenimento entre amigos de mesa.
                </p>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-6 block pt-3 border-t border-white/5">
                Competição Amigável
              </span>
            </div>

            {/* Card 3: Cash Game */}
            <div className="bg-[#0d111c] border border-white/10 hover:border-[#d4af37]/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group relative flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xl text-[#d4af37] font-serif mb-5 group-hover:scale-110 transition-transform">
                  ♠
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-[#f7e2a9] transition-colors mb-2.5">
                  CASH GAME
                </h3>
                <p className="font-body text-sm text-gray-300 leading-relaxed">
                  Mesas de cash game para quem quiser continuar a experiência e estender a diversão ao longo da noite.
                </p>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-6 block pt-3 border-t border-white/5">
                Para Estender a Noite
              </span>
            </div>

            {/* Card 4: Networking */}
            <div className="bg-[#0d111c] border border-white/10 hover:border-[#d4af37]/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group relative flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-xl text-[#d4af37] font-serif mb-5 group-hover:scale-110 transition-transform">
                  ♠
                </div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-[#f7e2a9] transition-colors mb-2.5">
                  NETWORKING
                </h3>
                <p className="font-body text-sm text-gray-300 leading-relaxed">
                  Um ambiente descontraído para conversar, conhecer pessoas e criar novas conexões reais de negócios.
                </p>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-6 block pt-3 border-t border-white/5">
                Relações de Valor
              </span>
            </div>
          </div>

          {/* Destaque Gastronômico Especial */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#171308] via-[#0d111c] to-[#171308] border border-[#d4af37]/35 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_35px_rgba(212,175,55,0.08)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-2xl text-[#d4af37] shrink-0">
                🍽
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f7e2a9] border border-[#d4af37]/40 px-2 py-0.5 rounded uppercase">
                    Incluso
                  </span>
                  <h4 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
                    EXPERIÊNCIA GASTRONÔMICA COMPLETA
                  </h4>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  Alimentação e bebidas incluídas durante todo o evento, para você curtir a noite sem preocupações extras.
                </p>
              </div>
            </div>
            <button
              onClick={() => scrollToSection('inscricao')}
              className="shrink-0 font-display text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b88f28] hover:from-[#f7e2a9] hover:to-[#d4af37] text-black transition-all shadow-md cursor-pointer"
            >
              Garantir Vaga
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. PARA QUEM É ── */}
      <section className="py-20 sm:py-28 relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[#d4af37] font-mono text-xs uppercase tracking-widest block mb-2">
            Público Selecionado
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-white mb-4">
            FEITO PARA QUEM GOSTA DE <span className="text-gold-gradient">CONHECER PESSOAS</span>
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            O evento é direcionado principalmente a quem valoriza novas conexões de valor e aprecia um ambiente maduro e aconchegante:
          </p>
          <div className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#14120a] border border-[#d4af37]/30 text-sm font-semibold text-[#f7e2a9]">
            “Venha conhecer pessoas interessantes enquanto vive uma experiência diferente.”
          </div>
        </div>

        {/* Grade dos Perfis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { title: 'Empresários', desc: 'Proprietários e sócios de empresas da região', icon: 'business' },
            { title: 'Empreendedores', desc: 'Criadores de projetos inovadores e negócios em expansão', icon: 'rocket_launch' },
            { title: 'Investidores', desc: 'Interessados em oportunidades de investimento e parcerias', icon: 'trending_up' },
            { title: 'Executivos', desc: 'Diretores, superintendentes e tomadores de decisão', icon: 'groups' },
            { title: 'Profissionais Liberais', desc: 'Médicos, advogados, contadores, engenheiros e consultores', icon: 'workspace_premium' },
            { title: 'Gestores Públicos', desc: 'Lideranças do setor público, secretários e administradores regionais', icon: 'account_balance' },
            { title: 'Lideranças Regionais', desc: 'Representantes de entidades empresariais e associações', icon: 'corporate_fare' },
            { title: 'Parceiros Regionais', desc: 'Convidados do ecossistema Taquari e Rio Pardo', icon: 'handshake' },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-[#0b0e16] border border-white/10 hover:border-[#d4af37]/45 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:bg-[#101420] shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d4af37] mb-4">
                  <span className="material-icons-outlined text-xl">{item.icon}</span>
                </div>
                <h4 className="font-display font-bold text-base sm:text-lg text-white mb-1.5">{item.title}</h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. INICIANTES SÃO BEM-VINDOS ── */}
      <section className="py-20 sm:py-28 relative z-10 bg-gradient-to-b from-[#0b0e16] via-[#141006] to-[#07080d] border-y border-[#d4af37]/25">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#090b10] border border-[#d4af37]/35 p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            
            {/* Background luxury shimmer */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f7e2a9] text-xs font-mono uppercase tracking-widest mb-4">
                Ambiente Inclusivo • Sem Pressão
              </div>

              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-white mb-6 leading-tight">
                NUNCA JOGOU <span className="text-gold-gradient">POKER?</span>
              </h2>

              <p className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                Sem problema.
              </p>

              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8">
                Antes do início do evento teremos uma breve aula prática explicando a dinâmica básica do jogo, permitindo que participantes iniciantes possam aproveitar a experiência.
              </p>

              <div className="inline-flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-[#1b1509] border border-[#d4af37]/45 shadow-inner">
                <span className="material-icons-outlined text-[#d4af37] text-2xl">stars</span>
                <span className="font-display font-black text-xs sm:text-sm md:text-base text-[#f7e2a9] uppercase tracking-wider">
                  NÃO É NECESSÁRIO SER JOGADOR PROFISSIONAL.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. O QUE ESTÁ INCLUÍDO ── */}
      <section id="incluso" className="py-20 sm:py-28 relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[#d4af37] font-mono text-xs uppercase tracking-widest block mb-2">
            Transparência & Valor
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-white">
            SEU INGRESSO <span className="text-gold-gradient">INCLUI</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-3">
            Tudo o que você precisa para vivenciar uma noite marcante, sem cobranças inesperadas.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-[#0b0e16] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-10 shadow-[0_0_40px_rgba(212,175,55,0.12)] relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 mb-8 border-b border-white/10 gap-4">
            <div>
              <span className="text-xs font-mono text-[#d4af37] uppercase tracking-widest block">Ingresso Único</span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider mt-1">
                SEU INGRESSO INCLUI
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-display font-black text-4xl sm:text-5xl text-white leading-none text-gold-gradient">
                R$ 300
              </div>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block mt-1">
                Por participante
              </span>
            </div>
          </div>

          {/* Checklist Exato (Requisito 10) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              'Entrada no evento',
              'Aula introdutória de poker',
              'Participação no torneio',
              'Acesso à experiência de cash game, conforme regras do evento',
              'Alimentação',
              'Bebidas',
              'Networking',
              'Experiência CHIP RACE',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.025] border border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] text-xs shrink-0 font-bold">
                  ✓
                </div>
                <span className="text-sm text-gray-200 font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Resguardo Legal e Estrutura Financeira do Cash Game */}
          <div className="mt-8 p-4 rounded-xl bg-[#141108] border border-[#d4af37]/25 text-xs text-gray-400 leading-relaxed">
            <p>
              * O valor de R$ 300 assegura entrada, gastronomia, bebidas, aula e participação no torneio do evento. O valor de R$ 300 não corresponde a saldo ou fichas para a mesa de cash game. A estrutura financeira e regras das mesas de cash game serão explicadas em regulamento próprio disponibilizado pela organização no dia.
            </p>
          </div>
        </div>
      </section>

      {/* ── 11. EXCLUSIVIDADE (EMOCIONAL) ── */}
      <section className="py-24 sm:py-32 relative z-10 text-center bg-[#05060a] border-y border-white/5 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-[#d4af37] text-2xl font-serif block mb-4">♠</span>
          
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.1em] text-white leading-tight mb-8">
            UMA MESA. <span className="text-gold-gradient">MUITAS HISTÓRIAS.</span>
          </h2>

          <div className="max-w-xl mx-auto space-y-2 text-lg sm:text-2xl text-gray-300 font-light italic leading-relaxed">
            <p>“Algumas conexões acontecem em uma reunião.”</p>
            <p className="text-[#f7e2a9] font-normal">“Outras acontecem em uma mesa de poker.”</p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 inline-flex flex-col items-center">
            <span className="font-display font-bold text-base text-white tracking-widest uppercase">21.10.2026</span>
            <span className="font-mono text-xs text-gray-400 tracking-wider uppercase mt-1">Venâncio Aires — RS</span>
          </div>
        </div>
      </section>

      {/* ── 12. LOCAL E DATA (SAVE THE DATE) ── */}
      <section className="py-16 sm:py-24 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0d1017] via-[#161208] to-[#0d1017] border border-[#d4af37]/35 rounded-3xl p-8 sm:p-12 text-center shadow-[0_0_35px_rgba(0,0,0,0.6)]">
          <span className="font-mono text-xs text-[#d4af37] tracking-[0.25em] uppercase font-bold block mb-3">
            SAVE THE DATE
          </span>
          <h3 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-wider mb-2">
            21 DE OUTUBRO DE 2026
          </h3>
          <p className="font-display text-sm sm:text-base text-[#d4af37] tracking-widest uppercase mb-8">
            VARANDA • VENÂNCIO AIRES — RS
          </p>

          <div className="max-w-md mx-auto p-5 rounded-2xl bg-black/60 border border-white/10 text-xs sm:text-sm text-gray-300">
            <div className="font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <span className="material-icons-outlined text-[#d4af37] text-base">pin_drop</span>
              <span>LOCAL DO EVENTO</span>
            </div>
            <p className="text-white font-display font-black text-lg tracking-wider text-gold-gradient">
              VARANDA
            </p>
            <p className="text-gray-400 mt-0.5">
              Venâncio Aires — RS
            </p>
            <p className="text-[11px] text-gray-500 mt-2">
              Orientações de acesso e credenciamento serão enviadas diretamente aos participantes confirmados.
            </p>
          </div>
        </div>
      </section>

      {/* ── ESPAÇO PARA A MÍDIA (JORNAL E RÁDIOS PRESENTES) ── */}
      <section className="py-16 sm:py-20 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0b0e17] border border-[#d4af37]/35 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          {/* Subtle gold decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-mono tracking-widest uppercase mb-2">
              <span className="material-icons-outlined text-sm">campaign</span> COBERTURA & PRESTÍGIO REGIONAL
            </div>
            <h3 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-wider text-white mb-3">
              ESPAÇO PARA A <span className="text-gold-gradient">MÍDIA</span>
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Jornal e rádios estarão presentes no evento, trazendo ampla cobertura de imprensa, entrevistas com empresários e registro de novas oportunidades regionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#d4af37]/45 transition-colors flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] shrink-0">
                <span className="material-icons-outlined text-2xl">newspaper</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white uppercase tracking-wider mb-1">
                  Jornal & Mídia Impressa
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Presença confirmada de jornal regional para matérias de negócios, coluna social e registro dos participantes.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#d4af37]/45 transition-colors flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] shrink-0">
                <span className="material-icons-outlined text-2xl">radio</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white uppercase tracking-wider mb-1">
                  Rádios Regionais
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Emissoras de rádio ao vivo com flashes de cobertura, entrevistas com convidados e repercussão no ecossistema empresarial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 14. LISTA DE CONVIDADOS / EXCLUSIVIDADE ── */}
      <section className="py-12 relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0f18] border border-[#d4af37]/45 shadow-[0_0_30px_rgba(212,175,55,0.12)]">
          <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-widest block mb-1">
            Exclusividade & Conforto Absoluto
          </span>
          <h4 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider mb-2">
            EVENTO PRIVADO
          </h4>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto mb-4">
            O 1º Poker Business foi planejado para proporcionar máxima interação, conexões genuínas e conforto entre líderes.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#f7e2a9] font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
            EVENTO RESTRITO A 50 CONVIDADOS
          </div>
        </div>
      </section>

      {/* ── 13. INSCRIÇÃO (FORMULÁRIO DE CONVERSÃO FORTE) ── */}
      <section id="inscricao" className="py-20 sm:py-28 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0c0f18] border-2 border-[#d4af37]/50 rounded-3xl p-6 sm:p-12 shadow-[0_0_60px_rgba(212,175,55,0.18)] relative overflow-hidden">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#d4af37] tracking-widest uppercase block mb-1">
              Garantia de Participação
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-white mb-2">
              QUERO <span className="text-gold-gradient">PARTICIPAR</span>
            </h2>
            <p className="text-[#f7e2a9] font-display font-bold text-lg sm:text-xl uppercase tracking-wider">
              R$ 300 por pessoa
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              Preencha os dados abaixo. Nossa equipe entrará em contato para confirmar sua participação e orientar sobre o pagamento.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-8 rounded-2xl bg-[#121c10] border border-emerald-500/40 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-3xl mx-auto mb-4 font-bold">
                ✓
              </div>
              <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider mb-2">
                Solicitação Recebida com Sucesso!
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto mb-6">
                Obrigado pelo seu interesse no <strong className="text-white">1º Poker Business</strong>. Nossa equipe entrará em contato pelo seu WhatsApp para confirmar a participação e orientar sobre pagamento.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={openWhatsAppDirect}
                  className="w-full sm:w-auto font-display text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer font-bold"
                >
                  <span className="material-icons text-base">chat</span>
                  <span>Falar agora pelo WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full sm:w-auto text-xs font-mono text-gray-400 hover:text-white px-4 py-3 underline cursor-pointer"
                >
                  Enviar outra solicitação
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                  <span className="material-icons-outlined text-sm">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Nome Completo <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Empresa
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Nome da sua empresa"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    WhatsApp <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="(51) 99999-9999"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ex: Venâncio Aires, Lajeado, Santa Cruz do Sul..."
                    className="w-full bg-white/5 border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Segmento */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Segmento / Área de Atuação
                  </label>
                  <input
                    type="text"
                    name="segment"
                    value={formData.segment}
                    onChange={handleInputChange}
                    placeholder="Ex: Indústria, Varejo, Tecnologia, Agronegócio..."
                    className="w-full bg-white/5 border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* Como ficou sabendo */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                    Como ficou sabendo do evento?
                  </label>
                  <select
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d111c] border border-white/10 focus:border-[#d4af37] rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                  >
                    <option value="">Selecione uma opção...</option>
                    <option value="Indicação de Colega / Amigo">Indicação de Colega / Amigo</option>
                    <option value="Instagram / Redes Sociais">Instagram / Redes Sociais</option>
                    <option value="Site Chip Race">Site Chip Race</option>
                    <option value="Grupo Empresarial / Associação">Grupo Empresarial / Associação</option>
                    <option value="Exposição em evento">Exposição em evento</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-display font-black text-sm sm:text-base uppercase tracking-[0.2em] py-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                      <span>ENVIANDO SOLICITAÇÃO...</span>
                    </>
                  ) : (
                    <>
                      <span>SOLICITAR PARTICIPAÇÃO</span>
                      <span className="material-icons-outlined text-base font-bold">arrow_forward</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-400 mt-3">
                  Depois do envio, a equipe CHIP RACE entrará em contato para confirmar a participação e orientar sobre pagamento.
                </p>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                  <span>Dúvidas ou prefere atendimento direto?</span>
                  <a
                    href="https://wa.me/5551992425186?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20respons%C3%A1vel%20sobre%20o%201%C2%BA%20Poker%20Business."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/25 font-bold transition-all text-xs"
                  >
                    <span className="material-icons-outlined text-sm text-emerald-400">chat</span>
                    <span>Falar com Responsável • (51) 99242-5186</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── 15. CHIP RACE APRESENTAÇÃO ── */}
      <section className="py-16 sm:py-24 relative z-10 bg-[#06070c] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-block relative mb-6">
            <div className="absolute -inset-2 bg-[#d4af37]/20 rounded-full blur-lg"></div>
            <img 
              src="/cr-logo.png" 
              alt="Chip Race" 
              className="h-14 sm:h-16 w-auto relative drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] mx-auto" 
            />
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-white mb-4">
            UMA EXPERIÊNCIA <span className="text-gold-gradient">CHIP RACE</span>
          </h3>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-3">
            A CHIP RACE transforma o poker em experiências, eventos e conexões.
          </p>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            No 1º Poker Business, nosso objetivo é proporcionar uma noite diferente: poker, descontração, boa gastronomia e pessoas reunidas em torno da mesma mesa.
          </p>
        </div>
      </section>

      {/* ── 16. CTA FINAL ── */}
      <section className="py-20 sm:py-28 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-gradient-to-b from-[#111522] via-[#0c0f18] to-[#07080d] border border-[#d4af37]/45 p-8 sm:p-14 shadow-[0_0_55px_rgba(0,0,0,0.8)]">
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-[0.1em] text-white leading-tight mb-2">
            1º POKER <span className="text-gold-gradient">BUSINESS</span>
          </h2>
          <p className="font-display font-bold text-xs sm:text-sm uppercase tracking-[0.25em] text-[#d4af37] mb-6">
            POKER • DESCONTRAÇÃO • NETWORKING
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono text-gray-300 mb-6">
            <span>21 DE OUTUBRO DE 2026</span>
            <span className="text-[#d4af37]">•</span>
            <span>VARANDA • VENÂNCIO AIRES — RS</span>
            <span className="text-[#d4af37]">•</span>
            <span className="text-[#f7e2a9] font-bold">R$ 300</span>
          </div>

          <div className="max-w-md mx-auto mb-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => scrollToSection('inscricao')}
              className="w-full sm:w-auto flex-1 font-display font-black text-sm uppercase tracking-[0.2em] py-4 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_45px_rgba(212,175,55,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
            >
              QUERO PARTICIPAR
            </button>
            <a
              href="https://wa.me/5551992425186?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20respons%C3%A1vel%20sobre%20o%201%C2%BA%20Poker%20Business."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto font-display font-bold text-xs uppercase tracking-[0.16em] py-4 px-6 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <span className="material-icons-outlined text-emerald-400 text-base">chat</span>
              <span>FALAR COM RESPONSÁVEL</span>
            </a>
          </div>

          <span className="text-xs font-mono text-[#f7e2a9] uppercase tracking-widest block font-bold">
            Evento restrito a 50 convidados.
          </span>
        </div>
      </section>

      {/* ── 18 & 17. FIXED BOTTOM CTA BAR (MOBILE & DESKTOP ON SCROLL) ── */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#07080d]/95 backdrop-blur-xl border-t border-[#d4af37]/35 py-3 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-300">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse hidden sm:block"></div>
              <div>
                <span className="font-display font-bold text-xs sm:text-sm text-white uppercase tracking-wider block leading-tight">
                  1º Poker Business
                </span>
                <span className="text-[10px] font-mono text-[#d4af37] tracking-wider">
                  21.10.2026 • Varanda • R$ 300
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/5551992425186?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20respons%C3%A1vel%20sobre%20o%201%C2%BA%20Poker%20Business."
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all"
                title="Falar no WhatsApp com o responsável: (51) 99242-5186"
              >
                <span className="material-icons-outlined text-sm">chat</span>
                <span>Responsável</span>
              </a>
              <button
                onClick={() => scrollToSection('inscricao')}
                className="font-display font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e2a9] to-[#b88f28] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
              >
                Quero Participar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
