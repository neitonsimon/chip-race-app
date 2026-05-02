import React from 'react';
import { useApp } from '../contexts/AppContext';
import { SpecialEventPage } from './SpecialEventPage';
import { Hero } from './Hero';
import { TournamentCategories } from './TournamentCategories';
import { EventCalendar } from './EventCalendar';
import { RankingTable } from './RankingTable';
import { PlayerProfile } from './PlayerProfile';
import { EventRegistration } from './EventRegistration';
import { TheChosenDetails } from './TheChosenDetails';
import { TheChosenRegulations } from './TheChosenRegulations';
import { VipPage } from './VipPage';
import { Newsletter } from './Newsletter';
import { Auth } from './Auth';
import { RechargePage } from './RechargePage';
import { RoadmapSection } from './RoadmapSection';
import { FAQSection } from './FAQSection';
import { AdminPanel } from './AdminPanel';
import { FinancialDashboard } from './FinancialDashboard';
import { SponsorsSection } from './SponsorsSection';
import { TermsOfUse } from './TermsOfUse';
import { PrivacyPolicy } from './PrivacyPolicy';
import { ClubRules } from './ClubRules';
import { ResponsibleGaming } from './ResponsibleGaming';
import { OnlineCreditsPage } from './OnlineCreditsPage';
import { CategoryPage } from './CategoryPage';
import { DocumentLinks } from './DocumentLinks';
import { FenachimPage } from './FenachimPage';
import { BetPage } from './BetPage';

export const AppRouter: React.FC = () => {
    const {
        currentView, isAdmin, isLoggedIn, currentUser, events, rankings, contentDB,
        globalScoringSchemas, prizeLabel, totalQualifiers, customTotalQualifiers,
        nextGoal, months, messages, unreadCount, polls, pollVotesByCurrentUser,
        newNotification, selectedPlayer, setSelectedPlayer, isLoading,
        handleNavigate, handleLogin, handlePlayerSelect, handleProfileUpdate,
        handleSaveEvent, handleDeleteEventAcrossApp, handleEventClosure,
        handleUpdateRankingMeta, handleUpdateGlobalSchemas, handleAddRanking,
        handleDeleteRanking, handleAwardBadge,
        handleUpdateRankingPrize, handleUpdateTotalQualifiers, handleUpdateMonth,
        handleToggleMonthStatus, handleNavigateToPlayerByName, handleCreatePoll,
        handleVoteOnPoll, handleSendAdminMessage, handleSendMessage,
        handleReplyMessage, handleMarkAsRead, updateContent, updateCategory,
        badgeTemplates, experienceLevels, setEvents, setExperienceLevels,
        dailyRewards, setDailyRewards, getAllUniquePlayers, handleCreateBadgeTemplate, handleUpdateBadgeTemplate,
        handleDeleteMessage, userReservations, refreshSupabaseData
    } = useApp();

    const renderContent = () => {
        if (currentView.startsWith('event-')) {
            const slug = currentView.replace('event-', '');
            const evt = (contentDB?.special_events || []).find(e => e.slug === slug);
            if (evt) return <SpecialEventPage event={evt} onNavigate={handleNavigate} />;
        }

        if (currentView === 'bet') {
            return <BetPage isAdmin={isAdmin} onNavigate={handleNavigate} />;
        }

        if (currentView.startsWith('category-')) {
            const categoryId = currentView.replace('category-', '');
            const categoryInfo = contentDB?.categories?.find(c => c.id === categoryId);
            return <CategoryPage categoryId={categoryId} category={categoryInfo} onNavigate={handleNavigate} isAdmin={isAdmin} />;
        }

        switch (currentView) {
            case 'calendar':
                return <EventCalendar
                    isAdmin={isAdmin}
                    currentUser={currentUser as any}
                    events={events}
                    setEvents={setEvents}
                    onCloseEvent={handleEventClosure}
                    onSaveEvent={handleSaveEvent}
                    onDeleteEvent={handleDeleteEventAcrossApp}
                    rankingPlayers={getAllUniquePlayers()}
                    rankings={rankings}
                    scoringSchemas={globalScoringSchemas}
                    isLoading={isLoading}
                    onSelectPlayerByName={handleNavigateToPlayerByName}
                    userReservations={userReservations}
                    onRefreshData={refreshSupabaseData}
                />;
            case 'ranking':
                return <RankingTable
                    isAdmin={isAdmin}
                    onSelectPlayer={handlePlayerSelect}
                    rankings={rankings}
                    onUpdateRankingMeta={handleUpdateRankingMeta}
                    onUpdateGlobalSchemas={handleUpdateGlobalSchemas}
                    onAddRanking={handleAddRanking}
                    onDeleteRanking={handleDeleteRanking}
                    onUpdatePrize={handleUpdateRankingPrize}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    events={events}
                    globalScoringSchemas={globalScoringSchemas}
                    badgeTemplates={badgeTemplates}
                    isLoading={isLoading}
                />;
            case 'profile':
                // During initial data load, show a loading screen to avoid race conditions
                if (isLoading && !selectedPlayer) {
                    return (
                        <div className="min-h-screen bg-[#050310] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Carregando...</p>
                            </div>
                        </div>
                    );
                }
                // Only redirect to login if: data loaded + not logged in + no profile slug to show
                if (!isLoading && !isLoggedIn && !selectedPlayer) {
                    return <Auth onLogin={handleLogin} onCancel={() => handleNavigate('home')} onModeChange={(m) => handleNavigate(m === 'signup' ? 'register' : 'login')} />;
                }
                return <PlayerProfile
                    key={selectedPlayer ? selectedPlayer.name : 'current-user-profile'}
                    isAdmin={isAdmin}
                    isLoggedIn={isLoggedIn}
                    initialData={selectedPlayer || undefined}
                    onSendMessage={handleSendMessage}
                    onUpdateProfile={handleProfileUpdate}
                    currentUser={currentUser as any}
                    events={events}
                    experienceLevels={experienceLevels}
                    setExperienceLevels={setExperienceLevels}
                    dailyRewards={dailyRewards}
                    setDailyRewards={setDailyRewards}
                    messages={messages}
                    polls={polls}
                    userVotes={pollVotesByCurrentUser}
                    onVotePoll={handleVoteOnPoll}
                    onMarkAsRead={handleMarkAsRead}
                    onDeleteMessage={handleDeleteMessage}
                    onReply={handleReplyMessage}
                    rankings={rankings}
                    rankingPlayers={getAllUniquePlayers()}
                    isLoading={isLoading}
                />;
            case 'register':
                return isLoggedIn ? <EventRegistration isAdmin={isAdmin} /> : <Auth initialMode="signup" onLogin={handleLogin} onCancel={() => handleNavigate('home')} onModeChange={(m) => handleNavigate(m === 'signup' ? 'register' : 'login')} />;
            case 'login':
                return <Auth onLogin={handleLogin} onCancel={() => handleNavigate('home')} onModeChange={(m) => handleNavigate(m === 'signup' ? 'register' : 'login')} />;
            case 'the-chosen-details':
                return <TheChosenDetails
                    isAdmin={isAdmin}
                    prizeLabel={prizeLabel}
                    onNavigate={handleNavigate}
                    content={contentDB.details}
                    onUpdateContent={(field, val) => updateContent('details', field, val)}
                    categories={contentDB.categories}
                    onUpdateCategory={updateCategory}
                    onNavigatePlayer={handleNavigateToPlayerByName}
                    allPlayers={getAllUniquePlayers()}
                    months={months}
                    onUpdateMonth={handleUpdateMonth}
                    onToggleMonthStatus={handleToggleMonthStatus}
                    totalQualifiers={totalQualifiers}
                    nextGoal={nextGoal}
                    onUpdateTotal={handleUpdateTotalQualifiers}
                    isManualTotal={customTotalQualifiers !== null}
                    heroContent={contentDB.hero}
                    onUpdateHeroContent={(field, val) => updateContent('hero', field, val)}
                />;
            case 'the-chosen-regulations':
                return <TheChosenRegulations prizeLabel={prizeLabel} onBack={() => handleNavigate('the-chosen-details')} />;
            case 'fenachim':
                return <FenachimPage onNavigate={handleNavigate} />;
            case 'vip':
                return <VipPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser as any}
                    onUpdateProfile={handleProfileUpdate}
                    onSendAdminMessage={handleSendAdminMessage}
                />;
            case 'recarga':
                return <RechargePage currentUser={currentUser as any} onNavigate={handleNavigate} onUpdateProfile={handleProfileUpdate} />;
            case 'financial':
                if (!isAdmin && currentUser?.role !== 'staff') {
                    return (
                        <div className="py-32 text-center bg-background-light dark:bg-background-dark min-h-screen">
                            <span className="material-icons-outlined text-6xl text-red-500 mb-4 animate-pulse">gpp_bad</span>
                            <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Acesso Restrito</h2>
                            <p className="text-gray-400">Você não tem as permissões necessárias para visualizar os dados financeiros.</p>
                            <button onClick={() => handleNavigate('home')} className="mt-8 px-6 py-2 bg-primary text-white rounded-full font-bold uppercase hover:bg-secondary transition-colors">Voltar para a Home</button>
                        </div>
                    );
                }
                return <FinancialDashboard
                    currentUser={currentUser as any}
                    onClose={() => handleNavigate('home')}
                    isAdmin={isAdmin}
                />;
            case 'admin':
                if (!isAdmin && currentUser?.role !== 'staff') {
                    return (
                        <div className="py-32 text-center bg-background-light dark:bg-background-dark min-h-screen">
                            <span className="material-icons-outlined text-6xl text-red-500 mb-4 animate-pulse">lock</span>
                            <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Acesso Restrito</h2>
                            <p className="text-gray-400">Área exclusiva para administradores e staff do evento.</p>
                            <button onClick={() => handleNavigate('home')} className="mt-8 px-6 py-2 bg-primary text-white rounded-full font-bold uppercase hover:bg-secondary transition-colors">Voltar para a Home</button>
                        </div>
                    );
                }
                return <AdminPanel
                    currentUser={currentUser as any}
                    onClose={() => handleNavigate('home')}
                    isAdmin={isAdmin || currentUser?.role === 'staff'}
                    onUpdateProfile={handleProfileUpdate}
                    badgeTemplates={badgeTemplates}
                    onCreateBadgeTemplate={handleCreateBadgeTemplate}
                    onUpdateBadgeTemplate={handleUpdateBadgeTemplate}
                    onSendAdminMessage={handleSendAdminMessage}
                    onCreatePoll={handleCreatePoll}
                    onRefreshData={refreshSupabaseData}
                    onSelectPlayer={handlePlayerSelect}
                    onNavigate={handleNavigate}
                />;
            case 'online-credits':
                return <OnlineCreditsPage
                    currentUser={currentUser as any}
                    onNavigate={handleNavigate}
                    onUpdateProfile={handleProfileUpdate}
                />;
            case 'terms':
                return <TermsOfUse />;
            case 'privacy':
                return <PrivacyPolicy />;
            case 'rules':
                return <ClubRules />;
            case 'responsible-gaming':
                return <ResponsibleGaming />;
            case 'home':
            default:
                return (
                    <>
                        <Hero
                            isAdmin={isAdmin}
                            prizeLabel={prizeLabel}
                            months={months}
                            onUpdateMonth={handleUpdateMonth}
                            onToggleStatus={handleToggleMonthStatus}
                            onNavigate={handleNavigate}
                            content={contentDB.hero}
                            specialEvents={contentDB.special_events || []}
                            onUpdateContent={(field, val) => updateContent('hero', field, val)}
                            showTimeline={false}
                        />

                        <TournamentCategories
                            isAdmin={isAdmin}
                            categories={contentDB.categories}
                            onUpdateCategory={updateCategory}
                            prizeLabel={prizeLabel}
                            onNavigate={handleNavigate}
                        />
                        <RoadmapSection />
                        <SponsorsSection />
                        <Newsletter onNavigate={handleNavigate} />
                        <FAQSection
                            isAdmin={isAdmin}
                            faqs={contentDB.faq}
                            onUpdateFaqs={(val) => updateContent('faq', '', val)}
                        />
                        <DocumentLinks />
                    </>
                );
        }
    };

    return (
        <main className={`flex-grow pb-20 transition-all duration-300 ${(!isLoggedIn && currentView !== 'login' && currentView !== 'register') ? 'pt-40 md:pt-20' : 'pt-20'}`}>
            {renderContent()}
        </main>
    );
};
