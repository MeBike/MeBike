import type { Effect } from "effect/Effect";
import type { Layer } from "effect/Layer";
import type * as ManagedRuntime from "effect/ManagedRuntime";

import type { HttpDepsLive } from "./providers";

export type HttpRuntimeEnv = typeof HttpDepsLive extends Layer<
  infer ROut,
  infer _E,
  infer _RIn
>
  ? ROut
  : never;

export type HttpRuntimeError = typeof HttpDepsLive extends Layer<
  infer _ROut,
  infer E,
  infer _RIn
>
  ? E
  : never;

export type HttpRuntime = ManagedRuntime.ManagedRuntime<HttpRuntimeEnv, HttpRuntimeError>;
export type RunPromise = <A, E>(effect: Effect<A, E, HttpRuntimeEnv>) => Promise<A>;
