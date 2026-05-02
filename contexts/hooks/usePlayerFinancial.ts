import { useState, useCallback } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Command, Transaction, Debt } from '../../types';

interface UsePlayerFinancialProps {
    userId: string | null;
    isLoggedIn: boolean;
    isOwnProfile: boolean;
    playerBalance: number;
    onUpdateProfile?: (id: string, data: any) => void;
}

export function usePlayerFinancial({ userId, isLoggedIn, isOwnProfile, playerBalance, onUpdateProfile }: UsePlayerFinancialProps) {
    const [playerCommands, setPlayerCommands] = useState<Command[]>([]);
    const [playerTransactions, setPlayerTransactions] = useState<Transaction[]>([]);
    const [playerBets, setPlayerBets] = useState<any[]>([]);
    const [userDebts, setUserDebts] = useState<Debt[]>([]);
    const [totalUserDebt, setTotalUserDebt] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

    const fetchPlayerCommands = useCallback(async (limit = 20) => {
        if (!userId) return;
        setIsLoadingFinancial(true);
        try {
            const { data: commands } = await supabase.from('commands')
                .select('id, user_id, event_id, status, total_brl, discount_brl, unpaid_amount_brl, chips_payment_brl, cash_payment_brl, pix_payment_brl, credit_payment_brl, profit_brl, cash_out_brl, closed_at, created_at, events(title, date)')
                .eq('user_id', userId)
                .in('status', ['open', 'closed'])
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (commands) setPlayerCommands(commands);

            const { data: transactions } = await supabase.from('transactions')
                .select('id, category, amount_brl, description, created_at, metadata')
                .eq('user_id', userId)
                .in('category', ['wallet_deposit', 'recharge', 'online_credit', 'wallet_withdrawal', 'command_profit'])
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (transactions) setPlayerTransactions(transactions);

            const { data: bets } = await supabase.from('user_bets')
                .select(`
                    id, user_id, bet_id, bet_odd_id, stake_brl, possible_gain_brl, status, created_at,
                    bets (
                        category,
                        events (title, date)
                    ),
                    bet_odds (
                        profiles (name),
                        guest_name
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (bets) setPlayerBets(bets);
        } catch (e) {
            console.error('Error fetching financial data:', e);
        } finally {
            setIsLoadingFinancial(false);
        }
    }, [userId]);

    const fetchUserDebts = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await supabase.from('debts')
                .select('id, user_id, event_id, amount_brl, reason, status, created_at, events(title, date)')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (data) {
                setUserDebts(data);
                const total = data.reduce((acc, d) => acc + Number(d.amount_brl), 0);
                setTotalUserDebt(total);
            }
        } catch (e) {
            console.error('Error fetching debts:', e);
        }
    }, [userId]);

    const handlePayOpenCommand = async (cmd: any) => {
        if (!isLoggedIn || !isOwnProfile || !userId) return;
        const amount = Number(cmd.total_brl);
        if (amount <= 0) return;

        if (playerBalance < amount) {
            alert('Saldo insuficiente para pagar esta comanda!');
            return;
        }

        if (!window.confirm(`Deseja encerrar e pagar esta comanda de R$ ${amount.toFixed(2)} usando seu saldo?`)) return;

        setIsSaving(true);
        try {
            const { data, error: deductErr } = await supabase.rpc('secure_balance_transaction', {
                p_user_id: userId,
                p_brl_amount: -amount,
                p_chipz_amount: 0,
                p_description: `Pagamento de comanda ${cmd.id.slice(0, 8)} (vía perfil)`,
                p_category: 'purchase',
                p_metadata: { command_id: cmd.id, event_id: cmd.event_id }
            });

            if (deductErr || data === false) {
                throw new Error(deductErr?.message || 'Saldo insuficiente no aplicativo ou falha na transação.');
            }

            const { error: updateErr } = await supabase.from('commands').update({
                status: 'closed',
                closed_at: new Date().toISOString()
            }).eq('id', cmd.id);
            if (updateErr) throw updateErr;

            await supabase.from('messages').insert({
                user_id: userId,
                sender: 'Sistema',
                content: `Você encerrou sua comanda no evento ${cmd.events?.title || 'Torneio'} e pagou R$ ${amount.toFixed(2)} com seu saldo.`,
                category: 'system',
                is_read: false
            });

            const newBalance = playerBalance - amount;
            if (onUpdateProfile) onUpdateProfile(userId, { balanceBrl: newBalance });

            fetchPlayerCommands();
            return { success: true, newBalance };
        } catch (err: any) {
            alert('Erro ao processar pagamento: ' + err.message);
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    };

    const handlePayDebt = async (debt: any, customAmount?: number) => {
        if (!isLoggedIn || !isOwnProfile || !userId) return;
        const fullAmount = Number(debt.amount_brl);
        const payAmount = customAmount ?? fullAmount;

        if (payAmount <= 0 || payAmount > fullAmount) {
            alert('Valor inválido.');
            return;
        }
        if (playerBalance < payAmount) {
            alert('Saldo insuficiente para este pagamento!');
            return;
        }

        if (!window.confirm(`Pagar R$ ${payAmount.toFixed(2)} agora?`)) return;

        setIsSaving(true);
        try {
            const { data, error } = await supabase.rpc('settle_debt_with_balance', {
                p_user_id: userId,
                p_debt_id: debt.id,
                p_pay_amount: payAmount
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            const newBalance = playerBalance - payAmount;
            if (onUpdateProfile) onUpdateProfile(userId, { balanceBrl: newBalance });

            fetchUserDebts();
            alert(data.message);
            return { success: true, newBalance };
        } catch (err: any) {
            alert('Erro ao pagar: ' + err.message);
            return { success: false };
        } finally {
            setIsSaving(false);
        }
    };

    const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
    const [receiptItems, setReceiptItems] = useState<any[]>([]);

    const handleViewReceipt = useCallback(async (cmd: any) => {
        try {
            const { data } = await supabase.from('command_items')
                .select('id, command_id, product_id, quantity, unit_price_brl, total_price_brl, notes, created_at, products(name, category)')
                .eq('command_id', cmd.id)
                .order('created_at', { ascending: true });
            
            setReceiptItems(data || []);

            // Fetch latest totals/details
            const { data: latestCmd } = await supabase.from('commands')
                .select('id, user_id, event_id, status, total_brl, discount_brl, unpaid_amount_brl, chips_payment_brl, cash_payment_brl, pix_payment_brl, credit_payment_brl, profit_brl, cash_out_brl, closed_at, created_at, events(title, date)')
                .eq('id', cmd.id)
                .single();
            
            setViewingReceipt(latestCmd || cmd);
        } catch (e) {
            console.error('Error viewing receipt:', e);
        }
    }, []);

    return {
        playerCommands,
        playerTransactions,
        playerBets,
        userDebts,
        totalUserDebt,
        viewingReceipt,
        receiptItems,
        isSaving,
        isLoadingFinancial,
        fetchPlayerCommands,
        fetchUserDebts,
        handleViewReceipt,
        setViewingReceipt,
        handlePayOpenCommand,
        handlePayDebt
    };
}

