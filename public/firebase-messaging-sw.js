import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-sw.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDhIdZvvWiBinhIYz5Z3E1fJn00eRlahTk',
  authDomain: 'bus-system-notification.firebaseapp.com',
  projectId: 'bus-system-notification',
  storageBucket: 'bus-system-notification.firebasestorage.app',
  messagingSenderId: '335430946794',
  appId: '1:335430946794:web:c99c758511332d1ca8ac93',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const DEFAULT_NOTIFICATION_URL = '/';

function resolveTargetUrl(payloadData) {
  if (!payloadData) return DEFAULT_NOTIFICATION_URL;
  const candidate = payloadData.url || payloadData.link || payloadData.click_action || payloadData.clickAction;
  if (typeof candidate !== 'string' || candidate.trim() === '') return DEFAULT_NOTIFICATION_URL;
  return candidate;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

onBackgroundMessage(messaging, (payload) => {
  const targetUrl = resolveTargetUrl(payload.data);
  self.registration.showNotification(payload.notification?.title || 'Thông báo mới', {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: {
      ...(payload.data || {}),
      targetUrl,
    },
  });

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({
        type: 'FCM_BACKGROUND_MESSAGE',
        payload,
      });
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.targetUrl || DEFAULT_NOTIFICATION_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }

      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
