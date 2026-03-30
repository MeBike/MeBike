import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import type { UserRepo } from "../user.repository.types";

import { makeUserAccountWriteRepository } from "./user-account.write";
import { makeUserAdminWriteRepository } from "./user-admin.write";
import { makeUserStripeWriteRepository } from "./user-stripe.write";

export type UserWriteRepo = Pick<
  UserRepo,
  | "createRegisteredUser"
  | "createUser"
  | "updateProfile"
  | "updateAdminById"
  | "updatePassword"
  | "markVerified"
  | "setStripeConnectedAccountId"
  | "setStripeConnectedAccountIdIfNull"
  | "setStripePayoutsEnabled"
  | "setStripePayoutsEnabledByAccountId"
>;

export function makeUserWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserWriteRepo {
  return {
    ...makeUserAdminWriteRepository(client),
    ...makeUserAccountWriteRepository(client),
    ...makeUserStripeWriteRepository(client),
  };
}
