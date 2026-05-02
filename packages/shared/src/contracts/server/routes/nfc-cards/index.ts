import { nfcCardMutations } from "./mutations";
import { nfcCardQueries } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const nfcCardsRoutes = {
  ...nfcCardQueries,
  ...nfcCardMutations,
} as const;
