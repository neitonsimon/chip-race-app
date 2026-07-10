import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useApp } from '../../../contexts/AppContext';

interface UseBadgesProps {
    isAdmin: boolean;
    currentUser: any;
    badgeTemplates: any[];
}

export function useBadges({ isAdmin, currentUser, badgeTemplates }: UseBadgesProps) {
    const { rankings, events, allProfiles } = useApp();

    const [targetType, setTargetType] = useState<'single' | 'all' | 'batch'>('single');
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [description, setDescription] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [usersWithSelectedBadge, setUsersWithSelectedBadge] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Batch send states
    const [selectedRankingId, setSelectedRankingId] = useState('');
    const [selectedCriterion, setSelectedCriterion] = useState('any_participation');
    const [batchPlayers, setBatchPlayers] = useState<{ id: string; name: string; checked: boolean; alreadyHas: boolean }[]>([]);
    const [searchQueryBatch, setSearchQueryBatch] = useState('');
    const [searchResultsBatch, setSearchResultsBatch] = useState<any[]>([]);

    useEffect(() => {
        const fetchBadgeOwners = async () => {
            if (selectedBadgeId) {
                const { data } = await supabase.from('user_badges').select('user_id').eq('badge_template_id', selectedBadgeId);
                if (data) setUsersWithSelectedBadge(new Set(data.map(d => d.user_id)));
            } else {
                setUsersWithSelectedBadge(new Set());
            }
        };
        fetchBadgeOwners();
    }, [selectedBadgeId]);

    // Match users automatically based on selected ranking and criterion
    useEffect(() => {
        if (targetType !== 'batch' || !selectedRankingId || !selectedCriterion) {
            setBatchPlayers([]);
            return;
        }

        const ranking = rankings.find(r => r.id === selectedRankingId);
        if (!ranking) {
            setBatchPlayers([]);
            return;
        }

        // Filter closed events included in this ranking
        const rankingEvents = (events || []).filter(e => 
            e.status === 'closed' && 
            (e.includedRankings || ['annual', 'quarterly', 'legacy']).includes(selectedRankingId)
        );

        const matchedUsers = new Map<string, { id: string; name: string }>();

        const addPlayerByName = (name: string, userId?: string) => {
            if (!name) return;
            const normalized = name.trim().toLowerCase();
            if (matchedUsers.has(normalized)) return;

            // Find profile in allProfiles to get the user UUID
            const profile = allProfiles.find(ap => ap.name.toLowerCase() === normalized);
            const uid = userId || profile?.id;
            if (uid) {
                matchedUsers.set(normalized, { id: uid, name: name.trim() });
            }
        };

        switch (selectedCriterion) {
            case 'any_participation':
                rankingEvents.forEach(e => {
                    (e.results || []).forEach(r => addPlayerByName(r.name, r.userId));
                });
                break;

            case 'any_podium':
                rankingEvents.forEach(e => {
                    (e.results || []).forEach(r => {
                        if (r.position && r.position <= 3) {
                            addPlayerByName(r.name, r.userId);
                        }
                    });
                });
                break;

            case 'ranking_final_table':
                // overall top 9 players in the ranking
                const topPlayers = (ranking.players || []).slice(0, 9);
                topPlayers.forEach(p => {
                    if (p.id) addPlayerByName(p.name, p.id);
                });
                break;

            case 'any_final_table':
                rankingEvents.forEach(e => {
                    (e.results || []).forEach(r => {
                        if (r.position && r.position <= 9) {
                            addPlayerByName(r.name, r.userId);
                        }
                    });
                });
                break;

            case 'main_event_qualified':
                rankingEvents.forEach(e => {
                    const isMainEvent = e.isMultiDay || e.title.toLowerCase().includes('principal') || e.title.toLowerCase().includes('main event');
                    if (isMainEvent && e.isStartingDay) {
                        (e.results || []).forEach(r => {
                            if (r.qualifierChips && r.qualifierChips > 0) {
                                addPlayerByName(r.name, r.userId);
                            }
                        });
                    }
                });
                break;

            case 'main_event_participation':
                rankingEvents.forEach(e => {
                    const isMainEvent = e.isMultiDay || e.title.toLowerCase().includes('principal') || e.title.toLowerCase().includes('main event');
                    if (isMainEvent) {
                        (e.results || []).forEach(r => addPlayerByName(r.name, r.userId));
                    }
                });
                break;

            case 'any_stage_winner':
                rankingEvents.forEach(e => {
                    (e.results || []).forEach(r => {
                        if (r.position === 1) {
                            addPlayerByName(r.name, r.userId);
                        }
                    });
                });
                break;

            case 'ranking_final_table_winner':
                const finalEvent = rankingEvents.find(e => 
                    e.title.toLowerCase().includes('mesa final') || e.isFinalDay === true
                );
                if (finalEvent) {
                    (finalEvent.results || []).forEach(r => {
                        if (r.position === 1) {
                            addPlayerByName(r.name, r.userId);
                        }
                    });
                }
                break;

            case 'ranking_winner':
                const winner = (ranking.players || [])[0];
                if (winner && winner.id) {
                    addPlayerByName(winner.name, winner.id);
                }
                break;

            default:
                break;
        }

        // Map matched users to batchPlayers with their medal status
        const list = Array.from(matchedUsers.values()).map(u => {
            const alreadyHas = usersWithSelectedBadge.has(u.id);
            return {
                id: u.id,
                name: u.name,
                checked: !alreadyHas,
                alreadyHas
            };
        });

        setBatchPlayers(list.sort((a, b) => a.name.localeCompare(b.name)));
    }, [targetType, selectedRankingId, selectedCriterion, usersWithSelectedBadge, rankings, events, allProfiles]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.order('name', { ascending: true }).limit(10);
        setSearchResults(data || []);
    };

    const handleSearchBatchUser = async (query: string) => {
        setSearchQueryBatch(query);
        if (query.length < 2) { setSearchResultsBatch([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.order('name', { ascending: true }).limit(10);
        setSearchResultsBatch(data || []);
    };

    const handleAddToBatch = (user: any) => {
        if (!user) return;
        if (batchPlayers.some(bp => bp.id === user.id)) {
            alert('Este jogador já está na lista.');
            return;
        }
        const alreadyHas = usersWithSelectedBadge.has(user.id);
        setBatchPlayers(prev => [
            ...prev,
            { id: user.id, name: user.name, checked: !alreadyHas, alreadyHas }
        ].sort((a, b) => a.name.localeCompare(b.name)));
        setSearchQueryBatch('');
        setSearchResultsBatch([]);
    };

    const handleToggleBatchPlayer = (index: number) => {
        setBatchPlayers(prev => {
            const copy = [...prev];
            if (copy[index] && !copy[index].alreadyHas) {
                copy[index] = { ...copy[index], checked: !copy[index].checked };
            }
            return copy;
        });
    };

    const handleSendBadges = async () => {
        if (!isAdmin) return;
        if (!selectedBadgeId) { alert('Selecione uma insígnia.'); return; }

        let targetUserIds: string[] = [];
        const template = badgeTemplates.find(b => b.id === selectedBadgeId);
        if (!template) return;

        if (template.is_archived) {
            alert('🚫 Esta medalha está arquivada e não pode mais ser distribuída.');
            return;
        }

        if (targetType === 'all') {
            if (!window.confirm(`Tem certeza que deseja enviar a Insígnia "${template.title}" para TODOS os jogadores?`)) return;
            setIsLoading(true);
            const { data } = await supabase.from('profiles').select('id');
            if (data) targetUserIds = data.map(u => u.id);
        } else if (targetType === 'batch') {
            const selectedChecked = batchPlayers.filter(p => p.checked && !p.alreadyHas);
            if (selectedChecked.length === 0) {
                alert('Selecione pelo menos um usuário qualificado para receber a medalha.');
                return;
            }
            if (!window.confirm(`Tem certeza que deseja enviar a Insígnia "${template.title}" para os ${selectedChecked.length} jogadores selecionados?`)) return;
            targetUserIds = selectedChecked.map(p => p.id);
        } else {
            if (selectedUsers.length === 0) { alert('Selecione pelo menos um usuário.'); return; }
            targetUserIds = selectedUsers.map(u => u.id);
        }

        if (targetUserIds.length === 0) { alert('Nenhum usuário encontrado.'); setIsLoading(false); return; }

        setIsLoading(true);
        try {
            // DUPLICATE BADGE PROTECTION
            const { data: duplicates } = await supabase.from('user_badges')
                .select('user_id, profiles(name)')
                .in('user_id', targetUserIds)
                .eq('badge_template_id', template.id);

            if (duplicates && duplicates.length > 0) {
                const names = (duplicates as any[]).map(d => d.profiles?.name || 'Jogador').join(', ');
                if (targetType !== 'all') {
                    alert(`🚫 BLOQUEADO: Os seguintes jogadores já possuem a insígnia "${template.title}":\n\n${names}\n\nO sistema não permite o envio repetido da mesma honraria para o mesmo jogador.`);
                    setIsLoading(false);
                    return;
                } else {
                    if (!window.confirm(`Aviso: ${duplicates.length} jogadores já possuem a insígnia "${template.title}" e serão ignorados nesta operação. Deseja prosseguir com os demais ${targetUserIds.length - duplicates.length}?`)) {
                        setIsLoading(false);
                        return;
                    }
                    const duplicateIds = duplicates.map(d => d.user_id);
                    targetUserIds = targetUserIds.filter(id => !duplicateIds.includes(id));
                }
            }

            if (targetUserIds.length === 0) {
                alert('Nenhum usuário apto a receber esta recompensa no momento.');
                setIsLoading(false);
                return;
            }

            const finalDescription = description.trim() || `Atribuição de Admin: Insígnia: ${template.title}`;

            // Chunks for mass sending
            const chunks = [];
            for (let i = 0; i < targetUserIds.length; i += 20) {
                chunks.push(targetUserIds.slice(i, i + 20));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(async (uid) => {
                    await supabase.from('user_badges').insert({
                        user_id: uid,
                        title: template.title,
                        description: finalDescription || template.description,
                        icon: template.icon || 'stars',
                        color: template.color || '#00E5FF',
                        badge_template_id: template.id
                    });

                    await supabase.from('messages').insert({
                        user_id: uid,
                        sender: 'Admin',
                        sender_id: currentUser.id,
                        subject: '🎖️ Você recebeu uma medalha!',
                        content: `${finalDescription}.`,
                        category: 'gift',
                        is_read: false
                    });

                    // Log de auditoria
                    await supabase.from('audit_logs').insert({
                        admin_id: currentUser.id,
                        action_type: 'SEND_BADGE',
                        description: `Admin concedeu uma medalha em lote: ${template.title}`,
                        target_user_id: uid,
                        details: { badge_id: template.id }
                    });
                }));
            }

            alert(`✅ Medalhas enviadas com sucesso para ${targetUserIds.length} usuários!`);
            setDescription('');
            setSelectedBadgeId('');
            setSelectedUsers([]);
            setBatchPlayers([]);
            setSelectedRankingId('');
        } catch (err: any) {
            alert('Erro ao enviar medalhas: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        targetType, setTargetType,
        selectedUsers, setSelectedUsers,
        searchQuery, setSearchQuery,
        description, setDescription,
        selectedBadgeId, setSelectedBadgeId,
        searchResults, setSearchResults,
        usersWithSelectedBadge,
        handleSearch,
        handleSendBadges,
        isLoading,

        // Batch properties
        selectedRankingId, setSelectedRankingId,
        selectedCriterion, setSelectedCriterion,
        batchPlayers, setBatchPlayers,
        searchQueryBatch, setSearchQueryBatch,
        searchResultsBatch, setSearchResultsBatch,
        handleSearchBatchUser,
        handleAddToBatch,
        handleToggleBatchPlayer
    };
}
