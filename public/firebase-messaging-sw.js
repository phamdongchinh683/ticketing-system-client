import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-sw.js';



const app = initializeApp({
  apiKey: 'BCWcScHeHyFHG27lpAdlQI3xna9oVsfyB3d09rb0rD5OLWV5dFG4Pkwlx5cBAXb2uprWGjAz88ePvkDlIC5Np3Y',
  authDomain: 'bus-system-notification.firebaseapp.com',
  projectId: 'bus-system-notification',
  storageBucket: 'bus-system-notification.firebasestorage.app',
  messagingSenderId: '335430946794',
  appId: '1:335430946794:web:c99c758511332d1ca8ac93',
});
const messaging = getMessaging(app);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

onBackgroundMessage(messaging, (payload) => {

  self.registration.showNotification(payload.notification.title, {
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
