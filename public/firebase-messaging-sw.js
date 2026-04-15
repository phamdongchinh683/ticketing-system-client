import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-sw.js';



const app = initializeApp({
  apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'],
  authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'],
  projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'],
  storageBucket: import.meta.env['NG_APP_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: import.meta.env['NG_APP_FIREBASE_MESSAGING_SENDER_ID'],
  appId: import.meta.env['NG_APP_FIREBASE_APP_ID'],
});
const messaging = getMessaging(app);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title || 'New notification';
  const body = payload.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    data: payload.data || {},
  });

  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ type: 'FCM_BACKGROUND_MESSAGE', payload });
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/dashboard');
    }),
  );
});
