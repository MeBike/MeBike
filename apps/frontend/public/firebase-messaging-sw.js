// Dùng importScripts để nhúng Firebase bản compat vào Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// COPY cấu hình từ file .env.local của bạn dán thẳng vào đây
const firebaseConfig = {
  apiKey: "AIzaSyA1MJaZaCFQM__pGl3bjeTxzTTddch0wGI",
  authDomain: "uploadimgikoi.firebaseapp.com",
  projectId: "uploadimgikoi",
  storageBucket:"uploadimgikoi.appspot.com",
  messagingSenderId: "709596858545",
  appId: "1:709596858545:web:f74ccfc48ab859a26bfa90",
};

// Khởi tạo app trong Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Lắng nghe thông báo khi user ẨN web (thu nhỏ trình duyệt hoặc sang tab khác)
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Nhận thông báo chạy ngầm: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});