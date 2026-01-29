import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    GYM_NOTIFICATIONS,
    CALORIE_NOTIFICATIONS,
    WEIGHT_NOTIFICATIONS,
    GENERIC_PROGRESS_NOTIFICATIONS,
    formatNotificationMessage,
    getRandomNotification,
    registerServiceWorker,
    subscribeToPush,
    getSubscriptionData,
} from '@/lib/notifications'

describe('Notification Messages', () => {
    describe('Message Libraries', () => {
        it('should have at least 5 gym notifications', () => {
            expect(GYM_NOTIFICATIONS.length).toBeGreaterThanOrEqual(5)
        })

        it('should have at least 5 calorie notifications', () => {
            expect(CALORIE_NOTIFICATIONS.length).toBeGreaterThanOrEqual(5)
        })

        it('should have at least 4 weight notifications', () => {
            expect(WEIGHT_NOTIFICATIONS.length).toBeGreaterThanOrEqual(4)
        })

        it('should have at least 5 generic notifications', () => {
            expect(GENERIC_PROGRESS_NOTIFICATIONS.length).toBeGreaterThanOrEqual(5)
        })

        it('all gym messages should contain {rival} placeholder', () => {
            GYM_NOTIFICATIONS.forEach((msg) => {
                expect(msg).toContain('{rival}')
            })
        })

        it('all calorie messages should contain {rival} placeholder', () => {
            CALORIE_NOTIFICATIONS.forEach((msg) => {
                expect(msg).toContain('{rival}')
            })
        })
    })

    describe('formatNotificationMessage', () => {
        it('should replace {rival} with rival name', () => {
            const template = 'Hey {rival}, you rock!'
            const result = formatNotificationMessage(template, {
                rivalName: 'John',
                betAmount: 50,
            })
            expect(result).toBe('Hey John, you rock!')
        })

        it('should replace ${amount} with formatted bet amount', () => {
            const template = 'You could lose ${amount}!'
            const result = formatNotificationMessage(template, {
                rivalName: 'Jane',
                betAmount: 100,
            })
            expect(result).toBe('You could lose $100!')
        })

        it('should replace both placeholders', () => {
            const template = '{rival} wants your ${amount}!'
            const result = formatNotificationMessage(template, {
                rivalName: 'Alex',
                betAmount: 75,
            })
            expect(result).toBe('Alex wants your $75!')
        })

        it('should handle multiple occurrences of {rival}', () => {
            const template = '{rival} beat {rival}!'
            const result = formatNotificationMessage(template, {
                rivalName: 'Sam',
                betAmount: 25,
            })
            expect(result).toBe('Sam beat Sam!')
        })
    })

    describe('getRandomNotification', () => {
        it('should return a gym notification for type gym', () => {
            const result = getRandomNotification('gym', {
                rivalName: 'Test',
                betAmount: 50,
            })
            expect(result).toContain('Test')
            expect(typeof result).toBe('string')
            expect(result.length).toBeGreaterThan(0)
        })

        it('should return a calorie notification for type calories', () => {
            const result = getRandomNotification('calories', {
                rivalName: 'Test',
                betAmount: 50,
            })
            expect(result).toContain('Test')
        })

        it('should return a weight notification for type weight', () => {
            const result = getRandomNotification('weight', {
                rivalName: 'Test',
                betAmount: 50,
            })
            expect(result).toContain('Test')
        })

        it('should return a generic notification for type generic', () => {
            const result = getRandomNotification('generic', {
                rivalName: 'Test',
                betAmount: 50,
            })
            expect(result).toContain('Test')
        })

        it('should return different messages on multiple calls (randomness)', () => {
            const results = new Set<string>()
            // Call 50 times - should get some variety
            for (let i = 0; i < 50; i++) {
                results.add(
                    getRandomNotification('gym', { rivalName: 'Test', betAmount: 50 })
                )
            }
            // Should have at least 2 different messages
            expect(results.size).toBeGreaterThan(1)
        })
    })
})

describe('Service Worker Registration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should register service worker successfully', async () => {
        const registration = await registerServiceWorker()
        expect(registration).not.toBeNull()
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('should return null if serviceWorker not supported', async () => {
        const originalServiceWorker = navigator.serviceWorker
        Object.defineProperty(navigator, 'serviceWorker', {
            value: undefined,
            writable: true,
        })

        const registration = await registerServiceWorker()
        expect(registration).toBeNull()

        Object.defineProperty(navigator, 'serviceWorker', {
            value: originalServiceWorker,
            writable: true,
        })
    })
})

describe('Push Subscription', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            // Reset Notification permission
            ; (Notification as unknown as { permission: string }).permission = 'default'
    })

    it('should subscribe to push successfully', async () => {
        const mockRegistration = {
            pushManager: {
                getSubscription: vi.fn().mockResolvedValue(null),
                subscribe: vi.fn().mockResolvedValue({
                    endpoint: 'https://test-endpoint',
                    toJSON: () => ({
                        keys: { p256dh: 'test-key', auth: 'test-auth' },
                    }),
                }),
            },
        } as unknown as ServiceWorkerRegistration

        const subscription = await subscribeToPush(mockRegistration)
        expect(subscription).not.toBeNull()
        expect(subscription?.endpoint).toBe('https://test-endpoint')
    })

    it('should return existing subscription if already subscribed', async () => {
        const existingSubscription = {
            endpoint: 'https://existing-endpoint',
            toJSON: () => ({
                keys: { p256dh: 'existing-key', auth: 'existing-auth' },
            }),
        }

        const mockRegistration = {
            pushManager: {
                getSubscription: vi.fn().mockResolvedValue(existingSubscription),
                subscribe: vi.fn(),
            },
        } as unknown as ServiceWorkerRegistration

        const subscription = await subscribeToPush(mockRegistration)
        expect(subscription).toBe(existingSubscription)
        expect(mockRegistration.pushManager.subscribe).not.toHaveBeenCalled()
    })

    it('should return null if permission denied', async () => {
        // Mock permission denial
        vi.mocked(Notification.requestPermission).mockResolvedValueOnce('denied')

        const mockRegistration = {
            pushManager: {
                getSubscription: vi.fn().mockResolvedValue(null),
                subscribe: vi.fn(),
            },
        } as unknown as ServiceWorkerRegistration

        const subscription = await subscribeToPush(mockRegistration)
        expect(subscription).toBeNull()
    })
})

describe('getSubscriptionData', () => {
    it('should extract endpoint and keys from subscription', () => {
        const mockSubscription = {
            endpoint: 'https://push-endpoint.com/abc',
            toJSON: () => ({
                keys: {
                    p256dh: 'public-key-123',
                    auth: 'auth-key-456',
                },
            }),
        } as unknown as PushSubscription

        const data = getSubscriptionData(mockSubscription)
        expect(data.endpoint).toBe('https://push-endpoint.com/abc')
        expect(data.keys.p256dh).toBe('public-key-123')
        expect(data.keys.auth).toBe('auth-key-456')
    })
})
