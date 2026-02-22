import React, { useState } from 'react';
import { MonthData, ContentDB } from '../types';
import { EditableContent } from './EditableContent';

interface HeroProps {
  isAdmin?: boolean;
  prizeLabel: string;
  months: MonthData[];
  onUpdateMonth: (index: number, field: keyof MonthData, value: any) => void;
  onToggleStatus: (index: number) => void;
  onNavigate: (view: string) => void;
  content: ContentDB['hero'];
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
  onUpdateContent,
  showTimeline = true
}) => {
  const [expandMobileTimeline, setExpandMobileTimeline] = useState(false);

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
        <div className={`absolute top-0 left-0 w-full text-[9px] uppercase font-black py-1 tracking-widest rounded-t-lg ${isActive ? 'bg-primary text-white' :
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
            {isAdmin ? (
              <input
                type="text"
                value={month.prize}
                onChange={(e) => onUpdateMonth(index, 'prize', e.target.value)}
                className="w-16 text-center bg-black/50 border border-white/20 rounded text-sm text-white font-bold mb-1"
              />
            ) : (
              <div className={`text-xl font-display font-black ${isActive ? 'text-white' : isCompleted ? 'text-secondary' : 'text-gray-500'}`}>
                {month.prize}
              </div>
            )}
            <div className="text-[10px] uppercase text-gray-400">GTD</div>
          </div>
        )}

        <div className={`mt-3 w-full flex justify-center`}>
          {isAdmin ? (
            <div className="flex items-center gap-1 justify-center">
              <input
                type="text"
                value={month.qualifiers}
                onChange={(e) => onUpdateMonth(index, 'qualifiers', e.target.value)}
                className="w-10 text-center bg-black/50 border border-white/20 rounded text-xs text-white"
              />
              <span className="text-[10px] text-gray-400">Vagas</span>
            </div>
          ) : (
            <div className={`text-xs py-1 px-2 rounded-full font-bold ${isActive ? 'bg-primary text-white' :
              isCompleted ? 'bg-secondary/20 text-secondary' :
                'bg-black/30 text-gray-500'
              }`}>
              {month.qualifiers} {typeof month.qualifiers === 'number' || !isNaN(Number(month.qualifiers)) ? 'Vagas' : ''}
            </div>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => onToggleStatus(index)}
            className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center border z-20 ${isActive ? 'bg-green-500 border-green-300' :
              isCompleted ? 'bg-blue-500 border-blue-300' : 'bg-red-500 border-red-300'
              }`}
            title="Mudar Status"
          >
            <span className="material-icons-outlined text-xs text-white">
              change_circle
            </span>
          </button>
        )}
      </div>
    );
  };

  // Determine current active/target month index
  let currentMonthIndex = months.findIndex(m => m.status === 'active');
  if (currentMonthIndex === -1) currentMonthIndex = months.findIndex(m => m.status === 'locked'); // If none active, show first locked (next)
  if (currentMonthIndex === -1) currentMonthIndex = months.length - 1; // If all completed, show last

  return (
    <div className="relative pt-20 pb-0 lg:pt-28 lg:pb-0 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

        {/* Main Text */}
        <div className="mb-16">
          <h1 className="text-6xl lg:text-8xl font-display font-black text-gray-900 dark:text-white mb-6 leading-tight">
            <EditableContent
              isAdmin={isAdmin}
              value={content.title_line1}
              onSave={(val) => onUpdateContent('title_line1', val)}
            /> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-500 to-secondary text-glow">
              {prizeLabel}
            </span>
          </h1>
          <p className="mt-4 text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            <EditableContent
              isAdmin={isAdmin}
              value={content.subtitle}
              onSave={(val) => onUpdateContent('subtitle', val)}
              type="textarea"
            />
          </p>
        </div>

        {/* Timeline Section */}
        {showTimeline && (
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <EditableContent
                  isAdmin={isAdmin}
                  value={content.timeline_title}
                  onSave={(val) => onUpdateContent('timeline_title', val)}
                  className="text-secondary"
                /> <span>{prizeLabel}</span>
              </h3>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase">Temporada 2026</span>
                {isAdmin && <span className="text-xs text-green-500 font-bold uppercase animate-pulse">Modo Edição Ativo</span>}
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

        {/* CTAs Removidos daqui - agora em sessão dedicada no App.tsx */}

      </div>
    </div>
  );
};