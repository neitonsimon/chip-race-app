import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, RankingPlayer, TournamentResult, Event, ExperienceLevel, Message, Poll, MessageCategory, DailyReward } from '../types';
import { supabase } from '../src/lib/supabase';

interface PlayerProfileProps {
    isAdmin?: boolean;
    isLoggedIn?: boolean;
    initialData?: RankingPlayer;
    onSendMessage?: (to: string, content: string) => void;
    onUpdateProfile?: (originalName: string, updatedData: PlayerStats) => void;
    currentUser?: {
        id?: string;
        name: string;
        avatar: string;
        city?: string;
        bio?: string;
        playStyles?: string[];
        gallery?: string[];
        social?: { instagram?: string; twitter?: string; discord?: string; };
        level?: number;
        currentExp?: number;
        nextLevelExp?: number;
        lastDailyClaim?: string | null;
        dailyStreak?: number;
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
    onCreatePoll?: (question: string, options: string[]) => void;
    onSendAdminMessage?: (subject: string, content: string, category: MessageCategory, pollId?: string, targetUserId?: string) => void;
    onMarkAsRead?: (id: string) => void;
    onReply?: (id: string, text: string) => void;
}

// Dicionário de Estilos de Jogo com Descrições
const PLAY_STYLE_DEFINITIONS: Record<string, string> = {
    "Iniciante": "Está começando agora a jornada no poker, aprendendo as regras e dinâmicas básicas.",
    "Experiente": "Jogador com boa bagagem, conhece bem as mecânicas, leitura de jogo e gestão de banca.",
    "Agressivo": "Joga muitas mãos e pressiona os oponentes com apostas frequentes.",
    "Passivo": "Joga poucas mãos, prefere dar check e call a apostar.",
    "Tight": "Seletivo. Joga apenas com mãos iniciais fortes.",
    "Loose": "Joga uma grande variedade de mãos iniciais.",
    "Maniac": "Extremamente agressivo, aposta alto com quase qualquer mão.",
    "Rock": "Extremamente sólido e previsível, só entra no pote com o topo do baralho.",
    "Calling Station": "Paga muitas apostas para ver o flop/turn/river, dificilmente folda.",
    "GTO Wizard": "Tenta jogar a estratégia matematicamente perfeita e inexplorável.",
    "Exploitative": "Foca em encontrar e explorar os erros específicos dos oponentes.",
    "Bluffer": "Gosta de contar histórias e tentar ganhar potes sem a melhor mão.",
    "Trapper": "Gosta de fazer armadilhas (slow play) com mãos muito fortes.",
    "Nit": "Super conservador, joga com medo de perder fichas.",
    "TAG": "Tight-Aggressive: Seleciona bem as mãos, mas joga elas de forma agressiva.",
    "LAG": "Loose-Aggressive: Joga muitas mãos e de forma agressiva.",
    "Short Stack Ninja": "Especialista em jogar com poucas fichas (<20BB), sabe as tabelas de push/fold.",
    "Deep Stack Pro": "Especialista em jogar com muitas fichas (>100BB) e pós-flop complexo.",
    "ICM Suicide": "Ignora a pressão do dinheiro em reta final e joga pela vitória a qualquer custo.",
    "Bubble Abuser": "Usa seu stack grande para pressionar os stacks médios na bolha da premiação.",
    "Satellite King": "Especialista em sobreviver para pegar a vaga, evitando riscos desnecessários.",
    "Cash Game Pro": "Jogador focado em mesas a dinheiro, especialista em jogar deep.",
    "MTT Grinder": "Jogador de volume em torneios multimesas, focado em longo prazo.",
    "Heads-Up Specialist": "Especialista em duelo 1x1, entende muito de ranges amplos.",
    "Limper": "Gosta de entrar nas mãos apenas pagando o blind (estratégia passiva).",
    "3-Bet Machine": "Reaumenta (re-raise) com muita frequência pré-flop.",
    "Check-Raiser": "Adora dar check para aumentar a aposta do oponente em seguida.",
    "River Rat": "Tem o hábito de acertar a carta milagrosa no final frequentemente.",
    "Math Geek": "Toma decisões baseadas puramente em probabilidades e equidade.",
    "Feel Player": "Joga baseado em intuição, instinto e leitura corporal.",
    "Tiltless": "Controle emocional absoluto, não se abala com bad beats.",
    "Table Captain": "Domina a mesa, impõe o ritmo do jogo e intimida adversários.",
    "Soul Reader": "Lê a mão do adversário com precisão assustadora.",
    "Variable": "Muda de estilo conforme a situação, imprevisível.",
    "Mixed Games": "Joga outras modalidades (Omaha, Stud, etc) além de Texas Hold'em."
};

const ALL_PLAY_STYLES = Object.keys(PLAY_STYLE_DEFINITIONS);

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=333&color=fff";

// Daily Reward Config
const FALLBACK_DAILY_REWARDS: DailyReward[] = [
    { day: 1, reward_type: 'xp', reward_value: 100, reward_label: '100 XP' },
    { day: 2, reward_type: 'xp', reward_value: 200, reward_label: '200 XP' },
    { day: 3, reward_type: 'chipz', reward_value: 50, reward_label: '50 Chipz' },
    { day: 4, reward_type: 'xp', reward_value: 400, reward_label: '400 XP' },
    { day: 5, reward_type: 'chipz', reward_value: 100, reward_label: '100 Chipz' },
    { day: 6, reward_type: 'xp', reward_value: 800, reward_label: '800 XP' },
    { day: 7, reward_type: 'brl', reward_value: 10, reward_label: 'R$ 10,00' }
];


type TabView = 'overview' | 'edit' | 'inbox';

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
    isAdmin,
    isLoggedIn,
    initialData,
    onSendMessage,
    onUpdateProfile,
    currentUser,
    events,
    experienceLevels = [],
    setExperienceLevels,
    dailyRewards = [],
    setDailyRewards,
    messages,
    polls,
    userVotes,
    onVotePoll,
    onCreatePoll,
    onSendAdminMessage,
    onMarkAsRead,
    onReply
}) => {
    const [activeTab, setActiveTab] = useState<TabView>('overview');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    // States para Inbox e Mensagens
    const [inboxFilter, setInboxFilter] = useState<MessageCategory | 'all'>('all');
    const [viewedMessage, setViewedMessage] = useState<Message | null>(null);
    const [replyMode, setReplyMode] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    // Admin Message Box state
    const [adminSubject, setAdminSubject] = useState('');
    const [adminMsgContent, setAdminMsgContent] = useState('');
    const [adminMsgCategory, setAdminMsgCategory] = useState<MessageCategory>('admin');

    // Admin Poll state
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

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
    const [zoom, setZoom] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    // -------------------------------------

    const [isSavingExp, setIsSavingExp] = useState(false);

    // Ref para guardar o nome original para fins de update no "banco"
    const originalNameRef = useRef<string>('');

    // Determina se é o perfil do próprio usuário logado ou de um terceiro
    const isOwnProfile = !initialData;
    // Apenas Admin ou o Próprio Dono (se logado) podem editar
    const canEdit = isAdmin || (isLoggedIn && isOwnProfile);

    // Default data (My Profile)
    const myProfileData: PlayerStats = {
        id: 'CR-1029',
        name: 'Neiton Simon',
        avatar: 'https://ui-avatars.com/api/?name=Neiton+Simon&background=random',
        city: 'Venâncio Aires - RS',
        bio: "Este é o seu perfil pessoal. Seus dados e estatísticas aparecerão aqui.",
        rank: 0,
        points: 0,
        balanceBrl: 0,
        balanceChipz: 0,
        winnings: 'R$ 0,00',
        titles: 0,
        itm: '0%',
        gallery: [],
        playStyles: [],
        social: { instagram: "", twitter: "", discord: "" },
        tournamentLog: [],
        level: 1,
        currentExp: 0,
        nextLevelExp: 1000,
        lastDailyClaim: null,
        dailyStreak: 0,
        isVip: false
    };

    const [player, setPlayer] = useState<PlayerStats>(myProfileData);

    // Sync with selected player if passed from Ranking or use CurrentUser
    useEffect(() => {
        let baseData = { ...myProfileData };

        // 1. Determine Identity (Name, Avatar, Bio...)
        if (initialData) {
            // Viewing someone else
            originalNameRef.current = initialData.name;
            baseData = {
                ...baseData,
                id: `CR-${Math.floor(Math.random() * 9000) + 1000}`,
                name: initialData.name,
                avatar: initialData.avatar,
                city: initialData.city,
                bio: initialData.bio || "Jogador competitivo da liga Chip Race.",
                rank: initialData.rank,
                points: initialData.points,
                winnings: 'R$ ' + (initialData.points * 3.5).toFixed(2),
                gallery: initialData.gallery || [
                    'https://images.unsplash.com/photo-1605153322277-dd0d7f608b4d?w=400&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&h=400&fit=crop'
                ],
                playStyles: initialData.playStyles || ["Agressivo", "Math Geek"],
                social: initialData.social || {
                    instagram: "@" + initialData.name.split(' ')[0].toLowerCase(),
                    twitter: "",
                    discord: ""
                },
                level: initialData.level || Math.floor(Math.random() * 20) + 1,
                currentExp: initialData.currentExp || 500,
                nextLevelExp: initialData.nextLevelExp || 1000
            };
            setActiveTab('overview');
        } else if (currentUser) {
            // Viewing Self
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
            baseData.lastDailyClaim = currentUser.lastDailyClaim || null;
            baseData.dailyStreak = currentUser.dailyStreak || 0;

            originalNameRef.current = baseData.name;

            // CHECK CLAIM AVAILABILITY
            checkClaimAvailability(baseData.lastDailyClaim);
        }

        // 2. Calculate Tournament Log from Real Events (Synchronization)
        let realLogs: TournamentResult[] = [];
        if (events) {
            realLogs = events
                .filter(e => e.status === 'closed' && e.results)
                .map(e => {
                    // Find result for this player
                    const res = e.results?.find(r => r.name.toLowerCase() === baseData.name.toLowerCase());
                    if (res) {
                        return {
                            date: e.date.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
                            eventName: e.title,
                            position: res.position,
                            points: res.calculatedPoints,
                            prize: res.prize > 0 ? `R$ ${res.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'
                        };
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
            if (!initialData) {
                const totalPoints = realLogs.reduce((acc, curr) => acc + curr.points, 0);
                baseData.points = totalPoints;
            }

            const totalPrize = realLogs.reduce((acc, curr) => {
                // Basic parsing of currency string
                const val = parseFloat(curr.prize.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
                return acc + val;
            }, 0);
            baseData.winnings = totalPrize > 0 ? `R$ ${totalPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';

            baseData.titles = realLogs.filter(l => l.position === 1).length;

            const itmCount = realLogs.filter(l => l.prize !== '-').length;
            const itmPercent = realLogs.length > 0 ? Math.round((itmCount / realLogs.length) * 100) : 0;
            baseData.itm = `${itmPercent}%`;

        } else {
            // Fallback / Default
            baseData.tournamentLog = [];
        }

        setPlayer(baseData);

    }, [initialData, currentUser, events]);

    const handleAddPollOption = () => setPollOptions([...pollOptions, '']);
    const handleUpdatePollOption = (index: number, val: string) => {
        const updated = [...pollOptions];
        updated[index] = val;
        setPollOptions(updated);
    };

    const handleSendBroadcast = () => {
        if (onSendAdminMessage && adminSubject && adminMsgContent) {
            onSendAdminMessage(adminSubject, adminMsgContent, adminMsgCategory);
            setAdminSubject('');
            setAdminMsgContent('');
            alert('Comunicado Global enviado!');
        }
    };

    const handleCreatePollSubmit = () => {
        const validOptions = pollOptions.filter(o => o.trim());
        if (onCreatePoll && pollQuestion && validOptions.length >= 2) {
            onCreatePoll(pollQuestion, validOptions);
            setPollQuestion('');
            setPollOptions(['', '']);
            alert('Enquete publicada!');
        }
    };

    const renderInbox = () => {
        const mList = messages || [];
        const filtered = inboxFilter === 'all' ? mList : mList.filter(m => m.category === inboxFilter);

        return (
            <div className="space-y-8 animate-in fade-in duration-500 p-8">
                {/* ÁREA ADMIN */}
                {isAdmin && isOwnProfile && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                        <div className="bg-surface-dark/50 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">campaign</span>
                                Comunicado Global
                            </h3>
                            <div className="space-y-4">
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary transition-all"
                                    placeholder="Assunto do Comunicado"
                                    value={adminSubject}
                                    onChange={e => setAdminSubject(e.target.value)}
                                />
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 outline-none focus:border-primary transition-all resize-none"
                                    placeholder="Conteúdo da mensagem..."
                                    value={adminMsgContent}
                                    onChange={e => setAdminMsgContent(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <select
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 text-white outline-none focus:border-primary"
                                        value={adminMsgCategory}
                                        onChange={e => setAdminMsgCategory(e.target.value as any)}
                                    >
                                        <option value="admin">📣 Admin</option>
                                        <option value="system">⚙️ Sistema</option>
                                        <option value="bonus">🎁 Bônus</option>
                                        <option value="tournament">🏆 Torneio</option>
                                    </select>
                                    <button
                                        onClick={handleSendBroadcast}
                                        className="flex-grow bg-primary hover:bg-white hover:text-black text-white font-bold py-3 rounded-xl transition-all shadow-neon-pink"
                                    >
                                        Enviar Msg
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-dark/50 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-icons-outlined text-secondary">poll</span>
                                Criar Nova Enquete
                            </h3>
                            <div className="space-y-4">
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-secondary transition-all"
                                    placeholder="Qual a pergunta?"
                                    value={pollQuestion}
                                    onChange={e => setPollQuestion(e.target.value)}
                                />
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {pollOptions.map((opt, i) => (
                                        <input
                                            key={i}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-secondary transition-all"
                                            placeholder={`Opção ${i + 1}`}
                                            value={opt}
                                            onChange={e => handleUpdatePollOption(i, e.target.value)}
                                        />
                                    ))}
                                    <button onClick={handleAddPollOption} className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline p-1">
                                        <span className="material-icons-outlined text-sm">add</span> Adicionar Opção
                                    </button>
                                </div>
                                <button
                                    onClick={handleCreatePollSubmit}
                                    className="w-full bg-secondary hover:bg-white text-black font-bold py-3 rounded-xl transition-all shadow-neon-blue"
                                >
                                    Publicar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FILTROS */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['all', 'system', 'admin', 'private', 'bonus', 'tournament', 'poll'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setInboxFilter(cat as any)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${inboxFilter === cat ? 'bg-primary text-white shadow-neon-pink' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {cat === 'all' ? '📬 Todas' :
                                cat === 'system' ? '⚙️ Sistema' :
                                    cat === 'admin' ? '📣 Admin' :
                                        cat === 'private' ? '💬 Privadas' :
                                            cat === 'bonus' ? '🎁 Bônus' :
                                                cat === 'tournament' ? '🏆 Torneio' :
                                                    cat === 'poll' ? '📊 Enquetes' : cat}
                        </button>
                    ))}
                </div>

                {/* LISTA DE MENSAGENS */}
                <div className="grid grid-cols-1 gap-4">
                    {filtered.length === 0 ? (
                        <div className="py-24 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <span className="material-icons-outlined text-6xl text-gray-700 mb-4 block">mail_outline</span>
                            <p className="text-gray-500 text-lg">Sua caixa de entrada está vazia.</p>
                        </div>
                    ) : (
                        filtered.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => {
                                    setViewedMessage(msg);
                                    if (!msg.read && onMarkAsRead) onMarkAsRead(msg.id);
                                }}
                                className={`p-6 rounded-3xl border transition-all cursor-pointer group flex gap-6 items-center ${msg.read ? 'bg-black/20 border-white/5 opacity-80' : 'bg-surface-dark border-primary/30 shadow-[0_0_30px_rgba(217,0,255,0.05)] hover:border-primary/60'}`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.category === 'poll' ? 'bg-purple-500/20 text-purple-400' :
                                    msg.category === 'private' ? 'bg-secondary/20 text-secondary' :
                                        msg.category === 'bonus' ? 'bg-green-500/20 text-green-400' :
                                            msg.category === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                'bg-primary/20 text-primary'
                                    }`}>
                                    <span className="material-icons-outlined text-3xl">
                                        {msg.category === 'poll' ? 'poll' :
                                            msg.category === 'private' ? 'chat' :
                                                msg.category === 'bonus' ? 'redeem' :
                                                    msg.category === 'tournament' ? 'stars' :
                                                        'notifications'}
                                    </span>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                            {msg.from}
                                            {!msg.read && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
                                        </span>
                                        <span className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">{msg.date}</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors truncate">{msg.subject}</h4>
                                    <p className="text-base text-gray-500 line-clamp-1 leading-relaxed">{msg.content}</p>
                                </div>
                                <div className="text-gray-600 group-hover:text-primary transition-colors">
                                    <span className="material-icons-outlined">chevron_right</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
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

    const handleClaimToday = () => {
        // 1. Calculate Rewards
        const streakIndex = Math.min(player.dailyStreak, activeDailyRewards.length - 1);
        const reward = activeDailyRewards[streakIndex];

        // Store claimed reward values BEFORE state update
        claimedRewardRef.current = reward;

        // 2. Logic: Update relevant balances
        let newExp = player.currentExp;
        let newLevel = player.level;
        let requiredExp = player.nextLevelExp;
        let newBalanceBrl = player.balanceBrl || 0;
        let newBalanceChipz = player.balanceChipz || 0;

        if (reward.reward_type === 'xp') {
            newExp += reward.reward_value;
            // Level Up Logic using table
            if (experienceLevels && experienceLevels.length > 0) {
                let nextLvl = experienceLevels.find(l => l.level === newLevel + 1);
                while (nextLvl && newExp >= nextLvl.required_exp) {
                    newLevel++;
                    nextLvl = experienceLevels.find(l => l.level === newLevel + 1);
                }
                requiredExp = nextLvl ? nextLvl.required_exp : (experienceLevels[experienceLevels.length - 1].required_exp + 1000);
            } else {
                // Fallback legacy logic if table not loaded
                while (newExp >= requiredExp) {
                    newExp -= requiredExp;
                    newLevel++;
                    requiredExp = Math.floor(requiredExp * 1.2);
                }
            }
        } else if (reward.reward_type === 'chipz') {
            newBalanceChipz += reward.reward_value;
        } else if (reward.reward_type === 'brl') {
            newBalanceBrl += reward.reward_value;
        }

        // 3. Update Player State -> RESET STREAK TO 0 ON CLAIM
        const newPlayerData = {
            ...player,
            level: newLevel,
            currentExp: newExp,
            nextLevelExp: requiredExp,
            balanceBrl: newBalanceBrl,
            balanceChipz: newBalanceChipz,
            lastDailyClaim: new Date().toISOString(),
            dailyStreak: 0
        };

        setPlayer(newPlayerData);
        setCanClaimDaily(false);
        setClaimAnimation(true);

        // Persist to "DB" (App State)
        if (onUpdateProfile) {
            onUpdateProfile(originalNameRef.current, newPlayerData);
        }

        // 4. Show animation then close modal automatically
        setTimeout(() => {
            setClaimAnimation(false);
            setShowClaimModal(false); // Close the modal after animation
        }, 3000);
    };

    const handleSkipToday = () => {
        // Advance streak day (don't give XP or item)
        // Cap streak at max days so it doesn't break
        const streakIndex = Math.min(player.dailyStreak + 1, activeDailyRewards.length - 1);

        const newPlayerData = {
            ...player,
            lastDailyClaim: new Date().toISOString(),
            dailyStreak: streakIndex
        };

        setPlayer(newPlayerData);
        setCanClaimDaily(false);
        setShowClaimModal(false);

        if (onUpdateProfile) {
            onUpdateProfile(originalNameRef.current, newPlayerData);
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
                setNewPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler específico para Avatar (Abre Editor)
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Em vez de atualizar direto, abre o modal de edição
                setEditorImage(reader.result as string);
                setZoom(0.4); // Zoom inicial mais afastado
                setCropOffset({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
        // Reset input value to allow selecting same file again
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
        if (!editorImage || !imageRef.current) return;

        const canvas = document.createElement('canvas');
        const size = 400; // Resolução final
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Fill background just in case
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, size, size);

            // O "viewport" na tela tem tamanho fixo (ex: 280px).
            // Precisamos mapear a transformação da tela para o canvas final.
            const viewportSize = 280;
            const scaleFactor = size / viewportSize;

            // Move para o centro do canvas
            ctx.translate(size / 2, size / 2);
            // Aplica o deslocamento do usuário (ajustado pela escala de resolução)
            ctx.translate(cropOffset.x * scaleFactor, cropOffset.y * scaleFactor);
            // Aplica o zoom
            ctx.scale(zoom, zoom);
            // Move o ponto de origem da imagem para o centro dela mesma, para que o zoom/rotate seja centralizado
            ctx.translate(-imageRef.current.width * scaleFactor / 2, -imageRef.current.height * scaleFactor / 2);

            // Desenha a imagem redimensionada
            ctx.drawImage(
                imageRef.current,
                0,
                0,
                imageRef.current.width * scaleFactor,
                imageRef.current.height * scaleFactor
            );

            // Converte para Base64 e Salva
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            handleUpdate('avatar', croppedBase64);
            setEditorImage(null); // Fecha o modal
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

    const handleSaveProfile = () => {
        // Chama a função de update do pai para persistir no "banco"
        if (onUpdateProfile) {
            onUpdateProfile(originalNameRef.current, player);
            // Atualiza a ref para o novo nome caso tenha mudado
            originalNameRef.current = player.name;
        }

        alert("Perfil atualizado com sucesso!");
        setActiveTab('overview');
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

    return (
        <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* PROFILE TABS */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-white/10 pb-1">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 px-4 text-base font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'overview'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-white'
                                }`}
                        >
                            Visão Geral
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => setActiveTab('edit')}
                                className={`pb-3 px-4 text-base font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'edit'
                                    ? 'border-secondary text-secondary'
                                    : 'border-transparent text-gray-500 hover:text-white'
                                    }`}
                            >
                                <span className="material-icons-outlined text-base">edit</span> Editar Perfil
                            </button>
                        )}
                        {isOwnProfile && (
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`pb-3 px-4 text-base font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'inbox'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-white'
                                    }`}
                            >
                                <span className="material-icons-outlined text-base">notifications</span> Mensagens
                                {messages && messages.filter(m => !m.read).length > 0 && (
                                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                        {messages.filter(m => !m.read).length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>


                {/* ======================= OVERVIEW TAB ======================= */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                        {/* Left Column: Main Info */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-8 text-center relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>

                                <div className="relative inline-block mb-6 group">
                                    <img
                                        src={player.avatar}
                                        alt={player.name}
                                        className="w-40 h-40 rounded-full border-4 border-gray-100 dark:border-white/10 p-1 mx-auto object-cover"
                                    />
                                    {player.isVip && (
                                        <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full border-2 border-surface-dark z-20 shadow-neon-pink flex items-center gap-1">
                                            <span className="material-icons-outlined text-[10px] md:text-xs">diamond</span>
                                            VIP
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{player.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-base mb-6">{player.city}</p>

                                {/* Social Media Section */}
                                <div className="flex justify-center gap-4 mb-8">
                                    {player.social.instagram && (
                                        <a
                                            href={`https://instagram.com/${player.social.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-pink-600/20 hover:text-pink-500 flex items-center justify-center transition-colors"
                                        >
                                            <span className="material-icons-outlined">photo_camera</span>
                                        </a>
                                    )}
                                    {player.social.twitter && (
                                        <a
                                            href={`https://twitter.com/${player.social.twitter.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-400/20 hover:text-blue-400 flex items-center justify-center transition-colors"
                                        >
                                            <span className="material-icons-outlined">alternate_email</span>
                                        </a>
                                    )}
                                    {player.social.discord && (
                                        <a
                                            href="https://discord.com/app"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-green-500/20 hover:text-green-500 flex items-center justify-center transition-colors"
                                            title={`ID: ${player.social.discord}`}
                                        >
                                            <span className="material-icons-outlined">chat</span>
                                        </a>
                                    )}
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">ID Chip Race</div>
                                            <div className="text-lg font-display font-bold text-white">{player.id}</div>
                                        </div>
                                        {/* NEW XP & LEVEL UI */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nível {player.level}</div>
                                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                    style={{ width: `${xpPercentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[9px] text-gray-400 mt-1">{currentExpInTier} / {displayNextExp} XP</div>
                                        </div>
                                    </div>
                                </div>

                                {!isOwnProfile && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowMessageModal(true)}
                                            className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons-outlined text-base">mail</span> Enviar Mensagem
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* DAILY LOGIN SECTION (Replaced Trophy Room) */}
                            <div className="mt-8 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                                {/* Glow Effect if Claim Available */}
                                {isOwnProfile && canClaimDaily && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none"></div>}

                                <div className="flex justify-between items-center mb-4 w-full">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="material-icons-outlined text-yellow-400">calendar_today</span>
                                        Login Diário
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && isOwnProfile && (
                                            <button
                                                onClick={() => {
                                                    const yesterday = new Date();
                                                    yesterday.setDate(yesterday.getDate() - 1);
                                                    const newLastClaim = yesterday.toISOString();
                                                    const newPlayerData = { ...player, lastDailyClaim: newLastClaim };
                                                    setPlayer(newPlayerData);
                                                    checkClaimAvailability(newLastClaim);
                                                    if (onUpdateProfile) onUpdateProfile(originalNameRef.current, newPlayerData);
                                                }}
                                                className="px-2 py-1 bg-purple-600/20 text-purple-400 text-[10px] font-bold rounded uppercase hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1"
                                                title="DEV: Forçar reset de 24h"
                                            >
                                                <span className="material-icons-outlined text-[12px]">fast_forward</span> DEV: +1 DIA
                                            </button>
                                        )}
                                        <div className="text-xs bg-black/20 px-2 py-1 rounded text-gray-400">
                                            Reset: 21:00
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center text-center py-2">
                                    {isOwnProfile ? (
                                        <>
                                            <div className="mb-4 relative">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${canClaimDaily
                                                    ? 'bg-primary border-primary shadow-neon-pink animate-bounce'
                                                    : 'bg-gray-800 border-gray-700'
                                                    }`}>
                                                    <span className="material-icons-outlined text-3xl text-white">
                                                        {canClaimDaily ? 'redeem' : 'check'}
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-lg font-bold text-white mb-1">
                                                {canClaimDaily ? 'Recompensa Disponível!' : 'Volte amanhã'}
                                            </h4>
                                            <p className="text-sm text-gray-500 mb-4 max-w-[200px]">
                                                {canClaimDaily
                                                    ? 'Resgate agora seu bônus diário de XP e itens exclusivos.'
                                                    : 'Você já resgatou seu bônus de hoje. O reset ocorre às 21:00.'}
                                            </p>

                                            <button
                                                onClick={() => setShowClaimModal(true)}
                                                disabled={!canClaimDaily}
                                                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${canClaimDaily
                                                    ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-neon-pink hover:scale-105'
                                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                    }`}
                                            >
                                                {canClaimDaily ? 'RESGATAR BÔNUS' : 'JÁ RESGATADO'}
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Visível apenas para o dono do perfil.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Stats & Analysis */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Main Stats Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-icons-outlined text-4xl">leaderboard</span>
                                    </div>
                                    <div className="text-3xl font-display font-black text-white">{player.rank > 0 ? player.rank + 'º' : '-'}</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider">Ranking Geral</div>
                                </div>
                                <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-secondary/50 transition-colors">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-icons-outlined text-4xl">payments</span>
                                    </div>
                                    <div className="text-xl font-display font-black text-secondary">{player.winnings}</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider">Ganhos Totais</div>
                                </div>
                                <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-icons-outlined text-4xl">emoji_events</span>
                                    </div>
                                    <div className="text-3xl font-display font-black text-purple-500">{player.titles}</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider">Títulos</div>
                                </div>
                                <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-pink-500/50 transition-colors">
                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-icons-outlined text-4xl">pie_chart</span>
                                    </div>
                                    <div className="text-3xl font-display font-black text-pink-500">{player.itm}</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider">ITM %</div>
                                </div>
                            </div>

                            {/* Tournament Log - CONDENSED MOBILE VIEW */}
                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="material-icons-outlined text-primary">history</span>
                                        Histórico de Torneios
                                    </h3>
                                </div>
                                <div className="overflow-hidden">
                                    <table className="w-full text-left text-sm md:text-base text-gray-400">
                                        <thead className="bg-black/20 text-[10px] md:text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-3 md:px-6 py-3 hidden sm:table-cell">Data</th>
                                                <th className="px-3 md:px-6 py-3">Evento</th>
                                                <th className="px-2 md:px-6 py-3 text-center">Pos</th>
                                                <th className="px-3 md:px-6 py-3 text-right">Prêmio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {player.tournamentLog && player.tournamentLog.length > 0 ? (
                                                player.tournamentLog.map((log, index) => (
                                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden sm:table-cell">{log.date}</td>
                                                        <td className="px-3 md:px-6 py-4 font-bold text-white truncate max-w-[120px] md:max-w-none">
                                                            <div className="flex flex-col">
                                                                <span>{log.eventName}</span>
                                                                <span className="text-[9px] text-gray-500 sm:hidden block mt-0.5">{log.date}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-4 text-center">
                                                            <span className={`px-2 py-1 rounded text-[10px] md:text-sm font-bold ${log.position === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                                log.position <= 3 ? 'bg-gray-500/20 text-gray-300' : 'text-gray-500'
                                                                }`}>
                                                                {log.position}º
                                                            </span>
                                                        </td>
                                                        <td className="px-3 md:px-6 py-4 text-right text-white text-xs md:text-base">{log.prize}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600 italic">
                                                        Nenhum torneio registrado nesta temporada.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Play Style & Gallery */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col overflow-visible">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Estilo de Jogo</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {player.playStyles.map((style, idx) => {
                                            const colors = [
                                                'text-red-500 border-red-500/20 bg-red-500/10',
                                                'text-blue-500 border-blue-500/20 bg-blue-500/10',
                                                'text-purple-500 border-purple-500/20 bg-purple-500/10',
                                                'text-green-500 border-green-500/20 bg-green-500/10',
                                                'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
                                            ];
                                            const colorClass = colors[idx % colors.length];
                                            return (
                                                <div key={idx} className="group relative">
                                                    <span className={`cursor-help px-3 py-1 text-sm font-bold rounded-full border ${colorClass}`}>
                                                        {style}
                                                    </span>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-surface-dark border border-white/20 rounded-xl text-xs text-white shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-[100] pointer-events-none">
                                                        <div className="font-bold mb-1 text-primary">{style}</div>
                                                        <div className="text-gray-300 leading-snug">{PLAY_STYLE_DEFINITIONS[style] || "Sem descrição."}</div>
                                                        {/* Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white/20"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {player.playStyles.length === 0 && (
                                            <span className="text-gray-500 text-sm italic">Nenhum estilo definido.</span>
                                        )}
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Bio</h4>
                                        <p className="text-gray-500 text-base leading-relaxed italic">
                                            "{player.bio}"
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-3xl p-6">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Galeria</h3>
                                    {player.gallery.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {player.gallery.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                                                    onClick={() => setSelectedImage(img)}
                                                >
                                                    <img src={img} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-icons-outlined text-white text-3xl">zoom_in</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-gray-500 text-sm italic border border-white/5 rounded-lg">
                                            Sem fotos.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* ... (EDIT TAB CONTENT - Remains unchanged) ... */}
                {activeTab === 'inbox' && isOwnProfile && renderInbox()}

                {/* EDIT TAB CONTENT */}
                {activeTab === 'edit' && canEdit && (
                    <div className="bg-surface-dark border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* EDIT COLUMN 1: Identity */}
                            <div className="w-full md:w-1/3 flex flex-col items-center">
                                <div className="relative group mb-6">
                                    <img
                                        src={player.avatar}
                                        alt={player.name}
                                        className="w-48 h-48 rounded-full border-4 border-white/10 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors shadow-lg" title="Trocar Foto">
                                            <span className="material-icons-outlined">upload</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                            />
                                        </label>
                                        <button
                                            onClick={handleDeleteAvatar}
                                            className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors shadow-lg"
                                            title="Remover Foto"
                                        >
                                            <span className="material-icons-outlined">delete_forever</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Nome de Exibição</label>
                                        <input
                                            type="text"
                                            value={player.name}
                                            onChange={(e) => handleUpdate('name', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Cidade / Estado</label>
                                        <input
                                            type="text"
                                            value={player.city}
                                            onChange={(e) => handleUpdate('city', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                                        />
                                    </div>
                                    <div className="opacity-50">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">ID Chip Race (Fixo)</label>
                                        <input
                                            type="text"
                                            value={player.id}
                                            disabled
                                            className="w-full bg-black/10 border border-white/5 rounded p-3 text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* EDIT COLUMN 2: Details */}
                            <div className="w-full md:w-2/3 space-y-6">
                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Biografia</label>
                                    <textarea
                                        value={player.bio}
                                        onChange={(e) => handleUpdate('bio', e.target.value)}
                                        className="w-full h-24 bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none resize-none"
                                        placeholder="Conte um pouco sobre sua trajetória no poker..."
                                    ></textarea>
                                </div>

                                {/* Socials */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-pink-500 uppercase mb-1">Instagram</label>
                                        <div className="flex items-center bg-black/30 border border-white/10 rounded px-3">
                                            <span className="text-gray-500 select-none">@</span>
                                            <input
                                                type="text"
                                                value={player.social.instagram?.replace('@', '') || ''}
                                                onChange={(e) => handleSocialUpdate('instagram', '@' + e.target.value)}
                                                className="w-full bg-transparent p-3 text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-blue-400 uppercase mb-1">Twitter / X</label>
                                        <div className="flex items-center bg-black/30 border border-white/10 rounded px-3">
                                            <span className="text-gray-500 select-none">@</span>
                                            <input
                                                type="text"
                                                value={player.social.twitter?.replace('@', '') || ''}
                                                onChange={(e) => handleSocialUpdate('twitter', '@' + e.target.value)}
                                                className="w-full bg-transparent p-3 text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-green-500 uppercase mb-1">Discord ID</label>
                                        <input
                                            type="text"
                                            value={player.social.discord || ''}
                                            onChange={(e) => handleSocialUpdate('discord', e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Play Styles */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Estilos de Jogo (Tags)</label>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-wrap gap-2 overflow-visible">
                                        {ALL_PLAY_STYLES.map((style) => {
                                            const isSelected = player.playStyles.includes(style);
                                            return (
                                                <div key={style} className="group relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePlayStyle(style)}
                                                        className={`px-3 py-1 text-sm font-bold rounded-full border transition-all ${isSelected
                                                            ? 'bg-secondary text-black border-secondary shadow-neon-blue'
                                                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                                            }`}
                                                    >
                                                        {style}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Gallery Manager */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-sm font-bold text-gray-500 uppercase">Gerenciar Galeria</label>
                                        <button onClick={handleOpenUploadModal} className="text-sm text-secondary hover:underline font-bold">+ Adicionar Foto Mock</button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {player.gallery.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group border border-white/10">
                                                <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => handleDeleteImage(e, idx)}
                                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remover"
                                                >
                                                    <span className="material-icons-outlined text-xs">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        {player.gallery.length < 4 && (
                                            <button
                                                onClick={handleOpenUploadModal}
                                                className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all"
                                            >
                                                <span className="material-icons-outlined">add_photo_alternate</span>
                                                <span className="text-xs">Slot Livre</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {isAdmin && isOwnProfile && (
                            <div className="mt-12 bg-black/40 border border-primary/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                    <span className="material-icons-outlined">admin_panel_settings</span>
                                    Administração: Recompensas Diárias
                                </h3>

                                <div className="overflow-x-auto custom-scrollbar pb-4">
                                    <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
                                        <thead className="bg-white/5 uppercase text-xs font-bold text-gray-500 rounded-lg">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">Dia</th>
                                                <th className="px-4 py-3">Tipo de Recompensa</th>
                                                <th className="px-4 py-3">Valor</th>
                                                <th className="px-4 py-3 rounded-tr-lg">Rótulo Exibição</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {activeDailyRewards.map((reward, idx) => (
                                                <tr key={reward.day} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-white">Dia {reward.day}</td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={reward.reward_type}
                                                            onChange={(e) => handleUpdateActiveReward(idx, 'reward_type', e.target.value)}
                                                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary"
                                                        >
                                                            <option value="xp">Experiência (XP)</option>
                                                            <option value="chipz">Moeda Chipz</option>
                                                            <option value="brl">Real (BRL)</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={reward.reward_value}
                                                            onChange={(e) => handleUpdateActiveReward(idx, 'reward_value', e.target.value)}
                                                            className="w-24 bg-black/50 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary text-right"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={reward.reward_label || ''}
                                                            onChange={(e) => handleUpdateActiveReward(idx, 'reward_label', e.target.value)}
                                                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-primary"
                                                            placeholder="Ex: 50 Chipz"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleSaveDailyRewardsConfig}
                                        disabled={isSavingRewards}
                                        className="px-6 py-3 bg-primary hover:bg-primary/80 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingRewards ? (
                                            <>
                                                <span className="material-icons-outlined animate-spin">refresh</span> Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-icons-outlined">save</span> Salvar Recompensas no BD
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-8 mt-8 flex justify-end gap-4">
                            <button onClick={() => setActiveTab('overview')} className="px-6 py-3 rounded-lg text-gray-400 font-bold hover:bg-white/5 transition-colors">Cancelar</button>
                            <button onClick={handleSaveProfile} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                <span className="material-icons-outlined">save</span> Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* FULLSCREEN IMAGE LIGHTBOX */}
            {selectedImage && (
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
            )}

            {/* MESSAGE DETAILS MODAL */}
            {viewedMessage && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-surface-dark border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        {/* Header */}
                        <div className={`p-8 flex justify-between items-center ${viewedMessage.category === 'poll' ? 'bg-purple-600/20' :
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
                                    <h3 className="text-2xl font-black text-white leading-tight">{viewedMessage.subject}</h3>
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{viewedMessage.from} • {viewedMessage.date}</p>
                                </div>
                            </div>
                            <button onClick={() => { setViewedMessage(null); setReplyMode(false); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 lg:p-10">
                            <div className="text-gray-300 text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                                {viewedMessage.content}
                            </div>

                            {/* POLL SPECIFIC UI */}
                            {viewedMessage.category === 'poll' && polls && (() => {
                                const poll = polls.find(p => p.id === viewedMessage.pollId);
                                if (!poll) return (
                                    <div className="bg-black/20 border border-purple-500/20 rounded-3xl p-6 mb-8 text-center">
                                        <span className="material-icons-outlined text-purple-400 text-3xl block mb-2">how_to_vote</span>
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
                                    <div className="bg-gradient-to-b from-purple-900/20 to-black/30 border border-purple-500/20 rounded-3xl p-6 mb-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                                <span className="material-icons-outlined text-purple-400">how_to_vote</span>
                                            </div>
                                            <div>
                                                <div className="text-xs text-purple-400 font-black uppercase tracking-widest mb-0.5">Enquete Ativa</div>
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
                                                                    ? 'border-purple-500 bg-purple-500/10 text-white'
                                                                    : hasVoted
                                                                        ? 'border-white/10 bg-black/20 text-gray-400 cursor-default'
                                                                        : 'border-white/10 bg-black/20 hover:border-purple-400/50 hover:bg-purple-500/5 text-white cursor-pointer hover:scale-[1.01]'
                                                                }`}
                                                        >
                                                            {/* Progress bar */}
                                                            {hasVoted && (
                                                                <div
                                                                    className={`absolute inset-0 transition-all duration-1000 rounded-2xl ${isSelected ? 'bg-purple-500/15' : 'bg-white/5'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            )}
                                                            <div className="relative z-10 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    {isSelected && (
                                                                        <span className="material-icons-outlined text-purple-400 text-sm">check_circle</span>
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
                                                                        <span className={`text-sm font-black ${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>{pct}%</span>
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
                                                <div className="text-xs text-purple-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
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
                                                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full transition-all duration-700"
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
                                                    onClick={() => {
                                                        if (onReply && replyContent.trim()) {
                                                            onReply(viewedMessage.id, replyContent);
                                                            setReplyContent('');
                                                            setReplyMode(false);
                                                            setViewedMessage(null);
                                                            alert('Resposta enviada!');
                                                        }
                                                    }}
                                                    className="flex-grow bg-secondary hover:bg-white text-black font-bold py-2 rounded-xl transition-all shadow-neon-blue"
                                                >
                                                    Enviar Resposta
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="mt-10 flex justify-center">
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
            )}

            {/* --- DAILY CLAIM MODAL --- */}
            {
                showClaimModal && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-sm p-8 text-center animate-float shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-neon-pink">
                                <span className="material-icons-outlined text-5xl text-white">redeem</span>
                            </div>

                            {claimAnimation ? (
                                <div className="animate-in zoom-in duration-500 py-4">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                        <span className="material-icons-outlined text-4xl text-green-500">check_circle</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-2 tracking-tight">RESGATADO!</h3>
                                    <div className="text-5xl font-black text-primary mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                        +{claimedRewardRef.current?.reward_label}
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-8 max-w-[200px] mx-auto">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-1000" style={{ width: '100%' }}></div>
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">Volte amanhã às <span className="text-white font-bold">21:00</span> para mais!</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">Bônus Diário</h3>
                                        <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em]">
                                            <span className="w-8 h-[1px] bg-primary/30"></span>
                                            Dia {activeDailyRewards ? Math.min(player.dailyStreak + 1, activeDailyRewards.length) : (player.dailyStreak % 7) + 1}

                                            <span className="w-8 h-[1px] bg-primary/30"></span>
                                        </div>
                                    </div>

                                    {/* Reward Card - compact */}
                                    <div className="bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 rounded-3xl p-6 mb-6 relative overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-28 h-28 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                                        <div className="relative z-10 flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Sua Recompensa Hoje</div>
                                                <div className="text-4xl font-black tracking-tighter">
                                                    <span className="text-primary">
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'brl' ? 'R$ ' : '+'}
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_value}
                                                    </span>
                                                    <span className="text-lg ml-1 text-gray-400">
                                                        {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'xp' ? 'XP' :
                                                            activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'chipz' ? 'CHIPZ' : ''}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_label}
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-icons-outlined text-2xl text-primary">
                                                    {activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'brl' ? 'payments' :
                                                        activeDailyRewards[Math.min(player.dailyStreak, activeDailyRewards.length - 1)]?.reward_type === 'chipz' ? 'toll' : 'auto_awesome'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rewards Table Toggle */}
                                    <button
                                        onClick={() => setShowRewardsTable(prev => !prev)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all mb-4"
                                    >
                                        <span className="material-icons-outlined text-sm text-secondary">calendar_month</span>
                                        {showRewardsTable ? 'Ocultar tabela de recompensas' : 'Ver tabela completa de recompensas'}
                                        <span className={`material-icons-outlined text-sm transition-transform duration-300 ${showRewardsTable ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {showRewardsTable && (
                                        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 animate-in slide-in-from-top-2 duration-300">
                                            <div className="bg-black/40 px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                                                <span className="material-icons-outlined text-sm text-secondary">emoji_events</span>
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Recompensas por Dia</span>
                                            </div>
                                            <div className="divide-y divide-white/5 max-h-56 overflow-y-auto custom-scrollbar">
                                                {activeDailyRewards.map((reward, i) => {
                                                    const isCurrentDay = i === Math.min(player.dailyStreak, activeDailyRewards.length - 1);
                                                    const isPast = i < player.dailyStreak;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`flex items-center justify-between px-4 py-2.5 transition-colors ${isCurrentDay ? 'bg-primary/10 border-l-2 border-primary' :
                                                                isPast ? 'opacity-40' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-xs font-black w-12 ${isCurrentDay ? 'text-primary' : isPast ? 'text-gray-600' : 'text-gray-500'
                                                                    }`}>
                                                                    Dia {reward.day ?? i + 1}
                                                                </span>
                                                                <span className={`material-icons-outlined text-sm ${reward.reward_type === 'brl' ? 'text-green-400' :
                                                                    reward.reward_type === 'chipz' ? 'text-secondary' : 'text-blue-400'
                                                                    }`}>
                                                                    {reward.reward_type === 'brl' ? 'payments' :
                                                                        reward.reward_type === 'chipz' ? 'toll' : 'auto_awesome'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-black ${isCurrentDay ? 'text-primary' :
                                                                    isPast ? 'text-gray-600' : 'text-white'
                                                                    }`}>
                                                                    {reward.reward_label}
                                                                </span>
                                                                {isPast && <span className="material-icons-outlined text-xs text-green-500">check_circle</span>}
                                                                {isCurrentDay && <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full uppercase">Hoje</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reset timer */}
                                    <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-black/40 border border-white/5 rounded-full text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                        Reset Diário: <span className="text-white ml-1">21:00H</span>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleClaimToday}
                                            className="w-full py-5 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] hover:bg-right text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] transition-all duration-500 active:scale-95 uppercase tracking-wider"
                                        >
                                            RESGATAR HOJE E ZERAR
                                        </button>
                                        <button
                                            onClick={handleSkipToday}
                                            className="w-full py-3 text-gray-400 hover:text-white border border-gray-600 hover:border-white font-bold text-sm rounded-xl transition-colors active:scale-95 mb-2"
                                        >
                                            PULAR RECOMPENSA E MELHORAR AMANHÃ
                                        </button>
                                        <button
                                            onClick={() => setShowClaimModal(false)}
                                            className="w-full py-3 text-gray-500 hover:text-white font-bold text-xs transition-colors uppercase tracking-widest"
                                        >
                                            FECHAR (O Bônus continua disponível)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* ... (Restante dos modais: CROP, UPLOAD, MESSAGE permanecem iguais) ... */}
            {/* CROP IMAGE MODAL */}
            {
                editorImage && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md p-6 animate-float shadow-2xl flex flex-col items-center">
                            <h3 className="text-xl font-bold text-white mb-4">Ajustar Foto do Perfil</h3>
                            <div
                                className="relative w-[280px] h-[280px] rounded-full overflow-hidden border-4 border-white/20 cursor-move bg-black mb-6 select-none touch-none"
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={onMouseUp}
                                onMouseLeave={onMouseUp}
                                onTouchStart={onMouseDown}
                                onTouchMove={onMouseMove}
                                onTouchEnd={onMouseUp}
                            >
                                <img
                                    ref={imageRef}
                                    src={editorImage}
                                    alt="Edit"
                                    className="absolute max-w-none origin-center select-none pointer-events-none"
                                    style={{
                                        transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${zoom})`,
                                        left: '50%',
                                        top: '50%'
                                    }}
                                />
                            </div>
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
                                    Salvar Foto
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
};