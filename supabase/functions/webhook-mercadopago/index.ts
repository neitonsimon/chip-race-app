import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const bodyText = await req.text();
        let body;

        // MP Webhooks might be JSON or Form Data depending on configuration
        try {
            body = JSON.parse(bodyText);
        } catch {
            console.log("Could not parse as JSON:", bodyText);
            return new Response("Invalid JSON", { status: 400 });
        }

        // Usually, MP sends { action: 'payment.created', type: 'payment', data: { id: '123' } }
        console.log("Webhook payload received:", JSON.stringify(body));

        const action = body.action || body.type;
        const paymentId = body.data?.id;

        if (!paymentId) {
            return new Response("No payment ID found", { status: 400 });
        }

        if (action === "payment.created" || action === "payment.updated" || body.topic === "payment") {

            const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

            if (!MP_ACCESS_TOKEN) {
                throw new Error("Missing MP_ACCESS_TOKEN");
            }

            // 1. Verify payment status directly with MP
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`
                }
            });

            if (!mpResponse.ok) {
                throw new Error(`Failed to verify payment with MP: ${mpResponse.status}`);
            }

            const paymentData = await mpResponse.json();
            console.log("MP Payment state:", paymentData.status);

            // 2. Fetch corresponding internal payment intent
            const supabaseAdmin = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            const intentId = paymentData.metadata?.payment_intent_id;
            const gatewayIdStr = paymentId.toString();

            let query = supabaseAdmin.from("payment_intents").select("*");

            if (intentId) {
                query = query.eq("id", intentId);
            } else {
                query = query.eq("gateway_id", gatewayIdStr);
            }

            const { data: intents, error: intentError } = await query;

            if (intentError || !intents || intents.length === 0) {
                console.error("Intent not found for payment:", paymentId);
                // MP expects 200 OK or it will keep retrying. 
                // We acknowledge receipt even if the intent isn't found locally.
                return new Response("Intent not found", { status: 200 });
            }

            const intent = intents[0];

            // If already processed, ignore
            if (intent.status === "approved" || intent.status === "paid") {
                return new Response("Already processed", { status: 200 });
            }

            // 3. Process if Approved
            if (paymentData.status === "approved") {

                // Update intent status
                await supabaseAdmin
                    .from("payment_intents")
                    .update({ status: "approved" })
                    .eq("id", intent.id);

                // Call RPC to fulfill balance securely
                console.log("Approving balance for user:", intent.user_id, "amount:", intent.amount);
                const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("secure_balance_transaction", {
                    p_user_id: intent.user_id,
                    p_brl_amount: intent.amount,
                    p_chipz_amount: 0,
                    p_description: `Depósito PIX (MP-${gatewayIdStr})`,
                    p_category: "wallet_deposit",
                    p_metadata: { source: "MercadoPago Webhook", intent_id: intent.id, gateway_id: gatewayIdStr }
                });

                if (rpcError || rpcData === false) {
                    console.error("Failed to add balance via RPC:", rpcError);
                } else {
                    // Send Push Notification
                    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
                    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

                    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
                        const title = `💰 PIX Aprovado!`
                        const message = `Seu depósito de R$ ${intent.amount.toFixed(2)} foi creditado com sucesso em sua carteira.`

                        await fetch('https://onesignal.com/api/v1/notifications', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                            },
                            body: JSON.stringify({
                                app_id: ONESIGNAL_APP_ID,
                                headings: { en: title, pt: title },
                                contents: { en: message, pt: message },
                                include_external_user_ids: [intent.user_id],
                                url: 'https://chip-race-app.vercel.app/recargas',
                            }),
                        })
                    }

                    // Also add EXP BONUS
                    const expBonus = Math.floor(intent.amount / 20);
                    if (expBonus > 0) {
                        await supabaseAdmin.rpc("bulk_add_event_exp", {
                            p_user_ids: [intent.user_id],
                            p_exp_amount: expBonus
                        });
                    }
                    console.log("Successfully fulfilled payment:", intent.id);
                }
            } else {
                // Maybe just update the status to pending/failed based on MP status
                await supabaseAdmin
                    .from("payment_intents")
                    .update({ status: paymentData.status })
                    .eq("id", intent.id);
            }

            return new Response("OK", { status: 200 });

        }

        return new Response("Ignored event type", { status: 200 });
    } catch (error: any) {
        console.error("Webhook processing error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
