self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Plant Care', {
      body:  data.body  ?? '',
      icon:  data.icon  ?? '/icon.png',
      badge: data.badge ?? '/icon.png',
      data:  data.url   ?? '/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // #370: tell the foregrounded PWA to refresh its activity feed so the
          // tapped entry is visible without a manual close/reopen.
          client.postMessage({ type: 'notification-tapped' });
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data ?? '/');
    })
  );
});
