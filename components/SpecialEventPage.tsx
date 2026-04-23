import React, { useState, useEffect } from 'react';
import { SpecialEvent, EventSection, EventNavButton } from '../types';

interface SpecialEventPageProps {
  event: SpecialEvent;
  onNavigate: (view: string) => void;
}

// ── Color resolver ──────────────────────────────────────────────────────────
const colorMap: Record<string, { text: string; bg: string; border: string; glow: string; gradient: string }> = {
  primary:   { text: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/40',   glow: 'shadow-neon-pink',  gradient: 'from-primary via-pink-400 to-primary' },
  secondary: { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/40', glow: 'shadow-neon-blue',  gradient: 'from-secondary via-blue-400 to-secondary' },
  green:     { text: 'text-green-400',  bg: 'bg-green-500/10', border: 'border-green-500/40', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]', gradient: 'from-green-400 via-emerald-300 to-green-500' },
  amber:     { text: 'text-amber-400',  bg: 'bg-amber-500/10', border: 'border-amber-500/40', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]', gradient: 'from-amber-400 via-yellow-300 to-amber-500' },
  red:       { text: 'text-red-400',    bg: 'bg-red-500/10',   border: 'border-red-500/40',   glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', gradient: 'from-red-400 via-rose-300 to-red-500' },
  cyan:      { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',  border: 'border-cyan-500/40',  glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]', gradient: 'from-cyan-400 via-sky-300 to-cyan-500' },
  purple:    { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', gradient: 'from-purple-400 via-violet-300 to-purple-500' },
};
const getColor = (color?: string) => colorMap[color || 'primary'] || colorMap['primary'];

// ── Countdown component ─────────────────────────────────────────────────────
const CountdownTimer: React.FC<{ targetDate: string; title?: string; color: string }> = ({ targetDate, title, color }) => {
  const c = getColor(color);
  const calc = () => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [targetDate]);
  const Box = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className={`text-3xl sm:text-5xl font-display font-black ${c.text} tabular-nums`}>{String(val).padStart(2, '0')}</div>
      <div className="text-[9px] uppercase font-black tracking-widest text-gray-600 mt-1">{label}</div>
    </div>
  );
  return (
    <div className={`text-center p-8 rounded-3xl bg-white/[0.03] border ${c.border}`}>
      {title && <p className={`text-xs uppercase font-black tracking-widest ${c.text} mb-6`}>{title}</p>}
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        <Box val={t.d} label="Dias" />
        <span className={`text-3xl font-black ${c.text} opacity-40 pb-4`}>:</span>
        <Box val={t.h} label="Horas" />
        <span className={`text-3xl font-black ${c.text} opacity-40 pb-4`}>:</span>
        <Box val={t.m} label="Min" />
        <span className={`text-3xl font-black ${c.text} opacity-40 pb-4`}>:</span>
        <Box val={t.s} label="Seg" />
      </div>
    </div>
  );
};

// ── Section renderers ───────────────────────────────────────────────────────
const SectionRenderer: React.FC<{ section: EventSection; themeColor: string; onNavigate: (v: string) => void }> = ({ section, themeColor, onNavigate }) => {
  const c = getColor(section.data.block_color || themeColor);

  switch (section.type) {
    case 'header': {
      const hc = getColor(themeColor);
      return (
        <div className="relative py-20 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
          {section.data.background_image && (
            <img
              src={section.data.background_image}
              alt={section.data.title || ''}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background-dark/80 to-background-dark" />
          <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
            <h1 className={`text-5xl sm:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r ${hc.gradient} mb-4`}>
              {section.data.title}
            </h1>
            {section.data.subtitle && (
              <p className="text-lg sm:text-2xl text-gray-300 font-light">{section.data.subtitle}</p>
            )}
          </div>
        </div>
      );
    }

    case 'info_block':
      return (
        <div className={`p-6 sm:p-10 rounded-3xl border-l-4 ${c.border} bg-white/[0.03] border border-white/5 relative overflow-hidden group mb-8`}>
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${c.bg} to-transparent`} />
          {section.data.block_title && (
            <h2 className={`text-xl font-display font-black ${c.text} mb-4 flex items-center gap-2`}>
              <span className="material-icons-outlined text-xl">info</span>
              {section.data.block_title}
            </h2>
          )}
          {section.data.block_text && (
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{section.data.block_text}</p>
          )}
        </div>
      );

    case 'tournament_cards':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {(section.data.cards || []).map((card, i) => {
            const cc = getColor(card.color);
            return (
              <div key={i} className={`bg-[#0f0a20] border border-white/10 p-8 rounded-[2rem] hover:${cc.border} transition-all duration-500 group overflow-hidden shadow-2xl flex flex-col text-center items-center`}>
                <div className={`w-16 h-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-5 group-hover:${cc.border} transition-colors`}>
                  <span className={`material-icons-outlined text-3xl text-gray-400 group-hover:${cc.text} transition-colors`}>{card.icon || 'sports_esports'}</span>
                </div>
                <h3 className="text-xl font-display font-black text-white mb-1 uppercase tracking-widest">{card.name}</h3>
                <div className={`h-0.5 w-8 ${cc.bg.replace('/10', '')} rounded-full mb-4`} />
                <p className="text-gray-400 flex-1 text-sm leading-relaxed">{card.description}</p>
                {card.dates && (
                  <div className="mt-6 bg-white/5 px-5 py-2.5 rounded-xl border border-white/5 w-full">
                    <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest block mb-0.5">Datas</span>
                    <span className={`font-black text-base ${cc.text}`}>{card.dates}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

    case 'countdown':
      return (
        <div className="mb-8">
          {section.data.target_date && (
            <CountdownTimer
              targetDate={section.data.target_date}
              title={section.data.countdown_title}
              color={themeColor}
            />
          )}
        </div>
      );

    case 'schedule':
      return (
        <div className={`bg-white/[0.03] border border-white/5 rounded-3xl p-6 mb-8`}>
          <h3 className={`text-sm font-black uppercase tracking-widest ${c.text} mb-4 flex items-center gap-2`}>
            <span className="material-icons-outlined text-base">calendar_today</span>
            Programação
          </h3>
          <div className="space-y-3">
            {(section.data.items || []).map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                <div className={`shrink-0 text-center ${c.text}`}>
                  <div className="text-xs font-black uppercase">{item.date}</div>
                  {item.time && <div className="text-[10px] text-gray-500">{item.time}</div>}
                </div>
                <div className="h-full w-px bg-white/10 self-stretch" />
                <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'prize_table':
      return (
        <div className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${c.bg} border-b ${c.border}`}>
                <th className={`text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest ${c.text}`}>Posição</th>
                <th className={`text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest ${c.text}`}>Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {(section.data.prizes || []).map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-6 text-gray-300 font-bold">{row.position}</td>
                  <td className={`py-3 px-6 text-right font-black ${c.text}`}>{row.prize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'cta_button': {
      const bc = getColor(section.data.btn_color || themeColor);
      return (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              if (section.data.btn_action_type === 'url' && section.data.btn_action) {
                window.open(section.data.btn_action, '_blank');
              } else if (section.data.btn_action) {
                onNavigate(section.data.btn_action);
              }
            }}
            className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-display font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105 ${bc.bg} ${bc.border} border ${bc.glow}`}
          >
            {section.data.btn_icon && <span className="material-icons-outlined text-lg">{section.data.btn_icon}</span>}
            {section.data.btn_text || 'Saiba Mais'}
          </button>
        </div>
      );
    }

    case 'rich_text':
      return (
        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{section.data.text}</p>
        </div>
      );

    case 'image_banner':
      return section.data.image_url ? (
        <div className="rounded-3xl overflow-hidden mb-8 shadow-2xl">
          <img
            src={section.data.image_url}
            alt={section.data.image_alt || ''}
            className="w-full object-cover max-h-[400px]"
          />
        </div>
      ) : null;

    case 'nav_buttons': {
      const buttons: EventNavButton[] = section.data.nav_buttons || [];
      return (
        <div className="mb-8">
          {section.data.nav_buttons_title && (
            <h3 className={`text-center text-xs uppercase font-black tracking-widest ${c.text} mb-5`}>
              {section.data.nav_buttons_title}
            </h3>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {buttons.map((btn, i) => {
              const bc = getColor(btn.color || themeColor);
              return (
                <button
                  key={i}
                  onClick={() => btn.is_external ? window.open(btn.view, '_blank') : onNavigate(btn.view)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border ${bc.border} ${bc.bg} ${bc.text} font-black text-xs uppercase tracking-wider hover:scale-105 transition-all`}
                >
                  {btn.icon && <span className="material-icons-outlined text-base">{btn.icon}</span>}
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};

// ── Main component ──────────────────────────────────────────────────────────
export const SpecialEventPage: React.FC<SpecialEventPageProps> = ({ event, onNavigate }) => {
  const c = getColor(event.theme_color);
  const activeSections = [...(event.sections || [])]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Does the event have a dedicated header section? If not, render a default one.
  const hasHeaderSection = activeSections.some(s => s.type === 'header');

  return (
    <div className="min-h-screen bg-background-dark text-gray-200 font-body">
      {/* Default header if none defined in sections */}
      {!hasHeaderSection && (
        <div className="relative py-28 overflow-hidden text-center">
          <div className={`absolute inset-0 bg-gradient-to-b from-black/50 to-background-dark`} />
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <span className={`material-icons-outlined text-5xl ${c.text} mb-4 block`}>{event.icon}</span>
            <h1 className={`text-6xl sm:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r ${c.gradient} mb-4`}>
              {event.title}
            </h1>
            <p className="text-xl text-gray-400">{event.subtitle}</p>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {activeSections.map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            themeColor={event.theme_color}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};
