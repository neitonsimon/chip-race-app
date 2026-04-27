import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Message, Poll, MessageCategory, SystemMessageTemplate } from '../../types';

interface SupabaseMessage {
    id: string;
    sender: string;
    sender_id?: string;
    subject: string;
    content: string;
    created_at: string;
    is_read: boolean;
    category: MessageCategory;
    poll_id?: string;
    user_id?: string;
}

interface UseMessagesOptions {
    isLoggedIn: boolean;
    currentUserId: string | null;
    isAdmin: boolean;
    systemMessageTemplates: SystemMessageTemplate[];
}

export function useMessages({ isLoggedIn, currentUserId, isAdmin, systemMessageTemplates }: UseMessagesOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [pollVotesByCurrentUser, setPollVotesByCurrentUser] = useState<Record<string, number>>({});
    const [newNotification, setNewNotification] = useState<Message | null>(null);
    const notificationTimer = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchMessages = async (userId: string, signal?: AbortSignal) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            const isAdminRole = profile?.role === 'admin' || profile?.role === 'staff';

            const { data } = await supabase
                .from('messages')
                .select('id, sender, sender_id, subject, content, created_at, is_read, category, poll_id, user_id')
                .or(`user_id.eq.${userId},user_id.is.null`)
                .order('created_at', { ascending: false });

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
                    date: new Date(m.created_at || Date.now()).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    }),
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
            const { data } = await supabase
                .from('polls')
                .select('id, question, options, active, created_at')
                .eq('active', true);
            if (!data || data.length === 0) return;

            const { data: allVotes } = await supabase
                .from('poll_votes')
                .select('poll_id, option_index')
                .in('poll_id', data.map(p => p.id));

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
            const { data } = await supabase
                .from('poll_votes')
                .select('poll_id, option_index')
                .eq('user_id', userId);
            if (data) {
                const votesMap: Record<string, number> = {};
                data.forEach(v => { votesMap[v.poll_id] = v.option_index; });
                setPollVotesByCurrentUser(votesMap);
            }
        } catch (e) {
            console.error('Error fetching user votes:', e);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await supabase.from('messages').update({ is_read: true }).eq('id', id);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Error marking message as read:', e);
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            await supabase.from('messages').delete().eq('id', id);
            setMessages(prev => {
                const updated = prev.filter(m => m.id !== id);
                setUnreadCount(updated.filter(m => !m.read).length);
                return updated;
            });
        } catch (e) {
            console.error('Error deleting message:', e);
        }
    };

    const handleReplyMessage = (messageId: string, replyText: string) => {
        console.log('Reply to', messageId, ':', replyText);
    };

    const handleSendMessage = async (toPlayerName: string, content: string) => {
        if (!currentUserId) return;
        try {
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', currentUserId)
                .single();

            const { data: recipientProfile } = await supabase
                .from('profiles')
                .select('id')
                .ilike('name', toPlayerName)
                .single();

            if (!recipientProfile) throw new Error('Jogador não encontrado');

            await supabase.from('messages').insert({
                user_id: recipientProfile.id,
                sender: senderProfile?.name || 'Jogador',
                sender_id: currentUserId,
                subject: 'Mensagem Privada',
                content,
                category: 'private' as MessageCategory,
                is_read: false
            });
        } catch (e: any) {
            console.error('Error sending message:', e);
            throw e;
        }
    };

    const handleSendAdminMessage = async (
        subject: string,
        content: string,
        category?: MessageCategory,
        pollId?: string,
        targetUserId?: string
    ) => {
        try {
            await supabase.from('messages').insert({
                user_id: targetUserId || null,
                sender: 'Chip Race Admin',
                subject,
                content,
                category: category || 'system',
                is_read: false,
                poll_id: pollId || null
            });
        } catch (e: any) {
            console.error('Error sending admin message:', e);
            throw e;
        }
    };

    const handleCreatePoll = async (question: string, options: string[]) => {
        try {
            const { data } = await supabase.from('polls').insert({ question, options, active: true }).select().single();
            if (data) setPolls(prev => [...prev, { ...data, vote_counts: options.map(() => 0) }]);
        } catch (e: any) {
            console.error('Error creating poll:', e);
            throw e;
        }
    };

    const handleVoteOnPoll = async (pollId: string, optionIndex: number) => {
        if (!currentUserId || pollVotesByCurrentUser[pollId] !== undefined) return;
        try {
            await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: currentUserId, option_index: optionIndex });
            setPollVotesByCurrentUser(prev => ({ ...prev, [pollId]: optionIndex }));
            setPolls(prev => prev.map(p => {
                if (p.id !== pollId) return p;
                const updated = [...(p.vote_counts || [])];
                updated[optionIndex] = (updated[optionIndex] || 0) + 1;
                return { ...p, vote_counts: updated };
            }));
        } catch (e: any) {
            console.error('Error voting on poll:', e);
        }
    };

    // Realtime subscription for messages
    useEffect(() => {
        if (!isLoggedIn || !currentUserId) return;

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        fetchMessages(currentUserId, signal);
        fetchPolls();
        fetchUserPollVotes(currentUserId);

        const msgChannel = supabase.channel(`messages-hook-${currentUserId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const m = payload.new as SupabaseMessage;
                    const isSupportToAdmin = m.category === 'support' && !m.user_id;
                    const isTargetedToMe = m.user_id === currentUserId;
                    const isGlobalNonSupport = !m.user_id && m.category !== 'support';

                    if (isTargetedToMe || isGlobalNonSupport || (isAdmin && isSupportToAdmin)) {
                        const newMsg: Message = {
                            id: m.id,
                            from: m.sender || 'Chip Race',
                            senderId: m.sender_id,
                            subject: m.subject || 'Notificação',
                            content: m.content || '',
                            date: new Date(m.created_at || Date.now()).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            }),
                            read: false,
                            category: m.category || 'system',
                            pollId: m.poll_id
                        };
                        if (notificationTimer.current) clearTimeout(notificationTimer.current);
                        setNewNotification(newMsg);
                        notificationTimer.current = setTimeout(() => setNewNotification(null), 8000);
                    }
                }
                fetchMessages(currentUserId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            if (notificationTimer.current) clearTimeout(notificationTimer.current);
        };
    }, [isLoggedIn, currentUserId, isAdmin]);

    return {
        messages,
        unreadCount,
        polls,
        pollVotesByCurrentUser,
        newNotification,
        setNewNotification,
        handleMarkAsRead,
        handleDeleteMessage,
        handleReplyMessage,
        handleSendMessage,
        handleSendAdminMessage,
        handleCreatePoll,
        handleVoteOnPoll,
    };
}
