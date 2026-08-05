/// <reference lib="webworker" />
/// <reference types="vite/client" />

/**
 * Custom Service Worker for Laundrop
 * Includes:
 * - Push notification handlers
 * - Notification click handling
 * - Workbox will inject precache manifest
 */

// Workbox will inject precache manifest here
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: any[];
};

// Placeholder for Workbox manifest injection (required by vite-plugin-pwa)
const precacheManifest = self.__WB_MANIFEST || [];

console.log('[Service Worker] Laundrop service worker loading...');
console.log('[Service Worker] Precache manifest:', precacheManifest);

// ═════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Handle incoming push notifications
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('[Push] Notification received:', event);

  let notificationData: any = {
    title: 'Notifikasi Laundrop',
    body: 'Anda memiliki notifikasi baru',
    icon: '/favicon-laundrop.png',
    tag: 'laundrop-notification',
    requireInteraction: true,
    badge: '/favicon-laundrop.png',
  };

  try {
    if (event.data) {
      const data = event.data.json();
      console.log('[Push] Data:', data);

      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: {
          url: '/employee/notifications',
          ...data.data,
        },
      };
    }
  } catch (error) {
    console.error('[Push] Error parsing push data:', error);
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      badge: notificationData.badge,
    })
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[Push] Notification clicked');

  event.notification.close();

  let url = '/employee/notifications';
  if (event.notification.data?.url) {
    url = event.notification.data.url;
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if any window is already on this URL
        for (const client of clientList) {
          const clientUrl = client.url || '';
          if (clientUrl.includes('/employee/') && 'focus' in client) {
            console.log('[Push] Focusing existing employee window');
            return (client as WindowClient).focus();
          }
        }

        // Otherwise open new window to notifications page
        if (self.clients.openWindow) {
          const fullUrl = new URL(url, self.location.origin).toString();
          console.log('[Push] Opening new window:', fullUrl);
          return self.clients.openWindow(fullUrl);
        }

        return null;
      })
  );
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('[Push] Notification closed by user');
});

/**
 * Handle messages from client
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Install event
 */
self.addEventListener('install', () => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

/**
 * Activate event
 */
self.addEventListener('activate', () => {
  console.log('[Service Worker] Activating...');
  self.clients.claim();
});

console.log('[Service Worker] Laundrop service worker loaded ✅');
