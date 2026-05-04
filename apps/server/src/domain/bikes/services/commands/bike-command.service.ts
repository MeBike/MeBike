import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import type { BikeRepo } from "../../repository/bike.repository";
import type { BikeCommandService } from "./bike-command.service.types";

import {
  BikeNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import { createBikeWithGuards } from "./bike-command.create";
import { getScopedStatusTransitions } from "./bike-command.helpers";
import { adminUpdateBikeWithGuards } from "./bike-command.update";

type BikeCommandServiceDeps = {
  repo: Pick<BikeRepo, "getById" | "transitionStatusInStationAt">;
  client: PrismaClient;
};

/**
 * Service command-side của bike domain.
 *
 * Giữ các flow ghi và rule chuyển trạng thái ở đây, còn các thao tác đọc như
 * list/detail được tách sang `BikeQueryService`.
 */
export function makeBikeCommandService({
  repo,
  client,
}: BikeCommandServiceDeps): BikeCommandService {
  return {
    createBike: input => createBikeWithGuards(client, input),

    adminUpdateBike: (bikeId, patch) =>
      adminUpdateBikeWithGuards(client, bikeId, patch),

    updateBikeStatusInStationScope: (bikeId, input) =>
      Effect.gen(function* () {
        const current = yield* repo.getById(bikeId);

        // Operator bị scope theo station chỉ được mutate xe vẫn còn thuộc đúng
        // station của họ ở thời điểm kiểm tra hiện tại.
        if (Option.isNone(current) || current.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        const allowed = getScopedStatusTransitions(current.value.status);
        if (!allowed.includes(input.status)) {
          return yield* Effect.fail(new InvalidBikeStatus({
            status: input.status,
            allowed,
          }));
        }

        const updated = yield* repo.transitionStatusInStationAt(
          bikeId,
          input.stationId,
          current.value.status,
          input.status,
          new Date(),
        );

        if (Option.isSome(updated)) {
          return updated.value;
        }

        // Nếu transition miss sau precheck thì thường state đã đổi giữa bước đọc
        // và bước ghi. Đọc lại một lần để phân biệt xe đã rời scope / biến mất với
        // trường hợp status vừa đổi nên tập transition hợp lệ cũng đổi theo.
        const latest = yield* repo.getById(bikeId);
        if (Option.isNone(latest) || latest.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        return yield* Effect.fail(new InvalidBikeStatus({
          status: input.status,
          allowed: getScopedStatusTransitions(latest.value.status),
        }));
      }),

  };
}
