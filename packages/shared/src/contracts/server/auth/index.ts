import type { z } from "zod";

import type { AuthErrorResponseSchema } from "./schemas";

export * from "./models";
export * from "./schemas";

export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
