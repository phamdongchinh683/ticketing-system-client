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

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

onBackgroundMessage(messaging, (payload) => {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({
        type: 'FCM_BACKGROUND_MESSAGE',
        payload,
      });
    }
  });
});
