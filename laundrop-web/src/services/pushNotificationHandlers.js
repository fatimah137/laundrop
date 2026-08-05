/**
 * Service Worker Push Notification Handlers
 * 
 * File ini di-import di main.jsx dan menambahkan push event listeners
 * ke service worker yang sudah di-register oleh Vite PWA plugin
 */

export function setupPushNotificationHandlers() {
  // Setup push event listener
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      console.log('[Push Handler] Service Worker ready, setting up push handlers');

      // Handle push notifications
      if ('onpush' in registration) {
        registration.onpush = handlePush;
      }

      // Handle notification clicks
      if (self.Notification && 'onclick' in self.Notification.prototype) {
        registration.onnotificationclick = handleNotificationClick;
        registration.onnotificationclose = handleNotificationClose;
      }

      console.log('[Push Handler] Push notification handlers configured');
    }).catch(err => {
      console.error('[Push Handler] Service Worker setup failed:', err);
    });
  }
}

/**
 * Handle incoming push notifications
 */
export function handlePush(event) {
  console.log('[Push] Push notification received:', event);

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
      console.log('[Push] Message data:', data);

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
    })
  );
}

/**
 * Handle notification clicks
 */
export function handleNotificationClick(event) {
  console.log('[Push] Notification clicked, action:', event.action);

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
      .then(clientList => {
        // Check if window already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(url) && 'focus' in client) {
            console.log('[Push] Focusing existing window');
            return client.focus();
          }
        }

        // Open new window
        if (self.clients.openWindow) {
          console.log('[Push] Opening new window:', url);
          return self.clients.openWindow(url);
        }
      })
  );
}

/**
 * Handle notification close
 */
export function handleNotificationClose(event) {
  console.log('[Push] Notification closed by user');
}

// Immediately setup handlers when this module loads
if (typeof self !== 'undefined' && 'serviceWorker' in navigator) {
  setupPushNotificationHandlers();
}
