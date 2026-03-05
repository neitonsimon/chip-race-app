import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import {
    RankingPlayer, MonthData, Message, ContentDB, TournamentCategory,
    Event, PlayerResult, PlayerStats, RankingInstance, ScoringSchema,
    ExperienceLevel, DailyReward, Poll, MessageCategory, BadgeTemplate, SystemMessageTemplate
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
    const [systemMessageTemplates, setSystemMessageTemplates] = useState<SystemMessageTemplate[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);

    const [prizeLabel, setPrizeLabel] = useState(appConfig.initialDefaults.applicationDefaults.prizeLabel);
    const [totalQualifiers, setTotalQualifiers] = useState(appConfig.initialDefaults.applicationDefaults.totalQualifiers);
    const [customTotalQualifiers, setCustomTotalQualifiers] = useState<number | null>(null);
    const [nextGoal, setNextGoal] = useState(appConfig.initialDefaults.applicationDefaults.nextGoal);
    const [months, setMonths] = useState<MonthData[]>(appConfig.initialDefaults.months as MonthData[]);
    const [vipPlans, setVipPlans] = useState<any[]>(appConfig.vip.plans);

    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [pollVotesByCurrentUser, setPollVotesByCurrentUser] = useState<Record<string, number>>({});
    const [newNotification, setNewNotification] = useState<Message | null>(null);
    const notificationTimer = useRef<any>(null);

    const fetchSupabaseData = async () => {
        setIsLoading(true);
        try {
            const [
                { data: rankingsData },
                { data: templatesData },
                { data: schemasData },
                { data: eventsData },
                { data: contentData },
                { data: ecoCategoriesData },
                { data: profilesData },
                { data: allUserBadges },
                { data: expLevelsData },
                { data: dailyRewardsData },
                { data: templatesMsgData }
            ] = await Promise.all([
                supabase.from('rankings').select('*'),
                supabase.from('badge_templates').select('*'),
                supabase.from('scoring_schemas').select('*'),
                supabase.from('events').select('*').order('date', { ascending: true }),
                supabase.from('content_db').select('*'),
                supabase.from('ecosystem_categories').select('*').order('order', { ascending: true }),
                supabase.from('profiles_public').select('id, numeric_id, name, avatar_url, city, is_vip, vip_status, vip_expires_at, social, bio, level, current_exp, next_level_exp, gallery, play_styles, is_verified, total_pending_debt, suprema_nickname, suprema_user_id'),
                supabase.from('user_badges').select('*, badge_templates(*)'),
                supabase.from('experience_levels').select('*').order('level', { ascending: true }),
                supabase.from('daily_rewards').select('*').order('day', { ascending: true }),
                supabase.from('system_message_templates').select('*')
            ]);

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
                setEvents(eventsData.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    time: e.time,
                    type: e.type,
                    modality: e.modality,
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
                    staffBonusChips: e.staff_bonus_chips,
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
                    scoringSchemaId: e.scoring_schema_id,
                    gameMode: e.game_mode,
                    cashGameType: e.cash_game_type,
                    cashGameBlinds: e.cash_game_blinds,
                    cashGameCapacity: e.cash_game_capacity,
                    cashGameMinMax: e.cash_game_min_max,
                    cashGameDinner: e.cash_game_dinner,
                    cashGameOpenBar: e.cash_game_open_bar,
                    cashGameNotes: e.cash_game_notes,
                    staffExpensesBrl: e.staff_expenses_brl || 0,
                    prizePayoutBrl: e.prize_payout_brl || 0,
                    is_hidden: e.is_hidden
                })));
            }

            if (contentData) {
                contentData.forEach(item => {
                    if (item.key === 'hero') setContentDB(prev => ({ ...prev, hero: item.value }));
                    else if (item.key === 'details') setContentDB(prev => ({ ...prev, details: item.value }));
                    else if (item.key === 'faq') setContentDB(prev => ({ ...prev, faq: item.value }));
                    else if (item.key === 'months') setMonths(item.value);
                    else if (item.key === 'total_qualifiers') setCustomTotalQualifiers(item.value);
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
                    isVerified: p.is_verified || false,
                    totalPendingDebt: p.total_pending_debt || 0,
                    suprema_nickname: p.suprema_nickname || undefined,
                    suprema_user_id: p.suprema_user_id || undefined,
                    badges: allUserBadges?.filter(ub => ub.user_id === p.id).map(ub => ({
                        ...ub,
                        color: ub.color // Ensure color is passed
                    })) || []
                })));
            }

            if (expLevelsData) setExperienceLevels(expLevelsData);

            if (dailyRewardsData) setDailyRewards(dailyRewardsData);

            if (templatesMsgData) setSystemMessageTemplates(templatesMsgData);

        } catch (error) {
            console.error('Error fetching Supabase data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase.from('profiles').select('*, total_pending_debt, locked_balance_brl, balance_unlock_date').eq('id', userId).single();
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
                    lockedBalanceBrl: data.locked_balance_brl ? Number(data.locked_balance_brl) : 0,
                    balanceUnlockDate: data.balance_unlock_date || null,
                    totalPendingDebt: data.total_pending_debt || 0,
                    debtLimitBrl: data.debt_limit_brl || 0,
                    isVerified: data.is_verified || false,
                    suprema_nickname: data.suprema_nickname || '',
                    suprema_user_id: data.suprema_user_id || '',
                    role: data.role,
                    badges: []
                };
                const { data: userBadges } = await supabase.from('user_badges').select('*, badge_templates(*)').eq('user_id', userId).order('awarded_at', { ascending: false });
                if (userBadges) userData.badges = userBadges;
                setCurrentUser(userData);
            }
        } catch (error) { console.error('Error fetching profile:', error); }
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

    const fetchMessages = async (userId: string) => {
        try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
            const isAdminRole = profile?.role === 'admin' || profile?.role === 'staff';

            const { data } = await supabase.from('messages').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('created_at', { ascending: false });
            if (data) {
                const filtered = data.filter(m => {
                    if (m.category === 'support' && !m.user_id) return isAdminRole;
                    return true;
                });

                const formatted: Message[] = filtered.map(m => ({
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
        } catch (e) {
            console.error('Error fetching messages:', e);
        }
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
        } catch (e) {
            console.error('Error fetching polls:', e);
        }
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
                // Check if we already sent the notification for this gaming day
                const { data: existingMsg } = await supabase.from('messages')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('subject', '⚙️ Sistema')
                    .ilike('content', '%Bônus de login diário disponível%')
                    .gte('created_at', dateStr + 'T21:00:00')
                    .limit(1);

                if (!existingMsg || existingMsg.length === 0) {
                    await sendTemplatedMessage('daily_login', userId);
                }
            }
        } catch (e) {
            console.error('Error in daily login check:', e);
        }
    };

    useEffect(() => {
        if (!isLoggedIn || !currentUserId) return;
        fetchMessages(currentUserId);
        fetchPolls();
        fetchUserPollVotes(currentUserId);

        const msgChannel = supabase.channel('realtime-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const m = payload.new as any;
                const isSupportToAdmin = m.category === 'support' && !m.user_id;
                const isTargetedToMe = m.user_id === currentUserId;
                const isGlobalNonSupport = !m.user_id && m.category !== 'support';

                if (isTargetedToMe || isGlobalNonSupport || (isSupportToAdmin && isAdmin)) {
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


        const profileChannel = supabase.channel('realtime-profile')
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

        const badgeChannel = supabase.channel('realtime-badges')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_badges' }, () => {
                fetchSupabaseData();
                if (currentUserId) fetchProfile(currentUserId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(badgeChannel);
            if (notificationTimer.current) clearTimeout(notificationTimer.current);
        };
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
                                nextLevelExp: profile?.nextLevelExp, gallery: profile?.gallery, playStyles: profile?.playStyles,
                                isVerified: profile?.isVerified || false,
                                badges: profile?.badges || []
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

    const handleProfileUpdate = async (targetId: string, updatedData: any) => {
        try {
            // Update local state for current user immediately
            if (targetId === currentUserId) {
                setCurrentUser(prev => ({ ...prev, ...updatedData }));
            }

            // Sync with allProfiles list
            setAllProfiles(prev => prev.map(p => p.id === targetId ? { ...p, ...updatedData } : p));

            // Sync with selected player if applicable
            if (selectedPlayer?.id === targetId) {
                setSelectedPlayer(prev => prev ? ({ ...prev, ...updatedData } as any) : null);
            }

            // Persist to Supabase if it's a UUID and the user is an admin or it's their own profile
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
            if (isUUID && (isAdmin || targetId === currentUserId)) {
                // Prepare a clean update object with only defined fields
                const dbUpdate: any = {};

                // Mapeamento de campos UI/State para Colunas DB
                if (updatedData.name !== undefined) dbUpdate.name = updatedData.name;
                if (updatedData.avatar !== undefined) dbUpdate.avatar_url = updatedData.avatar;
                if (updatedData.city !== undefined) dbUpdate.city = updatedData.city;
                if (updatedData.bio !== undefined) dbUpdate.bio = updatedData.bio;
                if (updatedData.social !== undefined) dbUpdate.social = updatedData.social;
                if (updatedData.playStyles !== undefined) dbUpdate.play_styles = updatedData.playStyles;
                if (updatedData.gallery !== undefined) dbUpdate.gallery = updatedData.gallery;
                if (updatedData.level !== undefined) dbUpdate.level = updatedData.level;
                if (updatedData.currentExp !== undefined) dbUpdate.current_exp = updatedData.currentExp;

                // Campos Financeiros e de Status
                if (updatedData.debtLimitBrl !== undefined) dbUpdate.debt_limit_brl = updatedData.debtLimitBrl;
                if (updatedData.isVip !== undefined) dbUpdate.is_vip = updatedData.isVip;
                if (updatedData.vipStatus !== undefined) dbUpdate.vip_status = updatedData.vipStatus;
                if (updatedData.vipExpiresAt !== undefined) dbUpdate.vip_expires_at = updatedData.vipExpiresAt;
                if (updatedData.isVerified !== undefined) dbUpdate.is_verified = updatedData.isVerified;
                if (updatedData.lastDailyClaim !== undefined) dbUpdate.last_daily_claim = updatedData.lastDailyClaim;
                if (updatedData.dailyStreak !== undefined) dbUpdate.daily_streak = updatedData.dailyStreak;

                /* 
                   IMPORTANT: We DO NOT persist balance_brl, balance_chipz or total_pending_debt 
                   directly via UPSERT here. These fields are managed by atomic transactions 
                   (RPCs like secure_balance_transaction or database triggers). 
                   Direct upserts from local state can cause race conditions and overwrite 
                   correct balances with stale ones.
                */

                // Only execute update if there's something to update
                if (Object.keys(dbUpdate).length > 0) {
                    const isNewUser = !currentUser.name || currentUser.name === 'Usuário' || currentUser.name === 'User';
                    const isSettingName = updatedData.name && isNewUser;

                    // Use upsert to handle new users who might not have a profile row yet
                    const { error } = await supabase.from('profiles').upsert({ id: targetId, ...dbUpdate }, { onConflict: 'id' });
                    if (error) {
                        console.error('Error persisting profile update:', error);
                        throw error;
                    }

                    // Se for a primeira vez definindo o nome, enviar boas-vindas
                    if (isSettingName) {
                        await sendTemplatedMessage('welcome', targetId);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling profile update:', error);
            throw error;
        }
    };

    const handleSaveEvent = async (event: Event) => {
        if (!isAdmin) return;

        const isNew = !events.some(e => e.id === event.id) || event.id.length < 20;
        const dbData: any = {
            title: event.title, date: event.date, time: event.time, type: event.type, modality: event.modality, buyin: event.buyin, guaranteed: event.guaranteed,
            status: event.status, ranking_type: event.rankingType, included_rankings: event.includedRankings, description: event.description,
            stack: event.stack, blinds: event.blinds, late_reg: event.lateReg, location: event.location, rebuy_value: event.rebuyValue,
            rebuy_chips: event.rebuyChips, addon_value: event.addonValue, addon_chips: event.addonChips, staff_bonus_value: event.staffBonusValue,
            staff_bonus_chips: event.staffBonusChips, time_chip_value: event.timeChipValue, time_chip_chips: event.timeChipChips, flyer_url: event.flyerUrl,
            double_rebuy_value: event.doubleRebuyValue, double_rebuy_chips: event.doubleRebuyChips, double_addon_value: event.doubleAddonValue,
            double_addon_chips: event.doubleAddonChips, parallel_products: event.parallelProducts, results: event.results,
            total_rebuys: event.totalRebuys, total_addons: event.totalAddons, total_prize: event.totalPrize, scoring_schema_id: event.scoringSchemaId,
            game_mode: event.gameMode, cash_game_type: event.cashGameType, cash_game_blinds: event.cashGameBlinds,
            cash_game_capacity: event.cashGameCapacity,
            cash_game_min_max: event.cashGameMinMax,
            cash_game_dinner: event.cashGameDinner || false,
            cash_game_open_bar: event.cashGameOpenBar || false,
            cash_game_notes: event.cashGameNotes || '',
            staff_expenses_brl: event.staffExpensesBrl || 0,
            prize_payout_brl: event.prizePayoutBrl || 0
        };

        try {
            if (isNew) {
                const { data, error } = await supabase.from('events').insert([dbData]).select();
                if (error) throw error;
                const finalEvent = data && data[0] ? { ...event, id: data[0].id } : event;
                setEvents(prev => [...prev.filter(e => e.id !== event.id), finalEvent]);
            } else {
                const { error } = await supabase.from('events').update(dbData).eq('id', event.id);
                if (error) throw error;
                setEvents(prev => prev.map(e => e.id === event.id ? event : e));
            }
        } catch (e) {
            console.error('Error saving event:', e);
            fetchSupabaseData();
        }
    };

    const handleDeleteEventAcrossApp = async (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        if (eventId.length >= 20 && isAdmin) {
            try { await supabase.from('events').delete().eq('id', eventId); } catch (e) { console.error('Error deleting event:', e); }
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
            if (results) {
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
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase.from('messages').update({ is_read: true }).eq('id', id);
    };

    const handleDeleteMessage = async (id: string) => {
        setMessages(prev => prev.filter(m => m.id !== id));
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) console.error('Error deleting message:', error);
    };

    const updateContent = async (section: keyof ContentDB, field: string, value: any) => {
        const newSec = field === '' ? value : { ...contentDB[section], [field]: value };
        setContentDB(prev => ({ ...prev, [section]: newSec }));
        if (isAdmin) await supabase.from('content_db').upsert({ key: section, value: newSec }, { onConflict: 'key' });
    };

    const updateCategory = async (index: number, updates: Partial<TournamentCategory>) => {
        const newCats = [...contentDB.categories];
        const oldId = newCats[index].id;
        newCats[index] = { ...newCats[index], ...updates };
        setContentDB(prev => ({ ...prev, categories: newCats }));
        if (isAdmin) {
            const { error } = await supabase.from('ecosystem_categories').update(updates).eq('id', oldId);
            if (error) console.error('Error updating category:', error);
        }
    };

    return (
        <AppContext.Provider value={{
            currentView, setCurrentView, isAdmin, isLoggedIn, currentUserId, currentUser, events, isLoading, rankings, contentDB, globalScoringSchemas,
            allProfiles, experienceLevels, dailyRewards, badgeTemplates, systemMessageTemplates, prizeLabel, totalQualifiers, customTotalQualifiers, nextGoal,
            messages, unreadCount, polls, pollVotesByCurrentUser, newNotification, selectedPlayer, setSelectedPlayer, months, vipPlans,
            handleNavigate, handleLogin, handleLogout, handlePlayerSelect, handleProfileUpdate, handleSaveEvent, handleDeleteEventAcrossApp,
            handleEventClosure, handleUpdateRankingMeta, handleUpdateGlobalSchemas, handleUpdateSystemMessageTemplate, handleCreateSystemMessageTemplate, handleAddRanking, handleDeleteRanking, handleAwardBadge,
            handleUpdateRankingPrize, handleUpdateTotalQualifiers, handleUpdateMonth, handleToggleMonthStatus,
            handleNavigateToPlayerByName, handleCreatePoll, handleVoteOnPoll, handleSendAdminMessage, handleSendMessage, handleReplyMessage,
            handleMarkAsRead, handleDeleteMessage, handleCreateBadgeTemplate, updateContent, updateCategory, setNewNotification, getAllUniquePlayers,
            setEvents, setExperienceLevels, setDailyRewards
        }}>
            {children}
        </AppContext.Provider>
    );
};
