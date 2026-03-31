import { Cause, Data, Effect, Exit, Option } from "effect";
import { describe, expect, it } from "vitest";

import { BikeRepositoryError } from "@/domain/bikes/domain-errors";
import { defectOn } from "@/domain/shared";
import { StationRepositoryError } from "@/domain/stations/errors";

class DomainFailure extends Data.TaggedError("DomainFailure")<{
  readonly message: string;
}> {}

describe("defectOn", () => {
  it("dies on matching repository errors", async () => {
    const result = await Effect.runPromiseExit(
      Effect.fail(new BikeRepositoryError({ operation: "bike.read" })).pipe(
        defectOn(BikeRepositoryError),
      ),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(Cause.isDieType(result.cause)).toBe(true);
      const defect = Cause.dieOption(result.cause);
      expect(Option.isSome(defect)).toBe(true);
      if (Option.isSome(defect)) {
        expect(defect.value).toBeInstanceOf(BikeRepositoryError);
      }
    }
  });

  it("keeps unrelated domain failures typed", async () => {
    const result = await Effect.runPromiseExit(
      Effect.fail(new DomainFailure({ message: "business" })).pipe(
        defectOn(BikeRepositoryError),
      ),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(Cause.isFailType(result.cause)).toBe(true);
      if (Cause.isFailType(result.cause)) {
        expect(result.cause.error).toBeInstanceOf(DomainFailure);
      }
    }
  });

  it("supports multiple constructors", async () => {
    const result = await Effect.runPromiseExit(
      Effect.fail(new StationRepositoryError({ operation: "station.read" })).pipe(
        defectOn(BikeRepositoryError, StationRepositoryError),
      ),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(Cause.isDieType(result.cause)).toBe(true);
      const defect = Cause.dieOption(result.cause);
      expect(Option.isSome(defect)).toBe(true);
      if (Option.isSome(defect)) {
        expect(defect.value).toBeInstanceOf(StationRepositoryError);
      }
    }
  });
});
