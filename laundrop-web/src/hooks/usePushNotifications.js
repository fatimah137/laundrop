import { useEffect, useCallback, useState } from 'react';
import api from '../services/api';

/**
 * Hook untuk subscribe browser ke Web Push Notifications
 * Digunakan untuk employees agar menerima push notification browser
 * 
 * Features:
 * - Request notification permission
 * - Subscribe ke push notifications via service worker
 * - Register subscription endpoint ke backend API
 * - Handle permission denial gracefully
 * - Auto-cleanup saat unmount
 */
export const usePushNotifications = (userId) => {
  const VAPID_PUBLIC_KEY = 'FNqihYQ15H0CQ2GfI5N0SSTNuChki584eO1qrj57jF6e7eQSP2lKozN7lIKz7DRGPAXkySIG34e-YQDKhs4eslU';
  const STORAGE_KEY = `push_subscribed_${userId}`;
  
  // State untuk track permission dan subscription status
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribeToPushNotifications = useCallback(async () => {
    try {
      // 1. Check if browser supports Push Notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push Notifications tidak didukung browser ini');
        return false;
      }

      // 2. Wait untuk service worker ready
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready untuk push notifications');

      // 3. Request notification permission dari user
      if (permission === 'default') {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission !== 'granted') {
          console.warn('⚠️  User menolak notification permission');
          return false;
        }
      } else if (permission !== 'granted') {
        console.warn('⚠️  Notification permission sudah ditolak sebelumnya');
        return false;
      }

      // 4. Subscribe ke Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('✅ Browser subscribed ke push notifications');

      // 5. Extract subscription details
      const subscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth_key: arrayBufferToBase64(subscription.getKey('auth')),
      };

      // 6. Register subscription ke backend API
      await api.post('/push/subscribe', subscriptionData);
      console.log('✅ Subscription registered ke backend');

      // 7. Mark as subscribed
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsSubscribed(true);

      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      return false;
    }
  }, [userId, STORAGE_KEY, permission]);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.warn('No subscription found');
        return false;
      }

      // Unsubscribe dari browser
      await subscription.unsubscribe();

      // Notify backend
      await api.delete('/push/unsubscribe', {
        data: {
          endpoint: subscription.endpoint,
        },
      });

      // Clean up localStorage
      localStorage.removeItem(STORAGE_KEY);
      setIsSubscribed(false);

      console.log('✅ Unsubscribed dari push notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
      return false;
    }
  }, [STORAGE_KEY]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notification API not supported');
      return 'unsupported';
    }

    if (permission === 'granted') {
      return 'granted';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [permission]);

  // Auto-subscribe saat component mount (hanya jika belum subscribe)
  useEffect(() => {
    if (!userId) return;

    // Jangan subscribe lagi jika sudah pernah subscribe
    const alreadySubscribed = localStorage.getItem(STORAGE_KEY);
    if (alreadySubscribed === 'true') {
      console.log('✅ Sudah subscribed ke push notifications sebelumnya');
      setIsSubscribed(true);
      return;
    }

    // Auto-request dan subscribe jika ini pertama kali
    const autoSubscribe = async () => {
      console.log('🔄 Auto-subscribing to push notifications...');
      await requestPermission();
      // Subscribe akan dipicu di useEffect berikutnya setelah permission berubah
    };

    autoSubscribe();
  }, [userId, STORAGE_KEY]);

  // Subscribe setelah permission granted
  useEffect(() => {
    if (!userId || isSubscribed) return;
    if (permission !== 'granted') return;

    const alreadySubscribed = localStorage.getItem(STORAGE_KEY);
    if (alreadySubscribed === 'true') return;

    console.log('📤 Permission granted, subscribing to push...');
    subscribeToPushNotifications();
  }, [permission, userId, STORAGE_KEY, isSubscribed, subscribeToPushNotifications]);

  return {
    subscribe: subscribeToPushNotifications,
    unsubscribe: unsubscribeFromPushNotifications,
    requestPermission,
    permission,
    isSubscribed,
  };
};

/**
 * Helper: Convert base64 string to Uint8Array untuk VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Helper: Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
