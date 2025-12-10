import { Effect } from "effect";
import process from "node:process";

import { startHonoServer } from "./bootstrap";

Effect.runPromise(startHonoServer).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
