// Snarky notification messages when rival makes progress
// These are designed to be competitive, mean, and emotion-jerking

export interface RivalNotificationConfig {
    rivalName: string
    betAmount: number
}

// Gym completion messages - when rival checks off gym
export const GYM_NOTIFICATIONS = [
    "💪 {rival} just crushed the gym. What's your excuse?",
    "While you're on your phone, {rival} is getting gains 🏋️",
    "{rival} hit the gym. You? Still 'planning to go tomorrow'",
    "🔥 {rival} checked off gym. Your ${amount} is slipping away...",
    "Guess who just worked out? Not you. But {rival} did 💀",
    "{rival} is outworking you RIGHT NOW. Feel that?",
    "Another gym session for {rival}. Another L for you 📉",
    "{rival} grinding while you're scrolling. Classic.",
    "🚨 {rival} completed their workout. You're falling behind!",
    "{rival} just put in the work. You putting in excuses?",
    "Tick tock... {rival} is at the gym. Where are you?",
    "{rival} is one step closer to YOUR ${amount} 💸",
]

// Calorie goal messages - when rival hits their calorie target
export const CALORIE_NOTIFICATIONS = [
    "🔥 {rival} hit their calorie goal. You eating dirt or what?",
    "{rival} is dialed in on nutrition. You still 'winging it'?",
    "Calorie goal: CRUSHED by {rival}. Yours? Cricket sounds 🦗",
    "{rival} tracked their cals like a winner. Be like {rival}.",
    "💪 {rival} met their nutrition goals. Feeling nervous yet?",
    "While you're guessing, {rival} is KNOWING. Calories logged!",
    "{rival} just locked in their macros. Your ${amount} thanks them 😤",
    "Another day, another calorie goal hit by {rival}. You? 👀",
    "🍽️ {rival} crushed calories today. Step it up or step aside.",
    "{rival} is eating for results. You're eating for... fun?",
    "Discipline. That's what {rival} has. Calories: DONE ✅",
    "{rival} nailed nutrition. Your bet's looking shakier by the day 📉",
]

// Weight logged messages - when rival logs their weight
export const WEIGHT_NOTIFICATIONS = [
    "📊 {rival} just logged their weight. Are you even tracking?",
    "{rival} knows their numbers. Do you know yours? 🤔",
    "Progress check: {rival} is tracking. You're... hoping?",
    "{rival} stepped on the scale. Accountability hits different.",
    "⚖️ {rival} logged weight. That's what winners do.",
    "{rival} is monitoring progress. You winging it still?",
    "Data \u003e feelings. {rival} knows this. Weight logged!",
    "{rival} tracking their journey. You just along for the ride?",
]

// Generic progress messages - can be used for any action
export const GENERIC_PROGRESS_NOTIFICATIONS = [
    "🚨 ALERT: {rival} is getting ahead of you!",
    "Say goodbye to your ${amount}... {rival} is WINNING",
    "{rival} making moves while you're making excuses 💀",
    "Your ${amount} is looking real comfy in {rival}'s pocket rn",
    "⚠️ {rival} just logged progress. You're getting left behind!",
    "Looks like you're gonna lose ${amount}... {rival} is on fire 🔥",
    "{rival} is putting in WORK. Your money's at stake!",
    "Another point for {rival}. That ${amount} getting nervous?",
    "🏃 {rival} making progress. You standing still.",
    "{rival} is winning. Just thought you should know 😈",
    "That ${amount} bet? {rival} wants it BAD.",
    "While you sleep, {rival} executes. Check the scoreboard 📊",
]

// Format a message with rival name and bet amount
export function formatNotificationMessage(
    template: string,
    config: RivalNotificationConfig
): string {
    return template
        .replace(/{rival}/g, config.rivalName)
        .replace(/\${amount}/g, `$${config.betAmount}`)
}

// Get a random notification for a specific action type
export function getRandomNotification(
    type: 'gym' | 'calories' | 'weight' | 'generic',
    config: RivalNotificationConfig
): string {
    let messages: string[]

    switch (type) {
        case 'gym':
            messages = GYM_NOTIFICATIONS
            break
        case 'calories':
            messages = CALORIE_NOTIFICATIONS
            break
        case 'weight':
            messages = WEIGHT_NOTIFICATIONS
            break
        case 'generic':
        default:
            messages = GENERIC_PROGRESS_NOTIFICATIONS
    }

    const template = messages[Math.floor(Math.random() * messages.length)]
    return formatNotificationMessage(template, config)
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

// Show a browser notification
export function showRivalNotification(
    type: 'gym' | 'calories' | 'weight' | 'generic',
    config: RivalNotificationConfig
): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return
    }

    const message = getRandomNotification(type, config)

    // Get appropriate title based on type
    const titles: Record<string, string> = {
        gym: '🏋️ Rival Alert!',
        calories: '🔥 Rival Alert!',
        weight: '⚖️ Rival Tracking!',
        generic: '⚠️ You\'re Falling Behind!'
    }

    const notification = new Notification(titles[type] || '⚠️ Rival Alert!', {
        body: message,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `rival-${type}-${Date.now()}`,
        requireInteraction: true
    })

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000)

    // Focus app when notification is clicked
    notification.onclick = () => {
        window.focus()
        notification.close()
    }
}
