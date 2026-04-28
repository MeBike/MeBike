import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { env } from "@/config/env";

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  headers: {
    ...(env.OPENROUTER_SITE_URL ? { "HTTP-Referer": env.OPENROUTER_SITE_URL } : {}),
    ...(env.OPENROUTER_APP_NAME ? { "X-OpenRouter-Title": env.OPENROUTER_APP_NAME } : {}),
  },
});

export function getOpenRouterChatModel() {
  return openrouter.chat(env.AI_MODEL, {
    provider: {
      ...(env.OPENROUTER_PROVIDER_ORDER.length > 0
        ? { order: env.OPENROUTER_PROVIDER_ORDER }
        : {}),
      ...(env.OPENROUTER_PROVIDER_ONLY.length > 0
        ? { only: env.OPENROUTER_PROVIDER_ONLY }
        : {}),
      ...(env.OPENROUTER_PROVIDER_QUANTIZATIONS.length > 0
        ? { quantizations: env.OPENROUTER_PROVIDER_QUANTIZATIONS }
        : {}),
      allow_fallbacks: env.OPENROUTER_ALLOW_FALLBACKS,
    },
  });
}
