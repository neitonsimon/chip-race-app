import React from 'react';
import appConfig from '../src/config/appConfig.json';

interface FooterProps {
  onNavigate: (view: string) => void;
  isAdmin: boolean;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, isAdmin, onOpenSupport }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    if (item.label === 'Suporte Online' && onOpenSupport) {
      onOpenSupport();
      return;
    }
    onNavigate(item.view);
  };

  return (
    <footer className="bg-[#050821] border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div className="space-y-6">
            <a href="#" onClick={(e) => handleLinkClick(e, { label: 'Home', view: 'home' })} className="flex items-center group">
              <img src="/cr-logo.png" alt="Chip Race" className="h-16 w-auto group-hover:scale-105 transition-transform duration-300" />
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {appConfig.footer.brand.description}
            </p>
            <div className="flex gap-4">
              {appConfig.footer.social.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-icons text-xl group-hover:scale-110 transition-transform">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="hidden sm:block">
            <h4 className="font-display font-bold text-white mb-6 uppercase tracking-[0.2em] text-xs">
              Menu Principal
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {appConfig.footer.menuPrincipal.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, item)}
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal/Support Column */}
          <div className="hidden lg:block">
            <h4 className="font-display font-bold text-white mb-6 uppercase tracking-[0.2em] text-xs">
              Informações
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {appConfig.footer.informacoes.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, item)}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Area Column (Exclusive) */}
          <div className={`p-6 rounded-2xl border transition-all duration-500 ${isAdmin
            ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
            : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
            }`}>
            <h4 className={`font-display font-black mb-4 uppercase tracking-[0.2em] text-xs flex items-center gap-2 ${isAdmin ? 'text-red-400' : 'text-gray-500'}`}>
              <span className="material-icons text-sm">{isAdmin ? 'admin_panel_settings' : 'lock'}</span>
              Área Administrativa
            </h4>

            {isAdmin ? (
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, { label: 'Admin', view: 'admin' })}
                    className="text-white hover:text-red-400 font-bold flex items-center gap-2 transition-colors uppercase text-[10px] tracking-widest"
                  >
                    <span className="material-icons text-xs">dashboard</span>
                    Painel Gestor
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, { label: 'Calendar', view: 'calendar' })}
                    className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-xs"
                  >
                    <span className="material-icons text-xs">event</span>
                    Gerenciar Eventos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => handleLinkClick(e, { label: 'Ranking', view: 'ranking' })}
                    className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-xs"
                  >
                    <span className="material-icons text-xs">emoji_events</span>
                    Ajustar Rankings
                  </a>
                </li>
                <li className="pt-2 border-t border-red-500/10">
                  <span className="text-[9px] text-red-500/50 uppercase font-bold">Acesso Restrito</span>
                </li>
              </ul>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  Acesso restrito para administradores e staff do Chip Race.
                </p>
                <button
                  onClick={(e) => handleLinkClick(e, { label: 'Login', view: 'login' })}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                >
                  Fazer Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] sm:text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8 mb-4 md:mb-0 text-center md:text-left">
            <p>© {currentYear} Chip Race Organization.</p>
            <p className="hidden sm:block text-gray-700">|</p>
            <p className="text-primary-light/50">Desenvolvido com Paixão pelo Poker</p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">V.2.0.25</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
            <a href="#" className="hover:text-white transition-colors">Network</a>
          </div>
        </div>
      </div>
    </footer>
  );
};