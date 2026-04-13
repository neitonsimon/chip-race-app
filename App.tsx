import React from 'react';
import { useApp } from './contexts/AppContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { SupportModal } from './components/SupportModal';
import { AppRouter } from './components/AppRouter';
import { ScrollToTop } from './components/ScrollToTop';
import { supabase } from './src/lib/supabase';

export default function App() {
    const {
        currentView, handleNavigate, prizeLabel, isLoggedIn, isAdmin,
        messages, unreadCount, handleMarkAsRead, handleReplyMessage,
        currentUser, newNotification, setNewNotification, isFlyerOpen
    } = useApp();

    const lastTrackedView = React.useRef<string | null>(null);

    const [isSupportOpen, setIsSupportOpen] = React.useState(false);

    const showFooter = ['home', 'the-chosen-details', 'calendar', 'ranking', 'vip', 'recharge', 'the-chosen-regulations', 'terms', 'privacy', 'rules', 'responsible-gaming'].includes(currentView);

    // OneSignal Push Notifications Setup
    React.useEffect(() => {
        const appId = "87ad3921-2743-4a35-8498-56b4aefd7b16"; // ID Real OneSignal Chip Race

        const initOneSignal = () => {
            if (typeof window !== 'undefined') {
                (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
                (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
                    await OneSignal.init({
                        appId: appId,
                        safari_web_id: "web.onesignal.auto.1764121d-9371-4648-9a4f-cc76fa51319c", // Exemplo
                        notifyButton: {
                            enable: true,
                            position: 'bottom-left',
                            size: 'medium',
                            theme: 'dark',
                            colors: {
                                'circle.background': '#00E0FF',
                                'circle.foreground': 'white',
                                'badge.background': '#00E0FF',
                                'badge.foreground': 'white',
                                'badge.bordercolor': 'white',
                                'pulse.color': 'white',
                                'dialog.button.background.hover': '#00A2FF',
                                'dialog.button.background.active': '#00A2FF',
                                'dialog.button.background': '#00E0FF',
                                'dialog.button.foreground': 'white'
                            },
                            text: {
                                'tip.state.unsubscribed': 'Receber notificações',
                                'tip.state.subscribed': "Você está inscrito",
                                'tip.state.blocked': "Você bloqueou as notificações",
                                'message.prenotify': 'Receba avisos da Chip Race!',
                                'message.action.subscribed': "Obrigado por se inscrever!",
                                'message.action.resubscribed': "Você está inscrito novamente!",
                                'message.action.unsubscribed': "Você não receberá mais notificações",
                                'dialog.main.title': 'Gerenciar Notificações',
                                'dialog.main.button.subscribe': 'INSCREVER',
                                'dialog.main.button.unsubscribe': 'DESCADASTRAR',
                                'dialog.blocked.title': 'Desbloquear Notificações',
                                'dialog.blocked.message': "Siga estas instruções para permitir notificações:"
                            }
                        },
                        allowLocalhostAsSecureOrigin: true,
                    });
                });
            }
        };

        initOneSignal();
    }, []);

    // Link User to OneSignal for targeted push notifications
    React.useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).OneSignal) {
            if (isLoggedIn && currentUser?.id) {
                (window as any).OneSignal.push(() => {
                    (window as any).OneSignal.login(currentUser.id);
                });
            } else {
                (window as any).OneSignal.push(() => {
                    (window as any).OneSignal.logout();
                });
            }
        }
    }, [isLoggedIn, currentUser?.id]);

    // Track Page Views and Setup Global Events
    React.useEffect(() => {
        const handleOpenSupport = () => {
            if (isLoggedIn) setIsSupportOpen(true);
            else handleNavigate('login');
        };
        window.addEventListener('open-support-modal', handleOpenSupport);

        // Bloqueia se a página não mudou
        if (!currentView || lastTrackedView.current === currentView) return () => window.removeEventListener('open-support-modal', handleOpenSupport);

        const trackView = async () => {
            try {
                lastTrackedView.current = currentView; // Trava imediata
                await supabase.rpc('increment_page_view', { p_view_name: currentView });
            } catch (e) {
                console.log("Analytics increment failed", e);
            }
        };
        trackView();

        return () => window.removeEventListener('open-support-modal', handleOpenSupport);
    }, [currentView, currentUser?.id, isLoggedIn, handleNavigate]);

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark relative">
            <Navigation
                currentView={currentView}
                onNavigate={handleNavigate}
                prizeLabel={prizeLabel}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    handleNavigate('home');
                }}
                messages={messages}
                unreadCount={unreadCount}
                onMarkAsRead={handleMarkAsRead}
                onReply={handleReplyMessage}
                balanceBrl={currentUser.balanceBrl || 0}
                balanceChipz={currentUser.balanceChipz || 0}
                totalPendingDebt={currentUser.totalPendingDebt || 0}
                currentUserRole={currentUser?.role}
            />

            <AppRouter />

            {showFooter && (
                <Footer
                    onNavigate={handleNavigate}
                    isAdmin={isAdmin}
                    onOpenSupport={() => {
                        if (isLoggedIn) setIsSupportOpen(true);
                        else handleNavigate('login');
                    }}
                />
            )}

            <SupportModal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                currentUser={currentUser}
            />

            <ScrollToTop />

            {/* Indicador de Usuário Logado - Fixo no canto inferior direito */}
            {isLoggedIn && currentUser.name && !isFlyerOpen && (
                <div
                    onClick={() => handleNavigate('profile')}
                    className="fixed bottom-20 sm:bottom-4 right-4 z-50 bg-surface-dark/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 cursor-pointer hover:border-primary/50 hover:bg-surface-dark transition-all group"
                    title="Ver meu perfil"
                >
                    <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-red-500' : currentUser.role === 'staff' ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></div>
                    <span className="text-sm text-gray-300">Olá, <span className="font-bold text-white group-hover:text-primary transition-colors">{currentUser.name}</span> {isAdmin ? <span className="text-[10px] text-red-400 bg-red-900/30 px-1 rounded ml-1 border border-red-500/30">ADMIN</span> : currentUser.role === 'staff' ? <span className="text-[10px] text-blue-400 bg-blue-900/30 px-1 rounded ml-1 border border-blue-500/30">STAFF</span> : null}</span>
                    <span className="material-icons-outlined text-sm text-gray-600 group-hover:text-primary transition-colors">chevron_right</span>
                </div>
            )}

            {/* UI: Notification Toast (Real-time) */}
            {newNotification && (
                <div
                    onClick={() => {
                        handleNavigate('profile');
                        setNewNotification(null);
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent(`open-${newNotification.category}-messages`));
                        }, 100);
                    }}
                    className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-[300] bg-surface-dark border border-primary/30 rounded-2xl p-4 shadow-2xl cursor-pointer hover:border-primary transition-all animate-in slide-in-from-right-full"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-icons-outlined text-primary text-2xl">notifications_active</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-0.5">Nova Mensagem</div>
                            <h4 className="text-white font-bold truncate">{newNotification.subject}</h4>
                            <p className="text-gray-400 text-xs truncate">{newNotification.from}: {newNotification.content}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setNewNotification(null); }}
                            className="text-gray-500 hover:text-white"
                        >
                            <span className="material-icons-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}