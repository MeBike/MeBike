export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function mapUserDetail(
  row: import("@/domain/users").UserRow,
): import("@mebike/shared").UsersContracts.UserDetail {
  return {
    id: row.id,
    fullName: row.fullname,
    email: row.email,
    verify: row.verify,
    location: row.location,
    username: row.username,
    phoneNumber: row.phoneNumber,
    avatar: row.avatar,
    role: row.role,
    nfcCardUid: row.nfcCardUid,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function maskPushToken(token: string): string {
  if (token.length <= 10) {
    return "**********";
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function mapPushTokenSummary(
  row: import("@/domain/notifications").PushTokenRow,
): import("@mebike/shared").UsersContracts.PushTokenSummary {
  return {
    id: row.id,
    platform: row.platform,
    deviceId: row.deviceId,
    appVersion: row.appVersion,
    isActive: row.isActive,
    maskedToken: maskPushToken(row.token),
    lastSeenAt: row.lastSeenAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
