self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const { title, body, icon, badge, url } = data;

        const options = {
            body: body || "",
            icon: icon || "/favicon.ico",
            badge: badge || "/favicon.ico",
            data: {
                url: url || "/",
            },
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error("Error handling push event:", error);
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            // If no window/tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
