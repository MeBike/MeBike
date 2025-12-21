import type { AccessTokenPayload } from "@/domain/auth";

declare module "hono" {
  interface ContextVariableMap {
    currentUser?: AccessTokenPayload;
    authFailure?: "forbidden";
  }
}
