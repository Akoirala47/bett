// Supabase Edge Function to send Web Push notifications
// Deploy with: supabase functions deploy send-push

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// VAPID keys - IMPORTANT: Set VAPID_PRIVATE_KEY in Supabase secrets
const VAPID_PUBLIC_KEY = 'BIEZejgefPzGEp_S8yS4UL6RUE5woqR_KRqG-Oo2mGzSMaeUBBa32vDYIP3_CfIXnst3RctIDB-_WWJe_fPVz90'
const VAPID_SUBJECT = 'mailto:bett@example.com'

// Snarky notification messages
const GYM_MESSAGES = [
    "💪 {rival} just crushed the gym. What's your excuse?",
    "While you're on your phone, {rival} is getting gains 🏋️",
    "{rival} hit the gym. You? Still 'planning to go tomorrow'",
    "🔥 {rival} checked off gym. Your ${amount} is slipping away...",
    "Guess who just worked out? Not you. But {rival} did 💀",
]

const CALORIE_MESSAGES = [
    "🔥 {rival} hit their calorie goal. You eating dirt or what?",
    "{rival} is dialed in on nutrition. You still 'winging it'?",
    "Calorie goal: CRUSHED by {rival}. Yours? Cricket sounds 🦗",
    "{rival} tracked their cals like a winner. Be like {rival}.",
    "💪 {rival} met their nutrition goals. Feeling nervous yet?",
]

const WEIGHT_MESSAGES = [
    "📊 {rival} just logged their weight. Are you even tracking?",
    "{rival} knows their numbers. Do you know yours? 🤔",
    "Progress check: {rival} is tracking. You're... hoping?",
    "{rival} stepped on the scale. Accountability hits different.",
]

const GENERIC_MESSAGES = [
    "🚨 ALERT: {rival} is getting ahead of you!",
    "Say goodbye to your ${amount}... {rival} is WINNING",
    "{rival} making moves while you're making excuses 💀",
    "Looks like you're gonna lose ${amount}... {rival} is on fire 🔥",
]

function getRandomMessage(type: string, rivalName: string, betAmount: number): string {
    let messages: string[]
    switch (type) {
        case 'gym': messages = GYM_MESSAGES; break
        case 'calories': messages = CALORIE_MESSAGES; break
        case 'weight': messages = WEIGHT_MESSAGES; break
        default: messages = GENERIC_MESSAGES
    }
    const template = messages[Math.floor(Math.random() * messages.length)]
    return template.replace(/{rival}/g, rivalName).replace(/\${amount}/g, `$${betAmount}`)
}

// Web Push implementation using raw crypto (Deno compatible)
async function sendWebPush(subscription: any, payload: string, vapidPrivateKey: string) {
    const encoder = new TextEncoder()

    // Create JWT for VAPID
    const header = { typ: 'JWT', alg: 'ES256' }
    const now = Math.floor(Date.now() / 1000)
    const claims = {
        aud: new URL(subscription.endpoint).origin,
        exp: now + 86400,
        sub: VAPID_SUBJECT,
    }

    // Base64URL encode
    const b64url = (data: Uint8Array) => btoa(String.fromCharCode(...data))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const headerB64 = b64url(encoder.encode(JSON.stringify(header)))
    const claimsB64 = b64url(encoder.encode(JSON.stringify(claims)))
    const unsignedToken = `${headerB64}.${claimsB64}`

    // Import private key and sign
    const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        privateKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        encoder.encode(unsignedToken)
    )

    const jwt = `${unsignedToken}.${b64url(new Uint8Array(signature))}`

    // Send push request
    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
            'Content-Type': 'application/json',
            'TTL': '86400',
        },
        body: payload,
    })

    return response
}

serve(async (req) => {
    try {
        const { user_id, type, rival_name, bet_amount } = await req.json()

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 })
        }

        // Get Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get user's push subscription
        const { data: subscription, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id)
            .single()

        if (error || !subscription) {
            console.log('No push subscription found for user:', user_id)
            return new Response(JSON.stringify({ error: 'No subscription' }), { status: 404 })
        }

        // Build notification payload
        const message = getRandomMessage(type || 'generic', rival_name || 'Your rival', bet_amount || 0)
        const payload = JSON.stringify({
            title: type === 'gym' ? '🏋️ Rival Alert!' : type === 'calories' ? '🔥 Rival Alert!' : '⚠️ Rival Alert!',
            body: message,
        })

        // Send the push notification
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        }

        const response = await sendWebPush(pushSubscription, payload, vapidPrivateKey)

        if (!response.ok) {
            const text = await response.text()
            console.error('Push failed:', response.status, text)

            // If subscription expired, delete it
            if (response.status === 404 || response.status === 410) {
                await supabase.from('push_subscriptions').delete().eq('id', subscription.id)
            }

            return new Response(JSON.stringify({ error: 'Push failed', status: response.status }), { status: 500 })
        }

        console.log('Push sent successfully to user:', user_id)
        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (err) {
        console.error('Error:', err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
