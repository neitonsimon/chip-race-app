import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Command } from '../../../types';

interface UseTopUpProps {
    selectedCommand: Command | null;
    currentUser: any;
    isAdmin: boolean;
    updatePlayerBalanceLocally: (userId: string, amount: number) => void;
}

export function useTopUp({ selectedCommand, currentUser, isAdmin, updatePlayerBalanceLocally }: UseTopUpProps) {
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [confirmingTopUp, setConfirmingTopUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleTopUp = async () => {
        if (!isAdmin || !selectedCommand) return;
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0) return;
        if (!confirmingTopUp) {
            setConfirmingTopUp(true);
            return;
        }
        setIsLoading(true);
        try {
            const userId = selectedCommand.user_id;

            // 1. Calculate bonuses: R$ 50 = 1 EXP, Chipz = 0 (Removido)
            const expBonus = Math.floor(amount / 50);
            const chipzBonus = 0;

            const { error: topUpErr } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: userId,
                p_brl_amount: amount,
                p_chipz_amount: chipzBonus,
                p_description: `Recarga de crédito via Admin`,
                p_category: 'wallet_deposit',
                p_metadata: { admin_id: currentUser.id, exp_bonus: expBonus }
            });
            if (topUpErr) { alert('Erro ao processar recarga: ' + topUpErr.message); return; }

            updatePlayerBalanceLocally(userId, amount);

            // 2. Award EXP (using secure RPC)
            if (expBonus > 0) {
                const { error: expErr } = await supabase.rpc('bulk_add_event_exp', {
                    p_user_ids: [userId],
                    p_exp_amount: expBonus
                });
                if (expErr) console.error("Failed to award EXP in TopUp:", expErr);
            }

            // 3. Send Push Notification
            try {
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        userIds: [userId],
                        title: '💰 Recarga Efetuada!',
                        message: `R$ ${amount.toFixed(2)} foram adicionados à sua carteira (Via Caixa)`
                    }
                });
            } catch (err) {
                console.error("Failed to send push notification", err);
            }

            // 4. Notify user (inbox)
            const { error: msgErr } = await supabase.from('messages').insert({
                user_id: userId,
                sender: 'Admin',
                sender_id: currentUser?.id,
                subject: 'Recarga de Saldo 💸',
                content: `Uma recarga manual via Clube de R$ ${amount.toFixed(2)} foi adicionada à sua conta.${expBonus > 0 ? ` Você também ganhou ${expBonus} EXP!` : ''}`,
                category: 'system',
                is_read: false
            });
            if (msgErr) console.error("Failed to send message in TopUp:", msgErr);

            // 5. Log de Auditoria
            const { error: auditErr } = await supabase.from('audit_logs').insert({
                admin_id: currentUser?.id,
                action_type: 'MANUAL_TOP_UP',
                description: `Admin adicionou R$ ${amount.toFixed(2)} manualmente (Balcão).`,
                target_user_id: userId,
                details: { amount, command_id: selectedCommand.id }
            });
            if (auditErr) console.error("Failed to log audit in TopUp:", auditErr);

            alert('Recarga concluída e saldo atualizado!');
            setShowTopUp(false);
            setTopUpAmount('');
            setConfirmingTopUp(false);
        } catch (err: any) {
            alert('Erro geral na recarga: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        showTopUp, setShowTopUp,
        topUpAmount, setTopUpAmount,
        confirmingTopUp, setConfirmingTopUp,
        isLoading, handleTopUp
    };
}
