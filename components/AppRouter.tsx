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
import { SpecialEventPage } from './SpecialEventPage';

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
        // Handle dynamic event pages
        if (currentView.startsWith('event-')) {
            const slug = currentView.replace('event-', '');
            const evt = (contentDB?.special_events || []).find(e => e.slug === slug);
            if (evt) return <SpecialEventPage event={evt} onNavigate={handleNavigate} />;
            // If it's the legacy fenachim view, it will fall through to the specific case if needed, 
            // but we usually want it to go through the dynamic system first.
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
                return isLoggedIn ? <EventRegistration isAdmin={isAdmin} /> : <Auth initialMode="signup" onLogin={handleLogin} onCancel={() => handleNavigate('home')} />;
            case 'login':
                return <Auth onLogin={handleLogin} onCancel={() => handleNavigate('home')} />;
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
            case 'fenachim':
                return <FenachimPage
                    isAdmin={isAdmin}
                    content={contentDB.fenachim}
                    onNavigate={handleNavigate}
                />;
            // Also handle event-fenachim if saved under that slug
            case 'event-fenachim': {
                const fenEvt = (contentDB?.special_events || []).find(e => e.slug === 'fenachim');
                if (fenEvt) return <SpecialEventPage event={fenEvt} onNavigate={handleNavigate} />;
                return <FenachimPage isAdmin={isAdmin} content={contentDB.fenachim} onNavigate={handleNavigate} />;
            }
            case 'the-chosen-regulations':
                return <TheChosenRegulations prizeLabel={prizeLabel} onBack={() => handleNavigate('the-chosen-details')} />;
            case 'vip':
                return <VipPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser as any}
                    onUpdateProfile={handleProfileUpdate}
                    onSendAdminMessage={handleSendAdminMessage}
                />;
            case 'recharge':
                return <RechargePage currentUser={currentUser as any} onNavigate={handleNavigate} onUpdateProfile={handleProfileUpdate} />;
            case 'financial':
                return <FinancialDashboard
                    currentUser={currentUser as any}
                    onClose={() => handleNavigate('home')}
                    isAdmin={isAdmin}
                />;
            case 'admin':
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
                            fenachimContent={contentDB.fenachim}
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
