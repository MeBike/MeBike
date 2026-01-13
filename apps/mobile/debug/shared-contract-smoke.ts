import { log } from "@lib/log";

export async function runSharedContractsSmokeTest() {
  try {
    const shared = await import("@mebike/shared");
    const meRoute = shared.serverRoutes.users.me;
    const mePath = typeof (meRoute as any).getRoutingPath === "function"
      ? (meRoute as any).getRoutingPath()
      : (meRoute as any).path;

    log.warn("Shared contracts smoke OK", {
      hasServerRoutes: Boolean(shared.serverRoutes),
      mePath: typeof mePath === "string" ? mePath : undefined,
    });

    const meSchema = shared.UsersContracts?.MeResponseSchema;
    if (meSchema && typeof meSchema === "object" && "safeParse" in meSchema) {
      const meParsed = (meSchema as { safeParse: (v: unknown) => unknown }).safeParse({});
      log.warn("Shared contracts schema smoke OK", {
        meResponseSafeParseType: typeof meParsed,
      });
    }
    else {
      log.warn("Shared contracts schema smoke SKIPPED", {
        reason: "UsersContracts.MeResponseSchema not found",
      });
    }
  }
  catch (error) {
    log.warn("Shared contracts smoke FAILED", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : undefined,
    });
  }
}
