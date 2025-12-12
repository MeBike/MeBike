import { Data } from "effect";

export class StationNotFound extends Data.TaggedError("StationNotFound")<{
  readonly id: string;
}> {}
