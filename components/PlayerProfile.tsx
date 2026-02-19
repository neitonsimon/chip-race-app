import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, RankingPlayer, TournamentResult, Event } from '../types';

interface PlayerProfileProps {
    isAdmin?: boolean;
    isLoggedIn?: boolean;
    initialData?: RankingPlayer; // Se existir, estou vendo o perfil de OUTRA pessoa
    onSendMessage?: (to: string, content: string) => void;
    onUpdateProfile?: (originalName: string, updatedData: PlayerStats) => void;
    currentUser?: {
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
    events?: Event[]; // Lista de eventos para histórico
    onCreateTestUser?: () => void; // Nova função para criar usuário de teste
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
const DAILY_REWARDS = [
    { day: 1, xp: 50, item: 'Ticket SNG' },
    { day: 2, xp: 75, item: null },
    { day: 3, xp: 100, item: 'Bônus 5k Fichas' },
    { day: 4, xp: 150, item: null },
    { day: 5, xp: 200, item: null },
    { day: 6, xp: 300, item: null },
    { day: 7, xp: 1000, item: 'Baú Épico' }
];

// Mock Data para o Log de Torneios
const mockTournamentLog: TournamentResult[] = [
    { date: '15/03/2026', eventName: 'Deepstack Chip Race', position: 3, points: 450, prize: 'R$ 1.200,00' },
    { date: '10/03/2026', eventName: 'Warm-up Estadual', position: 12, points: 120, prize: '-' },
    { date: '05/03/2026', eventName: 'Mystery Bounty Online', position: 1, points: 1500, prize: 'R$ 3.500,00' },
    { date: '28/02/2026', eventName: 'High Roller QG', position: 5, points: 300, prize: 'R$ 800,00' },
    { date: '20/02/2026', eventName: 'Turbo Deep', position: 45, points: 10, prize: '-' },
    { date: '15/02/2026', eventName: 'Sunday Million Sat', position: 2, points: 0, prize: 'Vaga 30K+' },
];

type TabView = 'overview' | 'edit';

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
    isAdmin,
    isLoggedIn,
    initialData,
    onSendMessage,
    onUpdateProfile,
    currentUser,
    events,
    onCreateTestUser
}) => {
    const [activeTab, setActiveTab] = useState<TabView>('overview');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    // States para Upload de Imagem
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    // Daily Login States
    const [canClaimDaily, setCanClaimDaily] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [claimAnimation, setClaimAnimation] = useState(false);
    const claimedRewardRef = useRef<{ xp: number; item: string | null }>({ xp: 0, item: null });

    // --- EDITOR DE IMAGEM (CROP) STATES ---
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    // -------------------------------------

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
        dailyStreak: 0
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
            if (initialData) {
                baseData.tournamentLog = mockTournamentLog;
            } else {
                // Welcome log for new user with no history
                baseData.tournamentLog = [
                    { date: '15/03/2026', eventName: 'Torneio de Boas Vindas', position: 10, points: 50, prize: '-' }
                ];
            }
        }

        setPlayer(baseData);

    }, [initialData, currentUser, events]);

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

    const handleClaimDaily = () => {
        // 1. Calculate Rewards
        const streakIndex = player.dailyStreak % 7;
        const reward = DAILY_REWARDS[streakIndex];

        // Store claimed reward values BEFORE state update (to show correct values in success screen)
        claimedRewardRef.current = { xp: reward.xp, item: reward.item ?? null };

        // 2. Logic: Update XP & Level
        let newExp = player.currentExp + reward.xp;
        let newLevel = player.level;
        let requiredExp = player.nextLevelExp;

        // Level Up Logic (Simple)
        while (newExp >= requiredExp) {
            newExp -= requiredExp;
            newLevel++;
            requiredExp = Math.floor(requiredExp * 1.2); // Increase difficulty
        }

        // 3. Update Player State
        const newPlayerData = {
            ...player,
            level: newLevel,
            currentExp: newExp,
            nextLevelExp: requiredExp,
            lastDailyClaim: new Date().toISOString(),
            dailyStreak: player.dailyStreak + 1
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

    const xpPercentage = Math.min(100, (player.currentExp / player.nextLevelExp) * 100);

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
                    </div>

                    {/* Create Test User Button (Admin Only) */}
                    {isAdmin && onCreateTestUser && (
                        <button
                            onClick={onCreateTestUser}
                            className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-500 hover:text-white transition-all"
                        >
                            <span className="material-icons-outlined text-lg">person_add</span>
                            Gerar Usuário Teste
                        </button>
                    )}
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
                                    <div className="absolute bottom-2 right-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-surface-dark z-20">
                                        PRO
                                    </div>
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
                                            <div className="text-[9px] text-gray-400 mt-1">{player.currentExp} / {player.nextLevelExp} XP</div>
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

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="material-icons-outlined text-yellow-400">calendar_today</span>
                                        Login Diário
                                    </h3>
                                    <div className="text-xs bg-black/20 px-2 py-1 rounded text-gray-400">
                                        Reset: 21:00
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
                                                <th className="px-2 md:px-6 py-3 text-center">Pts</th>
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
                                                        <td className="px-2 md:px-6 py-4 text-center font-display text-secondary text-xs md:text-base">{log.points > 0 ? `+${log.points}` : '-'}</td>
                                                        <td className="px-3 md:px-6 py-4 text-right text-white text-xs md:text-base">{log.prize}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-600 italic">
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

            {/* --- DAILY CLAIM MODAL --- */}
            {showClaimModal && (
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
                                    +{claimedRewardRef.current.xp} XP
                                </div>
                                {claimedRewardRef.current.item && (
                                    <div className="text-xl font-bold text-secondary mb-6 flex items-center justify-center gap-2">
                                        <span className="material-icons-outlined">card_giftcard</span>
                                        {claimedRewardRef.current.item}
                                    </div>
                                )}
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
                                        Dia {(player.dailyStreak % 7) + 1} de 7
                                        <span className="w-8 h-[1px] bg-primary/30"></span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden group">
                                    {/* Animated Background Glow */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-700"></div>

                                    <div className="relative z-10">
                                        <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-4 opacity-60">Sua Recompensa</div>
                                        <div className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">
                                            <span className="text-primary">+{DAILY_REWARDS[player.dailyStreak % 7].xp}</span>
                                            <span className="text-2xl ml-2 text-gray-500">XP</span>
                                        </div>

                                        {DAILY_REWARDS[player.dailyStreak % 7].item && (
                                            <div className="mt-4 flex items-center justify-center gap-3 py-3 px-6 bg-secondary/10 border border-secondary/20 rounded-2xl text-secondary animate-bounce-subtle">
                                                <span className="material-icons-outlined text-2xl">auto_awesome</span>
                                                <span className="text-lg font-black tracking-tight">{DAILY_REWARDS[player.dailyStreak % 7].item}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4 mb-8">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/5 rounded-full text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                        Reset Diário: <span className="text-white ml-1">21:00H</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleClaimDaily}
                                        className="w-full py-5 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] hover:bg-right text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] transition-all duration-500 active:scale-95 uppercase tracking-wider"
                                    >
                                        RESGATAR AGORA
                                    </button>
                                    <button
                                        onClick={() => setShowClaimModal(false)}
                                        className="w-full py-3 text-gray-500 hover:text-white font-bold text-sm transition-colors"
                                    >
                                        DEIXAR PARA DEPOIS
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ... (Restante dos modais: CROP, UPLOAD, MESSAGE permanecem iguais) ... */}
            {/* CROP IMAGE MODAL */}
            {editorImage && (
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
            )}

            {/* UPLOAD PHOTO MODAL (GALLERY) */}
            {showUploadModal && (
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
            )}

            {/* MESSAGE MODAL */}
            {showMessageModal && (
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
            )}
        </div>
    );
};