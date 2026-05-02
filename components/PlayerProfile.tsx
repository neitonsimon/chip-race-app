import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerStats, RankingPlayer, TournamentResult, Event, ExperienceLevel, Message, Poll, MessageCategory, DailyReward, RankingInstance } from '../types';
import { createProfileSlug } from '../src/lib/slugUtils';
import { supabase } from '../src/lib/supabase';
import appConfig from '../src/config/appConfig.json';
import { ProfileStatsSkeleton } from './Skeleton';

interface PlayerProfileProps {
    isAdmin?: boolean;
    isLoggedIn?: boolean;
    initialData?: RankingPlayer;
    onSendMessage?: (to: string, content: string) => void;
    onUpdateProfile?: (targetId: string, updatedData: PlayerStats) => void;
    currentUser?: {
        id?: string;
        name: string;
        avatar: string;
        city?: string;
        bio?: string;
        playStyles?: string[];
        gallery?: string[];
        social?: { instagram?: string; whatsapp?: string; };
        level?: number;
        currentExp?: number;
        nextLevelExp?: number;
        lastDailyClaim?: string | null;
        dailyStreak?: number;
        badges?: any[];
    };
    events?: Event[];
    experienceLevels?: ExperienceLevel[];
    setExperienceLevels?: React.Dispatch<React.SetStateAction<ExperienceLevel[]>>;
    dailyRewards?: DailyReward[];
    setDailyRewards?: React.Dispatch<React.SetStateAction<DailyReward[]>>;

    // Novas props para Mensagens e Enquetes
    messages?: Message[];
    polls?: Poll[];
    userVotes?: Record<string, number>;
    onVotePoll?: (pollId: string, optionIndex: number) => void;
    onMarkAsRead?: (id: string) => void;
    onDeleteMessage?: (id: string) => void;
    onReply?: (id: string, text: string) => void;
    rankings?: RankingInstance[];
    rankingPlayers?: RankingPlayer[];
    isLoading?: boolean;
}

// Dicionário de Estilos de Jogo com Descrições
const PLAY_STYLE_DEFINITIONS: Record<string, string> = appConfig.playerProfile.playStyleDefinitions;

const ALL_PLAY_STYLES = Object.keys(PLAY_STYLE_DEFINITIONS);

const DEFAULT_AVATAR = appConfig.playerProfile.defaultAvatar;

// Daily Reward Config
const FALLBACK_DAILY_REWARDS: DailyReward[] = appConfig.playerProfile.fallbackDailyRewards as DailyReward[];


type TabView = 'overview' | 'edit' | 'inbox' | 'notifications' | 'comprovantes' | 'pendencias';
import { DebtPayCard } from './player-profile/DebtPayCard';
import { PendenciasTab } from './player-profile/PendenciasTab';
import { ComprovantesTab } from './player-profile/ComprovantesTab';
import { EditTab } from './player-profile/EditTab';
import { InboxTab } from './player-profile/InboxTab';
import { OverviewTab } from './player-profile/OverviewTab';

// Hooks
import { usePlayerFinancial } from '../contexts/hooks/usePlayerFinancial';

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
    isAdmin,
    isLoggedIn,
    initialData,
    onSendMessage,
    onUpdateProfile,
    currentUser,
    experienceLevels = [],
    setExperienceLevels,
    dailyRewards = [],
    setDailyRewards,
    messages,
    polls,
    userVotes,
    onVotePoll,
    onMarkAsRead,
    onDeleteMessage,
    onReply,
    rankings,
    rankingPlayers = [],
    events = [],
    isLoading,
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabView>('overview');
    const [viewClosedEvent, setViewClosedEvent] = useState<Event | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    // Core refs and calculated properties
    const targetIdRef = useRef<string | null>(initialData?.id || currentUser?.id || null);
    const isOwnProfile = isLoggedIn && (!initialData || initialData.id === currentUser?.id);

    const [player, setPlayer] = useState<PlayerStats>(() => ({
        id: initialData?.id || currentUser?.id || '',
        name: initialData?.name || currentUser?.name || 'GUEST',
        avatar: initialData?.avatar || currentUser?.avatar || DEFAULT_AVATAR,
        city: initialData?.city || currentUser?.city || '...',
        bio: initialData?.bio || currentUser?.bio || '',
        rank: initialData?.rank || 0,
        points: initialData?.points || 0,
        winnings: initialData?.winnings || 'R$ 0,00',
        titles: initialData?.titles || 0,
        itm: initialData?.itm || '0%',
        gallery: initialData?.gallery || [],
        playStyles: initialData?.playStyles || [],
        social: initialData?.social || {},
        tournamentLog: initialData?.tournamentLog || [],
        level: initialData?.level || 1,
        currentExp: initialData?.currentExp || 0,
        nextLevelExp: initialData?.nextLevelExp || 100,
        lastDailyClaim: initialData?.lastDailyClaim || null,
        dailyStreak: initialData?.dailyStreak || 0,
        isVip: initialData?.isVip || false,
        vipStatus: initialData?.vipStatus || 'nao_vip',
        vipExpiresAt: initialData?.vipExpiresAt || null,
        balanceBrl: initialData?.balanceBrl || 0,
        balanceChipz: initialData?.balanceChipz || 0,
        isVerified: initialData?.isVerified || false
    }));

    // States para Inbox e Mensagens
    const [inboxFilter, setInboxFilter] = useState<MessageCategory | 'all'>('all');
    const [viewedMessage, setViewedMessage] = useState<Message | null>(null);
    const [replyMode, setReplyMode] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [viewingReceipt, setViewingReceipt] = useState<any>(null);
    const [receiptItems, setReceiptItems] = useState<any[]>([]);
    const viewingReceiptRef = useRef<any>(null);
    const [lastSeenRecibos, setLastSeenRecibos] = useState<number>(0);
    const originalNameRef = useRef<string>('');
    const canEdit = isAdmin || (isLoggedIn && isOwnProfile);

    // Encontrar nick na suprema do remetente se for conversa privada
    const senderProfile = viewedMessage
        ? (rankingPlayers.find(p => p.id === viewedMessage.from) || rankingPlayers.find(p => p.name === viewedMessage.from))
        : null;

    // --- FINANCIAL HOOK ---
    const {
        playerCommands, playerTransactions, playerBets, userDebts, totalUserDebt,
        isSaving: financialIsSaving, isLoading: isLoadingFinancial, fetchPlayerCommands, fetchUserDebts,
        handlePayOpenCommand, handlePayDebt
    } = usePlayerFinancial({
        userId: targetIdRef.current || (initialData?.id ?? currentUser?.id ?? null),
        isLoggedIn: !!isLoggedIn,
        isOwnProfile,
        playerBalance: player.balanceBrl,
        onUpdateProfile: (id, data) => {
            const updated = { ...player, ...data };
            setPlayer(updated);
            if (onUpdateProfile) onUpdateProfile(id, data);
        }
    });

    const commandsForBadge = playerCommands || [];



    const handleOpenFlyer = (log: TournamentResult) => {
        const eventMatch = events.find(e =>
            e.title.toLowerCase() === log.eventName.toLowerCase() &&
            (e.date.split('-').reverse().join('/') === log.date || e.date === log.date)
        );

        if (eventMatch) {
            setViewClosedEvent(eventMatch);
        }
    };

    useEffect(() => {
        const handleOpenPolls = () => {
            setActiveTab('inbox');
            setInboxFilter('poll');
        };
        const handleOpenPrivate = () => {
            setActiveTab('inbox');
            setInboxFilter('private');
        };
        const handleOpenSystem = () => {
            setActiveTab('inbox');
            setInboxFilter('system');
        };
        const handleOpenAdmin = () => {
            setActiveTab('inbox');
            setInboxFilter('admin');
        };
        const handleOpenTournament = () => {
            setActiveTab('inbox');
            setInboxFilter('tournament');
        };
        const handleOpenGift = () => {
            setActiveTab('inbox');
            setInboxFilter('gift');
        };

        window.addEventListener('open-poll-messages', handleOpenPolls);
        window.addEventListener('open-private-messages', handleOpenPrivate);
        window.addEventListener('open-system-messages', handleOpenSystem);
        window.addEventListener('open-admin-messages', handleOpenAdmin);
        window.addEventListener('open-tournament-messages', handleOpenTournament);
        window.addEventListener('open-gift-messages', handleOpenGift);

        return () => {
            window.removeEventListener('open-poll-messages', handleOpenPolls);
            window.removeEventListener('open-private-messages', handleOpenPrivate);
            window.removeEventListener('open-system-messages', handleOpenSystem);
            window.removeEventListener('open-admin-messages', handleOpenAdmin);
            window.removeEventListener('open-tournament-messages', handleOpenTournament);
            window.removeEventListener('open-gift-messages', handleOpenGift);
        };
    }, []);

    // Helper para buscar Avatar
    const getPlayerAvatar = (name: string) => {
        const p = rankingPlayers.find(ptr => ptr.name.toLowerCase() === name.toLowerCase());
        return p?.avatar || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`;
    };

    // States para Upload de Imagem
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    // Daily Login States
    const [canClaimDaily, setCanClaimDaily] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimAnimation, setClaimAnimation] = useState(false);
    const claimedRewardRef = useRef<DailyReward | null>(null);
    const [showRewardsTable, setShowRewardsTable] = useState(false);



    // --- EDITOR DE IMAGEM (CROP) STATES ---
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<'avatar' | 'gallery'>('avatar');
    const [zoom, setZoom] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    // -------------------------------------

    const [isSavingExp, setIsSavingExp] = useState(false);


    // Sync with selected player if passed from Ranking or use CurrentUser
    useEffect(() => {
        let baseData: PlayerStats = {
            id: '', name: 'GUEST', avatar: DEFAULT_AVATAR, city: '...', bio: '',
            rank: 0, points: 0, winnings: 'R$ 0,00', titles: 0, itm: '0%',
            gallery: [], playStyles: [], social: {}, tournamentLog: [],
            level: 1, currentExp: 0, nextLevelExp: 1000,
            lastDailyClaim: null, dailyStreak: 0, isVip: false,
            vipStatus: 'nao_vip', vipExpiresAt: null,
            balanceBrl: 0, balanceChipz: 0, isVerified: false
        };

        // 1. Determine Identity (Name, Avatar, Bio...)
        if (initialData) {
            // Viewing someone else
            targetIdRef.current = initialData.id || '';
            originalNameRef.current = initialData.name;
            baseData = {
                ...baseData,
                id: initialData.id || `CR-${Math.floor(Math.random() * 9000) + 1000}`,
                numericId: initialData.numericId,
                name: initialData.name,
                avatar: initialData.avatar,
                city: initialData.city,
                bio: initialData.bio || "Jogador competitivo da liga Chip Race.",
                rank: initialData.rank,
                points: initialData.points,
                winnings: 'R$ ' + (initialData.points * 3.5).toFixed(2),
                gallery: initialData.gallery || [],
                playStyles: initialData.playStyles || [],
                social: initialData.social || {
                    instagram: "",
                    whatsapp: ""
                },
                level: initialData.level || 1,
                currentExp: initialData.currentExp || 0,
                nextLevelExp: initialData.nextLevelExp || 1000,
                isVip: initialData.isVip || false,
                vipStatus: initialData.vipStatus || 'nao_vip',
                vipExpiresAt: initialData.vipExpiresAt || null,
                isVerified: initialData.isVerified || false,
                badges: (initialData as any).badges || [],
                suprema_nickname: (initialData as any).suprema_nickname,
                suprema_user_id: (initialData as any).suprema_user_id
            };
            setActiveTab('overview');
        } else if (currentUser) {
            // Viewing Self
            targetIdRef.current = currentUser.id || '';
            baseData.id = currentUser.id || '';
            baseData.numericId = (currentUser as any).numericId;
            baseData.name = currentUser.name;
            baseData.avatar = currentUser.avatar;
            if (currentUser.city) baseData.city = currentUser.city;
            if (currentUser.bio) baseData.bio = currentUser.bio;
            if (currentUser.playStyles) baseData.playStyles = currentUser.playStyles;
            if (currentUser.gallery) baseData.gallery = currentUser.gallery;
            if (currentUser.social) baseData.social = currentUser.social;

            baseData.level = currentUser.level || 1;
            baseData.currentExp = currentUser.currentExp || 0;
            baseData.nextLevelExp = currentUser.nextLevelExp || 1000;
            baseData.balanceBrl = currentUser.balanceBrl || 0;
            baseData.balanceChipz = currentUser.balanceChipz || 0;
            baseData.lastDailyClaim = currentUser.lastDailyClaim || null;
            baseData.dailyStreak = currentUser.dailyStreak || 0;
            baseData.isVip = currentUser.isVip || false;
            baseData.vipStatus = currentUser.vipStatus || 'nao_vip';
            baseData.vipExpiresAt = currentUser.vipExpiresAt || null;
            baseData.isVerified = (currentUser as any).isVerified || false;
            baseData.badges = currentUser.badges || [];
            baseData.suprema_nickname = (currentUser as any).suprema_nickname;
            baseData.suprema_user_id = (currentUser as any).suprema_user_id;

            // CHECK CLAIM AVAILABILITY
            checkClaimAvailability(baseData.lastDailyClaim);
        }

        originalNameRef.current = baseData.name;
        targetIdRef.current = baseData.id;

        // 2. Calculate Tournament Log from Real Events (Synchronization)
        let realLogs: TournamentResult[] = [];
        if (events) {
            realLogs = events
                .filter(e => e.status === 'closed' && e.results && !e.is_hidden)
                .map(e => {
                    // Find result for this player (Priority to ID, Fallback to Name)
                    const res = e.results?.find(r => {
                        if (r.userId && r.userId === targetIdRef.current) return true;
                        if (r.name && r.name.toLowerCase().trim() === baseData.name.toLowerCase().trim()) return true;
                        return false;
                    });
                    if (res) {
                        return {
                            date: e.date.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
                            eventName: e.title,
                            position: e.isStartingDay ? (res.qualifierChips && res.qualifierChips > 0 ? 1 : 0) : res.position,
                            points: res.calculatedPoints,
                            prize: res.prize > 0 ? `R$ ${res.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
                            isStartingDay: e.isStartingDay
                        } as TournamentResult;
                    }
                    return null;
                })
                .filter((l): l is TournamentResult => l !== null)
                .sort((a, b) => {
                    // Sort by date descending (using DD/MM/YYYY format)
                    const da = a.date.split('/').reverse().join('');
                    const db = b.date.split('/').reverse().join('');
                    return db.localeCompare(da);
                });
        }

        // 3. Update Stats based on Real Logs (if available)
        if (realLogs.length > 0) {
            baseData.tournamentLog = realLogs;

            // Recalculate summary stats from logs if displaying real data
            // For ranking players, initialData.points is authoritative, but for currentUser we calculate.
            if (!initialData || (initialData.points === 0 && realLogs.length > 0)) {
                const totalPoints = realLogs.reduce((acc, curr) => acc + (curr.points || 0), 0);
                baseData.points = totalPoints;
            }

            const totalPrize = realLogs.reduce((acc, curr) => {
                // Basic parsing of currency string
                const val = parseFloat(curr.prize.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
                return acc + val;
            }, 0);
            baseData.winnings = totalPrize > 0 ? `R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';

            baseData.titles = realLogs.filter(l => l.position === 1 && !l.isStartingDay).length;

            const itmCount = realLogs.filter(l => l.prize !== '-').length;
            const itmPercent = realLogs.length > 0 ? Math.round((itmCount / realLogs.length) * 100) : 0;
            baseData.itm = `${itmPercent}%`;

        } else {
            // Fallback / Default
            baseData.tournamentLog = [];
        }

        setPlayer(baseData);

    }, [initialData, currentUser, events]);

    useEffect(() => {
        if (activeTab === 'comprovantes') {
            fetchPlayerCommands();
        }
    }, [activeTab, fetchPlayerCommands]);

    useEffect(() => {
        if (activeTab === 'pendencias') {
            fetchUserDebts();
        }
    }, [activeTab, fetchUserDebts]);

    useEffect(() => {
        const fetchBadges = async () => {
            if (!targetIdRef.current) return;
            // Join with badge_templates to get the original creation description
            const { data: userBadges } = await supabase
                .from('user_badges')
                .select('id, user_id, title, description, icon, color, awarded_at, badge_template_id, badge_templates(description, icon, color, title)')
                .eq('user_id', targetIdRef.current)
                .order('awarded_at', { ascending: false });

            if (userBadges) {
                setPlayer(prev => ({ ...prev, badges: userBadges }));
            }
        };

        // Always refresh badges for the target profile to ensure alignment with DB
        if (targetIdRef.current) {
            fetchBadges();
        }
    }, [player.id]);

    // Financial handlers removed - moved to hook usePlayerFinancial

    const handleActivateVipVoucher = async (cmdId: string, duration: string) => {
        if (!isLoggedIn || !isOwnProfile) return;

        setIsSavingExp(true);
        try {
            const { data, error } = await supabase.rpc('activate_vip_voucher', {
                p_command_id: cmdId,
                p_duration: duration
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            alert(data.message);

            // Refresh commands to show it's activated
            fetchPlayerCommands();

            // Update local profile state
            const { data: freshP } = await supabase.from('profiles').select('is_vip, vip_status, vip_expires_at').eq('id', player.id).single();
            if (freshP) {
                const updated = {
                    ...player,
                    isVip: freshP.is_vip,
                    vipStatus: freshP.vip_status,
                    vipExpiresAt: freshP.vip_expires_at
                };
                setPlayer(updated);
                if (onUpdateProfile) onUpdateProfile(player.id, {
                    isVip: freshP.is_vip,
                    vipStatus: freshP.vip_status,
                    vipExpiresAt: freshP.vip_expires_at
                } as any);
            }

            setViewingReceipt(null);
        } catch (err: any) {
            alert('Erro ao ativar VIP: ' + err.message);
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleViewReceipt = async (cmd: any, isSilentUpdate = false) => {
        const { data } = await supabase.from('command_items')
            .select('id, command_id, product_id, quantity, unit_price_brl, total_price_brl, notes, created_at, products(name, category)')
            .eq('command_id', cmd.id)
            .order('created_at', { ascending: true });
        setReceiptItems(data || []);

        // Atualiza os totais mais recentes
        const { data: latestCmd } = await supabase.from('commands')
            .select('id, user_id, event_id, status, total_brl, discount_brl, unpaid_amount_brl, chips_payment_brl, cash_payment_brl, pix_payment_brl, credit_payment_brl, profit_brl, cash_out_brl, closed_at, created_at, events(title, date)')
            .eq('id', cmd.id)
            .single();

        if (!isSilentUpdate || (viewingReceiptRef.current && viewingReceiptRef.current.id === cmd.id)) {
            setViewingReceipt(latestCmd || cmd);
        }
    };

    const toggleVerification = async () => {
        if (!isAdmin || !targetIdRef.current) return;

        // Basic UUID check to avoid trying to update guest users
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetIdRef.current);
        if (!isUUID) {
            alert('Não é possível verificar este perfil (jogador convidado ou sem registro no banco).');
            return;
        }

        const newStatus = !player.isVerified;
        try {
            const { data, error } = await supabase.from('profiles').update({ is_verified: newStatus }).eq('id', targetIdRef.current).select('id');
            if (error) throw error;

            if (!data || data.length === 0) {
                alert('Erro: O perfil não foi encontrado no banco de dados para atualização.');
                return;
            }

            const updatedPlayer = { ...player, isVerified: newStatus };
            setPlayer(updatedPlayer);

            // Sync with parent context so other views (like Ranking list) update immediately
            if (onUpdateProfile) {
                onUpdateProfile(targetIdRef.current, { isVerified: newStatus } as any);
            }

            alert(`Jogador ${newStatus ? 'verificado' : 'desverificado'} com sucesso!`);
        } catch (err: any) {
            alert('Erro ao atualizar verificação: ' + err.message);
        }
    };



    // Lógica de Verificação de Resgate (Reset às 21h)
    const checkClaimAvailability = (lastClaim: string | null) => {
        if (!lastClaim) {
            setCanClaimDaily(true);
            return;
        }

        const now = new Date();
        const lastClaimDate = new Date(lastClaim);

        // Definição do "Dia de Jogo" atual
        // Se agora for depois das 21h, o dia de jogo começou hoje às 21h.
        // Se agora for antes das 21h, o dia de jogo começou ontem às 21h.
        let currentGamingDayStart = new Date(now);
        currentGamingDayStart.setHours(21, 0, 0, 0);

        if (now.getHours() < 21) {
            currentGamingDayStart.setDate(currentGamingDayStart.getDate() - 1);
        }

        // Se o último resgate foi ANTES do início do ciclo atual, pode resgatar
        if (lastClaimDate < currentGamingDayStart) {
            setCanClaimDaily(true);
        } else {
            setCanClaimDaily(false);
        }
    };

    const activeDailyRewards = dailyRewards.length > 0 ? dailyRewards : FALLBACK_DAILY_REWARDS;

    const handleClaimToday = async () => {
        if (isSavingExp || !player.id) return;
        setIsSavingExp(true);
        try {
            // Call the secure RPC to process the claim
            const { data, error } = await supabase.rpc('process_daily_login', {
                u_id: player.id,
                p_action: 'claim'
            });

            if (error) throw error;

            if (data.status === 'already_claimed') {
                alert('Você já participou hoje!');
                setCanClaimDaily(false);
                setShowClaimModal(false);
                return;
            }

            if (data.status === 'success') {
                // Find the reward details for animation
                // data.streak in the new RPC returns the day number we just claimed
                const reward = activeDailyRewards[(data.streak - 1) % activeDailyRewards.length];
                claimedRewardRef.current = reward || {
                    day: data.streak,
                    reward_type: data.reward_type,
                    reward_value: data.reward_value,
                    reward_label: data.reward_label
                };

                // Show animation
                setClaimAnimation(true);

                // Fetch profile again via context (dispatch event)
                window.dispatchEvent(new CustomEvent('refresh-profile-data'));

                setTimeout(() => {
                    setClaimAnimation(false);
                    setShowClaimModal(false);
                    setCanClaimDaily(false);
                }, 3000);
            }
        } catch (err: any) {
            console.error('Erro ao resgatar recompensa:', err);
            alert('Falha ao resgatar: ' + err.message);
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleSkipToday = async () => {
        if (isSavingExp || !player.id) return;
        setIsSavingExp(true);
        try {
            // Use the RPC for skipping too to maintain DB consistency
            const { data, error } = await supabase.rpc('process_daily_login', {
                u_id: player.id,
                p_action: 'skip'
            });

            if (error) throw error;

            if (data.status === 'success') {
                window.dispatchEvent(new CustomEvent('refresh-profile-data'));
                setCanClaimDaily(false);
                setShowClaimModal(false);
            } else if (data.status === 'already_claimed') {
                setCanClaimDaily(false);
                setShowClaimModal(false);
            }
        } catch (err: any) {
            console.error('Erro ao pular recompensa:', err);
            alert('Falha ao pular: ' + err.message);
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleUpdate = (field: keyof PlayerStats, value: any) => {
        setPlayer({ ...player, [field]: value });
    };

    const handleSocialUpdate = (network: keyof typeof player.social, value: string) => {
        setPlayer({
            ...player,
            social: {
                ...player.social,
                [network]: value
            }
        });
    };

    const togglePlayStyle = (style: string) => {
        if (player.playStyles.includes(style)) {
            setPlayer({
                ...player,
                playStyles: player.playStyles.filter(s => s !== style)
            });
        } else {
            setPlayer({
                ...player,
                playStyles: [...player.playStyles, style]
            });
        }
    };

    const handleDeleteAvatar = (e: React.MouseEvent) => {
        e.preventDefault();
        setPlayer({ ...player, avatar: DEFAULT_AVATAR });
    };

    const handleDeleteImage = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newGallery = [...player.gallery];
        newGallery.splice(index, 1);
        setPlayer({ ...player, gallery: newGallery });
    };

    // Funções para Upload de Imagem (Galeria)
    const handleOpenUploadModal = (e: React.MouseEvent) => {
        e.preventDefault();
        setNewPhotoUrl('');
        setShowUploadModal(true);
    };

    // Handler para Upload da Galeria (Modal)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Abre o editor de foto para a galeria também
                setCropTarget('gallery');
                setEditorImage(reader.result as string);
                setZoom(0.3); // Zoom mais afastado para galeria (landscape friendly)
                setCropOffset({ x: 0, y: 0 });
                setShowUploadModal(false); // Fecha o seletor
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    // Handler específico para Avatar (Abre Editor)
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropTarget('avatar');
                setEditorImage(reader.result as string);
                setZoom(0.4);
                setCropOffset({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    // ---- CROPPER LOGIC ----
    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStartRef.current = { x: clientX - cropOffset.x, y: clientY - cropOffset.y };
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setCropOffset({
            x: clientX - dragStartRef.current.x,
            y: clientY - dragStartRef.current.y
        });
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const handleSaveCrop = () => {
        if (!editorImage) return;

        // Se for galeria, a gente pula o crop e salva direto
        if (cropTarget === 'gallery') {
            setPlayer(prev => ({ ...prev, gallery: [...prev.gallery, editorImage] }));
            setEditorImage(null);
            return;
        }

        if (!imageRef.current) return;

        const canvas = document.createElement('canvas');
        const size = 600; // Resolution enhanced for gallery
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, size, size);

            const viewportSize = 280;
            const scaleFactor = size / viewportSize;

            ctx.translate(size / 2, size / 2);
            ctx.translate(cropOffset.x * scaleFactor, cropOffset.y * scaleFactor);
            ctx.scale(zoom, zoom);
            ctx.translate(-imageRef.current.width * scaleFactor / 2, -imageRef.current.height * scaleFactor / 2);

            ctx.drawImage(
                imageRef.current,
                0,
                0,
                imageRef.current.width * scaleFactor,
                imageRef.current.height * scaleFactor
            );

            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            handleUpdate('avatar', croppedBase64);
            setEditorImage(null);
        }
    };
    // -----------------------

    const confirmAddImage = () => {
        if (newPhotoUrl) {
            setPlayer({ ...player, gallery: [...player.gallery, newPhotoUrl] });
            setShowUploadModal(false);
            setNewPhotoUrl('');
        }
    };

    const handleSendMessageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSendMessage && messageText.trim()) {
            onSendMessage(player.name, messageText);
            setMessageSent(true);
            setTimeout(() => {
                setMessageSent(false);
                setShowMessageModal(false);
                setMessageText('');
            }, 2000);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingExp(true);
        try {
            // Only send editable fields to parent update function to avoid overwriting 
            // sensitive fields like EXP or balance with stale local data.
            if (onUpdateProfile) {
                const editableData = {
                    name: player.name,
                    avatar: player.avatar,
                    city: player.city,
                    bio: player.bio,
                    social: player.social,
                    playStyles: player.playStyles,
                    gallery: player.gallery,
                    suprema_nickname: player.suprema_nickname
                };
                const newId = await onUpdateProfile(targetIdRef.current, editableData as any);
                
                // Se o ID mudou (promoção) ou o nome mudou, redireciona para o novo slug
                const oldSlug = createProfileSlug(originalNameRef.current);
                const newSlug = createProfileSlug(player.name);
                
                if (newId && (newId !== targetIdRef.current || oldSlug !== newSlug)) {
                    targetIdRef.current = newId;
                    originalNameRef.current = player.name;
                    navigate(`/perfil/${newSlug}`, { replace: true });
                } else {
                    originalNameRef.current = player.name;
                }
            }

            alert("Perfil atualizado com sucesso!");
            setActiveTab('overview');
        } catch (err: any) {
            console.error("Error saving profile:", err);
            alert("Erro ao salvar perfil: " + (err.message || "Por favor, tente novamente."));
        } finally {
            setIsSavingExp(false);
        }
    };

    const handleExpConfigChange = (index: number, newRequiredExp: string) => {
        if (!setExperienceLevels || !experienceLevels) return;
        const val = parseInt(newRequiredExp, 10);
        const updated = [...experienceLevels];
        updated[index] = { ...updated[index], required_exp: isNaN(val) ? 0 : val };
        setExperienceLevels(updated);
    };

    const handleSaveExpConfig = async () => {
        if (!experienceLevels || experienceLevels.length === 0) return;
        setIsSavingExp(true);
        try {
            const { error } = await supabase
                .from('experience_levels')
                .upsert(experienceLevels, { onConflict: 'level' });
            if (error) throw error;
            alert('Tabela de XP atualizada no banco de dados!');
        } catch (err: any) {
            console.error('Erro ao salvar experiência:', err);
            alert('Falha ao salvar. Tente novamente.');
        } finally {
            setIsSavingExp(false);
        }
    };

    const [isSavingRewards, setIsSavingRewards] = useState(false);

    const handleUpdateActiveReward = (index: number, field: keyof DailyReward, value: any) => {
        if (!setDailyRewards) return;
        const updated = [...activeDailyRewards];

        let finalValue = value;
        if (field === 'reward_value') {
            finalValue = parseFloat(value);
            if (isNaN(finalValue)) finalValue = 0;
        }

        updated[index] = { ...updated[index], [field]: finalValue };
        setDailyRewards(updated);
    };

    const handleSaveDailyRewardsConfig = async () => {
        if (!setDailyRewards || !activeDailyRewards.length) return;
        setIsSavingRewards(true);
        try {
            const { error } = await supabase
                .from('daily_rewards')
                .upsert(activeDailyRewards, { onConflict: 'day' });
            if (error) throw error;
            alert('Recompensas Diárias atualizadas no banco de dados!');
        } catch (err: any) {
            console.error('Erro ao salvar recompensas:', err);
            alert('Falha ao salvar recompensas. Tente novamente.');
        } finally {
            setIsSavingRewards(false);
        }
    };



    // Calculate real nextLevelExp based on experienceLevels table
    const currentLvlObj = experienceLevels?.find(l => l.level === player.level);
    const nextLvlObj = experienceLevels?.find(l => l.level === player.level + 1);

    // Fallbacks if table is empty or player is max level
    const currentTierBaseExp = currentLvlObj ? currentLvlObj.required_exp : 0;
    let nextTierExp = nextLvlObj ? nextLvlObj.required_exp : (currentTierBaseExp + 1000);

    // Update player's virtual next level exp so UI shows it right
    const displayNextExp = nextTierExp - currentTierBaseExp;
    const currentExpInTier = Math.max(0, player.currentExp - currentTierBaseExp);

    const xpPercentage = Math.min(100, (currentExpInTier / displayNextExp) * 100);

    // 5. Handling Not Found State
    if (initialData && (initialData as any).isNotFound) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                    <span className="material-icons-outlined text-4xl text-red-500">person_off</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-widest">Jogador não encontrado</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    O perfil que você está tentando acessar não existe ou teve o nome alterado recentemente.
                </p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full hover:scale-105 transition-all shadow-neon-pink"
                >
                    Voltar para o Início
                </button>
            </div>
        );
    }

    // Use local readiness check instead of global isLoading to avoid black screen
    // on re-fetches, refreshes, or when navigating between profiles.
    const profileReady = !!(player.id || player.name !== 'GUEST');
    if (!profileReady && !initialData && !currentUser?.id) {
        return (
            <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* PROFILE TABS COMPACT */}
                <div className="flex items-center gap-1 md:gap-2 mb-10 overflow-x-auto no-scrollbar pb-2 px-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === 'overview'
                            ? 'bg-primary text-white shadow-neon-pink'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <span className="material-icons-outlined text-sm md:text-lg">account_circle</span>
                        <span>Sobre</span>
                    </button>

                    {canEdit && (
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === 'edit'
                                ? 'bg-secondary text-black shadow-[0_0_20px_rgba(0,224,255,0.3)]'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-icons-outlined text-sm md:text-lg">edit</span>
                            <span>Editar</span>
                        </button>
                    )}

                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap relative ${activeTab === 'inbox'
                                ? 'bg-primary text-white shadow-neon-pink'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-icons-outlined text-sm md:text-lg">mail</span>
                            <span>Inbox</span>
                            {messages && messages.filter(m => !m.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse border border-white/20">
                                    {messages.filter(m => !m.read).length}
                                </span>
                            )}
                        </button>
                    )}

                    {isOwnProfile && (() => {
                        const hasUnseenRecibos = commandsForBadge.some(cmd => {
                            const closedAt = cmd.closed_at ? new Date(cmd.closed_at).getTime() : 0;
                            return closedAt > lastSeenRecibos;
                        });
                        return (
                            <button
                                onClick={() => {
                                    setActiveTab('comprovantes');
                                    const now = Date.now();
                                    setLastSeenRecibos(now);
                                    try { localStorage.setItem(`cr_recibos_seen_${currentUser?.id}`, String(now)); } catch { }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap relative ${activeTab === 'comprovantes'
                                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <span className="material-icons-outlined text-sm md:text-lg">receipt_long</span>
                                <span>Recibos</span>
                                {hasUnseenRecibos && activeTab !== 'comprovantes' && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse border-2 border-surface-dark font-black">!</span>
                                )}
                            </button>
                        );
                    })()}

                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('pendencias')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap relative ${activeTab === 'pendencias'
                                ? 'bg-red-500 text-white shadow-neon-red'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-icons-outlined text-sm md:text-lg">pending_actions</span>
                            <span>Pendura</span>
                            {totalUserDebt > 0 && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse border border-white/20">
                                    {totalUserDebt.toFixed(0)}
                                </span>
                            )}
                        </button>
                    )}
                </div>


                {/* ======================= OVERVIEW TAB ======================= */}
                {activeTab === 'overview' && (
                    <OverviewTab
                        player={player}
                        isAdmin={isAdmin}
                        isOwnProfile={isOwnProfile}
                        canClaimDaily={canClaimDaily}
                        toggleVerification={toggleVerification}
                        xpPercentage={xpPercentage}
                        currentExpInTier={currentExpInTier}
                        displayNextExp={displayNextExp}
                        setShowMessageModal={setShowMessageModal}
                        checkClaimAvailability={checkClaimAvailability}
                        onUpdateProfile={onUpdateProfile}
                        targetIdRef={targetIdRef}
                        setShowClaimModal={setShowClaimModal}
                        isLoading={isLoading}
                        rankings={rankings}
                        experienceLevels={experienceLevels}
                        handleOpenFlyer={handleOpenFlyer}
                        setSelectedImage={setSelectedImage}
                        setPlayer={setPlayer}
                    />
                )}

                {/* ... (EDIT TAB CONTENT - Remains unchanged) ... */}
                {activeTab === 'inbox' && isOwnProfile && (
                    <InboxTab
                        messages={messages || []}
                        inboxFilter={inboxFilter}
                        setInboxFilter={setInboxFilter}
                        setViewedMessage={setViewedMessage}
                        onMarkAsRead={onMarkAsRead}
                        onDeleteMessage={(id) => {
                            if (window.confirm('Excluir esta mensagem?')) {
                                onDeleteMessage?.(id);
                            }
                        }}
                    />
                )}

                {/* ======================= PENDÊNCIAS TAB ======================= */}
                {activeTab === 'pendencias' && isOwnProfile && (
                    <PendenciasTab
                        userDebts={userDebts}
                        totalUserDebt={totalUserDebt}
                        playerBalance={player.balanceBrl}
                        isSavingExp={isSavingExp}
                        handlePayDebt={handlePayDebt}
                    />
                )}


                {/* ======================= COMPROVANTES TAB ======================= */}
                {
                    activeTab === 'comprovantes' && isOwnProfile && (
                        <ComprovantesTab
                            playerCommands={playerCommands}
                            playerTransactions={playerTransactions}
                            playerBets={playerBets}
                            handleViewReceipt={handleViewReceipt}
                            isVip={player.isVip}
                            onActivateVip={handleActivateVipVoucher}
                            isProcessing={isSavingExp}
                            isLoading={isLoadingFinancial}
                        />
                    )
                }

                {/* EDIT TAB CONTENT */}
                {
                    activeTab === 'edit' && canEdit && (
                        <EditTab
                            player={player}
                            canEdit={canEdit}
                            handleAvatarChange={handleAvatarChange}
                            handleDeleteAvatar={handleDeleteAvatar}
                            handleUpdate={handleUpdate}
                            handleSocialUpdate={handleSocialUpdate}
                            ALL_PLAY_STYLES={ALL_PLAY_STYLES}
                            togglePlayStyle={togglePlayStyle}
                            handleOpenUploadModal={handleOpenUploadModal}
                            handleDeleteImage={handleDeleteImage}
                            setActiveTab={setActiveTab}
                            handleSaveProfile={handleSaveProfile}
                        />
                    )
                }

            </div >

            {/* FULLSCREEN IMAGE LIGHTBOX */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                            <span className="material-icons-outlined text-4xl">close</span>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Fullscreen view"
                            className="max-h-screen max-w-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }

            {/* MESSAGE DETAILS MODAL */}
            {
                viewedMessage && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center sm:p-4 overflow-y-auto">
                        <div className="bg-surface-dark border-x border-b sm:border border-white/10 rounded-b-3xl sm:rounded-[2.5rem] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                            {/* Header */}
                            <div className={`p-6 sm:p-8 flex justify-between items-center ${viewedMessage.category === 'poll' ? 'bg-cyan-600/20' :
                                viewedMessage.category === 'private' ? 'bg-secondary/20' :
                                    viewedMessage.category === 'bonus' ? 'bg-green-600/20' :
                                        'bg-primary/20'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <span className="material-icons-outlined text-3xl">
                                        {viewedMessage.category === 'poll' ? 'poll' :
                                            viewedMessage.category === 'private' ? 'chat' :
                                                viewedMessage.category === 'bonus' ? 'redeem' :
                                                    'notifications'}
                                    </span>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">{viewedMessage.subject}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{viewedMessage.from} • {viewedMessage.date}</p>
                                            {senderProfile?.suprema_nickname && (
                                                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-blue-500/20 uppercase tracking-tighter">
                                                    Nick Suprema: {senderProfile.suprema_nickname}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setViewedMessage(null); setReplyMode(false); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 sm:p-8 lg:p-10">
                                <div className="text-gray-300 text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                                    {viewedMessage.content}
                                </div>

                                {/* POLL SPECIFIC UI */}
                                {viewedMessage.category === 'poll' && polls && (() => {
                                    const poll = polls.find(p => p.id === viewedMessage.pollId);
                                    if (!poll) return (
                                        <div className="bg-black/20 border border-cyan-500/20 rounded-3xl p-6 mb-8 text-center">
                                            <span className="material-icons-outlined text-cyan-400 text-3xl block mb-2">how_to_vote</span>
                                            <p className="text-gray-400 text-sm">Esta enquete não está mais disponível.</p>
                                        </div>
                                    );

                                    // Compute vote counts from poll_votes (passed via userVotes keys — admin sees all, user sees theirs)
                                    const userVote = userVotes ? userVotes[poll.id] : undefined;
                                    const opts: string[] = Array.isArray(poll.options) ? poll.options : [];

                                    // For vote percentages, count based on what's available
                                    // poll.vote_counts should come from DB aggregate — fallback to 0 if missing
                                    const voteCounts: number[] = opts.map((_, i) =>
                                        (poll.vote_counts && poll.vote_counts[i]) ? poll.vote_counts[i] : 0
                                    );
                                    const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

                                    return (
                                        <div className="bg-gradient-to-b from-cyan-900/20 to-black/30 border border-cyan-500/20 rounded-3xl p-6 mb-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                                    <span className="material-icons-outlined text-cyan-400">how_to_vote</span>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-cyan-400 font-black uppercase tracking-widest mb-0.5">Enquete Ativa</div>
                                                    <h4 className="text-white font-bold text-lg leading-tight">{poll.question}</h4>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {opts.map((opt, idx) => {
                                                    const count = voteCounts[idx] || 0;
                                                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                                    const isSelected = userVote === idx;
                                                    const hasVoted = userVote !== undefined;

                                                    return (
                                                        <div key={idx} className="relative">
                                                            <button
                                                                disabled={hasVoted}
                                                                onClick={() => onVotePoll && onVotePoll(poll.id, idx)}
                                                                className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden
                                                                ${isSelected
                                                                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                                                        : hasVoted
                                                                            ? 'border-white/10 bg-black/20 text-gray-400 cursor-default'
                                                                            : 'border-white/10 bg-black/20 hover:border-cyan-400/50 hover:bg-cyan-500/5 text-white cursor-pointer hover:scale-[1.01]'
                                                                    }`}
                                                            >
                                                                {/* Progress bar */}
                                                                {hasVoted && (
                                                                    <div
                                                                        className={`absolute inset-0 transition-all duration-1000 rounded-2xl ${isSelected ? 'bg-cyan-500/15' : 'bg-white/5'}`}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                )}
                                                                <div className="relative z-10 flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        {isSelected && (
                                                                            <span className="material-icons-outlined text-cyan-400 text-sm">check_circle</span>
                                                                        )}
                                                                        {!isSelected && !hasVoted && (
                                                                            <span className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"></span>
                                                                        )}
                                                                        {!isSelected && hasVoted && (
                                                                            <span className="w-5 h-5 rounded-full border-2 border-white/10 flex-shrink-0"></span>
                                                                        )}
                                                                        <span className="font-bold text-sm">{opt}</span>
                                                                    </div>
                                                                    {hasVoted && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-sm font-black ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`}>{pct}%</span>
                                                                            <span className="text-[10px] text-gray-600">{count} votos</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                                                    {userVote !== undefined ? `Seu voto: "${opts[userVote]}" · ` : 'Clique para votar · '}
                                                    {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} registrados
                                                </p>
                                                {!poll.active && (
                                                    <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">Encerrada</span>
                                                )}
                                            </div>

                                            {/* ADMIN: Results table */}
                                            {isAdmin && (
                                                <div className="mt-6 pt-6 border-t border-white/10">
                                                    <div className="text-xs text-cyan-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="material-icons-outlined text-sm">bar_chart</span>
                                                        Resultados (Admin)
                                                    </div>
                                                    <div className="space-y-2">
                                                        {opts.map((opt, idx) => {
                                                            const count = voteCounts[idx] || 0;
                                                            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                                            return (
                                                                <div key={idx} className="flex items-center gap-3">
                                                                    <span className="text-xs text-gray-400 w-32 truncate">{opt}</span>
                                                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-700"
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-white w-12 text-right">{count} ({pct}%)</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-[10px] text-gray-600 mt-3">Total: {totalVotes} respondentes</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* REPLY UI */}
                                {viewedMessage.category === 'private' && (
                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        {!replyMode ? (
                                            <button
                                                onClick={() => setReplyMode(true)}
                                                className="flex items-center gap-2 text-secondary font-bold hover:underline"
                                            >
                                                <span className="material-icons-outlined">reply</span> Responder esta mensagem
                                            </button>
                                        ) : (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                <textarea
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white resize-none h-32 focus:border-secondary outline-none transition-all"
                                                    placeholder="Escreva sua resposta..."
                                                    value={replyContent}
                                                    onChange={e => setReplyContent(e.target.value)}
                                                ></textarea>
                                                <div className="flex gap-4">
                                                    <button onClick={() => setReplyMode(false)} className="px-6 py-2 text-gray-500 font-bold hover:text-white transition-colors">Cancelar</button>
                                                    <button
                                                        onClick={async () => {
                                                            if (onReply && replyContent.trim()) {
                                                                try {
                                                                    setIsSavingExp(true);
                                                                    await onReply(viewedMessage.id, replyContent);
                                                                    setReplyContent('');
                                                                    setReplyMode(false);
                                                                    setViewedMessage(null);
                                                                    alert('Resposta enviada!');
                                                                } catch (err: any) {
                                                                    alert('Erro ao enviar resposta: ' + err.message);
                                                                } finally {
                                                                    setIsSavingExp(false);
                                                                }
                                                            }
                                                        }}
                                                        disabled={isSavingExp}
                                                        className={`flex-grow bg-secondary hover:bg-white text-black font-bold py-2 rounded-xl transition-all shadow-neon-blue ${isSavingExp ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isSavingExp ? 'Enviando...' : 'Enviar Resposta'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                <div className="mt-10 flex justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Excluir esta mensagem permanentemente?')) {
                                                onDeleteMessage?.(viewedMessage.id);
                                                setViewedMessage(null);
                                            }
                                        }}
                                        className="px-8 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-2xl border border-red-500/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-icons-outlined text-sm">delete_outline</span>
                                        Excluir
                                    </button>
                                    <button
                                        onClick={() => setViewedMessage(null)}
                                        className="px-12 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- DAILY CLAIM MODAL --- */}
            {
                showClaimModal && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_0_50px_rgba(250,204,21,0.2)] flex flex-col max-h-[90vh]">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-pink shrink-0">
                                <span className="material-icons-outlined text-3xl text-white">redeem</span>
                            </div>

                            {claimAnimation ? (
                                <div className="animate-in zoom-in duration-500 py-2 overflow-y-auto custom-scrollbar">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                        <span className="material-icons-outlined text-3xl text-green-500">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">RESGATADO!</h3>
                                    <div className="text-4xl font-black text-primary mb-3 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                        +{claimedRewardRef.current?.reward_label}
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6 max-w-[200px] mx-auto">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-1000" style={{ width: '100%' }}></div>
                                    </div>
                                    <p className="text-gray-400 text-xs font-medium">Volte amanhã às <span className="text-white font-bold">21:00</span> para mais!</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col overflow-hidden">
                                    <div className="mb-4 shrink-0">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Bônus Diário</h3>
                                        <div className="flex items-center justify-center gap-2 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                                            <span className="w-8 h-[1px] bg-primary/30"></span>
                                            Dia {activeDailyRewards ? Math.min(player.dailyStreak + 1, activeDailyRewards.length) : (player.dailyStreak % 7) + 1}
                                            <span className="w-8 h-[1px] bg-primary/30"></span>
                                        </div>
                                    </div>

                                    {/* Reward Card - compact */}
                                    <div className="bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 rounded-2xl p-4 mb-4 relative overflow-hidden shrink-0">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative z-10 flex items-center justify-between gap-3">
                                            <div className="text-left">
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Sua Recompensa Hoje</div>
                                                <div className="text-2xl sm:text-3xl font-black tracking-tighter">
                                                    <span className="text-primary">
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'brl' ? 'R$ ' : '+'}
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_value}
                                                    </span>
                                                    <span className="text-sm ml-1 text-gray-400">
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'xp' ? 'XP' :
                                                            activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'chipz' ? 'CHIPZ' : ''}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-600 mt-0.5">
                                                    {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_label}
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-icons-outlined text-xl text-primary">
                                                    {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'brl' ? 'payments' :
                                                        activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'chipz' ? 'toll' : 'auto_awesome'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rewards Table Toggle */}
                                    <button
                                        onClick={() => setShowRewardsTable(prev => !prev)}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white transition-all mb-3 shrink-0"
                                    >
                                        <span className="material-icons-outlined text-[14px] text-secondary">calendar_month</span>
                                        {showRewardsTable ? 'Ocultar tabela' : 'Ver tabela completa'}
                                        <span className={`material-icons-outlined text-[14px] transition-transform duration-300 ${showRewardsTable ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {showRewardsTable && (
                                        <div className="mb-3 overflow-hidden rounded-xl border border-white/10 animate-in slide-in-from-top-2 duration-300 shrink-0">
                                            <div className="bg-black/40 px-3 py-2 border-b border-white/10 flex items-center gap-2">
                                                <span className="material-icons-outlined text-xs text-secondary">emoji_events</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recompensas por Dia</span>
                                            </div>
                                            <div className="divide-y divide-white/5 max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar">
                                                {activeDailyRewards.map((reward, i) => {
                                                    const isCurrentDay = i === Math.min(player.dailyStreak, activeDailyRewards.length - 1);
                                                    const isPast = i < player.dailyStreak;
                                                    const isFuture = i > player.dailyStreak;
                                                    const canClaimThis = !isFuture && canClaimDaily;

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={canClaimThis ? () => handleClaimToday() : undefined}
                                                            className={`flex items-center justify-between px-3 py-2 transition-colors ${isCurrentDay ? 'bg-primary/10 border-l-2 border-primary' :
                                                                isPast ? 'bg-white/5 cursor-pointer hover:bg-white/10' :
                                                                    isFuture ? 'opacity-30 cursor-not-allowed' : ''
                                                                } ${canClaimThis && !isCurrentDay ? 'cursor-pointer hover:bg-white/10' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[9px] font-black w-8 ${isCurrentDay ? 'text-primary' : isPast ? 'text-gray-400' : 'text-gray-600'
                                                                    }`}>
                                                                    DIA {reward.day ?? i + 1}
                                                                </span>
                                                                <span className={`material-icons-outlined text-[14px] ${reward.reward_type === 'brl' ? 'text-green-400' :
                                                                    reward.reward_type === 'chipz' ? 'text-secondary' : 'text-blue-400'
                                                                    }`}>
                                                                    {reward.reward_type === 'brl' ? 'payments' :
                                                                        reward.reward_type === 'chipz' ? 'toll' : 'auto_awesome'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] sm:text-xs font-bold ${isCurrentDay ? 'text-primary' :
                                                                    isPast ? 'text-gray-300' : 'text-gray-600'
                                                                    }`}>
                                                                    {reward.reward_label}
                                                                </span>
                                                                {isCurrentDay && <span className="text-[8px] font-black text-primary bg-primary/10 border border-primary/30 px-1 py-0.5 rounded-full uppercase">Hoje</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-y-auto custom-scrollbar pr-1 shrink-0 space-y-2 mt-auto">
                                        <button
                                            onClick={handleClaimToday}
                                            className="w-full py-3 sm:py-4 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] hover:bg-right text-white font-black text-sm rounded-xl shadow-[0_5px_15px_rgba(250,204,21,0.2)] transition-all duration-500 active:scale-95 uppercase tracking-wider"
                                        >
                                            RESGATAR DE HOJE
                                        </button>
                                        <button
                                            onClick={handleSkipToday}
                                            className="w-full py-2.5 text-gray-400 hover:text-white border border-gray-600 hover:border-white font-bold text-xs rounded-lg transition-colors active:scale-95"
                                        >
                                            PULAR RECOMPENSA E MELHORAR AMANHÃ
                                        </button>
                                        <button
                                            onClick={() => setShowClaimModal(false)}
                                            className="w-full py-2 text-gray-500 hover:text-white font-bold text-[10px] transition-colors uppercase tracking-widest mb-1"
                                        >
                                            FECHAR (Guarda para depois)
                                        </button>
                                        <div className="flex items-center justify-center gap-1.5 pt-1 text-gray-500 text-[9px] font-bold uppercase tracking-widest border-t border-white/5">
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                            Reset: <span className="text-white">21:00H</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* ... (Restante dos modais: CROP, UPLOAD, MESSAGE permanecem iguais) ... */}
            {/* CROP IMAGE MODAL / GALLERY CONFIRM */}
            {
                editorImage && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md p-6 animate-float shadow-2xl flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white mb-4">
                                {cropTarget === 'avatar' ? 'Ajustar Foto do Perfil' : 'Inserir Foto na Galeria'}
                            </h3>
                            <div
                                className={`relative w-[280px] h-[280px] ${cropTarget === 'avatar' ? 'rounded-full' : 'rounded-2xl'} overflow-hidden border-4 border-white/20 ${cropTarget === 'avatar' ? 'cursor-move' : ''} bg-black mb-6 select-none touch-none`}
                                onMouseDown={cropTarget === 'avatar' ? onMouseDown : undefined}
                                onMouseMove={cropTarget === 'avatar' ? onMouseMove : undefined}
                                onMouseUp={onMouseUp}
                                onMouseLeave={onMouseUp}
                                onTouchStart={cropTarget === 'avatar' ? onMouseDown : undefined}
                                onTouchMove={cropTarget === 'avatar' ? onMouseMove : undefined}
                                onTouchEnd={onMouseUp}
                            >
                                <img
                                    ref={imageRef}
                                    src={editorImage}
                                    alt="Edit"
                                    className={`absolute max-w-none origin-center select-none pointer-events-none ${cropTarget === 'gallery' ? 'w-full h-full object-contain' : ''}`}
                                    style={cropTarget === 'avatar' ? {
                                        transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${zoom})`,
                                        left: '50%',
                                        top: '50%'
                                    } : {
                                        left: '0',
                                        top: '0'
                                    }}
                                />
                            </div>
                            {cropTarget === 'avatar' && (
                                <div className="w-full px-4 mb-6">
                                    <label className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                                        <span className="material-icons-outlined text-sm">zoom_in</span> Zoom
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="3"
                                        step="0.05"
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => setEditorImage(null)}
                                    className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCrop}
                                    className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg transition-colors"
                                >
                                    {cropTarget === 'avatar' ? 'Salvar Foto' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* RECEIPTS (VIEWING RECEIPT MODAL) */}
            {viewingReceipt && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-float shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary">receipt_long</span>
                                    Recibo do Evento
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">
                                    {viewingReceipt.events?.title || 'Torneio'} • {viewingReceipt.events?.date || ''}
                                </p>
                            </div>
                            <button onClick={() => setViewingReceipt(null)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <span className="block text-[10px] text-gray-500 uppercase font-black mb-1">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewingReceipt.status === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {viewingReceipt.status === 'open' ? 'Em Aberto' : 'Encerrada'}
                                    </span>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <span className="block text-[10px] text-gray-500 uppercase font-black mb-1">ID Comanda</span>
                                    <span className="text-sm font-mono text-white">#{viewingReceipt.id.slice(0, 8)}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-4 h-[1px] bg-white/10"></span>
                                    Itens Consumidos
                                    <span className="w-4 h-[1px] bg-white/10"></span>
                                </h4>
                                <div className="space-y-2">
                                    {receiptItems.length > 0 ? receiptItems.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 group">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">{item.products?.name || 'Item'}</span>
                                                <span className="text-[10px] text-gray-600 uppercase font-bold">{item.products?.category || ''}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-white font-black">R$ {Number(item.paid_brl).toFixed(2)}</span>
                                                <span className="block text-[10px] text-gray-600">vía {item.payment_method || 'saldo'}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center py-8 text-gray-600 italic text-sm">Nenhum item consumido registrado.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-3">
                                {Number(viewingReceipt.discount_brl) > 0 && (
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-500 uppercase">Desconto</span>
                                        <span className="text-pink-500">- R$ {Number(viewingReceipt.discount_brl).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(viewingReceipt.unpaid_amount_brl) > 0 && (
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-500 uppercase tracking-widest">Valor Pendurado (Fiado)</span>
                                        <span className="text-orange-400">R$ {Number(viewingReceipt.unpaid_amount_brl).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(viewingReceipt.chips_payment_brl) > 0 && (
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-500 uppercase">Pago em Espécie</span>
                                        <span className="text-cyan-400">R$ {Number(viewingReceipt.chips_payment_brl).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400 font-bold uppercase text-xs">Total Comanda</span>
                                <span className="text-3xl font-black text-white">R$ {Number(viewingReceipt.total_brl || 0).toFixed(2)}</span>
                            </div>

                            {viewingReceipt.status === 'open' && isOwnProfile && (
                                <button
                                    onClick={() => handlePayOpenCommand(viewingReceipt)}
                                    disabled={financialIsSaving}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(0,224,255,0.3)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                                >
                                    {financialIsSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons-outlined">account_balance_wallet</span>
                                            Pagar Agora com Saldo
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOAD PHOTO MODAL (GALLERY) */}
            {
                showUploadModal && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md p-6 animate-float shadow-2xl">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary">add_a_photo</span>
                                    Selecionar Foto
                                </h3>
                                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Opção 1: Colar URL da Imagem</label>
                                    <input
                                        type="text"
                                        value={newPhotoUrl}
                                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-secondary outline-none placeholder-gray-600"
                                        placeholder="https://exemplo.com/foto.jpg"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/10"></div>
                                    <span className="text-xs text-gray-500">OU</span>
                                    <div className="h-px flex-1 bg-white/10"></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Opção 2: Upload Local (Simulado)</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <span className="material-icons-outlined text-3xl text-gray-400 mb-2">cloud_upload</span>
                                            <p className="text-xs text-gray-400">Clique para selecionar arquivo</p>
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                                {newPhotoUrl && (
                                    <div className="mt-4 p-2 bg-black/20 rounded border border-white/5">
                                        <p className="text-sm text-gray-500 mb-2">Pré-visualização:</p>
                                        <img src={newPhotoUrl} alt="Preview" className="w-full h-40 object-cover rounded" />
                                    </div>
                                )}
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmAddImage}
                                        disabled={!newPhotoUrl}
                                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${newPhotoUrl
                                            ? 'bg-primary hover:bg-primary/90 shadow-lg'
                                            : 'bg-gray-700 cursor-not-allowed'
                                            }`}
                                    >
                                        Adicionar à Galeria
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MESSAGE MODAL */}
            {
                showMessageModal && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-lg p-6 animate-float shadow-2xl">
                            {messageSent ? (
                                <div className="text-center py-8">
                                    <span className="material-icons-outlined text-green-500 text-5xl mb-4">check_circle</span>
                                    <h3 className="text-xl font-bold text-white mb-2">Mensagem Enviada!</h3>
                                    <p className="text-gray-400">Sua mensagem foi entregue para {player.name}.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessageSubmit}>
                                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <span className="material-icons-outlined text-primary">mail</span>
                                            Nova Mensagem
                                        </h3>
                                        <button type="button" onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-white">
                                            <span className="material-icons-outlined">close</span>
                                        </button>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-400 mb-1">Para:</p>
                                        <div className="text-white font-bold text-lg flex items-center gap-2">
                                            <img src={player.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                            {player.name}
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder={`Escreva algo para ${player.name.split(' ')[0]}...`}
                                            className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none resize-none"
                                            autoFocus
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowMessageModal(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!messageText.trim()}
                                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${messageText.trim()
                                                ? 'bg-primary hover:bg-primary/90 shadow-lg'
                                                : 'bg-gray-700 cursor-not-allowed'
                                                }`}
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )
            }
            {/* EVENT FLYER MODAL (RESULTADOS) */}
            {
                viewClosedEvent && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <div
                            className="relative h-full max-h-[calc(100vh-40px)] aspect-[3/4] bg-[#050214] border border-secondary/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,224,255,0.15)] flex flex-col"
                        >
                            {/* Background Glows */}
                            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                            {/* Close Button */}
                            <button
                                onClick={() => setViewClosedEvent(null)}
                                className="absolute top-4 right-4 z-[130] w-10 h-10 flex items-center justify-center bg-black/40 text-white hover:text-red-500 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm border border-white/5"
                            >
                                <span className="material-icons-outlined text-xl">close</span>
                            </button>

                            {/* --- RESULT FLYER CONTENT --- */}

                            {/* 1. Header & Champion Section */}
                            <div className="pt-8 pb-2 px-6 text-center shrink-0 flex flex-col items-center">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    {viewClosedEvent.date.split('-').reverse().join('/')}
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-wider">{viewClosedEvent.title}</h3>

                                {/* CHAMPION DISPLAY */}
                                {(() => {
                                    const winner = viewClosedEvent.results?.find(r => r.position === 1);
                                    return winner ? (
                                        <div className="flex flex-col items-center mb-4">
                                            <div className="relative mb-6">
                                                <div className="absolute -inset-6 bg-gradient-to-t from-secondary/20 to-transparent rounded-full blur-2xl"></div>
                                                <img
                                                    src={getPlayerAvatar(winner.name)}
                                                    alt="Campeão"
                                                    className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] object-cover relative z-10"
                                                />
                                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-black text-xs px-4 py-1 rounded-full shadow-lg z-20 border-2 border-black">
                                                    CAMPEÃO
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white leading-tight uppercase">{winner.name}</h2>
                                                {winner.prize > 0 && (
                                                    <div className="text-2xl font-bold text-green-400 mt-2">
                                                        R$ {winner.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                                <div className="text-xl font-display font-bold text-secondary mt-2 bg-secondary/10 px-4 py-1 rounded-full inline-block border border-secondary/30">
                                                    {(() => {
                                                        const mainRankingId = viewClosedEvent.includedRankings?.find(id => winner.pointsPerRanking?.[id] !== undefined) || viewClosedEvent.includedRankings?.[0];
                                                        return mainRankingId
                                                            ? (winner.pointsPerRanking?.[mainRankingId] ?? winner.calculatedPoints)
                                                            : winner.calculatedPoints;
                                                    })()} PTS
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-gray-500">Resultado não disponível.</div>
                                    );
                                })()}
                            </div>

                            {/* 2. Stats Grid */}
                            <div className="px-8 mb-6 shrink-0">
                                <div className="grid grid-cols-2 sm:grid-cols-4 bg-white/[0.03] rounded-2xl border border-white/5 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-white/5 p-4">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Jogadores</span>
                                        <span className="text-lg font-bold text-white">{viewClosedEvent.results?.length || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Rebuys</span>
                                        <span className="text-lg font-bold text-white">{viewClosedEvent.totalRebuys || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Add-ons</span>
                                        <span className="text-lg font-bold text-white">{viewClosedEvent.totalAddons || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Premiação</span>
                                        <span className="text-xs font-bold text-green-400 text-center leading-tight">
                                            {viewClosedEvent.totalPrize ? `R$${viewClosedEvent.totalPrize.toLocaleString('pt-BR', { notation: 'compact' })}` : 'R$ 0'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Results List (Scrollable) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                                <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md z-10">
                                            <tr>
                                                <th className="px-4 py-4 text-center w-12">#</th>
                                                <th className="px-4 py-4">Jogador</th>
                                                <th className="px-4 py-4 text-right">Prêmio</th>
                                                <th className="px-4 py-4 text-center">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {viewClosedEvent.results
                                                ?.filter(r => r.position > 1)
                                                .sort((a, b) => a.position - b.position)
                                                .map((result) => (
                                                    <tr key={result.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold text-xs ${result.position === 2 ? 'bg-gray-400 text-black' :
                                                                result.position === 3 ? 'bg-orange-700 text-white' :
                                                                    'bg-white/5 text-gray-500'
                                                                }`}>
                                                                {result.position}º
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-gray-300">
                                                            {result.name}
                                                        </td>
                                                        <td className="px-4 py-4 text-right text-green-500 font-bold">
                                                            {result.prize > 0 ? `R$ ${result.prize.toLocaleString('pt-BR')}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-4 text-center font-display font-black text-secondary">
                                                            {(() => {
                                                                const mainRankingId = viewClosedEvent.includedRankings?.find(id => result.pointsPerRanking?.[id] !== undefined) || viewClosedEvent.includedRankings?.[0];
                                                                return mainRankingId
                                                                    ? (result.pointsPerRanking?.[mainRankingId] ?? result.calculatedPoints)
                                                                    : result.calculatedPoints;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 4. Footer */}
                            <div className="bg-[#050821] px-8 py-4 border-t border-white/5 flex justify-between items-center shrink-0">
                                <div className="flex items-center h-8">
                                    <img src="/cr-logo.png" alt="Chip Race" className="h-full w-auto drop-shadow-md" />
                                </div>
                                <div className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                                    Resultados Oficiais
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Receipt Details Modal */}
            {
                viewingReceipt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/90 backdrop-blur-md">
                        <div className="bg-[#0f0a28] border-x border-b sm:border border-white/10 rounded-b-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                            <div className="p-5 flex-shrink-0 border-b border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                                            <span className="material-icons-outlined text-green-400 text-xl">receipt_long</span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-display font-black text-white uppercase">{viewingReceipt.events?.title || 'Torneio'}</h4>
                                            <p className="text-gray-500 text-xs">{viewingReceipt.closed_at ? new Date(viewingReceipt.closed_at).toLocaleString('pt-BR') : 'Sem data'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setViewingReceipt(null)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all">
                                        <span className="material-icons-outlined text-gray-400 text-sm">close</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                                {receiptItems.length === 0 ? (
                                    <p className="text-gray-600 text-sm italic text-center py-8">Nenhum item consumido.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {receiptItems.map((item, i) => {
                                            const time = item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                                            const rawName = item.products?.name || item.notes?.split(' —')[0] || 'Item';
                                            const name = rawName.replace(/(Lançado às \d{2}:\d{2})/g, '').replace(/Lançado às \d{2}:\d{2}/, '').trim();
                                            const detail = item.notes?.includes('—') ? item.notes.split('— ')[1].replace(/(Lançado às \d{2}:\d{2})/g, '').trim() : null;
                                            const price = Number(item.total_price_brl);
                                            return (
                                                <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 w-8">{time}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-300 font-bold truncate">{name}</p>
                                                            {detail && <p className="text-[10px] text-gray-500 truncate">{detail}</p>}
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-black whitespace-nowrap ${price === 0 ? 'text-green-400' : 'text-white'}`}>
                                                        {price === 0 ? 'GRÁTIS' : `R$ ${price.toFixed(2)}`}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {Number(viewingReceipt.chips_payment_brl) > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500 uppercase font-bold">Pago em Espécie</span>
                                                <span className="text-cyan-400">R$ {Number(viewingReceipt.chips_payment_brl).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {/* Cálculo do que foi descontado do saldo */}
                                        {(() => {
                                            const total = Number(viewingReceipt.total_brl || 0);
                                            const disc = Number(viewingReceipt.discount_brl || 0);
                                            const debt = Number(viewingReceipt.unpaid_amount_brl || 0);
                                            const chips = Number(viewingReceipt.chips_payment_brl || 0);
                                            const balanceUsed = Math.max(0, total - disc - debt - chips);

                                            return balanceUsed > 0 ? (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 uppercase font-bold">Créditos App</span>
                                                    <span className="text-green-400">R$ {balanceUsed.toFixed(2)}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                                        {viewingReceipt.status === 'open' ? 'Total Parcial' : 'Total Consumido'}
                                    </span>
                                    <span className={`text-xl font-display font-black ${viewingReceipt.status === 'open' ? 'text-red-400' : 'text-white'}`}>
                                        R$ {Number(viewingReceipt.total_brl).toFixed(2)}
                                    </span>
                                </div>

                                {viewingReceipt.status === 'closed' && viewingReceipt.metadata?.is_vip_voucher && !viewingReceipt.metadata?.activated && isOwnProfile && (() => {
                                    const vipType = viewingReceipt.metadata?.vip_type;
                                    const isHonorario = vipType === 'honorario';
                                    return (
                                        <div className="mt-4 bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-4 animate-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                                    <span className="material-icons-outlined text-primary text-xl">stars</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-xs uppercase tracking-widest">
                                                        {isHonorario ? 'VIP Honorário Disponível' : 'Voucher VIP Disponível'}
                                                    </h4>
                                                    <p className="text-gray-400 text-[9px] uppercase font-bold">
                                                        {isHonorario ? 'Resgate via Conquista' : `Plano: ${vipType?.toUpperCase() || 'VIP'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {isHonorario ? (
                                                    // Honorário: apenas 30 dias
                                                    <button
                                                        onClick={() => handleActivateVipVoucher(viewingReceipt.id, 'honorario')}
                                                        disabled={isSavingExp}
                                                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-white hover:to-white text-white hover:text-black border border-primary/40 text-[11px] font-black py-4 rounded-2xl transition-all uppercase tracking-[0.2em] shadow-neon-pink active:scale-[0.98] flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-icons-outlined text-sm">workspace_premium</span>
                                                        Ativar VIP Honorário (30 dias)
                                                    </button>
                                                ) : (
                                                    // Outros tipos: opções de duração
                                                    <>
                                                        <button
                                                            onClick={() => handleActivateVipVoucher(viewingReceipt.id, '1month')}
                                                            disabled={isSavingExp}
                                                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <span className="material-icons-outlined text-sm">event</span>
                                                            Ativar por 1 Mês
                                                        </button>
                                                        <button
                                                            onClick={() => handleActivateVipVoucher(viewingReceipt.id, '3months')}
                                                            disabled={isSavingExp}
                                                            className="w-full bg-secondary/20 hover:bg-secondary/30 border border-secondary/40 text-secondary text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                                        >
                                                            <span className="material-icons-outlined text-sm">history</span>
                                                            Ativar por 3 Meses
                                                        </button>
                                                        <button
                                                            onClick={() => handleActivateVipVoucher(viewingReceipt.id, 'december')}
                                                            disabled={isSavingExp}
                                                            className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-black py-3 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-neon-pink"
                                                        >
                                                            <span className="material-icons-outlined text-sm">workspace_premium</span>
                                                            Ativar até Dezembro
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[8px] text-gray-500 text-center italic">*Após ativado, este receipt será marcado como utilizado.</p>
                                        </div>
                                    );
                                })()}

                                {viewingReceipt.status === 'closed' && viewingReceipt.metadata?.is_vip_voucher && viewingReceipt.metadata?.activated && (
                                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                            <span className="material-icons-outlined text-green-400">check_circle</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-xs uppercase tracking-widest">VIP Já Ativado</h4>
                                            <p className="text-gray-400 text-[9px] uppercase font-bold">Voucher Utilizado em {new Date(viewingReceipt.metadata.activated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                {viewingReceipt.status === 'open' && Number(viewingReceipt.total_brl) > 0 && (
                                    <button
                                        onClick={() => handlePayOpenCommand(viewingReceipt)}
                                        disabled={isSavingExp}
                                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-neon-green uppercase tracking-widest flex items-center justify-center gap-2 group mt-2"
                                    >
                                        <span className="material-icons-outlined text-xl group-hover:scale-110 transition-transform">payments</span>
                                        {player.balanceBrl < Number(viewingReceipt.total_brl) ? 'Saldo Insuficiente' : 'Pagar com meu Saldo'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};