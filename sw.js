// sw.js - 나만의 다이어리 PWA 서비스 워커 (오프라인 캐시 및 백그라운드 푸시/알림 관리)
const CACHE_NAME = 'diary-pwa-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/state.js',
  './js/audio.js',
  './js/alarm.js',
  './js/today.js',
  './js/calendar.js',
  './js/diary.js',
  './js/settings.js',
  './js/sync.js',
  './js/app.js',
  './icon-192.png',
  './icon-512.png',
  './favicon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('캐시 추가 일부 실패 (오프라인 모드 기본 동작)', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
    ])
  );
});

// 네트워크 우선, 오프라인 시 캐시 폴백 (외부 CDN 폰트/Firebase 제외)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// 알림 클릭 시 앱 창 활성화 또는 새 창 열기
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'ALARM_CLICKED', title: event.notification.title });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 백그라운드 메시지 수신 (알림 예약 및 즉시 알림)
self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options } = data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, options).catch(err => {
        console.warn('SW 알림 예약 실패:', err);
      });
    }
  }
});
