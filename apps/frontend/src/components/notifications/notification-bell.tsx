"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { onMessage, getToken } from "firebase/messaging";
import { getFcmMessaging } from "@/lib/firebase-client";
import axios from "axios";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Kéo lịch sử từ API (Realtime Database)
    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/notifications");
        if (Array.isArray(res.data)) setNotifications(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();

    // Setup Firebase Messaging (Realtime Popup)
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

        onMessage(msg, (payload) => {
          const newNotif = {
            id: Date.now().toString(),
            title: payload.notification?.title || "Thông báo",
            body: payload.notification?.body || "",
            timestamp: new Date().toISOString(),
            read: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        });
      } catch (err) {
        console.error("Lỗi setup FCM", err);
      }
    };
    setupFCM();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      try {
        await axios.put("/api/notifications");
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
              {notifications.map((notif) => (
                <div key={notif.id} className={`flex flex-col gap-1 border-b p-4 last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}>
                  <span className="font-bold text-sm leading-tight">{notif.title}</span>
                  <span className="text-xs text-muted-foreground">{notif.body}</span>
                  <span className="text-[10px] text-muted-foreground/60 mt-1">{formatToVNTime(notif.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}