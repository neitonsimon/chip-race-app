import React from 'react';
import { useApp } from '../contexts/AppContext';
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
import { CompanyHistory } from './CompanyHistory';
import { FAQSection } from './FAQSection';
import { AdminPanel } from './AdminPanel';
import { SponsorsSection } from './SponsorsSection';
import { TermsOfUse } from './TermsOfUse';
import { PrivacyPolicy } from './PrivacyPolicy';
import { ClubRules } from './ClubRules';
import { ResponsibleGaming } from './ResponsibleGaming';

export const AppRouter: React.FC = () => {
    const {
        currentView, isAdmin, isLoggedIn, currentUser, events, rankings, contentDB,
        globalScoringSchemas, prizeLabel, totalQualifiers, customTotalQualifiers,
        nextGoal, months, messages, unreadCount, polls, pollVotesByCurrentUser,
        newNotification, selectedPlayer, setSelectedPlayer, isLoading,
        handleNavigate, handleLogin, handlePlayerSelect, handleProfileUpdate,
        handleSaveEvent, handleDeleteEventAcrossApp, handleEventClosure,
        handleUpdateRankingMeta, handleUpdateGlobalSchemas, handleAddRanking,
        handleDeleteRanking, handleAwardBadge, handleFinalizeRanking,
        handleUpdateRankingPrize, handleUpdateTotalQualifiers, handleUpdateMonth,
        handleToggleMonthStatus, handleNavigateToPlayerByName, handleCreatePoll,
        handleVoteOnPoll, handleSendAdminMessage, handleSendMessage,
        handleReplyMessage, handleMarkAsRead, updateContent, updateCategory,
        badgeTemplates, experienceLevels, setEvents, setExperienceLevels,
        dailyRewards, setDailyRewards, getAllUniquePlayers, handleCreateBadgeTemplate
    } = useApp();

    const renderContent = () => {
        switch (currentView) {
            case 'calendar':
                return <EventCalendar
                    isAdmin={isAdmin}
                    events={events}
                    setEvents={setEvents}
                    onCloseEvent={handleEventClosure}
                    onSaveEvent={handleSaveEvent}
                    onDeleteEvent={handleDeleteEventAcrossApp}
                    rankingPlayers={getAllUniquePlayers()}
                    rankings={rankings}
                    scoringSchemas={globalScoringSchemas}
                    isLoading={isLoading}
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
                    onFinalizeRanking={handleFinalizeRanking}
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
                    onReply={handleReplyMessage}
                    rankings={rankings}
                    rankingPlayers={getAllUniquePlayers()}
                    isLoading={isLoading}
                />;
            case 'register':
                return isLoggedIn ? <EventRegistration isAdmin={isAdmin} /> : <Auth onLogin={handleLogin} onCancel={() => handleNavigate('home')} />;
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
            case 'admin':
                return <AdminPanel
                    currentUser={currentUser as any}
                    onClose={() => handleNavigate('home')}
                    isAdmin={isAdmin}
                    onUpdateProfile={handleProfileUpdate}
                    badgeTemplates={badgeTemplates}
                    onCreateBadgeTemplate={handleCreateBadgeTemplate}
                    onSendAdminMessage={handleSendAdminMessage}
                    onCreatePoll={handleCreatePoll}
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
                            onUpdateContent={(field, val) => updateContent('hero', field, val)}
                            showTimeline={false}
                        />

                        <TournamentCategories
                            isAdmin={isAdmin}
                            categories={contentDB.categories}
                            onUpdateCategory={updateCategory}
                            prizeLabel={prizeLabel}
                        />
                        <CompanyHistory
                            isAdmin={isAdmin}
                            timeline={contentDB.timeline}
                            onUpdateTimeline={(val) => updateContent('timeline', '', val)}
                        />
                        <SponsorsSection />
                        <Newsletter onNavigate={handleNavigate} />
                        <FAQSection
                            isAdmin={isAdmin}
                            faqs={contentDB.faq}
                            onUpdateFaqs={(val) => updateContent('faq', '', val)}
                        />
                    </>
                );
        }
    };

    return (
        <main className="flex-grow pt-20 pb-20">
            {renderContent()}
        </main>
    );
};
