import { log } from "@lib/log";
import { clearPushToken, setPushToken } from "@lib/push-token";
import { useAuthNext } from "@providers/auth-provider-next";
import { userService } from "@services/users/user-service";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PushNotificationsContextValue = {
  expoPushToken: string | null;
  lastNotification: Notifications.Notification | null;
};

const PushNotificationsContext = createContext<PushNotificationsContextValue | undefined>(undefined);

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lightColor: "#FF231F7C",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      enableVibrate: true,
      lightColor: "#FF231F7C",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("silent", {
      name: "Silent",
      importance: Notifications.AndroidImportance.LOW,
      enableVibrate: false,
      sound: null,
    });
  }

  if (!Device.isDevice) {
    log.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    log.warn("Push notification permission not granted");
    return null;
  }

  const projectId
    = Constants?.expoConfig?.extra?.eas?.projectId
      ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    log.error("Push setup failed: missing Expo EAS projectId");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthNext();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  const notificationListenerRef = useRef<Notifications.EventSubscription | null>(null);
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setExpoPushToken(null);
      void clearPushToken();
      return;
    }

    let active = true;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (!active || !token) {
          return;
        }
        setExpoPushToken(token);
        void setPushToken(token);
        log.info("Expo push token acquired", {
          hasToken: true,
          token: __DEV__ ? token : undefined,
        });
      })
      .catch((error) => {
        log.warn("Failed to register for push notifications", error);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !expoPushToken) {
      return;
    }

    let cancelled = false;
    const platform = Platform.OS === "ios"
      ? "IOS"
      : Platform.OS === "android"
        ? "ANDROID"
        : "UNKNOWN";
    const appVersion = Constants.expoConfig?.version ?? null;

    userService.registerPushToken({
      token: expoPushToken,
      platform,
      appVersion,
    }).then((result) => {
      if (cancelled || result.ok) {
        return;
      }
      log.warn("Failed to register push token with backend", result.error);
    }).catch((error) => {
      if (cancelled) {
        return;
      }
      log.warn("Unexpected register push token error", error);
    });

    return () => {
      cancelled = true;
    };
  }, [expoPushToken, isAuthenticated]);

  useEffect(() => {
    notificationListenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
      log.info("Push notification received", {
        title: notification.request.content.title ?? null,
      });
    });

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      log.info("Push notification tapped", {
        actionIdentifier: response.actionIdentifier,
      });
    });

    return () => {
      notificationListenerRef.current?.remove();
      responseListenerRef.current?.remove();
      notificationListenerRef.current = null;
      responseListenerRef.current = null;
    };
  }, []);

  const value = useMemo<PushNotificationsContextValue>(
    () => ({
      expoPushToken,
      lastNotification,
    }),
    [expoPushToken, lastNotification],
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const ctx = useContext(PushNotificationsContext);
  if (!ctx) {
    throw new Error("usePushNotifications must be used inside PushNotificationsProvider");
  }
  return ctx;
}
