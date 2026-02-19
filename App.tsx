import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { TheChosenStats } from './components/TheChosenStats';
import { TournamentCategories } from './components/TournamentCategories';
import { EventCalendar } from './components/EventCalendar';
import { RankingTable } from './components/RankingTable';
import { PlayerProfile } from './components/PlayerProfile';
import { EventRegistration } from './components/EventRegistration';
import { TheChosenDetails } from './components/TheChosenDetails';
import { TheChosenRegulations } from './components/TheChosenRegulations';
import { VipPage } from './components/VipPage';
import { Newsletter } from './components/Newsletter';
import { Auth } from './components/Auth';
import { supabase } from './src/lib/supabase';
import { RankingPlayer, MonthData, Message, ContentDB, TournamentCategory, Event, PlayerResult, PlayerStats, RankingInstance, ScoringSchema, RankingFormula } from './types';
import { calculatePoints } from './utils/scoring';

// DADOS MOCKADOS INICIAIS
const initialEventsData: Event[] = [
    {
        id: '1', title: 'Deepstack Chip Race', date: '2026-03-15', time: '19:00', type: 'live', buyin: 'R$ 150', guaranteed: '5K', status: 'open',
        stack: '30.000 Fichas', blinds: '20 Min', lateReg: 'Até 6º Nível', location: 'QG Chip Race - Venâncio Aires',
        description: 'O torneio clássico de abertura de semana. Estrutura deep para máxima jogabilidade.',
        rebuyValue: 'R$ 100', rebuyChips: '30.000 Fichas', addonValue: 'R$ 100', addonChips: '50.000 Fichas',
        staffBonusValue: 'R$ 20', staffBonusChips: '5.000 Fichas', timeChipValue: 'Free', timeChipChips: '2.000 Fichas',
        includedRankings: ['annual', 'quarterly', 'legacy']
    },
    {
        id: '2', title: 'The Chosen Satellite', date: '2026-03-16', time: '20:00', type: 'online', buyin: 'R$ 50', guaranteed: '3 Vagas', status: 'open',
        stack: '10.000 Fichas', blinds: '12 Min', lateReg: '1h 30m', location: 'App Chip Race Online',
        description: 'Sua chance de entrar no 30K+ gastando pouco. Jogue de casa.',
        rebuyValue: 'R$ 50', rebuyChips: '10.000 Fichas', addonValue: 'R$ 50', addonChips: '25.000 Fichas',
        includedRankings: ['annual', 'quarterly']
    },
    {
        id: '3', title: 'High Roller QG', date: '2026-03-20', time: '18:00', type: 'live', buyin: 'R$ 500', guaranteed: '15K', status: 'open',
        stack: '50.000 Fichas', blinds: '25 Min', lateReg: 'Até 8º Nível', location: 'QG Chip Race - Venâncio Aires',
        description: 'Para quem gosta de jogo caro e técnico. Field reduzido e premiação alta.',
        rebuyValue: 'R$ 500', rebuyChips: '50.000 Fichas', addonValue: 'R$ 300', addonChips: '80.000 Fichas',
        doubleRebuyValue: 'R$ 900', doubleRebuyChips: '110.000 Fichas', doubleAddonValue: 'R$ 500', doubleAddonChips: '160.000 Fichas',
        includedRankings: ['annual', 'quarterly', 'legacy']
    }
];

// TEXTOS PADRÃO DE REGULAMENTO
const RULES_ANNUAL = `1. O Ranking Geral Anual soma pontos de todos os torneios regulares presenciais e online da temporada 2026.
2. Os 10 jogadores com maior pontuação acumulada ao final do ciclo classificatório (Outubro/2026) garantem vaga direta no The Chosen.
3. Critério de desempate: Valor total de premiações (winnings) no ano.

FÓRMULAS:
► TORNEIOS SEMANAIS: (Jogadores/3) + (Buyin/3) + (10 se FT) + (ITM/10) + (5 se VIP)
► TORNEIOS MENSAIS: (Jogadores/3) + (Buyin/4) + (15 se FT) + (ITM/15) + (5 se VIP)
► ESPECIAIS: (Jogadores/4) + (Buyin/6) + (30 se FT) + (ITM/25) + (5 se VIP)`;

const RULES_QUARTERLY = `1. Corrida de pontos válida apenas para o trimestre vigente (Q1: Jan-Mar, Q2: Abr-Jun, etc).
2. O Campeão Trimestral ganha vaga direta no The Chosen.
3. O TOP 9 disputa uma Mesa Final Trimestral com premiação em dinheiro adicionada.`;

// INITIAL RANKINGS STRUCTURE
const initialRankingsData: RankingInstance[] = [
    {
        id: 'annual',
        label: 'Anual',
        description: 'A soma de todos os seus esforços.',
        rules: RULES_ANNUAL,
        prizeInfoTitle: '3 Vagas Diretas',
        prizeInfoDetail: 'Os 3 jogadores que mais somarem pontos durante toda a temporada 2026 garantem seu assento no evento principal do ano.',
        players: []
    },
    {
        id: 'quarterly',
        label: 'Trimestral',
        description: 'Corrida Trimestral Q1 (Jan - Mar)',
        rules: RULES_QUARTERLY,
        players: []
    },
    {
        id: 'legacy',
        label: 'O Legado',
        description: 'Hall of Fame: As lendas do Chip Race.',
        rules: 'Ranking histórico acumulado desde o início da Chip Race. Premiação especial a cada 18 meses.',
        players: []
    }
];

// DADOS INICIAIS PADRÃO DB TEXTO
const INITIAL_DB: ContentDB = {
    hero: {
        title_line1: "THE CHOSEN",
        title_line2_prefix: "",
        subtitle: "O palco principal da Chip Race. Uma jornada de 9 meses onde a comunidade define o tamanho da glória.",
        timeline_title: "Cronograma de Evolução",
        btn_ranking: "RANKING ATUALIZADO",
        btn_details: "ENTENDA O"
    },
    details: {
        header_title: "THE CHOSEN",
        header_subtitle: "O Capítulo Final da temporada 2026 da Chip Race.",
        concept_title: "CONCEITO",
        concept_desc: "Diferente de torneios abertos, o The Chosen é um evento exclusivo para quem provou seu valor durante o ano. Não é possível comprar o buy-in diretamente para o Capítulo Final. Você deve conquistar sua vaga. Isso garante um field de altíssimo nível e uma atmosfera de verdadeira final de campeonato.",
        plus_title: "DINÂMICA PLUS",
        plus_desc: "O garantido inicial é de R$ 30.000,00, mas a Chip Race desafia a comunidade. A cada mês, se atingirmos metas de classificados, a Chip Race injeta mais dinheiro no garantido. O pote cresce junto com o engajamento dos jogadores.",
        ways_title: "8 Caminhos para a Glória"
    },
    categories: [
        { id: 'rankings', title: 'Rankings 2026', description: 'A principal porta de entrada. Pontue no Live e Online para garantir sua vaga.', icon: 'leaderboard', color: 'primary', slots: 18 },
        { id: 'jackpot', title: 'Jackpot', description: 'Classifique-se jogando de casa através dos nossos satélites semanais.', icon: 'attach_money', color: 'purple', slots: 9 },
        { id: 'get-up', title: 'Get Up', description: 'Vença torneios presenciais selecionados na sede e ganhe o Golden Ticket.', icon: 'psychology', color: 'secondary', slots: 9 },
        { id: 'sit-n-go', title: 'Sit & Go Satélite', description: 'Para quem joga caro. Os campeões dos HRs mensais garantem vaga direta.', icon: 'satellite_alt', color: 'pink', slots: 9 },
        { id: 'red-omaha', title: 'Last Longer', description: 'Aposte em quem vai mais longe. Uma disputa de resistência paralela ao torneio.', icon: 'timer', color: 'secondary', slots: 9 },
        { id: 'ladies-league', title: "Vip's", description: 'Torneio especial e exclusivo focado em promover a experiência VIP.', icon: 'diamond', color: 'primary', slots: 9 },
        { id: 'bet', title: 'Bet', description: 'Desafios de apostas e repescagem. A última chance de entrar no 30K+.', icon: 'casino', color: 'purple', slots: 9 },
        { id: 'quests', title: 'Quests', description: 'Missões diárias e desafios secretos que desbloqueiam vagas para o The Chosen.', icon: 'explore', color: 'pink', slots: 9 }
    ]
};

export default function App() {
    const [currentView, setCurrentView] = useState('home');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Auth user ID for Supabase ops
    const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);

    // User State
    // User State
    const [currentUser, setCurrentUser] = useState<Partial<PlayerStats>>({});

    // --- CENTRAL DATA STATE ---
    const [events, setEvents] = useState<Event[]>(initialEventsData);

    // NOVO: STATE UNIFICADO DE RANKINGS
    const [rankings, setRankings] = useState<RankingInstance[]>(initialRankingsData);

    const [contentDB, setContentDB] = useState<ContentDB>(INITIAL_DB);
    const [globalScoringSchemas, setGlobalScoringSchemas] = useState<ScoringSchema[]>([]);
    const [allProfiles, setAllProfiles] = useState<RankingPlayer[]>([]);

    // Load from LocalStorage on mount
    useEffect(() => {
        // 1. Content Text
        try {
            const savedDB = localStorage.getItem('chiprace_db');
            if (savedDB) setContentDB(JSON.parse(savedDB));
        } catch (e) { console.error("Error loading DB", e); }

        // 2. Events
        try {
            const savedEvents = localStorage.getItem('chiprace_events');
            if (savedEvents) setEvents(JSON.parse(savedEvents));
        } catch (e) { console.error("Error loading Events", e); }

        // 3. Rankings
        try {
            const savedRankings = localStorage.getItem('chiprace_rankings');
            if (savedRankings) setRankings(JSON.parse(savedRankings));
        } catch (e) { console.error("Error loading Rankings", e); }

        // 4. Global Scoring Schemas (Legacy fallback, now from Supabase)
        try {
            const savedSchemas = localStorage.getItem('chiprace_scoring_schemas');
            if (savedSchemas) setGlobalScoringSchemas(JSON.parse(savedSchemas));
        } catch (e) { console.error("Error loading Scoring Schemas", e); }

        try {
            const savedUser = localStorage.getItem('chiprace_current_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setCurrentUser(prev => ({ ...prev, ...parsedUser }));
            }
        } catch (e) { console.error("Error loading User", e); }

        // Fetch from Supabase
        fetchSupabaseData();
    }, []);

    const fetchSupabaseData = async () => {
        try {
            // 1. Fetch Rankings
            const { data: rankingsData, error: rankingsError } = await supabase
                .from('rankings')
                .select('*');

            if (rankingsError) throw rankingsError;
            if (rankingsData && rankingsData.length > 0) {
                const formattedRankings = rankingsData.map(r => ({
                    id: r.id,
                    label: r.label,
                    description: r.description,
                    rules: r.rules,
                    startDate: r.start_date,
                    endDate: r.end_date,
                    prizeInfoTitle: r.prize_info_title,
                    prizeInfoDetail: r.prize_info_detail,
                    scoringSchemaMap: r.scoring_schema_map || {},
                    players: [] // Players will be loaded/calculated separately if needed, or kept in local for now
                }));
                // Merge with initial data to ensure we have standard IDs like 'annual' if not in DB
                setRankings(prev => {
                    const merged = [...prev];
                    formattedRankings.forEach(dbR => {
                        const idx = merged.findIndex(m => m.id === dbR.id);
                        if (idx >= 0) {
                            merged[idx] = { ...merged[idx], ...dbR };
                        } else {
                            merged.push(dbR as any);
                        }
                    });
                    return merged;
                });
            }

            // 2. Fetch Global Scoring Schemas
            const { data: schemasData, error: schemasError } = await supabase
                .from('scoring_schemas')
                .select('*');

            if (schemasError) throw schemasError;
            if (schemasData) {
                setGlobalScoringSchemas(schemasData.map(s => ({
                    id: s.id,
                    name: s.name,
                    criteria: s.criteria || [],
                    positionPoints: s.position_points || {}
                })));
            }

            // 3. Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (eventsError) throw eventsError;
            if (eventsData) {
                const formattedEvents: Event[] = eventsData.map(e => ({
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
                    scoringSchemaId: e.scoring_schema_id
                }));

                if (formattedEvents.length > 0) {
                    setEvents(formattedEvents);
                }
            }

            // 4. Fetch Content DB (UI Strings, Categories, Evolution Timeline)
            const { data: contentData, error: contentError } = await supabase
                .from('content_db')
                .select('*');

            if (contentError) throw contentError;
            if (contentData) {
                contentData.forEach(item => {
                    if (item.key === 'hero') {
                        setContentDB(prev => ({ ...prev, hero: item.value }));
                    } else if (item.key === 'details') {
                        setContentDB(prev => ({ ...prev, details: item.value }));
                    } else if (item.key === 'categories') {
                        setContentDB(prev => ({ ...prev, categories: item.value }));
                    } else if (item.key === 'months') {
                        setMonths(item.value);
                    } else if (item.key === 'total_qualifiers') {
                        setCustomTotalQualifiers(item.value);
                    }
                });
            }

            // 5. Fetch All Profiles for Autocomplete
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('name, avatar_url, city');

            if (profilesError) throw profilesError;
            if (profilesData) {
                const formattedProfiles: RankingPlayer[] = profilesData.map(p => ({
                    rank: 0,
                    name: p.name || 'Usuário',
                    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name || 'U'}&background=random`,
                    city: p.city || '',
                    points: 0,
                    change: 'same'
                }));
                setAllProfiles(formattedProfiles);
            }
        } catch (error) {
            console.error('Error fetching Supabase data:', error);
        }
    };

    // --- SUPABASE AUTH & PROFILE ---
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsLoggedIn(true);
                setCurrentUserId(session.user.id);
                fetchProfile(session.user.id);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                // Check if admin (role must be 'admin')
                const userIsAdmin = data.role === 'admin';
                setIsAdmin(userIsAdmin);
                console.log(`User profile loaded: ${data.email}, Role: ${data.role}, IsAdmin: ${userIsAdmin}`);

                setCurrentUser({
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
                    dailyStreak: data.daily_streak || 0
                });
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            alert('Erro ao carregar perfil: ' + (error.message || 'Erro desconhecido.'));
        }
    };

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('chiprace_db', JSON.stringify(contentDB));
    }, [contentDB]);

    useEffect(() => {
        localStorage.setItem('chiprace_events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('chiprace_rankings', JSON.stringify(rankings));
    }, [rankings]);

    // Persist User Changes (Level, XP, Profile Edits)
    useEffect(() => {
        localStorage.setItem('chiprace_current_user', JSON.stringify(currentUser));
    }, [currentUser]);

    // Generic Update Function
    const updateContent = async (section: keyof ContentDB, field: string, value: any) => {
        const newSection = {
            ...contentDB[section],
            [field]: value
        };
        setContentDB(prev => ({
            ...prev,
            [section]: newSection
        }));

        if (isAdmin) {
            await saveToContentDB(section, newSection);
        }
    };

    const updateCategory = async (index: number, field: keyof TournamentCategory, value: any) => {
        const newCats = [...contentDB.categories];
        newCats[index] = { ...newCats[index], [field]: value };
        setContentDB(prev => ({ ...prev, categories: newCats }));

        if (isAdmin) {
            await saveToContentDB('categories', newCats);
        }
    };

    const saveToContentDB = async (key: string, value: any) => {
        try {
            const { error } = await supabase
                .from('content_db')
                .upsert({ key, value }, { onConflict: 'key' });
            if (error) throw error;
        } catch (e) {
            console.error(`Error saving ${key} to content_db:`, e);
        }
    };

    // --- RANKING MANAGEMENT FUNCTIONS ---

    const handleUpdateRankingMeta = async (rankingId: string, updates: Partial<RankingInstance>) => {
        const ranking = rankings.find(r => r.id === rankingId);
        if (!ranking) return;

        const fullRanking = { ...ranking, ...updates };

        // 1. Local Update
        setRankings(prev => prev.map(r => r.id === rankingId ? fullRanking : r));

        // 2. DB Update (Outside of setter for reliability)
        if (isAdmin) {
            await handleSaveRanking(fullRanking);
        }
    };

    const handleUpdateGlobalSchemas = async (schemas: ScoringSchema[]) => {
        setGlobalScoringSchemas(schemas);
        if (!isAdmin) return;

        try {
            // 1. Fetch current schema IDs from DB to detect deletions
            const { data: dbSchemas, error: fetchError } = await supabase
                .from('scoring_schemas')
                .select('id');

            if (fetchError) throw fetchError;

            // 2. Identify and Delete schemas that are no longer in the list
            if (dbSchemas) {
                const currentIds = schemas.map(s => s.id);
                const idsToDelete = dbSchemas
                    .map(d => d.id)
                    .filter((id: string) => !currentIds.includes(id));

                if (idsToDelete.length > 0) {
                    const { error: delError } = await supabase
                        .from('scoring_schemas')
                        .delete()
                        .in('id', idsToDelete);
                    if (delError) throw delError;
                }
            }

            // 3. Insert or Update each schema
            for (const schema of schemas) {
                // Schemas with temp IDs (schema-*, default) get inserted as new rows
                const isTempId = schema.id.startsWith('schema-') || schema.id === 'default';

                const schemaData: any = {
                    name: schema.name,
                    criteria: schema.criteria || [],
                    position_points: schema.positionPoints || {}
                };

                if (!isTempId) {
                    // Existing schemas: upsert using their real ID
                    schemaData.id = schema.id;
                    const { error } = await supabase
                        .from('scoring_schemas')
                        .upsert([schemaData], { onConflict: 'id' })
                        .select();
                    if (error) throw error;
                } else {
                    // New schemas: let the DB generate a UUID
                    const { data, error } = await supabase
                        .from('scoring_schemas')
                        .insert([schemaData])
                        .select();
                    if (error) throw error;
                    // Update local state with the real DB-generated ID
                    if (data && data[0]) {
                        const newId = data[0].id;
                        setGlobalScoringSchemas(prev => prev.map(p => p.id === schema.id ? { ...p, id: newId } : p));
                    }
                }
            }
        } catch (e: any) {
            console.error('Error updating schemas in DB:', e);
            alert('Erro ao salvar fórmula: ' + (e.message || JSON.stringify(e)));
        }
    };

    const handleSaveRanking = async (ranking: RankingInstance) => {
        if (!isAdmin) {
            return;
        }

        try {
            const isCustomId = ranking.id.startsWith('custom-');
            const dbData: any = {
                label: ranking.label,
                description: ranking.description,
                rules: ranking.rules,
                start_date: ranking.startDate || null,
                end_date: ranking.endDate || null,
                prize_info_title: ranking.prizeInfoTitle || '',
                prize_info_detail: ranking.prizeInfoDetail || '',
                scoring_schema_map: ranking.scoringSchemaMap || {}
            };

            let result;
            if (isCustomId) {
                // Now that ID column is TEXT, Supabase will generate a UUID by default if omitted,
                // but we can also send our custom ID if we want. Let's let it generate for clean UUIDs.
                result = await supabase
                    .from('rankings')
                    .insert([dbData])
                    .select();
            } else {
                dbData.id = ranking.id;
                result = await supabase
                    .from('rankings')
                    .upsert([dbData], { onConflict: 'id' })
                    .select();
            }

            const { data, error } = result;

            if (error) {
                console.error('Supabase save error:', error);
                alert('FALHA AO SALVAR (' + ranking.label + '): ' + error.message);
                throw error;
            }

            if (isCustomId && data && data[0]) {
                const newId = data[0].id;
                setRankings(prev => prev.map(r => r.id === ranking.id ? { ...r, id: newId } : r));
            }
        } catch (e: any) {
            console.error('Exception during ranking save:', e);
            alert('ERRO TÉCNICO AO SALVAR: ' + e.message);
        }
    };

    const handleAddRanking = async () => {
        const newRanking: RankingInstance = {
            id: `custom-${Date.now()}`,
            label: 'Novo Ranking',
            description: 'Descrição do novo ranking.',
            rules: 'Regras específicas deste ranking.',
            players: []
        };
        setRankings(prev => [...prev, newRanking]);

        if (isAdmin) {
            await handleSaveRanking(newRanking);
        }
    };

    const handleDeleteRanking = async (id: string) => {
        if (window.confirm('Tem certeza? Isso apagará todo o histórico deste ranking.')) {
            setRankings(prev => prev.filter(r => r.id !== id));
            if (isAdmin && !id.startsWith('custom-')) {
                try {
                    const { error } = await supabase
                        .from('rankings')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                } catch (e) {
                    console.error('Error deleting ranking from Supabase:', e);
                }
            }
        }
    };

    const handleUpdateRankingPrize = (rankingId: string, playerName: string, newPrize: string) => {
        setRankings(prev => prev.map(r => {
            if (r.id === rankingId) {
                return {
                    ...r,
                    players: r.players.map(p => p.name === playerName ? { ...p, manualPrize: newPrize } : p)
                };
            }
            return r;
        }));
    };

    // --- PROFILE UPDATE HANDLER ---
    const handleProfileUpdate = async (originalName: string, updatedData: PlayerStats) => {
        // 1. Update local current user if it's the logged-in user
        if (originalName === currentUser.name) {
            setCurrentUser(prev => ({
                ...prev,
                name: updatedData.name,
                avatar: updatedData.avatar,
                city: updatedData.city,
                bio: updatedData.bio,
                playStyles: updatedData.playStyles,
                gallery: updatedData.gallery,
                social: updatedData.social,
                level: updatedData.level,
                currentExp: updatedData.currentExp,
                nextLevelExp: updatedData.nextLevelExp,
                lastDailyClaim: updatedData.lastDailyClaim,
                dailyStreak: updatedData.dailyStreak
            }));
        }

        // 2. Update in ALL rankings
        setRankings(prev => prev.map(ranking => ({
            ...ranking,
            players: ranking.players.map(p => {
                if (p.name === originalName) {
                    return {
                        ...p,
                        name: updatedData.name,
                        city: updatedData.city,
                        avatar: updatedData.avatar,
                        bio: updatedData.bio,
                        social: updatedData.social,
                        playStyles: updatedData.playStyles,
                        gallery: updatedData.gallery,
                        level: updatedData.level,
                        currentExp: updatedData.currentExp,
                        nextLevelExp: updatedData.nextLevelExp,
                        lastDailyClaim: updatedData.lastDailyClaim
                    };
                }
                return p;
            })
        })));

        if (selectedPlayer && selectedPlayer.name === originalName) {
            setSelectedPlayer(prev => prev ? {
                ...prev,
                name: updatedData.name,
                city: updatedData.city,
                avatar: updatedData.avatar,
                bio: updatedData.bio,
                social: updatedData.social,
                playStyles: updatedData.playStyles,
                gallery: updatedData.gallery,
                level: updatedData.level,
                currentExp: updatedData.currentExp,
                nextLevelExp: updatedData.nextLevelExp,
                lastDailyClaim: updatedData.lastDailyClaim
            } : null);
        }

        // 3. Persist to Supabase (if user is logged in)
        if (currentUserId) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        name: updatedData.name,
                        avatar_url: updatedData.avatar,
                        city: updatedData.city,
                        bio: updatedData.bio,
                        social: updatedData.social || {},
                        play_styles: updatedData.playStyles || [],
                        gallery: updatedData.gallery || [],
                        level: updatedData.level || 1,
                        current_exp: updatedData.currentExp || 0,
                        next_level_exp: updatedData.nextLevelExp || 1000,
                        last_daily_claim: updatedData.lastDailyClaim || null,
                        daily_streak: updatedData.dailyStreak || 0
                    })
                    .eq('id', currentUserId);

                if (error) throw error;
            } catch (e: any) {
                console.error('Error saving profile to DB:', e);
                alert('Erro ao salvar perfil: ' + (e.message || JSON.stringify(e)));
            }
        }
    };

    // --- CREATE TEST USER (ADMIN TOOL) ---
    const handleCreateTestUser = () => {
        const names = ["Gabriel Silva", "Lucas Poker", "Ana Paula", "Felipe D.", "Roberto K.", "Juliana S.", "Pedro H.", "Mariana T."];
        const randomName = names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 100);
        const styles = ["Agressivo", "Tight", "GTO Wizard", "Bluffer", "Calling Station", "Loose"];

        const newUser: RankingPlayer = {
            rank: 0,
            name: randomName,
            avatar: `https://ui-avatars.com/api/?name=${randomName.replace(' ', '+')}&background=random&color=fff`,
            city: "Porto Alegre - RS",
            points: Math.floor(Math.random() * 500) + 50,
            change: "same",
            bio: "Perfil de teste gerado pelo administrador para validação do sistema.",
            playStyles: [styles[Math.floor(Math.random() * styles.length)]],
            social: {
                instagram: "@" + randomName.replace(' ', '').toLowerCase(),
            },
            gallery: [],
            level: 1,
            currentExp: 0,
            nextLevelExp: 1000
        };

        // Add to Annual, Quarterly and Legacy by default (preserving logic)
        setRankings(prev => prev.map(r => {
            if (['annual', 'quarterly', 'legacy'].includes(r.id)) {
                const newPlayers = [...r.players, newUser].sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));
                return { ...r, players: newPlayers };
            }
            return r;
        }));

        alert(`Usuário de teste "${randomName}" criado com sucesso!`);
    };

    // --- EVENT MANAGEMENT HANDLERS ---
    const handleSaveEvent = async (event: Event) => {
        // GUIDs (from Supabase) are usually 36 chars. Local temporary IDs are timestamps (13 chars).
        const isNew = !events.some(e => e.id === event.id) || event.id.length < 20;

        const dbData: any = {
            title: event.title,
            date: event.date,
            time: event.time,
            type: event.type,
            buyin: event.buyin,
            guaranteed: event.guaranteed,
            status: event.status,
            ranking_type: event.rankingType,
            included_rankings: event.includedRankings,
            description: event.description,
            stack: event.stack,
            blinds: event.blinds,
            late_reg: event.lateReg,
            location: event.location,
            rebuy_value: event.rebuyValue,
            rebuy_chips: event.rebuyChips,
            addon_value: event.addonValue,
            addon_chips: event.addonChips,
            staff_bonus_value: event.staffBonusValue,
            staff_bonus_chips: event.staffBonusChips,
            time_chip_value: event.timeChipValue,
            time_chip_chips: event.timeChipChips,
            flyer_url: event.flyerUrl,
            double_rebuy_value: event.doubleRebuyValue,
            double_rebuy_chips: event.doubleRebuyChips,
            double_addon_value: event.doubleAddonValue,
            double_addon_chips: event.doubleAddonChips,
            parallel_products: event.parallelProducts,
            results: event.results,
            total_rebuys: event.totalRebuys,
            total_addons: event.totalAddons,
            total_prize: event.totalPrize,
            scoring_schema_id: event.scoringSchemaId
        };

        try {
            let savedEvent = { ...event };
            if (isNew) {
                // Remove local id to let DB generate one
                const { id, ...dataToInsert } = dbData;
                const { data, error } = await supabase
                    .from('events')
                    .insert([dataToInsert])
                    .select();
                if (error) throw error;
                if (data && data[0]) {
                    savedEvent = { ...event, id: data[0].id };
                    setEvents(prev => [...prev.filter(e => e.id !== event.id), savedEvent]);
                }
            } else {
                const { error } = await supabase
                    .from('events')
                    .update(dbData)
                    .eq('id', event.id);
                if (error) throw error;
                setEvents(prev => prev.map(e => e.id === event.id ? event : e));
            }
        } catch (e: any) {
            console.error('Error saving event to Supabase:', e);
            alert('Falha ao salvar no Supabase: ' + (e.message || 'Erro desconhecido. Verifique se você é Administrador e se a internet está ok.'));
            // Fallback: update local state anyway
            setEvents(prev => {
                const idx = prev.findIndex(e => e.id === event.id);
                if (idx >= 0) return prev.map(e => e.id === event.id ? event : e);
                return [...prev, event];
            });
        }
    };

    const handleDeleteEventAcrossApp = async (eventId: string) => {
        // Simple logic for local IDs
        const isLocal = eventId.length < 10;

        setEvents(prev => prev.filter(e => e.id !== eventId));

        if (!isLocal && isAdmin) {
            try {
                const { error } = await supabase
                    .from('events')
                    .delete()
                    .eq('id', eventId);
                if (error) throw error;
            } catch (e: any) {
                console.error('Error deleting event from Supabase:', e);
                alert('Falha ao excluir no Supabase: ' + (e.message || 'Erro desconhecido.'));
            }
        }
    };

    // --- LOGIC TO CLOSE EVENT AND RECALCULATE RANKINGS ---
    const handleEventClosure = async (eventId: string, results: PlayerResult[], stats: { totalRebuys: number, totalAddons: number, totalPrize: number }) => {
        const eventToUpdate = events.find(e => e.id === eventId);
        if (!eventToUpdate) return;

        const updatedEvent: Event = {
            ...eventToUpdate,
            status: 'closed' as const,
            results: results,
            totalRebuys: stats.totalRebuys,
            totalAddons: stats.totalAddons,
            totalPrize: stats.totalPrize
        };

        // LOCAL UPDATE
        const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e);
        setEvents(updatedEvents);

        // DB UPDATE
        if (isAdmin && eventId.length >= 10) {
            try {
                const { error } = await supabase
                    .from('events')
                    .update({
                        status: 'closed',
                        results: results,
                        total_rebuys: stats.totalRebuys,
                        total_addons: stats.totalAddons,
                        total_prize: stats.totalPrize
                    })
                    .eq('id', eventId);
                if (error) throw error;
            } catch (e: any) {
                console.error('Error updating closed event in Supabase:', e);
                alert('Falha ao encerrar evento no Supabase: ' + (e.message || 'Erro desconhecido.'));
            }
        }

        // Extract all unique players across all rankings to preserve metadata
        const allPlayers = rankings.flatMap(r => r.players);
        const metadataMap = new Map<string, Partial<RankingPlayer>>();
        allPlayers.forEach(p => {
            metadataMap.set(p.name, { city: p.city, avatar: p.avatar, bio: p.bio, social: p.social, playStyles: p.playStyles, gallery: p.gallery, manualPrize: p.manualPrize, level: p.level, currentExp: p.currentExp });
        });

        // Recalculate each ranking based on events
        setRankings(prevRankings => prevRankings.map(ranking => {
            const playerMap = new Map<string, RankingPlayer>();

            updatedEvents.forEach(ev => {
                // Check if event includes this ranking ID
                const included = ev.includedRankings || ['annual', 'quarterly', 'legacy'];
                if (ev.status === 'closed' && ev.results && included.includes(ranking.id)) {
                    // Decide which schema to use for this ranking based on event type
                    const mappedSchemaId = (ev.rankingType && ranking.scoringSchemaMap)
                        ? ranking.scoringSchemaMap[ev.rankingType]
                        : ev.scoringSchemaId;

                    ev.results.forEach(r => {
                        if (!playerMap.has(r.name)) {
                            const meta = metadataMap.get(r.name) || {};
                            playerMap.set(r.name, {
                                rank: 0,
                                name: r.name,
                                avatar: meta.avatar || `https://ui-avatars.com/api/?name=${r.name.replace(' ', '+')}&background=random`,
                                city: meta.city || 'Venâncio Aires - RS',
                                points: 0,
                                change: 'same',
                                ...meta
                            });
                        }
                        const p = playerMap.get(r.name)!;

                        // Calculate points specifically for this ranking
                        const calculatedPoints = calculatePoints(
                            ev.rankingType || 'weekly',
                            ev.results?.length || 0,
                            Number(ev.buyin.replace(/[^0-9]/g, '')) || 0,
                            r.position,
                            r.prize,
                            r.isVip,
                            mappedSchemaId,
                            globalScoringSchemas
                        );

                        p.points += calculatedPoints;
                    });
                }
            });

            // Sort and rank
            const sortedPlayers = Array.from(playerMap.values())
                .sort((a, b) => b.points - a.points)
                .map((p, i) => ({ ...p, rank: i + 1 }));

            return { ...ranking, players: sortedPlayers };
        }));

        alert('Evento encerrado e Rankings recalculados com sucesso!');
    };
    // -----------------------------------

    // Estado Global do Prêmio e Stats
    const [prizeLabel, setPrizeLabel] = useState('30K+');
    const [totalQualifiers, setTotalQualifiers] = useState(0);
    const [customTotalQualifiers, setCustomTotalQualifiers] = useState<number | null>(null);
    const [nextGoal, setNextGoal] = useState({ prize: 35000, qualifiers: 25 });

    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isLoggedIn && messages.length === 0) {
            const timer = setTimeout(() => {
                const newMsg: Message = {
                    id: 'msg-1',
                    from: 'Admin Chip Race',
                    subject: 'Bem-vindo ao The Chosen!',
                    content: 'Parabéns por se juntar à plataforma. Complete seu perfil para ganhar pontos extras no ranking de engajamento.',
                    date: new Date().toLocaleDateString(),
                    read: false
                };
                setMessages([newMsg]);
                setUnreadCount(1);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn]);

    const handleSendMessage = (toPlayer: string, content: string) => {
        console.log(`Mensagem enviada para ${toPlayer}: ${content}`);
    };

    const handleReplyMessage = (messageId: string, replyText: string) => {
        console.log(`Respondendo à mensagem ${messageId}: ${replyText}`);
        alert('Sua resposta foi enviada com sucesso!');
    };

    const handleMarkAsRead = (id: string) => {
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: true } : msg));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleUpdateTotalQualifiers = async (value: number | null) => {
        setCustomTotalQualifiers(value);
        if (isAdmin) {
            await saveToContentDB('total_qualifiers', value);
        }
    };

    const [months, setMonths] = useState<MonthData[]>([
        { name: 'MAR', qualifiers: 5, prize: '33K+', status: 'completed' },
        { name: 'ABR', qualifiers: 15, prize: '35K+', status: 'active' },
        { name: 'MAI', qualifiers: 10, prize: '40K+', status: 'locked' },
        { name: 'JUN', qualifiers: '?', prize: '???', status: 'locked' },
        { name: 'JUL', qualifiers: '?', prize: '???', status: 'locked' },
        { name: 'AGO', qualifiers: '?', prize: '???', status: 'locked' },
        { name: 'SET', qualifiers: '?', prize: '???', status: 'locked' },
        { name: 'OUT', qualifiers: '?', prize: '???', status: 'locked' },
        { name: 'NOV', qualifiers: 'FINAL', prize: 'MAX', status: 'locked' },
    ]);

    useEffect(() => {
        const completedMonths = months.filter(m => m.status === 'completed');
        let currentPrizeVal = 30000;

        if (completedMonths.length > 0) {
            const lastCompleted = completedMonths[completedMonths.length - 1];
            setPrizeLabel(lastCompleted.prize);
            const numericPrize = parseInt(lastCompleted.prize.replace(/\D/g, ''));
            if (!isNaN(numericPrize)) currentPrizeVal = numericPrize * 1000;
        } else {
            setPrizeLabel('30K+');
        }

        const autoTotal = months.reduce((acc, month) => {
            if (month.status === 'completed' && typeof month.qualifiers === 'number') {
                return acc + month.qualifiers;
            }
            return acc;
        }, 0);

        const finalTotal = customTotalQualifiers !== null ? customTotalQualifiers : autoTotal;
        setTotalQualifiers(finalTotal);

        const activeMonth = months.find(m => m.status === 'active');
        const firstLocked = months.find(m => m.status === 'locked');
        const targetMonth = activeMonth || firstLocked;

        if (targetMonth) {
            const targetPrizeStr = targetMonth.prize;
            const targetPrizeNum = parseInt(targetPrizeStr.replace(/\D/g, ''));
            const nextPrize = !isNaN(targetPrizeNum) ? targetPrizeNum * 1000 : currentPrizeVal + 5000;

            let accumTarget = 0;
            for (const m of months) {
                if (typeof m.qualifiers === 'number') {
                    accumTarget += m.qualifiers;
                }
                if (m === targetMonth) break;
            }

            setNextGoal({
                prize: nextPrize,
                qualifiers: accumTarget
            });
        }

    }, [months, customTotalQualifiers]);

    // --- SECURE LOGIN LOGIC ---
    const handleLogin = () => {
        // Supabase handles the session, this callback just updates the view
        handleNavigate('home');
    };

    const handlePlayerSelect = (player: RankingPlayer) => {
        setSelectedPlayer(player);
        setCurrentView('profile');
    };

    const handleNavigate = (view: string) => {
        if (view === 'profile') {
            setSelectedPlayer(null);
        }
        setCurrentView(view);
        window.scrollTo(0, 0);
    };

    const handleUpdateMonth = async (index: number, field: keyof MonthData, value: any) => {
        const newMonths = [...months];
        if (field === 'qualifiers' && !isNaN(Number(value)) && value !== '') {
            value = Number(value);
        }
        newMonths[index] = { ...newMonths[index], [field]: value };
        setMonths(newMonths);

        if (isAdmin) {
            await saveToContentDB('months', newMonths);
        }
    };

    const handleToggleMonthStatus = (index: number) => {
        const current = months[index].status;
        let nextStatus: 'active' | 'completed' | 'locked' = 'locked';

        if (current === 'locked') nextStatus = 'active';
        else if (current === 'active') nextStatus = 'completed';
        else if (current === 'completed') nextStatus = 'locked';

        handleUpdateMonth(index, 'status', nextStatus);
    };


    // Helper para obter lista completa e única de jogadores (Simulando DB completo)
    const getAllUniquePlayers = () => {
        // 1. Inicia com jogadores que já estão nos rankings
        const playersFromRankings = rankings.flatMap(r => r.players);

        // 2. Combina com todos os perfis do sistema (allProfiles)
        const combinedPlayers = [...playersFromRankings, ...allProfiles];

        // 3. Adiciona o usuário atual se estiver logado
        if (isLoggedIn && currentUser.name) {
            combinedPlayers.push({
                rank: 0,
                name: currentUser.name,
                avatar: currentUser.avatar || '',
                city: currentUser.city || '',
                points: 0,
                change: 'same'
            });
        }

        // 4. Remove duplicatas baseado no nome (Case Insensitive para segurança)
        const uniqueMap = new Map();
        combinedPlayers.forEach(p => {
            if (!p.name) return;
            const key = p.name.toLowerCase().trim();
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, p);
            }
        });

        return Array.from(uniqueMap.values());
    };

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
                />;
            case 'ranking':
                return <RankingTable
                    isAdmin={isAdmin}
                    onSelectPlayer={handlePlayerSelect}
                    rankings={rankings} // Updated to pass full ranking objects
                    onUpdateRankingMeta={handleUpdateRankingMeta} // Admin
                    onUpdateGlobalSchemas={handleUpdateGlobalSchemas} // Admin
                    onAddRanking={handleAddRanking} // Admin
                    onDeleteRanking={handleDeleteRanking} // Admin
                    onUpdatePrize={handleUpdateRankingPrize}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    events={events}
                    globalScoringSchemas={globalScoringSchemas}
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
                    onCreateTestUser={handleCreateTestUser}
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
                />;
            case 'the-chosen-regulations':
                return <TheChosenRegulations prizeLabel={prizeLabel} onBack={() => handleNavigate('the-chosen-details')} />;
            case 'vip':
                return <VipPage onNavigate={handleNavigate} />;
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
                        />
                        <TheChosenStats
                            isAdmin={isAdmin}
                            prizeLabel={prizeLabel}
                            totalQualifiers={totalQualifiers}
                            nextGoal={nextGoal}
                            onUpdateTotal={handleUpdateTotalQualifiers}
                            isManualTotal={customTotalQualifiers !== null}
                        />
                        <TournamentCategories
                            isAdmin={isAdmin}
                            categories={contentDB.categories}
                            onUpdateCategory={updateCategory}
                            prizeLabel={prizeLabel}
                        />
                        <Newsletter onNavigate={handleNavigate} />
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark relative">
            <Navigation
                currentView={currentView}
                onNavigate={handleNavigate}
                prizeLabel={prizeLabel}
                isLoggedIn={isLoggedIn}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    handleNavigate('home');
                }}
                messages={messages}
                unreadCount={unreadCount}
                onMarkAsRead={handleMarkAsRead}
                onReply={handleReplyMessage}
            />

            <main className="flex-grow pt-20 pb-20">
                {renderContent()}
            </main>

            {/* Indicador de Usuário Logado - Fixo no canto inferior direito */}
            {isLoggedIn && currentUser.name && (
                <div className="fixed bottom-4 right-4 z-50 bg-surface-dark/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                    <span className="text-sm text-gray-300">Olá, <span className="font-bold text-white">{currentUser.name}</span> {isAdmin && <span className="text-[10px] text-red-400 bg-red-900/30 px-1 rounded ml-1 border border-red-500/30">ADMIN</span>}</span>
                </div>
            )}
        </div>
    );
}