import { tool } from "ai";
import { Cause, Effect, Either, Exit, Match, Option } from "effect";
import { z } from "zod";

import type { ReturnSlotFailure } from "@/domain/rentals";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  getStationByIdOrNull,
  RentalDetailInputSchema,
  rentalToolPage,
  resolveRentalReference,
  StationReferenceSchema,
  toReturnSlotAiDetail,
} from "./customer-tool-helpers";
import {
  CancelReturnSlotToolOutputSchema,
  CreateReturnSlotToolOutputSchema,
  CurrentReturnSlotToolOutputSchema,
  SwitchReturnSlotToolOutputSchema,
} from "./customer-tool-schemas";

const uuidSchema = z.string().uuid();

const ReturnSlotMutationInputSchema = z.object({
  rentalId: z.string().optional(),
  rentalReference: z.enum(["context", "current", "latest", "id"]).default("current"),
  stationId: z.string().optional(),
  stationName: z.string().trim().min(1).optional().describe("User-facing station name when known from current context or prior tool results. Never put raw ids here."),
  stationReference: StationReferenceSchema.default("context"),
});

const CancelReturnSlotInputSchema = z.object({
  rentalId: z.string().optional(),
  rentalReference: z.enum(["context", "current", "latest", "id"]).default("current"),
});

type CreateReturnSlotToolOutput = z.infer<typeof CreateReturnSlotToolOutputSchema>;
type SwitchReturnSlotToolOutput = z.infer<typeof SwitchReturnSlotToolOutputSchema>;
type CancelReturnSlotToolOutput = z.infer<typeof CancelReturnSlotToolOutputSchema>;
type ReturnSlotActionFailure = Extract<CreateReturnSlotToolOutput, { ok: false }>;

function failReturnSlotAction(
  code: ReturnSlotActionFailure["error"]["code"],
  kind: ReturnSlotActionFailure["error"]["kind"],
  retryable: boolean,
  suggestedAction: ReturnSlotActionFailure["error"]["suggestedAction"],
  userMessage: string,
): ReturnSlotActionFailure {
  return {
    ok: false,
    error: {
      code,
      kind,
      retryable,
      suggestedAction,
      userMessage,
    },
  };
}

function invalidRentalIdFailure() {
  return failReturnSlotAction(
    "INVALID_RENTAL_ID",
    "validation",
    false,
    "check_current_rental",
    "Không xác định được mã chuyến thuê hợp lệ để thực hiện thao tác này.",
  );
}

function noActiveRentalFailure() {
  return failReturnSlotAction(
    "NO_ACTIVE_RENTAL",
    "business",
    false,
    "check_current_rental",
    "Bạn chưa có chuyến thuê đang hoạt động để thao tác giữ chỗ trả xe.",
  );
}

function invalidStationIdFailure() {
  return failReturnSlotAction(
    "INVALID_STATION_ID",
    "validation",
    false,
    "choose_station_again",
    "Không xác định được mã trạm hợp lệ để giữ chỗ trả xe.",
  );
}

function missingStationContextFailure() {
  return failReturnSlotAction(
    "MISSING_STATION_CONTEXT",
    "validation",
    false,
    "search_stations",
    "Chưa xác định được trạm để thực hiện thao tác giữ chỗ trả xe.",
  );
}

function mapCreateOrSwitchReturnSlotFailure(
  error: ReturnSlotFailure,
  action: "create" | "switch",
): ReturnSlotActionFailure {
  const isSwitch = action === "switch";

  return Match.value<ReturnSlotFailure>(error).pipe(
    Match.tag("RentalNotFound", () => noActiveRentalFailure()),
    Match.tag("ReturnSlotRequiresActiveRental", () => noActiveRentalFailure()),
    Match.tag("StationNotFound", () =>
      failReturnSlotAction(
        "STATION_NOT_FOUND",
        "business",
        false,
        "choose_station_again",
        isSwitch
          ? "Không tìm thấy trạm mới để đổi giữ chỗ trả xe."
          : "Không tìm thấy trạm này để giữ chỗ trả xe.",
      )),
    Match.tag("ReturnSlotCapacityExceeded", () =>
      failReturnSlotAction(
        "RETURN_CAPACITY_UNAVAILABLE",
        "business",
        true,
        "choose_another_station",
        isSwitch
          ? "Trạm này hiện không còn chỗ trả xe để đổi giữ chỗ."
          : "Trạm này hiện không còn chỗ trả xe để giữ chỗ.",
      )),
    Match.orElse(() =>
      failReturnSlotAction(
        "TEMPORARY_UNAVAILABLE",
        "temporary",
        true,
        "retry_later",
        isSwitch
          ? "Hiện chưa thể đổi giữ chỗ trả xe do lỗi tạm thời của hệ thống."
          : "Hiện chưa thể giữ chỗ trả xe do lỗi tạm thời của hệ thống.",
      )),
  );
}

function mapCancelReturnSlotFailure(error: ReturnSlotFailure): ReturnSlotActionFailure {
  return Match.value<ReturnSlotFailure>(error).pipe(
    Match.tag("RentalNotFound", () => noActiveRentalFailure()),
    Match.tag("ReturnSlotRequiresActiveRental", () => noActiveRentalFailure()),
    Match.tag("ReturnSlotNotFound", () =>
      failReturnSlotAction(
        "RETURN_SLOT_NOT_FOUND",
        "business",
        false,
        "check_current_return_slot",
        "Bạn chưa có giữ chỗ trả xe đang hoạt động để hủy.",
      )),
    Match.orElse(() =>
      failReturnSlotAction(
        "TEMPORARY_UNAVAILABLE",
        "temporary",
        true,
        "retry_later",
        "Hiện chưa thể hủy giữ chỗ trả xe do lỗi tạm thời của hệ thống.",
      )),
  );
}

function validateUuidOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return uuidSchema.safeParse(value).success ? value : null;
}

function resolveActiveRentalEffect(
  args: CreateCustomerToolsArgs,
  input: { rentalId?: string; rentalReference: "context" | "current" | "latest" | "id" },
) {
  return Effect.gen(function* () {
    let rentalId = input.rentalId ?? null;

    if (!rentalId && input.rentalReference === "context") {
      rentalId = args.context?.rentalId ?? null;
    }

    if (!rentalId && input.rentalReference === "current") {
      const rentals = yield* args.rentalService.listMyCurrentRentals(args.userId, {
        ...rentalToolPage,
        pageSize: 1,
      });
      rentalId = rentals.items[0]?.id ?? null;
    }

    if (!rentalId && input.rentalReference === "latest") {
      const rentals = yield* args.rentalService.listMyRentals(args.userId, {}, {
        ...rentalToolPage,
        pageSize: 1,
      });
      rentalId = rentals.items[0]?.id ?? null;
    }

    if (!rentalId) {
      return yield* Effect.fail(noActiveRentalFailure());
    }

    const safeRentalId = validateUuidOrNull(rentalId);

    if (!safeRentalId) {
      return yield* Effect.fail(invalidRentalIdFailure());
    }

    const rental = yield* args.rentalService.getMyRentalById(args.userId, safeRentalId);

    if (Option.isNone(rental) || rental.value.status !== "RENTED") {
      return yield* Effect.fail(noActiveRentalFailure());
    }

    return rental.value;
  });
}

function resolveTargetStationIdEffect(
  args: CreateCustomerToolsArgs,
  input: { stationId?: string; stationReference: "context" | "id" },
) {
  return Effect.gen(function* () {
    const stationId = input.stationId
      ?? (input.stationReference === "context" ? args.context?.stationId ?? null : null);

    if (!stationId) {
      return yield* Effect.fail(missingStationContextFailure());
    }

    const safeStationId = validateUuidOrNull(stationId);

    if (!safeStationId) {
      return yield* Effect.fail(invalidStationIdFailure());
    }

    return safeStationId;
  });
}

async function finishReturnSlotSuccess(
  args: CreateCustomerToolsArgs,
  rentalId: string,
  returnSlot: Parameters<typeof toReturnSlotAiDetail>[0],
): Promise<Extract<CreateReturnSlotToolOutput, { ok: true }>> {
  const station = await getStationByIdOrNull(args.stationQueryService, returnSlot.stationId);

  return {
    ok: true,
    rentalId,
    returnSlot: toReturnSlotAiDetail(
      returnSlot,
      station ? { id: station.id, name: station.name, address: station.address } : null,
    ),
  };
}

export function createCustomerRentalReturnSlotTools(args: CreateCustomerToolsArgs) {
  return {
    getCurrentReturnSlot: tool({
      description: "Get the user's active return-slot reservation for a rental. Prefer current screen context or the current active rental before raw ids.",
      inputSchema: RentalDetailInputSchema,
      outputSchema: CurrentReturnSlotToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof CurrentReturnSlotToolOutputSchema>> => {
        const rental = await resolveRentalReference({
          context: args.context,
          rentalId: input.rentalId,
          reference: input.reference,
          rentalService: args.rentalService,
          userId: args.userId,
        });

        if (!rental) {
          return {
            reference: input.reference,
            hasActiveRental: false,
            rentalId: null,
            returnSlot: null,
          };
        }

        if (rental.status !== "RENTED") {
          return {
            reference: input.reference,
            hasActiveRental: false,
            rentalId: rental.id,
            returnSlot: null,
          };
        }

        const currentReturnSlot = await Effect.runPromise(
          args.rentalCommandService.getCurrentReturnSlot({
            rentalId: rental.id,
            userId: args.userId,
          }).pipe(Effect.either),
        );

        if (Either.isLeft(currentReturnSlot) || Option.isNone(currentReturnSlot.right)) {
          return {
            reference: input.reference,
            hasActiveRental: true,
            rentalId: rental.id,
            returnSlot: null,
          };
        }

        const returnSlot = currentReturnSlot.right.value;
        const station = await getStationByIdOrNull(args.stationQueryService, returnSlot.stationId);

        return {
          reference: input.reference,
          hasActiveRental: true,
          rentalId: rental.id,
          returnSlot: toReturnSlotAiDetail(
            returnSlot,
            station ? { id: station.id, name: station.name, address: station.address } : null,
          ),
        };
      },
    }),
    createReturnSlot: tool({
      description: "Reserve return capacity for the user's active rental at a station. Use this only when the user clearly asks you to do it.",
      inputSchema: ReturnSlotMutationInputSchema,
      outputSchema: CreateReturnSlotToolOutputSchema,
      needsApproval: true,
      execute: async (input): Promise<CreateReturnSlotToolOutput> => {
        const exit = await Effect.runPromiseExit(Effect.gen(function* () {
          const rental = yield* resolveActiveRentalEffect(args, input);
          const stationId = yield* resolveTargetStationIdEffect(args, input);
          const returnSlot = yield* args.rentalCommandService.createReturnSlot({
            rentalId: rental.id,
            stationId,
            userId: args.userId,
          }).pipe(
            Effect.mapError(error => mapCreateOrSwitchReturnSlotFailure(error, "create")),
          );

          return { rentalId: rental.id, returnSlot };
        }));

        if (Exit.isSuccess(exit)) {
          return finishReturnSlotSuccess(args, exit.value.rentalId, exit.value.returnSlot);
        }

        if (Cause.isFailType(exit.cause)) {
          return exit.cause.error;
        }

        throw new Error("Không thể giữ chỗ trả xe do lỗi hệ thống ngoài dự kiến.");
      },
    }),
    switchReturnSlot: tool({
      description: "Switch the user's existing return slot to a different station. Use this only when the user clearly asks to change the reserved return station.",
      inputSchema: ReturnSlotMutationInputSchema,
      outputSchema: SwitchReturnSlotToolOutputSchema,
      needsApproval: true,
      execute: async (input): Promise<SwitchReturnSlotToolOutput> => {
        const exit = await Effect.runPromiseExit(Effect.gen(function* () {
          const rental = yield* resolveActiveRentalEffect(args, input);
          const stationId = yield* resolveTargetStationIdEffect(args, input);
          const returnSlot = yield* args.rentalCommandService.createReturnSlot({
            rentalId: rental.id,
            stationId,
            userId: args.userId,
          }).pipe(
            Effect.mapError(error => mapCreateOrSwitchReturnSlotFailure(error, "switch")),
          );

          return { rentalId: rental.id, returnSlot };
        }));

        if (Exit.isSuccess(exit)) {
          return finishReturnSlotSuccess(args, exit.value.rentalId, exit.value.returnSlot);
        }

        if (Cause.isFailType(exit.cause)) {
          return exit.cause.error;
        }

        throw new Error("Không thể đổi giữ chỗ trả xe do lỗi hệ thống ngoài dự kiến.");
      },
    }),
    cancelReturnSlot: tool({
      description: "Cancel the user's current return slot for an active rental. Use this only when the user clearly asks to cancel the reserved return slot.",
      inputSchema: CancelReturnSlotInputSchema,
      outputSchema: CancelReturnSlotToolOutputSchema,
      needsApproval: true,
      execute: async (input): Promise<CancelReturnSlotToolOutput> => {
        const exit = await Effect.runPromiseExit(Effect.gen(function* () {
          const rental = yield* resolveActiveRentalEffect(args, input);
          const cancelled = yield* args.rentalCommandService.cancelReturnSlot({
            rentalId: rental.id,
            userId: args.userId,
          }).pipe(
            Effect.mapError(mapCancelReturnSlotFailure),
          );

          return { rentalId: rental.id, returnSlot: cancelled };
        }));

        if (Exit.isSuccess(exit)) {
          return finishReturnSlotSuccess(args, exit.value.rentalId, exit.value.returnSlot);
        }

        if (Cause.isFailType(exit.cause)) {
          return exit.cause.error;
        }

        throw new Error("Không thể hủy giữ chỗ trả xe do lỗi hệ thống ngoài dự kiến.");
      },
    }),
  } as const;
}
