import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Command } from '../../../types';

interface UseCheckoutProps {
    selectedCommand: Command | null;
    currentUser: any;
    updatePlayerBalanceLocally: (userId: string, amount: number) => void;
    updatePlayerDebtLocally: (userId: string, amount: number) => void;
    onSuccess: () => void;
}

export function useCheckout({
    selectedCommand,
    currentUser,
    updatePlayerBalanceLocally,
    updatePlayerDebtLocally,
    onSuccess
}: UseCheckoutProps) {
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutDiscount, setCheckoutDiscount] = useState('');
    const [checkoutDebt, setCheckoutDebt] = useState('');
    const [checkoutChips, setCheckoutChips] = useState('');
    const [checkoutCashOut, setCheckoutCashOut] = useState('');
    const [checkoutProfitCash, setCheckoutProfitCash] = useState('');
    const [confirmingCheckout, setConfirmingCheckout] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const openCheckout = () => {
        setCheckoutDiscount('');
        setCheckoutDebt('');
        setCheckoutChips('');
        setCheckoutCashOut('');
        setCheckoutProfitCash('');
        setConfirmingCheckout(false);
        setShowCheckout(true);
    };

    const closeCheckout = () => {
        setShowCheckout(false);
        setConfirmingCheckout(false);
    };

    const handleCloseCommand = async () => {
        if (!selectedCommand) return;
        const total = Number(selectedCommand.total_brl || 0);
        const discount = Number(parseFloat(checkoutDiscount).toFixed(2)) || 0;
        const debt = Number(parseFloat(checkoutDebt).toFixed(2)) || 0;
        const chips = Number(parseFloat(checkoutChips).toFixed(2)) || 0;
        const cashOut = Number(parseFloat(checkoutCashOut).toFixed(2)) || 0;
        const profitCashRaw = Number(parseFloat(checkoutProfitCash).toFixed(2)) || 0;

        // Net cost = total - discount - debt - chips
        const netCost = Number((total - discount - debt - chips).toFixed(2));
        // Full profit if cashOut is provided
        const profit = cashOut > 0 ? Number((cashOut - Math.max(0, netCost)).toFixed(2)) : 0;
        const hasProfit = profit > 0.01; // Avoid floating point near zero
        // Cash paid in hands, credit goes to app balance
        const profitCash = Number(Math.min(profitCashRaw, profit).toFixed(2));   // physically paid
        const profitCredit = Number(Math.max(0, profit - profitCash).toFixed(2)); // credited to balance
        // Normal deduction when no profit
        const finalToDeduct = cashOut > 0 ? Number(Math.max(0, netCost - cashOut).toFixed(2)) : Number(Math.max(0, netCost).toFixed(2));

        if (!confirmingCheckout) {
            // Handle profile as object or array
            const profile = Array.isArray(selectedCommand.profiles) ? selectedCommand.profiles[0] : (selectedCommand as any).profiles;
            const currentDebt = Number(profile?.total_pending_debt || profile?.totalPendingDebt || 0);
            const limit = Number(profile?.debt_limit_brl || profile?.debtLimitBrl || 0);
            const userBalance = Number(profile?.balance_brl || profile?.balanceBrl || 0);

            if (debt > 0 && limit > 0 && (currentDebt + debt) > limit) {
                alert(`Limite de pendura excedido! \nLimite: R$ ${limit.toFixed(2)}\nPendência atual: R$ ${currentDebt.toFixed(2)}\nTentativa: R$ ${debt.toFixed(2)}`);
                return;
            }

            // Only check balance if there's a net deduction needed
            if (!hasProfit && finalToDeduct > 0.01 && (Number(userBalance.toFixed(2)) < Number(finalToDeduct.toFixed(2)))) {
                alert(`Saldo insuficiente para cobrir o restante da comanda!\nO jogador possui R$ ${userBalance.toFixed(2)} e o valor a cobrar é R$ ${finalToDeduct.toFixed(2)}.`);
                return;
            }

            setConfirmingCheckout(true);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Record debt if any
            if (debt > 0) {
                const { error: debtErr } = await supabase.from('debts').insert({
                    user_id: selectedCommand.user_id,
                    command_id: selectedCommand.id,
                    event_id: selectedCommand.event_id,
                    amount_brl: debt,
                    status: 'pending'
                });
                if (debtErr) throw debtErr;

                // Trigger will handle total_pending_debt update in database
                updatePlayerDebtLocally(selectedCommand.user_id, debt);
            }

            // 2a. If player PROFITED: credit them (only the credit portion, not cash-in-hands)
            if (hasProfit) {
                if (profitCredit > 0) {
                    const { data, error: creditErr } = await supabase.rpc('secure_balance_transaction', {
                        p_user_id: selectedCommand.user_id,
                        p_brl_amount: profitCredit,
                        p_chipz_amount: 0,
                        p_description: `Lucro Cash Game — Comanda encerrada${profitCash > 0 ? ` (R$ ${profitCash.toFixed(2)} pago em mãos)` : ''}`,
                        p_category: 'command_profit',
                        p_metadata: {
                            command_id: selectedCommand.id,
                            event_id: selectedCommand.event_id,
                            profit_total: profit,
                            cash_payment: profitCash,
                            app_credit: profitCredit
                        }
                    });
                    if (creditErr) throw creditErr;

                    updatePlayerBalanceLocally(selectedCommand.user_id, profitCredit);

                    // Recompensa Padronizada: 1 EXP a cada R$ 50 (Lucro para o app conta como recarga)
                    const expBonus = Math.floor(profitCredit / 50);
                    if (expBonus > 0) {
                        await supabase.rpc('bulk_add_event_exp', {
                            p_user_ids: [selectedCommand.user_id],
                            p_exp_amount: expBonus
                        });
                    }
                }

                if (profitCash > 0.01) {
                    await supabase.from('transactions').insert({
                        user_id: selectedCommand.user_id,
                        amount_brl: profitCash,
                        description: `Pagamento de lucro Cash Game (Em mãos) — Comanda ${selectedCommand.id.slice(0, 8)}`,
                        category: 'wallet_deposit',
                        type: 'credit',
                        metadata: {
                            command_id: selectedCommand.id,
                            event_id: selectedCommand.event_id,
                            payment_method: 'cash'
                        }
                    });
                }
            }
            // 2b. Normal deduction from balance
            else if (finalToDeduct > 0.01) {
                const { data, error: deductErr } = await supabase.rpc('secure_balance_transaction', {
                    p_user_id: selectedCommand.user_id,
                    p_brl_amount: -finalToDeduct,
                    p_chipz_amount: 0,
                    p_description: `Pagamento de comanda ${selectedCommand.id.slice(0, 8)}`,
                    p_category: 'purchase',
                    p_metadata: {
                        command_id: selectedCommand.id,
                        event_id: selectedCommand.event_id,
                        total_consumo: total,
                        deducted_from_balance: finalToDeduct
                    }
                });
                if (deductErr) throw deductErr;
                if (data === false) {
                    console.error('RPC Returned false for deduction:', { userId: selectedCommand.user_id, amount: -finalToDeduct });
                    throw new Error('Falha ao debitar saldo do aplicativo. Verifique se o jogador possui saldo suficiente ou se o perfil está vinculado corretamente.');
                }
                updatePlayerBalanceLocally(selectedCommand.user_id, -finalToDeduct);
            }

            // 2c. Log Cash/PIX payment if any (to appear in reports/monitor)
            if (chips > 0.01) {
                await supabase.from('transactions').insert({
                    user_id: selectedCommand.user_id,
                    amount_brl: -chips,
                    description: `Pagamento comanda ${selectedCommand.id.slice(0, 8)} (Dinheiro/PIX)`,
                    category: 'purchase',
                    type: 'debit',
                    metadata: {
                        command_id: selectedCommand.id,
                        event_id: selectedCommand.event_id,
                        payment_method: 'cash_pix'
                    }
                });
            }

            // 3. Close the command (store cashOut for records)
            const { error: upErr } = await supabase.from('commands').update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                discount_brl: discount,
                unpaid_amount_brl: debt,
                chips_payment_brl: chips,
                cash_out_brl: cashOut,
                profit_brl: profit,
                profit_cash_payment_brl: profitCash
            }).eq('id', selectedCommand.id);

            if (upErr) throw upErr;

            // 4. Notify user
            const msgContent = [
                `Sua comanda foi encerrada. Total consumido: R$ ${total.toFixed(2)}.`,
                discount > 0 ? `Desconto: R$ ${discount.toFixed(2)}.` : '',
                debt > 0 ? `Pendura: R$ ${debt.toFixed(2)}.` : '',
                chips > 0 ? `Pago em Espécie: R$ ${chips.toFixed(2)}.` : '',
                cashOut > 0 ? `Cash Out: R$ ${cashOut.toFixed(2)}.` : '',
                profit > 0 ? `Lucro: R$ ${profit.toFixed(2)} (R$ ${profitCash.toFixed(2)} em mãos, R$ ${profitCredit.toFixed(2)} no App).` : '',
                !hasProfit && finalToDeduct > 0 ? `Débito App: R$ ${finalToDeduct.toFixed(2)}.` : ''
            ].filter(Boolean).join(' ');

            await supabase.from('messages').insert({
                user_id: selectedCommand.user_id,
                sender: 'Sistema',
                sender_id: currentUser.id,
                subject: 'Comanda Encerrada 🧾',
                content: msgContent,
                category: 'system',
                is_read: false
            });

            // 5. Audit logs for sensitive ops
            await supabase.from('audit_logs').insert({
                admin_id: currentUser.id,
                action_type: 'COMMAND_CHECKOUT',
                description: `Admin fechou a comanda ${selectedCommand.id.slice(0, 8)}. Total consumido: R$ ${total.toFixed(2)}.`,
                target_user_id: selectedCommand.user_id,
                details: { total, discount, debt, chips, cashOut, profit, command_id: selectedCommand.id }
            });

            if (discount > 0) {
                await supabase.from('audit_logs').insert({
                    admin_id: currentUser.id,
                    action_type: 'CHECKOUT_DISCOUNT',
                    description: `Admin concedeu desconto de R$ ${discount.toFixed(2)} no fechamento da comanda.`,
                    target_user_id: selectedCommand.user_id,
                    details: { discount, total, command_id: selectedCommand.id }
                });
            }

            // 6. Notify Parent
            onSuccess();
            closeCheckout();

        } catch (err: any) {
            alert('Erro ao fechar comanda: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        showCheckout, setShowCheckout, openCheckout, closeCheckout,
        checkoutDiscount, setCheckoutDiscount,
        checkoutDebt, setCheckoutDebt,
        checkoutChips, setCheckoutChips,
        checkoutCashOut, setCheckoutCashOut,
        checkoutProfitCash, setCheckoutProfitCash,
        confirmingCheckout, setConfirmingCheckout,
        isLoading, handleCloseCommand
    };
}
