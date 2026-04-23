import React, { useState, useEffect } from 'react';
import { MonthData, ContentDB } from '../types';

interface HeroProps {
  isAdmin?: boolean;
  prizeLabel: string;
  months: MonthData[];
  onUpdateMonth: (index: number, field: keyof MonthData, value: any) => void;
  onToggleStatus: (index: number) => void;
  onNavigate: (view: string) => void;
  content: ContentDB['hero'];
  fenachimContent?: ContentDB['fenachim'];
  onUpdateContent: (field: string, value: string) => void;
  showTimeline?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  isAdmin,
  prizeLabel,
  months,
  onUpdateMonth,
  onToggleStatus,
  onNavigate,
  content,
  fenachimContent,
  onUpdateContent,
  showTimeline = true
}) => {
  const [expandMobileTimeline, setExpandMobileTimeline] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Helper function to render a single month card
  const renderMonthCard = (month: MonthData, index: number) => {
    const isActive = month.status === 'active';
    const isCompleted = month.status === 'completed';
    const isLocked = month.status === 'locked';

    return (
      <div key={index} className={`relative pt-6 pb-3 px-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 min-h-[160px] ${isActive
        ? 'bg-primary/20 border-primary shadow-neon-pink scale-105 z-10'
        : isCompleted
          ? 'bg-secondary/10 border-secondary/50 opacity-100'
          : 'bg-white/5 border-white/5 opacity-60 grayscale'
        }`}>

        {/* Status Badge */}
        <div className={`absolute top-0 left-0 w-full text-[9px] uppercase font-black py-1 pl-5 tracking-widest rounded-t-lg ${isActive ? 'bg-primary text-white' :
          isCompleted ? 'bg-secondary text-black' :
            'bg-gray-800 text-gray-500'
          }`}>
          {isActive ? 'EM ANDAMENTO' : isCompleted ? 'ATINGIDA' : 'BLOQUEADA'}
        </div>

        <div className="text-xs font-bold text-gray-400 mb-2 mt-2">{month.name}</div>

        {isLocked && !isAdmin ? (
          <span className="material-icons-outlined text-2xl text-gray-600 my-2">lock</span>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className={`text-xl font-display font-black ${isActive ? 'text-white' : isCompleted ? 'text-secondary' : 'text-gray-500'}`}>
              {month.prize}
            </div>
            <div className="text-[10px] uppercase text-gray-400">GTD</div>
          </div>
        )}

        <div className={`mt-3 w-full flex justify-center`}>
          <div className={`text-xs py-1 px-2 rounded-full font-bold ${isActive ? 'bg-primary text-white' :
            isCompleted ? 'bg-secondary/20 text-secondary' :
              'bg-black/30 text-gray-500'
            }`}>
            {month.qualifiers} {typeof month.qualifiers === 'number' || !isNaN(Number(month.qualifiers)) ? 'Vagas' : ''}
          </div>
        </div>
      </div>
    );
  };

  // Determine current active/target month index
  let currentMonthIndex = months.findIndex(m => m.status === 'active');
  if (currentMonthIndex === -1) currentMonthIndex = months.findIndex(m => m.status === 'locked'); // If none active, show first locked (next)
  if (currentMonthIndex === -1) currentMonthIndex = months.length - 1; // If all completed, show last

  return (
    <div className="relative pt-20 pb-0 lg:pt-28 lg:pb-0 overflow-hidden min-h-[500px]">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px] transition-colors duration-1000 ${currentSlide === 0 ? 'bg-green-500/20' : 'bg-primary/10'}`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Carousel Container */}
        <div className="relative w-full mb-12 min-h-[300px] flex items-center justify-center">
            
            {/* Slide Fenachim (0) */}
            <div className={`w-full transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100 relative z-10' : 'opacity-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none'}`}>
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-display font-black text-gray-900 dark:text-white mb-6 leading-tight">
                    {fenachimContent?.header_title || 'FENACHIM'} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-glow">
                    CHIP RACE
                    </span>
                </h1>
                <p className="mt-4 text-lg sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                    {fenachimContent?.header_subtitle || 'O Maior Torneio de Poker e Canastra na Festa Nacional do Chimarrão. Venha participar!'}
                </p>

                <div className="flex justify-center mt-12 mb-4">
                    <button
                        onClick={() => onNavigate('fenachim')}
                        className="group relative bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white font-black py-3 px-6 sm:py-4 sm:px-10 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] transition-all duration-500 transform hover:-translate-y-2 flex items-center gap-2 sm:gap-4 uppercase tracking-[0.2em] text-xs sm:text-sm overflow-hidden"
                    >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="material-icons-outlined text-xl sm:text-2xl animate-pulse">celebration</span>
                    <span className="relative z-10">
                        {fenachimContent?.btn_details || 'SAIBA MAIS'}
                    </span>
                    <span className="material-icons group-hover:translate-x-2 transition-transform relative z-10">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Slide The Chosen (1) */}
            <div className={`w-full transition-opacity duration-1000 ${currentSlide === 1 ? 'opacity-100 relative z-10' : 'opacity-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none'}`}>
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-display font-black text-gray-900 dark:text-white mb-6 leading-tight">
                    {content.title_line1} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-500 to-secondary text-glow">
                    {prizeLabel}
                    </span>
                </h1>
                <p className="mt-4 text-lg sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                    {content.subtitle}
                </p>

                <div className="flex justify-center mt-12 mb-4">
                    <button
                        onClick={() => onNavigate('the-chosen-details')}
                        className="group relative bg-gradient-to-r from-primary via-accent to-secondary text-white font-black py-3 px-6 sm:py-4 sm:px-10 rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.6)] transition-all duration-500 transform hover:-translate-y-2 flex items-center gap-2 sm:gap-4 uppercase tracking-[0.2em] text-xs sm:text-sm overflow-hidden"
                    >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="material-icons-outlined text-xl sm:text-2xl animate-pulse">stars</span>
                    <span className="relative z-10">
                        CONFIRA <span className="text-secondary-light">{prizeLabel === '2026' ? '30K+' : prizeLabel} GTD</span>
                    </span>
                    <span className="material-icons group-hover:translate-x-2 transition-transform relative z-10">arrow_forward</span>
                    </button>
                </div>
            </div>

        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center gap-3 mb-10">
            <button 
                onClick={() => setCurrentSlide(0)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-green-500 scale-125 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                aria-label="Slide Fenachim"
            />
            <button 
                onClick={() => setCurrentSlide(1)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-primary scale-125 w-8' : 'bg-white/20 hover:bg-white/40'}`}
                aria-label="Slide The Chosen"
            />
        </div>

        {/* Timeline Section */}
        {showTimeline && (
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg sm:text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
                Cronograma de Evolução <span>{prizeLabel}</span>
              </h3>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase">Temporada 2026</span>
              </div>
            </div>

            {/* Mobile View: Single Card Spoiler + Toggle */}
            <div className="md:hidden">
              {!expandMobileTimeline ? (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[240px]">
                    {renderMonthCard(months[currentMonthIndex], currentMonthIndex)}
                  </div>
                  <button
                    onClick={() => setExpandMobileTimeline(true)}
                    className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white uppercase font-bold tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:border-primary/50 transition-all shadow-lg hover:shadow-neon-pink/20"
                  >
                    <span className="material-icons-outlined text-primary">calendar_month</span>
                    Ver todas metas mês a mês
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    {months.map((month, index) => renderMonthCard(month, index))}
                  </div>
                  <button
                    onClick={() => setExpandMobileTimeline(false)}
                    className="mt-6 w-full py-3 text-xs text-gray-500 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2 bg-black/20 rounded-lg border border-white/5"
                  >
                    <span className="material-icons-outlined">expand_less</span> Recolher Cronograma
                  </button>
                </div>
              )}
            </div>

            {/* Desktop View: Full Grid */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-9 gap-2">
              {months.map((month, index) => renderMonthCard(month, index))}
            </div>

            <div className="mt-6 text-sm text-gray-500 italic">
              * Nos meses bloqueados, a premiação e o número de classificados são suspensos e revelados posteriormente pela Chip Race.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};