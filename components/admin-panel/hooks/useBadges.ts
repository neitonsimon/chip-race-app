import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface UseBadgesProps {
    isAdmin: boolean;
    currentUser: any;
    badgeTemplates: any[];
}

export function useBadges({ isAdmin, currentUser, badgeTemplates }: UseBadgesProps) {
    const [targetType, setTargetType] = useState<'single' | 'all'>('single');
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [description, setDescription] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [usersWithSelectedBadge, setUsersWithSelectedBadge] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

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

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.order('name', { ascending: true }).limit(10);
        setSearchResults(data || []);
    };

    const handleSendBadges = async () => {
        if (!isAdmin) return;
        if (!selectedBadgeId) { alert('Selecione uma insígnia.'); return; }

        let targetUserIds: string[] = [];
        const template = badgeTemplates.find(b => b.id === selectedBadgeId);
        if (!template) return;

        if (targetType === 'all') {
            if (!window.confirm(`Tem certeza que deseja enviar a Insígnia "${template.title}" para TODOS os jogadores?`)) return;
            setIsLoading(true);
            const { data } = await supabase.from('profiles').select('id');
            if (data) targetUserIds = data.map(u => u.id);
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
        isLoading
    };
}
