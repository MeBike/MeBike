import type { AccessTokenPayload } from "@/domain/auth";
import type { RunPromise } from "@/http/shared/runtime";

declare module "hono" {
  interface ContextVariableMap {
    currentUser?: AccessTokenPayload;
    authFailure?: "forbidden";
    runPromise: RunPromise;
  }
}
