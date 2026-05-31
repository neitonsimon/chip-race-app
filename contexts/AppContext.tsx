import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { useMessages } from './hooks/useMessages';
import {
    RankingPlayer, MonthData, Message, ContentDB, TournamentCategory,
    Event, PlayerResult, PlayerStats, RankingInstance, ScoringSchema,
    ExperienceLevel, DailyReward, Poll, MessageCategory, BadgeTemplate, SystemMessageTemplate
} from '../types';
import { calculatePoints } from '../utils/scoring';
import { createProfileSlug } from '../src/lib/slugUtils';
import appConfig from '../src/config/appConfig.json';

interface AppContextType {
    currentView: string;
    setCurrentView: (view: string) => void;
    isAdmin: boolean;
    isStaff: boolean;
    isLoggedIn: boolean;
    currentUserId: string | null;
    currentUser: Partial<PlayerStats>;
    events: Event[];
    isLoading: boolean;
    rankings: RankingInstance[];
    contentDB: ContentDB;
    globalScoringSchemas: ScoringSchema[];
    allProfiles: RankingPlayer[];
    experienceLevels: ExperienceLevel[];
    dailyRewards: DailyReward[];
    badgeTemplates: BadgeTemplate[];
    systemMessageTemplates: SystemMessageTemplate[];
    prizeLabel: string;
    totalQualifiers: number;
    customTotalQualifiers: number | null;
    vipPlans: any[];
    nextGoal: { prize: number; qualifiers: number };
    messages: Message[];
    unreadCount: number;
    polls: Poll[];
    pollVotesByCurrentUser: Record<string, number>;
    newNotification: Message | null;
    selectedPlayer: RankingPlayer | null;
    setSelectedPlayer: (player: RankingPlayer | null) => void;
    months: MonthData[];
    userReservations: string[];

    // Handlers
    handleNavigate: (view: string) => void;
    handleLogin: () => void;
    handleLogout: () => Promise<void>;
    handlePlayerSelect: (player: RankingPlayer) => void;
    handleProfileUpdate: (targetId: string, updatedData: PlayerStats) => Promise<void>;
    handleSaveEvent: (event: Event) => Promise<void>;
    handleDeleteEventAcrossApp: (eventId: string) => Promise<void>;
    handleEventClosure: (eventId: string, results: PlayerResult[], stats: { totalRebuys: number, totalAddons: number, totalPrize: number }) => Promise<void>;
    handleUpdateRankingMeta: (rankingId: string, updates: Partial<RankingInstance>) => Promise<void>;
    handleUpdateGlobalSchemas: (schemas: ScoringSchema[]) => Promise<void>;
    handleUpdateSystemMessageTemplate: (template: SystemMessageTemplate) => Promise<void>;
    handleCreateSystemMessageTemplate: (template: Partial<SystemMessageTemplate>) => Promise<void>;
    handleAddRanking: () => Promise<void>;
    handleDeleteRanking: (id: string) => Promise<void>;
    handleAwardBadge: (badge: { user_id: string; title: string; description: string; icon: string; ranking_id: string }) => Promise<void>;
    handleUpdateRankingPrize: (rankingId: string, rank: number, newPrize: string) => void;
    handleUpdateTotalQualifiers: (value: number | null) => Promise<void>;
    handleUpdateMonth: (index: number, field: keyof MonthData, value: any) => Promise<void>;
    handleToggleMonthStatus: (index: number) => void;
    handleNavigateToPlayerByName: (name: string) => void;
    handleCreatePoll: (question: string, options: string[]) => Promise<void>;
    handleVoteOnPoll: (pollId: string, optionIndex: number) => Promise<void>;
    handleSendAdminMessage: (subject: string, content: string, category?: MessageCategory, pollId?: string, targetUserId?: string) => Promise<void>;
    handleSendMessage: (toPlayerName: string, content: string) => Promise<void>;
    handleReplyMessage: (messageId: string, replyText: string) => void;
    handleMarkAsRead: (id: string) => Promise<void>;
    handleDeleteMessage: (id: string) => Promise<void>;
    handleCreateBadgeTemplate: (badge: Partial<BadgeTemplate>) => Promise<void>;
    handleUpdateBadgeTemplate: (id: string, badge: Partial<BadgeTemplate>) => Promise<void>;
    badgeDistribution: Record<string, number>;
    updateContent: (section: keyof ContentDB, field: string, value: any) => Promise<void>;
    updateCategory: (index: number, updates: Partial<TournamentCategory>) => Promise<void>;
    addCategory?: (category: TournamentCategory) => Promise<void>;
    deleteCategory?: (id: string) => Promise<void>;
    setNewNotification: (msg: Message | null) => void;
    getAllUniquePlayers: () => RankingPlayer[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    setExperienceLevels: React.Dispatch<React.SetStateAction<ExperienceLevel[]>>;
    setDailyRewards: React.Dispatch<React.SetStateAction<DailyReward[]>>;
    refreshSupabaseData: () => Promise<void>;
    isFlyerOpen: boolean;
    setIsFlyerOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

// INITIAL DEFAULTS
const INITIAL_DB: ContentDB = appConfig.initialDefaults.contentDB as ContentDB;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentView, setCurrentView] = useState(() => {
        const path = window.location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/perfil/')) return 'profile';
        if (path.startsWith('/ranking/')) return 'ranking';
        if (path === '/perfil') return 'profile';
        if (path === '/calendario') return 'calendar';
        if (path === '/cadastro' || path === '/cadastro/') return 'register';
        const view = path.replace(/\/$/, '').substring(1);
        return view || 'home';
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<Partial<PlayerStats>>({});
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rankings, setRankings] = useState<RankingInstance[]>([]);
    const [contentDB, setContentDB] = useState<ContentDB>(INITIAL_DB);
    const [globalScoringSchemas, setGlobalScoringSchemas] = useState<ScoringSchema[]>([]);
    const [allProfiles, setAllProfiles] = useState<RankingPlayer[]>([]);
    const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
    const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);
    const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>([]);
    const [badgeDistribution, setBadgeDistribution] = useState<Record<string, number>>({});
    const [systemMessageTemplates, setSystemMessageTemplates] = useState<SystemMessageTemplate[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);

    const [prizeLabel, setPrizeLabel] = useState(appConfig.initialDefaults.applicationDefaults.prizeLabel);
    const [totalQualifiers, setTotalQualifiers] = useState(appConfig.initialDefaults.applicationDefaults.totalQualifiers);
    const [customTotalQualifiers, setCustomTotalQualifiers] = useState<number | null>(null);
    const [nextGoal, setNextGoal] = useState(appConfig.initialDefaults.applicationDefaults.nextGoal);
    const [months, setMonths] = useState<MonthData[]>(appConfig.initialDefaults.months as MonthData[]);
    const [vipPlans, setVipPlans] = useState<any[]>(appConfig.vip.plans);
    const [userReservations, setUserReservations] = useState<string[]>([]);

    // Simple cache for Supabase data to reduce egress
    const cacheRef = useRef<{
        data: any;
        timestamp: number;
    } | null>(null);
    const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

    // Map URL path to internal views & selected players
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') {
            setCurrentView('home');
        } else if (path.startsWith('/perfil/')) {
            const rawSlug = path.replace('/perfil/', '');
            const decodedName = decodeURIComponent(rawSlug);
            const cleanSlug = createProfileSlug(decodedName);
            
            // Auto-redirect if slug is dirty (e.g. trailing hyphens) or encoded incorrectly
            if (rawSlug !== cleanSlug && encodeURIComponent(cleanSlug) !== rawSlug) {
                navigate(`/perfil/${cleanSlug}`, { replace: true });
            } else if (decodedName) {
                setCurrentView('profile');
                // Only attempt player lookup AFTER profiles data has loaded.
                // If allProfiles is still empty (loading), defer — the second useEffect below handles it.
                if (allProfiles.length > 0 || isLoggedIn) {
                    handleNavigateToPlayerByNameInternal(decodedName);
                }
                // else: loading screen shown via AppRouter; lookup is triggered when allProfiles loads
            }
        } else if (path.startsWith('/ranking/')) {
            const rawSlug = path.replace('/ranking/', '');
            const decodedName = decodeURIComponent(rawSlug);
            const cleanSlug = createProfileSlug(decodedName);

            if (rawSlug !== cleanSlug && encodeURIComponent(cleanSlug) !== rawSlug) {
                navigate(`/ranking/${cleanSlug}`, { replace: true });
            } else {
                setCurrentView('ranking');
            }
        } else if (path === '/perfil') {
            setCurrentView('profile');
        } else if (path === '/calendario') {
            setCurrentView('calendar');
        } else if (path === '/cadastro') {
            setCurrentView('register');
        } else if (path !== '') {
            const view = path.substring(1);
            if (view) setCurrentView(view);
        }
    }, [location.pathname, allProfiles.length, isLoggedIn]);

    // Secondary effect: once profiles load, resolve deferred profile lookups from URL slugs
    useEffect(() => {
        if (allProfiles.length === 0) return;
        const path = location.pathname;
        if (path.startsWith('/perfil/') && currentView === 'profile' && !selectedPlayer) {
            const rawSlug = path.replace('/perfil/', '');
            const decodedName = decodeURIComponent(rawSlug);
            if (decodedName) {
                handleNavigateToPlayerByNameInternal(decodedName);
            }
        }
    }, [allProfiles.length]);

    const [isFlyerOpen, setIsFlyerOpen] = useState(false);

    // ── Messages & Polls hook ──────────────────────────────────────────────────
    const {
        messages, unreadCount, polls, pollVotesByCurrentUser, newNotification, setNewNotification,
        handleMarkAsRead, handleDeleteMessage, handleReplyMessage,
        handleSendMessage: hookSendMessage, handleSendAdminMessage: hookSendAdminMessage,
        handleCreatePoll: hookCreatePoll, handleVoteOnPoll: hookVoteOnPoll
    } = useMessages({ isLoggedIn, currentUserId, isAdmin, systemMessageTemplates });

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchSupabaseData = async (force: boolean = false) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        
        const CACHE_KEY = 'cr_app_raw_data_cache_v3';
        
        try {
        let rankingsData: any[] | null = null;
        let templatesData: any[] | null = null;
        let schemasData: any[] | null = null;
        let eventsData: any[] | null = null;
        let contentData: any[] | null = null;
        let ecoCategoriesData: any[] | null = null;
        let profilesData: any[] | null = null;
        let currentUserBadges: any[] | null = null;
        let expLevelsData: any[] | null = null;
        let dailyRewardsData: any[] | null = null;
        let templatesMsgData: any[] | null = null;
        let allUserBadges: any[] | null = null;

        let useCache = false;
        if (!force) {
            try {
                const sessionData = sessionStorage.getItem(CACHE_KEY);
                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.currentUserId === currentUserId) {
                        console.log('Using cached data for:', currentUserId);
                        rankingsData = parsed.rankingsData || [];
                        templatesData = parsed.templatesData || [];
                        schemasData = parsed.schemasData || [];
                        eventsData = parsed.eventsData || [];
                        contentData = parsed.contentData || [];
                        ecoCategoriesData = parsed.ecoCategoriesData || [];
                        profilesData = parsed.profilesData || [];
                        currentUserBadges = parsed.currentUserBadges || [];
                        expLevelsData = parsed.expLevelsData || [];
                        dailyRewardsData = parsed.dailyRewardsData || [];
                        templatesMsgData = parsed.templatesMsgData || [];
                        allUserBadges = parsed.allUserBadges || [];
                        useCache = true;
                    }
                }
            } catch (e) {
                console.error('Error reading session cache', e);
            }
        }

        if (!useCache) {
            console.log('Fetching fresh Supabase data...', force ? '(forced)' : '');
            setIsLoading(true);
            try {
                const results = await Promise.all([
                    supabase.from('rankings').select('id, label, description, rules, start_date, end_date, prize_info_title, prize_info_detail, scoring_schema_map, is_active, brl_reward, chipz_reward, badge_template_id, position_prizes, order'),
                    supabase.from('badge_templates').select('id, title, description, icon, color, category, rarity, event_trigger, is_legendary'),
                    supabase.from('scoring_schemas').select('id, name, criteria, position_points'),
                    supabase.from('events').select('id, title, date, time, type, buyin, guaranteed, status, ranking_type, included_rankings, description, modality, stack, blinds, late_reg, location, results, is_hidden, is_starting_day, scoring_schema_id, is_special_event, flyer_url, rebuy_value, rebuy_chips, addon_value, addon_chips, staff_bonus_value, staff_bonus_chips, time_chip_value, time_chip_chips, time_chip_addon_chips, time_chip_discount_brl, max_capacity, double_rebuy_value, double_rebuy_chips, double_addon_value, double_addon_chips, parallel_products, total_rebuys, total_addons, total_prize, game_mode, cash_game_type, cash_game_blinds, cash_game_capacity, cash_game_min_max, cash_game_dinner, cash_game_open_bar, cash_game_notes, staff_expenses_brl, prize_payout_brl, is_multi_day, is_final_day, final_event_id, stack_aggregation, bonus1_condition, bonus1_stack, bonus1_addon, bonus1_extra, bonus2_condition, bonus2_stack, bonus2_addon, bonus2_extra, bonus3_condition, bonus3_stack, bonus3_addon, bonus3_extra, timeline_title, structure').order('date', { ascending: true }),
                    supabase.from('content_db').select('key, value'),
                    supabase.from('ecosystem_categories').select('id, title, description, icon, color, order, col_span, row_span, target_view, button_text, is_mystery, is_hidden, slots, background_url, icon_url').order('order', { ascending: true }),
                    supabase.from('profiles_public').select('id, numeric_id, name, avatar_url, city, is_vip, vip_status, vip_expires_at, level, current_exp, next_level_exp, is_verified, total_pending_debt, suprema_nickname, suprema_user_id, profile_views'),
                    currentUserId ? supabase.from('user_badges').select('id, user_id, badge_template_id, title, description, icon, color, awarded_at, badge_templates(id, title, description, icon, color, rarity, is_legendary)').eq('user_id', currentUserId) : Promise.resolve({ data: [] }),
                    supabase.from('experience_levels').select('level, required_exp, credit_limit').order('level', { ascending: true }),
                    supabase.from('daily_rewards').select('day, reward_type, reward_value, reward_label').order('day', { ascending: true }),
                    supabase.from('system_message_templates').select('id, subject, content, category, sender, is_active, updated_at'),
                    supabase.from('user_badges').select('badge_template_id')
                ]);

                rankingsData = results[0].data;
                templatesData = results[1].data;
                schemasData = results[2].data;
                eventsData = results[3].data;
                contentData = results[4].data;
                ecoCategoriesData = results[5].data;
                profilesData = results[6].data;
                currentUserBadges = results[7].data;
                expLevelsData = results[8].data;
                dailyRewardsData = results[9].data;
                templatesMsgData = results[10].data;
                allUserBadges = results[11].data;

                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        currentUserId,
                        rankingsData, templatesData, schemasData, eventsData, contentData,
                        ecoCategoriesData, profilesData, currentUserBadges, expLevelsData,
                        dailyRewardsData, templatesMsgData, allUserBadges
                    }));
                } catch (e) {
                    console.warn('Failed to save to sessionStorage (quota exceeded):', e);
                }
            } catch (err) {
                console.error('Promise.all failed:', err);
            }
        }

            if (rankingsData) {
                const mappedRankings = rankingsData.map(r => ({
                    id: r.id,
                    label: r.label,
                    description: r.description,
                    rules: r.rules,
                    startDate: r.start_date,
                    endDate: r.end_date,
                    prizeInfoTitle: r.prize_info_title,
                    prizeInfoDetail: r.prize_info_detail,
                    scoringSchemaMap: r.scoring_schema_map || {},
                    isActive: r.is_active !== false,
                    brlReward: r.brl_reward,
                    chipzReward: r.chipz_reward,
                    badgeTemplateId: r.badge_template_id,
                    positionPrizes: r.position_prizes || {},
                    order: r.order || 0,
                    players: []
                }));
                // Sort by order ascending
                setRankings(mappedRankings.sort((a, b) => a.order - b.order));
            }

            if (templatesData) setBadgeTemplates(templatesData);

            if (schemasData) {
                setGlobalScoringSchemas(schemasData.map(s => ({
                    id: s.id,
                    name: s.name,
                    criteria: s.criteria || [],
                    positionPoints: s.position_points || {}
                })));
            }

            if (eventsData) {
                const mappedEvents: Event[] = eventsData.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    time: e.time,
                    type: e.type,
                    buyin: e.buyin,
                    guaranteed: e.guaranteed,
                    status: e.status,
                    description: e.description,
                    modality: e.modality,
                    stack: e.stack,
                    blinds: e.blinds,
                    lateReg: (e as any).late_reg,
                    location: e.location,
                    results: e.results,
                    rebuyValue: (e as any).rebuy_value,
                    rebuyChips: (e as any).rebuy_chips,
                    addonValue: (e as any).addon_value,
                    addonChips: (e as any).addon_chips,
                    staffBonusValue: (e as any).staff_bonus_value,
                    staffBonusChips: (e as any).staff_bonus_chips,
                    timeChipValue: (e as any).time_chip_value,
                    timeChipChips: (e as any).time_chip_chips,
                    timeChipAddonChips: (e as any).time_chip_addon_chips,
                    timeChipDiscountBrl: (e as any).time_chip_discount_brl,
                    maxCapacity: (e as any).max_capacity,
                    flyerUrl: e.flyer_url,
                    doubleRebuyValue: (e as any).double_rebuy_value,
                    doubleRebuyChips: (e as any).double_rebuy_chips,
                    doubleAddonValue: (e as any).double_addon_value,
                    doubleAddonChips: (e as any).double_addon_chips,
                    parallelProducts: (e as any).parallel_products,
                    totalRebuys: (e as any).total_rebuys,
                    totalAddons: (e as any).total_addons,
                    totalPrize: (e as any).total_prize,
                    rankingType: (e as any).ranking_type,
                    includedRankings: (e as any).included_rankings,
                    scoringSchemaId: e.scoring_schema_id,
                    gameMode: (e as any).game_mode,
                    cashGameType: (e as any).cash_game_type,
                    cashGameBlinds: (e as any).cash_game_blinds,
                    cashGameCapacity: (e as any).cash_game_capacity,
                    cashGameMinMax: (e as any).cash_game_min_max,
                    cashGameDinner: (e as any).cash_game_dinner,
                    cashGameOpenBar: (e as any).cash_game_open_bar,
                    cashGameNotes: (e as any).cash_game_notes,
                    staffExpensesBrl: (e as any).staff_expenses_brl || 0,
                    prizePayoutBrl: (e as any).prize_payout_brl || 0,
                    is_hidden: e.is_hidden,
                    isMultiDay: (e as any).is_multi_day,
                    isStartingDay: e.is_starting_day,
                    isFinalDay: (e as any).is_final_day,
                    finalEventId: (e as any).final_event_id,
                    stackAggregation: (e as any).stack_aggregation,
                    bonus1_condition: (e as any).bonus1_condition,
                    bonus1_stack: (e as any).bonus1_stack,
                    bonus1_addon: (e as any).bonus1_addon,
                    bonus1_extra: (e as any).bonus1_extra,
                    bonus2_condition: (e as any).bonus2_condition,
                    bonus2_stack: (e as any).bonus2_stack,
                    bonus2_addon: (e as any).bonus2_addon,
                    bonus2_extra: (e as any).bonus2_extra,
                    bonus3_condition: (e as any).bonus3_condition,
                    bonus3_stack: (e as any).bonus3_stack,
                    bonus3_addon: (e as any).bonus3_addon,
                    bonus3_extra: (e as any).bonus3_extra,
                    is_special_event: e.is_special_event,
                    timeline_title: (e as any).timeline_title,
                    structure: (e as any).structure
                }));
                setEvents(mappedEvents as any);
            }

            if (contentData) {
                contentData.forEach(item => {
                    if (item.key === 'hero') setContentDB(prev => ({ ...prev, hero: item.value }));
                    else if (item.key === 'details') setContentDB(prev => ({ ...prev, details: item.value }));
                    else if (item.key === 'faq') setContentDB(prev => ({ ...prev, faq: item.value }));
                    else if (item.key === 'special_events') setContentDB(prev => ({ ...prev, special_events: item.value }));
                    else if (item.key === 'months') setMonths(item.value);
                    else if (item.key === 'total_qualifiers') setCustomTotalQualifiers(item.value);
                    else if (item.key === 'documents') setContentDB(prev => ({ ...prev, documents: item.value }));
                    else if (item.key === 'vip_plans') setVipPlans(item.value);
                });
            }

            if (ecoCategoriesData) setContentDB(prev => ({ ...prev, categories: ecoCategoriesData }));

            if (profilesData) {
                setAllProfiles(profilesData.map(p => ({
                    id: p.id,
                    numericId: p.numeric_id,
                    rank: 0,
                    name: p.name || 'Usuário',
                    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${(p.name || 'U').trim().replace(/\s+/g, '+')}&background=random`,
                    city: p.city || '',
                    points: 0,
                    change: 'same',
                    isVip: p.is_vip || false,
                    vipStatus: p.vip_status || 'nao_vip',
                    vipExpiresAt: p.vip_expires_at || null,
                    social: p.social || undefined,
                    bio: p.bio || undefined,
                    level: p.level || 1,
                    currentExp: p.current_exp || 0,
                    nextLevelExp: p.next_level_exp || 1000,
                    gallery: p.gallery || undefined,
                    playStyles: p.play_styles || undefined,
                    isVerified: p.is_verified || false,
                    totalPendingDebt: p.total_pending_debt || 0,
                    suprema_nickname: p.suprema_nickname || undefined,
                    suprema_user_id: p.suprema_user_id || undefined,
                    profile_views: p.profile_views || 0,
                    badges: currentUserBadges?.filter(ub => ub.user_id === p.id).map(ub => ({
                        ...ub,
                        color: ub.color 
                    })) || []
                })));
            }

            if (expLevelsData) setExperienceLevels(expLevelsData);

            if (dailyRewardsData) setDailyRewards(dailyRewardsData);

            if (templatesMsgData) setSystemMessageTemplates(templatesMsgData);

            if (allUserBadges) {
                const distribution: Record<string, number> = {};
                allUserBadges.forEach((ub: any) => {
                    distribution[ub.badge_template_id] = (distribution[ub.badge_template_id] || 0) + 1;
                });
                setBadgeDistribution(distribution);
            }

            // Update cache timestamp
            cacheRef.current = { data: true, timestamp: Date.now() };
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Error fetching Supabase data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase.from('profiles')
                .select('id, numeric_id, name, avatar_url, city, bio, social, play_styles, gallery, level, current_exp, next_level_exp, last_daily_claim, daily_streak, is_vip, vip_status, vip_expires_at, balance_brl, balance_chipz, locked_balance_brl, balance_unlock_date, total_pending_debt, debt_limit_brl, is_verified, suprema_nickname, suprema_user_id, role, profile_views, jackpot_vouchers')
                .eq('id', userId)
                .single();
            if (error) throw error;
            if (data) {
                setIsAdmin(data.role === 'admin');
                setIsStaff(data.role === 'staff');
                const userData: any = {
                    id: userId,
                    numericId: data.numeric_id,
                    name: data.name || 'User',
                    avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${data.name || 'U'}&background=random`,
                    city: data.city || '',
                    bio: data.bio || '',
                    social: data.social || {},
                    playStyles: data.play_styles || [],
                    gallery: data.gallery || [],
                    level: data.level || 1,
                    currentExp: data.current_exp || 0,
                    nextLevelExp: data.next_level_exp || 1000,
                    lastDailyClaim: data.last_daily_claim || null,
                    dailyStreak: data.daily_streak || 0,
                    isVip: data.is_vip || false,
                    vipStatus: data.vip_status || 'nao_vip',
                    vipExpiresAt: data.vip_expires_at || null,
                    balanceBrl: data.balance_brl ? Number(data.balance_brl) : 0,
                    balanceChipz: data.balance_chipz || 0,
                    lockedBalanceBrl: data.locked_balance_brl ? Number(data.locked_balance_brl) : 0,
                    balanceUnlockDate: data.balance_unlock_date || null,
                    totalPendingDebt: data.total_pending_debt || 0,
                    debtLimitBrl: data.debt_limit_brl || 0,
                    isVerified: data.is_verified || false,
                    suprema_nickname: data.suprema_nickname || '',
                    suprema_user_id: data.suprema_user_id || '',
                    role: data.role,
                    profile_views: data.profile_views || 0,
                    jackpotVouchers: data.jackpot_vouchers || 0,
                    badges: []
                };
                const { data: userBadges } = await supabase.from('user_badges').select('id, user_id, badge_template_id, title, description, icon, color, awarded_at, badge_templates(id, title, description, icon, color, rarity, is_legendary)').eq('user_id', userId).order('awarded_at', { ascending: false });
                if (userBadges) userData.badges = userBadges;
                setCurrentUser(userData);
                // Also fetch reservations for this user
                fetchUserReservations(userId);
            }
        } catch (error) { console.error('Error fetching profile:', error); }
    };

    const fetchUserReservations = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('tournament_reservations')
                .select('event_id')
                .eq('user_id', userId)
                .in('status', ['reserved', 'confirmed']);
            if (error) throw error;
            if (data) {
                setUserReservations(data.map(r => r.event_id));
            }
        } catch (e) {
            console.error('Error fetching user reservations:', e);
        }
    };

    const handleCreateBadgeTemplate = async (badge: Partial<BadgeTemplate>) => {
        setIsLoading(true);
        try {
            // Check for duplicates locally first
            const isDuplicate = badgeTemplates.some(b =>
                b.icon === badge.icon && b.color === badge.color
            );

            if (isDuplicate) {
                alert('Erro: Já existe uma insígnia com este ícone e cor.');
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('badge_templates')
                .insert([badge])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    alert('Erro: Esta combinação de ícone e cor já existe (Unique Constraint).');
                } else {
                    throw error;
                }
                return;
            }

            if (data) {
                setBadgeTemplates(prev => [...prev, data]);
                alert('Insignia criada com sucesso!');
            }
        } catch (error: any) {
            console.error('Error creating badge template:', error);
            alert('Erro ao criar insignia: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateBadgeTemplate = async (id: string, badge: Partial<BadgeTemplate>) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('badge_templates')
                .update(badge)
                .eq('id', id);

            if (error) {
                if (error.code === '23505') {
                    alert('Erro: Esta combinação de ícone e cor já existe (Unique Constraint).');
                } else {
                    throw error;
                }
                return;
            }

            setBadgeTemplates(prev => prev.map(b => b.id === id ? { ...b, ...badge } : b));
            
            // Sync with existing user badges
            const syncData: any = {};
            if (badge.title) syncData.title = badge.title;
            if (badge.icon) syncData.icon = badge.icon;
            if (badge.color) syncData.color = badge.color;
            if (badge.description) syncData.description = badge.description;

            if (Object.keys(syncData).length > 0) {
                const { error: syncError } = await supabase
                    .from('user_badges')
                    .update(syncData)
                    .eq('badge_template_id', id);
                
                if (syncError) {
                    console.error('Error syncing user badges:', syncError);
                    // We don't throw here to not block the success of the template update
                }
            }

            alert('Aviso: Insígnia atualizada com sucesso em todo o sistema!');
        } catch (error: any) {
            console.error('Error updating badge template:', error);
            alert('Erro ao atualizar insígnia: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSystemMessageTemplate = async (template: SystemMessageTemplate) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('system_message_templates')
                .update({
                    subject: template.subject,
                    content: template.content,
                    category: template.category,
                    sender: template.sender,
                    is_active: template.is_active,
                    distribution_logic: template.distribution_logic,
                    updated_at: new Date().toISOString()
                })
                .eq('id', template.id);

            if (error) throw error;
            setSystemMessageTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        } catch (error: any) {
            console.error('Error updating message template:', error);
            alert('Erro ao atualizar template: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSystemMessageTemplate = async (template: Partial<SystemMessageTemplate>) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_message_templates')
                .insert([template])
                .select();

            if (error) throw error;
            if (data) setSystemMessageTemplates(prev => [...prev, data[0]]);
        } catch (error: any) {
            console.error('Error creating message template:', error);
            alert('Erro ao criar template: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const sendTemplatedMessage = async (templateId: string, targetId: string, variables: Record<string, string | number> = {}) => {
        const template = systemMessageTemplates.find(t => t.id === templateId);
        if (!template || !template.is_active) return;

        let finalSubject = template.subject;
        let finalContent = template.content;

        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalSubject = finalSubject.replace(regex, String(value));
            finalContent = finalContent.replace(regex, String(value));
        });

        await supabase.from('messages').insert({
            user_id: targetId,
            sender: template.sender,
            subject: finalSubject,
            content: finalContent,
            category: template.category,
            is_read: false
        });
    };

    // fetchMessages/fetchPolls/fetchUserPollVotes moved to useMessages hook

    useEffect(() => {
        fetchSupabaseData();
    }, [currentUserId]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                fetchProfile(session.user.id);
                handleCheckDailyLogin(session.user.id);
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                fetchProfile(session.user.id);
                handleCheckDailyLogin(session.user.id);
            } else {
                setIsLoggedIn(false);
                setCurrentUserId(null);
                setCurrentUser({});
                setIsAdmin(false);
                setIsStaff(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleCheckDailyLogin = async (userId: string) => {
        try {
            // Check if already notified today after 21h (gaming day)
            // Gaming day starts at 21h.
            const now = new Date();
            const gamingDate = new Date(now);
            if (now.getHours() < 21) gamingDate.setDate(gamingDate.getDate() - 1);

            const currentGamingDayStart = new Date(gamingDate);
            currentGamingDayStart.setHours(21, 0, 0, 0);
            const dateStr = gamingDate.toISOString().split('T')[0];

            const { data: profile, error } = await supabase.from('profiles').select('last_daily_claim').eq('id', userId).single();
            if (error || !profile) return;

            const lastClaim = profile.last_daily_claim;
            const canClaim = !lastClaim || new Date(lastClaim) < currentGamingDayStart;

            if (canClaim) {
                // We use a session-based flag to avoid re-sending the message in the same session
                // if the user deletes it. 
                const notificationKey = `notified_daily_${userId}_${dateStr}`;
                const alreadyNotified = localStorage.getItem(notificationKey);

                if (!alreadyNotified) {
                    await sendTemplatedMessage('daily_login', userId);
                    localStorage.setItem(notificationKey, 'true');
                }
            }
        } catch (e) {
            console.error('Error in daily login check:', e);
        }
    };

    // Message realtime subscription is handled inside useMessages hook.
    // Profile & Badge realtime subscriptions remain here:
    useEffect(() => {
        if (!isLoggedIn || !currentUserId) return;

        const profileChannel = supabase.channel(`profile-ctx-${currentUserId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUserId}` }, (payload) => {
                const p = payload.new as any;
                setCurrentUser(prev => ({
                    ...prev,
                    balanceBrl: p.balance_brl ? Number(p.balance_brl) : prev.balanceBrl,
                    balanceChipz: p.balance_chipz || prev.balanceChipz,
                    totalPendingDebt: p.total_pending_debt || 0,
                    level: p.level || prev.level,
                    currentExp: p.current_exp || prev.currentExp
                }));
            })
            .subscribe();

        const badgeChannel = supabase.channel(`badges-ctx-${currentUserId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges', filter: `user_id=eq.${currentUserId}` }, () => {
                fetchSupabaseData(true);
                if (currentUserId) fetchProfile(currentUserId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(badgeChannel);
        };
    }, [isLoggedIn, currentUserId]);

    // Memoized Rankings calculation to improve performance and avoid state update loops
    const calculatedRankings = React.useMemo(() => {
        if (!events || events.length === 0 || !allProfiles || allProfiles.length === 0 || !rankings || rankings.length === 0) return rankings;
        
        const metadataMap = new Map<string, RankingPlayer>();
        const metadataByIdMap = new Map<string, RankingPlayer>();
        allProfiles.forEach(p => {
            if (p.name) metadataMap.set(p.name.toLowerCase().trim(), p);
            if (p.id) metadataByIdMap.set(p.id, p);
        });

        return rankings.map(ranking => {
            const playerMap = new Map<string, RankingPlayer>();
            events.forEach(ev => {
                const included = ev.includedRankings || ['annual', 'quarterly', 'legacy'];
                if (ev.status === 'closed' && ev.results && included.includes(ranking.id) && !ev.isStartingDay) {
                    const mappedSchemaId = (ev.rankingType && ranking.scoringSchemaMap) ? ranking.scoringSchemaMap[ev.rankingType] : ev.scoringSchemaId;
                    ev.results.forEach((r: any) => {
                        const profile = (r.userId ? metadataByIdMap.get(r.userId) : null) || metadataMap.get(r.name.toLowerCase().trim());
                        const playerKey = r.userId || r.name.trim();
                        if (!playerMap.has(playerKey)) {
                            playerMap.set(playerKey, {
                                id: profile?.id || r.userId || `GUEST:${r.name}`, numericId: profile?.numericId, rank: 0,
                                name: profile?.name || r.name, avatar: profile?.avatar || `https://ui-avatars.com/api/?name=${r.name.replace(' ', '+')}&background=random`,
                                city: profile?.city || 'Venâncio Aires - RS', points: 0, change: 'same',
                                isVip: profile?.isVip || r.isVip || false, vipStatus: profile?.vipStatus || 'nao_vip',
                                social: profile?.social, bio: profile?.bio, level: profile?.level, currentExp: profile?.currentExp,
                                nextLevelExp: profile?.nextLevelExp, gallery: profile?.gallery, playStyles: profile?.playStyles,
                                isVerified: profile?.isVerified || false,
                                badges: profile?.badges || []
                            });
                        }
                        const p = playerMap.get(playerKey)!;
                        const isSpecialEvent = ev.rankingType === 'special';
                        const isLegacyRanking = ranking.id === 'legacy' || ranking.label.toLowerCase().includes('legado');
                        const forceRecalc = isSpecialEvent && isLegacyRanking;
                        const savedPoints = r.pointsPerRanking?.[ranking.id];
                        const pointsToAdd = (savedPoints !== undefined && savedPoints !== null && !forceRecalc)
                            ? savedPoints
                            : calculatePoints(
                                ev.rankingType || 'weekly', 
                                ev.results?.length || 0, 
                                (isSpecialEvent && r.buyinTotal) ? r.buyinTotal : (Number((ev.buyin?.toString() || '0').replace(/[^0-9]/g, '')) || 0), 
                                r.position, 
                                r.prize, 
                                r.isVip, 
                                mappedSchemaId, 
                                globalScoringSchemas,
                                r.rake || 0,
                                r.profitLoss || 0,
                                r.earlyStart || false,
                                r.lateStay || false,
                                r.minTime1h || false
                            );
                        p.points += pointsToAdd;
                    });
                }
            });
            const sortedPlayers = Array.from(playerMap.values())
                .filter(p => p.points > 0)
                .sort((a, b) => b.points - a.points)
                .map((p, i) => ({ ...p, rank: i + 1 }));
            
            return { ...ranking, players: sortedPlayers };
        });
    }, [events, allProfiles, globalScoringSchemas, rankings]);

    useEffect(() => {
        const completedMonths = months.filter(m => m.status === 'completed');
        let currentPrizeVal = 30000;
        if (completedMonths.length > 0) {
            const lastCompleted = completedMonths[completedMonths.length - 1];
            setPrizeLabel(lastCompleted.prize);
            const numericPrize = parseInt(lastCompleted.prize.replace(/\D/g, ''));
            if (!isNaN(numericPrize)) currentPrizeVal = numericPrize * 1000;
        } else { setPrizeLabel('2026'); }

        const autoTotal = months.reduce((acc, month) => {
            if (month.status === 'completed' && typeof month.qualifiers === 'number') return acc + month.qualifiers;
            return acc;
        }, 0);
        const finalTotal = customTotalQualifiers !== null ? customTotalQualifiers : autoTotal;
        setTotalQualifiers(finalTotal);

        const targetMonth = months.find(m => m.status === 'active') || months.find(m => m.status === 'locked');
        if (targetMonth) {
            const targetPrizeNum = parseInt(targetMonth.prize.replace(/\D/g, ''));
            const nextPrize = !isNaN(targetPrizeNum) ? targetPrizeNum * 1000 : currentPrizeVal + 5000;
            let accumTarget = 0;
            for (const m of months) {
                if (typeof m.qualifiers === 'number') accumTarget += m.qualifiers;
                if (m === targetMonth) break;
            }
            setNextGoal({ prize: nextPrize, qualifiers: accumTarget });
        }
    }, [months, customTotalQualifiers]);

    const handleNavigate = (view: string) => {
        if (view === 'profile') setSelectedPlayer(null);
        
        // Map common views to Portuguese routes or standard paths
        let path = `/${view}`;
        if (view === 'home') path = '/';
        else if (view === 'calendar') path = '/calendario';
        else if (view === 'profile') path = '/perfil';
        else if (view === 'register') path = '/cadastro';
        
        navigate(path);
        // window.scrollTo is handled by the browser or components, but we can do it here:
        window.scrollTo(0, 0);
    };

    const handleLogin = () => {
        const redirect = sessionStorage.getItem('login_redirect');
        if (redirect) {
            handleNavigate(redirect);
            sessionStorage.removeItem('login_redirect');
        } else {
            handleNavigate('home');
        }
    };
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setIsAdmin(false);
        setIsStaff(false);
        handleNavigate('home');
    };

    // --- UTILS ---
    const handlePlayerSelect = (player: RankingPlayer) => {
        if (player.name) {
            const urlSlug = createProfileSlug(player.name);
            navigate(`/perfil/${urlSlug}`);
        } else {
            handleNavigate('profile');
        }
        window.scrollTo(0, 0);
    };

    const uploadImage = async (userId: string, base64Data: string, folder: string = 'avatars'): Promise<string> => {
        if (!base64Data || !base64Data.startsWith('data:image')) return base64Data;

        try {
            // Compress even more before uploading if it's base64
            // (Actually handleProfileUpdate receives what's passed from components)
            const response = await fetch(base64Data);
            const blob = await response.blob();
            const fileExt = blob.type.split('/')[1] || 'jpg';
            const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return base64Data;
        }
    };

    const handleProfileUpdate = async (targetId: string, updatedData: any) => {
        const sanitizedTargetId = targetId?.trim() || '';
        if (!sanitizedTargetId) return null;

        console.log('--- PROFILE UPDATE LOG ---', { targetId: sanitizedTargetId, isAdmin });

        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitizedTargetId);
            const isGuest = !isUUID && sanitizedTargetId.length > 0;
            
            // Prepare clean update object
            const dbUpdate: any = {};
            if (updatedData.name !== undefined) dbUpdate.name = updatedData.name;
            
            // Handle image uploads to Storage
            if (updatedData.avatar !== undefined && updatedData.avatar?.startsWith('data:image')) {
                dbUpdate.avatar_url = await uploadImage(sanitizedTargetId, updatedData.avatar, 'avatar');
                updatedData.avatar = dbUpdate.avatar_url; // Sync back to updatedData for local state
            } else if (updatedData.avatar !== undefined) {
                dbUpdate.avatar_url = updatedData.avatar;
            }

            if (updatedData.gallery !== undefined) {
                const uploadedGallery = await Promise.all(
                    updatedData.gallery.map((img: string) => 
                        img.startsWith('data:image') ? uploadImage(sanitizedTargetId, img, 'gallery') : img
                    )
                );
                dbUpdate.gallery = uploadedGallery;
                updatedData.gallery = uploadedGallery; // Sync back
            }

            if (updatedData.city !== undefined) dbUpdate.city = updatedData.city;
            if (updatedData.bio !== undefined) dbUpdate.bio = updatedData.bio;
            if (updatedData.social !== undefined) dbUpdate.social = updatedData.social;
            if (updatedData.playStyles !== undefined) dbUpdate.play_styles = updatedData.playStyles;
            if (updatedData.level !== undefined) dbUpdate.level = updatedData.level;
            if (updatedData.currentExp !== undefined) dbUpdate.current_exp = updatedData.currentExp;
            if (updatedData.suprema_nickname !== undefined) dbUpdate.suprema_nickname = updatedData.suprema_nickname;
            if (updatedData.suprema_user_id !== undefined) dbUpdate.suprema_user_id = updatedData.suprema_user_id;
            
            if (updatedData.debtLimitBrl !== undefined) dbUpdate.debt_limit_brl = updatedData.debtLimitBrl;
            if (updatedData.isVip !== undefined) dbUpdate.is_vip = updatedData.isVip;
            if (updatedData.vipStatus !== undefined) dbUpdate.vip_status = updatedData.vipStatus;
            if (updatedData.vipExpiresAt !== undefined) dbUpdate.vip_expires_at = updatedData.vipExpiresAt;
            if (updatedData.isVerified !== undefined) dbUpdate.is_verified = updatedData.isVerified;
            if (updatedData.lastDailyClaim !== undefined) dbUpdate.last_daily_claim = updatedData.lastDailyClaim;
            if (updatedData.dailyStreak !== undefined) dbUpdate.daily_streak = updatedData.dailyStreak;

            if (Object.keys(dbUpdate).length === 0) return;

            if (isUUID) {
                // Regular UUID profile update
                const { error } = await supabase.from('profiles').upsert({ id: sanitizedTargetId, ...dbUpdate }, { onConflict: 'id' });
                if (error) throw error;

                // Sync local state
                const updateEffect = (p: any) => ({ ...p, ...updatedData });
                setAllProfiles(prev => prev.map(p => p.id === sanitizedTargetId ? updateEffect(p) : p));
                
                if (selectedPlayer && selectedPlayer.id === sanitizedTargetId) {
                    setSelectedPlayer(prev => prev ? updateEffect(prev) : null);
                }

                if (sanitizedTargetId === currentUserId) {
                    setCurrentUser(prev => ({ ...prev, ...updatedData }));
                }
                return sanitizedTargetId;
            } else if (isGuest && isAdmin) {
                // Promote Guest (or any non-UUID ID handled by admin) to real profile
                const newId = crypto.randomUUID();
                const guestName = sanitizedTargetId.replace('GUEST:', '');
                
                const finalDbUpdate = { 
                    id: newId, 
                    name: updatedData.name || guestName,
                    ...dbUpdate 
                };

                const { error } = await supabase.from('profiles').insert(finalDbUpdate);
                if (error) throw error;

                // Fetch the new profile and add to state
                const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', newId).maybeSingle();
                if (newProfile) {
                    const mappedProfile = {
                        id: newProfile.id,
                        numericId: newProfile.numeric_id,
                        rank: 0,
                        name: newProfile.name || 'Usuário',
                        avatar: newProfile.avatar_url || `https://ui-avatars.com/api/?name=${(newProfile.name || 'U').trim().replace(/\s+/g, '+')}&background=random`,
                        city: newProfile.city || '',
                        points: 0,
                        change: 'same',
                        isVip: newProfile.is_vip || false,
                        vipStatus: newProfile.vip_status || 'nao_vip',
                        vipExpiresAt: newProfile.vip_expires_at || null,
                        social: newProfile.social || undefined,
                        bio: newProfile.bio || undefined,
                        level: newProfile.level || 1,
                        currentExp: newProfile.current_exp || 0,
                        nextLevelExp: newProfile.next_level_exp || 1000,
                        gallery: newProfile.gallery || undefined,
                        playStyles: newProfile.play_styles || undefined,
                        isVerified: newProfile.is_verified || false,
                        totalPendingDebt: newProfile.total_pending_debt || 0,
                        suprema_nickname: newProfile.suprema_nickname || undefined,
                        suprema_user_id: newProfile.suprema_user_id || undefined,
                        badges: []
                    };
                    setAllProfiles(prev => [...prev.filter(p => p.id !== sanitizedTargetId), mappedProfile]);
                    
                    // Se o admin estava vendo esse perfil, atualiza a seleção
                    if (selectedPlayer && (selectedPlayer.id === sanitizedTargetId || selectedPlayer.name === guestName)) {
                        setSelectedPlayer(mappedProfile);
                    }
                }
                
                alert("Este convidado foi promovido a um Perfil Permanente com sucesso!");
                return newId;
            } else {
                throw new Error("Não é possível salvar alterações para convidados sem conta. Apenas administradores podem promover perfis.");
            }
        } catch (error) {
            console.error('Error handling profile update:', error);
            throw error;
        }
    };

    const handleSaveEvent = async (event: Event) => {
        if (!isAdmin) return;
        console.log('--- PERSISTENCE LOG: Saving Event ---', event);

        const isNew = !events.some(e => e.id === event.id) || event.id.length < 20;
        
        // Mapeamento explícito para garantir que campos nulos ou indefinidos sejam tratados corretamente
        const dbData: any = {
            title: event.title || '',
            date: event.date || '',
            time: event.time || '',
            type: event.type || 'live',
            modality: event.modality || null,
            buyin: event.buyin || '',
            guaranteed: event.guaranteed || '',
            status: event.status || 'open',
            ranking_type: event.rankingType || 'weekly',
            included_rankings: event.includedRankings || ['annual', 'quarterly'],
            description: event.description || '',
            stack: event.stack || '',
            blinds: event.blinds || '',
            late_reg: event.lateReg || '',
            location: event.location || '',
            rebuy_value: event.rebuyValue || '',
            rebuy_chips: event.rebuyChips || '',
            addon_value: event.addonValue || '',
            addon_chips: event.addonChips || '',
            staff_bonus_value: event.staffBonusValue || '',
            staff_bonus_chips: event.staffBonusChips || '',
            time_chip_value: event.timeChipValue || '',
            time_chip_chips: event.timeChipChips || '',
            flyer_url: event.flyerUrl || null,
            time_chip_addon_chips: event.timeChipAddonChips || '',
            time_chip_discount_brl: event.timeChipDiscountBrl || '',
            max_capacity: event.maxCapacity || '',
            double_rebuy_value: event.doubleRebuyValue || '',
            double_rebuy_chips: event.doubleRebuyChips || '',
            double_addon_value: event.doubleAddonValue || '',
            double_addon_chips: event.doubleAddonChips || '',
            parallel_products: event.parallelProducts || [],
            results: event.results || null,
            total_rebuys: Number(event.totalRebuys) || 0,
            total_addons: Number(event.totalAddons) || 0,
            total_prize: Number(event.totalPrize) || 0,
            scoring_schema_id: event.scoringSchemaId || null,
            game_mode: event.gameMode || 'tournament',
            cash_game_type: event.cashGameType || null,
            cash_game_blinds: event.cashGameBlinds || '',
            cash_game_capacity: event.cashGameCapacity || '',
            cash_game_min_max: event.cashGameMinMax || '',
            cash_game_dinner: event.cashGameDinner || false,
            cash_game_open_bar: event.cashGameOpenBar || false,
            cash_game_notes: event.cashGameNotes || '',
            staff_expenses_brl: Number(event.staffExpensesBrl) || 0,
            prize_payout_brl: Number(event.prizePayoutBrl) || 0,
            is_multi_day: event.isMultiDay || false,
            is_starting_day: event.isStartingDay || false,
            is_final_day: event.isFinalDay || false,
            final_event_id: event.finalEventId || null,
            stack_aggregation: event.stackAggregation || 'max',
            is_hidden: event.is_hidden || false,
            is_special_event: event.is_special_event || false,
            timeline_title: event.timeline_title || '',
            structure: event.structure || null,
            bonus1_condition: event.bonus1_condition || null,
            bonus1_stack: event.bonus1_stack || null,
            bonus1_addon: event.bonus1_addon || null,
            bonus1_extra: event.bonus1_extra || null,
            bonus2_condition: event.bonus2_condition || null,
            bonus2_stack: event.bonus2_stack || null,
            bonus2_addon: event.bonus2_addon || null,
            bonus2_extra: event.bonus2_extra || null,
            bonus3_condition: event.bonus3_condition || null,
            bonus3_stack: event.bonus3_stack || null,
            bonus3_addon: event.bonus3_addon || null,
            bonus3_extra: event.bonus3_extra || null
        };

        try {
            if (isAdmin) invalidateSessionCache();
            if (isNew) {
                console.log('--- PERSISTENCE: Inserting New Event ---', dbData);
                const { data, error } = await supabase.from('events').insert([dbData]).select();
                if (error) throw error;
                
                const savedEvent = data && data[0] ? { ...event, ...data[0] } : event;
                // Importante: Manter as chaves camelCase no estado local
                const mappedSavedEvent = {
                    ...savedEvent,
                    isStartingDay: (savedEvent as any).is_starting_day,
                    isFinalDay: (savedEvent as any).is_final_day,
                    isMultiDay: (savedEvent as any).is_multi_day
                };

                setEvents(prev => [...prev.filter(e => e.id !== event.id), mappedSavedEvent]);
                return mappedSavedEvent;
            } else {
                console.log('--- PERSISTENCE: Updating Existing Event ---', event.id, dbData);
                const { data, error } = await supabase.from('events').update(dbData).eq('id', event.id).select();
                if (error) throw error;
                
                const savedEvent = data && data[0] ? { ...event, ...data[0] } : event;
                const mappedSavedEvent = {
                    ...savedEvent,
                    isStartingDay: (savedEvent as any).is_starting_day,
                    isFinalDay: (savedEvent as any).is_final_day,
                    isMultiDay: (savedEvent as any).is_multi_day
                };

                setEvents(prev => prev.map(e => e.id === event.id ? mappedSavedEvent : e));
                alert('Evento salvo com sucesso!');
                return mappedSavedEvent;
            }
        } catch (error: any) {
            console.error('--- PERSISTENCE GLOBAL ERROR ---', error);
            alert(`Erro ao salvar evento: ${error.message || 'Erro desconhecido'}`);
            throw error;
        }
    };

    const handleDeleteEventAcrossApp = async (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        if (eventId.length >= 20 && isAdmin) {
            try { 
                invalidateSessionCache();
                await supabase.from('events').delete().eq('id', eventId); 
            } catch (e) { console.error('Error deleting event:', e); }
        }
    };

    const handleEventClosure = async (eventId: string, results: PlayerResult[], stats: { totalRebuys: number, totalAddons: number, totalPrize: number }) => {
        try {
            const eventToUpdate = events.find(e => e.id === eventId);
            if (!eventToUpdate) return;
            const updatedEvent: Event = { ...eventToUpdate, status: 'closed', results, totalRebuys: stats.totalRebuys, totalAddons: stats.totalAddons, totalPrize: stats.totalPrize };
            setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
            if (isAdmin && eventId.length >= 20) {
                try {
                    invalidateSessionCache();
                    await supabase.from('events').update({ status: 'closed', results, total_rebuys: stats.totalRebuys, total_addons: stats.totalAddons, total_prize: stats.totalPrize }).eq('id', eventId);

                    // Award 5 EXP to each participant with a userId
                    const participantIds = results.filter(r => r.userId).map(r => r.userId);
                    if (participantIds.length > 0) {
                        await supabase.rpc('bulk_add_event_exp', {
                            p_user_ids: participantIds,
                            p_exp_amount: 5
                        });
                    }
                } catch (e) {
                    console.error('Error closing event:', e);
                }
            }

            if (results && !eventToUpdate.isStartingDay && eventToUpdate.gameMode !== 'cash_game') {
                for (const r of results) {
                    if (r.userId) {
                        let slug = 'tournament_result';
                        let defaultSubject = 'Resultado do Torneio';
                        let defaultContent = `Parabéns! Você ficou em ${r.position}º lugar no ${eventToUpdate.title}.`;

                        if (r.position === 1) {
                            slug = 'tournament_win_1';
                            defaultSubject = '🏆 Grande Campeão!';
                            defaultContent = `Incrível! Você venceu o ${eventToUpdate.title}! Parabéns pela cravada fenomenal, você jogou muito!`;

                            try {
                                await supabase.functions.invoke('send-push-notification', {
                                    body: {
                                        userIds: r.userId,
                                        title: '🏆 Você é o grande campeão!',
                                        message: `Cravada fenomenal! Você venceu o ${eventToUpdate.title}. Parabéns!`
                                    }
                                });
                            } catch (e) {
                                console.error('Error sending win push:', e);
                            }
                        } else if (r.position === 2) {
                            slug = 'tournament_win_2';
                            defaultSubject = '🥈 Vice-Campeão';
                            defaultContent = `Excelente desempenho! Você foi vice-campeão do ${eventToUpdate.title}. Quase lá!`;

                            try {
                                await supabase.functions.invoke('send-push-notification', {
                                    body: {
                                        userIds: r.userId,
                                        title: '🥈 Vice-Campeão!',
                                        message: `Parabéns pelo 2º lugar no ${eventToUpdate.title}! Jogou muito!`
                                    }
                                });
                            } catch (e) {
                                console.error('Error sending win push:', e);
                            }
                        } else if (r.position === 3) {
                            slug = 'tournament_win_3';
                            defaultSubject = '🥉 Pódio Garantido';
                            defaultContent = `Bom jogo! Você subiu ao pódio e garantiu o 3º lugar no ${eventToUpdate.title}. Parabéns!`;

                            try {
                                await supabase.functions.invoke('send-push-notification', {
                                    body: {
                                        userIds: r.userId,
                                        title: '🥉 Você está no Pódio!',
                                        message: `Excelente jogo! Garantiu o 3º lugar no ${eventToUpdate.title}.`
                                    }
                                });
                            } catch (e) {
                                console.error('Error sending win push:', e);
                            }
                        }

                        const templateExists = systemMessageTemplates.some(t => t.id === slug && t.is_active);
                        if (templateExists) {
                            await sendTemplatedMessage(slug, r.userId, { tournament_name: eventToUpdate.title, position: r.position });
                        } else if (r.position <= 3) {
                            await supabase.from('messages').insert({
                                user_id: r.userId,
                                sender: 'Chip Race',
                                subject: defaultSubject,
                                content: defaultContent,
                                category: 'system',
                                is_read: false
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error in event closure messages:', e);
        }
    };

    const handleUpdateRankingMeta = async (rankingId: string, updates: Partial<RankingInstance>) => {
        const ranking = rankings.find(r => r.id === rankingId);
        if (!ranking) return;
        const fullRanking = { ...ranking, ...updates };
        setRankings(prev =>
            prev.map(r => r.id === rankingId ? fullRanking : r)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
        );
        if (isAdmin) {
            invalidateSessionCache();
            const dbData: any = {
                label: fullRanking.label,
                description: fullRanking.description,
                rules: fullRanking.rules,
                start_date: fullRanking.startDate,
                end_date: fullRanking.endDate,
                prize_info_title: fullRanking.prizeInfoTitle,
                prize_info_detail: fullRanking.prizeInfoDetail,
                scoring_schema_map: fullRanking.scoringSchemaMap,
                is_active: fullRanking.isActive,
                brl_reward: fullRanking.brlReward,
                chipz_reward: fullRanking.chipzReward,
                badge_template_id: fullRanking.badgeTemplateId,
                position_prizes: fullRanking.positionPrizes,
                order: fullRanking.order || 0
            };
            await supabase.from('rankings').upsert({ id: rankingId, ...dbData }, { onConflict: 'id' });
        }
    };

    const handleUpdateGlobalSchemas = async (schemas: ScoringSchema[]) => {
        setGlobalScoringSchemas(schemas);
        if (!isAdmin || !schemas) return;

        try {
            invalidateSessionCache();
            // 1. Identificar e remover schemas excluídos
            const { data: dbSchemas, error: fetchError } = await supabase.from('scoring_schemas').select('id');
            if (fetchError) throw fetchError;

            const currentIdsInDB = schemas.map(s => s.id).filter(id => !id.startsWith('schema-') && id !== 'default');
            const idsToDelete = (dbSchemas || [])
                .map(d => d.id)
                .filter(id => !currentIdsInDB.includes(id));

            if (idsToDelete.length > 0) {
                const { error: delError } = await supabase.from('scoring_schemas').delete().in('id', idsToDelete);
                if (delError) throw delError;
            }

            // 2. Salvar ou atualizar cada schema
            const updatedSchemas = [...schemas];
            for (let i = 0; i < updatedSchemas.length; i++) {
                const s = updatedSchemas[i];
                const isNew = s.id.startsWith('schema-') || s.id === 'default';

                const dbData: any = {
                    name: s.name,
                    criteria: s.criteria || [],
                    position_points: s.positionPoints || {}
                };

                if (isNew) {
                    const { data: inserted, error: insError } = await supabase
                        .from('scoring_schemas')
                        .insert([dbData])
                        .select()
                        .single();

                    if (insError) throw insError;
                    if (inserted) {
                        updatedSchemas[i] = {
                            ...s,
                            id: inserted.id
                        };
                    }
                } else {
                    const { error: upsError } = await supabase
                        .from('scoring_schemas')
                        .upsert({ id: s.id, ...dbData }, { onConflict: 'id' });

                    if (upsError) throw upsError;
                }
            }

            // Atualiza o estado global com os IDs finais resolvidos do banco
            setGlobalScoringSchemas(updatedSchemas);

        } catch (e) {
            console.error('Error updating schemas:', e);
            // feedback visual para o admin em caso de erro crítico
            window.alert('Erro ao sincronizar fórmulas com o banco de dados. Verifique sua conexão.');
        }
    };

    const handleAddRanking = async () => {
        const newR: RankingInstance = { id: `custom-${Date.now()}`, label: 'Novo Ranking', description: '', rules: '', order: 0, players: [] };
        setRankings(prev => [...prev, newR]);
        if (isAdmin) handleUpdateRankingMeta(newR.id, newR);
    };

    const handleDeleteRanking = async (id: string) => {
        if (!window.confirm('Excluir ranking permanentemente? Esta ação não pode ser desfeita.')) return;
        setRankings(prev => prev.filter(r => r.id !== id));
        if (isAdmin) {
            invalidateSessionCache();
            const { error } = await supabase.from('rankings').delete().eq('id', id);
            if (error) {
                console.error('Error deleting ranking:', error);
                alert('Erro ao excluir ranking do banco de dados.');
            }
        }
    };

    const handleAwardBadge = async (badge: { user_id: string; badge_template_id?: string; title: string; description?: string; icon?: string; color?: string }) => {
        if (!isAdmin) return { error: 'not_admin' };

        // 1. Check for duplicates if badge_template_id is provided
        if (badge.badge_template_id) {
            const { data: existing } = await supabase.from('user_badges')
                .select('id')
                .eq('user_id', badge.user_id)
                .eq('badge_template_id', badge.badge_template_id)
                .maybeSingle();

            if (existing) {
                console.warn(`User ${badge.user_id} already has badge ${badge.badge_template_id}`);
                return { error: 'already_exists' };
            }
        }

        invalidateSessionCache();
        const { error } = await supabase.from('user_badges').insert(badge);
        return { error };
    };

    const handleUpdateRankingPrize = (rankingId: string, rank: number, newPrize: string) => {
        setRankings(prev => {
            const updated = prev.map(r => {
                if (r.id === rankingId) {
                    const updatedPrizes = { ...(r.positionPrizes || {}), [rank]: newPrize };

                    // Persist to DB if admin
                    if (isAdmin) {
                        invalidateSessionCache();
                        supabase.from('rankings').update({ position_prizes: updatedPrizes }).eq('id', rankingId).then(({ error }) => {
                            if (error) console.error('Error updating position prizes:', error);
                        });
                    }

                    return { ...r, positionPrizes: updatedPrizes };
                }
                return r;
            });
            return updated;
        });
    };

    const handleUpdateTotalQualifiers = async (value: number | null) => {
        setCustomTotalQualifiers(value);
        if (isAdmin) {
            invalidateSessionCache();
            await supabase.from('content_db').upsert({ key: 'total_qualifiers', value }, { onConflict: 'key' });
        }
    };

    const handleUpdateMonth = async (index: number, field: keyof MonthData, value: any) => {
        const newM = [...months];
        newM[index] = { ...newM[index], [field]: value };
        setMonths(newM);
        if (isAdmin) {
            invalidateSessionCache();
            await supabase.from('content_db').upsert({ key: 'months', value: newM }, { onConflict: 'key' });
        }
    };

    const handleToggleMonthStatus = (index: number) => {
        const statuses: ('active' | 'completed' | 'locked')[] = ['locked', 'active', 'completed'];
        const currentIdx = statuses.indexOf(months[index].status);
        handleUpdateMonth(index, 'status', statuses[(currentIdx + 1) % 3]);
    };

    const getAllUniquePlayers = () => {
        const unique = new Map<string, any>();
        [...rankings.flatMap(r => r.players), ...allProfiles].forEach(p => {
            if (!p.name) return;
            const key = p.name.toLowerCase().trim();
            if (!unique.has(key) || (p.id && !unique.get(key).id)) unique.set(key, p);
        });
        if (isLoggedIn && currentUser.name) unique.set(currentUser.name.toLowerCase().trim(), { ...currentUser, id: currentUserId });
        return Array.from(unique.values());
    };

    const handleNavigateToPlayerByNameInternal = (name: string) => {
        const uniquePlayers = getAllUniquePlayers();
        const targetSlug = createProfileSlug(name);

        let player = uniquePlayers.find(p => {
            const dbSlug = createProfileSlug(p.name);
            return dbSlug === targetSlug || p.name.toLowerCase().trim() === targetSlug.replace(/-/g, ' ');
        });

        // Fallback: Se não encontrou nos perfis mas o nome bate com o usuário logado
        if (!player && isLoggedIn && currentUser.name) {
            const currentSlug = createProfileSlug(currentUser.name);
            if (currentSlug === targetSlug || currentUser.name.toLowerCase() === targetSlug.replace(/-/g, ' ')) {
                player = { ...currentUser, id: currentUserId || currentUser.id };
            }
        }

        if (!player) {
            setSelectedPlayer({ isNotFound: true, name: name.replace(/-/g, ' ') } as any);
        } else {
            setSelectedPlayer(player);
        }
        setCurrentView('profile');
    };

    const handleNavigateToPlayerByName = (name: string) => {
        const urlSlug = createProfileSlug(name);
        navigate(`/perfil/${urlSlug}`);
        window.scrollTo(0, 0);
    };

    // Message/poll handlers — delegated to useMessages hook, wrapped here with admin guard:
    const handleCreatePoll = async (question: string, options: string[]) => {
        if (!isAdmin) return;
        await hookCreatePoll(question, options);
    };

    const handleVoteOnPoll = async (pollId: string, optionIndex: number) => {
        if (!isLoggedIn || !currentUserId) return;
        await hookVoteOnPoll(pollId, optionIndex);
    };

    const handleSendAdminMessage = async (subject: string, content: string, category: MessageCategory = 'admin', pollId?: string, targetUserId?: string) => {
        if (!isAdmin) return;
        await hookSendAdminMessage(subject, content, category, pollId, targetUserId);
    };

    const handleSendMessage = async (toPlayerName: string, content: string, targetUserId?: string) => {
        await hookSendMessage(toPlayerName, content);
    };

    const invalidateSessionCache = () => {
        try {
            sessionStorage.removeItem('cr_app_raw_data_cache_v2');
            console.log('--- SESSION CACHE INVALIDATED ---');
        } catch (e) {
            console.error('Error clearing session cache:', e);
        }
    };

    const updateContent = async (section: keyof ContentDB, field: string, value: any) => {
        const newSec = field === '' ? value : { ...contentDB[section], [field]: value };
        setContentDB(prev => ({ ...prev, [section]: newSec }));
        if (isAdmin) {
            invalidateSessionCache();
            await supabase.from('content_db').upsert({ key: section, value: newSec }, { onConflict: 'key' });
        }
    };

    const updateCategory = async (index: number, updates: Partial<TournamentCategory>) => {
        const newCats = [...contentDB.categories];
        const oldId = newCats[index].id;
        newCats[index] = { ...newCats[index], ...updates };
        setContentDB(prev => ({ ...prev, categories: newCats }));
        if (isAdmin) {
            invalidateSessionCache();
            const { error } = await supabase.from('ecosystem_categories').update(updates).eq('id', oldId);
            if (error) console.error('Error updating category:', error);
        }
    };

    const addCategory = async (category: TournamentCategory) => {
        setContentDB(prev => ({ ...prev, categories: [...prev.categories, category] }));
        if (isAdmin) {
            invalidateSessionCache();
            const { error } = await supabase.from('ecosystem_categories').insert([category]);
            if (error) console.error('Error adding category:', error);
        }
    };

    const deleteCategory = async (id: string) => {
        setContentDB(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
        if (isAdmin) {
            invalidateSessionCache();
            const { error } = await supabase.from('ecosystem_categories').delete().eq('id', id);
            if (error) console.error('Error deleting category:', error);
        }
    };

    return (
        <AppContext.Provider value={{
            currentView, setCurrentView, isAdmin, isStaff, isLoggedIn, currentUserId, currentUser, events, isLoading, rankings: calculatedRankings, contentDB, globalScoringSchemas,
            allProfiles, experienceLevels, dailyRewards, badgeTemplates, badgeDistribution, systemMessageTemplates, prizeLabel, totalQualifiers, customTotalQualifiers, nextGoal,
            messages, unreadCount, polls, pollVotesByCurrentUser, newNotification, selectedPlayer, setSelectedPlayer, months, vipPlans, userReservations,
            handleNavigate, handleLogin, handleLogout, handlePlayerSelect, handleProfileUpdate, handleSaveEvent, handleDeleteEventAcrossApp,
            handleEventClosure, handleUpdateRankingMeta, handleUpdateGlobalSchemas, handleUpdateSystemMessageTemplate, handleCreateSystemMessageTemplate, handleAddRanking, handleDeleteRanking, handleAwardBadge,
            handleUpdateRankingPrize, handleUpdateTotalQualifiers, handleUpdateMonth, handleToggleMonthStatus,
            handleNavigateToPlayerByName, handleCreatePoll, handleVoteOnPoll, handleSendAdminMessage, handleSendMessage, handleReplyMessage,
            handleMarkAsRead, handleDeleteMessage, handleCreateBadgeTemplate, handleUpdateBadgeTemplate, updateContent, updateCategory, addCategory, deleteCategory, setNewNotification, getAllUniquePlayers,
            setEvents, setExperienceLevels, setDailyRewards,
            isFlyerOpen, setIsFlyerOpen,
            refreshSupabaseData: async () => {
                await fetchSupabaseData(true);
                if (currentUserId) await fetchProfile(currentUserId);
            }
        }}>
            {children}
        </AppContext.Provider>
    );
};
