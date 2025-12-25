import { Effect } from "effect";

import { startHonoServer } from "./bootstrap";
import { handleStartupExit } from "./shared/startup-failure";

Effect.runPromiseExit(startHonoServer).then(handleStartupExit);
