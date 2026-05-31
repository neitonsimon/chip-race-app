import React from 'react';
import { PlayerStats, MessageCategory } from '../types';

interface VipPageProps {
  onNavigate: (view: string) => void;
  currentUser?: Partial<PlayerStats>;
  onUpdateProfile?: (targetId: string, updatedData: PlayerStats) => void;
  onSendAdminMessage?: (subject: string, content: string, category: MessageCategory, pollId?: string, targetUserId?: string) => void;
}

export const VipPage: React.FC<VipPageProps> = ({
  onNavigate,
  currentUser,
  onUpdateProfile,
  onSendAdminMessage
}) => {
  // Silent references to avoid typescript unused parameters warnings
  if (false) {
    console.log(currentUser, onUpdateProfile, onSendAdminMessage);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden px-4 py-16">
      {/* Background Glows matching Chip Race layout */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Glassmorphic Container */}
      <div className="relative max-w-lg w-full bg-surface-dark/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center shadow-[0_0_50px_rgba(0,224,255,0.05)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,224,255,0.12)]">
        {/* Glow behind the icon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Icon Container with glowing aura */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-primary/10 to-secondary/10 border border-primary/30 mb-8 shadow-neon-blue animate-pulse">
          <span className="material-icons-outlined text-5xl text-primary">workspace_premium</span>
        </div>

        {/* Heading in display font */}
        <h1 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-wider mb-6 leading-tight">
          Página indisponível <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">por enquanto</span>
        </h1>

        {/* Subtitle in body font */}
        <p className="text-gray-400 font-body font-light mb-10 text-xl leading-relaxed">
          Em breve novidades sobre planos VIP
        </p>

        {/* Back Button matching premium styling */}
        <button
          onClick={() => onNavigate('home')}
          className="w-full py-4 rounded-2xl font-display font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent text-background-dark shadow-[0_4px_20px_rgba(0,224,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,224,255,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Voltar ao Lobby
        </button>
      </div>
    </div>
  );
};