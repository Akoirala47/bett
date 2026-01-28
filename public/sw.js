// Service Worker for Web Push Notifications
// This runs in the background and handles push events even when the app is closed

self.addEventListener('push', function (event) {
    console.log('[SW] Push received:', event);

    let data = { title: '🔔 Rival Alert!', body: 'Your rival is making progress!' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'rival-notification',
        requireInteraction: true,
        data: { url: '/dashboard' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes('/dashboard') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/dashboard');
                }
            })
    );
});

self.addEventListener('install', function (event) {
    console.log('[SW] Installing service worker');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[SW] Service worker activated');
    event.waitUntil(clients.claim());
});
