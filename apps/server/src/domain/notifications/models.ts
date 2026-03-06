export type PushTokenPlatform = "ANDROID" | "IOS" | "UNKNOWN";

export type PushTokenRow = {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly platform: PushTokenPlatform;
  readonly deviceId: string | null;
  readonly appVersion: string | null;
  readonly isActive: boolean;
  readonly lastSeenAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RegisterPushTokenInput = {
  readonly userId: string;
  readonly token: string;
  readonly platform?: PushTokenPlatform;
  readonly deviceId?: string | null;
  readonly appVersion?: string | null;
};
