import { defineConfig } from "orval";

const sharedTsconfig = "packages/shared/tsconfig.json";

export default defineConfig({
  iotService: {
    input: "openapi/iot-service.json",
    output: {
      target: "packages/shared/src/sdk/iot-service/client.ts",
      schemas: "packages/shared/src/sdk/iot-service/schemas",
      mode: "split",
      client: "fetch",
      httpClient: "fetch",
      tsconfig: sharedTsconfig,
      override: {
        mutator: {
          path: "packages/shared/src/sdk/http-client.ts",
          name: "httpClient",
        },
      },
    },
  },
});
