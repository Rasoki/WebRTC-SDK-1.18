self.oninstall = e => {
    console.log('service-worker: install', e);
    e.waitUntil(self.skipWaiting());
}

self.onactivate = e => {
    console.log('service-worker: activate', e);
    e.waitUntil(clients.claim());
}

self.onnotificationclose = e => {
    console.log('service-worker: notification close', e);
}

self.onnotificationclick = e => {
    console.log('service-worker: notification click', e);
    let client;
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window' /*,includeUncontrolled: true */})
            .then(clients => {
                console.log('service-worker: matchAll:', clients);
                client = clients[0];
                if (e.action !== 'reject') // accept or undefined 
                    return client.focus();
            })
            .then(() => {
                client.postMessage({ type: 'answer', action: e.action });
            })
    );
}