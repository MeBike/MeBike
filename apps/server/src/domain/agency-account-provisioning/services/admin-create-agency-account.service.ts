import { Effect } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { ProvisionAgencyAccountFromAdminInput } from "../models";

import { makeAgencyAccountProvisionService } from "./agency-account-provision.service";

export function adminCreateAgencyAccountUseCase(
  input: ProvisionAgencyAccountFromAdminInput,
) {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const provisionService = makeAgencyAccountProvisionService(client);
    const result = yield* provisionService.createFromAdmin(input);
    return result.user;
  });
}
