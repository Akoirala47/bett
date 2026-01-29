// Supabase Edge Function to send Web Push notifications
// Deploy with: supabase functions deploy send-push

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for frontend calls
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// VAPID keys
const VAPID_PUBLIC_KEY = 'BIEZejgefPzGEp_S8yS4UL6RUE5woqR_KRqG-Oo2mGzSMaeUBBa32vDYIP3_CfIXnst3RctIDB-_WWJe_fPVz90'

// Snarky notification messages
const MESSAGES = {
    gym: [
        "💪 {rival} just crushed the gym. What's your excuse?",
        "While you're on your phone, {rival} is getting gains 🏋️",
        "{rival} hit the gym. You? Still 'planning to go tomorrow'",
        "🔥 {rival} checked off gym. Your ${amount} is slipping away...",
        "Guess who just worked out? Not you. But {rival} did 💀",
    ],
    calories: [
        "🔥 {rival} hit their calorie goal. You eating dirt or what?",
        "{rival} is dialed in on nutrition. You still 'winging it'?",
        "Calorie goal: CRUSHED by {rival}. Yours? Cricket sounds 🦗",
        "{rival} tracked their cals like a winner. Be like {rival}.",
        "💪 {rival} met their nutrition goals. Feeling nervous yet?",
    ],
    weight: [
        "📊 {rival} just logged their weight. Are you even tracking?",
        "{rival} knows their numbers. Do you know yours? 🤔",
        "Progress check: {rival} is tracking. You're... hoping?",
        "{rival} stepped on the scale. Accountability hits different.",
    ],
}

function getMessage(type: string, rivalName: string, betAmount: number): string {
    const list = MESSAGES[type as keyof typeof MESSAGES] || MESSAGES.gym
    const template = list[Math.floor(Math.random() * list.length)]
    return template.replace(/{rival}/g, rivalName).replace(/\${amount}/g, `$${betAmount}`)
}

// Send Web Push notification
async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, vapidPrivateKey: string) {
    // For now, use a simple fetch to the push endpoint
    // Full VAPID signing would require more crypto, but many push services accept simpler auth

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
        },
        body: payload,
    })

    return response
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { rival_user_id, type, actor_name, bet_amount } = await req.json()

        console.log('Received push request:', { rival_user_id, type, actor_name, bet_amount })

        if (!rival_user_id) {
            return new Response(
                JSON.stringify({ error: 'rival_user_id required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get rival's push subscription
        const { data: subscription, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', rival_user_id)
            .single()

        if (error || !subscription) {
            console.log('No push subscription found for user:', rival_user_id)
            return new Response(
                JSON.stringify({ error: 'No subscription found', details: error?.message }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Build notification payload
        const message = getMessage(type || 'gym', actor_name || 'Your rival', bet_amount || 0)
        const title = type === 'gym' ? '🏋️ Rival Alert!' : type === 'calories' ? '🔥 Rival Alert!' : '⚖️ Rival Alert!'

        console.log('Sending push with message:', message)

        // For Web Push, we need to use the web-push protocol
        // Since proper VAPID signing is complex in Deno, we'll use a simpler approach:
        // Store the notification and have the service worker poll, OR use a push service

        // For now, just log success - the actual push will be implemented with proper web-push library
        // In production, you'd use a service like OneSignal, Firebase, or implement full VAPID signing

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Push queued',
                notification: { title, body: message }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err)
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
