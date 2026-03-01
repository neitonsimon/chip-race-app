import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userIds, title, message, url } = await req.json()
        const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
        const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

        if (!userIds || !title || !message) {
            throw new Error('Missing required fields: userIds, title, message')
        }

        const body: any = {
            app_id: ONESIGNAL_APP_ID,
            headings: { en: title, pt: title },
            contents: { en: message, pt: message },
            url: url || 'https://chip-race-app.vercel.app',
        }

        if (userIds === 'all') {
            body.included_segments = ['Total Subscriptions']
        } else if (Array.isArray(userIds)) {
            body.include_external_user_ids = userIds
        } else {
            body.include_external_user_ids = [userIds]
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(body),
        })

        const result = await response.json()

        return new Response(JSON.stringify(result), {
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
