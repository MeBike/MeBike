import { chatRoute } from "./mutations";

export * from "./mutations";

export const aiRoutes = {
  chat: chatRoute,
} as const;
