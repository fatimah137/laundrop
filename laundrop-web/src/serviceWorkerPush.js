/**
 * Service Worker Push Event Handler
 * Menampilkan browser notification saat push message diterima
 * 
 * Place ini di file terpisah yang di-import oleh main.jsx
 * atau di-setup oleh vite-pwa plugin
 */

// Handle incoming push notifications
self.addEventListener('push', event => {
  console.log('📬 Push notification diterima:', event);

  let notificationData = {
    title: 'Notifikasi Laundrop',
    body: 'Anda memiliki notifikasi baru',
    icon: '/favicon-laundrop.png',
    badge: '/badge-icon.png',
    tag: 'laundrop-notification', // Prevent duplicate notifications
    requireInteraction: true, // Keep notification until user dismisses
  };

  // Parse push event data
  try {
    if (event.data) {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: {
          url: '/dashboard/notifications', // URL saat notification diklik
          ...data.data,
        },
      };
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      // Actions (optional, untuk interactive notifications)
      actions: [
        {
          action: 'open',
          title: 'Buka',
          icon: '/open-icon.png',
        },
        {
          action: 'close',
          title: 'Tutup',
          icon: '/close-icon.png',
        },
      ],
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  // Tentukan URL tujuan berdasarkan action
  let url = '/dashboard/notifications';
  
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }

  // Jika aksi 'close', jangan buka apa-apa
  if (event.action === 'close') {
    return;
  }

  // Buka atau fokus window dengan URL tujuan
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clientList => {
        // Cek apakah sudah ada window terbuka
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Jika tidak ada, buka window baru
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('❌ Notification closed by user:', event);
  // Optional: track notification dismissals
});
