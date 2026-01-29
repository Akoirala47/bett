// Test setup file
import '@testing-library/jest-dom'

// Mock Notification API
class MockNotification {
    static permission: NotificationPermission = 'default'
    static requestPermission = vi.fn().mockResolvedValue('granted')

    title: string
    options: NotificationOptions

    constructor(title: string, options?: NotificationOptions) {
        this.title = title
        this.options = options || {}
    }

    close = vi.fn()
    onclick: (() => void) | null = null
}

Object.defineProperty(global, 'Notification', {
    value: MockNotification,
    writable: true,
})

// Mock Service Worker
const mockServiceWorkerRegistration = {
    pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue({
            endpoint: 'https://mock-push-endpoint.com/test',
            toJSON: () => ({
                keys: {
                    p256dh: 'mock-p256dh-key',
                    auth: 'mock-auth-key',
                },
            }),
        }),
    },
}

Object.defineProperty(navigator, 'serviceWorker', {
    value: {
        register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
        ready: Promise.resolve(mockServiceWorkerRegistration),
    },
    writable: true,
})

// Mock fetch for Edge Function calls
global.fetch = vi.fn()
