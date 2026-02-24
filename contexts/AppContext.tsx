import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import {
    RankingPlayer, MonthData, Message, ContentDB, TournamentCategory,
    Event, PlayerResult, PlayerStats, RankingInstance, ScoringSchema,
    ExperienceLevel, DailyReward, Poll, MessageCategory, BadgeTemplate
} from '../types';
import { calculatePoints } from '../utils/scoring';
import appConfig from '../src/config/appConfig.json';

interface AppContextType {
    currentView: string;
    setCurrentView: (view: string) => void;
    isAdmin: boolean;
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
    prizeLabel: string;
    totalQualifiers: number;
    customTotalQualifiers: number | null;
    nextGoal: { prize: number; qualifiers: number };
    messages: Message[];
    unreadCount: number;
    polls: Poll[];
    pollVotesByCurrentUser: Record<string, number>;
    newNotification: Message | null;
    selectedPlayer: RankingPlayer | null;
    setSelectedPlayer: (player: RankingPlayer | null) => void;
    months: MonthData[];

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
    handleAddRanking: () => Promise<void>;
    handleDeleteRanking: (id: string) => Promise<void>;
    handleAwardBadge: (badge: { user_id: string; title: string; description: string; icon: string; ranking_id: string }) => Promise<void>;
    handleFinalizeRanking: (rankingId: string, targetUserId?: string, customJustification?: string) => Promise<void>;
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
    updateContent: (section: keyof ContentDB, field: string, value: any) => Promise<void>;
    updateCategory: (index: number, field: keyof TournamentCategory, value: any) => Promise<void>;
    setNewNotification: (msg: Message | null) => void;
    getAllUniquePlayers: () => RankingPlayer[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    setExperienceLevels: React.Dispatch<React.SetStateAction<ExperienceLevel[]>>;
    setDailyRewards: React.Dispatch<React.SetStateAction<DailyReward[]>>;
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
    const [currentView, setCurrentView] = useState('home');
    const [isAdmin, setIsAdmin] = useState(false);
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
    const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);

    const [prizeLabel, setPrizeLabel] = useState(appConfig.initialDefaults.applicationDefaults.prizeLabel);
    const [totalQualifiers, setTotalQualifiers] = useState(appConfig.initialDefaults.applicationDefaults.totalQualifiers);
    const [customTotalQualifiers, setCustomTotalQualifiers] = useState<number | null>(null);
    const [nextGoal, setNextGoal] = useState(appConfig.initialDefaults.applicationDefaults.nextGoal);
    const [months, setMonths] = useState<MonthData[]>(appConfig.initialDefaults.months as MonthData[]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [pollVotesByCurrentUser, setPollVotesByCurrentUser] = useState<Record<string, number>>({});
    const [newNotification, setNewNotification] = useState<Message | null>(null);
    const notificationTimer = useRef<any>(null);

    const fetchSupabaseData = async () => {
        setIsLoading(true);
        try {
            const { data: rankingsData } = await supabase.from('rankings').select('*');
            if (rankingsData) {
                setRankings(rankingsData.map(r => ({
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
                    players: []
                })));
            }

            const { data: templatesData } = await supabase.from('badge_templates').select('*');
            if (templatesData) setBadgeTemplates(templatesData);

            const { data: schemasData } = await supabase.from('scoring_schemas').select('*');
            if (schemasData) {
                setGlobalScoringSchemas(schemasData.map(s => ({
                    id: s.id,
                    name: s.name,
                    criteria: s.criteria || [],
                    positionPoints: s.position_points || {}
                })));
            }

            const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
            if (eventsData) {
                setEvents(eventsData.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    time: e.time,
                    type: e.type,
                    buyin: e.buyin,
                    guaranteed: e.guaranteed,
                    status: e.status,
                    rankingType: e.ranking_type,
                    includedRankings: e.included_rankings,
                    description: e.description,
                    stack: e.stack,
                    blinds: e.blinds,
                    lateReg: e.late_reg,
                    location: e.location,
                    rebuyValue: e.rebuy_value,
                    rebuyChips: e.rebuy_chips,
                    addonValue: e.addon_value,
                    addonChips: e.addon_chips,
                    staffBonusValue: e.staff_bonus_value,
                    staff_bonus_chips: e.staff_bonus_chips,
                    timeChipValue: e.time_chip_value,
                    timeChipChips: e.time_chip_chips,
                    flyerUrl: e.flyer_url,
                    doubleRebuyValue: e.double_rebuy_value,
                    doubleRebuyChips: e.double_rebuy_chips,
                    doubleAddonValue: e.double_addon_value,
                    doubleAddonChips: e.double_addon_chips,
                    parallelProducts: e.parallel_products,
                    results: e.results,
                    totalRebuys: e.total_rebuys,
                    totalAddons: e.total_addons,
                    totalPrize: e.total_prize,
                    scoringSchemaId: e.scoring_schema_id
                })));
            }

            const { data: contentData } = await supabase.from('content_db').select('*');
            if (contentData) {
                contentData.forEach(item => {
                    if (item.key === 'hero') setContentDB(prev => ({ ...prev, hero: item.value }));
                    else if (item.key === 'details') setContentDB(prev => ({ ...prev, details: item.value }));
                    else if (item.key === 'faq') setContentDB(prev => ({ ...prev, faq: item.value }));
                    else if (item.key === 'timeline') setContentDB(prev => ({ ...prev, timeline: item.value }));
                    else if (item.key === 'months') setMonths(item.value);
                    else if (item.key === 'total_qualifiers') setCustomTotalQualifiers(item.value);
                });
            }

            const { data: ecoCategoriesData } = await supabase.from('ecosystem_categories').select('*').order('order', { ascending: true });
            if (ecoCategoriesData) setContentDB(prev => ({ ...prev, categories: ecoCategoriesData }));

            const { data: profilesData } = await supabase.from('profiles_public').select('*');
            if (profilesData) {
                setAllProfiles(profilesData.map(p => ({
                    id: p.id,
                    numericId: p.numeric_id,
                    rank: 0,
                    name: p.name || 'Usuário',
                    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name || 'U'}&background=random`,
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
                    isVerified: p.is_verified || false
                })));
            }

            const { data: expLevelsData } = await supabase.from('experience_levels').select('*').order('level', { ascending: true });
            if (expLevelsData) setExperienceLevels(expLevelsData);

            const { data: dailyRewardsData } = await supabase.from('daily_rewards').select('*').order('day', { ascending: true });
            if (dailyRewardsData) setDailyRewards(dailyRewardsData);

        } catch (error) {
            console.error('Error fetching Supabase data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase.from('profiles').select('*, total_pending_debt').eq('id', userId).single();
            if (error) throw error;
            if (data) {
                const userIsAdmin = data.role === 'admin' || data.role === 'staff';
                setIsAdmin(userIsAdmin);
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
                    totalPendingDebt: data.total_pending_debt || 0,
                    debtLimitBrl: data.debt_limit_brl || 0,
                    isVerified: data.is_verified || false,
                    badges: []
                };
                const { data: userBadges } = await supabase.from('user_badges').select('*').eq('user_id', userId).order('awarded_at', { ascending: false });
                if (userBadges) userData.badges = userBadges;
                setCurrentUser(userData);
            }
        } catch (error) { console.error('Error fetching profile:', error); }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const { data } = await supabase.from('messages').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('created_at', { ascending: false });
            if (data) {
                const formatted: Message[] = data.map(m => ({
                    id: m.id,
                    from: m.sender || 'Chip Race',
                    senderId: m.sender_id,
                    subject: m.subject || 'Notificação',
                    content: m.content || '',
                    date: new Date(m.created_at || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                    read: m.is_read || false,
                    category: m.category || 'system',
                    pollId: m.poll_id
                }));
                setMessages(formatted);
                setUnreadCount(formatted.filter(m => !m.read).length);
            }
        } catch (e) { console.error('Error fetching messages:', e); }
    };

    const fetchPolls = async () => {
        try {
            const { data } = await supabase.from('polls').select('*').eq('active', true);
            if (!data) return;
            const { data: allVotes } = await supabase.from('poll_votes').select('poll_id, option_index').in('poll_id', data.map(p => p.id));
            const enriched = data.map(poll => {
                const pollVotes = (allVotes || []).filter(v => v.poll_id === poll.id);
                const opts: string[] = Array.isArray(poll.options) ? poll.options : [];
                const vote_counts = opts.map((_, i) => pollVotes.filter(v => v.option_index === i).length);
                return { ...poll, vote_counts };
            });
            setPolls(enriched);
        } catch (e) { console.error('Error fetching polls:', e); }
    };

    const fetchUserPollVotes = async (userId: string) => {
        try {
            const { data } = await supabase.from('poll_votes').select('poll_id, option_index').eq('user_id', userId);
            if (data) {
                const votesMap: Record<string, number> = {};
                data.forEach(v => { votesMap[v.poll_id] = v.option_index; });
                setPollVotesByCurrentUser(votesMap);
            }
        } catch (e) { console.error('Error fetching user votes:', e); }
    };

    useEffect(() => {
        fetchSupabaseData();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                fetchProfile(session.user.id);
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                fetchProfile(session.user.id);
            } else {
                setIsLoggedIn(false);
                setCurrentUserId(null);
                setCurrentUser({});
                setIsAdmin(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!isLoggedIn || !currentUserId) return;
        fetchMessages(currentUserId);
        fetchPolls();
        fetchUserPollVotes(currentUserId);

        const msgChannel = supabase.channel('realtime-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const m = payload.new as any;
                if (!m.user_id || m.user_id === currentUserId) {
                    const newMsg: Message = {
                        id: m.id, from: m.sender || 'Chip Race', senderId: m.sender_id, subject: m.subject || 'Notificação',
                        content: m.content || '', date: new Date(m.created_at || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                        read: false, category: m.category || 'system', pollId: m.poll_id
                    };
                    if (notificationTimer.current) clearTimeout(notificationTimer.current);
                    setNewNotification(newMsg);
                    notificationTimer.current = setTimeout(() => setNewNotification(null), 8000);
                    fetchMessages(currentUserId);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchMessages(currentUserId))
            .subscribe();

        return () => { supabase.removeChannel(msgChannel); if (notificationTimer.current) clearTimeout(notificationTimer.current); };
    }, [isLoggedIn, currentUserId]);

    useEffect(() => {
        if (!events || events.length === 0 || !allProfiles || allProfiles.length === 0 || !rankings || rankings.length === 0) return;
        const metadataMap = new Map<string, RankingPlayer>();
        const metadataByIdMap = new Map<string, RankingPlayer>();
        allProfiles.forEach(p => {
            if (p.name) metadataMap.set(p.name.toLowerCase().trim(), p);
            if (p.id) metadataByIdMap.set(p.id, p);
        });

        let hasChanges = false;
        const updatedRankings = rankings.map(ranking => {
            const playerMap = new Map<string, RankingPlayer>();
            events.forEach(ev => {
                const included = ev.includedRankings || ['annual', 'quarterly', 'legacy'];
                if (ev.status === 'closed' && ev.results && included.includes(ranking.id)) {
                    const mappedSchemaId = (ev.rankingType && ranking.scoringSchemaMap) ? ranking.scoringSchemaMap[ev.rankingType] : ev.scoringSchemaId;
                    ev.results.forEach((r: any) => {
                        const profile = (r.userId ? metadataByIdMap.get(r.userId) : null) || metadataMap.get(r.name.toLowerCase().trim());
                        const playerKey = r.userId || r.name;
                        if (!playerMap.has(playerKey)) {
                            playerMap.set(playerKey, {
                                id: profile?.id || r.userId, numericId: profile?.numericId, rank: 0,
                                name: profile?.name || r.name, avatar: profile?.avatar || `https://ui-avatars.com/api/?name=${r.name.replace(' ', '+')}&background=random`,
                                city: profile?.city || 'Venâncio Aires - RS', points: 0, change: 'same',
                                isVip: profile?.isVip || r.isVip || false, vipStatus: profile?.vipStatus || 'nao_vip',
                                social: profile?.social, bio: profile?.bio, level: profile?.level, currentExp: profile?.currentExp,
                                nextLevelExp: profile?.nextLevelExp, gallery: profile?.gallery, playStyles: profile?.playStyles
                            });
                        }
                        const p = playerMap.get(playerKey)!;
                        p.points += calculatePoints(ev.rankingType || 'weekly', ev.results?.length || 0, Number((ev.buyin?.toString() || '0').replace(/[^0-9]/g, '')) || 0, r.position, r.prize, r.isVip, mappedSchemaId, globalScoringSchemas);
                    });
                }
            });
            const sortedPlayers = Array.from(playerMap.values()).sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));
            if (JSON.stringify(sortedPlayers) !== JSON.stringify(ranking.players)) { hasChanges = true; return { ...ranking, players: sortedPlayers }; }
            return ranking;
        });
        if (hasChanges) setRankings(updatedRankings);
    }, [events, allProfiles, globalScoringSchemas, rankings]);

    useEffect(() => {
        const completedMonths = months.filter(m => m.status === 'completed');
        let currentPrizeVal = 30000;
        if (completedMonths.length > 0) {
            const lastCompleted = completedMonths[completedMonths.length - 1];
            setPrizeLabel(lastCompleted.prize);
            const numericPrize = parseInt(lastCompleted.prize.replace(/\D/g, ''));
            if (!isNaN(numericPrize)) currentPrizeVal = numericPrize * 1000;
        } else { setPrizeLabel('30K+'); }

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
        setCurrentView(view);
        window.scrollTo(0, 0);
    };

    const handleLogin = () => handleNavigate('home');
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setIsAdmin(false);
        handleNavigate('home');
    };

    const handlePlayerSelect = (player: RankingPlayer) => {
        setSelectedPlayer(player);
        setCurrentView('profile');
        window.scrollTo(0, 0);
    };

    const handleProfileUpdate = async (targetId: string, updatedData: PlayerStats) => {
        if (targetId === currentUserId) setCurrentUser(prev => ({ ...prev, ...updatedData }));
        setRankings(prev => prev.map(r => ({ ...r, players: r.players.map(p => p.id === targetId ? { ...p, ...updatedData } : p) })));
        setAllProfiles(prev => prev.map(p => p.id === targetId ? { ...p, ...updatedData } : p));
        if (selectedPlayer?.id === targetId) setSelectedPlayer(prev => prev ? { ...prev, ...updatedData } : null);

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        if (currentUserId && targetId && isUUID) {
            try {
                if (targetId !== currentUserId && !isAdmin) { alert("Sem permissão"); return; }
                const { error } = await supabase.from('profiles').update({
                    name: updatedData.name, avatar_url: updatedData.avatar, city: updatedData.city, bio: updatedData.bio,
                    social: updatedData.social || {}, play_styles: updatedData.playStyles || [], gallery: updatedData.gallery || [],
                    level: updatedData.level || 1,
                    current_exp: updatedData.currentExp || 0,
                    next_level_exp: updatedData.nextLevelExp || 1000,
                    last_daily_claim: updatedData.lastDailyClaim || null, daily_streak: updatedData.dailyStreak || 0,
                    is_vip: updatedData.isVip || false,
                    vip_status: updatedData.vipStatus || 'nao_vip',
                    vip_expires_at: updatedData.vipExpiresAt || null,
                    is_verified: updatedData.isVerified || false
                }).eq('id', targetId);
                if (error) throw error;
            } catch (e) { console.error('Error saving profile:', e); }
        }
    };

    const handleSaveEvent = async (event: Event) => {
        const isNew = !events.some(e => e.id === event.id) || event.id.length < 20;
        const dbData: any = {
            title: event.title, date: event.date, time: event.time, type: event.type, buyin: event.buyin, guaranteed: event.guaranteed,
            status: event.status, ranking_type: event.rankingType, included_rankings: event.includedRankings, description: event.description,
            stack: event.stack, blinds: event.blinds, late_reg: event.lateReg, location: event.location, rebuy_value: event.rebuyValue,
            rebuy_chips: event.rebuyChips, addon_value: event.addonValue, addon_chips: event.addonChips, staff_bonus_value: event.staffBonusValue,
            staff_bonus_chips: event.staffBonusChips, time_chip_value: event.timeChipValue, time_chip_chips: event.timeChipChips, flyer_url: event.flyerUrl,
            double_rebuy_value: event.doubleRebuyValue, double_rebuy_chips: event.doubleRebuyChips, double_addon_value: event.doubleAddonValue,
            double_addon_chips: event.doubleAddonChips, parallel_products: event.parallelProducts, results: event.results,
            total_rebuys: event.totalRebuys, total_addons: event.totalAddons, total_prize: event.totalPrize, scoring_schema_id: event.scoringSchemaId
        };
        try {
            if (isNew) {
                const { data, error } = await supabase.from('events').insert([dbData]).select();
                if (error) throw error;
                if (data && data[0]) setEvents(prev => [...prev.filter(e => e.id !== event.id), { ...event, id: data[0].id }]);
            } else {
                const { error } = await supabase.from('events').update(dbData).eq('id', event.id);
                if (error) throw error;
                setEvents(prev => prev.map(e => e.id === event.id ? event : e));
            }
        } catch (e) { console.error('Error saving event:', e); }
    };

    const handleDeleteEventAcrossApp = async (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        if (eventId.length >= 20 && isAdmin) {
            try { await supabase.from('events').delete().eq('id', eventId); } catch (e) { console.error('Error deleting event:', e); }
        }
    };

    const handleEventClosure = async (eventId: string, results: PlayerResult[], stats: { totalRebuys: number, totalAddons: number, totalPrize: number }) => {
        const eventToUpdate = events.find(e => e.id === eventId);
        if (!eventToUpdate) return;
        const updatedEvent: Event = { ...eventToUpdate, status: 'closed', results, totalRebuys: stats.totalRebuys, totalAddons: stats.totalAddons, totalPrize: stats.totalPrize };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        if (isAdmin && eventId.length >= 20) {
            try { await supabase.from('events').update({ status: 'closed', results, total_rebuys: stats.totalRebuys, total_addons: stats.totalAddons, total_prize: stats.totalPrize }).eq('id', eventId); } catch (e) { console.error('Error closing event:', e); }
        }
        if (results) {
            results.forEach(r => {
                if (r.userId) supabase.from('messages').insert({ user_id: r.userId, sender: 'Chip Race', subject: '🏆 Resultado de Torneio', content: `${eventToUpdate.title} encerrado, você terminou na posição ${r.position}!`, category: 'tournament', is_read: false });
            });
        }
    };

    const handleUpdateRankingMeta = async (rankingId: string, updates: Partial<RankingInstance>) => {
        const ranking = rankings.find(r => r.id === rankingId);
        if (!ranking) return;
        const fullRanking = { ...ranking, ...updates };
        setRankings(prev => prev.map(r => r.id === rankingId ? fullRanking : r));
        if (isAdmin) {
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
                position_prizes: fullRanking.positionPrizes
            };
            await supabase.from('rankings').upsert({ id: rankingId, ...dbData }, { onConflict: 'id' });
        }
    };

    const handleUpdateGlobalSchemas = async (schemas: ScoringSchema[]) => {
        setGlobalScoringSchemas(schemas);
        if (!isAdmin) return;
        try {
            const { data: dbSchemas } = await supabase.from('scoring_schemas').select('id');
            if (dbSchemas) {
                const currentIds = schemas.map(s => s.id);
                const idsToDelete = dbSchemas.map(d => d.id).filter(id => !currentIds.includes(id));
                if (idsToDelete.length > 0) await supabase.from('scoring_schemas').delete().in('id', idsToDelete);
            }
            for (const s of schemas) {
                const isTemp = s.id.startsWith('schema-') || s.id === 'default';
                const data: any = { name: s.name, criteria: s.criteria, position_points: s.positionPoints };
                if (!isTemp) await supabase.from('scoring_schemas').upsert({ id: s.id, ...data });
                else {
                    const { data: inserted } = await supabase.from('scoring_schemas').insert([data]).select();
                    if (inserted) setGlobalScoringSchemas(prev => prev.map(p => p.id === s.id ? { ...p, id: inserted[0].id } : p));
                }
            }
        } catch (e) { console.error('Error updating schemas:', e); }
    };

    const handleAddRanking = async () => {
        const newR: RankingInstance = { id: `custom-${Date.now()}`, label: 'Novo Ranking', description: '', rules: '', players: [] };
        setRankings(prev => [...prev, newR]);
        if (isAdmin) handleUpdateRankingMeta(newR.id, newR);
    };

    const handleDeleteRanking = async (id: string) => {
        if (!window.confirm('Excluir ranking?')) return;
        setRankings(prev => prev.filter(r => r.id !== id));
        if (isAdmin && !id.startsWith('custom-')) await supabase.from('rankings').delete().eq('id', id);
    };

    const handleAwardBadge = async (badge: { user_id: string; badge_template_id?: string; title: string; description?: string; icon?: string }) => {
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

        const { error } = await supabase.from('user_badges').insert(badge);
        return { error };
    };

    const handleFinalizeRanking = async (rankingId: string, targetUserId?: string, customJustification?: string) => {
        if (!isAdmin) return;
        const ranking = rankings.find(r => r.id === rankingId);
        if (!ranking || !ranking.isActive) return;
        const winner = targetUserId ? allProfiles.find(p => p.id === targetUserId) : ranking.players.find(p => p.rank === 1);
        if (!winner || !winner.id) return;
        if (!window.confirm(`Encerrar ${ranking.label}?`)) return;

        try {
            await supabase.from('rankings').update({ is_active: false }).eq('id', ranking.id);
            setRankings(prev => prev.map(r => r.id === rankingId ? { ...r, isActive: false } : r));

            // Send system message
            await supabase.from('messages').insert({
                user_id: winner.id,
                sender: 'Sistema',
                subject: '🏆 Ranking Vencido!',
                content: `Parabéns por vencer o ${ranking.label}! ${customJustification}`,
                category: 'gift'
            });

            // Award badge if configured
            if (ranking.badgeTemplateId) {
                const template = badgeTemplates.find(b => b.id === ranking.badgeTemplateId);
                if (template) {
                    await handleAwardBadge({
                        user_id: winner.id,
                        badge_template_id: template.id,
                        title: template.title,
                        description: customJustification || template.description,
                        icon: template.icon || 'emoji_events'
                    });
                }
            }

            // Award cash/chipz if configured
            if (ranking.brlReward || ranking.chipzReward) {
                await supabase.rpc('secure_balance_transaction', {
                    user_id: winner.id,
                    brl_amount: Number(ranking.brlReward) || 0,
                    chipz_amount: Number(ranking.chipzReward) || 0,
                    description: `Prêmio de 1º lugar no ranking ${ranking.label}`,
                    category: 'gift'
                });
            }

        } catch (e) { console.error('Error finalizing ranking:', e); }
    };

    const handleUpdateRankingPrize = (rankingId: string, rank: number, newPrize: string) => {
        setRankings(prev => {
            const updated = prev.map(r => {
                if (r.id === rankingId) {
                    const updatedPrizes = { ...(r.positionPrizes || {}), [rank]: newPrize };

                    // Persist to DB if admin
                    if (isAdmin) {
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
        if (isAdmin) await supabase.from('content_db').upsert({ key: 'total_qualifiers', value }, { onConflict: 'key' });
    };

    const handleUpdateMonth = async (index: number, field: keyof MonthData, value: any) => {
        const newM = [...months];
        newM[index] = { ...newM[index], [field]: value };
        setMonths(newM);
        if (isAdmin) await supabase.from('content_db').upsert({ key: 'months', value: newM }, { onConflict: 'key' });
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

    const handleNavigateToPlayerByName = (name: string) => {
        const player = getAllUniquePlayers().find(p => p.name.toLowerCase() === name.toLowerCase());
        setSelectedPlayer(player || { rank: 0, name, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`, city: '', points: 0, change: 'same' });
        setCurrentView('profile');
        window.scrollTo(0, 0);
    };

    const handleCreatePoll = async (question: string, options: string[]) => {
        if (!isAdmin) return;
        const { data } = await supabase.from('polls').insert([{ question, options, active: true }]).select();
        if (data) { setPolls(prev => [...prev, data[0]]); handleSendAdminMessage('Nova Enquete!', `"${question}"`, 'poll', data[0].id); }
    };

    const handleVoteOnPoll = async (pollId: string, optionIndex: number) => {
        if (!isLoggedIn || !currentUserId) return;
        const { error } = await supabase.from('poll_votes').upsert([{ poll_id: pollId, user_id: currentUserId, option_index: optionIndex }], { onConflict: 'poll_id,user_id' });
        if (!error) { setPollVotesByCurrentUser(prev => ({ ...prev, [pollId]: optionIndex })); alert('Voto OK!'); }
    };

    const handleSendAdminMessage = async (subject: string, content: string, category: MessageCategory = 'admin', pollId?: string, targetUserId?: string) => {
        if (!isAdmin) return;
        await supabase.from('messages').insert([{ sender: 'Admin', sender_id: currentUserId, subject, content, category, poll_id: pollId || null, user_id: targetUserId || null, is_read: false }]);
        if (currentUserId) fetchMessages(currentUserId);
    };

    const handleSendMessage = async (toPlayerName: string, content: string) => {
        if (!currentUserId || !currentUser.name) return;
        const { data: recipient } = await supabase.from('profiles').select('id').ilike('name', toPlayerName.trim()).single();
        if (recipient) {
            await supabase.from('messages').insert([{ sender: currentUser.name, sender_id: currentUserId, subject: `De ${currentUser.name}`, content, category: 'private', user_id: recipient.id, is_read: false }]);
            fetchMessages(currentUserId);
        }
    };

    const handleReplyMessage = (messageId: string, replyText: string) => {
        const orig = messages.find(m => m.id === messageId);
        if (orig?.from) handleSendMessage(orig.from, replyText);
    };

    const handleMarkAsRead = async (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await supabase.from('messages').update({ is_read: true }).eq('id', id);
    };

    const updateContent = async (section: keyof ContentDB, field: string, value: any) => {
        const newSec = field === '' ? value : { ...contentDB[section], [field]: value };
        setContentDB(prev => ({ ...prev, [section]: newSec }));
        if (isAdmin) await supabase.from('content_db').upsert({ key: section, value: newSec }, { onConflict: 'key' });
    };

    const updateCategory = async (index: number, field: keyof TournamentCategory, value: any) => {
        const newCats = [...contentDB.categories];
        newCats[index] = { ...newCats[index], [field]: value };
        setContentDB(prev => ({ ...prev, categories: newCats }));
        if (isAdmin) await supabase.from('ecosystem_categories').update({ [field]: value }).eq('id', newCats[index].id);
    };

    return (
        <AppContext.Provider value={{
            currentView, setCurrentView, isAdmin, isLoggedIn, currentUserId, currentUser, events, isLoading, rankings, contentDB, globalScoringSchemas,
            allProfiles, experienceLevels, dailyRewards, badgeTemplates, prizeLabel, totalQualifiers, customTotalQualifiers, nextGoal,
            messages, unreadCount, polls, pollVotesByCurrentUser, newNotification, selectedPlayer, setSelectedPlayer, months,
            handleNavigate, handleLogin, handleLogout, handlePlayerSelect, handleProfileUpdate, handleSaveEvent, handleDeleteEventAcrossApp,
            handleEventClosure, handleUpdateRankingMeta, handleUpdateGlobalSchemas, handleAddRanking, handleDeleteRanking, handleAwardBadge,
            handleFinalizeRanking, handleUpdateRankingPrize, handleUpdateTotalQualifiers, handleUpdateMonth, handleToggleMonthStatus,
            handleNavigateToPlayerByName, handleCreatePoll, handleVoteOnPoll, handleSendAdminMessage, handleSendMessage, handleReplyMessage,
            handleMarkAsRead, updateContent, updateCategory, setNewNotification, getAllUniquePlayers,
            setEvents, setExperienceLevels, setDailyRewards
        }}>
            {children}
        </AppContext.Provider>
    );
};
