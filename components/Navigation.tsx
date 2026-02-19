import React, { useState, useEffect } from 'react';
import { NavLink, Message } from '../types';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  prizeLabel: string;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  messages?: Message[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onReply?: (id: string, text: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
    currentView, 
    onNavigate, 
    prizeLabel, 
    isLoggedIn, 
    onLogout,
    messages = [],
    unreadCount = 0,
    onMarkAsRead,
    onReply
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  
  // States for viewing/replying message
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  const links: NavLink[] = [
    { label: 'Início', view: 'home' },
    { label: `The Chosen ${prizeLabel}`, view: 'the-chosen-details' },
    { label: 'Calendário', view: 'calendar' },
    { label: 'Rankings', view: 'ranking' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenMessage = (msg: Message) => {
      setSelectedMessage(msg);
      if (onMarkAsRead) {
          onMarkAsRead(msg.id);
      }
      setMessagesOpen(false); // Fecha o dropdown
  };

  const handleSendReply = () => {
      if (onReply && selectedMessage && replyText.trim()) {
          onReply(selectedMessage.id, replyText);
          setReplyText('');
          setSelectedMessage(null); // Fecha o modal
      }
  };

  return (
    <>
    <nav className={`fixed w-full z-50 top-0 left-0 transition-all duration-300 ${scrolled ? 'bg-background-dark/95 border-b border-white/5 backdrop-blur-md shadow-lg' : 'bg-background-dark/50 border-transparent backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Fix: Replaced broken image with Text/Icon Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('home')}>
             <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white shadow-neon-pink group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons-outlined text-2xl">token</span>
             </div>
             <span className="text-2xl font-display font-black text-white tracking-tighter">
                CHIP<span className="text-primary">RACE</span>
             </span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-baseline space-x-8">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => onNavigate(link.view)}
                  className={`px-3 py-2 rounded-md text-lg font-medium transition-colors relative group ${
                    currentView === link.view 
                      ? 'text-primary' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${currentView === link.view ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
            </div>
            
            {/* VIP Button */}
            <button 
                onClick={() => onNavigate('vip')}
                className="flex items-center gap-2 text-yellow-400 border border-yellow-400/50 px-4 py-1.5 rounded-full hover:bg-yellow-400 hover:text-black transition-all shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            >
                <span className="material-icons-outlined text-sm">diamond</span>
                <span className="text-sm font-bold uppercase tracking-wide">Seja VIP</span>
            </button>
          </div>

          <div className="hidden md:block ml-4">
            {isLoggedIn ? (
                <div className="flex items-center gap-4">
                    
                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => setMessagesOpen(!messagesOpen)}
                            className="text-gray-300 hover:text-white transition-colors p-2 relative"
                        >
                            <span className="material-icons-outlined">notifications</span>
                            {unreadCount > 0 && (
                                <>
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse z-10">
                                        {unreadCount}
                                    </span>
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></span>
                                </>
                            )}
                        </button>

                        {/* Message Dropdown */}
                        {messagesOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
                                <div className="p-3 border-b border-white/10 bg-black/20 flex justify-between items-center">
                                    <span className="text-base font-bold text-white">Notificações</span>
                                    <button onClick={() => setMessagesOpen(false)} className="text-sm text-gray-500 hover:text-white">Fechar</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {messages.length === 0 ? (
                                        <div className="p-6 text-center text-base text-gray-500">
                                            Nenhuma notificação.
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div 
                                                key={msg.id} 
                                                className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!msg.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                                                onClick={() => handleOpenMessage(msg)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-secondary">{msg.from}</span>
                                                    <span className="text-xs text-gray-500">{msg.date}</span>
                                                </div>
                                                <div className="text-base font-bold text-white mb-1">{msg.subject}</div>
                                                <p className="text-sm text-gray-400 line-clamp-2">{msg.content}</p>
                                                <div className="mt-2 text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                                                    Clique para ler e responder
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent p-[2px] hover:shadow-neon-pink transition-all duration-300"
                        title="Meu Perfil"
                    >
                        <div className="w-full h-full rounded-full bg-background-dark flex items-center justify-center overflow-hidden">
                             <span className="material-icons-outlined text-white">person</span>
                        </div>
                    </button>
                    <button 
                        onClick={onLogout}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Sair"
                    >
                        <span className="material-icons-outlined">logout</span>
                    </button>
                </div>
            ) : (
                <button
                onClick={() => onNavigate('login')}
                className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-bold py-2 px-6 rounded-full shadow-neon-pink transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(217,0,255,0.6)] flex items-center gap-2"
                >
                <span className="material-icons-outlined text-base">person</span>
                <span className="text-base tracking-wide">LOGIN</span>
                </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              <span className="material-icons-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background-dark/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  onNavigate(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-4 text-lg font-medium border-b border-white/5 ${
                  currentView === link.view 
                    ? 'text-primary bg-white/5' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            
            <button
                onClick={() => {
                    onNavigate('vip');
                    setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-4 text-lg font-bold text-yellow-400 hover:text-yellow-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"
            >
                <span className="material-icons-outlined">diamond</span> SEJA VIP
            </button>

            {isLoggedIn ? (
                <>
                    <button
                        onClick={() => {
                            setMessagesOpen(!messagesOpen);
                        }}
                        className="block w-full text-left px-3 py-4 text-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 border-b border-white/5 flex items-center gap-2"
                    >
                         <span className="material-icons-outlined">notifications</span> Notificações ({unreadCount})
                    </button>
                    <button
                        onClick={() => {
                            onNavigate('profile');
                            setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-4 text-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 border-b border-white/5 flex items-center gap-2"
                    >
                        <span className="material-icons-outlined">person</span> Meu Perfil
                    </button>
                    <button
                        onClick={() => {
                            if (onLogout) onLogout();
                            setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-4 text-lg font-medium text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-2"
                    >
                        <span className="material-icons-outlined">logout</span> Sair
                    </button>
                </>
            ) : (
                <button
                    onClick={() => {
                        onNavigate('login');
                        setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-4 text-lg font-medium text-primary font-bold"
                >
                    LOGIN / REGISTRAR
                </button>
            )}
          </div>
        </div>
      )}
    </nav>
    
    {/* MESSAGE DETAIL MODAL */}
    {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
             <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative animate-float flex flex-col max-h-[90vh]">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                          <div>
                              <h3 className="text-xl font-bold text-white mb-1">{selectedMessage.subject}</h3>
                              <p className="text-sm text-gray-400 flex items-center gap-2">
                                  <span className="material-icons-outlined text-sm">person</span>
                                  {selectedMessage.from}
                                  <span className="mx-1">•</span>
                                  {selectedMessage.date}
                              </p>
                          </div>
                          <button 
                             onClick={() => setSelectedMessage(null)}
                             className="text-gray-400 hover:text-white transition-colors"
                          >
                              <span className="material-icons-outlined">close</span>
                          </button>
                      </div>

                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                          {selectedMessage.content}
                      </div>

                      <div className="mt-4">
                          <label className="block text-xs font-bold text-primary uppercase mb-2">Sua Resposta</label>
                          <div className="relative">
                              <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-secondary outline-none resize-none"
                                  placeholder="Escreva sua resposta..."
                              ></textarea>
                              <button 
                                  onClick={handleSendReply}
                                  disabled={!replyText.trim()}
                                  className="absolute bottom-2 right-2 bg-secondary text-black p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                  title="Enviar Resposta"
                              >
                                  <span className="material-icons-outlined text-sm font-bold">send</span>
                              </button>
                          </div>
                      </div>
                  </div>
             </div>
        </div>
    )}
    </>
  );
};