import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';

interface UseDebtsProps {
    isAdmin: boolean;
    currentUser: any;
    updatePlayerDebtLocally: (userId: string, amount: number) => void;
    updatePlayerBalanceLocally: (userId: string, amount: number) => void;
    onSuccess: () => void;
}

export function useDebts({ isAdmin, currentUser, updatePlayerDebtLocally, updatePlayerBalanceLocally, onSuccess }: UseDebtsProps) {
    const [debtSearchQuery, setDebtSearchQuery] = useState('');
    const [debtSearchResults, setDebtSearchResults] = useState<any[]>([]);
    const [debtFilter, setDebtFilter] = useState('');
    const [showNewDebtForm, setShowNewDebtForm] = useState(false);
    const [newDebtData, setNewDebtData] = useState({ userId: '', amount: '', eventId: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleDebtSearch = async (query: string) => {
        setDebtSearchQuery(query);
        if (query.length < 2) { setDebtSearchResults([]); return; }
        const isNumeric = /^\\d+$/.test(query);
        let q = supabase.from('profiles').select('id, name, numeric_id, avatar_url, vip_status, balance_brl, debt_limit_brl, total_pending_debt');
        q = isNumeric ? q.eq('numeric_id', parseInt(query)) : q.ilike('name', `%${query}%`);
        const { data } = await q.limit(5);
        setDebtSearchResults(data || []);
    };

    const handleRegisterDebt = async () => {
        if (!isAdmin || !newDebtData.userId || !newDebtData.amount || !newDebtData.eventId) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        setIsLoading(true);
        try {
            const isOnline = newDebtData.eventId === 'online_credit';
            const debtAmount = parseFloat(newDebtData.amount);

            const { error } = await supabase.from('debts').insert({
                user_id: newDebtData.userId,
                event_id: isOnline ? null : newDebtData.eventId,
                amount_brl: debtAmount,
                description: newDebtData.description || (isOnline ? 'Crédito Online' : ''),
                status: 'pending'
            });
            if (error) throw error;

            // Trigger will handle total_pending_debt update in database
            updatePlayerDebtLocally(newDebtData.userId, debtAmount);

            await supabase.from('messages').insert({
                user_id: newDebtData.userId,
                sender: 'Sistema',
                sender_id: currentUser.id,
                content: `Um novo débito de R$ ${debtAmount.toFixed(2)} foi registrado administrativamente.`,
                category: 'system',
                is_read: false
            });

            // Audit log
            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'MANUAL_DEBT_REGISTER',
                description: `Admin registrou uma dívida manual de R$ ${debtAmount.toFixed(2)}.`,
                target_user_id: newDebtData.userId,
                details: { amount: debtAmount, event_id: newDebtData.eventId }
            });

            alert("Débito registrado com sucesso!");
            setShowNewDebtForm(false);
            setNewDebtData({ userId: '', amount: '', eventId: '', description: '' });
            setDebtSearchQuery('');
            setDebtSearchResults([]);
            onSuccess();
        } catch (err: any) {
            alert("Erro ao registrar débito: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettleDebt = async (debt: any, type: 'balance' | 'manual', amount?: number) => {
        if (!isAdmin) return;
        const fullAmount = Number(debt.amount_brl);
        const payAmount = amount ?? fullAmount;
        const isPartial = payAmount < fullAmount;

        if (payAmount <= 0 || payAmount > fullAmount) {
            alert('Valor inválido para pagamento.');
            return;
        }

        if (type === 'balance') {
            const userBalance = Number(debt.profiles?.balance_brl || 0);
            if (userBalance < payAmount) {
                alert(`Saldo insuficiente no aplicativo!\\nO jogador possui R$ ${userBalance.toFixed(2)} e você está tentando cobrar R$ ${payAmount.toFixed(2)}.`);
                return;
            }
        }

        if (!window.confirm(
            `Confirmar baixa ${isPartial ? 'PARCIAL ' : ''}${type === 'balance' ? 'via SALDO' : 'MANUAL'} de R$ ${payAmount.toFixed(2)}${isPartial ? ` (R$ ${(fullAmount - payAmount).toFixed(2)} continua em aberto)` : ''} p/ ${debt.profiles?.name}?`
        )) return;

        setIsLoading(true);
        try {
            if (type === 'balance') {
                const { data, error } = await supabase.rpc('settle_debt_with_balance', {
                    p_user_id: debt.user_id,
                    p_debt_id: debt.id,
                    p_pay_amount: payAmount
                });
                if (error) throw error;
                if (!data.success) throw new Error(data.message);
                updatePlayerBalanceLocally(debt.user_id, -payAmount);
            } else {
                // Manual settlement
                if (isPartial) {
                    const { error: updateErr } = await supabase.from('debts').update({
                        amount_brl: fullAmount - payAmount
                    }).eq('id', debt.id);
                    if (updateErr) throw updateErr;
                } else {
                    const { error: updateErr } = await supabase.from('debts').update({
                        status: 'paid',
                        paid_at: new Date().toISOString()
                    }).eq('id', debt.id);
                    if (updateErr) throw updateErr;
                }
            }

            // NOTE: Manual (PIX/cash) debt settlements are real money — no virtual transaction record.
            // Only audit_logs is used for traceability (see below).

            // Trigger will handle total_pending_debt update in database
            updatePlayerDebtLocally(debt.user_id, -payAmount);

            await supabase.from('messages').insert({
                user_id: debt.user_id,
                sender_id: currentUser.id,
                content: isPartial
                    ? `Pagamento parcial de R$ ${payAmount.toFixed(2)} registrado. Saldo devedor atualizado para R$ ${(fullAmount - payAmount).toFixed(2)}.`
                    : `Sua pendência de R$ ${fullAmount.toFixed(2)} foi quitada (${type === 'balance' ? 'Saldo R$' : 'Baixa Manual'}).`,
                category: 'system',
                is_read: false
            });

            if (type === 'manual') {
                await supabase.from('audit_logs').insert({
                    admin_id: currentUser.id,
                    action_type: 'MANUAL_DEBT_SETTLEMENT',
                    description: `Admin deu baixa manual/perdoou pendura de R$ ${payAmount.toFixed(2)} do jogador.`,
                    target_user_id: debt.user_id,
                    details: { amount: payAmount, original_amount: fullAmount, debt_id: debt.id, is_partial: isPartial }
                });
            }

            onSuccess();
            alert(isPartial ? `Pagamento parcial de R$ ${payAmount.toFixed(2)} registrado!` : 'Baixa total realizada com sucesso!');
        } catch (err: any) {
            alert('Erro ao dar baixa: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        debtSearchQuery, setDebtSearchQuery,
        debtSearchResults, setDebtSearchResults,
        debtFilter, setDebtFilter,
        showNewDebtForm, setShowNewDebtForm,
        newDebtData, setNewDebtData,
        handleDebtSearch,
        handleRegisterDebt,
        handleSettleDebt,
        isLoading
    };
}
