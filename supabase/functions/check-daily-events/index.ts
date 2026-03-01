import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Today's date in Brasília time (UTC-3)
        const now = new Date();
        const brtOffset = -3 * 60 * 60 * 1000;
        const todayBRT = new Date(now.getTime() + brtOffset);
        const todayStr = todayBRT.toISOString().split('T')[0];

        console.log(`Checking for events on ${todayStr}`);

        const { data: events, error: eventError } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('date', todayStr)
            .eq('status', 'open');

        if (eventError) throw eventError;

        if (events && events.length > 0) {
            console.log(`Found ${events.length} events for today.`);

            for (const event of events) {
                const title = `🃏 Hoje tem Torneio! - ${event.title}`
                const message = `Prepare seu stack! O torneio começa hoje às ${event.time || 'no horário marcado'}. ${event.guaranteed ? `Premiação: ${event.guaranteed} garantidos!` : ''}`

                // Call send-push-notification internal URL or just call OneSignal API directly
                const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
                const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

                const body = {
                    app_id: ONESIGNAL_APP_ID,
                    headings: { en: title, pt: title },
                    contents: { en: message, pt: message },
                    included_segments: ['Total Subscriptions'],
                    url: 'https://chip-race-app.vercel.app/calendario',
                }

                const response = await fetch('https://onesignal.com/api/v1/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                    },
                    body: JSON.stringify(body),
                })

                if (!response.ok) {
                    console.error(`Failed to send push for event: ${event.id}`);
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
