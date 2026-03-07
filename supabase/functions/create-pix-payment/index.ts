import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Get the user making the request
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const { amount, description, metadata } = body;

        if (!amount || amount <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid amount' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Step 1: Create a pending payment intent in the DB using the Service Role Key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch user profile to get the name
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', user.id)
            .single();

        const fullName = profile?.name || user.user_metadata?.full_name || 'Jogador';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

        const { data: dbIntent, error: insertError } = await supabaseAdmin
            .from('payment_intents')
            .insert({
                user_id: user.id,
                amount: amount,
                status: 'pending'
            })
            .select('id')
            .single();

        if (insertError || !dbIntent) {
            throw new Error(`Failed to create intent: ${insertError?.message}`);
        }

        // Step 2: Communicate with Mercado Pago API using Access Token
        const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');

        if (!MP_ACCESS_TOKEN) {
            throw new Error("Mercado Pago token not configured");
        }

        const idempotencyKey = crypto.randomUUID();

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description: description || 'Recarga de Saldo - Chip Race',
                payment_method_id: 'pix',
                payer: {
                    email: profile?.email || user.email || 'jogador@chiprace.com.br',
                    first_name: firstName,
                    last_name: lastName
                },
                metadata: {
                    ...metadata,
                    payment_intent_id: dbIntent.id,
                    user_id: user.id
                }
            })
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("MP Error:", mpData);
            // Update intent with error
            await supabaseAdmin
                .from('payment_intents')
                .update({
                    status: 'error',
                    gateway_id: mpData.message?.substring(0, 255)
                })
                .eq('id', dbIntent.id);
            throw new Error(`Mercado Pago error: ${mpData.message || mpData.error?.message || 'Unknown error'}`);
        }

        // Extract Pix Codes
        const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
        const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
        const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;
        const gatewayId = mpData.id?.toString();

        // Step 3: Update the Intent with MP data
        await supabaseAdmin
            .from('payment_intents')
            .update({
                gateway_id: gatewayId,
                qr_code: qrCode,
                qr_code_base64: qrCodeBase64,
                ticket_url: ticketUrl
            })
            .eq('id', dbIntent.id);

        return new Response(JSON.stringify({
            success: true,
            payment_id: gatewayId,
            intent_id: dbIntent.id,
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            ticket_url: ticketUrl
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error("Payment creation error:", err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error', stack: err.stack }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
