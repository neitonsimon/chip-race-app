import React, { useState, useEffect } from 'react';
import { Event, PlayerResult, RankingPlayer, RankingInstance, ScoringSchema, RankingFormula, PlayerStats } from '../types';
import { supabase } from '../src/lib/supabase';
import { calculatePoints } from '../utils/scoring';
import appConfig from '../src/config/appConfig.json';
import { EventSkeleton } from './Skeleton';

interface EventStats {
    totalRebuys: number;
    totalAddons: number;
    totalPrize: number;
}

interface EventCalendarProps {
    isAdmin?: boolean;
    currentUser?: PlayerStats | null;
    events: Event[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    onCloseEvent: (eventId: string, results: PlayerResult[], stats: EventStats) => void;
    onSaveEvent?: (event: Event) => Promise<void>;
    onDeleteEvent?: (eventId: string) => Promise<void>;
    rankingPlayers: RankingPlayer[]; // Para autocomplete
    rankings: RankingInstance[]; // Rankings dinâmicos passados pelo App
    scoringSchemas: ScoringSchema[]; // Global scoring formulas
    isLoading?: boolean;
    onSelectPlayerByName?: (name: string) => void;
}

// Tipos auxiliares para o Closing
// Tipos auxiliares para o Closing

// Lista de Produtos Paralelos com Estilos
const PARALLEL_PRODUCTS = appConfig.events.parallelProducts;

export const EventCalendar: React.FC<EventCalendarProps> = ({
    isAdmin,
    currentUser,
    events,
    setEvents,
    onCloseEvent,
    onSaveEvent,
    onDeleteEvent,
    rankingPlayers,
    rankings,
    scoringSchemas,
    isLoading,
    onSelectPlayerByName
}) => {
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewEvent, setViewEvent] = useState<Event | null>(null); // Modal de Flyer (Eventos Abertos)
    const [viewClosedEvent, setViewClosedEvent] = useState<Event | null>(null); // Modal de Resultados (Eventos Fechados)

    // TAB FILTER STATE
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

    // TYPE FILTER STATE
    const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'online'>('all');

    // SORT STATE
    const [sortOption, setSortOption] = useState('date');

    // States para Encerrar Evento / Gerenciar Resultados
    const [closingEvent, setClosingEvent] = useState<Event | null>(null);
    const [formulaType, setFormulaType] = useState<RankingFormula>('weekly');
    const [totalPlayers, setTotalPlayers] = useState<number>(0);
    const [buyinValue, setBuyinValue] = useState<number>(0);
    // Novos States de Estatísticas
    const [rebuysCount, setRebuysCount] = useState<number>(0);
    const [addonsCount, setAddonsCount] = useState<number>(0);
    const [totalPrizeValue, setTotalPrizeValue] = useState<number>(0); // Substitui Staff Count

    const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);

    // NOVO: States para Criação de Eventos Multi-dia
    const [isMultiDayForm, setIsMultiDayForm] = useState(false);
    const [startingDays, setStartingDays] = useState<{ name: string; date: string; time: string }[]>([{ name: '1A', date: '', time: '' }]);
    const [finalDayDate, setFinalDayDate] = useState('');
    const [finalDayTime, setFinalDayTime] = useState('');
    const [stackAggregation, setStackAggregation] = useState<'sum' | 'max'>('max');
    // Autocomplete States
    const [newPlayerName, setNewPlayerName] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
    const [suggestions, setSuggestions] = useState<RankingPlayer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Helpers for Sorting
    const getBuyinValue = (str: string) => {
        const num = parseInt(str.replace(/\D/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // CALCULO AUTOMÁTICO DE PREMIAÇÃO (Baseado na DISTRIBUIÇÃO dos prêmios)
    useEffect(() => {
        // Soma o campo 'prize' de cada jogador na lista
        const totalDistributed = playerResults.reduce((acc, curr) => acc + (curr.prize || 0), 0);
        setTotalPrizeValue(totalDistributed);
    }, [playerResults]);


    const getGuaranteedValue = (str: string) => {
        if (!str) return 0;
        const upperStr = str.toUpperCase();
        // Se tiver 'K', multiplica por 1000
        if (upperStr.includes('K')) {
            const num = parseFloat(upperStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return isNaN(num) ? 0 : num * 1000;
        }
        // Se for apenas número ou "Vagas"
        const num = parseInt(str.replace(/\D/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Helper para buscar Nome atualizado (pelo ID se disponível)
    const getPlayerName = (userId?: string, fallbackName: string = '—') => {
        if (!userId) return fallbackName;
        const player = rankingPlayers.find(p => p.id === userId);
        return player?.name || fallbackName;
    };

    // Helper para buscar Avatar
    const getPlayerAvatar = (name: string, userId?: string) => {
        let player;
        if (userId) {
            player = rankingPlayers.find(p => p.id === userId);
        }
        if (!player) {
            player = rankingPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
        }
        return player?.avatar || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`;
    };

    // Filter & Sort Events
    const filteredEvents = events
        .filter(e => {
            if (e.is_hidden) return false;
            // Tab Filter
            let matchesTab = false;
            if (activeTab === 'upcoming') {
                matchesTab = e.status === 'open' || e.status === 'running';
            } else {
                matchesTab = e.status === 'closed';
            }

            // Type Filter
            let matchesType = true;
            if (typeFilter !== 'all') {
                matchesType = e.type === typeFilter;
            }

            return matchesTab && matchesType;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case 'buyin_asc':
                    return getBuyinValue(a.buyin) - getBuyinValue(b.buyin);
                case 'buyin_desc':
                    return getBuyinValue(b.buyin) - getBuyinValue(a.buyin);
                case 'gtd_desc':
                    return getGuaranteedValue(b.guaranteed) - getGuaranteedValue(a.guaranteed);
                case 'date':
                default:
                    // Date Sort: Ascending for upcoming (soonest first), Descending for completed (most recent first)
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    if (activeTab === 'completed') {
                        return dateB.getTime() - dateA.getTime();
                    }
                    return dateA.getTime() - dateB.getTime();
            }
        });

    // --- HELPERS DE FORMATAÇÃO ---
    const formatCurrency = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers ? `R$ ${parseInt(numbers, 10)}` : '';
    };

    const formatChips = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers ? parseInt(numbers, 10).toLocaleString('pt-BR') : '';
    };

    const isMonetaryField = (field: string) => {
        const monetaryFields = ['buyin', 'rebuyValue', 'doubleRebuyValue', 'addonValue', 'doubleAddonValue', 'staffBonusValue'];
        return monetaryFields.includes(field);
    };

    const isChipField = (field: string) => {
        const chipFields = ['stack', 'rebuyChips', 'doubleRebuyChips', 'addonChips', 'doubleAddonChips', 'staffBonusChips', 'timeChipChips'];
        return chipFields.includes(field);
    };

    // -----------------------------

    // Auto-fill buyin when opening closing modal (or editing existing results)
    const handleOpenClosing = (event: Event) => {
        setClosingEvent(event);

        // Tenta extrair o valor numérico do buyin string (ex: "R$ 150" -> 150)
        const numericBuyin = parseInt(event.buyin.replace(/\D/g, '')) || 0;
        setBuyinValue(numericBuyin);
        setFormulaType(event.rankingType || 'weekly');

        if (event.status === 'closed' && event.results) {
            // MODO EDIÇÃO DE RESULTADOS: Carrega dados existentes
            setPlayerResults([...event.results]);
            setTotalPlayers(event.results.length);
            setRebuysCount(event.totalRebuys || 0);
            setAddonsCount(event.totalAddons || 0);
            setTotalPrizeValue(event.totalPrize || 0);
        } else {
            // MODO NOVO ENCERRAMENTO: Reseta
            setRebuysCount(0);
            setAddonsCount(0);
            setTotalPrizeValue(0);

            let initialResults: PlayerResult[] = [];

            if (event.isFinalDay) {
                const startingDays = events.filter(e => e.finalEventId === event.id && e.isStartingDay && e.status === 'closed');
                const qualifierMap = new Map<string, PlayerResult>();

                startingDays.forEach(sd => {
                    if (sd.results) {
                        sd.results.forEach(pr => {
                            const key = pr.userId || pr.name.toLowerCase().trim();
                            if (qualifierMap.has(key)) {
                                const existing = qualifierMap.get(key)!;
                                // Se o jogador passou em outro dia inicial, pegamos o maior stack ou somamos (conforme config do evento)
                                if (pr.qualifierChips && pr.qualifierChips > 0) {
                                    if (event.stackAggregation === 'sum') {
                                        existing.qualifierChips = (existing.qualifierChips || 0) + pr.qualifierChips;
                                    } else {
                                        existing.qualifierChips = Math.max(existing.qualifierChips || 0, pr.qualifierChips);
                                    }
                                }
                            } else {
                                // Adiciona o jogador (mesmo que não tenha fichas, para calcular participação)
                                qualifierMap.set(key, {
                                    ...pr,
                                    id: Date.now().toString() + Math.random(),
                                    position: 1,
                                    prize: 0,
                                    calculatedPoints: 0,
                                    qualifierChips: pr.qualifierChips || 0
                                });
                            }
                        });
                    }
                });

                initialResults = Array.from(qualifierMap.values())
                    .sort((a, b) => (b.qualifierChips || 0) - (a.qualifierChips || 0))
                    .map((p, idx) => ({ ...p, position: idx + 1 }));
            }

            setTotalPlayers(initialResults.length);
            setPlayerResults(initialResults);
        }

        setNewPlayerName('');
    };

    const handleNewEvent = () => {
        const newEvent: Event = {
            id: Date.now().toString(),
            title: '',
            date: '',
            time: '',
            type: 'live',
            gameMode: 'tournament',
            rankingType: 'weekly',
            includedRankings: ['annual', 'quarterly', 'legacy'], // Default: todos
            buyin: '',
            guaranteed: '',
            status: 'open',
            stack: '',
            blinds: '',
            lateReg: '',
            location: '',
            description: '',
            modality: '',
            rebuyValue: '',
            rebuyChips: '',
            addonValue: '',
            addonChips: '',
            parallelProducts: []
        };
        setIsMultiDayForm(false);
        setStartingDays([{ name: '1A', date: '', time: '' }]);
        setFinalDayDate('');
        setFinalDayTime('');
        setStackAggregation('max');
        setEditingEvent(newEvent);
    };

    const handleDuplicateEvent = (event: Event) => {
        if (!isAdmin) return;
        const duplicatedEvent: Event = {
            ...event,
            id: Date.now().toString(),
            title: `${event.title} (Cópia)`,
            status: 'open', // Reset status
            results: undefined, // Reset results
            totalRebuys: undefined,
            totalAddons: undefined,
            totalPrize: undefined
        };

        if (onSaveEvent) {
            onSaveEvent(duplicatedEvent).then(() => {
                alert('Evento duplicado com sucesso!');
            });
        } else {
            setEvents(prev => [...prev, duplicatedEvent]);
            alert('Evento duplicado com sucesso!');
        }
    };

    // Lógica corrigida de exclusão com Confirmação e StopPropagation
    const handleDeleteEvent = (eventId: string) => {
        if (!isAdmin) return;

        // Caixa de confirmação antes de remover
        const confirmDelete = window.confirm('Tem certeza que deseja excluir este evento permanentemente? Esta ação não pode ser desfeita.');

        if (confirmDelete) {
            if (onDeleteEvent) {
                onDeleteEvent(eventId);
            } else {
                setEvents(currentEvents => {
                    // Retorna uma nova lista SEM o evento selecionado
                    return currentEvents.filter(e => e.id !== eventId);
                });
            }
        }
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEvent) {
            if (isMultiDayForm) {
                // Validación Básica
                if (!editingEvent.title) {
                    alert('Por favor, preencha o título do evento.');
                    return;
                }
                if (!finalDayDate || !finalDayTime) {
                    alert('Preencha a data e hora do dia final.');
                    return;
                }
                for (const sd of startingDays) {
                    if (!sd.name || !sd.date || !sd.time) {
                        alert(`Preencha todos os campos do dia classificatório ${sd.name || ''}`);
                        return;
                    }
                }

                const baseId = Date.now().toString();
                const finalEventId = `${baseId}-final`;

                const finalEvent: Event = {
                    ...editingEvent,
                    id: finalEventId,
                    title: `${editingEvent.title} (Dia Final)`,
                    date: finalDayDate,
                    time: finalDayTime,
                    isMultiDay: true,
                    isFinalDay: true,
                    stackAggregation: stackAggregation
                };

                const startingEvents: Event[] = startingDays.map((sd, index) => ({
                    ...editingEvent,
                    id: `${baseId}-${index}`,
                    title: `${editingEvent.title} (Dia ${sd.name})`,
                    date: sd.date,
                    time: sd.time,
                    isMultiDay: true,
                    isStartingDay: true,
                    finalEventId: finalEventId
                }));

                if (onSaveEvent) {
                    // Save final day FIRST to get the real DB UUID
                    const savedFinalEvent = await onSaveEvent(finalEvent);
                    const realFinalId = (savedFinalEvent as any)?.id || finalEvent.id;

                    // Now save all starting days pointing to the real final day UUID
                    for (const ev of startingEvents) {
                        await onSaveEvent({ ...ev, finalEventId: realFinalId });
                    }
                } else {
                    const allEvents = [...startingEvents, finalEvent];
                    setEvents(currentEvents => [...currentEvents, ...allEvents]);
                }

            } else {
                if (onSaveEvent) {
                    // Basic validation before saving to cloud
                    if (!editingEvent.title || !editingEvent.date || !editingEvent.time) {
                        alert('Por favor, preencha o título, data e hora do evento.');
                        return;
                    }
                    await onSaveEvent(editingEvent);
                } else {
                    // Sempre atualizar o estado local para garantir exibição imediata (Optimistic Update)
                    setEvents(currentEvents => {
                        const existingIndex = currentEvents.findIndex(ev => ev.id === editingEvent.id);
                        if (existingIndex >= 0) {
                            return currentEvents.map(ev => ev.id === editingEvent.id ? editingEvent : ev);
                        } else {
                            return [...currentEvents, editingEvent];
                        }
                    });
                }
            }

            setEditingEvent(null);
            setIsMultiDayForm(false);
        }
    };

    const handleInputChange = (field: keyof Event, value: string) => {
        if (editingEvent) {
            let formattedValue = value;

            if (isMonetaryField(field)) {
                formattedValue = formatCurrency(value);
            } else if (isChipField(field)) {
                formattedValue = formatChips(value);
            }

            setEditingEvent({ ...editingEvent, [field]: formattedValue });
        }
    };

    const toggleParallelProduct = (productId: string) => {
        if (editingEvent) {
            const currentProducts = editingEvent.parallelProducts || [];
            let newProducts;
            if (currentProducts.includes(productId)) {
                newProducts = currentProducts.filter(p => p !== productId);
            } else {
                newProducts = [...currentProducts, productId];
            }
            setEditingEvent({ ...editingEvent, parallelProducts: newProducts });
        }
    };

    const toggleRanking = (rankingId: string) => {
        if (editingEvent) {
            const currentRankings = editingEvent.includedRankings || [];
            let newRankings;
            if (currentRankings.includes(rankingId)) {
                newRankings = currentRankings.filter(r => r !== rankingId);
            } else {
                newRankings = [...currentRankings, rankingId];
            }
            setEditingEvent({ ...editingEvent, includedRankings: newRankings });
        }
    };

    const handleReserveSeat = async (eventToReserve: Event) => {
        if (!currentUser) {
            alert("Você precisa estar logado para reservar um assento.");
            return;
        }

        try {
            const { error } = await supabase
                .from('tournament_reservations')
                .insert({
                    event_id: eventToReserve.id,
                    user_id: currentUser.id,
                    status: 'reserved'
                });

            if (error) {
                if (error.code === '23505') { // Unique constraint violation usually
                    alert("Você já possui reserva para este evento.");
                } else {
                    console.error("Erro ao reservar:", error);
                    alert("Não foi possível reservar seu assento no momento.");
                }
            } else {
                alert("Assento reservado com sucesso! A organização foi notificada.");
            }
        } catch (err) {
            console.error("Erro inesperado:", err);
            alert("Ocorreu um erro ao processar sua reserva.");
        }
    };

    // --- LOGICA DE CÁLCULO DE PONTOS ---

    const refreshAllPoints = (newType: RankingFormula, newPlayers: number, newBuyin: number, currentResults: PlayerResult[], schemaId?: string) => {
        return currentResults.map(p => {
            // Calculate base/preview points
            const calculatedPoints = calculatePoints(
                newType,
                newPlayers,
                newBuyin,
                p.position,
                p.prize,
                p.isVip,
                schemaId,
                scoringSchemas,
                p.rake || 0,
                p.profitLoss || 0
            );

            // Calculate points for each specific ranking the event is part of
            const pointsPerRanking: Record<string, number> = {};
            if (closingEvent?.includedRankings) {
                closingEvent.includedRankings.forEach(rId => {
                    const ranking = rankings.find(r => r.id === rId);
                    if (ranking) {
                        const mappedSchemaId = (newType && ranking.scoringSchemaMap)
                            ? ranking.scoringSchemaMap[newType]
                            : schemaId;

                        pointsPerRanking[rId] = calculatePoints(
                            newType,
                            newPlayers,
                            newBuyin,
                            p.position,
                            p.prize,
                            p.isVip,
                            mappedSchemaId,
                            scoringSchemas,
                            p.rake || 0,
                            p.profitLoss || 0
                        );
                    }
                });
            }

            return {
                ...p,
                calculatedPoints,
                pointsPerRanking
            };
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewPlayerName(val);
        setSelectedUserId(undefined); // Reset ID if typing manually
        if (val.length > 0) {
            const valLower = val.toLowerCase();

            const filtered = rankingPlayers.filter(p => {
                const nameLower = p.name.toLowerCase();
                const matchesSearch = nameLower.includes(valLower);
                const isAlreadyAdded = playerResults.some(pr => pr.name.toLowerCase() === nameLower);
                return matchesSearch && !isAlreadyAdded;
            });

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (player: RankingPlayer) => {
        setNewPlayerName(player.name);
        setSelectedUserId(player.id);
        setShowSuggestions(false);
    };

    const addPlayerResult = async () => {
        if (!newPlayerName.trim()) return;

        let finalUserId = selectedUserId;
        let isPlayerVip = false;
        let finalName = newPlayerName.trim();

        if (!finalUserId) {
            // Tenta encontrar o usuário pelo nome se for digitado manualmente
            const manualPlayer = rankingPlayers.find(p => p.name.toLowerCase() === finalName.toLowerCase());
            if (manualPlayer) {
                finalUserId = manualPlayer.id;
            }
        }

        if (finalUserId) {
            const playerInfo = rankingPlayers.find(p => p.id === finalUserId);
            if (playerInfo) {
                isPlayerVip = playerInfo.isVip || (playerInfo.vipStatus && playerInfo.vipStatus !== 'nao_vip') || false;
                finalName = playerInfo.name; // Garante o nome correto
            }
        }

        if (!finalUserId) {
            try {
                const { data, error } = await supabase.rpc('create_ghost_user', { p_name: finalName });
                if (error) throw error;
                finalUserId = data;
            } catch (err: any) {
                alert('Erro ao criar jogador fantasma: ' + err.message);
                return;
            }
        }

        const newTotalPlayers = totalPlayers + 1;
        setTotalPlayers(newTotalPlayers);

        const newResult: PlayerResult = {
            id: Date.now().toString(),
            userId: finalUserId,
            name: finalName,
            position: playerResults.length + 1,
            prize: 0,
            isVip: isPlayerVip,
            calculatedPoints: 0
        };

        const updatedList = [...playerResults, newResult];
        const refreshedList = closingEvent?.isStartingDay
            ? updatedList
            : refreshAllPoints(formulaType, newTotalPlayers, buyinValue, updatedList);

        setPlayerResults(refreshedList);
        setNewPlayerName('');
        setSelectedUserId(undefined);
        setShowSuggestions(false);
    };

    const removePlayerResult = (id: string) => {
        const updatedList = playerResults.filter(p => p.id !== id);
        const newTotalPlayers = Math.max(0, totalPlayers - 1);
        setTotalPlayers(newTotalPlayers);
        const refreshedList = closingEvent?.isStartingDay
            ? updatedList
            : refreshAllPoints(formulaType, newTotalPlayers, buyinValue, updatedList);
        setPlayerResults(refreshedList);
    };

    const updatePlayerResult = (id: string, field: keyof PlayerResult, value: any) => {
        const updatedResults = playerResults.map(p => {
            if (p.id === id) {
                const updatedP = { ...p, [field]: value };
                if (!closingEvent?.isStartingDay) {
                    updatedP.calculatedPoints = calculatePoints(
                        formulaType,
                        totalPlayers,
                        buyinValue,
                        updatedP.position,
                        updatedP.prize,
                        updatedP.isVip,
                        closingEvent?.scoringSchemaId,
                        scoringSchemas,
                        updatedP.rake || 0,
                        updatedP.profitLoss || 0
                    );
                } else {
                    updatedP.calculatedPoints = 0;
                }
                return updatedP;
            }
            return p;
        });
        setPlayerResults(updatedResults);
    };

    const handleGlobalChange = (type: 'type' | 'players' | 'buyin', val: any) => {
        let t = formulaType;
        let p = totalPlayers;
        let b = buyinValue;

        if (type === 'type') { t = val; setFormulaType(val); }
        if (type === 'players') { p = Number(val); setTotalPlayers(p); }
        if (type === 'buyin') { b = Number(val); setBuyinValue(b); }

        const refreshed = closingEvent?.isStartingDay
            ? playerResults
            : refreshAllPoints(t, p, b, playerResults, closingEvent?.scoringSchemaId);
        setPlayerResults(refreshed);
    };

    const handleFinishClosing = () => {
        if (!closingEvent) return;

        // Final points recalculation before closure to ensure everything is correct
        const finalResults = closingEvent.isStartingDay
            ? playerResults.map(p => ({ ...p, calculatedPoints: 0, position: 1 }))
            : refreshAllPoints(
                formulaType,
                totalPlayers,
                buyinValue,
                playerResults,
                closingEvent.scoringSchemaId
            );

        onCloseEvent(closingEvent.id, finalResults, {
            totalRebuys: rebuysCount,
            totalAddons: addonsCount,
            totalPrize: totalPrizeValue
        });
        setClosingEvent(null);
    };

    const isToday = (dateString: string) => {
        const today = new Date();
        const eventDate = new Date(dateString);
        return eventDate.getUTCDate() === today.getDate() &&
            eventDate.getUTCMonth() === today.getMonth() &&
            eventDate.getUTCFullYear() === today.getFullYear();
    };

    const renderStructureRow = (label: string, value?: string, chips?: string, colorClass: string = "text-white", icon?: string) => {
        if (!value && !chips) return null;
        return (
            <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5 shrink-0 backdrop-blur-sm group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-2">
                    {icon && <span className="material-icons-outlined text-sm text-primary/60 group-hover:text-primary transition-colors">{icon}</span>}
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</span>
                </div>
                <div className="text-right flex flex-col leading-none">
                    <span className={`text-base font-black tracking-tight ${colorClass}`}>{value}</span>
                    {chips && <span className="text-xs text-gray-600 font-bold mt-0.5">{chips}</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="py-12 bg-background-light dark:bg-background-dark min-h-screen relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Calendário de Eventos</h2>
                        <p className="text-gray-500 mt-2">Torneios presenciais e online da Chip Race.</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleNewEvent}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/80 transition-colors"
                        >
                            <span className="material-icons-outlined text-sm">add</span> Novo Evento
                        </button>
                    )}
                </div>

                {/* TABS DE NAVEGAÇÃO & SORTING */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-white/10 mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 px-4 text-base font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'upcoming'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-white'
                                }`}
                        >
                            Próximos Eventos
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`pb-3 px-4 text-base font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'completed'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-gray-500 hover:text-white'
                                }`}
                        >
                            Eventos Realizados
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="appearance-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm font-bold text-gray-700 dark:text-white focus:border-primary outline-none cursor-pointer shadow-sm"
                            >
                                <option value="all">Todos (Live/Online)</option>
                                <option value="live">Eventos Live</option>
                                <option value="online">Eventos Online</option>
                            </select>
                            <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg">filter_alt</span>
                        </div>

                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block">Ordenar:</span>
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="appearance-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm font-bold text-gray-700 dark:text-white focus:border-primary outline-none cursor-pointer shadow-sm"
                            >
                                <option value="date">{activeTab === 'upcoming' ? 'Data (Próximos)' : 'Mais Recentes'}</option>
                                <option value="buyin_asc">Buy-in (Menor)</option>
                                <option value="buyin_desc">Buy-in (Maior)</option>
                                <option value="gtd_desc">Maior Garantido</option>
                            </select>
                            <span className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg">sort</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl">
                            <p className="text-gray-500">Nenhum evento encontrado.</p>
                        </div>
                    ) : (
                        filteredEvents.map((event) => {
                            const eventIsToday = isToday(event.date);
                            return (
                                <div key={event.id} className={`bg-white dark:bg-surface-dark border ${event.status === 'closed' ? 'border-secondary/20 opacity-75' : eventIsToday ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-200 dark:border-white/5'} rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-primary/50 transition-colors shadow-sm group relative overflow-hidden`}>

                                    {/* HOJE INDICATOR */}
                                    {eventIsToday && activeTab === 'upcoming' && (
                                        <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-br-lg z-10 animate-pulse">
                                            HOJE!
                                        </div>
                                    )}

                                    {/* Date Box */}
                                    <div className="flex flex-row md:flex-col items-center gap-4 md:gap-1 min-w-[80px] mb-4 md:mb-0 mr-4">
                                        <span className="text-base font-bold text-primary uppercase tracking-wider">
                                            {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })}
                                        </span>
                                        <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                                            {new Date(event.date).getUTCDate()}
                                        </span>
                                        <span className="text-sm text-gray-500">{event.time}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 md:px-4 text-left w-full">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer flex items-center gap-2" onClick={() => isAdmin && setEditingEvent(event)}>
                                                {event.title}
                                                {eventIsToday && activeTab === 'upcoming' && (
                                                    <span className="material-icons-outlined text-yellow-400 animate-pulse" title="Evento Hoje">star</span>
                                                )}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wide border ${event.status === 'closed' ? 'border-gray-500 text-gray-500 bg-gray-500/10' :
                                                event.type === 'live'
                                                    ? 'border-secondary text-secondary bg-secondary/10'
                                                    : 'border-cyan-500 text-cyan-500 bg-cyan-500/10'
                                                }`}>
                                                {event.status === 'closed' ? 'ENCERRADO' : event.type === 'live' ? 'AO VIVO' : 'ONLINE'}
                                            </span>

                                            {/* Game Mode Badge */}
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase font-black tracking-widest ${event.gameMode === 'cash_game'
                                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                : 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(217,0,255,0.1)]'
                                                }`}>
                                                {event.gameMode === 'cash_game' ? 'CASH GAME' : 'TORNEIO'}
                                            </span>

                                            {event.isStartingDay && (
                                                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest bg-gradient-to-r from-primary to-accent text-white shadow-neon-pink">
                                                    DIA CLASSIFICATÓRIO
                                                </span>
                                            )}
                                            {event.isFinalDay && (
                                                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-widest bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] text-black shadow-gold">
                                                    DIA FINAL
                                                </span>
                                            )}
                                        </div>

                                        {event.location && (
                                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                <span className="material-icons-outlined text-[14px]">location_on</span>
                                                {event.location}
                                            </div>
                                        )}

                                        {event.description && (
                                            <div className="text-[11px] text-gray-400 mb-3 line-clamp-2 italic bg-primary/5 p-2 rounded border-l-2 border-primary/30">
                                                "{event.description}"
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5" title={event.gameMode === 'cash_game' ? "Mínimo / Máximo" : "Valor da Entrada"}>
                                                <span className="material-icons-outlined text-sm text-green-500">payments</span>
                                                <span className="text-gray-300 font-bold">
                                                    {event.gameMode === 'cash_game' ? (event.cashGameMinMax || event.buyin) : event.buyin}
                                                </span>
                                            </span>
                                            {event.gameMode !== 'cash_game' && (
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5" title="Premiação Garantida">
                                                    <span className="material-icons-outlined text-sm text-yellow-500">emoji_events</span>
                                                    <span className="text-gray-300 font-bold">{event.guaranteed}</span>
                                                </span>
                                            )}
                                            {event.gameMode === 'cash_game' && event.cashGameType && (
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5" title="Modalidade">
                                                    <span className="material-icons-outlined text-sm text-secondary">Style</span>
                                                    <span className="text-gray-300 font-bold capitalize">
                                                        {event.cashGameType === 'omaha4' ? 'Omaha 4' : event.cashGameType === 'omaha5' ? 'Omaha 5' : 'Texas'}
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4 text-xs text-gray-500 border-t border-gray-200 dark:border-white/5 pt-2 mb-2">
                                            {event.gameMode === 'cash_game' ? (
                                                <>
                                                    {event.cashGameBlinds && (
                                                        <div className="flex items-center gap-1" title="Blinds">
                                                            <span className="material-icons-outlined text-[12px] text-primary">timer</span>
                                                            <span className="text-gray-400">{event.cashGameBlinds}</span>
                                                        </div>
                                                    )}
                                                    {event.cashGameCapacity && (
                                                        <div className="flex items-center gap-1" title="Lugares">
                                                            <span className="material-icons-outlined text-[12px] text-primary">groups</span>
                                                            <span className="text-gray-400">{event.cashGameCapacity}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {event.modality && (
                                                        <div className="flex items-center gap-1" title="Modalidade">
                                                            <span className="material-icons-outlined text-[12px] text-primary">local_fire_department</span>
                                                            <span className="text-gray-400 capitalize">{event.modality}</span>
                                                        </div>
                                                    )}
                                                    {event.stack && (
                                                        <div className="flex items-center gap-1" title="Stack Inicial">
                                                            <span className="material-icons-outlined text-[12px] text-primary">layers</span>
                                                            <span className="text-gray-400">{event.stack}</span>
                                                        </div>
                                                    )}
                                                    {event.blinds && (
                                                        <div className="flex items-center gap-1" title="Blinds">
                                                            <span className="material-icons-outlined text-[12px] text-primary">timer</span>
                                                            <span className="text-gray-400">{event.blinds}</span>
                                                        </div>
                                                    )}
                                                    {event.lateReg && (
                                                        <div className="flex items-center gap-1" title="Registro Tardio">
                                                            <span className="material-icons-outlined text-[12px] text-primary">history_toggle_off</span>
                                                            <span className="text-gray-400">{event.lateReg}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {event.includedRankings && event.includedRankings.length > 0 && (
                                                <div className="flex items-center gap-1" title="Tipo de Ranking">
                                                    <span className="material-icons-outlined text-[12px] text-primary">leaderboard</span>
                                                    <span className="text-gray-400 capitalize">{event.rankingType === 'special' ? 'Especial' : event.rankingType === 'monthly' ? 'Mensal' : 'Semanal'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Produtos Paralelos */}
                                        {event.parallelProducts && event.parallelProducts.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {event.parallelProducts.map(prodId => {
                                                    const prod = PARALLEL_PRODUCTS.find(p => p.id === prodId);
                                                    if (!prod) return null;
                                                    return (
                                                        <span key={prodId} className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded tracking-wider border ${prod.style}`}>
                                                            {prod.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="flex flex-col items-end gap-2 mt-4 md:mt-0 ml-auto w-full md:w-auto">
                                        <div className="flex gap-2">
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Se for fechado, abre modal de resultados. Se aberto, editor de estrutura.
                                                            if (event.status === 'closed') {
                                                                handleOpenClosing(event);
                                                            } else {
                                                                setEditingEvent(event);
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
                                                        title={event.status === 'closed' ? "Editar Resultados" : "Editar Evento"}
                                                    >
                                                        <span className="material-icons-outlined">edit_calendar</span>
                                                    </button>

                                                    {/* Logic change: Only show duplicate/delete if event is NOT closed */}
                                                    {event.status !== 'closed' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDuplicateEvent(event); }}
                                                                className="p-2 text-gray-400 hover:text-blue-400 transition-colors bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
                                                                title="Duplicar Evento"
                                                            >
                                                                <span className="material-icons-outlined">content_copy</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
                                                                title="Excluir Evento"
                                                            >
                                                                <span className="material-icons-outlined">delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (event.status === 'closed') {
                                                        setViewClosedEvent(event);
                                                    } else {
                                                        setViewEvent(event);
                                                    }
                                                }}
                                                className="px-6 py-2 rounded-full font-bold text-base transition-all bg-primary text-white hover:bg-primary/90 hover:shadow-neon-pink flex items-center gap-2 w-full md:w-auto justify-center"
                                            >
                                                VER DETALHES <span className="material-icons-outlined text-lg">visibility</span>
                                            </button>
                                        </div>

                                        {/* Botão de Reservar (Para todos os usuários em eventos abertos) */}
                                        {event.status !== 'closed' && event.gameMode === 'tournament' && event.type !== 'online' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReserveSeat(event); }}
                                                className="px-6 py-2 w-full mt-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-600 hover:text-white flex items-center gap-2 md:w-auto justify-center"
                                            >
                                                <span className="material-icons-outlined text-sm">event_seat</span>
                                                Reservar Assento
                                            </button>
                                        )}

                                        {/* BOTÃO DE ENCERRAR EVENTO (ADMIN ONLY - Só se não estiver fechado) */}
                                        {isAdmin && event.status !== 'closed' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenClosing(event); }}
                                                className="px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white flex items-center gap-2 w-full md:w-auto justify-center"
                                            >
                                                <span className="material-icons-outlined text-sm">lock_clock</span>
                                                Encerrar Evento
                                            </button>
                                        )}
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* FLYER MODAL - Full Height (OPEN EVENTS) */}
            {viewEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
                    {/* Main Container - Adjusted to fit screen height with 20px margins */}
                    <div
                        className="relative h-[calc(100vh-40px)] aspect-[3/4] bg-[#050214] border border-primary/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(217,0,255,0.15)] flex flex-col"
                        style={{ maxHeight: 'calc(100vh - 40px)' }}
                    >
                        {/* Background Glows */}
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[30%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                        {/* Close Button */}
                        <button onClick={() => setViewEvent(null)} className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-black/40 text-white hover:text-red-500 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm border border-white/5">
                            <span className="material-icons-outlined text-lg">close</span>
                        </button>

                        {/* --- FLYER CONTENT --- */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* 1. Header Section */}
                                <div className="pt-6 pb-2 px-6 text-center shrink-0 flex flex-col items-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-3 shadow-lg">
                                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${viewEvent.gameMode === 'cash_game' ? 'text-yellow-400' : 'text-secondary'}`}>{viewEvent.gameMode === 'cash_game' ? 'CASH GAME' : 'TORNEIO'}</span>
                                        <span className="text-gray-600 text-xs">|</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-secondary">{viewEvent.type === 'live' ? 'AO VIVO' : 'ONLINE'}</span>
                                        <span className="text-gray-600 text-xs">|</span>
                                        <span className="text-xs font-bold text-gray-300 tracking-wider">{(viewEvent.date || '').split('-').reverse().join('/')}</span>
                                        <span className="text-gray-600 text-xs">•</span>
                                        <span className="text-xs font-bold text-gray-300 tracking-wider">{viewEvent.time}</span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase leading-[0.9] text-glow mb-4 drop-shadow-2xl">
                                        {viewEvent.title}
                                    </h2>
                                    {viewEvent.description && (
                                        <div className="mb-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm max-w-[90%]">
                                            <p className="text-[11px] sm:text-xs text-gray-300 italic leading-relaxed">
                                                "{viewEvent.description}"
                                            </p>
                                        </div>
                                    )}
                                    {viewEvent.gameMode !== 'cash_game' && !viewEvent.isFinalDay && (
                                        <div className="flex justify-center items-center gap-6 w-full">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Buy-in</span>
                                                <div className="flex items-center gap-1 font-display">
                                                    <span className="text-xl sm:text-3xl font-black text-primary drop-shadow-[0_0_15px_rgba(217,0,255,0.4)] leading-none">{viewEvent.buyin}</span>
                                                    {viewEvent.staffBonusValue && viewEvent.staffBonusValue !== '0' && (
                                                        <span className="text-xl sm:text-3xl font-black text-yellow-500 leading-none">
                                                            + {viewEvent.staffBonusValue}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-0.5">Garantido</span>
                                                <span className="text-xl sm:text-3xl font-display font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] leading-tight">{viewEvent.guaranteed}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Body Section */}
                                <div className="flex-1 flex flex-col px-6 pb-4 overflow-hidden gap-4">
                                    {!viewEvent.isFinalDay && (
                                        <div className={`grid ${viewEvent.gameMode === 'cash_game' ? 'grid-cols-3' : (viewEvent.modality ? 'grid-cols-4' : 'grid-cols-3')} bg-white/[0.03] rounded-xl border border-white/5 divide-x divide-white/5 p-2 md:p-3 shrink-0`}>
                                            {viewEvent.gameMode === 'cash_game' ? (
                                                <>
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Modalidade</span>
                                                        <span className="text-xs font-bold text-white text-center">{viewEvent.cashGameType === 'omaha4' ? 'Omaha 4' : viewEvent.cashGameType === 'omaha5' ? 'Omaha 5' : 'Texas'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 text-center">Blinds</span>
                                                        <span className="text-xs font-bold text-white text-center">{viewEvent.cashGameBlinds || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 text-center">Lugares</span>
                                                        <span className="text-xs font-bold text-white text-center">{viewEvent.cashGameCapacity || '-'}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {viewEvent.modality && (
                                                        <div className="flex flex-col items-center justify-center p-1">
                                                            <span className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 text-center truncate w-full px-1" title={viewEvent.modality}>Mod.</span>
                                                            <span className="text-xs md:text-sm font-bold text-white uppercase text-center truncate w-full px-1">{viewEvent.modality}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Stack</span>
                                                        <span className="text-sm font-bold text-white">{viewEvent.stack || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Blinds</span>
                                                        <span className="text-sm font-bold text-white">{viewEvent.blinds || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center p-1">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Late Reg</span>
                                                        <span className="text-sm font-bold text-white">{viewEvent.lateReg || '-'}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 min-h-0 h-full">
                                        {!viewEvent.isFinalDay && (
                                            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                                                {viewEvent.gameMode === 'cash_game' ? (
                                                    <>
                                                        {renderStructureRow("Mínimo / Máximo", viewEvent.cashGameMinMax, undefined, "text-yellow-400", "payments")}
                                                        {viewEvent.cashGameDinner && renderStructureRow("Jantar Cortesia", "Incluso", "Cortesia da Casa", "text-green-400", "restaurant")}
                                                        {viewEvent.cashGameOpenBar && renderStructureRow("Open Bar", "Incluso", "Cortesia da Casa", "text-local_bar", "local_bar")}
                                                        {viewEvent.parallelProducts?.includes('jackpot') && renderStructureRow("Jackpot", "Ativo", "Participe", "text-secondary", "trending_up")}
                                                        {viewEvent.cashGameNotes && (
                                                            <div className="bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Regras / Observações</span>
                                                                <p className="text-xs text-gray-400 leading-relaxed italic">"{viewEvent.cashGameNotes}"</p>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {renderStructureRow("Rebuy", viewEvent.rebuyValue, viewEvent.rebuyChips, "text-primary", "add_circle_outline")}
                                                        {renderStructureRow("Rebuy Duplo", viewEvent.doubleRebuyValue, viewEvent.doubleRebuyChips, "text-primary", "control_point_duplicate")}
                                                        {renderStructureRow("Add-on", viewEvent.addonValue, viewEvent.addonChips, "text-secondary", "shopping_basket")}
                                                        {renderStructureRow("Add-on Duplo", viewEvent.doubleAddonValue, viewEvent.doubleAddonChips, "text-secondary", "auto_awesome_motion")}
                                                        {/* Staff Bonus moved to buy-in row */}
                                                        {renderStructureRow("Time Chip", viewEvent.timeChipValue, viewEvent.timeChipChips, "text-green-500", "schedule")}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {viewEvent.isFinalDay && (() => {
                                            const startingDays = events.filter(e => e.finalEventId === viewEvent.id && e.isStartingDay && e.status === 'closed');
                                            const qualifierMap = new Map<string, PlayerResult>();

                                            startingDays.forEach(sd => {
                                                if (sd.results) {
                                                    sd.results.forEach(pr => {
                                                        if (pr.qualifierChips && pr.qualifierChips > 0) {
                                                            const key = pr.userId || pr.name.toLowerCase().trim();
                                                            if (qualifierMap.has(key)) {
                                                                const existing = qualifierMap.get(key)!;
                                                                if (viewEvent.stackAggregation === 'sum') {
                                                                    existing.qualifierChips = (existing.qualifierChips || 0) + pr.qualifierChips;
                                                                } else {
                                                                    existing.qualifierChips = Math.max(existing.qualifierChips || 0, pr.qualifierChips);
                                                                }
                                                            } else {
                                                                qualifierMap.set(key, { ...pr, id: Date.now().toString() + Math.random() });
                                                            }
                                                        }
                                                    });
                                                }
                                            });

                                            const qualifiedPlayers = Array.from(qualifierMap.values()).sort((a, b) => (b.qualifierChips || 0) - (a.qualifierChips || 0));

                                            return (
                                                <div className="mt-2 flex flex-col flex-1 overflow-hidden">
                                                    <div className="text-[10px] uppercase font-bold text-secondary mb-2 border-b border-secondary/20 pb-1 flex items-center gap-1">
                                                        <span className="material-icons-outlined text-xs">emoji_events</span>
                                                        Classificados para a Final
                                                        {qualifiedPlayers.length > 0 && <span className="ml-auto text-gray-500 normal-case font-normal">({qualifiedPlayers.length} jogadores)</span>}
                                                    </div>
                                                    {qualifiedPlayers.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center flex-1 py-6 text-center text-gray-600">
                                                            <span className="material-icons-outlined text-3xl mb-2 opacity-30">hourglass_empty</span>
                                                            <p className="text-xs">Aguardando encerramento dos dias classificatórios...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                                            {qualifiedPlayers.map((p, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => onSelectPlayerByName?.(p.name)}
                                                                    className="flex justify-between items-center text-xs text-gray-300 py-1.5 border-b border-white/5 px-2 bg-white/5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                                                                >
                                                                    <span className="truncate flex-1">
                                                                        <span className={`font-bold mr-2 w-5 inline-block ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-600' : 'text-gray-500'}`}>{idx + 1}º</span>
                                                                        {p.name}
                                                                    </span>
                                                                    <span className="font-bold text-secondary ml-2 shrink-0">{formatChips(p.qualifierChips?.toString() || '0')} fichas</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges/Rankings - Shown based on includedRankings mapped to actual rankings data */}
                        {(() => {
                            const validRankings = (viewEvent.includedRankings || [])
                                .map(id => rankings.find(r => r.id === id))
                                .filter((r): r is RankingInstance => !!r);

                            if (validRankings.length === 0) return null;

                            return (
                                <div className="flex flex-col items-center shrink-0 pt-2 px-6 mb-3 relative z-10">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {validRankings.map(rank => (
                                            <span key={rank.id} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase rounded-full tracking-wider backdrop-blur-sm">
                                                {rank.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}


                        {/* 3. Footer */}
                        <div className="bg-[#050821] px-6 py-4 border-t border-white/5 flex justify-between items-center shrink-0 relative z-20">
                            <div className="flex items-center h-8">
                                <img src="/cr-logo.png" alt="Chip Race" className="h-full w-auto" />
                            </div>
                            <div className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                                Organização Oficial
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CLOSED EVENT DETAILS MODAL (RESULTADOS) - REDESIGNED 3:4 FLYER STYLE */}
            {
                viewClosedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
                        <div
                            className="relative h-[calc(100vh-20px)] aspect-[3/4] bg-[#050214] border border-secondary/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,224,255,0.15)] flex flex-col"
                            style={{ maxHeight: 'calc(100vh - 20px)' }}
                        >
                            {/* Background Glows */}
                            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                            {/* Close Button */}
                            <button onClick={() => setViewClosedEvent(null)} className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-black/40 text-white hover:text-red-500 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm border border-white/5">
                                <span className="material-icons-outlined text-lg">close</span>
                            </button>

                            {/* --- RESULT FLYER CONTENT --- */}

                            {/* 1. Header & Champion Section */}
                            <div className="pt-4 pb-1 px-6 text-center shrink-0 flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${viewClosedEvent.gameMode === 'cash_game' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' : 'border-secondary/30 text-secondary bg-secondary/5'}`}>
                                        {viewClosedEvent.gameMode === 'cash_game' ? 'CASH GAME' : 'TORNEIO'}
                                    </span>
                                    <span className="text-gray-700 text-[10px]">•</span>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{viewClosedEvent.date.split('-').reverse().join('/')}</div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-2 uppercase tracking-wider">{viewClosedEvent.title}</h3>
                                {viewClosedEvent.description && (
                                    <div className="mb-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm max-w-[90%] mx-auto">
                                        <p className="text-[10px] text-gray-400 italic leading-relaxed">
                                            "{viewClosedEvent.description}"
                                        </p>
                                    </div>
                                )}

                                {/* CHAMPION DISPLAY - FIXED SPACING */}
                                {(() => {
                                    let winner;
                                    let sortedResults = viewClosedEvent.results || [];
                                    if (viewClosedEvent.isStartingDay) {
                                        sortedResults = [...sortedResults].sort((a, b) => (b.qualifierChips || 0) - (a.qualifierChips || 0));
                                        winner = sortedResults[0];
                                    } else {
                                        winner = sortedResults.find(r => r.position === 1);
                                    }

                                    return winner ? (
                                        <div className="flex flex-col items-center mb-2">
                                            {/* Image Container */}
                                            <div className="relative mb-4">
                                                <div className="absolute -inset-4 bg-gradient-to-t from-secondary/20 to-transparent rounded-full blur-xl"></div>
                                                <img
                                                    src={getPlayerAvatar(winner.name, winner.userId)}
                                                    alt={viewClosedEvent.isStartingDay ? "Chip Leader" : "Campeão"}
                                                    className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] object-cover relative z-10"
                                                />
                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-black text-[9px] px-3 py-0.5 rounded-full shadow-lg z-20 border-2 border-black">
                                                    {viewClosedEvent.isStartingDay ? 'CHIP LEADER' : 'CAMPEÃO'}
                                                </div>
                                            </div>

                                            {/* Name and Prize - Separated with margin */}
                                            <div className="text-center mt-1">
                                                <h2
                                                    onClick={() => onSelectPlayerByName?.(winner.userId ? getPlayerName(winner.userId, winner.name) : winner.name)}
                                                    className="text-2xl sm:text-3xl font-display font-black text-white leading-tight cursor-pointer hover:text-primary transition-colors"
                                                >
                                                    {getPlayerName(winner.userId, winner.name)}
                                                </h2>
                                                {viewClosedEvent.isStartingDay ? (
                                                    <div className="text-lg sm:text-xl font-bold text-secondary mt-1">
                                                        {formatChips(winner.qualifierChips?.toString() || '0')} FICHAS
                                                    </div>
                                                ) : (
                                                    <>
                                                        {winner.prize > 0 && (
                                                            <div className="text-lg sm:text-xl font-bold text-green-400 mt-1">
                                                                R$ {winner.prize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                        {/* POINTS ADDED HERE - Conditional */}
                                                        {viewClosedEvent.includedRankings && viewClosedEvent.includedRankings.length > 0 && (() => {
                                                            const mainRankingId = viewClosedEvent.includedRankings[0];
                                                            const savedPts = winner.pointsPerRanking?.[mainRankingId] ?? winner.calculatedPoints;
                                                            return (
                                                                <div className="text-lg font-display font-bold text-secondary mt-1 bg-secondary/10 px-3 py-0.5 rounded-full inline-block border border-secondary/30">
                                                                    {savedPts} PTS
                                                                </div>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-gray-500">Resultado não lançado.</div>
                                    );
                                })()}
                            </div>

                            {/* 2. Stats Grid */}
                            <div className="px-6 mb-4 shrink-0">
                                <div className="grid grid-cols-2 sm:grid-cols-4 bg-white/[0.03] rounded-xl border border-white/5 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-white/5 p-3">
                                    <div className="flex flex-col items-center justify-center p-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Jogadores</span>
                                        <span className="text-sm font-bold text-white">{viewClosedEvent.results?.length || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Rebuys</span>
                                        <span className="text-sm font-bold text-white">{viewClosedEvent.totalRebuys || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Add-ons</span>
                                        <span className="text-sm font-bold text-white">{viewClosedEvent.totalAddons || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1">
                                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Premiação Total</span>
                                        <span className="text-[10px] font-bold text-green-400 break-all text-center leading-tight">
                                            {viewClosedEvent.totalPrize ? `R$${viewClosedEvent.totalPrize.toLocaleString('pt-BR', { notation: 'compact' })}` : 'R$ 0'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Results List (Scrollable) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                    <table className="w-full text-left text-xs md:text-sm">
                                        <thead className="bg-white/5 text-gray-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th className="px-4 py-3 text-center w-10">#</th>
                                                <th className="px-4 py-3">Jogador</th>
                                                {viewClosedEvent.isStartingDay ? (
                                                    <th className="px-4 py-3 text-right">Fichas</th>
                                                ) : (
                                                    <>
                                                        <th className="px-4 py-3 text-right">Prêmio</th>
                                                        {viewClosedEvent.includedRankings && viewClosedEvent.includedRankings.length > 0 && (
                                                            <th className="px-4 py-3 text-center">Pts</th>
                                                        )}
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {(() => {
                                                const sortedResults = viewClosedEvent.isStartingDay
                                                    ? [...(viewClosedEvent.results || [])].sort((a, b) => (b.qualifierChips || 0) - (a.qualifierChips || 0))
                                                    : [...(viewClosedEvent.results || [])].sort((a, b) => a.position - b.position);

                                                return sortedResults
                                                    .filter((r, idx) => viewClosedEvent.isStartingDay ? idx > 0 : r.position > 1)
                                                    .map((result, idx) => {
                                                        const displayPosition = viewClosedEvent.isStartingDay ? idx + 2 : result.position;
                                                        return (
                                                            <tr key={result.id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={`inline-block w-6 h-6 leading-6 rounded-full font-bold text-[10px] ${displayPosition === 2 ? 'bg-gray-400 text-black' :
                                                                        displayPosition === 3 ? 'bg-orange-700 text-white' :
                                                                            'bg-white/5 text-gray-500'
                                                                        }`}>
                                                                        {displayPosition}º
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    onClick={() => onSelectPlayerByName?.(result.userId ? getPlayerName(result.userId, result.name) : result.name)}
                                                                    className="px-4 py-3 font-bold text-gray-300 truncate max-w-[120px] cursor-pointer hover:text-white transition-colors"
                                                                >
                                                                    {getPlayerName(result.userId, result.name)}
                                                                </td>
                                                                {viewClosedEvent.isStartingDay ? (
                                                                    <td className="px-4 py-3 text-right text-secondary font-bold">
                                                                        {formatChips(result.qualifierChips?.toString() || '0')}
                                                                    </td>
                                                                ) : (
                                                                    <>
                                                                        <td className="px-4 py-3 text-right text-green-500 font-bold">
                                                                            {result.prize > 0 ? `R$ ${result.prize.toLocaleString('pt-BR')}` : '-'}
                                                                        </td>
                                                                        {viewClosedEvent.includedRankings && viewClosedEvent.includedRankings.length > 0 && (() => {
                                                                            const mainRankingId = viewClosedEvent.includedRankings![0];
                                                                            const savedPts = result.pointsPerRanking?.[mainRankingId] ?? result.calculatedPoints;
                                                                            return (
                                                                                <td className="px-4 py-3 text-center font-display font-black text-secondary">
                                                                                    {savedPts}
                                                                                </td>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 4. Footer */}
                            <div className="bg-[#050821] px-6 py-3 border-t border-white/5 flex justify-between items-center shrink-0">
                                <div className="flex items-center h-6">
                                    <img src="/cr-logo.png" alt="Chip Race" className="h-full w-auto drop-shadow-md" />
                                </div>
                                <div className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                                    Resultados Oficiais
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            {/* ADMIN CLOSING/MANAGING EVENT MODAL */}
            {
                isAdmin && closingEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-float my-auto max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 flex-shrink-0">
                                <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                    <span className="material-icons-outlined text-red-500">lock_clock</span>
                                    {closingEvent.status === 'closed' ? 'Gerenciar Resultados:' : 'Encerrar:'} <span className="text-primary truncate">{closingEvent.title}</span>
                                </h3>
                                <button onClick={() => setClosingEvent(null)} className="text-gray-400 hover:text-white">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Tipo Ranking</label>
                                        <select value={formulaType} onChange={(e) => handleGlobalChange('type', e.target.value)} className="w-full bg-black border border-white/20 rounded p-2 text-white outline-none focus:border-primary">
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensal</option>
                                            <option value="special">Especial</option>
                                            <option value="cash_online">Cash Game Online</option>
                                            <option value="mtt_online">MTT Online</option>
                                            <option value="sit_n_go">Sit & Go</option>
                                            <option value="satellite">Satélite</option>
                                        </select>
                                        <div className="mt-4">
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Jogadores</label>
                                            <input type="text" inputMode="numeric" value={totalPlayers}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    handleGlobalChange('players', val);
                                                }}
                                                className="w-full bg-black/30 border border-white/20 rounded p-2 text-white" />
                                        </div>
                                        {/* REMOVED BUY-IN TOTAL INPUT AS REQUESTED */}
                                    </div>

                                    {/* NEW STATISTICS SECTION */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-widest text-secondary">Estatísticas do Torneio</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rebuys</label>
                                                <input type="text" inputMode="numeric" value={rebuysCount}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setRebuysCount(parseInt(val) || 0);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Add-ons</label>
                                                <input type="text" inputMode="numeric" value={addonsCount}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAddonsCount(parseInt(val) || 0);
                                                    }}
                                                    className="w-full bg-black/30 border border-white/20 rounded p-2 text-white text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Premiação Total (Estimada)</label>
                                                <input
                                                    type="text"
                                                    value={totalPrizeValue ? `R$ ${totalPrizeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                                                    readOnly
                                                    className="w-full bg-black/50 border border-green-500/30 rounded p-2 text-green-400 font-bold text-lg text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={handleFinishClosing} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-500 transition-colors">
                                        {closingEvent.status === 'closed' ? 'ATUALIZAR RESULTADOS' : 'ENCERRAR E SALVAR'}
                                    </button>
                                </div>

                                <div className="lg:col-span-2 flex flex-col h-[400px]">
                                    <div className="flex gap-2 mb-4 relative">
                                        <input type="text" value={newPlayerName} onChange={handleNameChange} placeholder="Nome do Jogador..." className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white outline-none" onKeyDown={(e) => e.key === 'Enter' && addPlayerResult()} />
                                        {newPlayerName && (
                                            <ul className="absolute z-50 top-10 left-0 w-full bg-surface-dark border border-white/20 rounded-lg shadow-xl overflow-hidden mt-1 max-h-60 overflow-y-auto custom-scrollbar">
                                                {/* Always show Add Ghost Option first if typing */}
                                                <li
                                                    onClick={() => {
                                                        addPlayerResult();
                                                    }}
                                                    className="px-4 py-3 bg-secondary/10 hover:bg-secondary/20 cursor-pointer text-sm font-bold border-b border-white/5 flex items-center gap-3 transition-colors text-white group"
                                                >
                                                    <span className="material-icons-outlined text-secondary group-hover:scale-110 transition-transform">person_add</span>
                                                    <span>Criar Fantasma: <span className="text-secondary">"{newPlayerName}"</span></span>
                                                </li>

                                                {/* Then show suggestions if any */}
                                                {showSuggestions && suggestions.length > 0 && suggestions.map((p, i) => (
                                                    <li
                                                        key={i}
                                                        onClick={() => selectSuggestion(p)}
                                                        className="px-4 py-2 hover:bg-white/10 text-gray-300 cursor-pointer text-sm border-b border-white/5 flex items-center gap-3 transition-colors"
                                                    >
                                                        <img src={p.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white">{p.name}</span>
                                                            <span className="text-[10px] text-gray-500">{p.city}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <button onClick={addPlayerResult} className="bg-secondary text-black px-6 rounded-lg font-bold hover:bg-secondary/80">ADD</button>
                                    </div>

                                    {/* HEADER DA TABELA DE JOGADORES NA MODAL */}
                                    {/* HEADER DA TABELA DE JOGADORES NA MODAL */}
                                    {(() => {
                                        if (closingEvent?.isStartingDay) {
                                            return (
                                                <div className="flex justify-between px-2 pb-2 text-[10px] font-bold text-gray-500 uppercase gap-2">
                                                    <span className="w-1/4">Nome Classificado</span>
                                                    <span className="w-24 text-center">Stack (Fichas)</span>
                                                    <span className="w-6"></span>
                                                </div>
                                            );
                                        }

                                        const currentSchema = scoringSchemas.find(s => s.id === closingEvent?.scoringSchemaId);
                                        const isCashLayout = formulaType === 'cash_online' || currentSchema?.criteria.some(c => c.type === 'rake' || c.type === 'profit_loss');

                                        return (
                                            <div className="flex justify-between px-2 pb-2 text-[10px] font-bold text-gray-500 uppercase gap-2">
                                                <span className="w-1/4">Nome</span>
                                                {isCashLayout ? (
                                                    <>
                                                        <span className="w-20 text-center">Rake</span>
                                                        <span className="w-20 text-center">Lucro/Perda</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-12 text-center">Pos</span>
                                                        <span className="w-20 text-right">Prêmio (R$)</span>
                                                    </>
                                                )}
                                                <span className="w-12 text-center">VIP</span>
                                                <span className="w-12 text-center">Pts</span>
                                                <span className="w-6"></span>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex-1 bg-black/20 rounded-xl border border-white/10 overflow-y-auto p-2">
                                        {playerResults.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-2 border-b border-white/5 text-sm hover:bg-white/5 gap-2">
                                                <span className="text-white w-1/4 truncate font-bold">{getPlayerName(p.userId, p.name)}</span>

                                                {(() => {
                                                    if (closingEvent?.isStartingDay) {
                                                        return (
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                placeholder="Fichas"
                                                                value={p.qualifierChips || ''}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                                                    const prs = [...playerResults];
                                                                    const idx = prs.findIndex(pr => pr.id === p.id);
                                                                    prs[idx] = { ...prs[idx], qualifierChips: val, position: 1, calculatedPoints: 0 };
                                                                    setPlayerResults(prs);
                                                                }}
                                                                className="w-24 bg-black/50 text-center font-black text-secondary rounded border border-secondary/30 outline-none px-2"
                                                            />
                                                        );
                                                    }

                                                    const currentSchema = scoringSchemas.find(s => s.id === closingEvent?.scoringSchemaId);
                                                    const isCashLayout = formulaType === 'cash_online' || currentSchema?.criteria.some(c => c.type === 'rake' || c.type === 'profit_loss');

                                                    return isCashLayout ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="Rake"
                                                                value={p.rake || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                        updatePlayerResult(p.id, 'rake', parseFloat(val) || 0);
                                                                    }
                                                                }}
                                                                className="w-20 bg-black/50 text-center text-white rounded border border-white/10"
                                                            />
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="+/-"
                                                                value={p.profitLoss || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                                                        updatePlayerResult(p.id, 'profitLoss', parseFloat(val) || 0);
                                                                    }
                                                                }}
                                                                className="w-20 bg-black/50 text-center text-white rounded border border-white/10"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={p.position}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '');
                                                                    updatePlayerResult(p.id, 'position', parseInt(val) || 0);
                                                                }}
                                                                className="w-12 bg-black/50 text-center text-white rounded border border-white/10"
                                                            />
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="0"
                                                                value={p.prize || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(',', '.');
                                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                        updatePlayerResult(p.id, 'prize', parseFloat(val) || 0);
                                                                    }
                                                                }}
                                                                className="w-20 bg-black/50 text-right text-green-400 font-bold rounded border border-white/10 px-2"
                                                            />
                                                        </>
                                                    );
                                                })()}

                                                {!closingEvent?.isStartingDay && (
                                                    <button onClick={() => updatePlayerResult(p.id, 'isVip', !p.isVip)} className={`px-2 rounded text-[10px] h-6 flex items-center justify-center shrink-0 ${p.isVip ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'}`}>VIP</button>
                                                )}

                                                {!closingEvent?.isStartingDay && (
                                                    <div className="w-12 text-center flex flex-col items-center shrink-0">
                                                        {(() => {
                                                            try {
                                                                const pointsEntries = Object.entries(p.pointsPerRanking || {});
                                                                if (pointsEntries.length > 0) {
                                                                    return pointsEntries.map(([rId, pts], i) => {
                                                                        const ranking = rankings.find(r => r.id === rId);
                                                                        const label = ranking?.label || ranking?.id || '---';
                                                                        return (
                                                                            <div key={rId} className="flex flex-col leading-tight">
                                                                                <span className="text-primary font-black">{pts}</span>
                                                                                {pointsEntries.length > 1 && (
                                                                                    <span className="text-[8px] text-gray-500 font-bold uppercase">{label}</span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    });
                                                                } else {
                                                                    return <span className="text-primary font-black">{p.calculatedPoints || 0}</span>;
                                                                }
                                                            } catch (e) {
                                                                console.error("Error rendering points for player:", p.name, e);
                                                                return <span className="text-primary font-black">--</span>;
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                                <button onClick={() => removePlayerResult(p.id)} className="text-red-500 hover:text-red-400 w-6 flex justify-end">x</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            {/* ADMIN EVENT EDITOR MODAL */}
            {
                isAdmin && editingEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-3xl p-6 shadow-2xl animate-float my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary">edit_calendar</span>
                                    {editingEvent.id && events.find(e => e.id === editingEvent.id) ? `Editar: ${editingEvent.title}` : 'Novo Evento'}
                                </h3>
                                <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-white">
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSaveEvent} className="space-y-6">

                                {/* TAB NAVIGATION DE MODALIDADE */}
                                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingEvent({ ...editingEvent, gameMode: 'tournament' })}
                                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${editingEvent.gameMode !== 'cash_game' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Torneio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingEvent({ ...editingEvent, gameMode: 'cash_game' })}
                                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${editingEvent.gameMode === 'cash_game' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Cash Game
                                    </button>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-secondary">Informações Gerais</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Título do Evento</label>
                                            <input type="text" value={editingEvent.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                                        </div>
                                        {/* NOVO: Torneio de Dias Classificatórios */}
                                        {editingEvent.gameMode === 'tournament' && (!editingEvent.id || editingEvent.id.length < 20) && (
                                            <div className="md:col-span-2 mt-2 bg-primary/10 border border-primary/30 p-4 rounded-lg mb-2">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isMultiDayForm}
                                                        onChange={(e) => setIsMultiDayForm(e.target.checked)}
                                                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-black"
                                                    />
                                                    <span className="text-white font-bold uppercase tracking-wider text-sm group-hover:text-primary transition-colors">
                                                        Torneio com Dias Classificatórios (Múltiplos Dias)
                                                    </span>
                                                </label>
                                            </div>
                                        )}

                                        {!isMultiDayForm && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Data</label>
                                                    <input type="date" value={editingEvent.date} onChange={(e) => handleInputChange('date', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Horário</label>
                                                    <input type="time" value={editingEvent.time} onChange={(e) => handleInputChange('time', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Local</label>
                                            <input type="text" value={editingEvent.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-primary outline-none" placeholder="Ex: QG Venâncio" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Status</label>
                                            <select value={editingEvent.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-primary outline-none">
                                                <option value="open" className="bg-black text-white">Aberto</option>
                                                <option value="running" className="bg-black text-white">Em Andamento</option>
                                                <option value="closed" className="bg-black text-white">Encerrado</option>
                                            </select>
                                        </div>
                                        {/* Novo Campo: Formato (Live/Online) */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Formato</label>
                                            <select value={editingEvent.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-primary outline-none">
                                                <option value="live" className="bg-black text-white">Ao Vivo (Presencial)</option>
                                                <option value="online" className="bg-black text-white">Online (App)</option>
                                            </select>
                                        </div>
                                        {editingEvent.gameMode !== 'cash_game' && (
                                            <>
                                                {/* Novo Campo: Ranking Type */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Tipo de Evento (Ranking)</label>
                                                    <select value={editingEvent.rankingType || 'weekly'} onChange={(e) => handleInputChange('rankingType', e.target.value)} className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-primary outline-none">
                                                        <option value="weekly" className="bg-black text-white">Semanal (Regular)</option>
                                                        <option value="monthly" className="bg-black text-white">Mensal (High Roller)</option>
                                                        <option value="special" className="bg-black text-white">Especial (Major)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Modalidade</label>
                                                    <input
                                                        type="text"
                                                        list="modalities-list"
                                                        value={editingEvent.modality || ''}
                                                        onChange={(e) => {
                                                            setEditingEvent({ ...editingEvent, modality: e.target.value });
                                                        }}
                                                        className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-primary outline-none"
                                                        placeholder="Ex: Turbo, KO, etc"
                                                    />
                                                    <datalist id="modalities-list">
                                                        <option value="KO" />
                                                        <option value="Bounty Progressive KO" />
                                                        <option value="Turbo" />
                                                        <option value="Hyper Turbo" />
                                                        <option value="DeepStack" />
                                                        <option value="High Roller" />
                                                    </datalist>
                                                </div>
                                            </>
                                        )}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Descrição</label>
                                            <textarea value={editingEvent.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-primary outline-none h-20"></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* NOVO: Secção de Datas do Multi-Day */}
                                {isMultiDayForm && (
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                            <h4 className="text-white font-bold text-sm uppercase tracking-widest text-primary">Dias Classificatórios</h4>
                                            <button
                                                type="button"
                                                onClick={() => setStartingDays([...startingDays, { name: `${startingDays.length + 1}A`, date: '', time: '' }])}
                                                className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                                            >
                                                + ADICIONAR DIA
                                            </button>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {startingDays.map((sd, i) => (
                                                <div key={i} className="flex gap-4 items-center bg-black/40 p-3 rounded-lg border border-white/5 flex-wrap md:flex-nowrap">
                                                    <div className="w-full md:w-1/4">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome do Dia</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: 1A"
                                                            value={sd.name}
                                                            onChange={(e) => { const newDays = [...startingDays]; newDays[i].name = e.target.value; setStartingDays(newDays); }}
                                                            className="w-full bg-black/50 text-white p-2 border border-white/10 rounded focus:border-primary outline-none"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-2/4">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data</label>
                                                        <input
                                                            type="date"
                                                            value={sd.date}
                                                            onChange={(e) => { const newDays = [...startingDays]; newDays[i].date = e.target.value; setStartingDays(newDays); }}
                                                            className="w-full bg-black/50 text-white p-2 border border-white/10 rounded focus:border-primary outline-none"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-1/4">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Horário</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="time"
                                                                value={sd.time}
                                                                onChange={(e) => { const newDays = [...startingDays]; newDays[i].time = e.target.value; setStartingDays(newDays); }}
                                                                className="w-full bg-black/50 text-white p-2 border border-white/10 rounded focus:border-primary outline-none"
                                                            />
                                                            {startingDays.length > 1 && (
                                                                <button type="button" onClick={() => setStartingDays(startingDays.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded border border-red-500/20">
                                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-secondary pt-4 border-t border-white/5">Final do Torneio</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Data da Final</label>
                                                <input type="date" value={finalDayDate} onChange={(e) => setFinalDayDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Horário da Final</label>
                                                <input type="time" value={finalDayTime} onChange={(e) => setFinalDayTime(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-secondary outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Classificação Múltipla (Mesmo Jogador)</label>
                                                <select value={stackAggregation} onChange={(e) => setStackAggregation(e.target.value as 'sum' | 'max')} className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-secondary outline-none">
                                                    <option value="max" className="bg-black text-white">Usar Maior Stack (Max)</option>
                                                    <option value="sum" className="bg-black text-white">Somar Stacks (Sum)</option>
                                                </select>
                                                <p className="text-[10px] text-gray-500 mt-2 uppercase">Decide como as fichas são agrupadas se um jogador classificar em mais de um dia inicial.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Nova Seção: Ranking Selection Box (DYNAMIC) */}
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-cyan-400">Rankings Válidos</h4>
                                    <div className="flex gap-6 flex-wrap">
                                        {rankings.map(rankOpt => (
                                            <label key={rankOpt.id} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={editingEvent.includedRankings?.includes(rankOpt.id) ?? true} // Default true for legacy compatibility
                                                    onChange={() => toggleRanking(rankOpt.id)}
                                                    className="w-4 h-4 accent-cyan-500 bg-black border-white/20 rounded"
                                                />
                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{rankOpt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">Selecione quais rankings este evento pontua.</p>
                                </div>

                                {/* Nova Seção: Produtos Paralelos */}
                                {editingEvent.gameMode !== 'cash_game' && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-blue-400">Produtos Paralelos (The Chosen)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {PARALLEL_PRODUCTS.map(prod => (
                                                <label key={prod.id} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingEvent.parallelProducts?.includes(prod.id) || false}
                                                        onChange={() => toggleParallelProduct(prod.id)}
                                                        className="w-4 h-4 accent-secondary bg-black border-white/20 rounded"
                                                    />
                                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{prod.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Seção 2: Estrutura Técnica (TORNEIO ONLY) */}
                                {editingEvent.gameMode !== 'cash_game' && (
                                    <>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-primary">Estrutura Técnica</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Buy-in</label>
                                                    <input type="text" value={editingEvent.buyin} onChange={(e) => handleInputChange('buyin', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-primary outline-none" placeholder="R$ 150" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Stack Inicial</label>
                                                    <input type="text" value={editingEvent.stack || ''} onChange={(e) => handleInputChange('stack', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-primary outline-none" placeholder="30.000" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Blinds</label>
                                                    <input type="text" value={editingEvent.blinds || ''} onChange={(e) => handleInputChange('blinds', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-primary outline-none" placeholder="20 Min" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Late Reg</label>
                                                    <input type="text" value={editingEvent.lateReg || ''} onChange={(e) => handleInputChange('lateReg', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-primary outline-none" placeholder="6º Nível" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Garantido</label>
                                                    <input type="text" value={editingEvent.guaranteed} onChange={(e) => handleInputChange('guaranteed', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-primary outline-none" placeholder="10K" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seção 3: Rebuys e Addons */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-cyan-400">Rebuys & Add-ons</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Rebuy Simples */}
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-gray-400 mb-2 font-bold">REBUY SIMPLES</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Valor (R$)" value={editingEvent.rebuyValue || ''} onChange={(e) => handleInputChange('rebuyValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.rebuyChips || ''} onChange={(e) => handleInputChange('rebuyChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>

                                                {/* Rebuy Duplo */}
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-cyan-400 mb-2 font-bold">REBUY DUPLO</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Valor (R$)" value={editingEvent.doubleRebuyValue || ''} onChange={(e) => handleInputChange('doubleRebuyValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.doubleRebuyChips || ''} onChange={(e) => handleInputChange('doubleRebuyChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>

                                                {/* Addon Simples */}
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-gray-400 mb-2 font-bold">ADD-ON SIMPLES</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Valor (R$)" value={editingEvent.addonValue || ''} onChange={(e) => handleInputChange('addonValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.addonChips || ''} onChange={(e) => handleInputChange('addonChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>

                                                {/* Addon Duplo */}
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-blue-400 mb-2 font-bold">ADD-ON DUPLO</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Valor (R$)" value={editingEvent.doubleAddonValue || ''} onChange={(e) => handleInputChange('doubleAddonValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.doubleAddonChips || ''} onChange={(e) => handleInputChange('doubleAddonChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seção 4: Extras */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-yellow-400">Extras & Bônus</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-gray-400 mb-2 font-bold">STAFF BONUS</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Custo (R$)" value={editingEvent.staffBonusValue || ''} onChange={(e) => handleInputChange('staffBonusValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.staffBonusChips || ''} onChange={(e) => handleInputChange('staffBonusChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>
                                                <div className="p-2 border border-white/5 rounded">
                                                    <div className="text-xs text-gray-400 mb-2 font-bold">TIME CHIP</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" placeholder="Condição" value={editingEvent.timeChipValue || ''} onChange={(e) => handleInputChange('timeChipValue', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                        <input type="text" placeholder="Fichas" value={editingEvent.timeChipChips || ''} onChange={(e) => handleInputChange('timeChipChips', e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-1 text-sm text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* CACHE GAME SPECIFIC FIELDS */}
                                {editingEvent.gameMode === 'cash_game' && (
                                    <>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest text-yellow-500">Detalhes do Cash Game</h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Modalidade</label>
                                                    <select value={editingEvent.cashGameType || 'texas'} onChange={(e) => setEditingEvent({ ...editingEvent, cashGameType: e.target.value as any })} className="w-full bg-black border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none">
                                                        <option value="texas">Texas Hold'em</option>
                                                        <option value="omaha4">Omaha (4 Cartas)</option>
                                                        <option value="omaha5">Omaha (5 Cartas)</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Blinds da Mesa</label>
                                                    <input type="text" value={editingEvent.cashGameBlinds || ''} onChange={(e) => setEditingEvent({ ...editingEvent, cashGameBlinds: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Ex: R$ 5 / R$ 5" />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Mínimo / Máximo (R$)</label>
                                                    <input type="text" value={editingEvent.cashGameMinMax || ''} onChange={(e) => setEditingEvent({ ...editingEvent, cashGameMinMax: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Ex: Mín R$ 100 / Máx R$ 500" />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Capacidade</label>
                                                    <input type="text" value={editingEvent.cashGameCapacity || ''} onChange={(e) => setEditingEvent({ ...editingEvent, cashGameCapacity: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Ex: 9 Lugares" />
                                                </div>

                                                <div className="md:col-span-2 pt-2 border-t border-white/5 mt-2 flex flex-col gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingEvent.cashGameDinner || false}
                                                            onChange={(e) => setEditingEvent({ ...editingEvent, cashGameDinner: e.target.checked })}
                                                            className="w-5 h-5 accent-yellow-500 bg-black border-white/20 rounded"
                                                        />
                                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Jantar Cortesia 🍽️</span>
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingEvent.cashGameOpenBar || false}
                                                            onChange={(e) => setEditingEvent({ ...editingEvent, cashGameOpenBar: e.target.checked })}
                                                            className="w-5 h-5 accent-yellow-500 bg-black border-white/20 rounded"
                                                        />
                                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Open Bar 🍻</span>
                                                    </label>
                                                </div>

                                                <div className="md:col-span-2 pt-2 border-t border-white/5 mt-2">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingEvent.parallelProducts?.includes('jackpot') || false}
                                                            onChange={() => toggleParallelProduct('jackpot')}
                                                            className="w-5 h-5 accent-yellow-500 bg-black border-white/20 rounded"
                                                        />
                                                        <span className="text-sm text-gray-300 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Participa do Jackpot 💰</span>
                                                    </label>
                                                </div>

                                                <div className="md:col-span-2 mt-2">
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Observações Importantes (Dinâmica do Game)</label>
                                                    <textarea value={editingEvent.cashGameNotes || ''} onChange={(e) => setEditingEvent({ ...editingEvent, cashGameNotes: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none h-24" placeholder="Ex: Mudança de blind de jogo após a janta, 2 omahas por volta, etc..."></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 flex justify-between gap-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setViewEvent(editingEvent)}
                                        className="px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 font-bold"
                                    >
                                        <span className="material-icons-outlined">visibility</span>
                                        Visualizar Flyer
                                    </button>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">Cancelar</button>
                                        <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-lg">Salvar Evento</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


        </div>
    );
};