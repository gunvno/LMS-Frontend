/* global firebase */
/* Firebase compat scripts are pinned to the same version as package.json. */
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

function readPayloadData(notificationData) {
  const fcmData = notificationData && notificationData.FCM_MSG;
  return (fcmData && fcmData.data) || notificationData || {};
}

function readInternalTarget(data) {
  let candidate = data.url || data.path || data.link || "";
  if (!candidate && data.data) {
    try {
      const nested = JSON.parse(data.data);
      candidate = nested.url || nested.path || nested.link || "";
    } catch {
      // The notice data field may be plain text; it is not a navigation target.
    }
  }

  try {
    const url = new URL(candidate || "/notifications", self.location.origin);
    if (url.origin !== self.location.origin) return "/notifications";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/notifications";
  }
}

// Register before Firebase Messaging so every click is constrained to this origin.
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const targetPath = readInternalTarget(readPayloadData(event.notification.data));
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(targetUrl);
      return existing.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Notification payloads are displayed automatically by the Firebase SDK.
  if (payload.notification) return;

  const title = payload.data?.title || "Bạn có thông báo mới";
  const body = payload.data?.body || payload.data?.content || "Mở EduFlow để xem chi tiết.";
  return self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    data: payload.data || {},
  });
});
