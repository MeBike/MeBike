import type {
  Prisma as PrismaTypes,
  UserRole,
  UserVerifyStatus,
} from "../../../generated/prisma/client";

export type UserRow = {
  readonly id: string;
  readonly fullname: string;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly username: string | null;
  readonly passwordHash: string;
  readonly avatar: string | null;
  readonly location: string | null;
  readonly role: UserRole;
  readonly verify: UserVerifyStatus;
  readonly nfcCardUid: string | null;
  readonly updatedAt: Date;
};

export type CreateUserInput = {
  readonly fullname: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly phoneNumber?: string | null;
  readonly username?: string | null;
  readonly avatar?: string | null;
  readonly location?: string | null;
  readonly role?: UserRole;
  readonly verify?: UserVerifyStatus;
  readonly nfcCardUid?: string | null;
};

export type UpdateUserProfilePatch = Partial<{
  fullname: string;
  phoneNumber: string | null;
  username: string | null;
  avatar: string | null;
  location: string | null;
  role: UserRole;
  verify: UserVerifyStatus;
  nfcCardUid: string | null;
}>;

export type UpdateUserAdminPatch = Partial<{
  fullname: string;
  email: string;
  phoneNumber: string | null;
  username: string | null;
  avatar: string | null;
  location: string | null;
  role: UserRole;
  verify: UserVerifyStatus;
  nfcCardUid: string | null;
}>;

export type UserFilter = {
  readonly fullname?: string;
  readonly email?: string;
  readonly verify?: UserVerifyStatus;
  readonly role?: UserRole;
};

export type UserSortField = "fullname" | "email" | "role" | "verify" | "updatedAt";

export type UserOrderBy = PrismaTypes.UserOrderByWithRelationInput;
