// LifeLog 서비스 워커: 홈 화면 설치(PWA) 조건을 채우기 위한 최소 구현.
// 기록 데이터는 항상 서버(Supabase)에서 받아야 하므로 응답을 캐시하지 않는다.
// 화면 이동 요청이 네트워크 오류로 실패할 때만 간단한 오프라인 안내를 보여준다.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const OFFLINE_HTML =
  '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>오프라인</title></head><body style="font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f8fafc;color:#334155">' +
  '<p style="text-align:center;line-height:1.7">인터넷에 연결되어 있지 않아요.<br>연결되면 다시 열어 주세요.</p></body></html>';

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return; // 그 외 요청은 브라우저가 그대로 처리
  event.respondWith(
    fetch(request).catch(
      () => new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  );
});

// 푸시 알림: 서버가 보낸 { title, body, url, tag } 를 보여 준다.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeLog', {
      body: data.body || '',
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      tag: data.tag || 'lifelog',
      data: { url: data.url || '/' },
    }),
  );
});

// 알림을 누르면 열려 있는 창으로 이동하거나, 없으면 새로 열어 바로 기록 화면으로 간다.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
