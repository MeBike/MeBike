import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { NfcCardStatus } from "generated/prisma/client";

export class NfcCardRepositoryError extends Data.TaggedError("NfcCardRepositoryError")<
  WithGenericError
> {}

export class DuplicateNfcCardUid extends Data.TaggedError("DuplicateNfcCardUid")<{
  readonly uid: string;
}> {}

export class NfcCardNotFound extends Data.TaggedError("NfcCardNotFound")<{
  readonly nfcCardId: string;
}> {}

export class NfcCardAlreadyAssigned extends Data.TaggedError("NfcCardAlreadyAssigned")<{
  readonly nfcCardId: string;
  readonly assignedUserId: string;
}> {}

export class UserAlreadyHasNfcCard extends Data.TaggedError("UserAlreadyHasNfcCard")<{
  readonly userId: string;
  readonly nfcCardId: string;
}> {}

export class NfcCardAssigneeNotFound extends Data.TaggedError("NfcCardAssigneeNotFound")<{
  readonly userId: string;
}> {}

export class NfcCardUserNotEligible extends Data.TaggedError("NfcCardUserNotEligible")<{
  readonly userId: string;
  readonly reason: "UNVERIFIED" | "BANNED";
}> {}

export class NfcCardInvalidState extends Data.TaggedError("NfcCardInvalidState")<{
  readonly nfcCardId: string;
  readonly status: NfcCardStatus;
  readonly message: string;
}> {}
