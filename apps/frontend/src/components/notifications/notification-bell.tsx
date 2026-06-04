"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { onMessage, getToken } from "firebase/messaging";
import { getFcmMessaging } from "@/lib/firebase-client";
import { ref, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";

import axios from "axios";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  readBy?: Record<string, boolean>;
}

export function NotificationBell({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. LẮNG NGHE REAL-TIME TỪ FIREBASE DATABASE
    // Giả sử data của bạn lưu ở node: /notifications/staff_alerts
    const notifRef = ref(database, 'notifications');
    
    const unsubscribeDB = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển object từ Firebase thành Array và sort theo thời gian mới nhất
        const parsedNotifs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setNotifications(parsedNotifs);
      } else {
        setNotifications([]);
      }
    });

    // 2. SETUP FCM CHO BACKGROUND NOTIFICATIONS (Giữ nguyên)
    const setupFCM = async () => {
      try {
        const msg = await getFcmMessaging();
        if (!msg) return;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          let reg;
          if ('serviceWorker' in navigator) {
            reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }
          const token = await getToken(msg, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: reg,
          });
          
          if (token) {
            await axios.post("/api/notifications/subscribe", { token, topic: "staff_alerts" });
          }
        }

        // Lưu ý: Không cần update state setNotifications ở đây nữa!
        // Vì khi có thông báo mới, server ghi vào Database -> onValue ở trên sẽ tự động kích hoạt và render lại UI.
        onMessage(msg, (payload) => {
           console.log("FCM nhận được ở foreground:", payload);
           // Bạn có thể trigger một toast notification ở đây nếu muốn.
        });
      } catch (err) {
        console.error("Lỗi setup FCM", err);
      }
    };
    setupFCM();

    // Cleanup listener khi component unmount
    return () => unsubscribeDB();
  }, []);

  const unreadCount = notifications.filter((n) => {
    if (userId) return !n.readBy?.[userId];
    return !n.read;
  }).length;

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Lấy ra các ID chưa đọc của user này
      const unreadNotifs = notifications.filter(n => userId ? !n.readBy?.[userId] : !n.read);
      
      // Tạo một object update nhiều node cùng lúc trên Firebase
      const updates: Record<string, any> = {};
      unreadNotifs.forEach(notif => {
        if (userId) {
          updates[`notifications/${notif.id}/readBy/${userId}`] = true;
        } else {
          updates[`notifications/${notif.id}/read`] = true;
        }
      });

      try {
        // Cập nhật thẳng lên Firebase Database
        // Ngay khi lệnh này chạy xong, các Staff khác đang mở app
        // sẽ không bị ảnh hưởng (mỗi người tự có trạng thái đọc riêng)
        await update(ref(database), updates);
      } catch (err) {
        console.error("Lỗi cập nhật đã đọc", err);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          <span className="text-xs text-muted-foreground">{notifications.length} tin</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Không có thông báo nào.</div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => {
                const isUnread = userId ? !notif.readBy?.[userId] : !notif.read;
                return (
                  <div key={notif.id} className={`flex flex-col gap-1 border-b p-4 last:border-0 ${isUnread ? 'bg-primary/5' : ''}`}>
                    <span className="font-bold text-sm leading-tight">{notif.title}</span>
                    <span className="text-xs text-muted-foreground">{notif.body}</span>
                    <span className="text-[10px] text-muted-foreground/60 mt-1">{formatToVNTime(notif.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}