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
    fullname: row.fullname,
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
