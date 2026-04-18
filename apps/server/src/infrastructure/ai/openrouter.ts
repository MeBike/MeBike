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
  return openrouter.chat(env.AI_MODEL);
}
