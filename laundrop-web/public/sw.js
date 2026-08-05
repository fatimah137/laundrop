// This is the service worker for Laundrop
// Handles PWA installation and push notifications

// Import scripts dari workbox (auto-generated oleh vite-pwa)
// ini di-generate saat build, tapi kita tambah custom push handlers

const CACHE_VERSION = 'laundrop-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon-laundrop.png',
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('[Service Worker] Cache add failed:', err);
        // Don't fail installation if cache fails
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Claim all clients
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response; // Serve from cache
      }

      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();
        caches.open(CACHE_VERSION).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline - serve cached version or placeholder
        return caches.match(event.request);
      });
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS - Handle incoming push messages
// ═══════════════════════════════════════════════════════════════

self.addEventListener('push', event => {
  console.log('[Push] Notification received:', event);

  let notificationData = {
    title: 'Notifikasi Laundrop',
    body: 'Anda memiliki notifikasi baru',
    icon: '/favicon-laundrop.png',
    tag: 'laundrop-notification',
    requireInteraction: true,
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
          url: '/dashboard/notifications',
          ...data.data,
        },
      };
    }
  } catch (error) {
    console.error('[Push] Error parsing data:', error);
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      badge: '/favicon-laundrop.png',
      actions: [
        {
          action: 'open',
          title: 'Buka Notifikasi',
        },
        {
          action: 'close',
          title: 'Tutup',
        },
      ],
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[Push] Notification clicked, action:', event.action);

  event.notification.close();

  let url = '/dashboard/notifications';
  if (event.notification.data?.url) {
    url = event.notification.data.url;
  }

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clientList => {
        // Check if window already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            console.log('[Push] Focusing existing window');
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          console.log('[Push] Opening new window:', url);
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[Push] Notification closed by user');
});
