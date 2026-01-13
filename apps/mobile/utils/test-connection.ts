import { kyClient } from "@lib/ky-client";
import { log } from "@lib/log";
import { routePath, ServerRoutes } from "@lib/server-routes";

export async function testBackendConnection() {
  try {
    const path = routePath(ServerRoutes.health.health);
    log.debug("Testing backend connection", { path });
    const response = await kyClient.get(path, {
      throwHttpErrors: false,
      timeout: 15000,
      skipAuth: true,
    });
    log.debug("Backend connection status", { status: response.status });
    return response.status === 200;
  }
  catch (error) {
    log.warn("Backend connection failed", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : undefined,
    });
    return false;
  }
}

export async function testLoginEndpoint() {
  try {
    const path = routePath(ServerRoutes.auth.login);
    log.debug("Testing login endpoint", { path });
    const response = await kyClient.post(path, {
      json: {
        email: "test@test.com",
        password: "test123",
      },
      throwHttpErrors: false,
      skipAuth: true,
    });
    log.debug("Login endpoint status", { status: response.status });
    return response.status >= 200 && response.status < 500;
  }
  catch (error) {
    log.warn("Login endpoint failed", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : undefined,
    });
    return false;
  }
}
