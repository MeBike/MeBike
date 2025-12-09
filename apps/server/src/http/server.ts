import { serve } from "@hono/node-server";

import { createHttpApp } from "./app";

const port = Number(process.env.PORT ?? 4000);
const app = createHttpApp();

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server listening on http://localhost:${port} (docs at /docs)`);
