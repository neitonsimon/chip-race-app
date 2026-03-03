import { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface UseGiftsProps {
    isAdmin: boolean;
    currentUser: any;
    badgeTemplates: any[];
    updatePlayerBalanceLocally: (userId: string, amount: number, type: 'brl' | 'chipz') => void;
}

export function useGifts({ isAdmin, currentUser, badgeTemplates, updatePlayerBalanceLocally }: UseGiftsProps) {
    const [giftTarget, setGiftTarget] = useState<'single' | 'all'>('single');
    const [selectedGiftUsers, setSelectedGiftUsers] = useState<any[]>([]);
    const [giftType, setGiftType] = useState<'brl' | 'chipz' | 'badge'>('brl');
    const [giftAmount, setGiftAmount] = useState('');
    const [giftSearchQuery, setGiftSearchQuery] = useState('');
    const [giftDescription, setGiftDescription] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState('');
    const [giftSearchResults, setGiftSearchResults] = useState<any[]>([]);
    const [usersWithSelectedBadge, setUsersWithSelectedBadge] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchBadgeOwners = async () => {
            if (giftType === 'badge' && selectedBadgeId) {
                const { data } = await supabase.from('user_badges').select('user_id').eq('badge_template_id', selectedBadgeId);
                if (data) setUsersWithSelectedBadge(new Set(data.map(d => d.user_id)));
            } else {
                setUsersWithSelectedBadge(new Set());
            }
        };
        fetchBadgeOwners();
    }, [giftType, selectedBadgeId]);

    const handleGiftSearch = async (query: string) => {
        setGiftSearchQuery(query);
        if (query.length < 2) { setGiftSearchResults([]); return; }
        const isNumeric = /^\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status, balance_brl, balance_chipz, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(10);
        setGiftSearchResults(data || []);
    };

    const handleSendGifts = async () => {
        if (!isAdmin) return;
        const amount = giftType === 'badge' ? 0 : parseFloat(giftAmount);

        if (giftType !== 'badge' && (!amount || amount <= 0)) { alert('Valor inválido.'); return; }
        if (giftType === 'badge' && !selectedBadgeId) { alert('Selecione uma insígnia.'); return; }

        let targetUserIds: string[] = [];

        if (giftTarget === 'all') {
            const label = giftType === 'brl' ? 'R$' : giftType === 'chipz' ? 'Chipz' : 'a Insígnia';
            const val = giftType === 'badge' ? badgeTemplates.find(b => b.id === selectedBadgeId)?.title : amount;
            if (!window.confirm(`Tem certeza que deseja enviar ${label} ${val} para TODOS os jogadores?`)) return;
            setIsLoading(true);
            const { data } = await supabase.from('profiles').select('id');
            if (data) targetUserIds = data.map(u => u.id);
        } else {
            if (selectedGiftUsers.length === 0) { alert('Selecione pelo menos um usuário.'); return; }
            targetUserIds = selectedGiftUsers.map(u => u.id);
        }

        if (targetUserIds.length === 0) { alert('Nenhum usuário encontrado.'); setIsLoading(false); return; }

        setIsLoading(true);
        try {
            // DUPLICATE BADGE PROTECTION
            if (giftType === 'badge') {
                const template = badgeTemplates.find(b => b.id === selectedBadgeId);
                if (template) {
                    const { data: duplicates } = await supabase.from('user_badges')
                        .select('user_id, profiles!user_id(name)')
                        .in('user_id', targetUserIds)
                        .eq('badge_template_id', template.id);

                    if (duplicates && duplicates.length > 0) {
                        const names = (duplicates as any[]).map(d => d.profiles?.name || 'Jogador').join(', ');
                        if (giftTarget !== 'all') {
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
                }
            }

            if (targetUserIds.length === 0) {
                alert('Nenhum usuário apto a receber esta recompensa no momento.');
                setIsLoading(false);
                return;
            }

            const finalAmount = giftType === 'chipz' ? Math.floor(amount) : amount;
            const logMsg = giftType === 'brl' ? `R$ ${finalAmount.toFixed(2)}` : giftType === 'chipz' ? `${finalAmount} Chipz` : `Insígnia: ${badgeTemplates.find(b => b.id === selectedBadgeId)?.title}`;
            const finalDescription = giftDescription.trim() || `Atribuição de Admin: ${logMsg}`;

            // Chunks for mass sending
            const chunks = [];
            for (let i = 0; i < targetUserIds.length; i += 20) {
                chunks.push(targetUserIds.slice(i, i + 20));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(async (uid) => {
                    if (giftType === 'badge') {
                        const template = badgeTemplates.find(b => b.id === selectedBadgeId);
                        if (template) {
                            await supabase.from('user_badges').insert({
                                user_id: uid,
                                title: template.title,
                                description: finalDescription || template.description,
                                icon: template.icon || 'stars',
                                color: template.color || '#00E5FF',
                                badge_template_id: template.id
                            });
                        }
                    } else {
                        // Use secure_balance_transaction for logging and safety
                        await supabase.rpc('secure_balance_transaction', {
                            p_user_id: uid,
                            p_brl_amount: giftType === 'brl' ? finalAmount : 0,
                            p_chipz_amount: giftType === 'chipz' ? finalAmount : 0,
                            p_description: finalDescription,
                            p_category: 'gift',
                            p_metadata: { admin_id: currentUser.id }
                        });
                        updatePlayerBalanceLocally(uid, finalAmount, giftType);

                        // Recompensa Padronizada: 1 EXP a cada R$ 50 (Prêmios em dinheiro contam como recarga)
                        if (giftType === 'brl') {
                            const expBonus = Math.floor(finalAmount / 50);
                            if (expBonus > 0) {
                                const { data: profData } = await supabase.from('profiles').select('current_exp').eq('id', uid).single();
                                await supabase.from('profiles').update({ current_exp: (Number(profData?.current_exp) || 0) + expBonus }).eq('id', uid);
                            }
                        }
                    }

                    await supabase.from('messages').insert({
                        user_id: uid,
                        sender: 'Admin',
                        sender_id: currentUser.id,
                        subject: giftType === 'badge' ? '🎖️ Você recebeu uma medalha!' : '🎁 Você recebeu um Presente!',
                        content: `${finalDescription}. ${giftType !== 'badge' ? 'O saldo já foi atualizado e está disponível para uso.' : ''}`,
                        category: 'gift',
                        is_read: false
                    });

                    // Log de auditoria para presentes/badges
                    await supabase.from('audit_logs').insert({
                        admin_id: currentUser.id,
                        action_type: 'SEND_GIFT_OR_BADGE',
                        description: `Admin concedeu um presente/medalha em lote: ${logMsg}`,
                        target_user_id: uid,
                        details: { gift_type: giftType, amount: finalAmount, badge_id: selectedBadgeId }
                    });
                }));
            }

            alert(`✅ Prêmios enviados com sucesso para ${targetUserIds.length} usuários!`);
            setGiftAmount('');
            setGiftDescription('');
            setSelectedBadgeId('');
            setSelectedGiftUsers([]);
        } catch (err: any) {
            alert('Erro ao enviar prêmios: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        giftTarget, setGiftTarget,
        selectedGiftUsers, setSelectedGiftUsers,
        giftType, setGiftType,
        giftAmount, setGiftAmount,
        giftSearchQuery, setGiftSearchQuery,
        giftDescription, setGiftDescription,
        selectedBadgeId, setSelectedBadgeId,
        giftSearchResults, setGiftSearchResults,
        usersWithSelectedBadge,
        handleGiftSearch,
        handleSendGifts,
        isLoading
    };
}
